const VERSION = 'kyokai-yawa-v10';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;
const SCOPE = '/kyokai-yawa/';
const OFFLINE_URL = `${SCOPE}offline.html`;
const PRECACHE = [
  SCOPE,
  OFFLINE_URL,
  `${SCOPE}manifest.webmanifest`,
  `${SCOPE}assets/app-icon.svg`,
  `${SCOPE}assets/app-icon-192.png`,
  `${SCOPE}assets/app-icon-512.png`,
  `${SCOPE}assets/apple-touch-icon.png`,
  `${SCOPE}data/works.js`,
  `${SCOPE}data/story-taxonomy.json`,
  `${SCOPE}data/archive-tools.js`,
  `${SCOPE}data/entry-guide.css`,
  `${SCOPE}data/reading-paths.css`,
  `${SCOPE}data/work-cards.css`,
  `${SCOPE}data/reading-status.css`,
  `${SCOPE}data/reading-status.js`,
  `${SCOPE}data/saved-stories.js`,
  `${SCOPE}data/saved-stories.css`,
  `${SCOPE}data/reading-backup.js`,
  `${SCOPE}data/reading-log.js`,
  `${SCOPE}data/reading-log.css`,
  `${SCOPE}data/accessibility-contrast.css`,
  `${SCOPE}reading-log.html`,
  `${SCOPE}data/home-personalization.css`,
  `${SCOPE}data/home-personalization.js`,
  `${SCOPE}data/series-links.js`,
  `${SCOPE}data/series-pages.css`,
  `${SCOPE}data/series-work-cards.css`,
  `${SCOPE}data/series-archive-tools.js`,
  `${SCOPE}data/story-overview.css`,
  `${SCOPE}data/related-stories.css`,
  `${SCOPE}data/reader-tools.css`,
  `${SCOPE}data/reader-tools.js`,
  `${SCOPE}data/sw-register.js`,
];
const CURRENT_CACHES = new Set([STATIC_CACHE, PAGE_CACHE, ASSET_CACHE]);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('kyokai-yawa-') && !CURRENT_CACHES.has(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

const storeSuccessfulResponse = async (cacheName, request, response) => {
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
};

const networkFirst = async (request, cacheName, fallbackUrl = null) => {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    return await storeSuccessfulResponse(cacheName, request, response);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw error;
  }
};

const cacheFirstImmutable = async request => {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  return storeSuccessfulResponse(ASSET_CACHE, request, response);
};

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE, OFFLINE_URL));
    return;
  }

  if (/\/data\/story-style-[a-f0-9]+\.css$/i.test(url.pathname)) {
    event.respondWith(cacheFirstImmutable(request));
    return;
  }

  if (url.pathname.endsWith('/service-worker.js')) return;
  event.respondWith(networkFirst(request, ASSET_CACHE));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
