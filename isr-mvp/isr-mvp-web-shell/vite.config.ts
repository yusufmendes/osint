import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: ['..', '../..'] },
    // pnpm `link:` deps create real symlinks at node_modules/<pkg> pointing at
    // the sibling repos. IntelliJ's "safe write" (temp + rename) breaks
    // hardlink-based setups, but with symlinks Vite always reads the latest
    // file. Polling is kept as a Windows safety-net (chokidar occasionally
    // misses ReadDirectoryChangesW events on linked paths).
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  resolve: {
    // With `link:` siblings, every domain repo has its own node_modules/ where
    // peers like react/redux/mui get installed. Without dedupe, Vite would
    // bundle two instances of React (shell + sibling) which breaks hooks.
    // This forces a single instance for every shared singleton library.
    dedupe: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      '@tanstack/react-query',
      '@tanstack/react-router',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
  // Workspace packages (`isr-*-web`, `isr-web-core`) are consumed from source
  // (their package.json `main` points at `./src/index.tsx`). Vite resolves
  // them via pnpm symlinks; no `optimizeDeps.include` entry is needed - in
  // Vite 7 doing so triggers `Cannot optimize dependency` warnings.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
