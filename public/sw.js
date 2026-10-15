const CACHE_NAME = 'jawda-pwa-v1';
const API_CACHE_NAME = 'jawda-api-cache-v1';

const STATIC_PRECACHE = [
    '/',
    '/sales/new',
    '/sales',
    '/warehouse',
    '/inventory',
    '/offline.html',
    '/manifest.json',
    '/custom_logo.png',
    '/custom_logo_new.png',
    '/jawda_steel_logo.png',
    '/emblem.png'
];

// Install Event: Pre-cache core pages and assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching offline shell and core pages...');
            return cache.addAll(STATIC_PRECACHE).catch((err) => {
                console.warn('[SW] Some precache items failed to load, proceeding anyway:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate Event: Clean up old caches & take control immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Intelligent routing for offline navigation & assets
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Ignore non-http(s) schemes like chrome-extension://
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 1. Next.js Static Files & Bundles (/_next/static/*, fonts, images) -> Cache First with Network Fallback
    if (url.pathname.startsWith('/_next/static/') || 
        url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|css|js)$/)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Update cache in background when online
                    fetch(request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
                        }
                    }).catch(() => {});
                    return cachedResponse;
                }

                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                }).catch(() => {
                    // Return empty fallback or cached fallback for images if available
                    return new Response('', { status: 408, statusText: 'Offline Asset' });
                });
            })
        );
        return;
    }

    // 2. Catalog API Calls (/api/products, /api/categories, /api/branches, /api/customers, /api/exchange-rate)
    // -> Network First, Fallback to cached API responses
    if (url.pathname.startsWith('/api/products') ||
        url.pathname.startsWith('/api/categories') ||
        url.pathname.startsWith('/api/branches') ||
        url.pathname.startsWith('/api/customers') ||
        url.pathname.startsWith('/api/exchange-rate')) {
        
        event.respondWith(
            fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(API_CACHE_NAME).then((cache) => cache.put(request, responseClone));
                }
                return networkResponse;
            }).catch(async () => {
                const cached = await caches.match(request);
                if (cached) return cached;
                return new Response(JSON.stringify({ error: 'Offline mode', offline: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // 3. Page Navigation (HTML documents) -> Network First with immediate fallback to cached HTML
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                }
                return networkResponse;
            }).catch(async () => {
                // Try matching exact route in cache (e.g. /sales/new, /sales, /warehouse)
                const cachedPage = await caches.match(request);
                if (cachedPage) return cachedPage;

                // Try stripped pathname
                const strippedMatch = await caches.match(url.pathname);
                if (strippedMatch) return strippedMatch;

                // Try POS fallback
                const posMatch = await caches.match('/sales/new');
                if (posMatch) return posMatch;

                // Final fallback to offline.html
                const offlinePage = await caches.match('/offline.html');
                if (offlinePage) return offlinePage;

                return new Response('<h1>أنت تعمل حالياً بدون اتصال بالإنترنت</h1><p><a href="/sales/new">اضغط هنا للانتقال لنقطة البيع</a></p>', {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
            })
        );
        return;
    }

    // 4. Any other requests -> Stale While Revalidate
    event.respondWith(
        caches.match(request).then((cached) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return networkResponse;
            }).catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
