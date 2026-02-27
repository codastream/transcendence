import { ProfileSimpleDTO, FrontendError, HTTP_STATUS } from '@transcendence/core';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, AuthProviderProps } from '../types/react-types';
import { TwoFactorPendingContext } from '../types/twoFactor.types';
import { authApi } from '../api/auth-api';
import { profileApi } from '../api/profile-api';
import api from '../api/api-client';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<ProfileSimpleDTO | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [pending2FA, setPending2FAState] = useState<TwoFactorPendingContext | null>(null);
  const isLoggingOut = useRef(false);
  const navigate = useNavigate();

  // ── Intercepteur global 401 ──────────────────────────────────────────────
  // Token expiré / manquant → clear session. Le PrivateRoute redirige.
  // 403 Forbidden intentionnellement ignoré : ne pas déconnecter l'user.
  // Les erreurs 2FA (400) sont gérées localement dans TwoFactorPage.
  useEffect(() => {
    const interceptor = api.interceptors.response.use(undefined, (error: unknown) => {
      if (
        error instanceof FrontendError &&
        error.statusCode === HTTP_STATUS.UNAUTHORIZED &&
        !isLoggingOut.current
      ) {
        setUser(null);
        setPending2FAState(null);
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  // ── Vérification de session au boot ─────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await authApi.me();
        try {
          const profile = await profileApi.getProfileByUsername(me.username);
          setUser(profile);
        } catch {
          setUser({ username: me.username, avatarUrl: null });
        }
      } catch {
        setUser(null);
      } finally {
        setIsAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  // ── Navigation automatique vers /2fa quand pending2FA est positionné ────
  useEffect(() => {
    if (pending2FA && Date.now() <= pending2FA.expiresAt) {
      navigate('/2fa', { replace: true });
    }
  }, [pending2FA, navigate]);

  const [hasSeenAnim, setHasSeenAnim] = useState<boolean>(() => {
    const storedHasSeenAnim = localStorage.getItem('hasSeenAnim');
    return storedHasSeenAnim ? JSON.parse(storedHasSeenAnim) : false;
  });

  const login = useCallback((userData: ProfileSimpleDTO) => {
    setUser(userData);
    if (!userData.avatarUrl && userData.username) {
      profileApi
        .getProfileByUsername(userData.username)
        .then((profile) => {
          setUser((prev) => (prev?.username === profile.username ? { ...prev, ...profile } : prev));
        })
        .catch(() => {
          /* profil partiel acceptable */
        });
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  // isLoggingOut ref empêche l'intercepteur 401 de réagir pendant le logout
  const logout = useCallback(async () => {
    isLoggingOut.current = true;
    try {
      await authApi.logout();
    } catch {
      // Cookie potentiellement déjà expiré — on nettoie quand même
    } finally {
      setUser(null);
      setPending2FAState(null);
      isLoggingOut.current = false;
    }
  }, []);

  const updateUser = useCallback((newUser: ProfileSimpleDTO) => {
    setUser((prev: ProfileSimpleDTO | null) => (prev ? { ...prev, ...newUser } : prev));
  }, []);

  const markAnimAsSeen = useCallback(() => {
    setHasSeenAnim(true);
    localStorage.setItem('hasSeenAnim', JSON.stringify(true));
  }, []);

  // ── API 2FA ──────────────────────────────────────────────────────────────
  const setPending2FA = useCallback((ctx: TwoFactorPendingContext) => {
    setPending2FAState(ctx);
  }, []);

  const clearPending2FA = useCallback(() => {
    setPending2FAState(null);
  }, []);

  // hasPending2FA : vrai uniquement si le contexte existe ET n'est pas expiré
  const hasPending2FA = useMemo(() => {
    if (!pending2FA) return false;
    return Date.now() <= pending2FA.expiresAt;
  }, [pending2FA]);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthChecked,
      isLoggedIn: isAuthChecked && user !== null,
      login,
      logout,
      updateUser,
      hasSeenAnim,
      markAnimAsSeen,
      pending2FA,
      hasPending2FA,
      setPending2FA,
      clearPending2FA,
    }),
    [
      user,
      isAuthChecked,
      hasSeenAnim,
      login,
      logout,
      updateUser,
      markAnimAsSeen,
      pending2FA,
      hasPending2FA,
      setPending2FA,
      clearPending2FA,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
