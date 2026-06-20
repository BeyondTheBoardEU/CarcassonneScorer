/**
 * Canonical base-game scoring scenario suite (Item 010).
 *
 * Drives the public engine end to end via `scoreBoard(board, baseGameCatalog)`
 * and asserts exact `BoardScore` output (per-feature `points`/`players` and
 * the aggregated `playerTotals`) for the 14 canonical scenarios required by
 * the Item 010 spec. This is the regression safety net for Stage 1: every
 * case is a small, named, hand-authored board built with `createBoard()` +
 * `baseGameCatalog`, reusing the closed-feature fixture patterns already
 * proven in `feature-extraction.test.ts`, `city-road-scoring.test.ts`, and
 * `engine.test.ts` (cap-to-cap closed cities, dead-end-to-dead-end closed
 * roads, monasteries surrounded by all 8 neighbours).
 *
 * Test-only: no production code is exercised beyond the public API
 * (`createBoard`, `baseGameCatalog`, `scoreBoard`). No engine bug was found
 * while authoring this suite, so no engine module is touched.
 */
import { describe, expect, it } from "vitest";
import { createBoard, baseGameCatalog, scoreBoard } from "../src/index.js";
import type { BoardState, BoardScore, FeatureScore } from "../src/index.js";

const catalog = baseGameCatalog;

/** Surrounds `(center)` with BASE-B tiles at all 8 neighbour offsets (-> completed monastery). */
const ALL_OFFSETS: readonly { x: number; y: number }[] = [
  { x: -1, y: 1 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];

/** Finds the unique score entry of `type` whose `tilePositions` includes `position`. */
function scoreAt(
  result: BoardScore,
  type: FeatureScore["type"],
  position: { x: number; y: number },
): FeatureScore {
  const found = result.features.find(
    (f) => f.type === type && f.tilePositions.some((p) => p.x === position.x && p.y === position.y),
  );
  if (found === undefined) {
    throw new Error(`No ${type} score entry found containing (${position.x},${position.y})`);
  }
  return found;
}

// ---------------------------------------------------------------------------
// 1. Single-owner completed city
// ---------------------------------------------------------------------------

describe("single-owner completed city", () => {
  it("a closed 2-tile city (no pennant) owned by one player scores 2*tiles to that player", () => {
    // BASE-E cap-to-cap: city cap faces N on (0,0), cap faces S on (0,1) ->
    // no open side anywhere in the joined city -> completed, 2 tiles, 0 pennants.
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeMeeple("alice", { x: 0, y: 0 }, "city")
      .build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const city = result.features[0]!;
    expect(city.type).toBe("city");
    expect(city.points).toBe(4); // 2 * 2 tiles + 2 * 0 pennants
    expect(city.players).toEqual(["alice"]);
    expect(result.playerTotals).toEqual({ alice: 4 });
  });
});

// ---------------------------------------------------------------------------
// 2. Single-owner completed city with pennant
// ---------------------------------------------------------------------------

describe("single-owner completed city with pennant", () => {
  it("a closed city including one pennant tile scores 2*tiles + 2*pennants to its owner", () => {
    // BASE-F (city N+S through, pennant) capped on both ends by BASE-E caps:
    // 3-tile closed city, exactly 1 pennant.
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: -1 }, 0) // cap faces N into BASE-F's S side
      .placeTile("BASE-F", { x: 0, y: 0 }, 0) // city N+S, pennant
      .placeTile("BASE-E", { x: 0, y: 1 }, 180) // cap faces S into BASE-F's N side
      .placeMeeple("bob", { x: 0, y: 0 }, "city")
      .build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const city = result.features[0]!;
    expect(city.points).toBe(2 * 3 + 2 * 1); // 8
    expect(city.players).toEqual(["bob"]);
    expect(result.playerTotals).toEqual({ bob: 8 });
  });
});

// ---------------------------------------------------------------------------
// 3. Multi-pennant city
// ---------------------------------------------------------------------------

