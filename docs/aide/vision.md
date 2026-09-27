# Carcassonne Scorer — Vision

> **Status:** Draft v1 · **Last updated:** 2026-06-14
> **Document role:** Step 1 of the AIDE workflow. This is the source of truth for scope. Roadmap, progress, queue, and work items all derive from it. Changes to scope happen here first (via the feedback loop), then propagate.

---

## 1. Project Overview

**Carcassonne Scorer** takes the bookkeeping out of scoring the physical board game *Carcassonne* so players can focus on playing.

Carcassonne is a tile-laying game in which players build a shared landscape of cities, roads, monasteries, and fields, and place "meeples" to claim those features for points. Scoring happens in two ways: incrementally, as features are completed during play, and in a final tally at the end of the game that includes the notoriously fiddly farmer (field) scoring. With expansions added, the rules multiply and the end-game count becomes slow, error-prone, and a frequent source of disputes.

This product is **not** a digital version of the game. The game is still played on a physical table with real tiles and meeples. Carcassonne Scorer is the *scorekeeper* that sits alongside the physical game: it removes the arithmetic, the rules lookups, and the manual tallying, and — as it matures — it can look at the physical board through a camera and compute the score directly.

The product is designed to grow along a clear maturity curve:

1. **A fast, reliable digital scorepad** — replace pen and paper for tracking scores during play.
2. **A photo-based feature scorer** — point the camera at a completed structure (or a region you select) mid-game and get its score.
3. **A photo-based final scorer** — photograph the finished board and get the complete end-of-game tally, including farmers, automatically.
4. **A board validator** — detect illegal tile placements and configurations and surface them for review.

Throughout, a single principle holds: **automation assists, humans decide.** Any computed result is always presented for human review and correction. The product never silently asserts authority over the score.

---

## 2. Goals & Objectives

The following are the measurable outcomes that define whether the product is working.

| # | Objective | Measure of success |
|---|-----------|--------------------|
| G1 | Eliminate manual tallying | A group can finish a game and trust the final scoreboard without anyone adding up points by hand. |
| G2 | Fast, correct scoring from a photo | At any point during play, point a camera at the board and receive a correct, reviewable score in seconds. |
| G3 | Never lose the running score | The in-progress score survives app closure, device sleep, page reload, and loss of network connectivity. |
| G4 | Trustworthy automation | Every automatically computed score is shown for human review before it is committed; no auto-computed value is treated as final without a human confirming it. |
| G5 | Graceful degradation | When a piece or layout cannot be recognised, the app says so clearly and falls back to manual entry rather than guessing. |
| G6 | Broad coverage | Support every common player count and meeple colour, and the major expansions, with correct scoring rules for each. |

**Primary success statement:** *A group can finish a game and trust the scoreboard without anyone tallying by hand — and at any point during play, point a camera at the board and get a correct, reviewable score in seconds.*

---

## 3. Target Users

The core audience is **people playing physical Carcassonne at a table.** The product must serve the full range of that audience:

- **Casual base-game players** — two friends or a family playing the base game. They need a frictionless scorepad and nothing more in their way.
- **Enthusiast / expansion-heavy groups** — up to **six players**, multiple expansions in play, contested features, and complex end-game farmer scoring. This is the group that suffers most from manual scoring and gains the most from automation.
- **Mixed groups mid-spectrum** — base game plus one or two popular expansions.

Common characteristics across all users:

- They are physically together at a table; the app is a companion, not the play surface.
- At least one player operates the app (the "scorekeeper"), though the design should not prevent others from glancing at or interacting with it.
- They want the score to be *correct* and *settled* — reducing disputes is a real value, not a nicety.
- They may have intermittent or no internet at the table (kitchen tables, game cafés, trains, holidays). **Offline operation is a requirement, not a bonus.**

