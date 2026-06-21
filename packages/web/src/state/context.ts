import { createContext } from "react";
import type { GameApi } from "./types.js";

/**
 * Context object lives in its own (non-component) module so
 * `GameProvider.tsx` only exports the component (keeps Fast Refresh /
 * react-refresh lint happy) while `useGame.ts` can still read the context.
 */
export const GameContext = createContext<GameApi | null>(null);
