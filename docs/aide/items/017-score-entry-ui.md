# Item 017 — Manual score entry UI

> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [queue-002.md](../queue/queue-002.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-22

---

## Description

Build **manual score entry**: add or adjust points (positive **or** negative) for **any player at any time**, dispatched as `ScoreEvent`s through the Item 014 store (`useGame().addScore`) so the running totals on the scoreboard (Item 016) update **immediately**. Include sensible affordances — quick increments and/or a custom amount, with an optional reason — and emit events only (no arithmetic in the component).

This delivers the Stage 2 "manual score entry" deliverable and the acceptance criterion "Add/adjust points for any player; totals update immediately." It also **retires the leftover Item 014 placeholder** (`totals-list` + the scratch `add-score-*` / `new-game` buttons) noted as a minor follow-up in Item 016's check, replacing it with real controls and updating `App.test.tsx` accordingly so the play view has a single, real scoreboard + entry.

### Scope boundary

- **Entry only (append).** Score entry **appends** events via `addScore`. Editing or reversing past events is **Stage 3** (review & correction). The negative `delta` here is a forward correction (a new event), not an edit of a prior one.
- **No event log view.** Displaying the history is Item 018 (this item just produces the events). No persistence (Item 019).
- **No tally maths.** The component dispatches `addScore(playerId, delta, reason?)`; it never sums or computes totals — those come from the core via the scoreboard.
- **Cleanup is in-scope.** Remove the Item 014 scratch placeholder UI in `PlayView` and reconcile `App.test.tsx` (the minor follow-up carried from Item 016). Do not leave a duplicate totals display.

## Design decisions (decided here)

- **Location.** `packages/web/src/score-entry/` (e.g. `ScoreEntry.tsx` + small subcomponents), composed into the play view alongside the scoreboard. Package conventions (`.tsx`, `.js`-extension imports, explicit return types, labelled inputs).
- **Per-player entry.** The user picks a player (or each scoreboard row exposes entry controls) and applies a point change. Provide **quick increments** (e.g. +1/+2/+5 and a −1 correction) and a **custom amount** field (accepts negative). An **optional reason** input may accompany a custom entry (stored on the `ScoreEvent.reason`).
- **Dispatch via the store.** Applying a change calls `useGame().addScore(playerId, delta, reason?)`. The store already supplies `id`/`timestamp` and delegates to the core `addScoreEvent`; this component supplies only `playerId`, `delta`, and optional `reason`. The scoreboard re-renders from `totals` automatically (immediate update).
- **Validation.** `delta` must be a non-zero integer; a blank/zero/invalid custom amount is rejected in the UI (no event dispatched). Negative values are allowed (corrections). No upper bound.
- **Retire the placeholder.** Remove the Item 014 `totals-list`/scratch buttons from `PlayView`; update `App.test.tsx`'s assertions to target the real scoreboard testids (e.g. `scoreboard-total-${id}`) and/or the new entry controls. Keep `new game` available via a real control if the play view still needs it (it does — keep a "new game" button, just not the scratch one).
- **Accessibility/usability.** Controls are labelled and operable; the targeted player is identified by name (+ colour cue) not colour alone; quick-add buttons have accessible names (e.g. "Add 2 to Alice").

## Acceptance criteria

- [x] A score-entry UI in `packages/web/src/score-entry/` lets the user add/adjust points for **any** player in the session, via quick increments and a custom amount (negative allowed), with an optional reason.
- [x] Applying a change calls `useGame().addScore(playerId, delta, reason?)` (→ core `addScoreEvent`); the component performs **no** tally arithmetic. The scoreboard total for that player updates **immediately** after entry.
- [x] A negative adjustment reduces the player's total; a zero/blank/non-integer custom amount is rejected (no event dispatched).
- [x] The Item 014 scratch placeholder (`totals-list` + `add-score-*` buttons) is **removed** from `PlayView`; there is no duplicate totals display; `App.test.tsx` is updated to the real scoreboard/entry testids and passes. A real "new game" control remains.
- [x] Component tests (RTL) cover: a quick-increment updates the scoreboard total immediately; a custom positive and a custom negative amount apply correctly; a zero/invalid amount dispatches nothing; an optional reason is carried onto the event; entry works for each of ≥2 players.
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–016) remain green (with `App.test.tsx` reconciled); core's no-DOM boundary intact; no scoring/tally arithmetic added to the UI.

> Maps to the Stage 2 deliverable "manual score entry" and **satisfies** the acceptance criterion "Add/adjust points for any player; totals update immediately." Combined with Item 016 it concretely demonstrates "No scoring arithmetic in the UI — totals come from the core."

## Assumptions

- None recorded. Specified and delivered before the aide-loop migration (2026-09-27); decisions taken during implementation are under Decisions & Trade-offs below and in the legacy run record `../runs/017/`.

## Implementation steps

