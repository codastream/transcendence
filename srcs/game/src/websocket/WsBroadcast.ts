// ============================================================================
// WsBroadcast — Send messages to session players
// Pure transport: serializes and sends, no game logic.
// ============================================================================

import { WebSocket } from 'ws';
import { ServerMessage } from '../types/game.types.js';
import { Session } from '../core/session/Session.js';

/** Send a ServerMessage to a single WebSocket */
export function sendToWs(ws: WebSocket, message: ServerMessage): void {
  try {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  } catch {
    // silently ignore send errors
  }
}

/** Broadcast a ServerMessage to all active WebSocket connections in a session */
export function broadcastToSession(session: Session, message: ServerMessage): void {
  const messageStr = JSON.stringify(message);
  for (const ws of session.getActiveWebSockets()) {
    try {
      ws.send(messageStr);
    } catch {
      // silently ignore per-socket errors
    }
  }
}
