const CACHE = 'shopee-tool-v5';
const ASSETS = [
  '/shopee/',
  '/shopee/index.html',
  '/shopee/orders.html',
  '/shopee/manifest.json',
  '/shopee/icon-192.png',
  '/shopee/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('exchangerate-api') ||
      e.request.url.includes('translate.googleapis') ||
      e.request.url.includes('unpkg.com') ||
      e.request.url.includes('babel') ||
      e.request.url.includes('fonts.googleapis') ||
      e.request.url.includes('favicon.ico')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if (e.request.destination === 'document') {
          return caches.match('/shopee/index.html');
        }
      });
    })
  );
});
