// ============================================================================
// WsConnectionManager — Handles WebSocket connection lifecycle
// Delegates join/disconnect logic to the session's IGameMode strategy.
// ============================================================================

import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { WS_CLOSE } from '../types/game.types.js';
import { SessionStore } from '../core/session/SessionStore.js';
import { attachWsMessageHandler } from './WsHandler.js';
import { sendToWs } from './WsBroadcast.js';
import type { UserIdentity } from '../modes/IGameMode.js';

/** Intervalle du heartbeat serveur → client (30s) */
const WS_HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Handle a new WebSocket connection to a game session.
 * - Delegates player join to the session's mode strategy
 * - Attaches message handler
 * - Attaches close/error lifecycle handlers
 * - Lance un heartbeat côté serveur pour détecter les connexions zombies
 */
export async function handleWsConnection(
  ws: WebSocket,
  sessionId: string,
  user: UserIdentity | null,
  sessionStore: SessionStore,
  app: FastifyInstance,
): Promise<void> {
  const session = sessionStore.get(sessionId);
  if (!session) {
    sendToWs(ws, { type: 'error', message: 'No game at this session' });
    ws.close(WS_CLOSE.PLAYER_QUIT, 'Session not found');
    return;
  }

  // Delegate to the mode's join logic (validation, role assignment, ready_check trigger)
  const accepted = await session.mode.onPlayerJoin(session, ws, user, app);
  if (!accepted) return;

  // Attach WS message handler (paddle, start, stop, ping, ready)
  attachWsMessageHandler(ws, session, app);

  // ── Heartbeat serveur ──────────────────────────────────────────────────────
  // Envoie un ping toutes les 30s pour détecter les connexions zombies (réseau coupé
  // sans TCP FIN). Le client doit répondre par un 'pong' (ws.ping/pong natif).
  let isAlive = true;
  const heartbeat = setInterval(() => {
    if (!isAlive) {
      app.log.warn(`[${sessionId}] Heartbeat timeout — terminating zombie connection`);
      clearInterval(heartbeat);
      ws.terminate();
      return;
    }
    isAlive = false;
    try {
      ws.ping();
    } catch {
      /* ignore */
    }
  }, WS_HEARTBEAT_INTERVAL_MS);

  ws.on('pong', () => {
    isAlive = true;
  });

  // Lifecycle: disconnect
  ws.on('close', async (code: number, reason: Buffer) => {
    clearInterval(heartbeat);
    app.log.info(`[${sessionId}] Player disconnected: ${code} - ${reason.toString()}`);

    try {
      await session.mode.onPlayerDisconnect(session, ws, app);
    } catch (err: unknown) {
      app.log.error({ event: 'disconnect_handler_error', sessionId, err });
    }

    // If no connected players and game was waiting, cleanup the orphan session
    if (session.connectedPlayerCount === 0 && session.game.status === 'waiting') {
      session.destroy();
      sessionStore.delete(sessionId);
      app.log.info(`[${sessionId}] Orphan waiting session deleted`);
    }
  });

  // Lifecycle: error
  ws.on('error', (err: Error) => {
    clearInterval(heartbeat);
    app.log.error(`[${sessionId}] WebSocket error: ${err.message}`);
    session.closePlayer(ws, 4444, 'WebSocket error');
  });
}
