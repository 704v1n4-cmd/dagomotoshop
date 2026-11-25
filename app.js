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
  /* Annonces de pièces entre particuliers. En démo : stockées sur ce téléphone ; avec Firebase : base partagée. */
  let annonces = store.get('annonces', null) || [];
  D.annoncesDemo.forEach((x) => { const y = annonces.find((z) => z.id === x.id); if (!y) annonces.push(Object.assign({}, x)); else { if (!y.vendeurId) y.vendeurId = x.vendeurId; if (!y.groupe) { y.groupe = x.groupe; y.piece = x.piece; } } });
  /* Vendeurs : pseudonyme, ventes et notes laissées par les acheteurs (jamais de nom ni de numéro affiché). */
  let vendeurs = Object.assign(JSON.parse(JSON.stringify(D.vendeursDemo)), store.get('vendeurs', {}));
  const memoRecherche = (t) => { t = t.trim(); if (t.length < 2) return; recentes = [t].concat(recentes.filter((r) => r.toLowerCase() !== t.toLowerCase())).slice(0, 5); store.set('recentes', recentes); };
  const ui = { cat: 'scooters', recherche: '', tri: 'asc', mode: 'boutique', promoSaisie: '', promo: null, promoMsg: '',
    paiement: 'mvola', notes: {}, groupe: '', vente: { titre: '', compat: '', etatPiece: 'Bon état', desc: '', prix: '', tel: '', photos: [], piece: '', accepte: false, erreur: '' }, f: { prix: null, cyl: null, promo: null, stock: null }, taille: '', tailleErreur: false, produitVu: '', telCmd: null, telErreur: '', email: '', emailErreur: '', emailEnvoye: '', retour: 'compte' };
  const sauver = () => { store.set('panier', panier); store.set('client', client); store.set('commandes', commandes); store.set('favoris', favoris); store.set('annonces', annonces); store.set('vendeurs', vendeurs); };

  /* ---------- Outils ---------- */
  const pl = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const grp = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const ar = (n) => grp(n) + ' Ar';
  const fmg = (n) => grp(n * 5) + ' Fmg';
  const PP = D.particuliers;
  const acompteDe = (prix) => Math.round(prix * PP.acompte / 100) * 100;
  const netVendeur = (prix) => Math.round(prix * (1 - PP.commission) / 100) * 100;
  const deAnnonce = (x) => ({ id: x.id, cat: 'occasion', nom: x.titre, detail: x.compat + ' · ' + x.etatPiece, prix: x.prix, stock: x.etat === 'en_ligne' ? 1 : 0,
    img: (x.photos && x.photos[0]) || x.photo, photos: x.photos || [x.photo], rond: /^img\//.test((x.photos && x.photos[0]) || x.photo), photoReelle: !/^img\//.test((x.photos && x.photos[0]) || x.photo), particulier: true, groupe: x.groupe || 'Autres', piece: x.piece || '', vendeurId: x.vendeurId, etatAnnonce: x.etat, description: x.description || 'Pièce proposée par un particulier.' });
  const TAGS = { conforme: 'Conforme à la photo', etat: 'État comme annoncé', prix: 'Bon prix' };
  const statV = (vid) => {
    const v = vendeurs[vid]; if (!v) return null;
    const n = v.notes.length, moy = n ? v.notes.reduce((s, x) => s + x, 0) / n : 0;
    return { id: vid, alias: v.alias, n, moy, ventes: v.ventes, tags: v.tags || {}, top: v.ventes >= 5 && n >= 3 && moy >= 4.5 };
  };
  const note1 = (m) => m.toFixed(1).replace('.', ',');
  const etoiles = (m, s = 14) => `<span class="etoiles" aria-hidden="true">${[1, 2, 3, 4, 5].map((k) => `<i style="--r:${Math.max(0, Math.min(1, m - k + 1)) * 100}%;width:${s}px;height:${s}px"></i>`).join('')}</span>`;
  const ligneVendeur = (vid, court) => { const s = statV(vid); if (!s) return ''; return `<span class="vendeur-ligne">${s.top ? `<span class="top">${ic('trophee', 12)}${court ? 'Top' : 'Meilleur vendeur'}</span>` : ''}${s.n ? `${ic('etoile', 13, 'fill="currentColor"')}<b>${note1(s.moy)}</b><span class="petit">(${s.n})</span>` : '<span class="petit">Nouveau vendeur</span>'}</span>`; };
  const tous = () => D.produits.concat(annonces.filter((x) => x.etat === 'en_ligne').map(deAnnonce));
  const produit = (id) => { const p = D.produits.find((x) => x.id === id); if (p) return p; const x = annonces.find((y) => y.id === id); return x ? deAnnonce(x) : undefined; };
  const nbPanier = () => Object.values(panier).reduce((s, q) => s + q, 0);
  const img = (p, cls) => `<img src="${p.img}" alt="${esc(p.nom)}" class="sq ${cls || ''}${p.rond ? ' rondimg' : ''}${p.photoReelle ? ' photo-reelle' : ''}" loading="lazy">`;
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
    const part = lignes.filter((l) => l.p.particulier);
    if (part.length) ui.mode = 'boutique'; // pièces de particuliers : retrait au magasin uniquement
    const sousBoutique = lignes.filter((l) => !l.p.particulier).reduce((s, l) => s + l.p.prix * l.q, 0);
    const remise = ui.promo ? Math.round(sousBoutique * D.codesPromo[ui.promo] / 1000) * 1000 : 0;
    const livraison = ui.mode === 'livraison' && lignes.length ? B.fraisLivraison : 0;
    const acompte = part.reduce((s, l) => s + acompteDe(l.p.prix) * l.q, 0);
    const resteParticuliers = part.reduce((s, l) => s + l.p.prix * l.q, 0) - acompte;
    return { lignes, sous, remise, livraison, total: sous - remise + livraison, n: lignes.reduce((s, l) => s + l.q, 0), acompte, resteParticuliers, aPart: part.length > 0 };
  }
  const recap = (t) => `<div class="carte col recap" style="gap:7px">
    <div><span class="petit" style="font-size:14px">Sous-total</span><span class="nw">${ar(t.sous)}</span></div>
    <div><span class="petit" style="font-size:14px">Remise${ui.promo ? ' (' + ui.promo + ')' : ''}</span><span class="nw">${t.remise ? '- ' + ar(t.remise) : '0 Ar'}</span></div>
    <div><span class="petit" style="font-size:14px">${ui.mode === 'livraison' ? 'Livraison Tana' : 'Retrait boutique'}</span><span class="nw">${t.livraison ? ar(t.livraison) : 'Gratuit'}</span></div>
    <div class="total"><span>Total</span><span class="col" style="align-items:flex-end"><span class="prix" style="font-size:18px">${ar(t.total)}</span><span class="petit nw">soit ${fmg(t.total)}</span></span></div>
    ${t.aPart ? `<div class="particuliers-recap"><span class="petit">Pièces de particuliers : acompte maintenant</span><span class="nw" style="font-weight:600">${ar(t.acompte)}</span></div>
    <div class="particuliers-recap"><span class="petit">Reste à payer au retrait, si vous gardez la pièce</span><span class="nw">${ar(t.resteParticuliers)}</span></div>` : ''}</div>`;

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
    <a href="#vendre" class="carte ligne vendre-promo"><span class="rond lime" style="width:48px;height:48px">${ic('etiquette', 22)}</span>
      <span class="col" style="flex:1"><b style="font-size:15px;font-weight:600">Des pièces en trop ?</b><span class="petit">Vendez-les ici. Retrait au magasin, vous êtes payé dès la vente.</span></span>${ic('fleche', 18)}</a>
  </div>`;
  };

  const carteProd = (p) => `<div class="prod">
    <a href="#produit-${p.id}" class="col" style="gap:3px"><span class="boite sq-att">${img(p)}</span>${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}${p.particulier ? '<span class="badge part">Particulier</span>' : ''}
    <b style="font-size:14px;font-weight:600;margin-top:6px">${esc(p.nom)}</b><span class="petit">${esc(p.detail)}</span>${p.particulier ? ligneVendeur(p.vendeurId, true) : ''}</a>
    <div class="ligne entre" style="margin-top:4px"><span class="prix">${prixTxt(p)}</span>
    ${!p.prix || p.particulier ? `<a class="ajout" href="#produit-${p.id}" aria-label="Voir ${esc(p.nom)}">${ic('fleche', 16)}</a>` : p.tailles ? `<a class="ajout" href="#produit-${p.id}" aria-label="Choisir la taille de ${esc(p.nom)}">${ic('plus', 16)}</a>` : `<button class="ajout" data-a="ajouter" data-id="${p.id}" aria-label="Ajouter ${esc(p.nom)} au panier">${ic('plus', 16)}</button>`}</div>
    ${p.stock != null && p.stock <= 2 && !p.particulier ? `<span class="stock${p.stock <= 0 ? ' rupture' : ''}">${stockTxt(p)}</span>` : ''}</div>`;
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
    let l = tous().filter((p) => (q ? (p.nom + ' ' + p.detail).toLowerCase().includes(q) : p.cat === ui.cat) && passeFiltres(p));
    const rang = (p) => { const s = p.particulier && statV(p.vendeurId); return s ? (s.top ? 2 : 0) + s.moy / 10 : 0; };
    if (!q && ui.cat === 'occasion' && ui.groupe) l = l.filter((p) => p.groupe === ui.groupe);
    l = l.slice().sort((a, b) => { if (!q && ui.cat === 'occasion') { const r = rang(b) - rang(a); if (r) return r; } const x = a.prix || (ui.tri === 'asc' ? Infinity : -1), y = b.prix || (ui.tri === 'asc' ? Infinity : -1); return ui.tri === 'asc' ? x - y : y - x; });
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
      ${D.categories.slice(0, 3).map((c) => `<button role="tab" class="puce" style="justify-content:center;border:none;height:40px" aria-selected="${!ui.recherche && ui.cat === c.id}" data-a="cat" data-id="${c.id}">${ic(c.icone, 18)}${c.nom}</button>`).join('')}</div>
    <button class="puce occ" data-a="cat" data-id="occasion" aria-pressed="${!ui.recherche && ui.cat === 'occasion'}">${ic('etiquette', 18)}Occasion entre particuliers${ic('fleche', 16)}</button>
    ${!ui.recherche && ui.cat === 'occasion' ? `<div class="carte col" style="gap:8px;padding:14px 16px"><span class="petit" style="font-size:13px;line-height:1.5">Pièces vendues <b>en l'état</b> par des particuliers. Retrait au magasin uniquement, acompte de ${Math.round(PP.acompte * 100)} % à la réservation, le reste après examen de la pièce au comptoir.</span>
      ${meilleursHtml()}
      ${famillesHtml()}
      <span class="ligne" style="gap:14px"><a href="#vendre" class="petit" style="font-weight:600;color:var(--ink);text-decoration:underline;min-height:40px;display:flex;align-items:center">Vendre une pièce</a><a href="#conditions" class="petit" style="text-decoration:underline;min-height:40px;display:flex;align-items:center">Conditions</a></span></div>` : ''}
    ${ui.recherche || ui.cat === 'occasion' ? '' : `<div class="defile" aria-label="Recherches suggérées"><span class="petit nw" style="align-self:center;flex-shrink:0">${recentes.length ? 'Récentes :' : 'Populaires :'}</span>${(recentes.length ? recentes : ['Cygnus', 'G6', 'GP', 'SYM Jet', 'VJR', 'PGO']).map((r) => `<button class="puce" style="height:34px" data-a="suggestion" data-id="${esc(r)}">${esc(r)}</button>`).join('')}</div>`}
    <div class="ligne entre"><button class="puce" data-a="filtres" aria-haspopup="dialog" style="${nbFiltres() ? 'background:var(--sel);color:var(--sel-txt);border-color:var(--sel)' : ''}">${ic('filtres', 18)}Filtres${nbFiltres() ? ` · ${nbFiltres()}` : ''}</button>
      <label class="sr" for="tri">Trier par</label><select id="tri" data-in="tri" style="height:40px;border-radius:999px;border:1px solid var(--line);background:var(--card);padding:0 12px;font-size:14px">
        <option value="asc"${ui.tri === 'asc' ? ' selected' : ''}>Prix croissant</option><option value="desc"${ui.tri === 'desc' ? ' selected' : ''}>Prix décroissant</option></select></div>
    <div id="grille" class="col" style="gap:4px">${grilleHtml()}</div><p class="petit" style="text-align:center;margin:18px 0 0">Photos non contractuelles.</p></div>`;
  };

  const similaires = (p) => {
    const l = tous().filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 6);
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
    <div class="hero">
      <div class="ligne entre" style="position:relative;z-index:4"><button class="rond" data-a="retour" aria-label="Retour">${ic('retour')}</button>
      <span class="ligne" style="gap:10px"><button class="rond${fav ? ' lime' : ''}" data-a="favori" data-id="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${ic('coeur', 20, fav ? 'fill="currentColor"' : '')}</button>
      <button class="rond" data-a="partager" data-id="${p.id}" aria-label="Partager">${ic('partage')}</button></span></div>
      <span class="mention-photo">${p.particulier ? 'Photo du vendeur' : 'Photo non contractuelle'}</span></div>
    ${p.photos && p.photos.length > 1 ? `<div class="galerie" aria-label="Photos du vendeur">${p.photos.map((u, k) => `<figure><img src="${u}" alt="${esc(p.nom)}, photo ${k + 1}" class="photo-reelle"><figcaption>${esc((EMPLACEMENTS[k] || ['Photo'])[0])}</figcaption></figure>`).join('')}</div>
      <div class="points" aria-hidden="true">${p.photos.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</div><span class="compte" aria-live="polite">1/${p.photos.length}</span>` : img(p, 'hero-img')}
    <div class="dessus">
      <div class="carte col" style="gap:6px;padding-top:${p.rond ? 30 : 46}px">
        <h1 class="h2" style="font-size:21px">${esc(p.nom)}</h1><span class="petit" style="font-size:13px">${esc(p.detail)}</span>
        <div class="ligne" style="gap:8px;flex-wrap:wrap"><span class="prix" style="font-size:22px;font-weight:600">${prixTxt(p)}</span>
        ${p.ancienPrix ? `<span class="barre" style="font-size:13px">${grp(p.ancienPrix)}</span><span class="badge" style="background:var(--lime-soft);color:var(--ok)">-${grp(eco)} Ar</span>` : ''}</div>
        <span class="petit">${p.particulier ? `soit ${fmg(p.prix)} · acompte de ${ar(acompteDe(p.prix))} à la réservation, le reste au retrait` : p.prix ? `soit ${fmg(p.prix)} · paiement MVola, Orange Money ou espèces` : 'Écrivez-nous pour le prix, l\u2019année et le kilométrage.'}</span>${p.photoProvisoire ? '<span class="petit" style="font-style:italic">Photo non contractuelle</span>' : ''}
        ${p.stock != null && !p.particulier ? `<span class="stock${p.stock <= 0 ? ' rupture' : p.stock > 2 ? ' ok' : ''}" style="align-self:flex-start;margin-top:4px">${stockTxt(p)}</span>` : ''}</div>
      ${p.particulier ? `<div class="carte col avert" style="gap:8px"><span class="ligne" style="gap:6px;flex-wrap:wrap"><span class="badge part">${ic('etiquette', 14)}Vendu par un particulier · en l'état</span><span class="badge part" style="background:var(--bg)">${esc(p.groupe)}</span></span>
        <p class="petit" style="margin:0;font-size:13px;line-height:1.5">${B.nom} sert seulement d'intermédiaire : la boutique ne contrôle pas et ne garantit pas cette pièce. Vous l'examinez au comptoir avant de payer le reste ; si elle ne vous convient pas, vous la refusez et votre acompte est remboursé.</p>
        <a href="#conditions" class="petit" style="text-decoration:underline;min-height:36px;display:flex;align-items:center">Conditions de vente entre particuliers</a></div>${blocVendeur(p)}` : ''}
      ${choix ? `<div class="carte col" style="gap:8px"><div class="ligne entre"><h2 class="h2" style="font-size:15px">${choix.titre}</h2><span class="petit" role="status" style="color:${ui.tailleErreur ? 'var(--err)' : 'var(--muted)'}">${ui.tailleErreur ? choix.erreur : choix.aide}</span></div>
        <div class="seg" role="radiogroup" aria-label="${choix.titre}" style="grid-template-columns:repeat(${Math.min(choix.liste.length, 4)},minmax(0,1fr))">${choix.liste.map(([t, cm]) => `<button role="radio" aria-checked="${ui.taille === t}" aria-pressed="${ui.taille === t}" data-a="taille" data-id="${esc(t)}"><b>${esc(t)}</b>${cm ? `<span class="petit" style="font-size:11px">${esc(cm)}</span>` : ''}</button>`).join('')}</div></div>` : ''}
      ${p.specs ? `<div class="specs">${p.specs.map(([v, l]) => `<div><b>${esc(v)}</b><span class="petit" style="font-size:11px">${esc(l)}</span></div>`).join('')}</div>` : ''}
      <div class="carte ligne entre petit" style="padding:12px 16px;font-size:13px;flex-wrap:wrap;gap:8px"><span class="ligne" style="gap:8px">${ic('pin', 18)}${p.particulier ? 'Retrait au magasin uniquement' : 'Retrait ' + esc(B.delaiRetrait)}</span><span class="ligne" style="gap:8px">${ic('horloge', 18)}${esc(B.horaires)}</span></div>
      <div class="carte col" style="gap:6px"><h2 class="h2" style="font-size:15px">Description</h2><p class="petit" style="margin:0;font-size:13px;line-height:1.5">${esc(p.description)}</p></div>
      ${similaires(p)}
      <div class="carte ligne" style="padding:12px 16px"><img src="img/logo.jpg" alt="" style="width:44px;height:44px;border-radius:10px">
        <div class="col" style="flex:1"><b style="font-weight:600">${B.nom}</b><span class="petit">${esc(B.ville)} · ${esc(B.telephone)}</span></div>
        <a class="rond lime" href="tel:${B.telephone.replace(/\s/g, '')}" aria-label="Appeler la boutique au ${esc(B.telephone)}">${ic('tel')}</a></div>
    </div></div>
    <div class="basbar">${rondPanier().replace('class="rond"', 'class="rond" style="width:54px;height:54px;background:var(--bg)"')}
      ${p.particulier ? `<button class="btn" data-a="ajouter" data-id="${p.id}"${p.etatAnnonce !== 'en_ligne' ? ' disabled' : ''}>${p.etatAnnonce !== 'en_ligne' ? 'Déjà réservée' : 'Réserver · acompte ' + ar(acompteDe(p.prix))}</button>` : p.prix ? `<button class="btn" data-a="ajouter" data-id="${p.id}"${p.stock === 0 ? ' disabled' : ''}>${p.stock === 0 ? 'Sur commande : appelez-nous' : 'Ajouter au panier'}</button>` : `<a class="btn" style="background:#1FAF5A;color:#fff" href="${waPrix(p)}" target="_blank" rel="noopener">${ic('bulle', 20)}Demander le prix</a>`}</div>`;
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
      <div class="col" style="flex:1;gap:1px"><b style="font-size:14px;font-weight:600">${esc(p.nom)}</b><span class="petit">${p.particulier ? 'Particulier · ' : ''}${esc(p.detail)}${taille ? (p.tailles ? ' · Taille ' : ' · ') + esc(taille) : ''}</span><span class="prix" style="font-size:14px;margin-top:2px">${ar(p.prix * q)}</span></div>
      <div class="pas"><button data-a="moins" data-id="${esc(cle)}" aria-label="${q === 1 ? 'Retirer' : 'Diminuer la quantité de'} ${esc(p.nom)}">${ic('moins', 16)}</button><span aria-live="polite">${q}</span>
      <button class="plus" data-a="plus" data-id="${esc(cle)}"${p.particulier ? ' disabled style="opacity:.35"' : ''} aria-label="Augmenter la quantité de ${esc(p.nom)}">${ic('plus', 16)}</button></div></div>`).join('')}</div>
    <div class="choix" role="radiogroup" aria-label="Mode de retrait">
      <button class="opt" role="radio" aria-checked="${ui.mode === 'boutique'}" data-a="mode" data-id="boutique"><b style="font-size:14px;font-weight:600">Retrait boutique</b><span class="petit">Gratuit · ${esc(B.ville)}</span></button>
      <button class="opt" role="radio" aria-checked="${ui.mode === 'livraison'}" data-a="mode" data-id="livraison"${t.aPart ? ' disabled style="opacity:.45"' : ''}><b style="font-size:14px;font-weight:600">Livraison Tana</b><span class="petit">${ar(B.fraisLivraison)} · sous 48 h</span></button></div>
    ${t.aPart ? `<p class="petit ligne" style="margin:-6px 0 0;gap:8px;align-items:flex-start">${ic('info', 16, 'style="flex-shrink:0;margin-top:1px"')}Votre panier contient une pièce de particulier : retrait au magasin uniquement. Le code promo ne s'applique pas à ces pièces.</p>` : ''}
    <form class="col" style="gap:6px" data-form="promo"><label class="lib" for="promo">Code promo</label>
      <div class="ligne" style="gap:8px"><input id="promo" class="saisie" data-in="promo" value="${esc(ui.promoSaisie)}" placeholder="Ex. DAGO5" autocapitalize="characters" style="flex:1">
      <button class="btn" style="width:auto;height:50px;padding:0 16px;border-radius:14px;font-size:14px">Appliquer</button></div>
      <span role="status" class="petit" style="color:${ui.promo ? 'var(--ok)' : ui.promoMsg ? 'var(--err)' : 'var(--muted)'}">${esc(ui.promoMsg)}</span></form>
    ${recap(t)}</div>
    <div class="basbar transp"><button class="btn" data-a="commander">${t.aPart ? 'Réserver · ' : 'Commander · '}<span class="nw">${ar(t.total - t.resteParticuliers)}</span></button></div>`;
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
      <p class="petit ligne" style="margin:0;gap:8px;align-items:flex-start" role="status">${ic('info', 16, 'style="flex-shrink:0;margin-top:1px"')}${notesPaiement[ui.paiement]}</p>
      ${t.aPart ? `<p class="petit ligne" style="margin:0;gap:8px;align-items:flex-start">${ic('etiquette', 16, 'style="flex-shrink:0;margin-top:1px"')}Pour les pièces de particuliers, vous ne payez maintenant que l'acompte (${ar(t.acompte)}). Le reste se paie au comptoir, après examen de la pièce.</p>` : ''}</div>
    ${recap(t)}</div>
    <div class="basbar transp"><button class="btn" data-a="confirmer">Confirmer · <span class="nw">${ar(t.total - t.resteParticuliers)}</span>${t.aPart ? '&nbsp;maintenant' : ''}</button></div>`;
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
      <div class="ligne" style="gap:10px">${ic('carte', 18)}<span>${{ mvola: 'MVola', orange: 'Orange Money', especes: 'Espèces à la boutique' }[c.paiement]}</span></div>
      ${c.acompte ? `<div class="ligne" style="gap:10px;align-items:flex-start">${ic('etiquette', 18, 'style="flex-shrink:0"')}<span>Pièce de particulier : acompte de <b class="nw">${ar(c.acompte)}</b>. Elle arrive au magasin sous ${PP.delaiDepot} ; nous vous appelons dès qu'elle est là. Vous l'examinez au comptoir avant de payer le reste.</span></div>` : ''}</div>
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
    ${s === 3 ? noterHtml(c) : ''}
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
  const menuCompte = () => `<nav class="carte menu" style="padding:4px 16px" aria-label="Vendre mes pièces">
    <a href="#vendre"><span class="ico">${ic('etiquette', 18)}</span><span style="flex:1;font-weight:500">Vendre une pièce</span>${ic('fleche', 16, 'style="color:var(--muted)"')}</a>
    <a href="#annonces"><span class="ico">${ic('grille', 18)}</span><span style="flex:1;font-weight:500">Mes annonces</span>${annonces.filter((x) => x.proprio).length ? `<span class="petit">${annonces.filter((x) => x.proprio).length}</span>` : ''}${ic('fleche', 16, 'style="color:var(--muted)"')}</a>
    <a href="#conditions"><span class="ico">${ic('bouclier', 18)}</span><span style="flex:1;font-weight:500">Conditions entre particuliers</span>${ic('fleche', 16, 'style="color:var(--muted)"')}</a>
    <a href="#validation"><span class="ico">${ic('check', 18)}</span><span style="flex:1;font-weight:500">Espace boutique (démo)</span>${annonces.filter((x) => x.etat === 'attente').length ? `<span class="badge">${annonces.filter((x) => x.etat === 'attente').length}</span>` : ''}${ic('fleche', 16, 'style="color:var(--muted)"')}</a></nav>
  <nav class="carte menu" style="padding:4px 16px" aria-label="Aide et réglages">
    <a href="https://wa.me/${B.whatsapp}" target="_blank" rel="noopener"><span class="ico">${ic('bulle', 18)}</span><span style="flex:1;font-weight:500">Aide et contact WhatsApp</span>${ic('fleche', 16, 'style="color:var(--muted)"')}</a>
    <a href="tel:${B.telephone.replace(/\s/g, '')}"><span class="ico">${ic('tel', 18)}</span><span style="flex:1;font-weight:500">Appeler · ${esc(B.telephone)}</span>${ic('fleche', 16, 'style="color:var(--muted)"')}</a>
    <a href="#compte" aria-disabled="true"><span class="ico">${ic('globe', 18)}</span><span style="flex:1;font-weight:500">Langue</span><span class="petit">Français</span></a>
    ${client ? `<a href="#compte" data-a="deconnexion"><span class="ico">${ic('sortie', 18)}</span><span style="flex:1;font-weight:500">Se déconnecter</span></a>` : ''}</nav>`;

  /* ---------- Vente de pièces entre particuliers ---------- */
  const ETATS_PIECE = ['Neuve', 'Très bon état', 'Bon état', 'Usée mais fonctionnelle'];
  const STATUTS = {
    attente: ['En attente de validation', 'La boutique vérifie votre annonce avant de la mettre en ligne.', 'soft'],
    en_ligne: ['En ligne', 'Visible dans « Occasion entre particuliers ».', 'lime'],
    reservee: ['Réservée', '', 'warn'],
    vendue: ['Vendue', '', 'soft'],
    refusee: ['Refusée', 'La boutique n’a pas accepté cette annonce.', 'err'],
    retiree: ['Retirée', 'Vous avez retiré cette annonce.', 'soft']
  };
  const limiteDepot = (x) => new Date(x.reserveLe + 48 * 3600 * 1000).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const badgeStatut = (x) => `<span class="badge statut ${STATUTS[x.etat][2]}">${STATUTS[x.etat][0]}</span>`;
  const champ = (id, lib, html, aide) => `<div class="col" style="gap:6px"><label class="lib" for="${id}">${lib}</label>${html}${aide ? `<span class="petit">${aide}</span>` : ''}</div>`;

  const EMPLACEMENTS = [['Vue d’ensemble', 'La pièce entière, bien centrée', 'photo'], ['Références', 'Numéros, marque ou inscriptions gravés', 'loupe'],
    ['Défauts et usure', 'Rayures, usure, fixations : montrez-les', 'info'], ['Autre côté', 'Le dessous ou l’arrière', 'photo'], ['Pièce montée ou détail', 'Si vous l’avez', 'photo']];
  V.vendre = () => {
    if (!client) { ui.retour = 'vendre'; location.hash = 'connexion'; return ''; }
    const v = ui.vente, prix = +v.prix || 0;
    const tel = v.tel || client.tel || '';
    return `<div class="ecran">${entete('Vendre une pièce', 'compte')}
    <div class="carte col" style="gap:10px"><h2 class="h2" style="font-size:16px">Comment ça marche</h2>
      <ol class="etapes-vente">
        <li><b>Vous publiez</b> au moins 3 photos réelles et le prix de votre pièce. La boutique valide l’annonce.</li>
        <li><b>Un acheteur réserve</b> : vous avez ${PP.delaiDepot} pour déposer la pièce au magasin ${esc(B.nom)}.</li>
        <li><b>L’acheteur l’examine</b> au comptoir. S’il la prend, vous êtes payé tout de suite, moins ${Math.round(PP.commission * 100)} % de commission.</li></ol>
      <p class="petit ligne" style="margin:0;gap:8px;align-items:flex-start">${ic('bouclier', 16, 'style="flex-shrink:0;margin-top:1px"')}Pièces uniquement (pas de moto ni de scooter). Votre nom et votre numéro ne sont jamais montrés à l’acheteur.</p></div>
    <div class="carte col" style="gap:10px"><h2 class="h2" style="font-size:16px">Guide photo</h2>
      <p class="petit" style="margin:0">Pour toutes les photos : en plein jour, sans flash, pièce posée sur un fond uni et clair. Pas d’image trouvée sur internet.</p></div>
    <form data-form="vendre" class="col" style="gap:14px" novalidate>
      <div class="col" style="gap:8px"><div class="ligne entre"><b style="font-size:15px;font-weight:600">Photos de la pièce</b><span class="petit" role="status">${v.photos.filter(Boolean).length}/5 · minimum 3</span></div>
      <div class="emplacements">${EMPLACEMENTS.map(([t, d, i], k) => v.photos[k]
        ? `<div class="emplacement plein"><img src="${v.photos[k]}" alt="${t}"><span class="etiq">${k + 1}. ${t}</span><button type="button" class="rond" data-a="photo-suppr" data-id="${k}" aria-label="Supprimer la photo ${k + 1}">${ic('moins', 16)}</button></div>`
        : `<label class="emplacement${k < 3 ? ' requis' : ''}" for="v-photo-${k}">${ic(i, 26)}<b>${k + 1}. ${t}</b><span class="petit">${d}</span><span class="oblig">${k < 3 ? 'Obligatoire' : 'Facultatif'}</span></label>`).join('')}</div>
      ${EMPLACEMENTS.map((_, k) => `<input id="v-photo-${k}" type="file" accept="image/*" data-in="v-photo" data-slot="${k}" class="sr">`).join('')}</div>
      ${champ('v-piece', 'Type de pièce', `<select id="v-piece" class="saisie" data-in="v-piece"><option value=""${v.piece ? '' : ' selected'} disabled>Choisissez dans la liste</option>
        ${Object.entries(D.piecesListe).map(([g, l]) => `<optgroup label="${esc(g)}">${l.map((n) => `<option value="${esc(g + '|' + n)}"${v.piece === g + '|' + n ? ' selected' : ''}>${esc(n)}</option>`).join('')}</optgroup>`).join('')}
        <optgroup label="Pas dans la liste"><option value="Autres|Autres"${v.piece === 'Autres|Autres' ? ' selected' : ''}>Autres</option></optgroup></select>`, 'La pièce sera rangée dans cette famille pour que les acheteurs la trouvent.')}
      ${champ('v-titre', v.piece === 'Autres|Autres' ? 'Précisez la pièce' : 'Titre de l’annonce', `<input id="v-titre" class="saisie" data-in="v-titre" value="${esc(v.titre)}" placeholder="${v.piece === 'Autres|Autres' ? 'Ex. Support de plaque' : 'Ex. Carburateur d’origine'}" maxlength="60">`)}
      ${champ('v-compat', 'Compatible avec', `<input id="v-compat" class="saisie" data-in="v-compat" value="${esc(v.compat)}" placeholder="Ex. Kymco GP 125" maxlength="60">`)}
      ${champ('v-etat', 'État', `<select id="v-etat" class="saisie" data-in="v-etat">${ETATS_PIECE.map((e) => `<option${v.etatPiece === e ? ' selected' : ''}>${e}</option>`).join('')}</select>`)}
      ${champ('v-desc', 'Description <span class="petit">(facultatif)</span>', `<textarea id="v-desc" class="saisie" data-in="v-desc" rows="3" maxlength="300" placeholder="Défauts, kilométrage du scooter d’origine…">${esc(v.desc)}</textarea>`)}
      ${champ('v-prix', 'Prix de vente (Ar)', `<input id="v-prix" class="saisie" data-in="v-prix" inputmode="numeric" value="${esc(v.prix)}" placeholder="Ex. 50000">`)}
      <div class="carte col net" id="v-net" style="gap:4px">${netHtml(prix)}</div>
      ${champ('v-tel', 'Votre numéro (pour la boutique seulement)', `<div class="tel" style="border-width:1px;border-color:var(--line)"><span style="padding-left:12px">+261</span><input id="v-tel" type="tel" inputmode="numeric" data-in="v-tel" value="${esc(tel)}" placeholder="34 00 000 00"></div>`, 'La boutique vous appelle quand la pièce est réservée. L’acheteur ne le voit jamais.')}
      <button type="button" class="accepte" role="checkbox" aria-checked="${v.accepte}" data-a="vente-accepte"><span class="case">${v.accepte ? ic('check', 16, 'stroke-width="2.4"') : ''}</span><span>J’accepte les <a href="#conditions" style="text-decoration:underline">conditions de vente entre particuliers</a> et je déclare être propriétaire de cette pièce.</span></button>
      <p class="petit" role="alert" style="margin:0;color:var(--err);font-weight:500">${esc(v.erreur)}</p>
      <button class="btn">Envoyer pour validation</button></form></div>`;
  };
  function netHtml(prix) {
    if (!prix) return '<span class="petit">Indiquez un prix pour voir ce que vous recevrez.</span>';
    return `<div class="ligne entre"><span style="font-weight:500">Vous recevrez</span><b class="prix" style="font-size:18px">${ar(netVendeur(prix))}</b></div>
      <span class="petit">Prix affiché ${ar(prix)} − commission ${Math.round(PP.commission * 100)} % (${ar(prix - netVendeur(prix))}), payé au moment de la vente.</span>`;
  }

  V.annonces = () => {
    if (!client) { ui.retour = 'annonces'; location.hash = 'connexion'; return ''; }
    const l = annonces.filter((x) => x.proprio).slice().reverse();
    return `<div class="ecran">${entete('Mes annonces', 'compte', '<a href="#vendre" class="rond" aria-label="Vendre une pièce">' + ic('plus') + '</a>')}
    ${statV('moi') ? (() => { const s = statV('moi'); return `<div class="carte ligne" style="gap:12px"><span class="avatar">${ic('user', 20)}</span><span class="col" style="flex:1;gap:2px"><b style="font-weight:600">${esc(s.alias)}</b><span class="petit">Votre pseudonyme public · ${pl(s.ventes, 'vente')}</span></span>${s.n ? `<span class="ligne" style="gap:4px">${etoiles(s.moy, 14)}<b>${note1(s.moy)}</b></span>` : '<span class="petit">Pas encore noté</span>'}</div>`; })() : ''}
    ${l.length ? l.map((x) => `<div class="carte col" style="gap:10px"><div class="ligne" style="gap:12px;align-items:flex-start"><span class="vign">${img(deAnnonce(x))}</span>
      <div class="col" style="flex:1;gap:2px"><b style="font-size:15px;font-weight:600">${esc(x.titre)}</b><span class="petit">${esc(x.compat)} · ${esc(x.etatPiece)}</span>
      <span class="petit">Prix ${ar(x.prix)} · vous recevrez <b style="color:var(--ink)">${ar(netVendeur(x.prix))}</b></span><span style="margin-top:4px">${badgeStatut(x)}</span></div></div>
      <p class="petit" style="margin:0;font-size:13px">${x.etat === 'reservee' ? `Un acheteur a réservé cette pièce. Déposez-la au magasin avant <b style="color:var(--ink)">${limiteDepot(x)}</b>, sinon la réservation est annulée.` : x.etat === 'vendue' ? `Vendue : ${ar(netVendeur(x.prix))} versés par la boutique.` : STATUTS[x.etat][1]}</p>
      ${x.etat === 'attente' || x.etat === 'en_ligne' ? `<button class="btn clair" style="height:44px" data-a="retirer-annonce" data-id="${x.id}">Retirer l’annonce</button>` : ''}</div>`).join('')
      : `<div class="carte col vide"><span class="rond" style="width:64px;height:64px;background:var(--lime-soft)">${ic('etiquette', 28)}</span><b style="font-size:17px">Aucune annonce</b><span class="petit" style="font-size:13px">Vendez vos pièces en trop : la boutique s’occupe de l’acheteur.</span><a href="#vendre" class="btn" style="width:auto;padding:0 22px;height:48px;margin-top:6px">Vendre une pièce</a></div>`}</div>`;
  };

  V.validation = () => {
    const att = annonces.filter((x) => x.etat === 'attente'), res = annonces.filter((x) => x.etat === 'reservee');
    const fiche = (x, boutons) => `<div class="carte col" style="gap:10px">
      <div class="ligne" style="gap:12px;align-items:flex-start"><span class="vign" style="width:88px;height:88px">${img(deAnnonce(x))}</span>
      <div class="col" style="flex:1;gap:2px"><b style="font-size:15px;font-weight:600">${esc(x.titre)}</b><span class="petit">${esc(x.compat)} · ${esc(x.etatPiece)}</span><span class="prix" style="font-size:15px">${ar(x.prix)}</span>
      <span class="petit">Vendeur : ${esc(x.vendeur.nom)} · +261 ${esc(x.vendeur.tel)}</span></div></div>
      ${(x.photos || []).length > 1 ? `<div class="defile" style="gap:6px">${x.photos.map((u) => `<img src="${u}" alt="" class="photo-reelle" style="width:86px;height:86px;flex-shrink:0">`).join('')}</div>` : ''}
      ${x.description ? `<p class="petit" style="margin:0;font-size:13px">${esc(x.description)}</p>` : ''}${boutons}</div>`;
    return `<div class="ecran">${entete('Espace boutique', 'compte')}
    <p class="demo" style="margin:0">Démonstration : dans la vraie app, cet écran sera réservé à votre compte boutique. Le numéro du vendeur n’apparaît qu’ici.</p>
    <h2 class="h2">Annonces à valider <span class="petit">(${att.length})</span></h2>
    ${att.length ? att.map((x) => fiche(x, `<div class="choix"><button class="btn clair" style="height:46px" data-a="refuser" data-id="${x.id}">Refuser</button><button class="btn" style="height:46px" data-a="valider" data-id="${x.id}">Mettre en ligne</button></div>`)).join('') : '<p class="petit" style="margin:0">Aucune annonce en attente.</p>'}
    <h2 class="h2" style="margin-top:6px">Pièces réservées <span class="petit">(${res.length})</span></h2>
    ${res.length ? res.map((x) => fiche(x, `<p class="petit" style="margin:0">Commande ${esc(x.commande || '')} · dépôt attendu avant ${limiteDepot(x)}.</p>
      <div class="choix"><button class="btn clair" style="height:46px" data-a="remettre-en-vente" data-id="${x.id}">Refusée ou absente</button><button class="btn" style="height:46px" data-a="vendue" data-id="${x.id}">Vendue</button></div>`)).join('') : '<p class="petit" style="margin:0">Aucune pièce réservée.</p>'}</div>`;
  };

  V.conditions = () => `<div class="ecran">${entete('Conditions', 'compte')}
    <div class="carte col texte-legal"><h1 class="h2" style="font-size:18px">Vente de pièces entre particuliers</h1>
      <p class="demo" style="margin:0">Projet de texte, à faire relire par un professionnel du droit avant la mise en service.</p>
      <h2>1. Rôle de ${esc(B.nom)}</h2><p>${esc(B.nom)} met en relation, par l’intermédiaire de son magasin, des particuliers qui vendent des pièces détachées et des acheteurs. La boutique n’est ni le vendeur ni le propriétaire des pièces. Elle ne les contrôle pas, ne les teste pas et n’apporte aucune garantie sur leur état, leur fonctionnement ou leur compatibilité.</p>
      <h2>2. Pièces acceptées</h2><p>Seules les pièces détachées sont acceptées, jamais les motos ni les scooters. La boutique peut refuser toute annonce sans avoir à se justifier, notamment les pièces d’origine douteuse ou les pièces de sécurité usées.</p>
      <h2>3. Pour le vendeur</h2><p>Le vendeur déclare être propriétaire de la pièce et publie une photo réelle. Il fixe librement son prix. Quand la pièce est réservée, il doit la déposer au magasin sous ${PP.delaiDepot}, sinon la réservation est annulée. Une carte d’identité lui est demandée au comptoir lors de son premier dépôt. Il est payé dès que l’acheteur prend la pièce, déduction faite d’une commission de ${Math.round(PP.commission * 100)} % du prix de vente.</p>
      <h2>4. Pour l’acheteur</h2><p>L’acheteur verse un acompte de ${Math.round(PP.acompte * 100)} % à la réservation. Il examine la pièce au comptoir et paie le reste s’il la garde. La pièce est vendue en l’état, sans garantie ni reprise après le retrait. S’il la refuse au comptoir, son acompte lui est remboursé. S’il ne vient pas dans les ${PP.retrait} suivant l’arrivée de la pièce au magasin, l’acompte est conservé et partagé entre la boutique et le vendeur.</p>
      <h2>5. Pas de contact direct</h2><p>Acheteur et vendeur ne sont jamais mis en relation : la boutique ne communique ni nom ni numéro de l’un à l’autre. Toute la vente se fait par l’application et au magasin.</p>
      <h2>6. Pièce non vendue</h2><p>Si l’acheteur refuse la pièce ou ne vient pas, le vendeur dispose de ${PP.reprise} pour la reprendre au magasin ou demander sa remise en vente.</p>
      <h2>7. Retrait</h2><p>Toutes les pièces vendues entre particuliers se récupèrent au magasin ${esc(B.nom)}, ${esc(B.ville)}. Aucune livraison.</p></div></div>`;

  const famillesHtml = () => {
    const g = [...new Set(annonces.filter((x) => x.etat === 'en_ligne').map((x) => x.groupe || 'Autres'))].sort((x, y) => (x === 'Autres') - (y === 'Autres') || x.localeCompare(y));
    if (!g.length) return '';
    return `<div class="defile" aria-label="Familles de pièces" style="gap:6px">${['', ...g].map((n) => `<button class="puce" style="height:36px" aria-pressed="${ui.groupe === n}" data-a="groupe" data-id="${esc(n)}">${n ? esc(n) : 'Toutes'}</button>`).join('')}</div>`;
  };
  const meilleursHtml = () => {
    const top = Object.keys(vendeurs).map(statV).filter((s) => s && s.top && annonces.some((x) => x.vendeurId === s.id && x.etat === 'en_ligne')).sort((a, b) => b.moy - a.moy || b.ventes - a.ventes);
    if (!top.length) return '';
    return `<div class="col" style="gap:8px"><b style="font-size:14px;font-weight:600" class="ligne">${ic('trophee', 16)}<span style="margin-left:6px">Meilleurs vendeurs</span></b>
      <div class="defile" style="gap:8px">${top.map((s) => `<a href="#vendeur-${s.id}" class="vendeur-carte"><span class="avatar">${ic('user', 18)}</span><span class="col" style="gap:1px"><b>${esc(s.alias)}</b>
        <span class="ligne" style="gap:4px">${etoiles(s.moy, 12)}<b style="font-size:12px">${note1(s.moy)}</b></span><span class="petit">${pl(s.ventes, 'vente')}</span></span></a>`).join('')}</div></div>`;
  };
  const blocVendeur = (p) => {
    const s = statV(p.vendeurId); if (!s) return '';
    const pct = (t) => s.n ? Math.round(100 * (s.tags[t] || 0) / s.n) : 0;
    return `<a href="#vendeur-${s.id}" class="carte col bloc-vendeur" style="gap:10px">
      <div class="ligne" style="gap:12px"><span class="avatar">${ic('user', 20)}</span><span class="col" style="flex:1;gap:2px"><b style="font-size:15px;font-weight:600">${esc(s.alias)}</b>
        <span class="petit">${s.n ? `${pl(s.ventes, 'vente')} · ${s.n + ' avis'}` : 'Nouveau vendeur, pas encore noté'}</span></span>${s.top ? `<span class="badge top">${ic('trophee', 12)}Meilleur vendeur</span>` : ''}</div>
      ${s.n ? `<div class="ligne" style="gap:8px">${etoiles(s.moy, 18)}<b style="font-size:16px">${note1(s.moy)}</b><span class="petit">sur 5</span></div>
      <div class="jauges">${Object.entries(TAGS).map(([k, l]) => `<div><span class="petit">${l}</span><span class="jauge"><i style="width:${pct(k)}%"></i></span><b>${pct(k)} %</b></div>`).join('')}</div>` : ''}
      <span class="petit ligne" style="gap:6px">${ic('bouclier', 14)}Notes laissées uniquement par des acheteurs ayant récupéré une pièce. Voir ses autres pièces ${ic('fleche', 14)}</span></a>`;
  };
  const noterHtml = (c) => {
    const lignes = c.lignes.map((l, i) => ({ l, i })).filter(({ l }) => l.vendeurId);
    if (!lignes.length) return '';
    return lignes.map(({ l, i }) => {
      const p = produit(l.id), s = statV(l.vendeurId), cle = c.code + '~' + i, o = ui.notes[cle] || { tags: [] };
      if (l.note) return `<div class="carte ligne" style="gap:10px">${ic('check', 18)}<span class="petit" style="font-size:13px">Vous avez donné ${pl(l.note, 'étoile')} à ${esc(s ? s.alias : 'ce vendeur')} pour « ${esc(p ? p.nom : '')} ». Merci !</span></div>`;
      return `<div class="carte col noter" style="gap:12px"><h2 class="h2" style="font-size:16px">Notez ${esc(s ? s.alias : 'le vendeur')}</h2>
        <span class="petit">Pour « ${esc(p ? p.nom : 'votre pièce')} ». Votre note aide les autres clients à choisir.</span>
        <div class="choix-etoiles" role="radiogroup" aria-label="Note de 1 à 5 étoiles">${[1, 2, 3, 4, 5].map((k) => `<button role="radio" aria-checked="${o.n === k}" aria-label="${pl(k, 'étoile')}" data-a="note-etoile" data-id="${cle}|${k}" class="${o.n >= k ? 'on' : ''}">${ic('etoile', 30, o.n >= k ? 'fill="currentColor"' : '')}</button>`).join('')}</div>
        <div class="ligne" style="gap:8px;flex-wrap:wrap">${Object.entries(TAGS).map(([k, t]) => `<button class="puce" style="height:38px" aria-pressed="${o.tags.includes(k)}" data-a="note-tag" data-id="${cle}|${k}">${o.tags.includes(k) ? ic('check', 14) : ''}${t}</button>`).join('')}</div>
        <button class="btn" style="height:50px" data-a="note-envoyer" data-id="${cle}">Envoyer ma note</button></div>`;
    }).join('');
  };
  V.vendeur = (vid) => {
    const s = statV(vid); if (!s) return V.introuvable();
    const l = annonces.filter((x) => x.vendeurId === vid && x.etat === 'en_ligne').map(deAnnonce);
    return `<div class="ecran">${entete(esc(s.alias), 'catalogue-occasion')}
    <div class="carte col" style="gap:12px;align-items:center;text-align:center"><span class="avatar" style="width:64px;height:64px">${ic('user', 28)}</span>
      <b style="font-size:18px">${esc(s.alias)}</b>${s.top ? `<span class="badge top">${ic('trophee', 12)}Meilleur vendeur</span>` : ''}
      ${s.n ? `<div class="ligne" style="gap:8px">${etoiles(s.moy, 20)}<b style="font-size:18px">${note1(s.moy)}</b></div><span class="petit">${pl(s.ventes, 'vente')} · ${s.n + ' avis'} d'acheteurs</span>` : '<span class="petit">Nouveau vendeur, pas encore noté</span>'}
      <span class="petit" style="max-width:280px">Pour votre sécurité, le nom et le numéro du vendeur restent confidentiels : tout passe par la boutique.</span></div>
    <h2 class="h2">Ses pièces en vente <span class="petit">(${l.length})</span></h2>
    ${l.length ? `<div class="grille">${l.map(carteProd).join('')}</div>` : '<p class="petit">Aucune pièce en vente pour le moment.</p>'}</div>`;
  };

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
    const m = h.match(/^(accueil|catalogue|produit|panier|connexion|paiement|confirmation|suivi|compte|vendre|annonces|validation|conditions|vendeur)(?:-(.+))?$/);
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
      if (p.particulier && (p.etatAnnonce !== 'en_ligne' || panier[id])) { toast(panier[id] ? 'Cette pièce unique est déjà dans votre panier' : 'Pièce déjà réservée'); return; }
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
    plus(id) { const p = produit(decoupe(id).id); if (p && p.particulier) { toast('Pièce unique'); return; } panier[id] = (panier[id] || 0) + 1; sauver(); rafraichir(); },
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
      const c = { code: 'DMS-' + num, date: new Date().toLocaleDateString('fr-FR'), lignes: t.lignes.map(({ p, q, taille }) => ({ id: p.id, taille, q, prix: p.prix, vendeurId: p.vendeurId || '' })),
        total: t.total, mode: ui.mode, paiement: ui.paiement, statut: 0, tel: client.tel, acompte: t.acompte };
      t.lignes.filter((l) => l.p.particulier).forEach((l) => { const x = annonces.find((y) => y.id === l.p.id); if (x) { x.etat = 'reservee'; x.reserveLe = Date.now(); x.commande = c.code; } });
      commandes.push(c); panier = {}; ui.promo = null; ui.promoSaisie = ''; ui.promoMsg = ''; sauver();
      aller('confirmation-' + c.code);
    },
    valider(id) { const x = annonces.find((y) => y.id === id); if (x) { x.etat = 'en_ligne'; sauver(); toast('Annonce mise en ligne'); rafraichir(); } },
    refuser(id) { const x = annonces.find((y) => y.id === id); if (x) { x.etat = 'refusee'; sauver(); toast('Annonce refusée'); rafraichir(); } },
    vendue(id) { const x = annonces.find((y) => y.id === id); if (x) { x.etat = 'vendue'; if (vendeurs[x.vendeurId]) vendeurs[x.vendeurId].ventes++; sauver(); toast('Vente enregistrée : payez le vendeur ' + ar(netVendeur(x.prix))); rafraichir(); } },
    'remettre-en-vente'(id) { const x = annonces.find((y) => y.id === id); if (x) { x.etat = 'en_ligne'; delete x.commande; sauver(); toast('Pièce remise en vente'); rafraichir(); } },
    'retirer-annonce'(id) { const x = annonces.find((y) => y.id === id); if (x && (x.etat === 'attente' || x.etat === 'en_ligne')) { x.etat = 'retiree'; sauver(); toast('Annonce retirée'); rafraichir(); } },
    groupe(n) { ui.groupe = n || ''; rafraichir(); },
    'note-etoile'(v) { const [cle, n] = v.split('|'); ui.notes[cle] = Object.assign(ui.notes[cle] || { tags: [] }, { n: +n }); rafraichir(); },
    'note-tag'(v) { const [cle, t] = v.split('|'); const o = ui.notes[cle] = ui.notes[cle] || { tags: [] }; o.tags = o.tags.includes(t) ? o.tags.filter((x) => x !== t) : o.tags.concat(t); rafraichir(); },
    'note-envoyer'(cle) {
      const o = ui.notes[cle]; if (!o || !o.n) { toast('Choisissez de 1 à 5 étoiles'); return; }
      const [code, i] = cle.split('~'); const c = trouverCmd(code); const l = c && c.lignes[+i]; if (!l) return;
      const v = vendeurs[l.vendeurId]; if (v) { v.notes.push(o.n); v.tags = v.tags || {}; o.tags.forEach((t) => { v.tags[t] = (v.tags[t] || 0) + 1; }); }
      l.note = o.n; delete ui.notes[cle]; sauver(); toast('Merci pour votre note'); rafraichir();
    },
    'vente-accepte'() { ui.vente.accepte = !ui.vente.accepte; ui.vente.erreur = ''; rafraichir(); },
    'photo-suppr'(k) { ui.vente.photos[+k] = ''; rafraichir(); },
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
    if (k === 'v-piece') { ui.vente.piece = e.target.value; const n = e.target.value.split('|')[1]; if (!ui.vente.titre || ui.vente.titreAuto) { ui.vente.titre = n === 'Autres' ? '' : n; ui.vente.titreAuto = true; } ui.vente.erreur = ''; rafraichir(); return; }
    if (k === 'v-titre') ui.vente.titreAuto = false;
    if (k && k.startsWith('v-') && k !== 'v-photo') {
      const champ = { 'v-titre': 'titre', 'v-compat': 'compat', 'v-etat': 'etatPiece', 'v-desc': 'desc', 'v-prix': 'prix', 'v-tel': 'tel' }[k];
      if (k === 'v-prix') { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9); const n = document.getElementById('v-net'); if (n) n.innerHTML = netHtml(+e.target.value || 0); }
      ui.vente[champ] = e.target.value; ui.vente.erreur = '';
    }
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

  /* Photo de l'annonce : réduite à 900 px de large pour rester légère sur une connexion lente. */
  document.addEventListener('change', (e) => {
    if (!(e.target.dataset && e.target.dataset.in === 'v-photo') || !e.target.files || !e.target.files[0]) return;
    const slot = +e.target.dataset.slot || 0; const f = e.target.files[0]; if (!/^image\//.test(f.type)) { ui.vente.erreur = 'Choisissez une image.'; rafraichir(); return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ui.vente.photos[slot] = c.toDataURL('image/jpeg', 0.72); ui.vente.erreur = ''; rafraichir(); };
    im.onerror = () => { ui.vente.erreur = 'Impossible de lire cette photo. Essayez-en une autre.'; rafraichir(); };
    im.src = url;
  });

  document.addEventListener('submit', (e) => {
    const f = e.target.dataset.form; if (!f) return;
    e.preventDefault();
    if (f === 'vendre') {
      const v = ui.vente, chiffres = (v.tel || client.tel || '').replace(/\D/g, '').replace(/^261/, '').replace(/^0/, '');
      const nbP = [0, 1, 2].filter((k) => v.photos[k]).length;
      const err = !v.piece ? 'Choisissez le type de pièce dans la liste (ou « Autres »).' : nbP < 3 ? `Ajoutez les 3 photos obligatoires (${nbP}/3) : vue d’ensemble, références, défauts.` : v.titre.trim().length < 3 ? 'Indiquez le nom de la pièce.' : !v.compat.trim() ? 'Indiquez avec quels modèles la pièce est compatible.'
        : !(+v.prix >= 1000) ? 'Indiquez un prix d’au moins 1 000 Ar.' : !/^3[2-47-8]\d{7}$/.test(chiffres) ? 'Numéro invalide : 9 chiffres commençant par 32, 33, 34, 37 ou 38.' : !v.accepte ? 'Acceptez les conditions pour envoyer l’annonce.' : '';
      if (err) { v.erreur = err; rafraichir(); const a = document.querySelector('[role=alert]'); if (a) a.scrollIntoView({ block: 'center' }); return; }
      const tel = chiffres.replace(/^(\d{2})(\d{2})(\d{3})(\d{2})$/, '$1 $2 $3 $4'); client.tel = client.tel || tel;
      annonces.push({ id: 'occ-' + Date.now().toString(36), etat: 'attente', titre: v.titre.trim(), groupe: v.piece.split('|')[0], piece: v.piece.split('|')[1], compat: v.compat.trim(), etatPiece: v.etatPiece, prix: +v.prix, description: v.desc.trim(), photos: v.photos.filter(Boolean), photo: v.photos[0],
        vendeur: { nom: client.nom || 'Vendeur', tel }, vendeurId: 'moi', proprio: true, creeLe: Date.now() });
      if (!vendeurs.moi) vendeurs.moi = { alias: 'Vendeur n°' + String(50 + Math.floor(Math.random() * 49)), ventes: 0, notes: [], tags: {} };
      ui.vente = { titre: '', compat: '', etatPiece: 'Bon état', desc: '', prix: '', tel: '', photos: [], piece: '', accepte: false, erreur: '' };
      sauver(); toast('Annonce envoyée à la boutique'); aller('annonces'); return;
    }
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
  document.addEventListener('scroll', (e) => {
    const g = e.target; if (!g.classList || !g.classList.contains('galerie')) return;
    const i = Math.round(g.scrollLeft / g.clientWidth), n = g.children.length;
    document.querySelectorAll('.points i').forEach((d, k) => d.classList.toggle('on', k === i));
    const c = document.querySelector('.hero .compte, .compte'); if (c) c.textContent = (i + 1) + '/' + n;
  }, true);
  window.addEventListener('hashchange', route);
  route();

  /* Installation hors-ligne (ignorée là où les service workers sont bloqués) */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* aperçu : pas de service worker */ }
  }
}
