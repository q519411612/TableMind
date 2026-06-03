# TableMind MVP 0.7 to 1.0 Spec Pack

This zip is intended to be extracted at the repository root.

It adds planning/specification documents only. It does not replace production code.

## Files included

- `docs/roadmaps/MVP_0_7_to_1_0.md`
- `docs/codex/GOAL_RUNBOOK_MVP_1_0.md`
- `specs/SPEC_MATRIX_MVP_0_7_TO_1_0.md`
- `specs/GOAL_ACCEPTANCE_GATES.md`
- `specs/CODEX_GOAL_PROMPT.md`
- `specs/015-mvp-07-eventized-room-core/{requirements,design,tasks}.md`
- `specs/016-mvp-08-transport-contract/{requirements,design,tasks}.md`
- `specs/017-mvp-09-playtest-ui/{requirements,design,tasks}.md`
- `specs/018-mvp-1-0-live-ai-playtest/{requirements,design,tasks}.md`

## Suggested merge command

From the repository root:

```bash
unzip tablemind-mvp-07-to-10-spec-pack.zip

git status
git add docs/roadmaps docs/codex specs/SPEC_MATRIX_MVP_0_7_TO_1_0.md specs/GOAL_ACCEPTANCE_GATES.md specs/CODEX_GOAL_PROMPT.md specs/015-mvp-07-eventized-room-core specs/016-mvp-08-transport-contract specs/017-mvp-09-playtest-ui specs/018-mvp-1-0-live-ai-playtest _README_MVP_0_7_TO_1_0_SPEC_PACK.md
git commit -m "docs: add MVP 0.7 to 1.0 spec roadmap"
```

## Suggested first Codex `/goal`

```txt
/goal Read specs/CODEX_GOAL_PROMPT.md, specs/GOAL_ACCEPTANCE_GATES.md, docs/roadmaps/MVP_0_7_to_1_0.md, and specs/015-mvp-07-eventized-room-core/**. Implement MVP-0.7A only: eventize player.joined, character.created, adventure.loaded, and session.started; add replay acceptance coverage; do not implement transport, UI, or live AI. Run npm run check, npm test, npm run acceptance, and npm run build. Report changed files, tests run, acceptance criteria satisfied, and deferred work.
```
