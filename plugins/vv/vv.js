// commands/vv.js - VV / VIEW ONCE MENU by NAYA BOT
// Owner: FACELESS
// How e work: Reply to a View Once message with .vv
// Bot go download am and send am back as normal message

async function getVV(m, F) {
  // Check quoted first, then current msg
  let ctx = m.message?.extendedTextMessage?.contextInfo;
  let quoted = ctx?.quotedMessage;
  // 1. Quoted is viewOnce
  if (quoted?.viewOnceMessage) return { msg: quoted.viewOnceMessage.message, key: { remoteJid: m.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant } };
  if (quoted?.viewOnceMessageV2) return { msg: quoted.viewOnceMessageV2.message, key: { remoteJid: m.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant } };
  // 2. Current msg is viewOnce
  if (m.message?.viewOnceMessage) return { msg: m.message.viewOnceMessage.message, key: m.key };
  if (m.message?.viewOnceMessageV2) return { msg: m.message.viewOnceMessageV2.message, key: m.key };
  // 3. Quoted is image/video with viewOnce flag
  if (quoted?.imageMessage?.viewOnce || quoted?.videoMessage?.viewOnce || quoted?.audioMessage?.viewOnce) return { msg: quoted, key: { remoteJid: m.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant } };
  return null;
}

async function downloadVV(sock, vv, F) {
  // Build fake message for downloadContentFromMessage
  let type = Object.keys(vv.msg)[0];
  let mediaMsg = { message: vv.msg };
  // Use Baileys download via sock - we use helper from function.js if available
  try {
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    let stream = await downloadContentFromMessage(vv.msg[type], type.replace('Message',''));
    let chunks = [];
    for await (let c of stream) chunks.push(c);
    return { buf: Buffer.concat(chunks), type };
  } catch(e) { return { buf: null, type }; }
}

async function sendVV({ reply, sock, from, m, F }, onlyType = null) {
  let vv = await getVV(m, F);
  if (!vv) return reply('👁️ *ᴿᴱᴾᴸʸ ᵀᴼ ᴬ ⱽᴵᴱᵂ ᴼᴺᶜᴱ ᴹᴱˢˢᴬᴳᴱ ᶠᴵᴿˢᵀ!*\n\nᵁˢᴬᴳᴱ: ᴿᴱᴾᴸʸ ᵀᴼ ⱽⱽ ᴾᴴᴼᵀᴼ/ⱽᴵᴰᴱᴼ ᵂᴵᵀᴴ .ⱽⱽ\n\n©️ ᴺᴬʸᴬ ᴮᴼᵀ • ᶠᴬᶜᴱᴸᴱˢˢ ᵀᴱᶜᴴ');
  let { buf, type } = await downloadVV(sock, vv, F);
  if (!buf) return reply('❌ ᶠᴬᴵᴸᴱᴰ ᵀᴼ ᴰᴼᵂᴺᴸᴼᴬᴰ ⱽⱽ. ᵀᴿʸ ᴬᴳᴬᴵᴺ, ᴼᴿ ˢᴱᴺᴰᴱᴿ ᴰᴼᴺ ᴼᴾᴱᴺ ᴬᴹ ᴬᴸᴿᴱᴬᴰʸ.');
  if (onlyType && !type.includes(onlyType)) return reply(`ᵀᴴᴵˢ ⱽⱽ ᴵˢ ${type}, ᴺᴼᵀ ${onlyType}. ᵁˢᴱ .ⱽⱽ ᶠᴼᴿ ᴬᴸᴸ.`);
  let caption = `✅ *ⱽᴵᴱᵂ ᴼᴺᶜᴱ ˢᴬⱽᴱᴰ*\nᵀʸᴾᴱ: ${type}\n\n©️ ᴺᴬʸᴬ ᴮᴼᵀ • ᶠᴬᶜᴱᴸᴱˢˢ ᵀᴱᶜᴴ`;
  if (type === 'imageMessage') return sock.sendMessage(from, { image: buf, caption }, { quoted: m });
  if (type === 'videoMessage') return sock.sendMessage(from, { video: buf, caption }, { quoted: m });
  if (type === 'audioMessage') return sock.sendMessage(from, { audio: buf, mimetype: 'audio/mp4', ptt: true }, { quoted: m });
  return sock.sendMessage(from, { text: caption + '\nˢᴬⱽᴱᴰ ᴮᵁᵀ ᵁᴺᴷᴺᴼᵂᴺ ᵀʸᴾᴱ' }, { quoted: m });
}

