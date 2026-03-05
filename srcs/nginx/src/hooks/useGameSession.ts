// ============================================================================
// useGameSession — Création, suppression et cycle de vie d'une session de jeu
//
// Responsabilité : tout ce qui touche au sessionId (création HTTP, suppression,
// navigation de sortie). La logique WebSocket et le lobby sont gérés ailleurs.
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api-client';
import { createAiSession, joinAiToSession } from '../api/game-api';
import type { GameMode } from '../types/game.types';

interface UseGameSessionOptions {
  gameMode: GameMode;
  initialSessionId?: string | null;
  /** Appelé juste avant chaque création de session (reset WS, état, lobby) */
  onBeforeCreate?: () => void;
}

export interface UseGameSessionReturn {
  sessionId: string | null;
  /** Ref synchronisée — lisible hors rendu (closures WS) */
  sessionIdRef: React.MutableRefObject<string | null>;
  isLoading: boolean;
  /** (Re)crée une session. Appelle onBeforeCreate en premier. */
  createSession: () => Promise<void>;
  /** Supprime la session côté serveur puis navigue vers /home */
  exitSession: () => Promise<void>;
}

export const useGameSession = ({
  gameMode,
  initialSessionId = null,
  onBeforeCreate,
}: UseGameSessionOptions): UseGameSessionReturn => {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const sessionIdRef = useRef<string | null>(initialSessionId);
  const [isLoading, setIsLoading] = useState(false);

  const { tournamentId } = useParams<{ tournamentId?: string }>();
  const navigate = useNavigate();

  const createSession = useCallback(async () => {
    onBeforeCreate?.();
    setIsLoading(true);

    try {
      if (gameMode === 'ai') {
        // L'IA doit rejoindre AVANT que la connexion WS ne s'ouvre,
        const { sessionId: newId } = await createAiSession();
        await joinAiToSession(newId);
        setSessionId(newId);
        sessionIdRef.current = newId;
      } else {
        interface CreateSessionResponse {
          status: 'success' | 'failure';
          message: string;
          sessionId?: string;
          wsUrl?: string;
        }
        const body = {
          gameMode,
          ...(tournamentId ? { tournamentId: Number(tournamentId) } : {}),
        };
        const res = await api.post<CreateSessionResponse>('/game/create-session', body);
        if (res.data.sessionId) {
          setSessionId(res.data.sessionId);
          sessionIdRef.current = res.data.sessionId;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [gameMode, tournamentId, onBeforeCreate]);

  const exitSession = useCallback(async () => {
    const id = sessionIdRef.current;
    if (id) {
      await fetch(`/api/game/del/${id}`, { method: 'DELETE', credentials: 'include' });
    }
    navigate('/home');
  }, [navigate]);

  // Auto-création au montage pour les modes qui ne passent pas par une liste
  useEffect(() => {
    if (
      (gameMode === 'local' || gameMode === 'ai' || gameMode === 'tournament') &&
      !sessionIdRef.current
    ) {
      createSession();
    }
    // effet de montage uniquement — createSession est stable
  }, []);

  return { sessionId, sessionIdRef, isLoading, createSession, exitSession };
};
