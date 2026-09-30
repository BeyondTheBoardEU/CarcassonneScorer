/**
 * Stage 2 acceptance end-to-end suite (Item 020): drives the assembled
 * `App` — the same component `main.tsx` mounts, with its real default
 * `localStorage`-backed storage and the real `@carcassonne/core` — through
 * the setup form, score-entry controls, scoreboard, and event log the way a
 * user would, covering Stage 2 acceptance criteria 1-4 (AC1-AC7) plus the
 * `reload-then-continue` adversarial case.
 *
 * AC8 (criterion 5, totals provenance) lives in its own file
 * (`stage2-acceptance-totals-provenance.test.tsx`, A4) because it
 * substitutes a `@carcassonne/core` export module-wide; this file runs
 * against the real, unsubstituted core throughout.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { meepleColours } from "@carcassonne/core";
import { App } from "../src/App.js";
import { DEFAULT_SESSION_STORAGE_KEY } from "../src/persistence/index.js";

// ---------------------------------------------------------------------------
// Helpers (Implementation Steps §2)
// ---------------------------------------------------------------------------

/**
 * Drives the real setup form (A3): adds rows up to `names.length`, types
 * each name, applies any colour overrides (1-based row index -> colourId),
 * then starts the game.
 */
function setUpGame(names: string[], colourOverrides?: Record<number, string>): void {
  for (let n = 3; n <= names.length; n += 1) {
    fireEvent.click(screen.getByRole("button", { name: "Add player" }));
  }
  names.forEach((name, i) => {
    fireEvent.change(screen.getByLabelText(`Player ${i + 1} name`), {
      target: { value: name },
    });
  });
  if (colourOverrides) {
    for (const [index, colourId] of Object.entries(colourOverrides)) {
      fireEvent.change(screen.getByLabelText(`Player ${index} colour`), {
        target: { value: colourId },
      });
    }
  }
  fireEvent.click(screen.getByRole("button", { name: "Start game" }));
}

interface ScenarioEntry {
  player: string;
  control: "quick" | "custom";
  delta: number;
  reason?: string;
}

/** The shared scenario game (Testing Strategy): Ada/Bruno/Chen, six entries. */
const SCENARIO: readonly ScenarioEntry[] = [
  { player: "Ada", control: "quick", delta: 5 },
  { player: "Bruno", control: "custom", delta: 3, reason: "road" },
  { player: "Ada", control: "quick", delta: 2 },
  { player: "Chen", control: "custom", delta: 12, reason: "city" },
  { player: "Bruno", control: "custom", delta: -4, reason: "correction" },
  { player: "Ada", control: "quick", delta: -1 },
];

/** Drives one scenario entry through the real score-entry controls (A3). */
function apply(entry: ScenarioEntry): void {
  if (entry.control === "quick") {
    const verb = entry.delta > 0 ? "Add" : "Subtract";
    const preposition = entry.delta > 0 ? "to" : "from";
    const name = `${verb} ${Math.abs(entry.delta)} ${preposition} ${entry.player}`;
    fireEvent.click(screen.getByRole("button", { name }));
    return;
  }
  fireEvent.change(screen.getByLabelText(`Custom amount for ${entry.player}`), {
    target: { value: String(entry.delta) },
  });
  if (entry.reason) {
    fireEvent.change(screen.getByLabelText(`Reason (optional) for ${entry.player}`), {
      target: { value: entry.reason },
    });
  }
  fireEvent.click(screen.getByRole("button", { name: `Apply to ${entry.player}` }));
}

/** Running per-player totals over the scenario's first `count` entries. */
function runningTotals(count: number): Record<string, number> {
  const totals: Record<string, number> = { Ada: 0, Bruno: 0, Chen: 0 };
  for (const entry of SCENARIO.slice(0, count)) {
    totals[entry.player] = (totals[entry.player] ?? 0) + entry.delta;
  }
  return totals;
}

/** Sets up the shared 3-player scenario game and applies all six entries. */
function playScenario(): void {
  setUpGame(["Ada", "Bruno", "Chen"]);
  for (const entry of SCENARIO) {
    apply(entry);
  }
}

interface ScoreboardRow {
  name: string;
  colour: string;
  total: string;
}

/** Reads the rendered scoreboard rows into plain data, in display order. */
function readScoreboard(): ScoreboardRow[] {
  return screen.getAllByTestId(/^scoreboard-row-/).map((row) => {
    const id = row.getAttribute("data-testid")!.replace("scoreboard-row-", "");
    return {
      name: within(row).getByTestId(`scoreboard-name-${id}`).textContent ?? "",
      colour: within(row).getByTestId(`scoreboard-colour-${id}`).textContent ?? "",
      total: within(row).getByTestId(`scoreboard-total-${id}`).textContent ?? "",
    };
  });
}

interface EventLogEntry {
  player: string;
  delta: string;
  reason: string | null;
}

/**
 * Reads the rendered event-log rows into plain data, in display order
 * (newest-first, A3). The player field is parsed off the leading name
 * segment of the rendered "<name> (<Colour>, <pattern>)" text (A3) — the
 * scenario's names (Ada/Bruno/Chen) contain no "(", so the split is exact.
 * The reason field strips the rendered " — <reason>" separator (A3) —
 * the exact space/em-dash/space prefix A3 pins — leaving the raw reason
 * text.
 */
function readEventLog(): EventLogEntry[] {
  return screen.getAllByTestId(/^event-log-row-/).map((row) => {
    const id = row.getAttribute("data-testid")!.replace("event-log-row-", "");
    const playerText = within(row).getByTestId(`event-log-player-${id}`).textContent ?? "";
    const reasonNode = within(row).queryByTestId(`event-log-reason-${id}`);
    return {
      player: playerText.split(" (")[0] ?? "",
      delta: within(row).getByTestId(`event-log-delta-${id}`).textContent ?? "",
      reason: reasonNode ? (reasonNode.textContent ?? "").replace(/^ — /, "") : null,
    };
  });
}

