/**
 * State module barrel (Item 014).
 *
 * Re-exports the `GameProvider`, `useGame()` hook, and the reducer types so
 * downstream UI items (015-019) and `App.tsx` import from a single path.
 */

export { GameProvider } from "./GameProvider.js";
export type { GameProviderProps } from "./GameProvider.js";
export { useGame } from "./useGame.js";
export type { GameApi } from "./types.js";
export { gameReducer, createInitialState } from "./reducer.js";
export type { GameState, GameAction } from "./reducer.js";
