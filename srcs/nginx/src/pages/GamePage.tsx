import { NavBar } from '../components/molecules/NavBar';
import Background from '../components/atoms/Background';
import Arena from '../components/organisms/Arena';
import GameStatusBar from '../components/organisms/GameStatusBar';
import GameControl from '../components/organisms/GameControl';
import { useLocalSession } from '../api/game-api';
import { useGameState } from '../hooks/GameState';
import { useGameWebSocket } from '../hooks/GameWebSocket';
import { useEffect, useState } from 'react';

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

export const GamePage = ({ sessionId: routeSessionId }: { sessionId: string | null }) => {
  // const { createLocalSession, isLoading, sessionId: localSessionId } = useLocalSession();

  const { openWebSocket, closeWebSocket } = useGameWebSocket();
  const { gameStateRef, updateGameState } = useGameState();
  const [sessionId, setSessionId] = useState<string | null>(routeSessionId);
  const [isLoading, setIsLoading] = useState(false);

  const createLocalSession = async () => {
    setIsLoading(true);
    console.log('Fetching sessions from back...');
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

  useEffect(() => {
    if (!sessionId) return;

    let ws: WebSocket | null = null;

    // In GamePage
    openWebSocket(sessionId, (message: ServerMessage) => {
      if (message.type === 'state' && message.data) {
        updateGameState(message.data);
      }
    });
    // Cleanup on unmount or sessionId change
    return () => {
      closeWebSocket();
    };
  }, [sessionId]);

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
            <GameControl onCreateLocalGame={createLocalSession} loading={isLoading} />
            <GameStatusBar />
          </div>

          <div className="flex-[3]">
            <Arena gameStateRef={gameStateRef} />
          </div>
        </div>
      </Background>
    </div>
  );
};
