// Runs db/seed/001_migrated_records.sql — the six-sector dataset migrated
// out of the HTML prototype (see scripts/migrate/ and docs/DESIGN.md) —
// against DATABASE_URL. Deliberately a thin wrapper around that one file
// rather than a rewrite in Prisma Client calls: the SQL was already
// generated and validated end-to-end (schema apply + seed load + row-count
// checks against a real Postgres instance), and re-expressing it as
// TypeScript would just be a second copy of the same 435 rows to keep in
// sync for no benefit — this file is what `npx prisma db seed` invokes.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const seedPath = path.join(import.meta.dirname, '..', 'db', 'seed', '001_migrated_records.sql');
const sql = readFileSync(seedPath, 'utf8');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(sql);
  console.log(`Applied ${seedPath}`);
} finally {
  await pool.end();
}
