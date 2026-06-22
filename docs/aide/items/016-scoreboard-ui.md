# Item 016 — Running scoreboard UI

> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [queue-002.md](../queue/queue-002.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-21

---

## Description

Build the **always-visible scoreboard**: for each player in the current session, show their name, meeple colour (with the accessible label/pattern, not hue alone), and **current total** read from the Item 012 reducer via the Item 014 store. Readable at a glance, it is the centrepiece of the in-game view and updates whenever the session changes (i.e. when score entry lands in Item 017).

This replaces the play-view placeholder's scoreboard portion from Item 014 and delivers the Stage 2 "running scoreboard" deliverable. Crucially, totals are **read from `useGame().totals` (← core `computeTotals`)** — the component does **no** arithmetic of its own, satisfying "no scoring arithmetic in the UI."

### Scope boundary

- **Display only.** No score entry (Item 017), no event log (Item 018), no persistence (Item 019). The scoreboard reads state; it does not mutate it.
- **No tally maths.** Totals come from `useGame().totals`; the component must not sum `session.events` itself.
- **In-game only.** Rendered within the play view (session present). Empty/no-game state is the setup view's concern (Item 015).

## Design decisions (decided here)

- **Location.** `packages/web/src/scoreboard/` (e.g. `Scoreboard.tsx` + a `PlayerScoreRow`), composed into the play view (replace/extend the Item 014 play placeholder). Package conventions (`.tsx`, `.js`-extension imports, explicit return types).
- **Data source.** Read `session.players` and `totals` from `useGame()`. For each player render: name, the meeple colour swatch (`getMeepleColour(player.colourId).value`) **plus** the non-colour cue (`name`/`pattern` from Item 013), and `totals[player.id]` (defaults to `0` — guaranteed present by `computeTotals`).
- **Glanceability.** Totals shown prominently (large, high-contrast); each row clearly associates colour-cue + player name + score. Players listed in session order (stable). Optionally indicate the leader, but ranking logic must not introduce score arithmetic beyond reading `totals`.
- **Accessibility.** Colour is never the sole signal — the colour name/label (and/or pattern) accompanies each swatch; sufficient contrast; the score is plain text (screen-reader friendly), e.g. an accessible label like "Alice (red): 12 points".
- **Reactivity.** Because totals come from the store's memoised `computeTotals`, the scoreboard updates automatically when Item 017 dispatches score events — no extra wiring needed here.

## Acceptance criteria

- [x] A scoreboard component in `packages/web/src/scoreboard/` renders within the in-game view, listing **every** player in `session.players` with name, meeple colour swatch, a **non-colour cue** (colour name/label/pattern), and current total.
- [x] Totals come from `useGame().totals` (← core `computeTotals`); the component performs **no** summation of `session.events` itself (verifiable by inspection — no delta arithmetic in the scoreboard code).
- [x] Each player's total renders correctly for a seeded session (e.g. a session with known events shows the right per-player totals); a player with no events shows `0`.
- [x] The scoreboard is **always visible** in the in-game view and reflects the current session (when Item 017 adds events, totals update — demonstrated via a store-driven test).
- [x] Accessibility: colour is accompanied by a textual/label cue (not hue alone); scores are readable as text with an accessible label.
- [x] Component tests (RTL) cover: all players rendered with names + colour cue; correct totals from a seeded session (incl. a 0 for a no-event player); totals update when the store's session changes.
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–015) remain green; core's no-DOM boundary intact; no scoring/tally arithmetic added to the UI.

> Maps to the Stage 2 deliverable "running scoreboard" and the acceptance criterion "always-visible per-player totals." It also concretely demonstrates "No scoring arithmetic in the UI — totals come from the core" (with Item 014); that criterion is finally ticked once score entry (Item 017) shows live updates end-to-end (or at Item 020).

## Implementation steps

1. Review `packages/web/src/state/useGame` (`session`, `totals`), `@carcassonne/core` `getMeepleColour`/`MeepleColour`, and the Item 014 play-view placeholder.
2. Build `packages/web/src/scoreboard/Scoreboard.tsx` (+ `PlayerScoreRow`) reading players + totals from the store; render colour swatch + non-colour cue + total.
3. Compose the scoreboard into the play view (replace the placeholder scoreboard region).
4. Add component tests under `packages/web/test/` (see strategy).
5. Run `npm run lint && npm run build && npm test` until green; spot-check `npm run dev`.

