# Implementation Report — Item 002
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-14

## Summary

Added the platform-independent board-state model to `packages/core` under a new `src/board/` submodule. The module exports `TilePlacement`, `MeeplePlacement`, `BoardState`, `Position`, `Rotation`, `Direction`, and `MeepleKind` types; a fluent `createBoard()` builder with two structural guards (duplicate-position, meeple-missing-tile); `serializeBoard`/`deserializeBoard` with a `version` field and a typed `BoardStateError` on malformed input; and a `neighbor(position, direction)` geometry helper. All symbols are re-exported from `packages/core/src/index.ts`. The board module does not import the catalog. `npm run lint && npm run build && npm test` all exit 0; 29 new tests pass alongside the 2 existing smoke tests (31 total).

## Files changed

- `packages/core/src/board/types.ts` — defines `Rotation`, `Position`, `TilePlacement`, `MeepleKind`, `MeeplePlacement`, `BoardState`, `Direction` as plain readonly interfaces/types
- `packages/core/src/board/errors.ts` — defines `BoardStateError` (extends `Error`) with a discriminated `kind` field ("duplicate-position" | "meeple-missing-tile" | "malformed-input")
- `packages/core/src/board/geometry.ts` — implements `neighbor(position, direction): Position` for N/E/S/W using standard math convention (N=+y, E=+x, S=-y, W=-x)
- `packages/core/src/board/builder.ts` — implements `createBoard()` fluent builder with `placeTile`, `placeMeeple`, and `build()`; exports `BOARD_STATE_VERSION = 1` and `BoardBuilder` interface
- `packages/core/src/board/serialize.ts` — implements `serializeBoard` (JSON.stringify) and `deserializeBoard` (parse + validate shape/version/rotation, throw `BoardStateError("malformed-input")` on any defect)
- `packages/core/src/board/index.ts` — barrel re-exporting all public API from the board submodule
- `packages/core/src/index.ts` — added type and value re-exports of the entire board module public API

## Tests added/updated

- `packages/core/test/board-state.test.ts` — 29 Vitest tests across 5 `describe` blocks:
  - `createBoard — construction`: empty board, single tile, multiple tiles, meeple default kind, explicit kind, multi-player meeples, `build()` snapshot isolation
  - `createBoard — structural guards`: duplicate-position throws with correct kind, meeple-missing-tile throws with correct kind, valid placement at a tile position does not throw
  - `serializeBoard / deserializeBoard`: round-trip deep-equal on a non-trivial board (3 tiles, 3 meeples, 2 players, farmer-follower), output is valid JSON, tile/meeple counts survive round-trip
  - `deserializeBoard — malformed input`: bad JSON, missing version, unsupported version, missing tiles, missing meeples, rotation=45, missing tileId, missing segmentId, JSON array root, JSON string root
  - `neighbor — geometry`: N/E/S/W from origin, N/W from non-origin, N+S round-trips to original

## How to verify

```
npm run lint && npm run build && npm test
```

All three commands must exit 0. Expected output: 2 test files, 31 tests passed.

## Decisions (for doc-updater)

- `BOARD_STATE_VERSION = 1` is a module constant (not embedded only in serialize) so the builder and deserializer share a single source of truth; future schema bumps change one line.
- `neighbor` uses standard mathematical grid convention: N increases y, S decreases y, E increases x, W decreases x. This is documented in the JSDoc and matches typical Carcassonne grid expectations (origin at centre, right = East).
- `BoardStateError` extends `Error` with a discriminated `kind` field rather than three separate subclasses — simpler to catch and `instanceof`-check while still giving callers a typed discriminant.
- The fluent builder stores meeples via an `InternalBuilder` cast-augmentation rather than a closure variable, to avoid a second mutable array not visible to the `build()` call. This is an internal implementation detail behind the `BoardBuilder` interface; callers never see `_meeples`.
- `deserializeBoard` rejects any schema version other than `BOARD_STATE_VERSION` (strict equality). This is intentional — forward-compatible migration logic is the Stage 2 persistence layer's responsibility.
- `MeepleKind = "follower" | (string & {})` uses the TypeScript string-branding idiom so the type hints "follower" in IDEs while remaining open to extension without a schema change.
- `BoardState.tiles` and `.meeples` are `readonly` arrays in the TypeScript type, making the snapshot immutable at the type level; `build()` returns spread copies so the builder's internal arrays are not aliased.

## Blockers

None.
