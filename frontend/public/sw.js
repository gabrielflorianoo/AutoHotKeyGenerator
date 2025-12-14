const CACHE_NAME = "ahk-generator-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;

    // Don't handle non-GET requests
    if (req.method !== 'GET') return;

    // Avoid intercepting Vite dev server HMR and websocket-related requests
    const url = new URL(req.url);
    if (url.pathname.startsWith('/@vite') || url.pathname.startsWith('/@react-refresh') || url.pathname.startsWith('/sockjs-node')) {
        return; // let the browser handle dev server requests
    }

    // Only try cache for same-origin requests (avoid cross-origin fetch issues)
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(req).then((response) => {
            if (response) return response;
            return fetch(req).catch(() => {
                // If fetch fails (offline), try to return cached index.html for navigation
                if (req.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                // otherwise just reject
                throw Error('network-error');
            });
        }),
    );
});

self.addEventListener("activate", (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                }),
            );
        }),
    );
});
