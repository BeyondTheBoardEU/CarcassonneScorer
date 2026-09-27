import { CORE_READY, coreVersion } from "@carcassonne/core";
import type { GameSession } from "@carcassonne/core";
import { GameProvider, useGame } from "./state/index.js";
import { SetupView } from "./setup/index.js";
import { Scoreboard } from "./scoreboard/index.js";
import { ScoreEntry } from "./score-entry/index.js";
import { EventLog } from "./event-log/index.js";
import { createLocalSessionStorage } from "./persistence/index.js";
import type { SessionStorage } from "./persistence/index.js";

/**
 * Default storage (Item 019): the real `localStorage`-backed
 * implementation, shared by `App`'s startup hydrate and the `GameProvider`
 * it constructs, so both sides of persistence agree on the same backend.
 * Tests supply their own `storage` prop instead of touching this default.
 */
const defaultStorage = createLocalSessionStorage();

/**
 * The in-game (play) view: the always-visible scoreboard (Item 016), manual
 * score entry (Item 017), and the read-only score event log (Item 018).
 *
 * The Item 014 scratch placeholder (`totals-list` + `add-score-*` buttons)
 * is retired here: the `Scoreboard` is the single, real totals display,
 * `ScoreEntry` is the single, real way to add/adjust points, and `EventLog`
 * is the single, real traceable record of every change — all three read
 * from / dispatch through the same `useGame()` store, so no totals are
 * computed in this component.
 */
function PlayView(): JSX.Element {
  const { session, newGame } = useGame();

  if (!session) {
    // Unreachable when rendered by App's routing below; narrows the type.
    return <></>;
  }

  return (
    <section data-testid="play-view">
      <h2>Game in progress</h2>
      <Scoreboard />
      <ScoreEntry />
      <EventLog />
      <button type="button" onClick={newGame} data-testid="new-game">
        New game
      </button>
    </section>
  );
}

/**
 * Shell that routes between the real setup view (Item 015) and the play
 * view purely based on store state (`session === null` vs. a
 * `GameSession`). No router dependency is needed for two views (Item 014).
 */
function GameShell(): JSX.Element {
  const { session } = useGame();
  return session ? <PlayView /> : <SetupView />;
}

export interface AppProps {
  /**
   * Hydrate seam for tests (Item 014/019): when supplied, overrides the
   * startup hydrate read from `storage` below. Defaults to undefined, in
   * which case `App` reads `storage.load()` itself (the real Item 019
   * restore path).
   */
  initialSession?: GameSession | null;
  /**
   * Persistence backend (Item 019). Defaults to the real
   * `localStorage`-backed `SessionStorage`. Tests inject a fake (or a
   * pre-seeded real one backed by jsdom's `localStorage`) to drive the
   * restore flow without depending on a literal `initialSession`.
   */
  storage?: SessionStorage;
}

/**
 * App — the root component of the Carcassonne Scorer web shell.
 *
 * Item 011 proved the UI -> core wiring via `CORE_READY`/`coreVersion()`.
 * Item 014 added the app's state container (`GameProvider`/`useGame`) and
 * routing between setup and play. Item 015 replaces the setup placeholder
 * with the real game setup form (`SetupView`); Item 016 replaces the play
 * view's scoreboard placeholder with the real `Scoreboard`; Item 017 adds
 * the real `ScoreEntry`, retiring the last Item 014 scratch placeholder.
 * Item 018 adds the read-only `EventLog`. Item 019 adds local persistence:
 * `App` reads `storage.load()` once for the startup hydrate (unless a
 * literal `initialSession` override is supplied) and passes the same
 * `storage` into `GameProvider`, which saves on every session change and
 * clears on `newGame` — the only place persistence touches the store.
 */
export function App(props: AppProps = {}): JSX.Element {
  const storage = props.storage ?? defaultStorage;
  const initialSession = props.initialSession !== undefined ? props.initialSession : storage.load();

  return (
    <GameProvider initialSession={initialSession} storage={storage}>
      <main>
        <h1>Carcassonne Scorer</h1>
        <p data-testid="core-status">
          Core ready: {CORE_READY ? "yes" : "no"} (v{coreVersion()})
        </p>
        <GameShell />
      </main>
    </GameProvider>
  );
}

export default App;
