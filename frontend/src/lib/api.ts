const API_BASE = '/api';

const ACCESS_KEY = 'pickclash.accessToken';
const REFRESH_KEY = 'pickclash.refreshToken';

export type Tokens = { accessToken: string; refreshToken: string };

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(tokens: Tokens) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = 'error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function rawRequest(path: string, init: RequestInit, accessToken?: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return false;

  const res = await rawRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    tokenStore.clear();
    return false;
  }
  tokenStore.set((await res.json()) as Tokens);
  return true;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await rawRequest(path, init, tokenStore.access);

  if (res.status === 401 && tokenStore.refresh) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await rawRequest(path, init, tokenStore.access);
    }
  }

  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, payload?.error ?? 'Request failed', payload?.code ?? 'error');
  }
  return payload as T;
}
