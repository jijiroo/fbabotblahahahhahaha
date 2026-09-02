const config = require('../config');
const store = require('../store');
const checklist = require('./checklist');

async function handleOffboardCommand(message, creatorKey) {
  if (!creatorKey) {
    return message.reply('Usage: `!offboard FBA ID - Creator`');
  }

  const creator = store.getCreator(creatorKey);

  if (creator && creator.channelId) {
    const channel = message.guild.channels.cache.get(creator.channelId);
    if (channel) {
      await channel.delete(`Offboarded by ${message.author.tag}`);
    }
  } else {
    await message.channel.send(
      `Note: I don't have a channel on record for "${creatorKey}" — skipping channel deletion. Delete it manually if needed.`
    );
  }

  const leadRole = message.guild.roles.cache.find(r => r.name === config.LEAD_ROLE_NAME);
  const items = checklist.initialItems('offboarding');
  const components = checklist.buildComponents('offboarding', creatorKey, items);

  const sent = await message.channel.send({
    content: `${leadRole ? leadRole.toString() : config.LEAD_ROLE_NAME} — offboarding checklist for **${creatorKey}**:`,
    components,
  });

  store.upsertCreator(creatorKey, {
    channelId: null,
    offboarding: { messageId: sent.id, channelId: message.channel.id, items },
  });
}

module.exports = { handleOffboardCommand };
