/**
 * Drizzle schema — all application tables.
 *
 * Rules (from AGENTS.md + memory/stack-decisions.md):
 *  - UUID PKs for every non-BetterAuth table (uuid().defaultRandom())
 *  - BetterAuth manages its own tables (user, session, account, verification)
 *    via the drizzle adapter; we do NOT define those here — BetterAuth generates them.
 *  - plan enum aligned to PLANS from @speaktype/shared
 *  - refresh_tokens.revoked = true invalidates a token after rotation
 *  - webhook_events has a UNIQUE constraint on stripe_event_id (idempotency)
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums — aligned to constants exported from @speaktype/shared
// ---------------------------------------------------------------------------

/** Subscription plan. Mirrors PLANS = ['free', 'pro']. */
export const planEnum = pgEnum('plan', ['free', 'pro']);

/** STT provider. Mirrors STT_PROVIDERS = ['groq', 'secondary']. */
export const sttProviderEnum = pgEnum('stt_provider', ['groq', 'secondary']);

/** AI cleanup mode. Mirrors CLEANUP_MODES = ['off', 'light', 'formal']. */
export const cleanupModeEnum = pgEnum('cleanup_mode', ['off', 'light', 'formal']);

/** Audit action types. */
export const auditActionEnum = pgEnum('audit_action', [
  'audio_deleted',
  'user_registered',
  'user_deleted',
  'settings_updated',
  'quota_reset',
  'plan_changed',
]);

// ---------------------------------------------------------------------------
// Shared timestamp columns helper
// ---------------------------------------------------------------------------

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

// ---------------------------------------------------------------------------
// Table: users
//
// Core user record. BetterAuth creates its own `user` table via the adapter;
// this table holds app-level data (plan, quota period) keyed by the same user
// id that BetterAuth assigns (text UUID).
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Email — synced from BetterAuth on registration hook. */
  email: text('email').notNull().unique(),
  name: text('name'),
  plan: planEnum('plan').notNull().default('free'),
  /** Start of the current monthly quota period. Reset by a cron/webhook. */
  quotaPeriodStart: timestamp('quota_period_start', { withTimezone: true })
    .notNull()
    .defaultNow(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Table: subscriptions
//
// Stripe subscription record (deferred — schema ready, no live wiring).
// ---------------------------------------------------------------------------

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  plan: planEnum('plan').notNull(),
  /** Stripe subscription id. Null until billing is wired. */
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  /** ISO date string of next billing cycle. */
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Table: settings
//
// Per-user dictation preferences. Mirrors settingsSchema from @speaktype/shared.
// ---------------------------------------------------------------------------

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique() // one row per user
    .references(() => users.id, { onDelete: 'cascade' }),
  language: text('language').notNull().default('auto'),
  preferredModel: text('preferred_model').notNull().default('gemini-flash'),
  autoCleanup: boolean('auto_cleanup').notNull().default(false),
  requireConfirmation: boolean('require_confirmation').notNull().default(false),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Table: usage_logs
//
// One row per successful transcription request.
// ---------------------------------------------------------------------------

export const usageLogs = pgTable(
  'usage_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: sttProviderEnum('provider').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    /** Optional: what cleanup mode was applied downstream. */
    cleanupMode: cleanupModeEnum('cleanup_mode'),
    /** Stable request id echoed back to the extension. */
    requestId: uuid('request_id').notNull().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('usage_logs_user_id_idx').on(t.userId)],
);

// ---------------------------------------------------------------------------
// Table: refresh_tokens
//
// Application-level refresh tokens for bearer JWT rotation.
// BetterAuth's own session table is separate; this table exists for our
// explicit rotation logic (revoke-on-use).
// ---------------------------------------------------------------------------

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** The token value — store hashed in production (Phase 2 hardening). */
    token: text('token').notNull().unique(),
    /** True once the token has been consumed/rotated. Never reusable after revocation. */
    revoked: boolean('revoked').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('refresh_tokens_user_id_idx').on(t.userId)],
);

// ---------------------------------------------------------------------------
// Table: audit_logs
//
// Immutable event log. Especially used for "audio deleted after processing"
// (security requirement from memory/security-and-performance.md).
// ---------------------------------------------------------------------------

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: auditActionEnum('action').notNull(),
    /** JSON-serialised extra context (file size, ip, etc). */
    metadata: text('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_logs_user_id_idx').on(t.userId)],
);

// ---------------------------------------------------------------------------
// Table: provider_failures
//
// Passive log of STT provider errors (no retry queue per design decision).
// ---------------------------------------------------------------------------

export const providerFailures = pgTable(
  'provider_failures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    provider: sttProviderEnum('provider').notNull(),
    /** HTTP status or internal error code returned by the provider. */
    errorCode: text('error_code'),
    /** Truncated error message for diagnostics. */
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('provider_failures_provider_idx').on(t.provider)],
);

// ---------------------------------------------------------------------------
// Table: quota_events
//
// Tracks quota resets and manual adjustments. Gives an audit trail beyond
// the live Redis-cached quota value.
// ---------------------------------------------------------------------------

export const quotaEvents = pgTable(
  'quota_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** 'reset' = monthly rollover; 'adjustment' = manual/support override. */
    eventType: text('event_type').notNull(),
    /** Seconds granted or removed (negative for deductions). */
    deltaSeconds: integer('delta_seconds').notNull().default(0),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('quota_events_user_id_idx').on(t.userId)],
);

// ---------------------------------------------------------------------------
// Table: webhook_events
//
// Stripe webhook idempotency table (deferred — schema ready, no live wiring).
// The UNIQUE constraint on stripe_event_id prevents double-processing.
// ---------------------------------------------------------------------------

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stripeEventId: text('stripe_event_id').notNull(),
    /** Stripe event type string, e.g. 'customer.subscription.updated'. */
    eventType: text('event_type').notNull(),
    /** Full event payload stored for replay/debugging. */
    payload: text('payload').notNull(),
    /** 'pending' | 'processed' | 'failed' */
    status: text('status').notNull().default('pending'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Idempotency: Stripe may deliver the same event more than once.
    unique('webhook_events_stripe_event_id_unique').on(t.stripeEventId),
  ],
);

// ---------------------------------------------------------------------------
// TypeScript type helpers (inferred from the schema)
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type ProviderFailure = typeof providerFailures.$inferSelect;
export type NewProviderFailure = typeof providerFailures.$inferInsert;

export type QuotaEvent = typeof quotaEvents.$inferSelect;
export type NewQuotaEvent = typeof quotaEvents.$inferInsert;

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
