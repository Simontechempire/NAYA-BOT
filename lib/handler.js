
const fs = require('fs');
const path = require('path');

const config = require('../config');
const db = require('./database');

const {
  getMessageText,
  getSender,
  isGroup,
  isOwner,
  parseCommand,
  reply
} = require('./function');

const { sendMenu } = require('./menu');

const pluginCache = new Map();

function loadPlugins() {
  const pluginRoot = path.join(__dirname, '../plugins');

  if (!fs.existsSync(pluginRoot)) {
    fs.mkdirSync(pluginRoot, { recursive: true });
  }

  pluginCache.clear();

  const categories = fs.readdirSync(pluginRoot, {
    withFileTypes: true
  });

  for (const category of categories) {
    if (!category.isDirectory()) continue;

    const categoryPath = path.join(pluginRoot, category.name);

    for (const file of fs.readdirSync(categoryPath)) {
      if (!file.endsWith('.js')) continue;

      const filePath = path.join(categoryPath, file);

      try {
        delete require.cache[require.resolve(filePath)];

        const plugin = require(filePath);

        if (Array.isArray(plugin)) {
          for (const command of plugin) {
            if (
              command?.name &&
              typeof command.execute === 'function'
            ) {
              pluginCache.set(command.name.toLowerCase(), command);
            }
          }
        } else if (
          plugin?.name &&
          typeof plugin.execute === 'function'
        ) {
          pluginCache.set(plugin.name.toLowerCase(), plugin);
        } else if (plugin && typeof plugin === 'object') {
          for (const [name, command] of Object.entries(plugin)) {
            if (typeof command === 'function') {
              pluginCache.set(name.toLowerCase(), {
                name,
                execute: command
              });
            } else if (
              command &&
              typeof command.execute === 'function'
            ) {
              pluginCache.set(name.toLowerCase(), command);
            }
          }
        }

        console.log(`[PLUGIN] Loaded: ${category.name}/${file}`);
      } catch (error) {
        console.error(
          `[PLUGIN ERROR] ${category.name}/${file}:`,
          error.message
        );
      }
    }
  }

  console.log(`[PLUGIN] ${pluginCache.size} commands registered.`);
  return pluginCache;
}

function getPlugin(command) {
  return pluginCache.get(String(command).toLowerCase());
}

function getMainOwnerNumber() {
  return String(config.OWNER_NUMBER || '')
    .replace(/\D/g, '');
}

async function handleMessage(sock, message, session) {
  try {
    if (!message?.message || message.key?.fromMe) return;

    const jid = message.key.remoteJid;

    if (!jid || jid === 'status@broadcast') return;

    const sender = getSender(message);
    const text = getMessageText(message);

    if (!sender || !text) return;

    const parsed = parseCommand(text);
    if (!parsed) return;

    const { command, args, text: query } = parsed;

    if (!command) return;

    const data = db.getData();
    const mainOwnerNumber = getMainOwnerNumber();

    const isMainOwner =
      Boolean(mainOwnerNumber) &&
      sender.replace(/\D/g, '') === mainOwnerNumber;

    const isSessionOwner =
      Boolean(session.number) &&
      sender.replace(/\D/g, '') ===
        String(session.number).replace(/\D/g, '');

    const owner = isMainOwner || isSessionOwner;

    if (data.banned?.includes(sender) && !isMainOwner) {
      return reply(
        sock,
        message,
        '⛔ You are banned from using this bot.'
      );
    }

    const settings = data.settings || {};

    if (settings.mode === 'private' && !owner) return;

    const context = {
      sock,
      message,
      session,
      sessionId: session.id,
      sender,
      jid,
      args,
      text: query,
      command,
      isGroup: isGroup(message),
      isOwner: owner,
      isMainOwner,
      isSessionOwner,
      config,
      db,
      reply: (response, options) =>
        reply(sock, message, response, options)
    };

    if (command === 'menu' || command === 'help') {
      return sendMenu(sock, jid, message);
    }

    const menuCategory = [
      'anti',
      'group',
      'moderator',
      'auto',
      'botsettings',
      'owner',
      'game',
      'fun',
      'ai',
      'vv'
    ];

    if (menuCategory.includes(command)) {
      return sendMenu(sock, jid, message, command);
    }

    const plugin = getPlugin(command);

    if (!plugin) {
      return reply(sock, message, `❌ Unknown command: ${command}`);
    }

    if (plugin.mainOwner && !isMainOwner) {
      return reply(
        sock,
        message,
        '⛔ This command is restricted to the main owner.'
      );
    }

    if (plugin.owner && !owner) {
      return reply(
        sock,
        message,
        '⛔ This command is only for the owner.'
      );
    }

    if (plugin.group && !isGroup(message)) {
      return reply(
        sock,
        message,
        '⚠️ This command only works in groups.'
      );
    }

    if (plugin.private && isGroup(message)) {
      return reply(
        sock,
        message,
        '⚠️ Use this command in private chat.'
      );
    }

    await plugin.execute(context);

  } catch (error) {
    console.error('[HANDLER ERROR]', error);

    try {
      await reply(
        sock,
        message,
        '❌ An error occurred while processing this command.'
      );
    } catch {}
  }
}

loadPlugins();

module.exports = {
  handleMessage,
  loadPlugins,
  getPlugin,
  pluginCache
};
      
