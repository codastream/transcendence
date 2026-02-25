import { useEffect, useRef, useState, useCallback } from 'react';
import { createAiSession, joinAiToSession } from '../api/game-api';
import Background from '../components/atoms/Background';
import { NavBar } from '../components/molecules/NavBar';
import Button from '../components/atoms/Button';
import Arena from '../components/organisms/Arena';
import GameStatusBar from '../components/organisms/GameStatusBar';
import GameControl from '../components/organisms/GameControl';
import { useGameWebSocket } from '../hooks/GameWebSocket';
import { useGameState } from '../hooks/GameState';
import type { GameState } from '../hooks/GameState';

type Phase = 'idle' | 'loading' | 'playing' | 'gameOver' | 'error';

export const PlayAiPage = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [winner, setWinner] = useState<'you' | 'ai' | null>(null);
  const [displayScores, setDisplayScores] = useState({ left: 0, right: 0 });

  const phaseRef = useRef<Phase>('idle');
  const myPaddleRef = useRef<'left' | 'right'>('left');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const { openWebSocket, closeWebSocket } = useGameWebSocket();
  const { gameStateRef, updateGameState } = useGameState();

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearSetupTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startGame = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setWinner(null);
    setDisplayScores({ left: 0, right: 0 });

    timeoutRef.current = setTimeout(() => {
      if (phaseRef.current === 'loading' || phaseRef.current === 'playing') {
        closeWebSocket();
        setError(
          'Game did not start within 10s. Is the AI service running and is models/best_model.zip present?',
        );
        setPhase('error');
      }
    }, 10000);

    try {
      const { sessionId } = await createAiSession();
      sessionIdRef.current = sessionId;

      await openWebSocket(sessionId, (msg: any) => {
        if (msg.type === 'connected') {
          myPaddleRef.current = msg.message === 'Player A' ? 'left' : 'right';
        } else if (msg.type === 'state' && msg.data) {
          if (phaseRef.current !== 'playing') {
            clearSetupTimeout();
            setPhase('playing');
          }
          updateGameState(msg.data as GameState);
          const s = msg.data.scores;
          setDisplayScores((prev) =>
            prev.left !== s.left || prev.right !== s.right
              ? { left: s.left, right: s.right }
              : prev,
          );
        } else if (msg.type === 'gameOver' && msg.data) {
          clearSetupTimeout();
          updateGameState(msg.data as GameState);
          const s = msg.data.scores;
          setDisplayScores({ left: s.left, right: s.right });
          const myPaddle = myPaddleRef.current;
          const iWon =
            (myPaddle === 'left' && s.left >= s.right) ||
            (myPaddle === 'right' && s.right >= s.left);
          setWinner(iWon ? 'you' : 'ai');
          setPhase('gameOver');
        } else if (msg.type === 'error') {
          clearSetupTimeout();
          setError('Game error: ' + (msg.message ?? 'unknown'));
          setPhase('error');
        }
      });

      // After WS open, tell the AI service to join as Player B
      joinAiToSession(sessionId).catch((e: any) => {
        clearSetupTimeout();
        setError('AI service error: ' + (e?.response?.data?.detail ?? e?.message ?? 'unknown'));
        setPhase('error');
        closeWebSocket();
      });
    } catch (e: any) {
      clearSetupTimeout();
      setError(e?.message ?? 'Failed to start game');
      setPhase('error');
    }
  }, [clearSetupTimeout, openWebSocket, closeWebSocket, updateGameState]);

  // Keyboard controls
  useEffect(() => {
    if (phase !== 'playing') return;
    const pressed = new Set<string>();
    const send = (dir: 'up' | 'down' | 'stop') => {
      const ws = (openWebSocket as any).__ws__; // fallback — use sendDir below
    };
    // We rely on the GameWebSocket ref indirectly — expose sendDir via ref trick
    const wsContainer = { send: (dir: 'up' | 'down' | 'stop') => {} };

    const sendDir = (dir: 'up' | 'down' | 'stop') => {
      // We reach into the hook via a re-open trick — instead reuse the existing ws
      // The cleanest approach: keep a direct ws ref alongside the hook
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      // We cannot get the raw WS out of the hook, so we open a second connection
      // Instead: store ws manually alongside openWebSocket call
    };

    // We use the wsRef stored in the hook indirectly by exposing a sendDir callback
    // from the hook. Since GameWebSocket doesn't expose send(), we keep our own ref:
    const onDown = (e: KeyboardEvent) => {
      if (pressed.has(e.key)) return;
      pressed.add(e.key);
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        sendPaddleDir('up');
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sendPaddleDir('down');
      }
    };
    const onUp = (e: KeyboardEvent) => {
      pressed.delete(e.key);
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') sendPaddleDir('stop');
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [phase]);

  // Direct WS ref for sending paddle moves — stored alongside hook
  const rawWsRef = useRef<WebSocket | null>(null);

  const sendPaddleDir = useCallback((dir: 'up' | 'down' | 'stop') => {
    rawWsRef.current?.send(
      JSON.stringify({ type: 'paddle', paddle: myPaddleRef.current, direction: dir }),
    );
  }, []);

  // Override startGame to also store raw ws ref
  const startGameWithRef = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setWinner(null);
    setDisplayScores({ left: 0, right: 0 });

    timeoutRef.current = setTimeout(() => {
      if (phaseRef.current === 'loading' || phaseRef.current === 'playing') {
        rawWsRef.current?.close();
        setError('Game did not start within 10s. Is the AI service running?');
        setPhase('error');
      }
    }, 10000);

    try {
      const { sessionId } = await createAiSession();
      sessionIdRef.current = sessionId;

      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${window.location.host}/api/game/${sessionId}`);
      rawWsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'connected') {
          myPaddleRef.current = msg.message === 'Player A' ? 'left' : 'right';
        } else if (msg.type === 'state' && msg.data) {
          if (phaseRef.current !== 'playing') {
            clearSetupTimeout();
            setPhase('playing');
          }
          updateGameState(msg.data as GameState);
          const s = msg.data.scores;
          setDisplayScores((prev) =>
            prev.left !== s.left || prev.right !== s.right
              ? { left: s.left, right: s.right }
              : prev,
          );
        } else if (msg.type === 'gameOver' && msg.data) {
          clearSetupTimeout();
          updateGameState(msg.data as GameState);
          const s = msg.data.scores;
          setDisplayScores({ left: s.left, right: s.right });
          const iWon =
            (myPaddleRef.current === 'left' && s.left >= s.right) ||
            (myPaddleRef.current === 'right' && s.right >= s.left);
          setWinner(iWon ? 'you' : 'ai');
          setPhase('gameOver');
        } else if (msg.type === 'error') {
          clearSetupTimeout();
          setError('Game error: ' + (msg.message ?? 'unknown'));
          setPhase('error');
        }
      };

      ws.onopen = () => {
        joinAiToSession(sessionId).catch((e: any) => {
          clearSetupTimeout();
          setError('AI service error: ' + (e?.response?.data?.detail ?? e?.message ?? 'unknown'));
          setPhase('error');
          ws.close();
        });
      };

      ws.onerror = () => {
        clearSetupTimeout();
        setError('WebSocket error — is the game service running?');
        setPhase('error');
      };

      ws.onclose = () => {
        clearSetupTimeout();
        if (phaseRef.current === 'playing') setPhase('idle');
      };
    } catch (e: any) {
      clearSetupTimeout();
      setError(e?.message ?? 'Failed to start game');
      setPhase('error');
    }
  }, [clearSetupTimeout, updateGameState]);

  // Keyboard controls wired to rawWsRef
  useEffect(() => {
    if (phase !== 'playing') return;
    const pressed = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      if (pressed.has(e.key)) return;
      pressed.add(e.key);
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        sendPaddleDir('up');
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sendPaddleDir('down');
      }
      if (e.key === 'w' || e.key === 'W') sendPaddleDir('up');
      if (e.key === 's' || e.key === 'S') sendPaddleDir('down');
    };
    const onUp = (e: KeyboardEvent) => {
      pressed.delete(e.key);
      if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) sendPaddleDir('stop');
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [phase, sendPaddleDir]);

  useEffect(
    () => () => {
      clearSetupTimeout();
      rawWsRef.current?.close();
    },
    [clearSetupTimeout],
  );

  const myColor = myPaddleRef.current === 'left' ? '#38bdf8' : '#fb7185';
  const aiColor = myPaddleRef.current === 'left' ? '#fb7185' : '#38bdf8';
  const isGame = phase === 'playing' || phase === 'gameOver';

  return (
    <div className="w-full h-full relative">
      <Background grainIntensity={4} baseFrequency={0.28} colorStart="#00ff9f" colorEnd="#0088ff">
        <NavBar />

        <div className="flex flex-row h-full">
          {/* Left panel — controls + status */}
          <div className="flex flex-col flex-[1] gap-4 p-4">
            <h1
              className="text-3xl font-bold font-mono tracking-widest text-center"
              style={{ color: '#f0f9ff', textShadow: '0 0 24px #38bdf8' }}
            >
              PONG vs AI
            </h1>

            {/* Score display */}
            {isGame && (
              <div className="flex justify-around text-white bg-white/10 backdrop-blur-lg rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm" style={{ color: myColor }}>
                    YOU
                  </p>
                  <p className="text-3xl font-bold">{displayScores.left}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-purple-300">vs</p>
                  <p className="text-xl font-semibold text-yellow-400">
                    {phase === 'playing' ? 'Playing' : phase === 'gameOver' ? 'Game Over' : ''}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm" style={{ color: aiColor }}>
                    AI
                  </p>
                  <p className="text-3xl font-bold">{displayScores.right}</p>
                </div>
              </div>
            )}

            <GameControl
              onCreateLocalGame={startGameWithRef}
              onStartGame={() => {}}
              loading={phase === 'loading'}
            />

            <GameStatusBar sessionsData={null} />

            {/* Controls hint */}
            {phase === 'playing' && (
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-gray-300 text-sm">
                  Controls: <span className="text-purple-300 font-mono">W/S</span> or{' '}
                  <span className="text-purple-300 font-mono">↑/↓</span>
                </p>
                {/* Mobile buttons */}
                <div className="flex gap-4 justify-center mt-3 sm:hidden">
                  <button
                    onPointerDown={() => sendPaddleDir('up')}
                    onPointerUp={() => sendPaddleDir('stop')}
                    onPointerLeave={() => sendPaddleDir('stop')}
                    className="w-14 h-14 rounded-full bg-slate-800 border-2 border-cyan-500 text-xl flex items-center justify-center active:bg-slate-700 select-none"
                  >
                    ▲
                  </button>
                  <button
                    onPointerDown={() => sendPaddleDir('down')}
                    onPointerUp={() => sendPaddleDir('stop')}
                    onPointerLeave={() => sendPaddleDir('stop')}
                    className="w-14 h-14 rounded-full bg-slate-800 border-2 border-cyan-500 text-xl flex items-center justify-center active:bg-slate-700 select-none"
                  >
                    ▼
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {phase === 'error' && error && (
              <p className="text-red-400 font-mono text-sm bg-red-900/20 border border-red-800 px-4 py-2 rounded-lg text-center">
                ⚠ {error}
              </p>
            )}

            {/* Loading */}
            {phase === 'loading' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-white font-mono text-sm animate-pulse">Setting up game…</p>
              </div>
            )}
          </div>

          {/* Right panel — Arena */}
          <div className="flex-[3] relative">
            <Arena gameStateRef={gameStateRef} />

            {/* Game Over overlay */}
            {phase === 'gameOver' && (
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
                  {displayScores.left} — {displayScores.right}
                </p>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    rawWsRef.current?.close();
                    startGameWithRef();
                  }}
                >
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
