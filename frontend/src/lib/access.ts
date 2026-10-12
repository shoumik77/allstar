import { api } from './api';

const GRANTED_KEY = 'allstar.accessGranted';

export const accessStore = {
  get granted() {
    return localStorage.getItem(GRANTED_KEY) === '1';
  },
  grant() {
    localStorage.setItem(GRANTED_KEY, '1');
  },
  revoke() {
    localStorage.removeItem(GRANTED_KEY);
  },
};

// TODO(backend): implement `POST /access/verify { code } -> 200 { ok: true } | 401 { error }`.
// Until then this request 404s and the gate stays locked; for local dev run
// `localStorage.setItem('allstar.accessGranted', '1')` in the console.
export async function verifyAccessCode(code: string): Promise<void> {
  await api<{ ok: true }>('/access/verify', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  });
  accessStore.grant();
}
