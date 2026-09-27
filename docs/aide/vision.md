<!-- aide-template: vision 2 -->
# Carcassonne Scorer — Project Vision

> **Status:** Active · **Created:** 2026-06-14 · **Last updated:** 2026-09-27 (prototype-posture review)
> **Posture:** prototype
> Step 1 of the AIDE loop · the root document: [`roadmap.md`](roadmap.md),
> [`progress.md`](progress.md), every queue and every work item derive from this.

---

## 1. Overview

**Carcassonne Scorer** takes the bookkeeping out of scoring the physical board game *Carcassonne* so players can focus on playing.

Carcassonne is a tile-laying game in which players build a shared landscape of cities, roads, monasteries, and fields, and place "meeples" to claim those features for points. Scoring happens in two ways: incrementally, as features are completed during play, and in a final tally at the end of the game that includes the notoriously fiddly farmer (field) scoring. With expansions added, the rules multiply and the end-game count becomes slow, error-prone, and a frequent source of disputes.

This product is **not** a digital version of the game. The game is still played on a physical table with real tiles and meeples. Carcassonne Scorer is the *scorekeeper* that sits alongside the physical game: it removes the arithmetic, the rules lookups, and the manual tallying, and — as it matures — it can look at the physical board through a camera and compute the score directly.

The product grows along a clear maturity curve:

1. **A fast, reliable digital scorepad** — replace pen and paper for tracking scores during play.
2. **A photo-based feature scorer** — point the camera at a completed structure (or a region you select) mid-game and get its score.
3. **A photo-based final scorer** — photograph the finished board and get the complete end-of-game tally, including farmers, automatically.
4. **A board validator** — detect illegal tile placements and configurations and surface them for review.

Throughout, a single principle holds: **automation assists, humans decide.** Any computed result is always presented for human review and correction. The product never silently asserts authority over the score.

---

## 2. Guiding principles

The non-negotiable principles every decision below the vision level is checked against:

1. **The spec is the source of truth.** Behaviour is defined in an item spec before it is implemented, and code conforms to the spec — not the other way round.
2. **A single tile catalog drives scoring, validation, and image recognition alike.** There is exactly one definition of what a tile is and how it behaves; no component may keep its own copy or diverge from it.
3. **The running score is never lost and works offline.** Every change to game state is persisted locally, and no scoring path may require a network connection.
4. **Any automatically computed result is always shown for human review and correction — never treated as silently authoritative.** Computed results stay *proposed* until a human confirms them; nothing automated reaches the committed score on its own.
5. **Unsupported pieces fail loudly and degrade gracefully to manual entry.** Recognition and scoring must be able to say "I don't know" and hand off to manual entry rather than guess.
6. **Scoring and board logic are platform-independent.** Catalog, board, scoring, validation and session logic live in the core with no UI or platform dependency; the UI is thin over it and holds no scoring or tally arithmetic.

---

## 3. Goals & objectives

| # | Objective | Measurable outcome |
|---|-----------|--------------------|
| G1 | Eliminate manual tallying | A group can finish a game and trust the final scoreboard without anyone adding up points by hand. |
| G2 | Fast, correct scoring from a photo | At any point during play, point a camera at the board and receive a correct, reviewable score in seconds. |
| G3 | Never lose the running score | The in-progress score survives app closure, device sleep, page reload, and loss of network connectivity. |
| G4 | Trustworthy automation | Every automatically computed score is shown for human review before it is committed; no auto-computed value is treated as final without a human confirming it. |
| G5 | Graceful degradation | When a piece or layout cannot be recognised, the app says so clearly and falls back to manual entry rather than guessing. |
| G6 | Broad coverage | Support every common player count and meeple colour, and the major expansions, with correct scoring rules for each. |

**Primary success statement:** *A group can finish a game and trust the scoreboard without anyone tallying by hand — and at any point during play, point a camera at the board and get a correct, reviewable score in seconds.*

---

## 4. Target users

The core audience is **people playing physical Carcassonne at a table**, across the full range of that audience:

