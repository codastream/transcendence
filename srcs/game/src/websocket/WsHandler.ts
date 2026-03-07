// ============================================================================
// WsHandler — Routes incoming WS messages to the appropriate action
// No game logic: just message parsing + delegation.
// ============================================================================

import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { ClientMessage, ServerMessage, WS_CLOSE, PaddleDirection } from '../types/game.types.js';
import { Session } from '../core/session/Session.js';
import { broadcastToSession, sendToWs } from './WsBroadcast.js';

/** Directions valides pour le paddle */
const VALID_DIRECTIONS: readonly PaddleDirection[] = ['up', 'down', 'stop'];

/**
 * Attach message handlers to a client WebSocket.
 * Delegates start/stop/paddle/ping/ready to the session and engine.
 */
export function attachWsMessageHandler(
  ws: WebSocket,
  session: Session,
  app: FastifyInstance,
): void {
  ws.on('message', (data: Buffer) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'start':
          // Vérification : le joueur doit être enregistré ET la session doit pouvoir démarrer
          // (canStart vérifie le nombre de joueurs requis selon le mode).
          if (
            session.getPlayerByWs(ws) &&
            session.game.status === 'waiting' &&
            session.mode.canStart(session)
          ) {
            session.clearReady();
            session.game.start();
            broadcastToSession(session, {
              type: 'state',
              message: 'Game started',
              data: session.game.getState(),
            });
            app.log.info(`[${session.id}] Game started via WS 'start' message`);
          } else if (!session.mode.canStart(session)) {
            sendToWs(ws, {
              type: 'error',
              message: 'Not enough players to start the game',
            });
          }
          break;

        case 'ready': {
          // Marque ce joueur comme prêt.
          // Quand tous les joueurs connectés sont prêts ET canStart est satisfait → démarrage.
          const player = session.getPlayerByWs(ws);
          if (!player) {
            sendToWs(ws, { type: 'error', message: 'Player not found in session' });
            break;
          }
          if (session.game.status !== 'waiting') {
            sendToWs(ws, { type: 'error', message: 'Game already started or finished' });
            break;
          }

          const allReady = session.markReady(player.role);

          // Broadcast l'état de préparation à tous les joueurs
          broadcastToSession(session, {
            type: 'player_ready',
            message: `${player.username} est prêt`,
            players: session.getPlayersInfo(),
          });
          app.log.info(`[${session.id}] Player ${player.role} (${player.username}) is ready`);

          // Démarre le jeu quand tous sont prêts ET que le mode l'autorise
          if (allReady && session.mode.canStart(session)) {
            session.game.start();
            broadcastToSession(session, {
              type: 'state',
              message: 'Game started',
              data: session.game.getState(),
            });
            app.log.info(`[${session.id}] All players ready — game started`);
          }
          break;
        }

        case 'stop':
          // "stop" means quit — close this player's connection
          session.closePlayer(ws, WS_CLOSE.PLAYER_QUIT, 'Player quit');
          break;

        case 'paddle':
          if (message.paddle && message.direction) {
            // Valider que la direction est une valeur autorisée
            if (!VALID_DIRECTIONS.includes(message.direction)) {
              sendToWs(ws, { type: 'error', message: 'Invalid paddle direction' });
              break;
            }

            // En mode non-local, chaque joueur ne peut contrôler que son propre paddle.
            // Player A contrôle 'left', Player B contrôle 'right'.
            if (session.gameMode !== 'local') {
              const player = session.getPlayerByWs(ws);
              const expectedSide = player?.role === 'A' ? 'left' : 'right';
              if (!player || message.paddle !== expectedSide) {
                sendToWs(ws, { type: 'error', message: 'Unauthorized paddle control' });
                break;
              }
            }
            session.game.setPaddleDirection(message.paddle, message.direction);
          }
          break;

        case 'ping':
          sendToWs(ws, { type: 'pong' });
          break;

        default:
          sendToWs(ws, { type: 'error', message: 'Unknown message type' });
      }
    } catch (err: unknown) {
      app.log.error(`[${session.id}] Error processing WS message: ${err}`);
      sendToWs(ws, { type: 'error', message: 'Invalid message format' });
    }
  });
}
