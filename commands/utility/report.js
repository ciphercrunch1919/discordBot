/* Allows a user in a discord server to send anonymous reports to admins/mods of that server
  For my personal server, I created a seperate report channel for these bot messages 
    to send to that was only visible by admins/mods and the bot */
const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

let timeout = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('This is a report command'),
  
  async execute(interaction) {
    // Check for cooldown
    if (timeout.includes(interaction.user.id)) {
      return await interaction.reply({ content: "You are on a cooldown, try again in 1 minute", ephemeral: true });
    }

    // Create a modal for user input
    const modal = new ModalBuilder()
      .setCustomId('reportModal')  // Custom ID to identify the modal
      .setTitle('Submit a Report');

    // Create a text input for the report message
    const reportInput = new TextInputBuilder()
      .setCustomId('reportMessage')  // Custom ID to access the input data
      .setLabel("Please describe the issue:")
      .setStyle(TextInputStyle.Paragraph)  // Multiline input
      .setPlaceholder("Enter your report details here...")
      .setRequired(true);  // Make it mandatory

    // Create a row to hold the text input
    const firstActionRow = new ActionRowBuilder().addComponents(reportInput);

    // Add the input fields to the modal
    modal.addComponents(firstActionRow);

    // Show the modal to the user
    await interaction.showModal(modal);

    // Add the user to the cooldown list
    timeout.push(interaction.user.id);
    setTimeout(() => {
      timeout.shift();
    }, 60000);  // 1-minute cooldown
  },
};
