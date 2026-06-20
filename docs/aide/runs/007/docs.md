# Docs Update — Item 007
- Agent: aide-doc-updater
- Status: complete
- Date: 2026-06-20

## Updated
- `docs/aide/progress.md`
  - Line 3: "Last updated" line changed from "(Item 006 complete)" to "(Item 007 complete)".
  - Stage 1 deliverable "Scoring engine (base game, incremental)" bullet: appended a note that Item 007 is ✅ (resolveOwnership/resolveFeatureOwnership majority/tie resolver, exported from `@carcassonne/core`); deliverable itself stays 📋 (point-scoring paths Items 008–010 still pending). Stage 1 status line and table entry left at 🚧 In Progress (unchanged). The "Contested features award points by official majority/tie rules" acceptance criterion was left unticked, per the spec's Completion Reminder.
- `docs/aide/items/007-meeple-ownership.md`
  - "Decisions & Trade-offs" section: replaced the "To be updated during implementation." placeholder with durable prose covering the two-pass tally design, readonly result types, the optional `resolveFeatureOwnership` wrapper, module placement/import-direction (scoring → features, no cycle), confirmation of the no-points/no-extraction/no-kind-weighting scope boundary, and the verification result (216/216 tests passing).
  - "Acceptance criteria" section: all 9 checkboxes ticked `[x]`, matching the checker's PASS verdict (resolver/type exported and pure; empty/single/majority/two-way-tie/three-way-tie/summing/kind-agnostic/deterministic-ordering behaviors confirmed; lint/build/test green with no new cyclic import).
  - "Manual Validation Checklist" section: all 7 items ticked `[x]` (build, tests, N/A items, feature verified, data verified, health checks N/A).

## Notes
- Did not touch the "Validation Results" section (separate from the Manual Validation Checklist) — its items are service/UI/screenshot checks not applicable to this pure-core item and were already marked N/A; left unticked-but-N/A as no new evidence applies there beyond what was already noted.
- Did not tick the Stage 1 acceptance criterion "Contested features award points by official majority/tie rules" — per spec instructions, that requires the scoring paths in Items 008/009 that consume this resolver to credit actual points.
- No source code, tests, or git state touched.
