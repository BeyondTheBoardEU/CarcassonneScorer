# Implementation Report — Item 010
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-20

## Summary
Added a dedicated, named Vitest suite (`packages/core/test/scenarios.test.ts`) that drives the public engine end to end via `scoreBoard(board, baseGameCatalog)` and asserts exact `points`/`players`/`playerTotals` for all 14 canonical scenarios required by the Item 010 spec. Boards are authored with `createBoard()` + `baseGameCatalog`, reusing the closed-feature fixture patterns already proven in `feature-extraction.test.ts`, `city-road-scoring.test.ts`, and `engine.test.ts` (cap-to-cap closed cities, dead-end-to-dead-end closed roads, monasteries surrounded by all 8 neighbours). No engine bug was found while authoring the suite, so no production code changed — this item is test-only.

## Files changed
- `packages/core/test/scenarios.test.ts` — new file; 16 tests across 14 `describe` categories covering: single-owner city, single-owner city with pennant, multi-pennant city, single-owner road, single-owner monastery, contested clear-majority, two-way tie, three-way tie, large multi-tile road (6 tiles), two separate same-type features (two independent roads), fully completed mixed board (+ a shuffled-order determinism check), unowned completed city and unowned completed monastery, incomplete-feature exclusion (open city + open road + 7-neighbour monastery alongside one completed city), and the empty board.

## Tests added/updated
- `packages/core/test/scenarios.test.ts`:
  - `describe("single-owner completed city", ...)` — 2-tile BASE-E cap-to-cap city, no pennant, scores 4 to its single owner.
  - `describe("single-owner completed city with pennant", ...)` — BASE-F (pennant) capped both ends by BASE-E, 3 tiles / 1 pennant, scores 8.
  - `describe("multi-pennant city", ...)` — BASE-C (pennant, all 4 sides) closed on N by BASE-F (pennant) further capped by BASE-E, and on E/S/W by plain BASE-E caps; 6 tiles / 2 pennants, scores 16.
  - `describe("single-owner completed road", ...)` — two BASE-A dead-ends closing each other, 2 tiles, scores 2.
  - `describe("single-owner completed monastery", ...)` — BASE-B center + 8 BASE-B neighbours + one monk, scores 9.
  - `describe("contested feature with a clear majority", ...)` — frank (2 meeples) vs grace (1 meeple) on a 3-tile closed city; frank scores 8, grace 0 (absent from totals).
  - `describe("two-way tie on a completed feature", ...)` — equal meeples on a 2-tile closed city; both alice and bob credited the full 4 points.
  - `describe("three-way tie on a completed feature", ...)` — three players with one follower each on a 3-tile closed road (BASE-A + BASE-U + BASE-A); all three credited the full 3 points.
  - `describe("large feature spanning many tiles", ...)` — a 6-tile closed road chain (BASE-A + 4×BASE-U + BASE-A) scores exactly 6, guarding off-by-one in extraction/tally.
  - `describe("two separate features of the same type", ...)` — two independent closed roads at distant board positions; two score entries, totals aggregate to 4 for the shared owner.
  - `describe("fully completed mixed board", ...)` — city (4, alice) + road (2, bob) + monastery (9, alice); asserts `features` length 3 and `playerTotals`, plus a second test confirming reverse tile/meeple insertion order yields a deep-equal `BoardScore`.
  - `describe("unowned completed feature", ...)` — a completed city and a completed monastery each with no meeple: worth their points, `players: []`, absent from `playerTotals`.
  - `describe("incomplete features are excluded", ...)` — an open BASE-C city, a single dead-ended BASE-A road, and a 7-of-8-neighbour monastery (each carrying a meeple) alongside one completed city: only the completed city appears in `features`/`playerTotals`.
  - `describe("empty board", ...)` — `scoreBoard` on a tile-less board returns `{ features: [], playerTotals: {} }`.

## How to verify
- `npm run lint && npm run build && npm test` from the repo root (exits 0; 254 tests pass across 10 files, including the 16 new scenario tests in `scenarios.test.ts`).
- Targeted: `npx vitest run packages/core/test/scenarios.test.ts`.

## Decisions (for doc-updater)
- **No engine bug found.** Every scenario passed against the existing Item 006–009 engine on first run; no production-code change was needed or made.
- **Multi-pennant city fixture.** To get a closed city with ≥2 pennant tiles using existing base-game tile shapes, I chained BASE-C (whole-tile city, pennant) -> BASE-F (through-city N/S, pennant) -> plain BASE-E cap on one axis, and plain BASE-E caps on the other three open sides of BASE-C. This yields a 6-tile, 2-pennant closed city (16 points) without needing any new catalog tiles.
- **Many-tile feature fixture.** Used a 6-tile road chain (`BASE-A` dead-end cap + four `BASE-U` straight segments + `BASE-A` dead-end cap) rather than a large city, since base-game road tiles compose cleanly into long straight chains and keep the fixture easy to read.
- **Helper kept minimal.** Added one tiny local helper, `scoreAt(result, type, position)`, mirroring the `featureFor` pattern from the existing suites, used only in the mixed-board scenario where multiple completed features of different types coexist; all other scenarios index `result.features` directly since each board has exactly one scored feature.

## Blockers
None.
