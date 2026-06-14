# AIDE Runs — Subagent Handoff Protocol

> **Document role:** Defines the file-based contract that the `/aide-orchestrate` command and the AIDE subagents (`aide-implementer`, `aide-checker`, `aide-doc-updater`, `aide-committer`) use to collaborate on a work item. This file is the single source of truth for **where outputs go** and **what each handoff file contains**.

---

## Why this exists

Spec-driven work on a single item passes through several focused agents. Handing the full conversation between them is expensive and noisy. Instead:

- **Each agent writes one small handoff file** to this directory.
- **Agents are passed file *paths*, not file *contents*.** An agent reads only the files it needs.
- **Return messages are short** — a status line plus the path to the handoff file. No pasting source or large diffs back to the orchestrator.

This keeps every agent's context window small and its job unambiguous.

---

## Directory layout

```
docs/aide/
  vision.md            # scope (read-only for the pipeline)
  roadmap.md           # stages (read-only for the pipeline)
  progress.md          # status ledger — doc-updater writes here
  queue/queue-NNN.md   # batches of work items
  items/NNN-*.md       # per-item specifications (create-item output)
  runs/
    README.md          # this file
    NNN/               # one folder per work item (zero-padded, matches item number)
      implementation.md  # written by aide-implementer
      check.md           # written by aide-checker  (may be re-written on retries)
      docs.md            # written by aide-doc-updater
      commit.md          # written by aide-committer
```

The **presence and content** of these files is how the orchestrator knows which pipeline stage an item has reached — the run folder is resumable. An empty or missing file means that stage has not completed.

---

## Pipeline & data flow

```
                 reads: items/NNN-*.md (spec)
aide-implementer ───────────────────────────────▶ writes code + tests
                 writes: runs/NNN/implementation.md

                 reads: spec + implementation.md
aide-checker ────────────────────────────────────▶ runs tests/build, judges criteria
                 writes: runs/NNN/check.md  (PASS | FAIL)

   ┌─ FAIL ─▶ orchestrator re-spawns implementer with check.md path (max 2 retries)
   └─ PASS ─▶ continue

                 reads: spec + implementation.md + check.md
aide-doc-updater ────────────────────────────────▶ updates progress.md + spec Decisions log
                 writes: runs/NNN/docs.md

                 reads: implementation.md + check.md + docs.md
aide-committer ──────────────────────────────────▶ git add/commit on branch aide/item-NNN
                 writes: runs/NNN/commit.md
```

The orchestrator never edits code, docs, or git itself — it only routes paths between agents and decides retry/stop.

---

## Handoff file formats

Keep these tight. Reference source by `path:line`. Do **not** paste large code blocks.

### `implementation.md`
```markdown
# Implementation Report — Item NNN
- Agent: aide-implementer
- Status: complete | blocked
- Date: YYYY-MM-DD

## Summary
One short paragraph: what was built.

## Files changed
- path/to/file — one-line description of the change

## Tests added/updated
- path/to/test — what it covers

## How to verify
- exact command(s) to build and run the tests

## Decisions (for doc-updater)
- decision — brief rationale / trade-off

## Blockers (only if Status: blocked)
- what is unclear or blocked, and what is needed to proceed
```

### `check.md`
```markdown
# Check Report — Item NNN
- Agent: aide-checker
- Verdict: PASS | FAIL
- Failure class: correctness | minor | spec-gap | environment | mixed | n/a
- Date: YYYY-MM-DD
- Attempt: N

## Commands run
- `command` → exit code / one-line result

## Acceptance criteria (from the spec)
- [x] criterion text — evidence (path:line or test name)
- [ ] criterion text — why it is not met

## Required fixes (only if Verdict: FAIL)
- path:line — problem → concrete suggested fix
```

**Failure class** drives the orchestrator's retry/model decision; set it whenever Verdict is FAIL (`n/a` on PASS):
- `correctness` — the implementation logic/behaviour is wrong (tests fail, criteria unmet by the code). Warrants the stronger model.
- `minor` — small, mechanical, precisely-located issues (a missing test case, a lint error, an off-by-one you can point at). A quick fix; no capability gap implied.
- `spec-gap` — the spec is ambiguous/under-specified/untestable as written; no amount of further coding resolves it. Route to the feedback loop.
- `environment` — toolchain/build/deps are broken or tests are flaky; the failure is not about the code. Surface for human fix.
- `mixed` — a combination dominated by correctness issues; treated like `correctness`.

### `docs.md`
```markdown
# Docs Update — Item NNN
- Agent: aide-doc-updater
- Status: complete
- Date: YYYY-MM-DD

## Updated
- progress.md — Item NNN status X → Y (and any acceptance checkboxes ticked)
- items/NNN-*.md — Decisions & Trade-offs appended

## Notes
- anything the orchestrator should surface to the user
```

### `commit.md`
```markdown
# Commit Record — Item NNN
- Agent: aide-committer
- Status: committed | skipped
- Date: YYYY-MM-DD
- Branch: aide/item-NNN
- Commit: <short hash>  (or n/a)
- Subject: <commit subject line>

## Files committed
- path

## Notes
- e.g. "git repo initialized", "nothing to commit", deviations
```

---

## Conventions

- **`NNN`** is the zero-padded work-item number (e.g. `001`), identical across `queue/`, `items/`, and `runs/`.
- Each agent **overwrites its own** handoff file on a retry; it never edits another agent's file.
- Agents **only ever write inside their lane**: implementer → code/tests + `implementation.md`; checker → `check.md` only; doc-updater → docs + `docs.md`; committer → git + `commit.md`.
- If an agent is blocked, it sets `Status`/`Verdict` accordingly and returns control to the orchestrator rather than guessing.
