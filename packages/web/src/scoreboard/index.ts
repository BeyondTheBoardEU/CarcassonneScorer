/**
 * Scoreboard module barrel (Item 016).
 *
 * Re-exports the `Scoreboard` (and its `PlayerScoreRow` building block) so
 * `App.tsx` and tests import from a single path, mirroring the
 * `setup/index.ts` / `state/index.ts` convention.
 */
export { Scoreboard } from "./Scoreboard.js";
export { PlayerScoreRow } from "./PlayerScoreRow.js";
export type { PlayerScoreRowProps } from "./PlayerScoreRow.js";
