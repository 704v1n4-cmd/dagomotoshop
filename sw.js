/* Service worker : garde l'app disponible hors connexion.
   Change VERSION à chaque mise en ligne pour que les téléphones prennent la nouvelle version. */
const VERSION = 'dms-v29';
const FICHIERS = ['./', 'index.html', 'styles.css?v=28', 'app.js?v=28', 'donnees.js?v=28', 'icones.js?v=28', 'manifest.webmanifest?v=22', 'img/icone-192.png', 'img/icone-512.png', 'secours.js?v=20', 'polices/manrope-latin-wght-normal.woff2',
  'img/logo.jpg', 'img/scooter.webp', 'img/cygnus-1.webp', 'img/cygnus-2.webp', 'img/cygnus-3.webp', 'img/rs-zero.webp', 'img/cygnus-4.webp', 'img/kymco-g6.webp', 'img/pgo-bon.webp', 'img/kymco-vjr-110.webp', 'img/kymco-vjr-125.webp', 'img/kymco-g5.webp', 'img/pgo-jbubu.webp', 'img/kymco-gp.webp', 'img/kymco-gp2.webp', 'img/sym-jet-sr.webp', 'img/sym-jet-evo.webp', 'img/kymco-new-many.webp', 'img/pgo-tigra.webp', 'img/casque.webp', 'img/pieces.webp', 'img/icone-192.png', 'img/icone-512.png'];

self.addEventListener('install', (e) => {
  /* Un fichier manquant ne doit pas bloquer l'installation : on met en cache ce qui répond. */
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(FICHIERS.map((f) => c.add(f).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Réseau d'abord (pour avoir les nouveaux prix), cache si pas de connexion.
   La page d'accueil sert de secours uniquement pour une navigation, jamais à la place d'un script ou d'une image. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(req)
      .then((r) => { if (r.ok) { const copie = r.clone(); caches.open(VERSION).then((c) => c.put(req, copie)); } return r; })
      .catch(() => caches.match(req).then((r) => r || caches.match(req, { ignoreSearch: true })).then((r) => {
        if (r) return r;
        if (req.mode === 'navigate') return caches.match('index.html');
        return new Response('', { status: 504 });
      }))
  );
});
