import { useTranslation } from 'react-i18next';
import Button from '../atoms/Button';

interface GameControlProps {
  className?: string;
  onCreateLocalGame: () => void;
  onStartGame: () => void;
  onExitGame: () => void;
  gameMode: string;
  loading?: boolean;
}

const GameControl = ({
  className,
  onCreateLocalGame,
  onStartGame,
  onExitGame,
  gameMode,
  loading,
}: GameControlProps) => {
  const { t } = useTranslation('common');

  return (
    <div className={`flex flex-row justify-center gap-4 ${className}`}>
      {gameMode === 'remote' && (
        <Button
          id="create-game-btn"
          variant="primary"
          type="button"
          onClick={onCreateLocalGame}
          disabled={loading}
        >
          {loading ? t('global.loading') : t('game.create')}
        </Button>
      )}

      <Button id="start-game-btn" variant="secondary" type="button" onClick={onStartGame}>
        {t('game.start')}
      </Button>

      <Button
        id="exit-btn"
        variant="alert"
        type="button"
        onClick={() => {
          onExitGame();
        }}
      >
        {t('game.exit')}
      </Button>
    </div>
  );
};

export default GameControl;
