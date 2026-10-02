/* Service worker de la Ruta de la Energía: guarda todo el juego en el navegador para que funcione sin conexión.
   Si cambia cualquier archivo, subí CACHE_VERSION: así los equipos descargan la versión nueva y borran la vieja. */
const CACHE_VERSION = 'energia-1.0.0';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/juego.css',
  './fonts/fredoka-latin.woff2',
  './fonts/nunito-latin.woff2',
  './img/logo-energimundo.png',
  './img/fondos/hidraulica.webp',
  './img/fondos/eolica.webp',
  './img/fondos/solar.webp',
  './img/fondos/biomasa.webp',
  './img/fondos/uruguay.webp',
  './img/iconos/icono.svg',
  './img/iconos/icono-180.png',
  './img/iconos/icono-192.png',
  './img/iconos/icono-512.png',
  './img/iconos/icono-maskable-512.png',
  './js/config.js',
  './js/util.js',
  './js/datos/base.js',
  './js/datos/fuentes.js',
  './js/datos/fotos.js',
  './js/datos/p-hidraulica.js',
  './js/datos/p-eolica.js',
  './js/datos/p-solar.js',
  './js/datos/p-biomasa.js',
  './js/datos/p-uruguay.js',
  './js/almacen.js',
  './js/motor.js',
  './js/iconos.js',
  './js/audio.js',
  './js/ui/nucleo.js',
  './js/ui/capas.js',
  './js/ui/teclado.js',
  './js/ui/inicio.js',
  './js/ui/preguntas.js',
  './js/ui/desafio.js',
  './js/ui/final.js',
  './js/ui/creditos.js',
  './js/kiosco.js',
  './js/app.js'
];

const RAIZ = new URL('./', self.location).pathname;

// Si el sitio del Tannat (que vive en el mismo origen) borra esta caché al actualizarse, o si algo la vacía, se la vuelve a llenar
// en la próxima visita con internet. Es todo o nada: si falta la red, se reintenta la próxima vez.
async function reponer() {
  const cache = await caches.open(CACHE_VERSION);
  const guardados = await cache.keys();
  if (guardados.length < ARCHIVOS.length) await cache.addAll(ARCHIVOS);
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith('energia-') && k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(RAIZ)) return;
  if (req.mode === 'navigate') e.waitUntil(reponer().catch(() => { /* sin red: se reintenta en la próxima visita */ }));
  e.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((guardado) => guardado || fetch(req).catch(() => (req.mode === 'navigate' ? cache.match('./index.html') : Response.error())))
    )
  );
});
