/**
 * Meeple colour types — the single authoritative schema for the standard
 * Carcassonne meeple colour set.
 *
 * Each colour carries a `value` (the swatch colour, for sighted users) and a
 * `pattern` (a non-colour distinguisher token). The `pattern` exists so that
 * colour is never the *only* signal distinguishing two players — the
 * accessibility NFR ("meeple-colour selection must not rely on colour
 * alone"). The UI layer (Items 015/016) is responsible for rendering the
 * `pattern` as a visible cue (e.g. a hatch/dot overlay or a short label).
 */

/** A single entry in the standard meeple colour set. */
export interface MeepleColour {
  /** Stable token, e.g. `"red"`. Matches `Player.colourId` (Item 012). */
  readonly id: string;
  /** Display name, e.g. `"Red"`. */
  readonly name: string;
  /** Swatch colour, e.g. `"#d22"` (hex). Never the sole distinguisher. */
  readonly value: string;
  /**
   * Non-colour distinguisher token, e.g. `"solid"` / `"stripes"` / `"dots"`.
   * Distinct across every entry in the set so any two colours remain
   * distinguishable without relying on hue.
   */
  readonly pattern: string;
}
