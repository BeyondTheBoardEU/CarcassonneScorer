/**
 * @carcassonne/core — platform-independent scoring engine entry point.
 *
 * This module must never import DOM or Node-only APIs. The tsconfig for this
 * package enforces that boundary: lib is restricted to ES2022 (no "DOM") and
 * @types/node is not installed. Referencing `document` or `process` here
 * causes a tsc error.
 */

/** True once the core module has loaded. Imported by the smoke test. */
export const CORE_READY = true as const;

/** Returns the package version string from the package.json. */
export function coreVersion(): string {
  return "0.0.0";
}

// ---------------------------------------------------------------------------
// Board-state model (Item 002)
// ---------------------------------------------------------------------------
export type {
  BoardState,
  BoardBuilder,
  Direction,
  MeepleKind,
  MeeplePlacement,
  Position,
  Rotation,
  TilePlacement,
} from "./board/index.js";
export {
  BoardStateError,
  BOARD_STATE_VERSION,
  createBoard,
  serializeBoard,
  deserializeBoard,
  neighbor,
} from "./board/index.js";

// ---------------------------------------------------------------------------
// Tile catalog (Item 003)
// ---------------------------------------------------------------------------
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
} from "./catalog/index.js";
export {
  CatalogError,
  loadCatalog,
  rotateHalfEdge,
  rotateSide,
  sampleTiles,
  baseGameTiles,
  baseGameCatalog,
  checkCatalogConsistency,
  assertCatalogConsistent,
} from "./catalog/index.js";
export type { CatalogIssue, ConsistencyIssueCode } from "./catalog/index.js";

// ---------------------------------------------------------------------------
// Feature extraction (Item 006)
// ---------------------------------------------------------------------------
export type { Feature, FeatureMeeple, FeatureSegmentRef, FeatureType } from "./features/index.js";
export { extractFeatures } from "./features/index.js";

// ---------------------------------------------------------------------------
// Meeple ownership / majority-tie resolution (Item 007)
// ---------------------------------------------------------------------------
export type { OwnershipResult } from "./scoring/index.js";
export { resolveOwnership, resolveFeatureOwnership } from "./scoring/index.js";

// ---------------------------------------------------------------------------
// City and road incremental scoring (Item 008)
// ---------------------------------------------------------------------------
export type { FeatureScore } from "./scoring/index.js";
export { scoreCity, scoreRoad, scoreCompletedCityRoadFeatures } from "./scoring/index.js";

// ---------------------------------------------------------------------------
// Monastery scoring and engine assembly (Item 009)
// ---------------------------------------------------------------------------
export type { BoardScore } from "./scoring/index.js";
export { scoreMonastery, scoreCompletedFeatures, scoreBoard } from "./scoring/index.js";

// ---------------------------------------------------------------------------
// Scorepad session model and tally reducer (Item 012)
// ---------------------------------------------------------------------------
export type { GameSession, Player, ScoreEvent } from "./session/index.js";
export {
  SessionError,
  SESSION_VERSION,
  MIN_PLAYERS,
  MAX_PLAYERS,
  createSession,
  addScoreEvent,
  computeTotals,
} from "./session/index.js";

// ---------------------------------------------------------------------------
// Standard meeple colour set (Item 013)
// ---------------------------------------------------------------------------
export type { MeepleColour } from "./colours/index.js";
export {
  MeepleColourError,
  meepleColours,
  getMeepleColour,
  hasMeepleColour,
  meepleColourIds,
} from "./colours/index.js";
