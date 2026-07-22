const {SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to unban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for unbanning the user')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    }