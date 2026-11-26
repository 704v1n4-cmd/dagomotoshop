/* Service worker : garde l'app disponible hors connexion.
   Change VERSION à chaque mise en ligne pour que les téléphones prennent la nouvelle version. */
const VERSION = 'dms-v54';
const FICHIERS = ['./', 'index.html', 'styles.css?v=45', 'app.js?v=48', 'donnees.js?v=44', 'icones.js?v=28', 'icones-pieces.js?v=2', 'avatars.js?v=1', 'manifest.webmanifest?v=22', 'img/icone-192.png', 'img/icone-512.png', 'secours.js?v=20', 'polices/manrope-latin-wght-normal.woff2', 'img/logo.jpg', 'img/motif-pieces.svg', 'img/motif-pieces-sombre.svg'];
/* Les photos vont dans un cache à part, gardé d'une version à l'autre : chaque photo n'est téléchargée qu'une fois.
   Une photo modifiée change d'adresse (?v=…), elle est donc retéléchargée automatiquement. */
const IMAGES = 'dms-images-1';

self.addEventListener('install', (e) => {
  /* Un fichier manquant ne doit pas bloquer l'installation : on met en cache ce qui répond. */
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(FICHIERS.map((f) => c.add(f).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION && k !== IMAGES).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Réseau d'abord (pour avoir les nouveaux prix), cache si pas de connexion.
   La page d'accueil sert de secours uniquement pour une navigation, jamais à la place d'un script ou d'une image. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  /* Photos : cache d'abord (affichage immédiat), réseau seulement la première fois. */
  if (/\/img\/.+\.(webp|png|jpg|svg)(\?|$)/.test(req.url)) {
    e.respondWith(caches.open(IMAGES).then((c) => c.match(req).then((r) => r || fetch(req).then((n) => { if (n.ok) c.put(req, n.clone()); return n; }).catch(() => c.match(req, { ignoreSearch: true }).then((x) => x || new Response('', { status: 504 }))))));
    return;
  }
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
