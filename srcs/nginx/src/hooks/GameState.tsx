import { useRef, useCallback } from 'react';

export interface Scores {
  left: number;
  right: number;
}

export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export interface GameState {
  ball: {
    x: number;
    y: number;
    radius: number;
  };
  paddles: {
    left: {
      y: number;
      height: number;
    };
    right: {
      y: number;
      height: number;
    };
  };
  scores: Scores;
  status: GameStatus;
  cosmicBackground: number[][] | null;
}

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
