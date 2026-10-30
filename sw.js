// Thetadex Service Worker
// VERSION muss exakt gleich sein wie in js/config.js (bei jeder Änderung beide hochzählen).
const VERSION = '0.2.9';
const CACHE_NAME = 'thetadex-' + VERSION;

// App-Hülle: alle Dateien, die die App zum Starten braucht. Neue Dateien hier eintragen.
const HUELLE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './js/app.js',
  './js/config.js',
  './js/api.js',
  './js/store.js',
  './js/ui/dom.js',
  './js/views/start.js',
  './js/views/platzhalter.js',
  './js/views/einrichtung.js',
  './js/views/info.js',
  './js/views/nichtgefunden.js',
  './js/views/doener.js',
  './js/views/tracking.js',
  './js/views/finanzen.js',
  './js/views/finanzen-auswertung.js',
  './js/ui/auswahl.js',
  './js/ui/overlay.js',
  './js/ui/farben.js',
  './vendor/chart.umd.js',
  './icons/thetadex-icon.svg',
  './icons/thetadex-icon-180.png',
  './icons/thetadex-icon-192.png',
  './icons/thetadex-icon-512.png',
  './icons/thetadex-icon-maskable-512.png',
  './icons/reiter/tracking.svg',
  './icons/reiter/finanzen.svg',
  './icons/reiter/dsa.svg',
  './icons/reiter/einkauf.svg',
  './icons/reiter/besitz.svg',
  './icons/reiter/uni.svg',
  './icons/reiter/doener.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(HUELLE)));
  // Kein skipWaiting hier: Die Seite fragt erst („Jetzt neu laden“).
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('thetadex-') && k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Die Seite schickt diese Nachricht, wenn die Person „Jetzt neu laden“ tippt.
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

// Nur eigene Dateien aus dem Zwischenspeicher. Anfragen an die Google-Skripte gehen immer ins Netz.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((res) => res || fetch(e.request))
  );
});
