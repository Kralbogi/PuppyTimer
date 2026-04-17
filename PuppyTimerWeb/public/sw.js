// =============================================================================
// PawLand Service Worker — v2
// Düzeltmeler: versiyonlu cache (QuotaExceededError), FCM push desteği
// =============================================================================

const CACHE_VERSION = 'pawland-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const MAX_DYNAMIC_ITEMS = 60;

const STATIC_ASSETS = ['/'];

// ── Kurulum ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Aktivasyon: eski cache'leri sil ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network-first, cache fallback ─────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Firebase / Anthropic / Stripe çağrılarını cache'leme
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('anthropic') ||
    url.hostname.includes('stripe') ||
    url.hostname.includes('openweathermap') ||
    url.hostname.includes('nominatim')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(event.request, response.clone());
          // Dynamic cache boyutunu sınırla
          trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ITEMS);
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Dynamic cache sınırlama ───────────────────────────────────────────────────
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    trimCache(cacheName, maxItems);
  }
}

// ── Push bildirimi al ve göster ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: 'PawLand', body: event.data.text() } };
  }

  const title = payload.notification?.title || payload.data?.title || 'PawLand';
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Bildirime tıklandığında uygulamayı aç ─────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
