/**
 * City and road incremental scoring (Item 008).
 *
 * Scores *completed* city and road features for in-game (incremental)
 * scoring: a completed city is worth 2 points per tile plus 2 per pennant; a
 * completed road is worth 1 point per tile. Credited players come from
 * Item 007's `resolveOwnership` — on a tie, every tied player is credited
 * and each receives the feature's full point value. This module does not
 * extract features, derive connectivity/completion, or resolve majority; it
 * only consumes those results from Items 006/007. Monasteries, fields, and
 * incomplete-feature (end-game) scoring are out of scope here — see the
 * Item 008 spec.
 */

import type { Feature, FeatureType } from "../features/types.js";
import type { Position } from "../board/types.js";
import { resolveOwnership } from "./ownership.js";

/** Per-feature scoring breakdown, suitable for a review/tally UI. */
export interface FeatureScore {
  /** The feature's type ("city" | "road" here; "monastery" added in Item 009). */
  readonly type: FeatureType;
  /** Always true for entries this module returns (only completed features are scored). */
  readonly completed: boolean;
  /** The feature's point value: city 2/tile + 2/pennant; road 1/tile. */
  readonly points: number;
  /** Credited majority owner(s); empty if unowned. Each listed player receives the full `points`. */
  readonly players: readonly string[];
  /** `feature.tilePositions.length`. */
  readonly tileCount: number;
  /** City pennant count; 0 for roads. */
  readonly pennants: number;
  /** The feature's tile positions, for UI/breakdown location. */
  readonly tilePositions: readonly Position[];
}

/**
 * Scores a completed city feature: `2 * tileCount + 2 * pennants`.
 *
 * Pure; does not inspect `feature.completed` (callers are expected to only
 * call this on completed city features — the aggregator below enforces
 * that). Ownership is resolved via Item 007's `resolveOwnership`.
 */
export function scoreCity(feature: Feature): FeatureScore {
  const tileCount = feature.tilePositions.length;
  const pennants = feature.pennants;
  const points = 2 * tileCount + 2 * pennants;
  const { owners } = resolveOwnership(feature.meeples);

  return {
    type: feature.type,
    completed: true,
    points,
    players: owners,
    tileCount,
    pennants,
    tilePositions: feature.tilePositions,
  };
}

/**
 * Scores a completed road feature: `1 * tileCount`.
 *
 * Pure; does not inspect `feature.completed` (callers are expected to only
 * call this on completed road features — the aggregator below enforces
 * that). Ownership is resolved via Item 007's `resolveOwnership`.
 */
export function scoreRoad(feature: Feature): FeatureScore {
  const tileCount = feature.tilePositions.length;
  const points = tileCount;
  const { owners } = resolveOwnership(feature.meeples);

  return {
    type: feature.type,
    completed: true,
    points,
    players: owners,
    tileCount,
    pennants: 0,
    tilePositions: feature.tilePositions,
  };
}

/**
 * Scores every completed city/road feature in `features`, preserving input
 * order. Incomplete features and monastery/field features are skipped.
 */
export function scoreCompletedCityRoadFeatures(features: readonly Feature[]): FeatureScore[] {
  const scores: FeatureScore[] = [];

  for (const feature of features) {
    if (!feature.completed) {
      continue;
    }
    if (feature.type === "city") {
      scores.push(scoreCity(feature));
    } else if (feature.type === "road") {
      scores.push(scoreRoad(feature));
    }
  }

  return scores;
}
