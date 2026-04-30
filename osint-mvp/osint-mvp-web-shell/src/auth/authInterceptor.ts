import { store } from '../store';
import { shellActions } from '../store/shellSlice';

export const TOKEN_STORAGE_KEY = 'osint.auth.token';

let installed = false;

/**
 * Tek bir global fetch interceptor: tum API isteklerine Bearer JWT eklenir.
 * 401 donerse token temizlenir ve shell `unauthenticated` durumuna gecer;
 * RootRoute bunu gorup `/login`'e yonlendirir.
 *
 * Modul kodu token bilmek zorunda degil.
 */
export function installAuthInterceptor() {
  if (installed) return;
  installed = true;

  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const token = store.getState().shell.token;
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await original(input, { ...init, headers });

    if (res.status === 401 && token) {
      try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* ignore */ }
      store.dispatch(shellActions.logout());
    }

    return res;
  };
}

export function persistToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage erisilemiyorsa (private mode vs.) sessizce gec
  }
}

export function readPersistedToken(): string | null {
  try { return localStorage.getItem(TOKEN_STORAGE_KEY); }
  catch { return null; }
}
