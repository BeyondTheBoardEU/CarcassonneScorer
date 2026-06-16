# Item 005 — Catalog-consistency validation tests

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-16

---

## Description

Guard the single-catalog discipline against drift. Add a **reusable, pure consistency checker** in the core that asserts a loaded catalog's tiles are internally well-formed — beyond the structural checks `loadCatalog` already does at load time — plus a **comprehensive test suite** that (a) proves the **base-game catalog (Item 004) is fully consistent** and (b) proves the checker actually catches each malformation class on deliberately-broken fixtures.

This satisfies the Stage 1 deliverable "Catalog-validation tests asserting internal consistency (edges match, no malformed tiles)" and the Stage 1 acceptance criterion **"Base-game catalog passes internal-consistency checks."**

### Relationship to existing validation
Item 003's `loadCatalog` already **throws `CatalogError`** for load-time structural faults: duplicate tile id, duplicate segment id within a tile, unknown segment type, a half-edge assigned to two field segments, and `adjacentCities` referencing a non-existent city segment. This item does **not** duplicate those; it adds the **deeper geometric/semantic invariants** the loader does not check (chiefly half-edge *completeness* and side *exclusivity*), and exercises everything against the real base-game data.

### Scope boundary
This is **intra-tile / intra-catalog** consistency only. **Cross-tile** edge-matching at placement time (do two adjacent placed tiles have compatible edges?) is **board validation — Stage 9 — and is explicitly out of scope here.** Do not implement adjacency/placement checks in this item.

## Design decisions (decided here)

- **Reusable checker, not just test assertions.** Implement a pure function in the catalog module that returns a list of structured issues (empty ⇒ consistent), so it is reusable by future expansions (Stage 5) and board validation (Stage 9), and keeps the tests DRY. It must not throw on a bad catalog — it **reports**.
- **Checker operates on a loaded `Catalog`** (post-`loadCatalog`), so load-time faults can't be present; the checker focuses on the deeper invariants below.
- **Structured issue type.** Return `CatalogIssue[]` where each issue is `{ tileId: string; segmentId?: string; code: ConsistencyIssueCode; message: string }`. `code` is a string-literal union (serialisation-friendly, consistent with `CatalogError.kind` style). A convenience `assertCatalogConsistent(catalog)` that throws if issues are non-empty may be added.
- **Generic invariants in the checker; base-game specifics in the tests.** The checker encodes invariants true of *any* catalog. Base-game-specific facts (exactly 24 tiles, counts sum to 72, exactly tiles C/F/M/O/Q/S carry pennants) are asserted in the **test suite** over `baseGameCatalog`, not baked into the generic checker.
- **If the checker reveals a genuine bug in the Item 004 base-game data, fix the data** (`base-game.ts`) as part of this item and record it under Decisions — do **not** weaken an invariant to make bad data pass. The invariants below are the contract.

## Consistency invariants (the contract)

Let a tile's four sides be N/E/S/W and its eight half-edges be the Item 003 set (`NW,NE,EN,ES,SE,SW,WS,WN`), two per side. Recall the model: a **city** segment covers whole `sides`; a **road** segment passes through `sides` (as a line, not covering them); a **field** segment owns `halfEdges`; a side covered by a city has **no** field half-edges, a non-city side has **both** its half-edges owned by fields (a road merely splits them between two fields).

Per-tile invariants the checker MUST detect violations of:

