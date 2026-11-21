
const TelegramBotModule = require('node-telegram-bot-api');

function resolveTelegramBot(mod) {
  const candidates = [
    mod,
    mod.default,
    mod.default?.default,
    mod.TelegramBot,
    mod.default?.TelegramBot,
    mod.default?.default?.TelegramBot
  ];

  const TelegramBot = candidates.find(
    candidate => typeof candidate === 'function'
  );

  if (!TelegramBot) {
    throw new Error(
      'Could not find TelegramBot constructor. Check node-telegram-bot-api installation.'
    );
  }

  return TelegramBot;
}

const TelegramBot = resolveTelegramBot(TelegramBotModule);

const config = require('../config');
const db = require('./database');

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

function getUserSessions(userId) {
  const users = db.getUsers();
  const accounts = users.whatsapp || {};

  return Object.values(accounts).filter(
    account => String(account.ownerId) === String(userId)
  );
}

function startTelegram() {
  if (bot) return bot;

  if (!config.TELEGRAM_BOT_TOKEN) {
    console.log('[TELEGRAM] Token missing. Bot disabled.');
    return null;
  }

  bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, {
    polling: true
  });

  bot.onText(/^\/start(?:@\w+)?$/, async msg => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (!(await verifyUser(chatId, userId))) return;

      await bot.sendMessage(
        chatId,
        [
          '✦ NAYA BOT ✦',
          '',
          `Developer: ${config.DEVELOPER}`,
          '',
          'Available commands:',
          '/pair 234XXXXXXXXXX',
          '/connect',
          '/ping',
          '/status'
        ].join('\n')
      );
    } catch (error) {
      console.error('[TELEGRAM START]', error.message);
    }
  });

  bot.onText(/^\/pair(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      if (!(await verifyUser(chatId, userId))) return;

      if (msg.chat.type !== 'private') {
        return bot.sendMessage(
          chatId,
          'Please use /pair in a private chat with this bot.'
        );
      }

      const number = (match[1] || '').trim();

      if (!/^\+?\d{10,15}$/.test(number)) {
        return bot.sendMessage(
          chatId,
          'Usage:\n/pair 234XXXXXXXXXX'
        );
      }

      const normalizedNumber = number.replace(/\D/g, '');
      const users = db.getUsers();
      const accounts = users.whatsapp || {};

      const alreadyLinked = Object.values(accounts).some(
        account =>
          account.number === normalizedNumber &&
          account.status === 'connected'
      );

      if (alreadyLinked) {
        return bot.sendMessage(
          chatId,
          'This number already has a connected NAYA BOT session.'
        );
      }

      await bot.sendMessage(
        chatId,
        '⏳ Generating your WhatsApp pairing code...'
      );

      const result = await pairNumber(number, userId);

      await bot.sendMessage(
        chatId,
        [
          '╭━━〔 NAYA BOT PAIRING 〕',
          '┃',
          `┃ Number: ${result.number}`,
          `┃ Code: ${result.code}`,
          `┃ Expires: ${result.expiresIn}`,
          '┃',
          '╰━━━━━━━━━━━━━━━━━━',
          '',
          'Open WhatsApp → Linked devices',
          'Choose Link with phone number',
          'Enter the code above.',
          '',
          'Never share your pairing code.'
        ].join('\n')
      );
    } catch (error) {
      console.error('[TELEGRAM PAIR]', error.message);

      await bot.sendMessage(
        chatId,
        `❌ ${error.message}`
      );
    }
  });

  bot.onText(/^\/connect(?:@\w+)?$/, async msg => {
    try {
      if (!(await verifyUser(msg.chat.id, msg.from.id))) return;

      await bot.sendMessage(
        msg.chat.id,
        'To connect WhatsApp, send:\n/pair 234XXXXXXXXXX'
      );
    } catch (error) {
      console.error('[TELEGRAM CONNECT]', error.message);
    }
  });

  bot.onText(/^\/ping(?:@\w+)?$/, async msg => {
    try {
      if (!(await verifyUser(msg.chat.id, msg.from.id))) return;

      await bot.sendMessage(
        msg.chat.id,
        '🟢 NAYA BOT is online.'
      );
    } catch (error) {
      console.error('[TELEGRAM PING]', error.message);
    }
  });

  bot.onText(/^\/status(?:@\w+)?$/, async msg => {
    try {
      if (!(await verifyUser(msg.chat.id, msg.from.id))) return;

      const userSessions = getUserSessions(msg.from.id);
      const activeSessions = getAllSessions();

      const connected = userSessions.filter(account => {
        const session = activeSessions.find(
          item => item.id === account.sessionId
        );

        return session?.status === 'connected';
      }).length;

      await bot.sendMessage(
        msg.chat.id,
        [
          '╭━━〔 YOUR NAYA STATUS 〕',
          '┃',
          `┃ Your sessions: ${userSessions.length}`,
          `┃ Connected: ${connected}`,
          `┃ Developer: ${config.DEVELOPER}`,
          '┃',
          '╰━━━━━━━━━━━━━━━━━━'
        ].join('\n')
      );
    } catch (error) {
      console.error('[TELEGRAM STATUS]', error.message);
    }
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
        