/** AC7's snapshot: scoreboard rows as (name, colour, total); log rows as full text. */
function snapshot(): { scoreboard: ScoreboardRow[]; eventLog: string[] } {
  return {
    scoreboard: readScoreboard(),
    eventLog: screen.getAllByTestId(/^event-log-row-/).map((row) => row.textContent ?? ""),
  };
}

// ---------------------------------------------------------------------------

describe("Stage 2 acceptance suite (Item 020)", () => {
  beforeEach(() => {
    localStorage.removeItem(DEFAULT_SESSION_STORAGE_KEY);
  });

  afterEach(() => {
    cleanup();
    localStorage.removeItem(DEFAULT_SESSION_STORAGE_KEY);
  });

  it.each([2, 6])(
    "ac1: setup at the %i-player bound shows the play view with names in entry order",
    (n) => {
      render(<App />);
      const names = Array.from({ length: n }, (_, i) => `P${i + 1}-name`);
      setUpGame(names);

      expect(screen.getByTestId("play-view")).toBeDefined();
      expect(screen.queryByTestId("setup-view")).toBeNull();
      expect(readScoreboard().map((row) => row.name)).toEqual(names);
    },
  );

  it("ac2: six players in a 6-player game get six distinct colours matching the core's meepleColours", () => {
    render(<App />);
    setUpGame(["P1", "P2", "P3", "P4", "P5", "P6"]);

    const actual = new Set(readScoreboard().map((row) => row.colour));
    const expected = new Set(meepleColours.map((colour) => `(${colour.name}, ${colour.pattern})`));
    expect(actual.size).toBe(6);
    expect(actual).toEqual(expected);
  });

  it("ac3: the chosen colour, not the row's default, is the assigned colour", () => {
    render(<App />);
    const player2ColourId = (screen.getByLabelText("Player 2 colour") as HTMLSelectElement).value;
    setUpGame(["P1", "P2"], { 1: "yellow" });

    const yellow = meepleColours.find((colour) => colour.id === "yellow")!;
    const player2Colour = meepleColours.find((colour) => colour.id === player2ColourId)!;
    const rows = readScoreboard();
    expect(rows[0]!.colour).toBe(`(${yellow.name}, ${yellow.pattern})`);
    expect(rows[1]!.colour).toBe(`(${player2Colour.name}, ${player2Colour.pattern})`);
  });

  it("ac4: adding points updates every player's total immediately after each positive entry", () => {
    render(<App />);
    setUpGame(["Ada", "Bruno", "Chen"]);

    for (let i = 1; i <= 4; i += 1) {
      apply(SCENARIO[i - 1]!);
      const totals = runningTotals(i);
      const byName = new Map(readScoreboard().map((row) => [row.name, row.total]));
      expect(byName.get("Ada")).toBe(String(totals["Ada"]));
      expect(byName.get("Bruno")).toBe(String(totals["Bruno"]));
      expect(byName.get("Chen")).toBe(String(totals["Chen"]));
    }
  });

  it("ac5: negative adjustments update every player's total immediately, including below zero", () => {
    render(<App />);
    setUpGame(["Ada", "Bruno", "Chen"]);
    apply(SCENARIO[0]!);
    apply(SCENARIO[1]!);
    apply(SCENARIO[2]!);
    apply(SCENARIO[3]!);

    for (let i = 5; i <= 6; i += 1) {
      apply(SCENARIO[i - 1]!);
      const totals = runningTotals(i);
      const byName = new Map(readScoreboard().map((row) => [row.name, row.total]));
      expect(byName.get("Ada")).toBe(String(totals["Ada"]));
      expect(byName.get("Bruno")).toBe(String(totals["Bruno"]));
      expect(byName.get("Chen")).toBe(String(totals["Chen"]));
    }
    const finalByName = new Map(readScoreboard().map((row) => [row.name, row.total]));
    expect(finalByName.get("Bruno")).toBe("-1");
  });

  it("ac6: every scenario entry appears in the event log, newest-first, with player/delta/reason", () => {
    render(<App />);
    playScenario();

    const expected = [...SCENARIO].reverse().map((entry) => ({
      player: entry.player,
      delta: entry.delta < 0 ? `−${Math.abs(entry.delta)}` : `+${entry.delta}`,
      reason: entry.reason ?? null,
    }));

    const actual = readEventLog();
    expect(actual).toHaveLength(6);
    expect(actual).toEqual(expected);
  });

  it("ac7: reload restores the exact in-progress game", () => {
    render(<App />);
    playScenario();

    const before = snapshot();
    expect(screen.getByTestId("play-view")).toBeDefined();

    cleanup();
    render(<App />);

    expect(screen.getByTestId("play-view")).toBeDefined();
    expect(screen.queryByTestId("setup-view")).toBeNull();
    expect(snapshot()).toEqual(before);
  });

  it("reload-then-continue: a post-reload entry builds on the restored session, not an empty one", () => {
    render(<App />);
    playScenario();

    cleanup();
    render(<App />);
    expect(screen.getByTestId("play-view")).toBeDefined();
    expect(screen.getAllByTestId(/^event-log-row-/)).toHaveLength(6);

    apply({ player: "Chen", control: "quick", delta: 1 });

    const byName = new Map(readScoreboard().map((row) => [row.name, row.total]));
    expect(byName.get("Chen")).toBe("13");
    expect(screen.getAllByTestId(/^event-log-row-/)).toHaveLength(7);
    expect(readEventLog()[0]).toEqual({ player: "Chen", delta: "+1", reason: null });
  });
});
