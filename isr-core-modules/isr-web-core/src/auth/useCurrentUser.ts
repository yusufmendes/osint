import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export interface CurrentUser {
  id: string;
  username: string;
  permissions: string[];
}

interface ShellAuthShape {
  user: CurrentUser | null;
  authStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
}

/**
 * Single source of truth for "who is logged in?" in the entire web app.
 * Every domain module reads through this hook - it never reads the auth slice
 * directly. When auth migrates to Keycloak/OIDC the hook stays the same and
 * module code remains untouched (see Roadmap section 12).
 */
export function useCurrentUser() {
  const shell = useSelector((s: RootState) => (s as { shell: ShellAuthShape }).shell);
  return {
    user: shell?.user ?? null,
    isAuthenticated: shell?.authStatus === 'authenticated',
    hasPermission: (p: string) => !!shell?.user?.permissions.includes(p),
    hasAnyPermission: (ps: string[]) => ps.some((p) => !!shell?.user?.permissions.includes(p)),
    hasAllPermissions: (ps: string[]) => ps.every((p) => !!shell?.user?.permissions.includes(p)),
  };
}
