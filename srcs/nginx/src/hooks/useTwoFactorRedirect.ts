/**
 * Hook personnalisé pour gérer la redirection automatique vers /2fa
 *
 * Surveille le contexte 2FA dans AuthProvider et redirige automatiquement
 * vers la page de validation OTP quand nécessaire.
 *
 * Usage :
 *   const auth = useAuth();
 *   useTwoFactorRedirect();
 *
 * Avantages :
 * - Logique de navigation centralisée
 * - Évite la duplication dans LoginForm et OAuthCallback
 * - Utilise replace: true pour nettoyer l'historique
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { twoFactorService } from '../services/twoFactorService';

export const useTwoFactorRedirect = () => {
  const { twoFactorContext, clearTwoFactor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (twoFactorContext) {
      // Stocker le contexte dans le service temporaire
      twoFactorService.setPendingContext(
        {
          username: twoFactorContext.username,
          provider: twoFactorContext.provider,
        },
        twoFactorContext.expiresIn,
      );

      // Effacer le contexte du provider (déjà stocké dans le service)
      clearTwoFactor();

      // Redirection vers /2fa (replace pour éviter retour arrière)
      navigate('/2fa', { replace: true });
    }
  }, [twoFactorContext, clearTwoFactor, navigate]);
};
