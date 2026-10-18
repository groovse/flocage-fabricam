/*
 * CATALOGUE — pour ajouter un vêtement, copie un bloc de « produits » et change :
 * id, nom, prixAchat (TTC), tailles, couleurs, modele (le dessin : polo, sweat, debardeur,
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

  // Filtres du catalogue (tags « genre » et « style » de chaque produit ou pack). « sport » (tennis, basket...)
  // n'est qu'une étiquette d'affichage. Un vêtement mixte porte les deux genres.
  filtres: {
    genre: { label: "Pour", valeurs: [{ id: "homme", label: "Homme" }, { id: "femme", label: "Femme" }] },
    style: { label: "Style", valeurs: [{ id: "sport", label: "Sport" }, { id: "casual", label: "Casual" }] }
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
      tags: { genre: ["homme"], style: "sport", sport: "Tennis" },
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
        "https://contents.mediadecathlon.com/p2454696/k$d8af62394dde615416f9b470402a42bf/picture.jpg",
        "https://contents.mediadecathlon.com/p2946081/k$6ae7e948dc8375098dd4dfb91d391297/picture.jpg",
        "https://contents.mediadecathlon.com/p2875937/k$86bcf58fffce18e0ee0b2b02098f1414/picture.jpg",
        "https://contents.mediadecathlon.com/p2996308/k$c6cfda141a3f9b036b7d98e7b2a0cdaa/picture.jpg"
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
      tags: { genre: ["homme"], style: "casual" },
      prixAchat: 14.99,
      matiere: "59 % polyester, 41 % coton",
      polyesterPct: 59,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "bleu-fonce", nom: "Bleu foncé", hex: "#2e4663", clair: false, ref: "9004710" },
        { id: "kaki", nom: "Kaki", hex: "#6f6b4e", clair: false, ref: "8961058" }
      ],
      lien: "https://www.decathlon.fr/p/sweat-chaud-en-molleton-homme-bleu-fonce/351127/c364m9004710",
      photos: [
        "https://contents.mediadecathlon.com/p2731314/k$d4ce50f4e39cac664cf37912913cd175/picture.jpg",
        "https://contents.mediadecathlon.com/p2731313/k$9577f8a8dcb8999509e836526b68efdc/picture.jpg",
        "https://contents.mediadecathlon.com/p2731317/k$56c013a9942708e0c0096d3a5f0a890f/picture.jpg",
        "https://contents.mediadecathlon.com/p2731315/k$6135be8c8d35692ca577cda8efd7ba9b/picture.jpg",
        "https://contents.mediadecathlon.com/p2731316/k$a6f10d77258cbd82a7353675def8674e/picture.jpg",
        "https://contents.mediadecathlon.com/p2731318/k$d641c0cdc58455775bfec220ddb8bb47/picture.jpg"
      ],
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
      id: "maillot-basket",
      nomCourt: "Maillot basket",
      nom: "Maillot de basket sans manche TANK 100",
      marque: "Kipsta, Decathlon",
      modele: "maillot",
      demonstratif: "ce maillot",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Basket" },
      prixAchat: 6.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8941322" }
      ],
      lien: "https://www.decathlon.fr/p/maillot-de-basketball-sans-manche-homme-femme-tank-100-blanc/362058/c227c382m8941322",
      photos: [
        "https://contents.mediadecathlon.com/p2938737/k$cb964f859411a64f3b547eb595368593/picture.jpg",
        "https://contents.mediadecathlon.com/p2938838/k$e97e16f73ab955533dc1c6114fe65b29/picture.jpg",
        "https://contents.mediadecathlon.com/p2938601/k$028c1a4fda58a2d47f38aef63ab06169/picture.jpg",
        "https://contents.mediadecathlon.com/p2938670/k$27bd8fcca87685013513a8dc28879667/picture.jpg",
        "https://contents.mediadecathlon.com/p2938646/k$f69e087976a5f25d26adbe3dc8969c08/picture.jpg",
        "https://contents.mediadecathlon.com/p2938618/k$e0e39fd469f2cb8c8a713d30396affe9/picture.jpg",
        "https://contents.mediadecathlon.com/p2929375/k$67f50b8c908aca741bfbffb86ea438d3/picture.jpg",
        "https://contents.mediadecathlon.com/p2929349/k$2ec15fe68fc60f656a009e71f5c352d8/picture.jpg"
      ],
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
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Basket" },
      prixAchat: 6.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8941327" },
        { id: "marine", nom: "Marine", hex: "#1f2b4a", clair: false, ref: "8946323" }
      ],
      lien: "https://www.decathlon.fr/p/short-de-basketball-homme-femme-short-100-blanc/362074/c227c382m8941327",
      photos: [
        "https://contents.mediadecathlon.com/p2938583/k$76581616f663d16be8af6c25364c278c/picture.jpg",
        "https://contents.mediadecathlon.com/p2938800/k$2f2c0c7764ce6bba4b9f4e4da829d8d0/picture.jpg",
        "https://contents.mediadecathlon.com/p2938755/k$1425f123b7f535f07da3decbab601885/picture.jpg",
        "https://contents.mediadecathlon.com/p2938666/k$36b0f9900a2fae6044766b8299e03cf2/picture.jpg",
        "https://contents.mediadecathlon.com/p2938901/k$28aa72e7df5a161e28184a34e9946c7a/picture.jpg",
        "https://contents.mediadecathlon.com/p2938618/k$e0e39fd469f2cb8c8a713d30396affe9/picture.jpg",
        "https://contents.mediadecathlon.com/p2929375/k$67f50b8c908aca741bfbffb86ea438d3/picture.jpg",
        "https://contents.mediadecathlon.com/p2929349/k$2ec15fe68fc60f656a009e71f5c352d8/picture.jpg"
      ],
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
      tags: { genre: ["homme"], style: "sport", sport: "Tennis" },
      prixAchat: 5.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "marine", nom: "Marine", hex: "#243b5e", clair: false, ref: "962194" }
      ],
      lien: "https://www.decathlon.fr/p/short-de-tennis-homme-essential-marine/300096/c364c344m962194",
      photos: [
        "https://contents.mediadecathlon.com/p2875053/k$4e8f06bf8a684d9ac7f74e5ffc48c4b1/picture.jpg",
        "https://contents.mediadecathlon.com/p2946197/k$076fbd3d7789efd04ecd305051dc0e6b/picture.jpg",
        "https://contents.mediadecathlon.com/p2454823/k$f5f94a291d8588549b16eeef600f7d8c/picture.jpg",
        "https://contents.mediadecathlon.com/p2875943/k$e4d46a5451e79ab0163a482444de278a/picture.jpg"
      ],
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
      tags: { genre: ["homme"], style: "sport", sport: "Fitness" },
      prixAchat: 9.99,
      matiere: "100 % coton",
      polyesterPct: 0,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8667062" }
      ],
      lien: "https://www.decathlon.fr/p/debardeur-extensible-fitness-homme-500-blanc/335335/c227c344m8667062",
      photos: [
        "https://contents.mediadecathlon.com/p2731077/k$1e73eea8d727c1e768e61aafa0edc800/picture.jpg",
        "https://contents.mediadecathlon.com/p2731078/k$b5d65d7775e85ceddbb17a8b7659d623/picture.jpg",
        "https://contents.mediadecathlon.com/p2731073/k$d85b477b3d42aa39f9fc9d592eae009e/picture.jpg",
        "https://contents.mediadecathlon.com/p2731074/k$e0cde3879d377ef95d0792d472b2e2ae/picture.jpg",
        "https://contents.mediadecathlon.com/p2731075/k$9aa656cb6f1da9d76f98648a10c4589d/picture.jpg",
        "https://contents.mediadecathlon.com/p2731076/k$0f55a11d977ec9bee5cd9c76622cad88/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      zones: {
        poitrine: { vue: "face", cx: 56, top: 22, w: 15, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 16, w: 30, h: 52, label: "Dos" }
      }
    }
  ],

  // Packs : plusieurs produits vendus ensemble comme un seul article (une seule marge, voir prix.js)
  packs: [
    {
      id: "pack-basket",
      nom: "Pack basket : maillot et short",
      nomCourt: "Pack basket",
      demonstratif: "ce pack",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Basket" },
      produits: ["maillot-basket", "short-basket"],
      vitrine: ["poitrine", "cuisse_g"],
      texteVitrine: "sur la poitrine du maillot et une cuisse du short"
    }
  ]
};
