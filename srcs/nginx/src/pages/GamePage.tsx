import { NavBar } from '../components/molecules/NavBar';
import Background from '../components/atoms/Background';
import Arena from '../components/organisms/Arena';
import GameStatusBar from '../components/organisms/GameStatusBar';
import GameControl from '../components/organisms/GameControl';
import { useGameState } from '../hooks/GameState';
import { useGameWebSocket } from '../hooks/GameWebSocket';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useKeyboardControls } from '../hooks/input.tsx';
import { useGameSessions, UseGameSessionsReturn } from '../hooks/GameSessions';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api-client';
import Button from '../components/atoms/Button';
import { createAiSession, joinAiToSession } from '../api/game-api';
import type { GameState } from '../hooks/GameState';

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

const colors = { start: '#00ff9f', end: '#0088ff' };

interface ServerMessage {
  type: 'connected' | 'state' | 'gameOver' | 'error' | 'pong';
  sessionId?: string;
  data?: GameState;
  message?: string;
}

interface GamePageProps {
  sessionId: string | null;
  gameMode: 'local' | 'remote' | 'tournament' | 'ai';
}

export const GamePage = ({ sessionId, gameMode }: GamePageProps) => {
  const { t } = useTranslation('common');
  const { openWebSocket, closeWebSocket } = useGameWebSocket();
  const { gameStateRef, updateGameState } = useGameState();
  const [currentSessionId, setSessionId] = useState<string | null>(sessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'left' | 'right' | null>(null);
  const [scores, setScores] = useState({ left: 0, right: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const phaseRef = useRef<'idle' | 'playing' | 'gameOver'>('idle');
  const scoresRef = useRef({ left: 0, right: 0 });
  const sessionIdRef = useRef<string | null>(null);
  const { tournamentId } = useParams<{ tournamentId?: string }>();
  const navigate = useNavigate();

  useKeyboardControls({
    wsRef,
    gameMode: gameMode === 'ai' ? 'ai' : gameMode,
    enabled: !!currentSessionId && !isGameOver,
  });

  // ── Session creation ──────────────────────────────────────────────
  const createSession = useCallback(async () => {
    closeWebSocket();
    wsRef.current = null;
    setIsLoading(true);
    setIsGameOver(false);
    setWinner(null);
    setScores({ left: 0, right: 0 });
    scoresRef.current = { left: 0, right: 0 };
    phaseRef.current = 'idle';

    if (gameMode === 'ai') {
      const { sessionId: newId } = await createAiSession();
      setSessionId(newId);
      sessionIdRef.current = newId;
    } else {
      interface CreateSessionResponse {
        status: 'success' | 'failure';
        message: string;
        sessionId?: string;
        wsUrl?: string;
      }
      const requestBody = {
        gameMode,
        ...(tournamentId ? { tournamentId } : {}),
      };
      const res = await api.post<CreateSessionResponse>('/game/create-session', requestBody);
      if (res.data.sessionId) {
        setSessionId(res.data.sessionId);
        sessionIdRef.current = res.data.sessionId;
      }
    }
    setIsLoading(false);
  }, [closeWebSocket, gameMode, tournamentId]);

  // Auto-create session on mount for local/ai modes
  useEffect(() => {
    if ((gameMode === 'local' || gameMode === 'ai') && !currentSessionId) {
      createSession();
    }
  }, []);

  // ── Controls ──────────────────────────────────────────────────────
  const onStartGame = async () => {
    if (!wsRef.current) return;
    if (gameMode === 'ai') {
      const id = sessionIdRef.current;
      if (id) await joinAiToSession(id);
    }
    wsRef.current.send(JSON.stringify({ type: 'start' }));
  };

  const onExitGame = async () => {
    if (!currentSessionId) return;
    await fetch(`/api/game/del/${currentSessionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    navigate('/home');
  };

  // ── WebSocket connection ──────────────────────────────────────────
  useEffect(() => {
    if (!currentSessionId) return;
    let cancelled = false;

    const connect = async () => {
      const ws = await openWebSocket(currentSessionId, (message: ServerMessage) => {
        if (cancelled) return;
        if (message.type === 'state' && message.data) {
          phaseRef.current = 'playing';
          updateGameState(message.data);
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
          setWinner(s.left >= s.right ? 'left' : 'right');
          setIsGameOver(true);
        }
      });

      if (cancelled) {
        ws.close();
        return;
      }
      wsRef.current = ws;

      ws.addEventListener('close', () => {
        if (phaseRef.current !== 'gameOver') setIsGameOver(false);
      });
    };

    connect();
    return () => {
      cancelled = true;
      closeWebSocket();
      wsRef.current = null;
    };
  }, [currentSessionId]);

  // ── Remote session selection ──────────────────────────────────────
  const handleSelectSession = (selectedSessionId: string) => setSessionId(selectedSessionId);
  const sessions = useGameSessions() as UseGameSessionsReturn;

  // ── Labels ────────────────────────────────────────────────────────
  const labelLeft = gameMode === 'ai' ? t('game.winner.you_label') : t('game.winner.player1_label');
  const labelRight = gameMode === 'ai' ? t('game.winner.ai_label') : t('game.winner.player2_label');

  // ── Game Over ────────────────────────────────────────────────────
  const winnerLabel = (): string => {
    if (!winner) return '';
    if (gameMode === 'ai')
      return winner === 'left' ? t('game.winner.you_win') : t('game.winner.ai_wins');
    return winner === 'left' ? t('game.winner.player1_wins') : t('game.winner.player2_wins');
  };
  const winnerColor = winner === 'left' ? '#34d399' : '#fb7185';

  return (
    <div className="w-full h-full relative">
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        <NavBar />
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden md:max-w-8xl md:mx-auto md:w-full">
          {/* Top bar: scores + controls */}
          <div className="flex flex-col items-center p-4 gap-4 md:w-72 md:justify-center">
            {gameMode === 'remote' ? (
              <GameStatusBar sessionsData={sessions} onSelectSession={handleSelectSession} />
            ) : (
              <GameStatusBar
                sessionsData={null}
                scoreLeft={scores.left}
                scoreRight={scores.right}
                labelLeft={labelLeft}
                labelRight={labelRight}
              />
            )}
            <GameControl
              onCreateLocalGame={createSession}
              onStartGame={onStartGame}
              onExitGame={onExitGame}
              gameMode={gameMode}
              loading={isLoading}
              className="w-full"
            />
          </div>

          {/* Arena */}
          <div className="flex-1 flex justify-center px-4 pb-4 relative">
            <Arena gameStateRef={gameStateRef} />
            {isGameOver && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(4px)' }}
              >
                <p className="text-3xl font-bold font-mono" style={{ color: winnerColor }}>
                  {winnerLabel()}
                </p>
                <p className="text-slate-400 font-mono text-lg">
                  {scores.left} — {scores.right}
                </p>
                <Button variant="secondary" type="button" onClick={createSession}>
                  {t('game.play_again')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Background>
    </div>
  );
};
