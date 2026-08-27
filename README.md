# fronttech — UK Frontier Technology Policy Tracker

A dated, categorized feed of UK strategy documents, consultations, and funding-body pronouncements across the six frontier technologies named in the 2025 Modern Industrial Strategy (Quantum, Engineering Biology, AI, Semiconductors, Cybersecurity, Advanced Connectivity).

This is one of five components in a broader Deep Tech Intelligence Stack — see [`docs/DESIGN.md`](docs/DESIGN.md) for how it fits with QUILT (funded-projects intelligence), dtfunding (capital structure), Founderfluence (founder narrative), and the proposed investor tracker.

**Status:** Phase 1 (database). Schema and seed data are written and validated locally, not yet applied to the real Neon database. No app UI yet.

## Setup

```bash
npm install
cp .env.example .env   # defaults to a local Postgres; see the file for the Neon/Render production path
npx prisma migrate deploy
npx prisma db seed
```

## Contents

- [`docs/DESIGN.md`](docs/DESIGN.md) — data model, features, tech stack, migration plan, roadmap, and resolved/open design questions
- [`docs/schema.sql`](docs/schema.sql) — reference DDL (v2 base schema + proposed extensions); `prisma/migrations/0001_init/` is the operative copy Prisma applies
- [`docs/reference/`](docs/reference) — source documents this design was built from: the v2 schema spec, the five-component architecture briefing notes and diagram, and the existing HTML prototype being migrated
- [`prisma/schema.prisma`](prisma/schema.prisma) — Prisma schema (via `@prisma/adapter-pg`, matching the Founderfluence module's convention); `src/lib/prisma.ts` is the client singleton the app imports
- [`scripts/migrate/`](scripts/migrate) — extracts the six sectors' data out of the HTML prototype and builds [`db/seed/001_migrated_records.sql`](db/seed/001_migrated_records.sql), the seed data `prisma/seed.ts` loads
