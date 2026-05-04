import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('travelbridge_user');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => {
    return {
      user,
      loading,
      isAuthenticated: !!user,
      login: (nextUser) => {
        setUser(nextUser);
        try {
          localStorage.setItem('travelbridge_user', JSON.stringify(nextUser));
        } catch {}
      },
      logout: () => {
        setUser(null);
        try {
          localStorage.removeItem('travelbridge_user');
        } catch {}
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      user: null,
      loading: true,
      isAuthenticated: false,
      login: () => {},
      logout: () => {},
    };
  }

  return context;
}