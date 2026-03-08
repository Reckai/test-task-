export type MixingMode = 'style-transfer' | 'mashup';

const API_URL = 'https://api.anthropic.com/v1/messages';
const TIMEOUT_MS = 30000;

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!key || key === 'your_anthropic_api_key_here') {
    throw new Error('ANTHROPIC_API_KEY is not configured. Add it to your .env file.');
  }
  return key;
}

function buildPrompt(text1: string, text2: string, mode: MixingMode): string {
  if (mode === 'style-transfer') {
    return `Rewrite the following Text 1 in the style of Text 2. Only output the rewritten text, nothing else.\n\nText 1: ${text1}\n\nText 2: ${text2}`;
  }
  return `Creatively combine these two texts into one cohesive piece. Only output the combined text, nothing else.\n\nText 1: ${text1}\n\nText 2: ${text2}`;
}

export async function mixTexts(
  text1: string,
  text2: string,
  mode: MixingMode,
): Promise<string> {
  const apiKey = getApiKey();
  const prompt = buildPrompt(text1, text2, mode);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`API request failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      throw new Error('Invalid response format from Claude API');
    }

    const textBlock = data.content.find(
      (block: { type: string }) => block.type === 'text',
    );

    if (!textBlock || !textBlock.text) {
      throw new Error('No text content in Claude API response');
    }

    return textBlock.text;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred while mixing texts.');
  } finally {
    clearTimeout(timeoutId);
  }
}
