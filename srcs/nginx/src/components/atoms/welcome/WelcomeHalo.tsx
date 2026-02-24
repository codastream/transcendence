import { useState } from 'react';
import { WelcomeRegisterForm } from '../../organisms/welcome/WelcomeRegisterForm';
import { WelcomeLoginForm } from '../../organisms/welcome/WelcomeLoginForm';
import WelcomeCircle from './WelcomeCircle';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../providers/AuthProvider';

interface WelcomeHaloProps {
  isRegister: boolean;
  className?: string;
  size?: number;
  onToggleForm: () => void;
}

/**
 * WelcomeHalo - Halo lumineux spécifique à WelcomePage
 * Design: Atome avec orbites électroniques, gradient cyan/bleu
 */
const WelcomeHalo = ({ className = '', size = 92, isRegister, onToggleForm }: WelcomeHaloProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const title = isRegister ? t('auth.signup') : t('auth.login');

  return (
    <div
      className={`absolute ${className} w-[95vw] max-w-2xl lg:w-auto`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <WelcomeCircle
        size={isHovered ? (isLoggedIn ? 40 : size) : 32}
        className="cursor-pointer group hover:shadow-[0_8px_40px_rgba(0,255,159,0.25),0_0_120px_rgba(0,136,255,0.15)]"
      >
        {/* PLAY text initial - Style atome */}
        <div
          className={`transition-all duration-500 ${isHovered ? 'opacity-0 scale-90 absolute invisible' : 'opacity-100 scale-100 block visible'}`}
        >
          <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00ff9f] to-[#0088ff] bg-clip-text text-transparent drop-shadow-lg">
            PLAY
          </span>
        </div>

        {/* Forms */}
        <div
          className={`transition-all duration-500 w-full ${isHovered ? 'opacity-100 scale-100 block visible' : 'opacity-0 scale-90 absolute invisible'}`}
        >
          <h1 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">{title}</h1>
          <div className="w-full space-y-1">
            {isRegister ? (
              <WelcomeRegisterForm onToggleForm={onToggleForm} />
            ) : (
              <WelcomeLoginForm onToggleForm={onToggleForm} />
            )}
          </div>
        </div>
      </WelcomeCircle>
    </div>
  );
};

export default WelcomeHalo;
