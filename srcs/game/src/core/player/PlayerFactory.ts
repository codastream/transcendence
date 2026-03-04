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
): Player {
  return { role, type: 'human', userId, ws };
}

/**
 * Create the guest player (for local mode, player B)
 */
export function createGuestPlayer(role: PlayerRole = 'B'): Player {
  return { role, type: 'guest', userId: GUEST_USER_ID, ws: null };
}

/**
 * Create an AI player (ws connection)
 */
export function createAiPlayer(role: PlayerRole = 'B', ws: WebSocket | null = null): Player {
  return { role, type: 'ai', userId: AI_USER_ID, ws };
}

/**
 * Generic factory: create a player from type + role
 */
export function createPlayer(
  type: PlayerType,
  role: PlayerRole,
  userId: number | null = null,
  ws: WebSocket | null = null,
): Player {
  switch (type) {
    case 'human':
      return createHumanPlayer(role, userId, ws);
    case 'guest':
      return createGuestPlayer(role);
    case 'ai':
      return createAiPlayer(role);
  }
}
