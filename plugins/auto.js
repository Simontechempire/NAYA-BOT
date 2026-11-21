const config = require('../../config');

const autoPlugin = [
  {
    name: 'welcome',
    description: 'Toggle group welcome messages',
    group: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.welcome = !data.settings.welcome;
      ctx.db.saveData(data);

      return ctx.reply(
        `╭━━〔 WELCOME SETTINGS 〕\n` +
        `┃ Status: ${data.settings.welcome ? 'ON' : 'OFF'}\n` +
        `╰━━━━━━━━━━━━━━━━━━`
      );
    }
  },

  {
    name: 'goodbye',
    description: 'Toggle group goodbye messages',
    group: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.goodbye = !data.settings.goodbye;
      ctx.db.saveData(data);

      return ctx.reply(
        `╭━━〔 GOODBYE SETTINGS 〕\n` +
        `┃ Status: ${data.settings.goodbye ? 'ON' : 'OFF'}\n` +
        `╰━━━━━━━━━━━━━━━━━━`
      );
    }
  },

  {
    name: 'autostatus',
    description: 'Toggle automatic status viewing',
    owner: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.autoStatus = !data.settings.autoStatus;
      ctx.db.saveData(data);

      return ctx.reply(
        `╭━━〔 AUTO STATUS 〕\n` +
        `┃ Status: ${data.settings.autoStatus ? 'ON' : 'OFF'}\n` +
        `╰━━━━━━━━━━━━━━━━━━`
      );
    }
  },

  {
    name: 'autoreact',
    description: 'Toggle automatic reactions',
    owner: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.autoReact = !data.settings.autoReact;
      ctx.db.saveData(data);

      return ctx.reply(
        `╭━━〔 AUTO REACT 〕\n` +
        `┃ Status: ${data.settings.autoReact ? 'ON' : 'OFF'}\n` +
        `╰━━━━━━━━━━━━━━━━━━`
      );
    }
  },

  {
    name: 'autotyping',
    description: 'Toggle automatic typing indicator',
    owner: true,
    execute: async (ctx) => {
      const data = ctx.db.getData();
      data.settings.autoTyping = !data.settings.autoTyping;
      ctx.db.saveData(data);

      return ctx.reply(
        `╭━━〔 AUTO TYPING 〕\n` +
        `┃ Status: ${data.settings.autoTyping ? 'ON' : 'OFF'}\n` +
        `╰━━━━━━━━━━━━━━━━━━`
      );
    }
  }
];

module.exports = autoPlugin;
