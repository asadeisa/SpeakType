/**
 * Drizzle client — Neon serverless HTTP driver.
 *
 * Uses the pooled DATABASE_URL at runtime (Nitro / Neon HTTP pool).
 * drizzle-kit migrations use DATABASE_URL_UNPOOLED (see drizzle.config.ts).
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
