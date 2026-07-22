const {SlashCommandBuilder} = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('911')
        .setDescription('make a 911 call')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of 911 call')
                .addChoices(
                    { name: 'Police', value: 'police' },
                    { name: 'Firefighter', value: 'fire' },
                    { name: 'EMS', value: 'ems' },
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('location')
                .setDescription('The location of the emergency')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('A brief description of the emergency')
                .setRequired(true)
        )
    }
        