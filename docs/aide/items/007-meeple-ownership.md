# Item 007 — Meeple ownership and majority/tie resolution

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-20

---

## Description

Implement the rule that decides **which player(s) score a feature**: count the meeples each player has on the feature, determine the **majority owner**, and handle **ties** (all tied players score the feature in full). Expose this as a small, **reusable, pure resolver** consumed by every feature-scoring path (Items 008/009 for base-game cities/roads/monasteries; Stage 4 for farmers; Stage 5 for expansions).

This is the official Carcassonne ownership rule made concrete and isolated, so the scoring items stay thin: a scorer computes a feature's point value, asks this resolver who scores it, and credits those players. It operates on the **meeples already attached to a feature by Item 006** (`Feature.meeples`) — it does not re-walk the board.

This satisfies the Stage 1 deliverable "majority/tie meeple ownership" and underpins the acceptance criterion **"Contested features award points by official majority/tie rules."** (That criterion is *ticked* once the scoring path that uses this resolver lands in Items 008/009 — see Completion Reminder.)

### Scope boundary

- **No points.** The resolver returns *who scores* (player ids) and the winning meeple count, never a point value. Converting that to points (2/tile + 2/pennant, 1/tile, 9) is Items 008/009.
- **No feature extraction.** It consumes a feature's meeple list (Item 006); it does not build features or read the board/catalog.
- **Base-game meeple weighting only.** Each meeple counts as **1**. Weighted meeples (e.g. the big meeple counting as 2) are an **expansion concern (Stage 5)** and are out of scope; the resolver is structured so weighting can be added later without changing call sites, but it must not implement it now.
- **Counting is per `playerId`.** Meeple `kind` is **not** used to decide ownership in the base game (a farmer, knight, robber, and monk all count as one meeple for their respective feature). `kind` matters to *which feature* a meeple is on (decided in Item 006), not to majority counting.

## Design decisions (decided here)

- **Pure resolver over a meeple list.** `resolveOwnership(meeples: readonly FeatureMeeple[]): OwnershipResult`. Pure, total (defined for the empty list), no I/O, no mutation. It reads only `playerId` from each meeple (see weighting note above).
- **New `scoring/` core module.** Add `packages/core/src/scoring/` to host this resolver now; Items 008/009 will add the per-feature scorers and the engine entry point to the same module. Keeps a clear home for the scoring layer separate from `features/`.
- **Result shape.** Return both the decision and the breakdown, so later breakdown UIs (Stage 4 per-category tally) and tests get what they need:
  - `owners: string[]` — the player id(s) that score the feature: the player(s) with the strictly-highest meeple count. **Empty** when there are no meeples. On a tie, **all** tied top players are included (each scores in full).
  - `topCount: number` — the winning meeple count (the max count held by a single player); `0` when there are no meeples.
  - `counts: Record<string, number>` — meeples per player id (summed; a player with two meeples on the feature → 2).
- **Multiple meeples per player are summed.** A feature spanning several tiles can carry more than one of a player's followers; they aggregate into that player's count (this is how a player can out-number a single-meeple opponent).
- **Deterministic output.** `owners` is sorted by `playerId` (stable string order); `counts` insertion is irrelevant (object keyed by id). Output must not depend on the order meeples appear in the input.
- **Convenience wrapper (optional).** A thin `resolveFeatureOwnership(feature: Feature)` that calls `resolveOwnership(feature.meeples)` may be added for ergonomics, but the meeple-list form is the primary, testable API.

## Proposed types (shape, not final names)

```ts
interface OwnershipResult {
  owners: string[];                 // player id(s) that score the feature; [] if none; all tied on a tie
  topCount: number;                 // winning meeple count (0 if no meeples)
  counts: Record<string, number>;   // meeples per player id (summed)
}

function resolveOwnership(meeples: readonly FeatureMeeple[]): OwnershipResult;
// optional: function resolveFeatureOwnership(feature: Feature): OwnershipResult;
```

Exact file layout may vary — e.g. `packages/core/src/scoring/{ownership,index}.ts` re-exported from `packages/core/src/index.ts`, consistent with the `board/`, `catalog/`, and `features/` module style. `FeatureMeeple` / `Feature` are imported from the Item 006 `features/` module.

## Acceptance criteria

- [x] `resolveOwnership(meeples: readonly FeatureMeeple[]): OwnershipResult` and the `OwnershipResult` type are implemented in a new `scoring/` core module and **exported from `@carcassonne/core`**. Pure; does not mutate inputs.
- [x] **No meeples →** `{ owners: [], topCount: 0, counts: {} }`.
- [x] **Single owner →** that player is the sole `owner`; `topCount` equals their meeple count.
- [x] **Clear majority →** the player with the strictly-highest count is the sole `owner`; lower-count players are in `counts` but not `owners`.
- [x] **Two-way tie →** both tied top players appear in `owners` (each scores in full); **three-way tie →** all three appear. `topCount` is the shared top count.
- [x] **Multiple meeples per player are summed** in `counts`, and that sum is what determines majority (e.g. one player with 2 beats another with 1).
- [x] Each meeple counts as **1** regardless of `kind`; the resolver does **not** weight by kind (weighting deferred to Stage 5). Counting is purely by `playerId`.
- [x] `owners` is **deterministically ordered** (sorted by `playerId`) and the result does not depend on input meeple order (verified by a shuffled-input test).
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–006) remain green; no new cyclic import (scoring may import from `features/`; `features/` must not import `scoring/`).

> Maps to the Stage 1 deliverable "Scoring engine … including majority/tie meeple ownership." The Stage 1 acceptance criterion "Contested features award points by official majority/tie rules" is satisfied end-to-end once Items 008/009 credit points via this resolver; do not tick it in this item.

