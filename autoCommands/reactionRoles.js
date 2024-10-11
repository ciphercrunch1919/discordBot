const { Events, EmbedBuilder } = require('discord.js');
const { roleChannelId, guildId, customEmojis } = require('../config.json');
const fs = require('fs');
const path = require('path');

const messageDataFilePath = path.join(__dirname, './reactionRoleData.json');

//Loads reactionRoleData.json
function loadMessageData() {
  if (fs.existsSync(messageDataFilePath)) {
    const data = fs.readFileSync(messageDataFilePath);
    return JSON.parse(data);
  }
  return {};
}

//Writes to reactionRoleData.json
function saveMessageData(data) {
  fs.writeFileSync(messageDataFilePath, JSON.stringify(data, null, 2));
}

// Helper function to handle role assignments or removals
async function updateRole(member, role, action) {
  if (action === 'add') {
    await member.roles.add(role);
    console.log(`Added role ${role.name} to user ${member.user.username}`);
  } else if (action === 'remove') {
    await member.roles.remove(role);
    console.log(`Removed role ${role.name} from user ${member.user.username}`);
  }
}


// Helper function to handle the change in reaction
async function handleReactionChange(reaction, user, guild, roleGroup, action, storedMessageData) {
const emoji = reaction.emoji.id || reaction.emoji.name;
  const roleName = roleGroup.emojiRoleMap[emoji];

  if (!roleName) return;

  const member = guild.members.cache.get(user.id) || await guild.members.fetch(user.id);
  const role = guild.roles.cache.find(role => role.name === roleName);

  if (!member || !role || member.user.bot) return;

  // Ensure reactions object is initialized
  if (!storedMessageData.reactions) {
    storedMessageData.reactions = {}; // Initialize if undefined
  }

  await updateRole(member, role, action); // Updates user roles

  // Updates stored reaction data
  if (action === 'add') {
    if (!storedMessageData.reactions[emoji]) {
      storedMessageData.reactions[emoji] = [];
    }
    if (!storedMessageData.reactions[emoji].includes(user.id)) {
      storedMessageData.reactions[emoji].push(user.id);
    }
  } else if (action === 'remove') {
    const userReactions = storedMessageData.reactions[emoji] || [];
    if (userReactions.includes(user.id)) {
      storedMessageData.reactions[emoji] = userReactions.filter(id => id !== user.id);

      if (storedMessageData.reactions[emoji].length === 0) {
        delete storedMessageData.reactions[emoji];
      }
    }
  }
}

// Function to batch fetch users and roles and update them based on current reactions
async function batchUpdateRoles(guild, storedMessageData, currentReactions, roleGroup) {
  const promises = [];

  // Ensure reactions object is initialized
  if (!storedMessageData.reactions) {
    storedMessageData.reactions = {}; // Initialize if undefined
  }

  const roleMap = storedMessageData[roleGroup.title]?.emojiRoleMap;
  if (!roleMap) return; // Exit early if no role map exists

  const roles = guild.roles.cache; // Cache roles for quick lookup

  // Cache roles by emoji for faster lookups
  const roleCache = {};
  for (const [emoji, roleName] of Object.entries(roleMap)) {
    const role = roles.find(role => role.name === roleName);
    if (role) {
      roleCache[emoji] = role;
    }
  }

  // Pre-fetch current reaction users in parallel

  const currentReactionsPromises = [];
  for (const emoji of currentReactions.keys()) {
    currentReactionsPromises.push(currentReactions.get(emoji).users.fetch());
  }
  const currentReactionResults = await Promise.all(currentReactionsPromises);

  const currentReactionsLookup = new Map();
  Array.from(currentReactions.keys()).forEach((emoji, index) => {
    currentReactionsLookup.set(emoji, new Set(currentReactionResults[index].keys()));
  });

  for (const [emoji, userIds] of Object.entries(storedMessageData.reactions)) {
    const role = roleCache[emoji];
    if (!role) continue;

    const currentUsersForEmoji = currentReactionsLookup.get(emoji) || new Set();
    const storedUsersSet = new Set(userIds);

    for (const userId of userIds) {
      const member = guild.members.cache.get(userId) || await guild.members.fetch(userId);
      if (!currentUsersForEmoji.has(userId) && !member.user.bot) {
        promises.push(updateRole(member, role, 'remove'));
        storedUsersSet.delete(userId);
      }
    }

    storedMessageData.reactions[emoji] = Array.from(storedUsersSet);
    if (storedMessageData.reactions[emoji].length === 0) {
      delete storedMessageData.reactions[emoji];
    }
  }

  for (const [emoji, currentUsersSet] of currentReactionsLookup.entries()) {
    const role = roleCache[emoji];
    if (!role) continue;

    const storedUsers = new Set(storedMessageData.reactions[emoji] || []);
    for (const userId of currentUsersSet) {
      const member = guild.members.cache.get(userId) || await guild.members.fetch(userId);
      if (member.user.bot) continue;

      if (!member.roles.cache.has(role.id)) {
        promises.push(updateRole(member, role, 'add'));
        storedUsers.add(userId);
      }
    }

    storedMessageData.reactions[emoji] = Array.from(storedUsers);
  }

  await Promise.all(promises);
}

