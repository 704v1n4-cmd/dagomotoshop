/* Service worker : garde l'app disponible hors connexion.
   Change VERSION à chaque mise en ligne pour que les téléphones prennent la nouvelle version. */
const VERSION = 'dms-v16';
const FICHIERS = ['./', 'index.html', 'styles.css?v=14', 'app.js?v=14', 'donnees.js?v=14', 'icones.js?v=14', 'manifest.webmanifest',
  'img/logo.jpg', 'img/scooter.png', 'img/cygnus-1.png', 'img/cygnus-2.png', 'img/cygnus-3.png', 'img/rs-zero.png', 'img/cygnus-4.png', 'img/kymco-g6.png', 'img/pgo-bon.png', 'img/kymco-vjr-110.png', 'img/kymco-vjr-125.png', 'img/kymco-g5.png', 'img/pgo-jbubu.png', 'img/kymco-gp.png', 'img/kymco-gp2.png', 'img/sym-jet-sr.png', 'img/sym-jet-evo.png', 'img/kymco-new-many.png', 'img/pgo-tigra.png', 'img/casque.png', 'img/pieces.png', 'img/icone-192.png', 'img/icone-512.png'];

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
