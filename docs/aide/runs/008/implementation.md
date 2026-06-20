# Implementation Report — Item 008
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-20

## Summary
Added pure city/road incremental scoring on top of Item 006 (`extractFeatures`/`Feature`) and Item 007 (`resolveOwnership`): `scoreCity`, `scoreRoad`, the `FeatureScore` type, and an aggregator `scoreCompletedCityRoadFeatures` that filters a feature list to completed cities/roads and scores each. Completed city = `2*tileCount + 2*pennants`; completed road = `1*tileCount`. Credited `players` come straight from `resolveOwnership(feature.meeples).owners`; on a tie every tied player is listed and `points` is the full (undivided) feature value. No engine entry point was added (out of scope — Item 009).

## Files changed
- `packages/core/src/scoring/feature-score.ts` — new: `FeatureScore` type, `scoreCity`, `scoreRoad`, `scoreCompletedCityRoadFeatures`.
- `packages/core/src/scoring/index.ts` — re-exports the three new symbols + `FeatureScore` type alongside the existing Item 007 exports.
- `packages/core/src/index.ts` — re-exports `FeatureScore`, `scoreCity`, `scoreRoad`, `scoreCompletedCityRoadFeatures` from `@carcassonne/core` under a new "City and road incremental scoring (Item 008)" section.

## Tests added/updated
- `packages/core/test/city-road-scoring.test.ts` (new, 13 tests):
  - Completed city, no pennant: two `BASE-E` tiles cap-to-cap (reused from `feature-extraction.test.ts`) → `points: 4`, `tileCount: 2`, `pennants: 0`.
  - Completed city, with pennant: `BASE-F` (city N+S, pennant) capped on both ends by `BASE-E` → 3-tile, 1-pennant closed city → `points: 8` (`2*3 + 2*1`).
  - Completed road: two `BASE-A` tiles (monastery + single road side) placed so each tile's lone road dead-end closes against the other (one rotated 180°) → 2-tile closed road, `points: 2`.
  - Exclusions: isolated open `BASE-C` city and a lone `BASE-A` road (no closing neighbour) produce no aggregator entries; a `BASE-B` board (monastery + field only) produces an empty aggregator result.
  - Ownership crediting: single owner credited full points; two-way tie credits both players (sorted), each with the full (non-split) points; no-meeple completed feature → `players: []`.
  - Multiple independent features: two separate closed `BASE-A` road loops on one board yield two distinct entries; a closed city + a closed road together yield two independent entries with correct values.
  - Determinism: same board content built via reversed `tiles`/`meeples` arrays yields a deep-equal aggregator result; aggregator does not mutate its input `Feature[]`.

## How to verify
- `npm run lint && npm run build && npm test` from the repo root — exits 0; all 8 suites / 229 tests pass (city-road-scoring.test.ts contributes 13; Items 001–007 suites unchanged and green).

## Decisions (for doc-updater)
- Used `BASE-A` (monastery tile with a single road side, only on the S side) rotated 180° against itself to build the minimal closed-road fixture (2 tiles, no city/monastery cap needed) — simpler than chaining `ROAD-STRAIGHT`/sample tiles, and keeps the road test self-contained within the base-game catalog.
- Built the pennant-bearing closed city from `BASE-F` (through-city N+S, pennant) capped on both open ends by two `BASE-E` tiles, since no single base-game tile pair closes a pennant city in exactly 2 tiles without leaving another side open; this yields a 3-tile, 1-pennant fixture instead, which still exercises the `+2*pennants` term exactly.
- `scoreCity`/`scoreRoad` do not themselves check `feature.completed` — they trust the caller (the aggregator, or a future Item 009 engine) to only invoke them on completed features, matching the spec's framing of them as the per-feature scorers the aggregator and Item 009 reuse. The aggregator is the single place that enforces "completed city/road only."
- `FeatureScore.tilePositions`/`players` are typed `readonly` arrays per the `Feature` module's convention, while the spec's proposed shape used plain arrays — kept consistent with `Feature`'s own readonly fields; this is a non-breaking shape refinement allowed by the spec ("Shape may be refined").

## Blockers
None.
