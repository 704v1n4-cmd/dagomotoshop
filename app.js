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
  const ui = { cat: 'scooters', recherche: '', tri: 'asc', mode: 'boutique', promoSaisie: '', promo: null, promoMsg: '',
    paiement: 'mvola', etapeCnx: 'tel', tel: '', telErreur: '', codeErreur: '', retour: 'compte' };
  const sauver = () => { store.set('panier', panier); store.set('client', client); store.set('commandes', commandes); store.set('favoris', favoris); };

  /* ---------- Outils ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const grp = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const ar = (n) => grp(n) + ' Ar';
  const fmg = (n) => grp(n * 5) + ' Fmg';
  const produit = (id) => D.produits.find((p) => p.id === id);
  const nbPanier = () => Object.values(panier).reduce((s, q) => s + q, 0);
  const img = (p, cls) => `<img src="${p.img}" alt="${esc(p.nom)}" class="${cls || ''}${p.rond ? ' rondimg' : ''}" loading="lazy">`;
  const I = {
    retour: '<path d="m15 18-6-6 6-6"/>', panier: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.1a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 7H6"/>',
    maison: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', grille: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', loupe: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', moins: '<path d="M5 12h14"/>', fleche: '<path d="m9 18 6-6-6-6"/>', coeur: '<path d="M12 21s-7.5-4.6-9.5-9.2C1 8.2 3.2 4.5 7 4.5c2.1 0 3.7 1.2 5 3 1.3-1.8 2.9-3 5-3 3.8 0 6 3.7 4.5 7.3C19.5 16.4 12 21 12 21z"/>',
    partage: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', horloge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    bulle: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z"/>', check: '<path d="M20 6 9 17l-5-5"/>',
    cle: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>', sac: '<path d="M3 9h18l-1.5 11h-15z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
    clef: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M15 8l2 2"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h0"/>',
    copie: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>', sortie: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', carte: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'
  };
  const ic = (n, s = 20, extra = '') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${I[n]}</svg>`;
  const rondPanier = () => `<a href="#panier" class="rond" aria-label="Panier, ${nbPanier()} article(s)">${ic('panier')}${nbPanier() ? `<span class="pastille">${nbPanier()}</span>` : ''}</a>`;
  const entete = (titre, retour, droite = '') => `<div class="ligne entre"><a href="#${retour}" class="rond" aria-label="Retour">${ic('retour')}</a><h1 class="h2">${titre}</h1>${droite || '<span style="width:44px"></span>'}</div>`;
  let toastT;
  const toast = (t) => { $toast.textContent = t; $toast.classList.add('vu'); clearTimeout(toastT); toastT = setTimeout(() => $toast.classList.remove('vu'), 1800); };

  function totaux() {
    const lignes = Object.entries(panier).map(([id, q]) => ({ p: produit(id), q })).filter((l) => l.p && l.q > 0);
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
      <img class="moto" src="img/scooter.png" alt="">
      <span class="sticker" style="right:min(128px,34%);bottom:14px;font-size:18px;padding:7px 10px">-10 %</span>
      <div class="txt"><b>Roulez plus loin,<br><span>payez moins.</span></b><span style="font-size:12px;color:#C9CEC9">Scooters révisés, pièces et casques.</span><a href="#catalogue">Voir le catalogue</a></div></div>
    <form class="champ" data-form="recherche" role="search">${ic('loupe', 18, 'style="color:var(--muted)"')}<input type="search" name="q" placeholder="Scooter, pièce, casque…" aria-label="Rechercher un produit"></form>
    <div class="defile" aria-label="Rayons">${D.categories.map((c) => `<a class="puce" href="#catalogue-${c.id}">${c.nom}</a>`).join('')}</div>
    <div class="ligne entre"><h2 class="h2">Offres du moment</h2><a href="#catalogue" class="petit ligne" style="font-size:13px;font-weight:500;gap:2px;min-height:44px">Tout voir${ic('fleche', 16)}</a></div>
    <div class="offres">${vedettes.map((p, i) => `<a href="#produit-${p.id}" class="offre${i === 0 ? ' noire' : ''}">
      ${img(p, 'vis')}${p.badge ? `<span class="sticker">${esc(p.badge)}</span>` : ''}
      <span class="petit">${esc(p.detail)}</span><b style="font-size:${i === 0 ? 17 : 16}px;font-weight:600">${esc(p.nom)}</b>
      <span class="ligne" style="gap:8px;align-items:baseline"><span class="prix">${ar(p.prix)}</span>${p.ancienPrix ? `<span class="barre">${grp(p.ancienPrix)}</span>` : ''}</span></a>`).join('')}</div>
  </div>`;
  };

  const carteProd = (p) => `<div class="prod">
    <a href="#produit-${p.id}" class="col" style="gap:3px"><span class="boite">${img(p)}</span>${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
    <b style="font-size:14px;font-weight:600;margin-top:6px">${esc(p.nom)}</b><span class="petit">${esc(p.detail)}</span></a>
    <div class="ligne entre" style="margin-top:4px"><span class="prix">${ar(p.prix)}</span>
    <button class="ajout" data-a="ajouter" data-id="${p.id}" aria-label="Ajouter ${esc(p.nom)} au panier">${ic('plus', 16)}</button></div></div>`;
  const listeCatalogue = () => {
    const q = ui.recherche.trim().toLowerCase();
    let l = D.produits.filter((p) => q ? (p.nom + ' ' + p.detail).toLowerCase().includes(q) : p.cat === ui.cat);
    l = l.slice().sort((a, b) => ui.tri === 'asc' ? a.prix - b.prix : b.prix - a.prix);
    return { l, q };
  };
  const grilleHtml = () => {
    const { l, q } = listeCatalogue();
    return `<p class="petit" style="margin:0;font-size:13px"><b style="color:var(--ink)">${l.length}</b> résultat(s)${q ? ` pour « ${esc(ui.recherche)} »` : ''}</p>
      ${l.length ? `<div class="grille">${l.map(carteProd).join('')}</div>` : `<div class="carte col vide"><b>Aucun produit trouvé</b><span class="petit">Essayez un autre mot, ou appelez-nous : nous commandons aussi sur demande.</span></div>`}`;
  };
  V.catalogue = (cat) => {
    if (cat && D.categories.some((c) => c.id === cat)) ui.cat = cat;
    return `<div class="ecran">
    <div class="ligne entre"><h1 class="titre">Catalogue</h1>${rondPanier()}</div>
    <label class="champ">${ic('loupe', 18, 'style="color:var(--muted)"')}<input type="search" data-in="recherche" value="${esc(ui.recherche)}" placeholder="Rechercher dans le catalogue" aria-label="Rechercher dans le catalogue"></label>
    <div role="tablist" aria-label="Rayons" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;background:var(--card);border-radius:999px;padding:4px">
      ${D.categories.map((c) => `<button role="tab" class="puce" style="justify-content:center;border:none;height:40px" aria-selected="${!ui.recherche && ui.cat === c.id}" data-a="cat" data-id="${c.id}">${c.nom}</button>`).join('')}</div>
    <div class="ligne entre"><label class="petit" for="tri" style="font-size:13px">Trier par</label>
      <select id="tri" data-in="tri" style="height:40px;border-radius:999px;border:1px solid var(--line);background:var(--card);padding:0 12px;font-size:14px">
        <option value="asc"${ui.tri === 'asc' ? ' selected' : ''}>Prix croissant</option><option value="desc"${ui.tri === 'desc' ? ' selected' : ''}>Prix décroissant</option></select></div>
    <div id="grille" class="col" style="gap:4px">${grilleHtml()}</div></div>`;
  };

  V.produit = (id) => {
    const p = produit(id);
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
        <div class="ligne" style="gap:8px;flex-wrap:wrap"><span class="prix" style="font-size:22px;font-weight:600">${ar(p.prix)}</span>
        ${p.ancienPrix ? `<span class="barre" style="font-size:13px">${grp(p.ancienPrix)}</span><span class="badge" style="background:var(--lime-soft)">-${grp(eco)} Ar</span>` : ''}</div>
        <span class="petit">soit ${fmg(p.prix)} · paiement MVola, Orange Money ou espèces</span></div>
      ${p.specs ? `<div class="specs">${p.specs.map(([v, l]) => `<div><b>${esc(v)}</b><span class="petit" style="font-size:11px">${esc(l)}</span></div>`).join('')}</div>` : ''}
      <div class="carte ligne entre petit" style="padding:12px 16px;font-size:13px;flex-wrap:wrap;gap:8px"><span class="ligne" style="gap:8px">${ic('pin', 18)}Retrait ${esc(B.delaiRetrait)}</span><span class="ligne" style="gap:8px">${ic('horloge', 18)}${esc(B.horaires)}</span></div>
      <div class="carte col" style="gap:6px"><h2 class="h2" style="font-size:15px">Description</h2><p class="petit" style="margin:0;font-size:13px;line-height:1.5">${esc(p.description)}</p></div>
      <div class="carte ligne" style="padding:12px 16px"><img src="img/logo.jpg" alt="" style="width:44px;height:44px;border-radius:10px">
        <div class="col" style="flex:1"><b style="font-weight:600">${B.nom}</b><span class="petit">${esc(B.ville)} · ${esc(B.telephone)}</span></div>
        <a class="rond lime" href="tel:${B.telephone.replace(/\s/g, '')}" aria-label="Appeler la boutique au ${esc(B.telephone)}">${ic('tel')}</a></div>
    </div></div>
    <div class="basbar">${rondPanier().replace('class="rond"', 'class="rond" style="width:54px;height:54px;background:var(--bg)"')}
      <button class="btn" data-a="ajouter-aller" data-id="${p.id}">Ajouter au panier</button></div>`;
  };

  V.panier = () => {
    const t = totaux();
    const tete = entete(`Mon panier <span class="petit" style="font-size:17px">(${t.n})</span>`, 'catalogue', t.n ? '<button data-a="vider" style="height:44px;padding:0 4px;font-size:13px;font-weight:500;color:var(--muted)">Vider</button>' : '');
    if (!t.n) return `<div class="ecran">${tete}<div class="carte col vide"><span class="rond" style="width:64px;height:64px;background:var(--lime-soft)">${ic('panier', 28)}</span>
      <b style="font-size:17px">Votre panier est vide</b><span class="petit" style="font-size:13px">Scooters, pièces et casques vous attendent dans le catalogue.</span>
      <a href="#catalogue" class="btn" style="width:auto;padding:0 22px;height:48px;margin-top:6px">Voir le catalogue</a></div></div>`;
    return `<div class="ecran">${tete}
    <div class="carte" style="padding:4px 14px">${t.lignes.map(({ p, q }) => `<div class="article">
      <a href="#produit-${p.id}" class="vign">${img(p)}</a>
      <div class="col" style="flex:1;gap:1px"><b style="font-size:14px;font-weight:600">${esc(p.nom)}</b><span class="petit">${esc(p.detail)}</span><span class="prix" style="font-size:14px;margin-top:2px">${ar(p.prix * q)}</span></div>
      <div class="pas"><button data-a="moins" data-id="${p.id}" aria-label="${q === 1 ? 'Retirer' : 'Diminuer la quantité de'} ${esc(p.nom)}">${ic('moins', 16)}</button><span aria-live="polite">${q}</span>
      <button class="plus" data-a="plus" data-id="${p.id}" aria-label="Augmenter la quantité de ${esc(p.nom)}">${ic('plus', 16)}</button></div></div>`).join('')}</div>
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

  V.connexion = () => {
    const tel = ui.etapeCnx === 'tel';
    return `<div class="ecran" style="padding-top:0">
    <div class="hero" style="height:250px"><a href="#${ui.retour === 'paiement' ? 'panier' : 'compte'}" class="rond" style="position:relative;background:rgba(255,255,255,.12);color:#fff" aria-label="Retour">${ic('retour')}</a>
      <img src="img/logo.jpg" alt="Dagomotoshop" style="position:relative;width:64px;height:64px;border-radius:14px;margin-top:16px">
      <p style="position:relative;color:#fff;font-weight:700;font-size:22px;line-height:1.2;max-width:210px;margin:12px 0 0">${ui.retour === 'paiement' ? 'Plus qu’une étape avant votre <span style="color:var(--lime)">réservation.</span>' : 'Retrouvez vos <span style="color:var(--lime)">commandes.</span>'}</p></div>
    <img src="img/scooter.png" alt="" style="position:absolute;z-index:3;right:-26px;top:calc(110px + env(safe-area-inset-top));width:180px;filter:drop-shadow(0 14px 14px rgba(0,0,0,.45))">
    <div class="dessus" style="gap:14px;padding-top:22px">
    ${tel ? `<div class="col" style="gap:4px"><h1 class="h2" style="font-size:19px">Connexion par téléphone</h1><span class="petit" style="font-size:13px">Pas de mot de passe : vous recevez un code par SMS.</span></div>
      <form class="col" style="gap:6px" data-form="tel"><label class="lib" for="tel">Numéro de téléphone</label>
      <div class="tel"><span><svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true"><rect width="10" height="20" fill="#fff"/><rect x="10" width="20" height="10" fill="#FC3D32"/><rect x="10" y="10" width="20" height="10" fill="#007E3A"/><rect x=".5" y=".5" width="29" height="19" fill="none" stroke="#E2E5DF"/></svg>+261</span>
      <input id="tel" type="tel" inputmode="numeric" autocomplete="tel-national" data-in="tel" value="${esc(ui.tel)}" placeholder="34 00 000 00" aria-describedby="tel-aide"></div>
      <span id="tel-aide" class="petit" style="color:${ui.telErreur ? 'var(--err)' : 'var(--muted)'}">${esc(ui.telErreur || 'Telma, Orange ou Airtel. Le même numéro peut servir pour MVola ou Orange Money.')}</span>
      <button class="btn" style="margin-top:6px">Recevoir le code</button></form>`
    : `<div class="col" style="gap:4px"><h1 class="h2" style="font-size:19px">Entrez le code reçu</h1>
      <span class="petit" style="font-size:13px">Code à 6 chiffres envoyé au <b style="color:var(--ink)">+261 ${esc(ui.tel)}</b>. <button data-a="changer-tel" style="font-weight:600;text-decoration:underline;font-size:13px;min-height:24px">Modifier</button></span></div>
      <form class="col" style="gap:10px" data-form="code"><div class="code" role="group" aria-label="Code de vérification">${[1, 2, 3, 4, 5, 6].map((n) => `<input inputmode="numeric" maxlength="1" autocomplete="${n === 1 ? 'one-time-code' : 'off'}" data-in="code" aria-label="Chiffre ${n}">`).join('')}</div>
      <span class="petit" style="color:var(--err)" role="status">${esc(ui.codeErreur)}</span>
      <p class="demo" style="margin:0">Version de démonstration : le code est <b>123456</b>. L'envoi de vrais SMS arrive avec Firebase.</p>
      <button class="btn">Vérifier et continuer</button></form>`}
    <p class="petit" style="text-align:center;font-size:11px;margin:4px 0 0">En continuant, vous acceptez les conditions de vente de ${B.nom}.</p>
    </div></div>`;
  };

  const notesPaiement = { mvola: 'Vous recevrez une demande de paiement MVola sur votre téléphone après confirmation.', orange: 'Vous recevrez une demande de paiement Orange Money sur votre téléphone après confirmation.', especes: 'Vous payez en espèces à la boutique, au moment du retrait.' };
  V.paiement = () => {
    const t = totaux();
    if (!t.n) { location.hash = 'panier'; return ''; }
    if (!client) { ui.retour = 'paiement'; location.hash = 'connexion'; return ''; }
    return `<div class="ecran">${entete('Paiement', 'panier')}
    <div class="carte col" style="gap:10px"><h2 class="h2" style="font-size:15px">Votre commande</h2>
      ${t.lignes.map(({ p, q }) => `<div class="ligne"><span class="vign" style="width:48px;height:48px;border-radius:12px">${img(p)}</span><span style="flex:1;font-size:14px">${esc(p.nom)} <span class="petit">× ${q}</span></span><span class="prix" style="font-size:14px">${ar(p.prix * q)}</span></div>`).join('')}</div>
    <div class="carte ligne petit" style="font-size:13px;padding:12px 16px">${ic(ui.mode === 'livraison' ? 'pin' : 'sac', 18)}<span>${ui.mode === 'livraison' ? 'Livraison à Tana sous 48 h' : `Retrait chez ${B.nom}, ${esc(B.ville)} · ${esc(B.delaiRetrait)}`}</span></div>
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
      <span style="width:96px;height:96px;border-radius:50%;background:var(--lime);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 12px var(--lime-soft);margin:12px 0 10px">${ic('check', 44, 'stroke-width="2.6"')}</span>
      <h1 class="titre" style="font-size:26px">Réservation confirmée !</h1>
      <p class="petit" style="font-size:14px;margin:0;max-width:300px">Nous préparons votre commande. Vous recevrez un SMS dès qu'elle est prête.</p></div>
    <div class="carte ligne entre" style="background:var(--ink);color:#fff;border-radius:22px">
      <div class="col"><span class="petit" style="color:var(--dim)">Code de retrait à présenter en boutique</span><b style="font-size:28px;font-weight:800;letter-spacing:2px;color:var(--lime)">${esc(c.code)}</b></div>
      <button class="rond" style="background:rgba(255,255,255,.12);color:#fff" data-a="copier" data-id="${esc(c.code)}" aria-label="Copier le code">${ic('copie', 18)}</button></div>
    <div class="carte col" style="gap:9px;font-size:13px">
      <div class="ligne" style="gap:10px">${ic('panier', 18)}<span>${c.lignes.reduce((s, l) => s + l.q, 0)} article(s) · <b class="nw">${ar(c.total)}</b></span></div>
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
    <div class="carte" style="padding:4px 14px">${c.lignes.map((l) => { const p = produit(l.id); return p ? `<div class="article"><span class="vign">${img(p)}</span><div class="col" style="flex:1"><b style="font-size:14px;font-weight:600">${esc(p.nom)}</b><span class="petit">× ${l.q}</span></div><span class="prix" style="font-size:14px">${ar(l.prix * l.q)}</span></div>` : ''; }).join('')}
      <div class="ligne entre" style="padding:12px 0;border-top:1px solid var(--line);font-weight:600"><span>Total</span><span class="prix">${ar(c.total)}</span></div></div>
    <p class="petit" style="margin:0">Le statut est mis à jour par la boutique.</p>
    ${s < 3 ? `<button class="btn clair" data-a="demo-statut" data-id="${esc(c.code)}">Démo : passer à l'étape suivante</button>` : ''}</div>`;
  };

  V.compte = () => {
    if (!client) { return `<div class="ecran"><h1 class="titre">Mon compte</h1>
      <div class="carte col vide"><span class="rond" style="width:64px;height:64px;background:var(--lime-soft)">${ic('user', 28)}</span><b style="font-size:17px">Connectez-vous</b>
      <span class="petit" style="font-size:13px">Avec votre numéro de téléphone, pour suivre vos commandes et votre carte fidélité.</span>
      <button class="btn" data-a="aller-connexion" style="margin-top:6px">Se connecter</button></div>${menuCompte()}</div>`; }
    const n = commandes.length, f = n % 5;
    return `<div class="ecran"><h1 class="titre">Mon compte</h1>
    <div class="carte col" style="background:var(--ink);color:#fff;border-radius:22px;gap:14px">
      <div class="ligne"><span class="rond lime" style="width:52px;height:52px;font-weight:700">${ic('user', 22)}</span>
        <div class="col" style="flex:1"><b style="font-weight:600;font-size:16px">+261 ${esc(client.tel)}</b><span class="petit" style="color:var(--dim)">${n} commande(s)</span></div></div>
      <div class="col" style="gap:8px"><div class="ligne entre" style="font-size:13px"><b style="font-weight:600">Carte fidélité</b><span style="color:var(--dim)"><b style="color:var(--lime)">${f}</b> achat(s) sur 5</span></div>
        <div role="progressbar" aria-label="Carte fidélité" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${f}" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">${[0, 1, 2, 3, 4].map((k) => `<span style="height:8px;border-radius:4px;background:${k < f ? 'var(--lime)' : '#3A3E3A'}"></span>`).join('')}</div>
        <span class="petit" style="color:var(--dim)">Encore ${5 - f} achat(s) pour une révision offerte au garage.</span></div></div>
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

  /* ---------- Navigation ---------- */
  const AVEC_NAV = ['accueil', 'catalogue', 'compte'];
  let derniere = '';
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || 'accueil';
    const m = h.match(/^(accueil|catalogue|produit|panier|connexion|paiement|confirmation|suivi|compte)(?:-(.+))?$/);
    const nom = m ? m[1] : 'introuvable';
    const html = (V[nom] || V.introuvable)(m && m[2]);
    if (!html) return; // redirection en cours
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
    ajouter(id) { panier[id] = (panier[id] || 0) + 1; sauver(); toast('Ajouté au panier'); rafraichir(); },
    'ajouter-aller'(id) { panier[id] = (panier[id] || 0) + 1; sauver(); aller('panier'); },
    plus(id) { panier[id] = (panier[id] || 0) + 1; sauver(); rafraichir(); },
    moins(id) { panier[id] = (panier[id] || 0) - 1; if (panier[id] <= 0) delete panier[id]; sauver(); rafraichir(); },
    vider() { panier = {}; sauver(); rafraichir(); },
    cat(id) { ui.cat = id; ui.recherche = ''; aller('catalogue-' + id); },
    mode(id) { ui.mode = id; rafraichir(); },
    'payer-par'(id) { ui.paiement = id; rafraichir(); },
    retour() { if (history.length > 1) history.back(); else aller('accueil'); },
    favori(id) { favoris = favoris.includes(id) ? favoris.filter((f) => f !== id) : favoris.concat(id); sauver(); rafraichir(); },
    async partager(id) {
      const p = produit(id), texte = `${p.nom} à ${ar(p.prix)} chez ${B.nom}`;
      try { if (navigator.share) { await navigator.share({ title: p.nom, text: texte, url: location.href }); return; } await navigator.clipboard.writeText(texte + ' ' + location.href); toast('Lien copié'); }
      catch (e) { toast('Partage indisponible ici'); }
    },
    async copier(code) { try { await navigator.clipboard.writeText(code); toast('Code copié'); } catch (e) { toast('Notez le code : ' + code); } },
    commander() { if (client) aller('paiement'); else { ui.retour = 'paiement'; ui.etapeCnx = 'tel'; aller('connexion'); } },
    'aller-connexion'() { ui.retour = 'compte'; ui.etapeCnx = 'tel'; aller('connexion'); },
    'changer-tel'() { ui.etapeCnx = 'tel'; ui.codeErreur = ''; rafraichir(); },
    deconnexion() { client = null; sauver(); toast('Déconnecté'); rafraichir(); },
    confirmer() {
      const t = totaux();
      const num = String(128 + commandes.length).padStart(4, '0');
      const c = { code: 'DMS-' + num, date: new Date().toLocaleDateString('fr-FR'), lignes: t.lignes.map(({ p, q }) => ({ id: p.id, q, prix: p.prix })),
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

  document.addEventListener('input', (e) => {
    const k = e.target.dataset.in;
    if (k === 'recherche') { ui.recherche = e.target.value; const g = document.getElementById('grille'); if (g) g.innerHTML = grilleHtml();
      document.querySelectorAll('[role=tab]').forEach((b) => b.setAttribute('aria-selected', String(!ui.recherche && b.dataset.id === ui.cat))); }
    if (k === 'tri') { ui.tri = e.target.value; const g = document.getElementById('grille'); if (g) g.innerHTML = grilleHtml(); }
    if (k === 'promo') ui.promoSaisie = e.target.value;
    if (k === 'tel') ui.tel = e.target.value;
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
    if (f === 'recherche') { ui.recherche = e.target.q.value; aller('catalogue'); }
    if (f === 'promo') {
      const code = ui.promoSaisie.trim().toUpperCase();
      if (D.codesPromo[code]) { ui.promo = code; ui.promoMsg = `Code ${code} appliqué : -${Math.round(D.codesPromo[code] * 100)} % sur la commande.`; }
      else { ui.promo = null; ui.promoMsg = code ? 'Ce code n’existe pas ou a expiré.' : 'Entrez un code.'; }
      rafraichir();
    }
    if (f === 'tel') {
      const chiffres = ui.tel.replace(/\D/g, '').replace(/^261/, '').replace(/^0/, '');
      if (!/^3[2-47-8]\d{7}$/.test(chiffres)) { ui.telErreur = 'Numéro invalide : 9 chiffres commençant par 32, 33, 34, 37 ou 38.'; rafraichir(); return; }
      ui.tel = chiffres.replace(/^(\d{2})(\d{2})(\d{3})(\d{2})$/, '$1 $2 $3 $4'); ui.telErreur = ''; ui.codeErreur = ''; ui.etapeCnx = 'code'; rafraichir();
      const c = document.querySelector('[data-in=code]'); if (c) c.focus();
    }
    if (f === 'code') {
      const code = [...document.querySelectorAll('[data-in=code]')].map((c) => c.value).join('');
      if (code !== '123456') { ui.codeErreur = code.length < 6 ? 'Entrez les 6 chiffres du code.' : 'Code incorrect. Vérifiez le SMS et réessayez.'; rafraichir(); return; }
      client = { tel: ui.tel }; ui.etapeCnx = 'tel'; ui.codeErreur = ''; sauver(); toast('Connecté'); aller(ui.retour || 'compte');
    }
  });

  window.addEventListener('hashchange', route);
  route();

  /* Installation hors-ligne (ignorée là où les service workers sont bloqués) */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* aperçu : pas de service worker */ }
  }
}
