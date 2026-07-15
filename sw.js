// Service Worker — Warung Salem POS
const CACHE = 'warung-salem-pos-v4';
const ASSETS = [
  './',
  './login',
  './login.html',
  './reports',
  './reports.html',
  './pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: cache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

// Activate: buang cache lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: skip Firebase/API (harus fresh), cache-first buat asset lokal
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (url.includes('firestore') || url.includes('googleapis') || url.includes('firebase') || url.includes('gstatic')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
