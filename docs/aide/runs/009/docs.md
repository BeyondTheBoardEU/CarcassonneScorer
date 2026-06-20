# Docs Update — Item 009
- Agent: aide-doc-updater
- Status: complete
- Date: 2026-06-20

## Updated
- `docs/aide/progress.md`:
  - "Last updated" line changed from "(Item 008 complete)" to "(Item 009 complete)".
  - Stage 1 deliverable "Scoring engine (base game, incremental): scores completed cities, roads, and monasteries, including majority/tie meeple ownership" flipped 📋 → ✅, with a note crediting Items 006–009 together and summarizing Item 009's contribution (`scoreMonastery`, `scoreCompletedFeatures`, `scoreBoard`/`BoardScore`).
  - Stage 1 acceptance criteria ticked: "Engine returns correct scores for completed cities, roads, and monasteries from a hand-authored board state (automated tests)" and "Contested features award points by official majority/tie rules (tests)" — both `[ ]` → `[x]`.
  - Stage 1 overall status left at 🚧 In Progress (not flipped to ✅), since the "Comprehensive unit tests for canonical base-game scenarios" deliverable and its remaining open criteria are unchanged — per the spec's Completion Reminder, that flip is reserved for Item 010.
  - No other item's checkboxes or stage statuses were touched.
- `docs/aide/items/009-monastery-scoring-engine.md`:
  - "Decisions & Trade-offs" section: replaced the "To be updated during implementation." placeholder with four prose decisions drawn from `implementation.md`'s "Decisions (for doc-updater)" — keeping Item 008's `scoreCompletedCityRoadFeatures` for backward compatibility, the one-scorer-per-file layout (`monastery.ts`, `engine.ts`), the no-new-cyclic-import confirmation, and the rationale for hardcoding monastery scoring to flat 9 points / `tileCount: 1`.
  - All 8 "Acceptance criteria" checkboxes ticked `[ ]` → `[x]` (checker verified all).
  - All 7 "Manual Validation Checklist" checkboxes ticked `[ ]` → `[x]`.

## Notes
- Check report verdict was PASS (Attempt 1); no fixes were required, so no spec/criteria text needed revision beyond checkbox state.
- Stage 1's overall roll-up status in the "Overall progress" table was intentionally left unchanged (still 🚧) since not every Stage 1 deliverable/criterion is yet checked — this is deferred to Item 010 per the spec's own Completion Reminder.