describe("multi-pennant city", () => {
  it("a closed city containing two pennant tiles sums both pennant bonuses", () => {
    // BASE-C (whole-tile city, all 4 sides, pennant) closed on its N, E, S, W
    // sides each by a BASE-F (city N+S through, pennant) capped further by a
    // plain BASE-E cap -- but a simpler closed multi-pennant city: two BASE-C
    // tiles cannot directly touch cap-to-cap (each side is fully city on all
    // 4 sides, so adjacency would just keep extending the open boundary).
    // Instead: BASE-C's N side (pennant) closed by a BASE-F (pennant) whose
    // S side faces BASE-C's N, and BASE-F's N side closed by a plain BASE-E
    // cap. The remaining 3 open sides of BASE-C (E, S, W) must each be capped
    // too for completion -- use plain BASE-E caps on all three.
    const board = createBoard()
      .placeTile("BASE-C", { x: 0, y: 0 }, 0) // city all 4 sides, pennant
      .placeTile("BASE-F", { x: 0, y: 1 }, 180) // city N+S through, pennant; S cap faces BASE-C's N
      .placeTile("BASE-E", { x: 0, y: 2 }, 180) // plain cap closes BASE-F's N side
      .placeTile("BASE-E", { x: 1, y: 0 }, 270) // plain cap closes BASE-C's E side
      .placeTile("BASE-E", { x: 0, y: -1 }, 0) // plain cap closes BASE-C's S side
      .placeTile("BASE-E", { x: -1, y: 0 }, 90) // plain cap closes BASE-C's W side
      .placeMeeple("carol", { x: 0, y: 0 }, "city")
      .build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const city = result.features[0]!;
    expect(city.points).toBe(2 * 6 + 2 * 2); // 6 tiles, 2 pennants -> 16
    expect(city.players).toEqual(["carol"]);
    expect(result.playerTotals).toEqual({ carol: 16 });
  });
});

// ---------------------------------------------------------------------------
// 4. Single-owner completed road
// ---------------------------------------------------------------------------

describe("single-owner completed road", () => {
  it("a road closed at both ends (2 tiles) scores 1*tiles to its owner", () => {
    // BASE-A road dead-ends closing each other (proven engine.test.ts / city-road-scoring.test.ts fixture).
    const board = createBoard()
      .placeTile("BASE-A", { x: 0, y: 0 }, 0) // road exits S
      .placeTile("BASE-A", { x: 0, y: -1 }, 180) // road exits N, faces back up
      .placeMeeple("dave", { x: 0, y: 0 }, "road")
      .build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const road = result.features[0]!;
    expect(road.type).toBe("road");
    expect(road.points).toBe(2);
    expect(road.players).toEqual(["dave"]);
    expect(result.playerTotals).toEqual({ dave: 2 });
  });
});

// ---------------------------------------------------------------------------
// 5. Single-owner completed monastery
// ---------------------------------------------------------------------------

describe("single-owner completed monastery", () => {
  it("a cloister with all 8 neighbours and one monk scores a flat 9 to its owner", () => {
    const builder = createBoard()
      .placeTile("BASE-B", { x: 0, y: 0 }, 0)
      .placeMeeple("eve", { x: 0, y: 0 }, "mon", "monk");
    for (const o of ALL_OFFSETS) {
      builder.placeTile("BASE-B", { x: o.x, y: o.y }, 0);
    }
    const board = builder.build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const monastery = result.features[0]!;
    expect(monastery.type).toBe("monastery");
    expect(monastery.points).toBe(9);
    expect(monastery.players).toEqual(["eve"]);
    expect(result.playerTotals).toEqual({ eve: 9 });
  });
});

// ---------------------------------------------------------------------------
// 6. Contested feature, clear majority
// ---------------------------------------------------------------------------

