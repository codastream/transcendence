import { useRef, useCallback } from 'react';
import type { GameState } from '../types/game.types';

export const useGameState = () => {
  // Ref to store the latest game state
  const gameStateRef = useRef<GameState | null>(null);

  /**
   * Update the current game state.
   * This is called whenever the backend sends a new state via WebSocket.
   */
  const updateGameState = useCallback((state: GameState) => {
    gameStateRef.current = state;
  }, []);

  return {
    gameStateRef, // mutable ref storing the latest game state
    updateGameState, // function to update the ref
  };
};
