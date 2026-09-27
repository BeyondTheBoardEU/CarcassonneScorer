# Item 002 — Board-state model

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-14

---

## Description

Define the data structures that represent a placed-tile board: a **tile placement** (which catalog tile, its position on a coordinate grid, its orientation/rotation) and **meeple placements** (which player, on which placed tile, on which feature segment). The model must be **independent of how the state was produced** (manual entry now, recognition later) and **serializable**. Include constructor/builder helpers for authoring board states by hand in tests.

This is pure data + geometry in `packages/core`. It is the representation the scoring engine (items 006–010) and, later, the validation and recognition layers all consume — the single board-state contract (vision §5.3). It deliberately models *state only*; it does **not** enforce game legality (edge matching, adjacency, legal meeple rules) — that is the Stage 9 validation engine's job.

## Design constraints (decided here)

- **Decoupled from the catalog.** A tile placement references its catalog tile by an opaque **`tileId: string`** (a catalog key). The board-state module must **not import the catalog** (items 003/004) — this keeps the model usable now and prevents a dependency cycle. Likewise a meeple references the feature it sits on by an opaque **`segmentId: string`** (local to the tile's catalog definition); the model does not resolve it against the catalog.
- **Players by id.** Meeples reference a player via **`playerId: string`**. Player identity (name, colour) belongs to game setup (Stage 2), not the board-state model.
- **Plain JSON data.** All structures are plain, JSON-serializable objects (no classes with behaviour in the stored shape, no `Map`/`Set`/`Date` in the serialized form), so persistence (Stage 2/3) and recognition handoff are trivial. A top-level **`version`** field carries a schema version for forward-compatible deserialization.
- **Platform-independent.** Lives under `packages/core`; inherits the Item 001 boundary (no DOM, no Node globals).
- **Extensible meeple kind.** A meeple carries a **`kind`** (default `"follower"`) so later expansions (big meeple, etc.) and farmers (a follower on a field segment) fit without a schema change.

## Proposed types (shape, not final names)

```ts
type Rotation = 0 | 90 | 180 | 270;
interface Position { x: number; y: number; }              // integer grid
interface TilePlacement { tileId: string; position: Position; rotation: Rotation; }
type MeepleKind = "follower" | (string & {});             // extensible; base game = "follower"
interface MeeplePlacement { playerId: string; position: Position; segmentId: string; kind: MeepleKind; }
interface BoardState { version: number; tiles: TilePlacement[]; meeples: MeeplePlacement[]; }

// geometry helpers (platform-independent, unblock feature extraction in item 006)
type Direction = "N" | "E" | "S" | "W";
function neighbor(p: Position, d: Direction): Position;
```

A **builder/factory** for authoring states in tests, e.g. `createBoard()` → fluent `.placeTile(tileId, position, rotation)` / `.placeMeeple(playerId, position, segmentId, kind?)` → `.build()`, plus `serializeBoard(state): string` and `deserializeBoard(json: string): BoardState`.

(Exact file layout may vary — e.g. `packages/core/src/board/{types,builder,serialize,geometry,index}.ts` re-exported from `packages/core/src/index.ts`.)

## Acceptance criteria

- [x] `TilePlacement`, `MeeplePlacement`, `BoardState`, `Position`, `Rotation`, `Direction` are defined and exported from the core public entry (`@carcassonne/core`).
- [x] A tile placement references its tile by opaque `tileId: string`; a meeple references its feature by opaque `segmentId: string` and its player by `playerId: string`. **The board module does not import the catalog.**
- [x] `BoardState` is plain JSON data with a `version` field; `serializeBoard` → `deserializeBoard` round-trips to a deep-equal value (tested).
- [x] `deserializeBoard` rejects malformed input (wrong shape / missing fields / bad rotation) with a clear, typed error — it never returns a partially-formed board.
- [x] Builder/factory helpers exist for hand-authoring board states in tests and produce valid `BoardState` values.
- [x] Model-level structural guards (not game rules): two tiles at the same `position` are rejected; a meeple whose `position` has no placed tile is rejected. (Edge/adjacency legality is explicitly out of scope — Stage 9.)
- [x] `neighbor(position, direction)` returns correct adjacent coordinates for all four directions (tested).
- [x] Core still has zero UI/platform dependencies (`npm run build` green with the restricted core `lib`/no-node-types config).

> Maps to Stage 1 deliverable "Board-state model: representation of placed tiles, positions/orientations, and meeple placements, independent of how the state was produced."

## Assumptions

- None recorded. Specified and delivered before the aide-loop migration (2026-09-27); decisions taken during implementation are under Decisions & Trade-offs below and in the legacy run record `../runs/002/`.

## Implementation steps

1. Add a `board` module under `packages/core/src/board/` with the types above (or a single `board-state.ts`; keep it cohesive).
2. Implement the builder/factory (`createBoard()` fluent API) with the two structural guards (duplicate position, meeple-on-missing-tile) throwing clear errors.
3. Implement `serializeBoard` (JSON.stringify of the plain shape) and `deserializeBoard` (parse + validate shape, set/check `version`, throw a typed error on malformed input).
4. Implement `neighbor(position, direction)` and the `Direction` type.
5. Re-export the public API from `packages/core/src/index.ts`.
6. Write tests (see strategy) and run `npm run lint && npm run build && npm test` until green.

## Testing strategy

- **Vitest** unit tests in `packages/core/test/` (e.g. `board-state.test.ts`):
  - **Construction:** builder produces the expected `BoardState`; tile and meeple placements are recorded with correct fields.
  - **Serialization round-trip:** `deserializeBoard(serializeBoard(state))` deep-equals `state` for a non-trivial board (multiple tiles, meeples of ≥2 players, a farmer-style follower on a field segment).
  - **Malformed input:** `deserializeBoard` throws on bad JSON, missing fields, and an invalid `rotation` (e.g. 45).
  - **Guards:** duplicate-position placement throws; meeple on a position with no tile throws.
  - **Geometry:** `neighbor` returns correct coords for N/E/S/W.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 001 (scaffold, `packages/core`, test runner).
- **Downstream:** Items 003/004 (catalog — tiles referenced here by id), Item 006 (feature extraction consumes board state + `neighbor`), Items 007–010 (scoring over board state). Stage 2 persistence serializes this model.

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript; no external services.

**Environment Configuration**
- Node.js (18+/20 LTS recommended) and npm on PATH. No env vars, secrets, config files, or ports.

**Manual Validation Checklist**
- [ ] Build succeeds — `npm run build`
- [ ] Tests pass — `npm test` (board-state suite green)
- [ ] Services started — N/A
- [ ] Application runs — N/A (no app this item)
- [ ] Feature verified — board-state types exported from `@carcassonne/core`; round-trip + guards behave per criteria
- [ ] Data verified — serialization round-trip is deep-equal (asserted in tests)
- [ ] Health checks pass — N/A

**Expected Outcomes**
- Board-state model exported from the core entry; `npm run lint && npm run build && npm test` exits 0.
- Serialize→deserialize round-trip is deep-equal; malformed input and structural-guard violations throw clear errors.
- `neighbor` geometry verified for all four directions.

## Validation Results
- [ ] Service started: N/A
- [ ] Application started successfully: N/A (no app this item)
- [ ] Database tables verified: N/A
- [ ] Seed data verified: N/A
- [ ] API endpoints verified: N/A
- [ ] Screenshots captured: N/A (no UI)

## Decisions & Trade-offs

**Module layout under `src/board/`.** The board submodule was split into five focused files (`types.ts`, `errors.ts`, `geometry.ts`, `builder.ts`, `serialize.ts`) re-exported via a `board/index.ts` barrel and from the package root `index.ts`. This matches the layout the spec anticipated and keeps concerns clearly separated without over-fragmenting.

**Single `BOARD_STATE_VERSION` constant.** The version is defined as `BOARD_STATE_VERSION = 1` in `builder.ts` (not embedded only in `serialize.ts`) so the builder, the deserializer, and future migration logic all reference one source of truth. A schema bump changes exactly one line.

**`BoardStateError` with a discriminated `kind` field.** Rather than three separate error subclasses, a single `BoardStateError` (extends `Error`) carries `kind: "duplicate-position" | "meeple-missing-tile" | "malformed-input"`. This keeps `instanceof` checks simple while giving callers a typed discriminant to switch on. Trade-off: a single catch handles all three, so callers that only want one kind must check `kind` explicitly — judged worthwhile for simplicity.

**`MeepleKind = "follower" | (string & {})` open-union branding.** The TypeScript string-branding idiom lets IDEs hint `"follower"` while the type remains open to extension (e.g. `"big-meeple"`) without a schema change. Future expansion kinds fit without altering the `BoardState` shape.

**Geometry convention: N=+y, E=+x, S=-y, W=-x.** Standard mathematical grid convention was chosen (origin at centre, right = East, up = North). This is documented in JSDoc on `neighbor` and matches typical Carcassonne coordinate expectations. Trade-off: screen coordinate systems invert y, but the board model is explicitly platform-independent and should not mirror display conventions.

**Opaque `tileId`/`segmentId`/`playerId` strings; no catalog import.** All three identifiers are plain `string` in the board module. The board submodule has no import of the catalog (items 003/004). This prevents a dependency cycle and keeps the model usable ahead of the catalog, at the cost of no compile-time validation of id values — callers must ensure ids are meaningful.

**Fluent builder with internal `_meeples` cast-augmentation.** The `createBoard()` builder stores the internal meeple list via an `InternalBuilder` interface augmentation rather than a closure variable, to avoid a second mutable array invisible to `build()`. This is an implementation detail behind the `BoardBuilder` interface; callers never see `_meeples`. Trade-off: slightly less idiomatic, but avoids closure capture complexity.

**`deserializeBoard` is strict-version only.** Versions other than `BOARD_STATE_VERSION` are rejected with `kind === "malformed-input"`. Forward-compatible migration is deliberately deferred to the Stage 2 persistence layer, keeping the deserializer simple and unambiguous now.

## Completion Reminder

When complete, update [progress.md](../progress.md): mark the Stage 1 deliverable "Board-state model …" ✅. Stage 1 stays 🚧 (it does not become ✅ until items 003–010 land). Do **not** tick the Stage 1 acceptance criteria about scoring/catalog — those belong to later items. Update only Item 002's rows. Status flow for this deliverable: 📋 → 🚧 → ✅.
