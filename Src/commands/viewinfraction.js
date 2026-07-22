const {SlashCommandBuilder} = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewinfraction')
        .setDescription('Looks up a infraction by its ID.')
        .addStringOption(option =>
            option.setName('infractionid')
                .setDescription('The infraction ID to look up')
                .setRequired(true)
        )
    }