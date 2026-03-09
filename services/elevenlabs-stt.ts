const STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const TIMEOUT_MS = 30000;

interface ElevenLabsSttResponse {
  text: string;
}

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
  if (!key || key === 'your_elevenlabs_api_key_here') {
    throw new Error('ELEVENLABS_API_KEY is not configured. Add it to your .env file.');
  }
  return key;
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const apiKey = getApiKey();

  const formData = new FormData();

  const uriParts = audioUri.split('.');
  const fileType = uriParts[uriParts.length - 1] ?? 'wav';

  formData.append('file', {
    uri: audioUri,
    type: `audio/${fileType}`,
    name: `recording.${fileType}`,
  } as unknown as Blob);

  formData.append('model_id', 'scribe_v1');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(STT_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`ElevenLabs STT failed (${response.status}): ${errorBody}`);
    }

    const data: ElevenLabsSttResponse = await response.json();

    if (!data.text || typeof data.text !== 'string') {
      throw new Error('Empty transcription returned');
    }

    return data.text;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Transcription request timed out. Please try again.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred during transcription.');
  } finally {
    clearTimeout(timeoutId);
  }
}
