// Service worker: visa programėlė talpinama kešė, kad veiktų offline.
// Pakeitus failus – padidink VERSION, kad naršyklė atsisiųstų naujus.
const VERSION = 'levelup-v1.5.3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/icons.js',
  './js/config.js',
  './js/db.js',
  './js/store.js',
  './js/ui.js',
  './js/emblems.js',
  './js/screens/home.js',
  './js/screens/tasks.js',
  './js/screens/levels.js',
  './js/screens/profile.js',
  './js/screens/friends.js',
  './js/screens/menu.js',
  './js/screens/onboarding.js',
  './js/app.js',
  './assets/fonts/inter-latin-wght-normal.woff2',
  './assets/fonts/inter-latin-ext-wght-normal.woff2',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' – imam šviežius failus iš tinklo, ne iš naršyklės HTTP kešo
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pirmiausia kešas, tada tinklas (ir atnaujinam kešą fone).
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return cached || network;
    })
  );
});
