const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-channel')
    .setDescription('Delete a channel by name')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the channel to delete')
        .setRequired(true)),

  async execute(interaction) {
    const name = interaction.options.getString('name');

    const channel = interaction.guild.channels.cache.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    );

    if (!channel) {
      return interaction.reply({
        content: `I couldn't find a channel named "${name}".`,
        ephemeral: true,
      });
    }

    try {
      await channel.delete(`Deleted by ${interaction.user.tag} via /delete-channel`);
      await interaction.reply({ content: `Deleted channel: ${name}` });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: 'Something went wrong deleting that channel. Check my role permissions and role position (I must be above the channel restrictions).',
        ephemeral: true,
      });
    }
  },
};
