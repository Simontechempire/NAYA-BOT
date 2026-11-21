require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const db = require('./lib/database');

const {
  initializeConnections
} = require('./connection');

const {
  startTelegram
} = require('./lib/telegram');

const {
  pairNumber
} = require('./lib/pairing');

const app = express();

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const rateLimits = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  const previous = rateLimits.get(ip) || {
    count: 0,
    reset: now + 60000
  };

  if (now > previous.reset) {
    previous.count = 0;
    previous.reset = now + 60000;
  }

  previous.count++;

  rateLimits.set(ip, previous);

  if (previous.count > 5) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Try again later.'
    });
  }

  next();
}

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    bot: config.BOT_NAME,
    developer: config.DEVELOPER,
    status: 'online',
    time: new Date().toISOString()
  });
});

app.post('/api/pair', rateLimit, async (req, res) => {
  try {
    const number = String(req.body.number || '')
      .replace(/\D/g, '');

    if (number.length < 10 || number.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid phone number with country code.'
      });
    }

    const result = await pairNumber(number, null);

    res.json({
      success: true,
      message: 'Pairing code generated.',
      code: result.code,
      number: result.number,
      sessionId: result.sessionId,
      expiresIn: result.expiresIn
    });

  } catch (error) {
    console.error('[PAIR API]', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Pairing failed.'
    });
  }
});

app.get('/api/status', (req, res) => {
  const users = db.getUsers();
  const sessions = users.whatsapp || {};

  res.json({
    success: true,
    bot: config.BOT_NAME,
    sessions: Object.keys(sessions).length
  });
});

app.use((error, req, res, next) => {
  console.error('[SERVER ERROR]', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error.'
  });
});

async function start() {
  try {
    fs.mkdirSync(config.SESSION_DIR, { recursive: true });

    db.ensureDatabase();

    await initializeConnections();

    startTelegram();

    app.listen(config.PORT, '0.0.0.0', () => {
      console.log(`NAYA BOT dashboard running on port ${config.PORT}`);
    });

  } catch (error) {
    console.error('[STARTUP ERROR]', error);
    process.exit(1);
  }
}

start();
