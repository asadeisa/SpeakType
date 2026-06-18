import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { eq, and } from 'drizzle-orm';
import type { Plan } from '@speaktype/shared';
import { db, refreshTokens } from '~/server/db';

function getConfig() {
  const config = useRuntimeConfig();
  return {
    jwtSecret: config.jwtSecret as string,
    accessTokenTtlSeconds: config.accessTokenTtlSeconds as number,
    refreshTokenTtlDays: config.refreshTokenTtlDays as number,
  };
}

/** SHA-256 hex digest of a raw token string. */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Sign a short-lived HS256 access JWT. */
export async function signAccessToken(userId: string, plan: Plan): Promise<string> {
  const { jwtSecret, accessTokenTtlSeconds } = getConfig();
  return new SignJWT({ sub: userId, plan })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${accessTokenTtlSeconds}s`)
    .sign(encodeSecret(jwtSecret));
}

/** Verify an access JWT. Returns payload or null. */
export async function verifyAccessToken(
  token: string,
): Promise<{ sub: string; plan: Plan } | null> {
  try {
    const { jwtSecret } = getConfig();
    const { payload } = await jwtVerify(token, encodeSecret(jwtSecret), {
      algorithms: ['HS256'],
    });
    return { sub: payload.sub as string, plan: payload.plan as Plan };
  } catch {
    return null;
  }
}

/** Issue a random opaque refresh token and store its hash. */
export async function issueRefreshToken(userId: string): Promise<string> {
  const { refreshTokenTtlDays } = getConfig();
  const raw = randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return raw;
}

/**
 * Look up a raw refresh token by hash, verify it is valid,
 * revoke it, and return the userId. Returns null if invalid.
 */
export async function rotateRefreshToken(rawToken: string): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(rawToken);

  const rows = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, tokenHash), eq(refreshTokens.revoked, false)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Check expiry
  if (new Date(row.expiresAt) < new Date()) {
    // Expired — revoke it anyway
    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, row.id));
    return null;
  }

  // Revoke this token
  await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, row.id));

  return { userId: row.userId };
}

/** Mark a refresh token row as revoked. */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}
