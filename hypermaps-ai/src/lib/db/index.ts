import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Grab the URL from the environment
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set – add it to .env.local (e.g. postgres://user:pass@host:5432/dbname)'
  );
}

// Create one shared PG pool
const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false } // for Render/Fly/etc.
      : undefined,
});

// Export the Drizzle client used by API routes
export const db = drizzle(pool, { schema }); 