describe("contested feature with a clear majority", () => {
  it("a player with 2 meeples beats a player with 1 on a completed city: majority scores in full, the other 0", () => {
    // BASE-F (city N+S through, pennant) capped both ends; 3 tiles. Frank
    // places 2 followers on the city's segments, Grace places 1.
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: -1 }, 0)
      .placeTile("BASE-F", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeMeeple("frank", { x: 0, y: -1 }, "city")
      .placeMeeple("frank", { x: 0, y: 1 }, "city")
      .placeMeeple("grace", { x: 0, y: 0 }, "city")
      .build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const city = result.features[0]!;
    expect(city.points).toBe(2 * 3 + 2 * 1); // 8
    expect(city.players).toEqual(["frank"]);
    expect(result.playerTotals).toEqual({ frank: 8 });
    expect(result.playerTotals.grace).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Two-way tie
// ---------------------------------------------------------------------------

describe("two-way tie on a completed feature", () => {
  it("equal meeples on a completed city credits both players the full feature value", () => {
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
    expect(city.players).toEqual(["alice", "bob"]); // sorted, both credited
    expect(result.playerTotals).toEqual({ alice: 4, bob: 4 });
  });
});

// ---------------------------------------------------------------------------
// 8. Three-way tie
// ---------------------------------------------------------------------------

describe("three-way tie on a completed feature", () => {
  it("three players with equal meeples on a completed road all score the full feature value", () => {
    // A 3-tile road: BASE-A road S, BASE-U road N/S (middle straight tile),
    // BASE-A road N (rotated 180) closing the other end. Each player places
    // one follower on a distinct tile of the same road feature.
    const board = createBoard()
      .placeTile("BASE-A", { x: 0, y: 0 }, 0) // road exits S
      .placeTile("BASE-U", { x: 0, y: -1 }, 0) // road N/S straight through
      .placeTile("BASE-A", { x: 0, y: -2 }, 180) // road exits N, closes the other dead end
      .placeMeeple("p1", { x: 0, y: 0 }, "road")
      .placeMeeple("p2", { x: 0, y: -1 }, "road")
      .placeMeeple("p3", { x: 0, y: -2 }, "road")
      .build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const road = result.features[0]!;
    expect(road.type).toBe("road");
    expect(road.points).toBe(3); // 1 * 3 tiles
    expect(road.players).toEqual(["p1", "p2", "p3"]); // sorted, all three credited
    expect(result.playerTotals).toEqual({ p1: 3, p2: 3, p3: 3 });
  });
});

// ---------------------------------------------------------------------------
// 9. Large feature spanning many tiles
// ---------------------------------------------------------------------------

describe("large feature spanning many tiles", () => {
  it("a 6-tile closed road chain scores exactly 1 point per tile with no off-by-one", () => {
    // Chain of BASE-U (road N/S straight) tiles, closed at both ends with
    // BASE-A road caps (dead end faces into the chain).
    const board = createBoard()
      .placeTile("BASE-A", { x: 0, y: 0 }, 0) // road exits S (south end cap)
      .placeTile("BASE-U", { x: 0, y: -1 }, 0)
      .placeTile("BASE-U", { x: 0, y: -2 }, 0)
      .placeTile("BASE-U", { x: 0, y: -3 }, 0)
      .placeTile("BASE-U", { x: 0, y: -4 }, 0)
      .placeTile("BASE-A", { x: 0, y: -5 }, 180) // road exits N (north end cap)
      .placeMeeple("helen", { x: 0, y: -2 }, "road")
      .build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const road = result.features[0]!;
    expect(road.type).toBe("road");
    expect(road.tileCount).toBe(6);
    expect(road.points).toBe(6);
    expect(road.players).toEqual(["helen"]);
    expect(result.playerTotals).toEqual({ helen: 6 });
  });
});

// ---------------------------------------------------------------------------
// 10. Two separate features of the same type
// ---------------------------------------------------------------------------

describe("two separate features of the same type", () => {
  it("two distinct completed roads on one board produce two score entries and aggregate per-player totals", () => {
    const board = createBoard()
      // Road loop 1 at x=0, owned by ivan.
      .placeTile("BASE-A", { x: 0, y: 0 }, 0)
      .placeTile("BASE-A", { x: 0, y: -1 }, 180)
      .placeMeeple("ivan", { x: 0, y: 0 }, "road")
      // Road loop 2 at x=5 (far enough away to never touch loop 1), owned by ivan too.
      .placeTile("BASE-A", { x: 5, y: 0 }, 0)
      .placeTile("BASE-A", { x: 5, y: -1 }, 180)
      .placeMeeple("ivan", { x: 5, y: 0 }, "road")
      .build();

    const result = scoreBoard(board, catalog);
    const roadScores = result.features.filter((f) => f.type === "road");
    expect(roadScores).toHaveLength(2);
    for (const r of roadScores) {
      expect(r.points).toBe(2);
      expect(r.players).toEqual(["ivan"]);
    }
    // Per-player totals aggregate across both independent features.
    expect(result.playerTotals).toEqual({ ivan: 4 });
  });
});

// ---------------------------------------------------------------------------
// 11. Fully completed mixed board
// ---------------------------------------------------------------------------

describe("fully completed mixed board", () => {
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
      .placeMeeple("alice", { x: 20, y: 0 }, "mon", "monk");
    for (const o of ALL_OFFSETS) {
      builder.placeTile("BASE-B", { x: 20 + o.x, y: o.y }, 0);
    }
    return builder.build();
  }

  it("a city + a road + a monastery with two players' meeples scores all three features and totals correctly", () => {
    const board = buildMixedBoard();
    const result = scoreBoard(board, catalog);

    expect(result.features).toHaveLength(3);

    const city = scoreAt(result, "city", { x: 0, y: 0 });
    const road = scoreAt(result, "road", { x: 5, y: 0 });
    const monastery = scoreAt(result, "monastery", { x: 20, y: 0 });

    expect(city.points).toBe(4);
    expect(city.players).toEqual(["alice"]);
    expect(road.points).toBe(2);
    expect(road.players).toEqual(["bob"]);
    expect(monastery.points).toBe(9);
    expect(monastery.players).toEqual(["alice"]);

    expect(result.playerTotals).toEqual({
      alice: 4 + 9, // city + monastery
      bob: 2, // road
    });
  });

  it("scoring the same mixed board built in reverse tile/meeple order yields a deep-equal BoardScore", () => {
    const boardA = buildMixedBoard();
    const boardB: BoardState = {
      version: boardA.version,
      tiles: [...boardA.tiles].reverse(),
      meeples: [...boardA.meeples].reverse(),
    };

    const resultA = scoreBoard(boardA, catalog);
    const resultB = scoreBoard(boardB, catalog);

    expect(resultB).toEqual(resultA);
  });
});

// ---------------------------------------------------------------------------
// 12. Unowned completed feature
// ---------------------------------------------------------------------------

describe("unowned completed feature", () => {
  it("a completed city with no meeple is worth its points but credited to nobody", () => {
    const board = createBoard()
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .build();

    const result = scoreBoard(board, catalog);
    expect(result.features).toHaveLength(1);
    const city = result.features[0]!;
    expect(city.points).toBe(4);
    expect(city.players).toEqual([]);
    expect(result.playerTotals).toEqual({});
  });

  it("a completed monastery with no meeple is worth 9 but credited to nobody", () => {
    const builder = createBoard().placeTile("BASE-B", { x: 0, y: 0 }, 0);
    for (const o of ALL_OFFSETS) {
      builder.placeTile("BASE-B", { x: o.x, y: o.y }, 0);
    }
    const board = builder.build();

    const result = scoreBoard(board, catalog);
    const monastery = result.features.find((f) => f.type === "monastery")!;
    expect(monastery.points).toBe(9);
    expect(monastery.players).toEqual([]);
    expect(result.playerTotals).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// 13. Incomplete features excluded
// ---------------------------------------------------------------------------

describe("incomplete features are excluded", () => {
  it("an open city, an open road, and a 7-neighbour monastery contribute nothing alongside completed features", () => {
    const builder = createBoard()
      // Completed city: scores.
      .placeTile("BASE-E", { x: 0, y: 0 }, 0)
      .placeTile("BASE-E", { x: 0, y: 1 }, 180)
      .placeMeeple("alice", { x: 0, y: 0 }, "city")
      // Open (incomplete) city: must NOT score, even with a meeple.
      .placeTile("BASE-C", { x: 40, y: 0 }, 0)
      .placeMeeple("carol", { x: 40, y: 0 }, "city")
      // Open (incomplete) road: single dead-ended BASE-A, must NOT score.
      .placeTile("BASE-A", { x: 60, y: 0 }, 0)
      .placeMeeple("dave", { x: 60, y: 0 }, "road")
      // Incomplete monastery: only 7 of 8 neighbours, must NOT score.
      .placeTile("BASE-B", { x: 80, y: 0 }, 0)
      .placeMeeple("eve", { x: 80, y: 0 }, "mon", "monk");
    const sevenOffsets = ALL_OFFSETS.slice(0, 7); // omit the 8th neighbour
    for (const o of sevenOffsets) {
      builder.placeTile("BASE-B", { x: 80 + o.x, y: o.y }, 0);
    }
    const board = builder.build();

    const result = scoreBoard(board, catalog);
    // Only the one completed city is present.
    expect(result.features).toHaveLength(1);
    expect(result.features[0]!.type).toBe("city");

    // None of the incomplete-feature owners are credited anywhere.
    expect(result.playerTotals).toEqual({ alice: 4 });
    expect(result.playerTotals.carol).toBeUndefined();
    expect(result.playerTotals.dave).toBeUndefined();
    expect(result.playerTotals.eve).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 14. Empty board
// ---------------------------------------------------------------------------

describe("empty board", () => {
  it("scoreBoard on an empty board returns { features: [], playerTotals: {} }", () => {
    const board = createBoard().build();
    const result = scoreBoard(board, catalog);
    expect(result).toEqual({ features: [], playerTotals: {} });
  });
});
