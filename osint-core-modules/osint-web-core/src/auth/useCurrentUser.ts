import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export interface CurrentUser {
  id: string;
  username: string;
  permissions: string[];
}

interface ShellAuthSlice {
  dummy: string;
  user: CurrentUser | null;
  authStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  token: string | null;
}

/**
 * Shell `shellSlice`'ından `user` ve `authStatus`'ı okur. Modüller bu
 * hook üzerinden permission kontrolü yapar; auth state'inin nereden
 * geldiğini bilmez (Keycloak/OIDC geçişinde modül kodu değişmez).
 */
export function useCurrentUser() {
  const state = useSelector((s: RootState) => {
    const root = s as unknown as { shell?: ShellAuthSlice };
    return root.shell;
  });

  const user = state?.user ?? null;
  const isAuthenticated = state?.authStatus === 'authenticated';

  return {
    user,
    isAuthenticated,
    hasPermission: (p: string) => !!user?.permissions.includes(p),
  };
}
