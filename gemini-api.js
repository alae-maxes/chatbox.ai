/**
 * AI Flow — Google Gemini API Module
 * Handles all API calls to Google Gemini.
 * Uses the Gemini REST API directly.
 */

const GeminiAPI = {
  /**
   * Base URL for Gemini API
   */
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',

  /**
   * Generate content using the Gemini API
   * @param {string} prompt - The user prompt
   * @param {string} model - Model name (gemini-2.0-flash, gemini-2.0-pro, etc.)
   * @param {number} temperature - Temperature (0-1)
   * @param {number} maxTokens - Maximum output tokens
   * @returns {Promise<string>} - Generated text response
   */
  async generate(prompt, model = 'gemini-2.0-flash', temperature = 0.7, maxTokens = 2048) {
    const config = Storage.getAgentConfig();
    if (!config || !config.apiKey) {
      throw new Error('Gemini API key not configured. Please add your API key in AI Agent settings.');
    }

    const apiKey = config.apiKey;
    const url = `${this.BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
        topK: 40
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;

        if (response.status === 400) {
          throw new Error('Invalid request: ' + errorMsg);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API key or permission denied. Please check your Gemini API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 404) {
          throw new Error(`Model "${model}" not found. Please check the model name.`);
        } else {
          throw new Error('Gemini API error: ' + errorMsg);
        }
      }

      const data = await response.json();

      // Extract text from response
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          return candidate.content.parts[0].text || '';
        }
      }

      // Check for safety blocks
      if (data.promptFeedback?.blockReason) {
        throw new Error('Content blocked: ' + data.promptFeedback.blockReason);
      }

      throw new Error('No response generated. The model returned an empty result.');
    } catch (e) {
      if (e.message.startsWith('Gemini API') || e.message.startsWith('Invalid') ||
          e.message.startsWith('Rate') || e.message.startsWith('Model') ||
          e.message.startsWith('Content') || e.message.startsWith('No response')) {
        throw e;
      }
      throw new Error('Network error: ' + e.message);
    }
  },

  /**
   * Stream content using the Gemini API (server-sent events)
   * @param {string} prompt - The user prompt
   * @param {Function} onChunk - Callback for each text chunk
   * @param {string} model - Model name
   * @param {number} temperature - Temperature
   */
  async generateStream(prompt, onChunk, model = 'gemini-2.0-flash', temperature = 0.7) {
    const config = Storage.getAgentConfig();
    if (!config || !config.apiKey) {
      throw new Error('Gemini API key not configured.');
    }

    const apiKey = config.apiKey;
    const url = `${this.BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 4096,
        topP: 0.95,
        topK: 40
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.candidates && data.candidates[0]?.content?.parts) {
                const text = data.candidates[0].content.parts[0]?.text || '';
                if (text) onChunk(text);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }
    } catch (e) {
      throw new Error('Stream error: ' + e.message);
    }
  },

  /**
   * Count tokens for a given text
   * @param {string} text - The text to count tokens for
   * @param {string} model - Model name
   * @returns {Promise<number>} - Token count
   */
  async countTokens(text, model = 'gemini-2.0-flash') {
    const config = Storage.getAgentConfig();
    if (!config || !config.apiKey) {
      throw new Error('Gemini API key not configured.');
    }

    const apiKey = config.apiKey;
    const url = `${this.BASE_URL}/models/${model}:countTokens?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [{ text }]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Token counting failed: HTTP ' + response.status);
    }

    const data = await response.json();
    return data.totalTokens || 0;
  }
};
