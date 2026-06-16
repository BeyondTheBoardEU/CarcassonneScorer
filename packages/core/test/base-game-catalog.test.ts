/**
 * Tests for the base-game tile catalog data (Item 004).
 *
 * Verifies:
 *  - The catalog loads without errors (loadCatalog does not throw).
 *  - Exactly 24 distinct tile types are present.
 *  - Tile ids are unique.
 *  - The sum of all tile counts equals 72.
 *  - Spot-checks on representative tiles (B, A, C, X, U, M, Q) assert
 *    the exact segment structure described in the spec.
 *  - Pennant guard: exactly the 6 pennant tiles (C, F, M, O, Q, S) have a
 *    pennanted city segment; no other tile sets pennant: true.
 */

import { describe, expect, it } from "vitest";
import { baseGameTiles, baseGameCatalog, loadCatalog } from "../src/index.js";
import type { CitySegment, FieldSegment, MonasterySegment, RoadSegment } from "../src/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCitySegs(tileId: string): CitySegment[] {
  return baseGameCatalog
    .getTile(tileId)
    .segments.filter((s): s is CitySegment => s.type === "city");
}

function getRoadSegs(tileId: string): RoadSegment[] {
  return baseGameCatalog
    .getTile(tileId)
    .segments.filter((s): s is RoadSegment => s.type === "road");
}

function getFieldSegs(tileId: string): FieldSegment[] {
  return baseGameCatalog
    .getTile(tileId)
    .segments.filter((s): s is FieldSegment => s.type === "field");
}

function getMonasterySegs(tileId: string): MonasterySegment[] {
  return baseGameCatalog
    .getTile(tileId)
    .segments.filter((s): s is MonasterySegment => s.type === "monastery");
}

// ---------------------------------------------------------------------------
// Catalog-level invariants
// ---------------------------------------------------------------------------

