const CACHE_NAME = "g2-core-v2026.09.01";
const RUNTIME_CACHE = "g2-runtime-v2026.09.01";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./version.json",
  "./css/app.css",
  "./js/app.js",
  "./js/audio.js",
  "./js/cache-manager.js",
  "./js/config.js",
  "./js/firmware.js",
  "./js/state.js",
  "./js/storage.js",
  "./js/ui.js",
  "./shop-logo.png",
  "./song.mp3",
];

const CACHE_PREFIXES = ["g2-core-v", "g2-runtime-v"];

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isCacheable(request) {
  const url = new URL(request.url);
  return /\.(html?|css|js|json|png|jpe?g|webp|gif|svg|ico|mp3|wav|ogg|bin)$/i.test(url.pathname);
}

async function cacheCoreAssets() {
  const cache = await caches.open(CACHE_NAME);
  const results = await Promise.allSettled(
    CORE_ASSETS.map(async (asset) => {
      const response = await fetch(asset, { cache: "no-store" });
      if (!response.ok) throw new Error(`${asset}: HTTP ${response.status}`);
      await cache.put(asset, response.clone());
    }),
  );

  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length) {
    throw new Error(`Failed to cache ${failures.length} core asset(s).`);
  }
}

async function deleteOldCaches() {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => CACHE_PREFIXES.some((prefix) => name.startsWith(prefix) && name !== CACHE_NAME && name !== RUNTIME_CACHE))
      .map((name) => caches.delete(name)),
  );
}

async function cacheFirst(request) {
  // For navigation requests prefer the cached index.html (SPA fallback)
  if (request.mode === "navigate") {
    const rootCached = await caches.match(new Request("./index.html"));
    if (rootCached) return rootCached;
  }

  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);

    if (response.ok && isSameOrigin(request) && isCacheable(request)) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // If fetch fails for navigation, try the SPA fallback (index.html)
    if (request.mode === "navigate") {
      const fallback = await caches.match("./index.html");
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function cacheStatus() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  const cachedUrls = new Set(keys.map((request) => new URL(request.url).pathname));
  const total = CORE_ASSETS.length;
  const cached = CORE_ASSETS.filter((asset) => {
    const url = new URL(asset, self.location.href);
    return cachedUrls.has(url.pathname);
  }).length;

  return {
    cached,
    total,
    percent: total ? Math.round((cached / total) * 100) : 0,
  };
}

self.addEventListener("install", (event) => {
  // Install will fail if any core asset cannot be fetched/cached. This is intentional
  // so the SW doesn't activate partially. Keep the behavior but provide clearer
  // failure handling in the client.
  event.waitUntil(
    cacheCoreAssets()
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    deleteOldCaches()
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET" || !isSameOrigin(request)) return;

  event.respondWith(cacheFirst(request));
});

self.addEventListener("message", (event) => {
  const type = event.data?.type;
  const port = event.ports?.[0];

  if (type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (type === "CACHE_REFRESH") {
    event.waitUntil(
      cacheCoreAssets()
        .then(cacheStatus)
        .then((result) => port?.postMessage(result))
        .catch((error) => port?.postMessage({
          error: error.message,
          ...(typeof error === "object" ? {} : {}),
        })),
    );
    return;
  }

  if (type === "CLEAR_GENERAL_CACHE") {
    event.waitUntil(
      Promise.all(
        CACHE_PREFIXES.map(async (prefix) => {
          const names = await caches.keys();
          await Promise.all(
            names.filter((name) => name.startsWith(prefix)).map((name) => caches.delete(name)),
          );
        }),
      )
        .then(() => port?.postMessage({ cached: 0, total: CORE_ASSETS.length, percent: 0 })),
    );
    return;
  }

  if (type === "GET_CACHE_STATUS") {
    event.waitUntil(
      cacheStatus().then((result) => port?.postMessage(result)),
    );
  }
});
