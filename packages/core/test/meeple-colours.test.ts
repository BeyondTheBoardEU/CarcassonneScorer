import { describe, expect, it } from "vitest";
import {
  getMeepleColour,
  hasMeepleColour,
  MeepleColourError,
  meepleColourIds,
  meepleColours,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Count & coverage
// ---------------------------------------------------------------------------

describe("meepleColours — count & coverage", () => {
  it("has exactly 6 colours", () => {
    expect(meepleColours).toHaveLength(6);
  });

  it("includes red, blue, green, yellow, black, and the documented sixth (gray)", () => {
    const ids = meepleColours.map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining(["red", "blue", "green", "yellow", "black", "gray"]),
    );
  });
});

// ---------------------------------------------------------------------------
// Uniqueness — the accessibility guarantee
// ---------------------------------------------------------------------------

describe("meepleColours — uniqueness", () => {
  it("has unique ids", () => {
    const ids = meepleColours.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has distinct non-colour distinguishers (pattern)", () => {
    const patterns = meepleColours.map((c) => c.pattern);
    expect(new Set(patterns).size).toBe(patterns.length);
  });
});

// ---------------------------------------------------------------------------
// Well-formedness
// ---------------------------------------------------------------------------

describe("meepleColours — well-formed entries", () => {
  it.each(meepleColours.map((c) => [c.id, c] as const))(
    "%s has non-empty id, name, value, and pattern",
    (_id, colour) => {
      expect(colour.id.length).toBeGreaterThan(0);
      expect(colour.name.length).toBeGreaterThan(0);
      expect(colour.value.length).toBeGreaterThan(0);
      expect(colour.pattern.length).toBeGreaterThan(0);
    },
  );
});

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

describe("getMeepleColour", () => {
  it("returns the entry for a known id", () => {
    const red = getMeepleColour("red");
    expect(red.id).toBe("red");
    expect(red.name).toBe("Red");
  });

  it("throws MeepleColourError(unknown-colour-id) for an unknown id", () => {
    expect(() => getMeepleColour("nope")).toThrowError(MeepleColourError);
    try {
      getMeepleColour("nope");
    } catch (e) {
      expect((e as MeepleColourError).kind).toBe("unknown-colour-id");
    }
  });
});

describe("hasMeepleColour", () => {
  it("is true for every known id", () => {
    for (const colour of meepleColours) {
      expect(hasMeepleColour(colour.id)).toBe(true);
    }
  });

  it("is false for an unknown id", () => {
    expect(hasMeepleColour("nope")).toBe(false);
  });
});

describe("meepleColourIds", () => {
  it("matches the ids of meepleColours, in order", () => {
    expect(meepleColourIds).toEqual(meepleColours.map((c) => c.id));
  });
});
