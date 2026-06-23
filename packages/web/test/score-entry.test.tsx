import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { GameSession } from "@carcassonne/core";
import { App } from "../src/App.js";
import { GameProvider, useGame } from "../src/state/index.js";
import { ScoreEntry } from "../src/score-entry/index.js";
import { Scoreboard } from "../src/scoreboard/index.js";

/**
 * Component tests for manual score entry (Item 017), rendered through the
 * real `App` (so `ScoreEntry` is exercised alongside the `Scoreboard` in the
 * play view, exactly as a user would see them) and seeded straight into a
 * game via the `initialSession` hydrate seam — no setup-form interaction
 * needed for these assertions.
 */

/**
 * Thin harness that renders the real `ScoreEntry`/`Scoreboard` alongside a
 * dump of the store's raw `session.events`, so the reason-carrying
 * assertion can read the actual dispatched `ScoreEvent` (via the store's
 * session state) rather than inferring it indirectly from the DOM.
 */
function SessionHarness(): JSX.Element {
  const { session } = useGame();
  const lastEvent = session?.events.at(-1);
  return (
    <div>
      <Scoreboard />
      <ScoreEntry />
      <p data-testid="last-event-reason">{lastEvent?.reason ?? ""}</p>
      <p data-testid="last-event-delta">{lastEvent?.delta ?? ""}</p>
    </div>
  );
}

function renderHarness(session: GameSession): void {
  render(
    <GameProvider initialSession={session}>
      <SessionHarness />
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
  events: [],
};

function renderSeeded(): void {
  render(<App initialSession={seededSession} />);
}

function setCustomAmount(playerId: string, value: string): void {
  fireEvent.change(screen.getByTestId(`score-entry-amount-${playerId}`), {
    target: { value },
  });
}

function setReason(playerId: string, value: string): void {
  fireEvent.change(screen.getByTestId(`score-entry-reason-${playerId}`), {
    target: { value },
  });
}

function submitCustom(playerId: string): void {
  fireEvent.click(screen.getByTestId(`score-entry-apply-${playerId}`));
}

function total(playerId: string): string {
  return screen.getByTestId(`scoreboard-total-${playerId}`).textContent ?? "";
}

describe("ScoreEntry", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders entry controls for every player and no event log/persistence UI", () => {
    renderSeeded();

    expect(screen.getByTestId("score-entry-row-p1")).toBeDefined();
    expect(screen.getByTestId("score-entry-row-p2")).toBeDefined();
    expect(screen.getByTestId("score-entry-row-p3")).toBeDefined();
  });

  it("a quick increment updates the scoreboard total immediately", () => {
    renderSeeded();

    expect(total("p1")).toBe("0");
    fireEvent.click(screen.getByTestId("score-entry-quick-5-p1"));
    expect(total("p1")).toBe("5");
  });

  it("a quick decrement (-1) reduces the player's total", () => {
    renderSeeded();

    fireEvent.click(screen.getByTestId("score-entry-quick-5-p1"));
    expect(total("p1")).toBe("5");
    fireEvent.click(screen.getByTestId("score-entry-quick--1-p1"));
    expect(total("p1")).toBe("4");
  });

  it("a custom positive amount applies correctly", () => {
    renderSeeded();

    setCustomAmount("p1", "7");
    submitCustom("p1");
    expect(total("p1")).toBe("7");
  });

  it("a custom negative amount applies correctly (forward correction)", () => {
    renderSeeded();

    setCustomAmount("p1", "10");
    submitCustom("p1");
    expect(total("p1")).toBe("10");

    setCustomAmount("p1", "-3");
    submitCustom("p1");
    expect(total("p1")).toBe("7");
  });

  it("rejects a zero custom amount: dispatches nothing", () => {
    renderSeeded();

    setCustomAmount("p1", "0");
    submitCustom("p1");
    expect(total("p1")).toBe("0");
  });

  it("rejects a blank custom amount: dispatches nothing", () => {
    renderSeeded();

    setCustomAmount("p1", "");
    submitCustom("p1");
    expect(total("p1")).toBe("0");
  });

  it("rejects a non-integer custom amount: dispatches nothing", () => {
    renderSeeded();

    setCustomAmount("p1", "3.5");
    submitCustom("p1");
    expect(total("p1")).toBe("0");

    setCustomAmount("p1", "abc");
    submitCustom("p1");
    expect(total("p1")).toBe("0");
  });

  it("carries an optional reason onto the dispatched ScoreEvent (asserted via store/session state)", () => {
    renderHarness(seededSession);

    setCustomAmount("p1", "4");
    setReason("p1", "farm bonus");
    submitCustom("p1");

    expect(total("p1")).toBe("4");
    // Asserted directly against the store's session.events (not the DOM
    // text, which Item 018's log view will own), confirming `reason` is
    // forwarded unchanged from the form to `addScore(playerId, delta,
    // reason)` -> the core's `addScoreEvent`.
    expect(screen.getByTestId("last-event-delta").textContent).toBe("4");
    expect(screen.getByTestId("last-event-reason").textContent).toBe("farm bonus");

    // The form clears on a successful submit.
    expect(screen.getByTestId<HTMLInputElement>("score-entry-reason-p1").value).toBe("");
    expect(screen.getByTestId<HTMLInputElement>("score-entry-amount-p1").value).toBe("");
  });

  it("omits the reason on the dispatched ScoreEvent when left blank", () => {
    renderHarness(seededSession);

    fireEvent.click(screen.getByTestId("score-entry-quick-2-p1"));

    expect(screen.getByTestId("last-event-delta").textContent).toBe("2");
    expect(screen.getByTestId("last-event-reason").textContent).toBe("");
  });

  it("entry works for each of multiple players independently", () => {
    renderSeeded();

    fireEvent.click(screen.getByTestId("score-entry-quick-2-p1"));
    fireEvent.click(screen.getByTestId("score-entry-quick-5-p2"));
    setCustomAmount("p3", "9");
    submitCustom("p3");

    expect(total("p1")).toBe("2");
    expect(total("p2")).toBe("5");
    expect(total("p3")).toBe("9");
  });

  it("identifies the target player by name and a non-colour cue, not colour alone", () => {
    renderSeeded();

    const row = screen.getByTestId("score-entry-row-p1");
    expect(row.getAttribute("aria-label")).toContain("Alice");
    expect(screen.getByTestId("score-entry-name-p1").textContent).toContain("Alice");
    expect(screen.getByTestId("score-entry-name-p1").textContent).toContain("Red");
  });

  it("retires the Item 014 placeholder: no totals-list or scratch add-score buttons remain", () => {
    renderSeeded();

    expect(screen.queryByTestId("totals-list")).toBeNull();
    expect(screen.queryByTestId("add-score-p1")).toBeNull();
    // A single, real totals display and a real "new game" control remain.
    expect(screen.getByTestId("scoreboard")).toBeDefined();
    expect(screen.getByTestId("new-game")).toBeDefined();
  });
});