## Implementation steps

1. Read `packages/core/src/features/types.ts` (`Feature`, `FeatureMeeple`) to reuse the meeple shape.
2. Add `packages/core/src/scoring/ownership.ts`: `OwnershipResult` type + `resolveOwnership` (and optionally `resolveFeatureOwnership`). Pure functions; no board/catalog import.
3. Add `packages/core/src/scoring/index.ts` barrel; re-export the public API from `packages/core/src/index.ts`.
4. Add `packages/core/test/ownership.test.ts` (see strategy).
5. Run `npm run lint && npm run build && npm test` until green.

## Testing strategy

- **Vitest** in `packages/core/test/ownership.test.ts`, building small `FeatureMeeple[]` arrays directly (no full board needed — a minimal `{ playerId, kind, position, segmentId }` per meeple):
  - **Empty:** `resolveOwnership([])` → `{ owners: [], topCount: 0, counts: {} }`.
  - **Single owner:** one player, one (and separately, two) meeples → sole owner, correct `topCount`.
  - **Clear majority:** P1×2, P2×1 → owner `[P1]`, `topCount` 2, `counts` `{P1:2, P2:1}`.
  - **Two-way tie:** P1×1, P2×1 → owners `[P1, P2]` (sorted), `topCount` 1.
  - **Three-way tie:** P1×1, P2×1, P3×1 → owners all three (sorted), `topCount` 1.
  - **Summing:** interleaved/shuffled input (P2, P1, P1) yields `counts` `{P1:2, P2:1}` and is order-independent (assert equal to the sorted-input result).
  - **Kind-agnostic:** mixing `kind` values for the same player still counts 1 each.
  - **(Optional) integration:** extract a feature via `extractFeatures` with meeples on it and pass `feature.meeples` to confirm the wrapper/primary API agree.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 006 (`Feature` / `FeatureMeeple`). Reuse; do not modify.
- **Downstream:** Item 008 (city/road scoring credits `owners`), Item 009 (monastery scoring + engine assembly), Item 010 (scenario suite asserts contested/tied outcomes), Stage 4 (farmer majority reuses this resolver), Stage 5 (adds kind-weighting on top without changing call sites).

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars, secrets, config files, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (ownership suite green; Items 001–006 suites still green)
- [x] Services started — N/A
- [x] Application runs — N/A
- [x] Feature verified — `resolveOwnership` exported from `@carcassonne/core`; majority/tie/empty behave per criteria
- [x] Data verified — counts sum per player; owners sorted; output order-independent
- [x] Health checks pass — N/A

**Expected Outcomes**
- `resolveOwnership` exported and pure; correct owners/topCount/counts for empty, single, majority, two-way and three-way tie; deterministic and order-independent.
- `npm run lint && npm run build && npm test` exits 0.

## Validation Results
- [ ] Service started: N/A
- [ ] Application started successfully: N/A
- [ ] Database tables verified: N/A
- [ ] Seed data verified: N/A
- [ ] API endpoints verified: N/A
- [ ] Screenshots captured: N/A (no UI)

## Decisions & Trade-offs

- **Pure resolver, two-pass tally.** `resolveOwnership` is implemented as a simple two-pass loop — first tally `counts` per `playerId`, then scan for `topCount` and filter the players matching it into `owners` — rather than a single-pass max-tracking approach. This was chosen for clarity and trivial correctness on the tie case; per-feature meeple-list sizes are tiny, so the extra pass has no meaningful performance cost.
- **Readonly result types.** `OwnershipResult.owners` and `.counts` are typed as `readonly string[]` / `Readonly<Record<string, number>>` to make the pure/non-mutating contract visible at the type level, consistent with `Feature`'s readonly fields in `features/types.ts`.
- **Optional wrapper included.** `resolveFeatureOwnership(feature: Feature)` was added as specified — it only forwards `feature.meeples` to `resolveOwnership`, so it is correct by construction and keeps the meeple-list form (`resolveOwnership`) as the primary, directly-testable API.
- **Module placement and import direction.** The resolver lives in a new `packages/core/src/scoring/` module (`ownership.ts` + `index.ts` barrel), re-exported from `packages/core/src/index.ts`, matching the existing `board/`, `catalog/`, and `features/` module style. It imports only `Feature`/`FeatureMeeple` types from `../features/types.js`; `features/` contains no import of `scoring/`, so the dependency direction (scoring → features) is one-way with no cycle, as required by the spec.
- **No points, no feature extraction, no kind-weighting** — confirmed in the implementation: `OwnershipResult` carries only `owners`/`topCount`/`counts` (no point arithmetic); `resolveOwnership` takes a meeple array directly rather than walking the board/catalog; and the counting loop reads only `playerId`, ignoring `kind` entirely, deferring weighted (e.g. big-meeple) counting to Stage 5 without requiring call-site changes later.
- **Verification:** `npm run lint && npm run build && npm test` passes with 7 suites / 216 tests (11 new ownership tests covering empty/single/majority/two-way-tie/three-way-tie/summing/order-independence/kind-agnosticism/purity/integration, plus all prior Item 001–006 suites green).

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 007 against the Stage 1 "Scoring engine (base game, incremental)" deliverable (majority/tie ownership done; the deliverable stays 📋/🚧 until the scoring paths in Items 008/009 land). **Stage 1 stays 🚧 In Progress.** Do **not** tick the "Contested features award points by official majority/tie rules" acceptance criterion yet — it requires the scoring path (Items 008/009) that credits points via this resolver. Update only Item 007's progress. Status flow: 📋 → 🚧 → ✅.
