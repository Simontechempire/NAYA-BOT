const Groq = require('groq-sdk');
const config = require('../config');

if (!config.GROQ_API_KEY) {
  console.warn('[GROQ] API key not configured in .env');
}

const groq = new Groq({
  apiKey: config.GROQ_API_KEY || 'missing-api-key'
});

const conversations = new Map();

const SYSTEM_PROMPT = `
You are NAYA AI, the AI assistant inside NAYA BOT.
Be helpful, accurate, friendly and concise.
You were developed by FACELESS TECH.
Do not claim to perform actions you cannot perform.
`;

async function askAI(userId, prompt) {
  if (!config.GROQ_API_KEY) {
    throw new Error('Groq API key is missing. Add GROQ_API_KEY to .env.');
  }

  if (!prompt || !String(prompt).trim()) {
    throw new Error('Please enter a message.');
  }

  const id = String(userId);

  if (!conversations.has(id)) {
    conversations.set(id, []);
  }

  const history = conversations.get(id);

  history.push({
    role: 'user',
    content: String(prompt).slice(0, 6000)
  });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-12)
  ];

  try {
    const response = await groq.chat.completions.create({
      model: config.GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1500
    });

    const answer =
      response.choices?.[0]?.message?.content?.trim() ||
      'I could not generate a response. Please try again.';

    history.push({
      role: 'assistant',
      content: answer
    });

    conversations.set(id, history.slice(-12));

    return answer;
  } catch (error) {
    history.pop();
    throw new Error(
      error.message || 'Groq AI request failed.'
    );
  }
}

function resetAI(userId) {
  conversations.delete(String(userId));
  return true;
}

module.exports = {
  askAI,
  resetAI
};
