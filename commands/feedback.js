const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Open a form to submit feedback'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('feedbackModal')
      .setTitle('Submit Feedback');

    const subjectInput = new TextInputBuilder()
      .setCustomId('feedbackSubject')
      .setLabel('Subject')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('What is this about?')
      .setRequired(true)
      .setMaxLength(100);

    const detailsInput = new TextInputBuilder()
      .setCustomId('feedbackDetails')
      .setLabel('Details')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell us more...')
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(subjectInput),
      new ActionRowBuilder().addComponents(detailsInput),
    );

    await interaction.showModal(modal);
  },

  // Handles the submitted modal data. Called from index.js's interactionCreate handler.
  async handleModalSubmit(interaction) {
    const subject = interaction.fields.getTextInputValue('feedbackSubject');
    const details = interaction.fields.getTextInputValue('feedbackDetails');

    // Customize this: post to a specific channel, save to a database, etc.
    await interaction.reply({
      content: `Thanks for your feedback, ${interaction.user}!\n**Subject:** ${subject}\n**Details:** ${details}`,
      ephemeral: true,
    });

    // Example: also log it to a feedback channel if one exists named "feedback"
    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'feedback');
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({
        content: `📝 New feedback from ${interaction.user.tag}:\n**Subject:** ${subject}\n**Details:** ${details}`,
      });
    }
  },
};
