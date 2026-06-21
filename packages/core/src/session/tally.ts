/**
 * Pure tally reducer for GameSession.
 */

import type { GameSession } from "./types.js";

/**
 * Computes each player's running total from the session's event log.
 *
 * Every player in `session.players` is present in the result — players with
 * no events get `0` — so the scoreboard (Item 016) can render all players
 * without defaulting. Events referencing a playerId not present in
 * `session.players` are ignored (such events should be unreachable in
 * practice since `addScoreEvent` rejects them).
 */
export function computeTotals(session: GameSession): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const player of session.players) {
    totals[player.id] = 0;
  }

  for (const event of session.events) {
    if (event.playerId in totals) {
      totals[event.playerId] = (totals[event.playerId] ?? 0) + event.delta;
    }
  }

  return totals;
}
