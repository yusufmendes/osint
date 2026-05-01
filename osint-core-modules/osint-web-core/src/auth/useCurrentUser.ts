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
 * Reads `user` and `authStatus` from the shell `shellSlice`. Modules use this
 * hook for permission checks without knowing where auth state comes from
 * (module code stays unchanged when moving to Keycloak/OIDC).
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
