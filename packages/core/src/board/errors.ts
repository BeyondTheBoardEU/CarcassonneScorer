/**
 * Typed errors for the board-state module.
 */

/** Thrown when board construction or deserialization produces invalid state. */
export class BoardStateError extends Error {
  readonly kind: "duplicate-position" | "meeple-missing-tile" | "malformed-input";

  constructor(
    kind: "duplicate-position" | "meeple-missing-tile" | "malformed-input",
    message: string,
  ) {
    super(message);
    this.name = "BoardStateError";
    this.kind = kind;
  }
}
