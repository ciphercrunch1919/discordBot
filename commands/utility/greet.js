// Using this command will make the bot greet the user
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('greet')
    .setDescription('Greets the server user'),
  async execute(interation){
    await interation.reply(`Hello ${interation.user.username}!`);
  }
};
