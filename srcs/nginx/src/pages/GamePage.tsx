// ============================================================================
// GamePage — Orchestrateur léger
// Instancie les hooks, câble le handler WS, délègue le rendu à GameBoard.
// ============================================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameWebSocket } from '../hooks/GameWebSocket';
import { useGameState } from '../hooks/GameState';
import { useGameLobby } from '../hooks/useGameLobby';
import { useGameSession } from '../hooks/useGameSession';
import { useGameSessions } from '../hooks/GameSessions';
import { useKeyboardControls } from '../hooks/input.tsx';
import Background from '../components/atoms/Background';
import GameBoard from '../components/organisms/GameBoard';
import type {
  ServerMessage,
  Scores,
  GameStatus,
  BackgroundMode,
  GameMode,
} from '../types/game.types';

// Re-export : certains composants importent BackgroundMode depuis GamePage
export type { BackgroundMode } from '../types/game.types';

// ── Props ────────────────────────────────────────────────────────────────────

interface GamePageProps {
  sessionId: string | null;
  gameMode: GameMode;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const BG_COLORS = { start: '#00ff9f', end: '#0088ff' };

// ── Composant ────────────────────────────────────────────────────────────────

export const GamePage = ({ sessionId, gameMode }: GamePageProps) => {
  const { t } = useTranslation('common');

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { openWebSocket, closeWebSocket, connected: wsConnected } = useGameWebSocket();
  const { gameStateRef, updateGameState } = useGameState();
  const {
    lobby,
    onConnected,
    onPlayersUpdate,
    onReadyCheck,
    onPlayerReady,
    onPlayerDisconnected,
    onGameStart,
    onGameOver: onLobbyGameOver,
    reset: resetLobby,
  } = useGameLobby();
  const sessions = useGameSessions(gameMode === 'remote');

  // ── État local ─────────────────────────────────────────────────────────────
  const [scores, setScores] = useState<Scores>({ left: 0, right: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'left' | 'right' | null>(null);
  const [bgMode, setBgMode] = useState<BackgroundMode>('psychedelic');
  const [forfeit, setForfeit] = useState(false);
  // readyCheckReceived : le backend a envoyé ready_check
  // readySent          : le joueur a cliqué "Je suis prêt"
  // L’overlay est visible tant que readyCheckReceived && !readySent
  const [readyCheckReceived, setReadyCheckReceived] = useState(false);
  const [readySent, setReadySent] = useState(false);

  // ── Refs (stables hors rendu) ──────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const phaseRef = useRef<'idle' | 'playing' | 'gameOver'>('idle');
  const scoresRef = useRef<Scores>({ left: 0, right: 0 });

  // ── Session ────────────────────────────────────────────────────────────────
  const onBeforeCreate = useCallback(() => {
    closeWebSocket();
    wsRef.current = null;
    resetLobby();
    setIsGameOver(false);
    setWinner(null);
    setForfeit(false);
    setReadyCheckReceived(false);
    setReadySent(false);
    setScores({ left: 0, right: 0 });
    scoresRef.current = { left: 0, right: 0 };
    phaseRef.current = 'idle';
  }, [closeWebSocket, resetLobby]);

  const {
    sessionId: currentSessionId,
    isLoading,
    createSession,
    exitSession,
  } = useGameSession({
    gameMode,
    initialSessionId: sessionId,
    onBeforeCreate,
  });

  // ── Clavier ────────────────────────────────────────────────────────────────
  useKeyboardControls({
    wsRef,
    gameMode,
    playerRole: lobby.localPlayer?.role ?? null,
    enabled: wsConnected && !isGameOver,
  });

  // ── Handler WS (réutilisé dans deux endroits) ──────────────────────────────
  const handleWsMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'connected':
          onConnected(msg.player, msg.sessionName);
          break;
        case 'player_joined':
          onPlayersUpdate(msg.players);
          break;
        case 'ready_check':
          onReadyCheck(msg.players);
          setReadyCheckReceived(true);
          break;
        case 'player_ready':
          onPlayerReady(msg.players);
          break;
        case 'player_disconnected': {
          onPlayerDisconnected(msg.players, msg.message);
          setForfeit(true);
          break;
        }
        case 'state': {
          phaseRef.current = 'playing';
          onGameStart();
          updateGameState(msg.data);
          const s = msg.data.scores;
          if (s.left !== scoresRef.current.left || s.right !== scoresRef.current.right) {
            scoresRef.current = s;
            setScores(s);
          }
          break;
        }
        case 'gameOver': {
          phaseRef.current = 'gameOver';
          onLobbyGameOver();
          const { scores: s, winner: w } = msg.gameOverData;
          scoresRef.current = s;
          setScores(s);
          setWinner(w);
          setIsGameOver(true);
          break;
        }
        case 'error':
          console.error('[WS]', msg.message);
          break;
        default:
          break;
      }
    },
    [
      onConnected,
      onPlayersUpdate,
      onReadyCheck,
      onPlayerReady,
      onPlayerDisconnected,
      onGameStart,
      updateGameState,
      onLobbyGameOver,
      setReadyCheckReceived,
      setForfeit,
    ],
  );

