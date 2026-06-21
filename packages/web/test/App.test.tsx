import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../src/App.js";
import type { GameSession } from "@carcassonne/core";

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

  it("shows the setup placeholder when no game is in progress", () => {
    render(<App />);
    expect(screen.getByTestId("setup-view")).toBeDefined();
  });

  it("routes setup -> play when a game is started", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("start-demo-game"));

    expect(screen.getByTestId("play-view")).toBeDefined();
    expect(screen.queryByTestId("setup-view")).toBeNull();
  });

  it("routes play -> setup when newGame is invoked", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("start-demo-game"));
    expect(screen.getByTestId("play-view")).toBeDefined();

    fireEvent.click(screen.getByTestId("new-game"));
    expect(screen.getByTestId("setup-view")).toBeDefined();
    expect(screen.queryByTestId("play-view")).toBeNull();
  });

  it("surfaces a SessionError from an invalid startGame without crashing", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("start-invalid-game"));

    expect(screen.getByTestId("setup-error").textContent).toMatch(/player/i);
    // Still on the setup view — the app did not crash or route to play.
    expect(screen.getByTestId("setup-view")).toBeDefined();
  });

  it("seeds straight into the play view via the initialSession hydrate seam", () => {
    const seeded: GameSession = {
      version: 1,
      players: [{ id: "p1", name: "Seeded Player", colourId: "red" }],
      events: [],
    };

    render(<App initialSession={seeded} />);

    expect(screen.getByTestId("play-view")).toBeDefined();
    expect(screen.queryByTestId("setup-view")).toBeNull();
    expect(screen.getByTestId("total-p1").textContent).toContain("0");
  });
});
