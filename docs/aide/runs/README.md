# Legacy run records (Items 001–018)

This folder is a **read-only archive** from the project's earlier Spec Kit–based AIDE pipeline (`/aide-orchestrate` with implementer → checker → doc-updater → committer subagents). Each `NNN/` folder holds that item's handoff files:

| File | Written by | Holds |
|---|---|---|
| `implementation.md` | implementer | what was built, files touched, blockers |
| `check.md` | checker | PASS/FAIL per acceptance criterion, build/test output |
| `docs.md` | doc-updater | tracking-doc changes |
| `commit.md` | committer | branch, commit hash, files committed |

The project moved to [aide-loop](https://github.com/dadrobny/aide-loop) on 2026-09-27. Nothing reads these files any more and no new ones are written here: under aide-loop the durable record is the git history on `main`, [`../progress.md`](../progress.md) (status), the item specs in [`../items/`](../items/) (including their Decisions & Trade-offs), and the insight inbox [`../insights.md`](../insights.md). See `.aide/README.md` for how the loop works.
