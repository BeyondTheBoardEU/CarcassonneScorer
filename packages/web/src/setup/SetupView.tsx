import { useState } from "react";
import type { FormEvent } from "react";
import { MAX_PLAYERS, MIN_PLAYERS, SessionError, meepleColours } from "@carcassonne/core";
import type { Player } from "@carcassonne/core";
import { useGame } from "../state/index.js";
import { generatePlayerId } from "./ids.js";
import { PlayerRow } from "./PlayerRow.js";
import type { PlayerDraft } from "./types.js";

/** A fresh row with a stable id and the next still-unused colour. */
function createDraft(takenColours: ReadonlySet<string>): PlayerDraft {
  const defaultColour = meepleColours.find((colour) => !takenColours.has(colour.id));
  return {
    id: generatePlayerId(),
    name: "",
    // Falls back to the first colour only if every colour is somehow taken
    // (unreachable while MAX_PLAYERS <= meepleColours.length), so a row is
    // never left without a selectable value.
    colourId: defaultColour?.id ?? meepleColours[0]!.id,
  };
}

/** Builds the initial MIN_PLAYERS rows with pre-assigned distinct colours. */
function createInitialDrafts(): PlayerDraft[] {
  const drafts: PlayerDraft[] = [];
  for (let i = 0; i < MIN_PLAYERS; i += 1) {
    const taken = new Set(drafts.map((draft) => draft.colourId));
    drafts.push(createDraft(taken));
  }
  return drafts;
}

/** Turns a row's raw (possibly empty) name into the session's `Player.name`. */
function resolveName(rawName: string, index: number): string {
  const trimmed = rawName.trim();
  return trimmed.length > 0 ? trimmed : `Player ${index + 1}`;
}

/**
 * The game setup screen (Item 015): configure 2-6 players, each with a name
 * and a distinct meeple colour, then start the game.
 *
 * Replaces the Item 014 setup placeholder. Renders when `useGame().session`
 * is `null` (the shell's routing in `App.tsx`); on a successful submit it
 * calls `startGame`, after which the shell routes to the play view.
 */
export function SetupView(): JSX.Element {
  const { startGame } = useGame();
  const [drafts, setDrafts] = useState<PlayerDraft[]>(() => createInitialDrafts());
  const [error, setError] = useState<string | null>(null);

  const canAdd = drafts.length < MAX_PLAYERS;
  const canRemove = drafts.length > MIN_PLAYERS;

  function takenByOthers(excludeId: string): ReadonlySet<string> {
    return new Set(drafts.filter((draft) => draft.id !== excludeId).map((draft) => draft.colourId));
  }

  function handleAdd(): void {
    if (!canAdd) {
      return;
    }
    const taken = new Set(drafts.map((draft) => draft.colourId));
    setDrafts([...drafts, createDraft(taken)]);
  }

  function handleRemove(id: string): void {
    if (!canRemove) {
      return;
    }
    setDrafts(drafts.filter((draft) => draft.id !== id));
  }

  function handleNameChange(id: string, name: string): void {
    setDrafts(drafts.map((draft) => (draft.id === id ? { ...draft, name } : draft)));
  }

  function handleColourChange(id: string, colourId: string): void {
    setDrafts(drafts.map((draft) => (draft.id === id ? { ...draft, colourId } : draft)));
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    const players: Player[] = drafts.map((draft, index) => ({
      id: draft.id,
      name: resolveName(draft.name, index),
      colourId: draft.colourId,
    }));

    try {
      startGame(players);
      setError(null);
    } catch (err) {
      // Backstop: the form keeps colours distinct and respects the 2-6
      // bound, so this should be unreachable in normal use, but a
      // SessionError from the core is still surfaced rather than crashing.
      setError(err instanceof SessionError ? err.message : "Could not start game.");
    }
  }

  return (
    <section data-testid="setup-view">
      <h2>Set up a new game</h2>
      <form onSubmit={handleSubmit}>
        {drafts.map((draft, index) => (
          <PlayerRow
            key={draft.id}
            index={index + 1}
            draft={draft}
            takenByOthers={takenByOthers(draft.id)}
            onNameChange={(name) => handleNameChange(draft.id, name)}
            onColourChange={(colourId) => handleColourChange(draft.id, colourId)}
            onRemove={() => handleRemove(draft.id)}
            removeDisabled={!canRemove}
          />
        ))}
        <div>
          <button type="button" onClick={handleAdd} disabled={!canAdd} data-testid="add-player">
            Add player
          </button>
        </div>
        {error && <p data-testid="setup-error">{error}</p>}
        <button type="submit" data-testid="start-game">
          Start game
        </button>
      </form>
    </section>
  );
}
