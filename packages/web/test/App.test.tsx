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

  it("shows the setup view when no game is in progress", () => {
    render(<App />);
    expect(screen.getByTestId("setup-view")).toBeDefined();
  });

  it("routes setup -> play when a game is started", () => {
    render(<App />);

    // Item 015's real setup form: the default 2 rows have distinct
    // pre-assigned colours and fall back to "Player N" names, so submitting
    // immediately is enough to drive the setup -> play transition here;
    // the setup view's own test suite covers the form's details.
    fireEvent.click(screen.getByTestId("start-game"));

    expect(screen.getByTestId("play-view")).toBeDefined();
    expect(screen.queryByTestId("setup-view")).toBeNull();
  });

  it("routes play -> setup when newGame is invoked", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("start-game"));
    expect(screen.getByTestId("play-view")).toBeDefined();

    fireEvent.click(screen.getByTestId("new-game"));
    expect(screen.getByTestId("setup-view")).toBeDefined();
    expect(screen.queryByTestId("play-view")).toBeNull();
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
    expect(screen.getByTestId("scoreboard-total-p1").textContent).toBe("0");
  });
});
