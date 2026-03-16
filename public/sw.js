// Service Worker for Offline Capability
// Caches map tiles and critical data for offline use

const CACHE_NAME = 'end-times-monitor-v1';
const TILE_CACHE = 'map-tiles-v1';

// Critical assets to cache for offline
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/logo_etm.jpg'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching critical assets');
                return cache.addAll(CRITICAL_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== TILE_CACHE) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle map tiles separately (CartoDB dark tiles)
    if (url.hostname.includes('cartocdn.com') || url.pathname.includes('/tiles/')) {
        event.respondWith(
            caches.open(TILE_CACHE).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Fetch and cache tile
                    return fetch(request).then(response => {
                        // Only cache successful responses
                        if (response && response.status === 200) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    }).catch(() => {
                        // Return placeholder tile if offline
                        return new Response('', { status: 503, statusText: 'Offline' });
                    });
                });
            })
        );
        return;
    }

    // Handle other requests (API, assets)
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise, fetch from network
            return fetch(request).then(response => {
                // Don't cache API responses or non-GET requests
                if (request.method !== 'GET' || url.hostname === 'localhost') {
                    return response;
                }

                // Cache the response
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, response.clone());
                    return response;
                });
            }).catch(error => {
                console.error('Fetch failed:', error);

                // Show offline page for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('/offline.html') || new Response(
                        'Offline - No cached data available',
                        { status: 503, statusText: 'Service Unavailable' }
                    );
                }

                throw error;
            });
        })
    );
});

// Message event - handle cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
