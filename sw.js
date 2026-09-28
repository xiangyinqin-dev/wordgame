/* 单词大对决 - 离线缓存 Service Worker
   访问过一次后，断网也能打开游戏（图片找图功能在离线时自动用表情图代替） */
const CACHE = 'wordgame-v2';
const ASSETS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return;   // 只处理本站文件

  // 在线时优先用网络（保证总是拿到最新版本），3 秒超时或失败则用缓存（离线可用）
  e.respondWith(
    Promise.race([
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('offline timeout')), 3000)),
    ]).catch(() =>
      caches.match(e.request).then(hit => hit || caches.match('./index.html'))
    )
  );
});
