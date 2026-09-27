# Item 018 — Score event log UI

> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [queue-002.md](../queue/queue-002.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-23

---

## Description

Build the **score event log** view: every score change shown as a **traceable** entry — which player, how many points, when, and the reason if one was given — in order. It reads the session's append-ordered event log (`session.events` from Item 012) via the Item 014 store and renders it; it forms the basis for Stage 3's review & correction.

This delivers the Stage 2 "score event log" deliverable and the acceptance criterion "Every score change appears in the event log."

### Scope boundary

- **Display only.** The Stage 2 log is **read-only** — browsing/editing/reversing entries is **Stage 3** (review & correction). This item renders the log; it does not mutate it and adds no edit controls.
- **No new events.** Events are produced by score entry (Item 017); this item only displays them.
- **No persistence.** Reading `session.events` from the store; saving is Item 019.

## Design decisions (decided here)

- **Location.** `packages/web/src/event-log/` (e.g. `EventLog.tsx` + an `EventLogRow`), composed into the play view alongside the scoreboard (Item 016) and score entry (Item 017). Package conventions (`.tsx`, `.js`-extension imports, explicit return types).
- **Data source.** Read `session.events` from `useGame()` (and `session.players` to resolve `playerId` → name + colour cue, `getMeepleColour` for the cue). No arithmetic — just presentation of each event.
- **Per-entry content.** Each row shows: the **player** (name + non-colour colour cue), the **signed point change** (e.g. "+5", "−3"), the **time** (format the epoch-ms `timestamp` to a readable local time), and the **reason** if present. A signed/positive-vs-negative visual cue is fine but the sign must be explicit in text.
- **Order.** Display in a clear, consistent order — newest-first or oldest-first (choose and document; newest-first is common for a running log). Order must be deterministic from `session.events` (which is append-ordered).
- **Empty state.** With no events yet, show a clear empty-state message ("No score changes yet") rather than a blank area.
- **Accessibility.** Player identified by name (+ cue), not colour alone; timestamps human-readable; the list is a semantic list; signed amounts readable by screen readers (e.g. "minus 3").

## Acceptance criteria

- [x] An event-log component in `packages/web/src/event-log/` renders within the in-game view, listing **every** entry in `session.events` — each showing the player (name + non-colour colour cue), the **signed** point delta, a readable timestamp, and the reason when present.
- [x] **Every score change appears:** dispatching score events (via Item 017 `addScore`) results in a corresponding log entry for each; the log stays in sync with `session.events` (count and content), in a documented, deterministic order.
- [x] Negative deltas render with an explicit sign (e.g. "−3"); entries with a reason show it; entries without a reason render cleanly (no "undefined").
- [x] An **empty log** (no events) shows a clear empty-state message.
- [x] The component is **read-only** — no edit/reverse controls (those are Stage 3); it performs no tally arithmetic.
- [x] Component tests (RTL) cover: a seeded session's events all appear with correct player/sign/reason; a newly dispatched event appears in the log; empty-state shows with no events; ordering is as documented.
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–017) remain green; core's no-DOM boundary intact; no scoring/tally arithmetic added to the UI.

> Maps to the Stage 2 deliverable "score event log" and **satisfies** the acceptance criterion "Every score change appears in the event log."

## Assumptions

- None recorded. Specified and delivered before the aide-loop migration (2026-09-27); decisions taken during implementation are under Decisions & Trade-offs below and in the legacy run record `../runs/018/`.

## Implementation steps

1. Review `packages/web/src/state/useGame` (`session.events`/`session.players`), `@carcassonne/core` `ScoreEvent` shape (`playerId`, `delta`, `timestamp`, `reason?`) + `getMeepleColour`, and the Item 016/017 play-view composition.
2. Build `packages/web/src/event-log/EventLog.tsx` (+ `EventLogRow`): map `session.events` to rows resolving player name/cue, signed delta, formatted time, reason; handle the empty state.
3. Compose the log into the play view alongside scoreboard + entry.
4. Add component tests under `packages/web/test/` (see strategy).
5. Run `npm run lint && npm run build && npm test` until green; spot-check `npm run dev`.

## Testing strategy

- **Component tests (Vitest + @testing-library/react + jsdom)** in `packages/web/test/event-log.test.tsx`, rendering the play view within a `GameProvider` seeded via `initialSession`:
  - **All entries shown:** a session seeded with several events (mixed players, +/− deltas, some with a reason) renders one row per event with the right player name/cue, signed amount, and reason text; entries without a reason render without "undefined".
  - **Live append:** dispatch a new `addScore` and assert a new row appears (count grows by one) matching it.
  - **Sign:** a negative delta shows an explicit "−" sign; positive shows "+".
  - **Empty state:** a fresh session (no events) shows the empty-state message and no rows.
  - **Order:** assert the documented order (e.g. newest-first) for a multi-event session.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 012 (`ScoreEvent`/`session.events`), Item 013 (`getMeepleColour` cue), Item 014 (`useGame` session), Item 017 (produces the events shown).
