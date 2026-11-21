
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
const reconnectTimers = new Map();
const stoppedSessions = new Set();

const logger = pino({ level: 'silent' });

// Connection.js registers the message handler here.
let onSessionCreated = null;

function setSessionCreatedHandler(callback) {
  onSessionCreated = typeof callback === 'function'
    ? callback
    : null;
}

function getSessionPath(sessionId) {
  return path.join(
    process.cwd(),
    config.SESSION_DIR,
    String(sessionId)
  );
}

async function startSession(sessionId, options = {}) {
  sessionId = String(sessionId);

  stoppedSessions.delete(sessionId);

  if (reconnectTimers.has(sessionId)) {
    clearTimeout(reconnectTimers.get(sessionId));
    reconnectTimers.delete(sessionId);
  }

  if (activeSessions.has(sessionId)) {
    return activeSessions.get(sessionId);
  }

  if (startingSessions.has(sessionId)) {
    return startingSessions.get(sessionId);
  }

  const promise = createSession(sessionId, options);
  startingSessions.set(sessionId, promise);

  try {
    return await promise;
  } finally {
    startingSessions.delete(sessionId);
  }
}

async function createSession(sessionId, options = {}) {
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

  // Attach message handling to every newly created socket.
  try {
    onSessionCreated?.(session);
  } catch (error) {
    console.error('[SESSION] Handler attachment failed:', error.message);
  }

  sock.ev.on('connection.update', update => {
    const { connection, lastDisconnect } = update;

    if (activeSessions.get(sessionId) !== session) return;

    if (connection === 'open') {
      session.status = 'connected';

      const ownJid = sock.user?.id || '';
      const connectedNumber = normalizeNumber(
        ownJid.split('@')[0].split(':')[0]
      );

      if (connectedNumber) {
        session.number = connectedNumber;
      }

      console.log(`[NAYA BOT] Connected: ${sessionId}`);
    }

    if (connection === 'close') {
      session.status = 'disconnected';
      activeSessions.delete(sessionId);

      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      const loggedOut =
        statusCode === DisconnectReason.loggedOut;

      if (loggedOut || stoppedSessions.has(sessionId)) {
        session.status = 'logged out';
        return;
      }

      if (config.AUTO_RECONNECT) {
        const timer = setTimeout(() => {
          reconnectTimers.delete(sessionId);

          if (stoppedSessions.has(sessionId)) return;

          startSession(sessionId, {
            number: session.number,
            ownerId: session.ownerId
          }).catch(error => {
            console.error(
              `[NAYA BOT] Reconnect failed (${sessionId}):`,
              error.message
            );
          });
        }, 3000);

        reconnectTimers.set(sessionId, timer);
        timer.unref?.();
      }

      console.log(`[NAYA BOT] Disconnected: ${sessionId}`);
    }
  });

  return session;
}

async function requestPairingCode(sessionId, phoneNumber) {
  const number = normalizeNumber(phoneNumber);

  if (!/^\d{10,15}$/.test(number)) {
    throw new Error(
      'Enter a valid phone number with country code.'
    );
  }

  const session = await startSession(sessionId, { number });

  if (session.status === 'connected') {
    throw new Error('This session is already connected.');
  }

  const { state } = await useMultiFileAuthState(
    getSessionPath(sessionId)
  );

  if (state.creds.registered) {
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
  stoppedSessions.add(sessionId);

  const timer = reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }

  const session = activeSessions.get(sessionId);

  if (session) {
    activeSessions.delete(sessionId);
    session.status = 'stopped';

    try {
      session.sock.end(undefined);
    } catch (error) {
      console.error('Session shutdown error:', error.message);
    }
  }
}

module.exports = {
  startSession,
  requestPairingCode,
  getSession,
  getAllSessions,
  removeSession,
  activeSessions,
  setSessionCreatedHandler
};
