// ============================================================================
// CreateSession — Orchestrates session creation for any game mode
// ============================================================================

import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { GameMode } from '../types/game.types.js';
import { Session } from '../core/session/Session.js';
import { SessionStore } from '../core/session/SessionStore.js';
import { createGameMode } from '../modes/GameModeFactory.js';
import { MatchRepository } from '../repositories/MatchRepository.js';
import { TournamentRepository } from '../repositories/TournamentRepository.js';

export interface CreateSessionInput {
  gameMode: GameMode;
  tournamentId?: number | null;
  creatorUserId: number | null;
  /** Nom d'affichage du créateur, pour nommer la session de façon lisible */
  creatorUsername?: string | null;
}

export interface CreateSessionResult {
  session: Session;
  sessionId: string;
}

export function createSession(
  input: CreateSessionInput,
  sessionStore: SessionStore,
  matchRepo: MatchRepository,
  tournamentRepo: TournamentRepository,
  app: FastifyInstance,
): CreateSessionResult {
  let sessionId: string;

  // For tournament mode, the sessionId comes from the DB match
  if (
    input.gameMode === 'tournament' &&
    input.tournamentId != null &&
    input.creatorUserId != null
  ) {
    const matchToPlay = tournamentRepo.getMatchToPlay(input.tournamentId, input.creatorUserId);
    if (!matchToPlay?.sessionId) {
      throw new Error('No match to play or missing sessionId for tournament');
    }
    sessionId = matchToPlay.sessionId;
  } else {
    sessionId = randomUUID();
  }

  // If session already exists (re-join for tournament), return it
  const existing = sessionStore.get(sessionId);
  if (existing) {
    return { session: existing, sessionId };
  }

  // Create new session with the appropriate mode strategy
  const mode = createGameMode(input.gameMode, matchRepo, tournamentRepo);

  // Nom lisible : "Partie de Alice" plutôt qu'un UUID
  const displayName = input.creatorUsername ? `${input.creatorUsername}` : sessionId.slice(0, 8);

  const session = new Session(
    sessionId,
    input.gameMode,
    input.tournamentId ?? null,
    mode,
    displayName,
  );

  sessionStore.set(sessionId, session);

  app.log.info(
    `[${sessionId}] Session created (mode=${input.gameMode}, tournament=${input.tournamentId ?? 'none'})`,
  );

  return { session, sessionId };
}
