// ============================================================================
// useGameLobby — Gère l'état du lobby avant et pendant la partie
//
// Responsabilité : recevoir les événements WS du lobby (player_joined,
// ready_check, player_ready) et exposer l'état courant à l'UI.
// ============================================================================

import { useState, useCallback } from 'react';
import type { PlayerInfo, LobbyPhase, PlayerRole } from '../types/game.types';

export interface LobbyState {
  /** Phase courante du flux de jeu */
  phase: LobbyPhase;
  /** Joueur assigné à ce client */
  localPlayer: PlayerInfo | null;
  /** Liste de tous les joueurs présents dans le lobby */
  players: PlayerInfo[];
  /** Nom d'affichage de la session */
  sessionName: string | null;
}

export interface UseLobbyReturn {
  lobby: LobbyState;
  /** Appelé quand le serveur confirme la connexion de ce client */
  onConnected: (player: PlayerInfo, sessionName?: string) => void;
  /** Appelé quand un joueur rejoint/quitte (player_joined) */
  onPlayersUpdate: (players: PlayerInfo[]) => void;
  /** Appelé quand tous les joueurs sont là et le ready_check démarre */
  onReadyCheck: (players: PlayerInfo[]) => void;
  /** Appelé quand un joueur envoie ready */
  onPlayerReady: (players: PlayerInfo[]) => void;
  /** Appelé quand un joueur se déconnecte en cours de partie */
  onPlayerDisconnected: (players: PlayerInfo[], message?: string) => void;
  /** Appelé quand la partie démarrer (premier état reçu) */
  onGameStart: () => void;
  /** Appelé quand la partie se termine */
  onGameOver: () => void;
  /** Réinitialise complètement le lobby (nouvelle partie) */
  reset: () => void;
}

const INITIAL_STATE: LobbyState = {
  phase: 'connecting',
  localPlayer: null,
  players: [],
  sessionName: null,
};

export const useGameLobby = (): UseLobbyReturn => {
  const [lobby, setLobby] = useState<LobbyState>(INITIAL_STATE);

  const onConnected = useCallback((player: PlayerInfo, sessionName?: string) => {
    setLobby((prev) => ({
      ...prev,
      phase: 'waiting_players',
      localPlayer: player,
      players: [player],
      sessionName: sessionName ?? null,
    }));
  }, []);

  const onPlayersUpdate = useCallback((players: PlayerInfo[]) => {
    setLobby((prev) => ({ ...prev, players }));
  }, []);

  const onReadyCheck = useCallback((players: PlayerInfo[]) => {
    setLobby((prev) => ({ ...prev, phase: 'ready_check', players }));
  }, []);

  const onPlayerReady = useCallback((players: PlayerInfo[]) => {
    setLobby((prev) => ({ ...prev, players }));
  }, []);

  const onPlayerDisconnected = useCallback((players: PlayerInfo[]) => {
    setLobby((prev) => ({ ...prev, phase: 'disconnected', players }));
  }, []);

  const onGameStart = useCallback(() => {
    setLobby((prev) => ({ ...prev, phase: 'playing' }));
  }, []);

  const onGameOver = useCallback(() => {
    setLobby((prev) => ({ ...prev, phase: 'finished' }));
  }, []);

  const reset = useCallback(() => {
    setLobby(INITIAL_STATE);
  }, []);

  return {
    lobby,
    onConnected,
    onPlayersUpdate,
    onReadyCheck,
    onPlayerReady,
    onPlayerDisconnected,
    onGameStart,
    onGameOver,
    reset,
  };
};

// ── Sélecteurs utilitaires ──────────────────────────────────────────────────

/** Nom d'affichage du joueur selon son rôle */
export const getPlayerLabel = (
  role: 'left' | 'right',
  players: PlayerInfo[],
  fallbackLeft: string,
  fallbackRight: string,
): string => {
  const playerRole: PlayerRole = role === 'left' ? 'A' : 'B';
  return (
    players.find((p) => p.role === playerRole)?.username ??
    (role === 'left' ? fallbackLeft : fallbackRight)
  );
};

/** `true` si tous les joueurs présents dans la liste sont marqués ready */
export const allPlayersReady = (players: PlayerInfo[], requiredCount: number): boolean =>
  players.length >= requiredCount && players.every((p) => p.ready);
