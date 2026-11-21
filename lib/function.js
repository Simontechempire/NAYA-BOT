const config = require('../config');
const {
  normalizeNumber,
  getJid,
  getNumber,
  formatTime,
  sleep
} = require('./utils');

function getMessageText(message) {
  if (!message) return '';

  const msg =
    message.message?.ephemeralMessage?.message ||
    message.message?.viewOnceMessage?.message ||
    message.message?.viewOnceMessageV2?.message ||
    message.message;

  return (
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    msg?.documentMessage?.caption ||
    msg?.buttonsResponseMessage?.selectedButtonId ||
    msg?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg?.templateButtonReplyMessage?.selectedId ||
    ''
  ).trim();
}

function getSender(message) {
  const jid =
    message?.key?.participant ||
    message?.key?.remoteJid ||
    '';

  return getNumber(jid);
}

function isGroup(message) {
  return String(message?.key?.remoteJid || '').endsWith('@g.us');
}

function isOwner(number) {
  return normalizeNumber(number) ===
    normalizeNumber(config.OWNER_NUMBER);
}

function parseCommand(text) {
  const prefix = config.PREFIX || '.';

  if (!text.startsWith(prefix)) return null;

  const parts = text.slice(prefix.length).trim().split(/\s+/);
  const command = (parts.shift() || '').toLowerCase();

  return {
    command,
    args: parts,
    text: parts.join(' ')
  };
}

async function reply(sock, message, text, options = {}) {
  return sock.sendMessage(
    message.key.remoteJid,
    { text: String(text), ...options },
    { quoted: message }
  );
}

async function sendText(sock, jid, text, options = {}) {
  return sock.sendMessage(jid, {
    text: String(text),
    ...options
  });
}

function getBotName() {
  return config.BOT_NAME;
}

module.exports = {
  getMessageText,
  getSender,
  isGroup,
  isOwner,
  parseCommand,
  reply,
  sendText,
  getBotName,
  getJid,
  getNumber,
  formatTime,
  sleep
};
