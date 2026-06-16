import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpeakTypeApiClient, api } from '@/services/api';
import { API_ROUTES, AUTH_HEADER, BEARER_PREFIX } from '@speaktype/shared';
import type {
  AuthTokens,
  User,
  Quota,
  AudioResponse,
  CleanupResponse,
  Settings,
} from '@speaktype/shared';

describe('SpeakTypeApiClient', () => {
  let client: SpeakTypeApiClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    client = new SpeakTypeApiClient('https://api.test-speaktype.local');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createResponse(data: unknown, ok = true, status = 200, statusText = 'OK') {
    return {
      ok,
      status,
      statusText,
      headers: new Headers(),
      json: async () => data,
    };
  }

  describe('setToken and headers', () => {
    it('should attach Authorization header when token is set', async () => {
      client.setToken('my-secret-token');

      const mockQuota: Quota = {
        secondsUsed: 10,
        remainingSeconds: 1000,
        plan: 'pro',
      };

      mockFetch.mockResolvedValue(createResponse(mockQuota));

      const result = await client.getQuota();
      expect(result).toEqual(mockQuota);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, config] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`https://api.test-speaktype.local${API_ROUTES.usage.quota.path}`);
      expect(config.method).toBe(API_ROUTES.usage.quota.method);

      const headers = config.headers as Headers;
      expect(headers.get(AUTH_HEADER)).toBe(`${BEARER_PREFIX}my-secret-token`);
    });

    it('should not attach Authorization header when token is null', async () => {
      client.setToken(null);

      const mockQuota: Quota = {
        secondsUsed: 10,
        remainingSeconds: 1000,
        plan: 'pro',
      };

      mockFetch.mockResolvedValue(createResponse(mockQuota));

      await client.getQuota();

      const [, config] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = config.headers as Headers;
      expect(headers.has(AUTH_HEADER)).toBe(false);
    });
  });

  describe('Auth Methods (No Try/Catch - Should Throw on Error)', () => {
    const validTokens: AuthTokens = {
      accessToken: 'acc_123',
      refreshToken: 'ref_456',
      expiresIn: 3600,
    };

    const validUser: User = {
      id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
      email: 'user@example.com',
      name: 'John Doe',
      plan: 'free',
    };

    it('login success', async () => {
      mockFetch.mockResolvedValue(createResponse(validTokens));

      const result = await client.login({ email: 'user@example.com', password: 'password123' });
      expect(result).toEqual(validTokens);

      const [url, config] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain(API_ROUTES.auth.login.path);
      expect(config.body).toBe(
        JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      );
    });

    it('login fails (non-ok response) - throws Error', async () => {
      mockFetch.mockResolvedValue(
        createResponse({ error: 'Unauthorized' }, false, 401, 'Unauthorized'),
      );

      await expect(client.login({ email: 'u@e.com', password: 'password123' })).rejects.toThrow(
        'API Error: Unauthorized (401)',
      );
    });

    it('login fails (invalid payload schema) - throws ZodError', async () => {
      // Missing refreshToken
      const invalidTokens = { accessToken: 'acc_123', expiresIn: 3600 };
      mockFetch.mockResolvedValue(createResponse(invalidTokens));

      await expect(client.login({ email: 'u@e.com', password: 'password123' })).rejects.toThrow();
    });

    it('register success', async () => {
      mockFetch.mockResolvedValue(createResponse(validTokens));

      const result = await client.register({
        email: 'u@e.com',
        password: 'password123',
        name: 'Bob',
      });
      expect(result).toEqual(validTokens);
    });

    it('logout success', async () => {
      mockFetch.mockResolvedValue(createResponse({ success: true }));

      await client.logout();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('refresh success', async () => {
      mockFetch.mockResolvedValue(createResponse(validTokens));

      const result = await client.refresh('ref_456');
      expect(result).toEqual(validTokens);
    });

    it('getMe success', async () => {
      mockFetch.mockResolvedValue(createResponse(validUser));

      const result = await client.getMe();
      expect(result).toEqual(validUser);
    });

    it('getMe fails (invalid user UUID) - throws ZodError', async () => {
      const badUser = { ...validUser, id: 'not-a-uuid' };
      mockFetch.mockResolvedValue(createResponse(badUser));

      await expect(client.getMe()).rejects.toThrow();
    });
  });

  describe('With Fallbacks (Try/Catch - Returns Fallback on Failure)', () => {
    describe('getQuota', () => {
      it('returns quota on success', async () => {
        const quota: Quota = { secondsUsed: 10, remainingSeconds: 50, plan: 'pro' };
        mockFetch.mockResolvedValue(createResponse(quota));

        const result = await client.getQuota();
        expect(result).toEqual(quota);
      });

      it('returns mock fallback quota on failure', async () => {
        mockFetch.mockRejectedValue(new Error('Network disconnected'));

        const result = await client.getQuota();
        expect(result).toEqual({
          secondsUsed: 120,
          remainingSeconds: 1680,
          plan: 'free',
        });
      });
    });

    describe('transcribe', () => {
      const audioBlob = new Blob(['abc'], { type: 'audio/wav' });

      it('returns transcribe info on success', async () => {
        const resp: AudioResponse = {
          transcript: 'Parsed audio',
          provider: 'groq',
          durationSeconds: 5.5,
          requestId: '123e4567-e89b-12d3-a456-426614174000',
        };
        mockFetch.mockResolvedValue(createResponse(resp));

        const result = await client.transcribe(audioBlob, 5.5, 'en');
        expect(result).toEqual(resp);

        const [, config] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(config.body).toBeInstanceOf(FormData);
        const fd = config.body as FormData;
        // Deep-equality on a happy-dom Blob fails on internal buffer symbols;
        // assert identity by type + size instead.
        const audioField = fd.get('audio');
        expect(audioField).toBeInstanceOf(Blob);
        expect((audioField as Blob).size).toBe(audioBlob.size);
        expect((audioField as Blob).type).toBe(audioBlob.type);
        expect(fd.get('language')).toBe('en');
        expect(fd.get('durationSeconds')).toBe('5.5');
      });

      it('returns mock fallback transcription on failure', async () => {
        mockFetch.mockRejectedValue(new Error('API quota reached'));

        const result = await client.transcribe(audioBlob, 10);
        expect(result).toEqual({
          transcript: 'This is a stubbed transcription from SpeakTypeApiClient.',
          provider: 'groq',
          durationSeconds: 10,
          requestId: '00000000-0000-0000-0000-000000000000',
        });
      });
    });

    describe('cleanup', () => {
      it('returns cleaned text on success', async () => {
        const resp: CleanupResponse = { cleanedText: 'Hello, World.' };
        mockFetch.mockResolvedValue(createResponse(resp));

        const result = await client.cleanup('hello world', 'formal', 'https://page.com');
        expect(result).toEqual(resp);

        const [, config] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(config.body).toBe(
          JSON.stringify({
            transcript: 'hello world',
            cleanupMode: 'formal',
            websiteContext: 'https://page.com',
          }),
        );
      });

      it('returns mock fallback cleaned text on failure', async () => {
        mockFetch.mockRejectedValue(new Error('Server error'));

        const result = await client.cleanup('hello world', 'light');
        expect(result).toEqual({
          cleanedText: '[Cleaned (light)]: hello world',
        });
      });
    });

    describe('getSettings', () => {
      it('returns settings on success', async () => {
        const settings: Settings = {
          language: 'ar',
          preferredModel: 'gemini-flash',
          autoCleanup: false,
          requireConfirmation: false,
        };
        mockFetch.mockResolvedValue(createResponse(settings));

        const result = await client.getSettings();
        expect(result).toEqual(settings);
      });

      it('returns mock fallback settings on failure', async () => {
        mockFetch.mockRejectedValue(new Error('Timeout'));

        const result = await client.getSettings();
        expect(result).toEqual({
          language: 'auto',
          preferredModel: 'gemini-flash',
          autoCleanup: true,
          requireConfirmation: true,
        });
      });
    });

    describe('updateSettings', () => {
      it('returns updated settings on success', async () => {
        const settings: Settings = {
          language: 'en',
          preferredModel: 'gemini-flash',
          autoCleanup: true,
          requireConfirmation: false,
        };
        mockFetch.mockResolvedValue(createResponse(settings));

        const result = await client.updateSettings({ language: 'en', requireConfirmation: false });
        expect(result).toEqual(settings);

        const [, config] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(config.body).toBe(JSON.stringify({ language: 'en', requireConfirmation: false }));
      });

      it('returns merged mock fallback on failure', async () => {
        mockFetch.mockRejectedValue(new Error('Update failed'));

        const result = await client.updateSettings({ language: 'ar', requireConfirmation: false });
        expect(result).toEqual({
          language: 'ar',
          preferredModel: 'gemini-flash',
          autoCleanup: true,
          requireConfirmation: false,
        });
      });
    });
  });

  describe('Default Singleton Instance', () => {
    it('is exported as a SpeakTypeApiClient instance', () => {
      expect(api).toBeInstanceOf(SpeakTypeApiClient);
    });
  });
});
