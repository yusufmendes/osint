import { useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { AppDispatch, RootState } from '../store';
import { shellActions } from '../store/shellSlice';
import { login, fetchMe } from './authApi';
import { persistToken } from './authInterceptor';
import { shellConfig } from '../config';

export function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const authStatus = useSelector((s: RootState) => s.shell.authStatus);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    dispatch(shellActions.authLoading());
    try {
      const { accessToken } = await login(username, password);
      const me = await fetchMe(accessToken);
      persistToken(accessToken);
      dispatch(shellActions.authSuccess({
        token: accessToken,
        user: { id: me.userId, username: me.username, permissions: me.permissions },
      }));
      navigate({ to: '/' });
    } catch (err) {
      dispatch(shellActions.authFail());
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const isLoading = authStatus === 'loading';

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ width: 380 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>{shellConfig.appTitle}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Login (MVP — dummy users)
          </Typography>
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                fullWidth
                required
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                fullWidth
                required
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" disabled={isLoading} fullWidth>
                {isLoading ? <CircularProgress size={24} /> : 'Sign in'}
              </Button>
              <Typography variant="caption" color="text.secondary">
                admin/admin123 — all modules; viewer/viewer123 — restricted
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
