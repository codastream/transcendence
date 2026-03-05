// ============================================================================
// PlayerFactory — Creates typed Player objects for each game mode
// ============================================================================

import { WebSocket } from 'ws';
import {
  Player,
  PlayerRole,
  PlayerType,
  GUEST_USER_ID,
  AI_USER_ID,
} from '../../types/game.types.js';

/**
 * Create a human player (local or remote)
 */
export function createHumanPlayer(
  role: PlayerRole,
  userId: number | null,
  ws: WebSocket | null = null,
  username: string = 'anonymous',
): Player {
  return { role, type: 'human', userId, username, ws };
}

/**
 * Create the guest player (for local mode, player B)
 */
export function createGuestPlayer(role: PlayerRole = 'B'): Player {
  return { role, type: 'guest', userId: GUEST_USER_ID, username: 'Guest', ws: null };
}

/**
 * Create an AI player (ws connection or headless REST control)
 */
export function createAiPlayer(role: PlayerRole = 'B', ws: WebSocket | null = null): Player {
  return { role, type: 'ai', userId: AI_USER_ID, username: 'AI', ws };
}

/**
 * Generic factory: create a player from type + role
 */
export function createPlayer(
  type: PlayerType,
  role: PlayerRole,
  userId: number | null = null,
  ws: WebSocket | null = null,
  username: string = 'anonymous',
): Player {
  switch (type) {
    case 'human':
      return createHumanPlayer(role, userId, ws, username);
    case 'guest':
      return createGuestPlayer(role);
    case 'ai':
      return createAiPlayer(role);
  }
}
