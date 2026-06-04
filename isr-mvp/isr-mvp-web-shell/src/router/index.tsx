import { Suspense } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  redirect,
} from '@tanstack/react-router';
import { Box, CircularProgress } from '@mui/material';
import { RootLayout } from '../layout/RootLayout';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import LoginPage from '../auth/LoginPage';
import { allModules } from './manifest';
import { store } from '../store';

const PageFallback = () => (
  <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
    <CircularProgress />
  </Box>
);

const rootRoute = createRootRoute({ component: RootLayout });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <LoginPage />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const s = store.getState();
    if (s.shell.authStatus !== 'authenticated') {
      throw redirect({ to: '/login' });
    }
  },
  component: () => {
    const s = store.getState();
    const perms = new Set(s.shell.user?.permissions ?? []);

    const visibleRibbonItems = allModules
      .flatMap((m) => m.ribbon)
      .filter((item) => item.permissions.every((p) => perms.has(p)))
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'tr'));

    const defaultItem = visibleRibbonItems.find((item) => item.isDefault) ?? visibleRibbonItems[0];
    if (defaultItem) {
      return <Navigate to={defaultItem.path} replace />;
    }
    return <Navigate to="/login" replace />;
  },
});

const moduleRoutes = allModules.flatMap((m) =>
  m.routes.map((r) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: r.path,
      component: () => (
        <ProtectedRoute permissions={r.permissions}>
          <Suspense fallback={<PageFallback />}>{r.element}</Suspense>
        </ProtectedRoute>
      ),
    }),
  ),
);

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$catch',
  component: () => <Navigate to="/" replace />,
});

const routeTree = rootRoute.addChildren([loginRoute, indexRoute, ...moduleRoutes, notFoundRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
