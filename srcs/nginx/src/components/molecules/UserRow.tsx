import { AvatarSize } from '../../core/react-types';
import { UserProfileDTO } from '../../schemas/profile.schema';
import Avatar from '../atoms/Avatar';

/**
 * @todo guards for avatar url format
 */
interface Props {
  user: UserProfileDTO;
  avatarSize: AvatarSize;
}

export const UserRow = ({ user, avatarSize }: Props) => {
  return (
    <div className="flex items-center gap-4">
      <Avatar alt="user avatar" size={avatarSize} avatarUrl={user.avatarUrl}></Avatar>
      <div className="flex flex-col">
        <span className="font-quantico font-bold text-lg">{user.username}</span>
      </div>
    </div>
  );
};
