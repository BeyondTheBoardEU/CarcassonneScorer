import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { GameSession } from "@carcassonne/core";
import { GameProvider, useGame } from "../src/state/index.js";
import { Scoreboard } from "../src/scoreboard/index.js";

/**
 * Thin harness exposing `addScore`/`newGame` via DOM buttons alongside the
 * `Scoreboard`, so reactivity can be driven without the real score-entry UI
 * (Item 017), which this item deliberately does not build.
 */
function Harness(): JSX.Element {
  const { addScore } = useGame();
  return (
    <div>
      <Scoreboard />
      <button data-testid="harness-add-p1" onClick={() => addScore("p1", 5)}>
        +5 to p1
      </button>
    </div>
  );
}

function renderScoreboard(session: GameSession): void {
  render(
    <GameProvider initialSession={session}>
      <Harness />
    </GameProvider>,
  );
}

const seededSession: GameSession = {
  version: 1,
  players: [
    { id: "p1", name: "Alice", colourId: "red" },
    { id: "p2", name: "Bob", colourId: "blue" },
    { id: "p3", name: "Cara", colourId: "green" },
  ],
  events: [
    { id: "e1", playerId: "p1", delta: 5, timestamp: 0 },
    { id: "e2", playerId: "p1", delta: 3, timestamp: 1 },
    { id: "e3", playerId: "p2", delta: -2, timestamp: 2 },
  ],
};

describe("Scoreboard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders every player in session.players with their name and a colour cue", () => {
    renderScoreboard(seededSession);

    expect(screen.getByTestId("scoreboard-name-p1").textContent).toBe("Alice");
    expect(screen.getByTestId("scoreboard-name-p2").textContent).toBe("Bob");
    expect(screen.getByTestId("scoreboard-name-p3").textContent).toBe("Cara");

    // Colour cue is non-colour text (name + pattern), not colour alone.
    expect(screen.getByTestId("scoreboard-colour-p1").textContent).toBe("(Red, solid)");
    expect(screen.getByTestId("scoreboard-colour-p2").textContent).toBe("(Blue, stripes)");
    expect(screen.getByTestId("scoreboard-colour-p3").textContent).toBe("(Green, dots)");
  });

  it("shows the meeple colour swatch alongside the textual cue", () => {
    renderScoreboard(seededSession);

    const swatch = screen.getByTestId("scoreboard-swatch-p1");
    expect(swatch.style.backgroundColor.length).toBeGreaterThan(0);
  });

  it("displays totals computed by the core (computeTotals via useGame), not summed here", () => {
    renderScoreboard(seededSession);

    // P1: +5, +3 -> 8. P2: -2. P3: no events -> 0.
    expect(screen.getByTestId("scoreboard-total-p1").textContent).toBe("8");
    expect(screen.getByTestId("scoreboard-total-p2").textContent).toBe("-2");
    expect(screen.getByTestId("scoreboard-total-p3").textContent).toBe("0");
  });

  it("exposes an accessible label combining name, colour, and points as text", () => {
    renderScoreboard(seededSession);

    const row = screen.getByTestId("scoreboard-row-p1");
    expect(row.getAttribute("aria-label")).toBe("Alice (Red): 8 points");
  });

  it("updates the displayed total when the store's session changes (addScore)", () => {
    renderScoreboard(seededSession);

    expect(screen.getByTestId("scoreboard-total-p1").textContent).toBe("8");

    fireEvent.click(screen.getByTestId("harness-add-p1"));

    expect(screen.getByTestId("scoreboard-total-p1").textContent).toBe("13");
  });

  it("lists players in session order", () => {
    renderScoreboard(seededSession);

    const rows = screen.getAllByTestId(/^scoreboard-row-/);
    const ids = rows.map((row) => row.getAttribute("data-testid"));
    expect(ids).toEqual(["scoreboard-row-p1", "scoreboard-row-p2", "scoreboard-row-p3"]);
  });
});
