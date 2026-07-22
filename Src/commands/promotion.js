const {SlashCommandBuilder, PermissionFlagsBits,} = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Promote a user')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to promote')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('The reason for the promotion')
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
    .addUserOption(option =>
        option.setName('moderator')
            .setDescription('The moderator promoting the user')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
}
