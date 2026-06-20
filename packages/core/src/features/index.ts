/**
 * Feature-extraction module barrel.
 *
 * Re-exports all public types and the `extractFeatures` entry point. Import
 * from `@carcassonne/core` (which re-exports this).
 */

export type { Feature, FeatureMeeple, FeatureSegmentRef, FeatureType } from "./types.js";
export { extractFeatures } from "./extract.js";
