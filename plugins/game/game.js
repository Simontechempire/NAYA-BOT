const games = new Map();

module.exports = [
  {
    name: 'guess',
    description: 'Guess a number between 1 and 10',
    execute: async (ctx) => {
      const number = Math.floor(Math.random() * 10) + 1;
      games.set(ctx.sender, number);

      return ctx.reply(
        '🎮 GUESSING GAME\n\n' +
        'I picked a number between 1 and 10.\n' +
        'Reply with: .guess <number>'
      );
    }
  },

  {
    name: 'answer',
    description: 'Answer the number guessing game',
    execute: async (ctx) => {
      const answer = Number(ctx.args[0]);
      const correct = games.get(ctx.sender);

      if (!correct) {
        return ctx.reply('Start a game first with .guess');
      }

      if (!Number.isInteger(answer) || answer < 1 || answer > 10) {
        return ctx.reply('Enter a number between 1 and 10.');
      }

      games.delete(ctx.sender);

      return ctx.reply(
        answer === correct
          ? '🎉 Correct! You won!'
          : `❌ Not quite! The number was ${correct}.`
      );
    }
  },

  {
    name: 'coinflip',
    description: 'Flip a virtual coin',
    execute: async (ctx) => {
      const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
      return ctx.reply(`🪙 Result: ${result}`);
    }
  },

  {
    name: 'dice',
    description: 'Roll a virtual dice',
    execute: async (ctx) => {
      const result = Math.floor(Math.random() * 6) + 1;
      return ctx.reply(`🎲 You rolled: ${result}`);
    }
  },

  {
    name: 'rps',
    description: 'Play rock paper scissors',
    execute: async (ctx) => {
      const choices = ['rock', 'paper', 'scissors'];
      const player = (ctx.args[0] || '').toLowerCase();

      if (!choices.includes(player)) {
        return ctx.reply('Usage: .rps rock/paper/scissors');
      }

      const bot = choices[Math.floor(Math.random() * 3)];

      let result = 'Draw!';

      if (
        (player === 'rock' && bot === 'scissors') ||
        (player === 'paper' && bot === 'rock') ||
        (player === 'scissors' && bot === 'paper')
      ) {
        result = 'You win! 🎉';
      } else if (player !== bot) {
        result = 'I win! 🤖';
      }

      return ctx.reply(
        `You: ${player}\nBot: ${bot}\nResult: ${result}`
      );
    }
  },

  {
    name: 'quiz',
    description: 'Answer a general knowledge question',
    execute: async (ctx) => {
      const questions = [
        { q: 'What is the capital of Nigeria?', a: 'abuja' },
        { q: 'How many days are in a week?', a: '7' },
        { q: 'Which planet is known as the Red Planet?', a: 'mars' },
        { q: 'What is 5 + 5?', a: '10' }
      ];

      const item = questions[Math.floor(Math.random() * questions.length)];
      games.set(ctx.sender, item.a);

      return ctx.reply(
        `🧠 QUIZ TIME\n\n${item.q}\n\nAnswer with: .quizanswer <answer>`
      );
    }
  },

  {
    name: 'quizanswer',
    description: 'Submit your quiz answer',
    execute: async (ctx) => {
      const answer = ctx.args.join(' ').toLowerCase().trim();
      const correct = games.get(ctx.sender);

      if (!correct) {
        return ctx.reply('Start a quiz first with .quiz');
      }

      games.delete(ctx.sender);

      return ctx.reply(
        answer === correct
          ? '🎉 Correct answer!'
          : `❌ Incorrect. Correct answer: ${correct}`
      );
    }
  },

  {
    name: 'riddle',
    description: 'Get a random riddle',
    execute: async (ctx) => {
      const riddles = [
        'What has keys but cannot open locks? A piano.',
        'What has hands but cannot clap? A clock.',
        'What gets wetter as it dries? A towel.',
        'What has a neck but no head? A bottle.'
      ];

      const riddle = riddles[Math.floor(Math.random() * riddles.length)];
      return ctx.reply(`🧩 RIDDLE\n\n${riddle}`);
    }
  },

  {
    name: 'choose',
    description: 'Choose randomly between options',
    execute: async (ctx) => {
      const options = ctx.args.join(' ').split('|').map(x => x.trim()).filter(Boolean);

      if (options.length < 2) {
        return ctx.reply('Usage: .choose option1 | option2');
      }

      const choice = options[Math.floor(Math.random() * options.length)];
      return ctx.reply(`🎯 My choice: ${choice}`);
    }
  },

  {
    name: 'mathquiz',
    description: 'Generate a simple maths question',
    execute: async (ctx) => {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;

      games.set(ctx.sender, String(a + b));

      return ctx.reply(
        `🔢 MATH QUIZ\n\nWhat is ${a} + ${b}?\n\nAnswer with: .mathanswer <number>`
      );
    }
  },

  {
    name: 'mathanswer',
    description: 'Submit maths answer',
    execute: async (ctx) => {
      const answer = ctx.args[0];
      const correct = games.get(ctx.sender);

      if (!correct) {
        return ctx.reply('Start a maths quiz first with .mathquiz');
      }

      games.delete(ctx.sender);

      return ctx.reply(
        answer === correct
          ? '🎉 Correct!'
          : `❌ Incorrect. Correct answer: ${correct}`
      );
    }
  }
];
