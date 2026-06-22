import { useGame } from "../state/index.js";
import { PlayerScoreRow } from "./PlayerScoreRow.js";

/**
 * The always-visible running scoreboard (Item 016): one row per player in
 * `session.players`, in session order, showing the meeple colour swatch,
 * a non-colour cue, and the current total.
 *
 * Totals are read straight from `useGame().totals` — the core's
 * `computeTotals(session)` via the store (Item 014) — and never summed or
 * otherwise computed here. A player with no score events still appears
 * with a total of `0`, since `computeTotals` guarantees every player has
 * an entry.
 *
 * Renders `null` when there is no session in progress; the in-game (play)
 * view is the only place this is mounted, so that should not normally
 * happen, but the guard keeps the component safe to render standalone
 * (e.g. in isolation tests) without a session.
 */
export function Scoreboard(): JSX.Element | null {
  const { session, totals } = useGame();

  if (!session) {
    return null;
  }

  return (
    <section data-testid="scoreboard" aria-label="Scoreboard">
      <h2>Scoreboard</h2>
      <ul data-testid="scoreboard-list">
        {session.players.map((player) => (
          <PlayerScoreRow key={player.id} player={player} total={totals[player.id] ?? 0} />
        ))}
      </ul>
    </section>
  );
}
