const CACHE = 'shopee-tool-v6';

// ── 설치: 즉시 활성화 (경로 하드코딩 없음) ──────────────────────
self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── 외부 API 요청 판별 ──────────────────────────────────────────
function isExternal(url) {
  return url.includes('supabase.co') ||
         url.includes('exchangerate-api') ||
         url.includes('translate.googleapis') ||
         url.includes('unpkg.com') ||
         url.includes('cdn.jsdelivr.net') ||
         url.includes('babel') ||
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
        // 정상 응답(opaque 제외)만 캐시
        if (res.ok && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // 오프라인 폴백: SW 스코프 기반으로 index.html 동적 반환
        if (e.request.destination === 'document') {
          const scope = self.registration.scope;
          return caches.match(scope + 'index.html')
            .then(r => r || caches.match(scope));
        }
      });
    })
  );
});
