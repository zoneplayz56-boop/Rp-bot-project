const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-department-channel')
        .setDescription('Configure the department channel for the server')
        .addStringOption(option =>
            option.setName('department')
                .setDescription('The name of the department channel to configure')
                .setRequired(true)
                .addChoices(
                    { name: 'Police', value: 'police' },
                    { name: 'Firefighter', value: 'fire' },
                    { name: 'EMS', value: 'ems' },
                    { name: 'Civilian', value: 'civilian' },
                    { name: 'Dispatch', value: 'dispatch' },
                )
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to set as the department channel')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),
};