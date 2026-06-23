import { useGame } from "../state/index.js";
import { PlayerEntryRow } from "./PlayerEntryRow.js";

/**
 * Manual score entry (Item 017): lets the user add or adjust points for
 * *any* player in the session at any time, via quick increments and a
 * custom amount (negative allowed) with an optional reason.
 *
 * Every row's `onApply` is wired straight to `useGame().addScore`, which
 * delegates to the core's `addScoreEvent` (Item 012) — this component (and
 * `PlayerEntryRow`) never sums or otherwise computes totals; the scoreboard
 * (Item 016) re-renders immediately from the store's `totals`, which are
 * always derived by the core.
 *
 * Renders `null` when there is no session in progress, mirroring the
 * `Scoreboard`'s guard; the play view is the only place this is mounted.
 */
export function ScoreEntry(): JSX.Element | null {
  const { session, addScore } = useGame();

  if (!session) {
    return null;
  }

  return (
    <section data-testid="score-entry" aria-label="Score entry">
      <h2>Add or adjust score</h2>
      <ul data-testid="score-entry-list">
        {session.players.map((player) => (
          <PlayerEntryRow
            key={player.id}
            player={player}
            onApply={(delta, reason) => addScore(player.id, delta, reason)}
          />
        ))}
      </ul>
    </section>
  );
}
