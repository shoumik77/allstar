import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, tokenStore } from './api';
import type { AuthResponse, MeResponse } from './types';

type AuthContextValue = {
  me: MeResponse | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hasToken = Boolean(tokenStore.access);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api<MeResponse>('/me'),
    enabled: hasToken,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      api<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(vars) }),
    onSuccess: (data) => {
      tokenStore.set(data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (vars: { email: string; username: string; password: string }) =>
      api<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(vars) }),
    onSuccess: (data) => {
      tokenStore.set(data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation],
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      await registerMutation.mutateAsync({ email, username, password });
    },
    [registerMutation],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
    window.location.href = '/login';
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      me: meQuery.data,
      isLoading: hasToken && meQuery.isLoading,
      isAuthenticated: Boolean(meQuery.data),
      login,
      register,
      logout,
    }),
    [meQuery.data, meQuery.isLoading, hasToken, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
