/**
 * Board-state module barrel.
 *
 * Re-exports all public types, helpers, the fluent builder, and
 * serialization utilities from the board submodule. Import from
 * `@carcassonne/core` (which re-exports this in turn).
 */

export type {
  BoardState,
  Direction,
  MeepleKind,
  MeeplePlacement,
  Position,
  Rotation,
  TilePlacement,
} from "./types.js";
export { BoardStateError } from "./errors.js";
export { BOARD_STATE_VERSION, createBoard } from "./builder.js";
export type { BoardBuilder } from "./builder.js";
export { serializeBoard, deserializeBoard } from "./serialize.js";
export { neighbor } from "./geometry.js";
