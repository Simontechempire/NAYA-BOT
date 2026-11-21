const crypto = require('crypto');

const config = require('../config');
const db = require('./database');
const { normalizeNumber, isValidNumber } = require('./utils');
const { requestPairingCode } = require('./session');

const pendingPairings = new Map();

function createSessionId() {
  return crypto.randomUUID();
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
    item => item.number === number
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
    status: 'waiting'
  };

  pendingPairings.set(sessionId, pairing);

  const users = db.getUsers();

  users.pairingRequests ||= {};
  users.pairingRequests[sessionId] = pairing;

  db.saveUsers(users);

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
    db.saveUsers(users);
  }
}

module.exports = {
  pairNumber,
  getPairing,
  getPendingPairings,
  removePairing
};
