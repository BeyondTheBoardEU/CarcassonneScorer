# Item 008 — City and road incremental scoring

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-20

---

## Description

Implement **incremental (in-game) scoring** for **completed cities and roads**, building on feature extraction (Item 006) and ownership resolution (Item 007). A completed **city** scores **2 points per tile plus 2 per pennant**; a completed **road** scores **1 point per tile**. Points are credited to the feature's **majority owner(s)** (Item 007 — on a tie, every tied player scores the feature in full). Return a **structured per-feature result** (type, points, credited players, and the breakdown fields a later review/tally UI needs).

This is the first real "scoring" layer. It stays thin precisely because Items 006/007 did the hard parts: it asks the extractor for features, filters to **completed** cities/roads, computes the point value by the rules above, and asks the resolver who scores them. Item 009 adds monastery scoring and assembles everything behind a single `scoreBoard` entry point; this item provides the city/road scorers it will reuse.

### Scope boundary

- **Completed features only (incremental).** Only **completed** cities/roads score here — that is the in-game rule. **Incomplete** features are scored at end-game with *different* point math (incomplete city = 1/tile, etc.), which is **Stage 4** and out of scope. Do not score incomplete features in this item.
- **Cities and roads only.** Monasteries are Item 009; fields/farmers are Stage 4. Do not score them here.
- **No engine entry point yet.** The unified `scoreBoard(board, catalog)` API and per-player grand-total assembly are **Item 009**. This item provides the per-feature city/road scorers (and may provide a city/road aggregator over a feature list), not the whole-board entry point.
- **Reuse, don't reimplement.** Use `extractFeatures` (Item 006) for structure/`completed`/`tilePositions`/`pennants` and `resolveOwnership` (Item 007) for credited players. Do not re-derive connectivity, completion, or majority here.

## Design decisions (decided here)

- **Pure per-feature scorers.** `scoreCity(feature): FeatureScore` and `scoreRoad(feature): FeatureScore`, pure over an Item 006 `Feature`. They compute the completed-feature point value and resolve ownership. They live in the Item 007 `scoring/` module.
- **Point math.**
  - City: `points = 2 * tileCount + 2 * pennants` where `tileCount = feature.tilePositions.length` and `pennants = feature.pennants`.
  - Road: `points = 1 * tileCount`.
