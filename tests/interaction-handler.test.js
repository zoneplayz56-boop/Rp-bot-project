const test = require('node:test');
const assert = require('node:assert/strict');

const PromotionLog = require('../Src/Schemes/promotion-scheme.js');
const { handleInteraction } = require('../Src/events/Interactionhandler.js');

test('handles /promote by replying with a promotion result', async () => {
  const calls = [];

  PromotionLog.prototype.save = async function () {
    return { promotionId: 'promotion-case-01' };
  };

  const interaction = {
    isChatInputCommand: () => true,
    inGuild: () => true,
    commandName: 'promote',
    client: {
      user: {
        displayAvatarURL: () => 'https://example.com/avatar.png'
      },
      ws: { ping: 50 },
      uptime: 1000
    },
    options: {
      getUser: (name) => {
        if (name === 'target') return { id: 'target-id', username: 'target-user' };
        if (name === 'moderator') return { id: 'mod-id', username: 'mod-user' };
        return null;
      },
      getString: (name) => {
        if (name === 'reason') return 'test reason';
        return null;
      },
      getRole: () => null
    },
    deferReply: async () => calls.push('deferReply'),
    editReply: async (payload) => {
      calls.push(['editReply', payload]);
    },
    reply: async (payload) => {
      calls.push(['reply', payload]);
    }
  };

  await handleInteraction(interaction);

  assert.ok(calls.some(call => call[0] === 'editReply'), 'expected the handler to edit a reply');
});
