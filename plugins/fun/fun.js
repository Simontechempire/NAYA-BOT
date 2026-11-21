const jokes = [
  'Why did the computer go to the doctor? It had a virus! 😂',
  'Why was the JavaScript developer sad? Because he did not know how to null his feelings.',
  'Why do programmers prefer dark mode? Because light attracts bugs! 🐛',
  'Why did the phone wear glasses? It lost its contacts!',
  'What do you call a sleeping bull? A bulldozer!'
];

const quotes = [
  'Great things take time. Keep building.',
  'Your future is created by what you do today.',
  'Small progress is still progress.',
  'Never stop learning. Never stop improving.',
  'Consistency turns dreams into achievements.'
];

const pick = array => array[Math.floor(Math.random() * array.length)];

module.exports = [
  {
    name: 'joke',
    description: 'Get a random joke',
    execute: async ctx => ctx.reply(`😂 JOKE TIME\n\n${pick(jokes)}`)
  },

  {
    name: 'quote',
    description: 'Get an inspirational quote',
    execute: async ctx => ctx.reply(`💡 DAILY QUOTE\n\n${pick(quotes)}`)
  },

  {
    name: 'compliment',
    description: 'Get a friendly compliment',
    execute: async ctx => {
      const messages = [
        'You have great potential. Keep going! 🌟',
        'Your creativity can take you far! 🚀',
        'Keep being curious and learning! 💡',
        'Your effort matters. Keep improving! 👏'
      ];

      return ctx.reply(pick(messages));
    }
  },

  {
    name: 'truth',
    description: 'Get a truth question',
    execute: async ctx => {
      const questions = [
        'What is one goal you want to achieve?',
        'What skill would you love to learn?',
        'What is your favourite memory?',
        'What makes you laugh the most?'
      ];

      return ctx.reply(`🎯 TRUTH\n\n${pick(questions)}`);
    }
  },

  {
    name: 'dare',
    description: 'Get a safe dare',
    execute: async ctx => {
      const dares = [
        'Send a positive message to someone.',
        'Share your favourite song title.',
        'Write three things you appreciate.',
        'Try saying a tongue twister three times.'
      ];

      return ctx.reply(`🎲 DARE\n\n${pick(dares)}`);
    }
  },

  {
    name: '8ball',
    description: 'Ask the magic 8-ball',
    execute: async ctx => {
      if (!ctx.args.length) {
        return ctx.reply('Usage: .8ball <your question>');
      }

      const answers = [
        'Definitely! 🎱',
        'Looks promising!',
        'Maybe. 🤔',
        'Try again later.',
        'I cannot tell right now.'
      ];

      return ctx.reply(`🎱 ${pick(answers)}`);
    }
  },

  {
    name: 'fact',
    description: 'Get a random fact',
    execute: async ctx => {
      const facts = [
        'A day on Venus is longer than its year.',
        'Octopuses have three hearts.',
        'Honey can remain edible for a very long time when stored properly.',
        'The Moon moves away from Earth slowly every year.'
      ];

      return ctx.reply(`🌍 RANDOM FACT\n\n${pick(facts)}`);
    }
  },

  {
    name: 'love',
    description: 'Get a friendly friendship message',
    execute: async ctx => {
      const messages = [
        'Good friendships grow through honesty and respect. ❤️',
        'Kindness makes every connection stronger.',
        'A good friend supports your growth.'
      ];

      return ctx.reply(pick(messages));
    }
  },

  {
    name: 'reverse',
    description: 'Reverse text',
    execute: async ctx => {
      const value = ctx.args.join(' ');

      if (!value) return ctx.reply('Usage: .reverse <text>');

      return ctx.reply(value.split('').reverse().join(''));
    }
  },

  {
    name: 'count',
    description: 'Count characters and words',
    execute: async ctx => {
      const value = ctx.args.join(' ');

      if (!value) return ctx.reply('Usage: .count <text>');

      const words = value.trim().split(/\s+/).length;

      return ctx.reply(
        `📊 TEXT COUNT\n\nWords: ${words}\nCharacters: ${value.length}`
      );
    }
  }
];
