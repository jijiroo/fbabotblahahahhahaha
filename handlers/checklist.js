const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const store = require('../store');
const config = require('../config');

const CHECKLISTS = {
  onboarding: [
    { key: 'pr_join', label: 'PR joins the PRxAM channel' },
    { key: 'notify_am_whitelist', label: 'Notify AMs to whitelist' },
    { key: 'dropbox_folder', label: 'Create Dropbox folder' },
    { key: 'posting_sheet', label: 'Create posting sheet' },
    { key: 'assign_account', label: 'Assign an account' },
    { key: 'update_masterlist', label: 'Update masterlist' },
  ],
  offboarding: [
    { key: 'update_masterlist', label: 'Update masterlist' },
    { key: 'delete_dropbox', label: 'Dropbox folder deleted' },
    { key: 'delete_posting_sheet', label: 'Posting sheet deleted' },
    { key: 'notify_am_clear', label: 'Notify AMs "all clear"' },
  ],
};

function initialItems(type) {
  const items = {};
  CHECKLISTS[type].forEach(item => { items[item.key] = false; });
  return items;
}

function isComplete(type, items) {
  return CHECKLISTS[type].every(item => items[item.key]);
}

// Discord allows max 5 buttons per row and 5 rows per message (25 buttons total).
function buildComponents(type, creatorKey, items) {
  const definitions = CHECKLISTS[type];
  const rows = [];
  let row = new ActionRowBuilder();

  definitions.forEach((item, index) => {
    if (index > 0 && index % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder();
    }
    const done = !!items[item.key];
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`checklist:${type}:${encodeURIComponent(creatorKey)}:${item.key}`)
        .setLabel(`${done ? '✅' : '⬜'} ${item.label}`.slice(0, 80))
        .setStyle(done ? ButtonStyle.Success : ButtonStyle.Secondary)
    );
  });
  rows.push(row);
  return rows;
}

async function handleChecklistButton(interaction, type, creatorKey, itemKey) {
  const creator = store.getCreator(creatorKey);
  if (!creator || !creator[type]) {
    return interaction.reply({
      content: 'I lost track of this checklist. It may have been from before a restart.',
      ephemeral: true,
    });
  }

  const items = { ...creator[type].items, [itemKey]: !creator[type].items[itemKey] };
  store.upsertCreator(creatorKey, { [type]: { ...creator[type], items } });

  const components = buildComponents(type, creatorKey, items);
  await interaction.update({ components });

  if (isComplete(type, items)) {
    if (type === 'onboarding') {
      const leadRole = interaction.guild.roles.cache.find(r => r.name === config.LEAD_ROLE_NAME);
      const assignedIds = creator.roleIds || [];

      // Always include @Reddit Lead, plus whichever roles were picked during !assign.
      // Use a Set so we don't double-ping if Reddit Lead was also picked in !assign.
      const mentionIds = new Set(assignedIds);
      if (leadRole) mentionIds.add(leadRole.id);

      const roleMentions = [...mentionIds].map(id => `<@&${id}>`).join(' ') || 'the assigned team';
      await interaction.channel.send({
        content: `✅ Onboarding checklist complete for **${creatorKey}**! ${roleMentions}`,
      });
    } else {
      await interaction.channel.send({
        content: `✅ Offboarding checklist complete for **${creatorKey}**.`,
      });
    }
  }
}

module.exports = { CHECKLISTS, initialItems, isComplete, buildComponents, handleChecklistButton };
