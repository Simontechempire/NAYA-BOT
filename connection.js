const fs = require('fs');
const path = require('path');

const config = require('./config');
const db = require('./lib/database');

const {
  startSession,
  activeSessions
} = require('./lib/session');

const {
  handleMessage,
  loadPlugins
} = require('./lib/handler');

const { getUsers } = db;

let initialized = false;

async function initializeConnections() {
  if (initialized) return;
  initialized = true;

  console.log('╭━━━━━━━━━━━━━━━━━━━━━━╮');
  console.log('┃      NAYA BOT        ┃');
  console.log('┃    FACELESS TECH     ┃');
  console.log('╰━━━━━━━━━━━━━━━━━━━━━━╯');

  fs.mkdirSync(config.SESSION_DIR, { recursive: true });

  // Load every plugin category automatically.
  loadPlugins();

  const users = getUsers();
  const whatsappUsers = users.whatsapp || {};

  const sessionIds = new Set([
    ...Object.keys(whatsappUsers),
    ...fs.readdirSync(config.SESSION_DIR)
      .filter(name =>
        fs.statSync(path.join(config.SESSION_DIR, name)).isDirectory()
      )
  ]);

  for (const sessionId of sessionIds) {
    const saved = whatsappUsers[sessionId] || {};

    try {
      const session = await startSession(sessionId, {
        number: saved.number || '',
        ownerId: saved.ownerId || null
      });

      // Attach the handler to this individual WhatsApp session.
      session.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const message of messages || []) {
          await handleMessage(session.sock, message, session);
        }
      });

      console.log(`[CONNECTION] Restoring session: ${sessionId}`);
    } catch (error) {
      console.error(
        `[CONNECTION] Failed to restore ${sessionId}:`,
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
  getActiveConnections
};
