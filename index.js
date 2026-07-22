require('dotenv').config();
const { handleInteraction } = require('./Src/events/Interactionhandler.js');
const handleButton = require('./Src/events/Buttonhandler.js');
const mongoose = require('mongoose');
const { MessageFlags } = require('discord.js');

mongoose.connect(process.env.MONGOOSE_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            await handleInteraction(interaction);
        } else if (interaction.isButton()) {
            await handleButton(interaction);
        }
    } catch (error) {
        console.error(`Unhandled error while handling interaction (${interaction.commandName || interaction.customId || 'unknown'}):`, error);

        if (interaction.isRepliable()) {
            const payload = { content: '❌ Something went wrong while running that command.', flags: MessageFlags.Ephemeral };
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload);
                } else {
                    await interaction.reply(payload);
                }
            } catch (replyError) {
                console.error('Also failed to notify the user about the error:', replyError);
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);