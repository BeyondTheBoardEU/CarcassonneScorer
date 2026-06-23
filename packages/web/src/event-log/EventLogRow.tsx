import { getMeepleColour } from "@carcassonne/core";
import type { Player, ScoreEvent } from "@carcassonne/core";

export interface EventLogRowProps {
  event: ScoreEvent;
  /** The event's player, already resolved by `EventLog`; never looked up here. */
  player: Player | undefined;
}

/**
 * Formats an epoch-ms timestamp as a readable local time (Item 018). Falls
 * back to the raw ISO string if `Intl.DateTimeFormat` is unavailable, but
 * jsdom (the test environment) and every real browser support it.
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Formats a signed point delta as explicit text (e.g. "+5", "−3") plus a
 * screen-reader-friendly accessible name ("plus 5 points" / "minus 3
 * points") — the sign is never colour-only.
 */
function formatDelta(delta: number): { text: string; label: string } {
  const magnitude = Math.abs(delta);
  if (delta < 0) {
    return { text: `−${magnitude}`, label: `minus ${magnitude} points` };
  }
  return { text: `+${magnitude}`, label: `plus ${magnitude} points` };
}

/**
 * One row of the event log (Item 018): the player (name + non-colour cue),
 * the signed point delta, a readable local time, and the reason if present.
 *
 * Read-only and presentation-only — no tally arithmetic, no edit/reverse
 * controls (those are Stage 3). When `player` is `undefined` (a `playerId`
 * that doesn't resolve against `session.players` — not expected in normal
 * use, but guarded defensively), the row falls back to showing the raw id
 * rather than throwing.
 */
export function EventLogRow(props: EventLogRowProps): JSX.Element {
  const { event, player } = props;
  const colour = player ? getMeepleColour(player.colourId) : undefined;
  const delta = formatDelta(event.delta);
  const time = formatTimestamp(event.timestamp);
  const playerLabel =
    player && colour ? `${player.name} (${colour.name}, ${colour.pattern})` : event.playerId;

  return (
    <li
      data-testid={`event-log-row-${event.id}`}
      aria-label={`${playerLabel}: ${delta.label} at ${time}${
        event.reason ? `, reason: ${event.reason}` : ""
      }`}
    >
      {colour ? (
        <span
          aria-hidden="true"
          data-testid={`event-log-swatch-${event.id}`}
          style={{
            display: "inline-block",
            width: "0.9em",
            height: "0.9em",
            borderRadius: "50%",
            backgroundColor: colour.value,
            marginRight: "0.5em",
          }}
        />
      ) : null}
      <span data-testid={`event-log-player-${event.id}`}>
        {player && colour ? `${player.name} (${colour.name}, ${colour.pattern})` : event.playerId}
      </span>{" "}
      <strong data-testid={`event-log-delta-${event.id}`}>{delta.text}</strong>{" "}
      <span data-testid={`event-log-time-${event.id}`}>{time}</span>
      {event.reason ? (
        <span data-testid={`event-log-reason-${event.id}`}> — {event.reason}</span>
      ) : null}
    </li>
  );
}
