// Runs every db/seed/NNN_*.sql file, in filename order, against
// DATABASE_URL — this is what `npx prisma db seed` invokes. Started as a
// thin wrapper around the single 001_migrated_records.sql file (the
// six-sector dataset migrated out of the HTML prototype; see
// scripts/migrate/ and docs/DESIGN.md); generalized to a sorted directory
// scan once a second numbered file (002_sector_taxonomy_xref.sql) was
// added, rather than hardcoding a growing list of filenames here. Each
// file's SQL is applied as-is rather than re-expressed as Prisma Client
// calls, for the same reason as before: it's already generated/validated
// SQL, and a TypeScript rewrite would just be a second copy to keep in
// sync for no benefit.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const seedDir = path.join(import.meta.dirname, '..', 'db', 'seed');
const seedFiles = readdirSync(seedDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  for (const file of seedFiles) {
    const seedPath = path.join(seedDir, file);
    const sql = readFileSync(seedPath, 'utf8');
    await pool.query(sql);
    console.log(`Applied ${seedPath}`);
  }
} finally {
  await pool.end();
}
