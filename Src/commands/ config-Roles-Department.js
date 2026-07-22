const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-roles-department')
        .setDescription('Configure the roles for the department')
        .addStringOption(option =>
            option.setName('role_type')
                .setDescription('Select the type of role to configure')
                .setRequired(true)
                .addChoices(
                    { name: 'Police', value: 'police' },
                    { name: 'Firefighter', value: 'fire' },
                    { name: 'EMS', value: 'ems' },
                    { name: 'Civilian', value: 'civilian' },
                    { name: 'Dispatch', value: 'dispatch' },
                )
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Select the role to assign to the department')
                .setRequired(true)
        )
    }