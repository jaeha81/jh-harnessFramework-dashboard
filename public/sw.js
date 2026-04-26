const CACHE_NAME = "jh-harness-v2";
const STATIC_PAGES = [
  "/",
  "/new-project",
  "/recommendation",
  "/review",
  "/output",
  "/history",
  "/frameworks",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // precache shell pages (best-effort — failures don't abort install)
      Promise.allSettled(STATIC_PAGES.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Never intercept Google API / OAuth calls
  if (url.hostname.includes("google") || url.hostname.includes("googleapis")) return;

  // API routes: network-only (no cache)
  if (url.pathname.startsWith("/api/")) return;

  // _next static assets: cache-first (hashed filenames = safe)
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) => cached ?? fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          }
          return res;
        })
      )
    );
    return;
  }

  // Everything else: network-first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(
          (cached) => cached ?? caches.match("/").then(
            (root) => root ?? new Response("오프라인 상태입니다.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          )
        )
      )
  );
});
