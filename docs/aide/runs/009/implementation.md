# Implementation Report — Item 009
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-20

## Summary
Added monastery scoring and the scoring-engine assembly: `scoreMonastery` (flat 9 points for a completed monastery, ownership via Item 007's `resolveOwnership`), a unified `scoreCompletedFeatures` aggregator covering completed city/road/monastery features (reusing Item 008's `scoreCity`/`scoreRoad`), and the `scoreBoard(board, catalog)` entry point that runs `extractFeatures` -> `scoreCompletedFeatures` -> a per-player tally and returns `BoardScore { features, playerTotals }`. All new symbols are exported from `@carcassonne/core`.

## Files changed
- `packages/core/src/scoring/monastery.ts` — new: `scoreMonastery(feature)`, flat 9 points, `pennants: 0`, `tileCount: 1`, players via `resolveOwnership(feature.meeples).owners`.
- `packages/core/src/scoring/engine.ts` — new: `BoardScore` type, `scoreCompletedFeatures(features)` (completed city/road/monastery only, skips incomplete + fields, preserves Item 006's deterministic order), `scoreBoard(board, catalog)` (extract -> score -> tally; tie credits each tied player the feature's full points; unowned features contribute to nobody; empty board -> `{ features: [], playerTotals: {} }`).
- `packages/core/src/scoring/index.ts` — re-exports `scoreMonastery`, `BoardScore`, `scoreCompletedFeatures`, `scoreBoard`.
- `packages/core/src/index.ts` — re-exports the same under a new "Monastery scoring and engine assembly (Item 009)" section.

## Tests added/updated
- `packages/core/test/engine.test.ts` (new, 9 tests):
  - `scoreMonastery` on a completed monastery (8/8 neighbours, reusing the Item 006 fixture pattern) with a monk -> exact `FeatureScore` (9 points, `players: ["alice"]`, `tileCount: 1`, `pennants: 0`).
  - `scoreMonastery` on a completed monastery with no meeple -> `players: []`, still `points: 9`.
  - `scoreBoard` on a completed monastery with a monk -> `playerTotals: { alice: 9 }`.
  - `scoreBoard` on an incomplete monastery (7/8 neighbours) -> excluded from `features`, `playerTotals: {}`.
  - `scoreBoard` on a completed, unowned monastery -> `playerTotals: {}`.
  - Mixed board: completed city (alice, 4 pts) + completed road (bob, 2 pts) + completed monastery (alice, 9 pts) + an incomplete open city (carol, unscored) -> asserts `features` has exactly 3 entries with correct type/points/players, the incomplete feature is absent, and `playerTotals` equals `{ alice: 13, bob: 2 }`.
  - Tie through totals: a contested completed city (bob + alice tied) -> `playerTotals: { alice: 4, bob: 4 }` (each tied player gets the full value).
  - Determinism: the mixed-board fixture built with tiles/meeples reversed -> `scoreBoard` result deep-equals the forward-order result.
  - Empty board -> `{ features: [], playerTotals: {} }`.

## How to verify
- `npm run lint && npm run build && npm test` (run from repo root) — exits 0; 9 test files / 238 tests pass, including the new `engine.test.ts`.

## Decisions (for doc-updater)
- Kept Item 008's `scoreCompletedCityRoadFeatures` in place (not removed/folded) for backward compatibility with `city-road-scoring.test.ts`; `scoreCompletedFeatures` in `engine.ts` is the new unified aggregator that supersedes it for engine callers and additionally covers monasteries.
- `scoreMonastery` lives in its own `scoring/monastery.ts` file (mirroring the one-scorer-per-file pattern an alternative to extending `feature-score.ts`), and `BoardScore`/`scoreCompletedFeatures`/`scoreBoard` live in a new `scoring/engine.ts`, per the spec's suggested file layout.
- No new cyclic imports: `engine.ts` imports from `../features/extract.js`, `../features/types.js`, `../catalog/types.js`, `../board/types.js`, and sibling `./feature-score.js` / `./monastery.js`; `monastery.ts` imports only `../features/types.js` and sibling `./ownership.js` / `./feature-score.js` (type only).
