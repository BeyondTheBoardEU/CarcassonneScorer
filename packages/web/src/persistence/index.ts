/**
 * Persistence module barrel (Item 019).
 *
 * Re-exports the `SessionStorage` interface and the `localStorage`-backed
 * implementation so `App.tsx`/`main.tsx` and tests import from a single
 * path.
 */

export type { SessionStorage } from "./sessionStorage.js";
export { createLocalSessionStorage, DEFAULT_SESSION_STORAGE_KEY } from "./sessionStorage.js";
