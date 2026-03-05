// ============================================================================
// Lobby — Écran pré-jeu : affiche les joueurs connectés, leur statut ready,
// et le bouton "Ready" pour déclencher le démarrage de la partie.
//
// Affiché entre la connexion WS et le premier message 'state' du backend.
// ============================================================================

import { useTranslation } from 'react-i18next';
import Button from '../atoms/Button';
import type { LobbyPhase, PlayerInfo, PlayerRole } from '../../types/game.types';

interface LobbyProps {
  phase: LobbyPhase;
  players: PlayerInfo[];
  localRole: PlayerRole | null;
  sessionName: string | null;
  /** Nombre de joueurs requis selon le mode (1 pour local/ai, 2 pour remote/tournament) */
  requiredPlayers: number;
  onReady: () => void;
  onLeave: () => void;
}

const PlayerSlot = ({
  player,
  isLocal,
}: {
  player: PlayerInfo | undefined;
  isLocal: boolean;
  slotLabel: string;
}) => {
  const { t } = useTranslation('common');

  if (!player) {
    return (
      <div className="flex flex-col items-center gap-2 opacity-40">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
          <span className="text-white/50 text-xl">?</span>
        </div>
        <p className="text-gray-400 font-mono text-sm">{t('game.lobby.waiting_player')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold text-xl
          ${player.ready ? 'border-green-400 bg-green-400/20' : 'border-white/40 bg-white/5'}`}
      >
        {player.username.charAt(0).toUpperCase()}
      </div>
      <p className="text-gray-100 font-mono text-sm">
        {player.username}
        {isLocal && <span className="ml-1 text-purple-400 text-xs">({t('game.lobby.you')})</span>}
      </p>
      <span
        className={`text-xs font-mono px-2 py-0.5 rounded-full
          ${player.ready ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'}`}
      >
        {player.ready ? t('game.lobby.ready') : t('game.lobby.not_ready')}
      </span>
    </div>
  );
};

const Lobby = ({
  phase,
  players,
  localRole,
  sessionName,
  requiredPlayers,
  onReady,
  onLeave,
}: LobbyProps) => {
  const { t } = useTranslation('common');

  const playerA = players.find((p) => p.role === 'A');
  const playerB = players.find((p) => p.role === 'B');
  const localPlayer = players.find((p) => p.role === localRole);
  const isLocalReady = localPlayer?.ready ?? false;
  const canClickReady = phase === 'ready_check' && !isLocalReady;

  const statusMessages: Record<LobbyPhase, string> = {
    connecting: t('game.lobby.phase.connecting'),
    waiting_players: t('game.lobby.phase.waiting_players'),
    ready_check: t('game.lobby.phase.ready_check'),
    playing: t('game.lobby.phase.playing'),
    finished: t('game.lobby.phase.finished'),
    disconnected: t('game.lobby.phase.disconnected'),
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 min-h-64">
      {/* Session name */}
      {sessionName && (
        <p className="text-purple-300 font-mono text-xs uppercase tracking-widest opacity-70">
          {sessionName}
        </p>
      )}

      {/* Phase status */}
      <p className="text-white/70 font-mono text-sm text-center">{statusMessages[phase] ?? '…'}</p>

      {/* Player slots */}
      <div className="flex flex-row items-start justify-center gap-16">
        <PlayerSlot player={playerA} isLocal={localRole === 'A'} slotLabel={t('game.player_a')} />

        <div className="flex items-center text-white/20 text-2xl font-bold self-center pb-6">
          VS
        </div>

        {requiredPlayers >= 2 && (
          <PlayerSlot player={playerB} isLocal={localRole === 'B'} slotLabel={t('game.player_b')} />
        )}
      </div>

      {/* Loading indicator: waiting for second player */}
      {phase === 'waiting_players' && requiredPlayers >= 2 && (
        <div className="flex items-center gap-2">
          <span className="animate-pulse w-2 h-2 rounded-full bg-purple-400 inline-block" />
          <span className="animate-pulse w-2 h-2 rounded-full bg-purple-400 inline-block delay-150" />
          <span className="animate-pulse w-2 h-2 rounded-full bg-purple-400 inline-block delay-300" />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-row gap-4">
        {canClickReady && (
          <Button id="ready-btn" variant="primary" type="button" onClick={onReady}>
            {t('game.lobby.btn_ready')}
          </Button>
        )}

        {/* Already ready — waiting message */}
        {phase === 'ready_check' && isLocalReady && (
          <p className="text-green-400 font-mono text-sm self-center">
            {t('game.lobby.waiting_opponent')}
          </p>
        )}

        <Button id="leave-btn" variant="alert" type="button" onClick={onLeave}>
          {t('game.exit')}
        </Button>
      </div>
    </div>
  );
};

export default Lobby;
