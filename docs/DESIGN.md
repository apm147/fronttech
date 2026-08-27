# UK Frontier Technology Policy Tracker — Initial Design

**Status:** Design phase. No schema applied, no app scaffolded yet.
**Repo role:** Component 4 of the five-component Deep Tech Intelligence Stack (see [Stack context](#stack-context) below).

This document specifies the initial data model, features, and build plan for the policy tracker, starting from:

- `docs/reference/uk-frontier-tech-data-schema-v2.md` — the target Postgres schema for migrating the existing prototype (reproduced/extended in `docs/schema.sql`)
- `docs/reference/deep-tech-stack-briefing-notes.md` — the five-component architecture this repo has to plug into
- The existing single-file HTML prototype (`UK Frontier Technology Landscape`) — six sectors of hand-researched policy/institution/breakthrough data, currently stored as inline JS arrays with CSV import/export as the only editing mechanism

---

## Stack context

Five components, one eventual join surface (the "connecting repository," not yet built):

| # | Component | Status | Resolves to a company via |
|---|---|---|---|
| 1 | QUILT | Built | `dim_participant.crn` |
| 2 | Funding stack analyser (dtfunding) | Built | `companies.id` |
| 3 | Founderfluence | Built | company records |
| 4 | **Policy tracker (this repo)** | Proposed | — see [Cross-module linkage](#cross-module-linkage) |
| 5 | Investor tracker | Proposed | entity-resolved cap tables + PSC |

The policy tracker's job, per the briefing notes: take the existing six-category frontier-technology framework (Quantum, Engineering Biology, AI, Semiconductors, Cybersecurity, Advanced Connectivity — the UK's 2025 Modern Industrial Strategy categories) and turn it into a dated, queryable feed of strategy documents, consultations, and funding-body pronouncements, tagged the same way QUILT tags projects. That tagging alignment is what makes the **two-clock mismatch** measurable: QUILT records what got funded (its clock); the policy tracker records what was promised first (its clock). Checked against each other by category, that's the difference between funding deployment and policy signal — made measurable rather than asserted.

The policy tracker also carries a natural-person table (named leaders — ministers, agency heads) that can cross-reference against the PSC/GP identities the investor tracker builds — surfacing people who sit on both sides of policy and capital. That's linkage #5 in the briefing notes' ledger, distinct from the primary cascade-tracing use case.

## Cross-module linkage

The briefing notes state the stack-wide join key is Companies House number (CRN). For the policy tracker specifically, that's the wrong root key, and this design deliberately doesn't build around it:

- Policy documents are strategy-level. They almost never name a specific company; they name a **technology category** (quantum, engineering biology, AI, semiconductors, cyber, connectivity) and sometimes a **person** (a minister, an agency head).
- QUILT tags projects by the same technology categories via its Deep Tech Ontology. The QUILT ↔ policy tracker linkage in the briefing notes is explicitly by category, not by CRN — "funding deployment... checked against policy signal... by category."
- CRN-based joins matter where the briefing notes actually specify them: QUILT → investor tracker (scoping) and dtfunding → investor tracker (shared extraction) — both company-level joins between modules that already carry CRN. The policy tracker isn't one of those.

So the root cross-module connector for this repo is **the technology category itself**, not a company identifier. Two consequences for the schema:

1. `sectors.sector_id` is treated as a de facto shared vocabulary with QUILT's Deep Tech Ontology top-level categories, and must stay aligned with it by convention. A thin cross-reference table (`sector_taxonomy_xref`, below) exists only to catch drift if the two systems' slugs ever diverge — it costs nothing while they agree, and saves a painful rename if they don't.
2. A lightweight `people` dimension is added now (not deferred), because it's the one linkage the briefing notes describe concretely for this repo: named leaders resolving against investor-tracker PSC/GP identities. A `companies`/CRN table is deliberately **not** added — see [What's deliberately not in this schema](#whats-deliberately-not-in-this-schema).

## Data model

The base model is v2 unchanged: `sectors`, `records`, `badges` / `record_badges`, `record_history`. Full DDL, including the two extensions below, is in `docs/schema.sql`. This section covers only what's added and why.

### Extension 1 — `people` (named leaders)

```sql
CREATE TABLE people (
  person_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name        text NOT NULL,
  normalized_name  text NOT NULL,   -- lowercased, punctuation-stripped; matching key for future PSC/GP cross-reference
  role_title       text,            -- current/most-recent role, free text
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE record_people (
  record_id     uuid NOT NULL REFERENCES records(record_id) ON DELETE CASCADE,
  person_id     uuid NOT NULL REFERENCES people(person_id),
  role_at_time  text,   -- role as it applied to this specific record, e.g. "Chancellor" at time of a 2026 timeline entry
  PRIMARY KEY (record_id, person_id)
);
```

Seeding: initially populated by hand alongside authoring (a `people` column added to the CSV import format, semicolon-separated names — same pattern already used for `badges`), not by parsing free text out of the `subtitle`/`description` fields. Breakthrough rows already carry a `subtitle` convention for "key people" as unstructured text; that stays as-is for display, and structured `record_people` entries are added incrementally where a name matters enough to be a join target (ministers, department heads, named researchers with a breakthrough attributed to them) — not attempted for every name that appears in prose.

### Extension 2 — `sector_taxonomy_xref` (alignment guard, not a new taxonomy)

```sql
CREATE TABLE sector_taxonomy_xref (
  sector_id        text NOT NULL REFERENCES sectors(sector_id),
  external_system  text NOT NULL,   -- e.g. 'quilt_deep_tech_ontology'
  external_code    text NOT NULL,
  PRIMARY KEY (sector_id, external_system)
);
```

Not populated until QUILT's actual category codes are confirmed. Until then `sector_id` values (`quantum`, `engbio`, `ai`, `semiconductors`, `cyber`, `connectivity`) are the shared vocabulary by convention. This table exists so that if QUILT's codes turn out to differ (e.g. `engineering-biology` vs `engbio`), the fix is one mapping row per sector, not a rename cascaded through every `record_key`.

### Extension 3 — `v_policy_signal_by_category` (the two-clock join surface)

```sql
CREATE VIEW v_policy_signal_by_category AS
SELECT
  r.sector_id,
  s.label                                     AS sector_label,
  r.section_key,
  date_trunc('month', r.date_sort_key)::date  AS signal_month,
  r.record_key,
  r.title,
  r.status,
  r.source_tier
FROM records r
JOIN sectors s USING (sector_id)
WHERE r.date_sort_key IS NOT NULL
  AND r.is_placeholder = false;
```

A narrow, stable read surface — category, month, record identity, nothing internal — for the connecting repository (or QUILT-side tooling, once it exists) to pull dated policy signal without touching base tables directly. This is the concrete deliverable behind the "two-clock mismatch, made measurable" claim in the briefing notes; the actual funding-vs-policy comparison itself is the connecting repository's job, not this repo's.

### What's deliberately not in this schema

Carried forward from v2, plus new items specific to this design pass:

- **`companies` / CRN table.** Not added. The policy tracker's cross-module join surface is technology category, not company identity (see [Cross-module linkage](#cross-module-linkage)). Where a record names a specific company (an institution row for Arm, a regulation row about the Newport Wafer Fab divestment), the existing free-text `title`/`description` fields carry that; a structured company dimension with CRN resolution belongs to dtfunding/the connecting repository, which already own that extraction. If the connecting repository later needs to pull policy-tracker records into a company-scoped view, that's a thin additive join table at that point, not a redesign here.
- **Automated name-entity extraction into `people`.** Structured person links are authored deliberately, not mined from prose — see above.
- **Five-level taxonomy (`taxonomy_terms`).** Still deferred per v2's own resolved decision. `sector_taxonomy_xref` is not a substitute for it — it's a narrower, cheaper guard against slug drift on the one level (sector) that's actually load-bearing for cross-module joins today.
- **Presentation metadata.** Unchanged from v2 — icons, accent colours, badge chip styling stay in static app config, not the database.

## Features and functionality

The existing HTML prototype already defines a working UX vocabulary — landscape grid of sector cards → sector view with tabs (Timeline / Institutions / Initiatives / Regulation / Breakthroughs / Evolving) → sub-tabs where a section has them → dated rows with badges, caveats, and verification state. That vocabulary carries forward; what changes is the backing store and what becomes possible once it's a real database instead of inline JS arrays plus CSV round-trips.

**Retained from the prototype:**
- Sector landscape grid, sector detail view, tab/sub-tab navigation exactly as today — driven by `sections`/`subtab_key` server-side instead of the client-side `SECTIONS` config, but the same shape.
- Per-sector framing prose and methodology notes (`sectors.framing_text`, `methodology_notes`).
- Badge rendering on breakthrough rows; sub-tab and status badges (dissolved/paused/unresolved) stay derived at render time, not stored, per v2's finding that they duplicated other fields.
- CSV import/export, retained as a bulk-editing path (researchers are already used to it) but now reading/writing through the database via upsert-on-`record_key`, not replacing whole in-memory sections.
- "No link verified" / caveat treatment for unverified or caveated entries.

**New, enabled by the schema change:**
- **Cross-sector search and filtering.** The prototype has no way to ask "show me every regulation record across all sectors mentioning export controls" — six independent JS arrays. A real query surface makes that trivial.
- **Re-verification queue.** `last_verified_date < now() - interval '6 months'` per v2's update workflow — a standing view/report of what's due for a research pass, per sector or globally. Not present in the prototype at all today.
- **Change history.** Every field update writes a `record_history` row with a reason. The prototype has no history — CSV import silently replaces whole sections. This is the audit trail the "DSIT stays dissolved, never renamed to DBIST" principle depends on.
- **Named-leaders roster.** A page/view listing `people` and the records they're linked to — the concrete output the briefing notes call out as "a useful output in its own right, distinct from the primary cascade-tracing use case."
- **Placeholder-sector pattern at the record level**, not just the sector level: `is_placeholder` + `canonical_record_id` lets a stub entry in one sector point at the full entry in another (the schema's stated use case), which the prototype's flat arrays can't represent at all.
- **Two-clock read surface** (`v_policy_signal_by_category`) for the connecting repository once it exists.

**Editorial workflow:**
- Roles: **researcher** (create/edit, triggers `record_history`), **reviewer** (approves status changes — e.g. evolving → resolved reclassification, and new/edited records before they go live), **public** (read-only, no login — see [Resolved decisions](#resolved-decisions)).
- Researcher edits land in a pending state; a reviewer approves before a record is publicly visible or a status change takes effect. This needs an explicit workflow state on `records` beyond v2's `status` enum (which tracks the record's real-world status, not its editorial review state) — see the schema note below.
- Upsert-by-`record_key` remains the update mechanism for both the UI form path and CSV import, matching v2's stated workflow.
- Retirement is always via `status`, never deletion, matching v2.

This adds one thing to the schema beyond the three extensions above: a `review_status` enum (`draft` \| `pending_review` \| `approved`) and a `submitted_by`/`reviewed_by` pair on `records`, plus the same on edits captured via `record_history`. Left out of `docs/schema.sql` for this pass — it's a Phase 3 concern, worth designing alongside the actual approval-queue UI rather than speculatively now.

## Proposed stack

Next.js on Render, Postgres on Neon.

- **Database:** Neon (serverless Postgres). This is plain Postgres — everything in `docs/schema.sql` applies unmodified; Neon isn't a fork, it's a hosting model (branch-per-environment, scale-to-zero). Row-level security, if needed later for the editorial roles above, is standard Postgres RLS and works the same on Neon as anywhere else.
- **App:** Next.js, deployed to Render as a Node web service (SSR/API routes needed, so not a static export). Server Actions or route handlers for the write path (record edits, CSV import), server components for the read path.
- **What's lost vs. a Supabase-hosted target** (the schema doc's original framing): Supabase's auto-generated PostgREST API, built-in Auth, Storage, and Realtime. None of those are load-bearing here — the app talks to Postgres directly through an ORM, auth is a small internal user set (researchers/reviewers), there's no file storage need, and there's no realtime requirement. Trading Supabase's BaaS convenience for Neon + Render is a reasonable fit for a Next.js app that already needs a real backend, not a net loss.
- **ORM/migrations:** Prisma, via the `@prisma/adapter-pg` driver adapter — matching the Founderfluence module's convention, for consistency across the stack (a shared ORM pattern makes it easier to eventually write cross-module queries/scripts against the connecting repository). `prisma/schema.prisma` mirrors `docs/schema.sql`; `prisma/migrations/0001_init/migration.sql` is that same DDL as Prisma's baseline migration. Schema changes going forward: edit `schema.prisma`, run `prisma migrate dev`, then mirror the result back into `docs/schema.sql` for anyone reading the design docs without a Postgres client handy.
- **Auth:** NextAuth (or Lucia) with a small credentialed user table, scoped to the researcher/reviewer roles above. No public account creation — public users get read-only access with no login.
- **Preview environments:** Neon database branches paired with Render preview environments, one per PR — cheap given Neon's branching model, and useful for reviewing schema/data changes before merge.

## Migration plan from the existing prototype

The prototype's `R()` tuple format already maps directly onto `CSV_COLS` (`section, type, title, subtitle, date, description, url, url_verified, badges, caveat, status`), which is nearly the v1→v2 crosswalk in the schema doc. Migration is mechanical:

1. Extract each `DATA_<SECTOR>` array (six sectors: quantum, engbio, ai, semiconductors, cyber, connectivity) via a one-off script — no hand re-entry.
2. Map `type` → `subtab_key` for `initiative`/`regulation` rows only; drop it otherwise (v2's resolved decision — it duplicated the badge vocabulary elsewhere and never rendered).
3. Migrate `badges` only for `breakthrough` rows; regulation-row badges and the `unresolved` badge are dropped as derivable from `subtab_key`/`section_key`, per v2.
4. Generate `record_key` as `{sector}__{section}__{title-slug}` for every row (this becomes the upsert key going forward — needs to be stable, so slugs are generated once at migration time and not regenerated from `title` on every edit).
5. Populate `sectors` from `SECTOR_META` (label, status, `updated` → `last_reviewed_date`) plus `SECTOR_FRAMING` (→ `framing_text`) and the per-sector footer prose (→ `methodology_notes`).
6. Every migrated row gets one `record_history` entry: `change_reason = 'migrated from HTML prototype'`.
7. Presentation config (icons, accent colours, blurbs, sort order — currently `SECTOR_META`/`SECTIONS` in the prototype's JS) moves to a static app-config file read by the frontend, per v2's explicit design decision.

## Phased roadmap

| Phase | Scope |
|---|---|
| 0 | This design doc (done) |
| 1 | Apply `docs/schema.sql` to a real Neon database (via `npx prisma migrate deploy`, or the raw `psql -f docs/schema.sql` / `db/seed/001_migrated_records.sql` path if the Node toolchain isn't set up yet); load the six-sector seed data (`npx prisma db seed`); verify row counts and spot-check against the prototype; add one placeholder-status sector row to exercise the "Coming soon" pattern (see [Resolved decisions](#resolved-decisions)) — done, seed data generated and validated against a local Postgres instance; not yet applied to the real Neon database, which this sandbox's network policy can't reach directly (raw Postgres wire protocol isn't allowed through its HTTPS-only egress) |
| 2 | Next.js read-only app (landscape grid, sector view, tabs/sub-tabs, search) deployed to Render, replacing the static HTML prototype — public, no login |
| 3 | Editorial write path: auth, researcher/reviewer roles, `review_status` + approval queue, record edit forms, CSV import/export against the database, `record_history` writes, re-verification queue view |
| 4 | `people`/`record_people` population, `sector_taxonomy_xref` populated from QUILT's ontology codes, seventh sector promoted from placeholder to active once its content is ready |
| 5 | `v_policy_signal_by_category` consumed by the connecting repository once that module exists — genuinely blocked on that repo, not on this one |

## Resolved decisions

From the initial open-questions pass:

1. **Editorial roles** → multi-user, researcher/reviewer split from the start. Phase 3 builds an approval queue (`review_status`), not just an audit log — see [Features and functionality](#features-and-functionality).
2. **Public access** → fully open read, no login, matching the current prototype. Only the write path (Phase 3) requires auth.
3. **Sector scope** → not closed; a seventh sector is expected reasonably soon. The placeholder-sector pattern (`sectors.status = 'placeholder'`, a disabled "Coming soon" card in the landscape grid — already present in the current prototype's `SECTOR_META`/`renderLandscape()`, just unused today) gets exercised in Phase 1 rather than left untested until the seventh sector is actually ready. Which sector is still open — flag it when known so its `sector_id` slug can be reserved and checked against QUILT's ontology at the same time.
4. **QUILT ontology codes** → you'll pull these directly rather than leaving it a standing open item. Once available, they populate `sector_taxonomy_xref` (Phase 4) — share them whenever convenient, doesn't block Phases 1-3.
