import { CORE_READY, coreVersion } from "@carcassonne/core";

/**
 * App — the root component of the Carcassonne Scorer web shell.
 *
 * This is a scaffold only (Item 011): it renders a value imported from
 * `@carcassonne/core` to prove the UI -> core wiring. Later Stage 2 items
 * (012-019) replace/extend this shell with game setup, scoreboard, score
 * entry, log, and persistence. No game/scoring logic lives here.
 */
export function App(): JSX.Element {
  return (
    <main>
      <h1>Carcassonne Scorer</h1>
      <p data-testid="core-status">
        Core ready: {CORE_READY ? "yes" : "no"} (v{coreVersion()})
      </p>
    </main>
  );
}

export default App;
