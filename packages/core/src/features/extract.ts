/**
 * Feature extraction — groups placed-tile segments into cities, roads,
 * monasteries, and fields, and computes their completion + meeple detail.
 *
 * Pure function over `BoardState` + `Catalog`; no I/O, no input mutation, no
 * scoring, no ownership resolution, no board-legality validation (see item
 * 006 spec "Scope boundary"). Cross-tile adjacency reuses `neighbor` (Item
 * 002) and `rotateSide` / `rotateHalfEdge` (Item 003); this module does not
 * re-derive geometry.
 */

import type { BoardState, Direction, MeeplePlacement, Position, Rotation } from "../board/types.js";
import { neighbor } from "../board/geometry.js";
import type { Catalog, HalfEdge, Segment, Side, TileDefinition } from "../catalog/types.js";
import { rotateHalfEdge, rotateSide } from "../catalog/rotate.js";
import type { Feature, FeatureMeeple, FeatureSegmentRef, FeatureType } from "./types.js";

/** Opposite cardinal direction (N<->S, E<->W). */
const OPPOSITE: Record<Direction, Direction> = { N: "S", S: "N", E: "W", W: "E" };

/**
 * Field half-edge adjacency table: for a board half-edge on side `d` (the
 * key's first component), which half-edge on the neighbour in direction `d`
 * physically meets it. See item 006 spec design decisions for the full table.
 */
const FIELD_HALF_EDGE_MEETS: Record<Direction, Record<string, HalfEdge>> = {
  N: { NW: "SW", NE: "SE" },
  S: { SW: "NW", SE: "NE" },
  E: { EN: "WN", ES: "WS" },
  W: { WN: "EN", WS: "ES" },
};

/** The board direction (side) a board half-edge belongs to. */
const HALF_EDGE_SIDE: Record<HalfEdge, Direction> = {
  NW: "N",
  NE: "N",
  EN: "E",
  ES: "E",
  SE: "S",
  SW: "S",
  WS: "W",
  WN: "W",
};

/** Serialises a Position into a unique string key for map lookups. */
function posKey(p: Position): string {
  return `${p.x},${p.y}`;
}

/** Serialises a (position, segmentId) node into a unique string key. */
function nodeKey(position: Position, segmentId: string): string {
  return `${posKey(position)}|${segmentId}`;
}

/** A placed tile resolved against the catalog, with its board geometry pre-computed. */
interface ResolvedTile {
  readonly position: Position;
  readonly rotation: Rotation;
  readonly definition: TileDefinition;
}

// ---------------------------------------------------------------------------
// Union-find
// ---------------------------------------------------------------------------

class UnionFind {
  private readonly parent = new Map<string, string>();

  add(key: string): void {
    if (!this.parent.has(key)) {
      this.parent.set(key, key);
    }
  }

