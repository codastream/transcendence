import { NavBar } from '../components/molecules/NavBar';
import Background from '../components/atoms/Background';
import Arena from '../components/organisms/Arena';
import GameStatusBar from '../components/organisms/GameStatusBar';
import GameControl from '../components/organisms/GameControl';
import { useLocalSession } from '../api/game-api';
import { useGameState } from '../hooks/GameState';
import { useGameWebSocket } from '../hooks/GameWebSocket';
import { useEffect, useState } from 'react';
import { useGameState } from '../hooks/GameState';
import { useGameWebSocket } from '../hooks/GameWebSocket';
import { useEffect, useState, useRef } from 'react';
import { useKeyboardControls } from '../hooks/input.tsx';
import { useGameSessions, UseGameSessionsReturn } from '../hooks/GameSessions';

export interface Paddle {
  y: number;
  height: number;
  width: number;
  speed: number;
  moving: 'up' | 'down' | 'stop';
}

export interface Paddles {
  left: Paddle;
  right: Paddle;
}

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

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

interface ServerMessage {
  type: 'connected' | 'state' | 'gameOver' | 'error' | 'pong';
  sessionId?: string;
  data?: GameState;
  message?: string;
}

interface GamePageProps {
  sessionId: string | null;
  gameMode: 'local' | 'remote' | 'tournament';
}

// export const GamePage = ({ sessionId: routeSessionId }: { sessionId: string | null }) => {
export const GamePage = ({ sessionId, gameMode }: GamePageProps) => {
  const { openWebSocket, closeWebSocket } = useGameWebSocket();
  const { gameStateRef, updateGameState } = useGameState();
  const [currentSessionId, setSessionId] = useState<string | null>(sessionId);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null); // Use ref instead of state

  useKeyboardControls({
    wsRef,
    enabled: !!currentSessionId, // Only enable when connected
  });

  const createLocalSession = async () => {
    setIsLoading(true);
    console.log('Fetching sessions from backend...');
    const res = await fetch('/api/game/create-session', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    if (res.ok && data.sessionId) {
      console.log('Succes');
      setSessionId(data.sessionId);
    }
    setIsLoading(false);
  };

  const onStartGame = () => {
    if (!wsRef.current) {
      console.error('WebSocket not connected');
      return;
    }

    console.log('📤 Sending start message');
    wsRef.current.send(JSON.stringify({ type: 'start' }));
  };

  useEffect(() => {
    if (gameMode === 'local' && !currentSessionId) {
      createLocalSession();
      console.log('Auto-creating local session...');
    }
  }, [gameMode, currentSessionId]); // Only run when gameMode changes (on mount)

  useEffect(() => {
    if (!currentSessionId) return;
    const connectWebSocket = async () => {
      try {
        const ws = await openWebSocket(currentSessionId, (message: ServerMessage) => {
          if (message.type === 'state' && message.data) {
            updateGameState(message.data);
          }
        });

        wsRef.current = ws; // Store WebSocket in ref
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    // Cleanup on unmount or sessionId change
    return () => {
      closeWebSocket();
      wsRef.current = null;
    };
  }, [currentSessionId, openWebSocket, updateGameState, closeWebSocket]);

  const sessions = useGameSessions() as UseGameSessionsReturn;

  return (
    <div className={`w-full h-full relative`}>
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        <NavBar />
        <div className="flex flex-row h-full">
          <div className="flex flex-col flex-[1]">
            <GameControl
              onCreateLocalGame={createLocalSession}
              onStartGame={onStartGame}
              loading={isLoading}
            />
            {gameMode === 'remote' ? (
              <GameStatusBar sessionsData={sessions} />
            ) : (
              <GameStatusBar sessionsData={null} />
            )}
          </div>

          <div className="flex-[3]">
            <Arena gameStateRef={gameStateRef} />
          </div>
        </div>
      </Background>
    </div>
  );
};
