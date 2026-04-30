/**
 * Vite dev server'ı programatik ayağa kaldırır, chokidar `change` olayını dinler,
 * sibling repo içindeki SearchPage.tsx'e geçici bir satır yazar ve olayın
 * gelip gelmediğini doğrular. Tarayıcı/HMR istemcisi gerekmez.
 *
 *   node scripts/verify-sibling-watcher.mjs
 */
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shellRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(shellRoot, '../..');
const searchPage = path.join(
  workspaceRoot,
  'osint-search-modules',
  'osint-search-web',
  'src',
  'pages',
  'SearchPage.tsx',
);

if (!fs.existsSync(searchPage)) {
  console.error('FAIL: SearchPage.tsx bulunamadi:', searchPage);
  process.exit(1);
}

const server = await createServer({
  root: shellRoot,
  configFile: path.join(shellRoot, 'vite.config.ts'),
  logLevel: 'warn',
});

await server.listen();

/** @type {string[]} */
const changes = [];
const onChange = (file) => {
  const norm = file.replaceAll('\\', '/');
  changes.push(norm);
  console.log('[watcher change]', file);
};
server.watcher.on('change', onChange);
server.watcher.on('add', (f) => console.log('[watcher add]', f));
server.watcher.on('unlink', (f) => console.log('[watcher unlink]', f));

const orig = fs.readFileSync(searchPage, 'utf8');
const marker = '\n// __HMR_WATCHER_PROBE__\n';
const touched = orig.includes('__HMR_WATCHER_PROBE__') ? orig : orig + marker;

console.log('Writing probe to:', searchPage);
fs.writeFileSync(searchPage, touched, 'utf8');

await new Promise((r) => setTimeout(r, 4000));

fs.writeFileSync(searchPage, orig.replace(marker, ''), 'utf8');
await new Promise((r) => setTimeout(r, 1500));

server.watcher.off('change', onChange);
await server.close();

const hit = changes.some((c) => c.replaceAll('\\', '/').includes('SearchPage.tsx'));
if (!hit) {
  console.error('FAIL: SearchPage.tsx icin watcher change alinmadi. Gelen olaylar:', changes.length);
  if (changes.length) console.error(changes.slice(-20).join('\n'));
  process.exit(1);
}

console.log('OK: sibling SearchPage.tsx watcher change alindi.');
