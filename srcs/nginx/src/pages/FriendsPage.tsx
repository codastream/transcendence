import { ProfileSimpleDTO } from '@transcendence/core';
import { useTranslation } from 'react-i18next';
import { UserRow } from '../components/molecules/UserRow';
import { Page } from '../components/organisms/PageContainer';
import { UserActions } from '../types/react-types';

export const FriendsPage = () => {
  const { t } = useTranslation();
  const friends: ProfileSimpleDTO[] = [
    {
      username: 'friend1',
      avatarUrl: 'src/assets/avatars/default.png',
    },
    {
      username: 'friend2',
      avatarUrl: 'src/assets/avatars/einstein_sq.jpg',
    },
    {
      username: 'friend3',
      avatarUrl: 'src/assets/avatars/bohr_sq.jpg',
    },
  ];
  const allowedActions: UserActions[] = [UserActions.ADD, UserActions.PLAY, UserActions.REMOVE];
  return (
    <Page className="flex flex-col" title={t('friends.friends')}>
      <div className="flex flex-col gap-2">
        {friends.map((f) => (
          <UserRow key={f.username} user={f} actions={allowedActions} />
        ))}
      </div>
    </Page>
  );
};
