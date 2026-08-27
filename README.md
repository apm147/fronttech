# fronttech — UK Frontier Technology Policy Tracker

A dated, categorized feed of UK strategy documents, consultations, and funding-body pronouncements across the six frontier technologies named in the 2025 Modern Industrial Strategy (Quantum, Engineering Biology, AI, Semiconductors, Cybersecurity, Advanced Connectivity).

This is one of five components in a broader Deep Tech Intelligence Stack — see [`docs/DESIGN.md`](docs/DESIGN.md) for how it fits with QUILT (funded-projects intelligence), dtfunding (capital structure), Founderfluence (founder narrative), and the proposed investor tracker.

**Status:** Phase 2 (read-only app). Schema and seed data are applied to the real Neon database (see `docs/DESIGN.md`'s Phase 1 roadmap row). The Next.js read-only app — landscape grid, sector view with tabs/sub-tabs, cross-sector search — is built and passes a local build/dev check; not yet deployed to Render.

## Setup

```bash
npm install
cp .env.example .env   # defaults to a local Postgres; see the file for the Neon/Render production path
npx prisma migrate deploy
npx prisma db seed
npm run dev             # http://localhost:3000
```

`npm run build && npm start` runs the production build locally. Deploying to Render: set `DATABASE_URL` to the real Neon connection string in the service's Environment tab (see `.env.example`), then Render's own build step runs `npm install && npm run build` and starts with `npm start`.

## Contents

- [`docs/DESIGN.md`](docs/DESIGN.md) — data model, features, tech stack, migration plan, roadmap, and resolved/open design questions
- [`docs/schema.sql`](docs/schema.sql) — reference DDL (v2 base schema + proposed extensions); `prisma/migrations/0001_init/` is the operative copy Prisma applies
- [`docs/reference/`](docs/reference) — source documents this design was built from: the v2 schema spec, the five-component architecture briefing notes and diagram, and the existing HTML prototype being migrated
- [`prisma/schema.prisma`](prisma/schema.prisma) — Prisma schema (via `@prisma/adapter-pg`, matching the Founderfluence module's convention); `src/lib/prisma.ts` is the client singleton the app imports
- [`scripts/migrate/`](scripts/migrate) — extracts the six sectors' data out of the HTML prototype and builds [`db/seed/001_migrated_records.sql`](db/seed/001_migrated_records.sql), the seed data `prisma/seed.ts` loads
- [`app/`](app) — Next.js App Router pages: landscape grid (`/`), sector view (`/sector/[sectorId]`), cross-sector search (`/search`)
- [`src/config/`](src/config) — presentation-only static config (sector icons/accent colours/blurbs, badge→CSS-class maps, section/sub-tab labels) deliberately kept out of the database, per `docs/DESIGN.md`
- [`src/lib/data.ts`](src/lib/data.ts) — the read-side Prisma query layer the pages call into
