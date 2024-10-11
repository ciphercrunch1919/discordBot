/* Use this code to initialize the slash commands
  This is needed for any slash command to work
  Use `node /deploy-commands.js` in your terminal to run this code before running your bot */

const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

const foldersPath = path.join(__dirname, 'commands'); // Gets the path to the commands folder
const commandFolders = fs.readdirSync(foldersPath); 

// Loop through the command folder and retrieve slash commands
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  // Loop through each command file
  for (const file of commandFiles){
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if('data' in command && 'execute' in command){
      commands.push(command.data.toJSON());
    } else{
      console.log(`The command at ${filePath} is missing "data" and/or "execute" properties`);
    }
  }
}

// Create a new REST instance and set the authorization token
const rest = new REST().setToken(token);

// An immediately invoked function expression (IIFE) to register the commands
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Use the Discord REST API to register the commands with the specified guild
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // Log any errors that occur during the registration process
    console.error(error);
  }
})();
