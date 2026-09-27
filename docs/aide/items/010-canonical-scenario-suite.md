# Item 010 — Canonical scoring scenario test suite

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-20

---

## Description

Build a comprehensive, **named** test suite of canonical base-game scoring scenarios that exercises the **full engine end to end** via `scoreBoard(board, catalog)` (Item 009): single-owner city/road/monastery, contested and tied features, multi-pennant cities, a fully completed **mixed board**, and edge cases (a feature spanning many tiles; two separate features of the same type). This suite is the **regression safety net** for every later stage and the artefact that **demonstrably satisfies the Stage 1 acceptance criteria**.

This is the final Stage 1 item. It is **primarily tests** — Items 006–009 already implemented the engine. The value here is breadth, naming, and clarity: each scenario is a small hand-authored board with a precisely asserted `BoardScore` (per-feature scores **and** per-player totals), so a future regression points at a named, readable case.

### Scope boundary

- **Tests, not new behaviour.** Do **not** add new scoring rules or change the engine's public API. The engine (Items 006–009) is the system under test.
- **If a scenario reveals a genuine engine bug, fix the engine** (in the relevant `scoring/`, `features/`, or `catalog/` module) as part of this item and record it under Decisions — do **not** weaken an assertion to make a wrong result pass. The official Carcassonne rules are the contract.
- **Base game, completed-feature (incremental) scoring only.** Incomplete-feature end-game scoring and farmers are **Stage 4** — not asserted here (beyond confirming incomplete features are correctly **excluded** by the engine).

## Design decisions (decided here)

- **One dedicated, well-organised suite.** Add `packages/core/test/scenarios.test.ts` (a `test/scenarios/` folder with small fixtures is also fine), grouped into `describe` blocks by category (single-owner, contested/tied, pennants, mixed board, edge cases, exclusions). Every scenario has a descriptive name stating the expected outcome.
- **Drive the public engine.** Scenarios call `scoreBoard(board, baseGameCatalog)` and assert on the returned `BoardScore` (`features` and `playerTotals`). Author boards with `createBoard()` (Item 002) + `baseGameCatalog` (Item 004). Reuse closed-feature fixture patterns already proven in `feature-extraction.test.ts` / `engine.test.ts`.
- **Assert exact values, not just shapes.** Each scenario asserts concrete point totals and credited player ids (e.g. "P1: 4, P2: 0", or a tie crediting both). A shared, tiny helper (e.g. `expectPlayerTotals` / a board-builder) is encouraged to keep cases readable, but the assertions must be explicit per scenario.
- **Test-only by default.** No production-code change is expected. Any engine fix prompted by a failing scenario is allowed and must be documented (see Scope boundary).

## Canonical scenarios (the required coverage)

The suite MUST include at least these named scenarios, each asserting exact `points`/`players`/`playerTotals`:

1. **Single-owner completed city** — a closed multi-tile city, one player → `2 × tiles` to that player.
2. **Single-owner completed city with pennant** — closed city including ≥1 pennant tile → `2 × tiles + 2 × pennants`.
3. **Multi-pennant city** — a closed city containing ≥2 pennants → both bonuses summed.
4. **Single-owner completed road** — a road closed at both ends → `1 × tiles`.
5. **Single-owner completed monastery** — cloister + all 8 neighbours, one monk → `9`.
6. **Contested feature, clear majority** — one player with more meeples than another on a completed feature → majority player scores in full, the other 0.
7. **Two-way tie** — equal meeples on a completed feature → both players score the full feature value.
8. **Three-way tie** — three players equal → all three score the full feature value.
9. **Large feature spanning many tiles** — a long road or large city across several tiles → correct tile-count scoring (guards no off-by-one in extraction/tally).
10. **Two separate features of the same type** — two distinct completed roads (or cities) on one board → two independent score entries; per-player totals aggregate across both.
11. **Fully completed mixed board** — a city + a road + a monastery, meeples of ≥2 players → assert the full `BoardScore` (`features` list and `playerTotals`).
12. **Unowned completed feature** — a completed feature with no meeple → worth its points but credited to nobody (`players: []`, 0 in totals).
13. **Incomplete features excluded** — open city/road and a ≤7-neighbour monastery present alongside completed features → only the completed ones score.
14. **Empty board** — `scoreBoard` → `{ features: [], playerTotals: {} }`.

## Acceptance criteria

- [x] A comprehensive, **named** scenario suite (e.g. `packages/core/test/scenarios.test.ts`) exists and **all of it passes**, driving the public `scoreBoard(board, catalog)`.
- [x] All 14 canonical scenarios above are present as clearly-named tests, each asserting **exact** points and credited players / `playerTotals` (not just non-empty / shape checks).
- [x] Coverage demonstrably spans: single-owner city/road/monastery; contested (clear majority); two-way **and** three-way ties; single- and multi-pennant cities; a fully completed mixed board; a many-tile feature; two separate same-type features; an unowned completed feature; incomplete-feature exclusion; empty board.
- [x] The suite demonstrably satisfies the Stage 1 acceptance criteria **"Engine returns correct scores for completed cities, roads, and monasteries from a hand-authored board state"** and **"Contested features award points by official majority/tie rules."**
- [x] No engine public-API change; if a scenario exposed a real bug, the engine was fixed (not the assertion) and the fix is recorded under Decisions.
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–009) remain green.

> Maps to the Stage 1 deliverable "Comprehensive unit tests for canonical base-game scenarios …" and is the proof artefact for the Stage 1 scoring acceptance criteria. **This item completes Stage 1.**

## Assumptions

- None recorded. Specified and delivered before the aide-loop migration (2026-09-27); decisions taken during implementation are under Decisions & Trade-offs below and in the legacy run record `../runs/010/`.

