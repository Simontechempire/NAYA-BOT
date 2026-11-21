const config = require('../../config');

module.exports = [
  {
    name: 'prefix',
    description: 'Change bot command prefix',
    owner: true,
    execute: async (ctx) => {
      const prefix = ctx.args[0];

      if (!prefix || prefix.length > 3) {
        return ctx.reply('Usage: .prefix <new-prefix>');
      }

      const data = ctx.db.getData();
      data.settings.prefix = prefix;
      ctx.db.saveData(data);

      return ctx.reply(`✅ Prefix changed to: ${prefix}`);
    }
  },

  {
    name: 'botname',
    description: 'Change bot display name',
    owner: true,
    execute: async (ctx) => {
      const name = ctx.args.join(' ');

      if (!name) {
        return ctx.reply('Usage: .botname NAYA BOT');
      }

      const data = ctx.db.getData();
      data.settings.botName = name;
      ctx.db.saveData(data);

      return ctx.reply(`✅ Bot name changed to: ${name}`);
    }
  },

  {
    name: 'mode',
    description: 'Change bot mode',
    owner: true,
    execute: async (ctx) => {
      const mode = (ctx.args[0] || '').toLowerCase();

      if (!['public', 'private'].includes(mode)) {
        return ctx.reply('Usage: .mode public/private');
      }

      const data = ctx.db.getData();
      data.settings.mode = mode;
      ctx.db.saveData(data);

      return ctx.reply(`✅ Bot mode: ${mode.toUpperCase()}`);
    }
  },

  {
    name: 'welcomeon',
    description: 'Enable welcome messages',
    owner: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.welcome = true;
      ctx.db.saveData(data);
      return ctx.reply('✅ Welcome messages enabled.');
    }
  },

  {
    name: 'welcomeoff',
    description: 'Disable welcome messages',
    owner: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.welcome = false;
      ctx.db.saveData(data);
      return ctx.reply('✅ Welcome messages disabled.');
    }
  },

  {
    name: 'goodbyeon',
    description: 'Enable goodbye messages',
    owner: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.goodbye = true;
      ctx.db.saveData(data);
      return ctx.reply('✅ Goodbye messages enabled.');
    }
  },

  {
    name: 'goodbyeoff',
    description: 'Disable goodbye messages',
    owner: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.goodbye = false;
      ctx.db.saveData(data);
      return ctx.reply('✅ Goodbye messages disabled.');
    }
  },

  {
    name: 'antillink',
    description: 'Enable or disable anti-link',
    owner: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.antiLink = !data.settings.antiLink;
      ctx.db.saveData(data);
      return ctx.reply(`Anti-link: ${data.settings.antiLink ? 'ON' : 'OFF'}`);
    }
  },

  {
    name: 'antispam',
    description: 'Enable or disable anti-spam',
    owner: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.antiSpam = !data.settings.antiSpam;
      ctx.db.saveData(data);
      return ctx.reply(`Anti-spam: ${data.settings.antiSpam ? 'ON' : 'OFF'}`);
    }
  },

  {
    name: 'settings',
    description: 'Show current bot settings',
    owner: true,
    execute: async (ctx) => {
      const s = ctx.db.getData().settings;

      return ctx.reply(
        `╭━━〔 NAYA BOT SETTINGS 〕\n` +
        `┃ Prefix: ${s.prefix}\n` +
        `┃ Mode: ${s.mode}\n` +
        `┃ Name: ${s.botName}\n` +
        `┃ Welcome: ${s.welcome ? 'ON' : 'OFF'}\n` +
        `┃ Goodbye: ${s.goodbye ? 'ON' : 'OFF'}\n` +
        `┃ Anti-link: ${s.antiLink ? 'ON' : 'OFF'}\n` +
        `┃ Anti-spam: ${s.antiSpam ? 'ON' : 'OFF'}\n` +
        `╰━━━━━━━━━━━━━━━━━━`
      );
    }
  }
];
