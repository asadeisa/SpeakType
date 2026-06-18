import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import * as authSchema from './auth-schema';

const databaseUrl =
  typeof useRuntimeConfig !== 'undefined'
    ? (useRuntimeConfig().databaseUrl as string | undefined)
    : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Database connection string is missing from runtime config');
}

const pool = new Pool({ connectionString: databaseUrl });

// Include the BetterAuth tables (user/session/account/verification) so the
// Drizzle instance — and therefore the BetterAuth drizzleAdapter — can resolve them.
export const db = drizzle(pool, { schema: { ...schema, ...authSchema } });

export * from './schema';
