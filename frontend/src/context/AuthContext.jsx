import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import { clearToken, getToken, registerUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
      toast.error('Sesi berakhir, silakan login kembali.');
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }

      try {
        const profile = await authService.getUser();
        setUser(profile);
      } catch (error) {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user && getToken()),
      async login(credentials) {
        const data = await authService.login(credentials);
        const profile = data?.user || (await authService.getUser());
        setUser(profile);
        return profile;
      },
      async logout() {
        await authService.logout();
        setUser(null);
        navigate('/login', { replace: true });
      },
      refreshUser: async () => {
        const profile = await authService.getUser();
        setUser(profile);
        return profile;
      },
    }),
    [user, loading, navigate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
