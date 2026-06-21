import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { meepleColours } from "@carcassonne/core";
import { GameProvider, useGame } from "../src/state/index.js";
import { SetupView } from "../src/setup/index.js";

/**
 * Thin harness rendering `SetupView` plus the resulting session state, so
 * tests can assert on the `GameSession` the form produced (players, names,
 * colours) without depending on the play view (Items 016-018).
 */
function Harness(): JSX.Element {
  const { session } = useGame();
  return (
    <div>
      <SetupView />
      <p data-testid="harness-view">{session ? "play" : "setup"}</p>
      {session && (
        <ul data-testid="harness-players">
          {session.players.map((player) => (
            <li key={player.id} data-testid={`harness-player-${player.id}`}>
              {player.name}|{player.colourId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function renderSetup(): void {
  render(
    <GameProvider>
      <Harness />
    </GameProvider>,
  );
}

function playerRow(index: number): HTMLElement {
  return screen.getByTestId(`player-row-${index}`);
}

function nameInput(index: number): HTMLInputElement {
  return within(playerRow(index)).getByLabelText(`Player ${index} name`) as HTMLInputElement;
}

function colourSelect(index: number): HTMLSelectElement {
  return within(playerRow(index)).getByLabelText(`Player ${index} colour`) as HTMLSelectElement;
}

function removeButton(index: number): HTMLElement {
  return within(playerRow(index)).getByRole("button", { name: `Remove player ${index}` });
}

describe("SetupView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders 2 player rows by default", () => {
    renderSetup();
    expect(screen.getByTestId("player-row-1")).toBeDefined();
    expect(screen.getByTestId("player-row-2")).toBeDefined();
    expect(screen.queryByTestId("player-row-3")).toBeNull();
  });

  it("add player grows up to 6 rows, then disables the add control", () => {
    renderSetup();
    const addButton = screen.getByTestId("add-player");

    for (let n = 3; n <= 6; n += 1) {
      fireEvent.click(addButton);
      expect(screen.getByTestId(`player-row-${n}`)).toBeDefined();
    }

    expect(screen.queryByTestId("player-row-7")).toBeNull();
    expect(addButton).toHaveProperty("disabled", true);
  });

  it("remove player shrinks down to 2 rows, then disables the remove controls", () => {
    renderSetup();
    const addButton = screen.getByTestId("add-player");
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    expect(screen.getByTestId("player-row-4")).toBeDefined();

    fireEvent.click(removeButton(4));
    expect(screen.queryByTestId("player-row-4")).toBeNull();

    fireEvent.click(removeButton(3));
    expect(screen.queryByTestId("player-row-3")).toBeNull();

    // At the 2-player floor: both remaining rows' remove buttons disable.
    expect(removeButton(1)).toHaveProperty("disabled", true);
    expect(removeButton(2)).toHaveProperty("disabled", true);
  });

  it("typing a name updates that row's input value", () => {
    renderSetup();
    fireEvent.change(nameInput(1), { target: { value: "Alice" } });
    expect(nameInput(1).value).toBe("Alice");
  });

  it("an empty name falls back to 'Player N' in the created session", () => {
    renderSetup();
    fireEvent.change(nameInput(1), { target: { value: "Alice" } });
    // Player 2's name is left empty.

    fireEvent.click(screen.getByTestId("start-game"));

    expect(screen.getByTestId("harness-view").textContent).toBe("play");
    const playersText = screen.getByTestId("harness-players").textContent ?? "";
    expect(playersText).toContain("Alice|");
    expect(playersText).toContain("Player 2|");
  });

  it("each colour option shows a non-colour cue (name + pattern), not colour alone", () => {
    renderSetup();
    const select = colourSelect(1);
    for (const colour of meepleColours) {
      const option = within(select).getByText(`${colour.name} (${colour.pattern})`);
      expect(option).toBeDefined();
    }
  });

  it("prevents selecting a colour already taken by another row (disabled option)", () => {
    renderSetup();
    const row1Colour = colourSelect(1).value;
    const row2Select = colourSelect(2);
    const takenOption = within(row2Select).getByRole("option", {
      name: new RegExp(`^${meepleColours.find((c) => c.id === row1Colour)!.name}\\b`),
    }) as HTMLOptionElement;

    expect(takenOption.disabled).toBe(true);
  });

  it("created session always has unique colourIds across players", () => {
    renderSetup();
    const addButton = screen.getByTestId("add-player");
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    expect(screen.getByTestId("player-row-6")).toBeDefined();

    fireEvent.click(screen.getByTestId("start-game"));

    expect(screen.getByTestId("harness-view").textContent).toBe("play");
    const playersText = screen.getByTestId("harness-players").textContent ?? "";
    const colours = playersText
      .split("Player")
      .filter((s) => s.length > 0)
      .map((entry) => entry.split("|")[1]);
    expect(new Set(colours).size).toBe(colours.length);
  });

  it("clicking 'Start game' with valid input creates the session and routes to play", () => {
    renderSetup();
    fireEvent.change(nameInput(1), { target: { value: "Alice" } });
    fireEvent.change(nameInput(2), { target: { value: "Bob" } });

    fireEvent.click(screen.getByTestId("start-game"));

    expect(screen.getByTestId("harness-view").textContent).toBe("play");
    const playersText = screen.getByTestId("harness-players").textContent ?? "";
    expect(playersText).toContain("Alice|");
    expect(playersText).toContain("Bob|");
  });

  it("surfaces a SessionError backstop as an inline message instead of crashing", () => {
    renderSetup();

    // Force row 2's colour to duplicate row 1's via a direct value change,
    // bypassing the UI's own disabled-option prevention (jsdom does not
    // enforce the `disabled` attribute when a select's value is set
    // directly) so the core's createSession SessionError backstop path is
    // exercised end-to-end.
    const row1Colour = colourSelect(1).value;
    fireEvent.change(colourSelect(2), { target: { value: row1Colour } });

    fireEvent.click(screen.getByTestId("start-game"));

    expect(screen.getByTestId("setup-error").textContent).toMatch(/colour/i);
    // Still on the setup view — the app did not crash or route to play.
    expect(screen.getByTestId("harness-view").textContent).toBe("setup");
  });
});
