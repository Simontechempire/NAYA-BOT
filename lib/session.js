const fs = require('fs');
const path = require('path');
const pino = require('pino');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const config = require('../config');
const { normalizeNumber } = require('./utils');

const activeSessions = new Map();
const startingSessions = new Map();

const logger = pino({ level: 'silent' });

function getSessionPath(sessionId) {
  return path.join(
    process.cwd(),
    config.SESSION_DIR,
    String(sessionId)
  );
}

async function startSession(sessionId, options = {}) {
  sessionId = String(sessionId);

  if (activeSessions.has(sessionId)) {
    return activeSessions.get(sessionId);
  }

  if (startingSessions.has(sessionId)) {
    return startingSessions.get(sessionId);
  }

  const startPromise = createSession(sessionId, options);
  startingSessions.set(sessionId, startPromise);

  try {
    return await startPromise;
  } finally {
    startingSessions.delete(sessionId);
  }
}

async function createSession(sessionId, options) {
  const sessionPath = getSessionPath(sessionId);

  fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } =
    await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['NAYA BOT', 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false
  });

  const session = {
    id: sessionId,
    number: normalizeNumber(options.number || ''),
    ownerId: options.ownerId || null,
    sock,
    status: 'connecting',
    createdAt: Date.now()
  };

  activeSessions.set(sessionId, session);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async update => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      session.status = 'connected';

      const ownJid = sock.user?.id || '';
      const connectedNumber = normalizeNumber(
        ownJid.split('@')[0].split(':')[0]
      );

      if (connectedNumber) {
        session.number = connectedNumber;
      }

      console.log(`[NAYA BOT] Session connected: ${sessionId}`);
    }

    if (connection === 'close') {
      session.status = 'disconnected';

      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      const loggedOut =
        statusCode === DisconnectReason.loggedOut;

      activeSessions.delete(sessionId);

      console.log(
        `[NAYA BOT] Session closed: ${sessionId}`
      );

      if (loggedOut) {
        session.status = 'logged out';
        return;
      }

      if (config.AUTO_RECONNECT) {
        setTimeout(() => {
          startSession(sessionId, options).catch(error => {
            console.error(
              `[NAYA BOT] Reconnect failed (${sessionId}):`,
              error.message
            );
          });
        }, 3000);
      }
    }
  });

  return session;
}

async function requestPairingCode(sessionId, phoneNumber) {
  const number = normalizeNumber(phoneNumber);

  if (number.length < 10 || number.length > 15) {
    throw new Error('Enter a valid phone number with country code.');
  }

  const session = await startSession(sessionId, { number });

  if (session.sock.authState?.creds?.registered) {
    throw new Error('This session is already registered.');
  }

  const code = await session.sock.requestPairingCode(number);

  return {
    sessionId,
    number,
    code: String(code).match(/.{1,4}/g)?.join('-') || code
  };
}

function getSession(sessionId) {
  return activeSessions.get(String(sessionId)) || null;
}

function getAllSessions() {
  return [...activeSessions.values()];
}

function removeSession(sessionId) {
  sessionId = String(sessionId);

  const session = activeSessions.get(sessionId);

  if (session) {
    session.sock.end(undefined);
    activeSessions.delete(sessionId);
  }
}

module.exports = {
  startSession,
  requestPairingCode,
  getSession,
  getAllSessions,
  removeSession,
  activeSessions
};
