/**
 * OAuthCallback - Page de traitement du callback OAuth
 *
 * Cette page gère le retour depuis les providers OAuth (Google, 42 School).
 *
 * Architecture 100% cohérente avec LoginForm/RegisterForm :
 * - Logique métier extraite dans oauthActions.ts
 * - Placée dans PublicRoute → redirection automatique après login()
 * - Composant purement UI (présentation d'état)
 *
 * Pattern identique à LoginForm :
 * - Actions externalisées (oauthCallbackAction vs loginAction)
 * - useEffect surveille success → appelle login()
 * - PublicRoute gère la navigation automatiquement
 * - Aucune logique métier dans le composant
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Background from '../components/atoms/Background';
import { NavBar } from '../components/molecules/NavBar';
import { oauthCallbackAction, OAuthCallbackState } from '../api/oauthActions';
import { useAuth } from '../providers/AuthProvider';

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

type OAuthProvider = 'google' | 'school42';

export const OAuthCallback = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: OAuthProvider }>();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // État local
  const [state, setState] = useState<OAuthCallbackState>({
    status: 'loading',
  });

  // Traitement du callback OAuth au mount
  useEffect(() => {
    const handleCallback = async () => {
      // Récupération des paramètres OAuth
      const code = searchParams.get('code');
      const oauthState = searchParams.get('state');
      const error = searchParams.get('error');

      // Gestion des erreurs OAuth (utilisateur a refusé l'autorisation)
      if (error) {
        setState({
          status: 'error',
          error: t('oauth.authorization_denied'),
        });
        return;
      }

      // Appel de l'action
      const result = await oauthCallbackAction(provider || '', code, oauthState);
      setState(result);
    };

    handleCallback();
  }, [provider, searchParams, t]);

  useEffect(() => {
    if (state.status === 'success' && state.data?.username) {
      login({
        username: state.data.username,
        avatarUrl: null,
      });
    }
  }, [state.status, state.data?.username, login]);

  return (
    <div className="w-full h-full relative">
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        <NavBar />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-lg">{t('oauth.processing')}</p>
            </div>
          )}

          {state.status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-green-500 text-5xl">✓</div>
              <p className="text-lg">{t('oauth.success')}</p>
              <p className="text-sm text-gray-400">{t('oauth.redirecting')}</p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="flex flex-col items-center gap-4 max-w-md p-6 bg-red-900/20 rounded-lg border border-red-500">
              <div className="text-red-500 text-5xl">✕</div>
              <p className="text-lg font-bold">{t('oauth.error')}</p>
              <p className="text-sm text-gray-300">{state.error}</p>
              <button
                onClick={() => navigate('/welcome', { replace: true })}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {t('oauth.back_to_login')}
              </button>
            </div>
          )}
        </div>
      </Background>
    </div>
  );
};
