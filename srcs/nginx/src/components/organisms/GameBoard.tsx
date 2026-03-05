// ============================================================================
// GameBoard — Assemblage de la zone de jeu complète :
//   GameStatusBar (scores + status) + GameControl (boutons) + GenericSelector
//   + Arena (toujours visible) avec overlay pré-jeu (connecting / ready_check)
//   + GameOverOverlay (fin de partie)
//
// Ce composant reçoit tout par props : aucun état interne, aucun appel réseau.
// ============================================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import Arena from './Arena';
import GameStatusBar from './GameStatusBar';
import GameControl from './GameControl';
import GameOverOverlay from './GameOverOverlay';
import GenericSelector from '../atoms/Selector';
import Button from '../atoms/Button';
import type {
  GameMode,
  GameStatus,
  BackgroundMode,
  LobbyPhase,
  PlayerRole,
  Scores,
} from '../../types/game.types';
import type { UseGameSessionsReturn } from '../../hooks/GameSessions';

interface GameBoardProps {
  // ── Mode & état global ──────────────────────────────────────────────────
  gameMode: GameMode;
  isPlaying: boolean;
  isGameOver: boolean;
  isLoading: boolean;
  gameStatus: GameStatus;

  // ── Scores & joueurs ────────────────────────────────────────────────────
  scores: Scores;
  labelLeft: string;
  labelRight: string;

  // ── Lobby (phase + joueurs pour l'overlay) ───────────────────────────────
  lobbyPhase: LobbyPhase;
  /** true = ready_check reçu du serveur ET joueur n'a pas encore envoyé ready */
  awaitingReady: boolean;
  localRole: PlayerRole | null;

  // ── Game Over ────────────────────────────────────────────────────────────
  isForfeit: boolean;
  winner: 'left' | 'right' | null;

  // ── Canvas ───────────────────────────────────────────────────────────────
  gameStateRef: React.MutableRefObject<import('../../types/game.types').GameState | null>;
  bgMode: BackgroundMode;
  onChangeBgMode: (mode: BackgroundMode) => void;

  // ── Sessions distantes ───────────────────────────────────────────────────
  /** Données des sessions disponibles (mode remote uniquement) */
  sessionsData?: UseGameSessionsReturn | null;
  onSelectSession?: (sessionId: string) => void;

  // ── Callbacks ────────────────────────────────────────────────────────────
  onReady: () => void;
  onCreateSession: () => void;
  onExit: () => void;
  onPlayAgain: () => void;
}

const BG_MODES: BackgroundMode[] = ['psychedelic', 'ocean', 'sunset', 'grayscale'];

const GameBoard = ({
  gameMode,
  isPlaying,
  isGameOver,
  isLoading,
  gameStatus,
  scores,
  labelLeft,
  labelRight,
  lobbyPhase,
  awaitingReady,
  localRole,
  isForfeit,
  winner,
  gameStateRef,
  bgMode,
  onChangeBgMode,
  sessionsData,
  onSelectSession,
  onReady,
  onCreateSession,
  onExit,
  onPlayAgain,
}: GameBoardProps) => {
  const { t } = useTranslation('common');

  // Sessions affichées uniquement avant qu'une session ne soit sélectionnée
  const showSessions = gameMode === 'remote' && lobbyPhase === 'connecting';

  // Overlay pré-jeu :
  // - spinner : connexion / attente 2e joueur
  // - bouton ready : ready_check reçu mais pas encore envoyé
  const showConnecting =
    !isGameOver && (lobbyPhase === 'connecting' || lobbyPhase === 'waiting_players');
  const showPreGameOverlay = showConnecting || awaitingReady;

  return (
    <div className="w-full h-full flex flex-col justify-between items-stretch flex-1 overflow-hidden md:max-w-8xl md:mx-auto md:w-full">
      {/* ── Barre supérieure : scores + contrôles ── */}
      <div className="w-full flex flex-col">
        <div className="w-full">
          <GameStatusBar
            status={gameStatus}
            sessionsData={showSessions ? (sessionsData ?? null) : null}
            onSelectSession={showSessions ? onSelectSession : undefined}
            scoreLeft={scores.left}
            scoreRight={scores.right}
            labelLeft={labelLeft}
            labelRight={labelRight}
          />
        </div>

        <div className="w-full items-center mt-3 gap-4">
          <GameControl
            isPlaying={isPlaying}
            onCreateLocalGame={onCreateSession}
            onExitGame={onExit}
            gameMode={gameMode}
            loading={isLoading}
            className="w-full"
          />
          <GenericSelector
            className="m-4"
            label={t('game.ambience')}
            value={bgMode}
            options={BG_MODES}
            onChange={onChangeBgMode}
          />
        </div>
      </div>

      {/* ── Zone centrale : Arena + overlays ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 pb-4 relative min-h-0">
        <div className="w-full max-w-5xl relative">
          <Arena currentMode={bgMode} gameStateRef={gameStateRef} />

          {/* Overlay pré-jeu : connexion / attente / ready_check */}
          {showPreGameOverlay && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-xl"
              style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(3px)' }}
            >
              {showConnecting && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse w-3 h-3 rounded-full bg-purple-400 inline-block" />
                    <span
                      className="animate-pulse w-3 h-3 rounded-full bg-purple-400 inline-block"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="animate-pulse w-3 h-3 rounded-full bg-purple-400 inline-block"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <p className="text-white/70 font-mono text-sm">
                    {lobbyPhase === 'connecting'
                      ? t('game.lobby.phase.connecting')
                      : t('game.lobby.phase.waiting_players')}
                  </p>
                </>
              )}

              {awaitingReady && (
                <Button id="ready-btn" variant="primary" type="button" onClick={onReady}>
                  {t('game.lobby.btn_ready')}
                </Button>
              )}
            </div>
          )}

          {/* Overlay fin de partie */}
          {isGameOver && winner && (
            <GameOverOverlay
              winner={winner}
              scores={scores}
              gameMode={gameMode}
              labelLeft={labelLeft}
              labelRight={labelRight}
              localRole={localRole}
              isForfeit={isForfeit}
              onPlayAgain={onPlayAgain}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
