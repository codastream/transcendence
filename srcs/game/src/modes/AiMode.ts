// ============================================================================
// AiMode — Human (Player A) vs AI (Player B controlled by pong-ai via WS)
// Both players connect via WebSocket:
//   - Player A = human (frontend)
//   - Player B = pong-ai Python service
// ready_check fires when both are connected.
// Game starts when both have sent {type: 'ready'}.
// ============================================================================

import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { IGameMode, UserIdentity } from './IGameMode.js';
import { Session } from '../core/session/Session.js';
import { GameOverData, WS_CLOSE, AI_USER_ID } from '../types/game.types.js';
import { createHumanPlayer, createAiPlayer } from '../core/player/PlayerFactory.js';
import type { MatchRepository } from '../repositories/MatchRepository.js';
import { broadcastToSession, sendToWs } from '../websocket/WsBroadcast.js';

export class AiMode implements IGameMode {
  constructor(private matchRepo: MatchRepository) {}

  canStart(session: Session): boolean {
    // Both players must be WS-connected (human + pong-ai service)
    return session.connectedPlayerCount >= 2;
  }

  async onPlayerJoin(
    session: Session,
    ws: WebSocket,
    user: UserIdentity | null,
    app: FastifyInstance,
  ): Promise<boolean> {
    const isAiConnection = user?.id === AI_USER_ID || user == null;
    const role = isAiConnection ? 'B' : 'A';

    if (session.getPlayer(role)) {
      app.log.warn(
        `[${session.id}] AI mode: slot ${role} already occupied, refusing duplicate connection`,
      );
      ws.close(WS_CLOSE.SESSION_FULL, 'Session full');
      return false;
    }

    const player = isAiConnection
      ? createAiPlayer('B', ws)
      : createHumanPlayer('A', user.id, ws, user.username ?? 'anonymous');

    app.log.info(
      isAiConnection
        ? `[${session.id}] AI mode — Player B (pong-ai service) connected via WS`
        : `[${session.id}] AI mode — Player A (human, userId=${user.id}) connected`,
    );

    session.setPlayer(role, player);

    sendToWs(ws, {
      type: 'connected',
      message: `${player.username} connected`,
      player: { role, username: player.username, userId: player.userId ?? null, ready: false },
      sessionName: session.displayName,
    });

    broadcastToSession(session, {
      type: 'player_joined',
      message: `${player.username} a rejoint la partie`,
      players: session.getPlayersInfo(),
    });

    // Trigger ready_check once both players are connected
    if (this.canStart(session) && session.game.status === 'waiting') {
      broadcastToSession(session, {
        type: 'ready_check',
        message: 'Prêt ? Envoyez "ready" pour démarrer.',
        players: session.getPlayersInfo(),
      });
      app.log.info(`[${session.id}] AI mode — ready_check sent to both players`);
    }

    return true;
  }

  async onPlayerDisconnect(session: Session, ws: WebSocket, app: FastifyInstance): Promise<void> {
    const player = session.removePlayerByWs(ws);
    app.log.info(
      `[${session.id}] AI mode — player ${player?.username ?? '?'} (role ${player?.role ?? '?'}) disconnected`,
    );

    const wasPlaying = session.game.status === 'playing';

    if (wasPlaying) {
      broadcastToSession(session, {
        type: 'player_disconnected',
        message: `${player?.username ?? 'Un joueur'} a quitté la partie`,
        players: session.getPlayersInfo(),
      });
      session.game.stop();
      app.log.info(`[${session.id}] AI mode — game stopped after disconnect`);
    } else if (session.game.status !== 'finished') {
      // Waiting state: no connected players left → clean up
      if (session.connectedPlayerCount === 0) {
        session.game.stop();
        app.log.info(`[${session.id}] AI mode — session stopped (no players left)`);
      }
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
