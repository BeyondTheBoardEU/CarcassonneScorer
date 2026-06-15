/**
 * Catalog loader — validates and indexes tile definitions.
 *
 * `loadCatalog` is the single entry point for constructing a `Catalog`. It
 * performs all structural validation before returning, so callers can trust
 * that every `TileDefinition` in the returned catalog is internally consistent.
 *
 * Validations performed:
 *  1. No duplicate tile ids across the supplied array.
 *  2. Within each tile: no duplicate segment ids.
 *  3. Every segment has a known `type`.
 *  4. No half-edge is assigned to more than one field segment within a tile.
 *  5. Every id in a field's `adjacentCities` refers to an actual city segment
 *     in the same tile.
 *
 * Throws `CatalogError` for any violation.
 */

import { CatalogError } from "./errors.js";
import type { Catalog, FieldSegment, Segment, TileDefinition } from "./types.js";

const VALID_TYPES = new Set<string>(["city", "road", "field", "monastery"]);

/**
 * Validates `tiles` and returns an indexed, read-only `Catalog`.
 *
 * @throws {CatalogError} if any tile or segment is malformed.
 */
export function loadCatalog(tiles: readonly TileDefinition[]): Catalog {
  // Pass 1: check for duplicate tile ids.
  const tileMap = new Map<string, TileDefinition>();
  for (const tile of tiles) {
    if (tileMap.has(tile.id)) {
      throw new CatalogError("duplicate-tile-id", `Duplicate tile id: "${tile.id}"`);
    }
    validateTile(tile);
    tileMap.set(tile.id, tile);
  }

  // Snapshot the insertion order for `all()`.
  const ordered: TileDefinition[] = [...tiles];

  return {
    getTile(id: string): TileDefinition {
      const tile = tileMap.get(id);
      if (tile === undefined) {
        throw new CatalogError("unknown-tile-id", `Unknown tile id: "${id}"`);
      }
      return tile;
    },

    has(id: string): boolean {
      return tileMap.has(id);
    },

    all(): TileDefinition[] {
      return ordered.slice();
    },
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function validateTile(tile: TileDefinition): void {
  const segmentIds = new Set<string>();
  const cityIds = new Set<string>();
  const usedHalfEdges = new Set<string>();

  // Collect city ids first so adjacentCities can reference them.
  for (const seg of tile.segments) {
    if (seg.type === "city") {
      cityIds.add(seg.id);
    }
  }

  for (const seg of tile.segments) {
    // 2. Duplicate segment id within this tile.
    if (segmentIds.has(seg.id)) {
      throw new CatalogError(
        "duplicate-segment-id",
        `Tile "${tile.id}" has duplicate segment id: "${seg.id}"`,
      );
    }
    segmentIds.add(seg.id);

    // 3. Unknown segment type.
    if (!VALID_TYPES.has(seg.type)) {
      throw new CatalogError(
        "unknown-segment-type",
        `Tile "${tile.id}" segment "${seg.id}" has unknown type: "${(seg as Segment).type}"`,
      );
    }

    if (seg.type === "field") {
      validateFieldSegment(tile.id, seg, cityIds, usedHalfEdges);
    }
  }
}

function validateFieldSegment(
  tileId: string,
  seg: FieldSegment,
  cityIds: Set<string>,
  usedHalfEdges: Set<string>,
): void {
  // 4. No half-edge assigned to two field segments.
  for (const he of seg.halfEdges) {
    if (usedHalfEdges.has(he)) {
      throw new CatalogError(
        "duplicate-half-edge",
        `Tile "${tileId}" half-edge "${he}" is assigned to more than one field segment`,
      );
    }
    usedHalfEdges.add(he);
  }

  // 5. adjacentCities must reference existing city segments.
  for (const cityRef of seg.adjacentCities) {
    if (!cityIds.has(cityRef)) {
      throw new CatalogError(
        "unknown-adjacent-city",
        `Tile "${tileId}" field "${seg.id}" references unknown city segment: "${cityRef}"`,
      );
    }
  }
}
