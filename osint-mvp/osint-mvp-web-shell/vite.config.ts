import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** `osint-mvp/osint-mvp-web-shell` -> workspace kökü (`d:\osint\`) */
const workspaceRoot = path.resolve(__dirname, '../..');

/**
 * pnpm `file:` paketleri `node_modules` altında junction/symlink olarak durur.
 * Windows'ta Vite'ın varsayılan watcher'ı bazen bu hedef klasörlerdeki
 * kaynak değişikliklerini yakalamaz; sibling `src/` dizinlerini açıkça
 * watcher'a eklemek HMR'ı güvenilir hale getirir.
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

/** pnpm `file:` junction yerine dogrudan kaynak girisi — HMR modul URL ile izlenen yol tutarli kalir */
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
    // Vitest: alias kapali — yoksa sibling kendi node_modules React'i ile shell Provider cakisir.
    // pnpm dev / build: alias acik — HMR icin modul yolu workspace @fs ile tutarli.
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
    // Windows'ta `localhost` bazen yalnizca ::1'e bind eder; 127.0.0.1 ile baglanti reddedilir.
    host: '127.0.0.1',
    port: 5173,
    fs: {
      // Mutlak yol: Windows'ta göreli `../..` edge-case'lerinde izin sorunlarını önler
      allow: [workspaceRoot],
    },
    watch: {
      followSymlinks: true,
      // Windows + pnpm junction: native watch bazen kaçırır; hafif polling HMR'ı stabilize eder.
      // Kapatmak için: VITE_WATCH_POLLING=0
      // Diğer OS'ta zorla açmak için: VITE_WATCH_POLLING=1
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
