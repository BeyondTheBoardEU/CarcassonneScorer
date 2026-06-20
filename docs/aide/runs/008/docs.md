# Docs Update — Item 008
- Agent: aide-doc-updater
- Status: complete
- Date: 2026-06-20

## Updated
- `docs/aide/progress.md`:
  - "Last updated" line changed from "(Item 007 complete)" to "(Item 008 complete)".
  - Stage 1 deliverable "Scoring engine (base game, incremental)" annotation extended with an "Item 008 ✅" note describing `scoreCity`/`scoreRoad`/`FeatureScore`/`scoreCompletedCityRoadFeatures`, point formulas, and ownership crediting via Item 007. Deliverable bullet itself remains 📋 (still pending Item 009: monasteries + `scoreBoard`). Stage 1 status left at 🚧 In Progress. The two Stage 1 acceptance-criteria checkboxes ("Engine returns correct scores for completed cities, roads, and monasteries", "Contested features award points by official majority/tie rules") were left unticked per the spec's Completion Reminder — they require Item 009 (engine assembly) and Item 010 (scenario suite).
- `docs/aide/items/008-city-road-scoring.md`:
  - "Decisions & Trade-offs" section: replaced the "To be updated during implementation." placeholder with 5 durable prose decisions drawn from `implementation.md` — the `BASE-A` self-rotation closed-road fixture, the 3-tile pennant-city fixture rationale, the completion-check-lives-only-in-the-aggregator decision, the `readonly` array refinement, and confirmation no `scoreBoard` entry point was added.
  - Ticked all 8 "Acceptance criteria" checkboxes (all verified PASS by `check.md`).
  - Ticked all 7 "Manual Validation Checklist" checkboxes (build/tests/feature/data verified; services/app/health left as N/A per spec, now checked off as such).

## Notes
- Did not touch the "Validation Results" section (already correctly marked N/A — no UI in this item) or any source/test files.
- Did not tick the Stage 1 acceptance-criteria boxes in progress.md, per the spec's explicit Completion Reminder that they require Items 009/010.
