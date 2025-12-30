const CACHE_NAME = 'zenvio-v2';
const STATIC_CACHE = 'zenvio-static-v2';
const DYNAMIC_CACHE = 'zenvio-dynamic-v2';
const IMAGE_CACHE = 'zenvio-images-v2';

// Archivos estáticos para cachear
const STATIC_FILES = [
  '/',
  '/index.html',
  '/stories.css',
  '/stories.js',
  '/intro-animation.css',
  '/intro-animation.js',
  '/premium-intro.js',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Cacheando archivos estáticos');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Archivos estáticos cacheados');
        return self.skipWaiting();
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia Cache First para archivos estáticos
  if (STATIC_FILES.includes(request.url) || request.url.includes('css') || request.url.includes('js')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Estrategia Stale While Revalidate para imágenes
  if (request.destination === 'image' || url.pathname.includes('image') || url.pathname.includes('img')) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Estrategia Network First para APIs y contenido dinámico
  if (url.pathname.includes('api') || url.pathname.includes('firebase') || url.hostname.includes('firebase')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Estrategia Cache First para el resto
  event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
});

// Estrategia Cache First
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Error en Cache First:', error);
    return new Response('Contenido no disponible offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Estrategia Network First
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Contenido no disponible', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Estrategia Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Manejar notificaciones push
self.addEventListener('push', event => {
  console.log('[SW] Push recibido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Zenvio',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Zenvio', options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Realizando sincronización en segundo plano');
}

// Limpiar cachés antiguos periódicamente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});