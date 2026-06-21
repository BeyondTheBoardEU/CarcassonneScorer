/**
 * Manual-scorepad session types.
 *
 * All types are plain, JSON-serializable objects. No classes with stored
 * behaviour, no Map/Set/Date in the serialized form — timestamps are
 * epoch-ms numbers.
 *
 * This module deliberately does NOT import the tile catalog, board, or
 * scoreBoard modules (items 002-010). Manual point entry is independent of
 * board-derived scoring; players are referenced by opaque playerId and
 * colours by opaque colourId (the Item 013 colour set is not validated here).
 */

/** A participant in a scorepad session. */
export interface Player {
  readonly id: string;
  readonly name: string;
  /** Opaque reference to the Item 013 colour set; not validated here. */
  readonly colourId: string;
}

/**
 * A single manual score adjustment for one player.
 *
 * `delta` is the signed point change (negative deltas are valid corrections).
 * `timestamp` is an epoch-ms number — never a `Date` — to keep the stored
 * shape JSON-serializable.
 */
export interface ScoreEvent {
  readonly id: string;
  readonly playerId: string;
  readonly delta: number;
  readonly timestamp: number;
  readonly reason?: string;
}

/**
 * The complete manual-scorepad session: players plus an append-ordered
 * event log, suitable for JSON persistence (Item 019).
 *
 * `version` is a schema version integer for forward-compatible
 * deserialization.
 */
export interface GameSession {
  readonly version: number;
  readonly players: readonly Player[];
  readonly events: readonly ScoreEvent[];
}