- **Ownership crediting.** `players = resolveOwnership(feature.meeples).owners`. On a tie, **all** tied players are credited and **each receives the full `points`** (Carcassonne tie rule). A completed feature with **no meeples** has `players: []` — it is worth `points` but credited to nobody (contributes 0 to every player's total).
- **`points` is the feature's value; each credited player receives that full value.** The result does not pre-divide points among players; the engine (Item 009) sums `points` into each `players` entry's grand total. This keeps the tie rule (everyone gets full) trivial and the breakdown honest.
- **Aggregator over completed city/road features.** Provide `scoreCompletedCityRoadFeatures(features: readonly Feature[]): FeatureScore[]` (name may vary) that filters to **completed** features of type `city`/`road` and maps each through the right scorer, preserving Item 006's deterministic order. Monasteries/fields and incomplete features are skipped.
- **Structured result for breakdown UIs.** `FeatureScore` carries enough for a per-feature review: `type`, `completed`, `points`, `players`, `tileCount`, `pennants`, and `tilePositions` (so a UI can locate the feature). Shape may be refined but must include type, points, and credited players (the queue's stated requirement).
- **Determinism.** Output order follows the input feature order (already deterministic from Item 006); `players` ordering follows Item 007 (sorted by `playerId`).

## Proposed types (shape, not final names)

```ts
interface FeatureScore {
  type: FeatureType;            // "city" | "road" here (monastery added in Item 009)
  completed: boolean;           // always true for entries the aggregator returns
  points: number;               // feature value: city 2/tile+2/pennant, road 1/tile
  players: string[];            // credited majority owner(s); [] if unowned; each gets full `points`
  tileCount: number;            // feature.tilePositions.length
  pennants: number;             // city pennants; 0 for roads
  tilePositions: Position[];    // for UI/breakdown location
}

function scoreCity(feature: Feature): FeatureScore;
function scoreRoad(feature: Feature): FeatureScore;
function scoreCompletedCityRoadFeatures(features: readonly Feature[]): FeatureScore[];
```

Exact file layout may vary — e.g. add `packages/core/src/scoring/feature-score.ts` (or `city-road.ts`) alongside Item 007's `ownership.ts`, re-exported via `scoring/index.ts` and `packages/core/src/index.ts`.

## Acceptance criteria

- [x] `scoreCity`, `scoreRoad`, the `FeatureScore` type, and a completed-city/road aggregator are implemented in the `scoring/` module and **exported from `@carcassonne/core`**. Pure; no input mutation.
- [x] **Completed city** scores `2 * tileCount + 2 * pennants` (verified: a plain 2-tile closed city = 4; a closed city including a pennant tile adds 2 per pennant).
- [x] **Completed road** scores `1 * tileCount`.
- [x] Only **completed** city/road features are scored by the aggregator; **incomplete** features and **monastery/field** features are excluded (verified — an open city/road yields no score entry).
- [x] Credited `players` come from `resolveOwnership(feature.meeples).owners`: a **single owner** gets the points; a **two-way tie** credits **both** players, **each** with the full `points`; a **completed feature with no meeple** has `players: []`.
- [x] The result is structured per feature with at least `type`, `points`, and credited `players` (plus the breakdown fields above), suitable for a later review/tally UI.
- [x] Two separate features of the same type on one board produce two independent score entries; a multi-pennant city sums pennant bonuses correctly.
- [x] Output is deterministic (feature order from Item 006; `players` sorted per Item 007).
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–007) remain green; no new cyclic import.

> Maps to the Stage 1 deliverable "Scoring engine (base game, incremental): scores completed cities, roads …". Combined with Item 009 (monasteries + engine) this begins satisfying the Stage 1 acceptance criterion "Engine returns correct scores for completed cities, roads, and monasteries …"; the contested-feature criterion is exercised here for cities/roads via Item 007. See Completion Reminder for which boxes to tick.

## Implementation steps

1. Read `packages/core/src/features/types.ts` (`Feature`), `packages/core/src/scoring/ownership.ts` (`resolveOwnership`), and the Item 006 `feature-extraction.test.ts` fixtures (for closed-city / closed-road construction patterns).
2. Add `packages/core/src/scoring/feature-score.ts` (name may vary): `FeatureScore` type, `scoreCity`, `scoreRoad`, and `scoreCompletedCityRoadFeatures`. Pure; reuse `resolveOwnership`.
3. Re-export from `scoring/index.ts` and `packages/core/src/index.ts`.
4. Add `packages/core/test/city-road-scoring.test.ts` (see strategy).
5. Run `npm run lint && npm run build && npm test` until green.

## Testing strategy

- **Vitest** in `packages/core/test/city-road-scoring.test.ts`, authoring boards with `createBoard()` + `baseGameCatalog`, running `extractFeatures`, then scoring:
  - **Completed city (no pennant):** a 2-tile closed city (reuse the cap-to-cap pattern from `feature-extraction.test.ts`) → `points: 4`, correct `tileCount: 2`, `pennants: 0`.
  - **Completed city (with pennant):** a closed city including a pennant city tile → points include `+2` per pennant; assert exact total.
  - **Completed road:** a road closed at both ends (terminating into city/monastery tiles, or a loop) → `points: tileCount`.
  - **Incomplete excluded:** an isolated `BASE-C` city and an open road → aggregator returns no entry for them.
  - **Ownership crediting:** single owner on a completed city → that player credited; **two-way tie** → both credited, each `FeatureScore.players` lists both and each is awarded full `points`; **no meeple** → `players: []`.
  - **Multiple/independent features:** a board with two separate completed roads (or a city + a road) → two distinct score entries with correct values.
  - **Determinism:** scoring the same board (built in different input order) yields deep-equal results.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 006 (`Feature`, `extractFeatures`), Item 007 (`resolveOwnership`). Reuse; do not modify.
- **Downstream:** Item 009 (monastery scoring + unified `scoreBoard` reuses these scorers and the `FeatureScore` shape), Item 010 (canonical scenario suite asserts end-to-end city/road scores), Stage 4 (end-game adds incomplete-feature scoring with different math).

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars, secrets, config files, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (city/road scoring suite green; Items 001–007 suites still green)
- [x] Services started — N/A
- [x] Application runs — N/A
- [x] Feature verified — `scoreCity`/`scoreRoad`/aggregator exported; completed city = 2/tile+2/pennant, road = 1/tile, credited to majority owner(s)
- [x] Data verified — incomplete/monastery/field excluded; tie credits both with full points; no-meeple → players []
- [x] Health checks pass — N/A

**Expected Outcomes**
- City/road scorers exported and pure; correct points and crediting for completed features; incomplete features excluded.
- `npm run lint && npm run build && npm test` exits 0.

## Validation Results
- [ ] Service started: N/A
- [ ] Application started successfully: N/A
- [ ] Database tables verified: N/A
- [ ] Seed data verified: N/A
- [ ] API endpoints verified: N/A
- [ ] Screenshots captured: N/A (no UI)

## Decisions & Trade-offs

- **Minimal closed-road fixture via `BASE-A` self-rotation.** The road test suite builds its 2-tile closed road from `BASE-A` (a monastery tile with a single road side, only on the S side) rotated 180° against itself, rather than chaining `ROAD-STRAIGHT`/other sample tiles. This is simpler and keeps the road tests self-contained within the base-game catalog, at the cost of not exercising longer road chains in this item (acceptable — Item 010's canonical scenario suite covers broader layouts).
- **Pennant-bearing closed city built as 3 tiles, not 2.** No single base-game tile pair closes a pennant city in exactly 2 tiles without leaving another side open, so the pennant test uses `BASE-F` (through-city N+S, pennant) capped on both open ends by two `BASE-E` tiles — a 3-tile, 1-pennant fixture. This still exercises the `2 * pennants` term exactly (`2*3 + 2*1 = 8`); the trade-off is a slightly larger fixture than the spec's illustrative "2-tile closed city" example, with no loss of correctness coverage.
- **`scoreCity`/`scoreRoad` trust the caller on completion.** Neither function checks `feature.completed` itself; only the aggregator (`scoreCompletedCityRoadFeatures`) enforces "completed city/road only" via an explicit `if (!feature.completed) continue;` guard. This matches the spec's framing of `scoreCity`/`scoreRoad` as low-level per-feature scorers that the aggregator (and the future Item 009 engine) compose, keeping the completion check in exactly one place rather than duplicated in every scorer.
- **`FeatureScore.tilePositions`/`players` typed as `readonly` arrays.** The spec's proposed shape used plain arrays; the implementation uses `readonly` arrays for consistency with `Feature`'s own readonly fields (Item 006). This is a non-breaking shape refinement explicitly permitted by the spec ("Shape may be refined") and improves purity guarantees for consumers.
- **No engine entry point added.** `scoreBoard(board, catalog)` and per-player grand-total assembly remain out of scope per the spec; confirmed absent from the codebase by the checker (`grep -rn "scoreBoard" packages/` → no matches). Item 009 will assemble these scorers (and add monastery scoring) behind that single entry point.

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 008 against the Stage 1 "Scoring engine (base game, incremental)" deliverable (completed city/road scoring done; the deliverable becomes fully ✅ only once Item 009 adds monasteries + the engine entry point). **Stage 1 stays 🚧 In Progress.** You may note progress toward the "Engine returns correct scores for completed cities, roads, and monasteries" and "Contested features award points by official majority/tie rules" acceptance criteria, but do **not** tick those boxes until Item 009 (engine assembly) / Item 010 (scenario suite) complete the picture — they require monastery scoring and the unified engine. Update only Item 008's progress. Status flow: 📋 → 🚧 → ✅.
