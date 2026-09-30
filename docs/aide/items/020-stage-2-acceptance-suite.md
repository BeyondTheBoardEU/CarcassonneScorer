<!-- aide-template: item 2 -->
# Item 020 — Stage 2 acceptance end-to-end suite

> **Created:** 2026-09-30 · status tracked in [`progress.md`](../progress.md)
> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [`../queue/queue-002.md`](../queue/queue-002.md) · Item 020
> **Objectives:** G1, G3, G6
> **Suggested branch:** `aide/020-stage-2-acceptance-end-to`

---

## Description

A named end-to-end suite that drives the **assembled** web app — the same
`App` component `packages/web/src/main.tsx` mounts, with its real default
`localStorage`-backed storage and the real `@carcassonne/core` — through the
five Stage 2 acceptance criteria the way a user would: set up a game through
the setup form, add and adjust points through the score-entry controls, read
the scoreboard and the event log, reload, and read them again. It is the
Stage 2 regression net, in the role Item 010's scenario suite plays for
Stage 1.

The suite runs inside the existing gate (`npm test` → Vitest, `web` project
on jsdom + Testing Library), adds no dependency, and needs no network.

**Not in scope:** new product behaviour of any kind; a real-browser e2e runner
(Playwright) — see Assumption A1 and the `Left open` note; re-testing the
per-component edge cases Items 015–019 already cover (player-count bounds
enforcement, blank/zero custom amounts, corrupt storage, version mismatch).
This item is **test-only**: no file under `packages/web/src/` or
`packages/core/src/` changes.

## Acceptance Criteria

Every criterion is exercised through a freshly mounted `<App />` rendered with
**no props** (so startup hydrate and persistence go through the real default
storage), with the storage key `DEFAULT_SESSION_STORAGE_KEY` empty at the start
of each test. "Immediately" means the assertion is a synchronous query issued
directly after the user action returns — no `waitFor`/`findBy*`.

- [ ] **AC1: Setup at both player-count bounds.** For N = 2 and for N = 6
  (one parametrised test), entering N distinct names in the setup form
  (adding rows with **Add player** as needed) and pressing **Start game**
  shows the play view, and the list of player names on the scoreboard, in
  row order, equals the list of entered names in entry order. *(closes Stage 2 criterion 1)*
- [ ] **AC2: Six players get six distinct colours.** In a 6-player game set
  up through the form with each row's pre-assigned colour, the set of the six scoreboard colour labels (the `(Name, pattern)`
  text of each row) has exactly six members and equals the set of
  `(name, pattern)` labels built from the core's `meepleColours`. *(closes Stage 2 criterion 1)*
- [ ] **AC3: The chosen colour is the assigned colour.** In a 2-player setup,
  changing player 1's colour select from its default to a colour no other row
  holds, then starting the game, makes player 1's scoreboard colour label name
  the chosen colour, and player 2's label name player 2's selected colour.
  *(closes Stage 2 criterion 1)*
- [ ] **AC4: Adding points updates totals immediately, per player.** In the
  3-player scenario game (Testing Strategy), after each of the four positive
  entries (steps 1–4), every player's displayed scoreboard total, read
  immediately, equals the sum of the deltas the script has so far applied to
  that player. *(closes Stage 2 criterion 2)*
- [ ] **AC5: Negative adjustments update totals immediately.** Continuing the
  scenario, after each of the two negative entries (steps 5–6), every player's
  displayed total, read immediately, equals the sum of the deltas the script
  has so far applied to that player — including Bruno's total going below
  zero (−1). *(closes Stage 2 criterion 2)*
- [ ] **AC6: Every change appears in the event log.** After the six scenario
  entries, the event log shows exactly six rows, and the list of
  (player name, signed delta, reason or none) read from the rows in display
  order equals the scenario's six entries in reverse (the log is
  newest-first). *(closes Stage 2 criterion 3)*
- [ ] **AC7: Reload restores the exact in-progress game.** After the six
  scenario entries, unmounting the app and mounting a fresh `<App />` (no
  props) shows the play view — not the setup view — and the snapshot
  {scoreboard rows as (name, colour label, total) in order; event-log rows as
  their full text in order} equals the snapshot taken immediately before
  unmounting. *(closes Stage 2 criterion 4)*
- [ ] **AC8: Displayed totals come from the core reducer.** With the core's
  `computeTotals` export substituted, for this test only, by a function that
  returns every player's real total plus 1000, every scoreboard total
  displayed after the six scenario entries equals that player's real total
  plus 1000 — a UI that summed the logged deltas itself would show the real
  total and fail. *(closes Stage 2 criterion 5)*

## Assumptions

Recorded under `loop.clarify = "assume"`. Items 011–019 are all merged on
`aide/queue-002`, so every interface below was read from the real code there
on 2026-09-30, not predicted.

