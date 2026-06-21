# Docs Update — Item 014
- Agent: aide-doc-updater
- Status: complete
- Date: 2026-06-21

## Updated
- `docs/aide/progress.md`:
  - "Last updated" line changed to note Item 014 (app state store and game-shell lifecycle landed in web); Stage 2 still In Progress.
  - Stage 2 deliverable "Thin UI over the Stage 1 core; no scoring logic duplicated in the UI" — appended an Item 014 note describing the `GameProvider`/`useGame()` store, `App.tsx` routing, and the `initialSession` hydrate seam. Deliverable status icon left at 🚧 (Items 015–020 still pending).
  - Stage 2 deliverable "Score model / totals from the core" — appended an Item 014 note confirming the web store now wires up to `computeTotals`/`createSession`/`addScoreEvent`. Deliverable status icon left at 🚧.
  - Stage 2 overall status left at 🚧 In Progress; Stage 1 left untouched at ✅; no Stage 2 user-facing acceptance criteria were ticked (none apply yet — they need the setup/scoreboard/entry/log/persistence UI).

- `docs/aide/items/014-app-state-store-shell.md`:
  - "Decisions & Trade-offs" section — replaced the "To be updated during implementation." placeholder with the implementer's actual decisions: Context+`useReducer` with no new dependency; reducer-vs-provider split so `createSession`/`addScoreEvent` run outside the reducer (enabling `SessionError` to be caught normally by callers instead of becoming an uncaught render error); store-supplied `id`/`timestamp` boundary at `addScore`; `GameContext` split into its own `context.ts` module to satisfy the `react-refresh/only-export-components` lint rule; the `initialSession` hydrate seam; `addScore` as a no-op when `session` is null; no new test-utility dependency (`fireEvent` instead of `user-event`); placeholder views kept inline in `App.tsx`.
  - "Acceptance criteria" — all 7 checkboxes ticked `[x]`, matching the checker's PASS verdict and cited evidence.
  - "Manual Validation Checklist" — all 7 checkboxes ticked `[x]` (build/tests/dev-run/feature/data verified; services and health checks N/A), consistent with the checker's report and the spec's own scope (no services/DB for this item).

## Notes
- Spec's "Validation Results" section (a generic service/DB/seed-data template, mostly N/A for this item) was left unchanged — it is outside the explicit "Acceptance criteria" / "Manual Validation Checklist" / "Decisions & Trade-offs" sections the spec's Completion Reminder calls out, and the orchestrator's instructions did not ask for it.
- No source code, tests, or git state were touched — documentation only, per lane.
