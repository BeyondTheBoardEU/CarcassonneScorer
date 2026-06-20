/**
 * Meeple ownership / majority-tie resolution (Item 007).
 *
 * Decides *who* scores a feature: count meeples per player id (each meeple
 * counts as 1, regardless of `kind`), find the strictly-highest count, and
 * report all players tied at that count as owners. This module returns no
 * point values and does not extract features or read the board/catalog —
 * see the Item 007 spec for the scope boundary.
 */

import type { Feature, FeatureMeeple } from "../features/types.js";

/** The outcome of resolving ownership over a feature's meeples. */
export interface OwnershipResult {
  /** Player id(s) that score the feature; empty if there are no meeples; all tied players on a tie. */
  readonly owners: readonly string[];
  /** The winning meeple count (the max count held by a single player); 0 if there are no meeples. */
  readonly topCount: number;
  /** Meeples per player id, summed. */
  readonly counts: Readonly<Record<string, number>>;
}

/**
 * Resolves majority ownership over a feature's meeples.
 *
 * Pure and total: defined for the empty list. Counts only `playerId`; `kind`
 * does not affect counting (base-game meeples all weigh 1; weighting by kind
 * is an expansion concern, Stage 5, layered on top without changing this
 * function's signature). `owners` is sorted by playerId and the result does
 * not depend on input meeple order.
 */
export function resolveOwnership(meeples: readonly FeatureMeeple[]): OwnershipResult {
  const counts: Record<string, number> = {};

  for (const meeple of meeples) {
    counts[meeple.playerId] = (counts[meeple.playerId] ?? 0) + 1;
  }

  let topCount = 0;
  for (const playerId in counts) {
    const count = counts[playerId]!;
    if (count > topCount) {
      topCount = count;
    }
  }

  const owners =
    topCount === 0
      ? []
      : Object.keys(counts)
          .filter((playerId) => counts[playerId] === topCount)
          .sort();

  return { owners, topCount, counts };
}

/** Convenience wrapper: resolves ownership over a `Feature`'s meeples. */
export function resolveFeatureOwnership(feature: Feature): OwnershipResult {
  return resolveOwnership(feature.meeples);
}
