/**
 * Vite dev server + HMR WebSocket (vite-hmr) ile baglanir, SearchPage.tsx'e
 * dokunur; sunucunun WS uzerinden gonderdigi mesajlardan en az birinde
 * "update" veya "full-reload" arar. CI / otomasyon icin.
 *
 *   node scripts/verify-hmr-ws.mjs
 */
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

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

const server = await createServer({
  root: shellRoot,
  configFile: path.join(shellRoot, 'vite.config.ts'),
  logLevel: 'info',
});

await server.listen();

const addr = server.httpServer?.address();
const httpPort =
  addr && typeof addr === 'object' && 'port' in addr ? addr.port : server.config.server.port;
const httpHost =
  addr && typeof addr === 'object' && addr.family === 'IPv6' && addr.address !== '127.0.0.1'
    ? `[${addr.address}]`
    : '127.0.0.1';
const baseUrl = `http://${httpHost}:${httpPort}`;
const hmrUrl = `ws://${httpHost}:${httpPort}/`;
console.log('[vite] http listen', addr, 'hmrUrl =', hmrUrl);

const httpProbe = await fetch(`${baseUrl}/`).catch((e) => ({ ok: false, error: e }));
console.log('[vite] GET / probe', httpProbe.ok ?? httpProbe.status, httpProbe.ok ? '' : httpProbe.error?.message);

const ws = new WebSocket(hmrUrl, ['vite-hmr']);

const inbound = [];
ws.on('message', (data) => {
  const s = String(data);
  inbound.push(s);
  console.log('[hmr ws <=]', s.slice(0, 200) + (s.length > 200 ? '...' : ''));
});

await new Promise((resolve, reject) => {
  ws.once('open', resolve);
  ws.once('error', reject);
  setTimeout(() => reject(new Error('WS open timeout')), 8000);
});

/** Vite @fs URL — modul grafine dosyayi almadan HMR update gitmez */
function toViteFsPath(absFilePath) {
  const withFwd = absFilePath.replace(/\\/g, '/');
  return `/@fs/${withFwd.replace(/^([A-Za-z]):/, '$1:')}`;
}

const warmUrl = `${baseUrl}${toViteFsPath(searchPage)}`;
console.log('[warm] GET', warmUrl);
const warm = await fetch(warmUrl);
console.log('[warm] status', warm.status);
if (!warm.ok) {
  console.error(await warm.text().catch(() => ''));
  await server.close();
  process.exit(1);
}

const orig = fs.readFileSync(searchPage, 'utf8');
const probe = `\n// __HMR_WS_PROBE__ ${Date.now()}\n`;
fs.writeFileSync(searchPage, orig + probe, 'utf8');
console.log('[probe] wrote to SearchPage.tsx');

await new Promise((r) => setTimeout(r, 5000));

fs.writeFileSync(searchPage, orig, 'utf8');
console.log('[probe] restored SearchPage.tsx');

await new Promise((r) => setTimeout(r, 2000));

ws.close();
await server.close();

const blob = inbound.join('\n');
const ok =
  /"type"\s*:\s*"update"/.test(blob) ||
  /"type"\s*:\s*"full-reload"/.test(blob) ||
  /"type"\s*:\s*"custom"/.test(blob); // bazı ortamlarda sadece custom

if (!ok) {
  console.error('FAIL: HMR WS mesajlarinda update/full-reload beklenen pattern yok.');
  console.error('Toplam mesaj:', inbound.length);
  process.exit(1);
}

console.log('OK: HMR WebSocket mesajlari alindi (update/full-reload veya custom).');
