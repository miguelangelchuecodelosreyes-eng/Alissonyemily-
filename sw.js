// ══════════════════════════════════════════════
//  SERVICE WORKER — Alisson & Emily
//  👉 CADA VEZ QUE SUBAS A GITHUB, CAMBIA ESTE NÚMERO:
const VERSION = 'v10.1';
// ══════════════════════════════════════════════

const CACHE_NAME = 'alisson-emily-' + VERSION;

// Archivos que se guardan en caché
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json'
];

// ── INSTALAR: guardar archivos en caché ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ARCHIVOS);
    })
  );
  // NO hacer skipWaiting aquí — esperar que el usuario apruebe
});

// ── ACTIVAR: borrar cachés viejas ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: Network First (siempre intenta red primero) ──
self.addEventListener('fetch', event => {
  // Solo manejar peticiones GET
  if(event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la red respondió bien, actualizar caché y devolver respuesta
        if(response && response.status === 200){
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copia);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin red — usar caché
        return caches.match(event.request);
      })
  );
});

// ── MENSAJE: cuando el usuario aprueba la actualización ──
self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
