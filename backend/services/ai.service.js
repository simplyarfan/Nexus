/**
 * CENTRALIZED AI SERVICE
 * Uses HuggingFace Router (OpenAI-compatible endpoint)
 * Model: meta-llama/Llama-3.2-3B-Instruct
 */

class AIService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.model = 'meta-llama/Llama-3.2-3B-Instruct';
    this.apiUrl = 'https://router.huggingface.co/v1/chat/completions';
  }

  /**
   * Send a chat completion request via HuggingFace Router
   * @param {string} prompt - The user prompt
   * @param {Object} options - Optional settings
   * @returns {Promise<string>} - The AI response text
   */
  async chatCompletion(prompt, options = {}) {
    const { temperature = 0.7, maxTokens = 4000, systemPrompt = null } = options;

    if (!this.apiKey) {
      throw new Error('HUGGINGFACE_API_KEY is not configured');
    }

    // Build messages array for OpenAI-compatible API
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: 0.95,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HuggingFace API error:', errorText);

      // Check if model is loading (503)
      if (response.status === 503) {
        try {
          const data = JSON.parse(errorText);
          const estimatedTime = data.estimated_time || 30;
          console.log(`  ⏳ Model is loading, waiting ${estimatedTime} seconds...`);
          await this.sleep(estimatedTime * 1000);
          return this.chatCompletion(prompt, options); // Retry
        } catch {
          // Couldn't parse, just throw
        }
      }

      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // OpenAI-compatible format: result.choices[0].message.content
    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message?.content || '';
    }

    console.error('Unexpected API response format:', result);
    return '';
  }

  /**
   * Extract JSON from AI response (handles markdown code blocks)
   * @param {string} response - Raw AI response
   * @returns {Object} - Parsed JSON object
   */
  extractJson(response) {
    // Clean response (remove markdown code blocks if present)
    let cleanedResponse = response
      .replace(/```json\n/g, '')
      .replace(/```\n/g, '')
      .replace(/```/g, '')
      .trim();

    // Try to parse directly
    try {
      return JSON.parse(cleanedResponse);
    } catch {
      // Try to find JSON object in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Try to repair truncated JSON
          return JSON.parse(this.repairTruncatedJson(jsonMatch[0]));
        }
      }
      throw new Error('Could not extract valid JSON from AI response');
    }
  }

  /**
   * Attempt to repair truncated JSON
   */
  repairTruncatedJson(jsonString) {
    let repaired = jsonString;

    // Count open brackets
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    // Check if we're in an unclosed string
    const lastColon = repaired.lastIndexOf(':');
    const lastComma = repaired.lastIndexOf(',');
    const afterLastStructural = Math.max(lastColon, lastComma);

    if (afterLastStructural > 0) {
      const afterPart = repaired.substring(afterLastStructural);
      const quotesAfter = (afterPart.match(/"/g) || []).length;
      if (quotesAfter % 2 === 1) {
        repaired += '"';
      }
    }

    // Remove trailing comma
    repaired = repaired.replace(/,\s*$/, '');

    // Close unclosed arrays
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']';
    }

    // Close unclosed objects
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}';
    }

    return repaired;
  }

  /**
   * Sleep helper for retries
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
module.exports = new AIService();
