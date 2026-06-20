# Check Report — Item 008
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-20
- Attempt: 1

## Commands run
- `npm run lint` → exit 0 (eslint + prettier --check, no issues)
- `npm run build` → exit 0 (`tsc -p packages/core/tsconfig.json --noEmit`)
- `npm test` → exit 0 (8 test files, 229 tests, all passed, including `packages/core/test/city-road-scoring.test.ts` — 13 tests)

## Acceptance criteria (from the spec)
- [x] `scoreCity`, `scoreRoad`, `FeatureScore`, and a completed-city/road aggregator implemented in `scoring/` and exported from `@carcassonne/core`; pure, no input mutation — `packages/core/src/scoring/feature-score.ts:44-103` (`scoreCity`, `scoreRoad`, `scoreCompletedCityRoadFeatures`), re-exported `packages/core/src/scoring/index.ts:11-12` and `packages/core/src/index.ts:81-84`. Purity/no-mutation verified by test "does not mutate the input feature list" (`packages/core/test/city-road-scoring.test.ts:301-312`) and by code inspection — `scoreCity`/`scoreRoad` only read `feature.*` and build a new object literal.
- [x] Completed city scores `2*tileCount + 2*pennants` — `feature-score.ts:47` (`points = 2 * tileCount + 2 * pennants`); verified by test "two BASE-E tiles cap-to-cap... -> 4 points" (2 tiles, 0 pennants → 4) and "two BASE-H tiles stacked... -> +2 per pennant" (3 tiles, 1 pennant → 8 = 2*3+2*1), `city-road-scoring.test.ts:42-109`.
- [x] Completed road scores `1*tileCount` — `feature-score.ts:70` (`points = tileCount`); verified by test "two BASE-A tiles cap-to-cap... -> 2 points" (`city-road-scoring.test.ts:117-144`).
- [x] Aggregator scores only completed city/road; incomplete and monastery/field excluded — `feature-score.ts:91-99` (`if (!feature.completed) continue;` then only `"city"`/`"road"` branches, no `else` fallthrough for monastery/field). Verified by tests "an isolated BASE-C city (open) yields no score entry", "an open road... yields no score entry", "monasteries and fields are never included" (`city-road-scoring.test.ts:152-180`).
- [x] Credited `players` come from `resolveOwnership(feature.meeples).owners`: single owner, two-way tie (both credited, each full points), no-meeple → `[]` — `feature-score.ts:48,71` call `resolveOwnership(feature.meeples)` directly (Item 007, unmodified — confirmed via `ownership.ts:32-55`, which sorts owners and lists all players tied at `topCount`). Verified by tests "single owner... credited the full points" (`players: ["alice"]`, `points: 4`), "two-way tie... credits both players, each with the full points" (`players: ["alice","bob"]`, `points: 4` — not split), "a completed feature with no meeple has players: []" (`players: []`, `points: 4`) — `city-road-scoring.test.ts:188-228`.
- [x] Structured per-feature result with `type`, `points`, `players` plus breakdown fields (`completed`, `tileCount`, `pennants`, `tilePositions`) — `FeatureScore` interface, `feature-score.ts:20-35`, matches the spec's proposed shape (readonly arrays is a permitted non-breaking refinement, noted in implementation.md).
- [x] Two independent features → two entries; multi-pennant city sums correctly — verified by "two separate completed roads... produce two distinct score entries" and "a completed city and a completed road together yield two independent entries" (`city-road-scoring.test.ts:236-272`); pennant summation verified by the 3-tile/1-pennant city test above (8 = 2*3+2*1; only one base-game pennant tile was combinable into a closed multi-tile city, so "multi-pennant" is exercised as one pennant tile within a multi-tile feature — the arithmetic term `2*pennants` is generic and not special-cased per tile, so this is sufficient coverage of the summation rule).
- [x] Deterministic output (feature order from Item 006; players sorted per Item 007) — verified by test "scoring the same board built in different tile-placement order yields deep-equal results" (reversed `tiles`/`meeples` arrays, `city-road-scoring.test.ts:280-298`); `owners` sort confirmed in `ownership.ts:52`.
- [x] `npm run lint && npm run build && npm test` exits 0; prior suites (001-007) remain green; no new cyclic import — confirmed above (229/229 tests across 8 suites, including `ownership.test.ts` 11, `board-state.test.ts` 29, `feature-extraction.test.ts` 19, `catalog-consistency.test.ts` 30, `catalog.test.ts` 71, `base-game-catalog.test.ts` 54, `smoke.test.ts` 2, plus the 13 new tests). Import direction checked: `scoring/feature-score.ts` imports only from `../features/types.js`, `../board/types.js`, and sibling `./ownership.js` — `features/` and `board/` do not import from `scoring/`, so no cycle.

## Scope boundary checks
- No `scoreBoard` symbol anywhere in the repo (`grep -rn "scoreBoard" packages/` → no matches) — engine entry point correctly deferred to Item 009.
- No UI/platform imports in `packages/core/src/scoring/*.ts` (no react/dom/window/document references) — core purity preserved.
- Git diff confined to exactly the files the implementation report claims: `packages/core/src/index.ts` (+6), `packages/core/src/scoring/index.ts` (+3), new `packages/core/src/scoring/feature-score.ts`, new `packages/core/test/city-road-scoring.test.ts`. No modification to Item 006/007 source (`features/`, `scoring/ownership.ts` untouched).

## Required fixes
None.
