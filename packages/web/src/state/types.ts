import type { GameSession, Player } from "@carcassonne/core";

/**
 * Public API exposed by `useGame()` (Item 014).
 *
 * `totals` is always produced by the core's `computeTotals(session)` — it
 * is empty (`{}`) when no game is in progress. `startGame`/`addScore` never
 * compute or sum scores themselves; they delegate to the core's
 * `createSession`/`addScoreEvent` and only supply the impure bits
 * (`id`/`timestamp`) those pure functions deliberately leave to the caller.
 */
export interface GameApi {
  readonly session: GameSession | null;
  readonly totals: Record<string, number>;
  startGame(players: readonly Player[]): void;
  addScore(playerId: string, delta: number, reason?: string): void;
  newGame(): void;
}
