# Implementation Report — Item 007
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-20

## Summary
Added a pure `resolveOwnership(meeples)` resolver (plus an optional `resolveFeatureOwnership(feature)` wrapper) in a new `packages/core/src/scoring/` module, implementing the official Carcassonne majority/tie rule: meeples are counted per `playerId` (kind-agnostic, each meeple = 1), the strictly-highest count wins, all players tied at the top count are returned as owners, and the empty-input case returns `{ owners: [], topCount: 0, counts: {} }`. Both functions are exported from `@carcassonne/core`. No point values or feature extraction are implemented, per the scope boundary.

## Files changed
- `packages/core/src/scoring/ownership.ts` — new: `OwnershipResult` type, `resolveOwnership`, `resolveFeatureOwnership`. Imports only `Feature`/`FeatureMeeple` from `../features/types.js`; no board/catalog import.
- `packages/core/src/scoring/index.ts` — new: barrel re-exporting the public scoring API.
- `packages/core/src/index.ts` — added a "Meeple ownership / majority-tie resolution (Item 007)" section re-exporting `OwnershipResult`, `resolveOwnership`, `resolveFeatureOwnership` from `./scoring/index.js`.

## Tests added/updated
- `packages/core/test/ownership.test.ts` — new, 11 tests:
  - empty input → `{ owners: [], topCount: 0, counts: {} }`
  - single owner with 1 meeple, and with 2 meeples (sole owner, correct `topCount`)
  - clear majority (P1×2 vs P2×1)
  - two-way tie (P1, P2 → both in sorted `owners`)
  - three-way tie (P1, P2, P3 → all three in sorted `owners`)
  - summing across multiple meeples per player with a non-owner lower-count player present
  - order-independence: shuffled input equals sorted-input result
  - kind-agnostic counting: mixing `kind` values for the same player still counts 1 each
  - purity: input array is not mutated
  - integration: `resolveFeatureOwnership(feature)` agrees with `resolveOwnership(feature.meeples)` on a real feature extracted via `extractFeatures`/`createBoard`/`baseGameCatalog`

## How to verify
- `npm run lint && npm run build && npm test` from the repo root — exits 0; 7 test files / 216 tests pass (216 includes the 11 new ownership tests plus all prior Item 001–006 suites unchanged).

## Decisions (for doc-updater)
- Kept `resolveOwnership` as a simple two-pass loop (tally counts, then scan for `topCount` and filter ties) rather than a single-pass max-tracking approach — clearer and trivially correct for the tie case; performance is irrelevant at per-feature meeple-list scale.
- `OwnershipResult.owners` and `.counts` are typed as `readonly string[]` / `Readonly<Record<string, number>>` to signal the pure/non-mutating contract at the type level, consistent with `Feature`'s readonly fields in `features/types.ts`.
- Added `resolveFeatureOwnership(feature: Feature)` as specified (optional convenience wrapper); it does nothing but forward `feature.meeples` to `resolveOwnership`, keeping the meeple-list form primary and the wrapper trivially correct by construction.
- Verified no cyclic import: `scoring/ownership.ts` imports from `features/types.js`; `features/extract.ts` and `features/types.ts` contain no import of `scoring/` (only doc-comment mentions of the word "scoring").
