import type { GameSession } from "@carcassonne/core";

/**
 * Reducer for the app's game state (Item 014).
 *
 * The reducer itself never calls the core's `createSession`/`addScoreEvent`
 * — it only swaps in a `GameSession` the action already carries. This is
 * deliberate: React requires reducers to be pure and, in practice, runs
 * them during the render phase, where a thrown error aborts rendering as
 * an uncaught exception rather than surfacing as a normal exception at the
 * `dispatch()` call site. To let callers (e.g. a setup form) catch a
 * `SessionError` with an ordinary `try { startGame(...) } catch {}`,
 * `useGame` calls `createSession`/`addScoreEvent` itself *before*
 * dispatching, and only dispatches once the core call has already
 * succeeded. The reducer is left with no scoring/tally arithmetic and no
 * core calls of its own — pure state assignment.
 */

export interface GameState {
  readonly session: GameSession | null;
}

export type GameAction = { type: "setSession"; session: GameSession } | { type: "newGame" };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "setSession":
      return { session: action.session };
    case "newGame":
      return { session: null };
    default:
      return state;
  }
}

export function createInitialState(initialSession: GameSession | null = null): GameState {
  return { session: initialSession };
}
