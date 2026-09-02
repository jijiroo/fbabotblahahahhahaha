const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const config = require('../config');

// !announce -> shows a button. Modals can only be opened in direct response
// to a button/command interaction, not from a plain text message, so we use
// a button as the bridge into the modal.
async function handleAnnounceCommand(message) {
  const button = new ButtonBuilder()
    .setCustomId('start_announcement')
    .setLabel('Fill Out Announcement')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  await message.reply({
    content: 'Click below to fill out the onboarding announcement.',
    components: [row],
  });
}

function buildAnnouncementModal() {
  const modal = new ModalBuilder()
    .setCustomId('announcementModal')
    .setTitle('Onboarding Announcement');

  const fbaInput = new TextInputBuilder()
    .setCustomId('fba_id_name')
    .setLabel('FBA ID - Creator Name')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const socialsInput = new TextInputBuilder()
    .setCustomId('other_socials')
    .setLabel('Other Socials')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(500);

  const ofTagInput = new TextInputBuilder()
    .setCustomId('onlyfans_tag')
    .setLabel('OnlyFans Tag')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const nichesInput = new TextInputBuilder()
    .setCustomId('niches')
    .setLabel('Niches')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(200);

  const dosDontsInput = new TextInputBuilder()
    .setCustomId('dos_donts')
    .setLabel('Dos and Donts')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(fbaInput),
    new ActionRowBuilder().addComponents(socialsInput),
    new ActionRowBuilder().addComponents(ofTagInput),
    new ActionRowBuilder().addComponents(nichesInput),
    new ActionRowBuilder().addComponents(dosDontsInput),
  );

  return modal;
}

async function handleAnnouncementModalSubmit(interaction) {
  const fbaIdName = interaction.fields.getTextInputValue('fba_id_name');
  const otherSocials = interaction.fields.getTextInputValue('other_socials') || 'N/A';
  const onlyfansTag = interaction.fields.getTextInputValue('onlyfans_tag');
  const niches = interaction.fields.getTextInputValue('niches');
  const dosDonts = interaction.fields.getTextInputValue('dos_donts');

  const targetChannel = interaction.guild.channels.cache.find(
    c => c.name === config.ONBOARDING_ANNOUNCE_CHANNEL_NAME
  );

  if (!targetChannel) {
    return interaction.reply({
      content: `I couldn't find a channel named #${config.ONBOARDING_ANNOUNCE_CHANNEL_NAME}.`,
      ephemeral: true,
    });
  }

  const pageRunnerRole = interaction.guild.roles.cache.find(
    r => r.name === config.PAGE_RUNNER_ROLE_NAME
  );

  const announcementText = [
    '**New Creator Onboarding**',
    '',
    `**FBA ID - Creator Name:** ${fbaIdName}`,
    `**Other Socials:** ${otherSocials}`,
    `**OnlyFans Tag:** ${onlyfansTag}`,
    `**Niches:** ${niches}`,
    `**Dos and Donts:** ${dosDonts}`,
    '',
    pageRunnerRole ? `${pageRunnerRole} please react ✅ once reviewed.` : '',
  ].join('\n');

  const sentMessage = await targetChannel.send({ content: announcementText });
  await sentMessage.react('✅');

  await interaction.reply({
    content: `Posted to #${config.ONBOARDING_ANNOUNCE_CHANNEL_NAME}.`,
    ephemeral: true,
  });
}

module.exports = {
  handleAnnounceCommand,
  buildAnnouncementModal,
  handleAnnouncementModalSubmit,
};
