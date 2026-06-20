/**
 * Scoring module barrel.
 *
 * Re-exports all public types and functions. Import from `@carcassonne/core`
 * (which re-exports this).
 */

export type { OwnershipResult } from "./ownership.js";
export { resolveOwnership, resolveFeatureOwnership } from "./ownership.js";
