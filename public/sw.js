const CACHE_NAME = "practicum-os-static-v3";
const OFFLINE_PAGE = "/offline-logbook/index.html";
const OFFLINE_ASSETS = [OFFLINE_PAGE, "/offline-logbook/styles.css", "/offline-logbook/screen.mjs", "/offline-logbook/notebook.mjs"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([caches.delete("practicum-os-v1"), caches.delete("practicum-os-static-v2")])
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && /^\/[a-z0-9][a-z0-9-]*\/student\/logbook\/?$/.test(url.pathname)) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(OFFLINE_PAGE)) || Response.error();
    }));
    return;
  }

  if (OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
      (await cache.match(url.pathname)) || fetch(request)));
    return;
  }

  if (!url.pathname.startsWith("/_next/static/")) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone()).catch(() => {});
    return response;
  })());
});
