import { Navigate } from '@tanstack/react-router';
import { useCurrentUser } from 'osint-web-core';
import { ForbiddenPage } from './ForbiddenPage';
import type { ReactNode } from 'react';

interface Props {
  permissions: string[];
  children: ReactNode;
}

export function ProtectedRoute({ permissions, children }: Props) {
  const { isAuthenticated, hasPermission } = useCurrentUser();

  if (!isAuthenticated) {
    // replace: true → login redirect history'yi sismez
    return <Navigate to="/login" replace />;
  }

  const missing = permissions.filter((p) => !hasPermission(p));
  if (missing.length > 0) return <ForbiddenPage missing={missing} />;

  return <>{children}</>;
}
