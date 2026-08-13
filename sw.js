// Service Worker — Warung Salem POS
const CACHE = 'warung-salem-pos-v19';
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

// Activate: buang semua cache LAMA (force fresh)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: skip Firebase/API, network-first untuk HTML, cache-first untuk asset statis
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // Firebase/API → jangan cache, biar fresh
  if (url.includes('firestore') || url.includes('googleapis') || url.includes('firebase') || url.includes('gstatic') ||
      url.includes('cdnjs') || url.includes('cdn.tailwindcss') || url.includes('cdn.jsdelivr')) {
    return;
  }

  const isHTML = e.request.mode === 'navigate' ||
                 url.endsWith('.html') ||
                 url.endsWith('/') ||
                 url.includes('reports') ||
                 url.includes('login');

  if (isHTML) {
    // Network-first untuk HTML → selalu dapat versi terbaru
    e.respondWith(
      fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first untuk asset statis (CSS, JS, gambar)
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
        return res;
      }).catch(() => cached))
    );
  }
});
