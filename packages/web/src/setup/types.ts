/**
 * Local draft shape for an in-progress setup form row (Item 015).
 *
 * Distinct from the core's `Player` ({ id, name, colourId }): the name here
 * is the raw (untrimmed, possibly empty) text the user has typed so far —
 * trimming and the "Player N" fallback only happen once, at submit time,
 * when this draft is turned into a `Player[]` for `startGame`.
 */
export interface PlayerDraft {
  /** Stable id, generated once per row; reused as the resulting `Player.id`. */
  readonly id: string;
  readonly name: string;
  readonly colourId: string;
}
