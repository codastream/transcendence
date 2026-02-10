import { ProfileSimpleDTO } from '@transcendence/core';
import { AvatarSize } from '../../types/react-types';
import Avatar from '../atoms/Avatar';

/**
 * @todo guards for avatar url format
 */
interface Props {
  user: ProfileSimpleDTO;
  avatarSize: AvatarSize;
}

export const UserRow = ({ user, avatarSize }: Props) => {
  return (
    <div className="relative flex flex-row items-center gap-2">
      <Avatar alt="user avatar" size={avatarSize} src={user.avatarUrl}></Avatar>
      <div className="flex flex-col">
        <span className="text-white text-xs font-quantico font-semibold mt-1 tracking-widest">
          {user.username}
        </span>
      </div>
    </div>
  );
};
