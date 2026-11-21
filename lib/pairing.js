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

// SIMON LOCK - Prevent double-generate when user clicks pair twice fast
const pairingLocks = new Map();

// FIX: WhatsApp code no dey last 5 mins, e dey die for 60s
// Before na 5 * 60 * 1000, na why old dead code dey block new code
const PAIRING_TIMEOUT = 60 * 1000;

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

  // SIMON LOCK - If same number dey generate now, block second one
  if (pairingLocks.has(number)) {
    throw new Error('A pairing request already exists for this number. Wait a few seconds and try again.');
  }

  // FIX: If old pairing don pass 60s, delete am, allow new code
  // Before, e dey block you for full 5 mins with dead code
  const existing = [...pendingPairings.values()].find(
    item => item.number === number &&
      item.status === 'waiting'
  );

  if (existing) {
    if (Date.now() - existing.createdAt > PAIRING_TIMEOUT) {
      pendingPairings.delete(existing.sessionId);
      try { removeSession(existing.sessionId); } catch (e) {}
      const usersDel = db.getUsers();
      if (usersDel.pairingRequests) {
        delete usersDel.pairingRequests[existing.sessionId];
        saveUsers(usersDel);
      }
    } else {
      throw new Error('A pairing request already exists for this number. Wait 60 seconds and try again.');
    }
  }

  // SIMON LOCK - Set lock before generating
  pairingLocks.set(number, true);

  try {
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
      expiresIn: '60 seconds - enter am sharp sharp'
    };
  } finally {
    // SIMON LOCK - Release lock after generate, so next pair fit work
    // ZENITH - Keep lock for 3s extra to prevent instant double-click
    setTimeout(() => pairingLocks.delete(number), 3000).unref();
  }
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
