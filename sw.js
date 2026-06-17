// Service worker for Forex & Crypto Session Tracker
// Caches static assets (CSS/JS/images embedded in the single HTML file are
// inline, so there's little to cache beyond the manifest and icons) so the
// app can work offline-ish. Critically, this NEVER intercepts navigation
// requests (i.e. loading the actual page) — those always go straight to the
// network. Standalone home-screen shortcuts (WebAPKs) can be unforgiving if
// a service worker's fetch handler misbehaves on the page load itself, so
// the safest design is to stay completely out of the way of navigation.

const CACHE_NAME = 'session-tracker-v2';
const APP_SHELL = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((e) => console.warn('Service worker precache failed (non-fatal):', e))
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
  // Never touch navigation requests (the page load itself, including the
  // home-screen shortcut's start_url). Always let these go straight to the
  // network with zero interference — this is the actual fix for the 404
  // some users saw when opening from a home-screen shortcut.
  if (event.request.mode === 'navigate') {
    return;
  }

  const url = event.request.url;

  // Never intercept calls to external APIs (gold, forex, BTC, calendar, fonts).
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
    return;
  }

  // For same-origin static assets only: try cache, fall back to network.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
