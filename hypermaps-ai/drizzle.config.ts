import { defineConfig } from 'drizzle-kit';        // helper – optional but nice
import type { Config } from 'drizzle-kit';

export default defineConfig({
  // where our table definitions live
  schema: './src/lib/db/schema.ts',

  // where drizzle will write migrations + snapshots
  out: './drizzle',

  // ← new field name expected by 0.21+
  dialect: 'postgresql',

  // single URL string instead of connectionString
  dbCredentials: {
    url: 'postgresql://postgres:postgres@host.docker.internal:5432/hypermaps',
  },
} satisfies Config); 