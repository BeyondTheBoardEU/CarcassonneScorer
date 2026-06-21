# Docs Update — Item 012
- Agent: aide-doc-updater
- Status: complete
- Date: 2026-06-21

## Updated
- `docs/aide/progress.md`:
  - Updated the "Last updated" line to note Item 012 (manual-scorepad session model + tally reducer landed in core; Stage 2 still In Progress).
  - Added a new Stage 2 deliverable bullet "Score model / totals from the core" marked 🚧, describing the new `packages/core/src/session/` module (`Player`, `ScoreEvent`, `GameSession`, `SESSION_VERSION`, `MIN_PLAYERS`/`MAX_PLAYERS`, `SessionError`, `createSession`/`addScoreEvent`, `computeTotals`), noting it does not by itself satisfy a user-facing Stage 2 acceptance criterion.
  - Stage 2 overall status left at 🚧 In Progress (unchanged); Stage 1 left at ✅ Complete (unchanged). No Stage 2 acceptance-criteria checkboxes were ticked (they require UI items 015–019, per the spec's Completion Reminder). No other item's status or checkboxes were touched.
- `docs/aide/items/012-scorepad-session-model.md`:
  - Ticked all 7 Acceptance-criteria checkboxes under "Acceptance criteria" (implementation + export, `createSession` guards, `addScoreEvent` immutability/guards, `computeTotals`, JSON round-trip, single-source 2–6 bound, `lint && build && test` green) — all confirmed PASS in `check.md`.
  - Ticked all 7 boxes in "Manual Validation Checklist" (build, tests, N/A items, feature/data verified).
  - Ticked all 6 boxes in "Validation Results" (all N/A, consistent with check.md).
  - Replaced the "Decisions & Trade-offs" placeholder ("To be updated during implementation.") with 5 prose entries drawn from `implementation.md`'s Decisions section: exporting `MIN_PLAYERS`/`MAX_PLAYERS`; the `event-<n>` deterministic fallback id scheme and its session-local-uniqueness trade-off; the `Omit<ScoreEvent,"id"> & {id?: string}` input type and omitting `reason` when undefined to preserve JSON round-trip equality; `computeTotals` ignoring unknown-`playerId` events defensively while `addScoreEvent` is the actual gate; and the absence of any catalog/board/scoreBoard import preserving the manual-scorepad scope boundary.

## Notes
- Per the spec's Completion Reminder, Stage 2's user-facing acceptance criteria (setup, score entry, log, scoreboard, persistence, "no scoring arithmetic in the UI") remain unticked in progress.md — they require the UI items (015–019) to consume this reducer first.
- No source code, tests, or git state was touched.