  // ── Connexion WebSocket ────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSessionId) return;
    let cancelled = false;

    const connect = async () => {
      const ws = await openWebSocket(currentSessionId, (msg: ServerMessage) => {
        if (!cancelled) handleWsMessage(msg);
      });
      if (cancelled) {
        ws.close();
        return;
      }
      wsRef.current = ws;
      ws.addEventListener('close', () => {
        if (phaseRef.current !== 'gameOver') {
          // WS fermé sans gameOver (réseau coupé, serveur redémarré, etc.)
          // Guard : wsRef.current === ws vérifie que ce n'est pas le cleanup
          // qui a fermé la WS (dans ce cas wsRef.current aurait déjà été mis à null)
          if (wsRef.current === ws) {
            setIsGameOver(false);
            resetLobby();
            phaseRef.current = 'idle';
          }
        }
      });
    };

    connect();
    return () => {
      cancelled = true;
      closeWebSocket();
      wsRef.current = null;
      resetLobby();
    };
  }, [currentSessionId]); // deps: closeWebSocket/resetLobby sont stables (useCallback/useGameLobby)

  // ── Remote : rejoindre une session existante ──────────────────────────────
  const handleSelectSession = useCallback(
    (id: string) => {
      closeWebSocket();
      wsRef.current = null;
      resetLobby();
      setIsGameOver(false);
      setWinner(null);
      setForfeit(false);
      setReadyCheckReceived(false);
      setReadySent(false);
      setScores({ left: 0, right: 0 });
      scoresRef.current = { left: 0, right: 0 };
      phaseRef.current = 'idle';
      openWebSocket(id, handleWsMessage).then((ws) => {
        wsRef.current = ws;
      });
    },
    [closeWebSocket, openWebSocket, resetLobby, handleWsMessage],
  );

  // ── Dérivés ────────────────────────────────────────────────────────────────
  const isPlaying = lobby.phase === 'playing';
  const gameStatus: GameStatus = isGameOver ? 'finished' : isPlaying ? 'playing' : 'waiting';

  const labelLeft =
    lobby.players.find((p) => p.role === 'A')?.username ??
    (gameMode === 'ai'
      ? lobby.localPlayer?.role === 'A'
        ? t('game.winner.you_label')
        : t('game.winner.ai_label')
      : t('game.winner.player1_label'));
  const labelRight =
    lobby.players.find((p) => p.role === 'B')?.username ??
    (gameMode === 'ai'
      ? lobby.localPlayer?.role === 'B'
        ? t('game.winner.you_label')
        : t('game.winner.ai_label')
      : t('game.winner.player2_label'));

  const onSendReady = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'ready' }));
    setReadySent(true);
  }, []);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative overflow-hidden">
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={BG_COLORS.start}
        colorEnd={BG_COLORS.end}
        animated={false}
      >
        <GameBoard
          gameMode={gameMode}
          isPlaying={isPlaying}
          isGameOver={isGameOver}
          isForfeit={forfeit}
          isLoading={isLoading}
          gameStatus={gameStatus}
          scores={scores}
          labelLeft={labelLeft}
          labelRight={labelRight}
          lobbyPhase={lobby.phase}
          awaitingReady={readyCheckReceived && !readySent}
          localRole={lobby.localPlayer?.role ?? null}
          winner={winner}
          gameStateRef={gameStateRef}
          bgMode={bgMode}
          onChangeBgMode={setBgMode}
          sessionsData={sessions}
          onSelectSession={handleSelectSession}
          onReady={onSendReady}
          onCreateSession={createSession}
          onExit={exitSession}
          onPlayAgain={createSession}
        />
      </Background>
    </div>
  );
};