1. Review `packages/web/src/state/useGame` (`addScore`), the Item 016 `Scoreboard` (testids/layout), and the current `App.tsx` `PlayView` placeholder + `App.test.tsx` assertions to reconcile.
2. Build `packages/web/src/score-entry/ScoreEntry.tsx` (+ subcomponents): player targeting, quick increments, custom amount (+ optional reason), with UI validation; dispatch via `addScore`.
3. Compose entry into `PlayView`; **remove** the scratch `totals-list`/`add-score-*` placeholder; keep a real "new game" control. Update `App.test.tsx` to the real testids.
4. Add component tests under `packages/web/test/` (see strategy).
5. Run `npm run lint && npm run build && npm test` until green; spot-check `npm run dev`.

## Testing strategy

- **Component tests (Vitest + @testing-library/react + jsdom)** in `packages/web/test/score-entry.test.tsx`, rendering the play view within a `GameProvider` seeded with a 2–3 player session:
  - **Quick increment:** click "+5" (or similar) for P1 → P1's scoreboard total increases by 5 immediately.
  - **Custom positive/negative:** enter a custom +7 → total +7; enter −3 → total −3 (net correct).
  - **Invalid amount:** entering 0 / blank / non-integer dispatches no event (total unchanged).
  - **Reason carried:** a custom entry with a reason results in an event whose `reason` is set (assert via store/session state).
  - **Multiple players:** entry works independently for ≥2 players.
  - **Placeholder retired:** the old `totals-list`/scratch buttons are gone; `App.test.tsx` passes against the real scoreboard/entry.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 014 (`addScore`), Item 016 (scoreboard whose totals update), Item 012 (`addScoreEvent`/`ScoreEvent` shape incl. `reason`).
- **Downstream:** Item 018 (log displays the events this produces), Item 019 (persistence saves them), Item 020 (e2e drives add/adjust and asserts immediate updates).

## Testing Prerequisites

**Required Services**
- None. Local web tooling only.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars/secrets/services. (Deps from Item 011 already installed.)

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (score-entry suite green; Items 001–016 still green; App.test reconciled)
- [x] Services started — N/A
- [x] Application runs — `npm run dev`: in a game, add/adjust points for players and watch totals update immediately (manual)
- [x] Feature verified — quick + custom (incl. negative) entry dispatches via the store; scoreboard updates at once
- [x] Data verified — invalid amounts dispatch nothing; reason carried onto the event; no duplicate totals UI
- [x] Health checks pass — N/A

**Expected Outcomes**
- Working manual score entry that updates the core-derived totals immediately, with the Item 014 placeholder retired; `npm run lint && npm run build && npm test` exits 0; prior suites + core boundary intact.

## Validation Results
- [x] Service started: N/A
- [x] Application started successfully: `npm run dev` (manual)
- [x] Database tables verified: N/A
- [x] Seed data verified: N/A
- [x] API endpoints verified: N/A
- [ ] Screenshots captured: optional (score entry + scoreboard) — not captured

## Decisions & Trade-offs

- **Validation regex (`^[+-]?\d+$`)** for the custom amount: accepts an optional leading sign plus digits only, so `"3.5"`, `"1e2"`, `""`, and non-numeric input are all rejected without dispatching, per the spec's "non-zero integer" requirement; `Number.parseInt` is only reached after this guard passes.
- **Quick-delta set fixed at `[1, 2, 5, -1]`** per the spec's example set ("+1/+2/+5 and a −1"); kept as a module-level constant in `PlayerEntryRow.tsx` rather than a prop, since no item in scope needs it configurable.
- **Form clears (`amount`/`reason` reset to `""`) only on an accepted submit** — a rejected (blank/zero/non-integer) submission leaves the user's typed value in place so they can see/correct it, rather than silently wiping it.
- **`PlayView` no longer destructures `totals`/`addScore` from `useGame()`** — those are now consumed inside `Scoreboard`/`ScoreEntry` respectively; `PlayView` itself only needs `session`/`newGame`, keeping it free of any tally-adjacent state.
- **Reason-carrying test asserts against real session state, not DOM text** — added a tiny `SessionHarness` test-only component (in `score-entry.test.tsx`, not shipped) exposing `session.events.at(-1)` so the test reads the actual dispatched `ScoreEvent.reason`/`delta` rather than inferring it indirectly, since Item 018 (not this item) owns displaying event history in the DOM.
- **Item 014 placeholder retirement and `App.test.tsx` reconciliation**: the scratch `totals-list`/`add-score-*` controls and the now-unused `totals`/`addScore` destructuring were removed from `PlayView`; the one existing `App.test.tsx` assertion that targeted the placeholder now reads the real `scoreboard-total-p1` testid, with all other assertions (already against real testids) left unchanged — a reconciliation only, no new test added there.

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 017 against the Stage 2 deliverable "manual score entry," **tick the acceptance criterion "Add/adjust points for any player; totals update immediately,"** and (with Item 016) **tick "No scoring arithmetic in the UI — totals come from the core"** now that entry→core→scoreboard is demonstrated end-to-end in component tests. **Stage 2 stays 🚧 In Progress** (event log + persistence + e2e remain). Stage 1 stays ✅. Update only Item 017's progress. Status flow: 📋 → 🚧 → ✅.
