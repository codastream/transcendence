import { AvatarSize } from '../../types/react-types';

import defaultAvatar from '../../assets/avatars/default.png';
import { Link } from 'react-router-dom';

interface AvatarProps {
  src: string | null;
  alt?: string;
  size?: AvatarSize;
  className?: string;
  to?: string;
  username?: string;
}

const Avatar = ({
  src,
  alt = 'User avatar',
  size = 'md',
  className = '',
  to,
  username,
}: AvatarProps) => {
  const sizeClasses: Record<AvatarSize, string> = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const destination = to || (username ? `/profile/${encodeURIComponent(username)}` : null);

  const content = (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-sm bg-cyan-200 flex items-center justify-center ${className}`}
    >
      <img src={src || defaultAvatar} alt={alt} className="w-full h-full object-cover" />
    </div>
  );

  if (!destination) return content;

  return (
    <Link to={destination} className="block hover:opacity-80 transition-opacity">
      {content}
    </Link>
  );
};

export default Avatar;
