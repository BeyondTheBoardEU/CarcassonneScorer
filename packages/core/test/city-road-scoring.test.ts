import { describe, expect, it } from "vitest";
import {
  createBoard,
  extractFeatures,
  baseGameCatalog,
  scoreCity,
  scoreRoad,
  scoreCompletedCityRoadFeatures,
} from "../src/index.js";
import type { BoardState, Feature } from "../src/index.js";

const catalog = baseGameCatalog;

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
// Completed city
// ---------------------------------------------------------------------------

describe("scoreCity — completed city", () => {
  it("two BASE-E tiles cap-to-cap: closed 2-tile city, no pennant -> 4 points", () => {
    // Reuses the feature-extraction.test.ts closed-city fixture: BASE-E city
    // cap faces N, second BASE-E rotated 180 faces S into the same edge.
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .build();
    const features = extractFeatures(board, catalog);
    const city = featureFor(features, "city", { x: 0, y: 0 }, "city");

    expect(city.completed).toBe(true);
    expect(city.pennants).toBe(0);

    const score = scoreCity(city);
    expect(score).toEqual({
      type: "city",
      completed: true,
      points: 4, // 2 * 2 tiles + 2 * 0 pennants
      players: [],
      tileCount: 2,
      pennants: 0,
      tilePositions: [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ],
    });
  });

  it("two BASE-H tiles stacked: closed 2-tile city including a pennant tile -> +2 per pennant", () => {
    // BASE-C is a single-tile whole-tile city WITH a pennant. Pair it with
    // BASE-E (cap, no pennant) cap-to-cap to close it with exactly 2 tiles
    // and one pennant: BASE-C has city on all four sides; closing one side
    // (N) with a BASE-E cap rotated to face S leaves the other three sides
    // open, so use BASE-H instead which has two separate single-side city
    // caps (city1 N, city2 S) -- pair BASE-C's matching side directly.
    //
    // Simplest closed construction carrying a pennant: BASE-C (city fills
    // all 4 sides, pennant) alone cannot close (4 open sides). Instead build
    // a 2-tile city using BASE-F (city N+S through, pennant) capped on BOTH
    // ends by BASE-E caps.
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: -1 }, 0) // cap faces N into BASE-F's S side
      .placeTile("BASE-F", { x: 0, y: 0 }, 0) // city N+S, pennant
      .placeTile("BASE-E", { x: 0, y: 1 }, 180) // cap faces S into BASE-F's N side
      .build();
    const features = extractFeatures(board, catalog);
    const city = featureFor(features, "city", { x: 0, y: 0 }, "city");

    expect(city.completed).toBe(true);
    expect(city.tilePositions).toHaveLength(3);
    expect(city.pennants).toBe(1);

    const score = scoreCity(city);
    expect(score.points).toBe(2 * 3 + 2 * 1); // 8
    expect(score).toEqual({
      type: "city",
      completed: true,
      points: 8,
      players: [],
      tileCount: 3,
      pennants: 1,
      tilePositions: [
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ],
    });
  });
});

// ---------------------------------------------------------------------------
// Completed road
// ---------------------------------------------------------------------------

describe("scoreRoad — completed road", () => {
  it("two BASE-A tiles cap-to-cap (road dead-ends closing each other): closed 2-tile road -> 2 points", () => {
    // BASE-A: monastery + a single road side (S). Placing one tile's S-road
    // against another tile's road (rotated 180 -> N) closes both dead ends
    // with no open side anywhere in the feature.
    const board = createBoard()
      .placeTile("BASE-A", { x: 0, y: 0 }, 0) // road exits S
      .placeTile("BASE-A", { x: 0, y: -1 }, 180) // road exits N (faces back up into (0,0))
      .build();
    const features = extractFeatures(board, catalog);
    const road = featureFor(features, "road", { x: 0, y: 0 }, "road");

    expect(road.completed).toBe(true);
    expect(road.tilePositions).toHaveLength(2);

    const score = scoreRoad(road);
    expect(score).toEqual({
      type: "road",
      completed: true,
      points: 2,
      players: [],
      tileCount: 2,
      pennants: 0,
      tilePositions: [
        { x: 0, y: -1 },
        { x: 0, y: 0 },
      ],
    });
  });
});

// ---------------------------------------------------------------------------
// Incomplete / monastery / field exclusion
// ---------------------------------------------------------------------------

