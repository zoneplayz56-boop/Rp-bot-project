const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ChannelType } = require('discord.js');
const InfractionLog = require('../Schemes/infraction-scheme.js');
const PromotionLog = require('../Schemes/promotion-scheme.js');
const { ActiveShift, UserShiftStats } = require('../Schemes/shift-scheme.js');
const DepartmentRoles = require('../Schemes/department-role-scheme.js');
const DepartmentChannelConfig = require('../Schemes/department-channel-config-scheme.js');
const Call = require('../Schemes/call.js');
const { formatDuration } = require('../utils/shifthelper.js');

const { GoogleGenAI } = require('@google/genai');

require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

/**
 * Streams text from the Gemini AI model to Discord in real-time, updating the message every 1.2 seconds.
 * @param {Object} interaction - The Discord.js Interaction object
 * @param {Object} aiStream - The live Gemini stream response object
 */
async function streamText(interaction, aiStream) {
  let currentText = "";
  let lastDiscordUpdate = Date.now();
  const DISCORD_THROTTLE_MS = 1200; 

  const buildEmbed = (text) =>
    new EmbedBuilder()
      .setAuthor({ name: '🤖 AI Response', iconURL: interaction.client.user.displayAvatarURL() })
      .setDescription(text || '...')
      .setColor('#5865F2')
      .setTimestamp();

  try {
  
    const streamSource = aiStream.stream || aiStream;

    for await (const chunk of streamSource) {
      
      const textChunk = typeof chunk.text === 'function' ? chunk.text() : (chunk.text || '');
      currentText += textChunk;

      if (currentText.length > 1900) {
        currentText = currentText.slice(0, 1900);
      }

      if (Date.now() - lastDiscordUpdate > DISCORD_THROTTLE_MS) {
      
        await interaction.editReply({
          content: null,
          embeds: [buildEmbed(`${currentText}▌`)] 
        }).catch(() => {});

        lastDiscordUpdate = Date.now();
      }
    }

    
    await interaction.editReply({
      content: null,
      embeds: [buildEmbed(currentText.slice(0, 1900) || 'No response generated.')]
    });

  } catch (error) {
    console.error('Error during streaming:', error);
    throw error;
  }
}

