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

import { SessionError } from "./errors.js";
import { SESSION_VERSION } from "./session.js";
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
 * @throws {SessionError} kind "malformed-input" on any of:
 *   - invalid JSON
 *   - missing or wrong-typed top-level fields
 *   - malformed player or event entries (missing fields, bad delta/timestamp
 *     type, etc.)
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

  return { version, players, events };
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
