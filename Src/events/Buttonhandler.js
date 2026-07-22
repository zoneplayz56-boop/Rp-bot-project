const { ActiveShift, UserShiftStats } = require('../Schemes/shift-scheme.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const { formatDuration } = require('../utils/shifthelper.js');
const Call = require('../Schemes/call.js');
const Config = require('../Schemes/department-role-scheme.js');

module.exports = async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('shift_')) {
        const activeShift = await ActiveShift.findOne({ userId: interaction.user.id });
        if (!activeShift) {
            return interaction.reply({ content: '❌ No active running shift profile found.', flags: MessageFlags.Ephemeral });
        }

        const row = new ActionRowBuilder();
        if (interaction.customId === 'shift_break') {
            if (activeShift.breakStartTime) return interaction.reply({ content: '❌ You are already on a break!', flags: MessageFlags.Ephemeral });

            activeShift.breakStartTime = new Date();
            await activeShift.save();

            row.addComponents(
                new ButtonBuilder().setCustomId('shift_break').setLabel('Break').setEmoji('⏸️').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('shift_resume').setLabel('Resume').setEmoji('▶️').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('shift_end').setLabel('End Shift').setEmoji('🛑').setStyle(ButtonStyle.Danger)
            );

            return interaction.update({ content: '⏸️ Shift paused. You are now on **break**.', components: [row] });
        }

        if (interaction.customId === 'shift_resume') {
            if (!activeShift.breakStartTime) return interaction.reply({ content: '❌ You are not on an active break!', flags: MessageFlags.Ephemeral });

            const breakDuration = Date.now() - activeShift.breakStartTime.getTime();
            activeShift.totalBreakTime += breakDuration;
            activeShift.breakStartTime = null;
            await activeShift.save();

            row.addComponents(
                new ButtonBuilder().setCustomId('shift_break').setLabel('Break').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('shift_resume').setLabel('Resume').setEmoji('▶️').setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('shift_end').setLabel('End Shift').setEmoji('🛑').setStyle(ButtonStyle.Danger)
            );

            return interaction.update({ content: '▶️ Shift **resumed**. Back to work!', components: [row] });
        }

        if (interaction.customId === 'shift_end') {
            const endTime = Date.now();
            const totalShiftTime = endTime - activeShift.startTime.getTime();
            let finalBreakTime = activeShift.totalBreakTime;

            if (activeShift.breakStartTime) {
                finalBreakTime += (endTime - activeShift.breakStartTime.getTime());
            }

            const netShiftDuration = totalShiftTime - finalBreakTime;

            await UserShiftStats.findOneAndUpdate(
                { userId: interaction.user.id },
                {
                    $inc: {
                        totalDuration: netShiftDuration,
                        totalShifts: 1,
                        currentWaveDuration: netShiftDuration,
                        currentWaveShifts: 1
                    }
                },
                { upsert: true }
            );

            await ActiveShift.deleteOne({ userId: interaction.user.id });

            const summaryEmbed = new EmbedBuilder()
                .setTitle('🛑 Shift Finished')
                .setColor('#ED4245')
                .addFields(
                    { name: '⏳ Total Shift Duration', value: formatDuration(netShiftDuration), inline: true },
                    { name: '⏸️ Total Time on Break', value: formatDuration(finalBreakTime), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Shift Summary', iconURL: interaction.client.user.displayAvatarURL() });

            return interaction.update({ content: '✅ Shift log finalized and stored.', embeds: [summaryEmbed], components: [] });
        }
    }

    if (interaction.customId.startsWith('claim_call_')) {
        await interaction.deferUpdate(); // ✅ acknowledge within 3s, buys up to 15 min for the DB/DM work below

        const callId = interaction.customId.split('claim_call_')[1];
        const call = await Call.findById(callId);

        if (!call) {
            return interaction.followUp({ content: '❌ This call no longer exists.', flags: MessageFlags.Ephemeral });
        }

        if (call.status !== 'Open') {
            return interaction.followUp({ content: '❌ This call has already been claimed or closed.', flags: MessageFlags.Ephemeral });
        }

        const config = await Config.findOne({ guildID: interaction.guild.id });
        let requiredRole = null;

        if (call.type === 'police') requiredRole = config?.departments?.police;
        else if (call.type === 'fire') requiredRole = config?.departments?.fire;
        else if (call.type === 'ems') requiredRole = config?.departments?.ems;

        if (!requiredRole) {
            return interaction.followUp({ content: '❌ No role is configured for this department.', flags: MessageFlags.Ephemeral });
        }

        if (!interaction.member.roles.cache.has(requiredRole)) {
            return interaction.followUp({ content: '❌ You do not have the required role to claim this call.', flags: MessageFlags.Ephemeral });
        }

        call.status = 'Claimed';
        call.claimedBy = interaction.user.id;
        await call.save();

        const caller = await interaction.guild.members.fetch(call.callerID).catch(() => null);
        if (caller) {
            const DMembed = new EmbedBuilder()
                .setTitle(`📞 Your 911 Call Was Claimed by ${interaction.user.username}`)
                .setDescription('Your 911 call has been claimed by a member of the appropriate department. Please wait for further assistance.')
                .addFields(
                    { name: 'Type', value: call.type, inline: false },
                    { name: 'Location', value: call.location, inline: false },
                    { name: 'Description', value: call.description, inline: false },
                    { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                    { name: 'Status', value: 'claimed', inline: false },
                    { name: 'Claimed By', value: `<@${interaction.user.id}>`, inline: false }
                )
                .setColor('#00FF00')
                .setTimestamp()
                .setFooter({ text: '911 Dispatch System', iconURL: interaction.client.user.displayAvatarURL() });

            await caller.send({ embeds: [DMembed] }).catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setTitle(`📞 911 Call Claimed by ${interaction.user.username}`)
            .addFields(
                { name: 'Type', value: call.type, inline: false },
                { name: 'Location', value: call.location, inline: false },
                { name: 'Description', value: call.description, inline: false },
                { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                { name: 'Status', value: 'claimed', inline: false },
                { name: 'Claimed By', value: `<@${interaction.user.id}>`, inline: false },
                { name: 'Caller ID', value: `<@${call.callerID}>`, inline: false }
            )
            .setColor('#00FF00')
            .setTimestamp()
            .setFooter({ text: '911 Dispatch System', iconURL: interaction.client.user.displayAvatarURL() });

        return interaction.editReply({ embeds: [embed], components: [] });
    }

    if (interaction.customId.startsWith('close_call_')) {
        await interaction.deferUpdate();

        const callId = interaction.customId.split('close_call_')[1];
        const call = await Call.findById(callId);
        const config = await Config.findOne({ guildID: interaction.guild.id });
        const requiredRole = config?.departments?.dispatch;

        if (!call) {
            return interaction.followUp({ content: '❌ This call no longer exists.', flags: MessageFlags.Ephemeral });
        }

        if (!requiredRole) {
            return interaction.followUp({ content: '❌ No role is configured for dispatch.', flags: MessageFlags.Ephemeral });
        }

        if (!interaction.member.roles.cache.has(requiredRole)) {
            return interaction.followUp({ content: '❌ You do not have the required role to close this call.', flags: MessageFlags.Ephemeral });
        }

        if (call.status !== 'Claimed') {
            return interaction.followUp({ content: '❌ This call has not been claimed yet.', flags: MessageFlags.Ephemeral });
        }

        call.status = 'Closed';
        await call.save();

        const caller = await interaction.guild.members.fetch(call.callerID).catch(() => null);
        if (caller) {
            await caller.send(`Your 911 call has been closed by ${interaction.user.username}. Thank you for your patience.`).catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setTitle(`📞 911 Call Closed by ${interaction.user.username}`)
            .setDescription('This 911 call has been closed by a member of the dispatch team. Call details are attached below.')
            .addFields(
                { name: 'Type', value: call.type, inline: false },
                { name: 'Location', value: call.location, inline: false },
                { name: 'Description', value: call.description, inline: false },
                { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                { name: 'Status', value: 'closed', inline: false },
                { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: false },
                { name: 'Caller ID', value: `<@${call.callerID}>`, inline: false }
            )
            .setColor('#FF0000')
            .setTimestamp()
            .setFooter({ text: '911 Dispatch System', iconURL: interaction.client.user.displayAvatarURL() });

        return interaction.editReply({ embeds: [embed], components: [] });
    }

    if(interaction.customId.startsWith('create_ticket')) 
{
        const ticketType = interaction.customId.split('create_ticket_')[1];
        const guild = interaction.guild;
        const member = interaction.member;
        const staffRoleID= '1528711204648914994';
    
        const existingChannel = guild.channels.cache.find(channel => channel.name === `ticket-${member.user.username.toLowerCase()}`);
        if (existingChannel) {
            return interaction.reply({ content: '❌ You already have an open ticket!', ephemeral: true });
        }

        
        const channelName = `ticket-${member.user.username}`;
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['ViewChannel'],
                },
                {
                    id: member.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory','AttachFiles', 'EmbedLinks', 'AddReactions', 'UseExternalEmojis', 'UseExternalStickers', 'SendMessagesInThreads', 'UseApplicationCommands', 'voice' ],
                },
                {
                    id: staffRoleID,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory','AttachFiles', 'EmbedLinks', 'AddReactions', 'UseExternalEmojis', 'UseExternalStickers', 'SendMessagesInThreads', 'UseApplicationCommands', 'voice' ]
                }
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket Created')
            .setDescription(`Hello ${member}, thank you for creating a ticket. A staff member will assist you shortly.`)
            .setColor('#00FF00')
            .setTimestamp();

        await ticketChannel.send({ content: `<@${member.id}>`, embeds: [embed] });
        await ticketChannel.send({ content: `<@&${staffRoleID}>` });
        await member.send({ content: `✅ Your ticket has been created: ${ticketChannel}`, ephemeral: true });

        return interaction.reply({ content: `✅ Your ticket has been created: ${ticketChannel}`, ephemeral: true });
    }
};
