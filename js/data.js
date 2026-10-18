/*
 * CATALOGUE — pour ajouter un vêtement, copie un bloc de « produits » et change :
 * id, nom, prixAchat (TTC), tailles, couleurs, modele (le dessin : polo, sweat, debardeur,
 * maillot, short-basket, short-tennis, short-slim, tshirt, manches-longues, veste, sweat-zip, gilet, gilet-matelasse, robe,
 * pantalon, chaussette), tags (genre, style, type : haut, bas, robe, ensemble ou accessoire), vendeur (seulement pour un article
 * de la place de marché Decathlon, voir prix.js), vitrine (emplacements du prix affiché) et zones.
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
    bas_jambe_g: { label: "Bas de la jambe gauche", formats: [], texteSeul: true },
    chaussette_g: { label: "Chaussette gauche", formats: [], texteSeul: true },
    chaussette_d: { label: "Chaussette droite", formats: [], texteSeul: true }
  },

  // Filtres du catalogue (tags « genre », « style » et « type » de chaque produit ou pack). « sport » (tennis, basket...)
  // n'est qu'une étiquette d'affichage. Un vêtement mixte porte les deux genres. Type « ensemble » : packs de plusieurs pièces
  // et survêtement vendu en un seul article.
  filtres: {
    genre: { label: "Pour", valeurs: [{ id: "homme", label: "Homme" }, { id: "femme", label: "Femme" }] },
    style: { label: "Style", valeurs: [{ id: "sport", label: "Sport" }, { id: "casual", label: "Casual" }] },
    type: { label: "Type", valeurs: [{ id: "haut", label: "Hauts" }, { id: "bas", label: "Bas" }, { id: "robe", label: "Robes" }, { id: "ensemble", label: "Ensembles" }, { id: "accessoire", label: "Accessoires" }] }
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
      tags: { genre: ["homme"], style: "sport", sport: "Tennis", type: "haut" },
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
      // Aperçu sur photo : photo = rang dans « photos », couleur = couleur du vêtement sur la photo.
      // u0, v0 = position de l'origine du dessin (en fraction de la photo carrée), kx, ky = fraction de photo par cm.
      apercuPhoto: {
        couleur: "marine",
        face: { photo: 1, u0: 0.363, v0: 0.113, kx: 0.0039, ky: 0.00487 },
        dos: { photo: 2, u0: 0.168, v0: 0.205, kx: 0.0065, ky: 0.0094 }
      },
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
      tags: { genre: ["homme"], style: "casual", type: "haut" },
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
      // Aperçu sur photo : photo = rang dans « photos », couleur = couleur du vêtement sur la photo.
      // u0, v0 = position de l'origine du dessin (en fraction de la photo carrée), kx, ky = fraction de photo par cm.
      apercuPhoto: {
        couleur: "bleu-fonce",
        face: { photo: 0, u0: 0.26, v0: 0.231, kx: 0.006, ky: 0.0074 },
        dos: { photo: 3, u0: 0.125, v0: 0.158, kx: 0.0067, ky: 0.0083 }
      },
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
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Basket", type: "haut" },
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
      // Aperçu sur photo : photo = rang dans « photos », couleur = couleur du vêtement sur la photo.
      // u0, v0 = position de l'origine du dessin (en fraction de la photo carrée), kx, ky = fraction de photo par cm.
      apercuPhoto: {
        couleur: "blanc",
        face: { photo: 0, u0: 0.3, v0: 0.2425, kx: 0.0053, ky: 0.0071 },
        dos: { photo: 3, u0: 0.3, v0: 0.225, kx: 0.00567, ky: 0.0074 }
      },
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
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Basket", type: "bas" },
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
      // Aperçu sur photo : photo = rang dans « photos », couleur = couleur du vêtement sur la photo.
      // u0, v0 = position de l'origine du dessin (en fraction de la photo carrée), kx, ky = fraction de photo par cm.
      apercuPhoto: {
        couleur: "blanc",
        face: { photo: 0, u0: 0.216, v0: -0.022, kx: 0.0072, ky: 0.0072 }
      },
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
      tags: { genre: ["homme"], style: "sport", sport: "Tennis", type: "bas" },
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
      tags: { genre: ["homme"], style: "sport", sport: "Fitness", type: "haut" },
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
      // Aperçu sur photo : photo = rang dans « photos », couleur = couleur du vêtement sur la photo.
      // u0, v0 = position de l'origine du dessin (en fraction de la photo carrée), kx, ky = fraction de photo par cm.
      apercuPhoto: {
        couleur: "blanc",
        face: { photo: 0, u0: 0.1625, v0: 0.19, kx: 0.0077, ky: 0.00776 },
        dos: { photo: 3, u0: 0.2, v0: 0.145, kx: 0.0075, ky: 0.00855 }
      },
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      zones: {
        poitrine: { vue: "face", cx: 56, top: 22, w: 15, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 16, w: 30, h: 52, label: "Dos" }
      }
    },
    {
      id: "veste-sans-manches",
      nomCourt: "Veste sans manches",
      nom: "Veste sans manches Regatta",
      marque: "Regatta",
      modele: "gilet",
      demonstratif: "cette veste",
      tags: { genre: ["homme"], style: "casual", type: "haut" },
      vendeur: "pertemba-fr",   // vendeur de la place de marché Decathlon : livré à Fabr'Icam, frais de port dans prix.js (livraisonVendeur)
      prixAchat: 19.00,
      matiere: "96 % polyester, 4 % élasthanne",
      polyesterPct: 96,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false }
      ],
      lien: "https://www.decathlon.fr/p/mp/veste-sans-manches-homme-noir/45725556-d2a9-4eac-a6e8-d3bd17349f6e/c1c49",
      photos: [
        "https://contents.mediadecathlon.com/m2495639/k$71189e79ef6a65c6cd49900bd75c1835/picture.jpg",
        "https://contents.mediadecathlon.com/m14661138/k$14f096cae8bf2b4a8596d2d077381470/picture.jpg",
        "https://contents.mediadecathlon.com/m14661132/k$3b42bb54c65aa36d32034ffb044d7192/picture.jpg",
        "https://contents.mediadecathlon.com/m2495634/k$a1609eb27d868e7ec0d24cbac2da0fec/picture.jpg",
        "https://contents.mediadecathlon.com/m16177250/k$7c73fc129cb93bd9af288e1393296139/picture.jpg",
        "https://contents.mediadecathlon.com/m36728035/k$bfa1843d1d39f4ddc4346c72683e411a/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 19, w: 14, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 14, w: 30, h: 48, label: "Dos" }
      }
    },
    {
      id: "chaussettes-football",
      nomCourt: "Chaussettes football",
      nom: "Chaussettes de football Essential",
      marque: "Kipsta, Decathlon",
      modele: "chaussette",
      demonstratif: "ces chaussettes",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Football", type: "accessoire" },
      prixAchat: 2.99,
      matiere: "96 % polyester, 3 % élasthanne, 1 % polyamide",
      polyesterPct: 96,
      tailles: ["39/41", "42/44", "45/47"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8350117" }
      ],
      lien: "https://www.decathlon.fr/p/chaussettes-de-football-essentiel-adulte-blanche/141410/c227c210m8350117",
      photos: [
        "https://contents.mediadecathlon.com/p1722152/k$75016eceb0e9783878363bddb90056b8/picture.jpg",
        "https://contents.mediadecathlon.com/p1610684/k$a7ea091a64f90de8321794aaa2f27b92/picture.jpg",
        "https://contents.mediadecathlon.com/p1610682/k$69967f459708c19c78ad197cb948278d/picture.jpg",
        "https://contents.mediadecathlon.com/p1610681/k$455134bbd9b437614e214df1f6710d5f/picture.jpg",
        "https://contents.mediadecathlon.com/p1610680/k$5f2c61319ad05af1d789ac85799b762c/picture.jpg",
        "https://contents.mediadecathlon.com/p1610679/k$c521038434e2f2c7640cb526a206cd9c/picture.jpg",
        "https://contents.mediadecathlon.com/p1610677/k$7b66b7d9296ffd53d7f478736a5eca14/picture.jpg"
      ],
      vitrine: ["chaussette_g"],
      texteVitrine: "sur une chaussette",
      noteVitrine: "Avec un prénom de 3 cm sur une chaussette.",
      avertissement: "Chaussettes : tissu très fin et extensible, seuls les prénoms et les numéros sont possibles. Fabr'Icam teste le pressage avant la série.",
      zones: {
        chaussette_g: { vue: "face", cx: 70, top: 14, w: 12, h: 22, label: "Chaussette gauche" },
        chaussette_d: { vue: "face", cx: 20, top: 14, w: 12, h: 22, label: "Chaussette droite" }
      }
    },
    {
      id: "doudoune-sans-manche",
      nomCourt: "Doudoune sans manche",
      nom: "Doudoune sans manche Result Core",
      marque: "Result",
      modele: "gilet-matelasse",
      demonstratif: "cette doudoune",
      tags: { genre: ["homme"], style: "casual", type: "haut" },
      vendeur: "sport-et-go-eu",   // vendeur de la place de marché Decathlon : livré à Fabr'Icam, frais de port dans prix.js (livraisonVendeur)
      prixAchat: 18.00,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "marine", nom: "Marine", hex: "#243b5e", clair: false }
      ],
      lien: "https://www.decathlon.fr/p/mp/doudoune-sans-manche-result-core/9079bea6-3f9c-43ea-8442-340f85dd035b/c5c145",
      photos: [
        "https://contents.mediadecathlon.com/m33416078/k$055f77e04bd2b1b222b15a8b05c6a2f7/picture.jpg",
        "https://contents.mediadecathlon.com/m20643849/k$22aceffc6f6ed78eed09995dda2df4ab/picture.jpg",
        "https://contents.mediadecathlon.com/m20643825/k$37f4a76b076af8441a5bffc94daf524f/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Doudoune matelassée et gonflante : le pressage se fait à plat, à basse température. Fabr'Icam fait un essai avant la série.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 19, w: 14, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 14, w: 30, h: 48, label: "Dos" }
      }
    },
    {
      id: "veste-micropolaire",
      nomCourt: "Veste micropolaire",
      nom: "Veste micropolaire zippée Kariban",
      marque: "Kariban",
      modele: "veste",
      demonstratif: "cette veste",
      tags: { genre: ["homme", "femme"], style: "casual", type: "haut" },
      vendeur: "sport-et-go-eu",   // vendeur de la place de marché Decathlon : livré à Fabr'Icam, frais de port dans prix.js (livraisonVendeur)
      prixAchat: 18.09,
      matiere: "Micropolaire (polyester), composition non précisée par le vendeur",
      polyesterPct: 100,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false }
      ],
      lien: "https://www.decathlon.fr/p/mp/veste-kariban-micropolaire-zippee/62a52383-7af9-4e14-9a8e-0f1d90f24456/c1",
      photos: [
        "https://contents.mediadecathlon.com/m31762724/k$ac36054481e734fa94398c4236a0039f/picture.jpg",
        "https://contents.mediadecathlon.com/m31889015/k$f6517549d134d8cb8f5260c31f3a0311/picture.jpg",
        "https://contents.mediadecathlon.com/m20580954/k$882efb63d265c579ad9106f231b7c922/picture.jpg",
        "https://contents.mediadecathlon.com/m20580927/k$825eb491d3321526060340fe51f2fada/picture.jpg",
        "https://contents.mediadecathlon.com/m20580935/k$929e20624931451d44111d0a8a5012fc/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Micropolaire : le tissu s'écrase à la chaleur. Pressage avec feuille de téflon et essai sur une chute avant la série.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 21, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 15, w: 32, h: 52, label: "Dos" },
        manche_g: { vue: "cote", cx: 76.5, cy: 40, w: 10, h: 14, rot: -9, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13.5, cy: 40, w: 10, h: 14, rot: 9,  label: "Manche droite" }
      }
    },
    {
      id: "short-2-en-1-fitness",
      nomCourt: "Short 2 en 1 fitness",
      nom: "Short 2 en 1 fitness femme",
      marque: "Domyos, Decathlon",
      modele: "short-tennis",
      demonstratif: "ce short",
      tags: { genre: ["femme"], style: "sport", sport: "Fitness", type: "bas" },
      prixAchat: 12.00,
      matiere: "86 % polyester, 14 % élasthanne",
      polyesterPct: 86,
      tailles: ["XS", "S", "M", "L", "XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8733482" }
      ],
      lien: "https://www.decathlon.fr/p/short-2-en-1-fitness-femme-noir/337725/c382m8733482",
      photos: [
        "https://contents.mediadecathlon.com/p2731656/k$0fb909fc52b0a250eaa843d475dcd7dd/picture.jpg",
        "https://contents.mediadecathlon.com/p2731657/k$e430d9cf1fe4cd9cdcc67ebcedc751be/picture.jpg",
        "https://contents.mediadecathlon.com/p2731658/k$d4dc8de7e9e930c731ff1bed3859a6d4/picture.jpg",
        "https://contents.mediadecathlon.com/p2731659/k$e25c6c34c96e510ec6eb649f0a66035e/picture.jpg",
        "https://contents.mediadecathlon.com/p2731660/k$f0fef6bc42880320cafb030e2f28e53e/picture.jpg"
      ],
      vitrine: ["cuisse_g"],
      texteVitrine: "sur une cuisse",
      zones: {
        cuisse_g: { vue: "face", cx: 57.5, top: 20, w: 14, h: 21, label: "Cuisse gauche" },
        cuisse_d: { vue: "face", cx: 32.5, top: 20, w: 14, h: 21, label: "Cuisse droite" }
      }
    },
    {
      id: "short-slim-fitness",
      nomCourt: "Short slim fitness",
      nom: "Short slim fitness femme 500",
      marque: "Domyos, Decathlon",
      modele: "short-slim",
      demonstratif: "ce short",
      tags: { genre: ["femme"], style: "sport", sport: "Fitness", type: "bas" },
      prixAchat: 7.99,
      matiere: "92 % coton, 8 % élasthanne",
      polyesterPct: 0,
      tailles: ["XS", "S", "M", "L", "XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8511787" }
      ],
      lien: "https://www.decathlon.fr/p/short-slim-fitness-femme-500-noir/303051/c378m8511787",
      photos: [
        "https://contents.mediadecathlon.com/p2632539/k$51d8b968ae796f1048918b8267c042be/picture.jpg",
        "https://contents.mediadecathlon.com/p2632544/k$57a209d9dd9ed46c4d7e3b7a47b71faf/picture.jpg",
        "https://contents.mediadecathlon.com/p2632508/k$64b4c0c37f8ff1b59e99b1a622a8110f/picture.jpg",
        "https://contents.mediadecathlon.com/p2632514/k$211eb8924b987045d2926845de81ea45/picture.jpg",
        "https://contents.mediadecathlon.com/p2632568/k$bbc7d5c3c0f3105fcbb3aa7543d2ec28/picture.jpg"
      ],
      vitrine: ["cuisse_g"],
      texteVitrine: "sur une cuisse",
      zones: {
        cuisse_g: { vue: "face", cx: 56.5, top: 19.5, w: 12, h: 18, label: "Cuisse gauche" },
        cuisse_d: { vue: "face", cx: 33.5, top: 19.5, w: 12, h: 18, label: "Cuisse droite" }
      }
    },
    {
      id: "jogging-femme",
      nomCourt: "Pantalon jogging",
      nom: "Pantalon de jogging droit chaud et doux femme",
      marque: "Domyos, Decathlon",
      modele: "pantalon",
      demonstratif: "ce pantalon",
      tags: { genre: ["femme"], style: "casual", type: "bas" },
      prixAchat: 9.99,
      matiere: "88 % coton, 12 % élasthanne",
      polyesterPct: 0,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8759127" }
      ],
      lien: "https://www.decathlon.fr/p/pantalon-de-jogging-droit-chaud-et-doux-femme-noir/333231/c378m8759127",
      photos: [
        "https://contents.mediadecathlon.com/p2730712/k$4788c0efc55acc52f0e6c36d4665f10c/picture.jpg",
        "https://contents.mediadecathlon.com/p2730715/k$4f9f33068acc48a26fdd3333b432bf3c/picture.jpg",
        "https://contents.mediadecathlon.com/p2730713/k$fda19e3e6da7641837210b78fa20b9dc/picture.jpg",
        "https://contents.mediadecathlon.com/p2730716/k$efac979d36d4cb0e34a7823c0767720b/picture.jpg",
        "https://contents.mediadecathlon.com/p2730711/k$09ee7e93cc7f64ff770e74ce07a8ace8/picture.jpg",
        "https://contents.mediadecathlon.com/p2730714/k$04e0070dff6b03c24cb9e2af1cc74070/picture.jpg",
        "https://contents.mediadecathlon.com/p3100052/k$ed4184d7038bd3139239843d72c8a02a/picture.jpg"
      ],
      vitrine: ["cuisse_g"],
      texteVitrine: "sur une cuisse",
      zones: {
        cuisse_g:    { vue: "face", cx: 59,   top: 22, w: 14, h: 21, label: "Cuisse gauche" },
        cuisse_d:    { vue: "face", cx: 31,   top: 22, w: 14, h: 21, label: "Cuisse droite" },
        bas_jambe_g: { vue: "face", cx: 59.2, top: 86, w: 12, h: 6,  label: "Bas de la jambe gauche" }
      }
    },
    {
      id: "tshirt-coton-femme",
      nomCourt: "T-shirt coton femme",
      nom: "T-shirt coton femme Essentiel",
      marque: "Domyos, Decathlon",
      modele: "tshirt",
      demonstratif: "ce t-shirt",
      tags: { genre: ["femme"], style: "casual", type: "haut" },
      prixAchat: 3.99,
      matiere: "60 % coton, 40 % polyester",
      polyesterPct: 40,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "marine", nom: "Marine", hex: "#243b5e", clair: false, ref: "9021066" }
      ],
      lien: "https://www.decathlon.fr/p/t-shirt-coton-femme-essentiel-bleu-marine/382034/c364m9021066",
      photos: [
        "https://contents.mediadecathlon.com/p3146224/k$68c5da1b58bcb9af06f3f87b021e6f16/picture.jpg",
        "https://contents.mediadecathlon.com/p3146207/k$58a674430b0f03f690991683cdda83f7/picture.jpg",
        "https://contents.mediadecathlon.com/p3146221/k$17f498a8ea202b3279be27eeb481c933/picture.jpg",
        "https://contents.mediadecathlon.com/p3146222/k$eb24f715a8171cd5483141a329f03595/picture.jpg",
        "https://contents.mediadecathlon.com/p3146214/k$3f69b1ce1fb26a05a56028bad9ae15dd/picture.jpg",
        "https://contents.mediadecathlon.com/p3146220/k$fdad23f76c9b360120590039548c69d4/picture.jpg"
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
      id: "tshirt-femme-noir",
      nomCourt: "T-shirt femme",
      nom: "T-shirt à manches courtes femme",
      marque: "Decathlon",
      modele: "tshirt",
      demonstratif: "ce t-shirt",
      tags: { genre: ["femme"], style: "casual", type: "haut" },
      prixAchat: 4.99,
      matiere: "92 % polyester, 8 % élasthanne",
      polyesterPct: 92,
      tailles: ["XS", "S", "M", "L", "XL", "2XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8943116" }
      ],
      lien: "https://www.decathlon.fr/p/t-shirt-manches-courtes-femme-noir/365650/c382m8943116",
      photos: [
        "https://contents.mediadecathlon.com/p3035993/k$09b8b0b67333f592d50cf6b5520cb6bc/picture.jpg",
        "https://contents.mediadecathlon.com/p3036002/k$82476f23f14e9249d4b5c47ec7ff7712/picture.jpg",
        "https://contents.mediadecathlon.com/p3036010/k$62a5b7c855843966f00969c3be7d7d76/picture.jpg",
        "https://contents.mediadecathlon.com/p3035990/k$47589804756fdfe671a1d22fcd1fd4d2/picture.jpg",
        "https://contents.mediadecathlon.com/p3174320/k$0db6aa8e95c04a4590022c7711847e37/picture.jpg",
        "https://contents.mediadecathlon.com/p3174368/k$b045f4595c328a5f8ffc3b5d99488ce7/picture.jpg",
        "https://contents.mediadecathlon.com/p3100055/k$6f6112223d4c3cdc83c16634842b0d99/picture.jpg"
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
      id: "tshirt-fitness-femme",
      nomCourt: "T-shirt fitness femme",
      nom: "T-shirt fitness femme 100",
      marque: "Domyos, Decathlon",
      modele: "tshirt",
      demonstratif: "ce t-shirt",
      tags: { genre: ["femme"], style: "sport", sport: "Fitness", type: "haut" },
      prixAchat: 5.99,
      matiere: "100 % coton",
      polyesterPct: 0,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8737886" }
      ],
      lien: "https://www.decathlon.fr/p/t-shirt-fitness-femme-100-blanc-glacier/339063/c227c344m8737886",
      photos: [
        "https://contents.mediadecathlon.com/p3054279/k$b8291280158b44ad1831c63d6e800f4e/picture.jpg",
        "https://contents.mediadecathlon.com/p3054297/k$c04ecd3f2090ccfe0427b3c64ba562e2/picture.jpg",
        "https://contents.mediadecathlon.com/p3054273/k$98b7d77b9a88bc31dbd1f9edea26ccf4/picture.jpg",
        "https://contents.mediadecathlon.com/p3054292/k$d939c2523a175c4d326bd69ed9f4a74f/picture.jpg",
        "https://contents.mediadecathlon.com/p3054281/k$42eea155c124dedb7e162692778f5a5b/picture.jpg",
        "https://contents.mediadecathlon.com/p3016924/k$1e9c6dfb76755e1c1294eef20ac746f7/picture.jpg",
        "https://contents.mediadecathlon.com/p3016664/k$82af3712384df3d239dd6acf2174c5ef/picture.jpg"
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
      id: "thermique-femme",
      nomCourt: "Haut thermique femme",
      nom: "Sous-vêtement thermique BL100, haut femme",
      marque: "Wedze, Decathlon",
      modele: "manches-longues",
      demonstratif: "ce haut",
      tags: { genre: ["femme"], style: "sport", sport: "Ski", type: "haut" },
      prixAchat: 6.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["XS", "S", "M", "L", "XL", "XXL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8510031" }
      ],
      lien: "https://www.decathlon.fr/p/sous-vetement-thermique-de-ski-chaud-et-confort-femme-bl100-haut-noir/302806/c382m8510031",
      photos: [
        "https://contents.mediadecathlon.com/p3014391/k$eb1ca62303c545e73564e3c181e1e2f4/picture.jpg",
        "https://contents.mediadecathlon.com/p3014387/k$c504852395ac5ec01a362d1b282d5ee2/picture.jpg",
        "https://contents.mediadecathlon.com/p3014381/k$c209844f0d8e04653f94aea9ec0d9af6/picture.jpg",
        "https://contents.mediadecathlon.com/p3014382/k$024a4f941a979c29d317fbf2a932d0dc/picture.jpg",
        "https://contents.mediadecathlon.com/p3014389/k$0b571028b0486bcb855f9ba1f52e8aed/picture.jpg",
        "https://contents.mediadecathlon.com/p3014385/k$2d410c0f5d8109892ecb1a9e8a3f95d1/picture.jpg",
        "https://contents.mediadecathlon.com/p2419708/k$823ffe191ed074e5f248c76e961ccd61/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Sous-vêtement thermique : tissu fin, très élastique et sensible à la chaleur. Un visuel se déforme quand le haut s'étire. Fabr'Icam fait un essai (pressage, étirement, lavage à 30 °C) avant la série.",
      zones: {
        poitrine: { vue: "face", cx: 56, top: 19, w: 14, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 14, w: 26, h: 44, label: "Dos" }
      }
    },
    {
      id: "robe-hummel",
      nomCourt: "Robe Hummel",
      nom: "Robe Hummel à manches courtes",
      marque: "Hummel",
      modele: "robe",
      demonstratif: "cette robe",
      tags: { genre: ["femme"], style: "casual", type: "robe" },
      vendeur: "sport-et-go-eu",   // vendeur de la place de marché Decathlon : livré à Fabr'Icam, frais de port dans prix.js (livraisonVendeur)
      prixAchat: 23.00,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true }
      ],
      lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c4",
      photos: [
        "https://contents.mediadecathlon.com/m17811447/k$9477d1b71ea40fdf0e51559be754a56e/picture.jpg",
        "https://contents.mediadecathlon.com/m17811457/k$5a900f625e4457af2fd828de19317ff9/picture.jpg",
        "https://contents.mediadecathlon.com/m17811448/k$e8655159869bfc15501e63724d51b8b5/picture.jpg",
        "https://contents.mediadecathlon.com/m17811449/k$8083ae9dfda23dd755425169b85573c2/picture.jpg",
        "https://contents.mediadecathlon.com/m17811452/k$4cbb0743232a6a7641b019f157106312/picture.jpg",
        "https://contents.mediadecathlon.com/m17811454/k$71f14ea01cb7f9bf9bbf7d96aea972fd/picture.jpg",
        "https://contents.mediadecathlon.com/m17811460/k$8c4b5a8c17426688d1a7acb5388fe31c/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 19, w: 14, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 13, w: 28, h: 38, label: "Dos" }
      }
    },
    {
      id: "survetement-joma",
      nomCourt: "Survêtement Joma",
      nom: "Survêtement de football Joma Eco Championship",
      marque: "Joma",
      modele: "veste",
      demonstratif: "ce survêtement",
      tags: { genre: ["homme"], style: "sport", sport: "Football", type: "ensemble" },
      vendeur: "sport-et-go-eu",   // vendeur de la place de marché Decathlon : livré à Fabr'Icam, frais de port dans prix.js (livraisonVendeur)
      prixAchat: 26.50,
      matiere: "100 % polyester recyclé",
      polyesterPct: 100,
      tailles: ["XS", "S", "2XL"],
      couleurs: [
        { id: "marine", nom: "Marine", hex: "#243b5e", clair: false }
      ],
      lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-bleu/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c5c145",
      photos: [
        "https://contents.mediadecathlon.com/m17005956/k$44a8541b5f2c227ff30ee426816465d2/picture.jpg",
        "https://contents.mediadecathlon.com/m17005958/k$5e66b7c519811c2a370523cc7f123874/picture.jpg",
        "https://contents.mediadecathlon.com/m14742860/k$fb72a70c48aaf8b0cb8c1a91bda25d85/picture.jpg",
        "https://contents.mediadecathlon.com/m14742862/k$637ff9ab6dfb667ce4fe2bcc0ca44e7b/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine de la veste",
      avertissement: "Survêtement vendu en un seul article (veste et pantalon, impossible de les acheter séparément). Le flocage se fait sur la veste.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 21, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 15, w: 32, h: 52, label: "Dos" },
        manche_g: { vue: "cote", cx: 76.5, cy: 40, w: 10, h: 14, rot: -9, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13.5, cy: 40, w: 10, h: 14, rot: 9,  label: "Manche droite" }
      }
    },
    {
      id: "sweat-viralto-axton",
      nomCourt: "Sweat 1/2 zip",
      nom: "Sweat de football 1/2 zip Viralto Axton",
      marque: "Kipsta, Decathlon",
      modele: "sweat-zip",
      demonstratif: "ce sweat",
      tags: { genre: ["homme"], style: "sport", sport: "Football", type: "haut" },
      prixAchat: 12.00,
      matiere: "87 % polyester, 13 % élasthanne",
      polyesterPct: 87,
      tailles: ["2XL"],
      couleurs: [
        { id: "gris-noir", nom: "Gris et noir", hex: "#3a3c40", clair: false, ref: "8773611" }
      ],
      lien: "https://www.decathlon.fr/p/sweat-de-football-1-2-zip-viralto-axton-gris-noir-et-zip-rose-fluo/332733/c382c71m8773611",
      photos: [
        "https://contents.mediadecathlon.com/p2379704/k$24ee4eb22ee7ce126c57ff402803ea6a/picture.jpg",
        "https://contents.mediadecathlon.com/p2379702/k$b30794c05fe48f3e04900d12ae328d38/picture.jpg",
        "https://contents.mediadecathlon.com/p2379698/k$7d837762323b6d76c2013477ad96f882/picture.jpg",
        "https://contents.mediadecathlon.com/p2379701/k$f92c95f5e97e1e1775533bbd4093b106/picture.jpg",
        "https://contents.mediadecathlon.com/p2379699/k$a281f804e3d3e2866a2ea64de5fd8ffe/picture.jpg",
        "https://contents.mediadecathlon.com/p2413261/k$66b34b55df349dc576bb0583532c220e/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Fin de série : une seule taille (2XL) chez Decathlon. Fabr'Icam confirme le stock avant de commander.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 21, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 15, w: 32, h: 52, label: "Dos" },
        manche_g: { vue: "cote", cx: 76.5, cy: 40, w: 10, h: 14, rot: -9, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13.5, cy: 40, w: 10, h: 14, rot: 9,  label: "Manche droite" }
      }
    },
    {
      id: "sweat-football-t100",
      nomCourt: "Sweat football",
      nom: "Sweat de football T100",
      marque: "Kipsta, Decathlon",
      modele: "sweat",
      demonstratif: "ce sweat",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Football", type: "haut" },
      prixAchat: 14.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["S", "M", "L", "XL", "XXL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8560131" }
      ],
      lien: "https://www.decathlon.fr/p/sweat-de-football-t100-noir/310366/c382c383m8560131",
      photos: [
        "https://contents.mediadecathlon.com/p2972606/k$f4e972d1d13814f4026754fa857981e4/picture.jpg",
        "https://contents.mediadecathlon.com/p2972538/k$c6bd487f3632a32e419df8121125ba03/picture.jpg",
        "https://contents.mediadecathlon.com/p2972623/k$1e6693d19bf98a7b45e372896859e470/picture.jpg",
        "https://contents.mediadecathlon.com/p2972523/k$ac13033c7e403e670d3bcac9680cc9d9/picture.jpg",
        "https://contents.mediadecathlon.com/p2972601/k$9c26b2ad733e2cb714f2aa979d6d4982/picture.jpg",
        "https://contents.mediadecathlon.com/p2972572/k$e079bcc5b6aec46e2b72c02d4a446dfb/picture.jpg",
        "https://contents.mediadecathlon.com/p2972461/k$1819428c80aa0d436e4747728cfdfb8e/picture.jpg"
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
      id: "polo-golf-mw500",
      nomCourt: "Polo golf",
      nom: "Polo de golf MW500",
      marque: "Inesis, Decathlon",
      modele: "polo",
      demonstratif: "ce polo",
      tags: { genre: ["homme"], style: "sport", sport: "Golf", type: "haut" },
      prixAchat: 14.99,
      matiere: "60 % coton, 40 % polyester",
      polyesterPct: 40,
      tailles: ["S", "M", "L", "XL", "XXL", "XXXL", "4XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8732677" }
      ],
      lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-noir/324952/c378m8732677",
      photos: [
        "https://contents.mediadecathlon.com/p3023351/k$d8b340f82975c74d68371163761aef63/picture.jpg",
        "https://contents.mediadecathlon.com/p3023249/k$556876a9100fd93ccd5aae1c75aa86aa/picture.jpg",
        "https://contents.mediadecathlon.com/p3023353/k$c402db2c35d4aeab6e3633cd9b387d13/picture.jpg",
        "https://contents.mediadecathlon.com/p3023246/k$0d15ee0062cf517671721153b97c7bc4/picture.jpg",
        "https://contents.mediadecathlon.com/p3023387/k$624afeedca62b54ac11698fcbb464f87/picture.jpg"
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
      id: "thermique-homme",
      nomCourt: "Haut thermique homme",
      nom: "Sous-vêtement thermique BL100, haut homme",
      marque: "Wedze, Decathlon",
      modele: "manches-longues",
      demonstratif: "ce haut",
      tags: { genre: ["homme"], style: "sport", sport: "Ski", type: "haut" },
      prixAchat: 6.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8510029" }
      ],
      lien: "https://www.decathlon.fr/p/sous-vetement-thermique-de-ski-chaud-et-confort-homme-bl100-haut-noir/302821/c382m8510029",
      photos: [
        "https://contents.mediadecathlon.com/p3014490/k$ccaeb8772db87fa4573b84e4513495d2/picture.jpg",
        "https://contents.mediadecathlon.com/p3014489/k$aa7d05c8ff2f8b4d64272df86fa2e6fd/picture.jpg",
        "https://contents.mediadecathlon.com/p3014487/k$e0c5ef5e4c9b0ae4657a4a6d4128d121/picture.jpg",
        "https://contents.mediadecathlon.com/p3014488/k$5b7c23a1c10c15cb70741d5f5b03cfec/picture.jpg",
        "https://contents.mediadecathlon.com/p3014486/k$a5b768667df5f5e90e61161644f461a9/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Sous-vêtement thermique : tissu fin, très élastique et sensible à la chaleur. Un visuel se déforme quand le haut s'étire. Fabr'Icam fait un essai (pressage, étirement, lavage à 30 °C) avant la série.",
      zones: {
        poitrine: { vue: "face", cx: 56, top: 19, w: 14, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 14, w: 26, h: 44, label: "Dos" }
      }
    },
    {
      id: "tshirt-coton-homme",
      nomCourt: "T-shirt coton homme",
      nom: "T-shirt de sport en coton, col rond, homme",
      marque: "Domyos, Decathlon",
      modele: "tshirt",
      demonstratif: "ce t-shirt",
      tags: { genre: ["homme"], style: "casual", type: "haut" },
      prixAchat: 3.99,
      matiere: "60 % coton, 40 % polyester",
      polyesterPct: 40,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "bleu-fonce", nom: "Bleu foncé", hex: "#2e4663", clair: false, ref: "9033996" }
      ],
      lien: "https://www.decathlon.fr/p/t-shirt-de-sport-en-coton-col-rond-homme-bleu-fonce/387248/c364m9033996",
      photos: [
        "https://contents.mediadecathlon.com/p3152322/k$2d8c9d318064755904bfacbb63c32c10/picture.jpg",
        "https://contents.mediadecathlon.com/p3152321/k$96945b3dc5d876342e550bac10c1c120/picture.jpg",
        "https://contents.mediadecathlon.com/p3152320/k$aef334e5c1e973cfaa4be5413a4ed929/picture.jpg",
        "https://contents.mediadecathlon.com/p3152318/k$57bdcae58a33460f52f5017710dc9a8a/picture.jpg",
        "https://contents.mediadecathlon.com/p3152323/k$5a71864c8332e8abed1d5002bbc5b2d0/picture.jpg",
        "https://contents.mediadecathlon.com/p3152319/k$a990670d732eebdb32d3eb372e3ea080/picture.jpg",
        "https://contents.mediadecathlon.com/p3174367/k$a27caac71366a0df74eb55352a89eb8e/picture.jpg"
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
      id: "tshirt-homme-gris",
      nomCourt: "T-shirt homme gris",
      nom: "Tee-shirt à manches courtes homme",
      marque: "Domyos, Decathlon",
      modele: "tshirt",
      demonstratif: "ce t-shirt",
      tags: { genre: ["homme"], style: "casual", type: "haut" },
      prixAchat: 5.99,
      matiere: "60 % coton, 40 % polyester",
      polyesterPct: 40,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: [
        { id: "gris", nom: "Gris", hex: "#b4b7bb", clair: true, ref: "9005972" }
      ],
      lien: "https://www.decathlon.fr/p/tee-shirt-manche-courte-homme-gris/360199/c200m9005972",
      photos: [
        "https://contents.mediadecathlon.com/p3152354/k$8cf73317403b1061802f9f2810c85f48/picture.jpg",
        "https://contents.mediadecathlon.com/p3152326/k$cc0de1fdb1b515679930415b8b172aa4/picture.jpg",
        "https://contents.mediadecathlon.com/p3152346/k$eb1a4a8bb641dc3e6ac7126e966d6d18/picture.jpg",
        "https://contents.mediadecathlon.com/p3152335/k$f8fccd37921271759e64d6f0e3cedc00/picture.jpg",
        "https://contents.mediadecathlon.com/p3152350/k$2d9ce9eddc563db054fc237ee950bbc5/picture.jpg",
        "https://contents.mediadecathlon.com/p3152337/k$a6f0d6895e9a579fc07823e387da2b59/picture.jpg",
        "https://contents.mediadecathlon.com/p3152331/k$8acfd5e8f9d687881a6fba7946da045f/picture.jpg"
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
      id: "jogging-homme",
      nomCourt: "Pantalon jogging homme",
      nom: "Jogging molleton homme",
      marque: "Domyos, Decathlon",
      modele: "pantalon",
      demonstratif: "ce pantalon",
      tags: { genre: ["homme"], style: "casual", type: "bas" },
      prixAchat: 9.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8974121" },
        { id: "bleu-acier", nom: "Bleu acier", hex: "#55708f", clair: false, ref: "9001530" }
      ],
      lien: "https://www.decathlon.fr/p/jogging-molleton-homme-noir/375529/c1m8974121",
      photos: [
        "https://contents.mediadecathlon.com/p3147366/k$ff47eba57df5db4a9d042fb7e7ac988b/picture.jpg",
        "https://contents.mediadecathlon.com/p3147369/k$f849b0068f35bb66ee619a6a3d0f4905/picture.jpg",
        "https://contents.mediadecathlon.com/p3147378/k$afbfb4967b1b60c44067fbaaf3cc1423/picture.jpg",
        "https://contents.mediadecathlon.com/p3147365/k$e15ba2006da748e5c8decef9e9d53d2d/picture.jpg",
        "https://contents.mediadecathlon.com/p3147376/k$82230e5733bf34796cdb8e42cf891e52/picture.jpg",
        "https://contents.mediadecathlon.com/p3147374/k$dc551a04cea129af28d64fcd83e62bbf/picture.jpg"
      ],
      vitrine: ["cuisse_g"],
      texteVitrine: "sur une cuisse",
      zones: {
        cuisse_g:    { vue: "face", cx: 59,   top: 22, w: 14, h: 21, label: "Cuisse gauche" },
        cuisse_d:    { vue: "face", cx: 31,   top: 22, w: 14, h: 21, label: "Cuisse droite" },
        bas_jambe_g: { vue: "face", cx: 59.2, top: 86, w: 12, h: 6,  label: "Bas de la jambe gauche" }
      }
    },
    {
      id: "short-football-essentiel",
      nomCourt: "Short football",
      nom: "Short de football adulte Essentiel",
      marque: "Kipsta, Decathlon",
      modele: "short-tennis",
      demonstratif: "ce short",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Football", type: "bas" },
      prixAchat: 4.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8327267" },
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8327265" },
        { id: "bleu-acier", nom: "Bleu acier", hex: "#55708f", clair: false, ref: "8525866" },
        { id: "bleu-indigo", nom: "Bleu indigo", hex: "#2b3f7a", clair: false, ref: "8525867" },
        { id: "rouge-piment", nom: "Rouge piment", hex: "#c4252b", clair: false, ref: "8407483" },
        { id: "vert-emeraude", nom: "Vert émeraude", hex: "#1b7a50", clair: false, ref: "8407485" },
        { id: "jaune-citron", nom: "Jaune citron", hex: "#e6dc3c", clair: false, ref: "8407484" },
        { id: "orange-flamme", nom: "Orange fluo", hex: "#ff6a13", clair: false, ref: "8383071" }
      ],
      lien: "https://www.decathlon.fr/p/short-de-football-adulte-essentiel-noir/108306/c382m8327267",
      photos: [
        "https://contents.mediadecathlon.com/p2959930/k$eed773dcfeb281a10fa2ae0218ee9cec/picture.jpg",
        "https://contents.mediadecathlon.com/p2960173/k$f7ff63a6e4e9b195f7e1aa98d0dfce75/picture.jpg",
        "https://contents.mediadecathlon.com/p2960119/k$1c907df64987565a70c02958c137e859/picture.jpg",
        "https://contents.mediadecathlon.com/p2960023/k$afacdafafa28a252d82e9328d809bc54/picture.jpg",
        "https://contents.mediadecathlon.com/p2960229/k$557c924fd20ec025b94886d61f5002f8/picture.jpg",
        "https://contents.mediadecathlon.com/p2959962/k$d62d0d095e64299b2f76a11665a924b8/picture.jpg",
        "https://contents.mediadecathlon.com/p2960080/k$5fc38d40976400dceb3cc5111ca57266/picture.jpg"
      ],
      vitrine: ["cuisse_g"],
      texteVitrine: "sur une cuisse",
      zones: {
        cuisse_g: { vue: "face", cx: 57.5, top: 20, w: 14, h: 21, label: "Cuisse gauche" },
        cuisse_d: { vue: "face", cx: 32.5, top: 20, w: 14, h: 21, label: "Cuisse droite" }
      }
    }
  ],

  // Packs : plusieurs produits vendus ensemble comme un seul article (une seule marge, voir prix.js)
  packs: [
    {
      id: "pack-basket",
      nom: "Pack basket : maillot, short et chaussettes",
      nomCourt: "Pack basket",
      demonstratif: "ce pack",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Basket", type: "ensemble" },
      produits: ["maillot-basket", "short-basket", "chaussettes-football"],
      vitrine: ["poitrine", "cuisse_g", "chaussette_g"],
      texteVitrine: "sur la poitrine du maillot et une cuisse du short",
      noteVitrine: "Avec un visuel A6 sur le maillot et sur le short, et un prénom de 3 cm sur une chaussette."
    },
    {
      id: "pack-fitness-femme",
      nom: "Pack fitness femme : t-shirt, short et chaussettes",
      nomCourt: "Pack fitness femme",
      demonstratif: "ce pack",
      tags: { genre: ["femme"], style: "sport", sport: "Fitness", type: "ensemble" },
      produits: ["tshirt-fitness-femme", "short-slim-fitness", "chaussettes-football"],
      vitrine: ["poitrine", "cuisse_g", "chaussette_g"],
      texteVitrine: "sur la poitrine du t-shirt et une cuisse du short",
      noteVitrine: "Avec un visuel A6 sur le t-shirt et sur le short, et un prénom de 3 cm sur une chaussette."
    },
    {
      id: "pack-jogging-femme",
      nom: "Pack jogging femme : pantalon, t-shirt et chaussettes",
      nomCourt: "Pack jogging femme",
      demonstratif: "ce pack",
      tags: { genre: ["femme"], style: "casual", type: "ensemble" },
      produits: ["jogging-femme", "tshirt-coton-femme", "chaussettes-football"],
      vitrine: ["poitrine", "cuisse_g", "chaussette_g"],
      texteVitrine: "sur la poitrine du t-shirt et une cuisse du pantalon",
      noteVitrine: "Avec un visuel A6 sur le t-shirt et sur le pantalon, et un prénom de 3 cm sur une chaussette."
    },
    {
      id: "pack-football",
      nom: "Pack football : sweat, short et chaussettes",
      nomCourt: "Pack football",
      demonstratif: "ce pack",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Football", type: "ensemble" },
      produits: ["sweat-football-t100", "short-football-essentiel", "chaussettes-football"],
      vitrine: ["poitrine", "cuisse_g", "chaussette_g"],
      texteVitrine: "sur la poitrine du sweat et une cuisse du short",
      noteVitrine: "Avec un visuel A6 sur le sweat et sur le short, et un prénom de 3 cm sur une chaussette."
    },
    {
      id: "pack-entraineur",
      nom: "Pack entraîneur : veste, haut thermique, jogging et chaussettes",
      nomCourt: "Pack entraîneur",
      demonstratif: "ce pack",
      tags: { genre: ["homme"], style: "sport", type: "ensemble" },
      produits: ["veste-micropolaire", "thermique-homme", "jogging-homme", "chaussettes-football"],
      vitrine: ["poitrine", "cuisse_g", "chaussette_g"],
      texteVitrine: "sur la poitrine de la veste et du haut thermique et une cuisse du pantalon",
      noteVitrine: "Avec un visuel A6 sur la veste, sur le haut thermique et sur le pantalon, et un prénom de 3 cm sur une chaussette."
    }
  ]
};
