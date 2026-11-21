const config = require('../config');

async function checkForceJoin(bot, userId) {
  if (!bot || !userId) {
    return {
      allowed: false,
      missing: config.FORCE_JOIN
    };
  }

  const missing = [];

  for (const channel of config.FORCE_JOIN) {
    try {
      const chatId = channel.startsWith('@')
        ? channel
        : `@${channel}`;

      const member = await bot.getChatMember(chatId, userId);

      const allowedStatuses = [
        'creator',
        'administrator',
        'member'
      ];

      if (!allowedStatuses.includes(member.status)) {
        missing.push(channel);
      }
    } catch (error) {
      console.error(
        `[FORCE JOIN] Could not verify ${channel}:`,
        error.message
      );

      missing.push(channel);
    }
  }

  return {
    allowed: missing.length === 0,
    missing
  };
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

module.exports = {
  checkForceJoin,
  forceJoinMessage
};
