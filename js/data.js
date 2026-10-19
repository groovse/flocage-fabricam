/*
 * CATALOGUE — pour ajouter un vêtement, copie un bloc de « produits » et change :
 * id, nom, prixAchat (TTC), tailles, couleurs, modele (le dessin : polo, sweat, debardeur,
 * maillot, short-basket, short-tennis, short-slim, tshirt, manches-longues, veste, sweat-zip, gilet, gilet-matelasse, ensemble-short,
 * pantalon, chaussette, gourde, casquette, bonnet, tour-de-cou, bandeau, sac-tube, sac-sport, sac-a-dos, ceinture), tags (genre, style, type : haut, bas,
 * ensemble ou accessoire), vendeur (seulement pour un article de la place de marché Decathlon, voir prix.js), sublimation: false
 * (article qui ne se sublime pas), margePack: 0 (pièce sans marge dans un pack, comme les chaussettes, voir prix.js), vitrine (emplacements du prix affiché) et zones.
 * Un article « apporte: true » est un vêtement que le client apporte (voir plus bas, « Ton vêtement ») : prixAchat 0, couleurs = COULEURS_APPORTE.
 * Chaque couleur porte : nomDec (son nom sur Decathlon), ref (référence Decathlon), lien (la page de cette couleur), photos (sa série de
 * photos, avec dec([...])), et si besoin prixAchat (quand cette couleur ne coûte pas le prix de l'article) et rupture (date AAAA-MM-JJ
 * à laquelle Decathlon l'a signalée en rupture de stock). « photos » de l'article : les photos de la couleur de référence de apercuPhoto.
 * Les zones sont en cm sur le dessin du vêtement (90 cm de large) : cx = centre horizontal,
 * top = haut de la zone (ou cy = centre), w/h = taille max de la zone.
 */
// Photos Decathlon d'une couleur : dec(["p2454696/k$d8af…", …]) donne les adresses complètes des images.
function dec(ids) { return ids.map(function (id) { return "https://contents.mediadecathlon.com/" + id + "/picture.jpg"; }); }

