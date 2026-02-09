import { useState } from 'react';
import { RegisterForm } from '../organisms/RegisterForm';
import { LoginForm } from '../organisms/LoginForm';
import Circle from '../atoms/Circle';
import { useTranslation } from 'react-i18next';

interface HaloProps {
  isRegister: boolean;
  className?: string;
  size?: number;
}

const Halo = ({ className = '', size = 120, isRegister, onToggleForm }: HaloProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const { t } = useTranslation();
  const title = isRegister ? t('auth.signup') : t('auth.login');
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Circle size={50} className="cursor-pointer">
        {!isHovered ? (
          <span className="text-2xl font-bold">PLAY</span>
        ) : isRegister ? (
          <RegisterForm onToggleForm={onToggleForm} />
        ) : (
          <LoginForm onToggleForm={onToggleForm} />
        )}
      </Circle>
    </div>
  );
};

export default Halo;
