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
import { AuthContextType, AuthProviderProps } from '../types/react-types';
import { authApi } from '../api/auth-api';
import { profileApi } from '../api/profile-api';
import api from '../api/api-client';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<ProfileSimpleDTO | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const isLoggingOut = useRef(false);

  /**
   * Intercepteur 401
   * Efface l'état utilisateur quand le serveur renvoie Unauthorized
   * (token expiré, cookie invalide, etc.).
   * Utilise FrontendError (émis par l'intercepteur de api-client.ts)
   */
  useEffect(() => {
    const interceptor = api.interceptors.response.use(undefined, (error: unknown) => {
      if (
        error instanceof FrontendError &&
        error.statusCode === HTTP_STATUS.UNAUTHORIZED &&
        !isLoggingOut.current
      ) {
        setUser(null);
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  /**
   * Récupère le profil complet (username + avatarUrl) depuis le service users
   */
  const fetchFullProfile = useCallback(async (username: string): Promise<ProfileSimpleDTO> => {
    try {
      return await profileApi.getProfileByUsername(username);
    } catch {
      return { username, avatarUrl: null };
    }
  }, []);

  /**
   * Vérification de session au démarrage de l'app + refresh
   * Si session existe, récupère le profil de l'utilisateur et le stocke
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await authApi.me();
        const profile = await fetchFullProfile(me.username);
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setIsAuthChecked(true);
      }
    };
    checkAuth();
  }, [fetchFullProfile]);

  const [hasSeenAnim, setHasSeenAnim] = useState<boolean>(() => {
    const storedHasSeenAnim = localStorage.getItem('hasSeenAnim');
    return storedHasSeenAnim ? JSON.parse(storedHasSeenAnim) : false;
  });

  const login = useCallback(
    (userData: ProfileSimpleDTO) => {
      setUser(userData);
      if (!userData.avatarUrl && userData.username) {
        fetchFullProfile(userData.username).then((profile) => {
          setUser((prev) => (prev?.username === profile.username ? { ...prev, ...profile } : prev));
        });
      }
    },
    [fetchFullProfile],
  );

  /**
   * Logout : appelle le backend pour invalider le cookie httpOnly,
   * puis efface l'état local.
   * Le ref isLoggingOut empêche intercepteur 401
   */
  const logout = useCallback(async () => {
    isLoggingOut.current = true;
    try {
      await authApi.logout();
    } catch {
      // Cookie potentiellement déjà expiré — on nettoie quand même
    } finally {
      setUser(null);
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

  // memoize to avoid re-renders
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
    }),
    [user, hasSeenAnim, isAuthChecked, login, logout, updateUser, markAnimAsSeen],
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
