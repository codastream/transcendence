// ============================================================================
// game.types.ts — Source unique de vérité côté frontend
// Synchronisé avec srcs/game/src/types/game.types.ts (backend)
// ============================================================================

// ---- Primitives ----

export type GameMode = 'local' | 'remote' | 'tournament' | 'ai';
export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';
export type LobbyPhase =
  | 'connecting'
  | 'waiting_players'
  | 'ready_check'
  | 'playing'
  | 'finished'
  | 'disconnected';
export type PlayerRole = 'A' | 'B';
export type PaddleSide = 'left' | 'right';
export type PaddleDirection = 'up' | 'down' | 'stop';
export type BackgroundMode = 'psychedelic' | 'ocean' | 'sunset' | 'grayscale';

// ---- Game State (snapshot reçu du serveur) ----

export interface Scores {
  left: number;
  right: number;
}

export interface GameState {
  ball: {
    x: number;
    y: number;
    radius: number;
    vx?: number;
    vy?: number;
  };
  paddles: {
    left: { y: number; height: number };
    right: { y: number; height: number };
  };
  scores: Scores;
  status: GameStatus;
  cosmicBackground: number[][] | null;
}

// ---- Lobby ----

export interface PlayerInfo {
  role: PlayerRole;
  username: string;
  userId: number | null;
  ready: boolean;
}

export interface GameOverData {
  scores: Scores;
  winner: 'left' | 'right';
  winnerUserId: number | null;
  status: GameStatus;
}

// ---- Protocol WebSocket ----

/** Messages envoyés par le CLIENT vers le serveur */
export interface ClientMessage {
  type: 'paddle' | 'start' | 'stop' | 'ping' | 'ready';
  paddle?: PaddleSide;
  direction?: PaddleDirection;
}

/** Messages reçus du SERVEUR — union discriminante sur `type` */
export type ServerMessage =
  | { type: 'connected'; player: PlayerInfo; sessionName?: string; message?: string }
  | { type: 'player_joined'; players: PlayerInfo[]; message?: string }
  | { type: 'ready_check'; players: PlayerInfo[]; message?: string }
  | { type: 'player_ready'; players: PlayerInfo[]; message?: string }
  | { type: 'player_disconnected'; players: PlayerInfo[]; message?: string }
  | { type: 'state'; data: GameState; message?: string }
  | { type: 'gameOver'; gameOverData: GameOverData; message?: string }
  | { type: 'error'; message: string }
  | { type: 'pong' };