describe("baseGameCatalog — catalog-level invariants", () => {
  it("loadCatalog(baseGameTiles) does not throw", () => {
    expect(() => loadCatalog(baseGameTiles)).not.toThrow();
  });

  it("baseGameCatalog.all() returns exactly 24 tiles", () => {
    expect(baseGameCatalog.all()).toHaveLength(24);
  });

  it("all tile ids are unique", () => {
    const ids = baseGameCatalog.all().map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("sum of all tile counts equals 72", () => {
    const total = baseGameTiles.reduce((sum, t) => sum + (t.count ?? 0), 0);
    expect(total).toBe(72);
  });

  it("all 24 tile codes A–X are present", () => {
    const expectedIds = [
      "BASE-A",
      "BASE-B",
      "BASE-C",
      "BASE-D",
      "BASE-E",
      "BASE-F",
      "BASE-G",
      "BASE-H",
      "BASE-I",
      "BASE-J",
      "BASE-K",
      "BASE-L",
      "BASE-M",
      "BASE-N",
      "BASE-O",
      "BASE-P",
      "BASE-Q",
      "BASE-R",
      "BASE-S",
      "BASE-T",
      "BASE-U",
      "BASE-V",
      "BASE-W",
      "BASE-X",
    ];
    for (const id of expectedIds) {
      expect(baseGameCatalog.has(id)).toBe(true);
    }
  });

  it("every segment across all tiles has meepleable: true", () => {
    for (const tile of baseGameCatalog.all()) {
      for (const seg of tile.segments) {
        expect(seg.meepleable, `${tile.id}/${seg.id} meepleable`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Spot-check: B — Cloister alone
// ---------------------------------------------------------------------------

describe("BASE-B — cloister alone", () => {
  it("has exactly one monastery segment", () => {
    expect(getMonasterySegs("BASE-B")).toHaveLength(1);
  });

  it("has no city or road segments", () => {
    expect(getCitySegs("BASE-B")).toHaveLength(0);
    expect(getRoadSegs("BASE-B")).toHaveLength(0);
  });

  it("has exactly one field segment covering all 8 half-edges", () => {
    const fields = getFieldSegs("BASE-B");
    expect(fields).toHaveLength(1);
    const allHalfEdges = new Set(fields[0]!.halfEdges);
    expect(allHalfEdges.size).toBe(8);
    expect(allHalfEdges.has("NW")).toBe(true);
    expect(allHalfEdges.has("NE")).toBe(true);
    expect(allHalfEdges.has("EN")).toBe(true);
    expect(allHalfEdges.has("ES")).toBe(true);
    expect(allHalfEdges.has("SE")).toBe(true);
    expect(allHalfEdges.has("SW")).toBe(true);
    expect(allHalfEdges.has("WS")).toBe(true);
    expect(allHalfEdges.has("WN")).toBe(true);
  });

  it("field has no adjacent cities", () => {
    expect(getFieldSegs("BASE-B")[0]!.adjacentCities).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Spot-check: A — Cloister with road
// ---------------------------------------------------------------------------

describe("BASE-A — cloister with road", () => {
  it("has exactly one monastery segment", () => {
    expect(getMonasterySegs("BASE-A")).toHaveLength(1);
  });

  it("has exactly one road segment (meepleable)", () => {
    const roads = getRoadSegs("BASE-A");
    expect(roads).toHaveLength(1);
    expect(roads[0]!.meepleable).toBe(true);
  });

  it("road segment is on the S side", () => {
    const road = getRoadSegs("BASE-A")[0]!;
    expect(road.sides).toContain("S");
    expect(road.sides).toHaveLength(1);
  });

  it("has no city segments", () => {
    expect(getCitySegs("BASE-A")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Spot-check: C — Full city with pennant
// ---------------------------------------------------------------------------

describe("BASE-C — full city with pennant", () => {
  it("has exactly one city segment", () => {
    expect(getCitySegs("BASE-C")).toHaveLength(1);
  });

  it("city segment covers all four sides", () => {
    const city = getCitySegs("BASE-C")[0]!;
    expect(city.sides).toContain("N");
    expect(city.sides).toContain("E");
    expect(city.sides).toContain("S");
    expect(city.sides).toContain("W");
    expect(city.sides).toHaveLength(4);
  });

  it("city segment has pennant: true", () => {
    expect(getCitySegs("BASE-C")[0]!.pennant).toBe(true);
  });

  it("has no field segments (all sides are city)", () => {
    expect(getFieldSegs("BASE-C")).toHaveLength(0);
  });

  it("has no road or monastery segments", () => {
    expect(getRoadSegs("BASE-C")).toHaveLength(0);
    expect(getMonasterySegs("BASE-C")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Spot-check: X — Crossroads (four road arms)
// ---------------------------------------------------------------------------

describe("BASE-X — crossroads", () => {
  it("has exactly four road segments", () => {
    expect(getRoadSegs("BASE-X")).toHaveLength(4);
  });

  it("each road arm covers exactly one side", () => {
    for (const road of getRoadSegs("BASE-X")) {
      expect(road.sides).toHaveLength(1);
    }
  });

  it("the four road arms cover N, E, S, W", () => {
    const sides = getRoadSegs("BASE-X").flatMap((r) => r.sides);
    expect(sides).toContain("N");
    expect(sides).toContain("E");
    expect(sides).toContain("S");
    expect(sides).toContain("W");
  });

  it("has exactly four field segments (corner wedges)", () => {
    expect(getFieldSegs("BASE-X")).toHaveLength(4);
  });

  it("each corner field has exactly 2 half-edges", () => {
    for (const f of getFieldSegs("BASE-X")) {
      expect(f.halfEdges).toHaveLength(2);
    }
  });

  it("all corner fields have no adjacent cities", () => {
    for (const f of getFieldSegs("BASE-X")) {
      expect(f.adjacentCities).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Spot-check: U — Straight road N↔S
// ---------------------------------------------------------------------------

describe("BASE-U — straight road", () => {
  it("has one road segment on sides N and S", () => {
    const roads = getRoadSegs("BASE-U");
    expect(roads).toHaveLength(1);
    expect(roads[0]!.sides).toContain("N");
    expect(roads[0]!.sides).toContain("S");
  });

  it("has exactly two field segments (east and west)", () => {
    expect(getFieldSegs("BASE-U")).toHaveLength(2);
  });

  it("field segments have no adjacent cities", () => {
    for (const f of getFieldSegs("BASE-U")) {
      expect(f.adjacentCities).toHaveLength(0);
    }
  });

  it("the two fields together cover all 8 half-edges except none (road takes sides, not half-edges)", () => {
    const allHEs = getFieldSegs("BASE-U").flatMap((f) => f.halfEdges);
    expect(new Set(allHEs).size).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// Spot-check: M — City corner with pennant
// ---------------------------------------------------------------------------

describe("BASE-M — city corner (N+W) with pennant", () => {
  it("has one city segment on sides N and W", () => {
    const cities = getCitySegs("BASE-M");
    expect(cities).toHaveLength(1);
    expect(cities[0]!.sides).toContain("N");
    expect(cities[0]!.sides).toContain("W");
    expect(cities[0]!.sides).toHaveLength(2);
  });

  it("city segment has pennant: true", () => {
    expect(getCitySegs("BASE-M")[0]!.pennant).toBe(true);
  });

  it("has one field segment covering E and S sides", () => {
    const fields = getFieldSegs("BASE-M");
    expect(fields).toHaveLength(1);
    const hes = new Set(fields[0]!.halfEdges);
    expect(hes.has("EN")).toBe(true);
    expect(hes.has("ES")).toBe(true);
    expect(hes.has("SE")).toBe(true);
    expect(hes.has("SW")).toBe(true);
  });

  it("field borders the city", () => {
    const field = getFieldSegs("BASE-M")[0]!;
    expect(field.adjacentCities).toContain("city");
  });
});

// ---------------------------------------------------------------------------
// Spot-check: Q — Three-sided city with pennant
// ---------------------------------------------------------------------------

describe("BASE-Q — three-sided city (N+E+W) with pennant", () => {
  it("has one city segment on sides N, E, W", () => {
    const cities = getCitySegs("BASE-Q");
    expect(cities).toHaveLength(1);
    expect(cities[0]!.sides).toContain("N");
    expect(cities[0]!.sides).toContain("E");
    expect(cities[0]!.sides).toContain("W");
    expect(cities[0]!.sides).toHaveLength(3);
  });

  it("city has pennant: true", () => {
    expect(getCitySegs("BASE-Q")[0]!.pennant).toBe(true);
  });

  it("has one field segment on S side", () => {
    const fields = getFieldSegs("BASE-Q");
    expect(fields).toHaveLength(1);
    const hes = new Set(fields[0]!.halfEdges);
    expect(hes.has("SE")).toBe(true);
    expect(hes.has("SW")).toBe(true);
  });

  it("field borders the city", () => {
    expect(getFieldSegs("BASE-Q")[0]!.adjacentCities).toContain("city");
  });
});

// ---------------------------------------------------------------------------
// Spot-check: R — Three-sided city without pennant
// ---------------------------------------------------------------------------

describe("BASE-R — three-sided city (N+E+W) without pennant", () => {
  it("has one city segment on sides N, E, W", () => {
    const cities = getCitySegs("BASE-R");
    expect(cities).toHaveLength(1);
    expect(cities[0]!.sides).toContain("N");
    expect(cities[0]!.sides).toContain("E");
    expect(cities[0]!.sides).toContain("W");
  });

  it("city has no pennant", () => {
    expect(getCitySegs("BASE-R")[0]!.pennant).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// Pennant guard — only C, F, M, O, Q, S carry pennants
// ---------------------------------------------------------------------------

describe("pennant guard", () => {
  const PENNANT_TILES = new Set(["BASE-C", "BASE-F", "BASE-M", "BASE-O", "BASE-Q", "BASE-S"]);

  it("exactly the 6 pennant tiles have a city segment with pennant: true", () => {
    const tilesWithPennant = baseGameCatalog
      .all()
      .filter((tile) =>
        tile.segments.some((s) => s.type === "city" && (s as CitySegment).pennant === true),
      )
      .map((tile) => tile.id);

    expect(tilesWithPennant.sort()).toEqual([...PENNANT_TILES].sort());
  });

  it("no non-pennant tile has any segment with pennant: true", () => {
    for (const tile of baseGameCatalog.all()) {
      if (PENNANT_TILES.has(tile.id)) continue;
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

// ---------------------------------------------------------------------------
// Structural: separate-city tiles H and I
// ---------------------------------------------------------------------------

describe("BASE-H — two separate cities on opposite sides", () => {
  it("has exactly two city segments", () => {
    expect(getCitySegs("BASE-H")).toHaveLength(2);
  });

  it("cities are on N and S (opposite sides)", () => {
    const sides = getCitySegs("BASE-H").flatMap((c) => c.sides);
    expect(sides).toContain("N");
    expect(sides).toContain("S");
  });

  it("each city covers exactly one side", () => {
    for (const c of getCitySegs("BASE-H")) {
      expect(c.sides).toHaveLength(1);
    }
  });

  it("has one field segment (E+W sides) bordering both cities", () => {
    const fields = getFieldSegs("BASE-H");
    expect(fields).toHaveLength(1);
    expect(fields[0]!.adjacentCities).toHaveLength(2);
  });
});

describe("BASE-I — two separate cities on adjacent sides", () => {
  it("has exactly two city segments", () => {
    expect(getCitySegs("BASE-I")).toHaveLength(2);
  });

  it("has one field segment (S+W sides)", () => {
    const fields = getFieldSegs("BASE-I");
    expect(fields).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Structural: monastery tiles A and B
// ---------------------------------------------------------------------------

describe("monastery tiles have monastery segments", () => {
  it("BASE-A has a monastery segment", () => {
    expect(getMonasterySegs("BASE-A")).toHaveLength(1);
  });

  it("BASE-B has a monastery segment", () => {
    expect(getMonasterySegs("BASE-B")).toHaveLength(1);
  });

  it("no other base-game tile has a monastery segment", () => {
    const monasteryTiles = baseGameCatalog
      .all()
      .filter((t) => t.segments.some((s) => s.type === "monastery"))
      .map((t) => t.id);
    expect(monasteryTiles.sort()).toEqual(["BASE-A", "BASE-B"].sort());
  });
});

// ---------------------------------------------------------------------------
// Structural: W — Road T-junction (three arms)
// ---------------------------------------------------------------------------

describe("BASE-W — road T-junction", () => {
  it("has exactly three road segments", () => {
    expect(getRoadSegs("BASE-W")).toHaveLength(3);
  });

  it("each road arm covers exactly one side", () => {
    for (const road of getRoadSegs("BASE-W")) {
      expect(road.sides).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Structural: L — City cap + road T-junction (three arms)
// ---------------------------------------------------------------------------

describe("BASE-L — city cap + road T-junction", () => {
  it("has one city segment on N", () => {
    const cities = getCitySegs("BASE-L");
    expect(cities).toHaveLength(1);
    expect(cities[0]!.sides).toContain("N");
  });

  it("has exactly three road segments (E, S, W arms)", () => {
    expect(getRoadSegs("BASE-L")).toHaveLength(3);
  });
});
