// ============================================================================
// RemoteMode — Two remote players, each controlling one paddle via WebSocket
// Requiert que les DEUX joueurs soient connectés ET envoient 'ready' pour démarrer.
// Plus d'auto-start immédiat : étape de préparation (ready check).
// ============================================================================

import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { IGameMode, UserIdentity } from './IGameMode.js';
import { Session } from '../core/session/Session.js';
import { GameOverData, WS_CLOSE } from '../types/game.types.js';
import { createHumanPlayer } from '../core/player/PlayerFactory.js';
import type { MatchRepository } from '../repositories/MatchRepository.js';
import { broadcastToSession, sendToWs } from '../websocket/WsBroadcast.js';

export class RemoteMode implements IGameMode {
  constructor(private matchRepo: MatchRepository) {}

  canStart(session: Session): boolean {
    return session.connectedPlayerCount >= 2;
  }

  async onPlayerJoin(
    session: Session,
    ws: WebSocket,
    user: UserIdentity | null,
    app: FastifyInstance,
  ): Promise<boolean> {
    const role = session.getNextAvailableRole();
    if (!role) {
      app.log.info(`[${session.id}] Remote: session full, refused connection`);
      ws.close(WS_CLOSE.SESSION_FULL, 'Session full');
      return false;
    }

    const safeUserId = user?.id != null && Number.isFinite(user.id) ? user.id : null;
    const player = createHumanPlayer(role, safeUserId, ws, user?.username ?? 'anonymous');
    session.setPlayer(role, player);

    // Informer le joueur de son rôle
    sendToWs(ws, {
      type: 'connected',
      message: `${player.username} connected`,
      player: { role, username: player.username, userId: safeUserId, ready: false },
      sessionName: session.displayName,
    });
    app.log.info(
      `[${session.id}] Player ${role} (${player.username}, userId=${safeUserId}) connected`,
    );

    // Informer tout le lobby de la nouvelle connexion
    broadcastToSession(session, {
      type: 'player_joined',
      message: `${player.username} a rejoint la partie`,
      players: session.getPlayersInfo(),
    });

    // Quand les deux joueurs sont là, passer en mode ready_check
    if (this.canStart(session) && session.game.status === 'waiting') {
      broadcastToSession(session, {
        type: 'ready_check',
        message: 'Les deux joueurs sont connectés. Envoyez "ready" pour démarrer.',
        players: session.getPlayersInfo(),
      });
      app.log.info(`[${session.id}] Remote: both players connected — waiting for ready`);
    }

    return true;
  }

  async onPlayerDisconnect(session: Session, ws: WebSocket, app: FastifyInstance): Promise<void> {
    const player = session.removePlayerByWs(ws);
    app.log.info(
      `[${session.id}] Remote: Player ${player?.role ?? '?'} (${player?.username ?? '?'}) disconnected`,
    );

    // Déterminer s'il reste un joueur connecté
    const remainingPlayer = session.getAllPlayers().find((p) => p.ws !== null);

    // Si un joueur reste ET que le jeu est en attente ou en cours → victoire par forfait
    if (
      remainingPlayer &&
      (session.game.status === 'waiting' || session.game.status === 'playing')
    ) {
      app.log.info(
        `[${session.id}] Remote: ${player?.username ?? 'Un joueur'} disconnected — ${remainingPlayer.username} wins by forfeit`,
      );

      // Affecter les scores : le joueur restant obtient le score max, l'autre 0
      const maxScore = session.game.settings.maxScore;
      if (remainingPlayer.role === 'A') {
        session.game.scores.left = maxScore;
        session.game.scores.right = 0;
      } else {
        session.game.scores.left = 0;
        session.game.scores.right = maxScore;
      }

      // Marquer le jeu comme terminé
      session.game.stop();

      // Broadcast la victoire par forfait
      broadcastToSession(session, {
        type: 'player_disconnected',
        message: `${player?.username ?? 'Un joueur'} a quitté la partie — ${remainingPlayer.username} gagne par forfait`,
        players: session.getPlayersInfo(),
      });

      // Le GameLoop détectera le status 'finished' et persistera le résultat
      return;
    }

    // Si plus aucun joueur n'est connecté
    if (session.connectedPlayerCount === 0) {
      session.clearReady();
      if (session.game.status === 'waiting') {
        session.game.stop();
        app.log.info(`[${session.id}] Remote: no players left, session stopped`);
      }
    }

    // Si un joueur se déconnecte mais qu'on attend encore l'autre (ex: seul le premier était connecté)
    if (session.game.status === 'waiting' && session.connectedPlayerCount > 0) {
      session.clearReady();
      broadcastToSession(session, {
        type: 'player_joined',
        message: `${player?.username ?? 'Un joueur'} a quitté la session`,
        players: session.getPlayersInfo(),
      });
    }
  }

  async onGameOver(session: Session, result: GameOverData, app: FastifyInstance): Promise<void> {
    const player1Id = session.getUserId('A');
    const player2Id = session.getUserId('B');

    if (
      player1Id == null ||
      !Number.isFinite(player1Id) ||
      player2Id == null ||
      !Number.isFinite(player2Id)
    ) {
      app.log.warn({
        event: 'free_match_missing_players',
        sessionId: session.id,
        playerA: player1Id,
        playerB: player2Id,
      });
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
        event: 'free_match_persisted',
        sessionId: session.id,
        player1Id,
        player2Id,
        scores: result.scores,
        winnerId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      app.log.error({ event: 'free_match_persist_error', sessionId: session.id, err: msg });
    }
  }
}
