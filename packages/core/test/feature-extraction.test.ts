import { describe, expect, it } from "vitest";
import {
  createBoard,
  extractFeatures,
  baseGameCatalog,
  loadCatalog,
  sampleTiles,
} from "../src/index.js";
import type { BoardState, Feature } from "../src/index.js";

const catalog = baseGameCatalog;
const sampleCatalog = loadCatalog(sampleTiles);

/** Finds the unique feature of `type` whose segments include `(position, segmentId)`. */
function featureFor(
  features: Feature[],
  type: Feature["type"],
  position: { x: number; y: number },
  segmentId: string,
): Feature {
  const found = features.find(
    (f) =>
      f.type === type &&
      f.segments.some(
        (s) =>
          s.position.x === position.x && s.position.y === position.y && s.segmentId === segmentId,
      ),
  );
  if (found === undefined) {
    throw new Error(
      `No ${type} feature found containing (${position.x},${position.y})/${segmentId}`,
    );
  }
  return found;
}

// ---------------------------------------------------------------------------
// Single isolated tiles
// ---------------------------------------------------------------------------

describe("extractFeatures — isolated tiles", () => {
  it("BASE-C alone: one city feature, not completed, pennants: 1", () => {
    const board = createBoard().placeTile("BASE-C", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);

    expect(features).toHaveLength(1);
    const city = features[0]!;
    expect(city.type).toBe("city");
    expect(city.completed).toBe(false);
    expect(city.pennants).toBe(1);
    expect(city.tilePositions).toEqual([{ x: 0, y: 0 }]);
    expect(city.segments).toEqual([{ position: { x: 0, y: 0 }, segmentId: "city" }]);
  });

  it("BASE-B alone: one monastery feature (not completed) + one field feature (completed: false)", () => {
    const board = createBoard().placeTile("BASE-B", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);

    expect(features).toHaveLength(2);
    const monastery = features.find((f) => f.type === "monastery")!;
    const field = features.find((f) => f.type === "field")!;

    expect(monastery.completed).toBe(false);
    expect(monastery.pennants).toBe(0);
    expect(monastery.tilePositions).toEqual([{ x: 0, y: 0 }]);

    expect(field.completed).toBe(false);
    expect(field.pennants).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Connected cities across tiles
// ---------------------------------------------------------------------------

describe("extractFeatures — connected cities", () => {
  it("two BASE-H tiles stacked join city1(N) of the lower tile to city2(S) of the upper tile", () => {
    // BASE-H: city1 (N), city2 (S), field f1 (E/W) — two separate cities on one tile.
    // Stack BASE-H tiles vertically: the shared edge is N of (0,0) / S of
    // (0,1), so (0,0)'s city1 (N) touches (0,1)'s city2 (S). Both segments'
    // only side is satisfied by the other tile, so this 2-tile join is
    // itself completed (no open side anywhere in the feature).
    const board = createBoard()
      .placeTile("BASE-H", { x: 0, y: 0 }, 0)
      .placeTile("BASE-H", { x: 0, y: 1 }, 0)
      .build();
    const features = extractFeatures(board, catalog);

    // city1 of (0,0) touches city2 of (0,1): same type ("city"), opposite sides.
    const joined = featureFor(features, "city", { x: 0, y: 0 }, "city1");
    expect(joined.segments).toEqual(
      expect.arrayContaining([
        { position: { x: 0, y: 0 }, segmentId: "city1" },
        { position: { x: 0, y: 1 }, segmentId: "city2" },
      ]),
    );
    expect(joined.segments).toHaveLength(2);
    expect(joined.tilePositions).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ]);
    expect(joined.completed).toBe(true);

    // city2 of (0,0) (the OTHER city on that same tile) remains a separate
    // singleton feature whose S side has no neighbour -> not completed.
    const bottomCap = featureFor(features, "city", { x: 0, y: 0 }, "city2");
    expect(bottomCap.segments).toHaveLength(1);
    expect(bottomCap.completed).toBe(false);
  });

  it("small closed city: two BASE-E tiles cap-to-cap forms one fully enclosed city", () => {
    // BASE-E: city on N only, field elsewhere. Place the lower tile rotated
    // 0 (city cap faces N, into the shared edge) and the upper tile rotated
    // 180 (city cap faces S, into the same shared edge) -> the joined city
    // has no open side and is completed, even though it spans only 2 tiles
    // and carries no pennant.
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0) // city cap faces N (up into (0,1))
      .placeTile("BASE-E", { x: 0, y: 1 }, 180) // city cap faces S (down into (0,0))
      .build();
    const features = extractFeatures(board, catalog);

    const city = featureFor(features, "city", { x: 0, y: 0 }, "city");
    expect(city.segments).toHaveLength(2);
    expect(city.tilePositions).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ]);
    expect(city.pennants).toBe(0);
    // Each city segment's only side faces the other tile (present) -> no
    // open side anywhere in the feature -> completed.
    expect(city.completed).toBe(true);
  });

  it("an open city stays incomplete even when most of its sides are matched", () => {
    // BASE-F: city spans N and S (through-city), pennant. Closing only the
    // N side (via a BASE-E cap rotated to face S) leaves the S side open,
    // so the joined city remains incomplete despite being connected.
    const board = createBoard()
      .placeTile("BASE-F", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180) // city cap faces S, closes BASE-F's N side
      .build();
    const features = extractFeatures(board, catalog);
    const joined = featureFor(features, "city", { x: 0, y: 0 }, "city");
    expect(joined.segments).toHaveLength(2);
    // BASE-F's S side has no neighbour -> open -> not completed.
    expect(joined.completed).toBe(false);
    expect(joined.pennants).toBe(1);
  });

  it("incomplete vs complete: BASE-D city cap stays open with no neighbour to the north", () => {
    const board = createBoard().placeTile("BASE-D", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);
    const city = featureFor(features, "city", { x: 0, y: 0 }, "city");
    expect(city.completed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Connected roads
// ---------------------------------------------------------------------------

describe("extractFeatures — connected roads", () => {
  it("two ROAD-STRAIGHT tiles end to end join into one road feature", () => {
    const board = createBoard()
      .placeTile("ROAD-STRAIGHT", { x: 0, y: 0 }, 0)
      .placeTile("ROAD-STRAIGHT", { x: 0, y: 1 }, 0)
      .build();
    const features = extractFeatures(board, sampleCatalog);

    const road = featureFor(features, "road", { x: 0, y: 0 }, "r1");
    expect(road.tilePositions).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ]);
    expect(road.segments).toHaveLength(2);
    // Open ends at y=-1 (south of first tile) and y=2 (north of second tile).
    expect(road.completed).toBe(false);
  });

  it("a single ROAD-STRAIGHT tile is an incomplete road (both ends open)", () => {
    const board = createBoard().placeTile("ROAD-STRAIGHT", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, sampleCatalog);
    const road = featureFor(features, "road", { x: 0, y: 0 }, "r1");
    expect(road.completed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rotation
// ---------------------------------------------------------------------------

describe("extractFeatures — rotation", () => {
  it("a straight road rotated 90 degrees connects to E/W neighbours, not N/S", () => {
    // ROAD-STRAIGHT canonical sides are N/S; rotated 90 -> E/W.
    const board = createBoard()
      .placeTile("ROAD-STRAIGHT", { x: 0, y: 0 }, 90)
      .placeTile("ROAD-STRAIGHT", { x: 1, y: 0 }, 90) // east neighbour
      .placeTile("ROAD-STRAIGHT", { x: 0, y: 1 }, 0) // north neighbour: NOT connected (still N/S oriented, but irrelevant: rotated tile's road no longer touches N)
      .build();
    const features = extractFeatures(board, sampleCatalog);

    const road = featureFor(features, "road", { x: 0, y: 0 }, "r1");
    // Connected to the east neighbour only.
    expect(road.tilePositions).toEqual(
      expect.arrayContaining([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]),
    );
    expect(road.tilePositions).toHaveLength(2);

    // The tile placed to the north is a separate feature (no connection).
    const northRoad = featureFor(features, "road", { x: 0, y: 1 }, "r1");
    expect(northRoad).not.toBe(road);
    expect(northRoad.tilePositions).toEqual([{ x: 0, y: 1 }]);
  });
});

// ---------------------------------------------------------------------------
// Fields by half-edge
// ---------------------------------------------------------------------------

describe("extractFeatures — fields by half-edge", () => {
  it("two adjacent BASE-B tiles (all field) connect into one field; completed is always false", () => {
    const board = createBoard()
      .placeTile("BASE-B", { x: 0, y: 0 }, 0)
      .placeTile("BASE-B", { x: 1, y: 0 }, 0)
      .build();
    const features = extractFeatures(board, catalog);

    const field = featureFor(features, "field", { x: 0, y: 0 }, "f1");
    expect(field.tilePositions).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
    expect(field.completed).toBe(false);
  });

  it("a road splitting a side keeps the two flanking fields separate", () => {
    // BASE-D: city N, road E/W, f-n (north strip) + f-s (south area).
    // Place two BASE-D tiles side by side (east-west) so the road continues
    // and the f-s fields on both tiles merge across the shared W/E half-edges
    // that are NOT covered by the road's own sides... Actually BASE-D's E/W
    // sides ARE the road, so the touching sides between two side-by-side
    // BASE-D tiles are entirely road, not field. Instead, verify the within
    // tile split directly: f-n and f-s on a single BASE-D tile must be two
    // distinct features (the road on E/W separates their half-edges).
    const board = createBoard().placeTile("BASE-D", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);

    const fn = featureFor(features, "field", { x: 0, y: 0 }, "f-n");
    const fs = featureFor(features, "field", { x: 0, y: 0 }, "f-s");
    expect(fn).not.toBe(fs);
    expect(fn.completed).toBe(false);
    expect(fs.completed).toBe(false);
  });

  it("BASE-X (crossroads, four field corners) keeps the four field corners separate on one tile", () => {
    const board = createBoard().placeTile("BASE-X", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);
    const fieldFeatures = features.filter((f) => f.type === "field");
    expect(fieldFeatures).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Monastery completion
// ---------------------------------------------------------------------------

describe("extractFeatures — monastery completion", () => {
  it("0 of 8 neighbours: not completed", () => {
    const board = createBoard().placeTile("BASE-B", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);
    const monastery = features.find((f) => f.type === "monastery")!;
    expect(monastery.completed).toBe(false);
  });

  it("7 of 8 neighbours: not completed", () => {
    const builder = createBoard().placeTile("BASE-B", { x: 0, y: 0 }, 0);
    const offsets = [
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      // omit { x: 1, y: -1 } -> only 7 neighbours present
    ];
    for (const o of offsets) {
      builder.placeTile("BASE-B", { x: o.x, y: o.y }, 0);
    }
    const board = builder.build();
    const features = extractFeatures(board, catalog);
    const monastery = featureFor(features, "monastery", { x: 0, y: 0 }, "mon");
    expect(monastery.completed).toBe(false);
  });

  it("8 of 8 neighbours: completed", () => {
    const builder = createBoard().placeTile("BASE-B", { x: 0, y: 0 }, 0);
    const offsets = [
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
    ];
    for (const o of offsets) {
      builder.placeTile("BASE-B", { x: o.x, y: o.y }, 0);
    }
    const board = builder.build();
    const features = extractFeatures(board, catalog);
    const monastery = featureFor(features, "monastery", { x: 0, y: 0 }, "mon");
    expect(monastery.completed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Meeples
// ---------------------------------------------------------------------------

describe("extractFeatures — meeples", () => {
  it("attaches followers on a city, a road, and a field to their respective features", () => {
    const board = createBoard()
      .placeTile("BASE-D", { x: 0, y: 0 }, 0) // city "city", road "road", fields f-n, f-s
      .placeMeeple("alice", { x: 0, y: 0 }, "city")
      .placeMeeple("bob", { x: 0, y: 0 }, "road")
      .placeMeeple("carol", { x: 0, y: 0 }, "f-s", "farmer")
      .build();
    const features = extractFeatures(board, catalog);

    const city = featureFor(features, "city", { x: 0, y: 0 }, "city");
    expect(city.meeples).toEqual([
      { playerId: "alice", kind: "follower", position: { x: 0, y: 0 }, segmentId: "city" },
    ]);

    const road = featureFor(features, "road", { x: 0, y: 0 }, "road");
    expect(road.meeples).toEqual([
      { playerId: "bob", kind: "follower", position: { x: 0, y: 0 }, segmentId: "road" },
    ]);

    const field = featureFor(features, "field", { x: 0, y: 0 }, "f-s");
    expect(field.meeples).toEqual([
      { playerId: "carol", kind: "farmer", position: { x: 0, y: 0 }, segmentId: "f-s" },
    ]);

    const otherField = featureFor(features, "field", { x: 0, y: 0 }, "f-n");
    expect(otherField.meeples).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Partition + determinism
// ---------------------------------------------------------------------------

describe("extractFeatures — partition and determinism", () => {
  it("every segment of every placed tile appears in exactly one feature", () => {
    const board = createBoard()
      .placeTile("BASE-D", { x: 0, y: 0 }, 0)
      .placeTile("BASE-A", { x: 0, y: 1 }, 0)
      .placeTile("BASE-B", { x: 1, y: 1 }, 0)
      .placeTile("BASE-H", { x: 0, y: -1 }, 180)
      .build();
    const features = extractFeatures(board, catalog);

    const seen = new Set<string>();
    for (const f of features) {
      for (const s of f.segments) {
        const key = `${s.position.x},${s.position.y}|${s.segmentId}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }

    let expectedTotal = 0;
    for (const placement of board.tiles) {
      const def = catalog.getTile(placement.tileId);
      expectedTotal += def.segments.length;
    }
    expect(seen.size).toBe(expectedTotal);
  });

  it("yields deep-equal output regardless of the order tiles/meeples appear in BoardState", () => {
    const boardA: BoardState = createBoard()
      .placeTile("BASE-D", { x: 0, y: 0 }, 0)
      .placeTile("BASE-A", { x: 0, y: 1 }, 0)
      .placeTile("BASE-B", { x: 1, y: 1 }, 0)
      .placeMeeple("alice", { x: 0, y: 0 }, "city")
      .placeMeeple("bob", { x: 0, y: 0 }, "road")
      .build();

    // Same content, different insertion order.
    const boardB: BoardState = {
      version: boardA.version,
      tiles: [...boardA.tiles].reverse(),
      meeples: [...boardA.meeples].reverse(),
    };

    const featuresA = extractFeatures(boardA, catalog);
    const featuresB = extractFeatures(boardB, catalog);

    expect(featuresB).toEqual(featuresA);
  });

  it("BASE-X singleton roads are not connected to each other (no shared sides)", () => {
    const board = createBoard().placeTile("BASE-X", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);
    const roadFeatures = features.filter((f) => f.type === "road");
    expect(roadFeatures).toHaveLength(4);
    for (const r of roadFeatures) {
      expect(r.completed).toBe(false);
    }
  });
});
