/**
 * JSON serialization and deserialization for GameSession (Item 019).
 *
 * `serializeSession`   → JSON string (ready for localStorage / file I/O).
 * `deserializeSession` → typed GameSession, or throws SessionError
 *                         ("malformed-input" / "version-mismatch") if the
 *                         JSON is invalid, the shape/values are wrong, or
 *                         the schema version does not match.
 *
 * Mirrors the Item 002 `serializeBoard`/`deserializeBoard` pattern: strict
 * version checking, and the deserializer NEVER returns a partial session —
 * any structural problem throws instead.
 */

import { hasMeepleColour } from "../colours/index.js";
import { SessionError } from "./errors.js";
import { SESSION_VERSION, addScoreEvent, createSession } from "./session.js";
import type { GameSession, Player, ScoreEvent } from "./types.js";

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Serializes `session` to a JSON string.
 *
 * The output is a valid `deserializeSession` input as long as the session
 * was produced by `createSession`/`addScoreEvent` or is otherwise
 * well-formed (Item 012 guarantees JSON-round-trippability).
 */
export function serializeSession(session: GameSession): string {
  return JSON.stringify(session);
}

// ---------------------------------------------------------------------------
// Deserialization & validation
// ---------------------------------------------------------------------------

/**
 * Parses and validates a JSON string produced by `serializeSession`.
 *
 * Beyond shape/type checks, the parsed players and events are re-validated
 * against the same structural invariants `createSession`/`addScoreEvent`
 * enforce (player count bounds, unique player ids, unique colours, every
 * event's `playerId` naming an existing player) by calling those functions
 * rather than duplicating their checks, plus two checks they don't cover:
 * every player's `colourId` must be a known meeple colour
 * (`hasMeepleColour`), and event ids must be unique. A semantically invalid
 * payload (e.g. an unknown `colourId`) is rejected here rather than left to
 * crash later when the UI tries to render it.
 *
 * @throws {SessionError} kind "malformed-input" on any of:
 *   - invalid JSON
 *   - missing or wrong-typed top-level fields
 *   - malformed player or event entries (missing fields, bad delta/timestamp
 *     type, etc.)
 *   - an unknown player `colourId`, or a duplicate event `id`
 * @throws {SessionError} kind "player-count" | "duplicate-player-id" |
 *   "duplicate-colour" | "unknown-player" if the parsed players/events
 *   violate the invariants `createSession`/`addScoreEvent` enforce.
 * @throws {SessionError} kind "version-mismatch" if the parsed `version`
 *   does not equal `SESSION_VERSION`.
 */
export function deserializeSession(json: string): GameSession {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw malformed("input is not valid JSON");
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw malformed("root value must be a JSON object");
  }

  const obj = raw as Record<string, unknown>;

  // --- version ---
  if (typeof obj["version"] !== "number") {
    throw malformed('field "version" must be a number');
  }
  const version = obj["version"] as number;
  if (version !== SESSION_VERSION) {
    throw new SessionError(
      "version-mismatch",
      `deserializeSession: unsupported schema version ${version}; expected ${SESSION_VERSION}.`,
    );
  }

  // --- players ---
  if (!Array.isArray(obj["players"])) {
    throw malformed('field "players" must be an array');
  }
  const players: Player[] = (obj["players"] as unknown[]).map((p, i) => parsePlayer(p, i));

  // --- events ---
  if (!Array.isArray(obj["events"])) {
    throw malformed('field "events" must be an array');
  }
  const events: ScoreEvent[] = (obj["events"] as unknown[]).map((e, i) => parseScoreEvent(e, i));

  // Re-validate structural invariants via the same functions
  // createSession/addScoreEvent use to enforce them, rather than duplicating
  // their checks: player count bounds, unique player ids, unique colours
  // (createSession), and every event's playerId naming an existing player
  // (addScoreEvent). Both throw SessionError with their existing kinds
  // ("player-count", "duplicate-player-id", "duplicate-colour",
  // "unknown-player"), which propagate unchanged.
  let session = createSession(players);

  const seenEventIds = new Set<string>();
  for (const event of events) {
    if (seenEventIds.has(event.id)) {
      throw malformed(`events: duplicate event id "${event.id}"`);
    }
    seenEventIds.add(event.id);
    session = addScoreEvent(session, event);
  }

  return session;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function malformed(detail: string): SessionError {
  return new SessionError("malformed-input", `deserializeSession: ${detail}.`);
}

function parsePlayer(raw: unknown, index: number): Player {
  const ctx = `players[${index}]:`;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw malformed(`${ctx} entry must be an object`);
  }
  const p = raw as Record<string, unknown>;

  if (typeof p["id"] !== "string" || p["id"] === "") {
    throw malformed(`${ctx} id must be a non-empty string`);
  }
  if (typeof p["name"] !== "string" || p["name"] === "") {
    throw malformed(`${ctx} name must be a non-empty string`);
  }
  if (typeof p["colourId"] !== "string" || p["colourId"] === "") {
    throw malformed(`${ctx} colourId must be a non-empty string`);
  }
  if (!hasMeepleColour(p["colourId"])) {
    throw malformed(`${ctx} colourId "${p["colourId"]}" is not a known meeple colour`);
  }

  return {
    id: p["id"] as string,
    name: p["name"] as string,
    colourId: p["colourId"] as string,
  };
}

function parseScoreEvent(raw: unknown, index: number): ScoreEvent {
  const ctx = `events[${index}]:`;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw malformed(`${ctx} entry must be an object`);
  }
  const e = raw as Record<string, unknown>;

  if (typeof e["id"] !== "string" || e["id"] === "") {
    throw malformed(`${ctx} id must be a non-empty string`);
  }
  if (typeof e["playerId"] !== "string" || e["playerId"] === "") {
    throw malformed(`${ctx} playerId must be a non-empty string`);
  }
  if (typeof e["delta"] !== "number" || !Number.isFinite(e["delta"])) {
    throw malformed(`${ctx} delta must be a finite number`);
  }
  if (typeof e["timestamp"] !== "number" || !Number.isFinite(e["timestamp"])) {
    throw malformed(`${ctx} timestamp must be a finite number`);
  }
  if (e["reason"] !== undefined && typeof e["reason"] !== "string") {
    throw malformed(`${ctx} reason must be a string when present`);
  }

  return {
    id: e["id"] as string,
    playerId: e["playerId"] as string,
    delta: e["delta"] as number,
    timestamp: e["timestamp"] as number,
    ...(e["reason"] !== undefined ? { reason: e["reason"] as string } : {}),
  };
}
