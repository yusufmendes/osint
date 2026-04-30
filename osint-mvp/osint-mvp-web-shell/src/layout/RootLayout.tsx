import { Outlet, Link, useLocation, useRouter } from '@tanstack/react-router';
import { useDispatch, useSelector } from 'react-redux';
import { useCurrentUser } from 'osint-web-core';
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { Suspense, useEffect } from 'react';
import { allModules } from '../router/modules';
import type { AppDispatch, RootState } from '../store';
import { shellActions } from '../store/shellSlice';
import { persistToken } from '../auth/authInterceptor';
import { LoginPage } from '../auth/LoginPage';
import { useAuthBoot } from '../auth/useAuthBoot';
import { shellConfig } from '../config';

const DRAWER_WIDTH = 240;

export function RootLayout() {
  useAuthBoot();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const location = useLocation();
  const { user, isAuthenticated, hasPermission } = useCurrentUser();
  const authStatus = useSelector((s: RootState) => s.shell.authStatus);

  useEffect(() => {
    dispatch(shellActions.setActiveMenu(location.pathname));
  }, [location.pathname, dispatch]);

  if (location.pathname === '/login' || (!isAuthenticated && authStatus !== 'loading')) {
    if (location.pathname !== '/login') {
      router.navigate({ to: '/login' });
    }
    return <LoginPage />;
  }

  if (authStatus === 'loading' || authStatus === 'idle') {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Oturum yükleniyor...</Typography>
      </Box>
    );
  }

  const menuItems = allModules.flatMap((m) => m.menu).filter((it) =>
    it.permissions.every((p) => hasPermission(p)),
  );

  function onLogout() {
    persistToken(null);
    dispatch(shellActions.logout());
    router.navigate({ to: '/login' });
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6">{shellConfig.appTitle}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user?.username}</Typography>
            <Button color="inherit" onClick={onLogout}>Çıkış</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((it) => (
              <ListItem key={it.path} disablePadding>
                <ListItemButton component={Link} to={it.path} selected={location.pathname === it.path}>
                  <ListItemText primary={it.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Suspense fallback={<Typography>Sayfa yükleniyor...</Typography>}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}
