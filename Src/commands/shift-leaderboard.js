const {SlashCommandBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('view-leaderboard')
    .setDescription('View the activity leaderboard for the server staffs')
}