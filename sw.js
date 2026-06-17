// Service worker for Forex & Crypto Session Tracker
// Caches the app shell (the HTML/CSS/JS itself) so the app opens instantly
// and works offline. Deliberately does NOT cache any live data requests
// (gold price, forex rates, BTC price, economic calendar) — those must
// always go to the network so you never see stale prices.

const CACHE_NAME = 'session-tracker-v1';
const APP_SHELL = [
  './Break.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never intercept calls to external APIs (gold, forex, BTC, calendar, fonts).
  // These must always hit the real network for live data.
  const isExternalApi =
    url.includes('gold-api.com') ||
    url.includes('frankfurter.dev') ||
    url.includes('coingecko.com') ||
    url.includes('faireconomy.media') ||
    url.includes('allorigins.win') ||
    url.includes('codetabs.com') ||
    url.includes('corsproxy.io') ||
    url.includes('thingproxy') ||
    url.includes('er-api.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com');

  if (isExternalApi) {
    return; // let the browser handle it normally, no caching
  }

  // App shell: serve from cache first (instant load, works offline),
  // fall back to network if not cached yet.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
