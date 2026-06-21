# Commit Record — Item 013

- Status: committed
- Short hash: `a9dcc6f`
- Branch: `aide/item-013`
- Subject: `feat(item-013): standard accessible meeple colour set`
- Date: 2026-06-21

## What was committed

- Colours module (`packages/core/src/colours/{types,errors,data,accessor,index}.ts`) + test (`packages/core/test/meeple-colours.test.ts`)
- Core index export update (`packages/core/src/index.ts`)
- Item spec (`docs/aide/items/013-meeple-colour-set.md`)
- Progress tracker update (`docs/aide/progress.md`)
- Run handoffs (`docs/aide/runs/013/{implementation,check,docs}.md`)
- Prior item commit record (`docs/aide/runs/012/commit.md`)

## Commit message

```
feat(item-013): standard accessible meeple colour set

Implement a platform-independent data + accessor module for the standard meeple
colour set in @carcassonne/core: 6 colours (red, blue, green, yellow, black,
gray) with unique ids and distinct pattern distinguishers for accessibility.
Exports MeepleColour type, meepleColours data, and accessor functions
(getMeepleColour, hasMeepleColour, meepleColourIds) with typed error handling.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

## Notes

- All checks (lint, build, test) passed as verified by checker.
- No DOM references; no cyclic imports.
- Per-item branch convention followed: created `aide/item-013` from `aide/item-012` HEAD and committed there.
- Untracked files (`.claude/`, `.specify/`, `CLAUDE.md`, `memory/`) and `.gitignore` modifications intentionally left unstaged.