## Implementation steps

1. Read `packages/core/src/index.ts` (public engine API: `scoreBoard`, `BoardScore`, `FeatureScore`), and the existing `feature-extraction.test.ts` / `engine.test.ts` for proven closed-feature fixtures and helper patterns.
2. Add `packages/core/test/scenarios.test.ts` (optionally a `test/scenarios/` fixtures helper): the 14 named scenarios grouped by `describe` category, each asserting exact `BoardScore`.
3. Optionally add a tiny shared helper for board construction / total assertions to keep cases readable (test-only).
4. Run `npm run lint && npm run build && npm test`. If any scenario fails because the engine is wrong, fix the engine in the appropriate module and note it under Decisions; otherwise adjust only the test.
5. Re-run until green.

## Testing strategy

- **Vitest** in `packages/core/test/scenarios.test.ts`, end-to-end through `scoreBoard(board, baseGameCatalog)`:
  - Group by category (`describe`): single-owner, contested & ties, pennants, mixed board, large/multiple features, exclusions & empty.
  - For closed cities use cap-to-cap / enclosed fixtures; for closed roads terminate both ends into city/monastery tiles or form a loop; for monasteries surround with all 8 neighbours (reuse Item 006/009 fixtures).
  - Assert exact `playerTotals` and, where useful, the `features` array (types, points, players). Include at least one scenario building the same board in shuffled input order to reconfirm deterministic scoring at the suite level.
  - Keep each scenario small and independently readable — this suite is documentation as much as verification.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Items 002 (`createBoard`), 004 (`baseGameCatalog`), 006 (`extractFeatures`), 007 (`resolveOwnership`), 008 (`scoreCity`/`scoreRoad`), 009 (`scoreBoard`/`BoardScore`). Consumes the public API; changes engine code only to fix a proven bug.
- **Downstream:** Every later stage relies on this as the base-game scoring regression net (Stage 2 scorepad, Stage 4 end-game, Stage 5 expansions, Stages 7/8 photo scoring). **Completes Stage 1.**

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars, secrets, config files, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (scenario suite green; Items 001–009 suites still green)
- [x] Services started — N/A
- [x] Application runs — N/A
- [x] Feature verified — all 14 canonical scenarios present and passing, asserting exact scores/totals via `scoreBoard`
- [x] Data verified — single-owner, majority, two-way & three-way ties, pennants, mixed board, many-tile & two-same-type features, unowned, incomplete-excluded, empty board all asserted exactly
- [x] Health checks pass — N/A

**Expected Outcomes**
- A named canonical scenario suite, all passing, that demonstrably satisfies the Stage 1 scoring acceptance criteria.
- `npm run lint && npm run build && npm test` exits 0. Stage 1 complete.

## Validation Results
- [x] Service started: N/A
- [x] Application started successfully: N/A
- [x] Database tables verified: N/A
- [x] Seed data verified: N/A
- [x] API endpoints verified: N/A
- [x] Screenshots captured: N/A (no UI)

## Decisions & Trade-offs

- **No engine bug found.** Every one of the 16 scenario tests passed against the existing Item 006–009 engine on first run; no production-code change was needed or made. This item is test-only, as anticipated by the scope boundary.
- **Multi-pennant city fixture composition.** To build a closed city with ≥2 pennant tiles from existing base-game tile shapes (without adding new catalog tiles), the suite chains `BASE-C` (whole-tile pennant city) → `BASE-F` (through-city N/S, pennant) → a plain `BASE-E` cap on one axis, with plain `BASE-E` caps on the other three open sides of `BASE-C`. This yields a 6-tile, 2-pennant closed city scoring 16 points.
- **Many-tile feature fixture.** A 6-tile road chain (`BASE-A` dead-end cap + four `BASE-U` straight segments + `BASE-A` dead-end cap) was used for the "large feature spanning many tiles" scenario rather than a large city, because base-game road tiles compose cleanly into long straight chains and keep the fixture easy to read while still guarding against off-by-one errors in extraction/tally.
- **Fixture-pattern reuse.** Boards are authored with `createBoard()` (Item 002) and `baseGameCatalog` (Item 004), reusing the closed-feature fixture patterns already proven in `feature-extraction.test.ts`, `city-road-scoring.test.ts`, and `engine.test.ts` (cap-to-cap closed cities, dead-end-to-dead-end closed roads, monasteries surrounded by all 8 neighbours) rather than inventing new construction idioms.
- **Minimal shared helper.** One small local helper, `scoreAt(result, type, position)` (mirroring the existing `featureFor` pattern), was added and used only in the mixed-board scenario where multiple completed features of different types coexist; all other scenarios index `result.features` directly since each of those boards has exactly one scored feature.
- **Bonus determinism check.** Beyond the spec's minimum, the mixed-board scenario includes a second test that rebuilds the same board with reversed tile/meeple insertion order and asserts a deep-equal `BoardScore`, reinforcing the determinism already required by Item 009 at the suite level.

## Completion Reminder

When complete, update [progress.md](../progress.md): mark the Stage 1 deliverable **"Comprehensive unit tests for canonical base-game scenarios …"** ✅. With every Stage 1 deliverable and all four Stage 1 acceptance criteria now complete, **flip Stage 1 to ✅ Complete** — both in the **Overall progress** table row and the **Stage 1 section header**. Confirm the two scoring acceptance criteria (ticked in Item 009) remain ticked. Do not touch later stages. This empties `queue-001.md`; the next action is `/speckit-aide-create-queue` to generate `queue-002.md` for Stage 2. Status flow for this item: 📋 → 🚧 → ✅.
