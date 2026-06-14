/**
 * JSON serialization and deserialization for BoardState.
 *
 * `serializeBoard`   → compact JSON string (ready for localStorage / file I/O).
 * `deserializeBoard` → typed BoardState, or throws BoardStateError("malformed-input")
 *                       if the JSON is invalid or the shape/values are wrong.
 *
 * A `version` field is written into every serialized document so that future
 * readers can detect forward-incompatible data (the Stage 2 persistence layer
 * will use this).
 */

import { BOARD_STATE_VERSION } from "./builder.js";
import { BoardStateError } from "./errors.js";
import type { BoardState, MeeplePlacement, Position, Rotation, TilePlacement } from "./types.js";

const VALID_ROTATIONS: ReadonlySet<number> = new Set([0, 90, 180, 270]);

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Serializes `state` to a JSON string.
 *
 * The output is a valid `deserializeBoard` input as long as the state was
 * produced by `createBoard().build()` or is otherwise well-formed.
 */
export function serializeBoard(state: BoardState): string {
  return JSON.stringify(state);
}

// ---------------------------------------------------------------------------
// Deserialization & validation
// ---------------------------------------------------------------------------

/**
 * Parses and validates a JSON string produced by `serializeBoard`.
 *
 * @throws {BoardStateError} kind "malformed-input" on any of:
 *   - invalid JSON
 *   - missing or wrong-typed top-level fields
 *   - unknown / unsupported schema version
 *   - malformed tile or meeple entries (missing fields, bad rotation, etc.)
 */
export function deserializeBoard(json: string): BoardState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BoardStateError("malformed-input", "deserializeBoard: input is not valid JSON.");
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    malformed("root value must be a JSON object");
  }

  const obj = raw as Record<string, unknown>;

  // --- version ---
  if (typeof obj["version"] !== "number") {
    malformed('field "version" must be a number');
  }
  const version = obj["version"] as number;
  if (version !== BOARD_STATE_VERSION) {
    malformed(`unsupported schema version ${version}; expected ${BOARD_STATE_VERSION}`);
  }

  // --- tiles ---
  if (!Array.isArray(obj["tiles"])) {
    malformed('field "tiles" must be an array');
  }
  const tiles: TilePlacement[] = (obj["tiles"] as unknown[]).map((t, i) =>
    parseTilePlacement(t, i),
  );

  // --- meeples ---
  if (!Array.isArray(obj["meeples"])) {
    malformed('field "meeples" must be an array');
  }
  const meeples: MeeplePlacement[] = (obj["meeples"] as unknown[]).map((m, i) =>
    parseMeeplePlacement(m, i),
  );

  return { version, tiles, meeples };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function malformed(detail: string): never {
  throw new BoardStateError("malformed-input", `deserializeBoard: ${detail}.`);
}

function parsePosition(raw: unknown, ctx: string): Position {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    malformed(`${ctx} position must be an object`);
  }
  const p = raw as Record<string, unknown>;
  if (typeof p["x"] !== "number") malformed(`${ctx} position.x must be a number`);
  if (typeof p["y"] !== "number") malformed(`${ctx} position.y must be a number`);
  return { x: p["x"] as number, y: p["y"] as number };
}

function parseTilePlacement(raw: unknown, index: number): TilePlacement {
  const ctx = `tiles[${index}]:`;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    malformed(`${ctx} entry must be an object`);
  }
  const t = raw as Record<string, unknown>;

  if (typeof t["tileId"] !== "string" || t["tileId"] === "") {
    malformed(`${ctx} tileId must be a non-empty string`);
  }
  const position = parsePosition(t["position"], ctx);
  if (!VALID_ROTATIONS.has(t["rotation"] as number)) {
    malformed(
      `${ctx} rotation must be one of 0, 90, 180, 270 (got ${JSON.stringify(t["rotation"])})`,
    );
  }

  return {
    tileId: t["tileId"] as string,
    position,
    rotation: t["rotation"] as Rotation,
  };
}

function parseMeeplePlacement(raw: unknown, index: number): MeeplePlacement {
  const ctx = `meeples[${index}]:`;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    malformed(`${ctx} entry must be an object`);
  }
  const m = raw as Record<string, unknown>;

  if (typeof m["playerId"] !== "string" || m["playerId"] === "") {
    malformed(`${ctx} playerId must be a non-empty string`);
  }
  const position = parsePosition(m["position"], ctx);
  if (typeof m["segmentId"] !== "string" || m["segmentId"] === "") {
    malformed(`${ctx} segmentId must be a non-empty string`);
  }
  if (typeof m["kind"] !== "string" || m["kind"] === "") {
    malformed(`${ctx} kind must be a non-empty string`);
  }

  return {
    playerId: m["playerId"] as string,
    position,
    segmentId: m["segmentId"] as string,
    kind: m["kind"] as string,
  };
}
