const {SlashCommandBuilder, PermissionFlagsBits,} = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a user from the server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
        )

        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    }