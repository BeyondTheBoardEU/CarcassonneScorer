import { describe, expect, it } from "vitest";
import {
  addScoreEvent,
  createSession,
  deserializeSession,
  serializeSession,
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

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

describe("serializeSession / deserializeSession — round-trip", () => {
  it("deserializeSession(serializeSession(s)) deep-equals s for a non-trivial session", () => {
    const original = buildNonTrivialSession();
    const json = serializeSession(original);
    const restored = deserializeSession(json);
    expect(restored).toEqual(original);
  });

  it("round-trips a session with an empty event log", () => {
    const original = createSession(makePlayers(2));
    const restored = deserializeSession(serializeSession(original));
    expect(restored).toEqual(original);
  });

  it("round-trips an event without an optional reason", () => {
    let session = createSession(makePlayers(2));
    session = addScoreEvent(session, { playerId: "p0", delta: 3, timestamp: 500 });
    const restored = deserializeSession(serializeSession(session));
    expect(restored).toEqual(session);
    expect(restored.events[0]).not.toHaveProperty("reason");
  });

  it("serializeSession produces valid JSON", () => {
    const session = buildNonTrivialSession();
    const json = serializeSession(session);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Malformed input
// ---------------------------------------------------------------------------

describe("deserializeSession — malformed input", () => {
  it("throws SessionError(malformed-input) on invalid JSON", () => {
    expect(() => deserializeSession("not json")).toThrowError(SessionError);
    try {
      deserializeSession("not json");
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });

  it("throws SessionError(malformed-input) when root is not an object", () => {
    expect(() => deserializeSession(JSON.stringify([1, 2, 3]))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(42));
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });

  it("throws SessionError(malformed-input) when players is missing", () => {
    const bad = { version: SESSION_VERSION, events: [] };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(bad));
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });

  it("throws SessionError(malformed-input) when events is missing", () => {
    const bad = { version: SESSION_VERSION, players: [] };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(bad));
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });

  it("throws SessionError(malformed-input) on a malformed player entry", () => {
    const bad = {
      version: SESSION_VERSION,
      players: [{ id: "p0", name: "Alice" /* missing colourId */ }],
      events: [],
    };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(bad));
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });

  it("throws SessionError(malformed-input) when an event's delta has a bad type", () => {
    const bad = {
      version: SESSION_VERSION,
      players: [{ id: "p0", name: "Alice", colourId: "red" }],
      events: [{ id: "e0", playerId: "p0", delta: "not-a-number", timestamp: 1000 }],
    };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(bad));
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });

  it("throws SessionError(malformed-input) when an event's timestamp has a bad type", () => {
    const bad = {
      version: SESSION_VERSION,
      players: [{ id: "p0", name: "Alice", colourId: "red" }],
      events: [{ id: "e0", playerId: "p0", delta: 5, timestamp: "not-a-number" }],
    };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(bad));
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });

  it("never returns a partial session on malformed input (throws instead)", () => {
    const bad = {
      version: SESSION_VERSION,
      players: [{ id: "p0", name: "Alice", colourId: "red" }],
      events: [{ id: "e0", playerId: "p0", delta: 5 /* missing timestamp */ }],
    };
    let result: GameSession | undefined;
    let threw = false;
    try {
      result = deserializeSession(JSON.stringify(bad));
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Version mismatch
// ---------------------------------------------------------------------------

describe("deserializeSession — version mismatch", () => {
  it("throws SessionError(version-mismatch) for a different version", () => {
    const original = buildNonTrivialSession();
    const payload = { ...original, version: SESSION_VERSION + 1 };
    expect(() => deserializeSession(JSON.stringify(payload))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(payload));
    } catch (e) {
      expect((e as SessionError).kind).toBe("version-mismatch");
    }
  });

  it("throws SessionError(malformed-input) when version is not a number", () => {
    const original = buildNonTrivialSession();
    const payload = { ...original, version: "1" };
    expect(() => deserializeSession(JSON.stringify(payload))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(payload));
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });
});

// ---------------------------------------------------------------------------
// Semantically invalid input (well-typed fields, invalid meaning) — review
// fix: deserializeSession re-validates the same structural invariants
// createSession/addScoreEvent enforce, instead of stopping at field types.
// ---------------------------------------------------------------------------

describe("deserializeSession — semantically invalid input", () => {
  it("throws SessionError(malformed-input) for an unknown colourId", () => {
    const bad = {
      version: SESSION_VERSION,
      players: [
        { id: "p0", name: "Alice", colourId: "red" },
        { id: "p1", name: "Bob", colourId: "purple" },
      ],
      events: [],
    };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(bad));
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });

  it("throws SessionError for too few players", () => {
    const bad = { version: SESSION_VERSION, players: [], events: [] };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    let result: GameSession | undefined;
    let threw = false;
    try {
      result = deserializeSession(JSON.stringify(bad));
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    expect(result).toBeUndefined();
  });

  it("throws SessionError for duplicate player ids", () => {
    const bad = {
      version: SESSION_VERSION,
      players: [
        { id: "p0", name: "Alice", colourId: "red" },
        { id: "p0", name: "Bob", colourId: "blue" },
      ],
      events: [],
    };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    let result: GameSession | undefined;
    let threw = false;
    try {
      result = deserializeSession(JSON.stringify(bad));
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    expect(result).toBeUndefined();
  });

  it("throws SessionError for duplicate colours", () => {
    const bad = {
      version: SESSION_VERSION,
      players: [
        { id: "p0", name: "Alice", colourId: "red" },
        { id: "p1", name: "Bob", colourId: "red" },
      ],
      events: [],
    };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    let result: GameSession | undefined;
    let threw = false;
    try {
      result = deserializeSession(JSON.stringify(bad));
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    expect(result).toBeUndefined();
  });

  it("throws SessionError when an event's playerId names no player", () => {
    const bad = {
      version: SESSION_VERSION,
      players: [
        { id: "p0", name: "Alice", colourId: "red" },
        { id: "p1", name: "Bob", colourId: "blue" },
      ],
      events: [{ id: "e0", playerId: "ghost", delta: 5, timestamp: 1000 }],
    };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    let result: GameSession | undefined;
    let threw = false;
    try {
      result = deserializeSession(JSON.stringify(bad));
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    expect(result).toBeUndefined();
  });

  it("throws SessionError(malformed-input) for duplicate event ids", () => {
    const bad = {
      version: SESSION_VERSION,
      players: [
        { id: "p0", name: "Alice", colourId: "red" },
        { id: "p1", name: "Bob", colourId: "blue" },
      ],
      events: [
        { id: "e0", playerId: "p0", delta: 5, timestamp: 1000 },
        { id: "e0", playerId: "p1", delta: 3, timestamp: 2000 },
      ],
    };
    expect(() => deserializeSession(JSON.stringify(bad))).toThrowError(SessionError);
    try {
      deserializeSession(JSON.stringify(bad));
    } catch (e) {
      expect((e as SessionError).kind).toBe("malformed-input");
    }
  });
});
