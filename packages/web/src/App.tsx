import { CORE_READY, coreVersion } from "@carcassonne/core";
import type { GameSession } from "@carcassonne/core";
import { GameProvider, useGame } from "./state/index.js";
import { SetupView } from "./setup/index.js";

/**
 * Minimal placeholder play view (Item 014 shell only).
 *
 * Replaced by Items 016 (scoreboard), 017 (score entry), and 018 (log),
 * which will compose inside this view. This placeholder only proves that
 * `totals` is derived from the core (`computeTotals`, via `useGame`) and
 * that `addScore`/`newGame` round-trip through the store.
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
      <p>Placeholder — replaced by Items 016/017/018 (scoreboard, entry, log).</p>
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
 * placeholder purely based on store state (`session === null` vs. a
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
 * with the real game setup form (`SetupView`); the play view remains a
 * placeholder until Items 016-018.
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
