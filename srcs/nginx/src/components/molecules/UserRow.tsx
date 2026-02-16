import { ProfileSimpleDTO } from '@transcendence/core';
import { AvatarSize, UserActions } from '../../types/react-types';
import Avatar from '../atoms/Avatar';
import { Gamepad2, Plus, UserRoundMinus, UserRoundPlus, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

/**
 * @todo guards for avatar url format
 */
interface Props {
  user: ProfileSimpleDTO;
  avatarSize?: AvatarSize;
  actions: UserActions[];
}

const actionProps: Record<UserActions, { icon: LucideIcon; color: string; labelKey: string }> = {
  [UserActions.ADD]: { icon: UserRoundPlus, color: 'text-gray-300', labelKey: 'friends.add' },
  [UserActions.PLAY]: { icon: Gamepad2, color: 'text-gray-300', labelKey: 'friends.play' },
  [UserActions.REMOVE]: { icon: UserRoundMinus, color: 'text-red-300', labelKey: 'friends.remove' },
  [UserActions.CHANGE]: { icon: UserRoundMinus, color: 'text-red-300', labelKey: 'friends.remove' },
};

export const UserRow = ({ user, avatarSize = 'md', actions }: Props) => {
  const { t } = useTranslation();
  const xOffset = 20;
  // const baseRadius = 90;
  const verticalSpacing = 55;
  const arcIntensity = 20;
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 md:bg-transparent z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        onClick={toggleMenu}
        className={`group relative z-40   flex flex-row items-center gap-3 p-2 my-4 rounded-full cursor-pointer transition-all duration-300
        ${isOpen ? 'bg-slate-700 w-[80vw] md:w-[55vw]' : 'bg-slate-700/20 w-[80vw] md:w-[80vw]'}
        hover:bg-slate-700`}
      >
        <div className="flex w-full flex-row items-center justify-between gap 2">
          <div className="flex flex-row items-center gap-2">
            <Avatar alt="user avatar" size={avatarSize} src={user.avatarUrl}></Avatar>
            <span className="text-white text-md font-quantico font-semibold ml-1 mt-1 tracking-widest">
              {user.username}
            </span>
          </div>
          <div
            className={`flex flex-col mr-3 transition-transform duration-300 ${isOpen ? 'rotate-90 opacity-100' : 'opacity-70'} `}
          >
            <Plus color="white" size={24} />
          </div>
        </div>

        <div
          className={`border border-amber-400
     hidden md:flex absolute left-full top-1/2 -translate-y-1/2 w-64 h-64 z-50 transition-all
      ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none'}

      `}
        >
          {actions.map((actionType, index) => {
            const actionProp = actionProps[actionType];
            const Icon = actionProp.icon;
            const middleIndex = (actions.length - 1) / 2;
            const distanceFromCenter = Math.abs(index - middleIndex);
            // const translateX = xOffset - distanceFromCenter * arcIntensity;
            const relPos = index - middleIndex;
            const translateY = relPos * verticalSpacing;
            console.log(`middleIndex is ${middleIndex}`);
            console.log(`distanceFromCenter is ${distanceFromCenter}`);
            console.log(`translateY is ${translateY}`);
            console.log(`actionProp.labelKey is ${actionProp.labelKey}`);
            return (
              <div
                key={actionType}
                className={`absolute left-0 top-1/2 flex items-center gap-3 hover:cursor-pointer transition-all duration-300
              `}
                style={{
                  transform: `translate(${xOffset - Math.abs(relPos) * arcIntensity}px, calc(-50% + ${relPos * verticalSpacing}px))`,
                  transitionDelay: `${index * 60}ms`,
                }}
              >
                <button
                  className={`w-12 h-12 rounded-full bg-slate-700 ${isOpen ? 'hover:bg-white' : 'hover:bg-slate-700'} flex items-center justify-center shadow-lg  transition-all`}
                >
                  <Icon className={`${actionProp.color}`} size={22} />
                </button>
                <span className="text-gray-600 font-bold text-xs whitespace-nowrap bg-slate-900/10 px-2 py-1 rounded shadow-md">
                  {t(actionProp.labelKey)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`md:hidden flex flex-row justify-center gap-6 overflow-hidden transition-all duration-300 z-20
        ${isOpen ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}
      >
        {actions.map((actionType) => {
          const config = actionProps[actionType];
          return (
            <button
              key={actionType}
              className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center shadow-lg active:scale-90 border border-slate-600"
            >
              <config.icon className={config.color} size={26} />
            </button>
          );
        })}
      </div>
    </>
  );
};
