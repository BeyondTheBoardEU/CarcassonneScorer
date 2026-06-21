/**
 * Setup module barrel (Item 015).
 *
 * Re-exports the `SetupView` so `App.tsx` and tests import from a single
 * path, mirroring the `state/index.ts` convention.
 */
export { SetupView } from "./SetupView.js";
