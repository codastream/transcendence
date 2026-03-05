// ============================================================================
// GameOverOverlay — Overlay plein-écran affiché quand la partie est terminée.
// Affiche le gagnant, les scores, et un bouton "Rejouer".
// ============================================================================

import { useTranslation } from 'react-i18next';
import Button from '../atoms/Button';
import type { GameMode, Scores, PlayerRole } from '../../types/game.types';

interface GameOverOverlayProps {
  winner: 'left' | 'right';
  scores: Scores;
  gameMode: GameMode;
  labelLeft: string; // Nom du joueur gauche
  labelRight: string; // Nom du joueur droit
  localRole?: PlayerRole | null; // Rôle du joueur local (pour déterminer le gagnant en AI mode)
  isForfeit?: boolean;
  onPlayAgain: () => void;
}

const GameOverOverlay = ({
  winner,
  scores,
  gameMode,
  labelLeft,
  labelRight,
  localRole = null,
  isForfeit = false,
  onPlayAgain,
}: GameOverOverlayProps) => {
  const { t } = useTranslation('common');

  const winnerLabel = (): string => {
    if (isForfeit) return t('game.winner.forfeit');
    const winnerName = winner === 'left' ? labelLeft : labelRight;
    if (gameMode === 'ai') {
      // Humain gagne si son paddle (déterminé par localRole) correspond au winner
      const humanSide = localRole === 'A' ? 'left' : 'right';
      return winner === humanSide ? t('game.winner.you_win') : t('game.winner.ai_wins');
    }
    // Pour remote/tournament/local: affiche le nom du gagnant avec 'wins'
    return `${winnerName} wins!`;
  };

  const winnerColor = winner === 'left' ? '#34d399' : '#fb7185';

  return (
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
      <Button variant="secondary" type="button" onClick={onPlayAgain}>
        {t('game.play_again')}
      </Button>
    </div>
  );
};

export default GameOverOverlay;
