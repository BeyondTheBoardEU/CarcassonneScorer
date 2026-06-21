import { useCallback, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { addScoreEvent, computeTotals, createSession } from "@carcassonne/core";
import type { GameSession, Player } from "@carcassonne/core";
import { GameContext } from "./context.js";
import { createInitialState, gameReducer } from "./reducer.js";
import type { GameApi } from "./types.js";

/** Generates a reasonably unique event id at the store's impure boundary. */
function generateEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `event-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface GameProviderProps {
  /**
   * Hydrate seam (Item 019 + tests): when supplied, the provider starts
   * already in-game with this session instead of the default "no game"
   * state. Defaults to `null` (setup view).
   */
  initialSession?: GameSession | null;
  children: ReactNode;
}

/**
 * Supplies the app's single source of game state (Item 014) via React
 * Context + `useReducer` — no external state-management library. Wrap the
 * app shell in this once; descendants read it with `useGame()`.
 */
export function GameProvider(props: GameProviderProps): JSX.Element {
  const { initialSession = null, children } = props;
  const [state, dispatch] = useReducer(gameReducer, createInitialState(initialSession));

  const totals = useMemo<Record<string, number>>(
    () => (state.session ? computeTotals(state.session) : {}),
    [state.session],
  );

  const startGame = useCallback((players: readonly Player[]): void => {
    // createSession runs here, outside the reducer, so a SessionError
    // (e.g. invalid player count) throws synchronously from this call and
    // can be caught by an ordinary try/catch around startGame(...) — a
    // throw from inside the reducer itself would instead abort React's
    // render phase as an uncaught error. Nothing is dispatched on failure.
    const session = createSession(players);
    dispatch({ type: "setSession", session });
  }, []);

  const addScore = useCallback(
    (playerId: string, delta: number, reason?: string): void => {
      if (!state.session) {
        // No game in progress — nothing to score against. Ignored rather
        // than thrown since this is a programmer error, not a user error.
        return;
      }
      const session = addScoreEvent(state.session, {
        playerId,
        delta,
        timestamp: Date.now(),
        id: generateEventId(),
        ...(reason !== undefined ? { reason } : {}),
      });
      dispatch({ type: "setSession", session });
    },
    [state.session],
  );

  const newGame = useCallback((): void => {
    dispatch({ type: "newGame" });
  }, []);

  const api = useMemo<GameApi>(
    () => ({ session: state.session, totals, startGame, addScore, newGame }),
    [state.session, totals, startGame, addScore, newGame],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}
