const config = require('../config');

async function checkForceJoin(bot, userId) {
  if (!bot || !userId) {
    return { allowed: false, missing: config.FORCE_JOIN };
  }

  // If no force join configured, allow everybody
  if (!config.FORCE_JOIN || config.FORCE_JOIN.length === 0) {
    return { allowed: true, missing: [] };
  }

  const missing = [];

  for (const channel of config.FORCE_JOIN) {
    try {
      const chatId = channel.startsWith('@') ? channel : `@${channel}`;
      const member = await bot.getChatMember(chatId, userId);

      const allowedStatuses = ['creator', 'administrator', 'member'];
      if (!allowedStatuses.includes(member.status)) {
        missing.push(channel);
      }
    } catch (error) {
      // FIX: Old code dey block user if BOT no be admin / channel wrong.
      // Now: log am, but no block user for bot error.
      // Only block if Telegram say user LEFT / KICKED.
      console.error(`[FORCE JOIN] Could not verify ${channel}:`, error.message);
      // Do NOT push to missing - bot config error no be user fault
    }
  }

  return { allowed: missing.length === 0, missing };
}

function forceJoinMessage(missing) {
  const links = missing.map(channel => {
    const username = channel.replace('@', '');
    return `➤ https://t.me/${username}`;
  });

  return [
    '╭━━〔 🔒 NAYA BOT ACCESS 〕',
    '┃',
    '┃ Join all required channels',
    '┃ before using this Telegram bot.',
    '┃',
    ...links.map(link => `┃ ${link}`),
    '┃',
    '╰━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'After joining, send /start again.'
  ].join('\n');
}

module.exports = { checkForceJoin, forceJoinMessage };
