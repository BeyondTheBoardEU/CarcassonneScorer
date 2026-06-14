import { describe, expect, it } from "vitest";
import {
  BoardStateError,
  BOARD_STATE_VERSION,
  createBoard,
  deserializeBoard,
  neighbor,
  serializeBoard,
} from "../src/index.js";
import type { BoardState } from "../src/index.js";

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe("createBoard — construction", () => {
  it("builds an empty board with the correct version", () => {
    const state = createBoard().build();
    expect(state.version).toBe(BOARD_STATE_VERSION);
    expect(state.tiles).toHaveLength(0);
    expect(state.meeples).toHaveLength(0);
  });

  it("records a single tile placement with correct fields", () => {
    const state = createBoard().placeTile("CARCF", { x: 0, y: 0 }, 0).build();
    expect(state.tiles).toHaveLength(1);
    const tile = state.tiles[0]!;
    expect(tile.tileId).toBe("CARCF");
    expect(tile.position).toEqual({ x: 0, y: 0 });
    expect(tile.rotation).toBe(0);
  });

  it("records multiple tile placements in order", () => {
    const state = createBoard()
      .placeTile("CARCF", { x: 0, y: 0 }, 0)
      .placeTile("CARC-ROAD", { x: 1, y: 0 }, 90)
      .placeTile("CARC-CITY", { x: 0, y: 1 }, 180)
      .build();
    expect(state.tiles).toHaveLength(3);
    expect(state.tiles[1]!.tileId).toBe("CARC-ROAD");
    expect(state.tiles[1]!.rotation).toBe(90);
  });

  it("records a meeple placement with correct fields (default kind=follower)", () => {
    const state = createBoard()
      .placeTile("CARCF", { x: 0, y: 0 }, 0)
      .placeMeeple("alice", { x: 0, y: 0 }, "city-0")
      .build();
    expect(state.meeples).toHaveLength(1);
    const m = state.meeples[0]!;
    expect(m.playerId).toBe("alice");
    expect(m.position).toEqual({ x: 0, y: 0 });
    expect(m.segmentId).toBe("city-0");
    expect(m.kind).toBe("follower");
  });

  it("records an explicit meeple kind", () => {
    const state = createBoard()
      .placeTile("T1", { x: 0, y: 0 }, 0)
      .placeMeeple("bob", { x: 0, y: 0 }, "field-0", "big-follower")
      .build();
    expect(state.meeples[0]!.kind).toBe("big-follower");
  });

  it("supports meeples from multiple players on different tiles", () => {
    const state = createBoard()
      .placeTile("T1", { x: 0, y: 0 }, 0)
      .placeTile("T2", { x: 1, y: 0 }, 0)
      .placeMeeple("alice", { x: 0, y: 0 }, "city-0")
      .placeMeeple("bob", { x: 1, y: 0 }, "road-0")
      .build();
    expect(state.meeples).toHaveLength(2);
    expect(state.meeples[0]!.playerId).toBe("alice");
    expect(state.meeples[1]!.playerId).toBe("bob");
  });

  it("build() returns a fresh snapshot each time", () => {
    const builder = createBoard().placeTile("T1", { x: 0, y: 0 }, 0);
    const s1 = builder.build();
    builder.placeTile("T2", { x: 1, y: 0 }, 0);
    const s2 = builder.build();
    expect(s1.tiles).toHaveLength(1);
    expect(s2.tiles).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Structural guards
// ---------------------------------------------------------------------------

describe("createBoard — structural guards", () => {
  it("throws BoardStateError(duplicate-position) for two tiles at the same position", () => {
    const builder = createBoard().placeTile("T1", { x: 0, y: 0 }, 0);
    expect(() => builder.placeTile("T2", { x: 0, y: 0 }, 90)).toThrowError(BoardStateError);
    try {
      builder.placeTile("T2", { x: 0, y: 0 }, 90);
    } catch (e) {
      expect((e as BoardStateError).kind).toBe("duplicate-position");
    }
  });

  it("throws BoardStateError(meeple-missing-tile) when tile is absent at meeple position", () => {
    const builder = createBoard().placeTile("T1", { x: 0, y: 0 }, 0);
    expect(() => builder.placeMeeple("alice", { x: 5, y: 5 }, "city-0")).toThrowError(
      BoardStateError,
    );
    try {
      builder.placeMeeple("alice", { x: 5, y: 5 }, "city-0");
    } catch (e) {
      expect((e as BoardStateError).kind).toBe("meeple-missing-tile");
    }
  });

  it("accepts a meeple exactly where a tile is placed (different position)", () => {
    expect(() =>
      createBoard()
        .placeTile("T1", { x: 3, y: -2 }, 270)
        .placeMeeple("alice", { x: 3, y: -2 }, "seg-0"),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Serialization round-trip
// ---------------------------------------------------------------------------

describe("serializeBoard / deserializeBoard", () => {
  /** A non-trivial board: 3 tiles, 3 meeples across 2 players, farmer follower. */
  function buildNonTrivialBoard(): BoardState {
    return (
      createBoard()
        .placeTile("CARCF", { x: 0, y: 0 }, 0)
        .placeTile("CARC-ROAD", { x: 1, y: 0 }, 90)
        .placeTile("CARC-CITY", { x: 0, y: 1 }, 180)
        .placeMeeple("alice", { x: 0, y: 0 }, "city-0")
        .placeMeeple("bob", { x: 1, y: 0 }, "road-1")
        // Farmer-style follower on a field segment
        .placeMeeple("alice", { x: 0, y: 1 }, "field-2", "follower")
        .build()
    );
  }

  it("round-trip is deep-equal to the original state", () => {
    const original = buildNonTrivialBoard();
    const roundTripped = deserializeBoard(serializeBoard(original));
    expect(roundTripped).toEqual(original);
  });

  it("serialized output is valid JSON", () => {
    const state = buildNonTrivialBoard();
    const json = serializeBoard(state);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("deserialized board has correct tile count", () => {
    const state = buildNonTrivialBoard();
    const rt = deserializeBoard(serializeBoard(state));
    expect(rt.tiles).toHaveLength(3);
    expect(rt.meeples).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Malformed input rejection
// ---------------------------------------------------------------------------

describe("deserializeBoard — malformed input", () => {
  it("throws BoardStateError(malformed-input) on invalid JSON", () => {
    expect(() => deserializeBoard("{not json")).toThrowError(BoardStateError);
    try {
      deserializeBoard("{not json");
    } catch (e) {
      expect((e as BoardStateError).kind).toBe("malformed-input");
    }
  });

  it("throws on missing version field", () => {
    const bad = JSON.stringify({ tiles: [], meeples: [] });
    expect(() => deserializeBoard(bad)).toThrowError(BoardStateError);
  });

  it("throws on unsupported version number", () => {
    const bad = JSON.stringify({ version: 999, tiles: [], meeples: [] });
    expect(() => deserializeBoard(bad)).toThrowError(BoardStateError);
  });

  it("throws on missing tiles field", () => {
    const bad = JSON.stringify({ version: BOARD_STATE_VERSION, meeples: [] });
    expect(() => deserializeBoard(bad)).toThrowError(BoardStateError);
  });

  it("throws on missing meeples field", () => {
    const bad = JSON.stringify({ version: BOARD_STATE_VERSION, tiles: [] });
    expect(() => deserializeBoard(bad)).toThrowError(BoardStateError);
  });

  it("throws on invalid rotation value (45)", () => {
    const bad = JSON.stringify({
      version: BOARD_STATE_VERSION,
      tiles: [{ tileId: "T1", position: { x: 0, y: 0 }, rotation: 45 }],
      meeples: [],
    });
    expect(() => deserializeBoard(bad)).toThrowError(BoardStateError);
    try {
      deserializeBoard(bad);
    } catch (e) {
      expect((e as BoardStateError).kind).toBe("malformed-input");
    }
  });

  it("throws on tile missing tileId", () => {
    const bad = JSON.stringify({
      version: BOARD_STATE_VERSION,
      tiles: [{ position: { x: 0, y: 0 }, rotation: 0 }],
      meeples: [],
    });
    expect(() => deserializeBoard(bad)).toThrowError(BoardStateError);
  });

  it("throws on meeple missing segmentId", () => {
    const bad = JSON.stringify({
      version: BOARD_STATE_VERSION,
      tiles: [],
      meeples: [{ playerId: "alice", position: { x: 0, y: 0 }, kind: "follower" }],
    });
    expect(() => deserializeBoard(bad)).toThrowError(BoardStateError);
  });

  it("throws when root is a JSON array instead of object", () => {
    expect(() => deserializeBoard("[]")).toThrowError(BoardStateError);
  });

  it("throws when root is a JSON string", () => {
    expect(() => deserializeBoard('"hello"')).toThrowError(BoardStateError);
  });
});

// ---------------------------------------------------------------------------
// Geometry: neighbor()
// ---------------------------------------------------------------------------

describe("neighbor — geometry", () => {
  const origin = { x: 0, y: 0 };

  it("N increases y by 1", () => {
    expect(neighbor(origin, "N")).toEqual({ x: 0, y: 1 });
  });

  it("E increases x by 1", () => {
    expect(neighbor(origin, "E")).toEqual({ x: 1, y: 0 });
  });

  it("S decreases y by 1", () => {
    expect(neighbor(origin, "S")).toEqual({ x: 0, y: -1 });
  });

  it("W decreases x by 1", () => {
    expect(neighbor(origin, "W")).toEqual({ x: -1, y: 0 });
  });

  it("works for non-origin positions", () => {
    expect(neighbor({ x: 3, y: -2 }, "N")).toEqual({ x: 3, y: -1 });
    expect(neighbor({ x: 3, y: -2 }, "W")).toEqual({ x: 2, y: -2 });
  });

  it("applying N then S returns the original position", () => {
    const p = { x: 7, y: -4 };
    expect(neighbor(neighbor(p, "N"), "S")).toEqual(p);
  });
});
