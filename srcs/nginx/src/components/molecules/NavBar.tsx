import { UserRow } from './UserRow';
import MenuElement from '../atoms/MenuElement';
import { MenuActions } from '../../types/react-types';
import { useAuth } from '../helpers/AuthProvider';
import { DevLoginButtons } from '../atoms/DevLogin';

const playItems = [
  { label: 'Play with friend', href: '#friends' },
  { label: 'Play with AI', href: '#ai' },
  { label: 'Tournament', href: '#tournament' },
];

const profileItems = [
  { label: 'Profile', href: '#profile' },
  { label: 'Statistics', href: '#stats' },
  { label: 'History', href: '#history' },
];

// const homeItems = [{ label: 'Home', href: '#' }];

// interface NavbarProps {
//   user: ProfileAuthDTO;
// }

export const NavBar = () => {
  const { user, isLoggedIn } = useAuth();

  return (
    <nav className="mb-3 bg-teal-800/30 p-2 w-full flex flex-row justify-evenly">
      <div className="lg:text-3xl text-xl group font-quantico[900] font-stretch-extra-expanded font-bold tracking-wider self-center uppercase">
        <span>Sp</span>
        <span className="lowercase inline-block duration-500 group-hover:rotate-180">i</span>
        <span>n Pong</span>
      </div>
      <MenuElement action={MenuActions.PLAY} items={playItems}></MenuElement>
      <MenuElement action={MenuActions.PROFILE} items={profileItems}></MenuElement>
      <DevLoginButtons></DevLoginButtons>
      {user && isLoggedIn && <UserRow key={user.avatarUrl} avatarSize="sm" user={user}></UserRow>}
    </nav>
  );
};
