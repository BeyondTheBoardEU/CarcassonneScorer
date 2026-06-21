/**
 * Meeple colour module barrel.
 *
 * Re-exports the public type, the standard colour data, the typed error, and
 * the accessor helpers. Import from `@carcassonne/core` (which re-exports
 * this in turn).
 */

// Types
export type { MeepleColour } from "./types.js";

// Error
export { MeepleColourError } from "./errors.js";

// Data
export { meepleColours } from "./data.js";

// Accessor
export { getMeepleColour, hasMeepleColour, meepleColourIds } from "./accessor.js";