1. **Non-empty tile** — a tile has ≥1 segment. (code: `empty-tile`)
2. **Side exclusivity** — each side is referenced by **at most one** city *or* road segment; no side is claimed by two city/road segments, and no side is claimed by both a city and a road. (code: `side-conflict`)
3. **Half-edge completeness** — for every side **not** covered by a city, **both** of that side's half-edges are owned by exactly one field segment; for every side **covered by a city**, **neither** of that side's half-edges appears in any field segment. (Combined with the loader's no-duplicate-half-edge guarantee, half-edges form a clean partition.) (codes: `half-edge-uncovered`, `half-edge-on-city-side`)
4. **Pennant placement** — `pennant: true` appears only on `city` segments; no non-city segment carries a truthy pennant. (code: `pennant-on-non-city`)
5. **Adjacency validity** — every id in a field's `adjacentCities` resolves to a `city` segment in the same tile. (Loader also checks this; the checker re-reports it as `adjacent-city-invalid` for completeness when run standalone.) (code: `adjacent-city-invalid`)
6. **Field self-consistency** — a field's `halfEdges` are non-empty and each is a valid `HalfEdge`; a city/road's `sides` are non-empty and valid `Side`s. (code: `malformed-segment`)

Catalog-level: the checker runs every per-tile invariant across all tiles and aggregates issues.

> Invariant 3 is the heart of the item — it is what "interior segment connections are well-formed" means for the half-edge model, and the property Stage 4 farmer scoring will rely on.

## Acceptance criteria

- [x] A pure `checkCatalogConsistency(catalog: Catalog): CatalogIssue[]` (and the `CatalogIssue` / issue-code types) is implemented in the catalog module and **exported from `@carcassonne/core`**. It returns `[]` for a consistent catalog and never throws on a malformed one.
- [x] All six invariant classes above are detected, each producing an issue with the documented `code`, the offending `tileId`, and (where applicable) `segmentId`.
- [x] `checkCatalogConsistency(baseGameCatalog)` returns **`[]`** — the Item 004 base-game data is fully consistent. (If not, the data is fixed in `base-game.ts` as part of this item.)
- [x] A test suite exercises **each** invariant with a deliberately-broken fixture tile and asserts the specific issue `code` is reported (one focused test per code).
- [x] Base-game-specific assertions pass over `baseGameCatalog`: exactly **24** tiles; tile `count`s sum to **72**; exactly tiles **C, F, M, O, Q, S** carry a pennant and no others; monastery tiles (A, B) each have exactly one monastery segment.
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 003, 004) remain green; no catalog↔board cyclic import; no changes to the `loadCatalog` contract or the Item 003/004 public types.

> Maps to Stage 1 deliverable "Catalog-validation tests" and satisfies the Stage 1 acceptance criterion "Base-game catalog passes internal-consistency checks."

## Implementation steps

1. Read the model: `packages/core/src/catalog/types.ts`, `loader.ts` (existing validations to avoid duplicating), and `data/base-game.ts` (the data under test).
2. Add `packages/core/src/catalog/consistency.ts`: the `CatalogIssue` type + `ConsistencyIssueCode` union, `checkCatalogConsistency`, and optional `assertCatalogConsistent`. Pure functions; no I/O; no board import.
3. Re-export the new API from `packages/core/src/catalog/index.ts` and `packages/core/src/index.ts`.
4. Add `packages/core/test/catalog-consistency.test.ts`: base-game "returns []" test, per-invariant broken-fixture tests (table-driven where natural), and the base-game-specific assertions.
5. Run `npm run lint && npm run build && npm test` until green. If the checker flags real base-game data, fix `base-game.ts` and note it under Decisions.

## Testing strategy

- **Vitest** in `packages/core/test/catalog-consistency.test.ts`:
  - **Happy path:** `checkCatalogConsistency(baseGameCatalog)` deep-equals `[]`. Also run it over Item 003 `loadCatalog(sampleTiles)` → `[]`.
  - **Per-invariant fixtures** (each a minimal hand-built tile fed through `loadCatalog` first where it would still load, or passed directly where the fault is post-load): `empty-tile`, `side-conflict` (two cities both claiming N), `half-edge-uncovered` (a non-city side missing a half-edge from all fields), `half-edge-on-city-side` (a field listing a half-edge of a city-covered side), `pennant-on-non-city` (defensively constructed), `adjacent-city-invalid`, `malformed-segment`. Assert exact `code` (and `tileId`/`segmentId`).
  - **Base-game specifics:** count of tiles = 24; sum of `count` = 72; the pennant set is exactly `{C,F,M,O,Q,S}` (map by `BASE-<letter>` id); A and B each have exactly one `monastery` segment.
  - **No false positives:** a couple of valid hand-built tiles (e.g. the Item 003 samples) report no issues.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 003 (catalog types, loader, half-edge model), Item 004 (base-game data under test). Reuse; do not modify their contracts (data fixes in `base-game.ts` allowed only if the checker proves an inconsistency).
