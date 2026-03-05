// ============================================================================
// WsConnectionManager — Handles WebSocket connection lifecycle
// Delegates join/disconnect logic to the session's IGameMode strategy.
// ============================================================================

import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { ServerMessage, WS_CLOSE } from '../types/game.types.js';
import { Session } from '../core/session/Session.js';
import { SessionStore } from '../core/session/SessionStore.js';
import { attachWsMessageHandler } from './WsHandler.js';
import { sendToWs } from './WsBroadcast.js';
import type { UserIdentity } from '../modes/IGameMode.js';

/**
 * Handle a new WebSocket connection to a game session.
 * - Delegates player join to the session's mode strategy
 * - Attaches message handler
 * - Attaches close/error lifecycle handlers
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

  // Delegate to the mode's join logic (validation, role assignment, auto-start)
  const accepted = await session.mode.onPlayerJoin(session, ws, user, app);
  if (!accepted) return;

  // Attach WS message handler (paddle, start, stop, ping)
  attachWsMessageHandler(ws, session, app);

  // Lifecycle: disconnect
  ws.on('close', async (code: number, reason: Buffer) => {
    app.log.info(`[${sessionId}] Player disconnected: ${code} - ${reason.toString()}`);

    await session.mode.onPlayerDisconnect(session, ws, app);

    // If no connected players and game was waiting, cleanup
    if (session.connectedPlayerCount === 0 && session.game.status === 'waiting') {
      session.destroy();
      sessionStore.delete(sessionId);
      app.log.info(`[${sessionId}] Orphan waiting session deleted`);
    }
  });

  // Lifecycle: error
  ws.on('error', (err: Error) => {
    app.log.error(`[${sessionId}] WebSocket error: ${err.message}`);
    session.closePlayer(ws, 4444, 'WebSocket error');
  });
}
