/**
 * Local-storage-backed persistence for the in-progress GameSession
 * (Item 019 — local persistence, first cut).
 *
 * `SessionStorage` is a tiny interface so the store wiring can be tested
 * against a fake and so a future Stage 3 cut can swap the backing store
 * (e.g. IndexedDB) without touching the store wiring.
 *
 * `createLocalSessionStorage` is the `localStorage`-backed implementation:
 *   - `save` writes `serializeSession(session)` under a fixed key.
 *   - `load` NEVER throws to the app. Absent/blank storage, corrupt JSON,
 *     and a version-mismatched payload all resolve to `null` (a clean
 *     start); a bad value is also cleared so it cannot poison the next load.
 *   - `localStorage` access is guarded defensively: a missing/inaccessible
 *     `localStorage` (no browser global, storage disabled, quota errors,
 *     etc.) degrades to "no game" rather than crashing startup.
 */

import { deserializeSession, serializeSession } from "@carcassonne/core";
import type { GameSession } from "@carcassonne/core";

/** Fixed storage key for the single in-progress session (first cut: one session, one key). */
export const DEFAULT_SESSION_STORAGE_KEY = "carcassonne.session.v1";

/**
 * Storage abstraction for the in-progress session. Implementations must
 * never throw `load()` to the caller — corrupt/absent/incompatible data is
 * reported as `null`.
 */
export interface SessionStorage {
  /** Returns the restored session, or `null` if absent/blank/corrupt/version-mismatched. */
  load(): GameSession | null;
  /** Persists `session` under the storage's key. */
  save(session: GameSession): void;
  /** Removes the persisted session, if any. */
  clear(): void;
}

/** Returns the browser's `localStorage`, or `undefined` if it is unavailable. */
function getLocalStorage(): Storage | undefined {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      return undefined;
    }
    return globalThis.localStorage;
  } catch {
    // Accessing `localStorage` itself can throw (e.g. disabled storage in
    // some browser privacy modes) — treat as unavailable.
    return undefined;
  }
}

/**
 * Creates a `SessionStorage` backed by the browser's `localStorage` under
 * `key` (defaults to `DEFAULT_SESSION_STORAGE_KEY`).
 */
export function createLocalSessionStorage(
  key: string = DEFAULT_SESSION_STORAGE_KEY,
): SessionStorage {
  return {
    load(): GameSession | null {
      const storage = getLocalStorage();
      if (!storage) {
        return null;
      }

      let raw: string | null;
      try {
        raw = storage.getItem(key);
      } catch {
        return null;
      }

      if (raw === null || raw.trim() === "") {
        return null;
      }

      try {
        return deserializeSession(raw);
      } catch {
        // Corrupt JSON or version-mismatched payload: treat as no game,
        // and clear the bad value so it can't poison a future load.
        try {
          storage.removeItem(key);
        } catch {
          // Best-effort cleanup; nothing more we can do here.
        }
        return null;
      }
    },

    save(session: GameSession): void {
      const storage = getLocalStorage();
      if (!storage) {
        return;
      }
      try {
        storage.setItem(key, serializeSession(session));
      } catch {
        // Quota exceeded or storage disabled mid-session: first-cut
        // persistence is best-effort, never throws to the app.
      }
    },

    clear(): void {
      const storage = getLocalStorage();
      if (!storage) {
        return;
      }
      try {
        storage.removeItem(key);
      } catch {
        // Best-effort; nothing more we can do here.
      }
    },
  };
}