- **Downstream:** Item 004's future expansions and Stage 5 (re-run this checker on new data), Stage 9 board validation (may reuse the issue-reporting pattern). Items 006–010 rely on the now-guaranteed-consistent catalog.

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars, secrets, config, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (consistency suite green; Items 003/004 suites still green)
- [x] Services started — N/A
- [x] Application runs — N/A
- [x] Feature verified — `checkCatalogConsistency` exported; `checkCatalogConsistency(baseGameCatalog)` is `[]`
- [x] Data verified — each invariant's broken fixture yields the documented issue code; base-game specifics (24 tiles, counts=72, pennants={C,F,M,O,Q,S}) hold
- [x] Health checks pass — N/A

**Expected Outcomes**
- `checkCatalogConsistency` exported and pure; returns `[]` for base-game and sample catalogs; detects all six invariant classes.
- `npm run lint && npm run build && npm test` exits 0.

## Validation Results
- [x] Service started: N/A
- [x] Application started successfully: N/A
- [x] Database tables verified: N/A
- [x] Seed data verified: N/A
- [x] API endpoints verified: N/A
- [x] Screenshots captured: N/A

## Decisions & Trade-offs

**`fakeCatalog` test helper for post-load-only faults.** Some broken fixtures (for example, a field referencing a non-existent city id) would cause `loadCatalog` to throw before the consistency checker ever runs, because the loader already detects `adjacentCities` referencing unknown segments. A minimal `fakeCatalog(tiles)` helper was introduced in the test file that satisfies the `Catalog` interface without any loader validation, so the consistency checker's own detection of `adjacent-city-invalid` can be exercised independently. Trade-off: the helper bypasses load-time safety, but it is test-only and clearly scoped; this separation keeps the checker's coverage provable without requiring fragile workarounds in the loader.

**Invariant 5 (`adjacent-city-invalid`) re-checked in the consistency checker.** The spec explicitly calls for re-reporting this invariant in the checker "for completeness when run standalone," since the loader already catches it at load time. The duplicated check handles catalogs assembled or mutated without going through `loadCatalog` (e.g. constructed programmatically in expansion code or tests). The cost is minor redundancy; the benefit is that `checkCatalogConsistency` is a complete, self-contained audit regardless of how a `Catalog` object arrived.

**Pennant detection via runtime cast.** TypeScript's type system prevents non-city segments from having a `pennant` property, so a static read would be a type error. The checker accesses it via `(seg as unknown as Record<string, unknown>)["pennant"]` to defensively catch data that was cast incorrectly at authoring time — consistent with the spec's "defensively constructed" language for the `pennant-on-non-city` check. This keeps the invariant enforcement robust against type-unsafe data paths without widening any public type.

**No base-game data fixes required.** Running `checkCatalogConsistency(baseGameCatalog)` against the Item 004 data returned `[]` with no changes to `base-game.ts`. All six invariants were satisfied by the existing data, confirming the base-game catalog is fully consistent as authored.

## Completion Reminder

When complete, update [progress.md](../progress.md): mark the "Catalog-validation tests" deliverable ✅ and tick the Stage 1 acceptance criterion **"Base-game catalog passes internal-consistency checks."** Stage 1 stays 🚧 In Progress (the scoring engine — Items 006–010 — remains). Do not tick scoring/board criteria. Status flow for this item: 📋 → 🚧 → ✅.
