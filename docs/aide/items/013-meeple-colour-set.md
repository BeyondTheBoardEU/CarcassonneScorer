# Item 013 — Standard meeple colour set (accessible)

> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [queue-002.md](../queue/queue-002.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-21

---

## Description

Author the **standard Carcassonne meeple colour set** as reusable **data** with a typed accessor, as a single source of truth analogous to the tile catalog. Each colour carries an id, a display name, a colour value (for the swatch), **and a non-colour distinguisher** (a label/pattern token) so colours are never conveyed by hue alone — encoding the accessibility NFR ("meeple-colour selection must not rely on colour alone") and the G6 "all standard meeple colours" / up-to-6-players requirement.

This is consumed by game setup (Item 015, choosing a colour per player) and the scoreboard/log (Items 016/018, rendering each player's colour). The Item 012 session model already references a colour by opaque `colourId: string`; this item provides the set those ids resolve against.

### Scope boundary

- **Data + accessor only.** No UI rendering (swatches, pattern SVGs) — that is the setup/scoreboard items (015/016). This item provides the *data* and lookup helpers; the UI maps a colour to a visual.
- **No colour-uniqueness enforcement at the session level.** Distinctness of chosen colours is already guarded by the Item 012 session model (`duplicate-colour`) and enforced in the setup UI (015). This item just provides a helper to support that, not the enforcement flow.
- **Base-game / up-to-6 scope.** Exactly the standard colours needed for 2–6 players. Expansion-specific tokens are out of scope (Stage 5).

## Design decisions (decided here)

- **Location.** Platform-independent data module in `packages/core` (e.g. `packages/core/src/colours/`), re-exported from `@carcassonne/core` — single source of truth, reusable by web now and native later (principle 6). No DOM; the colour *value* is a plain string (e.g. a hex), and the non-colour distinguisher is a plain token, both consumed by the UI layer.
- **Colour count = 6.** Provide the six standard meeple colours covering up to six players: **red, blue, green, yellow, black**, and a sixth (the 6-player colour — **gray**; pink is the common alternative). The exact sixth colour is the implementer's call from the commonly-accepted set; document it.
- **Shape.** Each entry: `{ id: string; name: string; value: string; pattern: string }` where `id` is a stable kebab/lower token (e.g. `"red"`), `name` is the display label, `value` is the swatch colour (hex), and `pattern` is a non-colour distinguisher token (e.g. `"solid" | "stripes" | "dots" | …`, or a short distinct label/shape id) so two players are always distinguishable without relying on hue. Each colour's `pattern` (or label) is **distinct**.
- **Accessor API.** `meepleColours` (the ordered list) plus helpers: `getMeepleColour(id): MeepleColour` (throws a typed error or returns from a safe lookup — match the catalog's `getTile` throwing convention for consistency), `hasMeepleColour(id): boolean`, and `meepleColourIds` (or `allMeepleColours()`), so setup/scoreboard resolve ids cleanly.
- **Accessibility intent encoded in data + tests.** The set is chosen/ordered to be reasonably colour-blind distinguishable, and crucially every colour carries the non-colour `pattern`/label token, asserted unique in tests — so the UI can always render a non-colour cue.

## Proposed types (shape, not final names)

```ts
interface MeepleColour {
  id: string;        // stable token, e.g. "red" — matches Player.colourId
  name: string;      // display name, e.g. "Red"
  value: string;     // swatch colour, e.g. "#d22"
  pattern: string;   // non-colour distinguisher token, e.g. "solid"/"stripes"/… (distinct per colour)
}

const meepleColours: readonly MeepleColour[];           // 6 standard colours, ordered
function getMeepleColour(id: string): MeepleColour;     // throws if unknown (catalog-style)
function hasMeepleColour(id: string): boolean;
```

Exact names/layout may vary — e.g. `packages/core/src/colours/{data,index}.ts` re-exported from `packages/core/src/index.ts`, consistent with the catalog module style.

## Acceptance criteria

- [x] A meeple colour set + `MeepleColour` type + accessor (`meepleColours`, `getMeepleColour`, `hasMeepleColour`) is implemented in `packages/core` and **exported from `@carcassonne/core`**. Pure data + functions; no DOM.
- [x] The set has **6** standard colours covering up to 6 players (red, blue, green, yellow, black, + a documented sixth), each with `id`, `name`, `value`, and a non-colour `pattern`/label distinguisher.
- [x] All colour **ids are unique**, and all non-colour distinguishers (`pattern`/label) are **distinct** — so any two players are distinguishable without relying on hue (accessibility NFR).
- [x] `getMeepleColour` returns the entry for a known id and signals an unknown id clearly (throws a typed error, matching the catalog's `getTile` convention); `hasMeepleColour` reflects membership.
- [x] `Player.colourId` values can be validated/resolved against this set by callers (the ids align with what Item 015 setup will assign).
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–012) remain green; core's no-DOM boundary intact; no cyclic import.

> Maps to the Stage 2 deliverable "meeple-colour selection" and the accessibility NFR (colour not conveyed by hue alone). User-facing acceptance ("assign distinct meeple colours") is satisfied when the setup UI (Item 015) uses this set.

## Implementation steps

1. Read `packages/core/src/catalog/{loader,index}.ts` for the `getTile`/`has` accessor convention and `packages/core/src/index.ts` export style.
2. Add `packages/core/src/colours/data.ts` (the 6 colours) and the accessor (`getMeepleColour`/`hasMeepleColour`), with a typed error for unknown id (reuse/extend a small error or follow `CatalogError` style).
3. Re-export from `packages/core/src/index.ts`.
4. Add `packages/core/test/meeple-colours.test.ts` (see strategy).
5. Run `npm run lint && npm run build && npm test` until green.

## Testing strategy

- **Vitest** (node project) in `packages/core/test/meeple-colours.test.ts`:
  - **Count & coverage:** exactly 6 colours; includes red/blue/green/yellow/black + the documented sixth.
  - **Uniqueness:** all `id`s unique; all `pattern`/label distinguishers distinct (the accessibility guarantee).
  - **Each entry well-formed:** non-empty `id`, `name`, `value`, and `pattern`.
  - **Accessor:** `getMeepleColour("red")` returns the red entry; `getMeepleColour("nope")` throws the typed error; `hasMeepleColour` true/false correctly.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 001 (core scaffold). Aligns with Item 012's `Player.colourId`.
- **Downstream:** Item 015 (setup assigns colours from this set, enforces distinctness), Item 016/018 (scoreboard/log render colour + non-colour cue), Stage 5 (expansion colours may extend the set later).

## Testing Prerequisites

**Required Services**
- None. Pure in-core TypeScript.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars, secrets, config, or ports.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (colour-set suite green; Items 001–012 suites still green)
- [x] Services started — N/A
- [x] Application runs — N/A
- [x] Feature verified — `meepleColours`/`getMeepleColour`/`hasMeepleColour` exported; 6 colours each with a non-colour distinguisher
- [x] Data verified — ids unique, distinguishers distinct, entries well-formed
- [x] Health checks pass — N/A

**Expected Outcomes**
- Accessible meeple colour set exported from core; `npm run lint && npm run build && npm test` exits 0; prior suites + core boundary intact.

## Validation Results
- [ ] Service started: N/A
- [ ] Application started successfully: N/A
- [ ] Database tables verified: N/A
- [ ] Seed data verified: N/A
- [ ] API endpoints verified: N/A
- [ ] Screenshots captured: N/A (no UI)

## Decisions & Trade-offs

- **Sixth colour = gray** (not pink). The spec left the exact sixth colour as the implementer's call from the commonly-accepted set; gray was chosen as the colour shipped in the official Carcassonne 6-player "Big Box"/expansion sets, giving the catalog's six colours (red, blue, green, yellow, black, gray) a defensible real-world basis rather than an arbitrary pick. Documented in the `data.ts` module comment. Trade-off: pink is a common community alternative and would have been equally valid; gray was preferred for closer alignment with official materials.
- **Pattern tokens chosen:** `solid`, `stripes`, `dots`, `checks`, `crosshatch`, `diagonal` — short, distinct, UI-agnostic string labels rather than rendering primitives. This satisfies the accessibility requirement (a non-colour distinguisher per colour, asserted unique) while deliberately leaving *how* each token is rendered (SVG pattern, icon, or visible text label) to the swatch-rendering layer in Items 015/016. Trade-off: this item guarantees uniqueness and presence of the token, not a finished visual design.
- **Location and module shape:** added as a new leaf module `packages/core/src/colours/{types,errors,data,accessor,index}.ts`, mirroring the existing `catalog/` module's file layout and re-export style, then barrelled into `@carcassonne/core` via `packages/core/src/index.ts`. Chosen for consistency with the established catalog-module pattern and to keep the colour set platform-independent (no DOM) and reusable from both the web app now and a native client later.
- **Accessor/error convention:** introduced a new `MeepleColourError` (with a `kind: "unknown-colour-id"` discriminant) rather than reusing `CatalogError` or `SessionError`, keeping each module's error type scoped to its own domain — consistent with the codebase's existing one-error-type-per-module pattern. `getMeepleColour` throws this typed error on an unknown id (mirroring `getTile`'s throwing convention); `hasMeepleColour` performs a safe boolean membership check; `meepleColourIds` was added as an ordered array of ids (the spec's suggested `meepleColourIds`/`allMeepleColours()` helper) since callers needing full entries already have `meepleColours` directly.
- **No cyclic imports / no session coupling:** the `colours/` module has zero dependencies on `catalog/`, `board/`, or `session/`, and nothing in those modules imports `colours/`, keeping it a dependency-free leaf module. Per the spec's scope boundary, `Player.colourId` (Item 012) is *not* validated against this set at the session-model level — that resolution/enforcement is left to callers (the Item 015 setup UI), with the session module's existing comment already noting this boundary explicitly.

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 013 against the Stage 2 deliverable "game setup — meeple colours" (the colour-set data; the setup UI is Item 015). **Stage 2 stays 🚧 In Progress.** Do not tick user-facing Stage 2 acceptance criteria yet (the distinct-colours setup criterion is ticked with Item 015). Stage 1 stays ✅. Update only Item 013's progress. Status flow: 📋 → 🚧 → ✅.
