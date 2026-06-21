# Docs Update — Item 011
- Agent: aide-doc-updater
- Status: complete
- Date: 2026-06-21

## Updated
- `docs/aide/progress.md`:
  - "Last updated" line changed to `2026-06-21 (Item 011 complete — Stage 2 web scaffold established; Stage 2 now In Progress)`.
  - Overall progress table: Stage 2 row status `📋 Planned` → `🚧 In Progress`.
  - Stage 2 section header status: `📋 Planned` → `🚧 In Progress`.
  - Stage 2 deliverable "Thin UI over the Stage 1 core; no scoring logic duplicated in the UI" marked `🚧` with a note crediting Item 011 (new `@carcassonne/web` React 18 + Vite 5 + TypeScript package, core value rendered to prove UI→core wiring, Vitest workspace projects, root gate extended, core boundary preserved); deliverable text notes it completes as Items 012–020 land.
  - No Stage 2 acceptance criteria checkboxes ticked (per spec's Completion Reminder — they require setup/scoreboard/entry/log/persistence). Stage 1 left unchanged (✅, all boxes intact).
- `docs/aide/items/011-web-app-scaffold.md`:
  - All 7 "Acceptance criteria" checkboxes ticked `[x]` (workspace package, core-value rendering, dev/build, smoke test, root gate, core boundary intact, decisions documented) — all confirmed PASS in `check.md`.
  - All 7 "Manual Validation Checklist" checkboxes ticked `[x]`.
  - "Validation Results" checkboxes ticked `[x]` except "Screenshots captured" (left unticked — optional, not produced).
  - "Decisions & Trade-offs" placeholder replaced with durable prose covering: Vitest workspace projects (core=node, web=jsdom) replacing the single root `vitest.config.ts`; web build delegating to the package's own `build` script to avoid double type-checking; the lint-only root `tsconfig.json` update (distinct from `packages/core/tsconfig.json`, which is unchanged); the separate `.tsx` ESLint parser project preserving the core/web boundary in tooling; inclusion of `@testing-library/jest-dom` ahead of need; dual named/default `App` export; actual installed versions (React 18.3.1, Vite 5.4.21); and the noted-but-not-acted-on Node v17.4.0 `EBADENGINE` warning.

## Notes
- Checker's PASS report flagged the active Node version (v17.4.0) as below the spec's stated Node 18+/20 LTS requirement — not a blocker since the gate is green, but carried into the spec's Decisions section as a known environment risk for future attention (not actioned here, doc-updater stays in its lane).
- Stage 2's other four deliverables (game setup, manual score entry, score event log, running scoreboard, local persistence) remain `📋 Planned`; none of their acceptance criteria were touched.
