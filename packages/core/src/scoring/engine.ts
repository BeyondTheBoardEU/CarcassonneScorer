/**
 * Scoring-engine assembly (Item 009).
 *
 * Wires extraction (Item 006) -> per-feature scoring (Items 008/009) ->
 * per-player tally into a single entry point: `scoreBoard(board, catalog)`.
 * Scope is **completed** features only (the in-game/incremental rule) —
 * incomplete features and fields/farmers are end-game scoring (Stage 4) and
 * out of scope here. This module does not re-derive connectivity,
 * completion, or point math; it only consumes `extractFeatures`,
 * `scoreCity`/`scoreRoad`/`scoreMonastery`, and their `FeatureScore` shape.
 */

import type { BoardState } from "../board/types.js";
import type { Catalog } from "../catalog/types.js";
import { extractFeatures } from "../features/extract.js";
import type { Feature } from "../features/types.js";
import { scoreCity, scoreRoad, type FeatureScore } from "./feature-score.js";
import { scoreMonastery } from "./monastery.js";

/** The outcome of scoring an entire board: completed-feature scores plus per-player totals. */
export interface BoardScore {
  /** All completed city/road/monastery scores, in Item 006's deterministic feature order. */
  readonly features: FeatureScore[];
  /** Per-player summed points across `features`; keys are only players credited by >=1 feature. */
  readonly playerTotals: Record<string, number>;
}

/**
 * Scores every **completed** city/road/monastery feature in `features`,
 * preserving input order (Item 006's deterministic order). Incomplete
 * features and field features are skipped.
 *
 * Pure; does not mutate `features`. Reuses Item 008's `scoreCity`/`scoreRoad`
 * and this item's `scoreMonastery` — no point math is re-derived here.
 */
export function scoreCompletedFeatures(features: readonly Feature[]): FeatureScore[] {
  const scores: FeatureScore[] = [];

  for (const feature of features) {
    if (!feature.completed) {
      continue;
    }
    if (feature.type === "city") {
      scores.push(scoreCity(feature));
    } else if (feature.type === "road") {
      scores.push(scoreRoad(feature));
    } else if (feature.type === "monastery") {
      scores.push(scoreMonastery(feature));
    }
    // Fields are never scored here (end-game scoring, Stage 4).
  }

  return scores;
}

/**
 * Scores an entire board: `extractFeatures` -> `scoreCompletedFeatures` ->
 * per-player tally.
 *
 * Pure; no I/O, no input mutation. For each `FeatureScore`, its `points` are
 * added to every id in `players` (a tie credits each tied player the full
 * value); an unowned feature (`players: []`) contributes to nobody. Result
 * keys are exactly the players credited by >=1 completed feature. An empty
 * board (no tiles) yields `{ features: [], playerTotals: {} }`.
 */
export function scoreBoard(board: BoardState, catalog: Catalog): BoardScore {
  const features = extractFeatures(board, catalog);
  const scoredFeatures = scoreCompletedFeatures(features);

  const playerTotals: Record<string, number> = {};
  for (const score of scoredFeatures) {
    for (const playerId of score.players) {
      playerTotals[playerId] = (playerTotals[playerId] ?? 0) + score.points;
    }
  }

  return { features: scoredFeatures, playerTotals };
}
