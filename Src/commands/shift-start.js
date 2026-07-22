const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { ActiveShift, UserShiftStats } = require('../Schemes/shift-scheme.js');
const { formatDuration } = require('../utils/shifthelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shift')
        .setDescription('Manage your shift or view your profile stats')
        .addSubcommand(sub => sub.setName('start').setDescription('Start an active shift'))
        .addSubcommand(sub => sub.setName('manage').setDescription('View your total shift statistics and ranking')),
}
      