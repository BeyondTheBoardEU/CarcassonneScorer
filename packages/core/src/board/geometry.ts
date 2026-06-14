/**
 * Platform-independent geometry helpers for the Carcassonne grid.
 *
 * The grid follows standard mathematical conventions:
 *   N (+y), S (−y), E (+x), W (−x).
 */

import type { Direction, Position } from "./types.js";

/**
 * Returns the grid position adjacent to `position` in the given `direction`.
 *
 * @example
 * neighbor({ x: 0, y: 0 }, "N") // => { x: 0, y: 1 }
 * neighbor({ x: 0, y: 0 }, "E") // => { x: 1, y: 0 }
 * neighbor({ x: 0, y: 0 }, "S") // => { x: 0, y: -1 }
 * neighbor({ x: 0, y: 0 }, "W") // => { x: -1, y: 0 }
 */
export function neighbor(position: Position, direction: Direction): Position {
  switch (direction) {
    case "N":
      return { x: position.x, y: position.y + 1 };
    case "E":
      return { x: position.x + 1, y: position.y };
    case "S":
      return { x: position.x, y: position.y - 1 };
    case "W":
      return { x: position.x - 1, y: position.y };
  }
}
