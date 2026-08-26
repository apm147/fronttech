# UK Frontier Technology Landscape — Data Schema (v2)

Supersedes v1. Target is PostgreSQL/Supabase directly — Airtable is out of the migration path entirely.

## Changelog from v1

- **Dropped Airtable phase** — no Airtable-specific accommodations (union single-select workaround, linked-record badge tables) needed anymore; removed.
- **All three open items resolved**, in favour of the simplest schema that still fits the actual data (see "Resolved decisions" below).
- **Presentation metadata moved out of the database entirely.** Icons, accent colours, badge chip styling, section/sub-tab labels — none of that is queryable data, it's UI config. It now lives in a small static app-config file, not schema. This is the biggest structural simplification and it's what made most of the rest possible.
- `sections` and `subtabs` are no longer lookup tables — they're native Postgres `ENUM` types. Removes two tables and their joins.
- `taxonomy_terms` / `record_taxonomy` dropped from the schema entirely (was speculative, unpopulated, and not part of what's being built now).
- `category_label` field dropped from `records` — carried no real information in the source data (see v1 §5 finding); not migrated.
- `badges.display_style` dropped — presentational, moved to app config.
- `sectors.last_reviewed_label` dropped in favour of `last_reviewed_date` alone (was a redundant second source of truth for the same fact). `records.date_label` is **kept** — it's not redundant with `date_sort_key`, since source dates include un-parseable qualifiers ("Since Dec 2025", "Mon YYYY – ongoing") that a plain date can't preserve.
- Net table count: **5** (`sectors`, `records`, `badges`, `record_badges`, `record_history`) — down from 8 in v1.

## Resolved decisions

1. **`type`/`category_label` on breakthrough rows** → dropped, not migrated. It never rendered in the UI and duplicated the badge vocabulary with different wording. Breakthrough categorisation is carried by badges alone going forward.
2. **Badge scope** → stays strictly sector-scoped (`badges.sector_id NOT NULL`). No cross-sector tag capability. If a genuine cross-sector concept shows up later (e.g. an AI-adjacent tag), it gets a new sector-scoped badge in each relevant sector rather than a shared one — simpler constraint, no special-casing.
3. **`taxonomy_terms`** → deferred entirely, not built. When the five-level taxonomy is actually built, `badges` (breakthrough rows specifically) is the natural seed for the Sub-field/Technique levels — noted for later, nothing added to the schema now.

## Entity model

```
sectors 1───* records
                │
                ├─* record_badges *─1 badges  (badges scoped to sector)
                └─* record_history

records.canonical_record_id ─0..1→ records   (placeholder → full entry, self-ref)
```

### `sectors`

| Field | Type | Notes |
|---|---|---|
| `sector_id` | text PK | slug, e.g. `quantum` |
| `label` | text NOT NULL | proper name, e.g. "Quantum Technologies" — data, not styling |
| `status` | text | `active` \| `placeholder` |
| `framing_text` | text | context-setting prose |
| `methodology_notes` | text | sourcing/caveats prose |
| `last_reviewed_date` | date | |
| `created_at` / `updated_at` | timestamptz | |

Icon, accent colour, landscape-grid blurb, sort order → app config, not this table.

### `records` — core fact table

| Field | Type | Notes |
|---|---|---|
| `record_id` | uuid PK | immutable, assigned once |
| `record_key` | text, unique | human slug `{sector}__{section}__{title-slug}`; app-generated, used for upsert lookups during research passes |
| `sector_id` | FK → sectors | |
| `section_key` | enum | timeline \| institution \| initiative \| regulation \| breakthrough \| evolving |
| `subtab_key` | enum, nullable | only for `initiative`/`regulation` rows — enforced by a CHECK constraint |
| `title` | text | |
| `subtitle` | text, nullable | convention: key people, breakthrough rows only |
| `date_label` | text, nullable | free-text as authored |
| `date_sort_key` | date, nullable | normalised, day defaults to 01, for sorting |
| `date_precision` | enum, nullable | year \| month \| day \| range |
| `description` | text | |
| `url` | text, nullable | |
| `url_verified` | boolean | |
| `caveat` | text, nullable | |
| `status` | enum | active \| dissolved \| paused \| liquidation |
| `is_placeholder` | boolean | cross-sector placeholder pattern |
| `canonical_record_id` | FK → records, nullable, self-ref | required when `is_placeholder = true` |
| `source_tier` | enum, nullable | primary \| secondary \| partial |
| `last_verified_date` | date, nullable | drives re-verification passes |
| `sort_order` | int, nullable | preserves deliberate editorial ordering where date/alphabetical wouldn't (mainly institutions) |
| `created_at` / `updated_at` | timestamptz | |

### `badges` / `record_badges`

Sector-scoped tags. In practice these only carry real information on `breakthrough` rows — regulation-row badges duplicated `subtab_key` and the `unresolved` badge duplicated `section_key = 'evolving'` in every case observed in the source data, so neither gets migrated as a badge; both are derivable at query/render time instead.

| `badges` | Type |
|---|---|
| `badge_id` | text PK |
| `sector_id` | FK → sectors, NOT NULL |
| `label` | text |

`record_badges(record_id, badge_id)` — join table.

### `record_history`

Append-only. Nothing gets silently overwritten.

| Field | Type |
|---|---|
| `history_id` | uuid PK |
| `record_id` | FK → records |
| `changed_field` | text |
| `old_value` / `new_value` | text |
| `change_reason` | text |
| `source_ref` | text, nullable |
| `changed_by` | text |
| `changed_at` | timestamptz |

## DDL

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE section_key AS ENUM (
  'timeline', 'institution', 'initiative', 'regulation', 'breakthrough', 'evolving'
);

CREATE TYPE subtab_key AS ENUM (
  'domestic', 'international',
  'export', 'nsi', 'standards', 'ipsec',
  'crit-infra', 'cybercrime', 'consumer-telecoms', 'codes-standards',
  'spectrum', 'infra-access', 'satellite'
);

CREATE TYPE record_status AS ENUM ('active', 'dissolved', 'paused', 'liquidation');
CREATE TYPE source_tier   AS ENUM ('primary', 'secondary', 'partial');
CREATE TYPE date_precision AS ENUM ('year', 'month', 'day', 'range');

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────── sectors ───────────────────────────
CREATE TABLE sectors (
  sector_id           text PRIMARY KEY,
  label               text NOT NULL,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','placeholder')),
  framing_text        text,
  methodology_notes   text,
  last_reviewed_date  date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_sectors_updated_at
  BEFORE UPDATE ON sectors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────── records ───────────────────────────
CREATE TABLE records (
  record_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_key           text NOT NULL UNIQUE,
  sector_id            text NOT NULL REFERENCES sectors(sector_id),
  section_key          section_key NOT NULL,
  subtab_key           subtab_key,
  title                text NOT NULL,
  subtitle             text,
  date_label           text,
  date_sort_key        date,
  date_precision       date_precision,
  description          text NOT NULL,
  url                  text,
  url_verified         boolean NOT NULL DEFAULT false,
  caveat               text,
  status               record_status NOT NULL DEFAULT 'active',
  is_placeholder       boolean NOT NULL DEFAULT false,
  canonical_record_id  uuid REFERENCES records(record_id),
  source_tier          source_tier,
  last_verified_date   date,
  sort_order           int,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subtab_only_for_initiative_or_regulation CHECK (
    subtab_key IS NULL OR section_key IN ('initiative', 'regulation')
  ),
  CONSTRAINT placeholder_requires_canonical CHECK (
    is_placeholder = false OR canonical_record_id IS NOT NULL
  )
);

CREATE INDEX idx_records_sector_section  ON records(sector_id, section_key);
CREATE INDEX idx_records_subtab          ON records(subtab_key) WHERE subtab_key IS NOT NULL;
CREATE INDEX idx_records_canonical       ON records(canonical_record_id) WHERE canonical_record_id IS NOT NULL;
CREATE INDEX idx_records_last_verified   ON records(last_verified_date);

CREATE TRIGGER trg_records_updated_at
  BEFORE UPDATE ON records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────── badges ───────────────────────────
CREATE TABLE badges (
  badge_id   text PRIMARY KEY,
  sector_id  text NOT NULL REFERENCES sectors(sector_id),
  label      text NOT NULL,
  UNIQUE (sector_id, label)
);

CREATE TABLE record_badges (
  record_id  uuid NOT NULL REFERENCES records(record_id) ON DELETE CASCADE,
  badge_id   text NOT NULL REFERENCES badges(badge_id),
  PRIMARY KEY (record_id, badge_id)
);

-- ─────────────────────────── record_history ───────────────────────────
CREATE TABLE record_history (
  history_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id      uuid NOT NULL REFERENCES records(record_id),
  changed_field  text NOT NULL,
  old_value      text,
  new_value      text,
  change_reason  text,
  source_ref     text,
  changed_by     text NOT NULL,
  changed_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_record_history_record ON record_history(record_id, changed_at);
```

## Old → new crosswalk (unchanged fields omitted)

| Old (`CSV_COLS`) | New |
|---|---|
| `type` | `subtab_key` (initiative/regulation only) — **dropped otherwise**, not migrated |
| `badges` (semicolon list) | `record_badges` — **only breakthrough-row badges migrate**; regulation-row and `unresolved` badges are dropped, derivable from `subtab_key`/`section_key` at query time |
| *(none)* | `record_id`, `record_key`, `is_placeholder`, `canonical_record_id`, `source_tier`, `last_verified_date`, `sort_order` |

## Update workflow (unchanged from v1)

1. Look up by `record_key`; update in place, write a `record_history` row — never silent overwrite.
2. Retire via `status`, never delete — DSIT stays a dissolved record, not renamed to DBIST.
3. Evolving → resolved: change `section_key`, log the reclassification with a `change_reason`.
4. `last_verified_date < now() - interval '6 months'` finds what's due for re-verification, per sector or globally.

## What's deliberately not in this schema

Presentation (icons, accent colours, section/sub-tab display labels, badge chip styling) — belongs in a small static app-config object the frontend reads alongside query results, not in Postgres. Keeping it out of the schema is what let `sections`/`subtabs` collapse into enums and dropped two tables.
