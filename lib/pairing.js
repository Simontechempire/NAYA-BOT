
const crypto = require('crypto');

const config = require('../config');
const db = require('./database');
const {
  normalizeNumber,
  isValidNumber
} = require('./utils');

const {
  requestPairingCode,
  getSession,
  removeSession
} = require('./session');

const pendingPairings = new Map();
const watchedSessions = new WeakSet();

const PAIRING_TIMEOUT = 5 * 60 * 1000;

function createSessionId() {
  return crypto.randomUUID();
}

function saveUsers(users) {
  db.saveUsers(users);
}

function restorePendingPairings() {
  const users = db.getUsers();

  for (const [id, pairing] of Object.entries(
    users.pairingRequests || {}
  )) {
    if (
      pairing.status === 'waiting' &&
      Date.now() - pairing.createdAt < PAIRING_TIMEOUT
    ) {
      pendingPairings.set(id, pairing);
    } else {
      delete users.pairingRequests[id];
    }
  }

  saveUsers(users);
}

function saveConnectedAccount(pairing, session) {
  const users = db.getUsers();

  users.whatsapp ||= {};
  users.linkedAccounts ||= {};

  const account = {
    sessionId: pairing.sessionId,
    number: session.number || pairing.number,
    ownerId: pairing.ownerId,
    status: 'connected',
    connectedAt: Date.now()
  };

  users.whatsapp[pairing.sessionId] = account;
  users.linkedAccounts[pairing.sessionId] = account;

  if (users.pairingRequests) {
    delete users.pairingRequests[pairing.sessionId];
  }

  saveUsers(users);

  pairing.status = 'connected';
  pendingPairings.delete(pairing.sessionId);
}

function watchPairingSession(pairing, session) {
  if (!session?.sock || watchedSessions.has(session.sock)) return;

  watchedSessions.add(session.sock);

  session.sock.ev.on('connection.update', update => {
    if (update.connection === 'open') {
      pairing.status = 'connected';
      saveConnectedAccount(pairing, session);
      console.log(`[PAIRING] Connected: ${pairing.sessionId}`);
    }
  });
}

async function pairNumber(phoneNumber, ownerId = null) {
  const number = normalizeNumber(phoneNumber);

  if (!isValidNumber(number)) {
    throw new Error('Enter a valid phone number with country code.');
  }

  if (!config.PAIRING_ENABLED) {
    throw new Error('WhatsApp pairing is currently disabled.');
  }

  const existing = [...pendingPairings.values()].find(
    item => item.number === number &&
      item.status === 'waiting'
  );

  if (existing) {
    throw new Error('A pairing request already exists for this number.');
  }

  const sessionId = createSessionId();

  const result = await requestPairingCode(sessionId, number);

  const pairing = {
    sessionId,
    number,
    ownerId: ownerId ? String(ownerId) : null,
    createdAt: Date.now(),
    expiresAt: Date.now() + PAIRING_TIMEOUT,
    status: 'waiting'
  };

  pendingPairings.set(sessionId, pairing);

  const users = db.getUsers();

  users.pairingRequests ||= {};
  users.pairingRequests[sessionId] = pairing;

  saveUsers(users);

  const session = getSession(sessionId);

  if (session) {
    watchPairingSession(pairing, session);
  }

  setTimeout(() => {
    const current = pendingPairings.get(sessionId);

    if (current && current.status === 'waiting') {
      pendingPairings.delete(sessionId);

      const latestUsers = db.getUsers();

      if (latestUsers.pairingRequests) {
        delete latestUsers.pairingRequests[sessionId];
        saveUsers(latestUsers);
      }

      const currentSession = getSession(sessionId);

      if (currentSession?.status !== 'connected') {
        removeSession(sessionId);
      }

      console.log(`[PAIRING] Expired: ${sessionId}`);
    }
  }, PAIRING_TIMEOUT).unref();

  return {
    sessionId,
    number,
    code: result.code,
    expiresIn: '5 minutes'
  };
}

function getPairing(sessionId) {
  return pendingPairings.get(String(sessionId)) || null;
}

function getPendingPairings() {
  return [...pendingPairings.values()];
}

function removePairing(sessionId) {
  sessionId = String(sessionId);

  pendingPairings.delete(sessionId);

  const users = db.getUsers();

  if (users.pairingRequests) {
    delete users.pairingRequests[sessionId];
    saveUsers(users);
  }
}

restorePendingPairings();

module.exports = {
  pairNumber,
  getPairing,
  getPendingPairings,
  removePairing
};
      
