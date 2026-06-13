# TableMind Web Product Architecture

This directory records the product architecture package for evolving TableMind
from the current local playtest UI into a fuller Web product shell. It is a
planning and execution reference; it does not replace `docs/PRD.md`,
`specs/SPEC_MATRIX.md`, or `docs/CURRENT_STATUS.md` as sources of current
scope and implementation status.

## Core Conclusions

- TableMind Core remains the gameplay core: room state, rules, event log,
  AI DM orchestration, spoiler guard, Host review, combat, and recap.
- Web Product Shell owns the productized experience around that core: entry,
  navigation, Host console, player view, session room, logs, and archives.
- The external UI package is absorbed only as visual-system and feature-blueprint
  input, not as a replacement product or direct `apps/web` overwrite.
- P0 focuses on Play / Session Room / Host Console / Player View.
- P1 can expand into Adventure Studio, Archive, and Library.
- P2 can consider full VTT features, maps, marketplace, accounts, payments, and
  broader production platform work.

## Document Entry Points

- [Main architecture plan](./TableMind_Web_Product_Architecture_and_Implementation_Plan.md)
- [PDF export](./exports/TableMind_Web_Product_Architecture_and_Implementation_Plan.pdf)
- [DOCX export](./exports/TableMind_Web_Product_Architecture_and_Implementation_Plan.docx)
- [Architecture diagrams](./diagrams/)
- [Codex product shell prompt](./codex-prompts/tablemind_web_product_shell_codex_prompt.md)

The Markdown plan is the canonical source of truth in this repository. The PDF
and DOCX exports are included as small external-deliverable snapshots.

## Recommended Reading Order

1. [Project README](../../../README.md)
2. [Product PRD](../../PRD.md)
3. [Current status](../../CURRENT_STATUS.md)
4. [Main architecture plan](./TableMind_Web_Product_Architecture_and_Implementation_Plan.md)
5. [Codex product shell prompt](./codex-prompts/tablemind_web_product_shell_codex_prompt.md)
