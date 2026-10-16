import { readdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { APP_VERSION } from '../src/version.js';
async function walk(path) {
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) files.push(...await walk(`${path}/${entry.name}`));
    else files.push(`${path}/${entry.name}`);
  }
  return files;
}
const revision = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const builtAt = new Date().toISOString();
await writeFile('dist/version.json', JSON.stringify({ version: APP_VERSION, revision, builtAt }));
const files = (await walk('dist')).filter((p) => !p.endsWith('/sw.js'));
const digest = createHash('sha256');
for (const file of files.sort()) digest.update(await readFile(file));
const cacheName = `alacena-${APP_VERSION}-${digest.digest('hex').slice(0, 12)}`;
const urls = ['/', ...files.map((p) => p.slice(4))];
await writeFile('dist/sw.js', `const CACHE = ${JSON.stringify(cacheName)};
const ASSETS = ${JSON.stringify(urls)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('alacena-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => { if (event.data === 'ACTIVATE_UPDATE') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname === '/version.json' || url.pathname === '/sw.js') return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(event.request, { signal: AbortSignal.timeout(2500) }); }
      catch { return await caches.match('/'); }
    })());
    return;
  }
  if (ASSETS.includes(url.pathname)) event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
`);
console.log(`Offline package: ${files.length} files, version ${APP_VERSION}, revision ${revision}`);
