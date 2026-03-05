// ============================================================================
// TournamentMode — Two players from a tournament bracket
// Validates authorized players from DB match before allowing join.
// Persists results + triggers bracket progression + blockchain publish.
//
// Rôle A = player1 en DB (left paddle), Rôle B = player2 en DB (right paddle)
// L'assignation est déterministe : pas de course condition sur le rôle.
// ============================================================================

import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { IGameMode, UserIdentity } from './IGameMode.js';
import { Session } from '../core/session/Session.js';
import { GameOverData, WS_CLOSE } from '../types/game.types.js';
import { createHumanPlayer } from '../core/player/PlayerFactory.js';
import type { MatchRepository } from '../repositories/MatchRepository.js';
import type { TournamentRepository } from '../repositories/TournamentRepository.js';
import { broadcastToSession, sendToWs } from '../websocket/WsBroadcast.js';

export class TournamentMode implements IGameMode {
  constructor(
    private matchRepo: MatchRepository,
    private tournamentRepo: TournamentRepository,
  ) {}

  canStart(session: Session): boolean {
    return session.connectedPlayerCount >= 2;
  }

  async onPlayerJoin(
    session: Session,
    ws: WebSocket,
    user: UserIdentity | null,
    app: FastifyInstance,
  ): Promise<boolean> {
    // Tournament requires authenticated user
    if (!user?.id) {
      app.log.warn({ sessionId: session.id }, 'Tournament WS: missing userId');
      ws.close(WS_CLOSE.PLAYER_QUIT, 'Missing user identity for tournament match');
      return false;
    }

    // Validate that user is an authorized player in this match
    const match = this.matchRepo.getMatchBySessionId(session.id);
    if (match && match.player1 !== user.id && match.player2 !== user.id) {
      app.log.warn(
        { sessionId: session.id, userId: user.id, expected: [match.player1, match.player2] },
        'Tournament WS: unauthorized player',
      );
      ws.close(WS_CLOSE.PLAYER_QUIT, 'You are not a player in this tournament match');
      return false;
    }

    // Prevent same user from connecting twice
    if (session.getPlayerByUserId(user.id)) {
      app.log.warn({ sessionId: session.id, userId: user.id }, 'Tournament WS: already connected');
      ws.close(WS_CLOSE.SESSION_FULL, 'You are already connected to this match');
      return false;
    }

    // Rôle déterministe depuis la DB :
    // player1 de la DB → rôle A (paddle gauche)
    // player2 de la DB → rôle B (paddle droit)
    let role: 'A' | 'B';
    if (match) {
      role = user.id === match.player1 ? 'A' : 'B';
    } else {
      // Pas encore de match en DB : assignation séquentielle fallback
      const nextRole = session.getNextAvailableRole();
      if (!nextRole) {
        ws.close(WS_CLOSE.SESSION_FULL, 'Session full');
        return false;
      }
      role = nextRole;
    }

    // Vérifier que ce slot n'est pas déjà pris (protection double-connexion)
    if (session.getPlayer(role)) {
      ws.close(WS_CLOSE.SESSION_FULL, 'Slot already taken');
      return false;
    }

    const player = createHumanPlayer(role, user.id, ws, user.username);
    session.setPlayer(role, player);

    // Informer le joueur de son rôle et du nom de la session
    sendToWs(ws, {
      type: 'connected',
      message: `${user.username} connected`,
      player: { role, username: user.username, userId: user.id, ready: false },
      sessionName: session.displayName,
    });
    app.log.info(
      `[${session.id}] Tournament: Player ${role} (userId=${user.id}, username=${user.username}) connected`,
    );

    // Informer TOUS les joueurs de la connexion du nouveau joueur
    broadcastToSession(session, {
      type: 'player_joined',
      message: `${user.username} a rejoint la partie`,
      players: session.getPlayersInfo(),
    });

    // Quand les deux joueurs sont là, passer en mode ready_check (pas d'auto-start)
    if (this.canStart(session) && session.game.status === 'waiting') {
      broadcastToSession(session, {
        type: 'ready_check',
        message: 'Les deux joueurs sont connectés. Envoyez "ready" pour démarrer.',
        players: session.getPlayersInfo(),
      });
      app.log.info(`[${session.id}] Tournament: both players connected — waiting for ready`);
    }

    return true;
  }

