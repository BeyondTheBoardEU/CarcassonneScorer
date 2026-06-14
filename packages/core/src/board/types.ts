/**
 * Board-state types.
 *
 * All types are plain, JSON-serializable objects. No classes with stored
 * behaviour, no Map/Set/Date in the serialized form.
 *
 * The board module deliberately does NOT import the tile catalog (items
 * 003/004). Tiles are referenced by opaque tileId; meeple features by opaque
 * segmentId; players by playerId.
 */

/** Valid orientations for a placed tile (clockwise degrees). */
export type Rotation = 0 | 90 | 180 | 270;

/** Integer grid coordinate. */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/** A tile placed on the board. */
export interface TilePlacement {
  /** Opaque reference to the catalog tile (e.g. "CARCF"). */
  readonly tileId: string;
  readonly position: Position;
  readonly rotation: Rotation;
}

/**
 * The kind of a meeple token. Base game uses "follower"; extensions can add
 * further kinds without a schema change.
 */
export type MeepleKind = "follower" | (string & {});

/** A meeple token placed on the board. */
export interface MeeplePlacement {
  /** Opaque reference to a player (e.g. a UUID or colour name). */
  readonly playerId: string;
  /** Grid position — must match an existing TilePlacement.position. */
  readonly position: Position;
  /** Opaque feature-segment identifier local to the tile's catalog entry. */
  readonly segmentId: string;
  readonly kind: MeepleKind;
}

/**
 * The complete board state: a flat snapshot suitable for JSON persistence.
 *
 * `version` is a schema version integer that `deserializeBoard` uses to detect
 * forward-incompatible data.
 */
export interface BoardState {
  readonly version: number;
  readonly tiles: readonly TilePlacement[];
  readonly meeples: readonly MeeplePlacement[];
}

/** Cardinal directions used by the geometry helper `neighbor`. */
export type Direction = "N" | "E" | "S" | "W";
