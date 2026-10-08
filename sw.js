// Revistamento ZTO — service worker: o app abre mesmo sem sinal no pátio.
// HTML do app: rede primeiro (pega a versão nova), cache como reserva.
// Bibliotecas e fontes de fora (Supabase, leitor de PDF, Open Sans): cache depois da 1ª vez.
// Dados (Supabase API) nunca passam pelo cache: o app guarda o que precisa e reenvia sozinho.
const CACHE = 'revistamento-20261008104831';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const DE_FORA = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (DE_FORA.includes(url.hostname)) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => {
      const copia = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return resp;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((resp) => {
    const copia = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return resp;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))));
});
