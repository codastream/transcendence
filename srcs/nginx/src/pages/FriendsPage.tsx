import {
  FriendshipUnifiedDTO,
  FrontendError,
  HTTP_STATUS,
  ProfileSimpleDTO,
} from '@transcendence/core';
import { useTranslation } from 'react-i18next';
import UserRow from '../components/molecules/UserRow';
import { Page } from '../components/organisms/PageContainer';
import { UserActions } from '../types/react-types';
import UserSearchContainer from '../components/molecules/UserSearchContainer';
import { friendApi } from '../api/friend-api';
import { useEffect, useState } from 'react';

export const FriendsPage = () => {
  const { t } = useTranslation();
  const [friends, setFriends] = useState<FriendshipUnifiedDTO[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearch, setIsSearch] = useState<boolean>(true);

  const allowedActions: UserActions[] = [UserActions.PLAY, UserActions.REMOVE];

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const data = await friendApi.getFriends();
        setFriends(data);
      } catch (err) {
        if (err instanceof FrontendError) {
          setErrorMessage(err.message);
        }
        setIsSearch(true);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const handleUserAction = async (action: UserActions, targetUser: ProfileSimpleDTO) => {
    try {
      if (action === UserActions.PLAY) {
        console.log('play');
      }
      if (action === UserActions.ADD) {
        await friendApi.addFriend(targetUser.username);
        const updatedFriends = await friendApi.getFriends();
        setFriends(updatedFriends);
      }
      if (action === UserActions.REMOVE) {
        await friendApi.removeFriend(targetUser.username);
        const updatedFriends = await friendApi.getFriends();
        setFriends(updatedFriends);
      }
    } catch (err: unknown) {
      if (err instanceof FrontendError) {
        if (err.statusCode === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
          setErrorMessage(t('errors.friend_self_add'));
        } else if (err.statusCode === HTTP_STATUS.CONFLICT) {
          setErrorMessage(t('errors.friend_already'));
        } else {
          setErrorMessage(err.message);
        }
      }
    }
  };

  return (
    <Page className="flex flex-col" title={t('friends.friends')}>
      <div className="border-b border-b-gray-300 mb-4">
        <h2 className=" font-quantico text-gray-500 mb-1">Add friend</h2>
      </div>
      <div className="mb-4 w-[100%]">
        <UserSearchContainer
          isSearch={isSearch}
          actions={[UserActions.ADD]}
          onAction={handleUserAction}
        ></UserSearchContainer>
      </div>
      {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
      <div className="border-b border-b-gray-300 mb-1">
        <h2 className=" font-quantico text-gray-500 mb-1">Existing friends</h2>
      </div>
      <div className="flex flex-col gap-2">
        {isLoading && <p>Loading..</p>}
        {friends.length === 0 && <p className="text-gray-400 italic">{t('search.no_results')}</p>}
        {friends.map((f) => (
          <UserRow
            key={f.id}
            user={f.friend}
            actions={allowedActions}
            onAction={handleUserAction}
          />
        ))}
      </div>
    </Page>
  );
};