  find(key: string): string {
    let root = key;
    while (true) {
      const next = this.parent.get(root);
      if (next === undefined || next === root) {
        break;
      }
      root = next;
    }
    // Path compression.
    let cur = key;
    while (cur !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) {
      this.parent.set(ra, rb);
    }
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Extracts all features (cities, roads, monasteries, fields) from a board.
 *
 * Pure: does not mutate `board` or any catalog data. Tiles are resolved via
 * `catalog.getTile(placement.tileId)`; an unknown tile id propagates the
 * existing `CatalogError`. Output is deterministically ordered (see item 006
 * spec "Deterministic output").
 */
export function extractFeatures(board: BoardState, catalog: Catalog): Feature[] {
  const byPosition = new Map<string, ResolvedTile>();
  for (const placement of board.tiles) {
    const definition = catalog.getTile(placement.tileId);
    byPosition.set(posKey(placement.position), {
      position: placement.position,
      rotation: placement.rotation,
      definition,
    });
  }

  const uf = new UnionFind();

  // Register every (position, segmentId) node up front.
  for (const tile of byPosition.values()) {
    for (const seg of tile.definition.segments) {
      uf.add(nodeKey(tile.position, seg.id));
    }
  }

  // Connect city/road segments by side, and field segments by half-edge.
  for (const tile of byPosition.values()) {
    for (const seg of tile.definition.segments) {
      if (seg.type === "city" || seg.type === "road") {
        connectSideSegment(tile, seg, byPosition, uf);
      } else if (seg.type === "field") {
        connectFieldSegment(tile, seg, byPosition, uf);
      }
      // Monasteries: no cross-tile connectivity — single-tile features.
    }
  }

  return buildFeatures(byPosition, uf, board.meeples);
}

// ---------------------------------------------------------------------------
// Connectivity
// ---------------------------------------------------------------------------

/** Connects a city or road segment to its same-type neighbour segments by board side. */
function connectSideSegment(
  tile: ResolvedTile,
  seg: Segment & { type: "city" | "road"; sides: readonly Side[] },
  byPosition: Map<string, ResolvedTile>,
  uf: UnionFind,
): void {
  const boardSides = seg.sides.map((side) => rotateSide(side, tile.rotation));
  for (const d of boardSides) {
    const neighborTile = byPosition.get(posKey(neighbor(tile.position, d)));
    if (neighborTile === undefined) {
      continue;
    }
    const opp = OPPOSITE[d];
    const matched = findSideSegment(neighborTile, opp, seg.type);
    if (matched !== undefined) {
      uf.union(nodeKey(tile.position, seg.id), nodeKey(neighborTile.position, matched.id));
    }
  }
}

/** Finds the segment on `tile` of `type` whose board sides include `side`, if any. */
function findSideSegment(
  tile: ResolvedTile,
  side: Direction,
  type: "city" | "road",
): Segment | undefined {
  for (const seg of tile.definition.segments) {
    if (seg.type !== type) {
      continue;
    }
    const boardSides = seg.sides.map((s) => rotateSide(s, tile.rotation));
    if (boardSides.includes(side)) {
      return seg;
    }
  }
  return undefined;
}

/** Connects a field segment to its neighbour field segment(s) by half-edge. */
function connectFieldSegment(
  tile: ResolvedTile,
  seg: Segment & { type: "field"; halfEdges: readonly HalfEdge[] },
  byPosition: Map<string, ResolvedTile>,
  uf: UnionFind,
): void {
  const boardHalfEdges = seg.halfEdges.map((he) => rotateHalfEdge(he, tile.rotation));
  for (const he of boardHalfEdges) {
    const d = HALF_EDGE_SIDE[he];
    const neighborTile = byPosition.get(posKey(neighbor(tile.position, d)));
    if (neighborTile === undefined) {
      continue;
    }
    const meetingHalfEdge = FIELD_HALF_EDGE_MEETS[d][he];
    if (meetingHalfEdge === undefined) {
      continue;
    }
    const matched = findFieldSegmentOwningHalfEdge(neighborTile, meetingHalfEdge);
    if (matched !== undefined) {
      uf.union(nodeKey(tile.position, seg.id), nodeKey(neighborTile.position, matched.id));
    }
  }
}

/** Finds the field segment on `tile` whose board half-edges include `halfEdge`, if any. */
function findFieldSegmentOwningHalfEdge(
  tile: ResolvedTile,
  halfEdge: HalfEdge,
): Segment | undefined {
  for (const seg of tile.definition.segments) {
    if (seg.type !== "field") {
      continue;
    }
    const boardHalfEdges = seg.halfEdges.map((he) => rotateHalfEdge(he, tile.rotation));
    if (boardHalfEdges.includes(halfEdge)) {
      return seg;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Feature assembly
// ---------------------------------------------------------------------------

/** A node gathered while grouping union-find roots into features. */
interface GatheredNode {
  readonly position: Position;
  readonly segmentId: string;
  readonly segment: Segment;
}

function buildFeatures(
  byPosition: Map<string, ResolvedTile>,
  uf: UnionFind,
  meeples: readonly MeeplePlacement[],
): Feature[] {
  const groups = new Map<string, GatheredNode[]>();

  for (const tile of byPosition.values()) {
    for (const seg of tile.definition.segments) {
      const key = nodeKey(tile.position, seg.id);
      const root = uf.find(key);
      let group = groups.get(root);
      if (group === undefined) {
        group = [];
        groups.set(root, group);
      }
      group.push({ position: tile.position, segmentId: seg.id, segment: seg });
    }
  }

  const meeplesByNode = new Map<string, MeeplePlacement[]>();
  for (const m of meeples) {
    const key = nodeKey(m.position, m.segmentId);
    let list = meeplesByNode.get(key);
    if (list === undefined) {
      list = [];
      meeplesByNode.set(key, list);
    }
    list.push(m);
  }

  const features: Feature[] = [];
  for (const group of groups.values()) {
    features.push(buildFeature(group, byPosition, meeplesByNode));
  }

  return sortFeatures(features);
}

function buildFeature(
  group: GatheredNode[],
  byPosition: Map<string, ResolvedTile>,
  meeplesByNode: Map<string, MeeplePlacement[]>,
): Feature {
  const type = group[0]!.segment.type as FeatureType;

  const segments: FeatureSegmentRef[] = group.map((n) => ({
    position: n.position,
    segmentId: n.segmentId,
  }));

  const tilePositionKeys = new Set<string>();
  const tilePositions: Position[] = [];
  for (const n of group) {
    const key = posKey(n.position);
    if (!tilePositionKeys.has(key)) {
      tilePositionKeys.add(key);
      tilePositions.push(n.position);
    }
  }

  const pennants =
    type === "city"
      ? group.reduce((sum, n) => sum + ((n.segment as { pennant?: boolean }).pennant ? 1 : 0), 0)
      : 0;

  const completed = computeCompleted(type, group, byPosition);

  const meeples: FeatureMeeple[] = [];
  for (const n of group) {
    const found = meeplesByNode.get(nodeKey(n.position, n.segmentId));
    if (found !== undefined) {
      for (const m of found) {
        meeples.push({
          playerId: m.playerId,
          kind: m.kind,
          position: m.position,
          segmentId: m.segmentId,
        });
      }
    }
  }

  return {
    type,
    segments: sortSegmentRefs(segments),
    tilePositions: sortPositions(tilePositions),
    completed,
    meeples: sortMeeples(meeples),
    pennants,
  };
}

/** Computes the `completed` flag per the item 006 spec completion rules. */
function computeCompleted(
  type: FeatureType,
  group: GatheredNode[],
  byPosition: Map<string, ResolvedTile>,
): boolean {
  if (type === "field") {
    return false;
  }

  if (type === "monastery") {
    const { position } = group[0]!;
    return countPresentNeighbours(position, byPosition) === 8;
  }

  // city / road: completed iff no constituent segment has an open board side.
  for (const n of group) {
    const tile = byPosition.get(posKey(n.position))!;
    const seg = n.segment as Segment & { sides: readonly Side[] };
    const boardSides = seg.sides.map((s) => rotateSide(s, tile.rotation));
    for (const d of boardSides) {
      const hasNeighbour = byPosition.has(posKey(neighbor(n.position, d)));
      if (!hasNeighbour) {
        return false;
      }
    }
  }
  return true;
}

const ALL_OFFSETS: readonly Position[] = [
  { x: -1, y: 1 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];

function countPresentNeighbours(position: Position, byPosition: Map<string, ResolvedTile>): number {
  let count = 0;
  for (const offset of ALL_OFFSETS) {
    const p = { x: position.x + offset.x, y: position.y + offset.y };
    if (byPosition.has(posKey(p))) {
      count += 1;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Deterministic ordering
// ---------------------------------------------------------------------------

function comparePositions(a: Position, b: Position): number {
  if (a.x !== b.x) {
    return a.x - b.x;
  }
  return a.y - b.y;
}

function sortPositions(positions: Position[]): Position[] {
  return [...positions].sort(comparePositions);
}

function sortSegmentRefs(refs: FeatureSegmentRef[]): FeatureSegmentRef[] {
  return [...refs].sort((a, b) => {
    const byPos = comparePositions(a.position, b.position);
    if (byPos !== 0) {
      return byPos;
    }
    return a.segmentId < b.segmentId ? -1 : a.segmentId > b.segmentId ? 1 : 0;
  });
}

function sortMeeples(meeples: FeatureMeeple[]): FeatureMeeple[] {
  return [...meeples].sort((a, b) => {
    const byPos = comparePositions(a.position, b.position);
    if (byPos !== 0) {
      return byPos;
    }
    if (a.segmentId !== b.segmentId) {
      return a.segmentId < b.segmentId ? -1 : 1;
    }
    return a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0;
  });
}

/** Sorts features by their minimum (x, y) tile position, then by first segment id. */
function sortFeatures(features: Feature[]): Feature[] {
  return [...features].sort((a, b) => {
    const aMin = minPosition(a.tilePositions);
    const bMin = minPosition(b.tilePositions);
    const byPos = comparePositions(aMin, bMin);
    if (byPos !== 0) {
      return byPos;
    }
    const aSeg = a.segments[0]?.segmentId ?? "";
    const bSeg = b.segments[0]?.segmentId ?? "";
    if (aSeg !== bSeg) {
      return aSeg < bSeg ? -1 : 1;
    }
    return a.type < b.type ? -1 : a.type > b.type ? 1 : 0;
  });
}

function minPosition(positions: readonly Position[]): Position {
  let min = positions[0]!;
  for (const p of positions) {
    if (comparePositions(p, min) < 0) {
      min = p;
    }
  }
  return min;
}
