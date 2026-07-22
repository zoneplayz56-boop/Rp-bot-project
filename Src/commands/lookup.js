const {SlashCommandBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Lookup a Staff member promotions and demotions')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to lookup')
        .setRequired(true)
    )
}