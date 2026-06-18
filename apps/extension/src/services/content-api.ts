/**
 * Content-script → background API bridge.
 *
 * A content script's `fetch` carries the host page's origin, which the backend
 * CORS allowlist rejects (it only trusts chrome-extension:// and localhost).
 * So every backend call the content script needs is proxied through the
 * background service worker, whose requests use the extension origin and pass
 * CORS. (The popup runs in an extension page and keeps calling `api` directly.)
 */
import { browser } from 'wxt/browser';
import type {
  AudioResponse,
  CleanupResponse,
  Quota,
  Settings,
  Language,
  CleanupMode,
} from '@speaktype/shared';

/** Every call the content script proxies to the background worker. */
export type ApiProxyRequest =
  | { type: 'st-api'; method: 'getQuota' }
  | { type: 'st-api'; method: 'getSettings' }
  | {
      type: 'st-api';
      method: 'transcribe';
      audioBuffer: ArrayBuffer;
      mimeType: string;
      durationSeconds: number;
      language?: Language;
    }
  | {
      type: 'st-api';
      method: 'cleanup';
      transcript: string;
      cleanupMode: CleanupMode;
      websiteContext?: string;
    };

export type ApiProxyResponse = { ok: true; data: unknown } | { ok: false; error: string };

async function send<T>(req: ApiProxyRequest): Promise<T> {
  const res = (await browser.runtime.sendMessage(req)) as ApiProxyResponse | undefined;
  if (!res || res.ok !== true) {
    throw new Error(res && res.ok === false ? res.error : 'Background API call failed');
  }
  return res.data as T;
}

export function getQuotaViaBackground(): Promise<Quota> {
  return send<Quota>({ type: 'st-api', method: 'getQuota' });
}

export function getSettingsViaBackground(): Promise<Settings> {
  return send<Settings>({ type: 'st-api', method: 'getSettings' });
}

export async function transcribeViaBackground(
  blob: Blob,
  durationSeconds: number,
  language?: Language,
): Promise<AudioResponse> {
  const audioBuffer = await blob.arrayBuffer();
  return send<AudioResponse>({
    type: 'st-api',
    method: 'transcribe',
    audioBuffer,
    mimeType: blob.type || 'audio/webm',
    durationSeconds,
    language,
  });
}

export function cleanupViaBackground(
  transcript: string,
  cleanupMode: CleanupMode,
  websiteContext?: string,
): Promise<CleanupResponse> {
  return send<CleanupResponse>({
    type: 'st-api',
    method: 'cleanup',
    transcript,
    cleanupMode,
    websiteContext,
  });
}