- **Downstream:** Stage 3 (review & correction makes this log editable/reversible), Item 019 (persistence preserves the log across reloads), Item 020 (e2e asserts every change appears in the log).

## Testing Prerequisites

**Required Services**
- None. Local web tooling only.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars/secrets/services. (Deps from Item 011 already installed.)

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (event-log suite green; Items 001–017 still green)
- [x] Services started — N/A
- [x] Application runs — `npm run dev`: in a game, each score change appears in the log with player/amount/time/reason (manual)
- [x] Feature verified — log mirrors `session.events`; empty state shows with no events; read-only
- [x] Data verified — signed deltas, reasons (and reason-less entries) render correctly in the documented order
- [x] Health checks pass — N/A

**Expected Outcomes**
- A read-only event log reflecting every score change; `npm run lint && npm run build && npm test` exits 0; prior suites + core boundary intact.

## Validation Results
- [x] Service started: N/A
- [x] Application started successfully: `npm run dev` (manual)
- [x] Database tables verified: N/A
- [x] Seed data verified: N/A
- [x] API endpoints verified: N/A
- [x] Screenshots captured: optional (event log) — not captured; not required for pass

## Decisions & Trade-offs

- **Components.** `EventLog.tsx` + `EventLogRow.tsx` in `packages/web/src/event-log/` (plus an `index.ts` barrel mirroring `scoreboard/`/`score-entry/`). `EventLog` reads `session.events`/`session.players` from `useGame()` and renders a semantic `<ul>`; `EventLogRow` renders one entry, resolving the player's colour cue, formatting the signed delta and timestamp, and rendering the reason only when present.
- **Order: newest-first.** `EventLog` renders a reversed shallow copy of the append-ordered `session.events`, documented in a doc comment and exercised by a dedicated order test (asserting exact row order for a 3-event seed). Chosen per the spec's suggestion that newest-first is the more useful default for a running log — most relevant for "what just happened" at a glance. Order remains deterministic from `session.events`.
- **Signed delta + accessibility.** Deltas are formatted as explicit text ("+5"/"−3", using a Unicode minus sign U+2212 rather than a hyphen) and paired with an `aria-label` reading "plus/minus N points" so the sign is never conveyed by glyph or colour alone — satisfying the spec's accessibility requirement that signed amounts be readable by screen readers.
- **Timestamp formatting.** `new Date(timestamp).toLocaleString()` — locale-aware and human-readable with no added date-formatting dependency, satisfying the "readable local time" requirement directly from the epoch-ms `timestamp`.
- **Empty state.** Renders the literal message "No score changes yet" when `session.events` is empty, rather than a blank area, per the spec's empty-state requirement.
- **Player resolution via `playersById` map.** A `Map` is built once per render from `session.players` and looked up per event, avoiding an O(n·m) `.find()` per row; mirrors how `Scoreboard`/`ScoreEntry` already read `session.players`. A defensive fallback (rendering the raw `playerId`) guards against an unresolvable player without crashing the log, though this is not expected given the core's `addScoreEvent` guard.
- **Composition and scope.** Composed into `PlayView` in `App.tsx` immediately after `ScoreEntry`, alongside the Item 016 `Scoreboard`. The component remains strictly read-only and display-only — no edit/reverse controls, no new events dispatched, no tally arithmetic, and no persistence — consistent with the item's scope boundary (Stage 3 owns review/correction; Item 019 owns persistence).
- **Testing.** 7 new RTL tests in `packages/web/test/event-log.test.tsx` cover: all seeded events rendering with correct player/cue/sign/reason (including reason-less entries never rendering the string "undefined"); human-readable (non-raw-epoch) timestamps; live append growing the row count by one; explicit "+"/"−" sign assertions; the empty-state message with zero rows; newest-first ordering; and the read-only guarantee (no `<button>` inside the event-log section).

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 018 against the Stage 2 deliverable "score event log" and **tick the acceptance criterion "Every score change appears in the event log."** **Stage 2 stays 🚧 In Progress** (persistence + e2e remain — the "reloading restores the game" criterion is not yet ticked). Stage 1 stays ✅. Update only Item 018's progress. Status flow: 📋 → 🚧 → ✅.