module.exports = [
{
  name: 'vv', aliases: ['viewonce', 'saveview', 'readview'], category: 'vv',
  run: async (ctx) => { return sendVV(ctx); }
},
{
  name: 'viewonce', category: 'vv',
  run: async (ctx) => { return sendVV(ctx); }
},
{
  name: 'saveview', category: 'vv',
  run: async (ctx) => { return sendVV(ctx); }
},
{
  name: 'readview', category: 'vv',
  run: async (ctx) => { return sendVV(ctx); }
},
{
  name: 'vvimage', category: 'vv',
  run: async (ctx) => { return sendVV(ctx, 'image'); }
},
{
  name: 'vvvideo', category: 'vv',
  run: async (ctx) => { return sendVV(ctx, 'video'); }
},
{
  name: 'vvaudio', category: 'vv',
  run: async (ctx) => { return sendVV(ctx, 'audio'); }
},
{
  name: 'vvinfo', category: 'vv',
  run: async ({ reply, m, F }) => {
    let vv = await getVV(m, F);
    if (!vv) return reply('👁️ ᴿᴱᴾᴸʸ ᵀᴼ ᴬ ⱽⱽ ᴹᴱˢˢᴬᴳᴱ ᵀᴼ ˢᴱᴱ ᴵᴺᶠᴼ');
    let type = Object.keys(vv.msg)[0];
    let inner = vv.msg[type];
    return reply(`👁️ *ⱽⱽ ᴵᴺᶠᴼ*\n\nᵀʸᴾᴱ: ${type}\nᶜᴬᴾᵀᴵᴼᴺ: ${inner.caption || 'ᴺᴼ ᶜᴬᴾᵀᴵᴼᴺ'}\nⱽᴵᴱᵂ ᴼᴺᶜᴱ: ${inner.viewOnce ? 'ʸᴱˢ' : 'ᴺᴼ'}\nᴹᴵᴹᴱᵀʸᴾᴱ: ${inner.mimetype || 'ᵁᴺᴷᴺᴼᵂᴺ'}\n\nᵁˢᴱ .ⱽⱽ ᵀᴼ ˢᴬⱽᴱ ᴬᴹ`);
  }
},
{
  name: 'vvstatus', category: 'vv',
  run: async ({ reply }) => {
    return reply(`👁️ *ⱽⱽ ˢᵀᴬᵀᵁˢ*\n\nⱽⱽ ˢᴬⱽᴱᴿ ᴵˢ ᴬᶜᵀᴵⱽᴱ ✅\n\nᴴᴼᵂ ᵀᴼ ᵁˢᴱ:\n1. ˢᴼᴹᴱᴼᴺᴱ ˢᴱᴺᴰ ʸᴼᵁ ⱽᴵᴱᵂ ᴼᴺᶜᴱ\n2. ᴿᴱᴾᴸʸ ᴬᴹ ᵂᴵᵀᴴ .ⱽⱽ\n3. ᴮᴼᵀ ᴳᴼ ˢᴱᴺᴰ ᴬᴹ ᴮᴬᶜᴷ ᴬˢ ᴺᴼᴿᴹᴬᴸ ᴾᴴᴼᵀᴼ/ⱽᴵᴰᴱᴼ\n\nᴺᴼ ᴺᴱᴱᴰ ᴼᴾᴱᴺ ᴬᴹ ᴮᴱᶠᴼᴿᴱ - ᴵᶠ ʸᴼᵁ ᴼᴾᴱᴺ ᴬᴹ, ᴱ ᴳᴼ ᴰᴵˢᴬᴾᴾᴱᴬᴿ!`);
  }
},
{
  name: 'vvhelp', category: 'vv',
  run: async ({ reply, prefix }) => {
    return reply(`👁️ *ⱽⱽ ᴴᴱᴸᴾ - ⱽᴵᴱᵂ ᴼᴺᶜᴱ ˢᴬⱽᴱᴿ*\n\n${prefix}vv - ˢᴬⱽᴱ ᴬᴺʸ ⱽⱽ (ᴾᴴᴼᵀᴼ/ⱽᴵᴰᴱᴼ/ᴬᵁᴰᴵᴼ)\n${prefix}vvimage - ˢᴬⱽᴱ ⱽⱽ ᴾᴴᴼᵀᴼ ᴼᴺᴸʸ\n${prefix}vvvideo - ˢᴬⱽᴱ ⱽⱽ ⱽᴵᴰᴱᴼ ᴼᴺᴸʸ\n${prefix}vvaudio - ˢᴬⱽᴱ ⱽⱽ ᴬᵁᴰᴵᴼ ᴼᴺᴸʸ\n${prefix}vvinfo - ˢᴱᴱ ⱽⱽ ᴵᴺᶠᴼ\n${prefix}vvstatus - ᶜᴴᴱᶜᴷ ᴵᶠ ⱽⱽ ᴬᶜᵀᴵⱽᴱ\n\n*ᴵᴹᴾᴼᴿᵀᴬᴺᵀ:*\n• ᴿᴱᴾᴸʸ ᵀᴼ ⱽⱽ ᴹᴱˢˢᴬᴳᴱ, ᴺᴼ ᴼᴾᴱᴺ ᴬᴹ\n• ᴵᶠ ʸᴼᵁ ᴼᴾᴱᴺ ᴬᴹ ᴮᴱᶠᴼᴿᴱ, ᴱ ᴳᴼ ᴰᴵˢᴬᴾᴾᴱᴬᴿ\n• ᴮᴼᵀ ᴹᵁˢᵀ ᴮᴱ ᴵᴺ ˢᴬᴹᴱ ᶜᴴᴬᵀ\n\n©️ ᴺᴬʸᴬ ᴮᴼᵀ • ᶠᴬᶜᴱᴸᴱˢˢ ᵀᴱᶜᴴ`);
  }
},
];
