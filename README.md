# discorBot
This is a small guide to how I created a personal discord bot in discord.js
My bot commands include:
* reactionRole
  * allows for server owners to set up their reaction roles
  * roles must already be premade in the server
* welcome
  * sends a welcome message to new users that join the server
* /report
  * builds and sends a report to a certain channel for the admins/mods of the server
* /greet
  * when called, greets the user that calls the command
* s!ping
  * when user types in `s!ping` bot replys to user saying "Pong!"

## Steps:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and at the top right click the "New Application" button. Give your application a name, check the terms of service, and enter the application dashboard
2. In general information, you can give your application an icon, name, and description. In bot, you can give your bot an profile picture, background picture, and user name. Also in this tab will be your token. Save that token and don't share it with anyone. By default, the bot is public. If you want to make it a private bot, you must ensure the Install Link is selected to "none" in the installation tab. Then go back to the bot tab and right under Authorize Flow, uncheck the "Public Bot" section.
3. Go to the OAuth2 tab, and in the "OAuth2 URL Generator" section, check the bot scope and any bot permissions. Bot permissions are what your bot should be allowed to do. I recommend checking "Administrator" since you should be in full control of this bot. But, you can restrict the bot's permissions as much as you want. Later, you can change these settings in the server settings in the roles tab. Integration Type should be "Guild Install". Now you can copy the "Generated URL". Paste this into your browser and then select the server you want your bot in.
4. You will need an IDE like VSCode. Install node.js => [link here](https://nodejs.org/en/download/package-manager/current). Open your terminal and create a folder/directory you want your bot code to be stored. Now open that folder in VSCode or the IDE you chose and select new terminal. Use the npm to install node and install discord.js with this ```npm i discord.js```.
   * This will install both of your package.json files and node_modules
5. Create your main file, I called mine ```index.js```. This is not required but highly recommended, I put my tokens and keys for my project in the ```config.json``` file and called the objects when needed. From there you can create any commands you want for your bot.
   * Here is the documentation for discord.js:
     * [Discord.js Docs](https://discord.js.org/docs/packages/discord.js/14.16.3)
     * [Discord.js Guide](https://discordjs.guide/#before-you-begin)

You may use my code or reference it to create your own custom commands. Additionally, turn on developer mode in your Discord Settings to get guild id, channel ids, and others. And to get the id of a custom emoji (which you will need if you want reactionRoles.js to work with custom emojis) use ```\:YOUR_EMOJI_NAME:``` 
