import { ColourPicker } from "./ColourPicker.js";
import type { PlayerDraft } from "./types.js";

export interface PlayerRowProps {
  /** 1-based position, used for the row's labels (e.g. "Player 1 name"). */
  index: number;
  draft: PlayerDraft;
  /** Colour ids already chosen by *other* rows (kept distinct across rows). */
  takenByOthers: ReadonlySet<string>;
  onNameChange(name: string): void;
  onColourChange(colourId: string): void;
  onRemove(): void;
  /** Remove is disabled once the form is at the minimum player count. */
  removeDisabled: boolean;
}

/**
 * One player's row in the setup form (Item 015): a labelled name input, the
 * `ColourPicker`, and a per-row remove button (disabled at the 2-player
 * floor, enforced by the parent `SetupView`).
 */
export function PlayerRow(props: PlayerRowProps): JSX.Element {
  const { index, draft, takenByOthers, onNameChange, onColourChange, onRemove, removeDisabled } =
    props;
  const nameInputId = `player-name-${draft.id}`;

  return (
    <div data-testid={`player-row-${index}`}>
      <label htmlFor={nameInputId}>Player {index} name</label>
      <input
        id={nameInputId}
        type="text"
        value={draft.name}
        placeholder={`Player ${index}`}
        onChange={(event) => onNameChange(event.target.value)}
      />
      <ColourPicker
        label={`Player ${index} colour`}
        value={draft.colourId}
        takenByOthers={takenByOthers}
        onChange={onColourChange}
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={removeDisabled}
        aria-label={`Remove player ${index}`}
      >
        Remove
      </button>
    </div>
  );
}
