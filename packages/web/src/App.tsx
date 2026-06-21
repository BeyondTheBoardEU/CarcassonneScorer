import { useState } from "react";
import { CORE_READY, coreVersion, SessionError } from "@carcassonne/core";
import type { GameSession, Player } from "@carcassonne/core";
import { GameProvider, useGame } from "./state/index.js";

/**
 * Minimal placeholder setup view (Item 014 shell only).
 *
 * Replaced by Item 015's real setup form (player names/colours, validation
 * UI). This placeholder proves the store wiring: it starts a fixed-roster
 * game so the shell can route to the play view, and surfaces a
 * `SessionError` from an invalid `startGame` call (instead of crashing) via
 * local error state.
 */
function SetupView(): JSX.Element {
  const { startGame } = useGame();
  const [error, setError] = useState<string | null>(null);

  function handleStart(players: readonly Player[]): void {
    try {
      startGame(players);
      setError(null);
    } catch (err) {
      setError(err instanceof SessionError ? err.message : "Could not start game.");
    }
  }

  return (
    <section data-testid="setup-view">
      <h2>Set up a new game</h2>
      <p>Placeholder — replaced by Item 015 (real setup form).</p>
      {error && <p data-testid="setup-error">{error}</p>}
      <button
        type="button"
        data-testid="start-demo-game"
        onClick={() =>
          handleStart([
            { id: "p1", name: "Player 1", colourId: "red" },
            { id: "p2", name: "Player 2", colourId: "blue" },
          ])
        }
      >
        Start demo game
      </button>
      <button
        type="button"
        data-testid="start-invalid-game"
        onClick={() => handleStart([{ id: "p1", name: "Player 1", colourId: "red" }])}
      >
        Start invalid game (1 player)
      </button>
    </section>
  );
}

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
 * Shell that routes between the setup and play placeholders purely based
 * on store state (`session === null` vs. a `GameSession`). No router
 * dependency is needed for two views (Item 014).
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
 * Item 014 adds the app's state container (`GameProvider`/`useGame`) and
 * routes between a setup placeholder (no game) and a play placeholder (game
 * in progress) — both replaced by the real Stage 2 UI (Items 015-018).
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
