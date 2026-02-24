import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import logo42 from '../../assets/icons/42.svg';
import logoGoogle from '../../assets/icons/google.svg';
import { buildOAuthUrl, OAUTH_CONFIG } from '../../api/oauthActions';

type OAuthProvider = 'google' | 'school42';

interface OAuthButtonProps {
  provider: OAuthProvider;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Composant bouton OAuth générique
 * Responsabilité : UI + déclenchement de la redirection
 * Pattern : délégation à buildOAuthUrl pour la logique métier
 */
export const OAuthButton = ({
  provider,
  children,
  className = '',
  disabled = false,
}: OAuthButtonProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const handleOAuthLogin = () => {
    if (disabled || isLoading) return;
    setConfigError(null);

    const clientId = OAUTH_CONFIG[provider].clientId;
    if (!clientId) {
      setConfigError(t('oauth.error_config', { provider }));
      return;
    }

    setIsLoading(true);
    window.location.href = buildOAuthUrl(provider);
  };

  const baseClasses = `
    w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200
    flex items-center justify-center space-x-2
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const providerClasses: Record<OAuthProvider, string> = {
    google: `bg-white border border-gray-300 text-gray-700
      hover:bg-gray-50 focus:ring-blue-500 disabled:hover:bg-white`,
    school42: `bg-black text-white
      hover:bg-gray-800 focus:ring-gray-500 disabled:hover:bg-black`,
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleOAuthLogin}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${providerClasses[provider]} ${className}`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            <span>{t('oauth.connecting')}</span>
          </>
        ) : (
          children
        )}
      </button>
      {configError && <p className="text-red-500 text-xs mt-1 text-center">{configError}</p>}
    </div>
  );
};

/**
 * Bouton Google pré-configuré
 */
export const GoogleOAuthButton = ({
  className = '',
  disabled = false,
}: Omit<OAuthButtonProps, 'provider' | 'children'>) => {
  const { t } = useTranslation();
  return (
    <OAuthButton provider="google" className={className} disabled={disabled}>
      <img src={logoGoogle} alt="Google" className="w-5 h-5" aria-hidden="true" />
      <span>{t('oauth.continue_google')}</span>
    </OAuthButton>
  );
};

/**
 * Bouton 42 School pré-configuré
 */
export const School42OAuthButton = ({
  className = '',
  disabled = false,
}: Omit<OAuthButtonProps, 'provider' | 'children'>) => {
  const { t } = useTranslation();
  return (
    <OAuthButton provider="school42" className={className} disabled={disabled}>
      <img
        src={logo42}
        alt="42 School"
        className="w-5 h-5 brightness-0 invert"
        aria-hidden="true"
      />
      <span>{t('oauth.continue_42')}</span>
    </OAuthButton>
  );
};
