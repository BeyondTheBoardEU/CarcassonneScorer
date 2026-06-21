# Implementation Report — Item 013
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-21

## Summary
Added the standard meeple colour set as a platform-independent data + accessor module in `packages/core/src/colours/`, mirroring the tile catalog's structure and `getTile`-style throwing convention. The set holds the 6 standard colours (red, blue, green, yellow, black, and the documented sixth — gray, the official 6-player colour), each with a unique `id` and a distinct non-colour `pattern` distinguisher, satisfying the accessibility NFR. Re-exported from `@carcassonne/core`. No DOM references; no cyclic imports (colours module has zero internal dependencies on other core submodules).

## Files changed
- `packages/core/src/colours/types.ts` — `MeepleColour` interface (`id`, `name`, `value`, `pattern`)
- `packages/core/src/colours/errors.ts` — `MeepleColourError` typed error (`kind: "unknown-colour-id"`), mirrors `CatalogError`/`SessionError` style
- `packages/core/src/colours/data.ts` — `meepleColours`: ordered list of the 6 standard colours (red/blue/green/yellow/black/gray), each with a distinct `pattern` token (solid/stripes/dots/checks/crosshatch/diagonal)
- `packages/core/src/colours/accessor.ts` — `getMeepleColour(id)` (throws `MeepleColourError` on unknown id), `hasMeepleColour(id)`, `meepleColourIds` (ordered id list)
- `packages/core/src/colours/index.ts` — module barrel, re-exports type/error/data/accessors
- `packages/core/src/index.ts` — added the "Standard meeple colour set (Item 013)" section re-exporting `MeepleColour`, `MeepleColourError`, `meepleColours`, `getMeepleColour`, `hasMeepleColour`, `meepleColourIds` from `@carcassonne/core`

## Tests added/updated
- `packages/core/test/meeple-colours.test.ts` (15 tests):
  - count & coverage: exactly 6 colours; includes red/blue/green/yellow/black/gray
  - uniqueness: all ids unique; all `pattern` distinguishers distinct
  - well-formedness: each entry (via `it.each`) has non-empty `id`/`name`/`value`/`pattern`
  - accessor: `getMeepleColour("red")` returns the red entry; `getMeepleColour("nope")` throws `MeepleColourError` with `kind: "unknown-colour-id"`
  - `hasMeepleColour`: true for every known id, false for an unknown id
  - `meepleColourIds`: matches `meepleColours.map(c => c.id)` in order

## How to verify
- `npm run lint && npm run build && npm test` from repo root — exits 0
- Targeted: `npx vitest run packages/core/test/meeple-colours.test.ts`

Full gate run confirmed: 13 test files, 289 tests passed (includes all prior Items 001–012 suites); lint clean; both core and web builds succeed.

## Decisions (for doc-updater)
- **Sixth colour = gray** (not pink): chosen as the colour shipped in the official Carcassonne 6-player "Big Box"/expansion sets, per the spec's own framing of the choice. Documented in `data.ts`'s module comment.
- **Pattern tokens**: `solid`, `stripes`, `dots`, `checks`, `crosshatch`, `diagonal` — short, distinct, UI-agnostic labels the swatch-rendering layer (Item 015/016) can map to actual SVG patterns or visible text labels later; this item only guarantees uniqueness, not a rendering.
- **Error type**: introduced `MeepleColourError` (new, colour-scoped) rather than reusing `CatalogError`/`SessionError`, keeping each module's error type scoped to its own domain — consistent with the existing one-error-per-module pattern in this codebase.
- **`meepleColourIds`**: added per the spec's suggested helper list (`meepleColourIds` / `allMeepleColours()`); chose the simple ordered `id` array since callers needing full entries already have `meepleColours`.
- No cyclic imports: `colours/` has no dependency on `catalog/`, `board/`, `session/`, etc., and nothing in those modules imports `colours/` — it's a leaf module.
