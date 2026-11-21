const os = require('os');
const config = require('../../config');

module.exports = [
  {
    name: 'owner',
    description: 'Show bot owner information',
    execute: async (ctx) => {
      return ctx.reply(
        `╭━━〔 BOT OWNER 〕\n` +
        `┃ Bot: ${config.BOT_NAME}\n` +
        `┃ Developer: ${config.DEVELOPER}\n` +
        `┃ Owner: ${config.OWNER_NUMBER}\n` +
        `╰━━━━━━━━━━━━━━━━━━`
      );
    }
  },

  {
    name: 'runtime',
    description: 'Show bot uptime',
    execute: async (ctx) => {
      const seconds = Math.floor(process.uptime());
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      return ctx.reply(
        `╭━━〔 BOT RUNTIME 〕\n` +
        `┃ Uptime: ${hours}h ${minutes}m\n` +
        `┃ Platform: ${process.platform}\n` +
        `╰━━━━━━━━━━━━━━━━━━`
      );
    }
  },

  {
    name: 'ping',
    description: 'Check bot response',
    execute: async (ctx) => {
      const start = Date.now();
      await ctx.reply('🏓 Pinging...');
      const speed = Date.now() - start;
      return ctx.reply(`Pong! ${speed}ms`);
    }
  },

  {
    name: 'system',
    description: 'Show system information',
    execute: async (ctx) => {
      return ctx.reply(
        `╭━━〔 SYSTEM INFO 〕\n` +
        `┃ OS: ${os.platform()}\n` +
        `┃ Architecture: ${os.arch()}\n` +
        `┃ Node: ${process.version}\n` +
        `┃ Memory: ${Math.round(os.freemem() / 1024 / 1024)} MB free\n` +
        `╰━━━━━━━━━━━━━━━━━━`
      );
    }
  },

  {
    name: 'broadcast',
    description: 'Send a message to all groups',
    owner: true,
    execute: async (ctx) => {
      const message = ctx.args.join(' ');

      if (!message) {
        return ctx.reply('Usage: .broadcast <message>');
      }

      const groups = await ctx.sock.groupFetchAllParticipating();
      let sent = 0;

      for (const jid of Object.keys(groups)) {
        try {
          await ctx.sock.sendMessage(jid, {
            text: `📢 NAYA BOT ANNOUNCEMENT\n\n${message}`
          });
          sent++;
        } catch {}
      }

      return ctx.reply(`✅ Announcement sent to ${sent} groups.`);
    }
  },

  {
    name: 'restart',
    description: 'Restart bot process',
    owner: true,
    execute: async (ctx) => {
      await ctx.reply('♻️ Restarting NAYA BOT...');
      setTimeout(() => process.exit(0), 1000);
    }
  },

  {
    name: 'shutdown',
    description: 'Stop bot process',
    owner: true,
    execute: async (ctx) => {
      await ctx.reply('🛑 NAYA BOT is shutting down...');
      setTimeout(() => process.exit(0), 1000);
    }
  },

  {
    name: 'getjid',
    description: 'Get chat ID',
    execute: async (ctx) => {
      return ctx.reply(`Chat ID:\n${ctx.jid}`);
    }
  },

  {
    name: 'setbio',
    description: 'Update WhatsApp profile bio',
    owner: true,
    execute: async (ctx) => {
      const bio = ctx.args.join(' ');

      if (!bio) {
        return ctx.reply('Usage: .setbio <text>');
      }

      await ctx.sock.updateProfileStatus(bio);
      return ctx.reply('✅ Profile bio updated.');
    }
  },

  {
    name: 'setname',
    description: 'Update WhatsApp profile name',
    owner: true,
    execute: async (ctx) => {
      const name = ctx.args.join(' ');

      if (!name) {
        return ctx.reply('Usage: .setname <name>');
      }

      await ctx.sock.updateProfileName(name);
      return ctx.reply('✅ Profile name updated.');
    }
  },

  {
    name: 'block',
    description: 'Block a WhatsApp contact',
    owner: true,
    execute: async (ctx) => {
      const number = ctx.args[0];

      if (!number) {
        return ctx.reply('Usage: .block <number>');
      }

      const jid = number.replace(/\D/g, '') + '@s.whatsapp.net';
      await ctx.sock.updateBlockStatus(jid, 'block');
      return ctx.reply('✅ Contact blocked.');
    }
  },

  {
    name: 'unblock',
    description: 'Unblock a WhatsApp contact',
    owner: true,
    execute: async (ctx) => {
      const number = ctx.args[0];

      if (!number) {
        return ctx.reply('Usage: .unblock <number>');
      }

      const jid = number.replace(/\D/g, '') + '@s.whatsapp.net';
      await ctx.sock.updateBlockStatus(jid, 'unblock');
      return ctx.reply('✅ Contact unblocked.');
    }
  },

  {
    name: 'clearai',
    description: 'Clear AI chat history',
    execute: async (ctx) => {
      const { resetAI } = require('../../lib/groq');
      resetAI(ctx.sender);
      return ctx.reply('✅ AI chat history cleared.');
    }
  },

  {
    name: 'id',
    description: 'Show sender ID',
    execute: async (ctx) => {
      return ctx.reply(`Your ID:\n${ctx.sender}`);
    }
  }
];
