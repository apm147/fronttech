// Prisma CLI config (schema location, `prisma db seed`). Deliberately plain
// — classic engine, DATABASE_URL read from prisma/schema.prisma's
// `env("DATABASE_URL")` — because that's what Render (real TCP access) needs
// for `prisma migrate deploy` to work normally at deploy time.
//
// Don't switch `engine` to `'js'` with a driver-adapter (e.g.
// @prisma/adapter-neon) to work around a sandboxed environment lacking raw
// Postgres wire protocol (port 5432) — that was tried and reverted. It hits
// an upstream Prisma bug (github.com/prisma/prisma/issues/27403, "Column
// type 'name' could not be deserialized from the database") every time
// `migrate deploy` needs to actually apply a migration, not just read
// status — confirmed by reproducing it against a *new* test migration here,
// not only the first one. See docs/DESIGN.md's Phase 1 roadmap row for the
// one-off workaround used instead: run the migration/seed SQL directly via
// @neondatabase/serverless's WebSocket driver (tunnels over 443, unlike raw
// TCP:5432), then hand-insert the matching `_prisma_migrations` row so a
// later `migrate deploy` from an environment with real TCP (Render) sees it
// as already applied rather than re-running or conflicting.

import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

// prisma.config.ts opts out of Prisma's own .env auto-loading, so load it
// ourselves (Node 20.6+ built-in) for local/manual CLI runs. No-op where
// there's no .env file (e.g. Render, which sets DATABASE_URL via its own
// dashboard instead).
try {
  process.loadEnvFile(path.join(import.meta.dirname, '.env'));
} catch {}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  // Prisma 7 removed `datasource.url` from schema.prisma -- the connection
  // string for Migrate/CLI operations now belongs here instead (the app
  // itself never reads this; src/lib/prisma.ts's @prisma/adapter-pg reads
  // DATABASE_URL directly at runtime, unaffected by this).
  datasource: { url: env('DATABASE_URL') },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
