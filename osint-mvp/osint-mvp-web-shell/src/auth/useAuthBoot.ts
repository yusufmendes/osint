import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { shellActions } from '../store/shellSlice';
import { fetchMe } from './authApi';
import { persistToken, readPersistedToken } from './authInterceptor';

/**
 * On page reload, reads JWT from localStorage and validates it via `/me`,
 * then moves the shell to `authenticated`.
 */
export function useAuthBoot() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    const token = readPersistedToken();
    if (!token) {
      dispatch(shellActions.authFail());
      return;
    }
    dispatch(shellActions.authLoading());
    (async () => {
      try {
        const me = await fetchMe(token);
        dispatch(shellActions.authSuccess({
          token,
          user: { id: me.userId, username: me.username, permissions: me.permissions },
        }));
      } catch {
        persistToken(null);
        dispatch(shellActions.authFail());
      }
    })();
  }, [dispatch]);
}
