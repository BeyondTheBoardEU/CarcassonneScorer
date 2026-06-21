import { useContext } from "react";
import { GameContext } from "./context.js";
import type { GameApi } from "./types.js";

/**
 * Reads the game store API supplied by `GameProvider` (Item 014).
 *
 * @throws {Error} if called outside a `GameProvider` — every consumer of
 *   the store (setup/scoreboard/entry/log views) must render under one.
 */
export function useGame(): GameApi {
  const api = useContext(GameContext);
  if (!api) {
    throw new Error("useGame() must be used within a <GameProvider>.");
  }
  return api;
}
