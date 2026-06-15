/**
 * Tile catalog types — the single authoritative schema for Carcassonne tiles.
 *
 * A tile is modeled as a set of segments (city, road, field, monastery). The
 * catalog describes every tile in its canonical (unrotated) orientation. When
 * a tile is placed on the board its `Rotation` (from the board module) maps
 * canonical sides/half-edges to actual board directions.
 *
 * This module has NO imports from the board module — types that overlap
 * (Side/Direction) are re-declared here as aliases to avoid a circular
 * dependency. Only the loader/rotate helpers import `Rotation` from the board.
 */

/** Feature type of a segment. */
export type SegmentType = "city" | "road" | "field" | "monastery";

/**
 * The four tile sides in canonical (unrotated) orientation.
 * Matches `Direction` from the board module (N/E/S/W).
 */
export type Side = "N" | "E" | "S" | "W";

/**
 * Each side is split into two half-edges (8 total per tile) reading clockwise.
 * Used by field segments to express which portions of the tile boundary they
 * occupy. A road along the N side, for example, divides that side so that
 * "NW" belongs to the left field and "NE" to the right field.
 *
 * Naming convention: the first letter is the side, the second letter is the
 * adjacent side you reach when travelling clockwise.
 *   N side: NW (north-west corner) → NE (north-east corner)
 *   E side: EN → ES
 *   S side: SE → SW
 *   W side: WS → WN
 */
export type HalfEdge = "NW" | "NE" | "EN" | "ES" | "SE" | "SW" | "WS" | "WN";

// ---------------------------------------------------------------------------
// Segment shapes
// ---------------------------------------------------------------------------

/** A city segment occupying one or more tile sides. */
export interface CitySegment {
  readonly id: string;
  readonly type: "city";
  /** Sides (in canonical orientation) covered by this city. */
  readonly sides: readonly Side[];
  /** True if the city carries a pennant (bonus point). */
  readonly pennant?: boolean;
  /** Whether a knight meeple may be placed here. */
  readonly meepleable: boolean;
}

/** A road segment connecting tile sides (or ending at a city/monastery). */
export interface RoadSegment {
  readonly id: string;
  readonly type: "road";
  /**
   * Sides the road passes through (1 = dead end; 2 = straight or curve).
   * A crossroads tile may have multiple road segments, each with 1 side.
   */
  readonly sides: readonly Side[];
  /** Whether a robber meeple may be placed here. */
  readonly meepleable: boolean;
}

/**
 * A field segment occupying the non-city/road portions of tile sides.
 * Fields are defined by half-edges so they can be connected across tiles even
 * when a road splits a side between two fields.
 */
export interface FieldSegment {
  readonly id: string;
  readonly type: "field";
  /** Half-edges (in canonical orientation) belonging to this field. */
  readonly halfEdges: readonly HalfEdge[];
  /** Local ids of city segments this field borders (for farmer scoring). */
  readonly adjacentCities: readonly string[];
  /** Whether a farmer meeple may be placed here. */
  readonly meepleable: boolean;
}

/**
 * A monastery segment (interior feature, no sides/half-edges).
 * A tile may have at most one monastery.
 */
export interface MonasterySegment {
  readonly id: string;
  readonly type: "monastery";
  /** Whether a monk meeple may be placed here. */
  readonly meepleable: boolean;
}

/** Union of all segment shapes. */
export type Segment = CitySegment | RoadSegment | FieldSegment | MonasterySegment;

// ---------------------------------------------------------------------------
// Tile definition
// ---------------------------------------------------------------------------

/**
 * A single tile definition in canonical orientation.
 *
 * `id` is the unique tile-type identifier (e.g. `"ROAD-STRAIGHT"`).
 * `count` is optional: how many copies appear in the base game deck (unused by
 * the catalog itself but useful for Item 004 / deck management).
 */
export interface TileDefinition {
  readonly id: string;
  readonly segments: readonly Segment[];
  /** Optional: number of copies in the game box. */
  readonly count?: number;
}

// ---------------------------------------------------------------------------
// Catalog interface
// ---------------------------------------------------------------------------

/** Read-only indexed view of a validated tile collection. */
export interface Catalog {
  /** Returns the tile definition for `id`, throwing `CatalogError` if absent. */
  getTile(id: string): TileDefinition;
  /** True if `id` is present in the catalog. */
  has(id: string): boolean;
  /** All tile definitions in insertion order. */
  all(): TileDefinition[];
}
