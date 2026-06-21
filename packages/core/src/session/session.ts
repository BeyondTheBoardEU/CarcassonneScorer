/**
 * Construction and immutable update for GameSession.
 *
 * Structural guards enforced here (not game-rules checks):
 *   1. A session must have between 2 and 6 players inclusive (player-count).
 *   2. Player ids within a session must be unique (duplicate-player-id).
 *   3. Player colour ids within a session must be unique (duplicate-colour).
 *   4. An appended event's playerId must reference an existing player
 *      (unknown-player).
 *
 * Purity: these functions never call Date.now() or generate randomness.
 * The caller supplies `timestamp` and (optionally) `id` when appending; an
 * omitted `id` is filled deterministically from the session's current event
 * count, so callers must inject these for deterministic tests.
 */

import { SessionError } from "./errors.js";
import type { GameSession, Player, ScoreEvent } from "./types.js";

/** Current schema version written by createSession and checked by Item 019 deserialization. */
export const SESSION_VERSION = 1;

/** Minimum number of players a session may hold (Stage 2 player-count rule). */
export const MIN_PLAYERS = 2;

/** Maximum number of players a session may hold (Stage 2 player-count rule). */
export const MAX_PLAYERS = 6;

/**
 * Creates a fresh GameSession from the given players, with an empty event log.
 *
 * @throws {SessionError} kind "player-count" if `players.length` is outside
 *   [MIN_PLAYERS, MAX_PLAYERS].
 * @throws {SessionError} kind "duplicate-player-id" if two players share an id.
 * @throws {SessionError} kind "duplicate-colour" if two players share a colourId.
 */
export function createSession(players: readonly Player[]): GameSession {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new SessionError(
      "player-count",
      `createSession: expected between ${MIN_PLAYERS} and ${MAX_PLAYERS} players, got ${players.length}.`,
    );
  }

  const seenIds = new Set<string>();
  const seenColours = new Set<string>();
  for (const player of players) {
    if (seenIds.has(player.id)) {
      throw new SessionError(
        "duplicate-player-id",
        `createSession: duplicate player id "${player.id}".`,
      );
    }
    seenIds.add(player.id);

    if (seenColours.has(player.colourId)) {
      throw new SessionError(
        "duplicate-colour",
        `createSession: duplicate colour id "${player.colourId}".`,
      );
    }
    seenColours.add(player.colourId);
  }

  return {
    version: SESSION_VERSION,
    players: [...players],
    events: [],
  };
}

/**
 * Returns a NEW GameSession with `event` appended to the end of the event
 * log. The input `session` is not mutated.
 *
 * If `event.id` is omitted, a deterministic fallback id is derived from the
 * session's current event count (e.g. "event-0", "event-1", ...). Caller
 * supplied `id`/`timestamp` are always honoured as-is.
 *
 * @throws {SessionError} kind "unknown-player" if `event.playerId` does not
 *   reference a player already in `session.players`.
 */
export function addScoreEvent(
  session: GameSession,
  event: Omit<ScoreEvent, "id"> & { id?: string },
): GameSession {
  const knownPlayer = session.players.some((p) => p.id === event.playerId);
  if (!knownPlayer) {
    throw new SessionError(
      "unknown-player",
      `addScoreEvent: unknown playerId "${event.playerId}".`,
    );
  }

  const id = event.id ?? `event-${session.events.length}`;
  const newEvent: ScoreEvent = {
    id,
    playerId: event.playerId,
    delta: event.delta,
    timestamp: event.timestamp,
    ...(event.reason !== undefined ? { reason: event.reason } : {}),
  };

  return {
    version: session.version,
    players: session.players,
    events: [...session.events, newEvent],
  };
}
