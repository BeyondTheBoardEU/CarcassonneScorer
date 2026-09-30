/**
 * Session module barrel.
 *
 * Re-exports all public types, the session constructors, the tally reducer,
 * and the typed error from the session submodule. Import from
 * `@carcassonne/core` (which re-exports this in turn).
 */

export type { GameSession, Player, ScoreEvent } from "./types.js";
export { SessionError } from "./errors.js";
export {
  SESSION_VERSION,
  MIN_PLAYERS,
  MAX_PLAYERS,
  createSession,
  addScoreEvent,
} from "./session.js";
export { computeTotals } from "./tally.js";
export { serializeSession, deserializeSession } from "./serialize.js";
