import { useState } from "react";
import type { FormEvent } from "react";
import { getMeepleColour } from "@carcassonne/core";
import type { Player } from "@carcassonne/core";

/** Quick-increment buttons offered alongside the custom-amount field. */
const QUICK_DELTAS: readonly number[] = [1, 2, 5, -1];

export interface PlayerEntryRowProps {
  player: Player;
  /** Dispatches the change via `useGame().addScore` — never computed here. */
  onApply(delta: number, reason?: string): void;
}

/**
 * One player's score-entry controls (Item 017): quick +1/+2/+5/-1 buttons
 * plus a custom amount (any non-zero integer, including negative) with an
 * optional reason.
 *
 * Every control here only ever calls `onApply(delta, reason?)` — supplied by
 * `ScoreEntry`, which forwards straight to `useGame().addScore` — so no
 * tally arithmetic (summing/accumulating points) happens in this component.
 * The custom-amount form rejects a blank/zero/non-integer value by simply
 * not calling `onApply` at all; nothing is dispatched.
 *
 * The target player is identified by name and a non-colour cue (the
 * colour's `name`) in every control's accessible name, alongside the
 * swatch, so colour is never the only signal (mirrors `PlayerScoreRow`,
 * Item 016).
 */
export function PlayerEntryRow(props: PlayerEntryRowProps): JSX.Element {
  const { player, onApply } = props;
  const colour = getMeepleColour(player.colourId);
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const amountInputId = `score-entry-amount-${player.id}`;
  const reasonInputId = `score-entry-reason-${player.id}`;

  function handleQuick(delta: number): void {
    onApply(delta);
  }

  function handleCustomSubmit(event: FormEvent): void {
    event.preventDefault();
    const trimmed = amount.trim();
    if (trimmed.length === 0) {
      // Blank: reject silently, dispatch nothing.
      return;
    }
    // Require an integer literal (optionally signed); reject "3.5", "abc",
    // "1e2", etc. so only whole-point adjustments are dispatched.
    if (!/^[+-]?\d+$/.test(trimmed)) {
      return;
    }
    const delta = Number.parseInt(trimmed, 10);
    if (delta === 0) {
      // Zero is a no-op adjustment: reject, dispatch nothing.
      return;
    }
    const trimmedReason = reason.trim();
    onApply(delta, trimmedReason.length > 0 ? trimmedReason : undefined);
    setAmount("");
    setReason("");
  }

  return (
    <li data-testid={`score-entry-row-${player.id}`} aria-label={`Score entry for ${player.name}`}>
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "0.9em",
          height: "0.9em",
          borderRadius: "50%",
          backgroundColor: colour.value,
          marginRight: "0.5em",
        }}
      />
      <strong data-testid={`score-entry-name-${player.id}`}>
        {player.name} ({colour.name})
      </strong>

      <span role="group" aria-label={`Quick add for ${player.name}`}>
        {QUICK_DELTAS.map((delta) => (
          <button
            key={delta}
            type="button"
            data-testid={`score-entry-quick-${delta}-${player.id}`}
            aria-label={`${delta > 0 ? "Add" : "Subtract"} ${Math.abs(delta)} ${
              delta > 0 ? "to" : "from"
            } ${player.name}`}
            onClick={() => handleQuick(delta)}
          >
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
      </span>

      <form onSubmit={handleCustomSubmit} data-testid={`score-entry-form-${player.id}`}>
        <label htmlFor={amountInputId}>Custom amount for {player.name}</label>
        <input
          id={amountInputId}
          type="number"
          step={1}
          value={amount}
          data-testid={`score-entry-amount-${player.id}`}
          onChange={(event) => setAmount(event.target.value)}
        />
        <label htmlFor={reasonInputId}>Reason (optional) for {player.name}</label>
        <input
          id={reasonInputId}
          type="text"
          value={reason}
          data-testid={`score-entry-reason-${player.id}`}
          onChange={(event) => setReason(event.target.value)}
        />
        <button type="submit" data-testid={`score-entry-apply-${player.id}`}>
          Apply to {player.name}
        </button>
      </form>
    </li>
  );
}
