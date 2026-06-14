# Check Report — Item 002
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-14
- Attempt: 1

## Commands run

- `npm install` → exit 0 / dependencies already satisfied
- `npm run lint` → exit 0 / ESLint + Prettier both clean
- `npm run build` → exit 0 / tsc --noEmit with ES2022-only lib
- `npm test` → exit 0 / 2 test files, 31 tests passed (smoke: 2, board-state: 29)

## Acceptance criteria (from the spec)

- [x] `TilePlacement`, `MeeplePlacement`, `BoardState`, `Position`, `Rotation`, `Direction` are defined and exported from the core public entry (`@carcassonne/core`) — all six types exported via `packages/core/src/index.ts:21-30`; `MeepleKind` and `BoardBuilder` also exported as bonuses. Confirmed by `npm run build` (tsc --noEmit) passing.

- [x] A tile placement references its tile by opaque `tileId: string`; a meeple references its feature by opaque `segmentId: string` and its player by `playerId: string`. The board module does not import the catalog — `packages/core/src/board/types.ts` defines all three as `string` fields. Grep of `packages/core/src/board/` for "catalog" finds only JSDoc comments (no import statements). No import of a catalog module exists anywhere in the board submodule.

- [x] `BoardState` is plain JSON data with a `version` field; `serializeBoard` → `deserializeBoard` round-trips to a deep-equal value (tested) — `packages/core/src/board/types.ts:52-56` defines `BoardState` with `version: number`, `tiles: readonly TilePlacement[]`, `meeples: readonly MeeplePlacement[]`. Test `"round-trip is deep-equal to the original state"` in `board-state.test.ts:143` asserts deep-equality on a 3-tile, 3-meeple, 2-player board with a farmer follower. Passes.

- [x] `deserializeBoard` rejects malformed input (wrong shape / missing fields / bad rotation) with a clear, typed error — `BoardStateError` (extends `Error`) with discriminated `kind: "malformed-input"` defined in `packages/core/src/board/errors.ts`. Tests cover: bad JSON, missing version, unsupported version, missing tiles, missing meeples, rotation=45, missing tileId, missing segmentId, JSON array root, JSON string root — all 10 cases throw `BoardStateError` with `kind === "malformed-input"`. All pass.

- [x] Builder/factory helpers exist for hand-authoring board states in tests and produce valid `BoardState` values — `createBoard()` fluent builder in `packages/core/src/board/builder.ts` with `.placeTile()`, `.placeMeeple()`, and `.build()`. Exported from `@carcassonne/core`. Tests confirm construction of empty boards, single tile, multiple tiles, meeple with default and explicit kind, multi-player. All 7 construction tests pass.

- [x] Model-level structural guards: two tiles at the same `position` are rejected; a meeple whose `position` has no placed tile is rejected — `packages/core/src/board/builder.ts:67-86` implements both guards, throwing `BoardStateError("duplicate-position", ...)` and `BoardStateError("meeple-missing-tile", ...)` respectively. Tests `"throws BoardStateError(duplicate-position)..."` and `"throws BoardStateError(meeple-missing-tile)..."` in `board-state.test.ts:92-121` verify both; a third test confirms valid placement does not throw. All 3 guard tests pass.

- [x] `neighbor(position, direction)` returns correct adjacent coordinates for all four directions (tested) — `packages/core/src/board/geometry.ts:19-30` implements N=+y, E=+x, S=-y, W=-x. Tests in `board-state.test.ts:245-269` cover N, E, S, W from origin; N and W from non-origin; and N+S round-trip. All 6 geometry tests pass.

- [x] Core still has zero UI/platform dependencies (`npm run build` green with the restricted core lib/no-node-types config) — `packages/core/tsconfig.json` restricts `lib` to `["ES2022"]` (no DOM). `packages/core/package.json` has no `@types/node` in devDependencies. `packages/core/src/board/` files import only from local submodule paths. `npm run build` exits 0.

## Required fixes

None.
