/// <reference lib="webworker" />

const SW_VERSION = 'v2.0.0';
const CACHE_NAME = `skychi-${SW_VERSION}`;
const STATIC_CACHE = `skychi-static-${SW_VERSION}`;
const DYNAMIC_CACHE = `skychi-dynamic-${SW_VERSION}`;

// فایل‌های اصلی که باید پیش‌کش شوند
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon.svg',
];

// نصب SW - پیش‌کش فایل‌های اصلی
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...', SW_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // فعال‌سازی فوری بدون انتظار برای بستن تب‌های قبلی
  self.skipWaiting();
});

// فعال‌سازی - پاک کردن کش‌های قدیمی
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...', SW_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName.startsWith('skychi-')
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // کنترل همه تب‌ها
  self.clients.claim();
});

// استراتژی CacheFirst برای فایل‌های استاتیک
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// استراتژی NetworkFirst با timeout برای API
async function networkFirst(request, timeout = 5000) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// استراتژی StaleWhileRevalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

// مدیریت درخواست‌ها
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // فقط درخواست‌های GET
  if (request.method !== 'GET') return;
  
  // درخواست‌های API Open-Meteo
  if (url.hostname === 'api.open-meteo.com' || url.hostname === 'air-quality-api.open-meteo.com') {
    event.respondWith(networkFirst(request, 5000));
    return;
  }
  
  // درخواست‌های فونت
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // فایل‌های استاتیک (JS, CSS, images)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2|woff|ico)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // درخواست‌های ناوبری (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }
  
  // بقیه درخواست‌ها
  event.respondWith(staleWhileRevalidate(request));
});

// مدیریت پیام‌ها از کلاینت
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'GET_VERSION') {
    event.source.postMessage({ version: SW_VERSION });
  }
});

console.log('[SW] Service Worker loaded:', SW_VERSION);
