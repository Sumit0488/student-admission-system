import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [ready, setReady] = useState(false); // true once initial auth check is done

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setReady(true);
      return;
    }
    getMe()
      .then(({ data }) => {
        setUser(data.user);
        setTenant(data.tenant);
      })
      .catch(() => {
        // Token invalid / expired — clear it
        localStorage.removeItem('auth_token');
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await apiLogin({ email, password });
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await apiRegister(payload);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setTenant(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenant, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
