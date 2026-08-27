// Prisma Client singleton using the @prisma/adapter-pg driver adapter, so
// DATABASE_URL is handled by a plain `pg` Pool rather than Prisma's own
// connection management — same pattern as the Founderfluence module, for
// consistency across the stack. Import `prisma` from here; don't
// `new PrismaClient()` elsewhere (that would open a new pool per import,
// and in dev, a new one per hot-reload).

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Without this check, `pg` silently falls back to a default local
    // connection (localhost:5432) and every query fails with a generic
    // ECONNREFUSED that gives no hint the real problem is a missing/empty
    // env var — a trap in exactly this shape on Render, where the app
    // starts fine and only fails on the first request.
    throw new Error('DATABASE_URL is not set — check the environment configuration (.env locally, the platform dashboard in production).');
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
