/* Filet de sécurité : si l'app ne s'affiche pas (vieille version en mémoire, réseau coupé
   pendant une mise à jour…), on propose de tout recharger proprement au lieu d'une page blanche. */
(function () {
  function reparer() {
    var fini = function () { location.reload(); };
    var etapes = [];
    try { if (navigator.serviceWorker) etapes.push(navigator.serviceWorker.getRegistrations().then(function (r) { return Promise.all(r.map(function (x) { return x.unregister(); })); })); } catch (e) {}
    try { if (window.caches) etapes.push(caches.keys().then(function (k) { return Promise.all(k.map(function (n) { return caches.delete(n); })); })); } catch (e) {}
    Promise.all(etapes).then(fini, fini);
  }
  function afficher() {
    var app = document.getElementById('app');
    if (!app || (app.children.length && !app.querySelector('[data-charge]'))) return;
    app.innerHTML = '<div class="secours"><b style="font-size:18px">L’application n’a pas pu s’ouvrir</b>'
      + '<span style="color:#71717A;font-size:14px;max-width:300px">Une ancienne version est peut-être restée sur ce téléphone, ou la connexion a coupé.</span>'
      + '<button type="button" id="reparer">Recharger l’application</button></div>';
    document.getElementById('reparer').addEventListener('click', reparer);
  }
  window.addEventListener('error', function () { setTimeout(afficher, 300); });
  window.addEventListener('load', function () { setTimeout(afficher, 4000); });
})();
