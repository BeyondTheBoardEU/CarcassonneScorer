/**
 * Accessor helpers for the standard meeple colour set.
 *
 * Mirrors the tile catalog's `getTile`/`has` convention (Item 003): lookups
 * throw a typed error for an unknown id rather than returning `undefined`,
 * so callers can rely on the result being a well-formed `MeepleColour`.
 */

import { meepleColours } from "./data.js";
import { MeepleColourError } from "./errors.js";
import type { MeepleColour } from "./types.js";

const colourMap: ReadonlyMap<string, MeepleColour> = new Map(
  meepleColours.map((colour) => [colour.id, colour]),
);

/**
 * Returns the meeple colour entry for `id`.
 *
 * @throws {MeepleColourError} if `id` is not a known meeple colour.
 */
export function getMeepleColour(id: string): MeepleColour {
  const colour = colourMap.get(id);
  if (colour === undefined) {
    throw new MeepleColourError("unknown-colour-id", `Unknown meeple colour id: "${id}"`);
  }
  return colour;
}

/** True if `id` is a known meeple colour. */
export function hasMeepleColour(id: string): boolean {
  return colourMap.has(id);
}

/** All meeple colour ids, in the standard order. */
export const meepleColourIds: readonly string[] = meepleColours.map((colour) => colour.id);