  async onPlayerDisconnect(session: Session, ws: WebSocket, app: FastifyInstance): Promise<void> {
    const player = session.removePlayerByWs(ws);
    app.log.info(
      `[${session.id}] Tournament: Player ${player?.role ?? '?'} (${player?.username ?? '?'}) disconnected`,
    );

    // Réinitialiser les ready players si la partie n'a pas encore commencé
    if (session.game.status === 'waiting') {
      session.clearReady();
    }

    // A disconnection mid-game must stop the engine so GameLoop can persist the
    // partial result and advance the bracket.
    if (session.game.status === 'playing') {
      broadcastToSession(session, {
        type: 'player_disconnected',
        message: `${player?.username ?? 'Un joueur'} a quitté la partie — victoire par forfait`,
        players: session.getPlayersInfo(),
      });
      app.log.info(`[${session.id}] Tournament: player left mid-game — game stopped (forfeit)`);
      session.game.stop();
    }
  }

  async onGameOver(session: Session, result: GameOverData, app: FastifyInstance): Promise<void> {
    const tournamentId = session.tournamentId;
    if (tournamentId == null) {
      app.log.error({ event: 'tournament_persist_no_id', sessionId: session.id });
      return;
    }

    try {
      const match = this.matchRepo.getMatchBySessionId(session.id);
      if (!match) {
        app.log.error({ event: 'tournament_persist_no_match', sessionId: session.id });
        return;
      }

      // Map roles to DB players: A = left paddle, B = right paddle
      // Rôle A est toujours player1 en DB (assignation déterministe dans onPlayerJoin)
      const playerAUserId = session.getUserId('A');
      let scorePlayer1: number;
      let scorePlayer2: number;

      if (playerAUserId === match.player1) {
        scorePlayer1 = result.scores.left;
        scorePlayer2 = result.scores.right;
      } else {
        scorePlayer1 = result.scores.right;
        scorePlayer2 = result.scores.left;
      }

      const winnerId = scorePlayer1 > scorePlayer2 ? match.player1 : match.player2;

      // Persist match result + trigger bracket progression
      this.matchRepo.updateMatchResult(match.id, scorePlayer1, scorePlayer2, winnerId);

      app.log.info({
        event: 'tournament_match_persisted',
        matchId: match.id,
        scorePlayer1,
        scorePlayer2,
        winnerId,
      });

      // Check tournament completion
      const isComplete = this.tournamentRepo.isTournamentComplete(tournamentId);
      if (isComplete) {
        this.tournamentRepo.setTournamentFinished(tournamentId);
        app.log.info({ event: 'tournament_complete', tournamentId });

        // Publish to blockchain via Redis stream
        await this.publishToBlockchain(app, tournamentId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      app.log.error({ event: 'tournament_persist_error', sessionId: session.id, err: msg });
    }
  }

  private async publishToBlockchain(app: FastifyInstance, tournamentId: number): Promise<void> {
    try {
      const payload = this.tournamentRepo.getTournamentResultForBlockchain(tournamentId);
      if (!payload) {
        app.log.warn({ event: 'blockchain_publish_no_data', tournamentId });
        return;
      }
      if (!app.redis) {
        app.log.warn({ event: 'blockchain_publish_no_redis', tournamentId });
        return;
      }

      await app.redis.xadd('tournament.results', '*', 'data', JSON.stringify(payload));
      app.log.info({ event: 'blockchain_published', tournamentId, payload });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      app.log.error({ event: 'blockchain_publish_error', tournamentId, err: msg });
      // Non-blocking: blockchain failure should not break game flow
    }
  }
}