- **A1 — runner: Vitest + jsdom + Testing Library, not Playwright.** Item 011's
  spec named Playwright as the e2e runner "introduced in Item 020", but it was
  never installed, the vision's posture is `prototype` (Implementation Steps
  add no dependency), the Node on this machine's PATH is v17.4.0 (below
  Playwright's Node ≥ 18 floor), and a browser download would need network the
  suite must not depend on (§6). The most defensible default is to drive the
  assembled `App` in the runner the gate already has, using `fireEvent` from
  `@testing-library/react` (`@testing-library/user-event` is not installed and
  is not added). What this does not observe — a real browser, a real page
  navigation, the production bundle — is covered by the Validation section's
  replay, with an honest downgrade when no browser is available.
- **A2 — "reload" is unmount + fresh mount over the same jsdom `localStorage`.**
  `App` reads `storage.load()` once in a lazy `useState` initializer and
  defaults `storage` to a module-level `createLocalSessionStorage()` under
  `DEFAULT_SESSION_STORAGE_KEY` (`"carcassonne.session.v1"`,
  `packages/web/src/persistence/sessionStorage.ts`). A fresh `render(<App />)`
  after `unmount()` therefore re-runs the startup hydrate from the persisted
  bytes, which is the path a page reload takes. Module state is not reset, and
  none is involved in the hydrate.
- **A3 — the UI surface the suite drives (read from the merged code).**
  Player ids are generated at setup (`packages/web/src/setup/ids.ts`), so the
  suite locates controls by accessible name, not by id:
  - Setup (`SetupView`/`PlayerRow`/`ColourPicker`): inputs labelled
    `Player N name`; selects labelled `Player N colour` whose option values
    are core colour ids; buttons **Add player** and **Start game**; the form
    starts with two rows, the first two colours (`red`, `blue`) pre-assigned,
    and a colour held by another row is a `disabled` option.
  - Play view: `data-testid="play-view"`; setup view `data-testid="setup-view"`.
  - Scoreboard (`PlayerScoreRow`): one `<li>` per player in session order;
    name in `scoreboard-name-<id>`, colour label `(Name, pattern)` in
    `scoreboard-colour-<id>`, total in `scoreboard-total-<id>`.
  - Score entry (`PlayerEntryRow`): quick buttons with accessible names
    `Add 5 to <name>`, `Add 2 to <name>`, `Add 1 to <name>`,
    `Subtract 1 from <name>`; custom amount input labelled
    `Custom amount for <name>`; reason input labelled
    `Reason (optional) for <name>`; submit button **Apply to <name>**.
  - Event log (`EventLog`/`EventLogRow`): newest-first rows; player text
    `<name> (<Colour>, <pattern>)` in `event-log-player-<id>`, delta in
    `event-log-delta-<id>` rendered `+n` or `−n` with **U+2212 MINUS SIGN**
    (not ASCII `-`), reason in `event-log-reason-<id>` rendered ` — <reason>`
    and absent when no reason was given.
- **A4 — `computeTotals` is reached through the `@carcassonne/core` module
  specifier.** It lives in `packages/core/src/session/tally.ts`, is
  re-exported from `@carcassonne/core` (whose `exports` resolve to
  `packages/core/src/index.ts`), and `packages/web/src/state/GameProvider.tsx`
  imports it by that specifier. A module-level substitution of that export in
  AC8's test file (`vi.mock("@carcassonne/core", …)` wrapping the actual
  module) therefore reaches the store. AC8 lives in its own file so AC1–AC7
  run against the unsubstituted core.
- **A5 — the Stage 2 acceptance boxes are already ticked.** Items 015–019
  ticked all five on component-level evidence. This suite's annotations make
  it the end-to-end evidence for each; since the boxes are ticked, recording
  it is an append to each box's trail (`aide progress amend`), not a fresh
  `accept`.
- **A6 — a defect the suite exposes is handed back, not fixed here.**
  `packages/web/src/**` is declared under **Asserts against**, so a genuine
  product defect surfaced by a failing AC is a hand-back for a spec amendment
  (or a follow-up item), never a weakened assertion.

## Implementation Steps

1. No production code. The builder's step for this item is to confirm the
   suite passes against the merged app; if an AC fails because the product is
   wrong, hand back under A6.
2. The test-writer builds a small in-file helper set, reusing only what exists:
   `render`/`screen`/`within`/`fireEvent`/`cleanup` from
   `@testing-library/react`; `meepleColours` and `computeTotals` from
   `@carcassonne/core`; `DEFAULT_SESSION_STORAGE_KEY` from
   `packages/web/src/persistence/index.ts`; `App` from
   `packages/web/src/App.tsx`. Helpers: `setUpGame(names, colourOverrides?)`
   (drive the setup form), `apply(entry)` (drive one scenario entry through
   the score-entry controls), `readScoreboard()` and `readEventLog()` (read the
   rendered rows into plain arrays).
3. No dependency is added; no config file changes (the `web` Vitest project
   already includes `packages/web/test/**/*.test.{ts,tsx}`).

## Authorised paths

**May change:**

- `packages/web/test/stage2-acceptance.test.tsx` — AC1–AC7 and the `reload-then-continue` case
- `packages/web/test/stage2-acceptance-totals-provenance.test.tsx` — AC8, isolated because it substitutes a core export module-wide

