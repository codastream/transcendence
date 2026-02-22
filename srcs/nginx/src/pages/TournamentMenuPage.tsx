import { CircleButton } from '../components/atoms/CircleButton';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TournamentMenuPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <CircleButton isMoving={false} onClick={() => navigate('list')}>
        {t('game.participate')}
      </CircleButton>
      <CircleButton isMoving={false} onClick={() => navigate('create')}>
        {t('game.create')}
      </CircleButton>
    </div>
  );
}
