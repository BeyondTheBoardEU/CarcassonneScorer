import { describe, expect, it } from "vitest";
import {
  baseGameCatalog,
  createBoard,
  extractFeatures,
  resolveFeatureOwnership,
  resolveOwnership,
} from "../src/index.js";
import type { FeatureMeeple } from "../src/index.js";

/** Builds a minimal FeatureMeeple; position/segmentId are irrelevant to ownership counting. */
function meeple(playerId: string, kind: FeatureMeeple["kind"] = "follower"): FeatureMeeple {
  return { playerId, kind, position: { x: 0, y: 0 }, segmentId: "city" };
}

describe("resolveOwnership", () => {
  it("empty input -> no owners, topCount 0, empty counts", () => {
    expect(resolveOwnership([])).toEqual({ owners: [], topCount: 0, counts: {} });
  });

  it("single owner, one meeple -> sole owner, topCount 1", () => {
    const result = resolveOwnership([meeple("P1")]);
    expect(result).toEqual({ owners: ["P1"], topCount: 1, counts: { P1: 1 } });
  });

  it("single owner, two meeples -> sole owner, topCount 2", () => {
    const result = resolveOwnership([meeple("P1"), meeple("P1")]);
    expect(result).toEqual({ owners: ["P1"], topCount: 2, counts: { P1: 2 } });
  });

  it("clear majority -> P1x2 beats P2x1", () => {
    const result = resolveOwnership([meeple("P1"), meeple("P2"), meeple("P1")]);
    expect(result.owners).toEqual(["P1"]);
    expect(result.topCount).toBe(2);
    expect(result.counts).toEqual({ P1: 2, P2: 1 });
  });

  it("two-way tie -> both tied top players in owners, sorted", () => {
    const result = resolveOwnership([meeple("P2"), meeple("P1")]);
    expect(result.owners).toEqual(["P1", "P2"]);
    expect(result.topCount).toBe(1);
    expect(result.counts).toEqual({ P1: 1, P2: 1 });
  });

  it("three-way tie -> all three tied top players in owners, sorted", () => {
    const result = resolveOwnership([meeple("P3"), meeple("P1"), meeple("P2")]);
    expect(result.owners).toEqual(["P1", "P2", "P3"]);
    expect(result.topCount).toBe(1);
    expect(result.counts).toEqual({ P1: 1, P2: 1, P3: 1 });
  });

  it("sums multiple meeples per player; lower-count players appear in counts but not owners", () => {
    const result = resolveOwnership([
      meeple("P1"),
      meeple("P2"),
      meeple("P1"),
      meeple("P1"),
      meeple("P3"),
    ]);
    expect(result.owners).toEqual(["P1"]);
    expect(result.topCount).toBe(3);
    expect(result.counts).toEqual({ P1: 3, P2: 1, P3: 1 });
  });

  it("is order-independent: shuffled input matches sorted-input result", () => {
    const sorted = resolveOwnership([meeple("P1"), meeple("P1"), meeple("P2")]);
    const shuffled = resolveOwnership([meeple("P2"), meeple("P1"), meeple("P1")]);
    expect(shuffled).toEqual(sorted);
    expect(shuffled.counts).toEqual({ P1: 2, P2: 1 });
  });

  it("is kind-agnostic: mixing kinds for the same player still counts 1 each", () => {
    const result = resolveOwnership([
      meeple("P1", "follower"),
      meeple("P1", "big-follower"),
      meeple("P2", "follower"),
    ]);
    expect(result.owners).toEqual(["P1"]);
    expect(result.topCount).toBe(2);
    expect(result.counts).toEqual({ P1: 2, P2: 1 });
  });

  it("does not mutate its input array", () => {
    const meeples = [meeple("P1"), meeple("P2")];
    const snapshot = JSON.parse(JSON.stringify(meeples));
    resolveOwnership(meeples);
    expect(meeples).toEqual(snapshot);
  });
});

describe("resolveFeatureOwnership", () => {
  it("agrees with resolveOwnership(feature.meeples) on a real extracted feature", () => {
    const board = createBoard()
      .placeTile("BASE-C", { x: 0, y: 0 }, 0)
      .placeMeeple("P1", { x: 0, y: 0 }, "city", "follower")
      .build();
    const features = extractFeatures(board, baseGameCatalog);
    const city = features.find((f) => f.type === "city")!;

    expect(resolveFeatureOwnership(city)).toEqual(resolveOwnership(city.meeples));
    expect(resolveFeatureOwnership(city)).toEqual({
      owners: ["P1"],
      topCount: 1,
      counts: { P1: 1 },
    });
  });
});
