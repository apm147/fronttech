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
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
