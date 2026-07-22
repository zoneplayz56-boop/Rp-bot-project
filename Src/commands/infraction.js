const {SlashCommandBuilder, PermissionFlagsBits,} = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
    .setName('infraction')
    .setDescription('infract a user')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to infract')
            .setRequired(true)
    )
    .addUserOption(option =>
        option.setName('moderator')
            .setDescription('The moderator who infracted the user')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('The reason for the infraction')
            .setRequired(true)
    )
    .addRoleOption(option =>
        option.setName('previousrank')
            .setDescription('The user previous rank')
            .setRequired(true)
    )
    .addRoleOption(option =>
        option.setName('newrank')
            .setDescription('The user new rank')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
}
