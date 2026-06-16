/**
 * Tests for the catalog-consistency checker (Item 005).
 *
 * Verifies:
 *  - Happy path: base-game catalog and sample catalog both return [].
 *  - Per-invariant broken fixtures: one focused test per issue code.
 *  - Base-game-specific assertions (24 tiles, counts=72, pennant set, monasteries).
 */

import { describe, expect, it } from "vitest";
import {
  baseGameCatalog,
  checkCatalogConsistency,
  assertCatalogConsistent,
  loadCatalog,
  sampleTiles,
} from "../src/index.js";
import type { Catalog, CatalogIssue, TileDefinition } from "../src/index.js";
import type { CitySegment, MonasterySegment } from "../src/index.js";

// ---------------------------------------------------------------------------
// Helper: build a minimal fake Catalog that wraps raw TileDefinitions.
//
// Some broken fixtures would cause `loadCatalog` to throw (e.g. a field
// referencing a non-existent adjacent city).  For those we bypass the loader
// and pass a hand-crafted Catalog object directly so the consistency checker
// can exercise its own detection logic.
// ---------------------------------------------------------------------------

function fakeCatalog(tiles: TileDefinition[]): Catalog {
  const map = new Map<string, TileDefinition>(tiles.map((t) => [t.id, t]));
  return {
    getTile(id: string): TileDefinition {
      const tile = map.get(id);
      if (tile === undefined) throw new Error(`fakeCatalog: unknown id "${id}"`);
      return tile;
    },
    has(id: string): boolean {
      return map.has(id);
    },
    all(): TileDefinition[] {
      return [...tiles];
    },
  };
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("checkCatalogConsistency — happy path", () => {
  it("returns [] for the base-game catalog", () => {
    expect(checkCatalogConsistency(baseGameCatalog)).toEqual([]);
  });

  it("returns [] for the sample catalog (Item 003 tiles)", () => {
    const catalog = loadCatalog(sampleTiles);
    expect(checkCatalogConsistency(catalog)).toEqual([]);
  });

  it("returns [] for a minimal valid field-only tile", () => {
    const tile: TileDefinition = {
      id: "T-FIELD-ONLY",
      segments: [
        {
          id: "f1",
          type: "field",
          halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"],
          adjacentCities: [],
          meepleable: true,
        },
      ],
    };
    expect(checkCatalogConsistency(fakeCatalog([tile]))).toEqual([]);
  });

  it("returns [] for a valid city-and-field tile", () => {
    // City N+E, field S+W
    const tile: TileDefinition = {
      id: "T-CITY-NE",
      segments: [
        { id: "city", type: "city", sides: ["N", "E"], meepleable: true },
        {
          id: "f1",
          type: "field",
          halfEdges: ["SE", "SW", "WS", "WN"],
          adjacentCities: ["city"],
          meepleable: true,
        },
      ],
    };
    expect(checkCatalogConsistency(fakeCatalog([tile]))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// assertCatalogConsistent
// ---------------------------------------------------------------------------

describe("assertCatalogConsistent", () => {
  it("does not throw for a consistent catalog", () => {
    expect(() => assertCatalogConsistent(baseGameCatalog)).not.toThrow();
  });

  it("throws with an error message listing issues for an inconsistent catalog", () => {
    const tile: TileDefinition = { id: "EMPTY", segments: [] };
    expect(() => assertCatalogConsistent(fakeCatalog([tile]))).toThrow(
      /Catalog consistency violations/,
    );
  });
});

// ---------------------------------------------------------------------------
// Invariant 1: empty-tile
// ---------------------------------------------------------------------------

describe("invariant 1 — empty-tile", () => {
  it("reports empty-tile for a tile with no segments", () => {
    const tile: TileDefinition = { id: "NO-SEGS", segments: [] };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe("empty-tile");
    expect(issues[0]!.tileId).toBe("NO-SEGS");
  });

  it("does not report empty-tile for a tile with at least one segment", () => {
    const tile: TileDefinition = {
      id: "ONE-SEG",
      segments: [{ id: "mon", type: "monastery", meepleable: true }],
    };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const emptyCodes = issues.filter((i) => i.code === "empty-tile");
    expect(emptyCodes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Invariant 2: side-conflict
// ---------------------------------------------------------------------------

describe("invariant 2 — side-conflict", () => {
  it("reports side-conflict when two city segments both claim the same side", () => {
    const tile: TileDefinition = {
      id: "SIDE-CONFLICT",
      segments: [
        {
          id: "city1",
          type: "city",
          sides: ["N"],
          meepleable: true,
        },
        {
          id: "city2",
          type: "city",
          sides: ["N", "E"],
          meepleable: true,
        },
        {
          id: "f1",
          type: "field",
          halfEdges: ["SE", "SW", "WS", "WN"],
          adjacentCities: ["city1", "city2"],
          meepleable: true,
        },
      ],
    };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const conflict = issues.filter((i) => i.code === "side-conflict");
    expect(conflict.length).toBeGreaterThanOrEqual(1);
    expect(conflict[0]!.tileId).toBe("SIDE-CONFLICT");
    // The second city segment that conflicts should be flagged
    expect(conflict[0]!.segmentId).toBe("city2");
  });

  it("reports side-conflict when a road and city both claim the same side", () => {
    const tile: TileDefinition = {
      id: "ROAD-CITY-CONFLICT",
      segments: [
        { id: "city", type: "city", sides: ["N"], meepleable: true },
        { id: "road", type: "road", sides: ["N"], meepleable: true },
        {
          id: "f1",
          type: "field",
          halfEdges: ["EN", "ES", "SE", "SW", "WS", "WN"],
          adjacentCities: ["city"],
          meepleable: true,
        },
      ],
    };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const conflict = issues.filter((i) => i.code === "side-conflict");
    expect(conflict.length).toBeGreaterThanOrEqual(1);
    expect(conflict[0]!.segmentId).toBe("road");
  });
});

// ---------------------------------------------------------------------------
// Invariant 3: half-edge-uncovered
// ---------------------------------------------------------------------------

describe("invariant 3 — half-edge-uncovered", () => {
  it("reports half-edge-uncovered for a non-city side missing a half-edge from all fields", () => {
    // Road on N and S; field on E side only (W side uncovered: WS and WN missing)
    const tile: TileDefinition = {
      id: "HE-UNCOVERED",
      segments: [
        { id: "road", type: "road", sides: ["N", "S"], meepleable: true },
        {
          id: "f1",
          type: "field",
          // Only E-side half-edges; W-side (WS, WN) is uncovered
          halfEdges: ["NE", "EN", "ES", "SE"],
          adjacentCities: [],
          meepleable: true,
        },
        // NW and SW (the road-side halves on N and S for the west field) missing
        // WS and WN (W-side) also missing
      ],
    };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const uncovered = issues.filter((i) => i.code === "half-edge-uncovered");
    // WS and WN are uncovered; NW and SW are also uncovered
    expect(uncovered.length).toBeGreaterThanOrEqual(2);
    expect(uncovered[0]!.tileId).toBe("HE-UNCOVERED");
  });

  it("reports half-edge-uncovered for a completely open side with no field half-edges", () => {
    // Only one field covering N, E, S sides; W side has no coverage
    const tile: TileDefinition = {
      id: "MISSING-W",
      segments: [
        {
          id: "f1",
          type: "field",
          halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW"],
          // WS and WN are missing
          adjacentCities: [],
          meepleable: true,
        },
      ],
    };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const uncovered = issues.filter((i) => i.code === "half-edge-uncovered");
    expect(uncovered.length).toBe(2); // WS and WN
    expect(uncovered.every((i) => i.tileId === "MISSING-W")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Invariant 3: half-edge-on-city-side
// ---------------------------------------------------------------------------

describe("invariant 3 — half-edge-on-city-side", () => {
  it("reports half-edge-on-city-side when a field claims a half-edge from a city side", () => {
    // City on N; field wrongly includes NW (which belongs to the N city side)
    const tile: TileDefinition = {
      id: "HE-ON-CITY",
      segments: [
        { id: "city", type: "city", sides: ["N"], meepleable: true },
        {
          id: "f1",
          type: "field",
          // NW belongs to N side which is a city side — this is wrong
          halfEdges: ["NW", "EN", "ES", "SE", "SW", "WS", "WN"],
          adjacentCities: ["city"],
          meepleable: true,
        },
      ],
    };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const onCity = issues.filter((i) => i.code === "half-edge-on-city-side");
    expect(onCity.length).toBeGreaterThanOrEqual(1);
    expect(onCity[0]!.tileId).toBe("HE-ON-CITY");
    expect(onCity[0]!.segmentId).toBe("f1");
  });

  it("reports half-edge-on-city-side for both half-edges of a city side if both appear in a field", () => {
    const tile: TileDefinition = {
      id: "BOTH-HE-ON-CITY",
      segments: [
        { id: "city", type: "city", sides: ["N"], meepleable: true },
        {
          id: "f1",
          type: "field",
          // NW and NE both belong to city side N — both wrong
          halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"],
          adjacentCities: ["city"],
          meepleable: true,
        },
      ],
    };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const onCity = issues.filter((i) => i.code === "half-edge-on-city-side");
    expect(onCity.length).toBe(2); // NW and NE
  });
});

// ---------------------------------------------------------------------------
// Invariant 4: pennant-on-non-city
// ---------------------------------------------------------------------------

describe("invariant 4 — pennant-on-non-city", () => {
  it("reports pennant-on-non-city when a road segment carries a pennant", () => {
    const tile = {
      id: "ROAD-PENNANT",
      segments: [
        // Cast to bypass TypeScript's structural check; this simulates bad data.
        {
          id: "road",
          type: "road" as const,
          sides: ["N", "S"] as const,
          pennant: true,
          meepleable: true,
        },
        {
          id: "f1",
          type: "field" as const,
          halfEdges: ["NW", "WN", "WS", "SW"] as const,
          adjacentCities: [] as const,
          meepleable: true,
        },
        {
          id: "f2",
          type: "field" as const,
          halfEdges: ["NE", "EN", "ES", "SE"] as const,
          adjacentCities: [] as const,
          meepleable: true,
        },
      ],
    } as unknown as TileDefinition;

    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const pennant = issues.filter((i) => i.code === "pennant-on-non-city");
    expect(pennant.length).toBeGreaterThanOrEqual(1);
    expect(pennant[0]!.tileId).toBe("ROAD-PENNANT");
    expect(pennant[0]!.segmentId).toBe("road");
  });

  it("reports pennant-on-non-city when a field segment carries a pennant", () => {
    const tile = {
      id: "FIELD-PENNANT",
      segments: [
        {
          id: "f1",
          type: "field" as const,
          halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"] as const,
          adjacentCities: [] as const,
          pennant: true,
          meepleable: true,
        },
      ],
    } as unknown as TileDefinition;

    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const pennant = issues.filter((i) => i.code === "pennant-on-non-city");
    expect(pennant.length).toBeGreaterThanOrEqual(1);
    expect(pennant[0]!.segmentId).toBe("f1");
  });
});

// ---------------------------------------------------------------------------
// Invariant 5: adjacent-city-invalid
// ---------------------------------------------------------------------------

describe("invariant 5 — adjacent-city-invalid", () => {
  it("reports adjacent-city-invalid when a field references a non-existent city id", () => {
    // Build a tile where a field references a city id that does not exist on
    // the tile.  This bypasses loadCatalog (which would throw) via fakeCatalog.
    const tile: TileDefinition = {
      id: "BAD-ADJ",
      segments: [
        {
          id: "f1",
          type: "field",
          halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"],
          adjacentCities: ["ghost-city"],
          meepleable: true,
        },
      ],
    };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const adj = issues.filter((i) => i.code === "adjacent-city-invalid");
    expect(adj.length).toBeGreaterThanOrEqual(1);
    expect(adj[0]!.tileId).toBe("BAD-ADJ");
    expect(adj[0]!.segmentId).toBe("f1");
  });

  it("does not report adjacent-city-invalid when the referenced city exists", () => {
    const tile: TileDefinition = {
      id: "GOOD-ADJ",
      segments: [
        { id: "city", type: "city", sides: ["N"], meepleable: true },
        {
          id: "f1",
          type: "field",
          halfEdges: ["EN", "ES", "SE", "SW", "WS", "WN"],
          adjacentCities: ["city"],
          meepleable: true,
        },
      ],
    };
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const adj = issues.filter((i) => i.code === "adjacent-city-invalid");
    expect(adj).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Invariant 6: malformed-segment
// ---------------------------------------------------------------------------

describe("invariant 6 — malformed-segment", () => {
  it("reports malformed-segment for a city segment with no sides", () => {
    const tile = {
      id: "CITY-NO-SIDES",
      segments: [
        {
          id: "city",
          type: "city" as const,
          sides: [] as unknown as readonly ["N"],
          meepleable: true,
        },
        {
          id: "f1",
          type: "field" as const,
          halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"] as const,
          adjacentCities: [] as const,
          meepleable: true,
        },
      ],
    } as unknown as TileDefinition;
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const malformed = issues.filter((i) => i.code === "malformed-segment");
    expect(malformed.length).toBeGreaterThanOrEqual(1);
    expect(malformed[0]!.segmentId).toBe("city");
  });

  it("reports malformed-segment for a road segment with no sides", () => {
    const tile = {
      id: "ROAD-NO-SIDES",
      segments: [
        {
          id: "road",
          type: "road" as const,
          sides: [] as unknown as readonly ["N"],
          meepleable: true,
        },
        {
          id: "f1",
          type: "field" as const,
          halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"] as const,
          adjacentCities: [] as const,
          meepleable: true,
        },
      ],
    } as unknown as TileDefinition;
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const malformed = issues.filter((i) => i.code === "malformed-segment");
    expect(malformed.length).toBeGreaterThanOrEqual(1);
    expect(malformed.some((i) => i.segmentId === "road")).toBe(true);
  });

  it("reports malformed-segment for a field segment with no halfEdges", () => {
    const tile = {
      id: "FIELD-NO-HE",
      segments: [
        {
          id: "f1",
          type: "field" as const,
          halfEdges: [] as unknown as readonly ["NW"],
          adjacentCities: [] as const,
          meepleable: true,
        },
      ],
    } as unknown as TileDefinition;
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const malformed = issues.filter((i) => i.code === "malformed-segment");
    expect(malformed.length).toBeGreaterThanOrEqual(1);
    expect(malformed[0]!.segmentId).toBe("f1");
  });

  it("reports malformed-segment for a city segment with an invalid side value", () => {
    const tile = {
      id: "CITY-BAD-SIDE",
      segments: [
        {
          id: "city",
          type: "city" as const,
          sides: ["X"] as unknown as readonly ["N"],
          meepleable: true,
        },
        {
          id: "f1",
          type: "field" as const,
          halfEdges: ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"] as const,
          adjacentCities: [] as const,
          meepleable: true,
        },
      ],
    } as unknown as TileDefinition;
    const issues = checkCatalogConsistency(fakeCatalog([tile]));
    const malformed = issues.filter((i) => i.code === "malformed-segment");
    expect(malformed.length).toBeGreaterThanOrEqual(1);
    expect(malformed[0]!.segmentId).toBe("city");
  });
});

// ---------------------------------------------------------------------------
// Base-game-specific assertions
// ---------------------------------------------------------------------------

describe("base-game catalog — count assertions", () => {
  it("has exactly 24 distinct tile types", () => {
    expect(baseGameCatalog.all()).toHaveLength(24);
  });

  it("tile counts sum to 72", () => {
    const total = baseGameCatalog.all().reduce((sum, t) => sum + (t.count ?? 0), 0);
    expect(total).toBe(72);
  });
});

describe("base-game catalog — pennant assertions", () => {
  const PENNANT_IDS = new Set(["BASE-C", "BASE-F", "BASE-M", "BASE-O", "BASE-Q", "BASE-S"]);

  it("exactly tiles C, F, M, O, Q, S carry a pennant", () => {
    const tilesWithPennant = baseGameCatalog
      .all()
      .filter((t) =>
        t.segments.some((s): s is CitySegment => s.type === "city" && s.pennant === true),
      )
      .map((t) => t.id)
      .sort();

    expect(tilesWithPennant).toEqual([...PENNANT_IDS].sort());
  });

  it("no non-pennant tile has any segment with pennant: true", () => {
    for (const tile of baseGameCatalog.all()) {
      if (PENNANT_IDS.has(tile.id)) continue;
      for (const seg of tile.segments) {
        if (seg.type === "city") {
          expect(
            (seg as CitySegment).pennant,
            `${tile.id}/${seg.id} should not have pennant`,
          ).toBeFalsy();
        }
      }
    }
  });
});

describe("base-game catalog — monastery tile assertions", () => {
  it("BASE-A has exactly one monastery segment", () => {
    const monks = baseGameCatalog
      .getTile("BASE-A")
      .segments.filter((s): s is MonasterySegment => s.type === "monastery");
    expect(monks).toHaveLength(1);
  });

  it("BASE-B has exactly one monastery segment", () => {
    const monks = baseGameCatalog
      .getTile("BASE-B")
      .segments.filter((s): s is MonasterySegment => s.type === "monastery");
    expect(monks).toHaveLength(1);
  });

  it("no other base-game tile has a monastery segment", () => {
    const monasteryTileIds = baseGameCatalog
      .all()
      .filter((t) => t.segments.some((s) => s.type === "monastery"))
      .map((t) => t.id)
      .sort();
    expect(monasteryTileIds).toEqual(["BASE-A", "BASE-B"]);
  });
});

describe("base-game catalog — consistency", () => {
  it("checkCatalogConsistency(baseGameCatalog) returns [] (no issues)", () => {
    const issues: CatalogIssue[] = checkCatalogConsistency(baseGameCatalog);
    expect(issues).toEqual([]);
  });
});
