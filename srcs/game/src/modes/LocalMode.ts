// ============================================================================
// LocalMode — Single player, both paddles on same keyboard
// Player A = authenticated user, Player B = guest (GUEST_USER_ID)
// Waits for human player to send 'ready' before starting.
// ============================================================================

import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { IGameMode, UserIdentity } from './IGameMode.js';
import { Session } from '../core/session/Session.js';
import { GameOverData, GUEST_USER_ID, WS_CLOSE } from '../types/game.types.js';
import { createHumanPlayer, createGuestPlayer } from '../core/player/PlayerFactory.js';
import type { MatchRepository } from '../repositories/MatchRepository.js';
import { broadcastToSession, sendToWs } from '../websocket/WsBroadcast.js';

export class LocalMode implements IGameMode {
  constructor(private matchRepo: MatchRepository) {}

  canStart(session: Session): boolean {
    return session.connectedPlayerCount >= 1;
  }

  async onPlayerJoin(
    session: Session,
    ws: WebSocket,
    user: UserIdentity | null,
    app: FastifyInstance,
  ): Promise<boolean> {
    if (session.isFull()) {
      ws.close(WS_CLOSE.SESSION_FULL, 'Session full');
      return false;
    }

    // Player A: the authenticated user
    const playerA = createHumanPlayer('A', user?.id ?? null, ws, user?.username ?? 'anonymous');
    session.setPlayer('A', playerA);

    sendToWs(ws, {
      type: 'connected',
      message: `${playerA.username} connected`,
      player: { role: 'A', username: playerA.username, userId: user?.id ?? null, ready: false },
      sessionName: session.displayName,
    });

    // Player B: guest (no WS, controlled locally)
    const guestB = createGuestPlayer('B');
    session.setPlayer('B', guestB);

    // Ensure the guest player row exists in the DB once at join time
    this.matchRepo.ensureGuestPlayer();

    app.log.info(
      `[${session.id}] Local mode — Player A (${playerA.username}, userId=${user?.id}), Player B = GUEST`,
    );

    // Broadcast player list + trigger ready_check (single player mode)
    broadcastToSession(session, {
      type: 'player_joined',
      message: `${playerA.username} a rejoint la partie`,
      players: session.getPlayersInfo(),
    });

    if (this.canStart(session) && session.game.status === 'waiting') {
      broadcastToSession(session, {
        type: 'ready_check',
        message: 'Prêt ? Envoyez "ready" pour démarrer.',
        players: session.getPlayersInfo(),
      });
      app.log.info(`[${session.id}] Local mode — waiting for player ready`);
    }

    return true;
  }

  async onPlayerDisconnect(session: Session, ws: WebSocket, app: FastifyInstance): Promise<void> {
    const player = session.removePlayerByWs(ws);
    app.log.info(`[${session.id}] Local mode — player disconnected`);

    // Broadcast disconnect to remaining watchers (if any)
    if (session.game.status === 'playing') {
      broadcastToSession(session, {
        type: 'player_disconnected',
        message: `${player?.username ?? 'Un joueur'} a quitté la partie`,
        players: session.getPlayersInfo(),
      });
    }

    // Stop the game regardless of status: no human player remains to control paddles.
    // Stopping during 'playing' triggers the GameLoop's game-over + persist path.
    if (session.connectedPlayerCount === 0 && session.game.status !== 'finished') {
      session.game.stop();
      app.log.info(`[${session.id}] Local mode — no players left, session stopped`);
    }
  }

  async onGameOver(session: Session, result: GameOverData, app: FastifyInstance): Promise<void> {
    const player1Id = session.getUserId('A');
    const player2Id = session.getUserId('B') ?? GUEST_USER_ID;

    if (player1Id == null || !Number.isFinite(player1Id)) {
      app.log.error({ event: 'local_persist_invalid_player', sessionId: session.id });
      return;
    }

    try {
      const winnerId = result.winner === 'left' ? player1Id : player2Id;
      this.matchRepo.createFreeMatch(
        player1Id,
        player2Id,
        session.id,
        result.scores.left,
        result.scores.right,
        winnerId,
      );

      app.log.info({
        event: 'local_match_persisted',
        sessionId: session.id,
        player1Id,
        player2Id,
        scores: result.scores,
        winnerId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      app.log.error({ event: 'local_match_persist_error', sessionId: session.id, err: msg });
    }
  }
}
