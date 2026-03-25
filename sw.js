const CACHE = 'shopee-tool-v7';

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))  // 모든 캐시 삭제
    ).then(() => self.clients.claim())
  );
});

function isExternal(url) {
  return url.includes('supabase.co') ||
         url.includes('exchangerate-api') ||
         url.includes('translate.googleapis') ||
         url.includes('cdn.jsdelivr.net') ||
         url.includes('fonts.googleapis') ||
         url.includes('fonts.gstatic') ||
         url.includes('favicon.ico');
}

self.addEventListener('fetch', e => {
  if (isExternal(e.request.url)) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if (e.request.destination === 'document') {
          const scope = self.registration.scope;
          return caches.match(scope + 'index.html').then(r => r || caches.match(scope));
        }
      });
    })
  );
});
