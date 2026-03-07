// ============================================================================
// Session — Represents a live game session with players and engine
// ============================================================================

import { WebSocket } from 'ws';
import { PongGame } from '../engine/PongGame.js';
import { Player, PlayerRole, GameMode, WS_CLOSE, PlayerInfo } from '../../types/game.types.js';
import type { IGameMode } from '../../modes/IGameMode.js';

export class Session {
  readonly id: string;
  readonly gameMode: GameMode;
  readonly tournamentId: number | null;
  readonly createdAt: number;
  readonly game: PongGame;
  readonly mode: IGameMode;

  /**
   * Nom lisible de la session (ex: "match de Alice" au lieu du UUID).
   * Utilisé uniquement pour l'affichage côté client.
   */
  displayName: string;

  /** Rôles ayant envoyé le signal 'ready' — pour le mécanisme de préparation */
  private readyPlayers: Set<PlayerRole> = new Set();

  /** Ordered by role: A = left, B = right */
  private players: Map<PlayerRole, Player> = new Map();

  /** Communication interval reference (16ms broadcast loop) */
  interval: NodeJS.Timeout | null = null;

  /** Guards against double-persist on game finish */
  persisted: boolean = false;

  constructor(
    id: string,
    gameMode: GameMode,
    tournamentId: number | null,
    mode: IGameMode,
    displayName?: string,
  ) {
    this.id = id;
    this.gameMode = gameMode;
    this.tournamentId = tournamentId;
    this.mode = mode;
    this.createdAt = Date.now();
    this.game = new PongGame(id);
    this.displayName = displayName ?? id;
  }

  // ---- Player Management ----

  getPlayer(role: PlayerRole): Player | undefined {
    return this.players.get(role);
  }

  getPlayerByWs(ws: WebSocket): Player | undefined {
    for (const player of this.players.values()) {
      if (player.ws === ws) return player;
    }
    return undefined;
  }

  getPlayerByUserId(userId: number): Player | undefined {
    for (const player of this.players.values()) {
      if (player.userId === userId) return player;
    }
    return undefined;
  }

  setPlayer(role: PlayerRole, player: Player): void {
    this.players.set(role, player);
  }

  removePlayerByWs(ws: WebSocket): Player | undefined {
    for (const [role, player] of this.players.entries()) {
      if (player.ws === ws) {
        this.players.delete(role);
        return player;
      }
    }
    return undefined;
  }

  /** Number of connected WebSocket players (excludes guest/AI) */
  get connectedPlayerCount(): number {
    let count = 0;
    for (const player of this.players.values()) {
      if (player.ws !== null) count++;
    }
    return count;
  }

  /** Total player slots filled (including guest/AI) */
  get playerCount(): number {
    return this.players.size;
  }

  /** Get the userId for a given role (A = left, B = right) */
  getUserId(role: PlayerRole): number | null {
    return this.players.get(role)?.userId ?? null;
  }

  /** Get all players */
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  // ---- Ready Check ----

  /** Marque un rôle comme prêt. Retourne true si TOUS les joueurs connectés sont prêts. */
  markReady(role: PlayerRole): boolean {
    this.readyPlayers.add(role);
    return this.areAllReady();
  }

  /** Vérifie si un rôle spécifique est prêt */
  isReady(role: PlayerRole): boolean {
    return this.readyPlayers.has(role);
  }

  /** Vérifie si tous les joueurs connectés (ws !== null) sont prêts */
  areAllReady(): boolean {
    for (const [role, player] of this.players.entries()) {
      if (player.ws !== null && !this.readyPlayers.has(role)) return false;
    }
    return this.readyPlayers.size > 0;
  }

  /** Réinitialise les ready players (ex: nouveau round) */
  clearReady(): void {
    this.readyPlayers.clear();
  }

  /**
   * Construit la liste PlayerInfo pour les messages WS (connected, player_joined, ready_check).
   */
  getPlayersInfo(): PlayerInfo[] {
    return Array.from(this.players.entries()).map(([role, p]) => ({
      role,
      username: p.username ?? (p.type === 'ai' ? 'AI' : p.type === 'guest' ? 'Guest' : 'anonymous'),
      userId: p.userId,
      ready: this.readyPlayers.has(role),
    }));
  }

  /** Get all active WebSocket connections */
  getActiveWebSockets(): WebSocket[] {
    const sockets: WebSocket[] = [];
    for (const player of this.players.values()) {
      if (player.ws && player.ws.readyState === player.ws.OPEN) {
        sockets.push(player.ws);
      }
    }
    return sockets;
  }

  /** Next available role (A first, then B) */
  getNextAvailableRole(): PlayerRole | null {
    if (!this.players.has('A')) return 'A';
    if (!this.players.has('B')) return 'B';
    return null;
  }

  /** Is session full? (no more roles available) */
  isFull(): boolean {
    return this.getNextAvailableRole() === null;
  }

  // ---- Cleanup ----

  /** Close all WS connections and clear players */
  closeAll(code: number = WS_CLOSE.GAME_OVER, reason: string = 'Game Over'): void {
    for (const player of this.players.values()) {
      if (player.ws) {
        try {
          player.ws.close(code, reason);
        } catch {
          // ignore close errors
        }
      }
    }
    this.players.clear();
  }

  /** Close a specific WS and remove the player */
  closePlayer(ws: WebSocket, code: number = 1000, reason: string = 'Disconnected'): void {
    try {
      ws.close(code, reason);
    } catch {
      // ignore
    }
    this.removePlayerByWs(ws);
  }

  /** Stop game loop interval */
  clearInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** Full session teardown */
  destroy(): void {
    this.game.stop();
    this.clearInterval();
    this.closeAll();
  }
}
