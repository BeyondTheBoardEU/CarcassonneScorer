import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { App } from "../src/App.js";

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the app shell heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Carcassonne Scorer" })).toBeDefined();
  });

  it("renders the core wiring proof (CORE_READY / coreVersion)", () => {
    render(<App />);
    const status = screen.getByTestId("core-status");
    expect(status.textContent).toContain("Core ready: yes");
    expect(status.textContent).toMatch(/v\d+\.\d+\.\d+/);
  });
});
