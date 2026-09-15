// Service Worker for End Times Monitor — v2
// Strategy:
//   - HTML / navigation requests: Network-First (always fetches fresh index.html)
//   - Static assets (/assets/ hashed by Vite): Cache-First (safe to cache forever)
//   - Map tiles (cartocdn): Cache-First with fallback
//   - API / dynamic data: Network-only (no caching)

const CACHE_NAME = 'end-times-monitor-v3';
const TILE_CACHE = 'map-tiles-v3';

// ── Install: no pre-caching needed (assets are fetched on demand) ──────────
self.addEventListener('install', (event) => {
    console.log('📦 SW v3 installing…');
    // Skip waiting so the new SW activates immediately on all tabs
    self.skipWaiting();
});

// ── Activate: delete any caches from previous versions ────────────────────
self.addEventListener('activate', (event) => {
    const VALID_CACHES = [CACHE_NAME, TILE_CACHE];
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(name => !VALID_CACHES.includes(name))
                    .map(name => {
                        console.log('🗑️ Deleting old cache:', name);
                        return caches.delete(name);
                    })
            )
        ).then(() => self.clients.claim())
    );
});

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Network-First: Tries network, falls back to cache on failure.
 * Used for HTML / navigation so the user always gets the latest index.html.
 */
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.warn('⚠️ [SW] Primary fetch failed for:', request.url, error);
        
        // Browser bug workaround: if a navigate fetch fails during a reload,
        // it may be a TypeError from `controllerchange` taking claim.
        // A clean decoupled fetch might succeed.
        if (request.mode === 'navigate') {
            try {
                const cleanResponse = await fetch(request.url);
                if (cleanResponse && cleanResponse.ok) {
                    cache.put(request, cleanResponse.clone());
                }
                return cleanResponse;
            } catch (fallbackError) {
                console.warn('⚠️ [SW] Fallback clean fetch also failed:', fallbackError);
            }
        }

        // Network actually failed or offline. Fall back to cache.
        const cached = await cache.match(request) || await cache.match('/');
        if (cached) return cached;
        
        // Last resort offline page (if even '/' isn't in cache yet)
        return new Response('<html><head><title>Offline - End Times Monitor</title><style>body{background:#050505;color:#e5e7eb;font-family:monospace;padding:50px;text-align:center;}button{background:#34d399;color:#000;border:none;padding:10px 20px;font-family:monospace;font-weight:bold;cursor:pointer;margin-top:20px;border-radius:2px;}</style></head><body><h1>📡 OFFLINE</h1><p>End Times Monitor is currently offline. Please check your connection.</p><button onclick="window.location.reload(true)">RETRY CONNECTION</button></body></html>', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

/**
 * Cache-First: Serves from cache instantly; fetches + caches if missing.
 * Safe for Vite-hashed assets (/assets/index-XXXX.js) because each build
 * produces a new filename, so stale cache is never an issue.
 */
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
}

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. Only handle GET requests
    if (request.method !== 'GET') return;

    // 2. Ignore browser-extension / non-http requests
    if (!url.protocol.startsWith('http')) return;

    // 3. Map tiles → Cache-First
    if (url.hostname.includes('cartocdn.com') || url.pathname.includes('/tiles/')) {
        event.respondWith(cacheFirst(request, TILE_CACHE));
        return;
    }

    // 4. API / backend calls → Network-only (never cache dynamic data)
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/data/')) {
        return; // Let browser handle it normally
    }

    // 5. Vite hashed assets → Cache-First (safe forever because of content hash)
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(cacheFirst(request, CACHE_NAME));
        return;
    }

    // 6. HTML / navigation & everything else → Network-First
    event.respondWith(networkFirst(request, CACHE_NAME));
});

// ── Message: allow the client to clear caches manually ────────────────────
self.addEventListener('message', (event) => {
    if (event.data?.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then(names => Promise.all(names.map(n => caches.delete(n))))
                .then(() => event.ports[0]?.postMessage({ success: true }))
        );
    }

    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
