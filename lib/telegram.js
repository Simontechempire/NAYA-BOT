const TelegramBot = require('node-telegram-bot-api');

const config = require('../config');
const { pairNumber } = require('./pairing');
const { getAllSessions } = require('./session');
const {
  checkForceJoin,
  forceJoinMessage
} = require('./forcejoin');

let bot = null;

async function verifyUser(chatId, userId) {
  const result = await checkForceJoin(bot, userId);

  if (!result.allowed) {
    await bot.sendMessage(
      chatId,
      forceJoinMessage(result.missing),
      { disable_web_page_preview: true }
    );

    return false;
  }

  return true;
}

function startTelegram() {
  if (!config.TELEGRAM_BOT_TOKEN) {
    console.log('[TELEGRAM] Token missing. Telegram bot disabled.');
    return null;
  }

  bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, {
    polling: true
  });

  bot.onText(/^\/start(?:@\w+)?$/, async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!(await verifyUser(chatId, userId))) return;

    await bot.sendMessage(
      chatId,
      `✦ NAYA BOT ✦\n\nDeveloper: ${config.DEVELOPER}\n\nCommands:\n/pair 234XXXXXXXXXX\n/connect\n/ping\n/status`
    );
  });

  bot.onText(/^\/pair(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!(await verifyUser(chatId, userId))) return;

    const number = (match[1] || '').trim();

    if (!number) {
      return bot.sendMessage(
        chatId,
        'Usage:\n/pair 234XXXXXXXXXX'
      );
    }

    try {
      await bot.sendMessage(chatId, '⏳ Generating your WhatsApp pairing code...');

      const result = await pairNumber(number, userId);

      await bot.sendMessage(
        chatId,
        [
          '╭━━〔 NAYA BOT PAIRING 〕',
          '┃',
          `┃ Number: ${result.number}`,
          `┃ Code: ${result.code}`,
          `┃ Session: ${result.sessionId}`,
          `┃ Expires: ${result.expiresIn}`,
          '┃',
          '╰━━━━━━━━━━━━━━━━━━',
          '',
          'Open WhatsApp → Linked devices → Link a device → Link with phone number.',
          'Enter the code above.'
        ].join('\n')
      );
    } catch (error) {
      await bot.sendMessage(chatId, `❌ ${error.message}`);
    }
  });

  bot.onText(/^\/connect(?:@\w+)?$/, async msg => {
    if (!(await verifyUser(msg.chat.id, msg.from.id))) return;

    await bot.sendMessage(
      msg.chat.id,
      'To connect WhatsApp, send:\n/pair 234XXXXXXXXXX'
    );
  });

  bot.onText(/^\/ping(?:@\w+)?$/, async msg => {
    if (!(await verifyUser(msg.chat.id, msg.from.id))) return;

    await bot.sendMessage(msg.chat.id, '🟢 NAYA BOT is online.');
  });

  bot.onText(/^\/status(?:@\w+)?$/, async msg => {
    if (!(await verifyUser(msg.chat.id, msg.from.id))) return;

    const sessions = getAllSessions();

    const connected = sessions.filter(
      session => session.status === 'connected'
    ).length;

    await bot.sendMessage(
      msg.chat.id,
      [
        '╭━━〔 NAYA BOT STATUS 〕',
        '┃',
        `┃ Active sessions: ${sessions.length}`,
        `┃ Connected: ${connected}`,
        `┃ Developer: ${config.DEVELOPER}`,
        '┃',
        '╰━━━━━━━━━━━━━━━━━━'
      ].join('\n')
    );
  });

  bot.on('polling_error', error => {
    console.error('[TELEGRAM ERROR]', error.message);
  });

  console.log('[TELEGRAM] Bot started.');
  return bot;
}

module.exports = {
  startTelegram
};
