// ============================================================================
// GamePlayScreen — Écran de jeu actif :
//   ScoreNavbar → GameControlBar (commandes / arène / quitter) → Arena
//   + PreGameOverlay centré dans l'arène (connecting / waiting / ready_check)
//
// Ce composant reçoit tout par props : aucun état interne, aucun appel réseau.
// ============================================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Arena from '../Arena';
import GameStatusBar from '../GameStatusBar';
import GenericSelector from '../../atoms/Selector';
import Button from '../../atoms/Button';
import type {
  GameStatus,
  BackgroundMode,
  LobbyPhase,
  GameState,
  Scores,
  GameMode,
} from '../../../types/game.types';

// ── Types ────────────────────────────────────────────────────────────────────

interface GamePlayScreenProps {
  // Statut
  gameStatus: GameStatus;

  // Scores & labels
  scores: Scores;
  labelLeft: string;
  labelRight: string;

  // Lobby / pre-game
  gameMode: GameMode;
  lobbyPhase: LobbyPhase;
  playersCount: number;
  /** true = ready_check reçu ET joueur n'a pas encore cliqué "prêt" */
  awaitingReady: boolean;

  // Canvas
  gameStateRef: React.MutableRefObject<GameState | null>;
  bgMode: BackgroundMode;
  onChangeBgMode: (mode: BackgroundMode) => void;

  // Callbacks
  onReady: () => void;
  onExit: () => void;
}

const BG_MODES: BackgroundMode[] = ['psychedelic', 'ocean', 'sunset', 'grayscale'];

// ── Composant ────────────────────────────────────────────────────────────────

const GamePlayScreen = ({
  gameStatus,
  scores,
  labelLeft,
  labelRight,
  gameMode,
  lobbyPhase,
  playersCount,
  awaitingReady,
  gameStateRef,
  bgMode,
  onChangeBgMode,
  onReady,
  onExit,
}: GamePlayScreenProps) => {
  const { t } = useTranslation('common');
  const [showControls, setShowControls] = useState(false);
  const isRemoteLikeMode = gameMode === 'remote' || gameMode === 'tournament';
  const isGameStarted = lobbyPhase === 'playing' || lobbyPhase === 'finished';
  const missingPlayers = isRemoteLikeMode && !isGameStarted && playersCount < 2;

  // Pré-jeu : attendre tant que les deux joueurs ne sont pas présents
  const showConnecting = missingPlayers;
  const showPreGameOverlay = showConnecting || awaitingReady;
  const showLobbyInfoBanner = missingPlayers;

  return (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden md:max-w-8xl md:mx-auto">
      {/* ── Barre de scores ── */}
      <GameStatusBar
        status={gameStatus}
        sessionsData={null}
        scoreLeft={scores.left}
        scoreRight={scores.right}
        labelLeft={labelLeft}
        labelRight={labelRight}
      />

      {/* ── Barre de contrôles : Commandes / Type d'arène / Quitter ── */}
      <div className="w-full flex flex-col">
        {showControls && (
          <div className="bg-white/5 backdrop-blur p-3 rounded-lg border border-white/10 mx-4 mt-2">
            <p className="text-gray-100 text-center font-mono">
              <span className="text-green-300 font-bold text-xl">W / S</span>
              {` ${t('game.controls.left_paddle')},  `}
              <span className="text-green-300 font-bold text-2xl">↑ / ↓</span>
              {` ${t('game.controls.right_paddle')}`}
            </p>
          </div>
        )}

        <div className="flex flex-row items-center justify-center gap-4 py-3 px-4 flex-wrap">
          {/* Commandes */}
          <Button
            id="controls-btn"
            variant="info"
            type="button"
            onClick={() => setShowControls((v) => !v)}
          >
            {showControls ? t('game.info_controls_mask') : t('game.info_controls')}
          </Button>

          {/* Sélecteur type d'arène */}
          <GenericSelector
            label={t('game.ambience')}
            value={bgMode}
            options={BG_MODES}
            onChange={onChangeBgMode}
          />

          {/* Quitter */}
          <Button id="exit-btn" variant="alert" type="button" onClick={onExit}>
            {t('game.exit')}
          </Button>
        </div>

        {showLobbyInfoBanner && (
          <div className="mx-4 mb-2 rounded-lg border border-white/80 bg-white px-4 py-2 text-center shadow-md">
            <p className="font-mono text-xs text-slate-900">
              {lobbyPhase === 'ready_check'
                ? t('game.lobby.phase.ready_check')
                : t(
                    'game.lobby.info_waiting_player2',
                    'Lobby: en attente du joueur 2 pour démarrer la partie.',
                  )}
            </p>
          </div>
        )}
      </div>

      {/* ── Zone centrale : Arena + PreGameOverlay ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 pb-4 min-h-0">
        <div className="w-full max-w-5xl relative">
          <Arena currentMode={bgMode} gameStateRef={gameStateRef} />

          {/* PreGameOverlay (connexion / attente / ready_check) */}
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
        </div>
      </div>
    </div>
  );
};

export default GamePlayScreen;
