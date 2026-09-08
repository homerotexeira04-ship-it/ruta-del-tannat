// Service Worker de La Ruta del Tannat: app shell cacheado para instalación PWA y uso sin conexión.
const CACHE_VERSION = 'tannat-v1';
const CORE_ASSETS = [
  './LaRutadelTannat.html',
  './index.html',
  './manifest.json',
  './LaRutadelTannat_files/saved_resource',
  './LaRutadelTannat_files/css2',
  './LaRutadelTannat_files/logo-ruta-del-tannat.webp',
  './LaRutadelTannat_files/favicon.svg',
  './LaRutadelTannat_files/favicon-32.png',
  './LaRutadelTannat_files/favicon-180.png',
  './LaRutadelTannat_files/icon-192.png',
  './LaRutadelTannat_files/icon-512.png',
  './LaRutadelTannat_files/icon-maskable-192.png',
  './LaRutadelTannat_files/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navegación (abrir/recargar la página): red primero, caché como respaldo sin conexión
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_VERSION).then((cache) => cache.put('./LaRutadelTannat.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('./LaRutadelTannat.html'))
    );
    return;
  }

  // Recursos del mismo origen: caché primero (rápido y funciona offline), actualiza en segundo plano
  if (new URL(req.url).origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res.ok) caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
