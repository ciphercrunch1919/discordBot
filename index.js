// Import necessary modules
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, EmbedBuilder, GatewayIntentBits, Collection, Partials, time } = require('discord.js');
const { token, reportAdminsChannelId, guildId } = require('./config.json'); // Importing the token for the bot

// Create a new client instance with specific intents
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,                 // To get guild-related events
      GatewayIntentBits.GuildMembers,           // To get member-related events
      GatewayIntentBits.GuildMessages,          // To get message-related events
      GatewayIntentBits.GuildMessageReactions   // To get reaction-related events
    ],
    partials: [
      Partials.Message, 
      Partials.Channel, 
      Partials.Reaction
    ],
});

// Initialize collections for commands and prefix commands
client.commands = new Collection();
client.prefix = new Map();

// Load command files from the 'commands' directory
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Loop through each folder to load commands
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`The command at ${filePath} is missing "data" and/or "execute" properties`);
    }
  }
}

// Load prefix commands from the 'prefix' folder
const prefixFolders = fs.readdirSync("./prefix").filter((file) => file.endsWith('.js'));
for (const file of prefixFolders) {
  const cmd = require('./prefix/' + file);
  client.prefix.set(cmd.name, cmd);
}

// Handle interaction commands (slash commands)
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return; // Ignore non-chat commands

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction); // Execute the command
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

// Handle report command modal submission
client.on('interactionCreate', async interaction => {
  if (!interaction.isModalSubmit()) return;

  // Check if this is the report modal submission
  if (interaction.customId === 'reportModal') {
    const reportMessage = interaction.fields.getTextInputValue('reportMessage');
    const user = interaction.user;
    const date = new Date();
    const timeString = time(date); // Ensure 'time' is defined here

    const guild = client.guilds.cache.get(guildId);
    const channel = guild.channels.cache.get(reportAdminsChannelId);

    if (!channel) {
      return interaction.reply({ content: "Couldn't find the report channel.", ephemeral: true });
    }

    const botPermissions = channel.permissionsFor(client.user);
    if (!botPermissions.has('SEND_MESSAGES')) {
      return interaction.reply({ content: "I don't have permission to send messages in the report channel.", ephemeral: true });
    }

    // Create embed for the report
    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle('Bot Report')
      .addFields({ name: 'Time of report', value: `${timeString}` })
      .setDescription(`Report Message: **${reportMessage}**`);

    const DMembed = new EmbedBuilder()
      .setColor("Random")
      .setDescription('Your report is submitted!');

    const replyEmbed = new EmbedBuilder()
      .setColor("Random")
      .setDescription('Successfully submitted your report!');

    // Send the report to the designated channel
    await channel.send({ embeds: [embed] });
    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

    // Send a confirmation DM to the user
    await user.send({ embeds: [DMembed] }).catch(() => {
      // Handle error if the user has DMs disabled
    });
  }
});

// Handle message prefix commands
client.on('messageCreate', async message => {
  const prefix = "s!"; // Custom prefix

  // Ignore messages that don't start with the prefix or are sent by bots
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  console.log(`Prefix command detected: ${message.content}`);

  // Extract the command and arguments from the message
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const prefixcmd = client.prefix.get(command);
  if (prefixcmd) {
    console.log(`Executing command: ${command}`);
    try {
      await prefixcmd.run(client, message, args); // Execute the command
    } catch (error) {
      console.error(`Error executing command: ${error.message}`);
      await message.reply('There was an error while executing that command!');
    }
  } else {
    console.log(`No command found for: ${command}`);
  }
});

// Initialize the reaction roles when the bot is ready
const reactionRole = require('./autoCommands/reactionRoles');
const { setupWelcomeMessage } = require('./autoCommands/welcome');
reactionRole.setupReactionRoles(client); // Setup reaction roles
setupWelcomeMessage(client);

// Event listener for when the bot is ready
client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Login to Discord with the bot's token
client.login(token);
