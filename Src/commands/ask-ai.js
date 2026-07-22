const {SlashCommandBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask-ai')
    .setDescription('Ask AI a question')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('The question you want to ask AI')
        .setRequired(true)
        .setMaxLength(5000)
    )
}