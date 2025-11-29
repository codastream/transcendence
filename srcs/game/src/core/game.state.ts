import type { PongGame } from './game.engine.ts'// Game state storage

export const gameSessions = new Map<string, PongGame>();
export const playerConnections = new Map<string, Set<WebSocket>>();