**Asserts against:**

- `packages/web/src/**` — the assembled app every AC drives; the suite renders it and never changes it
- `packages/core/src/colours/data.ts` — AC2 builds the expected label set from `meepleColours` live
- `packages/core/src/session/tally.ts` — AC8 wraps the real `computeTotals` and compares against its output

## Testing Strategy

**Files.** `packages/web/test/stage2-acceptance.test.tsx` (AC1–AC7 plus the
named case below) and `packages/web/test/stage2-acceptance-totals-provenance.test.tsx`
(AC8). The project names web tests `<topic>.test.tsx`, not
`test_NNN_<topic>`; each test's name starts with its criterion (`ac1 …`) or
the case label. Every test: `localStorage.removeItem(DEFAULT_SESSION_STORAGE_KEY)`
in `beforeEach` and `cleanup()` plus the same removal in `afterEach` — without
it a previous test's persisted game would open the next mount in the play view.

**The scenario game** (shared by AC4–AC8 and the named case). Setup: three
players named `Ada`, `Bruno`, `Chen`, default colours. Entries, in order:

| Step | Player | Control | Delta | Reason |
|------|--------|---------|-------|--------|
| 1 | Ada | quick `Add 5 to Ada` | +5 | — |
| 2 | Bruno | custom amount `3` | +3 | `road` |
| 3 | Ada | quick `Add 2 to Ada` | +2 | — |
| 4 | Chen | custom amount `12` | +12 | `city` |
| 5 | Bruno | custom amount `-4` | −4 | `correction` |
| 6 | Ada | quick `Subtract 1 from Ada` | −1 | — |

Final totals: Ada 6, Bruno −1, Chen 12. The expected totals in AC4/AC5 are the
running sums of the table's Delta column computed in the test from the table,
not literals copied from the UI. Expected log deltas are formatted as the log
renders them (A3: U+2212 for negatives).

**AC-specific notes.**

- AC1: one `it.each` over N ∈ {2, 6}; names e.g. `P1-name`…`PN-name`.
- AC2: the expected set is each `meepleColours` entry formatted as
  `(<name>, <pattern>)`, read from the core export, never a hand-typed list.
- AC3: set player 1's select to `yellow` (free when the rows hold `red`,
  `blue`); assert labels `(Yellow, checks)` for player 1 and `(Blue, stripes)`
  for player 2 — read the expected label from `meepleColours` by id.
- AC7: take the snapshot with `readScoreboard()`/`readEventLog()`, call
  `unmount()`, `render(<App />)` again, re-read, deep-equal.
- AC8: `vi.mock("@carcassonne/core", async (importOriginal) => …)` returning
  the actual module with `computeTotals` wrapped to call the original and add
  1000 to every entry; the expected value per player is that player's final
  total computed from the scenario table, plus 1000.

**Named adversarial case (the only one).**

- `reload-then-continue`: after the AC7 reload, applying `Add 1 to Chen` makes
  Chen's total 13 and the event log 7 rows with the new entry first — guards a
  restore that renders the saved game but does not hydrate the store, so the
  first post-reload entry starts from an empty session and drops the restored
  log.

**Existing tests to reconcile:** none — this item changes no behaviour or
default.

## Validation

1. Run the item's two files alone and confirm 10 passing test cases are
   reported (AC1's parametrised test counts twice, plus AC2–AC8 and
   `reload-then-continue`): `npx vitest run packages/web/test/stage2-acceptance`.
2. Run `npm run build` and confirm the production bundle builds.
3. **Real-browser replay (environment-dependent).** If the validator has a
   browser it can drive, start `npm run dev`, replay the scenario game in the
   page (setup Ada/Bruno/Chen, the six entries), press the browser's reload,
   and confirm the play view returns with totals 6 / −1 / 12 and six log rows.
   No `[validation]` profile exists for a browser; when none is available,
   the validator records this step as **not performed — ❓ Unverified (no
   browser on the validating host)** in its report, never as a pass. Steps 1–2
   are required either way.

## Dependencies

- Item 011 — web scaffold and the Vitest `web` project on jsdom.
- Item 012 — session model and `computeTotals`.
- Item 013 — `meepleColours` (AC2, AC3).
- Item 014 — `GameProvider`/`useGame` store and setup ↔ play routing.
- Item 015 — setup form.
- Item 016 — scoreboard.
- Item 017 — score-entry controls.
- Item 018 — event log.
- Item 019 — local persistence and startup hydrate.

**Downstream:** Stage 3 items build on this suite as the Stage 2 regression net.

## Decisions & Trade-offs

To be updated during implementation.

- **Left open:** whether and when to add a real-browser e2e runner (Playwright) — it needs a new dependency, network for the browser download and Node ≥ 18 on the host, none of which a `prototype` Stage 2 item may assume; Stage 3's criteria (network disabled, killing the tab mid-game) cannot be observed in jsdom, so the runner decision belongs to the Stage 3 queue.
