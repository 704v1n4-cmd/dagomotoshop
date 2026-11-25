# Dagomotoshop — application de vente (version 1)

Application web installable (PWA) : elle s'ouvre dans le navigateur et s'installe comme une appli sur Android et iPhone. HTML, CSS et JavaScript simples, sans framework, hébergement gratuit.

## Ce qui marche dans la version 1

- Accueil, catalogue (3 rayons, recherche, tri par prix), fiche produit, favoris.
- Panier : quantités, retrait boutique ou livraison Tana, code promo (`DAGO5` pour l'essai), total en Ariary et en Fmg.
- Connexion avec **Facebook**, **Google** ou **un lien reçu par e-mail** (en démo, les boutons connectent sans vrai compte).
- Le **numéro de téléphone** est demandé au paiement pour que la boutique rappelle le client, sans code SMS.
- Paiement (MVola, Orange Money ou espèces), confirmation avec code de retrait, suivi de commande en 4 étapes, compte client avec carte fidélité.
- Fonctionne hors connexion une fois installée.

**Limite actuelle :** le panier, le compte et les commandes sont enregistrés **sur le téléphone du client** seulement. La boutique ne reçoit pas encore les commandes. C'est l'étape Firebase ci-dessous.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page de l'app |
| `donnees.js` | **Ta boutique et tes produits** : nom, téléphone, WhatsApp, horaires, frais de livraison, codes promo, catalogue |
| `app.js` | Fonctionnement des écrans |
| `styles.css` | Couleurs et mise en page (noir `#0E0F0D`, vert lime `#5BE52B`) |
| `manifest.webmanifest`, `sw.js` | Installation sur le téléphone et mode hors connexion |
| `img/` | Logo, icônes et photos |

## 1. Mettre tes vrais produits

Ouvre `donnees.js` et remplace :
- dans `boutique` : `telephone`, `whatsapp` (format `2613XXXXXXXX`), `horaires`, `fraisLivraison` ;
- dans `produits` : un bloc par produit. Les prix sont en Ariary, sans espaces (`3800000`). `ancienPrix` et `badge` sont facultatifs. Mets `vedette: true` pour faire apparaître le produit dans « Offres du moment ».

Photos : sur fond blanc ou gris clair uni, sans ombre au sol, puis détourées (fond transparent, format PNG) pour l'effet « qui sort du cadre ». Place-les dans `img/` et indique le chemin dans `img: 'img/mon-scooter.png'`.

## 2. Mettre en ligne gratuitement (GitHub Pages)

1. Crée un compte sur github.com, puis un dépôt public nommé par exemple `dagomotoshop`.
2. « Add file » → « Upload files » : glisse **tout le contenu** du dossier (pas le dossier lui-même), puis « Commit ».
3. « Settings » → « Pages » → Source : `main` / `(root)` → « Save ».
4. Au bout d'une minute, l'app est en ligne à `https://TON-COMPTE.github.io/dagomotoshop/`.
5. Sur le téléphone, ouvre ce lien dans Chrome → menu ⋮ → « Installer l'application » (sur iPhone : Safari → Partager → « Sur l'écran d'accueil »).

À chaque mise à jour, change `VERSION` dans `sw.js` (`dms-v5`, `dms-v6`…) et le numéro `?v=` des fichiers dans `index.html` et `sw.js`, pour que les téléphones prennent la nouvelle version.

## 3. Étape suivante : Firebase (gratuit au départ)

Pour que **la boutique reçoive les commandes** et que le catalogue se mette à jour sans republier :
1. Va sur console.firebase.google.com avec ton compte Google → « Créer un projet » → « Dagomotoshop ».
2. Ajoute une « application Web » et copie le bloc `firebaseConfig` qui s'affiche.
3. Active **Firestore Database** (produits, commandes) et, dans **Authentication**, les méthodes **Google**, **Facebook** et **Adresse e-mail / Lien par e-mail**. Pour Facebook, il faut aussi créer une app sur developers.facebook.com.
4. Envoie-moi le bloc `firebaseConfig` : je branche l'app dessus et je crée l'espace gérant (ajouter un produit, changer un prix, faire avancer le statut d'une commande, qui enverra la notification au client).

Note : Facebook, Google et l'e-mail sont gratuits. La vérification par SMS est possible plus tard (environ 0,31 $ par SMS à Madagascar, forfait Blaze), si des fausses réservations apparaissent.

## En ligne

- Dépôt GitHub : https://github.com/704v1n4-cmd/dagomotoshop (branche `main`)
- App en ligne (GitHub Pages) : https://704v1n4-cmd.github.io/dagomotoshop/
