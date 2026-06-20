/**
 * Scoring module barrel.
 *
 * Re-exports all public types and functions. Import from `@carcassonne/core`
 * (which re-exports this).
 */

export type { OwnershipResult } from "./ownership.js";
export { resolveOwnership, resolveFeatureOwnership } from "./ownership.js";

export type { FeatureScore } from "./feature-score.js";
export { scoreCity, scoreRoad, scoreCompletedCityRoadFeatures } from "./feature-score.js";

export { scoreMonastery } from "./monastery.js";

export type { BoardScore } from "./engine.js";
export { scoreCompletedFeatures, scoreBoard } from "./engine.js";
