/**
 * Catalog module barrel.
 *
 * Re-exports all public types, the loader, rotation helpers, sample data, and
 * the typed error. Import from `@carcassonne/core` (which re-exports this).
 */

// Types
export type {
  Catalog,
  CitySegment,
  FieldSegment,
  HalfEdge,
  MonasterySegment,
  RoadSegment,
  Segment,
  SegmentType,
  Side,
  TileDefinition,
} from "./types.js";

// Error
export { CatalogError } from "./errors.js";

// Loader
export { loadCatalog } from "./loader.js";

// Rotation helpers
export { rotateHalfEdge, rotateSide } from "./rotate.js";

// Sample data
export { sampleTiles } from "./data/index.js";
