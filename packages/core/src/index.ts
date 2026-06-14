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
