const config = require('../../config');

const spamTracker = new Map();
const recentMessages = new Map();

const DEFAULTS = {
  antiLink: false,
  antiSpam: false,
  antiMention: false,
  antiBadword: false
};

const BAD_WORDS = [];

function getText(message) {
  const content = message.message || {};

  return (
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    ''
  ).toLowerCase();
}

function containsLink(text) {
  return /https?:\/\/|www\.|chat\.whatsapp\.com\//i.test(text);
}

function countMentions(message) {
  return (
    message.message?.extendedTextMessage
      ?.contextInfo?.mentionedJid?.length || 0
  );
}

function isAdmin(metadata, jid) {
  return metadata.participants.some(participant =>
    participant.id === jid &&
    ['admin', 'superadmin'].includes(participant.admin)
  );
}

async function checkProtection(sock, message, session, db) {
  const jid = message.key.remoteJid;

  if (!jid?.endsWith('@g.us')) return;
  if (message.key.fromMe) return;

  const sender = message.key.participant;
  if (!sender) return;

  const data = db.getData();
  data.settings ||= {};

  const settings = {
    ...DEFAULTS,
    ...data.settings
  };

  const text = getText(message);

  if (!text) return;

  let metadata;

  try {
    metadata = await sock.groupMetadata(jid);
  } catch {
    return;
  }

  const botJid = sock.user?.id;
  const botIsAdmin = botJid &&
    isAdmin(metadata, botJid);

  const senderIsAdmin = isAdmin(metadata, sender);

  if (senderIsAdmin || !botIsAdmin) return;

  let reason = '';

  // Anti-link
  if (settings.antiLink && containsLink(text)) {
    reason = 'Links are not allowed in this group.';
  }

  // Anti-spam
  if (!reason && settings.antiSpam) {
    const key = `${jid}:${sender}`;
    const now = Date.now();

    const previous = spamTracker.get(key) || [];

    const recent = previous.filter(
      timestamp => now - timestamp < 7000
    );

    recent.push(now);
    spamTracker.set(key, recent);

    if (recent.length >= 5) {
      reason = 'Please stop spamming the group.';
    }
  }

  // Anti-mention
  if (!reason && settings.antiMention) {
    if (countMentions(message) >= 6) {
      reason = 'Excessive mentions are not allowed.';
    }
  }

  // Anti-badword
  if (!reason && settings.antiBadword) {
    if (BAD_WORDS.some(word => text.includes(word))) {
      reason = 'Inappropriate language is not allowed.';
    }
  }

  // Repeated-message detection
  if (!reason && settings.antiSpam) {
    const key = `${jid}:${sender}`;
    const previous = recentMessages.get(key);

    if (previous && previous.text === text) {
      reason = 'Repeated messages are not allowed.';
    }

    recentMessages.set(key, {
      text,
      time: Date.now()
    });
  }

  if (!reason) return;

  try {
    await sock.sendMessage(jid, {
      delete: message.key
    });

    await sock.sendMessage(jid, {
      text: `⚠️ @${sender.split('@')[0]}\n${reason}`,
      mentions: [sender]
    });
  } catch (error) {
    console.error('[ANTI ERROR]', error.message);
  }
}

async function toggleProtection(ctx, setting) {
  if (!ctx.isGroup) {
    return ctx.reply('This command only works in groups.');
  }

  if (!ctx.isOwner) {
    return ctx.reply('Only the bot owner can change this setting.');
  }

  const value = (ctx.args[0] || '').toLowerCase();

  if (!['on', 'off'].includes(value)) {
    return ctx.reply(`Usage: ${config.PREFIX}${setting} on/off`);
  }

  const data = ctx.db.getData();
  data.settings ||= {};
  data.settings[setting] = value === 'on';

  ctx.db.saveData(data);

  return ctx.reply(
    `✅ ${setting} has been turned ${value.toUpperCase()}.`
  );
}

module.exports = [
  {
    name: 'antilink',
    group: true,
    execute: ctx => toggleProtection(ctx, 'antiLink')
  },
  {
    name: 'antispam',
    group: true,
    execute: ctx => toggleProtection(ctx, 'antiSpam')
  },
  {
    name: 'antimention',
    group: true,
    execute: ctx => toggleProtection(ctx, 'antiMention')
  },
  {
    name: 'antibadword',
    group: true,
    execute: ctx => toggleProtection(ctx, 'antiBadword')
  }
];

module.exports.checkProtection = checkProtection;
