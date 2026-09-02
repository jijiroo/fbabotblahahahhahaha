const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mention')
    .setDescription('Mention a member or role with an optional message')
    .addMentionableOption(option =>
      option.setName('target')
        .setDescription('The member or role to mention')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional message to include')
        .setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMentionable('target');
    const message = interaction.options.getString('message');

    const text = message
      ? `${target} ${message}`
      : `${target}`;

    await interaction.reply({ content: text });
  },
};
