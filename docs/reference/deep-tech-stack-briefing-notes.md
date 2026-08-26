# Deep Tech Intelligence Stack — Architecture Briefing Notes

**Purpose:** This note captures the five-component architecture as it currently stands, with emphasis on how the components interlink and why. It's intended to ground the specification and design of the two proposed components — the policy tracker and the investor tracker. Companion visual: `deep-tech-stack-architecture.html`.

**Date:** 26 August 2026

---

## The five components

1. **QUILT** *(Built)* — Innovate UK funded-projects intelligence. A Postgres dimensional model over Innovate UK's published grant data, classified against a Deep Tech Ontology that tags projects and organisations by technology category — turning free-text project descriptions into queryable facets.

2. **Funding stack analyser / dtfunding** *(Built)* — Reconstructs a UK private company's capital structure directly from Companies House filings (SH01, CS01, AR01): share ledgers, funding rounds with valuations and dilution, and secondary-transaction detection.

3. **Founderfluence** *(Built)* — Tests the "Founder Mode" leadership framework against how UK deeptech/biotech founders actually talk about their roles in interviews and press, using a curated corpus and an LLM-driven evidence-extraction pipeline.

4. **Policy tracker** *(Proposed)* — Extends an existing six-category frontier-technology framework into a dated feed of strategy documents, consultations, and funding-body pronouncements, tagged the same way QUILT tags projects.

5. **Investor tracker** *(Proposed)* — Builds an investor entity graph from Companies House filings and ad hoc investment announcements, scoped to investors holding stakes in QUILT-tagged frontier-tech companies. Deliberately not a general-purpose investor database.

## The connecting repository

All five resolve to a company via its Companies House number — `dim_participant.crn` in QUILT, `companies.id` in dtfunding, company records in Founderfluence, and the same key proposed for the policy tracker and investor tracker. The connecting repository is the unified entity graph built on that key. It's what turns five separate tools into one longitudinal panel: for a given company, its grant history, capital structure, founder narrative, policy context, and investor base all resolve to the same row.

## Interlinkages and rationale

This is the section that matters most for specifying the two new components — not what each does standalone, but what it has to plug into.

**QUILT → Investor tracker (scoping).**
The investor tracker's universe isn't "all UK investors" — it's investors with stakes in companies QUILT has already tagged as frontier tech. QUILT's ontology is the filter that keeps the entity-resolution work bounded rather than open-ended.

**QUILT ↔ Policy tracker (the two-clock mismatch).**
QUILT records what got funded; nothing currently records what was promised first. Tagging policy documents with the same technology categories QUILT uses lets funding deployment (QUILT's clock) be checked against policy signal (the tracker's clock), by category — the two-clock mismatch argument, made measurable rather than asserted.

**dtfunding → Investor tracker (shared extraction).**
Every SH01/CS01/AR01 filing dtfunding already parses contains named shareholders — individuals and vehicles. The investor tracker doesn't need new data access; it needs an entity-resolution layer on top of extraction that already exists, plus one addition: the PSC register, to unwind corporate general partners to the individuals behind them.

**dtfunding → Founderfluence (the funding lens).**
Founderfluence currently tracks growth-stage milestones manually. Swapping those for dtfunding's dated capital events (rounds, valuations, dilution) turns founder role-mix salience from anecdote into a time series that can be regressed against actual capital events — does a narrative shift precede a raise, follow one, or track a grant-driven crowd-in.

**Policy tracker ↔ Investor tracker (named leaders).**
The policy taxonomy tracks individual leaders as well as companies. That natural-person table can resolve against the same PSC/GP identities being built for the investor graph — surfacing people who sit on both sides of policy and capital. A useful output in its own right, distinct from the primary cascade-tracing use case.

**Government-backed cascade (the closing-the-loop mechanism).**
British Business Bank and its subsidiaries (British Patient Capital, the National Security Strategic Investment Fund, the Investor Pathways Capital programme) publicly disclose cornerstone LP commitments into private VC funds. Seeding the investor tracker with that public list, then tracing each fund's subsequent portfolio companies via Companies House, and cross-referencing those companies against QUILT's grant recipients, separates two distinct government funding channels — direct grant, indirect equity — hitting the same or different companies. That's a sharper crowd-in/crowd-out test than treating "government support" as one variable.

## What this is for

- **Advisory outputs** — due diligence and policy guidance, the near-term application.
- **Book empirical spine** — the crowd-in/crowd-out test and two-clock mismatch validation, the dataset design the causal-inference chapter needs. (Note: this dataset design is necessary but not sufficient — the causal-inference methodology itself, quasi-experimental technique for retrospective panel data, remains a separate, unaddressed capability gap.)

## Open items to carry into specification

- **LP disclosure timing.** UK limited partnership transparency reforms under the Economic Crime and Corporate Transparency Act are phasing in through 2026 — general partners will need to disclose partner-level information for UK limited partnerships. Historical filings will stay thin; anything filed forward should improve. The investor tracker is being built right as the underlying data gets better, not after.
- **Offshore blind spot.** Non-UK-domiciled LP vehicles (common for pension-fund LPs, often Jersey/Guernsey-registered) won't appear in Companies House. The government-LP cascade is largely insulated from this since BBB discloses its own commitments regardless of fund domicile; a complete picture of all private LPs is not achievable through this route alone.

---

*Companion visual: `deep-tech-stack-architecture.html` — contains the full architecture diagram and the investor-tracker entity-resolution pipeline diagram.*
