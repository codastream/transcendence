import { useTranslation } from 'react-i18next';
import Button from '../atoms/Button';
import { useState } from 'react';

interface GameControlProps {
  className?: string;
  onCreateLocalGame: () => void;
  onStartGame: () => void;
  onExitGame: () => void;
  isPlaying: boolean;
  gameMode: string;
  loading?: boolean;
}

const GameControl = ({
  className,
  onCreateLocalGame,
  onStartGame,
  onExitGame,
  isPlaying,
  gameMode,
  loading,
}: GameControlProps) => {
  const { t } = useTranslation('common');
  const [isDiplayedInfo, setIsDisplayedInfo] = useState<boolean>(false);

  const toggleDisplayInfo = () => {
    setIsDisplayedInfo((prev) => !prev);
  };
  return (
    <div className="flex flex-col w-full">
      {isDiplayedInfo && (
        <div className="bg-white/5 backdrop-blur p-3 rounded-lg border border-white/10">
          <p className="text-gray-100 text-center font-mono">
            <span className="text-green-300 font-bold text-xl">W/S</span>
            {` ${t('game.controls.left_paddle')}, `}
            <span className="text-green-300 font-bold text-2xl">↑/↓</span>
            {` ${t('game.controls.right_paddle')}`}
          </p>
        </div>
      )}
      <div className={`w-full flex flex-row justify-center gap-4 my-3 ${className}`}>
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

        {!isPlaying && (
          <Button id="start-game-btn" variant="secondary" type="button" onClick={onStartGame}>
            {t('game.start')}
          </Button>
        )}

        <Button
          id="info-control-btn"
          variant="info"
          type="button"
          onClick={() => toggleDisplayInfo()}
        >
          {isDiplayedInfo ? t('game.info_controls_mask') : t('game.info_controls')}
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
    </div>
  );
};

export default GameControl;