**Out-of-audience (for now):** remote/online players who want to play the game itself digitally, and tournament organisers needing officiated rules enforcement. See [Out of Scope](#8-out-of-scope).

---

## 4. Core Features

Features are grouped by the maturity curve in the overview. Earlier groups are foundational; later groups build on them.

### 4.1 Manual Digital Scorepad (foundation)

- **Game setup:** choose player count (2–6), assign each player a name and a meeple colour from the set of standard colours.
- **Manual score entry:** add or adjust points for any player at any time, with a clear log of scoring events so a mistake can be traced and corrected.
- **Running scoreboard:** always-visible current totals per player.
- **Persistent, offline-first state:** the running score is never lost. It persists locally across reloads and app restarts and works with no network connection.
- **Review & correction:** every score change is reviewable and reversible; nothing is hidden or final until the game ends.
- **End-game tally support:** assist the final scoring step (the part players most dislike), including farmer/field scoring, even when entered manually.

### 4.2 Photo-Based Feature Scoring (mid-game)

- **Score a completed structure from a photo:** photograph a finished city, road, or monastery and have its score computed.
- **Score a user-selected region:** let the user indicate a region of the board (e.g. draw or tap to select) and score just that region, for cases where automatic feature detection is ambiguous or the user wants control.
- **Reviewable result:** the computed score, the recognised feature, and which meeples/players it credits are all shown for confirmation before being applied to the scoreboard.
- **Clear failure:** if the photo cannot be interpreted, the app states this plainly and offers manual entry for that feature.

### 4.3 Photo-Based Final Scoring (end of game)

- **Full-board final score from a photo:** photograph the finished board and compute the complete end-of-game tally automatically, including incomplete cities/roads, monasteries, and **farmer/field scoring** across the whole board.
- **Per-player breakdown:** show how the final total is composed so players can verify it.
- **Always reviewable:** the entire computed final score is presented for human review and correction before it becomes the official result.

### 4.4 Board Validation

- **Illegal configuration detection:** check the board (from a photo or recognised state) for illegal tile placements and configurations and flag them.
- **Clear reporting:** explain *what* appears wrong and *where*, so players can decide whether it is a genuine rules violation or a recognition error.

### 4.5 Coverage & Catalog

- **Player counts:** all common counts up to six players.
- **Meeple colours:** all standard meeple colours.
- **Expansions:** the major/common expansions, with their scoring and placement rules.
- **Single tile catalog:** one authoritative catalog of tiles and pieces drives **scoring, validation, and image recognition** alike — they are never allowed to diverge. (See [Technical Architecture](#5-technical-architecture).)

### 4.6 Trust & Failure Behaviour (cross-cutting)

- **Human-in-the-loop by default:** any automatically computed result is shown for review and correction and is never silently authoritative.
- **Fail loudly, degrade gracefully:** unsupported pieces or unrecognised layouts produce a clear message and a manual-entry fallback — never a silent guess.

---

## 5. Technical Architecture

> **Note on commitment level:** This section records *strategic direction and architectural principles*, not a locked technology stack. Specific library and framework choices are deferred to the roadmap and plan stages. What is committed here is the *shape* of the system and the principles it must honour.

### 5.1 Architectural Principles (committed)

1. **The spec is the source of truth.** Behaviour is defined in specification before implementation; code conforms to spec.
2. **A single tile catalog drives everything.** One catalog of tiles and pieces is the shared input to the scoring engine, the validation engine, and the image-recognition layer. There is exactly one definition of what a tile is and how it behaves.
3. **The running score is never lost and works offline.** Persistence and offline operation are first-class architectural constraints, not features bolted on later.
4. **Automation is always reviewable.** The architecture must keep computed results in a "proposed" state until a human confirms them; there is a clear boundary between *computed* and *committed* score.
5. **Unsupported input fails loudly and degrades to manual entry.** The recognition and scoring layers must be able to report "I don't know" and hand off to manual entry.
6. **Scoring and board logic are platform-independent.** The core scoring, validation, and catalog logic is kept free of UI and platform dependencies so it can be reused unchanged across web and native targets.

### 5.2 Strategic Delivery Direction

- **Ship as an installable web app first.** The initial deliverable is a web application that can be installed (PWA-style) and works offline, reaching the broadest set of devices at the lowest friction.
- **Native mobile apps later.** Native apps follow, primarily to enable robust **offline, on-device** scoring and camera/recognition performance.
- **Reuse the core everywhere.** Because scoring and board logic are platform-independent (principle 6), they are written once and reused across the web app and the later native apps.

### 5.3 Logical Components

| Component | Responsibility |
|-----------|----------------|
| **Tile catalog** | Single authoritative definition of tiles, pieces, and expansions. Consumed by all other components. |
| **Scoring engine** | Computes scores (incremental and final, including farmers) from board state. Platform-independent. |
| **Validation engine** | Detects illegal placements/configurations from board state. Platform-independent. |
| **Recognition layer** | Turns a photo (full board or selected region) into board state, or reports that it cannot. |
| **Score state & persistence** | Holds the running score and game state; guarantees durability and offline availability; separates *proposed* from *committed* results. |
| **UI / presentation** | Setup, manual entry, scoreboard, photo capture, region selection, and the review-and-correct flows. Platform-specific; thin over the core. |

### 5.4 Data Flow (high level)

```
Physical board ──(camera)──▶ Recognition layer ──▶ Board state
                                                      │
                            Tile catalog ────────────┤
                                                      ▼
                                   Scoring engine ─▶ Proposed score ─▶ Human review ─▶ Committed score
                                   Validation engine ─▶ Flagged issues ─▶ Human review
```

Manual entry feeds **Board state / Committed score** directly, bypassing the recognition layer, and is always available as a fallback.

---

## 6. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Reliability / durability** | The running score must survive reloads, crashes, device sleep, and network loss. No game's score is ever lost. |
| **Offline** | Full scorepad functionality must work with no network connection. On-device recognition is a goal for the native phase. |
| **Performance** | Manual interactions feel instant. Photo-based scoring returns a reviewable result "in seconds." |
| **Correctness** | Scoring must implement the official rules correctly for supported player counts and expansions; correctness outranks coverage. |
| **Trust / transparency** | Computed results are explainable enough to be verified (per-player and per-feature breakdowns). Nothing is silently authoritative. |
| **Graceful degradation** | Recognition or scoring uncertainty is surfaced clearly and always has a manual fallback. |
| **Usability** | Usable at a table by one scorekeeper without a manual; setup is quick; the scoreboard is readable at a glance. |
| **Accessibility** | Readable typography, sufficient contrast, and colour choices that remain distinguishable for colour-blind users (meeple-colour selection must not rely on colour alone). |
| **Portability** | Core logic runs unchanged across web and native targets. |
| **Privacy** | Photos of the board and game data stay on-device by default; no account or upload is required to score a game. |

---

## 7. Constraints & Assumptions

### 7.1 Constraints

- **Companion, not the game.** The product never replaces the physical tiles/meeples; it scores a game played on a real table.
- **Single catalog discipline.** Scoring, validation, and recognition must all be driven by the one tile catalog; divergence is prohibited.
- **Human-in-the-loop discipline.** No automated result may be committed without a path for human review and correction.
- **Offline-first.** Network must never be a prerequisite for scoring a game.
- **Player count ceiling.** Up to six players; standard meeple colours.
- **Spec-first process.** Implementation follows specification (AIDE workflow).

### 7.2 Assumptions

- Players have a device with a camera (phone or tablet) at the table for the photo-based phases.
- Lighting and board access are good enough for a usable photo in the recognition phases; where they are not, manual entry covers the gap.
- "Major expansions" refers to the commonly played, widely owned expansions; the exact supported set is defined in the roadmap and the tile catalog, and unsupported pieces fail loudly.
- The web platform's storage and offline capabilities are sufficient for durable, offline score persistence in the first phase.
- One person typically drives the app per game (the scorekeeper), though shared/glanceable use is welcome.

---

## 8. Out of Scope

Explicitly excluded from this project, with reasons:

- **Playing Carcassonne digitally.** This is a *scorer*, not a game implementation. There is no digital board, no AI opponents, no tile drawing/turn engine. *Reason:* the value is in removing bookkeeping from physical play, not replacing it.
- **Online / remote multiplayer.** No networked play between players in different locations. *Reason:* the audience is people physically at one table.
- **Accounts, cloud sync, and social features.** No mandatory login, no leaderboards, no cloud game history in the initial vision. *Reason:* offline-first and privacy; avoid friction and scope creep. (May be revisited later.)
- **Officiated tournament rules enforcement.** The app assists and flags, but is not an authoritative referee that overrides players. *Reason:* automation assists, humans decide.
- **Every niche expansion and fan variant.** Only the major expansions are targeted; obscure or fan-made content is out. *Reason:* correctness and catalog discipline over exhaustive coverage; unsupported pieces degrade to manual entry.
- **Silent / fully-automatic scoring with no review step.** Never. *Reason:* a core guiding principle — computed results are always reviewable.
- **Guessing when recognition is uncertain.** The app must not fabricate a result to appear smart. *Reason:* trust; fail loudly and fall back to manual.
- **Locking to a specific tech stack in this document.** Concrete stack choices are deferred to roadmap/plan. *Reason:* the vision commits to direction and principles, not implementation.

---

## 9. Success Criteria

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

## Guiding principles

These are the non-negotiable principles that govern every decision below the vision level (the validator checks every implementation against them; §5.1 elaborates each, and adds the committed principle that scoring and board logic stay platform-independent):

1. **The spec is the source of truth.**
2. **A single tile catalog drives scoring, validation, and image recognition alike.**
3. **The running score is never lost and works offline.**
4. **Any automatically computed result is always shown for human review and correction — never treated as silently authoritative.**
5. **Unsupported pieces fail loudly and degrade gracefully to manual entry.**

## Appendix B — Strategic Direction (verbatim intent)

*Not a commitment to a tech stack.* Ship as an installable web app first; native mobile apps later for offline on-device scoring; keep the scoring and board logic platform-independent so it is reused everywhere.

---

## Maintenance

This is the root document: changes here cascade into every future queue, so they go through `/aide-create-vision` (interactive) and a reviewed change — see `.aide/README.md` → Merge policy.
