import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { GameSession } from "@carcassonne/core";
import { GameProvider, useGame } from "../src/state/index.js";
import { EventLog } from "../src/event-log/index.js";

/**
 * Component tests for the score event log (Item 018), rendered alongside a
 * thin harness exposing `addScore` via a DOM button so a live append can be
 * driven without the real score-entry UI (Item 017), which has its own
 * suite.
 */
function Harness(): JSX.Element {
  const { addScore } = useGame();
  return (
    <div>
      <EventLog />
      <button data-testid="harness-add-p1" onClick={() => addScore("p1", 5)}>
        +5 to p1
      </button>
    </div>
  );
}

function renderLog(session: GameSession): void {
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
    { id: "e1", playerId: "p1", delta: 5, timestamp: 1000, reason: "field bonus" },
    { id: "e2", playerId: "p2", delta: -3, timestamp: 2000 },
    { id: "e3", playerId: "p3", delta: 2, timestamp: 3000, reason: "road" },
  ],
};

const emptySession: GameSession = {
  version: 1,
  players: [{ id: "p1", name: "Alice", colourId: "red" }],
  events: [],
};

function rowIds(): (string | null)[] {
  return screen.getAllByTestId(/^event-log-row-/).map((row) => row.getAttribute("data-testid"));
}

describe("EventLog", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders one row per event in session.events with correct player, sign, and reason", () => {
    renderLog(seededSession);

    expect(screen.getByTestId("event-log-player-e1").textContent).toContain("Alice");
    expect(screen.getByTestId("event-log-player-e1").textContent).toContain("Red");
    expect(screen.getByTestId("event-log-delta-e1").textContent).toBe("+5");
    expect(screen.getByTestId("event-log-reason-e1").textContent).toContain("field bonus");

    expect(screen.getByTestId("event-log-player-e2").textContent).toContain("Bob");
    expect(screen.getByTestId("event-log-delta-e2").textContent).toBe("−3");
    // No reason was given for e2: no reason node, and never the string "undefined".
    expect(screen.queryByTestId("event-log-reason-e2")).toBeNull();
    expect(screen.getByTestId("event-log-row-e2").textContent).not.toContain("undefined");

    expect(screen.getByTestId("event-log-player-e3").textContent).toContain("Cara");
    expect(screen.getByTestId("event-log-delta-e3").textContent).toBe("+2");
    expect(screen.getByTestId("event-log-reason-e3").textContent).toContain("road");
  });

  it("shows a readable local time for each entry", () => {
    renderLog(seededSession);

    const time = screen.getByTestId("event-log-time-e1").textContent ?? "";
    expect(time.length).toBeGreaterThan(0);
    // A formatted local time string, not a raw epoch-ms number.
    expect(time).not.toBe("1000");
  });

  it("a newly dispatched addScore appears in the log (count grows by one)", () => {
    renderLog(seededSession);

    expect(rowIds()).toHaveLength(3);

    fireEvent.click(screen.getByTestId("harness-add-p1"));

    expect(rowIds()).toHaveLength(4);
    expect(screen.getByTestId("event-log-player-e1")).toBeDefined();
    // The new event for p1 (+5) now also appears, identified by its player.
    const newRows = screen.getAllByTestId(/^event-log-delta-/).map((node) => node.textContent);
    expect(newRows.filter((text) => text === "+5")).toHaveLength(2);
  });

  it("shows an explicit minus sign for negative deltas and plus for positive", () => {
    renderLog(seededSession);

    expect(screen.getByTestId("event-log-delta-e1").textContent?.startsWith("+")).toBe(true);
    expect(screen.getByTestId("event-log-delta-e2").textContent?.startsWith("−")).toBe(true);
  });

  it("shows a clear empty-state message and no rows when there are no events", () => {
    renderLog(emptySession);

    expect(screen.getByTestId("event-log-empty").textContent).toBe("No score changes yet");
    expect(screen.queryAllByTestId(/^event-log-row-/)).toHaveLength(0);
  });

  it("orders entries newest-first (documented order), deterministic from session.events", () => {
    renderLog(seededSession);

    // seededSession is append-ordered e1 (oldest) -> e2 -> e3 (newest);
    // newest-first display reverses that.
    expect(rowIds()).toEqual(["event-log-row-e3", "event-log-row-e2", "event-log-row-e1"]);
  });

  it("is read-only: no edit/reverse controls are rendered", () => {
    renderLog(seededSession);

    expect(screen.queryByRole("button")).not.toBeNull(); // the harness's own add button
    // No buttons inside the log itself.
    const log = screen.getByTestId("event-log");
    expect(log.querySelector("button")).toBeNull();
  });
});
