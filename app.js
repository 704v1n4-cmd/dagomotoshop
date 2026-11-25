/* Dagomotoshop — application de vente (version 1, HTML + JavaScript sans framework).
   Navigation par ancre : #accueil, #catalogue, #catalogue-pieces, #produit-<id>, #panier,
   #connexion, #paiement, #confirmation-<code>, #suivi-<code>, #compte. */
{
  const D = window.DMS_DONNEES;
  const B = D.boutique;
  const $app = document.getElementById('app');
  const $nav = document.getElementById('nav');
  const $toast = document.getElementById('toast');

  /* ---------- Stockage local (panier, compte, commandes) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('dms_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('dms_' + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  };
  let panier = store.get('panier', {});
  let client = store.get('client', null);
  let commandes = store.get('commandes', []);
  let favoris = store.get('favoris', []);
  let recentes = store.get('recentes', []);
  const memoRecherche = (t) => { t = t.trim(); if (t.length < 2) return; recentes = [t].concat(recentes.filter((r) => r.toLowerCase() !== t.toLowerCase())).slice(0, 5); store.set('recentes', recentes); };
  const ui = { cat: 'scooters', recherche: '', tri: 'asc', mode: 'boutique', promoSaisie: '', promo: null, promoMsg: '',
    paiement: 'mvola', f: { prix: null, cyl: null, promo: null, stock: null }, taille: '', tailleErreur: false, produitVu: '', telCmd: null, telErreur: '', email: '', emailErreur: '', emailEnvoye: '', retour: 'compte' };
  const sauver = () => { store.set('panier', panier); store.set('client', client); store.set('commandes', commandes); store.set('favoris', favoris); };

  /* ---------- Outils ---------- */
  const pl = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const grp = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const ar = (n) => grp(n) + ' Ar';
  const fmg = (n) => grp(n * 5) + ' Fmg';
  const produit = (id) => D.produits.find((p) => p.id === id);
  const nbPanier = () => Object.values(panier).reduce((s, q) => s + q, 0);
  const img = (p, cls) => `<img src="${p.img}" alt="${esc(p.nom)}" class="sq ${cls || ''}${p.rond ? ' rondimg' : ''}" loading="lazy">`;
  /* Panier : la clé est l'id du produit, suivie de @taille quand il y en a une (ex. casque-jet@L). */
  const decoupe = (cle) => { const [id, taille] = cle.split('@'); return { id, taille: taille || '' }; };
  const choixDe = (p) => p.tailles ? { titre: 'Taille', aide: 'Tour de tête en cm', erreur: 'Choisissez une taille', liste: p.tailles } : p.versions ? { titre: 'Version', aide: 'Moteur et équipement', erreur: 'Choisissez une version', liste: p.versions } : null;
  const prixTxt = (p) => p.prix ? ar(p.prix) : 'Prix sur demande';
  const waPrix = (p) => `https://wa.me/${B.whatsapp}?text=${encodeURIComponent('Bonjour, quel est le prix du ' + p.nom + (ui.taille && p.versions ? ' ' + ui.taille : '') + ' (' + p.detail + ') ?')}`;
  const stockTxt = (p) => p.stock == null ? '' : p.stock <= 0 ? 'Sur commande' : p.stock <= 2 ? `Plus que ${p.stock} en stock` : 'En stock';
  const I = window.DMS_ICONES || {};
  const ic = (n, s = 20, extra = '') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${/fill=/.test(extra) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra.replace(/fill="[^"]*"/, '')}>${I[n] || ''}</svg>`;
  const rondPanier = () => `<a href="#panier" class="rond" aria-label="Panier, ${pl(nbPanier(), 'article')}">${ic('panier')}${nbPanier() ? `<span class="pastille">${nbPanier()}</span>` : ''}</a>`;
  const entete = (titre, retour, droite = '') => `<div class="ligne entre"><a href="#${retour}" class="rond" aria-label="Retour">${ic('retour')}</a><h1 class="h2">${titre}</h1>${droite || '<span style="width:44px"></span>'}</div>`;
  let toastT;
  const toast = (t) => { $toast.textContent = t; $toast.classList.add('vu'); clearTimeout(toastT); toastT = setTimeout(() => $toast.classList.remove('vu'), 1800); };

  function totaux() {
    const lignes = Object.entries(panier).map(([cle, q]) => { const d = decoupe(cle); return { cle, p: produit(d.id), taille: d.taille, q }; }).filter((l) => l.p && l.q > 0);
    const sous = lignes.reduce((s, l) => s + l.p.prix * l.q, 0);
    const remise = ui.promo ? Math.round(sous * D.codesPromo[ui.promo] / 1000) * 1000 : 0;
    const livraison = ui.mode === 'livraison' && lignes.length ? B.fraisLivraison : 0;
    return { lignes, sous, remise, livraison, total: sous - remise + livraison, n: lignes.reduce((s, l) => s + l.q, 0) };
  }
  const recap = (t) => `<div class="carte col recap" style="gap:7px">
    <div><span class="petit" style="font-size:14px">Sous-total</span><span class="nw">${ar(t.sous)}</span></div>
    <div><span class="petit" style="font-size:14px">Remise${ui.promo ? ' (' + ui.promo + ')' : ''}</span><span class="nw">${t.remise ? '- ' + ar(t.remise) : '0 Ar'}</span></div>
    <div><span class="petit" style="font-size:14px">${ui.mode === 'livraison' ? 'Livraison Tana' : 'Retrait boutique'}</span><span class="nw">${t.livraison ? ar(t.livraison) : 'Gratuit'}</span></div>
    <div class="total"><span>Total</span><span class="col" style="align-items:flex-end"><span class="prix" style="font-size:18px">${ar(t.total)}</span><span class="petit nw">soit ${fmg(t.total)}</span></span></div></div>`;

  /* ---------- Écrans ---------- */
  const V = {};

  V.accueil = () => {
    const vedettes = D.produits.filter((p) => p.vedette);
    return `<div class="ecran">
    <div class="ligne"><img src="img/logo.jpg" alt="Dagomotoshop" style="width:46px;height:46px;border-radius:10px">
      <div class="col" style="flex:1"><span class="petit" style="font-size:13px">Manao ahoana !</span><b style="font-size:17px;font-weight:600">${B.nom}</b></div>
      <a class="rond" href="https://wa.me/${B.whatsapp}" target="_blank" rel="noopener" aria-label="Écrire à la boutique sur WhatsApp">${ic('bulle')}</a></div>
    <div class="banniere"><div class="fond"></div>
      <img class="moto" src="img/cygnus-3.webp" alt="">
      <div class="txt"><b>Roulez plus loin,<br><span>payez moins.</span></b><span class="sous">Yamaha, Kymco, SYM et PGO révisés, pièces et casques.</span><a href="#catalogue">Voir le catalogue</a></div></div>
    <form class="champ" data-form="recherche" role="search">${ic('loupe', 18, 'style="color:var(--muted)"')}<input type="search" name="q" placeholder="Scooter, pièce, casque…" aria-label="Rechercher un produit"></form>
    <div class="defile" aria-label="Rayons">${D.categories.map((c) => `<a class="puce" href="#catalogue-${c.id}">${ic(c.icone, 18)}${c.nom}</a>`).join('')}</div>
    <div class="ligne entre"><h2 class="h2">Offres du moment</h2><a href="#catalogue" class="petit ligne" style="font-size:13px;font-weight:500;gap:2px;min-height:44px">Tout voir${ic('fleche', 16)}</a></div>
    <div class="offres">${vedettes.map((p, i) => `<a href="#produit-${p.id}" class="offre${i === 0 ? ' noire' : ''}">
      ${img(p, 'vis')}${p.badge ? `<span class="sticker">${esc(p.badge)}</span>` : ''}
      <span class="petit">${esc(p.detail)}</span><b style="font-size:${i === 0 ? 17 : 16}px;font-weight:600">${esc(p.nom)}</b>
      <span class="ligne" style="gap:8px;align-items:baseline"><span class="prix">${prixTxt(p)}</span>${p.ancienPrix ? `<span class="barre">${grp(p.ancienPrix)}</span>` : ''}</span></a>`).join('')}</div>
  </div>`;
  };

  const carteProd = (p) => `<div class="prod">
    <a href="#produit-${p.id}" class="col" style="gap:3px"><span class="boite sq-att">${img(p)}</span>${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
    <b style="font-size:14px;font-weight:600;margin-top:6px">${esc(p.nom)}</b><span class="petit">${esc(p.detail)}</span></a>
    <div class="ligne entre" style="margin-top:4px"><span class="prix">${prixTxt(p)}</span>
    ${!p.prix ? `<a class="ajout" href="#produit-${p.id}" aria-label="Voir ${esc(p.nom)}">${ic('fleche', 16)}</a>` : p.tailles ? `<a class="ajout" href="#produit-${p.id}" aria-label="Choisir la taille de ${esc(p.nom)}">${ic('plus', 16)}</a>` : `<button class="ajout" data-a="ajouter" data-id="${p.id}" aria-label="Ajouter ${esc(p.nom)} au panier">${ic('plus', 16)}</button>`}</div>
    ${p.stock != null && p.stock <= 2 ? `<span class="stock${p.stock <= 0 ? ' rupture' : ''}">${stockTxt(p)}</span>` : ''}</div>`;
  const TRANCHES = { scooters: [['-3500000', 'Moins de 3,5 M'], ['3500000-4500000', '3,5 à 4,5 M'], ['4500000-', 'Plus de 4,5 M']],
    autre: [['-20000', 'Moins de 20 000'], ['20000-100000', '20 000 à 100 000'], ['100000-', 'Plus de 100 000']] };
  const nbFiltres = () => (ui.f.prix ? 1 : 0) + (ui.f.cyl ? 1 : 0) + (ui.f.promo ? 1 : 0) + (ui.f.stock ? 1 : 0);
  const passeFiltres = (p) => {
    if (ui.f.prix && !p.prix) return false;
    if (ui.f.prix) { const [a, b] = ui.f.prix.split('-'); if (a && p.prix < +a) return false; if (b && p.prix >= +b) return false; }
    if (ui.f.cyl && ![].concat(p.cylindree).includes(+ui.f.cyl)) return false;
    if (ui.f.promo && !p.ancienPrix) return false;
    if (ui.f.stock && !(p.stock > 0)) return false;
    return true;
  };
  const listeCatalogue = () => {
    const q = ui.recherche.trim().toLowerCase();
    let l = D.produits.filter((p) => (q ? (p.nom + ' ' + p.detail).toLowerCase().includes(q) : p.cat === ui.cat) && passeFiltres(p));
    l = l.slice().sort((a, b) => { const x = a.prix || (ui.tri === 'asc' ? Infinity : -1), y = b.prix || (ui.tri === 'asc' ? Infinity : -1); return ui.tri === 'asc' ? x - y : y - x; });
    return { l, q };
  };
  const grilleHtml = () => {
    const { l, q } = listeCatalogue();
    return `<p class="petit" style="margin:0;font-size:13px"><b style="color:var(--ink)">${l.length}</b> résultat${l.length > 1 ? 's' : ''}${q ? ` pour « ${esc(ui.recherche)} »` : ''}</p>
      ${l.length ? `<div class="grille">${l.map(carteProd).join('')}</div>` : `<div class="carte col vide"><b>Aucun produit trouvé</b><span class="petit">Essayez un autre mot ou retirez un filtre. Nous commandons aussi sur demande.</span>${nbFiltres() ? '<button class="btn clair" data-a="filtres-raz" style="height:46px;margin-top:6px">Retirer les filtres</button>' : ''}</div>`}`;
  };
  V.catalogue = (cat) => {
    if (cat && D.categories.some((c) => c.id === cat)) ui.cat = cat;
    return `<div class="ecran">
    <div class="ligne entre"><h1 class="titre">Catalogue</h1>${rondPanier()}</div>
    <label class="champ">${ic('loupe', 18, 'style="color:var(--muted)"')}<input type="search" data-in="recherche" value="${esc(ui.recherche)}" placeholder="Rechercher dans le catalogue" aria-label="Rechercher dans le catalogue"></label>
    <div role="tablist" aria-label="Rayons" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;background:var(--card);border-radius:999px;padding:4px">
      ${D.categories.map((c) => `<button role="tab" class="puce" style="justify-content:center;border:none;height:40px" aria-selected="${!ui.recherche && ui.cat === c.id}" data-a="cat" data-id="${c.id}">${ic(c.icone, 18)}${c.nom}</button>`).join('')}</div>
    ${ui.recherche ? '' : `<div class="defile" aria-label="Recherches suggérées"><span class="petit nw" style="align-self:center;flex-shrink:0">${recentes.length ? 'Récentes :' : 'Populaires :'}</span>${(recentes.length ? recentes : ['Cygnus', 'G6', 'GP', 'SYM Jet', 'VJR', 'PGO']).map((r) => `<button class="puce" style="height:34px" data-a="suggestion" data-id="${esc(r)}">${esc(r)}</button>`).join('')}</div>`}
    <div class="ligne entre"><button class="puce" data-a="filtres" aria-haspopup="dialog" style="${nbFiltres() ? 'background:var(--sel);color:var(--sel-txt);border-color:var(--sel)' : ''}">${ic('filtres', 18)}Filtres${nbFiltres() ? ` · ${nbFiltres()}` : ''}</button>
      <label class="sr" for="tri">Trier par</label><select id="tri" data-in="tri" style="height:40px;border-radius:999px;border:1px solid var(--line);background:var(--card);padding:0 12px;font-size:14px">
        <option value="asc"${ui.tri === 'asc' ? ' selected' : ''}>Prix croissant</option><option value="desc"${ui.tri === 'desc' ? ' selected' : ''}>Prix décroissant</option></select></div>
    <div id="grille" class="col" style="gap:4px">${grilleHtml()}</div></div>`;
  };

  const similaires = (p) => {
    const l = D.produits.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 6);
    if (!l.length) return '';
    return `<div class="col" style="gap:8px"><div class="ligne entre"><h2 class="h2" style="font-size:15px">Vous aimerez aussi</h2><a href="#catalogue-${p.cat}" class="petit" style="font-size:13px;min-height:40px;display:flex;align-items:center">Tout voir</a></div>
      <div class="defile" style="gap:10px">${l.map((x) => `<a href="#produit-${x.id}" class="mini"><span class="boite sq-att">${img(x)}</span><b>${esc(x.nom)}</b><span class="prix">${prixTxt(x)}</span></a>`).join('')}</div></div>`;
  };
  V.produit = (id) => {
    const p = produit(id);
    if (ui.produitVu !== id) { ui.produitVu = id; ui.taille = ''; ui.tailleErreur = false; }
    const choix = p ? choixDe(p) : null;
    if (!p) return V.introuvable();
    const fav = favoris.includes(p.id);
    const eco = p.ancienPrix ? p.ancienPrix - p.prix : 0;
    return `<div class="ecran" style="padding-top:0">
    <div class="hero"><span class="fili" aria-hidden="true">${esc(p.specs ? p.specs[0][0] : D.categories.find((c) => c.id === p.cat).nom)}</span>
      <div class="ligne entre" style="position:relative;z-index:4"><button class="rond" data-a="retour" aria-label="Retour">${ic('retour')}</button>
      <span class="ligne" style="gap:10px"><button class="rond${fav ? ' lime' : ''}" data-a="favori" data-id="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${ic('coeur', 20, fav ? 'fill="currentColor"' : '')}</button>
      <button class="rond" data-a="partager" data-id="${p.id}" aria-label="Partager">${ic('partage')}</button></span></div></div>
    ${img(p, 'hero-img')}
    <div class="dessus">
      <div class="carte col" style="gap:6px;padding-top:${p.rond ? 30 : 46}px">
        <h1 class="h2" style="font-size:21px">${esc(p.nom)}</h1><span class="petit" style="font-size:13px">${esc(p.detail)}</span>
        <div class="ligne" style="gap:8px;flex-wrap:wrap"><span class="prix" style="font-size:22px;font-weight:600">${prixTxt(p)}</span>
        ${p.ancienPrix ? `<span class="barre" style="font-size:13px">${grp(p.ancienPrix)}</span><span class="badge" style="background:var(--lime-soft);color:var(--ok)">-${grp(eco)} Ar</span>` : ''}</div>
        <span class="petit">${p.prix ? `soit ${fmg(p.prix)} · paiement MVola, Orange Money ou espèces` : 'Écrivez-nous pour le prix, l\u2019année et le kilométrage.'}</span>${p.photoProvisoire ? '<span class="petit" style="font-style:italic">Photo non contractuelle</span>' : ''}
        ${p.stock != null ? `<span class="stock${p.stock <= 0 ? ' rupture' : p.stock > 2 ? ' ok' : ''}" style="align-self:flex-start;margin-top:4px">${stockTxt(p)}</span>` : ''}</div>
      ${choix ? `<div class="carte col" style="gap:8px"><div class="ligne entre"><h2 class="h2" style="font-size:15px">${choix.titre}</h2><span class="petit" role="status" style="color:${ui.tailleErreur ? 'var(--err)' : 'var(--muted)'}">${ui.tailleErreur ? choix.erreur : choix.aide}</span></div>
        <div class="seg" role="radiogroup" aria-label="${choix.titre}" style="grid-template-columns:repeat(${Math.min(choix.liste.length, 4)},minmax(0,1fr))">${choix.liste.map(([t, cm]) => `<button role="radio" aria-checked="${ui.taille === t}" aria-pressed="${ui.taille === t}" data-a="taille" data-id="${esc(t)}"><b>${esc(t)}</b>${cm ? `<span class="petit" style="font-size:11px">${esc(cm)}</span>` : ''}</button>`).join('')}</div></div>` : ''}
      ${p.specs ? `<div class="specs">${p.specs.map(([v, l]) => `<div><b>${esc(v)}</b><span class="petit" style="font-size:11px">${esc(l)}</span></div>`).join('')}</div>` : ''}
      <div class="carte ligne entre petit" style="padding:12px 16px;font-size:13px;flex-wrap:wrap;gap:8px"><span class="ligne" style="gap:8px">${ic('pin', 18)}Retrait ${esc(B.delaiRetrait)}</span><span class="ligne" style="gap:8px">${ic('horloge', 18)}${esc(B.horaires)}</span></div>
      <div class="carte col" style="gap:6px"><h2 class="h2" style="font-size:15px">Description</h2><p class="petit" style="margin:0;font-size:13px;line-height:1.5">${esc(p.description)}</p></div>
      ${similaires(p)}
      <div class="carte ligne" style="padding:12px 16px"><img src="img/logo.jpg" alt="" style="width:44px;height:44px;border-radius:10px">
        <div class="col" style="flex:1"><b style="font-weight:600">${B.nom}</b><span class="petit">${esc(B.ville)} · ${esc(B.telephone)}</span></div>
        <a class="rond lime" href="tel:${B.telephone.replace(/\s/g, '')}" aria-label="Appeler la boutique au ${esc(B.telephone)}">${ic('tel')}</a></div>
    </div></div>
    <div class="basbar">${rondPanier().replace('class="rond"', 'class="rond" style="width:54px;height:54px;background:var(--bg)"')}
      ${p.prix ? `<button class="btn" data-a="ajouter" data-id="${p.id}"${p.stock === 0 ? ' disabled' : ''}>${p.stock === 0 ? 'Sur commande : appelez-nous' : 'Ajouter au panier'}</button>` : `<a class="btn" style="background:#1FAF5A;color:#fff" href="${waPrix(p)}" target="_blank" rel="noopener">${ic('bulle', 20)}Demander le prix</a>`}</div>`;
  };

  V.panier = () => {
    const t = totaux();
    const tete = entete(`Mon panier <span class="petit" style="font-size:17px">(${t.n})</span>`, 'catalogue', t.n ? '<button data-a="vider" style="height:44px;padding:0 4px;font-size:13px;font-weight:500;color:var(--muted)">Vider</button>' : '');
    if (!t.n) return `<div class="ecran">${tete}<div class="carte col vide"><span class="rond" style="width:64px;height:64px;background:var(--lime-soft)">${ic('panier', 28)}</span>
      <b style="font-size:17px">Votre panier est vide</b><span class="petit" style="font-size:13px">Parcourez les scooters, pièces et casques du catalogue.</span>
      <a href="#catalogue" class="btn" style="width:auto;padding:0 22px;height:48px;margin-top:6px">Voir le catalogue</a></div></div>`;
    return `<div class="ecran">${tete}
    <div class="carte" style="padding:4px 14px">${t.lignes.map(({ cle, p, q, taille }) => `<div class="article">
      <a href="#produit-${p.id}" class="vign sq-att">${img(p)}</a>
      <div class="col" style="flex:1;gap:1px"><b style="font-size:14px;font-weight:600">${esc(p.nom)}</b><span class="petit">${esc(p.detail)}${taille ? (p.tailles ? ' · Taille ' : ' · ') + esc(taille) : ''}</span><span class="prix" style="font-size:14px;margin-top:2px">${ar(p.prix * q)}</span></div>
      <div class="pas"><button data-a="moins" data-id="${esc(cle)}" aria-label="${q === 1 ? 'Retirer' : 'Diminuer la quantité de'} ${esc(p.nom)}">${ic('moins', 16)}</button><span aria-live="polite">${q}</span>
      <button class="plus" data-a="plus" data-id="${esc(cle)}" aria-label="Augmenter la quantité de ${esc(p.nom)}">${ic('plus', 16)}</button></div></div>`).join('')}</div>
    <div class="choix" role="radiogroup" aria-label="Mode de retrait">
      <button class="opt" role="radio" aria-checked="${ui.mode === 'boutique'}" data-a="mode" data-id="boutique"><b style="font-size:14px;font-weight:600">Retrait boutique</b><span class="petit">Gratuit · ${esc(B.ville)}</span></button>
      <button class="opt" role="radio" aria-checked="${ui.mode === 'livraison'}" data-a="mode" data-id="livraison"><b style="font-size:14px;font-weight:600">Livraison Tana</b><span class="petit">${ar(B.fraisLivraison)} · sous 48 h</span></button></div>
    <form class="col" style="gap:6px" data-form="promo"><label class="lib" for="promo">Code promo</label>
      <div class="ligne" style="gap:8px"><input id="promo" class="saisie" data-in="promo" value="${esc(ui.promoSaisie)}" placeholder="Ex. DAGO5" autocapitalize="characters" style="flex:1">
      <button class="btn" style="width:auto;height:50px;padding:0 16px;border-radius:14px;font-size:14px">Appliquer</button></div>
      <span role="status" class="petit" style="color:${ui.promo ? 'var(--ok)' : ui.promoMsg ? 'var(--err)' : 'var(--muted)'}">${esc(ui.promoMsg)}</span></form>
    ${recap(t)}</div>
    <div class="basbar transp"><button class="btn" data-a="commander">Commander · <span class="nw">${ar(t.total)}</span></button></div>`;
  };

  const LOGO_FB = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.09 24 12.07z"/></svg>';
  const LOGO_G = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  const DEMO = !D.firebaseConfig;
  V.connexion = () => `<div class="ecran" style="padding-top:0">
    <div class="hero" style="height:240px"><a href="#${ui.retour === 'paiement' ? 'panier' : 'compte'}" class="rond" style="position:relative;background:var(--fort-ghost);color:var(--fort-txt)" aria-label="Retour">${ic('retour')}</a>
      <img src="img/logo.jpg" alt="Dagomotoshop" style="position:relative;width:60px;height:60px;border-radius:14px;margin-top:14px">
      <p style="position:relative;color:var(--fort-txt);font-weight:700;font-size:22px;line-height:1.2;max-width:210px;margin:12px 0 0">${ui.retour === 'paiement' ? 'Plus qu’une étape avant votre <span class="surl">réservation.</span>' : 'Retrouvez vos <span class="surl">commandes.</span>'}</p></div>
    <img src="img/scooter.webp" alt="" style="position:absolute;z-index:3;right:-26px;top:calc(100px + env(safe-area-inset-top));width:176px;filter:drop-shadow(0 14px 14px rgba(0,0,0,.45))">
    <div class="dessus" style="gap:12px;padding-top:22px">
      <div class="col" style="gap:4px"><h1 class="h2" style="font-size:20px">Connectez-vous</h1><span class="petit" style="font-size:13px">En un clic, sans mot de passe.</span></div>
      <button class="btn fb" data-a="cnx" data-id="facebook">${LOGO_FB}Continuer avec Facebook</button>
      <button class="btn clair google" data-a="cnx" data-id="google">${LOGO_G}Continuer avec Google</button>
      <div class="ou"><span>ou par e-mail</span></div>
      ${ui.emailEnvoye ? `<div class="carte col" style="gap:10px"><div class="ligne" style="gap:10px;align-items:flex-start"><span class="rond lime" style="width:36px;height:36px">${ic('check', 18)}</span>
        <span style="font-size:14px">Lien envoyé à <b>${esc(ui.emailEnvoye)}</b>. Ouvrez votre boîte mail et touchez le lien pour vous connecter.</span></div>
        ${DEMO ? `<button class="btn" data-a="cnx" data-id="email" style="height:48px;font-size:15px">Démo : ouvrir le lien</button>` : ''}
        <button data-a="email-autre" class="petit" style="min-height:40px;font-size:13px;font-weight:600;text-decoration:underline;color:var(--ink)">Utiliser une autre adresse</button></div>`
      : `<form class="col" style="gap:6px" data-form="email" novalidate><label class="lib" for="email">Adresse e-mail</label>
        <input id="email" class="saisie" type="email" inputmode="email" autocomplete="email" data-in="email" value="${esc(ui.email)}" placeholder="nom@exemple.com" aria-describedby="email-aide">
        <span id="email-aide" class="petit" style="color:${ui.emailErreur ? 'var(--err)' : 'var(--muted)'}">${esc(ui.emailErreur || 'Nous vous envoyons un lien de connexion, rien à retenir.')}</span>
        <button class="btn clair" style="margin-top:4px">Recevoir le lien de connexion</button></form>`}
      ${DEMO ? '<p class="demo" style="margin:0">Version de démonstration : les boutons vous connectent sans vrai compte. Facebook, Google et l’e-mail fonctionneront dès que Firebase sera branché.</p>' : ''}
      <p class="petit" style="text-align:center;font-size:11px;margin:2px 0 0">En continuant, vous acceptez les conditions de vente de ${B.nom}.</p>
    </div></div>`;

  const notesPaiement = { mvola: 'Vous recevrez une demande de paiement MVola sur votre téléphone après confirmation.', orange: 'Vous recevrez une demande de paiement Orange Money sur votre téléphone après confirmation.', especes: 'Vous payez en espèces à la boutique, au moment du retrait.' };
  V.paiement = () => {
    const t = totaux();
    if (!t.n) { location.hash = 'panier'; return ''; }
    if (!client) { ui.retour = 'paiement'; location.hash = 'connexion'; return ''; }
    return `<div class="ecran">${entete('Paiement', 'panier')}
    <div class="carte col" style="gap:10px"><h2 class="h2" style="font-size:15px">Votre commande</h2>
      ${t.lignes.map(({ p, q, taille }) => `<div class="ligne"><span class="vign" style="width:48px;height:48px;border-radius:12px">${img(p)}</span><span style="flex:1;font-size:14px">${esc(p.nom)}${taille ? ' (' + esc(taille) + ')' : ''} <span class="petit">× ${q}</span></span><span class="prix" style="font-size:14px">${ar(p.prix * q)}</span></div>`).join('')}</div>
    <div class="carte ligne petit" style="font-size:13px;padding:12px 16px">${ic(ui.mode === 'livraison' ? 'pin' : 'sac', 18)}<span>${ui.mode === 'livraison' ? 'Livraison à Tana sous 48 h' : `Retrait chez ${B.nom}, ${esc(B.ville)} · ${esc(B.delaiRetrait)}`}</span></div>
    <div class="col" style="gap:6px"><label class="lib" for="telcmd" style="font-size:15px;font-weight:600">Numéro pour vous joindre</label>
      <div class="tel"${ui.telErreur ? ' style="border-color:var(--err)"' : ''}><span><svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true"><rect width="10" height="20" fill="#fff"/><rect x="10" width="20" height="10" fill="#FC3D32"/><rect x="10" y="10" width="20" height="10" fill="#007E3A"/><rect x=".5" y=".5" width="29" height="19" fill="none" stroke="#E2E5DF"/></svg>+261</span>
      <input id="telcmd" type="tel" inputmode="numeric" autocomplete="tel-national" data-in="telcmd" value="${esc(ui.telCmd != null ? ui.telCmd : (client.tel || ''))}" placeholder="34 00 000 00" aria-describedby="telcmd-aide" aria-invalid="${!!ui.telErreur}"></div>
      <span id="telcmd-aide" class="petit" style="color:${ui.telErreur ? 'var(--err)' : 'var(--muted)'}">${esc(ui.telErreur || 'La boutique vous appelle ou vous écrit sur WhatsApp pour confirmer. Pas de SMS de code.')}</span></div>
    <div class="col" style="gap:8px"><h2 class="h2" style="font-size:15px">Moyen de paiement</h2>
      <div class="choix trois" role="radiogroup" aria-label="Moyen de paiement">${[['mvola', 'MVola'], ['orange', 'Orange Money'], ['especes', 'Espèces']].map(([id, l]) => `<button class="opt" role="radio" aria-checked="${ui.paiement === id}" data-a="payer-par" data-id="${id}">${l}</button>`).join('')}</div>
      <p class="petit ligne" style="margin:0;gap:8px;align-items:flex-start" role="status">${ic('info', 16, 'style="flex-shrink:0;margin-top:1px"')}${notesPaiement[ui.paiement]}</p></div>
    ${recap(t)}</div>
    <div class="basbar transp"><button class="btn" data-a="confirmer">Confirmer · <span class="nw">${ar(t.total)}</span></button></div>`;
  };

  const ETAPES = [['Réservée', 'check'], ['Préparée', 'cle'], ['Prête', 'sac'], ['Récupérée', 'clef']];
  const MSG = ['Nous avons bien reçu votre réservation.', 'Votre commande est en préparation au garage.', 'Votre commande est prête : passez la récupérer.', 'Commande récupérée. Merci et bonne route !'];
  const trouverCmd = (code) => commandes.find((c) => c.code === code);

  V.confirmation = (code) => {
    const c = trouverCmd(code);
    if (!c) return V.introuvable();
    return `<div class="ecran" style="padding-top:calc(40px + env(safe-area-inset-top))">
    <div class="col" style="align-items:center;text-align:center;gap:8px">
      <span style="width:96px;height:96px;border-radius:50%;background:var(--lime);color:var(--on-lime);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 12px var(--lime-soft);margin:12px 0 10px">${ic('check', 44, 'stroke-width="2.6"')}</span>
      <h1 class="titre" style="font-size:26px">Réservation confirmée !</h1>
      <p class="petit" style="font-size:14px;margin:0;max-width:300px">Nous préparons votre commande et vous appelons au +261 ${esc(c.tel)} dès qu'elle est prête.</p></div>
    <div class="carte ligne entre" style="background:var(--noir);color:var(--noir-txt);border-radius:22px">
      <div class="col"><span class="petit" style="color:var(--noir-mut)">Code de retrait à présenter en boutique</span><b style="font-size:28px;font-weight:800;letter-spacing:2px;color:var(--lime)">${esc(c.code)}</b></div>
      <button class="rond" style="background:rgba(255,255,255,.12);color:var(--noir-txt)" data-a="copier" data-id="${esc(c.code)}" aria-label="Copier le code">${ic('copie', 18)}</button></div>
    <div class="carte col" style="gap:9px;font-size:13px">
      <div class="ligne" style="gap:10px">${ic('panier', 18)}<span>${pl(c.lignes.reduce((s, l) => s + l.q, 0), 'article')} · <b class="nw">${ar(c.total)}</b></span></div>
      <div class="ligne" style="gap:10px">${ic(c.mode === 'livraison' ? 'pin' : 'sac', 18)}<span>${c.mode === 'livraison' ? 'Livraison à Tana sous 48 h' : `Retrait chez ${B.nom} · ${esc(B.delaiRetrait)}`}</span></div>
      <div class="ligne" style="gap:10px">${ic('carte', 18)}<span>${{ mvola: 'MVola', orange: 'Orange Money', especes: 'Espèces à la boutique' }[c.paiement]}</span></div></div>
    <div class="col" style="gap:10px;margin-top:6px"><a class="btn" href="#suivi-${esc(c.code)}">Suivre ma commande</a><a class="btn clair" href="#accueil">Retour à l'accueil</a></div></div>`;
  };

  V.suivi = (code) => {
    const c = trouverCmd(code);
    if (!c) return V.introuvable();
    const s = c.statut;
    return `<div class="ecran">${entete('Commande ' + esc(c.code), 'compte')}
    <div class="carte col" style="gap:14px"><h2 class="h2" style="font-size:20px">${s >= 3 ? 'Bonne route !' : 'Presque fini !'}</h2>
      <div class="etapes"><span class="rail"></span><span class="plein" style="width:${s * 25}%"></span>
      ${ETAPES.map(([l, i], k) => `<div class="etape ${k < s || s === 3 ? 'fait' : k === s ? 'encours' : ''}"><i>${ic(i)}</i>${l}</div>`).join('')}</div>
      <div class="ligne" style="background:var(--bg);border-radius:14px;padding:12px">${ic('horloge', 22)}<span style="font-size:13px">${MSG[s]}</span></div></div>
    <div class="carte" style="padding:4px 14px">${c.lignes.map((l) => { const p = produit(l.id); return p ? `<div class="article"><span class="vign">${img(p)}</span><div class="col" style="flex:1"><b style="font-size:14px;font-weight:600">${esc(p.nom)}</b><span class="petit">${l.taille ? (p.tailles ? 'Taille ' : '') + esc(l.taille) + ' · ' : ''}× ${l.q}</span></div><span class="prix" style="font-size:14px">${ar(l.prix * l.q)}</span></div>` : ''; }).join('')}
      <div class="ligne entre" style="padding:12px 0;border-top:1px solid var(--line);font-weight:600"><span>Total</span><span class="prix">${ar(c.total)}</span></div></div>
    <p class="petit" style="margin:0">Le statut est mis à jour par la boutique.</p>
    ${s < 3 ? `<button class="btn clair" data-a="demo-statut" data-id="${esc(c.code)}">Démo : passer à l'étape suivante</button>` : ''}</div>`;
  };

  V.compte = () => {
    if (!client) { return `<div class="ecran"><h1 class="titre">Mon compte</h1>
      <div class="carte col vide"><span class="rond" style="width:64px;height:64px;background:var(--lime-soft)">${ic('user', 28)}</span><b style="font-size:17px">Connectez-vous</b>
      <span class="petit" style="font-size:13px">Avec Facebook, Google ou votre e-mail, pour suivre vos commandes et votre carte fidélité.</span>
      <button class="btn" data-a="aller-connexion" style="margin-top:6px">Se connecter</button></div>${menuCompte()}</div>`; }
    const n = commandes.length, f = n % 5;
    return `<div class="ecran"><h1 class="titre">Mon compte</h1>
    <div class="carte col" style="background:var(--noir);color:var(--noir-txt);border-radius:22px;gap:14px">
      <div class="ligne"><span class="rond lime" style="width:52px;height:52px;font-weight:700">${ic('user', 22)}</span>
        <div class="col" style="flex:1"><b style="font-weight:600;font-size:16px">${esc(client.nom || 'Mon compte')}</b><span class="petit" style="color:var(--noir-mut)">${{ facebook: 'Connecté avec Facebook', google: 'Connecté avec Google', email: 'Connecté par e-mail' }[client.methode] || ''}${client.tel ? ' · +261 ' + esc(client.tel) : ''} · ${pl(n, 'commande')}</span></div></div>
      <div class="col" style="gap:8px"><div class="ligne entre" style="font-size:13px"><b style="font-weight:600">Carte fidélité</b><span style="color:var(--noir-mut)"><b style="color:var(--lime)">${f}</b> achat${f > 1 ? 's' : ''} sur 5</span></div>
        <div role="progressbar" aria-label="Carte fidélité" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${f}" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">${[0, 1, 2, 3, 4].map((k) => `<span style="height:8px;border-radius:4px;background:${k < f ? 'var(--lime)' : 'var(--noir-vide)'}"></span>`).join('')}</div>
        <span class="petit" style="color:var(--noir-mut)">Encore ${pl(5 - f, 'achat')} pour une révision offerte au garage.</span></div></div>
    <div class="carte col" style="gap:4px"><h2 class="h2" style="font-size:15px">Mes commandes</h2>
      ${n ? commandes.slice().reverse().slice(0, 4).map((c) => `<a href="#suivi-${esc(c.code)}" class="ligne entre" style="min-height:52px;border-top:1px solid var(--line)"><span class="col"><b style="font-size:14px;font-weight:600">${esc(c.code)}</b><span class="petit">${esc(c.date)} · ${ar(c.total)}</span></span>
        <span class="badge" style="${c.statut === 3 ? 'background:var(--soft);color:var(--muted)' : ''}">${ETAPES[c.statut][0]}</span></a>`).join('') : '<span class="petit" style="padding:6px 0">Aucune commande pour le moment.</span>'}</div>
    ${menuCompte()}</div>`;
  };
  const menuCompte = () => `<nav class="carte menu" style="padding:4px 16px" aria-label="Aide et réglages">
    <a href="https://wa.me/${B.whatsapp}" target="_blank" rel="noopener"><span class="ico">${ic('bulle', 18)}</span><span style="flex:1;font-weight:500">Aide et contact WhatsApp</span>${ic('fleche', 16, 'style="color:var(--muted)"')}</a>
    <a href="tel:${B.telephone.replace(/\s/g, '')}"><span class="ico">${ic('tel', 18)}</span><span style="flex:1;font-weight:500">Appeler · ${esc(B.telephone)}</span>${ic('fleche', 16, 'style="color:var(--muted)"')}</a>
    <a href="#compte" aria-disabled="true"><span class="ico">${ic('globe', 18)}</span><span style="flex:1;font-weight:500">Langue</span><span class="petit">Français</span></a>
    ${client ? `<a href="#compte" data-a="deconnexion"><span class="ico">${ic('sortie', 18)}</span><span style="flex:1;font-weight:500">Se déconnecter</span></a>` : ''}</nav>`;

  V.introuvable = () => `<div class="ecran">${entete('Introuvable', 'accueil')}<div class="carte col vide"><b>Cette page n'existe pas ou plus.</b><a class="btn" href="#accueil" style="margin-top:8px">Retour à l'accueil</a></div></div>`;

  /* ---------- Panneaux du bas (ajout au panier, filtres) ---------- */
  const $feuille = document.getElementById('feuille');
  let feuilleAvant = null, feuilleType = '';
  function ouvrirFeuille(type, html, titre) {
    feuilleType = type;
    if (!$feuille.classList.contains('vu')) feuilleAvant = document.activeElement;
    $feuille.innerHTML = `<div class="voile" data-a="fermer-feuille"></div><div class="feuille" role="dialog" aria-modal="true" aria-label="${titre}"><div class="poignee"></div>${html}</div>`;
    $feuille.classList.add('vu'); document.body.style.overflow = 'hidden';
    const f = $feuille.querySelector('button,a,input'); if (f) f.focus({ preventScroll: true });
  }
  function fermerFeuille() {
    if (!$feuille.classList.contains('vu')) return;
    $feuille.classList.remove('vu'); $feuille.innerHTML = ''; feuilleType = ''; document.body.style.overflow = '';
    if (feuilleAvant && document.contains(feuilleAvant)) feuilleAvant.focus({ preventScroll: true });
  }
  const feuilleAjout = (p, taille) => `<div class="ligne" style="gap:14px"><span class="vign" style="width:72px;height:72px">${img(p)}</span>
      <div class="col" style="flex:1"><span class="ligne petit" style="gap:6px;color:var(--ok);font-weight:600">${ic('check', 16)}Ajouté au panier</span><b style="font-size:16px;font-weight:600">${esc(p.nom)}${taille ? ' · ' + esc(taille) : ''}</b><span class="prix">${prixTxt(p)}</span></div></div>
    <div class="ligne entre petit" style="background:var(--bg);border-radius:14px;padding:12px 14px;margin:14px 0;font-size:13px"><span>Panier : ${pl(nbPanier(), 'article')}</span><b class="nw" style="color:var(--ink)">${ar(totaux().total)}</b></div>
    <div class="col" style="gap:10px"><a class="btn" href="#panier" data-a="voir-panier">Voir le panier</a><button class="btn clair" data-a="fermer-feuille">Continuer mes achats</button></div>`;
  const feuilleFiltres = () => {
    const nb = listeCatalogue().l.length;
    const tr = ui.cat === 'scooters' ? TRANCHES.scooters : TRANCHES.autre;
    const groupe = (titre, cle, opts) => `<div class="col" style="gap:8px"><h3 class="h2" style="font-size:14px">${titre}</h3><div class="seg" style="grid-template-columns:repeat(${opts.length},minmax(0,1fr))">${opts.map(([v, l]) => `<button aria-pressed="${String(ui.f[cle]) === String(v)}" data-a="filtre" data-id="${cle}:${v}">${l}</button>`).join('')}</div></div>`;
    return `<div class="ligne entre" style="margin-bottom:12px"><button data-a="filtres-raz" style="min-height:44px;font-weight:500;color:var(--muted)">Réinitialiser</button>
      <b style="font-size:16px">${nbFiltres() ? pl(nbFiltres(), 'filtre') : 'Filtres'}</b><button data-a="fermer-feuille" style="min-height:44px;font-weight:600">Terminé</button></div>
      <div class="col" style="gap:16px">
      ${groupe('Prix (Ariary)', 'prix', tr)}
      ${ui.cat === 'scooters' && !ui.recherche ? groupe('Cylindrée', 'cyl', [[100, '100 cc'], [110, '110 cc'], [115, '115 cc'], [125, '125 cc'], [150, '150 cc'], [155, '155 cc']]) : ''}
      ${groupe('Afficher', 'promo', [[true, 'En promotion']])}
      ${groupe('Disponibilité', 'stock', [[true, 'En stock seulement']])}
      </div><button class="btn" data-a="fermer-feuille" style="margin-top:18px">${nb ? 'Voir ' + pl(nb, 'résultat') : 'Aucun résultat'}</button>`;
  };
  const majFiltres = () => { if (feuilleType === 'filtres') ouvrirFeuille('filtres', feuilleFiltres(), 'Filtres'); const g = document.getElementById('grille'); if (g) g.innerHTML = grilleHtml(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerFeuille(); });

  /* ---------- Navigation ---------- */
  const AVEC_NAV = ['accueil', 'catalogue', 'compte'];
  let derniere = '';
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || 'accueil';
    const m = h.match(/^(accueil|catalogue|produit|panier|connexion|paiement|confirmation|suivi|compte)(?:-(.+))?$/);
    const nom = m ? m[1] : 'introuvable';
    const html = (V[nom] || V.introuvable)(m && m[2]);
    if (!html) return; // redirection en cours
    fermerFeuille();
    $app.innerHTML = html;
    const onglet = nom === 'panier' ? 'panier' : nom;
    $nav.hidden = !AVEC_NAV.includes(nom);
    $nav.innerHTML = [['accueil', 'Accueil', 'maison'], ['catalogue', 'Catalogue', 'grille'], ['panier', 'Panier', 'panier'], ['compte', 'Compte', 'user']]
      .map(([id, l, i]) => `<a href="#${id}"${onglet === id ? ' aria-current="page"' : ''}><span class="ic">${ic(i, 22)}</span>${l}${id === 'panier' && nbPanier() ? `<span class="pastille">${nbPanier()}</span>` : ''}</a>`).join('');
    document.title = { accueil: 'Dagomotoshop', catalogue: 'Catalogue · Dagomotoshop', panier: 'Panier · Dagomotoshop', compte: 'Compte · Dagomotoshop' }[nom] || 'Dagomotoshop';
    if (h !== derniere) { window.scrollTo(0, 0); derniere = h; }
  }
  const rafraichir = () => { const y = window.scrollY; route(); window.scrollTo(0, y); };
  const aller = (h) => { if (location.hash.slice(1) === h) route(); else location.hash = h; };

  /* ---------- Actions ---------- */
  const actions = {
    ajouter(id) {
      const p = produit(id); if (!p || !p.prix) return;
      if (choixDe(p) && !ui.taille) { ui.tailleErreur = true; rafraichir(); const s = document.querySelector('.seg [data-a=taille]'); if (s) { s.scrollIntoView({ block: 'center', behavior: 'smooth' }); s.focus({ preventScroll: true }); } return; }
      const cle = choixDe(p) ? id + '@' + ui.taille : id;
      panier[cle] = (panier[cle] || 0) + 1; sauver(); rafraichir();
      ouvrirFeuille('ajout', feuilleAjout(p, choixDe(p) ? ui.taille : ''), 'Ajouté au panier');
    },
    taille(t) { ui.taille = t; ui.tailleErreur = false; rafraichir(); },
    'voir-panier'() { fermerFeuille(); aller('panier'); },
    'fermer-feuille'() { fermerFeuille(); rafraichir(); },
    filtres() { ouvrirFeuille('filtres', feuilleFiltres(), 'Filtres'); },
    filtre(v) { const [cle, val] = v.split(':'); const actuel = String(ui.f[cle]); ui.f[cle] = actuel === val ? null : (val === 'true' ? true : val); majFiltres(); },
    'filtres-raz'() { ui.f = { prix: null, cyl: null, promo: null, stock: null }; majFiltres(); if (feuilleType !== 'filtres') rafraichir(); },
    suggestion(t) { ui.recherche = t; memoRecherche(t); rafraichir(); },
    plus(id) { panier[id] = (panier[id] || 0) + 1; sauver(); rafraichir(); },
    moins(id) { panier[id] = (panier[id] || 0) - 1; if (panier[id] <= 0) delete panier[id]; sauver(); rafraichir(); },
    vider() { panier = {}; sauver(); rafraichir(); },
    cat(id) { ui.cat = id; ui.recherche = ''; ui.f = { prix: null, cyl: null, promo: null, stock: null }; aller('catalogue-' + id); },
    mode(id) { ui.mode = id; rafraichir(); },
    'payer-par'(id) { ui.paiement = id; rafraichir(); },
    retour() { if (history.length > 1) history.back(); else aller('accueil'); },
    favori(id) { favoris = favoris.includes(id) ? favoris.filter((f) => f !== id) : favoris.concat(id); sauver(); rafraichir(); },
    async partager(id) {
      const p = produit(id), texte = `${p.nom} ${p.prix ? 'à ' + ar(p.prix) + ' ' : ''}chez ${B.nom}`;
      try { if (navigator.share) { await navigator.share({ title: p.nom, text: texte, url: location.href }); return; } await navigator.clipboard.writeText(texte + ' ' + location.href); toast('Lien copié'); }
      catch (e) { toast('Partage indisponible ici'); }
    },
    async copier(code) { try { await navigator.clipboard.writeText(code); toast('Code copié'); } catch (e) { toast('Notez le code : ' + code); } },
    commander() { if (client) aller('paiement'); else { ui.retour = 'paiement'; aller('connexion'); } },
    'aller-connexion'() { ui.retour = 'compte'; aller('connexion'); },
    /* Connexion. En démo, on crée un compte local ; avec Firebase, ici : signInWithPopup (Facebook, Google) ou sendSignInLinkToEmail. */
    cnx(methode) {
      const noms = { facebook: 'Client Facebook', google: 'Client Google', email: ui.emailEnvoye };
      client = { methode, nom: noms[methode] || 'Client', email: methode === 'email' ? ui.emailEnvoye : '', tel: (client && client.tel) || '' };
      ui.emailEnvoye = ''; ui.email = ''; sauver(); toast('Connecté'); aller(ui.retour || 'compte');
    },
    'email-autre'() { ui.emailEnvoye = ''; rafraichir(); },
    deconnexion() { client = null; sauver(); toast('Déconnecté'); rafraichir(); },
    confirmer() {
      const brut = ui.telCmd != null ? ui.telCmd : (client.tel || '');
      const chiffres = brut.replace(/\D/g, '').replace(/^261/, '').replace(/^0/, '');
      if (!/^3[2-47-8]\d{7}$/.test(chiffres)) {
        ui.telErreur = brut.trim() ? 'Numéro invalide : 9 chiffres commençant par 32, 33, 34, 37 ou 38.' : 'Indiquez un numéro pour que la boutique puisse vous joindre.';
        rafraichir(); const f = document.getElementById('telcmd'); if (f) { f.scrollIntoView({ block: 'center' }); f.focus(); } return;
      }
      client.tel = chiffres.replace(/^(\d{2})(\d{2})(\d{3})(\d{2})$/, '$1 $2 $3 $4'); ui.telErreur = ''; ui.telCmd = null;
      const t = totaux();
      const num = String(128 + commandes.length).padStart(4, '0');
      const c = { code: 'DMS-' + num, date: new Date().toLocaleDateString('fr-FR'), lignes: t.lignes.map(({ p, q, taille }) => ({ id: p.id, taille, q, prix: p.prix })),
        total: t.total, mode: ui.mode, paiement: ui.paiement, statut: 0, tel: client.tel };
      commandes.push(c); panier = {}; ui.promo = null; ui.promoSaisie = ''; ui.promoMsg = ''; sauver();
      aller('confirmation-' + c.code);
    },
    'demo-statut'(code) { const c = trouverCmd(code); if (c && c.statut < 3) { c.statut++; sauver(); rafraichir(); } }
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || !actions[el.dataset.a]) return;
    e.preventDefault();
    actions[el.dataset.a](el.dataset.id);
  });

  let memoT;
  document.addEventListener('input', (e) => {
    const k = e.target.dataset.in;
    if (k === 'recherche') { ui.recherche = e.target.value; clearTimeout(memoT); memoT = setTimeout(() => memoRecherche(ui.recherche), 1200); const g = document.getElementById('grille'); if (g) g.innerHTML = grilleHtml();
      document.querySelectorAll('[role=tab]').forEach((b) => b.setAttribute('aria-selected', String(!ui.recherche && b.dataset.id === ui.cat))); }
    if (k === 'tri') { ui.tri = e.target.value; const g = document.getElementById('grille'); if (g) g.innerHTML = grilleHtml(); }
    if (k === 'promo') ui.promoSaisie = e.target.value;
    if (k === 'telcmd') { ui.telCmd = e.target.value; if (ui.telErreur) { ui.telErreur = ''; const a = document.getElementById('telcmd-aide'); if (a) { a.textContent = 'La boutique vous appelle ou vous écrit sur WhatsApp pour confirmer. Pas de SMS de code.'; a.style.color = ''; } } }
    if (k === 'email') ui.email = e.target.value;
    if (k === 'code') {
      e.target.value = e.target.value.replace(/\D/g, '').slice(-1);
      const cases = [...document.querySelectorAll('[data-in=code]')];
      const i = cases.indexOf(e.target);
      if (e.target.value && cases[i + 1]) cases[i + 1].focus();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.dataset && e.target.dataset.in === 'code' && e.key === 'Backspace' && !e.target.value) {
      const cases = [...document.querySelectorAll('[data-in=code]')]; const i = cases.indexOf(e.target); if (cases[i - 1]) cases[i - 1].focus();
    }
  });
  document.addEventListener('paste', (e) => {
    if (!(e.target.dataset && e.target.dataset.in === 'code')) return;
    const v = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!v) return; e.preventDefault();
    document.querySelectorAll('[data-in=code]').forEach((c, i) => { c.value = v[i] || ''; });
  });

  document.addEventListener('submit', (e) => {
    const f = e.target.dataset.form; if (!f) return;
    e.preventDefault();
    if (f === 'recherche') { ui.recherche = e.target.q.value; memoRecherche(ui.recherche); aller('catalogue'); }
    if (f === 'promo') {
      const code = ui.promoSaisie.trim().toUpperCase();
      if (D.codesPromo[code]) { ui.promo = code; ui.promoMsg = `Code ${code} appliqué : -${Math.round(D.codesPromo[code] * 100)} % sur la commande.`; }
      else { ui.promo = null; ui.promoMsg = code ? 'Ce code n’existe pas ou a expiré.' : 'Entrez un code.'; }
      rafraichir();
    }
    if (f === 'email') {
      const m = ui.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) { ui.emailErreur = m ? 'Adresse e-mail invalide. Vérifiez-la.' : 'Entrez votre adresse e-mail.'; rafraichir(); const f = document.getElementById('email'); if (f) f.focus(); return; }
      ui.emailErreur = ''; ui.emailEnvoye = m; rafraichir();
    }
  });

  const marque = (i) => { i.classList.add('ok'); if (i.parentNode && i.parentNode.classList) i.parentNode.classList.add('ok'); };
  document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') marque(e.target); }, true);
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') marque(e.target); }, true);
  const verifierImages = () => document.querySelectorAll('img.sq:not(.ok)').forEach((i) => { if (i.complete) marque(i); });
  new MutationObserver(verifierImages).observe(document.body, { childList: true, subtree: true });
  document.documentElement.classList.add('js-sq');
  window.addEventListener('hashchange', route);
  route();

  /* Installation hors-ligne (ignorée là où les service workers sont bloqués) */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* aperçu : pas de service worker */ }
  }
}
