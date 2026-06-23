/**
 * Event-log module barrel (Item 018).
 *
 * Re-exports the `EventLog` (and its `EventLogRow` building block) so
 * `App.tsx` and tests import from a single path, mirroring the
 * `scoreboard/index.ts` / `score-entry/index.ts` convention.
 */
export { EventLog } from "./EventLog.js";
export { EventLogRow } from "./EventLogRow.js";
export type { EventLogRowProps } from "./EventLogRow.js";
