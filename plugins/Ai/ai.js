const { askAI, resetAI } = require('../../lib/groq');

module.exports = [
  {
    name: 'ai',
    description: 'Chat with NAYA AI',
    execute: async (ctx) => {
      const prompt = ctx.args.join(' ');
      if (!prompt) {
        return ctx.reply('Usage: .ai <your question>');
      }

      try {
        await ctx.reply('🤖 NAYA AI is thinking...');
        const answer = await askAI(ctx.sender, prompt);
        return ctx.reply(answer);
      } catch (error) {
        console.error('[NAYA AI]', error.message);
        return ctx.reply('❌ AI service unavailable. Check your Groq API key.');
      }
    }
  },

  {
    name: 'ask',
    description: 'Ask AI a question',
    execute: async (ctx) => {
      const prompt = ctx.args.join(' ');
      if (!prompt) return ctx.reply('Usage: .ask <question>');

      try {
        const answer = await askAI(ctx.sender, prompt);
        return ctx.reply(answer);
      } catch (error) {
        console.error('[NAYA ASK]', error.message);
        return ctx.reply('❌ Could not get an AI response.');
      }
    }
  },

  {
    name: 'code',
    description: 'AI coding assistant',
    execute: async (ctx) => {
      const prompt = ctx.args.join(' ');
      if (!prompt) {
        return ctx.reply('Usage: .code <coding question>');
      }

      try {
        const answer = await askAI(
          ctx.sender,
          `Act as a helpful programming tutor. Explain clearly and provide code when appropriate:\n${prompt}`
        );

        return ctx.reply(answer);
      } catch (error) {
        console.error('[NAYA CODE]', error.message);
        return ctx.reply('❌ Coding assistant unavailable.');
      }
    }
  },

  {
    name: 'translate',
    description: 'Translate text using AI',
    execute: async (ctx) => {
      const prompt = ctx.args.join(' ');
      if (!prompt) {
        return ctx.reply('Usage: .translate <text> to <language>');
      }

      try {
        const answer = await askAI(
          ctx.sender,
          `Translate this text as requested. Return only the translation:\n${prompt}`
        );

        return ctx.reply(answer);
      } catch (error) {
        console.error('[NAYA TRANSLATE]', error.message);
        return ctx.reply('❌ Translation unavailable.');
      }
    }
  },

  {
    name: 'summarize',
    description: 'Summarize text',
    execute: async (ctx) => {
      const prompt = ctx.args.join(' ');
      if (!prompt) {
        return ctx.reply('Usage: .summarize <text>');
      }

      try {
        const answer = await askAI(
          ctx.sender,
          `Summarize the following clearly and briefly:\n${prompt}`
        );

        return ctx.reply(answer);
      } catch (error) {
        console.error('[NAYA SUMMARY]', error.message);
        return ctx.reply('❌ Summary service unavailable.');
      }
    }
  },

  {
    name: 'write',
    description: 'Generate or improve writing',
    execute: async (ctx) => {
      const prompt = ctx.args.join(' ');
      if (!prompt) {
        return ctx.reply('Usage: .write <what to write>');
      }

      try {
        const answer = await askAI(
          ctx.sender,
          `Help write this content clearly and naturally:\n${prompt}`
        );

        return ctx.reply(answer);
      } catch (error) {
        console.error('[NAYA WRITE]', error.message);
        return ctx.reply('❌ Writing assistant unavailable.');
      }
    }
  },

  {
    name: 'resetai',
    description: 'Reset your AI conversation',
    execute: async (ctx) => {
      resetAI(ctx.sender);
      return ctx.reply('✅ Your NAYA AI conversation has been reset.');
    }
  }
];
