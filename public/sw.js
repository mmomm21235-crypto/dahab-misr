const CACHE_NAME = "dahab-v2";
const STATIC_CACHE = "dahab-static-v2";
const GOLD_CACHE = "dahab-gold-v2";

const PRECACHE_URLS = [
  "/",
  "/calculator",
  "/charts",
  "/news",
  "/alerts",
  "/shops",
  "/about",
  "/settings",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install: precache app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  const ALLOWED = new Set([CACHE_NAME, STATIC_CACHE, GOLD_CACHE]);
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !ALLOWED.has(k)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: route by URL pattern
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Gold prices: network-first with 5-min cache fallback
  if (url.pathname.startsWith("/api/gold-prices")) {
    e.respondWith(networkFirstWithCache(e.request, GOLD_CACHE, 300));
    return;
  }

  // News: stale-while-revalidate (5 min)
  if (url.pathname.startsWith("/api/news")) {
    e.respondWith(staleWhileRevalidate(e.request, STATIC_CACHE, 300));
    return;
  }

  // OG images: cache-first (1 day)
  if (url.pathname.startsWith("/og")) {
    e.respondWith(cacheFirstWithExpiry(e.request, STATIC_CACHE, 86400));
    return;
  }

  // Static assets: cache-first
  if (
    e.request.destination === "style" ||
    e.request.destination === "script" ||
    e.request.destination === "image" ||
    e.request.destination === "font"
  ) {
    e.respondWith(cacheFirst(e.request, STATIC_CACHE));
    return;
  }

  // Pages: network-first with cache fallback
  if (e.request.mode === "navigate") {
    e.respondWith(networkFirstWithCache(e.request, STATIC_CACHE, 60));
    return;
  }

  // Default: network
  e.respondWith(fetch(e.request));
});

// --- Cache strategies ---

async function networkFirstWithCache(request, cacheName, maxAgeSeconds) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const headers = new Headers(response.headers);
      headers.set("sw-cached-at", Date.now().toString());
      const timedResponse = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, timedResponse);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get("sw-cached-at") || "0", 10);
      if (cachedAt && Date.now() - cachedAt < maxAgeSeconds * 1000) {
        return cached;
      }
    }
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 408 });
  }
}

async function cacheFirstWithExpiry(request, cacheName, maxAgeSeconds) {
  const cached = await caches.match(request);
  if (cached) {
    const cachedAt = parseInt(cached.headers.get("sw-cached-at") || "0", 10);
    if (cachedAt && Date.now() - cachedAt < maxAgeSeconds * 1000) {
      return cached;
    }
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const headers = new Headers(response.headers);
      headers.set("sw-cached-at", Date.now().toString());
      const timedResponse = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, timedResponse);
    }
    return response;
  } catch {
    if (cached) return cached;
    return new Response("", { status: 408 });
  }
}

async function staleWhileRevalidate(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const headers = new Headers(response.headers);
        headers.set("sw-cached-at", Date.now().toString());
        const timedResponse = new Response(response.clone().clone().blob(), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
        cache.put(request, timedResponse);
      }
      return response;
    })
    .catch(() => cached);

  if (cached) {
    const cachedAt = parseInt(cached.headers.get("sw-cached-at") || "0", 10);
    if (cachedAt && Date.now() - cachedAt < maxAgeSeconds * 1000) {
      return cached;
    }
  }

  return cached || fetchPromise;
}

// --- Push notifications ---

self.addEventListener("push", (e) => {
  if (!e.data) return;
  const d = e.data.json();
  e.waitUntil(
    self.registration.showNotification(d.title || "ذهب مصر", {
      body: d.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      dir: "rtl",
      lang: "ar",
      vibrate: [200, 100, 200],
      data: { url: d.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || "/"));
});
