/**
 * TwoFactorPage - Page de validation du code OTP après login/oauth
 *
 * Cette page est affichée lorsque le backend requiert une authentification 2FA.
 * Elle valide le code à 6 chiffres fourni par l'utilisateur.
 *
 * Protection :
 * - Accessible uniquement si un contexte 2FA temporaire existe
 * - Redirige vers /welcome si aucun contexte ou contexte expiré
 *
 * Workflow :
 * 1. Login/OAuth → Backend retourne require2FA: true
 * 2. Frontend stocke contexte temporaire → Navigate /2fa (replace)
 * 3. User entre code OTP → POST /auth/2fa/verify
 * 4. Backend valide → Retourne vrai token
 * 5. Frontend appelle login() → PublicRoute redirige vers /home
 *
 * Pattern identique à WelcomeLoginForm :
 * - Action externalisée
 * - useEffect surveille success → appelle login()
 * - Navigation gérée automatiquement par PublicRoute
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../providers/AuthProvider';
import { twoFactorService } from '../services/twoFactorService';
import { authApi } from '../api/auth-api';
import { FrontendError, ERROR_CODES, HTTP_STATUS } from '@transcendence/core';
import Background from '../components/atoms/Background';
import { NavBar } from '../components/molecules/NavBar';
import i18next from 'i18next';

const colors = {
  start: '#00ff9f',
  end: '#0088ff',
};

interface TwoFactorState {
  code: string;
  error: string | null;
  isSubmitting: boolean;
  success: boolean;
  username: string | null;
}

export const TwoFactorPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [state, setState] = useState<TwoFactorState>({
    code: '',
    error: null,
    isSubmitting: false,
    success: false,
    username: null,
  });

  // Vérification de la présence d'un contexte 2FA valide
  useEffect(() => {
    const context = twoFactorService.getPendingContext();

    if (!context) {
      // Pas de contexte valide → redirection vers welcome
      navigate('/welcome', { replace: true });
      return;
    }

    // Contexte valide → on peut afficher la page
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation frontend
    if (state.code.length !== 6 || !/^\d{6}$/.test(state.code)) {
      setState((prev) => ({
        ...prev,
        error: t('2fa.invalid_code_format'),
      }));
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Appel API pour valider le code OTP
      const username = await authApi.verify2FALogin(state.code);

      // Succès : effacer le contexte temporaire
      twoFactorService.clearPendingContext();

      // Marquer comme succès avec le username
      setState((prev) => ({ ...prev, success: true, username, isSubmitting: false }));
    } catch (err: unknown) {
      let errorMessage = i18next.t(`errors.${ERROR_CODES.INTERNAL_ERROR}`);

      if (err instanceof FrontendError) {
        if (err.statusCode === HTTP_STATUS.UNAUTHORIZED) {
          errorMessage = t('2fa.invalid_code');
        } else if (err.statusCode === HTTP_STATUS.BAD_REQUEST) {
          errorMessage = t('2fa.invalid_code_format');
        } else {
          errorMessage = err.message || errorMessage;
        }
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
        code: '', // Reset le code en cas d'erreur
      }));
    }
  };

  const handleCancel = () => {
    // Effacer le contexte temporaire
    twoFactorService.clearPendingContext();
    // Redirection vers welcome
    navigate('/welcome', { replace: true });
  };

  // Effet pour déclencher le login après succès
  useEffect(() => {
    if (state.success && state.username) {
      login({
        username: state.username,
        avatarUrl: null,
      });
      // PublicRoute gère la redirection automatique vers /home
    }
  }, [state.success, state.username, login]);

  const context = twoFactorService.getPendingContext();

  return (
    <div className="w-full h-full relative">
      <Background
        grainIntensity={4}
        baseFrequency={0.28}
        colorStart={colors.start}
        colorEnd={colors.end}
      >
        <NavBar />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,255,159,0.15),0_0_100px_rgba(0,136,255,0.1)] border border-white/40 p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                {t('2fa.title')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('2fa.subtitle')}
                {context?.username && (
                  <span className="block mt-1 font-semibold text-cyan-600">
                    {context.username}
                  </span>
                )}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* OTP Input */}
              <div>
                <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('2fa.code_label')}
                </label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={state.code}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))
                  }
                  disabled={state.isSubmitting}
                  autoFocus
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="000000"
                />
              </div>

              {/* Error Message */}
              {state.error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                  {state.error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={state.isSubmitting}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {t('2fa.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={state.isSubmitting || state.code.length !== 6}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00ff9f] to-[#0088ff] hover:shadow-[0_4px_20px_rgba(0,255,159,0.3)] text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {state.isSubmitting ? t('2fa.verifying') : t('2fa.verify')}
                </button>
              </div>
            </form>

            {/* Info */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>{t('2fa.help_text')}</p>
            </div>
          </div>
        </div>
      </Background>
    </div>
  );
};
