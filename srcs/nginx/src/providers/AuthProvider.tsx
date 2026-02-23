import { ProfileSimpleDTO } from '@transcendence/core';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContextType, AuthProviderProps } from '../types/react-types';
import { useNavigate } from 'react-router-dom';

// from https://dev.to/joodi/useauth-hook-in-react-1bp3
import { authApi } from '../api/auth-api';
import { profileApi } from '../api/profile-api';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<ProfileSimpleDTO | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  /**
   * Vérification réelle de session au montage
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await authApi.me();
        const profile = await profileApi.getMe(me.username);
        const userProfile: ProfileSimpleDTO = {
          username: me.username,
          avatarUrl: profile.avatarUrl,
        };
        setUser(userProfile);
      } catch {
        setUser(null);
      } finally {
        setIsAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  const [hasSeenAnim, setHasSeenAnim] = useState<boolean>(() => {
    const storedHasSeenAnim = localStorage.getItem('hasSeenAnim');
    return storedHasSeenAnim ? JSON.parse(storedHasSeenAnim) : false;
  });

  const login = (user: ProfileSimpleDTO) => {
    setUser(user);
  };

  const logout = async () => {
    setUser(null);
    navigate('/');
  };

  const updateUser = (newUser: ProfileSimpleDTO) => {
    setUser((prev) => (prev ? { ...prev, ...newUser } : prev));
  };

  const markAnimAsSeen = () => {
    setHasSeenAnim(true);
    localStorage.setItem('hasSeenAnim', JSON.stringify(true));
  };

  // memoize to avoid re-render
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
    [user, hasSeenAnim, isAuthChecked],
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
