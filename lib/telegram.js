const TelegramBotModule = require('node-telegram-bot-api');

function resolveTelegramBot(mod) {
  const candidates = [
    mod, mod.default, mod.default?.default,
    mod.TelegramBot, mod.default?.TelegramBot, mod.default?.default?.TelegramBot
  ];
  const TelegramBot = candidates.find(c => typeof c === 'function');
  if (!TelegramBot) throw new Error('Could not find TelegramBot constructor.');
  return TelegramBot;
}
const TelegramBot = resolveTelegramBot(TelegramBotModule);

const config = require('../config');
const db = require('./database');
const { pairNumber } = require('./pairing');
const { getAllSessions } = require('./session');
const { checkForceJoin, forceJoinMessage } = require('./forcejoin');

let bot = null;

async function verifyUser(chatId, userId) {
  const result = await checkForceJoin(bot, userId);
  if (!result.allowed) {
    await bot.sendMessage(chatId, forceJoinMessage(result.missing), { disable_web_page_preview: true });
    return false;
  }
  return true;
}

function getUserSessions(userId) {
  const users = db.getUsers();
  const accounts = users.whatsapp || {};
  return Object.values(accounts).filter(a => String(a.ownerId) === String(userId));
}

function startTelegram() {
  if (bot) return bot;
  if (!config.TELEGRAM_BOT_TOKEN) {
    console.log('[TELEGRAM] Token missing. Bot disabled. Check .env TELEGRAM_BOT_TOKEN');
    return null;
  }

  bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

  bot.onText(/^\/start(?:@\w+)?$/, async msg => {
    try {
      if (!(await verifyUser(msg.chat.id, msg.from.id))) return;
      await bot.sendMessage(msg.chat.id, [
        '✦ NAYA BOT ✦','',
        `Developer: ${config.DEVELOPER}`,'',
        'Available commands:',
        '/pair 234XXXXXXXXXX','/connect','/ping','/status'
      ].join('\n'));
    } catch (e) { console.error('[TELEGRAM START]', e.message); }
  });

  // SIMON ADD - /help na same as /start, so users no go lost
  bot.onText(/^\/help(?:@\w+)?$/, async msg => {
    try {
      if (!(await verifyUser(msg.chat.id, msg.from.id))) return;
      await bot.sendMessage(msg.chat.id, [
        '✦ NAYA BOT ✦','',
        `Developer: ${config.DEVELOPER}`,'',
        'Available commands:',
        '/pair 234XXXXXXXXXX','/connect','/ping','/status'
      ].join('\n'));
    } catch (e) { console.error('[TELEGRAM HELP]', e.message); }
  });

  bot.onText(/^\/pair(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    try {
      if (!(await verifyUser(chatId, userId))) return;
      if (msg.chat.type !== 'private') return bot.sendMessage(chatId, 'Please use /pair in a private chat with this bot.');

      const number = (match[1] || '').trim();
      if (!/^\+?\d{10,15}$/.test(number)) return bot.sendMessage(chatId, 'Usage:\n/pair 234XXXXXXXXXX');

      const normalizedNumber = number.replace(/\D/g, '');
      const accounts = db.getUsers().whatsapp || {};
      const alreadyLinked = Object.values(accounts).some(a => a.number === normalizedNumber && a.status === 'connected');
      if (alreadyLinked) return bot.sendMessage(chatId, 'This number already has a connected NAYA BOT session.');

      await bot.sendMessage(chatId, '⏳ Generating your WhatsApp pairing code...');
      const result = await pairNumber(number, userId);

      // ZENITH ADD - Format code XXXX-XXXX for easy copy
      const formattedCode = result.code ? String(result.code).match(/.{1,4}/g)?.join("-") : result.code;

      await bot.sendMessage(chatId, [
        '╭━━〔 NAYA BOT PAIRING 〕','┃',
        `┃ Number: ${result.number}`,
        `┃ Code: ${formattedCode}`,
        `┃ Expires: ${result.expiresIn}`,'┃',
        '╰━━━━━━━━━━━━━━━━━━','',
        'Open WhatsApp → Linked devices',
        'Choose Link with phone number',
        'Enter the code above.','',
        'Never share your pairing code.'
      ].join('\n'));
    } catch (error) {
      console.error('[TELEGRAM PAIR]', error.message);
      await bot.sendMessage(chatId, `❌ ${error.message}`);
    }
  });

  bot.onText(/^\/connect(?:@\w+)?$/, async msg => {
    try {
      if (!(await verifyUser(msg.chat.id, msg.from.id))) return;
      await bot.sendMessage(msg.chat.id, 'To connect WhatsApp, send:\n/pair 234XXXXXXXXXX');
    } catch (e) { console.error('[TELEGRAM CONNECT]', e.message); }
  });

  bot.onText(/^\/ping(?:@\w+)?$/, async msg => {
    try {
      if (!(await verifyUser(msg.chat.id, msg.from.id))) return;
      await bot.sendMessage(msg.chat.id, '🟢 NAYA BOT is online.');
    } catch (e) { console.error('[TELEGRAM PING]', e.message); }
  });

  bot.onText(/^\/status(?:@\w+)?$/, async msg => {
    try {
      if (!(await verifyUser(msg.chat.id, msg.from.id))) return;
      const userSessions = getUserSessions(msg.from.id);
      const activeSessions = getAllSessions();
      const connected = userSessions.filter(a => {
        const s = activeSessions.find(x => x.id === a.sessionId);
        return s?.status === 'connected';
      }).length;
      await bot.sendMessage(msg.chat.id, [
        '╭━━〔 YOUR NAYA STATUS 〕','┃',
        `┃ Your sessions: ${userSessions.length}`,
        `┃ Connected: ${connected}`,
        `┃ Developer: ${config.DEVELOPER}`,'┃',
        '╰━━━━━━━━━━━━━━━━━━'
      ].join('\n'));
    } catch (e) { console.error('[TELEGRAM STATUS]', e.message); }
  });

  bot.on('polling_error', error => {
    // FIX: Don't spam log for 409 conflict - means bot dey run twice
    if (error.message.includes('409')) console.error('[TELEGRAM ERROR] Bot running in 2 places! Stop one.');
    else console.error('[TELEGRAM ERROR]', error.message);
  });

  console.log('[TELEGRAM] Bot started.');
  return bot;
}

module.exports = { startTelegram };
