const fetch = require('node-fetch');
const { PYTHON_API_URL } = require('../config/env');

const predictDisease = async (symptoms, user_id = 'anonymous') => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${PYTHON_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, user_id }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI error (${response.status}): ${errorText}`);
      throw new Error(`AI server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('AI service request timed out');
    }
    throw error;
  }
};

module.exports = { predictDisease };