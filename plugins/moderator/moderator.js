const warnings = new Map();

function getTarget(ctx) {
  const mentioned =
    ctx.message.message?.extendedTextMessage
      ?.contextInfo?.mentionedJid?.[0];

  if (mentioned) return mentioned;

  const number = (ctx.args[0] || '').replace(/\D/g, '');
  return number ? `${number}@s.whatsapp.net` : null;
}

async function getAdmins(ctx) {
  const metadata = await ctx.sock.groupMetadata(ctx.jid);

  const botNumber = ctx.sock.user.id.split(':')[0];
  const botJid = `${botNumber}@s.whatsapp.net`;

  const sender = ctx.message.key.participant;

  const senderAdmin = metadata.participants.some(p =>
    p.id === sender && p.admin
  );

  const botAdmin = metadata.participants.some(p =>
    p.id === botJid && p.admin
  );

  if (!senderAdmin) {
    await ctx.reply('⛔ Only group admins can use this command.');
    return false;
  }

  if (!botAdmin) {
    await ctx.reply('⚠️ Make NAYA BOT a group admin first.');
    return false;
  }

  return true;
}

async function warn(ctx) {
  if (!await getAdmins(ctx)) return;

  const target = getTarget(ctx);
  if (!target) return ctx.reply('Tag a member to warn.');

  const key = `${ctx.jid}:${target}`;
  const count = (warnings.get(key) || 0) + 1;

  warnings.set(key, count);

  return ctx.sock.sendMessage(ctx.jid, {
    text: `⚠️ @${target.split('@')[0]} has received warning ${count}.`,
    mentions: [target]
  });
}

async function unwarn(ctx) {
  if (!await getAdmins(ctx)) return;

  const target = getTarget(ctx);
  if (!target) return ctx.reply('Tag a member.');

  warnings.delete(`${ctx.jid}:${target}`);

  return ctx.reply('✅ Warning record cleared.');
}

async function showWarnings(ctx) {
  const target = getTarget(ctx) || ctx.message.key.participant;
  const count = warnings.get(`${ctx.jid}:${target}`) || 0;

  return ctx.reply(
    `⚠️ @${target.split('@')[0]} has ${count} warning(s).`,
    { mentions: [target] }
  );
}

async function resetwarn(ctx) {
  if (!await getAdmins(ctx)) return;

  warnings.clear();
  return ctx.reply('✅ All warning records cleared.');
}

async function mute(ctx) {
  if (!await getAdmins(ctx)) return;

  await ctx.sock.groupSettingUpdate(ctx.jid, 'announcement');
  return ctx.reply('🔇 Only admins can send messages now.');
}

async function unmute(ctx) {
  if (!await getAdmins(ctx)) return;

  await ctx.sock.groupSettingUpdate(ctx.jid, 'not_announcement');
  return ctx.reply('🔊 All members can send messages now.');
}

async function lock(ctx) {
  if (!await getAdmins(ctx)) return;

  await ctx.sock.groupSettingUpdate(ctx.jid, 'locked');
  return ctx.reply('🔒 Group info editing restricted to admins.');
}

async function unlock(ctx) {
  if (!await getAdmins(ctx)) return;

  await ctx.sock.groupSettingUpdate(ctx.jid, 'unlocked');
  return ctx.reply('🔓 Group info editing allowed for members.');
}

async function pin(ctx) {
  if (!await getAdmins(ctx)) return;

  const quoted = ctx.message.message?.extendedTextMessage
    ?.contextInfo?.stanzaId;

  if (!quoted) return ctx.reply('Reply to a message to pin it.');

  return ctx.reply(
    '⚠️ Pinning requires the original message key. This command is not enabled yet.'
  );
}

async function unpin(ctx) {
  if (!await getAdmins(ctx)) return;

  return ctx.reply(
    '⚠️ Unpinning is not enabled in this version.'
  );
}

module.exports = [
  { name: 'warn', group: true, execute: warn },
  { name: 'unwarn', group: true, execute: unwarn },
  { name: 'warnings', group: true, execute: showWarnings },
  { name: 'resetwarn', group: true, execute: resetwarn },
  { name: 'mute', group: true, execute: mute },
  { name: 'unmute', group: true, execute: unmute },
  { name: 'lock', group: true, execute: lock },
  { name: 'unlock', group: true, execute: unlock },
  { name: 'pin', group: true, execute: pin },
  { name: 'unpin', group: true, execute: unpin }
];
