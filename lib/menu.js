const config = require('../config');

const PFP = config.PFP_URL;

const MENUS = {
  anti: [
    'antilink', 'antispam', 'antibadword', 'antimention',
    'antiflood', 'antibot', 'antitag', 'antidelete',
    'antiedit', 'antipromote', 'antidemote', 'antivirus',
    'antiscam', 'antiraid', 'antigroupcall', 'antichannel',
    'antisticker', 'antimedia', 'antireact', 'antipoll'
  ],

  group: [
    'welcome', 'goodbye', 'setwelcome', 'setgoodbye',
    'groupinfo', 'grouplink', 'tagall', 'hidetag',
    'admins', 'listonline'
  ],

  moderator: [
    'kick', 'add', 'promote', 'demote', 'mute',
    'unmute', 'warn', 'unwarn', 'warnings', 'resetwarn'
  ],

  auto: [
    'autoread', 'autotyping', 'autorecording', 'autobio',
    'autoreact', 'autostatus', 'autodownload', 'autosticker',
    'autoviewonce', 'autoblock'
  ],

  botsettings: [
    'prefix', 'mode', 'setname', 'setbio', 'setpp',
    'getpp', 'chatbot', 'anticall', 'timezone', 'settings'
  ],

  owner: [
    'owner', 'restart', 'shutdown', 'broadcast', 'join',
    'leave', 'block', 'unblock', 'ban', 'unban',
    'update', 'getfile', 'save', 'sessions', 'clearsession',
    'setowner', 'botinfo', 'setmenu', 'setprefix', 'setmode'
  ],

  game: [
    'tictactoe', 'quiz', 'trivia', 'math',
    'guessnumber', 'riddle', 'wordchain', 'coinflip',
    'dice', 'hangman'
  ],

  fun: [
    'joke', 'quote', 'fact', 'compliment', 'insult',
    'ship', 'rate', '8ball', 'truth', 'dare'
  ],

  ai: [
    'ai', 'ask', 'code', 'translate',
    'summarize', 'write', 'resetai'
  ]
};

function formatCommands(commands, prefix) {
  return commands
    .map((command, index) =>
      `  ${String(index + 1).padStart(2, '0')}. ${prefix}${command}`
    )
    .join('\n');
}

function header() {
  return [
    '╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮',
    '┃       ✦ ᴺᴬʸᴬ ᴮᴼᵀ ✦       ┃',
    '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
    '',
    `✧ ᴰᴱⱽᴱᴸᴼᴾᴱᴿ : ${config.DEVELOPER}`,
    `✧ ⱽᴱᴿˢᴵᴼᴺ   : 1.0.0`,
    `✧ ᴾᴿᴱᶠᴵˣ    : ${config.PREFIX}`,
    `✧ ᴹᴼᴰᴱ      : ᴾᵁᴮᴸᴵᶜ`,
    `✧ ᵀᴵᴹᴱᶻᴼᴺᴱ  : ${config.TIMEZONE}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n');
}

function categoryMenu(category) {
  const commands = MENUS[category];

  if (!commands) {
    return '❌ ᴹᴱᴺᵁ ᶜᴬᵀᴱᴳᴼᴿʸ ᴺᴼᵀ ᶠᴼᵁᴺᴰ.';
  }

  const title = category.toUpperCase();

  // Convert title to tiny style
  const tinyTitle = title.split('').map(c => {
    const map = { A:'ᴬ', B:'ᴮ', C:'ᶜ', D:'ᴰ', E:'ᴱ', F:'ᶠ', G:'ᴳ', H:'ᴴ', I:'ᴵ', J:'ᴶ', K:'ᴷ', L:'ᴸ', M:'ᴹ', N:'ᴺ', O:'ᴼ', P:'ᴾ', Q:'ᵠ', R:'ᴿ', S:'ˢ', T:'ᵀ', U:'ᵁ', V:'ⱽ', W:'ᵂ', X:'ˣ', Y:'ʸ', Z:'ᶻ', ' ':' ' };
    return map[c] || c;
  }).join('');

  return [
    header(),
    `╭━━〔 ✦ ${tinyTitle} ᴹᴱᴺᵁ 〕`,
    formatCommands(commands, config.PREFIX),
    '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
    '',
    `ᵀᴼᵀᴬᴸ: ${commands.length} ᶜᴼᴹᴹᴬᴺᴰˢ`,
    '✦ ᴾᴼᵂᴱᴿᴱᴰ ᴮʸ ᶠᴬᶜᴱᴸᴱˢˢ ᵀᴱᶜᴴ'
  ].join('\n');
}

function mainMenu() {
  const categories = [
    ['ᴬᴺᵀᴵ', 'anti'],
    ['ᴳᴿᴼᵁᴾ', 'group'],
    ['ᴹᴼᴰᴱᴿᴬᵀᴼᴿ', 'moderator'],
    ['ᴬᵁᵀᴼ', 'auto'],
    ['ᴮᴼᵀ ˢᴱᵀᵀᴵᴺᴳˢ', 'botsettings'],
    ['ᴼᵂᴺᴱᴿ', 'owner'],
    ['ᴳᴬᴹᴱ', 'game'],
    ['ᶠᵁᴺ', 'fun'],
    ['ᴬᴵ', 'ai']
  ];

  return [
    header(),
    '╭━━〔 ✦ ᴹᴬᴵᴺ ᴹᴱᴺᵁ 〕',
    ...categories.map(([name, key]) =>
      `┃ ✧ ${name.padEnd(15)} → ${config.PREFIX}${key}`
    ),
    '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
    '',
    '✦ ˢᴱᴸᴱᶜᵀ ᴬ ᶜᴬᵀᴱᴳᴼᴿʸ ᵀᴼ ⱽᴵᴱᵂ ᶜᴼᴹᴹᴬᴺᴰˢ.',
    '✦ ᴺᴬʸᴬ ᴮᴼᵀ • ᶠᴬᶜᴱᴸᴱˢˢ ᵀᴱᶜᴴ'
  ].join('\n');
}

async function sendMenu(sock, jid, quoted, category = null) {
  const text = category
    ? categoryMenu(category)
    : mainMenu();

  return sock.sendMessage(
    jid,
    {
      image: { url: PFP },
      caption: text,
      footer: 'ᴺᴬʸᴬ ᴮᴼᵀ • ᶠᴬᶜᴱᴸᴱˢˢ ᵀᴱᶜᴴ'
    },
    quoted ? { quoted } : {}
  );
}

module.exports = {
  MENUS,
  mainMenu,
  categoryMenu,
  sendMenu
};
