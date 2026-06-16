# Implementation Report — Item 005
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-16

## Summary

Built a pure catalog-consistency checker (`checkCatalogConsistency`) in `packages/core/src/catalog/consistency.ts` that detects all six invariant classes (empty-tile, side-conflict, half-edge-uncovered, half-edge-on-city-side, pennant-on-non-city, adjacent-city-invalid, malformed-segment). Re-exported the new API from both barrel files. Added a comprehensive test suite with 30 tests covering the happy path, one focused broken-fixture test per invariant code, and all base-game-specific assertions. The base-game catalog passes with zero issues; no data fixes were required in `base-game.ts`.

## Files changed

- `packages/core/src/catalog/consistency.ts` — new file: `CatalogIssue`, `ConsistencyIssueCode`, `checkCatalogConsistency`, `assertCatalogConsistent`; pure functions; no board import
- `packages/core/src/catalog/index.ts:38-41` — re-export `CatalogIssue`, `ConsistencyIssueCode`, `checkCatalogConsistency`, `assertCatalogConsistent`
- `packages/core/src/index.ts:55-63` — re-export same four names from `@carcassonne/core` public surface

## Tests added/updated

- `packages/core/test/catalog-consistency.test.ts` — 30 tests covering:
  - Happy path: `checkCatalogConsistency(baseGameCatalog)` === `[]`; sample catalog also `[]`; two additional valid hand-built tiles
  - `assertCatalogConsistent`: does not throw on consistent catalog; throws with summary on inconsistent
  - Per-invariant broken fixtures: `empty-tile`, `side-conflict` (two subtests), `half-edge-uncovered` (two subtests), `half-edge-on-city-side` (two subtests), `pennant-on-non-city` (two subtests), `adjacent-city-invalid` (two subtests), `malformed-segment` (four subtests covering city/road/field/invalid-side)
  - Base-game assertions: tile count = 24; counts sum = 72; pennant set = {C,F,M,O,Q,S}; A and B each have exactly one monastery segment; no other tile has a monastery

## How to verify

```
npm run lint && npm run build && npm test
```

Expected: 186 tests pass (30 new + 156 pre-existing), exit 0.

## Decisions (for doc-updater)

- **`fakeCatalog` helper in tests**: Some broken fixtures (e.g. a field referencing a non-existent city id) would cause `loadCatalog` to throw before the consistency checker runs. A minimal `fakeCatalog(tiles)` helper that satisfies the `Catalog` interface without any validation lets tests exercise the checker's own detection of `adjacent-city-invalid` independently.
- **Invariant 5 re-checked**: The spec explicitly says to re-report `adjacent-city-invalid` in the consistency checker "for completeness when run standalone." The loader already catches this at load time; the checker's copy is for catalogs constructed without going through `loadCatalog`.
- **No base-game data fixes**: `checkCatalogConsistency(baseGameCatalog)` returns `[]` without any changes to `base-game.ts`. All six invariants are satisfied by the existing Item 004 data.
- **Pennant check via runtime cast**: The TypeScript types prevent non-city segments from having `pennant`, but the checker accesses it via `(seg as unknown as Record<string, unknown>)["pennant"]` to defensively catch data that was incorrectly cast at authoring time — consistent with the spec's "defensively constructed" language.
