import { NavBar } from '../components/molecules/NavBar';
import Background from '../components/atoms/Background';
import Arena from '../components/organisms/Arena';
import GameStatusBar from '../components/organisms/GameStatusBar';
import GameControl from '../components/organisms/GameControl';
import { useGameState } from '../hooks/GameState';
import { useGameWebSocket } from '../hooks/GameWebSocket';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useKeyboardControls } from '../hooks/input.tsx';
import { createAiSession, joinAiToSession } from '../api/game-api';
import { useNavigate } from 'react-router-dom';
import type { GameState } from '../hooks/GameState';
import Button from '../components/atoms/Button';

interface ServerMessage {
  type: 'connected' | 'state' | 'gameOver' | 'error' | 'pong';
  sessionId?: string;
  data?: GameState;
  message?: string;
}

export const PlayAiPage = () => {
  const { openWebSocket, closeWebSocket } = useGameWebSocket();
  const { gameStateRef, updateGameState } = useGameState();
  const [currentSessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'you' | 'ai' | null>(null);
  const [scores, setScores] = useState({ left: 0, right: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const phaseRef = useRef<'idle' | 'playing' | 'gameOver'>('idle');
  // Track last known scores in a ref to avoid re-renders on every frame
  const scoresRef = useRef({ left: 0, right: 0 });
  const navigate = useNavigate();

  useKeyboardControls({ wsRef, enabled: !!currentSessionId && !isGameOver, gameMode: 'ai' });

  const createSession = useCallback(async () => {
    closeWebSocket();
    wsRef.current = null;
    setIsLoading(true);
    setIsGameOver(false);
    setWinner(null);
    setScores({ left: 0, right: 0 });
    scoresRef.current = { left: 0, right: 0 };
    phaseRef.current = 'idle';
    const { sessionId } = await createAiSession();
    setSessionId(sessionId);
    setIsLoading(false);
  }, [closeWebSocket]);

  useEffect(() => {
    createSession();
  }, []);

  const onStartGame = () => {};

  const onExitGame = async () => {
    if (!currentSessionId) return;
    await fetch(`/api/game/del/${currentSessionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    navigate('/home');
  };

  useEffect(() => {
    if (!currentSessionId) return;

    let cancelled = false;

    const connect = async () => {
      const ws = await openWebSocket(currentSessionId, (message: ServerMessage) => {
        if (cancelled) return;
        if (message.type === 'state' && message.data) {
          phaseRef.current = 'playing';
          updateGameState(message.data);
          // Only trigger a React re-render when the score actually changes
          const s = message.data.scores;
          if (s.left !== scoresRef.current.left || s.right !== scoresRef.current.right) {
            scoresRef.current = { left: s.left, right: s.right };
            setScores({ left: s.left, right: s.right });
          }
        } else if (message.type === 'gameOver' && message.data) {
          phaseRef.current = 'gameOver';
          updateGameState(message.data);
          const s = message.data.scores;
          scoresRef.current = { left: s.left, right: s.right };
          setScores({ left: s.left, right: s.right });
          setWinner(s.left >= s.right ? 'you' : 'ai');
          setIsGameOver(true);
        }
      });

      if (cancelled) {
        ws.close();
        return;
      }

      wsRef.current = ws;

      ws.addEventListener('close', () => {
        if (phaseRef.current !== 'gameOver') {
          setIsGameOver(false);
        }
      });

      await joinAiToSession(currentSessionId);
    };

    connect();

    return () => {
      cancelled = true;
      closeWebSocket();
      wsRef.current = null;
    };
  }, [currentSessionId]);

  return (
    <div className="w-full h-full relative">
      <Background grainIntensity={4} baseFrequency={0.28} colorStart="#00ff9f" colorEnd="#0088ff">
        <NavBar />
        <div className="flex flex-row flex-1 overflow-hidden">
          <div className="flex flex-col flex-[1] overflow-y-auto p-4">
            <GameControl
              onCreateLocalGame={createSession}
              onStartGame={onStartGame}
              onExitGame={onExitGame}
              gameMode="local"
              loading={isLoading}
            />
            <GameStatusBar
              sessionsData={null}
              scoreLeft={scores.left}
              scoreRight={scores.right}
              labelLeft="YOU"
              labelRight="AI"
            />
          </div>

          {/* Arena + Game Over overlay */}
          <div className="flex-[3] flex justify-center p-4 relative">
            <Arena gameStateRef={gameStateRef} />
            {isGameOver && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(4px)' }}
              >
                <p className="text-5xl">{winner === 'you' ? '🏆' : '🤖'}</p>
                <p
                  className="text-3xl font-bold font-mono"
                  style={{ color: winner === 'you' ? '#34d399' : '#fb7185' }}
                >
                  {winner === 'you' ? 'You Win!' : 'AI Wins!'}
                </p>
                <p className="text-slate-400 font-mono text-lg">
                  {scores.left} — {scores.right}
                </p>
                <Button variant="secondary" type="button" onClick={createSession}>
                  Play Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </Background>
    </div>
  );
};
