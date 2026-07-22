const {SlashCommandBuilder, PermissionFlagsBits, User,} = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('kick a user')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to kick')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('The reason for the kick')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
}