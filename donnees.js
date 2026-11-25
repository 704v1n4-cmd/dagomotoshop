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
    /* stock : nombre en boutique (0 = sur commande). cylindree : pour le filtre des scooters. tailles : [taille, tour de tête en cm]. */
    { id: 'scooter-125', cat: 'scooters', nom: 'Scooter 125 cc', detail: 'Occasion Taïwan · 2019', stock: 2, cylindree: 125, prix: 3800000, ancienPrix: 4200000,
      img: 'img/scooter.png', badge: '-10 %', vedette: true,
      specs: [['125 cc', 'Moteur'], ['2019', 'Année'], ['18 000', 'km'], ['3 mois', 'Garantie']],
      description: "Scooter d'occasion importé de Taïwan, révisé au garage. Dossier de mutation et casque offerts." },
    { id: 'scooter-50', cat: 'scooters', nom: 'Scooter 50 cc', detail: 'Occasion Taïwan · 2018', stock: 3, cylindree: 50, prix: 2900000,
      img: 'img/scooter.png', specs: [['50 cc', 'Moteur'], ['2018', 'Année'], ['22 000', 'km'], ['3 mois', 'Garantie']],
      description: "Idéal pour la ville. Révisé au garage, dossier de mutation inclus." },
    { id: 'scooter-125-2020', cat: 'scooters', nom: 'Scooter 125 cc', detail: 'Occasion Taïwan · 2020', stock: 1, cylindree: 125, prix: 4300000,
      img: 'img/scooter.png', specs: [['125 cc', 'Moteur'], ['2020', 'Année'], ['11 000', 'km'], ['3 mois', 'Garantie']],
      description: "Faible kilométrage. Révisé au garage, dossier de mutation inclus." },
    { id: 'scooter-150', cat: 'scooters', nom: 'Scooter 150 cc', detail: 'Occasion Taïwan · 2021', stock: 0, cylindree: 150, prix: 5200000,
      img: 'img/scooter.png', badge: 'Nouveau', specs: [['150 cc', 'Moteur'], ['2021', 'Année'], ['8 000', 'km'], ['6 mois', 'Garantie']],
      description: "Le plus puissant de la gamme, pour les trajets longs et les côtes de Tana." },
    { id: 'kit-freinage', cat: 'pieces', nom: 'Kit freinage', detail: 'Plaquettes + disque', stock: 12, prix: 45000, ancienPrix: 53000,
      img: 'img/pieces.png', rond: true, badge: '-15 %', vedette: true,
      description: "Plaquettes et disque avant, compatibles avec la plupart des 125 cc. Pose possible au garage." },
    { id: 'courroie', cat: 'pieces', nom: 'Courroie', detail: 'Transmission 125 cc', stock: 6, prix: 38000, img: 'img/pieces.png', rond: true,
      description: "Courroie de transmission renforcée. À changer environ tous les 15 000 km." },
    { id: 'filtre-air', cat: 'pieces', nom: 'Filtre à air', detail: 'Toutes cylindrées', stock: 2, prix: 15000, img: 'img/pieces.png', rond: true,
      description: "Filtre à air lavable. Conseillé à chaque vidange en saison sèche." },
    { id: 'bougie', cat: 'pieces', nom: 'Bougie', detail: 'Allumage 50–150 cc', stock: 30, prix: 8000, img: 'img/pieces.png', rond: true,
      description: "Bougie d'allumage standard pour scooters 4 temps." },
    { id: 'casque-jet', cat: 'accessoires', nom: 'Casque jet', detail: 'Noir mat · M, L, XL', stock: 8, tailles: [['M', '57–58'], ['L', '59–60'], ['XL', '61–62']], prix: 85000, img: 'img/casque.png', vedette: true,
      description: "Casque jet homologué, calotte légère, intérieur amovible et lavable." },
    { id: 'casque-visiere', cat: 'accessoires', nom: 'Casque jet visière', detail: 'Noir · M, L', stock: 4, tailles: [['M', '57–58'], ['L', '59–60']], prix: 120000, img: 'img/casque.png', badge: 'Nouveau',
      description: "Casque jet avec visière longue, pratique sous la pluie." },
    { id: 'casque-enfant', cat: 'accessoires', nom: 'Casque enfant', detail: 'Noir · S', stock: 2, tailles: [['S', '52–54']], prix: 65000, img: 'img/casque.png',
      description: "Casque léger pour enfant, taille S." },
    { id: 'casque-integral', cat: 'accessoires', nom: 'Casque intégral', detail: 'Noir mat · L', stock: 1, tailles: [['L', '59–60']], prix: 180000, ancienPrix: 225000, img: 'img/casque.png', badge: '-20 %',
      description: "Protection maximale pour les longs trajets." }
  ]
};
