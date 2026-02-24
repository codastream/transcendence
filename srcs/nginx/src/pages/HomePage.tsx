import { NavBar } from '../components/molecules/NavBar';
import Background from '../components/atoms/Background';
import { useTranslation } from 'react-i18next';
import { CircleButton } from '../components/atoms/CircleButton';
import Scrollable from '../components/atoms/Scrollable';
import { Link } from 'react-router-dom';

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

/**
 * HomePage — Page d'accueil pour les utilisateurs authentifiés.
 * Responsabilités :
 * - Affiche les options principales du site (jouer, tournois, etc.)
 */
export const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full relative">
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        <NavBar />
        <Scrollable isAnimated={true}>
          <Link to="/game/pong-ai">
            <CircleButton isMoving={true}>{t('game.playWithAI')}</CircleButton>
          </Link>
          <Link to="/game/simple-game">
            <CircleButton isMoving={true}>{t('game.playWithFriends')}</CircleButton>
          </Link>
          <Link to="/game/tournament">
            <CircleButton isMoving={true}>{t('game.tournament')}</CircleButton>
          </Link>
        </Scrollable>
      </Background>
    </div>
  );
};
