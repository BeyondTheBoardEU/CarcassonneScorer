# Docs Update — Item 006
- Agent: aide-doc-updater
- Status: complete
- Date: 2026-06-20

## Updated
- `docs/aide/progress.md`
  - Updated the "Last updated" line to `2026-06-20 (Item 006 complete)`.
  - Stage 1 deliverable "Scoring engine (base game, incremental)" — appended a note recording Item 006 ✅ (feature extraction is the foundation for this engine); the deliverable bullet itself remains 📋 (unchanged icon), since ownership/majority resolution and point scoring (Items 007–010) are still pending.
  - Stage 1 status and Overall-progress table left at 🚧 In Progress (unchanged) — not all Stage 1 deliverables/criteria are complete.
  - No Stage 1 acceptance-criteria checkboxes were ticked (those require Items 007–010, per the spec's Completion Reminder).
  - No other item's status or checkboxes were touched.

- `docs/aide/items/006-feature-extraction.md`
  - Replaced the "Decisions & Trade-offs" placeholder with six prose decisions drawn from `implementation.md`'s Decisions section: union-find over string-keyed `(position, segmentId)` nodes; linear-scan side/half-edge matching helpers (no pre-indexing); `computeCompleted` re-deriving board sides via `rotateSide` rather than caching; deterministic ordering by min tile position → segment id → type tiebreaker, with independently sorted internal lists; the structural cast used to sum `pennants` across `CitySegment`s; and the decision to keep `posKey` a local helper in `extract.ts` rather than exporting it from the board module.
  - Ticked all 9 "Acceptance criteria" checkboxes (all confirmed PASS by the checker with specific evidence in `check.md`).
  - Ticked all 6 "Manual Validation Checklist" boxes under Testing Prerequisites (build/tests pass; N/A items for services/app/health checks marked complete as N/A).
  - "Validation Results" section (service/DB/UI-specific, all N/A, unrelated to this pure-core item) left unchanged.

## Notes
- Item 006 status in the pipeline is now ✅ Complete per its own status flow (📋 → 🚧 → ✅); this is reflected by the fully-ticked spec checklists and the progress.md note. Stage 1's deliverable and acceptance-criteria rows intentionally remain open, awaiting Items 007–010, exactly as the spec's Completion Reminder instructs.
