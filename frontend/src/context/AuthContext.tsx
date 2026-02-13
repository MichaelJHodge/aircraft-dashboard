import React, { useEffect, useMemo, useState } from 'react';
import { AuthUser, LoginResponse } from '../types';
import { api } from '../services/api';
import { httpClient } from '../services/httpClient';
import { AuthContext } from './AuthContextBase';

const TOKEN_STORAGE_KEY = 'aircraft_dashboard_token';
const USER_STORAGE_KEY = 'aircraft_dashboard_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser) as AuthUser);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    httpClient.setTokenGetter(() => token);
  }, [token]);

  const login = async (email: string, password: string): Promise<void> => {
    const result: LoginResponse = await api.auth.login(email, password);
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isReady,
      login,
      logout,
    }),
    [user, token, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
