const OFFLINE_CACHE = "caderno-express-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.all([
    caches.open(OFFLINE_CACHE).then((cache) => cache.add("/offline.html")),
    self.skipWaiting(),
  ]));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("caderno-express-offline-") && cacheName !== OFFLINE_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      return (await cache.match("/offline.html")) || Response.error();
    }),
  );
});
