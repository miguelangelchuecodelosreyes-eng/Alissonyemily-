// Service worker de Alisson & Emily — "primero la red":
// siempre intenta traer la versión más nueva de GitHub y solo usa la copia guardada si no hay internet.
const CACHE = 'ae-cache-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo los archivos de la propia app (Firebase, fuentes, etc. van directo a internet)
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-store' });
      if (fresh && fresh.ok) {
        const copia = fresh.clone();
        caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
      }
      return fresh;
    } catch (err) {
      // Sin internet: usar la última copia guardada
      const guardada = await caches.match(req, { ignoreSearch: true });
      if (guardada) return guardada;
      if (req.mode === 'navigate') {
        const inicio = await caches.match('index.html', { ignoreSearch: true });
        if (inicio) return inicio;
      }
      throw err;
    }
  })());
});
