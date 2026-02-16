import { ProfileSimpleDTO } from '@transcendence/core';
import { AvatarSize, UserActions } from '../../types/react-types';
import Avatar from '../atoms/Avatar';
import { Gamepad2, Plus, UserRoundMinus, UserRoundPlus, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * @todo guards for avatar url format
 */
interface Props {
  user: ProfileSimpleDTO;
  avatarSize?: AvatarSize;
  actions: UserActions[];
}

const actionProps: Record<UserActions, { icon: LucideIcon; color: string; labelKey: string }> = {
  [UserActions.ADD]: { icon: UserRoundPlus, color: 'text-gray-100', labelKey: 'friends.add' },
  [UserActions.PLAY]: { icon: Gamepad2, color: 'text-gray-100', labelKey: 'friends.play' },
  [UserActions.REMOVE]: { icon: UserRoundMinus, color: 'text-red-300', labelKey: 'friends.remove' },
};

export const UserRow = ({ user, avatarSize = 'md', actions }: Props) => {
  const { t } = useTranslation();
  const baseRadius = 25;
  const verticalSpacing = 5;
  const arcIntensity = 25;

  return (
    <div className="group relative w-[50vw] hover:w-[55vw] flex flex-row items-center gap-3 p-2 rounded-full bg-slate-700/20 hover:bg-slate-700 transition-all duration-300">
      <div className="flex w-full flex-row items-center justify-between gap 2">
        <Avatar alt="user avatar" size={avatarSize} src={user.avatarUrl}></Avatar>
        <div className="flex flex-col justify-center items-center">
          <span className="text-white text-md font-quantico font-semibold ml-1 mt-1 tracking-widest">
            {user.username}
          </span>
        </div>
        <div className="flex flex-col mr-3 opacity-70 group-hover:rotate-90 transition-transform duration-300">
          <Plus className="" color="white" size={24} />
        </div>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 left-full ml-4 flex-col gap-3 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover: pointer-events-auto transition-all duration-200 z-50">
        {actions.map((actionType, index) => {
          const actionProp = actionProps[actionType];
          const Icon = actionProp.icon;
          const middleIndex = (actions.length - 1) / 2;
          const distanceFromCenter = Math.abs(index - middleIndex);
          const translateX = baseRadius - distanceFromCenter * arcIntensity;
          const translateY = (index - middleIndex) * verticalSpacing;

          console.log(`translateY is ${translateY}`);
          return (
            <div
              key={actionType}
              className="flex items-center min-w-50 gap-5 cursor-pointer group/item"
              style={{
                transform: `translate(${translateX}px, ${translateY}px)`,
                transitionDelay: `${index * 60}ms`,
              }}
            >
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-slate-700 flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all cursor-pointer">
                <Icon className={actionProp.color} size={22} />
              </div>
              <span className="text-gray-800 font-semibold text-sm whitespace-nowrap drop-shadow-sm bg-white/40 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {t(actionProp.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
