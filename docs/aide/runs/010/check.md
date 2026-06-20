# Check Report — Item 010
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-20
- Attempt: 1

## Commands run
- `npm run lint` → exit 0 (eslint + prettier --check, no issues)
- `npm run build` → exit 0 (`tsc -p packages/core/tsconfig.json --noEmit`)
- `npm test` → exit 0 — 254 tests passed across 10 files, including 16 tests in `packages/core/test/scenarios.test.ts`
- `npx vitest run packages/core/test/scenarios.test.ts` (targeted) → exit 0, 16/16 passed standalone

## Acceptance criteria (from the spec)
- [x] A comprehensive, named scenario suite exists and all of it passes, driving the public `scoreBoard(board, catalog)` — `packages/core/test/scenarios.test.ts:19` imports `createBoard, baseGameCatalog, scoreBoard` from the public `../src/index.js` and every one of the 16 tests calls `scoreBoard(board, catalog)`.
- [x] All 14 canonical scenarios present as clearly-named tests, each asserting exact points/players/playerTotals — verified each `describe` block individually:
  1. Single-owner city — `scenarios.test.ts:55-72` (`city.points=4`, `players=["alice"]`, `playerTotals={alice:4}`)
  2. Single-owner city w/ pennant — `scenarios.test.ts:79-96` (`points=8`, `players=["bob"]`)
  3. Multi-pennant city — `scenarios.test.ts:103-130` (`points=16`, 6 tiles/2 pennants, `players=["carol"]`)
  4. Single-owner road — `scenarios.test.ts:137-153` (`points=2`, `players=["dave"]`)
  5. Single-owner monastery — `scenarios.test.ts:160-177` (`points=9`, `players=["eve"]`)
  6. Contested clear majority — `scenarios.test.ts:184-204` (frank 2 meeples beats grace 1; `players=["frank"]`, `playerTotals.grace` undefined)
  7. Two-way tie — `scenarios.test.ts:211-226` (`players=["alice","bob"]`, both credited 4 each)
  8. Three-way tie — `scenarios.test.ts:233-254` (`players=["p1","p2","p3"]`, all credited 3 each)
  9. Many-tile feature — `scenarios.test.ts:261-283` (6-tile road, `tileCount=6`, `points=6`)
  10. Two separate same-type features — `scenarios.test.ts:290-312` (two independent roads, 2 score entries, `playerTotals={ivan:4}` aggregated)
  11. Fully completed mixed board — `scenarios.test.ts:319-374` (city+road+monastery, exact per-feature and `playerTotals={alice:13, bob:2}`, plus a shuffled-order determinism check at line 362)
  12. Unowned completed feature — `scenarios.test.ts:381-408` (unowned city and unowned monastery, `players=[]`, `playerTotals={}`)
  13. Incomplete-feature exclusion — `scenarios.test.ts:415-447` (open city/road + 7-neighbour monastery present but excluded; only the completed city scores)
  14. Empty board — `scenarios.test.ts:454-459` (`{features:[], playerTotals:{}}`)
- [x] Coverage demonstrably spans every category listed in the spec (single-owner city/road/monastery, contested majority, two-way & three-way ties, single/multi-pennant cities, mixed board, many-tile feature, two same-type features, unowned feature, incomplete exclusion, empty board) — confirmed by the enumeration above.
- [x] Suite demonstrably satisfies the Stage 1 acceptance criteria "Engine returns correct scores for completed cities, roads, and monasteries…" and "Contested features award points by official majority/tie rules" — scenarios 1–5 cover the former; 6–8 cover the latter, all asserting exact values end-to-end through `scoreBoard`.
- [x] No engine public-API change; if a bug was found it was fixed not weakened — confirmed via `git log --oneline -- packages/core/src/index.ts`, last touched by item-009 (commit `5809216`), untouched by this item. `git status` / `git diff` show only `packages/core/test/scenarios.test.ts` added under `packages/core`; no file under `packages/core/src` is modified or staged. Implementation report states "No engine bug found" — consistent with observed evidence.
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–009) remain green — full run shows 10/10 test files passing, 254/254 tests passing, including `city-road-scoring.test.ts` (13), `engine.test.ts` (9), `feature-extraction.test.ts` (19), `catalog-consistency.test.ts` (30), `catalog.test.ts` (71), `base-game-catalog.test.ts` (54), `smoke.test.ts` (2), `ownership.test.ts` (11), `board-state.test.ts` (29) — all unaffected by this item.

## Spot-checks against official rules / engine source
- City scoring formula `2 * tileCount + 2 * pennants` confirmed at `packages/core/src/scoring/feature-score.ts:44-59` (`scoreCity`); matches test math (e.g. `2*3+2*1=8`, `2*6+2*2=16`).
- Road scoring formula `1 * tileCount` confirmed at `packages/core/src/scoring/feature-score.ts:68-82` (`scoreRoad`).
- Monastery flat 9 confirmed at `packages/core/src/scoring/monastery.ts:26-38` (`scoreMonastery`).
- Tie behaviour (every tied player credited the full feature value) confirmed at `packages/core/src/scoring/ownership.ts:32-55` (`resolveOwnership` returns all players at `topCount`, sorted); `feature-score.ts`/`monastery.ts` assign the full `points` to each name in `owners`, matching scenarios 7 and 8.
- Tile fixtures verified against `packages/core/src/catalog/data/base-game.ts`: BASE-B is monastery-only (no road) confirming the isolated-monastery fixtures at lines 78-93; BASE-C is a whole-tile pennant city (sides N/E/S/W) at lines 107-118; BASE-E is a city cap on N only, no pennant, at lines 185-200; BASE-F is a pennant city through N/S at lines 219-234; BASE-U is a straight N/S road at lines 869-884 — all consistent with the test file's inline comments and the claimed tile counts/pennant counts.

## Notes
- The mixed-board scenario's `playerTotals` assertion (`scenarios.test.ts:356-359`) is written as `{ alice: 4 + 9, bob: 2 }`, i.e. `alice: 13`, which is exact (not symbolic) — verified.
- A deterministic-order regression check (reversed tile/meeple insertion order on the same mixed board, `scenarios.test.ts:362-374`) is a useful bonus beyond the spec's minimum, reinforcing determinism already required by Item 009.
- No source files outside the test suite were touched by this item; the implementer's claim of "test-only, no engine bug found" is corroborated by `git log`/`git status`.

## Required fixes (only if Verdict: FAIL)
- None — Verdict is PASS.
