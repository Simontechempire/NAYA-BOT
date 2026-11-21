
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const db = require('./lib/database');

const {
  initializeConnections,
  getActiveConnections,
  attachSessionHandler
} = require('./connection');

const {
  getSession
} = require('./lib/session');

const {
  startTelegram
} = require('./lib/telegram');

const {
  pairNumber
} = require('./lib/pairing');

const app = express();

app.set('trust proxy', 1);

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ipLimits = new Map();
const numberLimits = new Map();

function checkLimit(store, key, max, duration) {
  const now = Date.now();
  let record = store.get(key);

  if (!record || now > record.reset) {
    record = {
      count: 0,
      reset: now + duration
    };
  }

  record.count++;
  store.set(key, record);

  return record.count <= max;
}

function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';

  if (!checkLimit(ipLimits, ip, 5, 60000)) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Try again later.'
    });
  }

  next();
}

// Remove expired rate-limit records periodically.
setInterval(() => {
  const now = Date.now();

  for (const store of [ipLimits, numberLimits]) {
    for (const [key, value] of store) {
      if (now > value.reset) store.delete(key);
    }
  }
}, 60000).unref();

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
    const number = String(req.body?.number || '')
      .replace(/\D/g, '');

    if (!/^\d{10,15}$/.test(number)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid phone number with country code.'
      });
    }

    // Prevent repeated pairing requests for the same number.
    if (!checkLimit(numberLimits, number, 3, 10 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Too many pairing requests for this number. Try again later.'
      });
    }

    const result = await pairNumber(number, null);

    // Attach command handling to newly paired sessions.
    const session = getSession(result.sessionId);

    if (session) {
      attachSessionHandler(session);
    }

    return res.json({
      success: true,
      message: 'Pairing code generated.',
      code: result.code,
      number: result.number,
      sessionId: result.sessionId,
      expiresIn: result.expiresIn
    });

  } catch (error) {
    console.error('[PAIR API]', error.message);

    return res.status(500).json({
      success: false,
      message: 'Pairing failed. Please try again later.'
    });
  }
});

app.get('/api/status', (req, res) => {
  const active = getActiveConnections();

  res.json({
    success: true,
    bot: config.BOT_NAME,
    totalActive: active.length,
    connected: active.filter(s => s.status === 'connected').length,
    connecting: active.filter(s => s.status === 'connecting').length,
    time: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  console.error('[SERVER ERROR]', error.message);

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
      console.log('╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮');
      console.log('┃       NAYA BOT           ┃');
      console.log('┃     FACELESS TECH        ┃');
      console.log('╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯');
      console.log(`[SERVER] Running on port ${config.PORT}`);
    });

  } catch (error) {
    console.error('[STARTUP ERROR]', error);
    process.exit(1);
  }
}

start();
