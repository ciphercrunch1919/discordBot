// Sends welcome message to new users when they join the server
const { Events, EmbedBuilder } = require('discord.js');
const { welcomeChannelId, guildId } = require('../config.json');

module.exports = {
  setupWelcomeMessage(client) {
    client.on(Events.GuildMemberAdd, async (member) => {
      // Fetch the guild and welcome channel
      const guild = client.guilds.cache.get(guildId);
      if(!guild){
        console.error(`Guild with ID ${guildId} not found.`);
        return;
      }

      const welcomeChannel = await guild.channels.fetch(welcomeChannelId);
      if(!welcomeChannel) {
        console.error(`Channel with ID ${welcomeChannelId} not found.`);
        return;
      }

      // Create and send a welcome message

      const embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle('Welcome!')
        .setDescription(`Welcome to the server, ${member}! We're glad to have you here :D`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await welcomeChannel.send({ embeds: [embed] });
    });
  }
};
