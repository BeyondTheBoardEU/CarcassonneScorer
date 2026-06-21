import { describe, it, expect, afterEach } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SessionError } from "@carcassonne/core";
import type { GameSession, Player } from "@carcassonne/core";
import { GameProvider, useGame } from "../src/state/index.js";

/**
 * Test harness that exposes `useGame()`'s API through DOM buttons/text so
 * RTL can drive and assert on the store without needing the real Stage 2
 * UI (Items 015-018), which this item deliberately does not build.
 */
function Harness(): JSX.Element {
  const { session, totals, startGame, addScore, newGame } = useGame();
  const [startError, setStartError] = useState<string | null>(null);
  const players: Player[] = [
    { id: "p1", name: "Alice", colourId: "red" },
    { id: "p2", name: "Bob", colourId: "blue" },
  ];

  function handleStart(roster: readonly Player[]): void {
    try {
      startGame(roster);
      setStartError(null);
    } catch (err) {
      setStartError(err instanceof SessionError ? err.kind : "unknown");
    }
  }

  return (
    <div>
      <p data-testid="harness-view">{session ? "play" : "setup"}</p>
      <p data-testid="harness-total-p1">{totals["p1"] ?? "none"}</p>
      <p data-testid="harness-error">{startError ?? ""}</p>
      <button data-testid="harness-start" onClick={() => handleStart(players)}>
        start
      </button>
      <button data-testid="harness-start-invalid" onClick={() => handleStart([players[0]!])}>
        start invalid
      </button>
      <button data-testid="harness-add5" onClick={() => addScore("p1", 5)}>
        +5
      </button>
      <button data-testid="harness-add3" onClick={() => addScore("p1", 3)}>
        +3
      </button>
      <button data-testid="harness-subtract2" onClick={() => addScore("p1", -2)}>
        -2
      </button>
      <button data-testid="harness-new-game" onClick={() => newGame()}>
        new game
      </button>
    </div>
  );
}

function renderHarness(initialSession?: GameSession | null): void {
  render(
    <GameProvider initialSession={initialSession ?? null}>
      <Harness />
    </GameProvider>,
  );
}

describe("GameProvider / useGame", () => {
  afterEach(() => {
    cleanup();
  });

  it("starts with no game (totals empty, setup state)", () => {
    renderHarness();
    expect(screen.getByTestId("harness-view").textContent).toBe("setup");
    expect(screen.getByTestId("harness-total-p1").textContent).toBe("none");
  });

  it("startGame transitions to the play state", () => {
    renderHarness();
    fireEvent.click(screen.getByTestId("harness-start"));
    expect(screen.getByTestId("harness-view").textContent).toBe("play");
  });

  it("addScore(p1, 5) then addScore(p1, 3) yields a derived total of 8", () => {
    renderHarness();
    fireEvent.click(screen.getByTestId("harness-start"));

    fireEvent.click(screen.getByTestId("harness-add5"));
    expect(screen.getByTestId("harness-total-p1").textContent).toBe("5");

    fireEvent.click(screen.getByTestId("harness-add3"));
    expect(screen.getByTestId("harness-total-p1").textContent).toBe("8");
  });

  it("a negative delta reduces the derived total", () => {
    renderHarness();
    fireEvent.click(screen.getByTestId("harness-start"));
    fireEvent.click(screen.getByTestId("harness-add5"));
    fireEvent.click(screen.getByTestId("harness-add3"));

    fireEvent.click(screen.getByTestId("harness-subtract2"));
    expect(screen.getByTestId("harness-total-p1").textContent).toBe("6");
  });

  it("newGame returns to setup and clears totals", () => {
    renderHarness();
    fireEvent.click(screen.getByTestId("harness-start"));
    fireEvent.click(screen.getByTestId("harness-add5"));
    expect(screen.getByTestId("harness-view").textContent).toBe("play");

    fireEvent.click(screen.getByTestId("harness-new-game"));
    expect(screen.getByTestId("harness-view").textContent).toBe("setup");
    expect(screen.getByTestId("harness-total-p1").textContent).toBe("none");
  });

  it("an invalid startGame (1 player) surfaces a SessionError without crashing", () => {
    renderHarness();
    fireEvent.click(screen.getByTestId("harness-start-invalid"));

    expect(screen.getByTestId("harness-error").textContent).toBe("player-count");
    // Still in setup — the failed start did not flip to play.
    expect(screen.getByTestId("harness-view").textContent).toBe("setup");
  });

  it("initialSession seeds straight into the play state", () => {
    const seeded: GameSession = {
      version: 1,
      players: [{ id: "p1", name: "Alice", colourId: "red" }],
      events: [{ id: "e0", playerId: "p1", delta: 4, timestamp: 0 }],
    };

    renderHarness(seeded);

    expect(screen.getByTestId("harness-view").textContent).toBe("play");
    expect(screen.getByTestId("harness-total-p1").textContent).toBe("4");
  });
});