- **Casual base-game players** — two friends or a family playing the base game. They need a frictionless scorepad and nothing more in their way.
- **Enthusiast / expansion-heavy groups** — up to **six players**, multiple expansions in play, contested features, and complex end-game farmer scoring. This group suffers most from manual scoring and gains the most from automation.
- **Mixed groups mid-spectrum** — base game plus one or two popular expansions.

Common characteristics:

- They are physically together at a table; the app is a companion, not the play surface.
- At least one player operates the app (the "scorekeeper"), though others may glance at or interact with it.
- They want the score to be *correct* and *settled* — reducing disputes is a real value, not a nicety.
- They may have intermittent or no internet at the table (kitchen tables, game cafés, trains, holidays). **Offline operation is a requirement, not a bonus.**

**Out-of-audience (for now):** remote/online players who want to play the game itself digitally, and tournament organisers needing officiated rules enforcement. See [Out of scope](#8-out-of-scope).

---

## 5. Core features

Grouped by the maturity curve; earlier groups are foundational.

### 5.1 Manual digital scorepad (foundation)

- **Game setup:** choose player count (2–6), assign each player a name and a meeple colour from the set of standard colours.
- **Manual score entry:** add or adjust points for any player at any time, with a clear log of scoring events so a mistake can be traced and corrected.
- **Running scoreboard:** always-visible current totals per player.
- **Persistent, offline-first state:** the running score persists locally across reloads and app restarts and works with no network connection.
- **Review & correction:** every score change is reviewable and reversible; nothing is final until the game ends.
- **End-game tally support:** assist the final scoring step, including farmer/field scoring, even when entered manually.

### 5.2 Photo-based feature scoring (mid-game)

- **Score a completed structure from a photo:** photograph a finished city, road, or monastery and have its score computed.
- **Score a user-selected region:** indicate a region of the board (draw or tap to select) and score just that region, for cases where automatic feature detection is ambiguous or the user wants control.
- **Reviewable result:** the computed score, the recognised feature, and which meeples/players it credits are shown for confirmation before being applied.
- **Clear failure:** if the photo cannot be interpreted, the app says so plainly and offers manual entry for that feature.

### 5.3 Photo-based final scoring (end of game)

- **Full-board final score from a photo:** photograph the finished board and compute the complete end-of-game tally, including incomplete cities/roads, monasteries, and **farmer/field scoring**.
- **Per-player breakdown:** show how the final total is composed so players can verify it.
- **Always reviewable:** the entire computed final score is presented for human review and correction before it becomes official.

### 5.4 Board validation

- **Illegal configuration detection:** check the board (from a photo or known state) for illegal tile placements and configurations and flag them.
- **Clear reporting:** explain *what* appears wrong and *where*, so players can decide whether it is a genuine violation or a recognition error.

### 5.5 Coverage & catalog

- **Player counts:** all common counts up to six players.
- **Meeple colours:** all standard meeple colours.
- **Expansions:** the major/common expansions, with their scoring and placement rules.
- **Single tile catalog:** one authoritative catalog of tiles and pieces drives scoring, validation, and image recognition alike (principle 2).

### 5.6 Trust & failure behaviour (cross-cutting)

- **Human-in-the-loop by default:** any automatically computed result is shown for review and correction and is never silently authoritative.
- **Fail loudly, degrade gracefully:** unsupported pieces or unrecognised layouts produce a clear message and a manual-entry fallback — never a silent guess.

---

## 6. Technical architecture

The decisions made so far; anything not listed is decided in the item spec that first needs it.

- **Language & layout:** TypeScript in an npm-workspaces monorepo.
- **`packages/core`:** tile catalog (typed data), board-state model, scoring engine, session/score model — pure and DOM-free (principle 6).
- **`packages/web`:** React 18 + Vite web app, thin over the core; shipped as an installable, offline-capable web app first (PWA in Stage 3).
- **Persistence:** game state is stored locally on the device; there is no backend.
- **Tests:** Vitest — core on `node`, web on `jsdom` with Testing Library. The gate is `npm run lint`, `npm run build`, `npm test`.

---

## 7. Constraints & assumptions

**Constraints**

- **Companion, not the game.** The product never replaces the physical tiles/meeples; it scores a game played on a real table.
- **Single catalog discipline.** Scoring, validation, and recognition must all be driven by the one tile catalog; divergence is prohibited.
- **Human-in-the-loop discipline.** No automated result may be committed without a path for human review and correction.
- **Offline-first.** Network must never be a prerequisite for scoring a game.
- **Player count ceiling.** Up to six players; standard meeple colours.
- **Accessibility.** Meeple-colour choice never relies on colour alone (each colour carries a non-colour label/pattern), so colour-blind players can tell players apart.
- **Privacy.** Photos of the board and game data stay on-device; no account or upload is required to score a game.

**Assumptions**

- Players have a device with a camera (phone or tablet) at the table for the photo-based phases.
- Lighting and board access are good enough for a usable photo in the recognition phases; where they are not, manual entry covers the gap.
- "Major expansions" means the commonly played, widely owned expansions; the exact supported set is defined in the roadmap and the tile catalog, and unsupported pieces fail loudly.
- The web platform's storage and offline capabilities are sufficient for durable, offline score persistence.
- One person typically drives the app per game (the scorekeeper), though shared/glanceable use is welcome.

---

## 8. Out of scope

- **Playing Carcassonne digitally** — no digital board, AI opponents, or tile-drawing/turn engine. *Reason:* the value is in removing bookkeeping from physical play, not replacing it.
- **Online / remote multiplayer** — no networked play between players in different locations. *Reason:* the audience is people physically at one table.
- **Accounts, cloud sync, and social features** — no login, leaderboards, or cloud game history. *Reason:* offline-first and privacy; avoid friction and scope creep.
- **Native mobile apps (for now)** — the product ships as an installable web app only. *Reason:* web first reaches the most devices at the lowest cost; revisit once the web maturity curve is complete. The platform-independent core (principle 6) keeps the option open.
- **Officiated tournament rules enforcement** — the app assists and flags, but is not an authoritative referee that overrides players. *Reason:* automation assists, humans decide.
- **Every niche expansion and fan variant** — only the major expansions are targeted. *Reason:* correctness and catalog discipline over exhaustive coverage; unsupported pieces degrade to manual entry.
- **Silent / fully-automatic scoring with no review step** — never. *Reason:* computed results are always reviewable (principle 4).
- **Guessing when recognition is uncertain** — the app must not fabricate a result to appear smart. *Reason:* trust; fail loudly and fall back to manual (principle 5).

---

## 9. Success criteria

The project succeeds when all of the following are true:

1. **No hand tallying.** A group finishes a game and trusts the final scoreboard without anyone adding up points manually. *(G1)*
2. **Seconds to a reviewable score.** At any point in play, pointing a camera at the board yields a correct, reviewable score within seconds. *(G2)*
3. **Never lost, always offline.** The running score survives reloads/crashes/sleep and works with no network. *(G3)*
4. **Always reviewable.** Every automated result passes through a human review-and-correct step before becoming official. *(G4)*
5. **Honest failure.** Unrecognised pieces/layouts produce a clear message and a manual fallback, never a silent guess. *(G5)*
6. **Coverage that holds up.** Supported player counts, meeple colours, and major expansions score correctly per the official rules. *(G6)*
7. **One catalog, three consumers.** Scoring, validation, and recognition all draw from the single tile catalog with no divergence.
8. **Reusable core, installable first.** The scoring/board logic is platform-independent and the first release is an installable, offline-capable web app.

### Phased acceptance (maps to the maturity curve)

| Phase | "Done" looks like |
|-------|-------------------|
| Scorepad | A full game can be tracked and finalised manually, offline, with no lost state. |
| Feature scoring | A completed structure or selected region can be photographed and scored, reviewed, and applied. |
| Final scoring | A finished board can be photographed and produce a complete, reviewable end-game tally including farmers. |
| Validation | Illegal configurations are detected and clearly reported for human judgement. |

---

## Maintenance

This is the root document: changes cascade into every future queue, so they go through `/aide-create-vision` (interactive) and a reviewed change — see `.aide/README.md` → Merge policy.
