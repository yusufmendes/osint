import { store } from '../store';
import { shellActions } from '../store/shellSlice';
import { shellConfig } from '../config';
import { authApi } from './authApi';

/**
 * On a fresh page load:
 *   1) Try to read the JWT from localStorage.
 *   2) Probe /me - if it succeeds, dispatch authSuccess.
 *   3) Otherwise clear the bad token.
 *
 * The router only renders application routes after this resolves so we do not
 * flash protected routes for a split second.
 */
export async function resumeAuth(): Promise<void> {
  let token: string | null;
  try {
    token = localStorage.getItem(shellConfig.jwtStorageKey);
  } catch {
    token = null;
  }
  if (!token) {
    store.dispatch(shellActions.authFail());
    return;
  }
  store.dispatch(shellActions.authLoading());
  try {
    const me = await authApi.me(token);
    store.dispatch(
      shellActions.authSuccess({
        token,
        user: { id: me.userId, username: me.username, permissions: me.permissions },
      }),
    );
  } catch {
    try {
      localStorage.removeItem(shellConfig.jwtStorageKey);
    } catch {
      /* ignore */
    }
    store.dispatch(shellActions.authFail());
  }
}
