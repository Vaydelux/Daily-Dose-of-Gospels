/*
 * Daily Dose of Gospels — service worker
 *
 * Strategy (deliberately conservative, privacy-first):
 *   - navigations:            network-first → cached page → /offline.html
 *   - immutable static assets: stale-while-revalidate (/_next/static, icons, covers)
 *   - API, admin, audio, auth:  network only — never cached, never inspected
 *
 * On localhost/127.0.0.1 the worker idles and passes everything through,
 * so `next dev` hot reloading is never disturbed.
 */

const VERSION = "ddog-v2";
const PAGES_CACHE = `${VERSION}-pages`;
const ASSETS_CACHE = `${VERSION}-assets`;
const PRECACHE = ["/offline.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

const IS_DEV_HOST = ["localhost", "127.0.0.1", "0.0.0.0"].includes(self.location.hostname);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Never touch non-GET, dev hosts, cross-origin, or private areas.
  if (IS_DEV_HOST) return;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  // Audio streams use Range requests — leave them to the browser.
  if (req.headers.has("range")) return;
  if (/\.(mp3|wav|ogg|m4a)$/i.test(url.pathname)) return;

  // 1) Page navigations: network-first with graceful offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cachedPage = await caches.match(req, { ignoreSearch: true });
          if (cachedPage) return cachedPage;
          const offline = await caches.match("/offline.html");
          return offline || Response.error();
        })
    );
    return;
  }

  // 2) Immutable build assets + static art: stale-while-revalidate.
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/covers/") ||
    url.pathname.startsWith("/images/") ||
    /\.(css|js|woff2?|png|jpg|jpeg|svg|webp|avif|ico)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => cached || Response.error());
        return cached || network;
      })
    );
  }
  // 3) Everything else: default network behaviour.
});
