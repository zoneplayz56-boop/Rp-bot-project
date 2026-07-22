
const {SlashCommandBuilder, PermissionFlagsBits,} = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
    .setName('viewpromotion')
    .setDescription('View a promotion')
    .addStringOption(option =>
        option.setName('promotionid')
            .setDescription('The ID of the promotion to view')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
}