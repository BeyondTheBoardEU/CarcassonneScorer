/**
 * Catalog-consistency checker — post-load semantic invariants.
 *
 * `checkCatalogConsistency` verifies the deeper geometric and semantic
 * invariants that `loadCatalog` does not check.  It operates on an already-
 * loaded `Catalog` (so structural faults like duplicate ids or unknown adjacent
 * cities cannot be present) and returns a flat list of issues — **it never
 * throws on a malformed catalog**.
 *
 * See Item 005 spec for the six invariant classes and their codes.
 *
 * This module has NO imports from the board module (no cyclic dependency).
 */

import type {
  Catalog,
  CitySegment,
  FieldSegment,
  HalfEdge,
  RoadSegment,
  Segment,
  Side,
  TileDefinition,
} from "./types.js";

// ---------------------------------------------------------------------------
// Issue types
// ---------------------------------------------------------------------------

/**
 * String-literal union of all issue codes.  Mirrors the `CatalogError.kind`
 * style — serialisation-friendly, exhaustively checkable with switch.
 */
export type ConsistencyIssueCode =
  | "empty-tile"
  | "side-conflict"
  | "half-edge-uncovered"
  | "half-edge-on-city-side"
  | "pennant-on-non-city"
  | "adjacent-city-invalid"
  | "malformed-segment";

