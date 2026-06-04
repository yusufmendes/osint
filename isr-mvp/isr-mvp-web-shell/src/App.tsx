import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { store } from './store';
import { queryClient } from './queryClient';
import { router } from './router';
import { installAuthInterceptor } from './auth/authInterceptor';
import { resumeAuth } from './auth/bootResume';

const theme = createTheme({ palette: { mode: 'light' } });

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    installAuthInterceptor();
    resumeAuth().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ padding: 32 }}>Booting…</div>
      </ThemeProvider>
    );
  }

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
