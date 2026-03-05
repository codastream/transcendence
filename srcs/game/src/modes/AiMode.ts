// ============================================================================
// AiMode — Human (Player A) vs AI (Player B controlled via REST RL API)
// AI paddle movement comes from the pong-ai service calling REST endpoints.
// Player A = human (WS connection), Player B = AI (headless, no WS).
// ============================================================================

import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { IGameMode, UserIdentity } from './IGameMode.js';
import { Session } from '../core/session/Session.js';
import { GameOverData, WS_CLOSE, AI_USER_ID } from '../types/game.types.js';
import { createHumanPlayer, createAiPlayer } from '../core/player/PlayerFactory.js';
import type { MatchRepository } from '../repositories/MatchRepository.js';

export class AiMode implements IGameMode {
  constructor(private matchRepo: MatchRepository) {}

  canStart(session: Session): boolean {
    // AI mode starts when 1 human player is connected (AI connected WS first)
    return session.connectedPlayerCount >= 1;
  }

  async onPlayerJoin(
    session: Session,
    ws: WebSocket,
    user: UserIdentity | null,
    app: FastifyInstance,
  ): Promise<boolean> {
    // Only one human WS connection is allowed (player A)
    if (session.getPlayer('A') !== undefined) {
      app.log.warn(`[${session.id}] AI mode: human player already connected, refusing`);
      ws.close(WS_CLOSE.SESSION_FULL, 'Session full');
      return false;
    }

    // Player A = human
    const safeUserId = user?.id != null && Number.isFinite(user.id) ? user.id : null;
    const playerA = createHumanPlayer('A', safeUserId, ws, user?.username ?? 'anonymous');
    session.setPlayer('A', playerA);

    // Player B = AI (headless — no WS, controlled via REST /ai/step)
    // Created here so the right paddle exists from the start.
    const aiPlayer = createAiPlayer('B');
    session.setPlayer('B', aiPlayer);

    ws.send(
      JSON.stringify({
        type: 'connected',
        message: `${playerA.username} connected`,
        player: { role: 'A', username: playerA.username, userId: safeUserId, ready: false },
        sessionName: session.displayName,
      }),
    );
    app.log.info(
      `[${session.id}] AI mode — Player A (userId=${safeUserId}), Player B = AI (headless)`,
    );

    // Auto-start: 1 human + AI created = ready to play
    if (this.canStart(session) && session.game.status === 'waiting') {
      session.game.start();
      app.log.info(`[${session.id}] AI mode: human connected + AI ready — game auto-started`);
    }

    return true;
  }

  async onPlayerDisconnect(session: Session, ws: WebSocket, app: FastifyInstance): Promise<void> {
    const player = session.removePlayerByWs(ws);
    app.log.info(`[${session.id}] AI mode — human player ${player?.username ?? '?'} disconnected`);

    // Stop whether 'waiting' or 'playing': without a human the session is meaningless.
    if (session.connectedPlayerCount === 0 && session.game.status !== 'finished') {
      session.game.stop();
      app.log.info(`[${session.id}] AI mode — session stopped (no human player)`);
    }
  }

  async onGameOver(session: Session, result: GameOverData, app: FastifyInstance): Promise<void> {
    const player1Id = session.getUserId('A');
    if (player1Id == null || !Number.isFinite(player1Id)) {
      app.log.warn({ event: 'ai_match_no_human_player', sessionId: session.id });
      return;
    }

    try {
      // AI matches stored as free matches, player2 = AI_USER_ID marker
      const winnerId = result.winner === 'left' ? player1Id : AI_USER_ID;
      this.matchRepo.createFreeMatch(
        player1Id,
        AI_USER_ID,
        session.id,
        result.scores.left,
        result.scores.right,
        winnerId,
      );

      app.log.info({
        event: 'ai_match_persisted',
        sessionId: session.id,
        humanId: player1Id,
        scores: result.scores,
        winnerId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      app.log.error({ event: 'ai_match_persist_error', sessionId: session.id, err: msg });
    }
  }
}
