/**
 * Typed errors for the session module.
 */

/**
 * Thrown when session construction, event append, or (de)serialization
 * (Item 019) produces invalid state.
 *
 * `"malformed-input"` and `"version-mismatch"` are raised by
 * `deserializeSession` (see `./serialize.ts`), mirroring
 * `BoardStateError`'s `"malformed-input"` kind for the board module.
 */
export class SessionError extends Error {
  readonly kind:
    | "player-count"
    | "duplicate-player-id"
    | "duplicate-colour"
    | "unknown-player"
    | "malformed-input"
    | "version-mismatch";

  constructor(
    kind:
      | "player-count"
      | "duplicate-player-id"
      | "duplicate-colour"
      | "unknown-player"
      | "malformed-input"
      | "version-mismatch",
    message: string,
  ) {
    super(message);
    this.name = "SessionError";
    this.kind = kind;
  }
}
