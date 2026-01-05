import { UserRow } from './UserRow';
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../utils/errors';
import { UserProfileDTO } from '../../schemas/profile.schema';
import MenuElement from '../atoms/MenuElement';
import { MenuActions } from '../../core/react-types';

const playItems = [
  { label: 'Play with friend', href: '#friends' },
  { label: 'Tournament', href: '#tournament' },
];

const profileItems = [
  { label: 'Profile', href: '#profile' },
  { label: 'Statistics', href: '#stats' },
  { label: 'Achievements', href: '#achievements' },
];

const homeItems = [{ label: 'Home', href: '#' }];

export const NavBar = () => {
  const [user, setUser] = useState<UserProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = {
        username: 'toto',
        avatarUrl: 'default.png',
      };
      setUser(data);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-800 animate-pulse"></div>
        <div className="h-4 w-40 bg-slate-800 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!user || error) {
    return (
      <div className="space-y-3">
        <p className="text-red-400">Unable to load your profile</p>
        <p className="text=xs text-slate-400">{error}</p>
        <button className="px-3 py-1"></button>
      </div>
    );
  }

  return (
    <nav className="mb-3 bg-teal-800/30 p-2 w-full flex flex-row justify-evenly">
      <div className="group font-quantico[900] font-stretch-extra-expanded font-bold tracking-wider self-center uppercase">
        <span>Sp</span>
        <span className="lowercase inline-block duration-500 group-hover:rotate-180">i</span>
        <span>n Pong</span>
      </div>
      <MenuElement action={MenuActions.HOME} items={homeItems}></MenuElement>
      <MenuElement action={MenuActions.PLAY} items={playItems}></MenuElement>
      <MenuElement action={MenuActions.PROFILE} items={profileItems}></MenuElement>
      <UserRow avatarSize="sm" user={user}></UserRow>
    </nav>
  );
};
