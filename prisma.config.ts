// Prisma CLI config (schema location, `prisma db seed`). Written against the
// prisma.config.ts shape introduced in Prisma 6.6 — if the version that ends
// up installed rejects a field here, check `npx prisma version` against the
// current docs; this file couldn't be verified against a real install in
// this sandbox (npm registry access is blocked here — see docs/DESIGN.md /
// the Phase 1 migration notes for why).

import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
