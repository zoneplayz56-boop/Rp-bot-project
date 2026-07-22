const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Creates a ticket panel')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel where the ticket panel will be created')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    }