// Couleurs proposées pour un vêtement apporté par le client (clair : blanc ou très pâle, voir engine.js pour la sublimation)
var COULEURS_APPORTE = [
  { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true },
  { id: "gris-clair", nom: "Gris clair", hex: "#cdd1d5", clair: true },
  { id: "gris", nom: "Gris", hex: "#8d9196", clair: false },
  { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false },
  { id: "marine", nom: "Marine", hex: "#243b5e", clair: false },
  { id: "bleu", nom: "Bleu", hex: "#2d4f9e", clair: false },
  { id: "rouge", nom: "Rouge", hex: "#c4252b", clair: false },
  { id: "bordeaux", nom: "Bordeaux", hex: "#6e1e2c", clair: false },
  { id: "vert", nom: "Vert", hex: "#2f7d4f", clair: false },
  { id: "kaki", nom: "Kaki", hex: "#6f6b4e", clair: false },
  { id: "jaune", nom: "Jaune", hex: "#f4cf1e", clair: false },
  { id: "orange", nom: "Orange", hex: "#f26b1d", clair: false },
  { id: "rose", nom: "Rose", hex: "#e58fb2", clair: false },
  { id: "autre-clair", nom: "Autre couleur claire", hex: "#e4dfd2", clair: true },
  { id: "autre-fonce", nom: "Autre couleur foncée", hex: "#3a3d42", clair: false }
];

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
    chaussette_d: { label: "Chaussette droite", formats: [], texteSeul: true },
    // Accessoires : petits formats (Mini 5 x 5 cm, A7 7 x 10 cm, voir formatsMotif dans prix.js)
    sac:         { label: "Face du sac", formats: ["A6", "A5"] },
    gourde:      { label: "Face de la gourde", formats: ["Mini", "A7"] },
    casquette:   { label: "Devant de la casquette", formats: ["Mini"] },
    bonnet:      { label: "Devant du bonnet", formats: ["Mini", "A7"] },
    tour_de_cou: { label: "Face du tour de cou", formats: ["Mini", "A7"] },
    bandeau:     { label: "Devant du bandeau", formats: ["Mini"] },
    ceinture:    { label: "Face de la ceinture", formats: ["Mini", "A7"] }
  },

  // Filtres du catalogue (tags « genre », « style » et « type » de chaque produit ou pack). « sport » (tennis, basket...)
  // n'est qu'une étiquette d'affichage. Un vêtement mixte porte les deux genres. Type « ensemble » : packs de plusieurs pièces
  // et articles de plusieurs pièces vendus en un seul achat (survêtement, t-shirt et short).
  filtres: {
    genre: { label: "Pour", valeurs: [{ id: "homme", label: "Homme" }, { id: "femme", label: "Femme" }] },
    style: { label: "Style", valeurs: [{ id: "sport", label: "Sport" }, { id: "casual", label: "Casual" }] },
    type: { label: "Type", valeurs: [{ id: "haut", label: "Hauts" }, { id: "bas", label: "Bas" }, { id: "ensemble", label: "Ensembles" }, { id: "accessoire", label: "Accessoires" }, { id: "apporte", label: "Ton vêtement" }] }
  },

  // Matière d'un vêtement apporté par le client (elle se choisit sur chaque pièce, voir « Ton vêtement » plus bas). Seul « polyester »,
  // avec une couleur blanche ou claire, ouvre la sublimation. Sans certitude (« inconnu »), on reste en DTF et l'atelier vérifie.
  matieres: [
    { id: "polyester", nom: "Polyester (90 % ou plus)", court: "polyester" },
    { id: "coton", nom: "Coton ou mélange", court: "coton ou mélange" },
    { id: "inconnu", nom: "Je ne sais pas", court: "matière inconnue" }
  ],

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
        { id: "marine", nom: "Marine", nomDec: "bleu acier", hex: "#243b5e", clair: false, ref: "8336032",
          lien: "https://www.decathlon.fr/p/polo-de-tennis-manches-courtes-homme-essential-marine/103242/c364m8336032",
          photos: dec(["p2454696/k$d8af62394dde615416f9b470402a42bf", "p2946081/k$6ae7e948dc8375098dd4dfb91d391297", "p2875937/k$86bcf58fffce18e0ee0b2b02098f1414", "p2996308/k$c6cfda141a3f9b036b7d98e7b2a0cdaa"]) },
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra", hex: "#f3f3f0", clair: true, ref: "8336028",
          lien: "https://www.decathlon.fr/p/polo-de-tennis-manches-courtes-homme-essential-blanc/103242/c227m8336028",
          photos: dec(["p2454697/k$958e5d52cbb083b81e7159bf854eef5b", "p2996311/k$f1667f709af1d794502113c1b7359f53", "p2454818/k$f396f06b4ae3d25d83ce17f430c3dec9", "p2996249/k$edef42efdb760dff4a67a8e5b3088330"]) }
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
        { id: "bleu-fonce", nom: "Bleu foncé", nomDec: "bleu acier", hex: "#2e4663", clair: false, ref: "9004710",
          lien: "https://www.decathlon.fr/p/sweat-chaud-en-molleton-homme-bleu-fonce/351127/c364m9004710",
          photos: dec(["p2731314/k$d4ce50f4e39cac664cf37912913cd175", "p2731313/k$9577f8a8dcb8999509e836526b68efdc", "p2731317/k$56c013a9942708e0c0096d3a5f0a890f", "p2731315/k$6135be8c8d35692ca577cda8efd7ba9b", "p2731316/k$a6f10d77258cbd82a7353675def8674e", "p2731318/k$d641c0cdc58455775bfec220ddb8bb47"]) },
        { id: "kaki", nom: "Kaki", nomDec: "vert kaki", hex: "#6f6b4e", clair: false, ref: "8961058",
          lien: "https://www.decathlon.fr/p/sweat-chaud-en-molleton-homme-kaki/351127/c109m8961058",
          photos: dec(["p2933015/k$5ed20a74e1fdecf627900472e9e11456", "p2933068/k$6c4a24539c27ad901047712ceb4acc13", "p2933023/k$f89d25a604fae75d818c76b5f773a70d", "p2933034/k$9838b3bcdfe147b45ea403c13a0251ef", "p2933088/k$785bce6d4528a77fa40efb412f9085b6", "p2933103/k$11aba50c8448786aa447297fe61adafb"]) },
        { id: "gris", nom: "Gris", nomDec: "gris", hex: "#9ea2a7", clair: false, ref: "8883261",
          lien: "https://www.decathlon.fr/p/sweat-chaud-en-molleton-homme-gris/351127/c251m8883261",
          photos: dec(["p2731214/k$30690d038636a4d7c590ee2f86e36fb3", "p2731211/k$e91578d2e4c28f965e22ec2e2b884d6d", "p2731210/k$79239e90beb7c03b9efabe4f9ab976f6", "p2731212/k$3838eee5d01508c57534cf4ce7a1205c", "p2731213/k$34998821085c27538913491f72487d0f", "p2731209/k$ee4e3cd64b5abab632d3734e5786ddf4"]) },
        { id: "noir", nom: "Noir", nomDec: "noir ultra", hex: "#1c1c1f", clair: false, ref: "8873617",
          lien: "https://www.decathlon.fr/p/sweat-chaud-en-molleton-homme-noir/351127/c378m8873617",
          photos: dec(["p2731204/k$26273a21c90c4397e5766b897f8170df", "p2731203/k$4e9941db61d0639ef34a048b8f69277a", "p2731208/k$353e7c5cc64288a822a89a76e0578d1e", "p2731205/k$0d11a69f6d4da5d4b13b6b6361870b8a", "p2731206/k$8ad86db68db6b9d0d9704d6252ff7f1c", "p2731207/k$96a698ffbff9e307a1596268aad0509d"]) }
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
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra / noir fumé", hex: "#f3f3f0", clair: true, ref: "8941322",
          lien: "https://www.decathlon.fr/p/maillot-de-basketball-sans-manche-homme-femme-tank-100-blanc/362058/c227c382m8941322",
          photos: dec(["p2938737/k$cb964f859411a64f3b547eb595368593", "p2938838/k$e97e16f73ab955533dc1c6114fe65b29", "p2938601/k$028c1a4fda58a2d47f38aef63ab06169", "p2938670/k$27bd8fcca87685013513a8dc28879667", "p2938646/k$f69e087976a5f25d26adbe3dc8969c08", "p2938618/k$e0e39fd469f2cb8c8a713d30396affe9", "p2929375/k$67f50b8c908aca741bfbffb86ea438d3", "p2929349/k$2ec15fe68fc60f656a009e71f5c352d8"]) },
        { id: "marine", nom: "Marine", nomDec: "indigo nuit. / blanc ultra", hex: "#243b5e", clair: false, ref: "8935974",
          lien: "https://www.decathlon.fr/p/maillot-de-basketball-sans-manche-homme-femme-tank-100-navy/362058/c188c227m8935974",
          photos: dec(["p2938706/k$d7916c39067ec0316072df7b2a387057", "p2938895/k$bc3f206cbead1e6006f3c7095f73fec5", "p2938876/k$10b9b795a99ba6019f629e9c8020b85b", "p2938605/k$8ba4a3ff06eacb22bf3dbdad95ffb87b", "p2938702/k$4bdb59c097d1fa62bb6bf8d4729a0cbf", "p2938651/k$5ddc85a614fa2524203d65f4884c8b2f"]) },
        { id: "bleu", nom: "Bleu", nomDec: "bleu indigo / blanc ultra", hex: "#2d4f9e", clair: false, ref: "8941324",
          lien: "https://www.decathlon.fr/p/maillot-de-basketball-sans-manche-homme-femme-tank-100-bleu/362058/c59c227m8941324",
          photos: dec(["p2938677/k$62a2eea90a62833ab839fa3aad2bb123", "p2938580/k$fddedcccdacfeaf3e2f290311606ab7e", "p2938846/k$ad00cd9060c1feba2b5960b8af38087b", "p2938756/k$733c382e9be79c0ca1b77e78daf79e53", "p2938834/k$96cec9bb1147b26200092773a38af6ef", "p2938731/k$6f035eecd3abe0e890e44538fd8996ba", "p2929375/k$67f50b8c908aca741bfbffb86ea438d3", "p2929365/k$e032e59b0d26a0288d8d0ea09aed9b98"]) },
        { id: "noir", nom: "Noir", nomDec: "noir fumé / blanc ultra", hex: "#1c1c1f", clair: false, ref: "8941321",
          lien: "https://www.decathlon.fr/p/maillot-de-basketball-sans-manche-homme-femme-tank-100-noir/362058/c382c227m8941321",
          photos: dec(["p2938623/k$90bf535c310ae5eb913c409cf02a7f77", "p2938827/k$bb664b29b35acc4d2a6ee531e98f44f8", "p2938811/k$dacb387b9bc6ad6e67b72ffcbfd8b1f8", "p2938878/k$1feae196b76e1b0f24857bdff517aa59", "p2938692/k$465100b6925e10fb24bb6d3937dbe51c", "p2938736/k$ee00a36875c13b38bd85da02fa742fe4"]) },
        { id: "rouge", nom: "Rouge", nomDec: "rouge piment / blanc ultra", hex: "#c4252b", clair: false, ref: "8941325", rupture: "2026-10-19",
          lien: "https://www.decathlon.fr/p/maillot-de-basketball-sans-manche-homme-femme-tank-100-rouge/362058/c221c227m8941325",
          photos: dec(["p2938803/k$e33c16a794b62779929076be7d71d564", "p2938592/k$29bd0defee49ad997d0dc7b653c73e30", "p2938649/k$109cb59e77ad52529f850293fb7b175a", "p2938719/k$011b0ceab8fd431c0ee8fe13131c8f11", "p2938760/k$3623cc4e28f870c5343380455c1cba23", "p2938745/k$fbb3827f73a3c1f1c8ef09d895dda318"]) }
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
      margePack: 0,   // dans un pack, les chaussettes ne portent aucune marge (voir prix.js)
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
      id: "ensemble-hummel",
      anciensId: ["robe-hummel"],   // ancien identifiant : les fichiers de commande déjà envoyés se rechargent à l'atelier
      nomCourt: "Ensemble Hummel",
      nom: "Ensemble t-shirt et short Hummel",
      marque: "Hummel",
      modele: "ensemble-short",
      demonstratif: "cet ensemble",
      tags: { genre: ["femme"], style: "casual", type: "ensemble" },
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
      vitrine: ["poitrine", "cuisse_g"],
      texteVitrine: "sur la poitrine du t-shirt et une cuisse du short",
      noteVitrine: "Avec un visuel A6 sur le t-shirt et un autre sur le short.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 19, w: 14, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 13, w: 28, h: 38, label: "Dos" },
        cuisse_g: { vue: "face", cx: 57.5, top: 88, w: 14, h: 21, label: "Cuisse gauche (short)" },
        cuisse_d: { vue: "face", cx: 32.5, top: 88, w: 14, h: 21, label: "Cuisse droite (short)" }
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
    },
    {
      id: "gourde-alu-1l",
      nomCourt: "Gourde alu 1 L",
      nom: "Gourde alu 1 L avec bouchon instantané",
      marque: "Quechua, Decathlon",
      modele: "gourde",
      demonstratif: "cette gourde",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Randonnée", type: "accessoire" },
      prixAchat: 9.99,
      matiere: "Aluminium recyclé, bouchon polypropylène",
      polyesterPct: 0,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["1 L"],
      couleurs: [
        { id: "bleu-canard", nom: "Bleu canard", hex: "#1f6f7d", clair: false, ref: "8612536", lien: "https://www.decathlon.fr/p/gourde-alu-1l-avec-bouchon-instantane-composee-a-100percent-dalu-recycle-bleu/330041/c98m8612536" },
        { id: "vert-eucalyptus", nom: "Vert eucalyptus", hex: "#6f9d86", clair: false, ref: "8914342", lien: "https://www.decathlon.fr/p/gourde-alu-1l-avec-bouchon-instantane-composee-a-100percent-dalu-recycle-bleu/330041/c261m8914342" },
        { id: "orange-abricot", nom: "Orange abricot", hex: "#f2a15f", clair: false, ref: "8914343", lien: "https://www.decathlon.fr/p/gourde-alu-1l-avec-bouchon-instantane-composee-a-100percent-dalu-recycle-bleu/330041/c329m8914343" }
      ],
      lien: "https://www.decathlon.fr/p/gourde-alu-1l-avec-bouchon-instantane-composee-a-100percent-dalu-recycle-bleu/330041/c98m8612536",
      photos: [
        "https://contents.mediadecathlon.com/p2579584/k$6ca4ddf66bdc61cefd58225cb14ae926/picture.jpg",
        "https://contents.mediadecathlon.com/p2201844/k$e09b054551ba918f14d858419b0a526d/picture.jpg",
        "https://contents.mediadecathlon.com/p2201852/k$36ef852b724f1a14239d5e033c6a7c0f/picture.jpg",
        "https://contents.mediadecathlon.com/p2201851/k$8642c0eb5c5463cec869e9a1fedba9a3/picture.jpg",
        "https://contents.mediadecathlon.com/p2201850/k$b935d84ad62dc05f7f57b3a46275529c/picture.jpg",
        "https://contents.mediadecathlon.com/p2201849/k$82659a0434adc4388130746738039f4f/picture.jpg"
      ],
      vitrine: ["gourde"],
      texteVitrine: "sur la face de la gourde",
      avertissement: "Gourde : le transfert DTF se pose sur la face, un petit visuel seulement (Mini 5 × 5 cm ou A7) car la surface est ronde. Fabr'Icam fait un essai (tenue, lavage) avant la série.",
      zones: {
        gourde: { vue: "face", cx: 20, top: 13, w: 7, h: 15, label: "Face de la gourde" }
      }
    },
    {
      id: "gourde-fitness-750",
      nomCourt: "Gourde fitness 750 mL",
      nom: "Gourde de fitness training aluminium 750 mL",
      marque: "Domyos, Decathlon",
      modele: "gourde",
      demonstratif: "cette gourde",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Fitness", type: "accessoire" },
      prixAchat: 9.00,
      matiere: "Aluminium, bouchon polypropylène",
      polyesterPct: 0,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["750 mL"],
      couleurs: [
        { id: "bleu-marine", nom: "Bleu marine", hex: "#1f2b4a", clair: false, ref: "8796697", lien: "https://www.decathlon.fr/p/gourde-de-fitness-training-aluminium-750-ml-bleu/345015/c195m8796697" },
        { id: "vert-sauge", nom: "Vert sauge", hex: "#9db5a0", clair: false, ref: "8796696", lien: "https://www.decathlon.fr/p/gourde-de-fitness-training-aluminium-750-ml-bleu/345015/c219m8796696" }
      ],
      lien: "https://www.decathlon.fr/p/gourde-de-fitness-training-aluminium-750-ml-bleu/345015/c195m8796697",
      photos: [
        "https://contents.mediadecathlon.com/p2673170/k$8694fe9977769d156de43e65c6f6cb5c/picture.jpg",
        "https://contents.mediadecathlon.com/p2673198/k$7005747afdb0472bb5c9db14d6341902/picture.jpg",
        "https://contents.mediadecathlon.com/p2673188/k$593592a343514feeeb3caba110b14bbc/picture.jpg",
        "https://contents.mediadecathlon.com/p2673166/k$ae0c9600b39b1a761561f59a9ed26b9e/picture.jpg"
      ],
      vitrine: ["gourde"],
      texteVitrine: "sur la face de la gourde",
      avertissement: "Gourde : le transfert DTF se pose sur la face, un petit visuel seulement (Mini 5 × 5 cm ou A7) car la surface est ronde. Fabr'Icam fait un essai (tenue, lavage) avant la série.",
      zones: {
        gourde: { vue: "face", cx: 20, top: 13, w: 7, h: 15, label: "Face de la gourde" }
      }
    },
    {
      id: "gourde-verre",
      nomCourt: "Gourde en verre",
      nom: "Gourde en verre avec ouverture facile",
      marque: "Phoenix, Decathlon",
      modele: "gourde",
      demonstratif: "cette gourde",
      tags: { genre: ["homme", "femme"], style: "casual", sport: "Randonnée", type: "accessoire" },
      prixAchat: 7.99,
      matiere: "Verre (500 à 600 mL), bouchon vissable, housse",
      polyesterPct: 0,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["500 à 600 mL"],
      couleurs: [
        { id: "transparent", nom: "Transparent", hex: "#d5e6ea", clair: true, ref: "8946490", lien: "https://www.decathlon.fr/p/gourde-en-verre-avec-ouverture-facile/366458/c1m8946490" }
      ],
      lien: "https://www.decathlon.fr/p/gourde-en-verre-avec-ouverture-facile/366458/c1m8946490",
      photos: [
        "https://contents.mediadecathlon.com/p2825850/k$72511b4ca7fe13a13b316bff63d95bd8/picture.jpg",
        "https://contents.mediadecathlon.com/p2825851/k$a443fecd086d9a4ac0f584f293a78c5d/picture.jpg",
        "https://contents.mediadecathlon.com/p2825853/k$28a7df380de0919eb023d871c999c928/picture.jpg",
        "https://contents.mediadecathlon.com/p2825852/k$26b68c73aedfe9d24bddd2b6a6d6b40b/picture.jpg"
      ],
      vitrine: ["gourde"],
      texteVitrine: "sur la face de la gourde",
      avertissement: "Gourde en verre : le transfert DTF se pose sur la face, un petit visuel seulement (Mini 5 × 5 cm ou A7) car la surface est ronde et le verre fragile. Fabr'Icam fait un essai (tenue, lavage) avant la série.",
      zones: {
        gourde: { vue: "face", cx: 20, top: 13, w: 7, h: 15, label: "Face de la gourde" }
      }
    },
    {
      id: "casquette-hike-100",
      nomCourt: "Casquette randonnée",
      nom: "Casquette de randonnée HIKE 100",
      marque: "Forclaz, Decathlon",
      modele: "casquette",
      demonstratif: "cette casquette",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Randonnée", type: "accessoire" },
      prixAchat: 4.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "bleu", nom: "Bleu", hex: "#2f5f9c", clair: false, ref: "8969347", lien: "https://www.decathlon.fr/p/casquette-de-randonnee-hike-100-bleu/302963/c43m8969347" }
      ],
      lien: "https://www.decathlon.fr/p/casquette-de-randonnee-hike-100-bleu/302963/c43m8969347",
      photos: [
        "https://contents.mediadecathlon.com/p3007477/k$c4ee85e8923af023082ec182f6539373/picture.jpg",
        "https://contents.mediadecathlon.com/p3069399/k$5bbd189ac0e77d180f5ea5d656a7d4f9/picture.jpg",
        "https://contents.mediadecathlon.com/p3016744/k$52c178f96531c5e2720f12302bc3b871/picture.jpg",
        "https://contents.mediadecathlon.com/p3007360/k$1cac46c835739a647cc7c8d0b431ad01/picture.jpg",
        "https://contents.mediadecathlon.com/p3007442/k$7f74ed468f0714f22232c36d6912f679/picture.jpg",
        "https://contents.mediadecathlon.com/p3007433/k$1a9e0ca625c26a49b0bdbf5ae2caf0de/picture.jpg"
      ],
      vitrine: ["casquette"],
      texteVitrine: "sur le devant de la casquette",
      avertissement: "Casquette : le devant est bombé et le tissu fin. Un visuel de 5 × 5 cm au plus, pressé avec une presse adaptée. Fabr'Icam fait un essai avant la série.",
      zones: {
        casquette: { vue: "face", cx: 18, top: 8, w: 12, h: 8, label: "Devant de la casquette" }
      }
    },
    {
      id: "casquette-chasse-100",
      nomCourt: "Casquette chasse orange",
      nom: "Casquette de chasse orange 100",
      marque: "Solognac, Decathlon",
      modele: "casquette",
      demonstratif: "cette casquette",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Chasse", type: "accessoire" },
      prixAchat: 5.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique", "S/M", "L/XL", "2XL/3XL"],
      couleurs: [
        { id: "orange-fluo", nom: "Orange fluo", hex: "#f26b1d", clair: false, ref: "8070067", lien: "https://www.decathlon.fr/p/casquette-chasse-orange-100/6457/c379m8070067" }
      ],
      lien: "https://www.decathlon.fr/p/casquette-chasse-orange-100/6457/c379m8070067",
      photos: [
        "https://contents.mediadecathlon.com/p1097439/k$826e8aef997002dede100ef04ef82e3c/picture.jpg",
        "https://contents.mediadecathlon.com/p1097447/k$8be0a2b27ab0c9de9ccda646ec633c4b/picture.jpg",
        "https://contents.mediadecathlon.com/p1097440/k$00c1fff8f33d36dd00d4fe8bf5a7561d/picture.jpg",
        "https://contents.mediadecathlon.com/p1097443/k$fe78240b64fd854bb0a05e3e365df5d6/picture.jpg",
        "https://contents.mediadecathlon.com/p1097446/k$7f95e487c18b1f1730c36669611c83e0/picture.jpg",
        "https://contents.mediadecathlon.com/p1097445/k$7b33299f5a15a1bb3e0e288492666442/picture.jpg"
      ],
      vitrine: ["casquette"],
      texteVitrine: "sur le devant de la casquette",
      avertissement: "Casquette : le devant est bombé et le tissu fin. Un visuel de 5 × 5 cm au plus, pressé avec une presse adaptée. Fabr'Icam fait un essai avant la série.",
      zones: {
        casquette: { vue: "face", cx: 18, top: 8, w: 12, h: 8, label: "Devant de la casquette" }
      }
    },
    {
      id: "casquette-tennis-tc100",
      nomCourt: "Casquette tennis",
      nom: "Casquette de tennis TC 100",
      marque: "Artengo, Decathlon",
      modele: "casquette",
      demonstratif: "cette casquette",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Tennis", type: "accessoire" },
      prixAchat: 5.99,
      matiere: "100 % polyester",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8618832", lien: "https://www.decathlon.fr/p/casquette-tennis-artengo-tc-100-noir/330799/c382m8618832" },
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8618831", lien: "https://www.decathlon.fr/p/casquette-tennis-artengo-tc-100-noir/330799/c227m8618831" }
      ],
      lien: "https://www.decathlon.fr/p/casquette-tennis-artengo-tc-100-noir/330799/c382m8618832",
      photos: [
        "https://contents.mediadecathlon.com/p2797307/k$8f8b4e2943235ab68cc72e10db7ef72d/picture.jpg",
        "https://contents.mediadecathlon.com/p2797309/k$f37cee2df404c61bf3e44836936515ae/picture.jpg",
        "https://contents.mediadecathlon.com/p2797308/k$a68032a48dc83dd7f39a233c934ff4d6/picture.jpg",
        "https://contents.mediadecathlon.com/p2797306/k$5eb2678324e016aada33ed4faa8f934e/picture.jpg"
      ],
      vitrine: ["casquette"],
      texteVitrine: "sur le devant de la casquette",
      avertissement: "Casquette : le devant est bombé et le tissu fin. Un visuel de 5 × 5 cm au plus, pressé avec une presse adaptée. Fabr'Icam fait un essai avant la série.",
      zones: {
        casquette: { vue: "face", cx: 18, top: 8, w: 12, h: 8, label: "Devant de la casquette" }
      }
    },
    {
      id: "bonnet-rider-500",
      nomCourt: "Bonnet à revers",
      nom: "Bonnet à revers adulte RIDER 500",
      marque: "Wedze, Decathlon",
      modele: "bonnet",
      demonstratif: "ce bonnet",
      tags: { genre: ["homme", "femme"], style: "casual", sport: "Ski", type: "accessoire" },
      prixAchat: 8.99,
      matiere: "100 % acrylique",
      polyesterPct: 0,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["M (56-59 cm)"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8940552", lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-noir/353824/c382m8940552" },
        { id: "marron-caramel", nom: "Marron caramel", hex: "#a8703a", clair: false, ref: "8940513", lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-noir/353824/c152m8940513" },
        { id: "blanc-coton", nom: "Blanc coton", hex: "#f1efe6", clair: true, ref: "8940507", lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-noir/353824/c183m8940507" },
        { id: "violet-fume", nom: "Violet fumé", hex: "#5d4a7a", clair: false, ref: "8940511", lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-noir/353824/c368m8940511" },
        { id: "rose-tendre", nom: "Rose tendre", hex: "#f0b8c8", clair: true, ref: "8940512", lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-noir/353824/c391m8940512" },
        { id: "jaune-vanille", nom: "Jaune vanille", hex: "#f1e08a", clair: true, ref: "8992939", lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-noir/353824/c269m8992939" }
      ],
      lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-noir/353824/c382m8940552",
      photos: [
        "https://contents.mediadecathlon.com/p2996321/k$0405095409a073502d56dbc5dd025331/picture.jpg",
        "https://contents.mediadecathlon.com/p2996332/k$7cb7b3bca0774909dc86ab070fed452b/picture.jpg",
        "https://contents.mediadecathlon.com/p2996340/k$fb3ba52948e7438abce1de5dd10ee614/picture.jpg",
        "https://contents.mediadecathlon.com/p2996350/k$6ad1308f4e0a17018829658f93978edf/picture.jpg"
      ],
      vitrine: ["bonnet"],
      texteVitrine: "sur le devant du bonnet",
      avertissement: "Bonnet en maille acrylique : tricot épais et très élastique, le transfert tient mal et se déforme à l'étirement. Fabr'Icam teste sur le revers avant la série et confirme que c'est faisable.",
      zones: {
        bonnet: { vue: "face", cx: 18, top: 18.6, w: 14, h: 7.4, label: "Devant du bonnet" }
      }
    },
    {
      id: "bonnet-running-seamless",
      nomCourt: "Bonnet running",
      nom: "Bonnet de running seamless adulte",
      marque: "Kiprun, Decathlon",
      modele: "bonnet",
      demonstratif: "ce bonnet",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Course à pied", type: "accessoire" },
      prixAchat: 5.99,
      matiere: "72 % polyester, 23 % polyamide, 5 % élasthanne",
      polyesterPct: 72,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8368935", lien: "https://www.decathlon.fr/p/bonnet-running-seamless-adulte-kiprun-noir/157211/c382m8368935" },
        { id: "gris-beton", nom: "Gris béton", hex: "#a3a5a8", clair: true, ref: "8920402", lien: "https://www.decathlon.fr/p/bonnet-running-seamless-adulte-kiprun-noir/157211/c208m8920402" },
        { id: "violet-charbon", nom: "Violet charbon", hex: "#4b3a5c", clair: false, ref: "8920404", lien: "https://www.decathlon.fr/p/bonnet-running-seamless-adulte-kiprun-noir/157211/c89m8920404" }
      ],
      lien: "https://www.decathlon.fr/p/bonnet-running-seamless-adulte-kiprun-noir/157211/c382m8368935",
      photos: [
        "https://contents.mediadecathlon.com/p2698482/k$dfd2fb85ff5d9ba1a6f48e2687f66b4f/picture.jpg",
        "https://contents.mediadecathlon.com/p2698527/k$955f0023691923487cfec2eab5e16600/picture.jpg",
        "https://contents.mediadecathlon.com/p2709558/k$59197f2cf67320b6724f5504b631a83f/picture.jpg",
        "https://contents.mediadecathlon.com/p2709488/k$b8e557ff810876d8de4acde2387e5997/picture.jpg"
      ],
      vitrine: ["bonnet"],
      texteVitrine: "sur le devant du bonnet",
      avertissement: "Bonnet sans couture très fin et élastique : petit visuel ou prénom seulement, la déformation est possible. Fabr'Icam fait un essai avant la série.",
      zones: {
        bonnet: { vue: "face", cx: 18, top: 18.6, w: 14, h: 7.4, label: "Devant du bonnet" }
      }
    },
    {
      id: "tour-de-cou-morf",
      nomCourt: "Tour de cou Morf",
      nom: "Tour de cou Morf Original",
      marque: "Beechfield (Morf)",
      modele: "tour-de-cou",
      demonstratif: "ce tour de cou",
      tags: { genre: ["homme", "femme"], style: "casual", sport: "Ski", type: "accessoire" },
      vendeur: "atelier-katanga",   // vendeur de la place de marché Decathlon : livré à Fabr'Icam, frais de port dans prix.js (livraisonVendeur)
      prixAchat: 7.99,
      matiere: "Polyester (microfibre), composition non précisée par le vendeur",
      polyesterPct: 100,
      tailles: ["Taille unique"],
      couleurs: [
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c4" },
        { id: "rouge", nom: "Rouge", hex: "#c4252b", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c14" },
        { id: "jaune-fluo", nom: "Jaune fluo", hex: "#e8f23a", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c142" },
        { id: "fuchsia", nom: "Fuchsia", hex: "#d02a82", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c144" },
        { id: "bordeaux", nom: "Bordeaux", hex: "#6e1e2c", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c15" },
        { id: "violet", nom: "Violet", hex: "#6a3d98", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c16" },
        { id: "bleu-marine", nom: "Bleu marine", hex: "#1f2b4a", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c189" },
        { id: "orange", nom: "Orange", hex: "#f26b1d", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c20" },
        { id: "vert-foret", nom: "Vert forêt", hex: "#1f5a3a", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c211" },
        { id: "bleu-royal", nom: "Bleu royal", hex: "#2450b0", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c218" },
        { id: "jaune", nom: "Jaune", hex: "#f4cf1e", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c22" },
        { id: "gris-graphite", nom: "Gris graphite", hex: "#4a4d52", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c383" },
        { id: "vert-citron", nom: "Vert citron", hex: "#b9d61e", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c78" }
      ],
      lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c4",
      photos: [
        "https://contents.mediadecathlon.com/m36483920/k$f4bc61424dd4b535250632231d69c7f8/picture.jpg",
        "https://contents.mediadecathlon.com/m36483951/k$e360acaa54d2cbff201bf905d1f87c0a/picture.jpg",
        "https://contents.mediadecathlon.com/m36483941/k$68eff2ff25169916d761a582f88fa5cf/picture.jpg",
        "https://contents.mediadecathlon.com/m36483921/k$6c64531d691312b2aef1a1df3302517a/picture.jpg",
        "https://contents.mediadecathlon.com/m36483944/k$0c06530df4209cd9b9f3937b5bafcfbe/picture.jpg"
      ],
      vitrine: ["tour_de_cou"],
      texteVitrine: "sur la face du tour de cou",
      avertissement: "Tour de cou en microfibre très élastique : le visuel se déforme quand le tissu est étiré. Fabr'Icam fait un essai (pressage, étirement, lavage) avant la série.",
      zones: {
        tour_de_cou: { vue: "face", cx: 28, top: 20, w: 18, h: 18, label: "Face du tour de cou" }
      }
    },
    {
      id: "sac-tube-move-100",
      nomCourt: "Sac tube 30 L",
      nom: "Sac tube pliable Move 100 30 L",
      marque: "Decathlon",
      modele: "sac-tube",
      demonstratif: "ce sac",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Sport", type: "accessoire" },
      prixAchat: 6.00,
      matiere: "100 % polyester, enduction polyuréthane",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8200579", lien: "https://www.decathlon.fr/p/sac-tube-pliable-move-100-30l/11233/c382c382m8200579" },
        { id: "bleu-marine", nom: "Bleu marine", hex: "#1f2b4a", clair: false, ref: "8841252", lien: "https://www.decathlon.fr/p/sac-tube-pliable-move-100-30l/11233/c195m8841252" }
      ],
      lien: "https://www.decathlon.fr/p/sac-tube-pliable-move-100-30l/11233/c382c382m8200579",
      photos: [
        "https://contents.mediadecathlon.com/p2426984/k$a23fd87487dd2b34bc73ef713d8fbebb/picture.jpg",
        "https://contents.mediadecathlon.com/p2426983/k$5502aaf623062f8aea8a278b48e5ae09/picture.jpg",
        "https://contents.mediadecathlon.com/p2426982/k$0110f7846493c95516b0585518557120/picture.jpg",
        "https://contents.mediadecathlon.com/p2426981/k$b955e7ca6e055d346efad537c4feb8c9/picture.jpg",
        "https://contents.mediadecathlon.com/p2426980/k$5b36f7a3da631bc77b166976dd8a4330/picture.jpg",
        "https://contents.mediadecathlon.com/p2426979/k$6f56af313748022ca10a87aa4ffb92c9/picture.jpg"
      ],
      vitrine: ["sac"],
      texteVitrine: "sur la face du sac",
      avertissement: "Toile enduite de polyuréthane : le DTF tient, mais à 120-125 °C avec une feuille de téflon. Fabr'Icam fait un essai sur une chute avant la série.",
      zones: {
        sac: { vue: "face", cx: 35, top: 12, w: 26, h: 22, label: "Face du sac" }
      }
    },
    {
      id: "sac-sport-club-100",
      nomCourt: "Sac de sport 20 L",
      nom: "Sac de sport pliable à bandoulière Club 100 20 L",
      marque: "Decathlon",
      modele: "sac-sport",
      demonstratif: "ce sac",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Sport", type: "accessoire" },
      prixAchat: 5.99,
      matiere: "100 % polyester, enduction polyuréthane",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8917221", lien: "https://www.decathlon.fr/p/sac-de-sport-pliable-a-bandouliere-club-100-20l/324098/c1c344m8917221" },
        { id: "bleu-indigo", nom: "Bleu indigo", hex: "#2b3f7a", clair: false, ref: "8917223", lien: "https://www.decathlon.fr/p/sac-de-sport-pliable-a-bandouliere-club-100-20l/324098/c59c1c344m8917223" },
        { id: "violet-amethyste", nom: "Violet améthyste", hex: "#6b4a8f", clair: false, ref: "8917226", lien: "https://www.decathlon.fr/p/sac-de-sport-pliable-a-bandouliere-club-100-20l/324098/c95c190m8917226" }
      ],
      lien: "https://www.decathlon.fr/p/sac-de-sport-pliable-a-bandouliere-club-100-20l/324098/c1c344m8917221",
      photos: [
        "https://contents.mediadecathlon.com/p2929783/k$252af5c5370166123bf235076a0440b6/picture.jpg",
        "https://contents.mediadecathlon.com/p2929786/k$43dbfbacf4c1a253402284338c637874/picture.jpg",
        "https://contents.mediadecathlon.com/p2929863/k$6ee8def6be95c0d92a3b693a5951491a/picture.jpg",
        "https://contents.mediadecathlon.com/p2929856/k$1eb10738ff3c85ffbdf0a4e9ba8276ce/picture.jpg",
        "https://contents.mediadecathlon.com/p2929845/k$6b6a94d9920af28841f881c96249924b/picture.jpg",
        "https://contents.mediadecathlon.com/p2929831/k$f7fa9ea498a4d168b1dbb4228491e575/picture.jpg"
      ],
      vitrine: ["sac"],
      texteVitrine: "sur la face du sac",
      avertissement: "Toile enduite de polyuréthane : le DTF tient, mais à 120-125 °C avec une feuille de téflon. Fabr'Icam fait un essai sur une chute avant la série.",
      zones: {
        sac: { vue: "face", cx: 32, top: 17, w: 24, h: 22, label: "Face du sac" }
      }
    },
    {
      id: "sac-a-dos-arpenaz-50",
      nomCourt: "Sac à dos 10 L Arpenaz 50",
      nom: "Sac à dos de randonnée 10 L Arpenaz 50",
      marque: "Quechua, Decathlon",
      modele: "sac-a-dos",
      demonstratif: "ce sac à dos",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Randonnée", type: "accessoire" },
      prixAchat: 2.99,
      matiere: "100 % polyester, enduction polyuréthane",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "bleu-cosmos", nom: "Bleu cosmos", hex: "#2a4a7a", clair: false, ref: "8502149", lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-50-bleu/301684/c43m8502149" },
        { id: "beige-cendre", nom: "Beige cendré", hex: "#cdbfa8", clair: true, ref: "8988229", lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-50-bleu/301684/c407m8988229" }
      ],
      lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-50-bleu/301684/c43m8502149",
      photos: [
        "https://contents.mediadecathlon.com/p2629748/k$839af1a28c54cbf0917d4ee9eeb9a961/picture.jpg",
        "https://contents.mediadecathlon.com/p2583201/k$48aa3a91dc7a64c6022f506d159281b7/picture.jpg",
        "https://contents.mediadecathlon.com/p2387660/k$02dc03defd940130b7d0669cffc8db9e/picture.jpg",
        "https://contents.mediadecathlon.com/p2629747/k$66d7d129daf8700c7aa9f49d70e5c205/picture.jpg",
        "https://contents.mediadecathlon.com/p2629745/k$2c43b5d7b24ddea4dceeed94213048d6/picture.jpg",
        "https://contents.mediadecathlon.com/p3017085/k$0046e2e4d522c4daad6ef75010c08c9a/picture.jpg",
        "https://contents.mediadecathlon.com/p3079554/k$130c87d657714ca193a21e2119b448bf/picture.jpg",
        "https://contents.mediadecathlon.com/p3078203/k$0497871e4b400e805f5b7aaeebcc717e/picture.jpg"
      ],
      vitrine: ["sac"],
      texteVitrine: "sur la face du sac à dos",
      avertissement: "Toile enduite de polyuréthane : le DTF tient, mais à 120-125 °C avec une feuille de téflon. Fabr'Icam fait un essai sur une chute avant la série.",
      zones: {
        sac: { vue: "face", cx: 28, top: 12, w: 18, h: 22, label: "Face du sac à dos" }
      }
    },
    {
      id: "sac-a-dos-travel-100",
      nomCourt: "Sac à dos pliable 10 L",
      nom: "Sac à dos de poche pliable 10 L Travel 100",
      marque: "Forclaz, Decathlon",
      modele: "sac-a-dos",
      demonstratif: "ce sac à dos",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Randonnée", type: "accessoire" },
      prixAchat: 2.99,
      matiere: "100 % polyester, enduction polyuréthane",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "vert-acide", nom: "Vert acide", hex: "#b5d62b", clair: false, ref: "8576231", lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-vert/309861/c34m8576231" },
        { id: "gris-fonte", nom: "Gris fonte", hex: "#5a5d63", clair: false, ref: "8576230", lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-vert/309861/c210m8576230" },
        { id: "bleu-acier-noir", nom: "Bleu acier et noir", hex: "#3f5878", clair: false, ref: "8560404", lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-vert/309861/c364c382m8560404" },
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8560403", lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-vert/309861/c382c382m8560403" },
        { id: "violet-pourpre-noir", nom: "Violet pourpre et noir", hex: "#5c2d6e", clair: false, ref: "8560406", lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-vert/309861/c403c382m8560406" },
        { id: "bleu-cendre-noir", nom: "Bleu cendré et noir", hex: "#7a93ad", clair: false, ref: "9039490", lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-vert/309861/c340c382m9039490" }
      ],
      lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-vert/309861/c34m8576231",
      photos: [
        "https://contents.mediadecathlon.com/p2604498/k$983e8ee348648af5f50ba4a84c0e76f7/picture.jpg",
        "https://contents.mediadecathlon.com/p2581289/k$1e1de5e7184c98d1d7ec2bc1bdb4aeba/picture.jpg",
        "https://contents.mediadecathlon.com/p2581285/k$878514dc9b0467d2822d01e0bb39f09e/picture.jpg",
        "https://contents.mediadecathlon.com/p2581284/k$a831804e1636045d5ff80aa0491e10fa/picture.jpg",
        "https://contents.mediadecathlon.com/p2581268/k$5304fe4ff0dbea6787ce20b7983728d4/picture.jpg"
      ],
      vitrine: ["sac"],
      texteVitrine: "sur la face du sac à dos",
      avertissement: "Sac pliable en toile très fine : le transfert se fait à 120 °C au plus, avec une feuille de téflon, et le visuel se plie avec le sac. Fabr'Icam fait un essai avant la série.",
      zones: {
        sac: { vue: "face", cx: 28, top: 12, w: 18, h: 22, label: "Face du sac à dos" }
      }
    },
    {
      id: "sac-a-dos-arpenaz-100",
      nomCourt: "Sac à dos 10 L Arpenaz 100",
      nom: "Sac à dos de randonnée 10 L Arpenaz 100",
      marque: "Quechua, Decathlon",
      modele: "sac-a-dos",
      demonstratif: "ce sac à dos",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Randonnée", type: "accessoire" },
      prixAchat: 5.99,
      matiere: "100 % polyester, enduction polyuréthane",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "bleu-abysse", nom: "Bleu abysse", hex: "#1a2f55", clair: false, ref: "8775637", lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-bleu/344147/c246m8775637" },
        { id: "violet-cerise", nom: "Violet cerise", hex: "#8a2b5f", clair: false, ref: "8844353", lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-bleu/344147/c271m8844353" },
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8775634", lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-bleu/344147/c382m8775634" },
        { id: "blanc-vert", nom: "Blanc et vert", hex: "#e3ebe4", clair: true, ref: "8971381", lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-bleu/344147/c4c311m8971381" }
      ],
      lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-bleu/344147/c246m8775637",
      photos: [
        "https://contents.mediadecathlon.com/p2583162/k$b960ca7ce6f25d8338a60b6bc6eec750/picture.jpg",
        "https://contents.mediadecathlon.com/p2423150/k$50a11948ed80ca699d0c21f9c4ca7b1d/picture.jpg",
        "https://contents.mediadecathlon.com/p2876607/k$13a3fc1229ae7bf4ce7178ce6ecf9704/picture.jpg",
        "https://contents.mediadecathlon.com/p2423152/k$8be9e55068c470ac645e98adf9ad35a6/picture.jpg",
        "https://contents.mediadecathlon.com/p2423155/k$f1b59315b98b0d9c1844d2deb4c75924/picture.jpg",
        "https://contents.mediadecathlon.com/p2423153/k$f6a2be3453a981cebec85358ac5fb121/picture.jpg"
      ],
      vitrine: ["sac"],
      texteVitrine: "sur la face du sac à dos",
      avertissement: "Toile enduite de polyuréthane : le DTF tient, mais à 120-125 °C avec une feuille de téflon. Fabr'Icam fait un essai sur une chute avant la série.",
      zones: {
        sac: { vue: "face", cx: 28, top: 12, w: 18, h: 22, label: "Face du sac à dos" }
      }
    },
    {
      id: "sac-a-dos-arpenaz-500",
      nomCourt: "Sac à dos 20 L Arpenaz 500",
      nom: "Sac à dos de randonnée 20 L Arpenaz 500",
      marque: "Quechua, Decathlon",
      modele: "sac-a-dos",
      demonstratif: "ce sac à dos",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Randonnée", type: "accessoire" },
      prixAchat: 19.99,
      matiere: "100 % polyester, enduction polyuréthane",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "gris-carbone", nom: "Gris carbone", hex: "#4b4e53", clair: false, ref: "8971389", lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-20l-arpenaz-500-gris/350154/c71m8971389" }
      ],
      lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-20l-arpenaz-500-gris/350154/c71m8971389",
      photos: [
        "https://contents.mediadecathlon.com/p3079444/k$017e8d9880a72409f2993b86a5106588/picture.jpg",
        "https://contents.mediadecathlon.com/p3078055/k$229fb4750a5698753c1aa6f98bd81362/picture.jpg",
        "https://contents.mediadecathlon.com/p3078145/k$86b5666bdf82ab7859a0c1027e9b3500/picture.jpg",
        "https://contents.mediadecathlon.com/p3079388/k$dcd3ad7a0b3c7ccdb4136f747467510d/picture.jpg",
        "https://contents.mediadecathlon.com/p3079315/k$7fdac7277807dbb10de219e80ae90b91/picture.jpg",
        "https://contents.mediadecathlon.com/p3079371/k$5bf8f00dd6f78ac6d289b31c0c568eda/picture.jpg"
      ],
      vitrine: ["sac"],
      texteVitrine: "sur la face du sac à dos",
      avertissement: "Toile enduite de polyuréthane : le DTF tient, mais à 120-125 °C avec une feuille de téflon. Fabr'Icam fait un essai sur une chute avant la série.",
      zones: {
        sac: { vue: "face", cx: 28, top: 12, w: 18, h: 22, label: "Face du sac à dos" }
      }
    },
    {
      id: "sac-a-dos-mh100",
      nomCourt: "Sac à dos 20 L MH100",
      nom: "Sac à dos de randonnée montagne 20 L MH100",
      marque: "Quechua, Decathlon",
      modele: "sac-a-dos",
      demonstratif: "ce sac à dos",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Randonnée", type: "accessoire" },
      prixAchat: 24.99,
      matiere: "100 % polyester, enduction polyuréthane",
      polyesterPct: 100,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8649476", lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-montagne-20l-mh100-noir/331022/c382m8649476" }
      ],
      lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-montagne-20l-mh100-noir/331022/c382m8649476",
      photos: [
        "https://contents.mediadecathlon.com/p2621198/k$783a358435d113ab4e549e29ac240c34/picture.jpg",
        "https://contents.mediadecathlon.com/p2437569/k$e32cf98daa696931994ce54f8f1473f3/picture.jpg",
        "https://contents.mediadecathlon.com/p2422482/k$9d18e9299bb2f2ab21207937d05a4703/picture.jpg",
        "https://contents.mediadecathlon.com/p2876589/k$2c2c69ecec490657df4e8eddd2f9cf9c/picture.jpg",
        "https://contents.mediadecathlon.com/p2422480/k$6a3323ae1bd68ef27c4731b234ae690d/picture.jpg",
        "https://contents.mediadecathlon.com/p2422483/k$23357dde00d7e4b91253dd9ca1f5981c/picture.jpg"
      ],
      vitrine: ["sac"],
      texteVitrine: "sur la face du sac à dos",
      avertissement: "Toile enduite de polyuréthane : le DTF tient, mais à 120-125 °C avec une feuille de téflon. Fabr'Icam fait un essai sur une chute avant la série.",
      zones: {
        sac: { vue: "face", cx: 28, top: 12, w: 18, h: 22, label: "Face du sac à dos" }
      }
    },
    {
      id: "bandeau-running-v2",
      nomCourt: "Bandeau running",
      nom: "Bandeau de running V2",
      marque: "Kiprun, Decathlon",
      modele: "bandeau",
      demonstratif: "ce bandeau",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Course à pied", type: "accessoire" },
      prixAchat: 5.99,
      matiere: "83 % polyester, 17 % élasthanne",
      polyesterPct: 83,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8871353", lien: "https://www.decathlon.fr/p/bandeau-running-v2-homme-femme-kiprun-noir/352680/c382m8871353" },
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8883077", lien: "https://www.decathlon.fr/p/bandeau-running-v2-homme-femme-kiprun-noir/352680/c227m8883077" }
      ],
      lien: "https://www.decathlon.fr/p/bandeau-running-v2-homme-femme-kiprun-noir/352680/c382m8871353",
      photos: [
        "https://contents.mediadecathlon.com/p2789056/k$f3e7b511c62ca6c1a8fa0b59de11a472/picture.jpg",
        "https://contents.mediadecathlon.com/p2789057/k$86a10d6e5970fb501472851a016de7b7/picture.jpg",
        "https://contents.mediadecathlon.com/p2789058/k$ef52f63b7f4cc6b003bbddf5af3aed9c/picture.jpg",
        "https://contents.mediadecathlon.com/p2788140/k$dd1271e614e7456bdb9f11ff99861a10/picture.jpg",
        "https://contents.mediadecathlon.com/p2788138/k$d348684f9e01ad25d8460f7a27a554e1/picture.jpg"
      ],
      vitrine: ["bandeau"],
      texteVitrine: "sur le devant du bandeau",
      avertissement: "Bandeau très élastique (17 % d'élasthanne) : le visuel se déforme à l'étirement. Petit visuel ou prénom seulement ; Fabr'Icam fait un essai avant la série.",
      zones: {
        bandeau: { vue: "face", cx: 20, top: 11.6, w: 14, h: 7.2, label: "Devant du bandeau" }
      }
    },
    {
      id: "ceinture-running-basique-2",
      nomCourt: "Ceinture running",
      nom: "Ceinture de running smartphone Basique 2",
      marque: "Kiprun, Decathlon",
      modele: "ceinture",
      demonstratif: "cette ceinture",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Course à pied", type: "accessoire" },
      prixAchat: 9.99,
      matiere: "80 % polyester, 20 % polyuréthane (doublure : 87 % polyester, 13 % élasthanne)",
      polyesterPct: 80,
      sublimation: false,   // pas de sublimation sur cet article (forme ronde, enduit ou élastique)
      tailles: ["Taille unique"],
      couleurs: [
        { id: "jaune-vanille", nom: "Jaune vanille", hex: "#f1e08a", clair: true, ref: "8945385", lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-jaune/334226/c269c255m8945385" },
        { id: "bleu-brumeux", nom: "Bleu brumeux", hex: "#9fb7cc", clair: true, ref: "8913258", lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-jaune/334226/c143m8913258" },
        { id: "vert-givre", nom: "Vert givré", hex: "#b7d8c3", clair: true, ref: "8945014", lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-jaune/334226/c241m8945014" },
        { id: "bleu-abysse", nom: "Bleu abysse", hex: "#1a2f55", clair: false, ref: "8913259", lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-jaune/334226/c246m8913259" },
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8648869", lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-jaune/334226/c382m8648869" }
      ],
      lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-jaune/334226/c269c255m8945385",
      photos: [
        "https://contents.mediadecathlon.com/p3089147/k$da1a3dbc249ba368a235a9e6aec6aa11/picture.jpg",
        "https://contents.mediadecathlon.com/p3141493/k$7cbe2b0b2b9e6a3bae03ce17c82a3be1/picture.jpg",
        "https://contents.mediadecathlon.com/p3089145/k$7b6b0888efa28144bf403f3f1603d636/picture.jpg",
        "https://contents.mediadecathlon.com/p3089146/k$153764c6e9a0431867b1fd01be55d2bf/picture.jpg",
        "https://contents.mediadecathlon.com/p3141492/k$7e9afff6e165b4acf497bf143a059eb9/picture.jpg",
        "https://contents.mediadecathlon.com/p3141488/k$ebf9df7b7d7a8f8a3f12422b3d1694a3/picture.jpg"
      ],
      vitrine: ["ceinture"],
      texteVitrine: "sur la face de la ceinture",
      avertissement: "Ceinture en tissu technique extensible : petit visuel, essai de pressage avant la série.",
      zones: {
        ceinture: { vue: "face", cx: 20, top: 11, w: 16, h: 9, label: "Face de la ceinture" }
      }
    },

    // Ton vêtement : le client apporte son propre vêtement, Fabr'Icam le floque. Pas de prix d'achat (prixAchat 0), pas de photo ni de lien Decathlon :
    // le prix est celui des planches, de la livraison et de la marge par motif. La couleur se choisit dans COULEURS_APPORTE, la matière sur chaque pièce.
    // Les emplacements (zones) sont ceux d'un vêtement du catalogue de même dessin.
    {
      id: "apporte-tshirt",
      nomCourt: "T-shirt apporté",
      nom: "T-shirt apporté",
      marque: "Vêtement apporté par le client",
      modele: "tshirt",
      demonstratif: "ton t-shirt",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 19, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 13, w: 30, h: 46, label: "Dos" },
        manche_g: { vue: "cote", cx: 77, cy: 24, w: 10, h: 14, rot: -45, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13, cy: 24, w: 10, h: 14, rot: 45,  label: "Manche droite" }
      }
    },
    {
      id: "apporte-polo",
      nomCourt: "Polo apporté",
      nom: "Polo apporté",
      marque: "Vêtement apporté par le client",
      modele: "polo",
      demonstratif: "ton polo",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 19, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 13, w: 30, h: 46, label: "Dos" },
        manche_g: { vue: "cote", cx: 77, cy: 24, w: 10, h: 14, rot: -45, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13, cy: 24, w: 10, h: 14, rot: 45,  label: "Manche droite" }
      }
    },
    {
      id: "apporte-sweat",
      nomCourt: "Sweat apporté",
      nom: "Sweat apporté",
      marque: "Vêtement apporté par le client",
      modele: "sweat",
      demonstratif: "ton sweat",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 21, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 15, w: 32, h: 52, label: "Dos" },
        manche_g: { vue: "cote", cx: 76.5, cy: 40, w: 10, h: 14, rot: -9, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13.5, cy: 40, w: 10, h: 14, rot: 9,  label: "Manche droite" }
      }
    },
    {
      id: "apporte-manches-longues",
      nomCourt: "Haut à manches longues apporté",
      nom: "Haut à manches longues apporté",
      marque: "Vêtement apporté par le client",
      modele: "manches-longues",
      demonstratif: "ton haut",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Haut fin ou élastique : le visuel se déforme quand le tissu s'étire. Fabr'Icam fait un essai avant la série.",
      zones: {
        poitrine: { vue: "face", cx: 56, top: 19, w: 14, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 14, w: 26, h: 44, label: "Dos" }
      }
    },
    {
      id: "apporte-maillot",
      nomCourt: "Maillot ou débardeur apporté",
      nom: "Maillot ou débardeur apporté",
      marque: "Vêtement apporté par le client",
      modele: "maillot",
      demonstratif: "ton maillot",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement.",
      zones: {
        poitrine: { vue: "face", cx: 57, top: 24, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 18, w: 32, h: 52, label: "Dos" }
      }
    },
    {
      id: "apporte-veste",
      nomCourt: "Veste apportée",
      nom: "Veste apportée",
      marque: "Vêtement apporté par le client",
      modele: "veste",
      demonstratif: "ta veste",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Polaire, matelassé, softshell : le tissu supporte mal la chaleur, le pressage se fait à basse température avec une feuille de téflon et un essai avant la série.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 21, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 15, w: 32, h: 52, label: "Dos" },
        manche_g: { vue: "cote", cx: 76.5, cy: 40, w: 10, h: 14, rot: -9, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13.5, cy: 40, w: 10, h: 14, rot: 9,  label: "Manche droite" }
      }
    },
    {
      id: "apporte-sweat-zip",
      nomCourt: "Sweat ou veste zippé apporté",
      nom: "Sweat ou veste zippé apporté",
      marque: "Vêtement apporté par le client",
      modele: "sweat-zip",
      demonstratif: "ton sweat zippé",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Polaire, matelassé, softshell : le tissu supporte mal la chaleur, le pressage se fait à basse température avec une feuille de téflon et un essai avant la série.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 21, w: 16, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 15, w: 32, h: 52, label: "Dos" },
        manche_g: { vue: "cote", cx: 76.5, cy: 40, w: 10, h: 14, rot: -9, label: "Manche gauche" },
        manche_d: { vue: "cote", cx: 13.5, cy: 40, w: 10, h: 14, rot: 9,  label: "Manche droite" }
      }
    },
    {
      id: "apporte-gilet",
      nomCourt: "Gilet sans manches apporté",
      nom: "Gilet sans manches apporté",
      marque: "Vêtement apporté par le client",
      modele: "gilet",
      demonstratif: "ton gilet",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Polaire, matelassé, softshell : le tissu supporte mal la chaleur, le pressage se fait à basse température avec une feuille de téflon et un essai avant la série.",
      zones: {
        poitrine: { vue: "face", cx: 58, top: 19, w: 14, h: 21, label: "Poitrine, côté cœur" },
        dos:      { vue: "dos",  cx: 45, top: 14, w: 30, h: 48, label: "Dos" }
      }
    },
    {
      id: "apporte-short",
      nomCourt: "Short apporté",
      nom: "Short apporté",
      marque: "Vêtement apporté par le client",
      modele: "short-tennis",
      demonstratif: "ton short",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["cuisse_g"],
      texteVitrine: "sur une cuisse",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement.",
      zones: {
        cuisse_g: { vue: "face", cx: 57.5, top: 20, w: 14, h: 21, label: "Cuisse gauche" },
        cuisse_d: { vue: "face", cx: 32.5, top: 20, w: 14, h: 21, label: "Cuisse droite" }
      }
    },
    {
      id: "apporte-pantalon",
      nomCourt: "Pantalon apporté",
      nom: "Pantalon apporté",
      marque: "Vêtement apporté par le client",
      modele: "pantalon",
      demonstratif: "ton pantalon",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["cuisse_g"],
      texteVitrine: "sur une cuisse",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement.",
      zones: {
        cuisse_g:    { vue: "face", cx: 59,   top: 22, w: 14, h: 21, label: "Cuisse gauche" },
        cuisse_d:    { vue: "face", cx: 31,   top: 22, w: 14, h: 21, label: "Cuisse droite" },
        bas_jambe_g: { vue: "face", cx: 59.2, top: 86, w: 12, h: 6,  label: "Bas de la jambe gauche" }
      }
    },
    {
      id: "apporte-casquette",
      nomCourt: "Casquette apportée",
      nom: "Casquette apportée",
      marque: "Vêtement apporté par le client",
      modele: "casquette",
      demonstratif: "ta casquette",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      sublimation: false,
      tailles: ["Taille unique"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["casquette"],
      texteVitrine: "sur le devant de la casquette",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Casquette : le devant est bombé et le tissu fin. Un visuel de 5 × 5 cm au plus, pressé avec une presse adaptée. Fabr'Icam fait un essai avant la série.",
      zones: {
        casquette: { vue: "face", cx: 18, top: 8, w: 12, h: 8, label: "Devant de la casquette" }
      }
    },
    {
      id: "apporte-bonnet",
      nomCourt: "Bonnet apporté",
      nom: "Bonnet apporté",
      marque: "Vêtement apporté par le client",
      modele: "bonnet",
      demonstratif: "ton bonnet",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      sublimation: false,
      tailles: ["Taille unique"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["bonnet"],
      texteVitrine: "sur le devant du bonnet",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Bonnet en maille acrylique : tricot épais et très élastique, le transfert tient mal et se déforme à l'étirement. Fabr'Icam teste sur le revers avant la série et confirme que c'est faisable.",
      zones: {
        bonnet: { vue: "face", cx: 18, top: 18.6, w: 14, h: 7.4, label: "Devant du bonnet" }
      }
    },
    {
      id: "apporte-sac-a-dos",
      nomCourt: "Sac à dos apporté",
      nom: "Sac à dos apporté",
      marque: "Vêtement apporté par le client",
      modele: "sac-a-dos",
      demonstratif: "ton sac à dos",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      sublimation: false,
      tailles: ["Taille unique"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["sac"],
      texteVitrine: "sur la face du sac à dos",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Toile enduite de polyuréthane : le DTF tient, mais à 120-125 °C avec une feuille de téflon. Fabr'Icam fait un essai sur une chute avant la série.",
      zones: {
        sac: { vue: "face", cx: 28, top: 12, w: 18, h: 22, label: "Face du sac à dos" }
      }
    },
    {
      id: "apporte-sac-sport",
      nomCourt: "Sac de sport apporté",
      nom: "Sac de sport apporté",
      marque: "Vêtement apporté par le client",
      modele: "sac-sport",
      demonstratif: "ton sac de sport",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      sublimation: false,
      tailles: ["Taille unique"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["sac"],
      texteVitrine: "sur la face du sac",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Toile enduite de polyuréthane : le DTF tient, mais à 120-125 °C avec une feuille de téflon. Fabr'Icam fait un essai sur une chute avant la série.",
      zones: {
        sac: { vue: "face", cx: 32, top: 17, w: 24, h: 22, label: "Face du sac" }
      }
    },
    {
      id: "apporte-gourde",
      nomCourt: "Gourde apportée",
      nom: "Gourde apportée",
      marque: "Vêtement apporté par le client",
      modele: "gourde",
      demonstratif: "ta gourde",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      sublimation: false,
      tailles: ["Taille unique"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["gourde"],
      texteVitrine: "sur la face de la gourde",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Gourde : le transfert DTF se pose sur la face, un petit visuel seulement (Mini 5 × 5 cm ou A7) car la surface est ronde. Fabr'Icam fait un essai (tenue, lavage) avant la série.",
      zones: {
        gourde: { vue: "face", cx: 20, top: 13, w: 7, h: 15, label: "Face de la gourde" }
      }
    },
    {
      id: "apporte-tour-de-cou",
      nomCourt: "Tour de cou apporté",
      nom: "Tour de cou apporté",
      marque: "Vêtement apporté par le client",
      modele: "tour-de-cou",
      demonstratif: "ton tour de cou",
      tags: { genre: ["homme", "femme"], type: "apporte" },
      apporte: true,
      prixAchat: 0,
      matiere: "Selon ton vêtement (polyester, coton, mélange)",
      polyesterPct: 0,   // la matière se choisit sur chaque pièce (polyester, coton, je ne sais pas)
      tailles: ["Taille unique"],
      couleurs: COULEURS_APPORTE,
      vitrine: ["tour_de_cou"],
      texteVitrine: "sur la face du tour de cou",
      avertissement: "Tu apportes ton vêtement : Fabr'Icam le contrôle à la réception (matière, état, tenue à la chaleur) avant de presser. Le dessin est un modèle type, la position exacte est confirmée sur ton vêtement. Tour de cou en microfibre très élastique : le visuel se déforme quand le tissu est étiré. Fabr'Icam fait un essai (pressage, étirement, lavage) avant la série.",
      zones: {
        tour_de_cou: { vue: "face", cx: 28, top: 20, w: 18, h: 18, label: "Face du tour de cou" }
      }
    }
  ],

  // Packs : plusieurs produits vendus ensemble comme un seul article (1 € de marge par pièce, chaussettes à 0 €, voir prix.js)
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
    },
    {
      id: "pack-hummel",
      nom: "Pack Hummel : t-shirt et short, veste micropolaire et chaussettes",
      nomCourt: "Pack Hummel",
      demonstratif: "ce pack",
      tags: { genre: ["femme"], style: "casual", type: "ensemble" },
      produits: ["ensemble-hummel", "veste-micropolaire", "chaussettes-football"],
      vitrine: ["poitrine", "cuisse_g", "chaussette_g"],
      texteVitrine: "sur la poitrine du t-shirt et de la veste et une cuisse du short",
      noteVitrine: "Avec un visuel A6 sur le t-shirt, sur la veste et sur le short, et un prénom de 3 cm sur une chaussette."
    }
  ]
};
