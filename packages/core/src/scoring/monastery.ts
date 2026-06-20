/**
 * Monastery incremental scoring (Item 009).
 *
 * Scores a *completed* monastery feature for in-game (incremental) scoring: a
 * completed monastery (its tile plus all 8 surrounding tiles present — Item
 * 006 already computes this in `Feature.completed`) is worth a flat 9
 * points, regardless of `tilePositions.length` (always 1 for a monastery).
 * Credited players come from Item 007's `resolveOwnership` — on a tie (not
 * expected for a single-tile monastery, but handled generically) every tied
 * player is credited the full value. This module does not extract features
 * or derive connectivity/completion; it only consumes those results from
 * Item 006. See the Item 009 spec for the scope boundary.
 */

import type { Feature } from "../features/types.js";
import { resolveOwnership } from "./ownership.js";
import type { FeatureScore } from "./feature-score.js";

/**
 * Scores a completed monastery feature: a flat 9 points.
 *
 * Pure; does not inspect `feature.completed` (callers are expected to only
 * call this on completed monastery features — `scoreCompletedFeatures`
 * enforces that). Ownership is resolved via Item 007's `resolveOwnership`.
 */
export function scoreMonastery(feature: Feature): FeatureScore {
  const { owners } = resolveOwnership(feature.meeples);

  return {
    type: feature.type,
    completed: true,
    points: 9,
    players: owners,
    tileCount: 1,
    pennants: 0,
    tilePositions: feature.tilePositions,
  };
}
