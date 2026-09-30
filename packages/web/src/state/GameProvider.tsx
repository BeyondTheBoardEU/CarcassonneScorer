import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { addScoreEvent, computeTotals, createSession } from "@carcassonne/core";
import type { GameSession, Player } from "@carcassonne/core";
import { createLocalSessionStorage } from "../persistence/index.js";
import type { SessionStorage } from "../persistence/index.js";
import { GameContext } from "./context.js";
import { createInitialState, gameReducer } from "./reducer.js";
import type { GameApi } from "./types.js";

/**
 * Default storage (Item 019): the real `localStorage`-backed implementation
 * under the fixed key. Tests inject a fake via the `storage` prop instead
 * of touching this default.
 */
const defaultStorage = createLocalSessionStorage();

/** Generates a reasonably unique event id at the store's impure boundary. */
function generateEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `event-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface GameProviderProps {
  /**
   * Hydrate seam (Item 014 + Item 019 + tests): when supplied, the provider
   * starts already in-game with this session instead of the default
   * "no game" state. Defaults to `null` (setup view). Item 019 wires this
   * from `storage.load()` at the `App` root so a saved session is restored
   * on startup; tests pass a literal `GameSession` directly.
   */
  initialSession?: GameSession | null;
  /**
   * Persistence backend (Item 019). Defaults to the real
   * `localStorage`-backed `SessionStorage`; tests inject a fake to assert
   * save/clear behaviour without touching real browser storage. This is the
   * single place the store touches persistence — `save` on every session
   * change, `clear` on `newGame`.
   */
  storage?: SessionStorage;
  children: ReactNode;
}

/**
 * Supplies the app's single source of game state (Item 014) via React
 * Context + `useReducer` — no external state-management library. Wrap the
 * app shell in this once; descendants read it with `useGame()`.
 */
export function GameProvider(props: GameProviderProps): JSX.Element {
  const { initialSession = null, storage = defaultStorage, children } = props;
  const [state, dispatch] = useReducer(gameReducer, createInitialState(initialSession));

  // Persist on change (Item 019): save whenever a session exists, clear
  // when it becomes null (newGame). Runs after every render where
  // `state.session` changed — including the initial render, which is a
  // harmless no-op re-save when hydrated from storage.load(). The initial
  // mount is skipped for the `null` branch specifically: `state.session`
  // starts `null` whenever nothing was restored, and clearing storage then
  // would be a no-op at best — but it would also needlessly race the
  // startup hydrate path if a save lands between `storage.load()` (in
  // `App`) and this effect's first run. `newGame` (a later transition to
  // `null`) still clears, keeping AC7 intact.
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (state.session) {
        storage.save(state.session);
      }
      return;
    }
    if (state.session) {
      storage.save(state.session);
    } else {
      storage.clear();
    }
  }, [state.session, storage]);

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
      if (!Number.isFinite(delta)) {
        // A non-finite delta (e.g. from an extreme pasted number the
        // score-entry field's integer regex still accepts, such as a
        // 400-digit string that `Number.parseInt` rounds to `Infinity`)
        // must never reach `addScoreEvent`/storage: `JSON.stringify` would
        // silently turn `NaN`/`Infinity` into `null`, and
        // `deserializeSession` would then reject the whole persisted
        // session on the next load. Ignored rather than thrown, mirroring
        // the no-session guard above — this is bad input, not a
        // recoverable game action.
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
