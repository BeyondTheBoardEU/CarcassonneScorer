# Check Report — Item 009
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-20
- Attempt: 1

## Commands run
- `npm run lint` → exit 0 (eslint clean, prettier "All matched files use Prettier code style!")
- `npm run build` → exit 0 (`tsc -p packages/core/tsconfig.json --noEmit`, no errors)
- `npm test` → exit 0 (9 test files, 238 tests, all passed)
- `npx vitest run packages/core/test/engine.test.ts --reporter=verbose` → exit 0, 9/9 tests passed (run independently to confirm the new suite in isolation)

## Acceptance criteria (from the spec)
- [x] `scoreMonastery`, `scoreBoard`, `BoardScore`, and `scoreCompletedFeatures` implemented and exported from `@carcassonne/core` — `packages/core/src/scoring/monastery.ts:26` (`scoreMonastery`), `packages/core/src/scoring/engine.ts:36` (`scoreCompletedFeatures`) and `:66` (`scoreBoard`), `engine.ts:21` (`BoardScore`); re-exported via `packages/core/src/scoring/index.ts:14-17` and `packages/core/src/index.ts:89-90`. All functions read-only on inputs (no mutation of `feature`/`features`/`board`); verified by inspection — only `Object.create`-style literal returns and a local `playerTotals` accumulator.
- [x] Completed monastery (tile + all 8 neighbours) scores flat 9, credited to owner; incomplete (≤7 neighbours) not scored — test "a cloister tile with all 8 neighbours present and a monk scores a flat 9 points" (`packages/core/test/engine.test.ts:53-76`, asserts `points: 9`, not 9×tileCount); incomplete-exclusion verified by "an incomplete monastery (7 of 8 neighbours) is excluded from features and contributes 0" (`engine.test.ts:116-129`, asserts `result.features.some(f => f.type === "monastery") === false` and `playerTotals: {}`). `scoreMonastery` hardcodes `points: 9` and `tileCount: 1` regardless of `feature.tilePositions.length` (`monastery.ts:32,34`).
- [x] Completed monastery with no meeple → `players: []`, 9 points, contributes 0 to all totals — "a completed monastery with no meeple yields players: [] and still scores 9 in the entry" (`engine.test.ts:78-92`) and "a completed monastery with no meeple contributes 0 to all totals" (`engine.test.ts:131-143`, asserts `playerTotals: {}`).
- [x] `scoreBoard` returns `features` = exactly completed city/road/monastery scores, `playerTotals` = per-player sums — "returns exactly the completed features (city, road, monastery) and correct per-player totals" (`engine.test.ts:175-199`): asserts `features` has length 3 (city/road/monastery only), the incomplete BASE-C city (carol) is absent (`engine.test.ts:193`), and `playerTotals` equals `{ alice: 13, bob: 2 }` exactly.
- [x] Mixed-board case (completed city + road + monastery + an incomplete feature, ≥2 players) — same test as above (`engine.test.ts:150-199`); city=4pts/alice, road=2pts/bob, monastery=9pts/alice, incomplete BASE-C city/carol excluded; `playerTotals` exact-equals `{ alice: 4+9, bob: 2 }`.
- [x] Tie credits each tied player the full value in totals — "a contested completed city credits each tied player the full feature value in playerTotals" (`engine.test.ts:206-222`): two meeples (bob, alice) on a 2-tile closed city, `players: ["alice","bob"]`, `playerTotals: { alice: 4, bob: 4 }` (each gets the full 4, not split).
- [x] Deterministic / input-order-independent — "scoring the same board built in different tile-placement order yields deep-equal results" (`engine.test.ts:229-260`): builds a board, reverses `tiles`/`meeples` arrays, asserts `scoreBoard(boardB, catalog)` deep-equals `scoreBoard(boardA, catalog)`. Also separately covered: empty board → `{ features: [], playerTotals: {} }` exactly (`engine.test.ts:267-273`).
- [x] `npm run lint && npm run build && npm test` exits 0; prior suites (001-008) green; no new cyclic import — verified directly: lint/build/test all exit 0 above; full run shows 9 test files / 238 tests passing including `city-road-scoring.test.ts` (13), `board-state.test.ts` (29), `catalog-consistency.test.ts` (30), `feature-extraction.test.ts` (19), `catalog.test.ts` (71), `base-game-catalog.test.ts` (54), `smoke.test.ts` (2), `ownership.test.ts` (11) plus the new `engine.test.ts` (9). Import check: `engine.ts` imports only `../board/types.js`, `../catalog/types.js`, `../features/extract.js`, `../features/types.js`, and sibling `./feature-score.js`/`./monastery.js`; `monastery.ts` imports only `../features/types.js` and sibling `./ownership.js`/`./feature-score.js` (type-only). `features/extract.ts` does not import anything from `scoring/`, so the dependency graph is one-directional (board/catalog → features → scoring) — no cycle.

## Scope boundary checks
- Completed-only: `scoreCompletedFeatures` (`engine.ts:36-54`) explicitly skips `!feature.completed` (line 40-42) and only dispatches on `"city"|"road"|"monastery"`; `"field"` falls through the if/else chain with no branch and is implicitly skipped (comment at `engine.ts:50` confirms intent). No incomplete/end-game math or farmer/field scoring was added anywhere in the diff.
- Reuse, not reimplementation: `scoreMonastery` and `scoreCompletedFeatures`/`scoreBoard` call `resolveOwnership` (Item 007) and `scoreCity`/`scoreRoad` (Item 008) rather than re-deriving connectivity, completion, or majority logic — confirmed by reading `monastery.ts` and `engine.ts` in full; no duplicate ownership/majority code found.
- Item 008's `scoreCompletedCityRoadFeatures` was left in place (not removed), used by the pre-existing `city-road-scoring.test.ts`, which still passes (13/13) — backward compatible, as the implementer's report states.

## Notes
- No environment issues; lint/build/test all ran cleanly on first try with no flakiness observed (engine suite also re-run in isolation with identical pass result).
