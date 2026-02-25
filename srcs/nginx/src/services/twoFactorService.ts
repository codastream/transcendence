/**
 * Service de gestion du contexte 2FA temporaire
 *
 * Gère le stockage en mémoire (uniquement) du contexte 2FA pendant le flux
 * d'authentification. Ce service ne stocke JAMAIS d'informations sensibles
 * en localStorage ou sessionStorage.
 *
 * Pattern : Singleton avec state en mémoire
 */

import { TwoFactorPendingContext } from '../types/twoFactor.types';

class TwoFactorService {
  private pendingContext: TwoFactorPendingContext | null = null;

  /**
   * Stocke le contexte 2FA temporaire après que le backend ait requis 2FA
   */
  setPendingContext(context: Omit<TwoFactorPendingContext, 'expiresAt'>, expiresIn: number) {
    this.pendingContext = {
      ...context,
      expiresAt: Date.now() + expiresIn * 1000,
    };
  }

  /**
   * Récupère le contexte 2FA temporaire
   * Retourne null si expiré ou inexistant
   */
  getPendingContext(): TwoFactorPendingContext | null {
    if (!this.pendingContext) {
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() > this.pendingContext.expiresAt) {
      this.clearPendingContext();
      return null;
    }

    return this.pendingContext;
  }

  /**
   * Efface le contexte temporaire
   * À appeler après validation réussie ou abandon
   */
  clearPendingContext() {
    this.pendingContext = null;
  }

  /**
   * Vérifie si un contexte 2FA valide existe
   */
  hasPendingContext(): boolean {
    return this.getPendingContext() !== null;
  }
}

// Export singleton
export const twoFactorService = new TwoFactorService();
