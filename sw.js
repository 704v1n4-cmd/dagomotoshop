/* Service worker : garde l'app disponible hors connexion.
   Change VERSION à chaque mise en ligne pour que les téléphones prennent la nouvelle version. */
const VERSION = 'dms-v18';
const FICHIERS = ['./', 'index.html', 'styles.css?v=14', 'app.js?v=14', 'donnees.js?v=14', 'icones.js?v=14', 'manifest.webmanifest',
  'img/logo.jpg', 'img/scooter.webp', 'img/cygnus-1.webp', 'img/cygnus-2.webp', 'img/cygnus-3.webp', 'img/rs-zero.webp', 'img/cygnus-4.webp', 'img/kymco-g6.webp', 'img/pgo-bon.webp', 'img/kymco-vjr-110.webp', 'img/kymco-vjr-125.webp', 'img/kymco-g5.webp', 'img/pgo-jbubu.webp', 'img/kymco-gp.webp', 'img/kymco-gp2.webp', 'img/sym-jet-sr.webp', 'img/sym-jet-evo.webp', 'img/kymco-new-many.webp', 'img/pgo-tigra.webp', 'img/casque.webp', 'img/pieces.webp', 'img/icone-192.png', 'img/icone-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Réseau d'abord (pour avoir les nouveaux prix), cache si pas de connexion. */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copie = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copie)); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
