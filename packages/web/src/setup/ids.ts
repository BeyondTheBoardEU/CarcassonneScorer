/**
 * Stable player-id generation for the setup form (Item 015).
 *
 * Kept in its own (non-component) module so `react-refresh/only-export-
 * components` stays happy for `SetupView.tsx` (mirrors the `GameContext`
 * split in `state/context.ts`). Mirrors `GameProvider`'s `generateEventId`:
 * prefer `crypto.randomUUID()` when available, otherwise a reasonably
 * unique fallback.
 */
export function generatePlayerId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
