import { describe, expect, it } from "vitest";
import {
  CatalogError,
  loadCatalog,
  rotateHalfEdge,
  rotateSide,
  sampleTiles,
} from "../src/index.js";
import type { CitySegment, FieldSegment, HalfEdge, Side, TileDefinition } from "../src/index.js";
import type { Rotation } from "../src/index.js";

// ---------------------------------------------------------------------------
// Helper fixtures
// ---------------------------------------------------------------------------

/** Minimal valid field tile (no road, no city, pure field). */
const minimalFieldTile: TileDefinition = {
  id: "FIELD-ONLY",
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

// ---------------------------------------------------------------------------
// loadCatalog — indexing and retrieval
// ---------------------------------------------------------------------------

describe("loadCatalog — indexing", () => {
  it("loads sample tiles without throwing", () => {
    expect(() => loadCatalog(sampleTiles)).not.toThrow();
  });

  it("has() returns true for a loaded tile id", () => {
    const catalog = loadCatalog(sampleTiles);
    expect(catalog.has("ROAD-STRAIGHT")).toBe(true);
    expect(catalog.has("CITY-PENNANT")).toBe(true);
  });

  it("has() returns false for an unknown tile id", () => {
    const catalog = loadCatalog(sampleTiles);
    expect(catalog.has("NO-SUCH-TILE")).toBe(false);
  });

  it("getTile() returns the correct tile definition", () => {
    const catalog = loadCatalog(sampleTiles);
    const tile = catalog.getTile("ROAD-STRAIGHT");
    expect(tile.id).toBe("ROAD-STRAIGHT");
  });

  it("getTile() throws CatalogError(unknown-tile-id) for absent id", () => {
    const catalog = loadCatalog(sampleTiles);
    expect(() => catalog.getTile("NO-SUCH-TILE")).toThrowError(CatalogError);
    try {
      catalog.getTile("NO-SUCH-TILE");
    } catch (e) {
      expect((e as CatalogError).kind).toBe("unknown-tile-id");
    }
  });

  it("all() returns all tiles in insertion order", () => {
    const catalog = loadCatalog(sampleTiles);
    const all = catalog.all();
    expect(all).toHaveLength(sampleTiles.length);
    expect(all[0]!.id).toBe("ROAD-STRAIGHT");
    expect(all[1]!.id).toBe("CITY-PENNANT");
  });

  it("all() returns a fresh copy (mutation does not affect catalog)", () => {
    const catalog = loadCatalog(sampleTiles);
    const first = catalog.all();
    first.push(minimalFieldTile); // mutate the returned array
    expect(catalog.all()).toHaveLength(sampleTiles.length);
  });

  it("accepts an empty tile array", () => {
    const catalog = loadCatalog([]);
    expect(catalog.all()).toHaveLength(0);
  });

  it("accepts a single minimal tile", () => {
    const catalog = loadCatalog([minimalFieldTile]);
    expect(catalog.has("FIELD-ONLY")).toBe(true);
    expect(catalog.getTile("FIELD-ONLY")).toBe(minimalFieldTile);
  });
});

// ---------------------------------------------------------------------------
// loadCatalog — validation rejects malformations
// ---------------------------------------------------------------------------

describe("loadCatalog — validation: duplicate tile id", () => {
  it("throws CatalogError(duplicate-tile-id) for two tiles with the same id", () => {
    const tiles: TileDefinition[] = [
      { id: "DUP", segments: [] },
      { id: "DUP", segments: [] },
    ];
    expect(() => loadCatalog(tiles)).toThrowError(CatalogError);
    try {
      loadCatalog(tiles);
    } catch (e) {
      expect((e as CatalogError).kind).toBe("duplicate-tile-id");
    }
  });
});

describe("loadCatalog — validation: duplicate segment id", () => {
  it("throws CatalogError(duplicate-segment-id) for two segments with the same id in one tile", () => {
    const tiles: TileDefinition[] = [
      {
        id: "T1",
        segments: [
          { id: "s1", type: "road", sides: ["N"], meepleable: true },
          { id: "s1", type: "road", sides: ["S"], meepleable: true },
        ],
      },
    ];
    expect(() => loadCatalog(tiles)).toThrowError(CatalogError);
    try {
      loadCatalog(tiles);
    } catch (e) {
      expect((e as CatalogError).kind).toBe("duplicate-segment-id");
    }
  });
});

describe("loadCatalog — validation: unknown segment type", () => {
  it("throws CatalogError(unknown-segment-type) for an unrecognised segment type", () => {
    const tiles = [
      {
        id: "T1",
        segments: [
          // Force an unknown type through unknown-type assertion.
          { id: "x1", type: "river" as "road", sides: [], meepleable: true },
        ],
      },
    ];
    expect(() => loadCatalog(tiles as unknown as TileDefinition[])).toThrowError(CatalogError);
    try {
      loadCatalog(tiles as unknown as TileDefinition[]);
    } catch (e) {
      expect((e as CatalogError).kind).toBe("unknown-segment-type");
    }
  });
});

describe("loadCatalog — validation: duplicate half-edge", () => {
  it("throws CatalogError(duplicate-half-edge) when two field segments claim the same half-edge", () => {
    const tiles: TileDefinition[] = [
      {
        id: "T1",
        segments: [
          {
            id: "f1",
            type: "field",
            halfEdges: ["NW", "NE"],
            adjacentCities: [],
            meepleable: true,
          },
          {
            id: "f2",
            type: "field",
            halfEdges: ["NW", "EN"], // "NW" already assigned to f1
            adjacentCities: [],
            meepleable: true,
          },
        ],
      },
    ];
    expect(() => loadCatalog(tiles)).toThrowError(CatalogError);
    try {
      loadCatalog(tiles);
    } catch (e) {
      expect((e as CatalogError).kind).toBe("duplicate-half-edge");
    }
  });
});

describe("loadCatalog — validation: unknown adjacent city", () => {
  it("throws CatalogError(unknown-adjacent-city) when adjacentCities references a non-existent segment", () => {
    const tiles: TileDefinition[] = [
      {
        id: "T1",
        segments: [
          {
            id: "f1",
            type: "field",
            halfEdges: ["NW"],
            adjacentCities: ["c-ghost"], // no such city segment in this tile
            meepleable: true,
          },
        ],
      },
    ];
    expect(() => loadCatalog(tiles)).toThrowError(CatalogError);
    try {
      loadCatalog(tiles);
    } catch (e) {
      expect((e as CatalogError).kind).toBe("unknown-adjacent-city");
    }
  });
});

// ---------------------------------------------------------------------------
// Sample tile segment spot-checks
// ---------------------------------------------------------------------------

describe("sample tiles — segment structure", () => {
  it("ROAD-STRAIGHT has a road segment on sides N and S", () => {
    const catalog = loadCatalog(sampleTiles);
    const tile = catalog.getTile("ROAD-STRAIGHT");
    const road = tile.segments.find((s) => s.type === "road");
    expect(road).toBeDefined();
    expect((road as { sides: readonly Side[] }).sides).toContain("N");
    expect((road as { sides: readonly Side[] }).sides).toContain("S");
  });

  it("ROAD-STRAIGHT has exactly two field segments", () => {
    const catalog = loadCatalog(sampleTiles);
    const tile = catalog.getTile("ROAD-STRAIGHT");
    const fields = tile.segments.filter((s) => s.type === "field");
    expect(fields).toHaveLength(2);
  });

  it("CITY-PENNANT has a city segment with pennant=true", () => {
    const catalog = loadCatalog(sampleTiles);
    const tile = catalog.getTile("CITY-PENNANT");
    const city = tile.segments.find((s) => s.type === "city") as CitySegment | undefined;
    expect(city).toBeDefined();
    expect(city!.pennant).toBe(true);
    expect(city!.sides).toContain("N");
    expect(city!.sides).toContain("E");
  });

  it("CITY-PENNANT field references the correct adjacent city id", () => {
    const catalog = loadCatalog(sampleTiles);
    const tile = catalog.getTile("CITY-PENNANT");
    const field = tile.segments.find((s) => s.type === "field") as FieldSegment | undefined;
    expect(field).toBeDefined();
    expect(field!.adjacentCities).toContain("c1");
  });

  it("ROAD-STRAIGHT fields have empty adjacentCities", () => {
    const catalog = loadCatalog(sampleTiles);
    const tile = catalog.getTile("ROAD-STRAIGHT");
    const fields = tile.segments.filter((s) => s.type === "field") as FieldSegment[];
    for (const f of fields) {
      expect(f.adjacentCities).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// rotateSide — table-driven
// ---------------------------------------------------------------------------

describe("rotateSide — table-driven", () => {
  const cases: Array<[Side, Rotation, Side]> = [
    // 0° — identity
    ["N", 0, "N"],
    ["E", 0, "E"],
    ["S", 0, "S"],
    ["W", 0, "W"],
    // 90° clockwise: N→E, E→S, S→W, W→N
    ["N", 90, "E"],
    ["E", 90, "S"],
    ["S", 90, "W"],
    ["W", 90, "N"],
    // 180°: N→S, E→W, S→N, W→E
    ["N", 180, "S"],
    ["E", 180, "W"],
    ["S", 180, "N"],
    ["W", 180, "E"],
    // 270° clockwise (= 90° counter-clockwise): N→W, E→N, S→E, W→S
    ["N", 270, "W"],
    ["E", 270, "N"],
    ["S", 270, "E"],
    ["W", 270, "S"],
  ];

  for (const [side, rotation, expected] of cases) {
    it(`rotateSide("${side}", ${rotation}) === "${expected}"`, () => {
      expect(rotateSide(side, rotation)).toBe(expected);
    });
  }
});

// ---------------------------------------------------------------------------
// rotateHalfEdge — table-driven
// ---------------------------------------------------------------------------

describe("rotateHalfEdge — table-driven", () => {
  const cases: Array<[HalfEdge, Rotation, HalfEdge]> = [
    // 0° — identity
    ["NW", 0, "NW"],
    ["NE", 0, "NE"],
    ["EN", 0, "EN"],
    ["ES", 0, "ES"],
    ["SE", 0, "SE"],
    ["SW", 0, "SW"],
    ["WS", 0, "WS"],
    ["WN", 0, "WN"],
    // 90° clockwise
    ["NW", 90, "EN"],
    ["NE", 90, "ES"],
    ["EN", 90, "SE"],
    ["ES", 90, "SW"],
    ["SE", 90, "WS"],
    ["SW", 90, "WN"],
    ["WS", 90, "NW"],
    ["WN", 90, "NE"],
    // 180°
    ["NW", 180, "SE"],
    ["NE", 180, "SW"],
    ["EN", 180, "WS"],
    ["ES", 180, "WN"],
    ["SE", 180, "NW"],
    ["SW", 180, "NE"],
    ["WS", 180, "EN"],
    ["WN", 180, "ES"],
    // 270°
    ["NW", 270, "WS"],
    ["NE", 270, "WN"],
    ["EN", 270, "NW"],
    ["ES", 270, "NE"],
    ["SE", 270, "EN"],
    ["SW", 270, "ES"],
    ["WS", 270, "SE"],
    ["WN", 270, "SW"],
  ];

  for (const [he, rotation, expected] of cases) {
    it(`rotateHalfEdge("${he}", ${rotation}) === "${expected}"`, () => {
      expect(rotateHalfEdge(he, rotation)).toBe(expected);
    });
  }
});

// ---------------------------------------------------------------------------
// rotateSide / rotateHalfEdge — round-trip properties
// ---------------------------------------------------------------------------

describe("rotation round-trip properties", () => {
  const sides: Side[] = ["N", "E", "S", "W"];
  const halfEdges: HalfEdge[] = ["NW", "NE", "EN", "ES", "SE", "SW", "WS", "WN"];

  it("four 90° rotations return to the original side", () => {
    for (const side of sides) {
      let current: Side = side;
      for (let i = 0; i < 4; i++) {
        current = rotateSide(current, 90);
      }
      expect(current).toBe(side);
    }
  });

  it("four 90° rotations return to the original half-edge", () => {
    for (const he of halfEdges) {
      let current: HalfEdge = he;
      for (let i = 0; i < 4; i++) {
        current = rotateHalfEdge(current, 90);
      }
      expect(current).toBe(he);
    }
  });

  it("180° is equivalent to two 90° rotations (sides)", () => {
    for (const side of sides) {
      expect(rotateSide(side, 180)).toBe(rotateSide(rotateSide(side, 90), 90));
    }
  });

  it("270° is equivalent to three 90° rotations (half-edges)", () => {
    for (const he of halfEdges) {
      const by270 = rotateHalfEdge(he, 270);
      const by3x90 = rotateHalfEdge(rotateHalfEdge(rotateHalfEdge(he, 90), 90), 90);
      expect(by270).toBe(by3x90);
    }
  });
});
