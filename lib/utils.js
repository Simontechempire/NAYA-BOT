const config = require('../config');

function normalizeNumber(number = '') {
  return String(number).replace(/\D/g, '');
}

function getJid(number = '') {
  const clean = normalizeNumber(number);
  return clean ? `${clean}@s.whatsapp.net` : null;
}

function getNumber(jid = '') {
  return String(jid).split('@')[0].split(':')[0];
}

function getPrefix() {
  return config.PREFIX || '.';
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: config.TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function isValidNumber(number = '') {
  const clean = normalizeNumber(number);
  return clean.length >= 10 && clean.length <= 15;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = {
  normalizeNumber,
  getJid,
  getNumber,
  getPrefix,
  formatTime,
  isValidNumber,
  sleep,
  safeJsonParse
};
