import type { ReactNode } from 'react';
import { Navigate } from '@tanstack/react-router';
import { useCurrentUser } from 'isr-web-core';
import { ForbiddenPage } from './ForbiddenPage';

interface Props {
  permissions: string[];
  children: ReactNode;
}

export function ProtectedRoute({ permissions, children }: Props) {
  const { isAuthenticated, hasPermission } = useCurrentUser();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const missing = permissions.filter((p) => !hasPermission(p));
  if (missing.length > 0) return <ForbiddenPage missing={missing} />;

  return <>{children}</>;
}