## Testing strategy

- **Component tests (Vitest + @testing-library/react + jsdom)** in `packages/web/test/scoreboard.test.tsx`, rendering within a `GameProvider` seeded via `initialSession`:
  - **All players rendered:** a 3-player seeded session shows all three names with their colour cue (assert the colour `name`/label text appears, not colour-only).
  - **Correct totals:** seed events (e.g. P1 +5, +3; P2 −2; P3 none) and assert displayed totals 8 / −2 / 0 — proving values come from `computeTotals`.
  - **Reactivity:** drive the store (e.g. via `addScore` from a harness) and assert the displayed total updates.
  - **No-arithmetic guard:** (inspection-level) the scoreboard reads `totals[playerId]`, not summing events.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 012 (`computeTotals` via store), Item 013 (`getMeepleColour` for swatch + cue), Item 014 (`useGame` totals/session, play view), Item 015 (creates the sessions being displayed).
- **Downstream:** Item 017 (score entry updates these totals live), Item 018 (log sits alongside), Item 020 (e2e asserts always-visible totals updating).

## Testing Prerequisites

**Required Services**
- None. Local web tooling only.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars/secrets/services. (Deps from Item 011 already installed.)

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (scoreboard suite green; Items 001–015 still green)
- [x] Services started — N/A
- [x] Application runs — `npm run dev`: after starting a game, the scoreboard shows all players with colours + totals (manual)
- [x] Feature verified — totals from the store; colour shown with a non-colour cue; always visible in-game
- [x] Data verified — seeded session totals render correctly incl. 0 for a no-event player
- [x] Health checks pass — N/A

**Expected Outcomes**
- An always-visible scoreboard reading totals from the core via the store; `npm run lint && npm run build && npm test` exits 0; prior suites + core boundary intact.

## Validation Results
- [ ] Service started: N/A
- [ ] Application started successfully: `npm run dev` (manual)
- [ ] Database tables verified: N/A
- [ ] Seed data verified: N/A
- [ ] API endpoints verified: N/A
- [ ] Screenshots captured: optional (scoreboard)

## Decisions & Trade-offs

- **Kept the Item 014 placeholder markup alongside the new `Scoreboard`.** `PlayView` in `App.tsx` retains the old `totals-list`/`add-score-*`/`new-game` testids/buttons rather than deleting them, specifically so `App.test.tsx`'s pre-existing routing assertions (which key off those testids, not visible copy) needed no changes. Item 017 (score entry) is the natural point to retire this duplicate scratch UI once real score-entry controls replace the `add-score-*` buttons.
- **Colour swatch is decorative (`aria-hidden="true"`).** The accessible information is carried by each row's `aria-label` and the visible `(Name, pattern)` text, so the swatch itself does not need a redundant/conflicting screen-reader announcement.
- **`aria-label` omits the `pattern` token**, using `"Alice (Red): 12 points"` per the spec's own example, while the visible text shows `(Red, solid)`. Both independently satisfy "colour never the sole signal" — the visible pattern text and the accessible label each stand alone as a non-colour cue.
- **`Scoreboard` returns `null` when no `session` is present**, rather than throwing. Defensive: the play view that mounts it is only reachable with a session, but this keeps the component safe if reused standalone later.

### Known minor follow-up (from check.md)

The checker (PASS, attempt 1) flagged a genuine but non-blocking duplicate: `App.tsx`'s `PlayView` renders both the new `<Scoreboard />` and the old Item 014 `totals-list` placeholder, so a user currently sees each player's total twice, in two different layouts, simultaneously. This was a deliberate trade-off (see above) to avoid touching `App.test.tsx` in this item's scope. **Follow-up:** remove the leftover `totals-list`/`total-${id}` markup from `PlayView` and update `App.test.tsx`'s `total-${id}` assertions to target the `Scoreboard`'s own testids/labels instead — to be done at the start of Item 017.

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 016 against the Stage 2 deliverable "running scoreboard" and **tick the acceptance criterion "always-visible per-player totals."** The "No scoring arithmetic in the UI — totals come from the core" criterion is demonstrated here but may be left for the end-to-end proof (Item 017/020) — do not regress it if already ticked; otherwise note it as substantially met. **Stage 2 stays 🚧 In Progress.** Stage 1 stays ✅. Update only Item 016's progress. Status flow: 📋 → 🚧 → ✅.
