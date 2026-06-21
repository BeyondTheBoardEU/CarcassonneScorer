# Commit Record — Item 010

- **Status:** Committed
- **Branch:** aide/item-010
- **Hash:** 1e6e85d
- **Subject:** test(item-010): canonical base-game scoring scenario suite
- **Date:** 2026-06-20

## Summary

Committed a comprehensive, named test suite (packages/core/test/scenarios.test.ts) with 16 tests across all 14 canonical base-game scoring scenarios. The suite exercises scoreBoard() end to end with hand-authored boards and exact assertions on points, ownership, and player totals. Covers single-owner city/road/monastery, multi-pennant cities, contested majorities, ties, multi-tile features, mixed boards, and edge cases. Checker verdict was PASS (all 16 tests pass, npm run lint/build/test all succeed, no prior suite regressions). No engine bug found; item is test-only.

## Files committed

- `packages/core/test/scenarios.test.ts` — new test suite (16 tests)
- `docs/aide/items/010-canonical-scenario-suite.md` — item spec with updated decisions/checklists
- `docs/aide/progress.md` — Stage 1 marked complete, overall progress updated
- `docs/aide/runs/010/{implementation,check,docs}.md` — handoff reports
- `docs/aide/runs/009/commit.md` — prior item's commit record

## Unstaged

- `.gitignore` (local modification, not item-related)
- `.claude/`, `.specify/`, `CLAUDE.md` (local untracked, not item-related)
- `docs/aide/runs/005/commit.md` (pre-existing modification, not this item)

## Notes

This commit completes Stage 1. All four Stage 1 acceptance criteria and five deliverables are satisfied. No pre-commit hooks failed.