module.exports = {
  setupReactionRoles(client) {
    client.once(Events.ClientReady, async () => {
      const guild = client.guilds.cache.get(guildId);
      const channel = await guild.channels.fetch(roleChannelId);

      if (!channel || channel.type !== 0) {
        console.error(`Channel with ID ${channelId} not found or is not a text channel.`);
        return;
      }

      let storedMessageData = loadMessageData();
      storedMessageData.reactions = storedMessageData.reactions || {}; // Ensures reactions object is initialized



      const roleGroups = [
        {
          emojiRoleMap: {
            '🦖': 'he/him',
            '🦋': 'she/her',
            '🌱': 'they/them',
            '🌀': 'any pronouns',
            '🦄': 'other pronouns',
          },
          title: "Pronouns",
          description: "React to this message to add your pronouns role",
          color: "#FF6F61"
        },
        {
          emojiRoleMap: {
            [customEmojis.emoji0.id]: 'role 0',
            [customEmojis.emoji1.id]: 'role 1',
            [customEmojis.emoji2.id]: 'role 2',
            [customEmojis.emoji3.id]: 'role 3',
          },
          title: "Roles Selection",
          description: "React to this message to get more roles:",
          color: "#4A90E2"
        },
      ];

      for (const roleGroup of roleGroups) {
        let roleMessage;

        if (storedMessageData[roleGroup.title]) {
          try {
            roleMessage = await channel.messages.fetch(storedMessageData[roleGroup.title].messageId);
            console.log(`Fetched existing message with ID: ${storedMessageData[roleGroup.title].messageId}`);

            const currentReactions = roleMessage.reactions.cache;

            await batchUpdateRoles(guild, storedMessageData, currentReactions, roleGroup);

            // Check if message content needs to be updated
            const roleMessageContent = Object.entries(roleGroup.emojiRoleMap)
              .map(([emoji, roleName]) => {
                const isCustomEmoji = customEmojis[roleName];
                if(isCustomEmoji){
                  return `<:${customEmojis[roleName].name}:${customEmojis[roleName].id}> - ${roleName}`;
                } else {
                  return `${emoji} - ${roleName}`;
                }
              })
              .join('\n');

            const embed = new EmbedBuilder()
              .setTitle(roleGroup.title)
              .setDescription(`${roleGroup.description}\n\n${roleMessageContent}`)
              .setColor(roleGroup.color);

            // Check if the message content has changed
            if (roleMessage.embeds[0].description !== embed.data.description) {
              await roleMessage.edit({ embeds: [embed] });
            }
            
          } catch (error) {
            console.error(`Failed to fetch message with ID: ${storedMessageData[roleGroup.title].messageId}, sending a new one.`);
          }
        }

        if (!roleMessage) {
          const roleMessageContent = Object.entries(roleGroup.emojiRoleMap)
            .map(([emoji, roleName]) => {
              const isCustomEmoji = customEmojis[roleName];
              if(isCustomEmoji){
                return `<:${customEmojis[roleName].name}:${customEmojis[roleName].id}> - ${roleName}`;
              } else {
                return `${emoji} - ${roleName}`;
              }
            })
            .join('\n');

          const embed = new EmbedBuilder()
            .setTitle(roleGroup.title)
            .setDescription(`${roleGroup.description}\n\n${roleMessageContent}`)
            .setColor(roleGroup.color);

          roleMessage = await channel.send({ embeds: [embed] });
          for (const emoji of Object.keys(roleGroup.emojiRoleMap)) {
            await roleMessage.react(emoji);
          }

          storedMessageData[roleGroup.title] = {
            messageId: roleMessage.id,
            emojiRoleMap: roleGroup.emojiRoleMap
          };
          saveMessageData(storedMessageData);
        }
      };

      // Setup message reaction event listeners
      client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (!user.bot) {
          const emojiIdentifier = reaction.emoji.id || reaction.emoji.name;
          const roleGroup = roleGroups.find(group => Object.keys(group.emojiRoleMap).includes(emojiIdentifier));
          if (roleGroup) {
            await handleReactionChange(reaction, user, guild, roleGroup, 'add', storedMessageData);
          }
        }
      });

      client.on(Events.MessageReactionRemove, async (reaction, user) => {
        if (!user.bot) {
          const emojiIdentifier = reaction.emoji.id || reaction.emoji.name;
          const roleGroup = roleGroups.find(group => Object.keys(group.emojiRoleMap).includes(emojiIdentifier));
          if (roleGroup) {
            await handleReactionChange(reaction, user, guild, roleGroup, 'remove', storedMessageData);
          }
        }
      });

      // Save message data on exit
      process.on('exit', () => {
        saveMessageData(storedMessageData);
        console.log('Reaction role data saved on exit.');
      });

      process.on('SIGINT', () => {
        saveMessageData(storedMessageData);
        console.log('Reaction role data saved on SIGINT.');
        process.exit();
      });
    });
  }
};
