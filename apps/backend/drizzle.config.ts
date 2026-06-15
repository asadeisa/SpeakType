import { defineConfig } from 'drizzle-kit';

// drizzle-kit automatically loads .env from the cwd when running `db:generate`
// or `db:migrate` (run from apps/backend/). Explicit dotenv load is not needed.
//
// Use the direct (unpooled) URL for migrations — Neon pooler connections
// cannot run DDL reliably.

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
