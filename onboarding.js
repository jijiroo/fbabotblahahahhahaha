const config = require('../config');
const store = require('../store');
const checklist = require('./checklist');

async function sendOnboardingChecklist(guild, creatorKey) {
  const creator = store.getCreator(creatorKey);
  if (!creator) return;

  const channel = guild.channels.cache.get(creator.channelId);
  if (!channel) return;

  const leadRole = guild.roles.cache.find(r => r.name === config.LEAD_ROLE_NAME);
  const items = checklist.initialItems('onboarding');
  const components = checklist.buildComponents('onboarding', creatorKey, items);

  const sent = await channel.send({
    content: `${leadRole ? leadRole.toString() : config.LEAD_ROLE_NAME} — onboarding checklist for **${creatorKey}**:`,
    components,
  });

  store.upsertCreator(creatorKey, {
    onboarding: { messageId: sent.id, channelId: channel.id, items },
  });
}

module.exports = { sendOnboardingChecklist };
