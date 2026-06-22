import { CORE_READY, coreVersion } from "@carcassonne/core";
import type { GameSession } from "@carcassonne/core";
import { GameProvider, useGame } from "./state/index.js";
import { SetupView } from "./setup/index.js";
import { Scoreboard } from "./scoreboard/index.js";

/**
 * The in-game (play) view: the always-visible scoreboard (Item 016) plus a
 * temporary score-entry/new-game stand-in until Items 017/018 land.
 *
 * `totals-list`/`total-${id}` are kept (duplicating what the `Scoreboard`
 * now shows) purely so existing routing assertions (`App.test.tsx`,
 * predating this item) keep working without being rewritten here; the
 * `Scoreboard` itself is the real, spec-mandated display and reads
 * `totals` from the same `useGame()` store — no totals are computed here.
 */
function PlayView(): JSX.Element {
  const { session, totals, addScore, newGame } = useGame();

  if (!session) {
    // Unreachable when rendered by App's routing below; narrows the type.
    return <></>;
  }

  return (
    <section data-testid="play-view">
      <h2>Game in progress</h2>
      <Scoreboard />
      <p>Score entry (Item 017) and the event log (Item 018) are not yet built.</p>
      <ul data-testid="totals-list">
        {session.players.map((player) => (
          <li key={player.id} data-testid={`total-${player.id}`}>
            {player.name}: {totals[player.id] ?? 0}
          </li>
        ))}
      </ul>
      {session.players.map((player) => (
        <button
          key={player.id}
          type="button"
          onClick={() => addScore(player.id, 1)}
          data-testid={`add-score-${player.id}`}
        >
          +1 to {player.name}
        </button>
      ))}
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
  /** Hydrate seam for tests/persistence (Item 019): see `GameProvider`. */
  initialSession?: GameSession | null;
}

/**
 * App — the root component of the Carcassonne Scorer web shell.
 *
 * Item 011 proved the UI -> core wiring via `CORE_READY`/`coreVersion()`.
 * Item 014 added the app's state container (`GameProvider`/`useGame`) and
 * routing between setup and play. Item 015 replaces the setup placeholder
 * with the real game setup form (`SetupView`); Item 016 replaces the play
 * view's scoreboard placeholder with the real `Scoreboard`. Score entry
 * (Item 017) and the event log (Item 018) remain placeholders.
 */
export function App(props: AppProps = {}): JSX.Element {
  return (
    <GameProvider initialSession={props.initialSession ?? null}>
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
