/**
 * Typed error for the tile catalog module.
 */

/** Thrown when `loadCatalog` detects a malformed tile definition. */
export class CatalogError extends Error {
  readonly kind:
    | "duplicate-tile-id"
    | "duplicate-segment-id"
    | "unknown-segment-type"
    | "duplicate-half-edge"
    | "unknown-adjacent-city"
    | "unknown-tile-id";

  constructor(kind: CatalogError["kind"], message: string) {
    super(message);
    this.name = "CatalogError";
    this.kind = kind;
  }
}
