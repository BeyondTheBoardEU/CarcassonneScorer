import { getMeepleColour } from "@carcassonne/core";
import type { Player } from "@carcassonne/core";

export interface PlayerScoreRowProps {
  player: Player;
  /** Current total for this player, already computed by the core (Item 012). */
  total: number;
}

/**
 * One row of the scoreboard (Item 016): a player's meeple colour swatch,
 * the colour's non-colour cue (`name`/`pattern`, Item 013), and their
 * current total — read, never computed, by this component.
 *
 * The colour swatch alone is never the only signal distinguishing players:
 * the visible `name (pattern)` text and an `aria-label` on the row both
 * carry the same information as plain, screen-reader-friendly text (e.g.
 * "Alice (red, solid): 12 points").
 */
export function PlayerScoreRow(props: PlayerScoreRowProps): JSX.Element {
  const { player, total } = props;
  const colour = getMeepleColour(player.colourId);

  return (
    <li
      data-testid={`scoreboard-row-${player.id}`}
      aria-label={`${player.name} (${colour.name}): ${total} points`}
    >
      <span
        aria-hidden="true"
        data-testid={`scoreboard-swatch-${player.id}`}
        style={{
          display: "inline-block",
          width: "0.9em",
          height: "0.9em",
          borderRadius: "50%",
          backgroundColor: colour.value,
          marginRight: "0.5em",
        }}
      />
      <span data-testid={`scoreboard-name-${player.id}`}>{player.name}</span>{" "}
      <span data-testid={`scoreboard-colour-${player.id}`}>
        ({colour.name}, {colour.pattern})
      </span>
      <strong data-testid={`scoreboard-total-${player.id}`} style={{ marginLeft: "0.5em" }}>
        {total}
      </strong>
    </li>
  );
}
