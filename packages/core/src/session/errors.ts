/**
 * Typed errors for the session module.
 */

/** Thrown when session construction or event append produces invalid state. */
export class SessionError extends Error {
  readonly kind: "player-count" | "duplicate-player-id" | "duplicate-colour" | "unknown-player";

  constructor(
    kind: "player-count" | "duplicate-player-id" | "duplicate-colour" | "unknown-player",
    message: string,
  ) {
    super(message);
    this.name = "SessionError";
    this.kind = kind;
  }
}
