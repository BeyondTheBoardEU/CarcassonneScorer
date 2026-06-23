# Docs Update — Item 017
- Agent: aide-doc-updater
- Status: complete
- Date: 2026-06-23

## Updated
- `docs/aide/progress.md`:
  - "Last updated" line (top) — now notes Item 017 complete (manual score entry UI), Stage 2 still In Progress.
  - Stage 2 deliverables — "Manual score entry" changed 📋 → ✅ with a note describing `packages/web/src/score-entry/` (`ScoreEntry.tsx`/`PlayerEntryRow.tsx`), dispatch via `addScore`, validation, placeholder retirement, and the new test suite.
  - Stage 2 acceptance criteria — ticked `[x]` "Add/adjust points for any player; totals update immediately" and `[x]` "No scoring arithmetic in the UI — totals come from the core"; left unticked: "Every score change appears in the event log" and "Reloading restores the exact in-progress game" (both correctly still `[ ]`, per spec instructions).
  - Stage 2 roll-up status left at 🚧 In Progress (event log + persistence + e2e remain); Stage 1 left at ✅. No other item's text or checkboxes touched.
- `docs/aide/items/017-score-entry-ui.md`:
  - "Acceptance criteria" section — all 6 checkboxes ticked `[x]`.
  - "Manual Validation Checklist" — all checkboxes ticked `[x]` (Screenshots item left as a separate "Validation Results" entry, unticked/noted "not captured").
  - "Validation Results" — all checkboxes ticked `[x]` except "Screenshots captured" (left `[ ]`, noted optional/not captured).
  - "Decisions & Trade-offs" — placeholder ("To be updated during implementation.") replaced with the five decisions from `implementation.md`'s "Decisions" section (validation regex, fixed quick-delta set, form-clear-on-success-only behavior, `PlayView` no longer destructuring `totals`/`addScore`, reason-carrying test design) plus a summary note on the Item 014 placeholder retirement and `App.test.tsx` reconciliation.

## Notes
- Checker verdict was PASS with no required fixes; all doc updates reflect only what `check.md` explicitly verified.
- No source code, tests, or git state were touched.
