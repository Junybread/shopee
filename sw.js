const CACHE = 'shopee-tool-v1';
const ASSETS = [
  '/shopee-calculator/',
  '/shopee-calculator/index.html',
  '/shopee-calculator/orders.html',
  '/shopee-calculator/manifest.json',
];

// 설치 — 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 활성화 — 이전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 요청 처리 — 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // Supabase / 외부 API는 캐시 안 함
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('exchangerate-api') ||
      e.request.url.includes('translate.googleapis')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // HTML/JS/CSS만 캐시
        if (res.ok && ['html','javascript','css'].some(t =>
          e.request.url.includes('.'+t) || e.request.headers.get('accept')?.includes(t)
        )) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // 오프라인 — 캐시된 index.html 반환
        if (e.request.destination === 'document') {
          return caches.match('/shopee-calculator/index.html');
        }
      });
    })
  );
});
