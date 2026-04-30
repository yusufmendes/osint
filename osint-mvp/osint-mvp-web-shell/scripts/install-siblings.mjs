#!/usr/bin/env node
/**
 * Sibling repo'lardaki paketleri (osint-web-core, osint-intelligence-web,
 * osint-gis-web, osint-video-web, osint-search-web) bagimlilik grafine gore
 * sirayla `pnpm install` ederek hazirlar.
 *
 * pnpm `file:` protokolu yalnizca sibling klasorunu node_modules'a symlink
 * eder; siblingin kendi node_modules/ icerigi otomatik dolmaz. Shell'in
 * Vite source'tan tukettigi siblinglerin React/MUI/RTK gibi peer/runtime
 * deps'i bu adimla cozulur.
 *
 * Kullanim: pnpm bootstrap:siblings
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// scripts/ -> osint-mvp-web-shell/ -> osint-mvp/ -> workspace root
const workspaceRoot = resolve(here, '..', '..', '..');

const order = [
  'osint-core-modules/osint-web-core',
  'osint-intelligence-modules/osint-intelligence-web',
  'osint-gis-modules/osint-gis-web',
  'osint-video-modules/osint-video-web',
  'osint-search-modules/osint-search-web',
];

let failed = 0;
for (const rel of order) {
  const dir = resolve(workspaceRoot, rel);
  if (!existsSync(dir)) {
    console.warn(`[skip] ${rel} (klasor bulunamadi)`);
    continue;
  }
  console.log(`\n== pnpm install :: ${rel} ==`);
  const res = spawnSync('pnpm', ['install', '--prefer-offline'], {
    cwd: dir,
    stdio: 'inherit',
    shell: true,
  });
  if (res.status !== 0) {
    console.error(`[FAIL] ${rel} pnpm install exit ${res.status}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} sibling install basarisiz oldu.`);
  process.exit(1);
}
console.log('\nSibling repo installation tamamlandi.');
