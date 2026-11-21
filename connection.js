const fs = require('fs');
const path = require('path');

const config = require('./config');
const db = require('./lib/database');

const {
  startSession,
  activeSessions,
  setSessionCreatedHandler
} = require('./lib/session');

const {
  handleMessage,
  loadPlugins
} = require('./lib/handler');

const { getUsers } = db;

let initialized = false;
const attachedSockets = new WeakSet();

function attachSessionHandler(session) {
  if (!session || !session.sock) return;

  const sock = session.sock;

  if (attachedSockets.has(sock)) return;
  attachedSockets.add(sock);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages || []) {
      try {
        await handleMessage(sock, message, session);
      } catch (error) {
        console.error(
          `[HANDLER] Message error (${session.id}):`,
          error.message
        );
      }
    }
  });

  console.log(`[CONNECTION] Handler attached: ${session.id}`);
}

// Automatically attach handlers to every new socket,
// including sockets created during reconnection.
setSessionCreatedHandler(attachSessionHandler);

async function initializeConnections() {
  if (initialized) return;
  initialized = true;

  console.log('╭━━━━━━━━━━━━━━━━━━━━━━╮');
  console.log('┃      NAYA BOT        ┃');
  console.log('┃    FACELESS TECH     ┃');
  console.log('╰━━━━━━━━━━━━━━━━━━━━━━╯');

  fs.mkdirSync(config.SESSION_DIR, { recursive: true });

  loadPlugins();

  const users = getUsers();
  const whatsappUsers = users.whatsapp || {};

  const sessionIds = new Set([
    ...Object.keys(whatsappUsers),
    ...fs.readdirSync(config.SESSION_DIR).filter(name => {
      const fullPath = path.join(config.SESSION_DIR, name);

      try {
        return fs.statSync(fullPath).isDirectory();
      } catch {
        return false;
      }
    })
  ]);

  for (const sessionId of sessionIds) {
    const saved = whatsappUsers[sessionId] || {};

    try {
      await startSession(sessionId, {
        number: saved.number || '',
        ownerId: saved.ownerId || null
      });

      console.log(`[CONNECTION] Restoring: ${sessionId}`);
    } catch (error) {
      console.error(
        `[CONNECTION] Failed (${sessionId}):`,
        error.message
      );
    }
  }

  console.log('[CONNECTION] Initialization complete.');
}

function getActiveConnections() {
  return [...activeSessions.values()];
}

module.exports = {
  initializeConnections,
  getActiveConnections,
  attachSessionHandler
};
  
