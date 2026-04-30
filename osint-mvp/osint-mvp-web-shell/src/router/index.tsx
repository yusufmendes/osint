import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
} from '@tanstack/react-router';
import { RootLayout } from '../layout/RootLayout';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { LoginPage } from '../auth/LoginPage';
import { allModules } from './modules';
import { Navigate } from '@tanstack/react-router';

const rootRoute = createRootRoute({ component: RootLayout });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

function FirstAuthorizedRedirect() {
  const target = allModules.flatMap((m) => m.menu)[0]?.path ?? '/login';
  return <Navigate to={target} />;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: FirstAuthorizedRedirect,
});

const moduleRoutes = allModules.flatMap((m) =>
  m.routes.map((r) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: r.path,
      component: () => <ProtectedRoute permissions={r.permissions}>{r.element}</ProtectedRoute>,
    }),
  ),
);

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => { throw redirect({ to: '/' }); },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  ...moduleRoutes,
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
