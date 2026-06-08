# TableMind Demo Goal Pack

Generated: 2026-06-08

This pack records the local browser-demo target for the current TableMind MVP
work. It complements `docs/PRD.md`, `specs/GOAL_ACCEPTANCE_GATES.md`, and
`docs/playtests/*` evidence. It is not a production launch checklist.

## Pack Files

- `DEMO_SCOPE_GAP_ANALYSIS.md`: current code foundation, demo gap analysis, and
  closure evidence.
- `TABLEMIND_DEMO_GOAL_RUNBOOK.md`: repeatable local demo and verification
  procedure.
- `CODEX_GOAL_PROMPTS_TABLEMIND_DEMO.md`: copyable `/goal` prompts for planning
  or long-running demo work.
- `DEMO_ACCEPTANCE_CHECKLIST.md`: final demo acceptance checklist for one Host
  and two players.
- Root `AGENTS.md`: project development rules that workers should read before
  making changes.

## Recommended Use

For future work, start with the planning prompt in
`CODEX_GOAL_PROMPTS_TABLEMIND_DEMO.md`, confirm the slice, and then proceed in
small, testable increments. If a long-running goal is used, keep the priority on
a complete Host plus two-player vertical demo flow instead of broad production
features.

## Current Demo Definition

The accepted local demo is a text-first browser experience for:

- one Host;
- two players;
- the original `The Lantern Beneath the Hill` / `山丘下的灯火` adventure fixture;
- mock/disabled provider mode by default;
- deterministic rules, checks, combat, and recap;
- English and Simplified Chinese fixed UI/recap labels;
- explicit English and Simplified Chinese authored adventure text for the
  built-in Lantern demo;
- strict player no-leak boundaries.

## Strategy

TableMind already has first-party room, projection, rules, AI review, recap, and
browser UI foundations. Demo work should remain incremental:

1. Keep Host and player browser flows usable without internal IDs.
2. Keep combat operations derived from projected state.
3. Keep risky AI output behind Host review.
4. Keep locale handling explicit and authored.
5. Keep player-facing snapshots, HTTP, SSE, UI, and recap no-leak boundaries
   covered by tests.

## Non-Goals

This pack does not claim production auth, durable persistence, public hosting,
payment, marketplace, deployment, D&D Beyond sync, PDF full import, full VTT,
full character builder, complete 5e automation, or unsupervised live-provider
readiness.
