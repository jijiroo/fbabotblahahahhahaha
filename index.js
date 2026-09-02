require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config');
const announce = require('./handlers/announce');
const assign = require('./handlers/assign');
const offboardHandler = require('./handlers/offboard');
const checklist = require('./handlers/checklist');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // required to read "!announce" etc. Enable this in the Dev Portal too.
  ],
});

// Load slash commands from commands/
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }
}

function hasRole(member, roleName) {
  return member.roles.cache.some(r => r.name === roleName);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// --- Prefix commands: !announce, !assign, !offboard ---
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(config.PREFIX)) return;

  const body = message.content.slice(config.PREFIX.length).trim();
  const [command, ...rest] = body.split(' ');
  const argText = rest.join(' ').trim();
  const cmd = command.toLowerCase();

  if (!['announce', 'assign', 'offboard'].includes(cmd)) return;

  if (message.channel.name !== config.MANAGEMENT_CHANNEL_NAME) {
    return message.reply(`Please run this command in #${config.MANAGEMENT_CHANNEL_NAME}.`);
  }

  if (!hasRole(message.member, config.LEAD_ROLE_NAME)) {
    return message.reply(`Only members with the ${config.LEAD_ROLE_NAME} role can use this command.`);
  }

  try {
    if (cmd === 'announce') {
      await announce.handleAnnounceCommand(message);
    } else if (cmd === 'assign') {
      await assign.handleAssignCommand(message, argText);
    } else if (cmd === 'offboard') {
      await offboardHandler.handleOffboardCommand(message, argText);
    }
  } catch (err) {
    console.error(err);
    await message.reply('Something went wrong running that command.');
  }
});

// --- Slash commands, buttons, modals, role selects ---
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'start_announcement') {
        await interaction.showModal(announce.buildAnnouncementModal());
        return;
      }

      if (interaction.customId.startsWith('checklist:')) {
        const [, type, encodedKey, itemKey] = interaction.customId.split(':');
        await checklist.handleChecklistButton(interaction, type, decodeURIComponent(encodedKey), itemKey);
        return;
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'announcementModal') {
        await announce.handleAnnouncementModalSubmit(interaction);
        return;
      }
      if (interaction.customId === 'feedbackModal') {
        const feedbackCommand = client.commands.get('feedback');
        if (feedbackCommand) await feedbackCommand.handleModalSubmit(interaction);
        return;
      }
      return;
    }

    if (interaction.isRoleSelectMenu()) {
      if (interaction.customId.startsWith('assign_roles:')) {
        const creatorKey = decodeURIComponent(interaction.customId.split(':')[1]);
        await assign.handleRoleSelectSubmit(interaction, creatorKey);
        return;
      }
      return;
    }
  } catch (err) {
    console.error(err);
    const errorMessage = { content: 'Something went wrong.', ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else if (interaction.reply) {
        await interaction.reply(errorMessage);
      }
    } catch (_) {
      // interaction may no longer be respondable; ignore
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
