// ============================================================================
// IGameMode — Strategy interface for game mode behavior
// Each mode implements how players join, when to start, and how to persist.
// ============================================================================

import { WebSocket } from 'ws';
import { Session } from '../core/session/Session.js';
import { GameOverData } from '../types/game.types.js';
import { FastifyInstance } from 'fastify';

export interface UserIdentity {
  id: number;
  username: string;
}

export interface IGameMode {
  /** Can the game start given the current session state? */
  canStart(session: Session): boolean;

  /**
   * Handle a player joining the session.
   * Responsible for: role assignment, validation, auto-start logic.
   * Returns true if the player was successfully added.
   */
  onPlayerJoin(
    session: Session,
    ws: WebSocket,
    user: UserIdentity | null,
    app: FastifyInstance,
  ): Promise<boolean>;

  /**
   * Handle a player WebSocket disconnecting.
   */
  onPlayerDisconnect(
    session: Session,
    ws: WebSocket,
    app: FastifyInstance,
  ): Promise<void>;

  /**
   * Called when the game finishes.
   * Responsible for: persisting results to DB, triggering bracket progression, etc.
   */
  onGameOver(
    session: Session,
    result: GameOverData,
    app: FastifyInstance,
  ): Promise<void>;
}
