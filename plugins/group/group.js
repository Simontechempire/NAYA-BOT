const config = require('../../config');

async function getMetadata(ctx) {
  return ctx.sock.groupMetadata(ctx.jid);
}

async function isBotAdmin(ctx) {
  const metadata = await getMetadata(ctx);
  const botJid = ctx.sock.user.id.split(':')[0] + '@s.whatsapp.net';

  return metadata.participants.some(p =>
    p.id === botJid && p.admin
  );
}

async function isGroupAdmin(ctx) {
  const metadata = await getMetadata(ctx);

  return metadata.participants.some(p =>
    p.id === ctx.message.key.participant && p.admin
  );
}

async function requireAdmin(ctx) {
  if (!await isGroupAdmin(ctx)) {
    await ctx.reply('⛔ Only group admins can use this command.');
    return false;
  }

  if (!await isBotAdmin(ctx)) {
    await ctx.reply('⚠️ Make NAYA BOT a group admin first.');
    return false;
  }

  return true;
}

function getTarget(ctx) {
  const mentioned =
    ctx.message.message?.extendedTextMessage
      ?.contextInfo?.mentionedJid?.[0];

  if (mentioned) return mentioned;

  const number = (ctx.args[0] || '').replace(/\D/g, '');

  return number ? `${number}@s.whatsapp.net` : null;
}

async function kick(ctx) {
  if (!await requireAdmin(ctx)) return;

  const target = getTarget(ctx);
  if (!target) return ctx.reply('Tag a member or provide their number.');

  await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], 'remove');
  return ctx.reply('✅ Member removal request completed.');
}

async function add(ctx) {
  if (!await requireAdmin(ctx)) return;

  const number = (ctx.args[0] || '').replace(/\D/g, '');
  if (!number) return ctx.reply('Usage: .add 234XXXXXXXXXX');

  await ctx.sock.groupParticipantsUpdate(
    ctx.jid,
    [`${number}@s.whatsapp.net`],
    'add'
  );

  return ctx.reply('✅ Member invitation request sent.');
}

async function promote(ctx) {
  if (!await requireAdmin(ctx)) return;

  const target = getTarget(ctx);
  if (!target) return ctx.reply('Tag a member to promote.');

  await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], 'promote');
  return ctx.reply('✅ Member promoted.');
}

async function demote(ctx) {
  if (!await requireAdmin(ctx)) return;

  const target = getTarget(ctx);
  if (!target) return ctx.reply('Tag a member to demote.');

  await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], 'demote');
  return ctx.reply('✅ Member demoted.');
}

async function groupinfo(ctx) {
  const metadata = await getMetadata(ctx);

  return ctx.reply(
    `╭━━〔 GROUP INFO 〕\n` +
    `┃ Name: ${metadata.subject}\n` +
    `┃ Members: ${metadata.participants.length}\n` +
    `┃ Owner: ${metadata.owner || 'Not available'}\n` +
    `╰━━━━━━━━━━━━━━`
  );
}

async function grouplink(ctx) {
  if (!await isBotAdmin(ctx)) {
    return ctx.reply('⚠️ Make NAYA BOT a group admin first.');
  }

  const code = await ctx.sock.groupInviteCode(ctx.jid);

  return ctx.reply(`🔗 Group link:\nhttps://chat.whatsapp.com/${code}`);
}

async function tagall(ctx) {
  if (!await requireAdmin(ctx)) return;

  const metadata = await getMetadata(ctx);
  const mentions = metadata.participants.map(p => p.id);

  return ctx.sock.sendMessage(ctx.jid, {
    text: mentions.map(jid => `@${jid.split('@')[0]}`).join('\n'),
    mentions
  });
}

async function hidetag(ctx) {
  if (!await requireAdmin(ctx)) return;

  const metadata = await getMetadata(ctx);
  const mentions = metadata.participants.map(p => p.id);

  return ctx.sock.sendMessage(ctx.jid, {
    text: ctx.text || ' ',
    mentions
  });
}

async function admins(ctx) {
  const metadata = await getMetadata(ctx);

  const list = metadata.participants
    .filter(p => p.admin)
    .map(p => `• @${p.id.split('@')[0]}`);

  return ctx.sock.sendMessage(ctx.jid, {
    text: `╭━━〔 GROUP ADMINS 〕\n${list.join('\n')}\n╰━━━━━━━━━━━━`,
    mentions: metadata.participants
      .filter(p => p.admin)
      .map(p => p.id)
  });
}

async function listonline(ctx) {
  const metadata = await getMetadata(ctx);

  return ctx.reply(
    `WhatsApp does not provide a reliable live online-member list through Baileys.\n\nGroup members: ${metadata.participants.length}`
  );
}

module.exports = [
  { name: 'kick', group: true, execute: kick },
  { name: 'add', group: true, execute: add },
  { name: 'promote', group: true, execute: promote },
  { name: 'demote', group: true, execute: demote },
  { name: 'groupinfo', group: true, execute: groupinfo },
  { name: 'grouplink', group: true, execute: grouplink },
  { name: 'tagall', group: true, execute: tagall },
  { name: 'hidetag', group: true, execute: hidetag },
  { name: 'admins', group: true, execute: admins },
  { name: 'listonline', group: true, execute: listonline }
];
