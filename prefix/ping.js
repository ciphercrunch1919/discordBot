// Example for when you want a custom prefix command instead of use the Slash Command 
module.exports = {
  name: 'ping',  // Command name
  description: 'Replies with Pong!',
  run(_client, message, _args) {
    // Bot replies with "Pong!" to the user
    message.reply('Pong!');
  },
};
