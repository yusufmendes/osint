// Global fetch interceptor:
//   - injects Authorization: Bearer <JWT> on every request
//   - on 401, clears the auth state and redirects to /login
//
// Module code never imports tokens or calls authApi directly.

import { store } from '../store';
import { shellActions } from '../store/shellSlice';
import { shellConfig } from '../config';

let installed = false;

export function installAuthInterceptor() {
  if (installed) return;
  installed = true;

  const originalFetch: typeof fetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = store.getState().shell.token;
    const headers = new Headers(init?.headers ?? {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const res = await originalFetch(input, { ...init, headers });
    if (res.status === 401 && token) {
      try {
        localStorage.removeItem(shellConfig.jwtStorageKey);
      } catch {
        // ignore - storage may be blocked in private mode
      }
      store.dispatch(shellActions.logout());
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return res;
  };
}
