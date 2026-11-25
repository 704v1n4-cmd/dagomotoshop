/* Dagomotoshop — données de la boutique et du catalogue.
   Version 1 : catalogue de démonstration. Remplace les valeurs par tes vrais produits.
   Plus tard, ces données viendront de Firebase (voir LISEZMOI.md). */
window.DMS_DONNEES = {
  boutique: {
    nom: 'Dagomotoshop',
    ville: 'Antananarivo',
    telephone: '+261 34 00 000 00',   // à remplacer
    whatsapp: '261340000000',         // à remplacer (sans + ni espaces)
    horaires: 'Lun–Sam · 8 h–18 h',
    fraisLivraison: 5000,             // livraison Tana, en Ariary
    delaiRetrait: 'sous 3 jours'
  },
  /* Colle ici le bloc firebaseConfig de ta console Firebase pour activer Facebook, Google et l'e-mail.
     Tant qu'il vaut null, l'app est en démonstration. */
  firebaseConfig: null,
  codesPromo: { DAGO5: 0.05 },        // code : remise (0.05 = -5 %)
  categories: [
    { id: 'scooters', nom: 'Scooters', icone: 'scooter' },
    { id: 'pieces', nom: 'Pièces', icone: 'cle' },
    { id: 'accessoires', nom: 'Accessoires', icone: 'casque' }
  ],
  produits: [
    /* stock : nombre en boutique (0 = sur commande, null = non affiché). cylindree : pour le filtre. prix : null = « Prix sur demande ».
       tailles : [taille, tour de tête en cm]. versions : [version, précision] (au choix du client).
       cylindree peut être une liste, ex. [125, 150]. photoProvisoire : affiche « Photo non contractuelle ». */
    { id: 'cygnus-3', cat: 'scooters', nom: 'Yamaha Cygnus 3', detail: '125 cc · Occasion Taïwan', stock: null, cylindree: 125, prix: null,
      img: 'img/cygnus-3.png', vedette: true,
      specs: [['125 cc', 'Cylindrée'], ['3e', 'Génération'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "Yamaha Cygnus X de 3e génération, importé de Taïwan et révisé au garage. Prix, année et kilométrage sur demande." },
    { id: 'cygnus-2', cat: 'scooters', nom: 'Yamaha Cygnus 2', detail: '125 cc · Occasion Taïwan', stock: null, cylindree: 125, prix: null,
      img: 'img/cygnus-2.png', vedette: true,
      specs: [['125 cc', 'Cylindrée'], ['2e', 'Génération'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "Yamaha Cygnus X de 2e génération, importé de Taïwan et révisé au garage. Prix, année et kilométrage sur demande." },
    { id: 'cygnus-1', cat: 'scooters', nom: 'Yamaha Cygnus 1', detail: '125 cc · Occasion Taïwan', stock: null, cylindree: 125, prix: null,
      img: 'img/cygnus-1.png',
      specs: [['125 cc', 'Cylindrée'], ['1re', 'Génération'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "Yamaha Cygnus X de 1re génération, importé de Taïwan et révisé au garage. Prix, année et kilométrage sur demande." },
    { id: 'cygnus-4', cat: 'scooters', nom: 'Yamaha Cygnus 4', detail: '125 cc · Occasion Taïwan', stock: null, cylindree: 125, prix: null,
      img: 'img/cygnus-4.png',
      specs: [['125 cc', 'Cylindrée'], ['4e', 'Génération'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "Yamaha Cygnus X de 4e génération, importé de Taïwan et révisé au garage. Prix, année et kilométrage sur demande." },
    { id: 'rs-zero', cat: 'scooters', nom: 'Yamaha RS Zero', detail: '100 cc · Occasion Taïwan', stock: null, cylindree: 100, prix: null,
      img: 'img/rs-zero.png',
      specs: [['100 cc', 'Cylindrée'], ['Léger', 'Gabarit'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "Yamaha RS Zero 100 cc, léger et économique pour la ville, importé de Taïwan et révisé au garage. Prix, année et kilométrage sur demande." },
    { id: 'kymco-g6', cat: 'scooters', nom: 'Kymco G6', detail: '125 ou 150 cc · Occasion Taïwan', stock: null, cylindree: [125, 150], prix: null,
      img: 'img/kymco-g6.png', vedette: true,
      versions: [['125 cc', ''], ['150 cc', ''], ['150 VVCS', ''], ['150 ABS', 'Freinage ABS']],
      specs: [['125–150', 'cc'], ['4', 'Versions'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "Kymco G6 importé de Taïwan et révisé au garage, disponible selon arrivage en 125 cc, 150 cc, 150 VVCS (distribution variable) ou 150 ABS. Prix, année et kilométrage sur demande." },
    { id: 'kymco-vjr-110', cat: 'scooters', nom: 'Kymco VJR 100/110', detail: '100 ou 110 cc · Occasion Taïwan', stock: null, cylindree: [100, 110], prix: null,
      img: 'img/kymco-vjr-110.png',
      versions: [['100 cc', ''], ['110 cc', '']],
      specs: [['100–110', 'cc'], ['2', 'Versions'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "Kymco VJR importé de Taïwan et révisé au garage, disponible selon arrivage en 100 cc ou 110 cc. Léger et économique pour la ville. Prix, année et kilométrage sur demande." },
    { id: 'kymco-vjr-125', cat: 'scooters', nom: 'Kymco VJR 125', detail: '125 cc · Occasion Taïwan', stock: null, cylindree: 125, prix: null,
      img: 'img/kymco-vjr-125.png',
      versions: [['125 cc', ''], ['125 ABS', 'Freinage ABS']],
      specs: [['125 cc', 'Cylindrée'], ['ABS', 'En option'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "Kymco VJR 125 importé de Taïwan et révisé au garage, disponible selon arrivage en version standard ou ABS. Prix, année et kilométrage sur demande." },
    { id: 'pgo-bon', cat: 'scooters', nom: 'PGO Bon 125', detail: '125 cc · Occasion Taïwan', stock: null, cylindree: 125, prix: null,
      img: 'img/pgo-bon.png',
      specs: [['125 cc', 'Cylindrée'], ['PGO', 'Marque'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "PGO Bon 125 importé de Taïwan et révisé au garage. Prix, année et kilométrage sur demande." },
    { id: 'kymco-g5', cat: 'scooters', nom: 'Kymco G5 Megafi', detail: '125 ou 150 cc · Occasion Taïwan', stock: null, cylindree: [125, 150], prix: null,
      img: 'img/kymco-g5.png',
      versions: [['125 cc', ''], ['150 cc', ''], ['125 G6E', ''], ['125 XSENSE', '']],
      specs: [['125–150', 'cc'], ['4', 'Versions'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "Kymco G5 Megafi importé de Taïwan et révisé au garage, disponible selon arrivage en 125 cc, 150 cc, 125 G6E ou 125 XSENSE. Prix, année et kilométrage sur demande." },
    { id: 'pgo-jbubu', cat: 'scooters', nom: "PGO J'Bubu", detail: '115 ou 125 cc · Occasion Taïwan', stock: null, cylindree: [115, 125], prix: null,
      img: 'img/pgo-jbubu.png',
      versions: [['115 cc', ''], ['125 cc', '']],
      specs: [['115–125', 'cc'], ['Rétro', 'Style'], ['Taïwan', 'Origine'], ['Révisé', 'Au garage']],
      description: "PGO J'Bubu au style rétro, importé de Taïwan et révisé au garage, disponible selon arrivage en 115 cc ou 125 cc. Prix, année et kilométrage sur demande." },
    { id: 'kit-freinage', cat: 'pieces', nom: 'Kit freinage', detail: 'Plaquettes + disque', stock: 12, prix: 45000, ancienPrix: 53000,
      img: 'img/pieces.png', rond: true, badge: '-15 %',
      description: "Plaquettes et disque avant, compatibles avec la plupart des 125 cc. Pose possible au garage." },
    { id: 'courroie', cat: 'pieces', nom: 'Courroie', detail: 'Transmission 125 cc', stock: 6, prix: 38000, img: 'img/pieces.png', rond: true,
      description: "Courroie de transmission renforcée. À changer environ tous les 15 000 km." },
    { id: 'filtre-air', cat: 'pieces', nom: 'Filtre à air', detail: 'Toutes cylindrées', stock: 2, prix: 15000, img: 'img/pieces.png', rond: true,
      description: "Filtre à air lavable. Conseillé à chaque vidange en saison sèche." },
    { id: 'bougie', cat: 'pieces', nom: 'Bougie', detail: 'Allumage 50–150 cc', stock: 30, prix: 8000, img: 'img/pieces.png', rond: true,
      description: "Bougie d'allumage standard pour scooters 4 temps." },
    { id: 'casque-jet', cat: 'accessoires', nom: 'Casque jet', detail: 'Noir mat · M, L, XL', stock: 8, tailles: [['M', '57–58'], ['L', '59–60'], ['XL', '61–62']], prix: 85000, img: 'img/casque.png',
      description: "Casque jet homologué, calotte légère, intérieur amovible et lavable." },
    { id: 'casque-visiere', cat: 'accessoires', nom: 'Casque jet visière', detail: 'Noir · M, L', stock: 4, tailles: [['M', '57–58'], ['L', '59–60']], prix: 120000, img: 'img/casque.png', badge: 'Nouveau',
      description: "Casque jet avec visière longue, pratique sous la pluie." },
    { id: 'casque-enfant', cat: 'accessoires', nom: 'Casque enfant', detail: 'Noir · S', stock: 2, tailles: [['S', '52–54']], prix: 65000, img: 'img/casque.png',
      description: "Casque léger pour enfant, taille S." },
    { id: 'casque-integral', cat: 'accessoires', nom: 'Casque intégral', detail: 'Noir mat · L', stock: 1, tailles: [['L', '59–60']], prix: 180000, ancienPrix: 225000, img: 'img/casque.png', badge: '-20 %',
      description: "Protection maximale pour les longs trajets." }
  ]
};
