/**
 * Score-entry module barrel (Item 017).
 *
 * Re-exports the `ScoreEntry` (and its `PlayerEntryRow` building block) so
 * `App.tsx` and tests import from a single path, mirroring the
 * `scoreboard/index.ts` / `setup/index.ts` convention.
 */
export { ScoreEntry } from "./ScoreEntry.js";
export { PlayerEntryRow } from "./PlayerEntryRow.js";
export type { PlayerEntryRowProps } from "./PlayerEntryRow.js";
