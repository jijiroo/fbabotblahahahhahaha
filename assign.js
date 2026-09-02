const {
  ChannelType,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  ActionRowBuilder,
} = require('discord.js');
const store = require('../store');
const { sendOnboardingChecklist } = require('./onboarding');

function sanitizeChannelName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 90);
}

async function handleAssignCommand(message, creatorKey) {
  if (!creatorKey) {
    return message.reply('Usage: `!assign FBA ID - Creator Name`');
  }

  const channelName = sanitizeChannelName(creatorKey);

  let channel;
  try {
    channel = await message.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: message.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });
  } catch (err) {
    console.error(err);
    return message.reply('Something went wrong creating the private channel. Check my Manage Channels permission.');
  }

  store.upsertCreator(creatorKey, { channelId: channel.id, roleIds: [] });

  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId(`assign_roles:${encodeURIComponent(creatorKey)}`)
    .setPlaceholder('Select roles that can view this channel')
    .setMinValues(1)
    .setMaxValues(10);

  const row = new ActionRowBuilder().addComponents(roleSelect);

  await message.reply({
    content: `Created ${channel}. Which roles should be able to see this channel?`,
    components: [row],
  });
}

async function handleRoleSelectSubmit(interaction, creatorKey) {
  const selectedRoles = interaction.roles;
  const creator = store.getCreator(creatorKey);

  if (!creator) {
    return interaction.reply({
      content: 'I lost track of this creator record. Please re-run !assign.',
      ephemeral: true,
    });
  }

  const channel = interaction.guild.channels.cache.get(creator.channelId);
  if (!channel) {
    return interaction.reply({ content: 'The channel for this creator no longer exists.', ephemeral: true });
  }

  // Grant access to selected roles
  for (const [, role] of selectedRoles) {
    await channel.permissionOverwrites.edit(role.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });
  }

  // Category placement: if a selected role's name matches an existing category, use it.
  // Otherwise create a new category named after the first selected role.
  // Customize this matching logic if you want a stricter mapping (e.g. only "manager" roles).
  let category = null;
  for (const [, role] of selectedRoles) {
    const match = interaction.guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === role.name.toLowerCase()
    );
    if (match) {
      category = match;
      break;
    }
  }

  if (!category) {
    const firstRole = selectedRoles.first();
    category = await interaction.guild.channels.create({
      name: firstRole.name,
      type: ChannelType.GuildCategory,
    });
  }

  await channel.setParent(category.id, { lockPermissions: false });

  const roleIds = [...selectedRoles.values()].map(r => r.id);
  store.upsertCreator(creatorKey, { roleIds, categoryId: category.id });

  await interaction.update({
    content: `Access granted to ${[...selectedRoles.values()].map(r => r.toString()).join(', ')}. Channel moved to category **${category.name}**.`,
    components: [],
  });

  await sendOnboardingChecklist(interaction.guild, creatorKey);
}

module.exports = { handleAssignCommand, handleRoleSelectSubmit, sanitizeChannelName };
