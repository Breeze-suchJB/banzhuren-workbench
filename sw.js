/* 班主任智能工作台 Service Worker */
const CACHE_NAME = 'banzhuren-workbench-20260824-023125';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './app2.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const reqUrl = event.request.url;
  /* sw.js 永远走网络、绝不缓存：否则旧缓存永远不更新 */
  if (/\/sw[.]js([?]|$)/.test(reqUrl)) { event.respondWith(fetch(event.request).catch(() => caches.match(event.request))); return; }
  /* 页面导航用网络优先：总是先拿最新 HTML，断网时才用缓存 */
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) { const clone = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)); }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  /* 静态资源：缓存优先（版本更新时新缓存名会自动全量刷新） */
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
