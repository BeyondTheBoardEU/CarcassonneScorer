# Item 015 — Game setup UI

> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [queue-002.md](../queue/queue-002.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-21

---

## Description

Build the **game setup screen**: choose **2–6 players**, give each a name, and assign each a **meeple colour** from the Item 013 set with **distinct** colours enforced and the colour conveyed by a **label/pattern (not hue alone)**. On confirm, it builds a valid `GameSession` (via the Item 014 store's `startGame`, which calls the core `createSession`) and the shell transitions to the in-game view.

This replaces the setup placeholder from Item 014 and delivers the first user-facing Stage 2 acceptance criterion: "set up a 2–6 player game, name players, and assign distinct meeple colours."

### Scope boundary

- **Setup only.** Scoreboard (016), score entry (017), log (018), persistence (019) are separate. On successful submit this view hands off to the store and the shell shows the (placeholder-until-016) play view.
- **No new validation logic for rules already in the core.** Player-count (2–6) and duplicate-colour/duplicate-id rules live in the Item 012 model (`createSession` → `SessionError`); the UI **enforces them in the form** (good UX) and **also relies on** `startGame` surfacing `SessionError` as the backstop. Do not re-implement the bound as a fresh magic number — reuse the core's exported bound where practical.
- **No persistence.** A fresh setup each load (until Item 019). 

## Design decisions (decided here)

- **Location.** `packages/web/src/setup/` (e.g. `SetupView.tsx` + small subcomponents), rendered by the shell when `session === null`. Follows the package conventions (`.tsx`, `.js`-extension imports, explicit return types).
- **Player rows.** Start with 2 player rows; allow **add** up to 6 and **remove** down to 2 (the add/remove controls disable at the bounds). Each row: a **name** input and a **colour** picker.
- **Colour picker from Item 013.** Options come from `meepleColours`; each option shows the colour swatch **and** its non-colour distinguisher (the `pattern`/label + the colour `name` text) so selection never relies on hue alone (accessibility NFR). A colour already taken by another player is disabled/prevented so the chosen set stays **distinct**; a sensible default distinct colour is pre-assigned per row.
- **Submit → store.** "Start game" builds `Player[]` (`{ id, name, colourId }` — generate a stable `id` per player; default a blank name to a placeholder like "Player N") and calls `useGame().startGame(players)`. On success the shell routes to play. If `createSession` throws `SessionError` (backstop), show a clear inline message rather than crashing.
- **Names.** Trimmed; an empty name falls back to "Player N" so the session is always valid. Duplicate *names* are allowed (only colours must be distinct); ids are unique.
- **Accessibility/usability.** Inputs are labelled (associated `<label>`/`aria-label`); the colour control is operable and its selection is announced by name, not colour alone; the form is usable without a manual.

## Acceptance criteria

- [x] A setup view in `packages/web/src/setup/` renders when no game is in progress and lets the user configure **2–6 players**: add players up to 6 and remove down to 2, with the controls disabled at the bounds.
- [x] Each player has a **name** input and a **meeple colour** chosen from the Item 013 `meepleColours`; each colour option presents a non-colour cue (pattern/label + name text), **not hue alone**.
- [x] Chosen colours are kept **distinct**: a colour selected by one player cannot be simultaneously chosen by another (disabled/prevented in the UI), and the resulting session always has unique colours.
- [x] "Start game" produces a valid `GameSession` via the store's `startGame` (→ core `createSession`) and the shell transitions to the **in-game** view; empty names fall back to "Player N".
- [x] A `SessionError` from the core (backstop) is surfaced as an inline message, not an unhandled crash.
- [x] Component tests (RTL) cover: default 2 rows; add up to 6 (add disabled at 6); remove down to 2 (remove disabled at 2); entering names; duplicate-colour prevention; successful submit creates the session and routes to play (assert via the store/shell); the accessibility cue (colour name/label present, not colour-only).
- [x] `npm run lint && npm run build && npm test` exits 0; all prior suites (Items 001–014) remain green; core's no-DOM boundary intact; no scoring/tally arithmetic added to the UI.

> Maps to the Stage 2 deliverable "game setup" and **satisfies** the Stage 2 acceptance criterion "Set up a 2–6 player game, name players, assign distinct meeple colours."

## Assumptions

- None recorded. Specified and delivered before the aide-loop migration (2026-09-27); decisions taken during implementation are under Decisions & Trade-offs below and in the legacy run record `../runs/015/`.

## Implementation steps

1. Review `packages/web/src/state/` (`useGame`, `startGame`, `GameSession`/`Player` shapes), `@carcassonne/core` `meepleColours`/`getMeepleColour`, and the Item 014 setup placeholder + its test for conventions.
2. Build `packages/web/src/setup/SetupView.tsx` (+ a player-row and colour-picker subcomponent) with add/remove (2–6 bounds), name inputs, and the distinct-colour picker with non-colour cues.
3. Wire submit to `useGame().startGame`; handle/show `SessionError`. Replace the Item 014 setup placeholder with this view.
4. Add component tests under `packages/web/test/` (see strategy); update the Item 014 placeholder test if it asserted placeholder text.
5. Run `npm run lint && npm run build && npm test` until green; spot-check `npm run dev`.

## Testing strategy

- **Component tests (Vitest + @testing-library/react + jsdom)** in `packages/web/test/setup.test.tsx`, rendering within a `GameProvider`:
  - **Default & bounds:** renders 2 player rows; "add" grows to 6 then disables; "remove" shrinks to 2 then disables.
  - **Names:** typing sets player names; an empty name yields "Player N" in the created session.
  - **Distinct colours:** selecting a colour for one player makes it unavailable to others; attempting a duplicate is prevented; the created session has unique `colourId`s.
  - **Accessibility cue:** each colour option exposes its `name`/label (and pattern token), assert text presence so selection isn't colour-only.
  - **Submit/route:** clicking "Start game" with valid input creates a `GameSession` and the shell shows the in-game view (assert the play view / that `session` is set).
  - **Error backstop:** simulate a `SessionError` path (e.g. via a crafted state) and assert an inline message, no crash.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test`.

## Dependencies

- **Upstream:** Item 013 (`meepleColours`/`getMeepleColour`), Item 012 (`createSession`/`Player`/`GameSession`/`SessionError`, 2–6 bound), Item 014 (`useGame`/`startGame`, shell routing, setup placeholder).
- **Downstream:** Item 016 (scoreboard renders the players + colours this creates), Item 019 (persistence saves the created session), Item 020 (e2e drives this setup flow).

## Testing Prerequisites

**Required Services**
- None. Local web tooling only.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. No env vars/secrets/services. (Deps from Item 011 already installed.)

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build`
- [x] Tests pass — `npm test` (setup suite green; Items 001–014 still green)
- [x] Services started — N/A
- [x] Application runs — `npm run dev`: setup screen lets you configure 2–6 players and start a game (manual)
- [x] Feature verified — add/remove within 2–6; distinct colours with non-colour cue; start routes to play
- [x] Data verified — created session has the entered names (or "Player N") and unique colours
- [x] Health checks pass — N/A

**Expected Outcomes**
- A working setup screen producing a valid `GameSession` via the core; `npm run lint && npm run build && npm test` exits 0; prior suites + core boundary intact.

## Validation Results
- [x] Service started: N/A
- [x] Application started successfully: `npm run dev` (manual)
- [x] Database tables verified: N/A
- [x] Seed data verified: N/A
- [x] API endpoints verified: N/A
- [ ] Screenshots captured: optional (setup screen) — not captured, optional per spec

## Decisions & Trade-offs

- **Component split.** The setup form is split into `SetupView.tsx` (drafts state, add/remove bounds, submit/`SessionError` handling), `PlayerRow.tsx` (one row's name input + `ColourPicker` + remove button), and `ColourPicker.tsx` (the colour `<select>`), following the package's existing convention of small, single-responsibility `.tsx` files.
- **Reuse of core's `MIN_PLAYERS`/`MAX_PLAYERS`.** The 2–6 player bound reuses the Item 012 constants exported from `@carcassonne/core` rather than a fresh magic number, per the spec's explicit instruction — `SetupView.tsx` imports and uses them directly for the `canAdd`/`canRemove` bounds logic.
- **Colour distinctness via disabled, not removed, options.** A colour already taken by another row is rendered as a `disabled` `<option>` in `ColourPicker.tsx` rather than omitted from the list. This lets a player see the full colour set exists while blocking only the unavailable ones, matching the spec's "disabled/prevented" wording; `SetupView.tsx` computes `takenByOthers` to drive this per row.
- **Non-colour cue as visible option text.** Each colour `<option>`'s text is `"{name} ({pattern})"` (e.g. "Red (solid)") since `<option>` content can't host arbitrary markup/icons; the colour hue is layered on only as a `style.color` hint and is never the sole signal, satisfying the accessibility NFR.
- **`PlayerDraft` kept distinct from the core's `Player`.** A local, untrimmed-name `PlayerDraft` type (`setup/types.ts`) is used for in-progress form state, separate from the core's trimmed/defaulted `Player`. Trimming and the "Player N" empty-name fallback happen once, at submit time, so a row's input never visibly "jumps" to a placeholder while the user is still typing.
- **`SessionError` backstop kept intentionally unreachable through normal UI interaction.** Because the form's own disabled-option prevention already keeps colours distinct, the inline-error path (`data-testid="setup-error"`) can only be exercised in tests via a direct `fireEvent.change` on a disabled `<option>`'s value (jsdom does not enforce the `disabled` attribute on programmatic value changes). This is treated as an acceptable backstop test, not a UI gap — the checker confirmed the resulting assertions (inline message, no crash, view stays on setup) are the correct behaviour for this otherwise-unreachable path.
- **`generatePlayerId()` isolated in `ids.ts`.** Mirrors the existing `GameProvider`/`context.ts` pattern of keeping non-component logic out of `.tsx` files, so `react-refresh/only-export-components` stays satisfied across every `.tsx` file under `setup/`.
- **Replacing the Item 014 placeholder.** `App.tsx`'s placeholder `SetupView` (and its now-unused `useState`/`SessionError`/`Player` imports) was removed in favour of importing the real `SetupView` from `./setup/index.js`; the corresponding `App.test.tsx` routing tests were updated to use the real form's `start-game` submit id instead of the placeholder's `start-demo-game`/`start-invalid-game` ids, and the placeholder-specific `SessionError` test was removed in favor of the more thorough, reachable version now in `setup.test.tsx`.

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 015 against the Stage 2 deliverable "game setup" and **tick the Stage 2 acceptance criterion "Set up a 2–6 player game, name players, assign distinct meeple colours."** **Stage 2 stays 🚧 In Progress** (scoreboard/entry/log/persistence remain). Stage 1 stays ✅. Update only Item 015's progress. Status flow: 📋 → 🚧 → ✅.
