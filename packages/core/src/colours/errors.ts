/**
 * Typed error for the meeple colour module.
 */

/** Thrown when a meeple colour id is looked up but not present in the set. */
export class MeepleColourError extends Error {
  readonly kind: "unknown-colour-id";

  constructor(kind: MeepleColourError["kind"], message: string) {
    super(message);
    this.name = "MeepleColourError";
    this.kind = kind;
  }
}
