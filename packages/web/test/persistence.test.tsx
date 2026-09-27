/**
 * Tests for Item 019 — local persistence.
 *
 * Part 1: `createLocalSessionStorage` unit tests via jsdom's `localStorage`.
 * Part 2: Full restore-flow integration tests via the `App` + `storage` seam.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  addScoreEvent,
  computeTotals,
  createSession,
  serializeSession,
  SESSION_VERSION,
} from "@carcassonne/core";
import type { GameSession, Player } from "@carcassonne/core";
import { createLocalSessionStorage, DEFAULT_SESSION_STORAGE_KEY } from "../src/persistence/index.js";
import { App } from "../src/App.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_KEY = "test.carcassonne.session";

// Real meeple colour ids (Item 013): red, blue, green, yellow, black, gray
const COLOUR_IDS = ["red", "blue", "green", "yellow", "black", "gray"] as const;

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    colourId: COLOUR_IDS[i] ?? `colour-${i}`,
  }));
}

function buildTestSession(): GameSession {
  // Uses real colour ids (red, blue) so any rendering that calls
  // getMeepleColour does not throw MeepleColourError.
  const players: Player[] = [
    { id: "p0", name: "Alice", colourId: "red" },
    { id: "p1", name: "Bob", colourId: "blue" },
  ];
  let session = createSession(players);
  session = addScoreEvent(session, {
    id: "e0",
    playerId: "p0",
    delta: 10,
    timestamp: 1000,
    reason: "city",
  });
  session = addScoreEvent(session, { id: "e1", playerId: "p1", delta: 5, timestamp: 2000 });
  return session;
}

// ---------------------------------------------------------------------------
// Part 1: createLocalSessionStorage unit tests
// ---------------------------------------------------------------------------

describe("createLocalSessionStorage — unit", () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem(TEST_KEY);
    localStorage.removeItem(DEFAULT_SESSION_STORAGE_KEY);
  });

  it("save then load round-trips a session", () => {
    const storage = createLocalSessionStorage(TEST_KEY);
    const session = buildTestSession();
    storage.save(session);
    const loaded = storage.load();
    expect(loaded).toEqual(session);
  });

  it("load returns null for an absent key", () => {
    const storage = createLocalSessionStorage(TEST_KEY);
    expect(storage.load()).toBeNull();
  });

  it("load returns null for a blank value and does not throw", () => {
    localStorage.setItem(TEST_KEY, "   ");
    const storage = createLocalSessionStorage(TEST_KEY);
    expect(() => storage.load()).not.toThrow();
    expect(storage.load()).toBeNull();
  });

  it("load returns null for corrupt JSON and does not throw", () => {
    localStorage.setItem(TEST_KEY, "not valid json{{");
    const storage = createLocalSessionStorage(TEST_KEY);
    expect(() => storage.load()).not.toThrow();
    expect(storage.load()).toBeNull();
  });

  it("load clears the bad key when JSON is corrupt", () => {
    localStorage.setItem(TEST_KEY, "not valid json");
    const storage = createLocalSessionStorage(TEST_KEY);
    storage.load();
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });

  it("load returns null for a version-mismatched payload and does not throw", () => {
    const session = buildTestSession();
    const badPayload = { ...session, version: SESSION_VERSION + 99 };
    localStorage.setItem(TEST_KEY, JSON.stringify(badPayload));
    const storage = createLocalSessionStorage(TEST_KEY);
    expect(() => storage.load()).not.toThrow();
    expect(storage.load()).toBeNull();
  });

  it("load clears the bad key when the version is mismatched", () => {
    const session = buildTestSession();
    const badPayload = { ...session, version: SESSION_VERSION + 99 };
    localStorage.setItem(TEST_KEY, JSON.stringify(badPayload));
    const storage = createLocalSessionStorage(TEST_KEY);
    storage.load();
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });

  it("clear removes the saved session", () => {
    const storage = createLocalSessionStorage(TEST_KEY);
    const session = buildTestSession();
    storage.save(session);
    expect(storage.load()).not.toBeNull();
    storage.clear();
    expect(storage.load()).toBeNull();
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });

  it("uses DEFAULT_SESSION_STORAGE_KEY when no key is given", () => {
    const storage = createLocalSessionStorage();
    const session = buildTestSession();
    storage.save(session);
    const raw = localStorage.getItem(DEFAULT_SESSION_STORAGE_KEY);
    expect(raw).toBe(serializeSession(session));
  });
});

// ---------------------------------------------------------------------------
// Part 2: restore-flow integration tests via App + storage prop
// ---------------------------------------------------------------------------

describe("App — restore flow (Item 019)", () => {
  const storageKey = "app-test-session";

  beforeEach(() => {
    localStorage.removeItem(storageKey);
  });

  afterEach(() => {
    cleanup();
    localStorage.removeItem(storageKey);
  });

  it("opens in setup view when no session is saved", () => {
    const storage = createLocalSessionStorage(storageKey);
    render(<App storage={storage} />);
    expect(screen.getByTestId("setup-view")).toBeDefined();
    expect(screen.queryByTestId("play-view")).toBeNull();
  });

  it("restores a saved session: opens in play view with restored players and totals", () => {
    const players: Player[] = [
      { id: "p0", name: "Alice", colourId: "red" },
      { id: "p1", name: "Bob", colourId: "blue" },
    ];
    let session = createSession(players);
    session = addScoreEvent(session, { id: "e0", playerId: "p0", delta: 10, timestamp: 1000 });
    session = addScoreEvent(session, { id: "e1", playerId: "p1", delta: 5, timestamp: 2000 });

    // Pre-seed localStorage so App sees it via storage.load()
    const storage = createLocalSessionStorage(storageKey);
    storage.save(session);

    render(<App storage={storage} />);

    expect(screen.getByTestId("play-view")).toBeDefined();
    expect(screen.queryByTestId("setup-view")).toBeNull();

    // Verify totals (scoreboard renders player rows with totals)
    const expectedTotals = computeTotals(session);
    expect(String(expectedTotals["p0"])).toBe("10");
    expect(String(expectedTotals["p1"])).toBe("5");
    // Scoreboard shows totals via data-testid="scoreboard-total-<id>"
    expect(screen.getByTestId("scoreboard-total-p0").textContent).toBe("10");
    expect(screen.getByTestId("scoreboard-total-p1").textContent).toBe("5");
  });

  it("restores the event log: events are present after reload", () => {
    const players: Player[] = [
      { id: "p0", name: "Alice", colourId: "red" },
      { id: "p1", name: "Bob", colourId: "blue" },
    ];
    let session = createSession(players);
    session = addScoreEvent(session, {
      id: "e0",
      playerId: "p0",
      delta: 10,
      timestamp: 1000,
      reason: "city",
    });

    const storage = createLocalSessionStorage(storageKey);
    storage.save(session);

    render(<App storage={storage} />);

    // The event log should have one entry (Item 018 renders event-log-row entries)
    expect(screen.getByTestId("play-view")).toBeDefined();
    // Storage restored correctly
    const loaded = storage.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.events).toHaveLength(1);
    expect(loaded!.events[0]!.delta).toBe(10);
  });

  it("persists on score change: after addScore, re-mounted App has the new event", () => {
    const players: Player[] = [
      { id: "p0", name: "Alice", colourId: "red" },
      { id: "p1", name: "Bob", colourId: "blue" },
    ];
    const session = createSession(players);
    const storage = createLocalSessionStorage(storageKey);
    storage.save(session);

    // Mount first instance and add a score
    render(<App storage={storage} />);
    expect(screen.getByTestId("play-view")).toBeDefined();

    // Use the score entry form to add a score for p0
    // ScoreEntry form: each player row has score-entry-amount-<id> input and
    // score-entry-apply-<id> submit button (Item 017)
    const deltaInput = screen.getByTestId("score-entry-amount-p0");
    fireEvent.change(deltaInput, { target: { value: "7" } });
    fireEvent.click(screen.getByTestId("score-entry-apply-p0"));

    // Unmount
    cleanup();

    // Re-mount a fresh App reading the same storage (simulated reload)
    render(<App storage={storage} />);
    expect(screen.getByTestId("play-view")).toBeDefined();

    // The new event (delta 7) should now be reflected in the scoreboard total
    expect(screen.getByTestId("scoreboard-total-p0").textContent).toBe("7");
  });

  it("clears storage on newGame: re-mounted App shows setup screen", () => {
    const players: Player[] = [
      { id: "p0", name: "Alice", colourId: "red" },
      { id: "p1", name: "Bob", colourId: "blue" },
    ];
    const session = createSession(players);
    const storage = createLocalSessionStorage(storageKey);
    storage.save(session);

    render(<App storage={storage} />);
    expect(screen.getByTestId("play-view")).toBeDefined();

    fireEvent.click(screen.getByTestId("new-game"));
    expect(screen.getByTestId("setup-view")).toBeDefined();

    // Unmount and re-mount to simulate reload
    cleanup();
    render(<App storage={storage} />);

    // After newGame, storage should be cleared → setup screen on reload
    expect(screen.getByTestId("setup-view")).toBeDefined();
    expect(screen.queryByTestId("play-view")).toBeNull();
  });

  it("absent/corrupt storage starts at setup with no crash", () => {
    localStorage.setItem(storageKey, "{{corrupted!");
    const storage = createLocalSessionStorage(storageKey);
    expect(() => render(<App storage={storage} />)).not.toThrow();
    expect(screen.getByTestId("setup-view")).toBeDefined();
    expect(screen.queryByTestId("play-view")).toBeNull();
  });

  it("version-mismatched storage starts at setup with no crash", () => {
    const players: Player[] = [
      { id: "p0", name: "Alice", colourId: "red" },
      { id: "p1", name: "Bob", colourId: "blue" },
    ];
    const session = createSession(players);
    const badPayload = { ...session, version: SESSION_VERSION + 99 };
    localStorage.setItem(storageKey, JSON.stringify(badPayload));

    const storage = createLocalSessionStorage(storageKey);
    expect(() => render(<App storage={storage} />)).not.toThrow();
    expect(screen.getByTestId("setup-view")).toBeDefined();
    expect(screen.queryByTestId("play-view")).toBeNull();
  });
});
