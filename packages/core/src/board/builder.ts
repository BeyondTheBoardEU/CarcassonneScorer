/**
 * Fluent builder for hand-authoring BoardState values in tests and tools.
 *
 * Structural guards enforced here (not game-rules checks):
 *   1. Two tiles cannot share the same grid position (duplicate-position).
 *   2. A meeple's position must have a placed tile (meeple-missing-tile).
 *
 * Game-rule legality (edge matching, legal meeple placement by feature type,
 * adjacency) is explicitly out of scope — that belongs to the Stage 9
 * validation engine.
 */

import { BoardStateError } from "./errors.js";
import type { BoardState, MeepleKind, Position, Rotation, TilePlacement } from "./types.js";

/** Current schema version written by the builder and checked by deserialize. */
export const BOARD_STATE_VERSION = 1;

/** Serialises a Position into a unique string key for set/map lookups. */
function posKey(p: Position): string {
  return `${p.x},${p.y}`;
}

/** Fluent builder returned by `createBoard()`. */
export interface BoardBuilder {
  /**
   * Places a tile on the board.
   *
   * @throws {BoardStateError} kind "duplicate-position" if another tile
   *   already occupies `position`.
   */
  placeTile(tileId: string, position: Position, rotation: Rotation): BoardBuilder;

  /**
   * Places a meeple on the board.
   *
   * @throws {BoardStateError} kind "meeple-missing-tile" if no tile has been
   *   placed at `position`.
   */
  placeMeeple(
    playerId: string,
    position: Position,
    segmentId: string,
    kind?: MeepleKind,
  ): BoardBuilder;

  /** Finalises and returns the immutable BoardState snapshot. */
  build(): BoardState;
}

/**
 * Creates a fresh, empty board builder.
 *
 * @example
 * const state = createBoard()
 *   .placeTile("CARCF", { x: 0, y: 0 }, 0)
 *   .placeTile("CARC-ROAD", { x: 1, y: 0 }, 90)
 *   .placeMeeple("alice", { x: 0, y: 0 }, "city-0")
 *   .build();
 */
export function createBoard(): BoardBuilder {
  const tiles: TilePlacement[] = [];
  const occupiedPositions = new Set<string>();

  // Re-use the same builder object (fluent pattern).
  const builder: BoardBuilder = {
    placeTile(tileId, position, rotation) {
      const key = posKey(position);
      if (occupiedPositions.has(key)) {
        throw new BoardStateError(
          "duplicate-position",
          `A tile already exists at position (${position.x}, ${position.y}).`,
        );
      }
      occupiedPositions.add(key);
      tiles.push({ tileId, position, rotation });
      return builder;
    },

    placeMeeple(playerId, position, segmentId, kind = "follower") {
      const key = posKey(position);
      if (!occupiedPositions.has(key)) {
        throw new BoardStateError(
          "meeple-missing-tile",
          `Cannot place meeple at (${position.x}, ${position.y}): no tile present.`,
        );
      }
      // Meeples are accumulated lazily — we capture via closure over an array.
      // We push into the same array that build() will read.
      (builder as InternalBuilder)._meeples.push({ playerId, position, segmentId, kind });
      return builder;
    },

    build() {
      return {
        version: BOARD_STATE_VERSION,
        tiles: [...tiles],
        meeples: [...(builder as InternalBuilder)._meeples],
      };
    },
  };

  // Internal storage for meeples — not part of the public interface.
  (builder as InternalBuilder)._meeples = [];

  return builder;
}

/** Internal augmentation of the builder for meeple storage. */
interface InternalBuilder extends BoardBuilder {
  _meeples: {
    playerId: string;
    position: Position;
    segmentId: string;
    kind: MeepleKind;
  }[];
}