describe("scoreCompletedCityRoadFeatures — exclusions", () => {
  it("an isolated BASE-C city (open) yields no score entry", () => {
    const board = createBoard().placeTile("BASE-C", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);
    const city = featureFor(features, "city", { x: 0, y: 0 }, "city");
    expect(city.completed).toBe(false);

    const scores = scoreCompletedCityRoadFeatures(features);
    expect(scores).toHaveLength(0);
  });

  it("an open road (single BASE-A, dead end with no closing neighbour) yields no score entry", () => {
    const board = createBoard().placeTile("BASE-A", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);
    const road = featureFor(features, "road", { x: 0, y: 0 }, "road");
    expect(road.completed).toBe(false);

    const scores = scoreCompletedCityRoadFeatures(features);
    expect(scores.filter((s) => s.type === "road")).toHaveLength(0);
  });

  it("monasteries and fields are never included in the aggregator's output", () => {
    const board = createBoard().placeTile("BASE-B", { x: 0, y: 0 }, 0).build();
    const features = extractFeatures(board, catalog);
    expect(features.some((f) => f.type === "monastery")).toBe(true);
    expect(features.some((f) => f.type === "field")).toBe(true);

    const scores = scoreCompletedCityRoadFeatures(features);
    expect(scores).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Ownership crediting
// ---------------------------------------------------------------------------

describe("scoreCity / scoreRoad — ownership crediting", () => {
  it("single owner on a completed city is credited the full points", () => {
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeMeeple("alice", { x: 0, y: 0 }, "city")
      .build();
    const features = extractFeatures(board, catalog);
    const city = featureFor(features, "city", { x: 0, y: 0 }, "city");

    const score = scoreCity(city);
    expect(score.players).toEqual(["alice"]);
    expect(score.points).toBe(4);
  });

  it("two-way tie on a completed city credits both players, each with the full points", () => {
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeMeeple("bob", { x: 0, y: 0 }, "city")
      .placeMeeple("alice", { x: 0, y: 1 }, "city")
      .build();
    const features = extractFeatures(board, catalog);
    const city = featureFor(features, "city", { x: 0, y: 0 }, "city");

    const score = scoreCity(city);
    expect(score.players).toEqual(["alice", "bob"]); // sorted per Item 007
    expect(score.points).toBe(4); // each tied player gets the FULL value, not split
  });

  it("a completed feature with no meeple has players: []", () => {
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .build();
    const features = extractFeatures(board, catalog);
    const city = featureFor(features, "city", { x: 0, y: 0 }, "city");

    const score = scoreCity(city);
    expect(score.players).toEqual([]);
    expect(score.points).toBe(4); // still worth points, credited to nobody
  });
});

// ---------------------------------------------------------------------------
// Multiple / independent features
// ---------------------------------------------------------------------------

describe("scoreCompletedCityRoadFeatures — multiple independent features", () => {
  it("two separate completed roads on one board produce two distinct score entries", () => {
    const board = createBoard()
      // Road loop 1 at x=0
      .placeTile("BASE-A", { x: 0, y: 0 }, 0)
      .placeTile("BASE-A", { x: 0, y: -1 }, 180)
      // Road loop 2 at x=5 (far enough away to never touch loop 1)
      .placeTile("BASE-A", { x: 5, y: 0 }, 0)
      .placeTile("BASE-A", { x: 5, y: -1 }, 180)
      .build();
    const features = extractFeatures(board, catalog);

    const scores = scoreCompletedCityRoadFeatures(features);
    const roadScores = scores.filter((s) => s.type === "road");
    expect(roadScores).toHaveLength(2);
    for (const s of roadScores) {
      expect(s.points).toBe(2);
      expect(s.tileCount).toBe(2);
    }
  });

  it("a completed city and a completed road together yield two independent entries with correct values", () => {
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeTile("BASE-A", { x: 5, y: 0 }, 0)
      .placeTile("BASE-A", { x: 5, y: -1 }, 180)
      .build();
    const features = extractFeatures(board, catalog);

    const scores = scoreCompletedCityRoadFeatures(features);
    expect(scores).toHaveLength(2);

    const city = scores.find((s) => s.type === "city")!;
    const road = scores.find((s) => s.type === "road")!;
    expect(city.points).toBe(4);
    expect(road.points).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("scoreCompletedCityRoadFeatures — determinism", () => {
  it("scoring the same board built in different tile-placement order yields deep-equal results", () => {
    const boardA = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeTile("BASE-A", { x: 5, y: 0 }, 0)
      .placeTile("BASE-A", { x: 5, y: -1 }, 180)
      .placeMeeple("alice", { x: 0, y: 0 }, "city")
      .build();

    const boardB: BoardState = {
      version: boardA.version,
      tiles: [...boardA.tiles].reverse(),
      meeples: [...boardA.meeples].reverse(),
    };

    const scoresA = scoreCompletedCityRoadFeatures(extractFeatures(boardA, catalog));
    const scoresB = scoreCompletedCityRoadFeatures(extractFeatures(boardB, catalog));

    expect(scoresB).toEqual(scoresA);
  });

  it("does not mutate the input feature list", () => {
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .build();
    const features = extractFeatures(board, catalog);
    const snapshot = JSON.parse(JSON.stringify(features));

    scoreCompletedCityRoadFeatures(features);

    expect(features).toEqual(snapshot);
  });
});
