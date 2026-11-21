require('dotenv').config();

module.exports = {
  BOT_NAME: process.env.BOT_NAME || 'NAYA BOT',
  DEVELOPER: process.env.DEVELOPER || 'FACELESS TECH',

  PREFIX: process.env.PREFIX || '.',
  PORT: Number(process.env.PORT) || 3000,
  TIMEZONE: process.env.TIMEZONE || 'Africa/Lagos',

  OWNER_NUMBER: process.env.OWNER_NUMBER || '',

  SESSION_DIR: './sessions',
  DATABASE: './database/data.json',
  USERS_DATABASE: './database/users.json',

  MODE: 'public',
  MULTI_DEVICE: true,
  AUTO_RECONNECT: true,
  PAIRING_ENABLED: true,

  PFP_URL: 'https://files.catbox.moe/4nbm9j.jpg',

  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',

  FORCE_JOIN: [
    '@simontech2027',
    '@queenbackupchannel',
    '@nayalovebotupdate',
    '@nayalovebot'
  ]
};