async function handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    if (!interaction.inGuild()) {
        return interaction.reply({
            content: 'This command can only be used inside a server.',
            flags: MessageFlags.Ephemeral
        });
    }

    const commandName = interaction.commandName;

    if (commandName === 'promote' || commandName === 'promotion') {
        const targetUser = interaction.options.getUser('target');
        const moderatorUser = interaction.options.getUser('moderator');
        const reasonStr = interaction.options.getString('reason') || 'No reason provided';
        const previousRankRole = interaction.options.getRole('previousrank');
        const newRankRole = interaction.options.getRole('newrank');

        if (!targetUser || !moderatorUser) {
            return interaction.reply({
                content: '❌ Missing required options (Target and Moderator are required).',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        const prevRankId = previousRankRole ? previousRankRole.id : null;
        const newRankId = newRankRole ? newRankRole.id : null;

        try {
            const logEntry = new PromotionLog({
                targetId: targetUser.id,
                moderatorId: moderatorUser.id,
                reason: reasonStr,
                previousRankId: prevRankId,
                newRankId: newRankId
            });

            const savedLog = await logEntry.save();
            const displayPrev = prevRankId ? `<@&${prevRankId}>` : 'No previous rank provided';
            const displayNew = newRankId ? `<@&${newRankId}>` : 'No new rank provided';

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Promotion Logged', iconURL: interaction.client.user.displayAvatarURL() })
                .setDescription(`Successfully logged promotion **${savedLog.promotionId}** for <@${targetUser.id}>.`)
                .addFields(
                    { name: 'User', value: `<@${targetUser.id}>`, inline: false },
                    { name: 'Authorized By', value: `<@${moderatorUser.id}>`, inline: false },
                    { name: 'Promotion ID', value: `\`${savedLog.promotionId}\``, inline: false },
                    { name: 'Old Rank', value: displayPrev, inline: false },
                    { name: 'New Rank', value: displayNew, inline: false },
                    { name: 'Reason', value: reasonStr, inline: false }
                )
                .setColor('#00FF00')
                .setTimestamp()
                .setFooter({ text: 'Use /lookup to check history logs.', iconURL: interaction.client.user.displayAvatarURL() });

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Database Error saving promotion log:', error);
            return interaction.editReply({ content: `❌ Database error: \`${error.message}\`` });
        }
    }

    if (commandName === 'ping') {
        const websocket = interaction.client.ws.ping;
        const totalSeconds = interaction.client.uptime / 1000;
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor(totalSeconds / 3600) % 24;
        const minutes = Math.floor(totalSeconds / 60) % 60;
        const seconds = Math.floor(totalSeconds % 60);

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Bot Ping test' })
            .setTitle('🏓 Pong')
            .addFields(
                { name: 'Status:', value: '🟢 operational', inline: false },
                { name: 'Ping:', value: `🌐 ${websocket}ms`, inline: false },
                { name: 'Bot Uptime:', value: `⏱️ ${days}d ${hours}h ${minutes}m ${seconds}s`, inline: false }
            )
            .setTimestamp()
            .setColor('Blue')
            .setFooter({ text: 'The bot is operational' });

        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'infraction') {
        const targetUser = interaction.options.getUser('target');
        const moderatorUser = interaction.options.getUser('moderator');
        const reasonStr = interaction.options.getString('reason') || 'No reason provided';
        const previousRankRole = interaction.options.getRole('previousrank');
        const newRankRole = interaction.options.getRole('newrank');

        if (!targetUser || !moderatorUser) {
            return interaction.reply({
                content: '❌ Missing required options (Target and Moderator are required).',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        const prevRankId = previousRankRole ? previousRankRole.id : null;
        const newRankId = newRankRole ? newRankRole.id : null;

        try {
            const logEntry = new InfractionLog({
                targetId: targetUser.id,
                moderatorId: moderatorUser.id,
                reason: reasonStr,
                previousRankId: prevRankId,
                newRankId: newRankId
            });

            const savedLog = await logEntry.save();
            const displayPrev = prevRankId ? `<@&${prevRankId}>` : 'No previous rank provided';
            const displayNew = newRankId ? `<@&${newRankId}>` : 'No new rank provided';

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Infraction Logged', iconURL: interaction.client.user.displayAvatarURL() })
                .setDescription(`Successfully logged infraction **${savedLog.infractionId}** for <@${targetUser.id}>.`)
                .addFields(
                    { name: 'User', value: `<@${targetUser.id}>`, inline: false },
                    { name: 'Moderator', value: `<@${moderatorUser.id}>`, inline: false },
                    { name: 'Case ID', value: `\`${savedLog.infractionId}\``, inline: false },
                    { name: 'Previous Rank', value: displayPrev, inline: false },
                    { name: 'New Rank', value: displayNew, inline: false },
                    { name: 'Reason', value: reasonStr, inline: false }
                )
                .setColor('#FF0000')
                .setTimestamp()
                .setFooter({ text: 'Use /lookup to check history logs.', iconURL: interaction.client.user.displayAvatarURL() });

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Database Error saving infraction log:', error);
            return interaction.editReply({ content: `❌ Database error: \`${error.message}\`` });
        }
    }

    if (commandName === 'lookup') {
        const targetUser = interaction.options.getUser('user');

        if (!targetUser) {
            return interaction.reply({ content: '❌ Please specify a valid user to lookup.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        try {
            const infractionLogs = await InfractionLog.find({
                $or: [{ targetId: targetUser.id }, { moderatorId: targetUser.id }]
            }).sort({ createdAt: -1 });

            const promotionLogs = await PromotionLog.find({
                $or: [{ targetId: targetUser.id }, { moderatorId: targetUser.id }]
            }).sort({ createdAt: -1 });

            if ((!infractionLogs || infractionLogs.length === 0) && (!promotionLogs || promotionLogs.length === 0)) {
                return interaction.editReply({ content: `ℹ️ No historical cases found involving **${targetUser.username}**.` });
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Case Index: ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
                .setDescription(`Copy any Case ID below and run \`/viewinfraction\` or \`/viewpromotion\` to view full logs for <@${targetUser.id}>.`)
                .setColor('#7000FF')
                .setTimestamp();

            if (infractionLogs.length > 0) {
                const infList = infractionLogs.map(log => {
                    const roleType = log.targetId === targetUser.id ? 'Target' : 'Issuer';
                    return `• \`${log.infractionId}\` (${roleType})`;
                }).slice(0, 15).join('\n');
                embed.addFields({
                    name: `📉 Infraction Cases (${infractionLogs.length} total)`,
                    value: infractionLogs.length > 15 ? `${infList}\n*...and ${infractionLogs.length - 15} more.*` : infList,
                    inline: false
                });
            }

            if (promotionLogs.length > 0) {
                const promoList = promotionLogs.map(log => {
                    const roleType = log.targetId === targetUser.id ? 'Recipient' : 'Approver';
                    return `• \`${log.promotionId}\` (${roleType})`;
                }).slice(0, 15).join('\n');

                embed.addFields({
                    name: `🚀 Promotion Cases (${promotionLogs.length} total)`,
                    value: promotionLogs.length > 15 ? `${promoList}\n*...and ${promotionLogs.length - 15} more.*` : promoList,
                    inline: false
                });
            }

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Database Error during case lookup:', error);
            return interaction.editReply({ content: '❌ Failed to complete the case index search inside the database.' });
        }
    }

    if (commandName === 'viewinfraction') {
        const caseIdInput = interaction.options.getString('infractionid')?.trim().toLowerCase();


        await interaction.deferReply();

        let searchId = caseIdInput;
        if (!searchId.startsWith('infraction-case-')) {
            searchId = `infraction-case-${searchId.padStart(2, '0')}`;
        }
if(!rawinfractionIdInput) {
    await interaction.editReply({ content: '❌ Please provide a valid Infraction Case ID.', flags: MessageFlags.Ephemeral });
        try {
            const log = await InfractionLog.findOne({ infractionId: searchId });

            if (!log) {
                return interaction.editReply({ content: `❌ Infraction case \`${searchId}\` could not be found in the database.` });
            }

            const rolePrevStr = log.previousRankId ? `<@&${log.previousRankId}>` : 'None';
            const roleNewStr = log.newRankId ? `<@&${log.newRankId}>` : 'None';
            const dateString = log.createdAt.toLocaleDateString();

            const embed = new EmbedBuilder()
                .setTitle(`📋 Case File: ${log.infractionId.toUpperCase()}`)
                .setDescription(`**Logged on:** ${dateString}`)
                .addFields(
                    { name: 'Target User', value: `<@${log.targetId}>`, inline: false },
                    { name: 'Moderator', value: `<@${log.moderatorId}>`, inline: false },
                    { name: 'Rank Demotion', value: `${rolePrevStr} ➡️ ${roleNewStr}`, inline: false },
                    { name: 'Reason Provided', value: log.reason, inline: false }
                )
                .setColor('#FF0000')
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Database Error during /viewinfraction execution:', error);
            return interaction.editReply({ content: `❌ Database error: \`${error.message}\`` });
        }
    }

    if (commandName === 'viewpromotion') {
        const caseIdInput = interaction.options.getString('promotionid')?.trim().toLowerCase();

        if (!promotionIdInput) {
            return interaction.reply({ content: '❌ Please provide a Promotion Case ID.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        let searchId = caseIdInput;
        if (!searchId.startsWith('promotion-case-')) {
            searchId = `promotion-case-${searchId.padStart(2, '0')}`;
        }

        try {
            const log = await PromotionLog.findOne({ promotionId: searchId });

            if (!log) {
                return interaction.editReply({ content: `❌ Promotion case \`${searchId}\` could not be found in the database.` });
            }

            const rolePrevStr = log.previousRankId ? `<@&${log.previousRankId}>` : 'None';
            const roleNewStr = log.newRankId ? `<@&${log.newRankId}>` : 'None';
            const dateString = log.createdAt.toLocaleDateString();

            const embed = new EmbedBuilder()
                .setTitle(`📋 Case File: ${log.promotionId.toUpperCase()}`)
                .setDescription(`**Logged on:** ${dateString}`)
                .addFields(
                    { name: 'Target User', value: `<@${log.targetId}>`, inline: false },
                    { name: 'Authorized By', value: `<@${log.moderatorId}>`, inline: false },
                    { name: 'Rank Promotion', value: `${rolePrevStr} ➡️ ${roleNewStr}`, inline: false },
                    { name: 'Reason Provided', value: log.reason, inline: false }
                )
                .setColor('#00FF00')
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Database Error during /viewpromotion execution:', error);
            return interaction.editReply({ content: `❌ Database error: \`${error.message}\`` });
        }
    }

    if (commandName === 'ban') {
        const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply({ content: 'That user is not in this server.' });
        }

        if (!targetMember.bannable) {
            return interaction.editReply({
                content: 'I cannot ban this user. They may have a higher role than me or administrative permissions.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await targetUser.send(`You have been banned from **${interaction.guild.name}** for: ${reason}`).catch(() => {
                console.log(`Could not send DM to ${targetUser.tag}.`);
            });
            await targetMember.ban({ reason });
            return interaction.editReply({ content: `Successfully banned **${targetUser.tag}** for: ${reason}` });
        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: 'There was an error trying to ban this user.' });
        }
    }

    if (commandName === 'unban') {
        const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const bans = await interaction.guild.bans.fetch();
            const bannedUser = bans.get(targetUser.id);

            if (!bannedUser) {
                return interaction.editReply({ content: 'That user is not banned from this server.' });
            }

            await interaction.guild.members.unban(targetUser.id, reason);
            return interaction.editReply({ content: `Successfully unbanned **${targetUser.tag}** for: ${reason}` });
        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: 'There was an error trying to unban this user.' });
        }
    }

    if (commandName === 'kick') {
        const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply({ content: 'That user is not in this server.' });
        }

        if (!targetMember.kickable) {
            return interaction.editReply({
                content: 'I cannot kick this user. They may have a higher role than me or administrative permissions.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await targetUser.send(`You have been kicked from **${interaction.guild.name}** for: ${reason}`).catch(() => {
                console.log(`Could not send DM to ${targetUser.tag}.`);
            });
            await targetMember.kick(reason);
            return interaction.editReply({ content: `Successfully kicked **${targetUser.tag}** for: ${reason}` });
        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: 'There was an error trying to kick this user.' });
        }
    }

    if (commandName === 'shift') {
        const subcommand = interaction.options.getSubcommand?.();

        if (subcommand === 'start') {
            const existingShift = await ActiveShift.findOne({ userId: interaction.user.id });
            if (existingShift) {
                return interaction.reply({ content: '❌ You are already on an active shift!', flags: MessageFlags.Ephemeral });
            }

            await ActiveShift.create({
                userId: interaction.user.id,
                startTime: new Date()
            });

            const embed = new EmbedBuilder()
                .setTitle('⚙️ Shift Management Panel')
                .setDescription(`Your active shift started at <t:${Math.floor(Date.now() / 1000)}:F>.\n\nUse the buttons below to pause, resume, or end your work session.`)
                .setColor('#5865F2')
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('shift_break').setLabel('Break').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('shift_resume').setLabel('Resume').setEmoji('▶️').setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('shift_end').setLabel('End Shift').setEmoji('🛑').setStyle(ButtonStyle.Danger)
            );

            return interaction.reply({ embeds: [embed], components: [row] });
        }

        if (subcommand === 'manage') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const stats = await UserShiftStats.findOne({ userId: interaction.user.id });
            const allStats = await UserShiftStats.find().sort({ currentWaveDuration: -1 });
            const rank = allStats.findIndex(u => u.userId === interaction.user.id) + 1;

            if (!stats || stats.totalShifts === 0) {
                return interaction.editReply({ content: '❌ You haven\'t logged any finished shifts yet!' });
            }

            const avgDuration = stats.totalDuration / stats.totalShifts;

            const embed = new EmbedBuilder()
                .setTitle(`📊 Shift Profile: ${interaction.user.username}`)
                .setColor('#2F3136')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '🔢 Total Shifts Count', value: `${stats.totalShifts}`, inline: false },
                    { name: '⏳ Avg Shift Duration', value: formatDuration(avgDuration), inline: false },
                    { name: '🏆 Leaderboard Rank', value: rank > 0 ? `#${rank}` : 'Unranked', inline: false },
                    { name: '🌊 Current Wave Time', value: formatDuration(stats.currentWaveDuration), inline: false }
                )
                .setFooter({ text: 'Stats refresh every Friday wave reset' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }
    }
    if (commandName === 'shiftadmin') {
        const subcommand = interaction.options.getSubcommand?.();
        const target = interaction.options.getUser('target');
        const minutes = interaction.options.getInteger('minutes');

        if (!target || !Number.isInteger(minutes)) {
            return interaction.reply({ content: '❌ Please provide a valid target and minute amount.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const msChange = minutes * 60 * 1000;

        try {
            if (subcommand === 'timeadd') {
                await UserShiftStats.findOneAndUpdate(
                    { userId: target.id },
                    { $inc: { totalDuration: msChange, currentWaveDuration: msChange } },
                    { upsert: true }
                );
                return interaction.editReply({ content: `✅ Added **${minutes}** minutes to ${target.username}'s balance.` });
            }

            if (subcommand === 'timededuct') {
                await UserShiftStats.findOneAndUpdate(
                    { userId: target.id },
                    { $inc: { totalDuration: -msChange, currentWaveDuration: -msChange } },
                    { upsert: true }
                );
                return interaction.editReply({ content: `✅ Deducted **${minutes}** minutes from ${target.username}'s balance.` });
            }

            if (subcommand === 'wipe') {
                const waveNo = interaction.options.getInteger('wave_no');
                await UserShiftStats.updateMany({}, { $set: { currentWaveDuration: 0, currentWaveShifts: 0 } });
                return interaction.editReply({ content: `🧹 Shift activity stats for **Wave #${waveNo}** have been completely wiped.` });
            }
        } catch (error) {
            console.error('Database Error during /shiftadmin execution:', error);
            return interaction.editReply({ content: `❌ Database error: \`${error.message}\`` });
        }
    }

    if (commandName === 'config-roles-department' || commandName === 'config-roles-department-old') {
        const roleType = interaction.options.getString('role_type');
        const roleOption = interaction.options.getRole('role');

        try {
            await DepartmentRoles.findOneAndUpdate(
                { guildID: interaction.guild.id },
                {
                    $set: {
                        [`departments.${roleType}`]: roleOption.id,
                    },
                },
                { upsert: true, returnDocument: 'after' }
            );

            return interaction.reply({ content: `✅ Successfully configured the **${roleType}** role to <@&${roleOption.id}>.`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Database Error during /config-roles-department execution:', error);
            return interaction.reply({ content: `❌ Database error: \`${error.message}\``, flags: MessageFlags.Ephemeral });
        }
    }

    if (commandName === 'config-department-channel' || commandName === 'config-channels-department') {
        const department = interaction.options.getString('department');
        const channel = interaction.options.getChannel('channel');

        if (!department || !channel) {
            return interaction.reply({ content: '❌ Please provide both a department and a channel.', flags: MessageFlags.Ephemeral });
        }

        try {
            await DepartmentRoles.findOneAndUpdate(
                { guildID: interaction.guild.id },
                {
                    $set: {
                        [`channels.${department}`]: channel.id,
                    },
                },
                { upsert: true, returnDocument: 'after' }
            );
            
            if (department === 'dispatch') {
                await channel.send('🚨 This is the dispatch channel. All 911 calls will be sent here.');
            }

            return interaction.reply({ content: `✅ Successfully configured the **${department}** channel to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Database Error during /config-department-channel execution:', error);
            return interaction.reply({ content: `❌ Database error: \`${error.message}\``, flags: MessageFlags.Ephemeral });
        }
    }

    if (commandName === '911') {
        const callType = interaction.options.getString('type');
        const location = interaction.options.getString('location');
        const description = interaction.options.getString('description');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const call = await Call.create({
                type: callType,
                location,
                description,
                guildID: interaction.guild.id,
                callerID: interaction.user.id,
            });

            const deptConfig = await DepartmentRoles.findOne({ guildID: interaction.guild.id });
            if (!deptConfig || !deptConfig.channels || !deptConfig.channels.dispatch) {
                return interaction.editReply({ content: '❌ Dispatch channel is not configured. Please contact an administrator.' });
            }

            const departmentChannelId = deptConfig.channels.dispatch;
            const dispatchChannel = interaction.guild.channels.cache.get(departmentChannelId);

            if (!dispatchChannel) {
                return interaction.editReply({ content: '❌ Dispatch channel is not found. Please contact an administrator.' });
            }

            const embed = new EmbedBuilder()
                .setTitle('🚨 New 911 Call')
                .setDescription(`An emergency call has been made by <@${interaction.user.id}>.`)
                .addFields(
                    { name: 'Type', value: callType, inline: false },
                    { name: 'Location', value: location, inline: false },
                    { name: 'Description', value: description, inline: false },
                    { name: 'Call ID', value: `\`${call._id.toString()}\``, inline: false },
                    { name: 'Caller', value: `<@${interaction.user.id}>`, inline: false },
                    { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                    { name: 'Status', value: 'open', inline: false }
                )
                .setColor('#FF0000')
                .setTimestamp()
                .setFooter({ text: '911 Dispatch System Brought to you by Mahad Amin', iconURL: interaction.client.user.displayAvatarURL() });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`claim_call_${call._id}`).setLabel('Claim Call').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`close_call_${call._id}`).setLabel('Close Call').setStyle(ButtonStyle.Danger)
            );

            await dispatchChannel.send({ embeds: [embed], components: [row] });

            // Send notification DM to caller safely
            try {
                const notifyEmbed = new EmbedBuilder()
                    .setTitle('🚨 911 Call Made! Dispatch Notified')
                    .setDescription(`Your 911 call made on <t:${Math.floor(Date.now() / 1000)}:F> has been dispatched to the appropriate department.`)
                    .addFields(
                        { name: 'Type', value: callType, inline: false },
                        { name: 'Location', value: location, inline: false },
                        { name: 'Description', value: description, inline: false },
                        { name: 'Call ID', value: `\`${call._id.toString()}\``, inline: false },
                        { name: 'Status', value: 'open', inline: false }
                    )
                    .setAuthor({ name: 'Police Department Dispatch', url: 'https://kommodo.ai/i/eLLckpEoE5AJEhjeV1p3' })
                    .setThumbnail('https://kommodo.ai/i/udasvr7YBgJX1LGgcu8p')
                    .setColor('#FF0000')
                    .setTimestamp()
                    .setFooter({ text: '911 Dispatch System', iconURL: interaction.client.user.displayAvatarURL() });

                await interaction.user.send({ embeds: [notifyEmbed] });
            } catch (dmErr) {
                // Most common cause: user has DMs disabled in their privacy settings
                console.error(`[911] Failed to DM caller ${interaction.user.id} (${interaction.user.username}):`, dmErr.message);
            }

            return interaction.editReply({ content: '✅ Your 911 call has been dispatched to the appropriate department.' });

        } catch (error) {
            console.error('Database Error during /911 execution:', error);
            return interaction.editReply({ content: `❌ Database error: \`${error.message}\`` });
        }
    }

    if (commandName === 'ask-ai') {
    const question = interaction.options.getString('question');

    if (!question) {
        return interaction.reply({
            content: '❌ Please provide a question.',
            flags: MessageFlags.Ephemeral
        });
    }

   
    try {
        await interaction.deferReply();
    } catch (err) {
        console.error('Failed to defer reply:', err);
        return;
    }

    try {
        const thinkingEmbed = new EmbedBuilder()
            .setAuthor({ name: '🤖 AI Response', iconURL: interaction.client.user.displayAvatarURL() })
            .setDescription('Thinking...')
            .setColor('#5865F2')
            .setTimestamp();

        await interaction.editReply({ embeds: [thinkingEmbed] });

        const primaryModel = 'gemini-2.5-flash';
        const fallbackModel = 'gemini-2.5-flash-lite';

        
        const requestPayload = {
            contents: [{ role: 'user', parts: [{ text: question }] }],
            config: { systemInstruction: 'You are a helpful assistant.' }
        };

        let streamResponse;

        try {
            streamResponse = await ai.models.generateContentStream({
                model: primaryModel,
                ...requestPayload
            });
        } catch (error) {
            if (error.status === 400) throw error;

            console.warn(`[WARNING] Primary model (${primaryModel}) failed. Status: ${error.status || 'Unknown'}`);
            console.log(`Initiating fallback stream to: ${fallbackModel}...`);

            streamResponse = await ai.models.generateContentStream({
                model: fallbackModel,
                ...requestPayload
            });
        }

      
        await streamText(interaction, streamResponse);

    } catch (error) {
        console.error('AI Error:', error);

        const errorEmbed = new EmbedBuilder()
            .setAuthor({ name: '🤖 AI Response', iconURL: interaction.client.user.displayAvatarURL() })
            .setColor('#FF0000')
            .setTimestamp();

        if (error?.status === 429) {
            errorEmbed.setDescription('⚠️ Gemini quota exhausted on all systems. Please try again later.');
        } else if (error?.status === 400) {
            errorEmbed.setDescription('❌ The AI cannot process this specific question (Invalid request or safety block).');
        } else {
            errorEmbed.setDescription('❌ An unexpected error occurred while processing your AI request.');
        }

       
        return interaction.editReply({ embeds: [errorEmbed] }).catch(async () => {
            await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral }).catch(() => {});
        });
    }
}

     if (commandName === 'view-leaderboard') {
    await interaction.deferReply();

    try {
        const topStaff = await UserShiftStats.find({})
            .sort({ totalDuration: -1 })
            .limit(15);

        if (!topStaff || topStaff.length === 0) {
            return await interaction.editReply({ 
                content: 'ℹ️ The shift analytics database is empty. No logged shifts found.' 
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Staff Shift Performance Leaderboard')
            .setDescription('Top active staff members ranked by total time worked on duty.')
            .setColor('#FFD700')
            .setTimestamp();

        const leaderboardRows = topStaff.map((data, index) => {
            let rankBadge = `**#${index + 1}**`;
            if (index === 0) rankBadge = '🥇';
            if (index === 1) rankBadge = '🥈';
            if (index === 2) rankBadge = '🥉';

            return `${rankBadge} <@${data.userId}> — **${formatDuration(data.totalDuration)}** worked *(${data.totalShifts} shifts)*`;
        }).join('\n');

        embed.addFields({ name: '🏆 Top Duty Durations', value: leaderboardRows, inline: false });

        return await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Database Error loading shift leaderboard:', error);
        return await interaction.editReply({ 
            content: '❌ An error occurred while compiling the shift leaderboard metrics.' 
        });
    }
}

else if (commandName === 'ticket-pannel') {
    const channel = interaction.options.getChannel('channel');

    if (!channel || channel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: '❌ Please provide a valid text channel.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Panel')
        .setDescription('Click the button below to create a support ticket. Our team will assist you shortly.')
        .setColor('#00AAFF')
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
    );

    try {
        await channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: `✅ Ticket panel successfully created in <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
    } catch (error) {
        console.error('Error sending ticket panel message:', error);
        return interaction.reply({ content: '❌ Failed to send the ticket panel message. Please check my permissions.', flags: MessageFlags.Ephemeral });
    }
}
}
}



module.exports = { handleInteraction }