# Docs Update — Item 016
- Agent: aide-doc-updater
- Status: complete
- Date: 2026-06-22

## Updated
- `docs/aide/progress.md`:
  - "Last updated" line (top banner) updated to 2026-06-22, noting Item 016 complete (running scoreboard landed).
  - Stage 2 deliverable "Running scoreboard" 📋 → ✅, with a detail note summarizing what Item 016 built (`Scoreboard.tsx`/`PlayerScoreRow.tsx`, accessible labels, 6 RTL tests) and recording the carried-forward minor cleanup (duplicate `totals-list` placeholder in `App.tsx`, deferred to Item 017).
  - Stage 2 acceptance criteria: annotated "Add/adjust points for any player; totals update immediately" with a note that Item 016 supplies the always-visible/live-update half (left unticked — the "add/adjust" half is Item 017's). Annotated "No scoring arithmetic in the UI — totals come from the core" as substantially demonstrated by Item 016 (left unticked pending the end-to-end proof at Item 017/020), per the spec's explicit instruction not to regress/tick prematurely.
  - Stage 2 roll-up status left at 🚧 In Progress (not all deliverables/criteria complete); Stage 1 left at ✅ Complete. No other item's checkboxes touched.
- `docs/aide/items/016-scoreboard-ui.md`:
  - All 7 "Acceptance criteria" checkboxes ticked `[x]` (checker verified all).
  - All 7 "Manual Validation Checklist" checkboxes ticked `[x]`.
  - "Decisions & Trade-offs" placeholder replaced with four durable decisions drawn from `implementation.md`'s Decisions section (kept Item 014 placeholder markup to avoid touching `App.test.tsx`; decorative `aria-hidden` swatch; `aria-label` wording vs. visible pattern text; `Scoreboard` returns `null` when no session).
  - Added a "Known minor follow-up (from check.md)" subsection recording the duplicate `totals-list` placeholder in `App.tsx`'s `PlayView`, noting it is non-blocking (PASS) and slated for removal at the start of Item 017.

## Notes
- Carried-forward minor cleanup: per `check.md`'s informational "Required fixes," `App.tsx`'s `PlayView` still renders both the new `Scoreboard` and the old Item 014 `totals-list`/`total-${id}` placeholder (a cosmetic duplicate, not a logic defect — did not block PASS). This is now recorded in both `progress.md` (Stage 2 deliverable note) and the item spec's Decisions section, with the agreed remediation point (start of Item 017) made explicit so it isn't lost.
- Left two Stage 2 acceptance-criteria boxes unticked by design, per the spec's own Completion Reminder wording ("do not regress... otherwise note it as substantially met") — annotated rather than ticked, since full satisfaction depends on Item 017 (entry) and Item 017/020 (end-to-end no-arithmetic proof).
