/*
 * CATALOGUE — pour ajouter un vêtement, copie un bloc de « produits » et change :
 * id, nom, prixAchat (TTC), tailles, couleurs, modele (le dessin : polo, sweat, polaire, debardeur,
 * maillot, short-basket, short-tennis), vitrine (emplacements du prix affiché) et zones.
 * Les zones sont en cm sur le dessin du vêtement (90 cm de large) : cx = centre horizontal,
 * top = haut de la zone (ou cy = centre), w/h = taille max de la zone.
 */
window.DATA = {
  service: {
    nom: "Fabr'Icam Flocage",
    email: "fabricam.toulouse@icam.fr"
  },

  // texteSeul : emplacement réservé à un prénom ou un numéro (pas de visuel)
  emplacements: {
    poitrine:    { label: "Poitrine", formats: ["A6", "A5"] },
    dos:         { label: "Dos", formats: ["A5", "A4"] },
    manche_g:    { label: "Manche gauche", formats: ["A6"] },
    manche_d:    { label: "Manche droite", formats: ["A6"] },
    cuisse_g:    { label: "Cuisse gauche", formats: ["A6", "A5"] },
    cuisse_d:    { label: "Cuisse droite", formats: ["A6", "A5"] },
    bas_jambe_g: { label: "Bas de la jambe gauche", formats: [], texteSeul: true }
  },

  // Polices proposées pour les prénoms et numéros (Google Fonts, chargées en ligne)
  polices: [
    "Bebas Neue", "Anton", "Big Shoulders Display", "Oswald", "Teko", "Staatliches", "Russo One",
    "Black Ops One", "Archivo Black", "Alfa Slab One", "Bungee", "Righteous",
    "Montserrat", "Permanent Marker", "Pacifico", "Lobster", "Press Start 2P"
  ],

  produits: [
    {
      id: "polo-essential",
      nomCourt: "Polo",
      nom: "Polo de tennis Essential",
      marque: "Kuikma, Decathlon",
      modele: "polo",
      demonstratif: "ce polo",
      prixAchat: 7.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "marine", nom: "Marine", hex: "#243b5e", clair: false, ref: "8336032" },
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8336028" }
      ],
      lien: "https://www.decathlon.fr/p/polo-de-tennis-manches-courtes-homme-essential-marine/103242/c364m8336032",
      photos: [
        "https://contents.mediadecathlon.com/p2454696/k$d8af62394dde615416f9b470402a42bf/picture.jpg?format=auto&f=800x0",
        "https://contents.mediadecathlon.com/p2454697/k$958e5d52cbb083b81e7159bf854eef5b/picture.jpg?format=auto&f=800x0"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 19, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 13, w: 30, h: 46, label: "Dos" },
        manche_g: { vue: "cote", cx: 77, cy: 24, w: 10, h: 14, rot: -45, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13, cy: 24, w: 10, h: 14, rot: 45,  label: "Manche droite" }
      }
    },
    {
      id: "sweat-molleton",
      nomCourt: "Sweat",
      nom: "Sweat chaud en molleton",
      marque: "Domyos, Decathlon",
      modele: "sweat",
      demonstratif: "ce sweat",
      prixAchat: 14.99,
      matiere: "59 % polyester, 41 % coton",
      polyesterPct: 59,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "bleu-fonce", nom: "Bleu foncé", hex: "#2e4663", clair: false, ref: "9004710" },
        { id: "kaki", nom: "Kaki", hex: "#6f6b4e", clair: false, ref: "8961058" }
      ],
      lien: "https://www.decathlon.fr/p/sweat-chaud-en-molleton-homme-bleu-fonce/351127/c364m9004710",
      photos: [],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 21, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 15, w: 32, h: 52, label: "Dos" },
        manche_g: { vue: "cote", cx: 76.5, cy: 40, w: 10, h: 14, rot: -9, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13.5, cy: 40, w: 10, h: 14, rot: 9,  label: "Manche droite" }
      }
    },
    {
      id: "polaire-mh100",
      nomCourt: "Polaire",
      nom: "Polaire de randonnée MH100 demi-zip",
      marque: "Quechua, Decathlon",
      modele: "polaire",
      demonstratif: "cette polaire",
      prixAchat: 8.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1f2124", clair: false, ref: "966425" }
      ],
      lien: "https://www.decathlon.fr/p/polaire-de-randonnee-montagne-homme-mh100-demi-zip-noir/312360/c1m966425",
      photos: [],
      avertissement: "Polaire : le duvet retient mal le transfert DTF. Fais un essai de pressage avant de lancer toute la commande.",
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 23, w: 15, h: 20, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 15, w: 32, h: 52, label: "Dos" },
        manche_g: { vue: "cote", cx: 76.5, cy: 40, w: 10, h: 14, rot: -9, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13.5, cy: 40, w: 10, h: 14, rot: 9,  label: "Manche droite" }
      }
    },
    {
      id: "maillot-basket",
      nomCourt: "Maillot basket",
      nom: "Maillot de basket sans manche TANK 100",
      marque: "Kipsta, Decathlon",
      modele: "maillot",
      demonstratif: "ce maillot",
      prixAchat: 6.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8941322" }
      ],
      lien: "https://www.decathlon.fr/p/maillot-de-basketball-sans-manche-homme-femme-tank-100-blanc/362058/c227c382m8941322",
      photos: [],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      zones: {
        poitrine: { vue: "face", cx: 57, top: 24, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 18, w: 32, h: 52, label: "Dos" }
      }
    },
    {
      id: "short-basket",
      nomCourt: "Short basket",
      nom: "Short de basket SHORT 100",
      marque: "Kipsta, Decathlon",
      modele: "short-basket",
      demonstratif: "ce short",
      prixAchat: 6.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8941327" },
        { id: "marine", nom: "Marine", hex: "#1f2b4a", clair: false, ref: "8946323" }
      ],
      lien: "https://www.decathlon.fr/p/short-de-basketball-homme-femme-short-100-blanc/362074/c227c382m8941327",
      photos: [],
      vitrine: ["cuisse_g"],
      texteVitrine: "sur une cuisse",
      zones: {
        cuisse_g:    { vue: "face", cx: 57.5, top: 21, w: 14, h: 21, label: "Cuisse gauche" },
        cuisse_d:    { vue: "face", cx: 32.5, top: 21, w: 14, h: 21, label: "Cuisse droite" },
        bas_jambe_g: { vue: "face", cx: 59.5, top: 47, w: 14, h: 6,  label: "Bas de la jambe gauche" }
      }
    },
    {
      id: "short-tennis",
      nomCourt: "Short tennis",
      nom: "Short de tennis Essential",
      marque: "Kuikma, Decathlon",
      modele: "short-tennis",
      demonstratif: "ce short",
      prixAchat: 5.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "marine", nom: "Marine", hex: "#243b5e", clair: false, ref: "962194" }
      ],
      lien: "https://www.decathlon.fr/p/short-de-tennis-homme-essential-marine/300096/c364c344m962194",
      photos: [],
      vitrine: ["cuisse_g"],
      texteVitrine: "sur une cuisse",
      zones: {
        cuisse_g:    { vue: "face", cx: 57.5, top: 20, w: 14, h: 21, label: "Cuisse gauche" },
        cuisse_d:    { vue: "face", cx: 32.5, top: 20, w: 14, h: 21, label: "Cuisse droite" },
        bas_jambe_g: { vue: "face", cx: 59,   top: 42.5, w: 14, h: 6, label: "Bas de la jambe gauche" }
      }
    },
    {
      id: "debardeur-fitness",
      nomCourt: "Débardeur",
      nom: "Débardeur extensible fitness 500",
      marque: "Domyos, Decathlon",
      modele: "debardeur",
      demonstratif: "ce débardeur",
      prixAchat: 9.99,
      matiere: "100 % coton",
      polyesterPct: 0,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8667062" }
      ],
      lien: "https://www.decathlon.fr/p/debardeur-extensible-fitness-homme-500-blanc/335335/c227c344m8667062",
      photos: [],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      zones: {
        poitrine: { vue: "face", cx: 56, top: 22, w: 15, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 16, w: 30, h: 52, label: "Dos" }
      }
    }
  ],

  // Packs : plusieurs produits vendus ensemble, avec la remise définie dans prix.js (packs.remise)
  packs: [
    {
      id: "pack-basket",
      nom: "Pack basket : maillot et short",
      demonstratif: "ce pack",
      produits: ["maillot-basket", "short-basket"],
      vitrine: ["poitrine", "cuisse_g"],
      texteVitrine: "sur la poitrine du maillot et une cuisse du short"
    }
  ]
};