/** A single consistency violation found by `checkCatalogConsistency`. */
export interface CatalogIssue {
  /** Tile where the violation was found. */
  readonly tileId: string;
  /** Segment where the violation was found (if applicable). */
  readonly segmentId?: string;
  /** Machine-readable violation code. */
  readonly code: ConsistencyIssueCode;
  /** Human-readable description of the violation. */
  readonly message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All valid `Side` values. */
const VALID_SIDES = new Set<string>(["N", "E", "S", "W"]);

/** All valid `HalfEdge` values. */
const VALID_HALF_EDGES = new Set<string>(["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"]);

/** The four canonical sides in order. */
const ALL_SIDES: readonly Side[] = ["N", "E", "S", "W"];

/**
 * Map from a `Side` to its two half-edges (canonical clockwise order).
 * N side: NW, NE
 * E side: EN, ES
 * S side: SE, SW
 * W side: WS, WN
 */
const SIDE_HALF_EDGES: Record<Side, readonly HalfEdge[]> = {
  N: ["NW", "NE"],
  E: ["EN", "ES"],
  S: ["SE", "SW"],
  W: ["WS", "WN"],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Checks `catalog` for semantic invariant violations and returns all issues
 * found.  Returns `[]` for a fully consistent catalog.
 *
 * The checker is pure — it never throws and has no side-effects.  Issues are
 * reported with `tileId`, optional `segmentId`, a machine-readable `code`, and
 * a `message`.
 *
 * @param catalog A catalog already validated by `loadCatalog`.
 */
export function checkCatalogConsistency(catalog: Catalog): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  for (const tile of catalog.all()) {
    checkTile(tile, issues);
  }
  return issues;
}

/**
 * Asserts `catalog` is fully consistent, throwing an `Error` with a summary
 * of all violations if any are found.
 *
 * @throws {Error} when one or more invariants are violated.
 */
export function assertCatalogConsistent(catalog: Catalog): void {
  const issues = checkCatalogConsistency(catalog);
  if (issues.length > 0) {
    const summary = issues
      .map((i) => `  [${i.code}] ${i.tileId}${i.segmentId ? `/${i.segmentId}` : ""}: ${i.message}`)
      .join("\n");
    throw new Error(`Catalog consistency violations (${issues.length}):\n${summary}`);
  }
}

// ---------------------------------------------------------------------------
// Per-tile checking
// ---------------------------------------------------------------------------

function checkTile(tile: TileDefinition, issues: CatalogIssue[]): void {
  const { id, segments } = tile;

  // Invariant 1: Non-empty tile.
  if (segments.length === 0) {
    issues.push({
      tileId: id,
      code: "empty-tile",
      message: `Tile "${id}" has no segments.`,
    });
    // No further geometric checks are meaningful on an empty tile.
    return;
  }

  // Partition segments by type.
  const citySegs: CitySegment[] = [];
  const roadSegs: RoadSegment[] = [];
  const fieldSegs: FieldSegment[] = [];

  for (const seg of segments) {
    if (seg.type === "city") {
      citySegs.push(seg as CitySegment);
    } else if (seg.type === "road") {
      roadSegs.push(seg as RoadSegment);
    } else if (seg.type === "field") {
      fieldSegs.push(seg as FieldSegment);
    }
    // monastery: no geometric properties to validate.
  }

  // Invariant 4: Pennant placement — only city segments may carry a pennant.
  checkPennantPlacement(id, segments, issues);

  // Invariant 6: Malformed segments — sides/halfEdges non-empty and valid.
  checkSegmentWellFormedness(id, citySegs, roadSegs, fieldSegs, issues);

  // Invariant 2: Side exclusivity — each side used by at most one city or road.
  checkSideExclusivity(id, citySegs, roadSegs, issues);

  // Determine city sides (used by invariant 3).
  const citySides = new Set<Side>();
  for (const seg of citySegs) {
    for (const s of seg.sides) {
      if (VALID_SIDES.has(s)) {
        citySides.add(s as Side);
      }
    }
  }

  // Invariant 3: Half-edge completeness.
  checkHalfEdgeCompleteness(id, citySides, fieldSegs, issues);

  // Collect city ids for invariant 5.
  const cityIds = new Set<string>(citySegs.map((s) => s.id));

  // Invariant 5: adjacentCities validity (re-reported here for standalone use).
  checkAdjacentCities(id, fieldSegs, cityIds, issues);
}

// ---------------------------------------------------------------------------
// Invariant 4: Pennant placement
// ---------------------------------------------------------------------------

function checkPennantPlacement(
  tileId: string,
  segments: readonly Segment[],
  issues: CatalogIssue[],
): void {
  for (const seg of segments) {
    if (seg.type === "city") continue; // city may carry a pennant
    // Access `pennant` via cast — non-city types don't declare it, but data
    // can carry it incorrectly.
    const pennant = (seg as unknown as Record<string, unknown>)["pennant"];
    if (pennant) {
      issues.push({
        tileId,
        segmentId: seg.id,
        code: "pennant-on-non-city",
        message: `Tile "${tileId}" ${seg.type} segment "${seg.id}" has a truthy pennant; only city segments may carry pennants.`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Invariant 6: Segment well-formedness
// ---------------------------------------------------------------------------

function checkSegmentWellFormedness(
  tileId: string,
  citySegs: CitySegment[],
  roadSegs: RoadSegment[],
  fieldSegs: FieldSegment[],
  issues: CatalogIssue[],
): void {
  for (const seg of citySegs) {
    if (seg.sides.length === 0) {
      issues.push({
        tileId,
        segmentId: seg.id,
        code: "malformed-segment",
        message: `Tile "${tileId}" city segment "${seg.id}" has no sides.`,
      });
    } else {
      for (const s of seg.sides) {
        if (!VALID_SIDES.has(s)) {
          issues.push({
            tileId,
            segmentId: seg.id,
            code: "malformed-segment",
            message: `Tile "${tileId}" city segment "${seg.id}" references invalid side "${s}".`,
          });
        }
      }
    }
  }

  for (const seg of roadSegs) {
    if (seg.sides.length === 0) {
      issues.push({
        tileId,
        segmentId: seg.id,
        code: "malformed-segment",
        message: `Tile "${tileId}" road segment "${seg.id}" has no sides.`,
      });
    } else {
      for (const s of seg.sides) {
        if (!VALID_SIDES.has(s)) {
          issues.push({
            tileId,
            segmentId: seg.id,
            code: "malformed-segment",
            message: `Tile "${tileId}" road segment "${seg.id}" references invalid side "${s}".`,
          });
        }
      }
    }
  }

  for (const seg of fieldSegs) {
    if (seg.halfEdges.length === 0) {
      issues.push({
        tileId,
        segmentId: seg.id,
        code: "malformed-segment",
        message: `Tile "${tileId}" field segment "${seg.id}" has no halfEdges.`,
      });
    } else {
      for (const he of seg.halfEdges) {
        if (!VALID_HALF_EDGES.has(he)) {
          issues.push({
            tileId,
            segmentId: seg.id,
            code: "malformed-segment",
            message: `Tile "${tileId}" field segment "${seg.id}" references invalid half-edge "${he}".`,
          });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Invariant 2: Side exclusivity
// ---------------------------------------------------------------------------

function checkSideExclusivity(
  tileId: string,
  citySegs: CitySegment[],
  roadSegs: RoadSegment[],
  issues: CatalogIssue[],
): void {
  // Map each side to the id of the first segment that claimed it.
  const sideOwner = new Map<string, string>();

  for (const seg of [...citySegs, ...roadSegs]) {
    for (const s of seg.sides) {
      if (!VALID_SIDES.has(s)) continue; // already reported as malformed
      const existing = sideOwner.get(s);
      if (existing !== undefined) {
        issues.push({
          tileId,
          segmentId: seg.id,
          code: "side-conflict",
          message: `Tile "${tileId}" side "${s}" is claimed by both segment "${existing}" and "${seg.id}".`,
        });
      } else {
        sideOwner.set(s, seg.id);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Invariant 3: Half-edge completeness
// ---------------------------------------------------------------------------

function checkHalfEdgeCompleteness(
  tileId: string,
  citySides: Set<Side>,
  fieldSegs: FieldSegment[],
  issues: CatalogIssue[],
): void {
  // Build half-edge → field segment id from the (already duplicate-free) data.
  const heOwner = new Map<HalfEdge, string>();
  for (const seg of fieldSegs) {
    for (const he of seg.halfEdges) {
      if (!VALID_HALF_EDGES.has(he)) continue; // already reported as malformed
      heOwner.set(he as HalfEdge, seg.id);
    }
  }

  for (const side of ALL_SIDES) {
    const halfEdges = SIDE_HALF_EDGES[side];
    const isCitySide = citySides.has(side);

    for (const he of halfEdges) {
      const owner = heOwner.get(he);

      if (isCitySide) {
        // City side: no field may own this half-edge.
        if (owner !== undefined) {
          issues.push({
            tileId,
            segmentId: owner,
            code: "half-edge-on-city-side",
            message: `Tile "${tileId}" field segment "${owner}" owns half-edge "${he}" which is on city side "${side}".`,
          });
        }
      } else {
        // Non-city side: exactly one field must own this half-edge.
        if (owner === undefined) {
          issues.push({
            tileId,
            code: "half-edge-uncovered",
            message: `Tile "${tileId}" half-edge "${he}" on non-city side "${side}" is not covered by any field segment.`,
          });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Invariant 5: adjacentCities validity
// ---------------------------------------------------------------------------

function checkAdjacentCities(
  tileId: string,
  fieldSegs: FieldSegment[],
  cityIds: Set<string>,
  issues: CatalogIssue[],
): void {
  for (const seg of fieldSegs) {
    for (const ref of seg.adjacentCities) {
      if (!cityIds.has(ref)) {
        issues.push({
          tileId,
          segmentId: seg.id,
          code: "adjacent-city-invalid",
          message: `Tile "${tileId}" field segment "${seg.id}" references unknown city segment "${ref}".`,
        });
      }
    }
  }
}
