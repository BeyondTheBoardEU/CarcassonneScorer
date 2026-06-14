import { describe, it, expect } from "vitest";
import { CORE_READY, coreVersion } from "../src/index.js";

describe("@carcassonne/core smoke test", () => {
  it("exports CORE_READY as true", () => {
    expect(CORE_READY).toBe(true);
  });

  it("coreVersion() returns a non-empty string", () => {
    expect(typeof coreVersion()).toBe("string");
    expect(coreVersion().length).toBeGreaterThan(0);
  });
});
