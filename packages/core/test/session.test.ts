import { describe, expect, it } from "vitest";
import {
  addScoreEvent,
  computeTotals,
  createSession,
  SessionError,
  SESSION_VERSION,
} from "../src/index.js";
import type { GameSession, Player } from "../src/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    colourId: `colour-${i}`,
  }));
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe("createSession — construction", () => {
  it("succeeds with 2 players", () => {
    const session = createSession(makePlayers(2));
    expect(session.version).toBe(SESSION_VERSION);
    expect(session.players).toHaveLength(2);
    expect(session.events).toHaveLength(0);
  });

  it("succeeds with 6 players", () => {
    const session = createSession(makePlayers(6));
    expect(session.players).toHaveLength(6);
    expect(session.events).toHaveLength(0);
  });

  it("throws SessionError(player-count) with 1 player", () => {
    expect(() => createSession(makePlayers(1))).toThrowError(SessionError);
    try {
      createSession(makePlayers(1));
    } catch (e) {
      expect((e as SessionError).kind).toBe("player-count");
    }
  });

  it("throws SessionError(player-count) with 7 players", () => {
    expect(() => createSession(makePlayers(7))).toThrowError(SessionError);
    try {
      createSession(makePlayers(7));
    } catch (e) {
      expect((e as SessionError).kind).toBe("player-count");
    }
  });

  it("throws SessionError(duplicate-player-id) when two players share an id", () => {
    const players: Player[] = [
      { id: "p0", name: "Alice", colourId: "red" },
      { id: "p0", name: "Bob", colourId: "blue" },
    ];
    expect(() => createSession(players)).toThrowError(SessionError);
    try {
      createSession(players);
    } catch (e) {
      expect((e as SessionError).kind).toBe("duplicate-player-id");
    }
  });

  it("throws SessionError(duplicate-colour) when two players share a colourId", () => {
    const players: Player[] = [
      { id: "p0", name: "Alice", colourId: "red" },
      { id: "p1", name: "Bob", colourId: "red" },
    ];
    expect(() => createSession(players)).toThrowError(SessionError);
    try {
      createSession(players);
    } catch (e) {
      expect((e as SessionError).kind).toBe("duplicate-colour");
    }
  });
});

// ---------------------------------------------------------------------------
// Append
// ---------------------------------------------------------------------------

describe("addScoreEvent — append", () => {
  it("returns a new session object and leaves the original unmutated", () => {
    const original = createSession(makePlayers(2));
    const updated = addScoreEvent(original, {
      playerId: "p0",
      delta: 5,
      timestamp: 1000,
    });

    expect(updated).not.toBe(original);
    expect(original.events).toHaveLength(0);
    expect(updated.events).toHaveLength(1);
  });

  it("throws SessionError(unknown-player) for a playerId not in the session", () => {
    const session = createSession(makePlayers(2));
    expect(() =>
      addScoreEvent(session, { playerId: "ghost", delta: 1, timestamp: 1000 }),
    ).toThrowError(SessionError);
    try {
      addScoreEvent(session, { playerId: "ghost", delta: 1, timestamp: 1000 });
    } catch (e) {
      expect((e as SessionError).kind).toBe("unknown-player");
    }
  });

  it("accepts a negative delta", () => {
    const session = createSession(makePlayers(2));
    const updated = addScoreEvent(session, {
      playerId: "p0",
      delta: -3,
      timestamp: 1000,
    });
    expect(updated.events[0]!.delta).toBe(-3);
  });

  it("fills an omitted id deterministically from the event count", () => {
    const session = createSession(makePlayers(2));
    const afterOne = addScoreEvent(session, { playerId: "p0", delta: 1, timestamp: 1000 });
    expect(afterOne.events[0]!.id).toBe("event-0");

    const afterTwo = addScoreEvent(afterOne, { playerId: "p1", delta: 2, timestamp: 2000 });
    expect(afterTwo.events[1]!.id).toBe("event-1");
  });

  it("honours a caller-supplied id and timestamp", () => {
    const session = createSession(makePlayers(2));
    const updated = addScoreEvent(session, {
      id: "custom-id",
      playerId: "p0",
      delta: 4,
      timestamp: 12345,
    });
    expect(updated.events[0]!.id).toBe("custom-id");
    expect(updated.events[0]!.timestamp).toBe(12345);
  });

  it("preserves an optional reason", () => {
    const session = createSession(makePlayers(2));
    const updated = addScoreEvent(session, {
      playerId: "p0",
      delta: 4,
      timestamp: 1000,
      reason: "city completion",
    });
    expect(updated.events[0]!.reason).toBe("city completion");
  });
});

// ---------------------------------------------------------------------------
// Tally
// ---------------------------------------------------------------------------

describe("computeTotals — tally", () => {
  it("sums mixed positive/negative events per player", () => {
    let session = createSession(makePlayers(2));
    session = addScoreEvent(session, { playerId: "p0", delta: 10, timestamp: 1 });
    session = addScoreEvent(session, { playerId: "p0", delta: -4, timestamp: 2 });
    session = addScoreEvent(session, { playerId: "p1", delta: 7, timestamp: 3 });

    const totals = computeTotals(session);
    expect(totals).toEqual({ p0: 6, p1: 7 });
  });

  it("includes a player with no events at 0", () => {
    let session = createSession(makePlayers(3));
    session = addScoreEvent(session, { playerId: "p0", delta: 5, timestamp: 1 });

    const totals = computeTotals(session);
    expect(totals).toEqual({ p0: 5, p1: 0, p2: 0 });
  });

  it("sums multiple events for the same player", () => {
    let session = createSession(makePlayers(2));
    session = addScoreEvent(session, { playerId: "p0", delta: 2, timestamp: 1 });
    session = addScoreEvent(session, { playerId: "p0", delta: 3, timestamp: 2 });
    session = addScoreEvent(session, { playerId: "p0", delta: 4, timestamp: 3 });

    const totals = computeTotals(session);
    expect(totals["p0"]).toBe(9);
  });

  it("returns 0 for every player on a freshly created session", () => {
    const session = createSession(makePlayers(2));
    expect(computeTotals(session)).toEqual({ p0: 0, p1: 0 });
  });
});

// ---------------------------------------------------------------------------
// Serialization round-trip
// ---------------------------------------------------------------------------

describe("GameSession — JSON round-trip", () => {
  function buildNonTrivialSession(): GameSession {
    let session = createSession(makePlayers(3));
    session = addScoreEvent(session, {
      playerId: "p0",
      delta: 10,
      timestamp: 1000,
      reason: "city completion",
    });
    session = addScoreEvent(session, { playerId: "p1", delta: -2, timestamp: 2000 });
    session = addScoreEvent(session, {
      playerId: "p2",
      delta: 5,
      timestamp: 3000,
      reason: "monastery",
    });
    return session;
  }

  it("round-trip is deep-equal to the original session", () => {
    const original = buildNonTrivialSession();
    const roundTripped = JSON.parse(JSON.stringify(original));
    expect(roundTripped).toEqual(original);
  });

  it("serialized output is valid JSON", () => {
    const session = buildNonTrivialSession();
    const json = JSON.stringify(session);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
