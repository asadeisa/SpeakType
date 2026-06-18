import { defineEventHandler } from 'h3';
import { Redis } from '@upstash/redis';
import { RATE_LIMIT_PER_HOUR } from '@speaktype/shared';
import { fail } from '../utils/respond';

let redis: Redis | null = null;

function getRedisClient() {
  if (redis) return redis;

  const config = useRuntimeConfig();
  const url = config.upstashRedisRestUrl as string | undefined;
  const token = config.upstashRedisRestToken as string | undefined;

  if (!url || !token) {
    console.warn('Upstash Redis credentials are missing from runtime config');
    return null;
  }

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch (err) {
    console.warn('Failed to initialize Redis client:', err);
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const path = event.path;

  // Early return for non-/api paths
  if (!path.startsWith('/api')) {
    return;
  }

  // Preflight requests are skipped
  if (event.method === 'OPTIONS') {
    return;
  }

  // Skip rate limiting if auth context is missing (e.g. public routes)
  const auth = event.context.auth as { userId: string; plan: 'free' | 'pro' } | undefined;
  if (!auth) {
    return;
  }

  const { userId, plan } = auth;
  const limit = RATE_LIMIT_PER_HOUR[plan] || RATE_LIMIT_PER_HOUR.free;

  const client = getRedisClient();
  if (!client) {
    // Fail open
    return;
  }

  // Format UTC date as YYYYMMDDHH
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const timeSuffix = `${yyyy}${mm}${dd}${hh}`;

  const key = `rl:${userId}:${timeSuffix}`;

  try {
    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, 3600);
    }

    if (current > limit) {
      return fail(event, 429, 'Rate limit exceeded', 'RATE_LIMITED');
    }
  } catch (err) {
    console.warn('Rate limiting Redis error (failing open):', err);
    // Fail open
  }
});
