import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** `osint-mvp/osint-mvp-web-shell` -> workspace root (`d:\osint\`) */
const workspaceRoot = path.resolve(__dirname, '../..');

/**
 * pnpm `file:` packages live under `node_modules` as junctions/symlinks.
 * On Windows Vite's default watcher sometimes misses source changes in those targets;
 * explicitly adding sibling `src/` directories to the watcher makes HMR more reliable.
 */
function watchSiblingWorkspaceSrc(): Plugin {
  const siblingSrcDirs = [
    'osint-core-modules/osint-web-core/src',
    'osint-intelligence-modules/osint-intelligence-web/src',
    'osint-gis-modules/osint-gis-web/src',
    'osint-video-modules/osint-video-web/src',
    'osint-search-modules/osint-search-web/src',
  ];
  return {
    name: 'watch-sibling-workspace-src',
    configureServer(server) {
      for (const rel of siblingSrcDirs) {
        const abs = path.resolve(workspaceRoot, rel);
        if (fs.existsSync(abs)) {
          server.watcher.add(abs);
        }
      }
    },
  };
}

/** Direct source aliases instead of pnpm `file:` junction — keeps HMR module URLs consistent */
const siblingSourceAliases: Record<string, string> = {
  'osint-web-core': path.join(workspaceRoot, 'osint-core-modules/osint-web-core/src/index.ts'),
  'osint-intelligence-web': path.join(
    workspaceRoot,
    'osint-intelligence-modules/osint-intelligence-web/src/index.tsx',
  ),
  'osint-gis-web': path.join(workspaceRoot, 'osint-gis-modules/osint-gis-web/src/index.tsx'),
  'osint-video-web': path.join(workspaceRoot, 'osint-video-modules/osint-video-web/src/index.tsx'),
  'osint-search-web': path.join(workspaceRoot, 'osint-search-modules/osint-search-web/src/index.tsx'),
};

const useSiblingSourceAliases = process.env.VITEST !== 'true';

export default defineConfig({
  plugins: [react(), watchSiblingWorkspaceSrc()],
  resolve: {
    // Vitest: aliases off — otherwise sibling pulls its own React from node_modules and clashes with shell Provider.
    // pnpm dev / build: aliases on — keeps module paths aligned with workspace @fs for HMR.
    ...(useSiblingSourceAliases
      ? {
          alias: Object.entries(siblingSourceAliases).map(([find, replacement]) => ({
            find,
            replacement,
          })),
        }
      : {}),
  },
  server: {
    // On Windows `localhost` may bind only to ::1; connections to 127.0.0.1 are refused.
    host: '127.0.0.1',
    port: 5173,
    fs: {
      // Absolute path: avoids permission edge cases with relative `../..` on Windows
      allow: [workspaceRoot],
    },
    watch: {
      followSymlinks: true,
      // Windows + pnpm junction: native watch sometimes misses changes; light polling stabilizes HMR.
      // Disable: VITE_WATCH_POLLING=0
      // Force on other OS: VITE_WATCH_POLLING=1
      ...((process.platform === 'win32' && process.env.VITE_WATCH_POLLING !== '0') ||
      process.env.VITE_WATCH_POLLING === '1'
        ? { usePolling: true, interval: 500 }
        : {}),
    },
  },
  preview: { port: 4173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false,
  },
});
