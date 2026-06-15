/**
 * BetterAuth instance.
 *
 * Configuration:
 *  - Bearer JWT (no cookies — extension + API clients)
 *  - Refresh-token rotation (old token revoked on every /auth/refresh)
 *  - Drizzle adapter over Neon Postgres
 *  - Secret + base URL from env (BETTER_AUTH_SECRET, BETTER_AUTH_URL)
 *
 * BetterAuth creates and manages its own tables (user, session, account,
 * verification) via the drizzle adapter. We do NOT define those in schema.ts.
 * Run `db:generate` + `db:migrate` after installing better-auth to apply them.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins/bearer';
import { jwt } from 'better-auth/plugins/jwt';
import { db } from '../db/index';

export const auth = betterAuth({
  // Signing secret — must be a strong random string in production.
  secret: process.env.BETTER_AUTH_SECRET!,

  // Public base URL of this Nitro server; used to build redirect URLs.
  baseURL: process.env.BETTER_AUTH_URL!,

  // Persist sessions/tokens via our Drizzle + Neon connection.
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  plugins: [
    // Issue bearer tokens in the Authorization header instead of cookies.
    // The extension sends: Authorization: Bearer <token>
    bearer(),

    // Sign sessions as JWTs for stateless verification on edge.
    jwt(),
  ],

  // Email + password is the default provider; no third-party OAuth in phase 1.
  emailAndPassword: {
    enabled: true,
    // Minimum password length matches loginSchema in @speaktype/shared.
    minPasswordLength: 8,
  },

  session: {
    // Rolling expiry — extend session on activity.
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // re-issue if older than 1 day

    // Refresh-token rotation: BetterAuth rotates the refresh token on every
    // session refresh (old refresh token is revoked immediately).
    // Our own refresh_tokens table tracks application-level tokens separately.
  },
});

export type Auth = typeof auth;
