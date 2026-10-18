/*
 * CATALOGUE — pour ajouter un vêtement, copie le bloc du polo dans « produits »
 * et change : id, nom, prixAchat (TTC, retrait en magasin), tailles, couleurs, photos, zones.
 * Les zones sont en cm sur le dessin du vêtement (90 cm de large) : cx = centre horizontal,
 * top = haut de la zone (ou cy = centre), w/h = taille max de la zone.
 */
window.DATA = {
  service: {
    nom: "Fabr'Icam Flocage",
    email: "fabricam.toulouse@icam.fr"
  },

  emplacements: {
    poitrine: { label: "Poitrine", formats: ["A6", "A5"] },
    dos:      { label: "Dos", formats: ["A5", "A4"] },
    manche_g: { label: "Manche gauche", formats: ["A6"] },
    manche_d: { label: "Manche droite", formats: ["A6"] }
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
      nom: "Polo de tennis Essential",
      marque: "Kuikma, Decathlon",
      modele: "polo",
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
      zones: {
        poitrine: { vue: "face", cx: 58, top: 19, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 13, w: 30, h: 46, label: "Dos" },
        manche_g: { vue: "cote", cx: 77, cy: 24, w: 10, h: 14, rot: -45, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13, cy: 24, w: 10, h: 14, rot: 45,  label: "Manche droite" }
      }
    }
  ]
};
