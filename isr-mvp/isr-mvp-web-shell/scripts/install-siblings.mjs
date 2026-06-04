// install-siblings.mjs
//
// In the multi-repo layout, each ISR repo is its own pnpm project. The shell
// links its sibling modules via `file:../../isr-*-modules/...` paths, but
// pnpm only fetches the *target* folder - it does NOT install the target's
// own dependencies. So before `pnpm install` in the shell, every sibling
// module must already have its own `node_modules/`.
//
// This script walks the dependency graph (core -> intelligence -> the rest)
// and runs `pnpm install --prefer-offline` in each sibling's working dir.
// It is idempotent; running it twice in a row is a no-op.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const shellRoot = path.resolve(here, '..');
const workspaceRoot = path.resolve(shellRoot, '../..');

// Order matters: leaves first, then modules that depend on them.
const siblings = [
  'isr-core-modules/isr-web-core',
  'isr-intelligence-modules/isr-intelligence-web',
  'isr-gis-modules/isr-gis-web',
  'isr-video-modules/isr-video-web',
  'isr-search-modules/isr-search-web',
];

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

let failures = 0;
for (const rel of siblings) {
  const dir = path.join(workspaceRoot, rel);
  if (!fs.existsSync(dir)) {
    console.warn(`[skip] sibling not present: ${dir}`);
    continue;
  }
  console.log(`\n[install] ${dir}`);
  const result = spawnSync(pnpmCmd, ['install', '--prefer-offline'], {
    cwd: dir,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`[fail] pnpm install in ${rel} -> exit ${result.status}`);
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`\n${failures} sibling install(s) failed.`);
  process.exit(1);
}
console.log('\nAll siblings ready. You can now run `pnpm install` here.');
