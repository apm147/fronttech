# Working notes for Claude Code sessions on this repo

## The user has no local machine

The user runs Claude Code from a tablet — there is no local terminal to hand
work off to. "Run this yourself locally" is not a usable fallback here the
way it might be for someone at a laptop. If a command can't run from inside
the session, that's a real blocker, not a minor inconvenience to route
around by pushing it to the user — check for a way to make it work from
inside the session before concluding the user needs to run it elsewhere.

## Before reporting a 403/connect_rejected as a fixed policy wall

This session runs behind an egress proxy (see `/root/.ccr/README.md`) with a
Custom-network-access allowlist configured per Claude Code Remote
*environment* — not a single fixed organization-wide rule. The user can edit
this themselves (environment settings in the claude.ai/code UI: Network
access → Custom → Allowed domains) — it's a knob they control, not something
that only an admin can touch.

So: a 403 or `connect_rejected` from the proxy on a *new* host (npm registry,
Neon, Render, etc.) is very possibly just "this host isn't on this
environment's allowlist yet," not a hard wall. Before telling the user work
has to move to their own machine (which, per above, they don't have):

1. Say plainly what host/domain got blocked.
2. Suggest they check this environment's Custom allowed-domains list and add
   it, rather than jumping straight to "here's how to do this elsewhere."
3. Remember raw-TCP protocols (Postgres wire protocol on 5432, etc.) can
   never work through this proxy regardless of the allowlist — it's
   HTTPS/CONNECT-only. An HTTPS-based alternative (e.g. Neon's
   `@neondatabase/serverless` HTTP driver instead of `psql`/raw
   `postgresql://`) is the thing allowlisting can actually unlock.

This was learned the slow way in this repo's Phase 1 (2026-08-27): hit npm
registry 403 and Neon `connect_rejected` twice each, defaulted both times to
"here's the local command to run instead" without asking whether the
environment's allowlist could just be widened — only found out that lever
existed when the user separately showed screenshots of other environments
(`founderfluence-dev`, `dtfunding-dev`) with Custom domains configured.
