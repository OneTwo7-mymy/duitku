/* ============================================
   DuitKu - Service Worker
   ============================================ */

const CACHE_NAME = 'duitku-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/auth.js',
    '/js/gdrive.js',
    '/js/sharing.js',
    '/js/expenses.js',
    '/js/budget.js',
    '/js/tabung.js',
    '/js/investment.js',
    '/js/reports.js',
    '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching assets');
                return cache.addAll(ASSETS);
            })
            .catch((err) => {
                console.log('Cache error:', err);
            })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and external URLs
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then((fetchResponse) => {
                        // Don't cache API calls
                        if (event.request.url.includes('googleapis.com')) {
                            return fetchResponse;
                        }
                        // Cache new resources
                        return caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, fetchResponse.clone());
                                return fetchResponse;
                            });
                    });
            })
            .catch(() => {
                // Return offline page if available
                return caches.match('/index.html');
            })
    );
});
