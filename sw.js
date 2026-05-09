// ══════════════════════════════════════════════
//  SERVICE WORKER — Alisson & Emily
//  ✅ NO toques nada aquí.
//     Solo cambia APP_VERSION en el HTML y sube los 2 archivos.
// ══════════════════════════════════════════════

const CACHE_BASE = 'alisson-emily-';
let CACHE_NAME = CACHE_BASE + 'init';

// ── INSTALAR: leer versión del HTML y guardar en caché ──
self.addEventListener('install', event => {
  event.waitUntil(
    // Detectar la URL real del HTML (funciona con cualquier nombre de archivo)
    self.registration.scope
      ? fetch(self.registration.scope + '?_sw=' + Date.now(), { cache: 'no-store' })
          .then(r => r.text())
          .then(html => {
            const m = html.match(/APP_VERSION\s*=\s*'([^']+)'/);
            const ver = m ? m[1].replace(/[\s']/g, '-') : ('t' + Date.now());
            CACHE_NAME = CACHE_BASE + ver;
            return caches.open(CACHE_NAME).then(cache =>
              cache.add(self.registration.scope)
            );
          })
          .catch(() => {
            CACHE_NAME = CACHE_BASE + Date.now();
            return caches.open(CACHE_NAME);
          })
      : Promise.resolve()
  );
  // NO skipWaiting — esperar que el usuario apruebe en la notificación
});

// ── ACTIVAR: borrar cachés viejas ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith(CACHE_BASE) && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Network First (red primero, caché como respaldo sin internet) ──
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  // No interceptar verificaciones de versión ni del propio SW
  if(event.request.url.includes('_vc=') || event.request.url.includes('_sw=')) return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        // Guardar en caché si la red respondió bien
        if(response && response.status === 200 && CACHE_NAME !== CACHE_BASE + 'init'){
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
        }
        return response;
      })
      .catch(() => {
        // Sin internet → usar caché guardada
        return caches.match(event.request);
      })
  );
});

// ── MENSAJE: usuario tocó "Actualizar ahora" ──
self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
