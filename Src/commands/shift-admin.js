const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { UserShiftStats } = require('../Schemes/shift-scheme.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shiftadmin')
        .setDescription('Administrative commands for shift management override')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('timeadd')
                .setDescription('Add shift time balance to a staff member')
                .addUserOption(opt => opt.setName('target').setDescription('The user').setRequired(true))
                .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutes to add').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('timededuct')
                .setDescription('Deduct shift time balance from a staff member')
                .addUserOption(opt => opt.setName('target').setDescription('The user').setRequired(true))
                .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutes to deduct').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('wipe')
                .setDescription('Wipe the current active shift wave data')
                .addIntegerOption(opt => opt.setName('wave_no').setDescription('The wave number reference').setRequired(true))),
        }
      