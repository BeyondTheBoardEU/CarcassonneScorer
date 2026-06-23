import { useGame } from "../state/index.js";
import { EventLogRow } from "./EventLogRow.js";

/**
 * The score event log (Item 018): a read-only, traceable record of every
 * score change — which player, how many points (signed), when, and the
 * reason if one was given.
 *
 * **Order:** newest-first. `session.events` is append-ordered (oldest
 * first, per Item 012's `addScoreEvent`), so this component reverses a
 * shallow copy before rendering. Newest-first suits a running log users
 * check most often for "what just happened"; the order is deterministic
 * from `session.events` and does not depend on render timing.
 *
 * Reads `session.events`/`session.players` from `useGame()` and resolves
 * each event's `playerId` to a `Player` for `EventLogRow`; performs no
 * tally arithmetic and produces no events itself. No edit/reverse controls
 * — this is Stage 2 display only; Stage 3 makes the log interactive.
 *
 * Renders `null` when there is no session in progress, mirroring the
 * `Scoreboard`/`ScoreEntry` guard; the play view is the only place this is
 * mounted.
 */
export function EventLog(): JSX.Element | null {
  const { session } = useGame();

  if (!session) {
    return null;
  }

  const playersById = new Map(session.players.map((player) => [player.id, player]));
  const orderedEvents = [...session.events].reverse();

  return (
    <section data-testid="event-log" aria-label="Score event log">
      <h2>Score event log</h2>
      {orderedEvents.length === 0 ? (
        <p data-testid="event-log-empty">No score changes yet</p>
      ) : (
        <ul data-testid="event-log-list">
          {orderedEvents.map((event) => (
            <EventLogRow key={event.id} event={event} player={playersById.get(event.playerId)} />
          ))}
        </ul>
      )}
    </section>
  );
}
