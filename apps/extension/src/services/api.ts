import {
  API_ROUTES,
  AUTH_HEADER,
  BEARER_PREFIX,
  DEFAULT_API_BASE_URL,
  authTokensSchema,
  userSchema,
} from '@speaktype/shared';
import type {
  Settings,
  UpdateSettingsInput,
  Quota,
  AudioResponse,
  CleanupResponse,
  Language,
  CleanupMode,
  LoginInput,
  RegisterInput,
  AuthTokens,
  User,
} from '@speaktype/shared';

export class SpeakTypeApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = import.meta.env.WXT_API_URL || DEFAULT_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    route: { method: string; path: string },
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${route.path}`;
    const headers = new Headers(options?.headers);

    if (this.token) {
      headers.set(AUTH_HEADER, `${BEARER_PREFIX}${this.token}`);
    }

    if (body && !(body instanceof FormData)) {
      headers.set('content-type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      method: route.method,
      headers,
    };

    if (body) {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText} (${response.status})`);
    }

    return response.json() as Promise<T>;
  }

  // ----------------------------- Auth methods --------------------------------

  /**
   * Sign in with email + password. Returns validated AuthTokens.
   * Surfaces a clean error if the backend is not yet available (Phase 3 deferred).
   */
  async login(input: LoginInput): Promise<AuthTokens> {
    const raw = await this.request<unknown>(API_ROUTES.auth.login, input);
    return authTokensSchema.parse(raw);
  }

  /**
   * Register a new account. Returns validated AuthTokens.
   */
  async register(input: RegisterInput): Promise<AuthTokens> {
    const raw = await this.request<unknown>(API_ROUTES.auth.register, input);
    return authTokensSchema.parse(raw);
  }

  /**
   * Sign out — revokes the refresh token server-side (fire-and-forget; token is
   * already cleared in storage by the auth store before this returns).
   */
  async logout(): Promise<void> {
    await this.request<unknown>(API_ROUTES.auth.logout);
  }

  /**
   * Rotate the access token using a valid refresh token. Returns new AuthTokens.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const raw = await this.request<unknown>(API_ROUTES.auth.refresh, { refreshToken });
    return authTokensSchema.parse(raw);
  }

  /**
   * Fetch the currently authenticated user profile.
   */
  async getMe(): Promise<User> {
    const raw = await this.request<unknown>(API_ROUTES.auth.me);
    return userSchema.parse(raw);
  }

  // ----------------------------- Usage / quota -------------------------------

  async getQuota(): Promise<Quota> {
    try {
      return await this.request<Quota>(API_ROUTES.usage.quota);
    } catch {
      // Mocked fallback per stub requirements
      return {
        secondsUsed: 120,
        remainingSeconds: 1680,
        plan: 'free',
      };
    }
  }

  async transcribe(
    audioBlob: Blob,
    durationSeconds: number,
    language?: Language,
  ): Promise<AudioResponse> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      if (language) {
        formData.append('language', language);
      }
      formData.append('durationSeconds', durationSeconds.toString());

      return await this.request<AudioResponse>(API_ROUTES.audio.transcribe, formData);
    } catch {
      // Mocked fallback per stub requirements
      return {
        transcript: 'This is a stubbed transcription from SpeakTypeApiClient.',
        provider: 'groq',
        durationSeconds,
        requestId: '00000000-0000-0000-0000-000000000000',
      };
    }
  }

  async cleanup(
    transcript: string,
    cleanupMode: CleanupMode,
    websiteContext?: string,
  ): Promise<CleanupResponse> {
    try {
      return await this.request<CleanupResponse>(API_ROUTES.cleanup.run, {
        transcript,
        cleanupMode,
        websiteContext,
      });
    } catch {
      // Mocked fallback per stub requirements
      return {
        cleanedText: `[Cleaned (${cleanupMode})]: ${transcript}`,
      };
    }
  }

  async getSettings(): Promise<Settings> {
    try {
      return await this.request<Settings>(API_ROUTES.settings.get);
    } catch {
      // Mocked fallback per stub requirements
      return {
        language: 'auto',
        preferredModel: 'gemini-flash',
        autoCleanup: true,
        requireConfirmation: true,
      };
    }
  }

  async updateSettings(settings: UpdateSettingsInput): Promise<Settings> {
    try {
      return await this.request<Settings>(API_ROUTES.settings.update, settings);
    } catch {
      // Mocked fallback per stub requirements
      return {
        language: settings.language ?? 'auto',
        preferredModel: settings.preferredModel ?? 'gemini-flash',
        autoCleanup: settings.autoCleanup ?? true,
        requireConfirmation: settings.requireConfirmation ?? true,
      };
    }
  }
}

export const api = new SpeakTypeApiClient();
export default api;
