import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface LobbyScreenProps {
  /** ID de la session actuelle */
  sessionId: string;
  /** Nombre de joueurs actuellement connectés */
  playersCount: number;
  /** Nom d'utilisateur du créateur de la session */
  usernameHost: string | null;
  /** Callback pour annuler la session */
  onCancel: () => void;
}

/**
 * Écran de lobby (attente du 2e joueur en mode remote)
 *
 * Affiche :
 * - Message d'attente
 * - ID de session copiable
 * - Nombre de joueurs connectés
 * - Bouton Annuler
 */
export default function LobbyScreen({
  sessionId,
  usernameHost,
  playersCount,
  onCancel,
}: LobbyScreenProps) {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);

  const handleCopySessionId = useCallback(() => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sessionId]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Container principal */}
      <div className="flex flex-col items-center gap-8 max-w-md w-full px-6">
        {/* Titre et description */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">{t('game.lobby.waiting_title')}</h1>
          <p className="text-lg text-gray-300">{t('game.lobby.waiting_description')}</p>
        </div>

        {/* Affichage du créateur (si disponible) */}
        {usernameHost && (
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">{t('game.lobby.hosted_by')}</p>
            <p className="text-xl font-semibold text-cyan-400">{usernameHost}</p>
          </div>
        )}

        {/* Session ID avec bouton de copie */}
        <div className="w-full">
          <p className="text-sm text-gray-400 mb-2 text-center">{t('game.lobby.session_id')}</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={sessionId}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-800 text-gray-100 text-sm font-mono rounded border border-gray-600"
            />
            <button
              onClick={handleCopySessionId}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium transition-colors"
            >
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
        </div>

        {/* Compteur de joueurs */}
        <div className="text-center">
          <div className="text-5xl font-bold text-cyan-400 mb-1">
            {playersCount}
            <span className="text-3xl text-gray-400">/2</span>
          </div>
          <p className="text-gray-300">
            {playersCount === 1
              ? t('game.lobby.waiting_for_second_player')
              : t('game.lobby.starting_soon')}
          </p>
        </div>

        {/* Spinner/indicator d'attente */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-100" />
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-200" />
        </div>

        {/* Bouton Annuler */}
        <button
          onClick={onCancel}
          className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors mt-4"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
