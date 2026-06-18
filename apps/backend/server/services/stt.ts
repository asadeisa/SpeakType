import {
  MAX_AUDIO_BYTES,
  ALLOWED_AUDIO_MIME,
  type Language,
  type SttProvider,
} from '@speaktype/shared';
import { db, providerFailures } from '~/server/db';

export class SttUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SttUnavailableError';
  }
}

export const SttGateway = {
  async transcribe(
    audio: { bytes: Uint8Array | Buffer; filename: string; mime: string },
    language?: Language,
  ): Promise<{ transcript: string; provider: SttProvider }> {
    // 1. Defensive validation
    if (audio.bytes.length > MAX_AUDIO_BYTES) {
      throw new Error(`Audio exceeds maximum size limit of ${MAX_AUDIO_BYTES} bytes.`);
    }

    if (!(ALLOWED_AUDIO_MIME as readonly string[]).includes(audio.mime)) {
      throw new Error(`Audio mime type '${audio.mime}' is not allowed.`);
    }

    const config = useRuntimeConfig();
    const apiKey = config.groqApiKey as string | undefined;
    const model = (config.groqModel as string) || 'whisper-large-v3-turbo';

    if (!apiKey) {
      console.error('Groq API key is missing from runtime config.');
      return this.handleGroqFailure('Groq API key is not configured', 'missing_key');
    }

    try {
      // 2. Build standard FormData body
      const formData = new FormData();
      const blob = new Blob([audio.bytes as BlobPart], { type: audio.mime });
      formData.append('file', blob, audio.filename);
      formData.append('model', model);
      formData.append('response_format', 'json');

      if (language && language !== 'auto') {
        formData.append('language', language);
      }

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown network error');
        return await this.handleGroqFailure(
          `Groq API returned status ${response.status}: ${errorText}`,
        );
      }

      const data = (await response.json()) as { text: string };
      if (!data || typeof data.text !== 'string') {
        return await this.handleGroqFailure('Invalid JSON response format from Groq API');
      }

      return {
        transcript: data.text,
        provider: 'groq',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fetch connection to Groq failed';
      return await this.handleGroqFailure(message);
    }
  },

  async handleGroqFailure(errorMessage: string, requestId?: string): Promise<never> {
    console.warn(`Groq transcription failed: ${errorMessage}`);

    // Insert passive provider failure record into DB
    try {
      await db.insert(providerFailures).values({
        provider: 'groq',
        error: errorMessage,
        requestId: requestId || null,
      });
    } catch (dbErr) {
      console.error('Failed to log provider failure to database:', dbErr);
    }

    // TODO secondary STT seam — do NOT wire a paid provider.
    throw new SttUnavailableError('STT service is temporarily unavailable.');
  },
};
