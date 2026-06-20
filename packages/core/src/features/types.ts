/**
 * Feature-extraction types.
 *
 * A "feature" is a connected group of same-type segments across the placed
 * tiles of a board: a city, a road, a monastery, or a field. This module
 * describes feature *structure* only — no points (Items 008/009) and no
 * ownership resolution (Item 007). See item 006 spec for the full contract.
 */

import type { MeepleKind, Position } from "../board/types.js";

/** The four feature kinds a segment can belong to. */
export type FeatureType = "city" | "road" | "monastery" | "field";

/** A (tile, segment) member of a feature. */
export interface FeatureSegmentRef {
  /** The placed tile's grid position. */
  readonly position: Position;
  /** Segment id local to that tile's catalog entry. */
  readonly segmentId: string;
}

/** A meeple sitting on a feature (enough detail for Item 007 to resolve ownership). */
export interface FeatureMeeple {
  readonly playerId: string;
  readonly kind: MeepleKind;
  readonly position: Position;
  readonly segmentId: string;
}

/**
 * A connected group of segments forming one city, road, monastery, or field.
 *
 * `completed` is always `false` for fields — fields have no completion
 * concept (they only matter at end-game scoring, Stage 4).
 */
export interface Feature {
  readonly type: FeatureType;
  /** Constituent (tile, segment) pairs, deterministically ordered. */
  readonly segments: readonly FeatureSegmentRef[];
  /** Distinct tile positions spanned by this feature, deterministically ordered. */
  readonly tilePositions: readonly Position[];
  /** True iff the feature has no open side (city/road) or all 8 neighbours are present (monastery). Always false for fields. */
  readonly completed: boolean;
  /** Meeples attached to this feature, deterministically ordered. */
  readonly meeples: readonly FeatureMeeple[];
  /** Total pennant count across constituent city segments; 0 for non-city features. */
  readonly pennants: number;
}
