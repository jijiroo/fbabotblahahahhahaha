const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-channel')
    .setDescription('Create a new channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the new channel')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of channel')
        .setRequired(true)
        .addChoices(
          { name: 'Text', value: 'text' },
          { name: 'Voice', value: 'voice' },
        ))
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Name of an existing category to place it under (optional)')
        .setRequired(false)),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const type = interaction.options.getString('type');
    const categoryName = interaction.options.getString('category');

    let parent = null;
    if (categoryName) {
      parent = interaction.guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory &&
             c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (!parent) {
        return interaction.reply({
          content: `I couldn't find a category named "${categoryName}". The channel was not created.`,
          ephemeral: true,
        });
      }
    }

    try {
      const channel = await interaction.guild.channels.create({
        name,
        type: type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
        parent: parent ? parent.id : undefined,
      });

      await interaction.reply({ content: `Created channel: ${channel}` });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: 'Something went wrong creating that channel. Check my role permissions (Manage Channels).',
        ephemeral: true,
      });
    }
  },
};
