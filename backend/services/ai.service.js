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
    // Increased maxTokens to 8000 to reduce truncation issues
    const { temperature = 0.7, maxTokens = 8000, systemPrompt = null } = options;

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
   * Attempt to repair truncated JSON - robust version
   * Handles many edge cases including incomplete array elements
   */
  repairTruncatedJson(jsonString) {
    let repaired = jsonString.trim();

    // Step 1: Find the last complete structural element
    // Look for truncation patterns like incomplete strings, arrays, objects

    // Remove any trailing incomplete tokens (partial numbers, booleans, nulls)
    repaired = repaired.replace(/,\s*(true|false|null|[0-9]*)?\s*$/, '');

    // Step 2: Handle incomplete strings within arrays/objects
    // Find the last occurrence of key patterns
    const lastOpenBracket = repaired.lastIndexOf('[');
    const lastCloseBracket = repaired.lastIndexOf(']');
    const lastQuote = repaired.lastIndexOf('"');

    // Check if we're inside an unclosed string
    const contentAfterLastQuote = repaired.substring(lastQuote + 1);
    const quotesAfterLast = (contentAfterLastQuote.match(/"/g) || []).length;

    if (quotesAfterLast % 2 === 1) {
      // We have an odd number of quotes after the last quote = unclosed string
      // Truncate at the opening quote of the incomplete string
      const lastStructuralBeforeQuote = Math.max(
        repaired.lastIndexOf(',', lastQuote),
        repaired.lastIndexOf('[', lastQuote),
        repaired.lastIndexOf('{', lastQuote),
        repaired.lastIndexOf(':', lastQuote),
      );
      if (lastStructuralBeforeQuote > 0) {
        repaired = repaired.substring(0, lastStructuralBeforeQuote + 1);
      }
    }

    // Step 3: Handle incomplete array elements
    // Check if we're in an array with an incomplete element
    if (lastOpenBracket > lastCloseBracket) {
      // We're inside an unclosed array
      const arrayContent = repaired.substring(lastOpenBracket);

      // Check for incomplete object in array like [..., {"key": "val
      const lastObjectStart = arrayContent.lastIndexOf('{');
      const lastObjectEnd = arrayContent.lastIndexOf('}');

      if (lastObjectStart > lastObjectEnd && lastObjectStart > 0) {
        // Incomplete object in array - remove it
        const removeFrom = lastOpenBracket + arrayContent.lastIndexOf(',', lastObjectStart);
        if (removeFrom > lastOpenBracket) {
          repaired = repaired.substring(0, removeFrom);
        } else {
          // No comma before, just close the array
          const absPos = lastOpenBracket + lastObjectStart;
          repaired = repaired.substring(0, absPos);
        }
      }

      // Check for incomplete string in array like [..., "incomplete
      const quotesInArray = (arrayContent.match(/"/g) || []).length;
      if (quotesInArray % 2 === 1) {
        // Find last comma in array and truncate there
        const lastCommaInArray = arrayContent.lastIndexOf(',');
        if (lastCommaInArray > 0) {
          repaired = repaired.substring(0, lastOpenBracket + lastCommaInArray);
        } else {
          // No elements completed, empty the array
          repaired = repaired.substring(0, lastOpenBracket + 1);
        }
      }
    }

    // Step 4: Clean up trailing garbage
    // Remove trailing partial elements after comma
    repaired = repaired.replace(/,\s*"[^"]*$/, ''); // Remove trailing incomplete string
    repaired = repaired.replace(/,\s*{[^}]*$/, ''); // Remove trailing incomplete object
    repaired = repaired.replace(/,\s*\[[^\]]*$/, ''); // Remove trailing incomplete array
    repaired = repaired.replace(/,\s*$/, ''); // Remove trailing comma
    repaired = repaired.replace(/:\s*$/, ': null'); // Add null for incomplete values

    // Step 5: Count and close brackets
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/]/g) || []).length;

    // Close unclosed arrays first (they're usually nested inside objects)
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']';
    }

    // Close unclosed objects
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}';
    }

    // Step 6: Final validation attempt - if still fails, try more aggressive repair
    try {
      JSON.parse(repaired);
      return repaired;
    } catch {
      // More aggressive approach: find the last valid JSON subset
      return this.findLastValidJson(jsonString);
    }
  }

  /**
   * Find the largest valid JSON subset by progressively truncating
   */
  findLastValidJson(jsonString) {
    let str = jsonString.trim();

    // Try progressively shorter substrings
    for (let i = str.length; i > 100; i -= 50) {
      let attempt = str.substring(0, i);

      // Clean up the attempt
      attempt = attempt.replace(/,\s*$/, '');
      attempt = attempt.replace(/,\s*"[^"]*$/, '');
      attempt = attempt.replace(/,\s*{[^}]*$/, '');

      // Count and close brackets
      const openBraces = (attempt.match(/{/g) || []).length;
      const closeBraces = (attempt.match(/}/g) || []).length;
      const openBrackets = (attempt.match(/\[/g) || []).length;
      const closeBrackets = (attempt.match(/]/g) || []).length;

      for (let j = 0; j < openBrackets - closeBrackets; j++) {
        attempt += ']';
      }
      for (let j = 0; j < openBraces - closeBraces; j++) {
        attempt += '}';
      }

      try {
        JSON.parse(attempt);
        console.log(`  ⚠️ JSON repaired by truncating to ${i} chars`);
        return attempt;
      } catch {
        // Continue trying shorter strings
      }
    }

    // If all else fails, return a minimal valid object
    console.log('  ⚠️ Could not repair JSON, returning minimal object');
    return '{"name": "Unknown", "email": null, "primary_skills": [], "education": [], "experience_timeline": []}';
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
