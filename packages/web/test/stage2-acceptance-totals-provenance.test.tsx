/**
 * Stage 2 acceptance end-to-end suite (Item 020) — AC8: displayed totals
 * come from the core reducer, not from summing logged deltas in the UI.
 *
 * Isolated in its own file (A4) because it substitutes the
 * `@carcassonne/core` module's `computeTotals` export module-wide via
 * `vi.mock`, wrapping the real reducer so it still reflects real event
 * data, just offset by +1000. `stage2-acceptance.test.tsx` (AC1-AC7 plus
 * `reload-then-continue`) runs against the real, unsubstituted core.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { GameSession } from "@carcassonne/core";

vi.mock("@carcassonne/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@carcassonne/core")>();
  return {
    ...actual,
    computeTotals: (session: GameSession): Record<string, number> => {
      const real = actual.computeTotals(session);
      const boosted: Record<string, number> = {};
      for (const [playerId, total] of Object.entries(real)) {
        boosted[playerId] = total + 1000;
      }
      return boosted;
    },
  };
});

import { App } from "../src/App.js";
import { DEFAULT_SESSION_STORAGE_KEY } from "../src/persistence/index.js";

// ---------------------------------------------------------------------------
// Helpers (mirrors stage2-acceptance.test.tsx's; kept as its own small copy
// per A4/Implementation Steps §2, since AC8 must stay in its own module).
// ---------------------------------------------------------------------------

/** Drives the real setup form (A3): adds rows, types names, starts the game. */
function setUpGame(names: string[]): void {
  for (let n = 3; n <= names.length; n += 1) {
    fireEvent.click(screen.getByTestId("add-player"));
  }
  names.forEach((name, i) => {
    fireEvent.change(screen.getByLabelText(`Player ${i + 1} name`), {
      target: { value: name },
    });
  });
  fireEvent.click(screen.getByTestId("start-game"));
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

/** Each player's real (unboosted) final total from the scenario table. */
function realFinalTotals(): Record<string, number> {
  const totals: Record<string, number> = { Ada: 0, Bruno: 0, Chen: 0 };
  for (const entry of SCENARIO) {
    totals[entry.player] = (totals[entry.player] ?? 0) + entry.delta;
  }
  return totals;
}

/** Reads the rendered scoreboard totals into a name -> total-text map. */
function readScoreboardTotalsByName(): Map<string, string> {
  const rows = screen.getAllByTestId(/^scoreboard-row-/);
  return new Map(
    rows.map((row) => {
      const id = row.getAttribute("data-testid")!.replace("scoreboard-row-", "");
      const name = within(row).getByTestId(`scoreboard-name-${id}`).textContent ?? "";
      const total = within(row).getByTestId(`scoreboard-total-${id}`).textContent ?? "";
      return [name, total] as const;
    }),
  );
}

// ---------------------------------------------------------------------------

describe("Stage 2 acceptance suite (Item 020) — AC8", () => {
  beforeEach(() => {
    localStorage.removeItem(DEFAULT_SESSION_STORAGE_KEY);
  });

  afterEach(() => {
    cleanup();
    localStorage.removeItem(DEFAULT_SESSION_STORAGE_KEY);
  });

  it("ac8: displayed totals come from the core reducer, not a UI-side sum", () => {
    render(<App />);
    setUpGame(["Ada", "Bruno", "Chen"]);
    for (const entry of SCENARIO) {
      apply(entry);
    }

    const totals = realFinalTotals();
    const byName = readScoreboardTotalsByName();
    // A UI that summed the logged deltas itself would show the real total
    // (Ada 6 / Bruno -1 / Chen 12) here and fail this assertion.
    expect(byName.get("Ada")).toBe(String((totals["Ada"] ?? 0) + 1000));
    expect(byName.get("Bruno")).toBe(String((totals["Bruno"] ?? 0) + 1000));
    expect(byName.get("Chen")).toBe(String((totals["Chen"] ?? 0) + 1000));
  });
});
