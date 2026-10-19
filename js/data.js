/*
 * CATALOGUE — pour ajouter un vêtement, copie un bloc de « produits » et change :
 * id, nom, prixAchat (TTC), tailles, couleurs, modele (le dessin : polo, sweat, debardeur,
 * maillot, short-basket, short-tennis, short-slim, tshirt, manches-longues, veste, sweat-zip, gilet, gilet-matelasse, ensemble-short,
 * pantalon, chaussette, chasuble, gourde, casquette, bonnet, tour-de-cou, bandeau, sac-tube, sac-sport, sac-a-dos, ceinture, serviette,
 * ouvre-bouteille, porte-cles), tags (genre, style, type : haut, bas, ensemble ou accessoire), vendeur (seulement pour un article vendu en ligne :
 * place de marché Decathlon ou AliExpress, voir prix.js), sublimation: false (article qui ne se sublime pas),
 * technique: "gravure" (article gravé au laser ou marqué en vinyle thermocollant : ni planche DTF ni coût de planche, voir engine.js),
 * margePack: 0 (pièce sans marge dans un pack, comme les chaussettes, voir prix.js), vitrine (emplacements du prix affiché) et zones.
 * Un article « apporte: true » est un vêtement que le client apporte (voir plus bas, « Ton vêtement ») : prixAchat 0, couleurs = COULEURS_APPORTE.
 * Chaque couleur porte : nomDec (son nom sur Decathlon), ref (référence Decathlon), lien (la page de cette couleur), photos (sa série de
 * photos, avec dec([...])), et si besoin prixAchat (quand cette couleur ne coûte pas le prix de l'article) et rupture (date AAAA-MM-JJ
 * à laquelle Decathlon l'a signalée en rupture de stock). « photos » de l'article : les photos de la couleur de référence de apercuPhoto.
 * Sur AliExpress, la variante se choisit sur la page de l'article : nomDec est le nom de la variante chez le vendeur, lien la page de l'article,
 * photos l'adresse complète de l'image de la variante (pas de dec([...])), prixAchat le prix de la variante affiché sur la page.
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
    // Accessoires : petits formats (Mini 5 x 5 cm, A7 7 x 10 cm, Micro 1,5 x 3 cm pour le porte-clés, voir formatsMotif dans prix.js)
    serviette:   { label: "Bas de la serviette", formats: ["A6", "A5", "A4"] },
    ouvre_bouteille: { label: "Face de l'ouvre-bouteille", formats: ["Mini"] },
    porte_cles:  { label: "Face du porte-clés", formats: ["Micro"] },
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
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra / noir fumé", hex: "#f3f3f0", clair: true, ref: "8941327",
          lien: "https://www.decathlon.fr/p/short-de-basketball-homme-femme-short-100-blanc/362074/c227c382m8941327",
          photos: dec(["p2938583/k$76581616f663d16be8af6c25364c278c", "p2938800/k$2f2c0c7764ce6bba4b9f4e4da829d8d0", "p2938755/k$1425f123b7f535f07da3decbab601885", "p2938666/k$36b0f9900a2fae6044766b8299e03cf2", "p2938901/k$28aa72e7df5a161e28184a34e9946c7a", "p2938618/k$e0e39fd469f2cb8c8a713d30396affe9", "p2929375/k$67f50b8c908aca741bfbffb86ea438d3", "p2929349/k$2ec15fe68fc60f656a009e71f5c352d8"]) },
        { id: "marine", nom: "Marine", nomDec: "indigo nuit. / blanc ultra", hex: "#1f2b4a", clair: false, ref: "8946323",
          lien: "https://www.decathlon.fr/p/short-de-basketball-homme-femme-short-100-navy/362074/c188c227m8946323",
          photos: dec(["p2938641/k$ea29b30a88b589dd03f796dd309140ca", "p2938609/k$585d32cadf4dce27e8651f3ab994f443", "p2938791/k$892fdbaddd75dd31fb031f06e4fdfbee", "p2938651/k$5ddc85a614fa2524203d65f4884c8b2f", "p2938716/k$cc9590f325308dc7cf0f8c51130ddd55", "p2938895/k$bc3f206cbead1e6006f3c7095f73fec5"]) },
        { id: "rouge", nom: "Rouge", nomDec: "rouge piment / blanc ultra", hex: "#c4252b", clair: false, ref: "8941329",
          lien: "https://www.decathlon.fr/p/short-de-basketball-homme-femme-short-100-rouge/362074/c221c227m8941329",
          photos: dec(["p2938668/k$8827e3a54ec70bf348f91b9202de58b2", "p2938873/k$529b9acf883619e92bda2ccf6ffb9d1c", "p2938782/k$1701057f3a69cbf1d28ac7b64e9a188f", "p2938745/k$fbb3827f73a3c1f1c8ef09d895dda318", "p2938872/k$e033dbc171cb115d5b70ec48fb6cade8", "p2938760/k$3623cc4e28f870c5343380455c1cba23"]) },
        { id: "noir", nom: "Noir", nomDec: "noir fumé / blanc ultra", hex: "#1c1c1f", clair: false, ref: "8941326",
          lien: "https://www.decathlon.fr/p/short-de-basketball-homme-femme-short-100-noir/362074/c382c227m8941326",
          photos: dec(["p2938594/k$b3da292f2a951c176743027b780c60d4", "p2938775/k$2184adf9c0238dc71bca694a0d96ecb1", "p2938762/k$e5d8aa6eb983e732414e3b4101cc1645", "p2938736/k$ee00a36875c13b38bd85da02fa742fe4", "p2938781/k$cfee714f46afe6e12a037642f6a61799", "p2938692/k$465100b6925e10fb24bb6d3937dbe51c"]) },
        { id: "bleu", nom: "Bleu", nomDec: "bleu indigo / blanc ultra", hex: "#2d4f9e", clair: false, ref: "8941328",
          lien: "https://www.decathlon.fr/p/short-de-basketball-homme-femme-short-100-bleu/362074/c59c227m8941328",
          photos: dec(["p2938837/k$ee584fa5e017def8960b6a93524a24de", "p2938864/k$023e1a5b033fcce4dce99fd570bc55c9", "p2938617/k$c26623b75acc5d6c06e61a9a946d26e9", "p2938731/k$6f035eecd3abe0e890e44538fd8996ba", "p2938867/k$7f6915127ef81eb8da086a6a27743afc", "p2938580/k$fddedcccdacfeaf3e2f290311606ab7e", "p2929375/k$67f50b8c908aca741bfbffb86ea438d3", "p2929365/k$e032e59b0d26a0288d8d0ea09aed9b98"]) }
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
        { id: "marine", nom: "Marine", nomDec: "bleu acier / -", hex: "#243b5e", clair: false, ref: "962194",
          lien: "https://www.decathlon.fr/p/short-de-tennis-homme-essential-marine/300096/c364c344m962194",
          photos: dec(["p2875053/k$4e8f06bf8a684d9ac7f74e5ffc48c4b1", "p2946197/k$076fbd3d7789efd04ecd305051dc0e6b", "p2454823/k$f5f94a291d8588549b16eeef600f7d8c", "p2875943/k$e4d46a5451e79ab0163a482444de278a"]) },
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "962201",
          lien: "https://www.decathlon.fr/p/short-de-tennis-homme-essential-noir/300096/c382m962201",
          photos: dec(["p2875056/k$6da1206e1220c44425c3495beda8a512", "p2946129/k$f38c5c99db2ded57824cae69a2eec47f", "p2454820/k$93d493be0045fa12bb25e2034622e652", "p2946080/k$96044c0612be470675b1064c6e0e2a7d"]) }
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
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra / -", hex: "#f3f3f0", clair: true, ref: "8667062",
          lien: "https://www.decathlon.fr/p/debardeur-extensible-fitness-homme-500-blanc/335335/c227c344m8667062",
          photos: dec(["p2731077/k$1e73eea8d727c1e768e61aafa0edc800", "p2731078/k$b5d65d7775e85ceddbb17a8b7659d623", "p2731073/k$d85b477b3d42aa39f9fc9d592eae009e", "p2731074/k$e0cde3879d377ef95d0792d472b2e2ae", "p2731075/k$9aa656cb6f1da9d76f98648a10c4589d", "p2731076/k$0f55a11d977ec9bee5cd9c76622cad88"]) },
        { id: "noir", nom: "Noir", nomDec: "noir ultra / -", hex: "#1c1c1f", clair: false, ref: "8667061", prixAchat: 7.99,
          lien: "https://www.decathlon.fr/p/debardeur-extensible-fitness-homme-500-noir/335335/c378c344m8667061",
          photos: dec(["p2731079/k$e1deae35ed8d5ed243d6d9799969ddc6", "p2731080/k$2023235e4ad2dd7ece20853440fb92b7", "p2731081/k$cb0fc303af95aeda93016618e7a72024", "p2731082/k$cd09e5cafc58f9014fa4774ffe0fab14", "p2731083/k$dfc43325f84e4cf6922db9b64e7efae7", "p2731084/k$8d9734f0d07e05732c5ed49a62026052"]) }
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
        { id: "noir", nom: "Noir", nomDec: "noir / vert urbain", hex: "#1c1c1f", clair: false, lien: "https://www.decathlon.fr/p/mp/veste-sans-manches-homme-noir/45725556-d2a9-4eac-a6e8-d3bd17349f6e/c1c49" },
        { id: "bleu-marine", nom: "Bleu marine", nomDec: "bleu navy", hex: "#1f2b4a", clair: false, prixAchat: 32.78, lien: "https://www.decathlon.fr/p/mp/veste-sans-manches-homme-bleu-marine/45725556-d2a9-4eac-a6e8-d3bd17349f6e/c145" },
        { id: "rouge", nom: "Rouge", nomDec: "rouge / rouge coquelicot.", hex: "#c4252b", clair: false, prixAchat: 32.78, lien: "https://www.decathlon.fr/p/mp/veste-sans-manches-regatta-professional-softshell-rouge-legere-extensible/45725556-d2a9-4eac-a6e8-d3bd17349f6e/c14c245" },
        { id: "gris", nom: "Gris", nomDec: "gris comète / gris rivière / gris aimant", hex: "#8d9196", clair: false, prixAchat: 32.78, lien: "https://www.decathlon.fr/p/mp/veste-softshell-regatta-professional-gris-sans-manches-extensible/45725556-d2a9-4eac-a6e8-d3bd17349f6e/c230c193c182" }
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
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra / gris fonte", hex: "#f3f3f0", clair: true, ref: "8350117",
          lien: "https://www.decathlon.fr/p/chaussettes-de-football-essentiel-adulte-blanche/141410/c227c210m8350117",
          photos: dec(["p1722152/k$75016eceb0e9783878363bddb90056b8", "p1610684/k$a7ea091a64f90de8321794aaa2f27b92", "p1610682/k$69967f459708c19c78ad197cb948278d", "p1610681/k$455134bbd9b437614e214df1f6710d5f", "p1610680/k$5f2c61319ad05af1d789ac85799b762c", "p1610679/k$c521038434e2f2c7640cb526a206cd9c", "p1610677/k$7b66b7d9296ffd53d7f478736a5eca14", "p203056/k$4ca9113061b67d5d8a39ab90085afda8", "p203060/k$052e7584db856fb4f90639d006b59328", "p203062/k$8d25422a490e48f4911bf2bfacc9507a", "p203058/k$5ccce683e7695f5be860bb805b838c81", "p734643/k$a84c5bea85894a9590675bdda1722f40", "p203059/k$c14ef8ae53a2cd181a8377013f92cedb", "p203061/k$f125e58bb22b3177c3033768c47da2a0", "p203057/k$b3a076abf61baeb38c23c826c9d1965d"]) },
        { id: "bleu-indigo", nom: "Bleu indigo", nomDec: "bleu indigo", hex: "#2b3f7a", clair: false, ref: "8526961",
          lien: "https://www.decathlon.fr/p/chaussettes-de-football-essentiel-adulte-bleue/141410/c59m8526961",
          photos: dec(["p1722146/k$fc8dc21b3e49ac9f37bc2ad6891023d7", "p1610715/k$1f258b699ceae9d8e72569e786f4d230", "p1610714/k$44b769ed4cf6ed9038508f6b08afc41b", "p1610713/k$92f0aed22bb73253f52c8dc228726859", "p1610712/k$2e5565687ababda7baf81e6a193ff8cc", "p1610711/k$e823497b29bbb90c3f6128d69939c5db", "p1610710/k$cdfdb78b6fab03e3ce7dfc9a16d05afa", "p1610709/k$eb9240f2c2adbc47e528c941a767ad3a"]) }
      ],
      lien: "https://www.decathlon.fr/p/chaussettes-de-football-essentiel-adulte-blanche/141410/c227c210m8350117",
      photos: [
        "https://contents.mediadecathlon.com/p1722152/k$75016eceb0e9783878363bddb90056b8/picture.jpg",
        "https://contents.mediadecathlon.com/p1610684/k$a7ea091a64f90de8321794aaa2f27b92/picture.jpg",
        "https://contents.mediadecathlon.com/p1610682/k$69967f459708c19c78ad197cb948278d/picture.jpg",
        "https://contents.mediadecathlon.com/p1610681/k$455134bbd9b437614e214df1f6710d5f/picture.jpg",
        "https://contents.mediadecathlon.com/p1610680/k$5f2c61319ad05af1d789ac85799b762c/picture.jpg",
        "https://contents.mediadecathlon.com/p1610679/k$c521038434e2f2c7640cb526a206cd9c/picture.jpg",
        "https://contents.mediadecathlon.com/p1610677/k$7b66b7d9296ffd53d7f478736a5eca14/picture.jpg",
        "https://contents.mediadecathlon.com/p203056/k$4ca9113061b67d5d8a39ab90085afda8/picture.jpg",
        "https://contents.mediadecathlon.com/p203060/k$052e7584db856fb4f90639d006b59328/picture.jpg",
        "https://contents.mediadecathlon.com/p203062/k$8d25422a490e48f4911bf2bfacc9507a/picture.jpg",
        "https://contents.mediadecathlon.com/p203058/k$5ccce683e7695f5be860bb805b838c81/picture.jpg",
        "https://contents.mediadecathlon.com/p734643/k$a84c5bea85894a9590675bdda1722f40/picture.jpg",
        "https://contents.mediadecathlon.com/p203059/k$c14ef8ae53a2cd181a8377013f92cedb/picture.jpg",
        "https://contents.mediadecathlon.com/p203061/k$f125e58bb22b3177c3033768c47da2a0/picture.jpg",
        "https://contents.mediadecathlon.com/p203057/k$b3a076abf61baeb38c23c826c9d1965d/picture.jpg"
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
        { id: "marine", nom: "Marine", nomDec: "bleu / bleu navy", hex: "#243b5e", clair: false, lien: "https://www.decathlon.fr/p/mp/doudoune-sans-manche-result-core/9079bea6-3f9c-43ea-8442-340f85dd035b/c5c145" },
        { id: "noir", nom: "Noir", nomDec: "noir", hex: "#1c1c1f", clair: false, lien: "https://www.decathlon.fr/p/mp/doudoune-sans-manche-result-core/9079bea6-3f9c-43ea-8442-340f85dd035b/c1" },
        { id: "rouge", nom: "Rouge", nomDec: "rouge", hex: "#c4252b", clair: false, prixAchat: 25.00, lien: "https://www.decathlon.fr/p/mp/doudoune-sans-manche-result-core/9079bea6-3f9c-43ea-8442-340f85dd035b/c14" },
        { id: "gris", nom: "Gris", nomDec: "gris", hex: "#8d9196", clair: false, prixAchat: 25.00, lien: "https://www.decathlon.fr/p/mp/doudoune-sans-manches-result-core/9079bea6-3f9c-43ea-8442-340f85dd035b/c251" },
        { id: "bleu-et-marine", nom: "Bleu et marine", nomDec: "bleu / bleu marine.", hex: "#2a4a7a", clair: false, prixAchat: 25.00, lien: "https://www.decathlon.fr/p/mp/doudoune-sans-manche-result-core/9079bea6-3f9c-43ea-8442-340f85dd035b/c5c195" }
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
        { id: "noir", nom: "Noir", nomDec: "noir", hex: "#1c1c1f", clair: false, lien: "https://www.decathlon.fr/p/mp/veste-kariban-micropolaire-zippee/62a52383-7af9-4e14-9a8e-0f1d90f24456/c1" },
        { id: "rouge", nom: "Rouge", nomDec: "rouge", hex: "#c4252b", clair: false, prixAchat: 19.41, lien: "https://www.decathlon.fr/p/mp/veste-kariban-micropolaire-zippee/62a52383-7af9-4e14-9a8e-0f1d90f24456/c14" },
        { id: "gris", nom: "Gris", nomDec: "gris / gris fonce", hex: "#8d9196", clair: false, prixAchat: 20.10, lien: "https://www.decathlon.fr/p/mp/veste-kariban-micropolaire-zippee/62a52383-7af9-4e14-9a8e-0f1d90f24456/c251c3" },
        { id: "marine", nom: "Marine", nomDec: "bleu / bleu navy", hex: "#243b5e", clair: false, prixAchat: 20.10, lien: "https://www.decathlon.fr/p/mp/veste-kariban-micropolaire-zippee/62a52383-7af9-4e14-9a8e-0f1d90f24456/c5c145" },
        { id: "bleu-royal", nom: "Bleu royal", nomDec: "bleu / bleu royal / bleu atlantis", hex: "#2450b0", clair: false, prixAchat: 20.10, lien: "https://www.decathlon.fr/p/mp/veste-kariban-micropolaire-zippee/62a52383-7af9-4e14-9a8e-0f1d90f24456/c5c218c236" }
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8733482",
          lien: "https://www.decathlon.fr/p/short-2-en-1-fitness-femme-noir/337725/c382m8733482",
          photos: dec(["p2731656/k$0fb909fc52b0a250eaa843d475dcd7dd", "p2731657/k$e430d9cf1fe4cd9cdcc67ebcedc751be", "p2731658/k$d4dc8de7e9e930c731ff1bed3859a6d4", "p2731659/k$e25c6c34c96e510ec6eb649f0a66035e", "p2731660/k$f0fef6bc42880320cafb030e2f28e53e"]) },
        { id: "vert-eucalyptus", nom: "Vert eucalyptus", nomDec: "vert eucalyptus", hex: "#6f9d86", clair: false, ref: "8999018", prixAchat: 7.99,
          lien: "https://www.decathlon.fr/p/short-2-en-1-fitness-femme-vert-fonce/337725/c261m8999018",
          photos: dec(["p3074737/k$902cc340e623d3cf4d2b99d9bdd533b9", "p3074825/k$09e10659721abbeb83fe9884af7c3e4e", "p3074750/k$d33c4fc11053bbb4253ea6a63de44cce", "p3074743/k$0e93281869260b093c571e5ad39b0df1", "p3074748/k$1868c684a0b941b8547497acc142117b"]) }
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
        { id: "noir", nom: "Noir", nomDec: "noir ultra", hex: "#1c1c1f", clair: false, ref: "8511787",
          lien: "https://www.decathlon.fr/p/short-slim-fitness-femme-500-noir/303051/c378m8511787",
          photos: dec(["p2632539/k$51d8b968ae796f1048918b8267c042be", "p2632544/k$57a209d9dd9ed46c4d7e3b7a47b71faf", "p2632508/k$64b4c0c37f8ff1b59e99b1a622a8110f", "p2632514/k$211eb8924b987045d2926845de81ea45", "p2632568/k$bbc7d5c3c0f3105fcbb3aa7543d2ec28"]) },
        { id: "gris-fonte", nom: "Gris fonte", nomDec: "gris fonte", hex: "#5a5d63", clair: false, ref: "8611683", prixAchat: 3.99,
          lien: "https://www.decathlon.fr/p/short-slim-fitness-femme-500-gris/303051/c210m8611683",
          photos: dec(["p2494457/k$aaf6a689c95d527550b478aa099f314d", "p2494455/k$6d73b4ec9c56b4fb19cc3485b29525fc", "p2494453/k$dc9c312a2df280e3a4de95f48b7d7f89", "p2494454/k$87c53f5373d640ce96d4880bf75c2505", "p2494456/k$16eec5944067a3ef81338a64fffdc9fc"]) }
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
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8759127",
          lien: "https://www.decathlon.fr/p/pantalon-de-jogging-droit-chaud-et-doux-femme-noir/333231/c378m8759127",
          photos: dec(["p2730712/k$4788c0efc55acc52f0e6c36d4665f10c", "p2730715/k$4f9f33068acc48a26fdd3333b432bf3c", "p2730713/k$fda19e3e6da7641837210b78fa20b9dc", "p2730716/k$efac979d36d4cb0e34a7823c0767720b", "p2730711/k$09ee7e93cc7f64ff770e74ce07a8ace8", "p2730714/k$04e0070dff6b03c24cb9e2af1cc74070", "p3100052/k$ed4184d7038bd3139239843d72c8a02a", "p3100071/k$98587c8432d5c56ab3a8c348e4a15901"]) }
      ],
      lien: "https://www.decathlon.fr/p/pantalon-de-jogging-droit-chaud-et-doux-femme-noir/333231/c378m8759127",
      photos: [
        "https://contents.mediadecathlon.com/p2730712/k$4788c0efc55acc52f0e6c36d4665f10c/picture.jpg",
        "https://contents.mediadecathlon.com/p2730715/k$4f9f33068acc48a26fdd3333b432bf3c/picture.jpg",
        "https://contents.mediadecathlon.com/p2730713/k$fda19e3e6da7641837210b78fa20b9dc/picture.jpg",
        "https://contents.mediadecathlon.com/p2730716/k$efac979d36d4cb0e34a7823c0767720b/picture.jpg",
        "https://contents.mediadecathlon.com/p2730711/k$09ee7e93cc7f64ff770e74ce07a8ace8/picture.jpg",
        "https://contents.mediadecathlon.com/p2730714/k$04e0070dff6b03c24cb9e2af1cc74070/picture.jpg",
        "https://contents.mediadecathlon.com/p3100052/k$ed4184d7038bd3139239843d72c8a02a/picture.jpg",
        "https://contents.mediadecathlon.com/p3100071/k$98587c8432d5c56ab3a8c348e4a15901/picture.jpg"
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
        { id: "marine", nom: "Marine", hex: "#243b5e", clair: false, ref: "9021066",
          lien: "https://www.decathlon.fr/p/t-shirt-coton-femme-essentiel-bleu-marine/382034/c364m9021066",
          photos: dec(["p3146224/k$68c5da1b58bcb9af06f3f87b021e6f16", "p3146207/k$58a674430b0f03f690991683cdda83f7", "p3146221/k$17f498a8ea202b3279be27eeb481c933", "p3146222/k$eb24f715a8171cd5483141a329f03595", "p3146214/k$3f69b1ce1fb26a05a56028bad9ae15dd", "p3146220/k$fdad23f76c9b360120590039548c69d4"]) }
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
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8943116",
          lien: "https://www.decathlon.fr/p/t-shirt-manches-courtes-femme-noir/365650/c382m8943116",
          photos: dec(["p3035993/k$09b8b0b67333f592d50cf6b5520cb6bc", "p3036002/k$82476f23f14e9249d4b5c47ec7ff7712", "p3036010/k$62a5b7c855843966f00969c3be7d7d76", "p3035990/k$47589804756fdfe671a1d22fcd1fd4d2", "p3174320/k$0db6aa8e95c04a4590022c7711847e37", "p3174368/k$b045f4595c328a5f8ffc3b5d99488ce7", "p3100055/k$6f6112223d4c3cdc83c16634842b0d99", "p3100022/k$76b000ee13af820bf9be378ce0710141"]) }
      ],
      lien: "https://www.decathlon.fr/p/t-shirt-manches-courtes-femme-noir/365650/c382m8943116",
      photos: [
        "https://contents.mediadecathlon.com/p3035993/k$09b8b0b67333f592d50cf6b5520cb6bc/picture.jpg",
        "https://contents.mediadecathlon.com/p3036002/k$82476f23f14e9249d4b5c47ec7ff7712/picture.jpg",
        "https://contents.mediadecathlon.com/p3036010/k$62a5b7c855843966f00969c3be7d7d76/picture.jpg",
        "https://contents.mediadecathlon.com/p3035990/k$47589804756fdfe671a1d22fcd1fd4d2/picture.jpg",
        "https://contents.mediadecathlon.com/p3174320/k$0db6aa8e95c04a4590022c7711847e37/picture.jpg",
        "https://contents.mediadecathlon.com/p3174368/k$b045f4595c328a5f8ffc3b5d99488ce7/picture.jpg",
        "https://contents.mediadecathlon.com/p3100055/k$6f6112223d4c3cdc83c16634842b0d99/picture.jpg",
        "https://contents.mediadecathlon.com/p3100022/k$76b000ee13af820bf9be378ce0710141/picture.jpg"
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
        { id: "blanc", nom: "Blanc", hex: "#f3f3f0", clair: true, ref: "8737886",
          lien: "https://www.decathlon.fr/p/t-shirt-fitness-femme-100-blanc-glacier/339063/c227c344m8737886",
          photos: dec(["p3054279/k$b8291280158b44ad1831c63d6e800f4e", "p3054297/k$c04ecd3f2090ccfe0427b3c64ba562e2", "p3054273/k$98b7d77b9a88bc31dbd1f9edea26ccf4", "p3054292/k$d939c2523a175c4d326bd69ed9f4a74f", "p3054281/k$42eea155c124dedb7e162692778f5a5b", "p3016924/k$1e9c6dfb76755e1c1294eef20ac746f7", "p3016664/k$82af3712384df3d239dd6acf2174c5ef", "p3016660/k$13e47d7441660a41d411be82e9f04bb5"]) }
      ],
      lien: "https://www.decathlon.fr/p/t-shirt-fitness-femme-100-blanc-glacier/339063/c227c344m8737886",
      photos: [
        "https://contents.mediadecathlon.com/p3054279/k$b8291280158b44ad1831c63d6e800f4e/picture.jpg",
        "https://contents.mediadecathlon.com/p3054297/k$c04ecd3f2090ccfe0427b3c64ba562e2/picture.jpg",
        "https://contents.mediadecathlon.com/p3054273/k$98b7d77b9a88bc31dbd1f9edea26ccf4/picture.jpg",
        "https://contents.mediadecathlon.com/p3054292/k$d939c2523a175c4d326bd69ed9f4a74f/picture.jpg",
        "https://contents.mediadecathlon.com/p3054281/k$42eea155c124dedb7e162692778f5a5b/picture.jpg",
        "https://contents.mediadecathlon.com/p3016924/k$1e9c6dfb76755e1c1294eef20ac746f7/picture.jpg",
        "https://contents.mediadecathlon.com/p3016664/k$82af3712384df3d239dd6acf2174c5ef/picture.jpg",
        "https://contents.mediadecathlon.com/p3016660/k$13e47d7441660a41d411be82e9f04bb5/picture.jpg"
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8510031",
          lien: "https://www.decathlon.fr/p/sous-vetement-thermique-de-ski-chaud-et-confort-femme-bl100-haut-noir/302806/c382m8510031",
          photos: dec(["p3014391/k$eb1ca62303c545e73564e3c181e1e2f4", "p3014387/k$c504852395ac5ec01a362d1b282d5ee2", "p3014381/k$c209844f0d8e04653f94aea9ec0d9af6", "p3014382/k$024a4f941a979c29d317fbf2a932d0dc", "p3014389/k$0b571028b0486bcb855f9ba1f52e8aed", "p3014385/k$2d410c0f5d8109892ecb1a9e8a3f95d1", "p2419708/k$823ffe191ed074e5f248c76e961ccd61", "p2419704/k$9623e2b88d9b6655397c6f2475492dc5", "p2419696/k$81e32629db888d3cbf3ca822cc56b0d8", "p2419697/k$b053aa7425cd1e258f5d9aa9b71935af", "p2419699/k$85c5d254ac59b2d62fcc1d1f6983999d"]) },
        { id: "ecru", nom: "Écru", nomDec: "non teint", hex: "#e6dcc8", clair: true, ref: "8807917",
          lien: "https://www.decathlon.fr/p/sous-vetement-de-ski-thermique-chaud-et-confort-femme-100-blanc-greige/302806/c335m8807917",
          photos: dec(["p2579092/k$f5ccec0be6eba74a2a2456b6f2b4fa39", "p2041493/k$7e3b92bc529eed9d98cd2ae5c42e2232", "p2041403/k$799742fcad39d6adccae6399819e43ff", "p2041457/k$3539b261e54bf10bca6f561918fa4586", "p2041345/k$78436b7374f2fc741b615ebf1be4fb51", "p2041548/k$5c10a9aabd79ef0bafc59c56316bac2e", "p2041408/k$a267736035b6515287d36e1e2ce6300b"]) }
      ],
      lien: "https://www.decathlon.fr/p/sous-vetement-thermique-de-ski-chaud-et-confort-femme-bl100-haut-noir/302806/c382m8510031",
      photos: [
        "https://contents.mediadecathlon.com/p3014391/k$eb1ca62303c545e73564e3c181e1e2f4/picture.jpg",
        "https://contents.mediadecathlon.com/p3014387/k$c504852395ac5ec01a362d1b282d5ee2/picture.jpg",
        "https://contents.mediadecathlon.com/p3014381/k$c209844f0d8e04653f94aea9ec0d9af6/picture.jpg",
        "https://contents.mediadecathlon.com/p3014382/k$024a4f941a979c29d317fbf2a932d0dc/picture.jpg",
        "https://contents.mediadecathlon.com/p3014389/k$0b571028b0486bcb855f9ba1f52e8aed/picture.jpg",
        "https://contents.mediadecathlon.com/p3014385/k$2d410c0f5d8109892ecb1a9e8a3f95d1/picture.jpg",
        "https://contents.mediadecathlon.com/p2419708/k$823ffe191ed074e5f248c76e961ccd61/picture.jpg",
        "https://contents.mediadecathlon.com/p2419704/k$9623e2b88d9b6655397c6f2475492dc5/picture.jpg",
        "https://contents.mediadecathlon.com/p2419696/k$81e32629db888d3cbf3ca822cc56b0d8/picture.jpg",
        "https://contents.mediadecathlon.com/p2419697/k$b053aa7425cd1e258f5d9aa9b71935af/picture.jpg",
        "https://contents.mediadecathlon.com/p2419699/k$85c5d254ac59b2d62fcc1d1f6983999d/picture.jpg"
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
        { id: "blanc", nom: "Blanc", nomDec: "blanc", hex: "#f3f3f0", clair: true, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c4" },
        { id: "noir", nom: "Noir", nomDec: "noir", hex: "#1c1c1f", clair: false, prixAchat: 21.00, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c1" },
        { id: "bleu-electrique", nom: "Bleu électrique", nomDec: "bleu électrique", hex: "#1e5bff", clair: false, prixAchat: 22.50, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c121" },
        { id: "bleu-marine", nom: "Bleu marine", nomDec: "bleu marine", hex: "#1f2b4a", clair: false, prixAchat: 22.50, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c189" },
        { id: "bleu-atlantis", nom: "Bleu atlantis", nomDec: "bleu atlantis", hex: "#2a8bb5", clair: false, prixAchat: 25.00, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c236" },
        { id: "bleu", nom: "Bleu", nomDec: "bleu", hex: "#2d4f9e", clair: false, prixAchat: 22.50, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c5" },
        { id: "rouge-ecarlate", nom: "Rouge écarlate", nomDec: "rouge écarlate", hex: "#d3202f", clair: false, prixAchat: 18.50, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c61" },
        { id: "rouge", nom: "Rouge", nomDec: "rouge", hex: "#c4252b", clair: false, prixAchat: 25.00, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c14" },
        { id: "jaune-fluo-marine", nom: "Jaune fluo et marine", nomDec: "jaune acide fluo / bleu marine", hex: "#e8f23a", clair: false, prixAchat: 35.80, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c132c189" },
        { id: "rose-orange", nom: "Rose framboise et orange", nomDec: "rose framboise / orange mandarine", hex: "#d6336c", clair: false, prixAchat: 35.90, lien: "https://www.decathlon.fr/p/mp/fermeture-a-cordon-robe-hmllogo-adulte/d4bcd79a-369a-476f-9174-bb24d8d83781/c85c187" }
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
        { id: "marine", nom: "Marine", nomDec: "bleu / bleu navy", hex: "#243b5e", clair: false, lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-bleu-marine/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c5c145" },
        { id: "marine-orange", nom: "Marine et orange", nomDec: "bleu / bleu navy / orange", hex: "#243b5e", clair: false, prixAchat: 28.50, lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-bleu-marine/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c5c145c20" },
        { id: "noir-azur-vert", nom: "Noir, bleu azur et vert", nomDec: "noir / bleu azur / vert", hex: "#1c1c1f", clair: false, prixAchat: 45.75, lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-noir/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c1c86c9" },
        { id: "jaune", nom: "Jaune", nomDec: "jaune", hex: "#f4cf1e", clair: false, lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-jaune/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c22" },
        { id: "bleu-royal", nom: "Bleu royal", nomDec: "bleu / bleu royal", hex: "#2450b0", clair: false, prixAchat: 28.50, lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-bleu-roi/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c5c218" },
        { id: "noir-rouge", nom: "Noir et rouge", nomDec: "noir / rouge", hex: "#2a1a1c", clair: false, prixAchat: 60.79, lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-noir/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c1c14" },
        { id: "noir-gris", nom: "Noir et gris charbon", nomDec: "noir / gris charbon", hex: "#2b2c30", clair: false, prixAchat: 89.77, lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-noir/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c1c76" },
        { id: "vert", nom: "Vert", nomDec: "vert", hex: "#2f7d4f", clair: false, prixAchat: 28.50, lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-vert/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c9" }
      ],
      lien: "https://www.decathlon.fr/p/mp/survetement-football-homme-joma-eco-championship-bleu-marine/92b4c8d5-a513-4f8f-b7a2-53cfba92be7d/c5c145",
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
      prixAchat: 21.99,
      matiere: "87 % polyester, 13 % élasthanne",
      polyesterPct: 87,
      tailles: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      couleurs: [
        { id: "gris-noir", nom: "Gris et noir", nomDec: "noir fumé / gris graphite", hex: "#3a3c40", clair: false, ref: "8651183",
          lien: "https://www.decathlon.fr/p/sweat-de-football-1-2-zip-viralto-club-gris-carbone-et-noir/332733/c382c383m8651183",
          photos: dec(["p2972281/k$5d8271ca2408d50e4c7319b3d7f41ddb", "p2972251/k$3f9a5c1184d01695301189b521f3f9d9", "p2972268/k$1699b88341a1edac8252ed4ca8770c2f", "p2972195/k$2e42e36e1215b4fd4e400393c0def1c9", "p2972542/k$6057157dab3481e9fa2352cba2d9887f", "p2972625/k$617c0bdcb82d9fafa5b3936da3877aab", "p2972496/k$324edd724642c1fdbc5e1c0d9efe034a", "p2972161/k$678c2fb796df1de00eac20d231f39695"]) },
        { id: "gris-rouge", nom: "Gris et rouge", nomDec: "gris graphite / rouge piment", hex: "#4b4e53", clair: false, ref: "8651181",
          lien: "https://www.decathlon.fr/p/sweat-de-football-1-2-zip-viralto-club-gris-anthracite-et-rouge/332733/c383c221m8651181",
          photos: dec(["p2977910/k$5390ce6e38eba72eac9a56d7632b1a68", "p2977892/k$ba18198754fc07cc6b60fdc99714e44a", "p2972275/k$fcb52aef5e3b25d3065e5812ec218b9c", "p2972193/k$882f0e1b40dc02d0f21617659151c460", "p2972253/k$539154408e9464815144081ca0055f3c", "p2972192/k$5d5f28f709ff748818f500ba70ecc773", "p2972231/k$86c6eaf67c070f90f0b430bd95d6483b", "p2972169/k$1b65875fa56bf35dd46e3658c0bb0075"]) },
        { id: "vert-gris", nom: "Vert et gris", nomDec: "vert émeraude / gris graphite", hex: "#1b7a50", clair: false, ref: "8812425",
          lien: "https://www.decathlon.fr/p/sweat-de-football-1-2-zip-viralto-club-gris-carbone-et-vert/332733/c122c383m8812425",
          photos: dec(["p2972175/k$cca09f7ffc789e9f7438477cef82adbf", "p2977899/k$0f410ff9ee8a885f2d65d4f72fa91356", "p2986038/k$07f1137dfae22d64e8252e4536956a3b", "p2972186/k$29895eb8ada9c786f2a254dd5825c853", "p2972491/k$056adeb0598e1a933cbe849cae9c1bce", "p2972549/k$0482d00977fd25ee603b41d4e88bc533", "p2972212/k$6f5111a006898ee46dc4f2cdd2573283", "p2977889/k$a98096ca0766d807c4933651f42513ac", "p2516279/k$80cfd26a82f172c1ff84f3611c6481bc", "p2516278/k$e04062a29259a985cd11dddba1741a03", "p2516275/k$5004a7dc8aac93acb01cf28e8555589d", "p2516273/k$73cbf6f6c122f2b4daacf4865cc87933", "p2516272/k$d7117352aad7db428f6a8f21ed303f12", "p2516271/k$7ddf5b07fbe11e06dad99de499352e41", "p2516270/k$d95f6f0540a3dea29fec701c42b4f925", "p2516269/k$17e943ae5a457e9308aaff1007f67a80", "p2516268/k$de2629a5fdde232d41c14bfb34b45424", "p2516267/k$12dfd3d4288d11a14f2a73bfec4f0432", "p2516261/k$d5421b0d654e04684b3d25b02b34bca9", "p2516259/k$690f37e2de33c448f55decc4f358b1c7"]) },
        { id: "marine-bleu", nom: "Marine et bleu", nomDec: "bleu acier / bleu indigo", hex: "#2b3f7a", clair: false, ref: "8651182",
          lien: "https://www.decathlon.fr/p/sweat-de-football-1-2-zip-viralto-club-marine-et-bleu/332733/c364c59m8651182",
          photos: dec(["p2972280/k$23e489ef9f55e15e89abf88083455e1f", "p2977913/k$977220153d66d2ad4570d21ff3df761b", "p2972277/k$ed2df6e44c88762f69898c58bf249ece", "p2972185/k$79e6fa6f4c9070b332085600b19c60f0", "p2972242/k$902d7c3fafb4aaa8933f109b9cdc7ebf", "p2972200/k$9035c443e06c5775f543b72de98ca5b3"]) }
      ],
      lien: "https://www.decathlon.fr/p/sweat-de-football-1-2-zip-viralto-club-gris-carbone-et-noir/332733/c382c383m8651183",
      photos: [
        "https://contents.mediadecathlon.com/p2972281/k$5d8271ca2408d50e4c7319b3d7f41ddb/picture.jpg",
        "https://contents.mediadecathlon.com/p2972251/k$3f9a5c1184d01695301189b521f3f9d9/picture.jpg",
        "https://contents.mediadecathlon.com/p2972268/k$1699b88341a1edac8252ed4ca8770c2f/picture.jpg",
        "https://contents.mediadecathlon.com/p2972195/k$2e42e36e1215b4fd4e400393c0def1c9/picture.jpg",
        "https://contents.mediadecathlon.com/p2972542/k$6057157dab3481e9fa2352cba2d9887f/picture.jpg",
        "https://contents.mediadecathlon.com/p2972625/k$617c0bdcb82d9fafa5b3936da3877aab/picture.jpg",
        "https://contents.mediadecathlon.com/p2972496/k$324edd724642c1fdbc5e1c0d9efe034a/picture.jpg",
        "https://contents.mediadecathlon.com/p2972161/k$678c2fb796df1de00eac20d231f39695/picture.jpg"
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé / gris graphite", hex: "#1c1c1f", clair: false, ref: "8560131",
          lien: "https://www.decathlon.fr/p/sweat-de-football-t100-noir/310366/c382c383m8560131",
          photos: dec(["p2972606/k$f4e972d1d13814f4026754fa857981e4", "p2972538/k$c6bd487f3632a32e419df8121125ba03", "p2972623/k$1e6693d19bf98a7b45e372896859e470", "p2972523/k$ac13033c7e403e670d3bcac9680cc9d9", "p2972601/k$9c26b2ad733e2cb714f2aa979d6d4982", "p2972572/k$e079bcc5b6aec46e2b72c02d4a446dfb", "p2972461/k$1819428c80aa0d436e4747728cfdfb8e"]) },
        { id: "bleu-indigo", nom: "Bleu indigo", nomDec: "bleu acier / bleu indigo", hex: "#2b3f7a", clair: false, ref: "8560130",
          lien: "https://www.decathlon.fr/p/sweat-de-football-t100-bleu-fonce/310366/c364c59m8560130",
          photos: dec(["p2972484/k$52ddfe8d7b14c4a69c4d8532df3b2595", "p2972556/k$3df4aefdb8b5925c1684b17aa4f11bfe", "p2972536/k$7d8542be5cb181ddd834a56740354442", "p2972603/k$5e283e3ffe79e59c88af56109c3c0540", "p2972530/k$f3009809056f15461f2c4d679dd9d229", "p2972590/k$df4d51386fbab1b69a40c66c74c48758"]) }
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
        { id: "noir", nom: "Noir", nomDec: "noir ultra", hex: "#1c1c1f", clair: false, ref: "8732677",
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-noir/324952/c378m8732677",
          photos: dec(["p3023351/k$d8b340f82975c74d68371163761aef63", "p3023249/k$556876a9100fd93ccd5aae1c75aa86aa", "p3023353/k$c402db2c35d4aeab6e3633cd9b387d13", "p3023246/k$0d15ee0062cf517671721153b97c7bc4", "p3023387/k$624afeedca62b54ac11698fcbb464f87"]) },
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra", hex: "#f3f3f0", clair: true, ref: "8732660",
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-blanc/324952/c227m8732660",
          photos: dec(["p3244048/k$4cb1cb0309c80291a023a707d4394074", "p3244049/k$3414010f9586005d6094c1587291ff95", "p3244052/k$dffc0bcf66c2b84d183f2f1f097c107f", "p3244053/k$c528b5041dfe62577dda852022cd7e05", "p3244050/k$3bb88205717c737e9383655e007ecdaa", "p2738378/k$9611bae09ed1386ccf8d2426dfe83fd1"]) },
        { id: "bleu-abysse", nom: "Bleu abysse", nomDec: "bleu abysse", hex: "#1a2f55", clair: false, ref: "8733618",
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-bleu-ardoise/324952/c246m8733618",
          photos: dec(["p3023415/k$3ca23d542067d01edce5a838f516c081", "p3023331/k$07502daa788c49d332727b5765ea4551", "p3023269/k$1cdf0f058f11993e995c8c52c045b3ce", "p3023253/k$8dac0e5e293a65073d6bb40ffb87cd3f", "p3023404/k$6332f8cfd94b1a015455bfbbbe854230"]) },
        { id: "gris", nom: "Gris", nomDec: "gris", hex: "#b4b7bb", clair: true, ref: "8785692",
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-gris-clair/324952/c251m8785692",
          photos: dec(["p2433278/k$a1d53335337543727e93c7dfac1f217d", "p2433279/k$f89c3b3a3f4cd8b0b0873862f929c34f", "p2433275/k$2b092d5075cb429b498ebeed6b3867c5", "p2433273/k$ea73b3ea0e0e35de84cdc164e43c0138", "p2433274/k$38a63bcd07a04ba4466b1de57db843ce", "p2433284/k$9b42b4a91ef238b00bedbb6950964973"]) },
        { id: "jaune-limonade", nom: "Jaune limonade", nomDec: "jaune limonade", hex: "#efe27a", clair: true, ref: "8970035", prixAchat: 9.99,
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-jaune/324952/c339m8970035",
          photos: dec(["p3023897/k$808c10932d691e8857c964c510fe4e2d", "p3023983/k$4f85fa656d1ac2a6b8eb77b4300fa938", "p3023749/k$f17569462977d5520108b80474cbc862", "p3023837/k$401ab0b2a60df34eb707bb81165dcdce", "p3023622/k$17cce55898a64b3c40b026f2f3ee5b41", "p3023611/k$b80dd12eaafa1d004d43ca9b4d9e3442"]) },
        { id: "bordeaux", nom: "Bordeaux", nomDec: "rouge bordeaux", hex: "#6e1e2c", clair: false, ref: "8732663",
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-rouge-fonce/324952/c361m8732663",
          photos: dec(["p3023798/k$b48c72520bbb097e8a00f64f7b9d8a19", "p3024047/k$854354e09715a54a4b4ddfb89e577003", "p3023938/k$c69909ccf1d01e4263db913046f39cc7", "p3023555/k$43ce36fb4531a69c6e94ad1c2319245b", "p3023451/k$d3be6e2999b3c924315673b52c56810e", "p3023688/k$403dd23773b08a24c6209ac72b27e8a4"]) },
        { id: "bleu-cosmos", nom: "Bleu cosmos", nomDec: "bleu cosmos", hex: "#2a4a7a", clair: false, ref: "8732655",
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-bleu-marine/324952/c43m8732655",
          photos: dec(["p3023379/k$d93ed0e3f01d531be9d184a8a139dcaa", "p3023275/k$d3415dc38bd8d39aae2029f945d61353", "p3023401/k$fad6deb2659ad3bd303dc677f83dead5", "p3023403/k$3662d981723c9167b1ebef6d4b8a5653", "p3023272/k$8047f486129f9ae9ddaf3679337679ee"]) },
        { id: "rose-bonbon", nom: "Rose bonbon", nomDec: "rose bonbon pastel", hex: "#f2b4cf", clair: true, ref: "8828073",
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-rose/324952/c69m8828073",
          photos: dec(["p3023733/k$4c68195528d105682e51f7026ae0a983", "p3023806/k$35c29491c0e6e7dd23bebc19c28003d5", "p3023878/k$a5a591bbfdf687e449f596ef84a165db", "p3023632/k$b818ca59bb4fd5b2151607a9d5cbdf13", "p3023704/k$c63944d22f850af20a4a7a6aa85e580a", "p3023467/k$954ff31f97132c796e12ce759672c29a"]) },
        { id: "rouge-tomate", nom: "Rouge tomate", nomDec: "rouge tomate", hex: "#d6392b", clair: false, ref: "8842809",
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-rouge/324952/c77m8842809",
          photos: dec(["p3023963/k$f6a46e584ac2ba1110b1a5170fb733ab", "p3023551/k$8674a0bb15019b8e51a5c02b1806371b", "p3023475/k$eec48fe642b031af00ff66f755cf997e", "p3023692/k$4296518b6acb43a040b28d406c249170", "p3023601/k$e5def5528cf28bb2dfa0bd3fc2b60592", "p3023838/k$b8318080a9b66dcce02dd82721d72c80"]) },
        { id: "vieux-violet", nom: "Vieux violet", nomDec: "vieux violet", hex: "#8b6a8f", clair: false, ref: "8927647", prixAchat: 9.99,
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-rose-fonce/324952/c272m8927647",
          photos: dec(["p2866805/k$cff5e74b60e7dd98f6ab19432df5bdaf", "p2867373/k$497ca3eb509e10561e97c3f96e51f935", "p2867367/k$d30523394a26416b18e04cf0e3edca7c", "p2866964/k$6946f133cd1ad1a1b66dec7446ea3f61", "p2867300/k$5d86606b1d3930c02df41391d6a92fd9", "p2866927/k$80a935b2e822452f10d501140efaf98f"]) },
        { id: "vert-eucalyptus", nom: "Vert eucalyptus", nomDec: "vert eucalyptus", hex: "#6f9d86", clair: false, ref: "8732673", prixAchat: 9.99,
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-vert/324952/c261m8732673",
          photos: dec(["p3023592/k$a21ffd30d4881b26cbc5e0d5c0d69f5f", "p3023830/k$b05f883e7863d63dd9b96183945a745e", "p3023762/k$ea6e98eeaf83589d604c2523a0c72b80", "p3024006/k$98eb617af0e0e62e7ee7f9e9e56b1384", "p3023862/k$2519b0293ee2e104ceffd477cb18cc31", "p3023633/k$f957a7af1c770cf09896ee0b541be9b2"]) },
        { id: "bleu-turquoise", nom: "Bleu turquoise", nomDec: "bleu turquoise", hex: "#1fa3b8", clair: false, ref: "8970038",
          lien: "https://www.decathlon.fr/p/polo-de-golf-en-coton-polyester-manches-courtes-homme-mw500-turquoise/324952/c41m8970038",
          photos: dec(["p3023946/k$8fd53410d0a8a31d573e87b12bde3ee2", "p3023996/k$d754554532ab58e44e316b6f927442a2", "p3023441/k$06c9f8113e3f2df971061308efb5b091", "p3023517/k$48c522824f122584bb0b2d8a38bda165", "p3023647/k$d0d8e5fb81f42b055276f26fba7be7d6", "p3023726/k$09fabfeb80366c9d3bf0ccb8fb3b7a75"]) }
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8510029",
          lien: "https://www.decathlon.fr/p/sous-vetement-thermique-de-ski-chaud-et-confort-homme-bl100-haut-noir/302821/c382m8510029",
          photos: dec(["p3014490/k$ccaeb8772db87fa4573b84e4513495d2", "p3014489/k$aa7d05c8ff2f8b4d64272df86fa2e6fd", "p3014487/k$e0c5ef5e4c9b0ae4657a4a6d4128d121", "p3014488/k$5b7c23a1c10c15cb70741d5f5b03cfec", "p3014486/k$a5b768667df5f5e90e61161644f461a9"]) },
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra / non teint", hex: "#f3f3f0", clair: true, ref: "8807428",
          lien: "https://www.decathlon.fr/p/sous-vetement-thermique-de-ski-chaud-et-confort-homme-bl100-haut-blanc/302821/c227c335m8807428",
          photos: dec(["p2041420/k$a22a28d748774bda72bb2561e7b2e4cf", "p2041451/k$99fa7e22a104aea9f3c60a9aca0f3232", "p2041442/k$ed52c4ccb557af9f5c253acba2aaf23c", "p2041369/k$5a53fe831c237002d3ad59a6d8078550", "p2041532/k$170eb17b96a288ba3735614108fa90ff", "p2041314/k$13767522b010b5e9a42066344687a617"]) }
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
        { id: "bleu-fonce", nom: "Bleu foncé", hex: "#2e4663", clair: false, ref: "9033996",
          lien: "https://www.decathlon.fr/p/t-shirt-de-sport-en-coton-col-rond-homme-bleu-fonce/387248/c364m9033996",
          photos: dec(["p3152322/k$2d8c9d318064755904bfacbb63c32c10", "p3152321/k$96945b3dc5d876342e550bac10c1c120", "p3152320/k$aef334e5c1e973cfaa4be5413a4ed929", "p3152318/k$57bdcae58a33460f52f5017710dc9a8a", "p3152323/k$5a71864c8332e8abed1d5002bbc5b2d0", "p3152319/k$a990670d732eebdb32d3eb372e3ea080", "p3174367/k$a27caac71366a0df74eb55352a89eb8e", "p3174360/k$d657704c82856ac2b5ba5c5d15e19622"]) }
      ],
      lien: "https://www.decathlon.fr/p/t-shirt-de-sport-en-coton-col-rond-homme-bleu-fonce/387248/c364m9033996",
      photos: [
        "https://contents.mediadecathlon.com/p3152322/k$2d8c9d318064755904bfacbb63c32c10/picture.jpg",
        "https://contents.mediadecathlon.com/p3152321/k$96945b3dc5d876342e550bac10c1c120/picture.jpg",
        "https://contents.mediadecathlon.com/p3152320/k$aef334e5c1e973cfaa4be5413a4ed929/picture.jpg",
        "https://contents.mediadecathlon.com/p3152318/k$57bdcae58a33460f52f5017710dc9a8a/picture.jpg",
        "https://contents.mediadecathlon.com/p3152323/k$5a71864c8332e8abed1d5002bbc5b2d0/picture.jpg",
        "https://contents.mediadecathlon.com/p3152319/k$a990670d732eebdb32d3eb372e3ea080/picture.jpg",
        "https://contents.mediadecathlon.com/p3174367/k$a27caac71366a0df74eb55352a89eb8e/picture.jpg",
        "https://contents.mediadecathlon.com/p3174360/k$d657704c82856ac2b5ba5c5d15e19622/picture.jpg"
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
        { id: "gris", nom: "Gris", nomDec: "gris perle", hex: "#b4b7bb", clair: true, ref: "9005972",
          lien: "https://www.decathlon.fr/p/tee-shirt-manche-courte-homme-gris/360199/c200m9005972",
          photos: dec(["p3152354/k$8cf73317403b1061802f9f2810c85f48", "p3152326/k$cc0de1fdb1b515679930415b8b172aa4", "p3152346/k$eb1a4a8bb641dc3e6ac7126e966d6d18", "p3152335/k$f8fccd37921271759e64d6f0e3cedc00", "p3152350/k$2d9ce9eddc563db054fc237ee950bbc5", "p3152337/k$a6f0d6895e9a579fc07823e387da2b59", "p3152331/k$8acfd5e8f9d687881a6fba7946da045f", "p3174341/k$d64ef1aab3309f5d0ae5319b9fe48d40", "p3174329/k$fc9d8d9c49e46d5daeffd87e787faba8", "p3174350/k$833e80ccc1ff267debb41a50f0ed961e"]) },
        { id: "noir", nom: "Noir", nomDec: "noir ultra", hex: "#1c1c1f", clair: false, ref: "8927828",
          lien: "https://www.decathlon.fr/p/tee-shirt-manche-courte-homme-noir/360199/c378m8927828",
          photos: dec(["p3084074/k$27a830cca01506402454223c1d95ac7c", "p3084070/k$2bed346871a78a6d62774406da34c103", "p3084049/k$c4e803b9b7a9ee9cc575eff83f0fbcd1", "p3084037/k$5cae7afa245883f0eaae6d0ffecdcb6c", "p3084041/k$4f4fe332598ad1991146fb77a204657e", "p3084065/k$d06b8d726508f302535c9ec4668bfb02"]) }
      ],
      lien: "https://www.decathlon.fr/p/tee-shirt-manche-courte-homme-gris/360199/c200m9005972",
      photos: [
        "https://contents.mediadecathlon.com/p3152354/k$8cf73317403b1061802f9f2810c85f48/picture.jpg",
        "https://contents.mediadecathlon.com/p3152326/k$cc0de1fdb1b515679930415b8b172aa4/picture.jpg",
        "https://contents.mediadecathlon.com/p3152346/k$eb1a4a8bb641dc3e6ac7126e966d6d18/picture.jpg",
        "https://contents.mediadecathlon.com/p3152335/k$f8fccd37921271759e64d6f0e3cedc00/picture.jpg",
        "https://contents.mediadecathlon.com/p3152350/k$2d9ce9eddc563db054fc237ee950bbc5/picture.jpg",
        "https://contents.mediadecathlon.com/p3152337/k$a6f0d6895e9a579fc07823e387da2b59/picture.jpg",
        "https://contents.mediadecathlon.com/p3152331/k$8acfd5e8f9d687881a6fba7946da045f/picture.jpg",
        "https://contents.mediadecathlon.com/p3174341/k$d64ef1aab3309f5d0ae5319b9fe48d40/picture.jpg",
        "https://contents.mediadecathlon.com/p3174329/k$fc9d8d9c49e46d5daeffd87e787faba8/picture.jpg",
        "https://contents.mediadecathlon.com/p3174350/k$833e80ccc1ff267debb41a50f0ed961e/picture.jpg"
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
        { id: "noir", nom: "Noir", nomDec: "noir", hex: "#1c1c1f", clair: false, ref: "8974121",
          lien: "https://www.decathlon.fr/p/jogging-molleton-homme-noir/375529/c1m8974121",
          photos: dec(["p3147366/k$ff47eba57df5db4a9d042fb7e7ac988b", "p3147369/k$f849b0068f35bb66ee619a6a3d0f4905", "p3147378/k$afbfb4967b1b60c44067fbaaf3cc1423", "p3147365/k$e15ba2006da748e5c8decef9e9d53d2d", "p3147376/k$82230e5733bf34796cdb8e42cf891e52", "p3147374/k$dc551a04cea129af28d64fcd83e62bbf"]) },
        { id: "bleu-acier", nom: "Bleu acier", nomDec: "bleu acier", hex: "#55708f", clair: false, ref: "9001530",
          lien: "https://www.decathlon.fr/p/jogging-molleton-homme-bleu-fonce/375529/c364m9001530",
          photos: dec(["p3152302/k$991c9b1843d66ed1ed5cbcaabc05e842", "p3152304/k$ae50f1e03b6f80c56a47719e25446c6d", "p3152303/k$edf9c734f3b2715ec0873a7c5f66534f", "p3152306/k$9179270b9ac24cf028c0520f627e3561", "p3152307/k$e63f2ae67774e20b3cf693eab5ab3d98", "p3152305/k$1dfeb80c2940429e4be063f30d8e9788"]) }
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8327267",
          lien: "https://www.decathlon.fr/p/short-de-football-adulte-essentiel-noir/108306/c382m8327267",
          photos: dec(["p2959930/k$eed773dcfeb281a10fa2ae0218ee9cec", "p2960173/k$f7ff63a6e4e9b195f7e1aa98d0dfce75", "p2960119/k$1c907df64987565a70c02958c137e859", "p2960023/k$afacdafafa28a252d82e9328d809bc54", "p2960229/k$557c924fd20ec025b94886d61f5002f8", "p2959962/k$d62d0d095e64299b2f76a11665a924b8", "p2960080/k$5fc38d40976400dceb3cc5111ca57266"]) },
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra", hex: "#f3f3f0", clair: true, ref: "8327265",
          lien: "https://www.decathlon.fr/p/short-de-football-adulte-essentiel-blanc/108306/c227m8327265",
          photos: dec(["p2960013/k$998fef603018077aa88a5215ef3bc788", "p2960093/k$e3ae95cb5c85a310e6ec3c8bbb512780", "p2960159/k$2989a14a7cd6904bf9fbd53ecad4a372", "p2960063/k$cb154cf2229ae52b23b5a49de101704d", "p2959992/k$652e37755cb579b1244b65465ded844a", "p2960214/k$732daa9f1ba0fc0e01283f4e31942aff", "p2960025/k$702de4b0fd489d93c71a31c2709539ed"]) },
        { id: "bleu-acier", nom: "Bleu acier", nomDec: "bleu acier", hex: "#55708f", clair: false, ref: "8525866",
          lien: "https://www.decathlon.fr/p/short-de-football-adulte-essentiel-bleu-marine/108306/c364m8525866",
          photos: dec(["p2960078/k$58a24b9af19bd4b657a655aecac97d3f", "p2960141/k$959e293d659039735ec6663b477c2b30", "p2960103/k$50faf6e91563e1a1eaefccff23339c0f", "p2960026/k$f7a8750f0985d4d039661b5de620a12d", "p2959957/k$b4f6e7b408cee23c6b94c773233f8b72", "p2960221/k$c3ff43380b022b0e064ae68b7d353b9c", "p2960187/k$8f268a16f192392b188d4e5b580c61b5", "p2960075/k$4c65872816f661c0bd9689a75763b8c1"]) },
        { id: "bleu-indigo", nom: "Bleu indigo", nomDec: "bleu indigo", hex: "#2b3f7a", clair: false, ref: "8525867",
          lien: "https://www.decathlon.fr/p/short-de-football-adulte-essentiel-bleu/108306/c59m8525867",
          photos: dec(["p2959940/k$a680b83b5ebd2dff21995d14bee5202c", "p2960028/k$27d8fd65741d3533186e6304cf780c6b", "p2959977/k$392e7a02125d3532938639111ed60aa4", "p2960068/k$546f4831801d7b8b101281af23b5f643", "p2960164/k$1232b848ff558f2ffd509a4ec360deed", "p2960222/k$d4d77215ff9ff21d88c239fd0014effe", "p2960126/k$77154e0db5b042c6037d3ef3e2e9719f", "p2960179/k$548587336b23b8ca39c471f42b3c8302"]) },
        { id: "rouge-piment", nom: "Rouge piment", nomDec: "rouge piment", hex: "#c4252b", clair: false, ref: "8407483",
          lien: "https://www.decathlon.fr/p/short-de-football-adulte-essentiel-rouge/108306/c221m8407483",
          photos: dec(["p2960143/k$e79eea6a29c19a8a55d5f5c066f11032", "p2959936/k$5fbdf3735b976f753bcdfdbf7939f931", "p2959952/k$6a31b99f6f087c2441d6d64048f9034d", "p2960209/k$e1277b9d05b8f575ba054003c224ed70", "p2960099/k$4e83f3dcece79fafeeb9e6e5184c6a15", "p2960018/k$9f230768ceefaaeee4bfe57dc839b7b6", "p2959984/k$835d858f4f396ae50fc40b223f126fa7", "p2960052/k$4468ace4ccaaa1aaa6cc5055f706cb2b"]) },
        { id: "vert-emeraude", nom: "Vert émeraude", nomDec: "vert émeraude", hex: "#1b7a50", clair: false, ref: "8407485",
          lien: "https://www.decathlon.fr/p/short-de-football-adulte-essentiel-vert/108306/c122m8407485",
          photos: dec(["p2960172/k$61cc012005486c57e3c8889b70a5d363", "p2960195/k$f63321a9125a1e0d8ed52be1ed59c6e5", "p2960040/k$079b12d67fe5f6b870a2f8ec36c9970c", "p2960157/k$37bc7df77670f61bf03712afc0f0f89a", "p2960079/k$b66ff8fd4f9eb16cced6bf26dcfe9589", "p2959981/k$bb2391ac8efe24c123bea04c07a9c4b5", "p2960218/k$9fc5a20f50436119c382db98c44ec1b7"]) },
        { id: "jaune-citron", nom: "Jaune citron", nomDec: "jaune citron", hex: "#e6dc3c", clair: false, ref: "8407484",
          lien: "https://www.decathlon.fr/p/short-de-football-adulte-essentiel-jaune/108306/c165m8407484",
          photos: dec(["p2959965/k$46dbec7101893686c586f0f62235ede6", "p2959954/k$f99999c9060c3b8d2f242b1962b6b98e", "p2960197/k$d0f56c36e24f0387c68fa19532b233fb", "p2960106/k$3faf03272587b85248e2bc2cf0cb0871", "p2960014/k$fb0f25ba5fe0a22529af71442f4ce2a9", "p2959931/k$78bc29572603b801b00346886448a56e", "p2960244/k$1e07bf66d9c9ab27ec879edbc9633c4b"]) },
        { id: "orange-flamme", nom: "Orange fluo", nomDec: "orange flamme fluo", hex: "#ff6a13", clair: false, ref: "8383071",
          lien: "https://www.decathlon.fr/p/short-de-football-adulte-essentiel-orange/108306/c125m8383071",
          photos: dec(["p2960120/k$1ca3c545c07931bfa6640457281d2891", "p2960086/k$cd10dc5f73e11ae277532276a4f592d5", "p2959949/k$d047b9589403656b7ad9e61146d26e42", "p2960016/k$e64921e6b42f9b47679e6a3f9a667fa8", "p2960096/k$2ad6457c34dac9f338250aa5e4f765df", "p2960163/k$95d3774b28c9bb8c76dc39845cac0697", "p2960210/k$0dbe382d3aaf3fd743f472ca7d0708b0", "p2959967/k$694f41013e58dd96b4f06b725556eed6"]) }
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
      id: "chasuble-football",
      nomCourt: "Chasuble",
      nom: "Chasuble de football adulte",
      marque: "Kipsta, Decathlon",
      modele: "chasuble",
      demonstratif: "ce chasuble",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Football", type: "haut" },
      prixAchat: 3.49,
      matiere: "100 % polyester",
      polyesterPct: 100,
      tailles: ["Taille unique"],
      couleurs: [
        { id: "jaune-fluo", nom: "Jaune fluo", nomDec: "jaune acide fluo", hex: "#dff21b", clair: false, ref: "8526946",
          lien: "https://www.decathlon.fr/p/chasuble-adulte-jaune-fluo/2856/c132m8526946",
          photos: dec(["p2635139/k$298f86347c6519c17764489394ec9ea6"]) },
        { id: "orange-fluo", nom: "Orange fluo", nomDec: "orange flamme fluo", hex: "#ff6a13", clair: false, ref: "8526947",
          lien: "https://www.decathlon.fr/p/chasuble-adulte-orange-fluo/2856/c125m8526947",
          photos: dec(["p2635136/k$e357924381e0fb4d1aaead7f392a186d"]) },
        { id: "rouge", nom: "Rouge", nomDec: "rouge piment", hex: "#c4252b", clair: false, ref: "8526950",
          lien: "https://www.decathlon.fr/p/chasuble-adulte-rouge/2856/c221m8526950",
          photos: dec(["p2635228/k$ae74026c51a8a3fae005e2f23d70e934"]) },
        { id: "blanc", nom: "Blanc", nomDec: "non teint", hex: "#f3f3f0", clair: true, ref: "8526948",
          lien: "https://www.decathlon.fr/p/chasuble-adulte-blanc/2856/c335m8526948",
          photos: dec(["p2635237/k$c8d5e9bac29c45d2e23d1cdd9fb73081"]) },
        { id: "bleu-acier", nom: "Bleu acier", nomDec: "bleu acier", hex: "#55708f", clair: false, ref: "8526949",
          lien: "https://www.decathlon.fr/p/chasuble-adulte-bleu-fonce/2856/c364m8526949",
          photos: dec(["p2635226/k$b35f4548170e15f90b70e0a1632942d7"]) },
        { id: "turquoise", nom: "Turquoise", nomDec: "vert caraïbes", hex: "#14a6a0", clair: false, ref: "8526951",
          lien: "https://www.decathlon.fr/p/chasuble-adulte-turquoise/2856/c74m8526951",
          photos: dec(["p2635225/k$ee2fa518bed3cf8a3ca644ccdcbff688"]) }
      ],
      lien: "https://www.decathlon.fr/p/chasuble-adulte-jaune-fluo/2856/c132m8526946",
      photos: [
        "https://contents.mediadecathlon.com/p2635139/k$298f86347c6519c17764489394ec9ea6/picture.jpg"
      ],
      vitrine: ["poitrine"],
      texteVitrine: "à la poitrine",
      avertissement: "Chasuble en maille aérée : le transfert DTF tient sur les mailles pleines, Fabr'Icam fait un essai (tenue, lavage, chaleur de la presse) avant la série.",
      zones: {
        poitrine: { vue: "face", cx: 45, top: 24, w: 26, h: 32, label: "Poitrine" },
        dos:      { vue: "dos",  cx: 45, top: 16, w: 40, h: 54, label: "Dos" }
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
        { id: "bleu-canard", nom: "Bleu canard", nomDec: "bleu canard", hex: "#1f6f7d", clair: false, ref: "8612536",
          lien: "https://www.decathlon.fr/p/gourde-alu-1l-avec-bouchon-instantane-composee-a-100percent-d-alu-recycle-bleu/330041/c98m8612536",
          photos: dec(["p2579584/k$6ca4ddf66bdc61cefd58225cb14ae926", "p2201844/k$e09b054551ba918f14d858419b0a526d", "p2201852/k$36ef852b724f1a14239d5e033c6a7c0f", "p2201851/k$8642c0eb5c5463cec869e9a1fedba9a3", "p2201850/k$b935d84ad62dc05f7f57b3a46275529c", "p2201849/k$82659a0434adc4388130746738039f4f", "p2201848/k$8a83f6b82a9731806ebc88835d10fa5d", "p2201847/k$3aede986a103c7c2fc7342d0ad9b920e", "p2201846/k$4c94963ceeae1aed0aa2d1e1125712cc", "p2201843/k$e0bc32c3156c911f1ee980a729668cf8"]) },
        { id: "vert-eucalyptus", nom: "Vert eucalyptus", nomDec: "vert eucalyptus", hex: "#6f9d86", clair: false, ref: "8914342",
          lien: "https://www.decathlon.fr/p/gourde-alu-1l-avec-bouchon-instantane-composee-a-100percent-d-alu-recycle-vert/330041/c261m8914342",
          photos: dec(["p2851411/k$c612714aa771cbc61caf653fce5a5761", "p2851414/k$dd452bcf27880365183ccbe12b76dab4", "p2851408/k$cbed1c1d823b33f5bbf7f6c2191893b8", "p2851410/k$953855b77b05b86bb3d2c35238fcb4c2", "p2851413/k$f056bd7221a85e3aaa6c4936a87c074e", "p2851409/k$d0f75fbda2b5f0334933e5f545322c94", "p2851412/k$143ac2018de77fff044b1b7f37058f6f", "p2851407/k$b66f23273a2c195fd677d108d355971b"]) },
        { id: "orange-abricot", nom: "Orange abricot", nomDec: "orange abricot", hex: "#f2a15f", clair: false, ref: "8914343",
          lien: "https://www.decathlon.fr/p/gourde-alu-1l-avec-bouchon-instantane-composee-a-100percent-d-alu-recycle-orange/330041/c329m8914343",
          photos: dec(["p2851401/k$97b5466ffa1f5fcffef7bd6b51e8a853", "p2851399/k$6c69cfc60096e1183957d2ae5a950f39", "p2851405/k$d7bbc0c3eee2c0e9af77f3fe7d8cb446", "p2851403/k$4e5db74551894451e70931d03f04d093", "p2851402/k$09995b17704235daec7d7bc3252958c6", "p2851406/k$701e14231e8d719c52882c4f240c510f", "p2851400/k$00b339faf7e51ff1d969054e3d842638", "p2851404/k$bae650792b42ead84edc535250d57401"]) }
      ],
      lien: "https://www.decathlon.fr/p/gourde-alu-1l-avec-bouchon-instantane-composee-a-100percent-d-alu-recycle-bleu/330041/c98m8612536",
      photos: [
        "https://contents.mediadecathlon.com/p2579584/k$6ca4ddf66bdc61cefd58225cb14ae926/picture.jpg",
        "https://contents.mediadecathlon.com/p2201844/k$e09b054551ba918f14d858419b0a526d/picture.jpg",
        "https://contents.mediadecathlon.com/p2201852/k$36ef852b724f1a14239d5e033c6a7c0f/picture.jpg",
        "https://contents.mediadecathlon.com/p2201851/k$8642c0eb5c5463cec869e9a1fedba9a3/picture.jpg",
        "https://contents.mediadecathlon.com/p2201850/k$b935d84ad62dc05f7f57b3a46275529c/picture.jpg",
        "https://contents.mediadecathlon.com/p2201849/k$82659a0434adc4388130746738039f4f/picture.jpg",
        "https://contents.mediadecathlon.com/p2201848/k$8a83f6b82a9731806ebc88835d10fa5d/picture.jpg",
        "https://contents.mediadecathlon.com/p2201847/k$3aede986a103c7c2fc7342d0ad9b920e/picture.jpg",
        "https://contents.mediadecathlon.com/p2201846/k$4c94963ceeae1aed0aa2d1e1125712cc/picture.jpg",
        "https://contents.mediadecathlon.com/p2201843/k$e0bc32c3156c911f1ee980a729668cf8/picture.jpg"
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
        { id: "bleu-marine", nom: "Bleu marine", nomDec: "bleu marine.", hex: "#1f2b4a", clair: false, ref: "8796697",
          lien: "https://www.decathlon.fr/p/gourde-de-fitness-training-aluminium-750-ml-bleu/345015/c195m8796697",
          photos: dec(["p2673170/k$8694fe9977769d156de43e65c6f6cb5c", "p2673198/k$7005747afdb0472bb5c9db14d6341902", "p2673188/k$593592a343514feeeb3caba110b14bbc", "p2673166/k$ae0c9600b39b1a761561f59a9ed26b9e"]) },
        { id: "vert-sauge", nom: "Vert sauge", nomDec: "vert sauge", hex: "#9db5a0", clair: false, ref: "8796696",
          lien: "https://www.decathlon.fr/p/gourde-de-fitness-training-aluminium-750-ml-kaki/345015/c219m8796696",
          photos: dec(["p2673172/k$812e6f5ce3c83137d4e90aca05a1f093", "p2673192/k$96c9a4c4f5dc6830ffd44662b03c6309", "p2673184/k$837d7779d3d6047afadf2ea62484723f", "p2673164/k$1a5c00764343c6fce9f9c0e9f1a54a50"]) }
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
        { id: "transparent", nom: "Transparent", hex: "#d5e6ea", clair: true, ref: "8946490",
          lien: "https://www.decathlon.fr/p/gourde-en-verre-avec-ouverture-facile/366458/c1m8946490",
          photos: dec(["p2825850/k$72511b4ca7fe13a13b316bff63d95bd8", "p2825851/k$a443fecd086d9a4ac0f584f293a78c5d", "p2825853/k$28a7df380de0919eb023d871c999c928", "p2825852/k$26b68c73aedfe9d24bddd2b6a6d6b40b"]) }
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
        { id: "bleu", nom: "Bleu", hex: "#2f5f9c", clair: false, ref: "8969347",
          lien: "https://www.decathlon.fr/p/casquette-de-randonnee-hike-100-bleu/302963/c43m8969347",
          photos: dec(["p3007477/k$c4ee85e8923af023082ec182f6539373", "p3069399/k$5bbd189ac0e77d180f5ea5d656a7d4f9", "p3016744/k$52c178f96531c5e2720f12302bc3b871", "p3007360/k$1cac46c835739a647cc7c8d0b431ad01", "p3007442/k$7f74ed468f0714f22232c36d6912f679", "p3007433/k$1a9e0ca625c26a49b0bdbf5ae2caf0de", "p3016753/k$11b2a51442c804301a0b5731042c99a7"]) }
      ],
      lien: "https://www.decathlon.fr/p/casquette-de-randonnee-hike-100-bleu/302963/c43m8969347",
      photos: [
        "https://contents.mediadecathlon.com/p3007477/k$c4ee85e8923af023082ec182f6539373/picture.jpg",
        "https://contents.mediadecathlon.com/p3069399/k$5bbd189ac0e77d180f5ea5d656a7d4f9/picture.jpg",
        "https://contents.mediadecathlon.com/p3016744/k$52c178f96531c5e2720f12302bc3b871/picture.jpg",
        "https://contents.mediadecathlon.com/p3007360/k$1cac46c835739a647cc7c8d0b431ad01/picture.jpg",
        "https://contents.mediadecathlon.com/p3007442/k$7f74ed468f0714f22232c36d6912f679/picture.jpg",
        "https://contents.mediadecathlon.com/p3007433/k$1a9e0ca625c26a49b0bdbf5ae2caf0de/picture.jpg",
        "https://contents.mediadecathlon.com/p3016753/k$11b2a51442c804301a0b5731042c99a7/picture.jpg"
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
        { id: "orange-fluo", nom: "Orange fluo", hex: "#f26b1d", clair: false, ref: "8070067",
          lien: "https://www.decathlon.fr/p/casquette-chasse-orange-100/6457/c379m8070067",
          photos: dec(["p1097439/k$826e8aef997002dede100ef04ef82e3c", "p1097447/k$8be0a2b27ab0c9de9ccda646ec633c4b", "p1097440/k$00c1fff8f33d36dd00d4fe8bf5a7561d", "p1097443/k$fe78240b64fd854bb0a05e3e365df5d6", "p1097446/k$7f95e487c18b1f1730c36669611c83e0", "p1097445/k$7b33299f5a15a1bb3e0e288492666442", "p1097441/k$0f9986d765e565080c95378a4c00df1b", "p1097444/k$9c64a37d5fda3b509655cc1d2dd10729", "p1097437/k$954148e0986892da56d7b60a20678023", "p1097442/k$cd0174a5868c4937fb4eb9411bcf8208", "p1097438/k$4a0ca07b58b3ed4df83de7c7c20ec0f7", "p2190806/k$7b403b8a09188619c82c3cf6c1e3b414", "p1866102/k$a4e7be8331aa6f8992d73513a5f437f9"]) }
      ],
      lien: "https://www.decathlon.fr/p/casquette-chasse-orange-100/6457/c379m8070067",
      photos: [
        "https://contents.mediadecathlon.com/p1097439/k$826e8aef997002dede100ef04ef82e3c/picture.jpg",
        "https://contents.mediadecathlon.com/p1097447/k$8be0a2b27ab0c9de9ccda646ec633c4b/picture.jpg",
        "https://contents.mediadecathlon.com/p1097440/k$00c1fff8f33d36dd00d4fe8bf5a7561d/picture.jpg",
        "https://contents.mediadecathlon.com/p1097443/k$fe78240b64fd854bb0a05e3e365df5d6/picture.jpg",
        "https://contents.mediadecathlon.com/p1097446/k$7f95e487c18b1f1730c36669611c83e0/picture.jpg",
        "https://contents.mediadecathlon.com/p1097445/k$7b33299f5a15a1bb3e0e288492666442/picture.jpg",
        "https://contents.mediadecathlon.com/p1097441/k$0f9986d765e565080c95378a4c00df1b/picture.jpg",
        "https://contents.mediadecathlon.com/p1097444/k$9c64a37d5fda3b509655cc1d2dd10729/picture.jpg",
        "https://contents.mediadecathlon.com/p1097437/k$954148e0986892da56d7b60a20678023/picture.jpg",
        "https://contents.mediadecathlon.com/p1097442/k$cd0174a5868c4937fb4eb9411bcf8208/picture.jpg",
        "https://contents.mediadecathlon.com/p1097438/k$4a0ca07b58b3ed4df83de7c7c20ec0f7/picture.jpg",
        "https://contents.mediadecathlon.com/p2190806/k$7b403b8a09188619c82c3cf6c1e3b414/picture.jpg",
        "https://contents.mediadecathlon.com/p1866102/k$a4e7be8331aa6f8992d73513a5f437f9/picture.jpg"
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8618832",
          lien: "https://www.decathlon.fr/p/casquette-tennis-artengo-tc-100-noir/330799/c382m8618832",
          photos: dec(["p2797307/k$8f8b4e2943235ab68cc72e10db7ef72d", "p2797309/k$f37cee2df404c61bf3e44836936515ae", "p2797308/k$a68032a48dc83dd7f39a233c934ff4d6", "p2797306/k$5eb2678324e016aada33ed4faa8f934e"]) },
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra", hex: "#f3f3f0", clair: true, ref: "8618831",
          lien: "https://www.decathlon.fr/p/casquette-tennis-artengo-tc-100-blanc/330799/c227m8618831",
          photos: dec(["p2797297/k$c8ef7b09627c8df42bbb2b074490617b", "p2797300/k$77d10008df861d8098c3470ce2a86319", "p2797296/k$e903b9049bef01601670e57ce3564261", "p2797299/k$c6ecfd3f598869a204a70d0087c2632f", "p2797298/k$bbcd69e590cc8f286880edf481a6b7c5"]) }
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8940552",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-noir/353824/c382m8940552",
          photos: dec(["p2996321/k$0405095409a073502d56dbc5dd025331", "p2996332/k$7cb7b3bca0774909dc86ab070fed452b", "p2996340/k$fb3ba52948e7438abce1de5dd10ee614", "p2996350/k$6ad1308f4e0a17018829658f93978edf"]) },
        { id: "marron-caramel", nom: "Marron caramel", nomDec: "marron caramel", hex: "#a8703a", clair: false, ref: "8940513",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-camel/353824/c152m8940513",
          photos: dec(["p2998997/k$677949a8d69ba6220a61e00dd6915fdf", "p2998978/k$8e5eb52212345d15dcc5306eee25195c", "p2999024/k$e6ee9d2c710d1d36e33e40c8f8ca4108", "p2999115/k$ccbe6bed994c61621cbf6240af1a990e", "p2975877/k$c60e0223e8ab32c5dd6fc15e0bd91af2", "p2975953/k$47a93fc7ad34d1a974b4fe8a20ba1a33", "p2975851/k$7ddb257e5921d666c17f19a11575b523", "p2975943/k$e1aafe685ec74db2947d623fd7610869", "p2975909/k$8d3f59d0840e96d0e50040cdabd64ad2"]) },
        { id: "blanc-coton", nom: "Blanc coton", nomDec: "blanc coton", hex: "#f1efe6", clair: true, ref: "8940507",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-blanc/353824/c183m8940507",
          photos: dec(["p3015639/k$118833de575f9b5260d07785fe870a7b", "p3015638/k$0e6c39d8404f79ac9d3af999571c830f", "p3015641/k$4ad123ccc6b801adcc2655b09601bc29", "p3015640/k$bdd6784ebd08ada727fede32c654cced", "p2956147/k$5397498d49e7a8990a8e391335984cde", "p2956119/k$fa946b266ae30202ec44e0e8137be9f5", "p2956134/k$f99b91d0671287012690dfbc28d4314d", "p2956126/k$58eed4bfb0ee701e44e63deddf4c2839", "p2956145/k$c943327771742e56b9792eb48f32bb0a", "p2956139/k$3b68ce2f33c1ea8b88de5343334c112d", "p2956142/k$750999b858a09db97bc84c7c4ef72480", "p2956140/k$5c2d4f8c863f8424600e024276e431c5", "p2956146/k$40c48fc9318f7974677c503155baf912", "p2975812/k$a2a7ec76a68344c7c5d577dc6cc1c6ee"]) },
        { id: "violet-fume", nom: "Violet fumé", nomDec: "violet fumé", hex: "#5d4a7a", clair: false, ref: "8940511",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-lilas/353824/c368m8940511",
          photos: dec(["p2999076/k$e6d2adba966a2538bc4feafb044314b7", "p2999038/k$708708390f7070147016be7a4250b24e", "p2998969/k$2d13d5471a3e67dfc322d948b8368887", "p2999017/k$66c25d2dd00c895706ed2aaddb32930f", "p2975729/k$e76c33029dc88e8113672e472fc2d050"]) },
        { id: "rose-tendre", nom: "Rose tendre", nomDec: "rose tendre", hex: "#f0b8c8", clair: true, ref: "8940512",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-rose/353824/c391m8940512",
          photos: dec(["p2999034/k$eb6cd41037a2747aad311f42c66173ce", "p2999011/k$bfdcacb9055d2b00175fdc77b2fff454", "p2999063/k$249c06d3b24ef3f9fea69e1ce50fac47", "p2998985/k$f9170e18400577bdb3f44369e5324520"]) },
        { id: "jaune-vanille", nom: "Jaune vanille", nomDec: "jaune vanille", hex: "#f1e08a", clair: true, ref: "8992939",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-jaune/353824/c269m8992939",
          photos: dec(["p3127441/k$6c87c85fe3647a0908c695e24765fd35", "p3127454/k$3916815d7cb7fd4d646d7bc0b7a018d2", "p3127428/k$9717600a6ee6950080ffac3d0cff7562", "p3127419/k$007e8d0248be3508378bb5ad180423ce"]) },
        { id: "blanc-beige-curry", nom: "Blanc, beige et curry", nomDec: "blanc coton / beige lin / jaune curry", hex: "#e9e1cc", clair: true, ref: "8946286", prixAchat: 4.99,
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-tricolor/353824/c183c179c290m8946286",
          photos: dec(["p2998999/k$d19913a837931c49b5ccf15c49c062ba", "p2999010/k$57746eff84aa093e84c979cf7842a1e7", "p2999082/k$bf76c5817d6c1abd0ed48fa4fa37c860", "p2999003/k$4f4ab4df7b69ed3952473a3912b11758"]) },
        { id: "vert-trefle", nom: "Vert trèfle", nomDec: "vert trèfle", hex: "#2e8b4a", clair: false, ref: "8940510", prixAchat: 4.99,
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-vert/353824/c186m8940510",
          photos: dec(["p2998961/k$17efff1335c5a8c1f32938abda095840", "p2999043/k$079bdbf2fe483f53d800340a027ae719", "p2999053/k$fda19c6ff0434b245a140836793ff303", "p2999020/k$5f31c677d4bb4cf65eb70a8bcfbbbfd7"]) },
        { id: "zebre-rose", nom: "Zèbre rose", nomDec: "rose pale / rose perle", hex: "#e8c4cc", clair: true, ref: "8993400",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-zebre-marron-et-rose/353824/c206c116m8993400",
          photos: dec(["p3127487/k$11ae02db06724bcbeb38d580f19fce23", "p3127479/k$138959b23631308b0474ced1a3fffabc", "p3127406/k$747edc8f266627ec4cb700096dc1a574", "p3127412/k$e48683b74c0a15a163b44e093330923f"]) },
        { id: "kaki-violet-blanc", nom: "Kaki, violet et blanc", nomDec: "khaki mangrove / violet fumé / blanc coton", hex: "#6f6b4e", clair: false, ref: "8946283", prixAchat: 4.99,
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-tricolor/353824/c337c368c183m8946283",
          photos: dec(["p2999000/k$712bb105416ae2b27d4da7cceef61e62", "p2999025/k$5b808ec07d5e01e288536580f168ca64", "p2998977/k$0228e1c3b90fb83939230995c8f83721", "p2999044/k$8c723d812e5128372ad82b3a7c402573", "p2998992/k$22a24dd39cd46cd54aeae323bd5b3bab", "p2999092/k$f2da1060d6886564737002e3447f7d36", "p2998959/k$c1a263ba1041afe889b98a25300f513e"]) },
        { id: "bleu-gris", nom: "Bleu et gris", nomDec: "bleu/gris charbon/bleu cosmos", hex: "#2a4a7a", clair: false, ref: "8940509",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-bleu-noir/353824/c5c76c43m8940509",
          photos: dec(["p2996339/k$9f335d56fefdf17d6912e08aa941d5f6", "p2996330/k$2b4fc844358cf1fd03d33c39d04ce97e", "p2996322/k$020eda70093a9bf2af88c30d0dca016a", "p2996348/k$a1ce0b34f12dea3f67794c38f169abac"]) },
        { id: "gris-noir", nom: "Gris et noir", nomDec: "gris carbone/gris charbon/noir fumé", hex: "#4b4e53", clair: false, ref: "8940508",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-gris/353824/c71c76c382m8940508",
          photos: dec(["p2999095/k$d2885eef41215df28168951c0c227ec6", "p2998963/k$29b53a6698e75e71e3f6baa98778b6f9", "p2999050/k$3e00a4314fd78f4a7a65f53d65b72b8f", "p2998979/k$5bbccb808f6e004635d552283e74fe08"]) },
        { id: "zebre-bleu", nom: "Zèbre bleu", nomDec: "bleu gris/gris rivière", hex: "#8aa2b8", clair: false, ref: "8993402",
          lien: "https://www.decathlon.fr/p/bonnet-a-revers-adulte-rider-500-zebre-bleu/353824/c7c193m8993402",
          photos: dec(["p3127476/k$7f5467e2c92d30a8f1041d13c4a096ee", "p3127401/k$da1b0274ce9ff2a2afca044e515583b4", "p3127422/k$280c84863af74c4fa7a12f8b8ed1afc4", "p3127431/k$22a593fd76de4f41bab2ab06e53c90f9"]) }
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8368935",
          lien: "https://www.decathlon.fr/p/bonnet-running-seamless-adulte-kiprun-noir/157211/c382m8368935",
          photos: dec(["p2698482/k$dfd2fb85ff5d9ba1a6f48e2687f66b4f", "p2698527/k$955f0023691923487cfec2eab5e16600", "p2709558/k$59197f2cf67320b6724f5504b631a83f", "p2709488/k$b8e557ff810876d8de4acde2387e5997"]) },
        { id: "gris-beton", nom: "Gris béton", nomDec: "gris béton", hex: "#a3a5a8", clair: true, ref: "8920402",
          lien: "https://www.decathlon.fr/p/bonnet-running-seamless-adulte-kiprun-gris-chine/157211/c208m8920402",
          photos: dec(["p2907013/k$781bf2b9efb314215d2ab011e03d304b", "p2907014/k$b544697fc1ee8d519c4b673618bc3166", "p2906445/k$112aee37af86bff6b11ac35680ad6c20", "p2907130/k$05156b22d59f5c4ae126761c817fdcbc", "p2906640/k$e8cc8ae6d162f59b3c4c8cee1ae1fd9f", "p2907197/k$eca0888ae917b1e0ec778aae2109e374"]) },
        { id: "violet-charbon", nom: "Violet charbon", nomDec: "violet charbon", hex: "#4b3a5c", clair: false, ref: "8920404",
          lien: "https://www.decathlon.fr/p/bonnet-running-seamless-adulte-kiprun-burgundi-chine/157211/c89m8920404",
          photos: dec(["p2907001/k$23c5a5a1daf854105e6c732efdf91034", "p2907073/k$ef6c633bc91f20bacbb9be8ca9a39267", "p2906620/k$6c64ad043d05960a6278892dabb8fbcc", "p2906521/k$886e7b8c3b1a801a66e341759a21f0c7", "p2983895/k$82ca666de9831e7432dfd585bbc0f41d", "p2983893/k$8b3fc3c4a5087c5b5f7c22e8186cc746", "p2983894/k$823dde8ed7c030443ec2962900005c5d", "p2983892/k$3f4c7ae398613d1a58f927d5c6c9c512"]) }
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
        { id: "blanc", nom: "Blanc", nomDec: "blanc", hex: "#f3f3f0", clair: true, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-white-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c4" },
        { id: "rouge", nom: "Rouge", nomDec: "rouge", hex: "#c4252b", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-classic-red-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c14" },
        { id: "jaune-fluo", nom: "Jaune fluo", nomDec: "jaune neon fluo", hex: "#e8f23a", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-fluorescent-yellow-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c142" },
        { id: "fuchsia", nom: "Fuchsia", nomDec: "rose fuchsia", hex: "#d02a82", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-fuchsia-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c144" },
        { id: "bordeaux", nom: "Bordeaux", nomDec: "bordeaux", hex: "#6e1e2c", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-burgundy-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c15" },
        { id: "violet", nom: "Violet", nomDec: "violet", hex: "#6a3d98", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-purple-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c16" },
        { id: "bleu-marine", nom: "Bleu marine", nomDec: "bleu marine", hex: "#1f2b4a", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-french-navy-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c189" },
        { id: "orange", nom: "Orange", nomDec: "orange", hex: "#f26b1d", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-orange-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c20" },
        { id: "vert-foret", nom: "Vert forêt", nomDec: "vert forêt", hex: "#1f5a3a", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-bottle-green-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c211" },
        { id: "bleu-royal", nom: "Bleu royal", nomDec: "bleu royal", hex: "#2450b0", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-bright-royal-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c218" },
        { id: "jaune", nom: "Jaune", nomDec: "jaune", hex: "#f4cf1e", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-yellow-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c22" },
        { id: "gris-graphite", nom: "Gris graphite", nomDec: "gris graphite", hex: "#4a4d52", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-graphite-grey-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c383" },
        { id: "vert-citron", nom: "Vert citron", nomDec: "vert citron", hex: "#b9d61e", clair: false, lien: "https://www.decathlon.fr/p/mp/tour-de-cou-morf-original-lime-green-one-size/ebff02ea-b01b-47fc-9a11-96387dce6de2/c78" }
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé / noir fumé", hex: "#1c1c1f", clair: false, ref: "8200579",
          lien: "https://www.decathlon.fr/p/sac-tube-pliable-move-100-30l/11233/c382c382m8200579",
          photos: dec(["p2426984/k$a23fd87487dd2b34bc73ef713d8fbebb", "p2426983/k$5502aaf623062f8aea8a278b48e5ae09", "p2426982/k$0110f7846493c95516b0585518557120", "p2426981/k$b955e7ca6e055d346efad537c4feb8c9", "p2426980/k$5b36f7a3da631bc77b166976dd8a4330", "p2426979/k$6f56af313748022ca10a87aa4ffb92c9"]) },
        { id: "bleu-marine", nom: "Bleu marine", nomDec: "bleu marine.", hex: "#1f2b4a", clair: false, ref: "8841252",
          lien: "https://www.decathlon.fr/p/sac-tube-pliable-move-100-30l/11233/c195m8841252",
          photos: dec(["p2627893/k$468dc66a0908f78f36fa3f2938283124", "p2627834/k$07963bffa0a34672b8abfdd61d003f67", "p2627808/k$4b85875c48f01b8a173abf3f79fac947", "p2627909/k$730d9c0a38c16c5df74fefd140b2fa8b", "p2627937/k$144998d0cc419fcb60066afa21c90192", "p2627848/k$2e218905a4c24d29d81eeb105dd4e682", "p2627902/k$31ddfd6997b430d2c4719bef5387e33f", "p2627843/k$477a8001186f9c1543442130ca835b8c", "p2627867/k$ad68e9cd50acb8c12dc88ee80c65d429"]) }
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
        { id: "noir", nom: "Noir", nomDec: "noir / -", hex: "#1c1c1f", clair: false, ref: "8917221",
          lien: "https://www.decathlon.fr/p/sac-de-sport-pliable-a-bandouliere-club-100-20l/324098/c1c344m8917221",
          photos: dec(["p2929783/k$252af5c5370166123bf235076a0440b6", "p2929786/k$43dbfbacf4c1a253402284338c637874", "p2929863/k$6ee8def6be95c0d92a3b693a5951491a", "p2929856/k$1eb10738ff3c85ffbdf0a4e9ba8276ce", "p2929845/k$6b6a94d9920af28841f881c96249924b", "p2929831/k$f7fa9ea498a4d168b1dbb4228491e575"]) },
        { id: "bleu-indigo", nom: "Bleu indigo", nomDec: "bleu indigo / noir / -", hex: "#2b3f7a", clair: false, ref: "8917223",
          lien: "https://www.decathlon.fr/p/sac-de-sport-pliable-a-bandouliere-club-100-20l/324098/c59c1c344m8917223",
          photos: dec(["p2929775/k$0fd6f8c5d56c21c1d16974dbd6c9856e", "p2929860/k$e83c7c3e39810c2b10d8ca32d482981d", "p2929851/k$0535533f24901ea307568b528a689a29", "p2929840/k$09e37a3b281cd8d363acf56b1fac132d", "p2929833/k$e161ab32b19d8e521fbbca25debb6b44", "p2929838/k$0adcf0a3a1dfa78f9ac9f4beeab3d911"]) },
        { id: "violet-amethyste", nom: "Violet améthyste", nomDec: "violet améthyste / violet nuit", hex: "#6b4a8f", clair: false, ref: "8917226",
          lien: "https://www.decathlon.fr/p/sac-de-sport-pliable-a-bandouliere-club-100-20l/324098/c95c190m8917226",
          photos: dec(["p2929816/k$f9a6f29de2e0b5bd9caba3c35725c838", "p2929803/k$3ab70ecc87e9857957cdb61307186749", "p2929791/k$6d2176de20800c403326c7c04f9f453f", "p2929776/k$a2d187669fdb062bb73ba8aa14793cb5", "p2929790/k$a1a7b91efc44d10ec9547d5617bd59ba", "p2929868/k$b753550a54cdd04f705bc3f451ffcc3c"]) }
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
        { id: "bleu-cosmos", nom: "Bleu cosmos", nomDec: "bleu cosmos", hex: "#2a4a7a", clair: false, ref: "8502149",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-50-bleu/301684/c43m8502149",
          photos: dec(["p2629748/k$839af1a28c54cbf0917d4ee9eeb9a961", "p2583201/k$48aa3a91dc7a64c6022f506d159281b7", "p2387660/k$02dc03defd940130b7d0669cffc8db9e", "p2629747/k$66d7d129daf8700c7aa9f49d70e5c205", "p2629745/k$2c43b5d7b24ddea4dceeed94213048d6", "p2629746/k$8abca6357c8eb12b914a97f853b43049", "p2629742/k$68799591647b6b5217a18063291595a5", "p2629743/k$361bf33af7dc5d3eb76f15be4029fee6", "p2629744/k$dd863e60b36b52b57a315791c04c2a3c"]) },
        { id: "beige-cendre", nom: "Beige cendré", nomDec: "beige cendré", hex: "#cdbfa8", clair: true, ref: "8988229",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-50-beige/301684/c407m8988229",
          photos: dec(["p3017085/k$0046e2e4d522c4daad6ef75010c08c9a", "p3079554/k$130c87d657714ca193a21e2119b448bf", "p3078203/k$0497871e4b400e805f5b7aaeebcc717e", "p3079485/k$5ad5a722a2dd8f1fc20139de61a15bac", "p3078125/k$a89417ad7bf4892ff42da72a7f668d46", "p3079421/k$608b37ac1f1f6df1c9f2907920af15c0", "p3079323/k$eba9685123051f8af898e90a8f63e119", "p3079494/k$b0034c67f1131e9d9bad6e9ab127b315", "p3079453/k$7094c3f8226482156fe7085b884ea006"]) }
      ],
      lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-50-bleu/301684/c43m8502149",
      photos: [
        "https://contents.mediadecathlon.com/p2629748/k$839af1a28c54cbf0917d4ee9eeb9a961/picture.jpg",
        "https://contents.mediadecathlon.com/p2583201/k$48aa3a91dc7a64c6022f506d159281b7/picture.jpg",
        "https://contents.mediadecathlon.com/p2387660/k$02dc03defd940130b7d0669cffc8db9e/picture.jpg",
        "https://contents.mediadecathlon.com/p2629747/k$66d7d129daf8700c7aa9f49d70e5c205/picture.jpg",
        "https://contents.mediadecathlon.com/p2629745/k$2c43b5d7b24ddea4dceeed94213048d6/picture.jpg",
        "https://contents.mediadecathlon.com/p2629746/k$8abca6357c8eb12b914a97f853b43049/picture.jpg",
        "https://contents.mediadecathlon.com/p2629742/k$68799591647b6b5217a18063291595a5/picture.jpg",
        "https://contents.mediadecathlon.com/p2629743/k$361bf33af7dc5d3eb76f15be4029fee6/picture.jpg",
        "https://contents.mediadecathlon.com/p2629744/k$dd863e60b36b52b57a315791c04c2a3c/picture.jpg"
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
        { id: "vert-acide", nom: "Vert acide", nomDec: "vert acide.", hex: "#b5d62b", clair: false, ref: "8576231",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-vert/309861/c34m8576231",
          photos: dec(["p2604498/k$983e8ee348648af5f50ba4a84c0e76f7", "p2581289/k$1e1de5e7184c98d1d7ec2bc1bdb4aeba", "p2581285/k$878514dc9b0467d2822d01e0bb39f09e", "p2581284/k$a831804e1636045d5ff80aa0491e10fa", "p2581268/k$5304fe4ff0dbea6787ce20b7983728d4"]) },
        { id: "gris-fonte", nom: "Gris fonte", nomDec: "gris fonte", hex: "#5a5d63", clair: false, ref: "8576230",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-gris/309861/c210m8576230",
          photos: dec(["p2601628/k$4d4920571deae88cf9689dbaec141867", "p2581278/k$bdd2dbeb23b6aa9d8452e3f4f65921af", "p2581286/k$21542c3bc361bd49529afbe8dd499afa", "p2581273/k$00d8deaa2d60d13caf2f9c90b8296174", "p2581267/k$3f8a48b2185cb782567ff226ce788052"]) },
        { id: "bleu-acier-noir", nom: "Bleu acier et noir", nomDec: "bleu acier / noir fumé", hex: "#3f5878", clair: false, ref: "8560404",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-bleu/309861/c364c382m8560404",
          photos: dec(["p2582536/k$8db9d91e66824d69158078797961e46f", "p1770519/k$5aba6378c6c25146b69276137e0268a3", "p1770504/k$e3590779f437fc211882a1369b029737", "p1770495/k$98a17b106fffff52b35df4f2bb4c5407", "p1770476/k$cf7cef89a359903132c8951f2e51a4cb"]) },
        { id: "noir", nom: "Noir", nomDec: "noir fumé / noir fumé", hex: "#1c1c1f", clair: false, ref: "8560403",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-noir/309861/c382c382m8560403",
          photos: dec(["p2621812/k$8586c9180d332fcb8d272fd305194274", "p1770474/k$407ed3549bcafba0656e8cc8cddd9b37", "p1770544/k$caee1f4f01b26cca11dc2d95222c4bbc", "p1770546/k$b766937803bf3f11909746be58fffb5b", "p1770511/k$e6494d73e01fd901d9522858382f01ed", "p1800999/k$a580b979cedd0cde02bea2be8a2ee0b4"]) },
        { id: "violet-pourpre-noir", nom: "Violet pourpre et noir", nomDec: "violet pourpre / noir fumé", hex: "#5c2d6e", clair: false, ref: "8560406",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-violet/309861/c403c382m8560406",
          photos: dec(["p2582473/k$1ed251737eb5b7e7e94dd9040e9f90ff", "p1800989/k$f6a4f1a680fc3c9c321e26396478b561", "p1800978/k$27c80de6aef860048a68c0ce7bf476aa", "p1800971/k$58d9ed5d21c22f8b2e34b43027497b1d", "p1801018/k$5ff64e8f07c78b7e73b5b80258eae164"]) },
        { id: "bleu-cendre-noir", nom: "Bleu cendré et noir", nomDec: "bleu cendré / noir fumé", hex: "#7a93ad", clair: false, ref: "9039490",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-poche-pliable-10l-travel-100-bleu/309861/c340c382m9039490",
          photos: dec(["p3128911/k$19d17d4cf989047aab4738e854ee64ef"]) }
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
        { id: "bleu-abysse", nom: "Bleu abysse", nomDec: "bleu abysse", hex: "#1a2f55", clair: false, ref: "8775637",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-bleu/344147/c246m8775637",
          photos: dec(["p2583162/k$b960ca7ce6f25d8338a60b6bc6eec750", "p2423150/k$50a11948ed80ca699d0c21f9c4ca7b1d", "p2876607/k$13a3fc1229ae7bf4ce7178ce6ecf9704", "p2423152/k$8be9e55068c470ac645e98adf9ad35a6", "p2423155/k$f1b59315b98b0d9c1844d2deb4c75924", "p2423153/k$f6a2be3453a981cebec85358ac5fb121", "p2423151/k$14e67936b34c5b2c0971c88e547faf28", "p2423148/k$81ea4bb0d98bf64858ef9deb0374c03d", "p2506262/k$9b73c6fc10b04c80f7c68876f0867c5b", "p2506253/k$17df3862e60e0fe5e735e969a5d39e25", "p2439400/k$93681dfdd016a7051eb5fe09afbe69d7"]) },
        { id: "violet-cerise", nom: "Violet cerise", nomDec: "violet cerise", hex: "#8a2b5f", clair: false, ref: "8844353",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-violet/344147/c271m8844353",
          photos: dec(["p2629816/k$ee92baa9c61fe9377dc0860caf486798", "p2651422/k$d9003662c1942b1439b9956caaf8a383", "p2629821/k$5402bdb3570c4bc7260c073d6f917b4e", "p2876607/k$13a3fc1229ae7bf4ce7178ce6ecf9704", "p2629820/k$ca3b2e5344fff192d17b9159cac80b75", "p2629818/k$e261b23d320b17c629da7a0ffd6cc9dc", "p2629815/k$72b817f3bc371a39c529562d3322db7c", "p2629819/k$1c9af7314a29e58d4c8d2455b4257c0c"]) },
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8775634",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-noir/344147/c382m8775634",
          photos: dec(["p3065951/k$adf80e1fd9ce4a38bc3c5596faa3604f", "p3065947/k$041bc0c99febc93fefc53339299aa4c6", "p2876607/k$13a3fc1229ae7bf4ce7178ce6ecf9704", "p3065961/k$4e339a604e6ceeaeb2e0b6df45fe25fc", "p3065989/k$4d3d6d831c6a01e91a696e68b2ab2c57", "p3065962/k$ddfd163b695e9616e5ffe56246857e8e", "p3065992/k$614e9baf264bfed0edd2b258258f7887", "p2506270/k$178dd7aba2e9f5e72ad12841018dd678", "p2506275/k$bb97fdd18f2f5b8041c9e237027aabe0"]) },
        { id: "blanc-vert", nom: "Blanc et vert", nomDec: "blanc / vert fumé", hex: "#e3ebe4", clair: true, ref: "8971381",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-fleur/344147/c4c311m8971381",
          photos: dec(["p3079407/k$79b60f18ec5f64c24ad83d2155ae918d", "p3078181/k$0f133e7eb4462ccc07c1a328022c9c41", "p3079357/k$551c9274d3e1a1d0cc054c7fb12789fe", "p3079536/k$fc526ca07036cbc40aa82d1ba8618b00", "p3079476/k$9dd7f66f798f1adfb8afe892e2f0f4c5", "p3079428/k$e9c5c8b4dba4b55370ea684e98945aeb", "p3079496/k$15ce9914977fd954f993401eac0698db", "p3079325/k$93f8a989720833d3a1643533fc6999e7"]) },
        { id: "marron-dore", nom: "Marron doré", nomDec: "marron doré", hex: "#b0803a", clair: false, ref: "8971382", prixAchat: 6.99,
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-marron/344147/c356m8971382",
          photos: dec(["p3080769/k$fa6db251677f1601262ca196c25c3397", "p3078200/k$390775aea6ab6bfba44ae6efd691609a", "p3078122/k$9ec27128d94abb8a1a07a6dbabe1ad95", "p3080838/k$96bf51dc694394f125314eb79aea5230", "p3080752/k$ee218f8b480c6a63d12d9aec477116dd", "p3080856/k$5419d82cd3acf9b74603464a95827c80", "p3080722/k$b055954ff0d66d21818d0e980efaf112", "p3080831/k$cc769de82c031a5ef2de5461a1fd748e", "p3080689/k$ed3e04ab17d6a9f1273055bd75461363"]) },
        { id: "vert-cedre", nom: "Vert cèdre", nomDec: "vert cèdre / vert abysse", hex: "#3b5f4a", clair: false, ref: "8919991", rupture: "2026-10-19",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-vert/344147/c273c328m8919991",
          photos: dec(["p2853402/k$173fa9dedc647c6c557cc87614cf293a", "p2852888/k$97734bb24cbf265766c7711247255951", "p2853400/k$2b3d18de12ae11c2cdf8d2364cb29aaa", "p2876607/k$13a3fc1229ae7bf4ce7178ce6ecf9704", "p2853401/k$acff5c43460b13f326952c4ff35b56fd", "p2853396/k$ca879568b7f07db7b19687018c2d1fdf", "p2853398/k$b8998be3d39c3d673c0926d3f388e083", "p2853395/k$27ad22dee301f7b0f918f839bfbc69fc", "p2853405/k$646534a01d0abc75b7f4f1dca8d74ca8"]) },
        { id: "orange-terracotta", nom: "Orange terracotta", nomDec: "orange terracotta / marron cannelle", hex: "#c4623a", clair: false, ref: "8971384", prixAchat: 6.99, rupture: "2026-10-19",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-orange/344147/c275c322m8971384",
          photos: dec(["p3079381/k$824654752017d16cfa9771e3bfe6de47", "p3078128/k$2a22624ddf8c620c2d84fab4eedd96df", "p3079329/k$8b5bbeded496777df4a20a0686913854", "p3078186/k$490ed1919d5825308dc38052e6d01d74", "p3079508/k$c04240082d7906f966cae4b322869a1b", "p3078104/k$a02f1ab99adada7c19578756f9cf8797", "p3079454/k$6c706010dafe356800f80de7c706db28", "p3079459/k$680fb1abc87b5563a87fe871d709d4d8", "p3079402/k$4f049dec0b8a4096b3f8f4131f5f4eb7", "p3079332/k$3649850b5f0422163108d11fec4c1ed7"]) }
      ],
      lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-10l-arpenaz-100-bleu/344147/c246m8775637",
      photos: [
        "https://contents.mediadecathlon.com/p2583162/k$b960ca7ce6f25d8338a60b6bc6eec750/picture.jpg",
        "https://contents.mediadecathlon.com/p2423150/k$50a11948ed80ca699d0c21f9c4ca7b1d/picture.jpg",
        "https://contents.mediadecathlon.com/p2876607/k$13a3fc1229ae7bf4ce7178ce6ecf9704/picture.jpg",
        "https://contents.mediadecathlon.com/p2423152/k$8be9e55068c470ac645e98adf9ad35a6/picture.jpg",
        "https://contents.mediadecathlon.com/p2423155/k$f1b59315b98b0d9c1844d2deb4c75924/picture.jpg",
        "https://contents.mediadecathlon.com/p2423153/k$f6a2be3453a981cebec85358ac5fb121/picture.jpg",
        "https://contents.mediadecathlon.com/p2423151/k$14e67936b34c5b2c0971c88e547faf28/picture.jpg",
        "https://contents.mediadecathlon.com/p2423148/k$81ea4bb0d98bf64858ef9deb0374c03d/picture.jpg",
        "https://contents.mediadecathlon.com/p2506262/k$9b73c6fc10b04c80f7c68876f0867c5b/picture.jpg",
        "https://contents.mediadecathlon.com/p2506253/k$17df3862e60e0fe5e735e969a5d39e25/picture.jpg",
        "https://contents.mediadecathlon.com/p2439400/k$93681dfdd016a7051eb5fe09afbe69d7/picture.jpg"
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
        { id: "gris-carbone", nom: "Gris carbone", nomDec: "gris carbone", hex: "#4b4e53", clair: false, ref: "8971389",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-20l-arpenaz-500-gris/350154/c71m8971389",
          photos: dec(["p3079444/k$017e8d9880a72409f2993b86a5106588", "p3078055/k$229fb4750a5698753c1aa6f98bd81362", "p3078145/k$86b5666bdf82ab7859a0c1027e9b3500", "p3079388/k$dcd3ad7a0b3c7ccdb4136f747467510d", "p3079315/k$7fdac7277807dbb10de219e80ae90b91", "p3079371/k$5bf8f00dd6f78ac6d289b31c0c568eda", "p3079422/k$67a6876acf3019de530888ba4044e345", "p3079473/k$8056c2aa4d895cc3bb43eab9f08d598a", "p3079526/k$72ebc2f55a261e5012594ccd1024349c", "p3079343/k$46a9e2faf8aeca05012aa9274e2a8437", "p3079328/k$de23c6f84158ae721785bb199590b2ce", "p3079364/k$a11889967808c2def079dff086ec45f1"]) },
        { id: "jaune-ocre", nom: "Jaune ocre", nomDec: "jaune ocre", hex: "#d4a017", clair: false, ref: "8971390", prixAchat: 29.99,
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-20l-arpenaz-500-jaune/350154/c247m8971390",
          photos: dec(["p3079450/k$33da7281fdaeeb395c087f0618db6310", "p3078080/k$60a7801c6b1d260da4175cfc905be389", "p3078172/k$07e9098c0a5e6cf2ac27c7ab47f44508", "p3079405/k$2fbef8b06edc7ab2f1bac18c76e7e6e5", "p3079344/k$27a56430a8e504d1158e26da66b966ab", "p3079499/k$2425b08e6f72d379f589998dfe26ae08", "p3079443/k$290387b83d4f285d5995e4935b101e9c", "p3079482/k$0d60656e9c823c345d2496cf2545ef99", "p3079551/k$adf47b264f0a69d3895083c5782daedf", "p3079350/k$701a9cad525f0f867e56b7cc276f1443", "p3079324/k$39c4d8210b89465a99e9270c47858843", "p3079399/k$4ad7a138198a10aec2c5bead9b783950"]) }
      ],
      lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-20l-arpenaz-500-gris/350154/c71m8971389",
      photos: [
        "https://contents.mediadecathlon.com/p3079444/k$017e8d9880a72409f2993b86a5106588/picture.jpg",
        "https://contents.mediadecathlon.com/p3078055/k$229fb4750a5698753c1aa6f98bd81362/picture.jpg",
        "https://contents.mediadecathlon.com/p3078145/k$86b5666bdf82ab7859a0c1027e9b3500/picture.jpg",
        "https://contents.mediadecathlon.com/p3079388/k$dcd3ad7a0b3c7ccdb4136f747467510d/picture.jpg",
        "https://contents.mediadecathlon.com/p3079315/k$7fdac7277807dbb10de219e80ae90b91/picture.jpg",
        "https://contents.mediadecathlon.com/p3079371/k$5bf8f00dd6f78ac6d289b31c0c568eda/picture.jpg",
        "https://contents.mediadecathlon.com/p3079422/k$67a6876acf3019de530888ba4044e345/picture.jpg",
        "https://contents.mediadecathlon.com/p3079473/k$8056c2aa4d895cc3bb43eab9f08d598a/picture.jpg",
        "https://contents.mediadecathlon.com/p3079526/k$72ebc2f55a261e5012594ccd1024349c/picture.jpg",
        "https://contents.mediadecathlon.com/p3079343/k$46a9e2faf8aeca05012aa9274e2a8437/picture.jpg",
        "https://contents.mediadecathlon.com/p3079328/k$de23c6f84158ae721785bb199590b2ce/picture.jpg",
        "https://contents.mediadecathlon.com/p3079364/k$a11889967808c2def079dff086ec45f1/picture.jpg"
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
        { id: "noir", nom: "Noir", hex: "#1c1c1f", clair: false, ref: "8649476",
          lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-montagne-20l-mh100-noir/331022/c382m8649476",
          photos: dec(["p2621198/k$783a358435d113ab4e549e29ac240c34", "p2437569/k$e32cf98daa696931994ce54f8f1473f3", "p2422482/k$9d18e9299bb2f2ab21207937d05a4703", "p2876589/k$2c2c69ecec490657df4e8eddd2f9cf9c", "p2422480/k$6a3323ae1bd68ef27c4731b234ae690d", "p2422483/k$23357dde00d7e4b91253dd9ca1f5981c", "p2422487/k$f9b0153f1a63fb0c0bbacf8ae9bcb65f", "p2422484/k$ba75950b6f94d4aa3939f563f2f2364f", "p2422485/k$079e167832d8d8cbcee99d2db815a5df", "p2422486/k$eccfcd31a3e51430bc0ca5469b8c8120", "p2422489/k$d15f42e254080aca56b3d9067ec36257", "p2422490/k$74dc195fc585007ae542fc58654e35e9", "p2422488/k$d464063792199dc320b45c9ecfeb216e", "p2428829/k$c59655b84e965a5179e6d0c869cc1199", "p2428828/k$b6663bba8bad06e940deb271052717fb", "p2428836/k$91249388db62ac30503c4ff9e418ebd1", "p2428834/k$9efd00eed35c7ee7d611fc93f5bf1747"]) }
      ],
      lien: "https://www.decathlon.fr/p/sac-a-dos-de-randonnee-montagne-20l-mh100-noir/331022/c382m8649476",
      photos: [
        "https://contents.mediadecathlon.com/p2621198/k$783a358435d113ab4e549e29ac240c34/picture.jpg",
        "https://contents.mediadecathlon.com/p2437569/k$e32cf98daa696931994ce54f8f1473f3/picture.jpg",
        "https://contents.mediadecathlon.com/p2422482/k$9d18e9299bb2f2ab21207937d05a4703/picture.jpg",
        "https://contents.mediadecathlon.com/p2876589/k$2c2c69ecec490657df4e8eddd2f9cf9c/picture.jpg",
        "https://contents.mediadecathlon.com/p2422480/k$6a3323ae1bd68ef27c4731b234ae690d/picture.jpg",
        "https://contents.mediadecathlon.com/p2422483/k$23357dde00d7e4b91253dd9ca1f5981c/picture.jpg",
        "https://contents.mediadecathlon.com/p2422487/k$f9b0153f1a63fb0c0bbacf8ae9bcb65f/picture.jpg",
        "https://contents.mediadecathlon.com/p2422484/k$ba75950b6f94d4aa3939f563f2f2364f/picture.jpg",
        "https://contents.mediadecathlon.com/p2422485/k$079e167832d8d8cbcee99d2db815a5df/picture.jpg",
        "https://contents.mediadecathlon.com/p2422486/k$eccfcd31a3e51430bc0ca5469b8c8120/picture.jpg",
        "https://contents.mediadecathlon.com/p2422489/k$d15f42e254080aca56b3d9067ec36257/picture.jpg",
        "https://contents.mediadecathlon.com/p2422490/k$74dc195fc585007ae542fc58654e35e9/picture.jpg",
        "https://contents.mediadecathlon.com/p2422488/k$d464063792199dc320b45c9ecfeb216e/picture.jpg",
        "https://contents.mediadecathlon.com/p2428829/k$c59655b84e965a5179e6d0c869cc1199/picture.jpg",
        "https://contents.mediadecathlon.com/p2428828/k$b6663bba8bad06e940deb271052717fb/picture.jpg",
        "https://contents.mediadecathlon.com/p2428836/k$91249388db62ac30503c4ff9e418ebd1/picture.jpg",
        "https://contents.mediadecathlon.com/p2428834/k$9efd00eed35c7ee7d611fc93f5bf1747/picture.jpg"
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
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8871353",
          lien: "https://www.decathlon.fr/p/bandeau-running-v2-homme-femme-kiprun-noir/352680/c382m8871353",
          photos: dec(["p2789056/k$f3e7b511c62ca6c1a8fa0b59de11a472", "p2789057/k$86a10d6e5970fb501472851a016de7b7", "p2789058/k$ef52f63b7f4cc6b003bbddf5af3aed9c", "p2788140/k$dd1271e614e7456bdb9f11ff99861a10", "p2788138/k$d348684f9e01ad25d8460f7a27a554e1", "p2788136/k$0ec13f4bb5905c707d35b51b0c262e42"]) },
        { id: "blanc", nom: "Blanc", nomDec: "blanc ultra", hex: "#f3f3f0", clair: true, ref: "8883077",
          lien: "https://www.decathlon.fr/p/bandeau-running-homme-femme-kiprun-blanc/352680/c227m8883077",
          photos: dec(["p3013292/k$f0336b8294ff2444d3cae807dd1fce47", "p3013064/k$c98ed05e9778479935c30072f01e6a72", "p3012156/k$6bd89725539f42aa44d7295882e131f9", "p3013028/k$633ec431e8f3c1e15edf55f5b61806cc", "p3012189/k$65927cbbfd6c32b594bf443f9986bb1f", "p3013212/k$dd2967f736acfdc8bc25c6926fcc5faf", "p3013267/k$9cefe00532f0c8317b07d81b625d8476"]) }
      ],
      lien: "https://www.decathlon.fr/p/bandeau-running-v2-homme-femme-kiprun-noir/352680/c382m8871353",
      photos: [
        "https://contents.mediadecathlon.com/p2789056/k$f3e7b511c62ca6c1a8fa0b59de11a472/picture.jpg",
        "https://contents.mediadecathlon.com/p2789057/k$86a10d6e5970fb501472851a016de7b7/picture.jpg",
        "https://contents.mediadecathlon.com/p2789058/k$ef52f63b7f4cc6b003bbddf5af3aed9c/picture.jpg",
        "https://contents.mediadecathlon.com/p2788140/k$dd1271e614e7456bdb9f11ff99861a10/picture.jpg",
        "https://contents.mediadecathlon.com/p2788138/k$d348684f9e01ad25d8460f7a27a554e1/picture.jpg",
        "https://contents.mediadecathlon.com/p2788136/k$0ec13f4bb5905c707d35b51b0c262e42/picture.jpg"
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
        { id: "jaune-vanille", nom: "Jaune vanille", nomDec: "jaune vanille / multicolore", hex: "#f1e08a", clair: true, ref: "8945385",
          lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-jaune/334226/c269c255m8945385",
          photos: dec(["p3089147/k$da1a3dbc249ba368a235a9e6aec6aa11", "p3141493/k$7cbe2b0b2b9e6a3bae03ce17c82a3be1", "p3089145/k$7b6b0888efa28144bf403f3f1603d636", "p3089146/k$153764c6e9a0431867b1fd01be55d2bf", "p3141492/k$7e9afff6e165b4acf497bf143a059eb9", "p3141488/k$ebf9df7b7d7a8f8a3f12422b3d1694a3", "p3141490/k$ef375b2cec512be0f2cce21cf1fb4ed3", "p3141494/k$3938445d7615d4b1c3bfafb1f9d27414", "p3141491/k$f591cd60096ed31964515a2404a86e58", "p3201991/k$96636821a464b89575d508d5171dbfa6", "p3201949/k$1f31402ed6f194b8a721dc6fb53e545a"]) },
        { id: "bleu-brumeux", nom: "Bleu brumeux", nomDec: "bleu brumeux", hex: "#9fb7cc", clair: true, ref: "8913258",
          lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-gris/334226/c143m8913258",
          photos: dec(["p2789104/k$00e958840852599b7e7c9c7802ddaa68", "p2789102/k$0107066cb095d2fc8b2031621117f7fa", "p2789103/k$9baffb6b49ff3a1f39c0d1a831fe4e04", "p2788299/k$aea55de9d04ad6ce21149bf935667739", "p2788302/k$dd391836e9631bd1887915e6c26406dd", "p2788303/k$24b0c6574c03a7ce961eb83be656d06d", "p2788305/k$bd732ee442d850f8f933c3ba7a4966da"]) },
        { id: "vert-givre", nom: "Vert givré", nomDec: "vert givré", hex: "#b7d8c3", clair: true, ref: "8945014",
          lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-unisexe-2-vert/334226/c241m8945014",
          photos: dec(["p3014061/k$284fe7cbddc05b8b7f013f4659db35a1", "p3013828/k$45ef7b6a0ddbf9911c67d8b11ada9149", "p3013928/k$9565edfdd228bda5d477cdb49ee7e873", "p3013880/k$12c0d60e36bd583db5ef3cd7e492e33e", "p3013975/k$3a67f3380a461c85c044a29bad960645", "p3014051/k$d7303b40e9a01921419348cc7cc6d9ce"]) },
        { id: "bleu-abysse", nom: "Bleu abysse", nomDec: "bleu abysse", hex: "#1a2f55", clair: false, ref: "8913259",
          lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-bleu-whale/334226/c246m8913259",
          photos: dec(["p2889017/k$15456fedb5d968bdfea9ccec9afa6ce4", "p2789099/k$071f767c3c31096ab53ad0666c12acd4", "p2789100/k$3daba511f52e8d6c261b7b133e14720e", "p2788294/k$c9d386cf7c0488a9176ffd06607820fe", "p2788295/k$c5182305ccfedead24335c8ee66c1c0f", "p2788296/k$2e398df2d40c2375c6aaae2dadb5f438", "p2788298/k$ab81e43928b2ebff533d1bec6ecf99d7"]) },
        { id: "noir", nom: "Noir", nomDec: "noir fumé", hex: "#1c1c1f", clair: false, ref: "8648869",
          lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-unisexe-2-noir/334226/c382m8648869",
          photos: dec(["p2713505/k$52559f7a50ab8921bbe8ae205e98744c", "p2605971/k$5865cc4092c0e5ef6c99512fbe073724", "p2708797/k$f4d69189c3a6c5f5de5ee7558419f20d", "p2708726/k$e702e32ecb47f6d755f7b042c18df14b", "p2708815/k$9efef4d012c6d2292edd8efd30fcc702", "p2623204/k$8c759435b302a2b25cfe27cd25917e9d", "p2708765/k$294c6f1d62f2c9246958f23711b1831f", "p2708706/k$0678530a6597f3df17c87df467b47a0b"]) }
      ],
      lien: "https://www.decathlon.fr/p/ceinture-de-running-smartphone-homme-femme-kiprun-basique-2-jaune/334226/c269c255m8945385",
      photos: [
        "https://contents.mediadecathlon.com/p3089147/k$da1a3dbc249ba368a235a9e6aec6aa11/picture.jpg",
        "https://contents.mediadecathlon.com/p3141493/k$7cbe2b0b2b9e6a3bae03ce17c82a3be1/picture.jpg",
        "https://contents.mediadecathlon.com/p3089145/k$7b6b0888efa28144bf403f3f1603d636/picture.jpg",
        "https://contents.mediadecathlon.com/p3089146/k$153764c6e9a0431867b1fd01be55d2bf/picture.jpg",
        "https://contents.mediadecathlon.com/p3141492/k$7e9afff6e165b4acf497bf143a059eb9/picture.jpg",
        "https://contents.mediadecathlon.com/p3141488/k$ebf9df7b7d7a8f8a3f12422b3d1694a3/picture.jpg",
        "https://contents.mediadecathlon.com/p3141490/k$ef375b2cec512be0f2cce21cf1fb4ed3/picture.jpg",
        "https://contents.mediadecathlon.com/p3141494/k$3938445d7615d4b1c3bfafb1f9d27414/picture.jpg",
        "https://contents.mediadecathlon.com/p3141491/k$f591cd60096ed31964515a2404a86e58/picture.jpg",
        "https://contents.mediadecathlon.com/p3201991/k$96636821a464b89575d508d5171dbfa6/picture.jpg",
        "https://contents.mediadecathlon.com/p3201949/k$1f31402ed6f194b8a721dc6fb53e545a/picture.jpg"
      ],
      vitrine: ["ceinture"],
      texteVitrine: "sur la face de la ceinture",
      avertissement: "Ceinture en tissu technique extensible : petit visuel, essai de pressage avant la série.",
      zones: {
        ceinture: { vue: "face", cx: 20, top: 11, w: 16, h: 9, label: "Face de la ceinture" }
      }
    },

    {
      id: "serviette-microfibre-l",
      nomCourt: "Serviette",
      nom: "Serviette de bain microfibre 80 × 130 cm",
      marque: "Nabaiji, Decathlon",
      modele: "serviette",
      demonstratif: "cette serviette",
      tags: { genre: ["homme", "femme"], style: "sport", sport: "Natation", type: "accessoire" },
      prixAchat: 7.99,
      matiere: "88 % polyester, 12 % polyamide",
      polyesterPct: 88,
      sublimation: false,   // pas de sublimation sur cet article (microfibre à poils courts)
      tailles: ["80 × 130 cm"],
      couleurs: [
        { id: "noir", nom: "Noir", nomDec: "noir fumé / bleu cobalt", hex: "#25262b", clair: false, ref: "8926376",
          lien: "https://www.decathlon.fr/p/serviette-de-bain-microfibre-taille-l-80-x-130-cm-noir/158325/c382c108m8926376",
          photos: dec(["p2865388/k$eddb725abb3671d1ba575bf8d6594599", "p2865425/k$7814c34ca268fd6877aaf070f44de378", "p2865553/k$c7b9514f3649390a0f64e74b293df2ec", "p2865452/k$135e14f1f1f6dfcd6bc9d19f74e2b72e"]) },
        { id: "rose", nom: "Rose", nomDec: "rose fuchsia / bleu de prusse", hex: "#d9488a", clair: false, ref: "8982010",
          lien: "https://www.decathlon.fr/p/serviette-de-bain-microfibre-ultra-compacte-taille-l-80-x-130-cm-rose/158325/c144c209m8982010",
          photos: dec(["p3034957/k$f20fdab6450d1979bc6da7c9cfe109ef", "p3035034/k$72f607b6a344de0f21085e0ab35517f9", "p3034970/k$1e2416b176dcbfcc43ad3991e6a9287f", "p3034992/k$a686cdc81fed6ccb3a63d0efce9093cd"]) },
        { id: "bleu", nom: "Bleu", nomDec: "bleu de prusse / orange flamme fluo", hex: "#1d5b86", clair: false, ref: "8584433",
          lien: "https://www.decathlon.fr/p/serviette-de-bain-microfibre-ultra-compacte-taille-l-80-x-130-cm-bleu/158325/c209c125m8584433",
          photos: dec(["p2865409/k$ad7d4b62e6bba4e4e105ea23c1a92de2", "p2865334/k$88afda3771cbc262a1f7c23ee7e78817", "p2865260/k$b8931f00bc8119497c321ba752b0643a", "p2865495/k$336f5a76367325628fe903937284cef6"]) },
        { id: "vert", nom: "Vert", nomDec: "vert cèdre / vert aquamarine", hex: "#2f6f58", clair: false, ref: "8543246",
          lien: "https://www.decathlon.fr/p/serviette-de-bain-microfibre-ultra-compacte-taille-l-80-x-130-cm-vert/158325/c273c192m8543246",
          photos: dec(["p2865253/k$2547504643f656e62baed9b5d5b34a58", "p2865378/k$b985270d91ba6bc97b213399baddc868", "p2865438/k$15ccfa00548955e936a836daef8bb88a", "p2865459/k$75c1236fce369d2ff392e7ff68b8e02d", "p2786824/k$8bd0e85a2d557d3f6907a9cae876346e"]) },
        { id: "violet-lilas", nom: "Violet lilas", nomDec: "violet lilas / violet nuit", hex: "#a78bd0", clair: false, ref: "8797394",
          lien: "https://www.decathlon.fr/p/serviette-de-bain-microfibre-ultra-compacte-taille-l-80-x-130-cm-lila/158325/c338c190m8797394",
          photos: dec(["p2865337/k$56fc1d130fe618eba601613410dc2119", "p2865397/k$865116dbf538c4f550ad57ace1c83570", "p2865486/k$a7fb198bb0156cf6613eed9cf9360f87", "p2865259/k$cd035036ce33083d0c01cc6ec6304f75"]) },
        { id: "orange", nom: "Orange", nomDec: "orange kumquat / orange pastel corail", hex: "#f08a1c", clair: false, ref: "8982011",
          lien: "https://www.decathlon.fr/p/serviette-de-bain-microfibre-ultra-compacte-taille-l-80-x-130-cm-orange/158325/c353c199m8982011",
          photos: dec(["p3034950/k$2a364f9cb0f3eb48bf25e9e00ff71bec", "p3035003/k$a8f3e8cc08cea03053a4b006a03c04cf", "p3034945/k$adfc051049883e3ca17e4f1cfe6f7497", "p3034966/k$952046f0179cd1ff283f89b62f4630f1", "p3100397/k$776e1702540a84686a75fb49b1d91a89", "p3051102/k$9c573f563148b139b103c6f7d966f1b5", "p3051119/k$063dad81a111395cb93bc138855dbc0b"]) }
      ],
      lien: "https://www.decathlon.fr/p/serviette-de-bain-microfibre-taille-l-80-x-130-cm-noir/158325/c382c108m8926376",
      photos: [
        "https://contents.mediadecathlon.com/p2865388/k$eddb725abb3671d1ba575bf8d6594599/picture.jpg",
        "https://contents.mediadecathlon.com/p2865425/k$7814c34ca268fd6877aaf070f44de378/picture.jpg",
        "https://contents.mediadecathlon.com/p2865553/k$c7b9514f3649390a0f64e74b293df2ec/picture.jpg",
        "https://contents.mediadecathlon.com/p2865452/k$135e14f1f1f6dfcd6bc9d19f74e2b72e/picture.jpg"
      ],
      vitrine: ["serviette"],
      texteVitrine: "en bas de la serviette",
      avertissement: "Serviette microfibre : le transfert DTF se pose sur le tissu à poils courts, avec une chaleur modérée. Fabr'Icam fait un essai (tenue, lavage) avant la série.",
      zones: {
        serviette: { vue: "face", cx: 45, top: 98, w: 40, h: 32, label: "Bas de la serviette" }
      }
    },
    {
      id: "ouvre-bouteille-carte",
      nomCourt: "Ouvre-bouteille carte",
      nom: "Ouvre-bouteille format carte de crédit",
      marque: "Sans marque, AliExpress",
      modele: "ouvre-bouteille",
      demonstratif: "cet ouvre-bouteille",
      tags: { genre: ["homme", "femme"], style: "casual", type: "accessoire" },
      vendeur: "qst-express-02",   // vendeur AliExpress : livré à Fabr'Icam, port et délai dans prix.js (livraisonVendeur)
      technique: "gravure",        // gravé au laser ou marqué en vinyle thermocollant : ni planche DTF ni coût de planche
      prixAchat: 1.81,
      matiere: "Acier inoxydable",
      polyesterPct: 0,
      sublimation: false,
      tailles: ["Taille unique"],
      couleurs: [
        { id: "noir-pique", nom: "Noir, pique", nomDec: "Black", hex: "#1c1c1f", clair: false,
          lien: "https://fr.aliexpress.com/item/1005005906667194.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/Sa59fecac61864b1ba3543c12bc20dbf0I.jpg"] },
        { id: "argent-pique", nom: "Argent, pique", nomDec: "Silver", hex: "#c9ccd1", clair: true, prixAchat: 1.91,
          lien: "https://fr.aliexpress.com/item/1005005906667194.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/Sa2e1b4d3de294304ba0cdc7bad7d8ea42.jpg"] },
        { id: "anthracite-decapsuleur", nom: "Anthracite, décapsuleur", nomDec: "A", hex: "#2e3035", clair: false, prixAchat: 2.08,
          lien: "https://fr.aliexpress.com/item/1005005906667194.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/S7b3c3556ccc4446eb2fe56b6c672c63fk.jpg"] },
        { id: "argent-trefle", nom: "Argent, trèfle", nomDec: "B", hex: "#c9ccd1", clair: true, prixAchat: 2.12,
          lien: "https://fr.aliexpress.com/item/1005005906667194.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/Sab3627d0289e4b928d8432477e71f848r.jpg"] },
        { id: "noir-trefle", nom: "Noir, trèfle", nomDec: "C", hex: "#1c1c1f", clair: false, prixAchat: 2.12,
          lien: "https://fr.aliexpress.com/item/1005005906667194.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/S4d520e709e6f4e94844a6b995d3f9731x.jpg"] }
      ],
      lien: "https://fr.aliexpress.com/item/1005005906667194.html",
      photos: ["https://ae-pic-a1.aliexpress-media.com/kf/Sa59fecac61864b1ba3543c12bc20dbf0I.jpg"],
      vitrine: ["ouvre_bouteille"],
      texteVitrine: "sur la face de l'ouvre-bouteille",
      avertissement: "Ouvre-bouteille en métal : pas de transfert DTF, le visuel est gravé au laser ou posé en vinyle thermocollant (visuel simple, en une couleur, en vecteur de préférence). La fiche annonce 13 × 11 × 2 cm, une carte de crédit mesure d'ordinaire 8,5 × 5,4 cm : Fabr'Icam confirme la place du motif à la réception et fait un essai avant la série.",
      zones: {
        ouvre_bouteille: { vue: "face", cx: 12, top: 7.8, w: 5.2, h: 5.2, label: "Face de l'ouvre-bouteille" }
      }
    },
    {
      id: "porte-cles-decapsuleur",
      nomCourt: "Porte-clés décapsuleur",
      nom: "Porte-clés décapsuleur 4 en 1 en aluminium",
      marque: "Sans marque, AliExpress",
      modele: "porte-cles",
      demonstratif: "ce porte-clés",
      tags: { genre: ["homme", "femme"], style: "casual", type: "accessoire" },
      vendeur: "shop4293023",      // vendeur AliExpress : livré à Fabr'Icam, port et délai dans prix.js (livraisonVendeur)
      technique: "gravure",        // gravé au laser ou marqué en vinyle thermocollant : ni planche DTF ni coût de planche
      prixAchat: 1.46,
      matiere: "Aluminium",
      polyesterPct: 0,
      sublimation: false,
      tailles: ["Taille unique"],
      couleurs: [
        { id: "argent", nom: "Argent", nomDec: "SL", hex: "#c8ccd2", clair: true,
          lien: "https://fr.aliexpress.com/item/1005001781443550.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/S3b53d36c92e74c35a1b8dbc46cf819b4f.jpg"] },
        { id: "noir", nom: "Noir", nomDec: "BK", hex: "#1c1c1f", clair: false, prixAchat: 1.66,
          lien: "https://fr.aliexpress.com/item/1005001781443550.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/Sf5443a094fb7459abae268bfa68a0682v.jpg"] },
        { id: "rose-fuchsia", nom: "Rose fuchsia", nomDec: "rose rouge", hex: "#d6246e", clair: false, prixAchat: 1.64,
          lien: "https://fr.aliexpress.com/item/1005001781443550.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/S1e30740c5f5848b9a280a1f11dc085edv.jpg"] },
        { id: "jaune-dore", nom: "Jaune doré", nomDec: "YE", hex: "#f0a81c", clair: false, prixAchat: 1.61,
          lien: "https://fr.aliexpress.com/item/1005001781443550.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/S42997bf2c2da4301a61a15efb504c1e0R.jpg"] },
        { id: "violet", nom: "Violet", nomDec: "PR", hex: "#8a2fc0", clair: false, prixAchat: 1.62,
          lien: "https://fr.aliexpress.com/item/1005001781443550.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/S27afbeeb8df54fce8ddd9ed97cfa6449k.jpg"] },
        { id: "rouge", nom: "Rouge", nomDec: "RE", hex: "#c4252b", clair: false, prixAchat: 1.59,
          lien: "https://fr.aliexpress.com/item/1005001781443550.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/S0cea43c8f46a4766a4e05ef8490690e2V.jpg"] },
        { id: "vert", nom: "Vert", nomDec: "GR", hex: "#1f9e4a", clair: false, prixAchat: 1.56,
          lien: "https://fr.aliexpress.com/item/1005001781443550.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/Sd2aad626109c4a9b8003086cf2deca3cp.jpg"] },
        { id: "bleu", nom: "Bleu", nomDec: "BL", hex: "#2447c4", clair: false, prixAchat: 1.66,
          lien: "https://fr.aliexpress.com/item/1005001781443550.html",
          photos: ["https://ae-pic-a1.aliexpress-media.com/kf/S8c4a25ff0e284482985d3bf29cf6a2692.jpg"] }
      ],
      lien: "https://fr.aliexpress.com/item/1005001781443550.html",
      photos: ["https://ae-pic-a1.aliexpress-media.com/kf/S3b53d36c92e74c35a1b8dbc46cf819b4f.jpg"],
      vitrine: ["porte_cles"],
      texteVitrine: "sur la face du porte-clés",
      avertissement: "Porte-clés en aluminium : pas de transfert DTF, le visuel est gravé au laser ou posé en vinyle thermocollant. La barre ne mesure qu'environ 2 cm de large : un tout petit visuel seulement (Micro, 1,5 × 3 cm). La fiche annonce 5 × 5 × 5 cm, ce sont les dimensions du colis : Fabr'Icam confirme la place du motif à la réception et fait un essai avant la série.",
      zones: {
        porte_cles: { vue: "face", cx: 7, top: 5.5, w: 1.7, h: 3.2, label: "Face du porte-clés" }
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
