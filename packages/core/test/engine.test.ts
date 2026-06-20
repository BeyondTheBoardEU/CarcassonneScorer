import { describe, expect, it } from "vitest";
import {
  createBoard,
  extractFeatures,
  baseGameCatalog,
  scoreMonastery,
  scoreBoard,
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

/** Surrounds (0,0) with BASE-B tiles at all 8 neighbour offsets (8/8 -> completed monastery). */
const ALL_OFFSETS = [
  { x: -1, y: 1 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];

// ---------------------------------------------------------------------------
// scoreMonastery — completed monastery
// ---------------------------------------------------------------------------

describe("scoreMonastery — completed monastery", () => {
  it("a cloister tile with all 8 neighbours present and a monk scores a flat 9 points", () => {
    const builder = createBoard()
      .placeTile("BASE-B", { x: 0, y: 0 }, 0)
      .placeMeeple("alice", { x: 0, y: 0 }, "mon", "monk");
    for (const o of ALL_OFFSETS) {
      builder.placeTile("BASE-B", { x: o.x, y: o.y }, 0);
    }
    const board = builder.build();
    const features = extractFeatures(board, catalog);
    const monastery = featureFor(features, "monastery", { x: 0, y: 0 }, "mon");

    expect(monastery.completed).toBe(true);

    const score = scoreMonastery(monastery);
    expect(score).toEqual({
      type: "monastery",
      completed: true,
      points: 9,
      players: ["alice"],
      tileCount: 1,
      pennants: 0,
      tilePositions: [{ x: 0, y: 0 }],
    });
  });

  it("a completed monastery with no meeple yields players: [] and still scores 9 in the entry", () => {
    const builder = createBoard().placeTile("BASE-B", { x: 0, y: 0 }, 0);
    for (const o of ALL_OFFSETS) {
      builder.placeTile("BASE-B", { x: o.x, y: o.y }, 0);
    }
    const board = builder.build();
    const features = extractFeatures(board, catalog);
    const monastery = featureFor(features, "monastery", { x: 0, y: 0 }, "mon");

    expect(monastery.completed).toBe(true);

    const score = scoreMonastery(monastery);
    expect(score.points).toBe(9);
    expect(score.players).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// scoreBoard — completed monastery
// ---------------------------------------------------------------------------

describe("scoreBoard — completed monastery", () => {
  it("a completed monastery with a monk credits that player 9 points via scoreBoard", () => {
    const builder = createBoard()
      .placeTile("BASE-B", { x: 0, y: 0 }, 0)
      .placeMeeple("alice", { x: 0, y: 0 }, "mon", "monk");
    for (const o of ALL_OFFSETS) {
      builder.placeTile("BASE-B", { x: o.x, y: o.y }, 0);
    }
    const board = builder.build();

    const result = scoreBoard(board, catalog);
    const monasteryScore = result.features.find((f) => f.type === "monastery")!;
    expect(monasteryScore.points).toBe(9);
    expect(monasteryScore.players).toEqual(["alice"]);
    expect(result.playerTotals).toEqual({ alice: 9 });
  });

  it("an incomplete monastery (7 of 8 neighbours) is excluded from features and contributes 0", () => {
    const builder = createBoard()
      .placeTile("BASE-B", { x: 0, y: 0 }, 0)
      .placeMeeple("alice", { x: 0, y: 0 }, "mon", "monk");
    const sevenOffsets = ALL_OFFSETS.slice(0, 7); // omit the 8th neighbour
    for (const o of sevenOffsets) {
      builder.placeTile("BASE-B", { x: o.x, y: o.y }, 0);
    }
    const board = builder.build();

    const result = scoreBoard(board, catalog);
    expect(result.features.some((f) => f.type === "monastery")).toBe(false);
    expect(result.playerTotals).toEqual({});
  });

  it("a completed monastery with no meeple contributes 0 to all totals", () => {
    const builder = createBoard().placeTile("BASE-B", { x: 0, y: 0 }, 0);
    for (const o of ALL_OFFSETS) {
      builder.placeTile("BASE-B", { x: o.x, y: o.y }, 0);
    }
    const board = builder.build();

    const result = scoreBoard(board, catalog);
    const monasteryScore = result.features.find((f) => f.type === "monastery")!;
    expect(monasteryScore.points).toBe(9);
    expect(monasteryScore.players).toEqual([]);
    expect(result.playerTotals).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// scoreBoard — mixed board (city + road + monastery, >=2 players)
// ---------------------------------------------------------------------------

describe("scoreBoard — mixed board", () => {
  function buildMixedBoard(): BoardState {
    const builder = createBoard()
      // Completed city: two BASE-E tiles cap-to-cap (4 points), owned by alice.
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeMeeple("alice", { x: 0, y: 0 }, "city")
      // Completed road: two BASE-A tiles cap-to-cap (2 points), owned by bob.
      .placeTile("BASE-A", { x: 5, y: 0 }, 0)
      .placeTile("BASE-A", { x: 5, y: -1 }, 180)
      .placeMeeple("bob", { x: 5, y: 0 }, "road")
      // Completed monastery (9 points), owned by alice, far from everything else.
      .placeTile("BASE-B", { x: 20, y: 0 }, 0)
      .placeMeeple("alice", { x: 20, y: 0 }, "mon", "monk")
      // Incomplete feature: an isolated open city, owned by carol (not scored).
      .placeTile("BASE-C", { x: 40, y: 0 }, 0)
      .placeMeeple("carol", { x: 40, y: 0 }, "city");

    for (const o of ALL_OFFSETS) {
      builder.placeTile("BASE-B", { x: 20 + o.x, y: o.y }, 0);
    }

    return builder.build();
  }

  it("returns exactly the completed features (city, road, monastery) and correct per-player totals", () => {
    const board = buildMixedBoard();
    const result = scoreBoard(board, catalog);

    expect(result.features).toHaveLength(3);

    const city = result.features.find((f) => f.type === "city")!;
    const road = result.features.find((f) => f.type === "road")!;
    const monastery = result.features.find((f) => f.type === "monastery")!;

    expect(city.points).toBe(4);
    expect(city.players).toEqual(["alice"]);
    expect(road.points).toBe(2);
    expect(road.players).toEqual(["bob"]);
    expect(monastery.points).toBe(9);
    expect(monastery.players).toEqual(["alice"]);

    // The incomplete BASE-C city (carol) must not appear at all.
    expect(result.features.some((f) => f.players.includes("carol"))).toBe(false);

    expect(result.playerTotals).toEqual({
      alice: 4 + 9, // city + monastery
      bob: 2, // road
    });
  });
});

// ---------------------------------------------------------------------------
// scoreBoard — ties flow through to totals
// ---------------------------------------------------------------------------

describe("scoreBoard — tie through totals", () => {
  it("a contested completed city credits each tied player the full feature value in playerTotals", () => {
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeMeeple("bob", { x: 0, y: 0 }, "city")
      .placeMeeple("alice", { x: 0, y: 1 }, "city")
      .build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const city = result.features[0]!;
    expect(city.points).toBe(4);
    expect(city.players).toEqual(["alice", "bob"]);

    expect(result.playerTotals).toEqual({ alice: 4, bob: 4 });
  });
});

// ---------------------------------------------------------------------------
// scoreBoard — determinism
// ---------------------------------------------------------------------------

describe("scoreBoard — determinism", () => {
  it("scoring the same board built in different tile-placement order yields deep-equal results", () => {
    const boardA = buildMixedReference();
    const boardB: BoardState = {
      version: boardA.version,
      tiles: [...boardA.tiles].reverse(),
      meeples: [...boardA.meeples].reverse(),
    };

    const resultA = scoreBoard(boardA, catalog);
    const resultB = scoreBoard(boardB, catalog);

    expect(resultB).toEqual(resultA);
  });

  function buildMixedReference(): BoardState {
    const builder = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeMeeple("alice", { x: 0, y: 0 }, "city")
      .placeTile("BASE-A", { x: 5, y: 0 }, 0)
      .placeTile("BASE-A", { x: 5, y: -1 }, 180)
      .placeMeeple("bob", { x: 5, y: 0 }, "road")
      .placeTile("BASE-B", { x: 20, y: 0 }, 0)
      .placeMeeple("alice", { x: 20, y: 0 }, "mon", "monk");

    for (const o of ALL_OFFSETS) {
      builder.placeTile("BASE-B", { x: 20 + o.x, y: o.y }, 0);
    }

    return builder.build();
  }
});

// ---------------------------------------------------------------------------
// scoreBoard — empty board
// ---------------------------------------------------------------------------

describe("scoreBoard — empty board", () => {
  it("an empty board returns { features: [], playerTotals: {} }", () => {
    const board = createBoard().build();
    const result = scoreBoard(board, catalog);
    expect(result).toEqual({ features: [], playerTotals: {} });
  });
});
