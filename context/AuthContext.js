import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuth, getToken, getUser, setAuth } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUserState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTokenState(getToken());
    setUserState(getUser());
    setReady(true);
  }, []);

  const login = (nextToken, nextUser) => {
    setAuth(nextToken, nextUser);
    setTokenState(nextToken);
    setUserState(nextUser);
  };

  const logout = () => {
    clearAuth();
    setTokenState(null);
    setUserState(null);
  };

  const value = useMemo(() => ({
    token,
    user,
    ready,
    isAuthenticated: Boolean(token),
    login,
    logout,
  }), [token, user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}