/*
 * APPLICATION : vitrine, configurateur, devis par mail.
 * L'atelier (page interne atelier.html) réutilise ces fonctions : il charge ce fichier avec window.ATELIER_PAGE = true,
 * et la vitrine ne démarre alors pas.
 */
(function () {
  "use strict";

  var DATA = window.DATA, PRIX = window.PRIX, E = window.Engine, P = window.Preview;
  var esc = P.esc;
  var byId = {};
  DATA.produits.forEach(function (p) { byId[p.id] = p; });
  var EMP_ORDER = ["poitrine", "dos", "manche_g", "manche_d", "cuisse_g", "cuisse_d", "bas_jambe_g", "chaussette_g", "chaussette_d",
    "sac", "gourde", "casquette", "bonnet", "tour_de_cou", "bandeau", "ceinture", "serviette", "ouvre_bouteille", "porte_cles"];
  var QUANTITES_VITRINE = [1, 5, 10, 20, 50];

  var nfEUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
  function fmtEUR(n) { return nfEUR.format(n); }
  function fmtN(n) { return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------------- mesure de texte (polices réelles du navigateur) ---------------- */
  var cv = document.createElement("canvas").getContext("2d");
  function measure(text, police, hauteur) {
    cv.font = '200px "' + police + '", Impact, sans-serif';
    var m = cv.measureText(text), cap = cv.measureText("H").actualBoundingBoxAscent || 140;
    var k = hauteur / cap;
    var asc = (m.actualBoundingBoxAscent || cap) * k, desc = Math.max(m.actualBoundingBoxDescent || 0, 0) * k;
    return { w: Math.max(m.width * k, 0.5), h: Math.max(asc + desc, hauteur), fontCm: 200 * k, asc: asc };
  }
  var fontsAsked = {};
  function ensureFont(f) {
    if (fontsAsked[f] || !document.fonts || !document.fonts.load) return;
    fontsAsked[f] = true;
    document.fonts.load('200px "' + f + '"', "AÉHg0").then(function () { scheduleRefresh(); }, function () {});
  }

  var CTX = { prix: PRIX, produits: byId, emplacements: DATA.emplacements, measure: measure };

  /* ---------------- état de la commande en cours ---------------- */
  var S = { pieces: [], nextId: 1, marquages: null, technique: "dtf", vue: "face", mode: "auto", previewId: null,
    contact: { asso: "", nom: "", email: "", tel: "", date: "", message: "" }, result: null,
    entryId: null, addModel: null, sel: null };
  function itemOf(id) { return byId[id]; }
  // Mails : on ouvre Gmail (rédaction d'un message dans un nouvel onglet), pas l'application de mail installée sur l'ordinateur.
  function gmailHref(to, subject, body) {
    return "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(to) +
      (subject ? "&su=" + encodeURIComponent(subject) : "") + (body ? "&body=" + encodeURIComponent(body) : "");
  }
  function gmailLink(a, href) { a.href = href; a.target = "_blank"; a.rel = "noopener"; }
  // Mail pré-rempli pour demander un vêtement qui n'est pas au catalogue
  function autreVetementHref() {
    var body = ["Bonjour,", "", "Je voudrais faire floquer un vêtement qui n'est pas dans le catalogue.", "",
      "Association :", "Vêtement souhaité (lien du produit, marque, couleur) :", "Nombre de pièces et tailles :",
      "Marquages souhaités (visuel, prénoms, numéros, emplacements) :", "Date souhaitée :", "", "Merci,"].join("\n");
    return gmailHref(DATA.service.email, "Demande de flocage, vêtement hors catalogue", body);
  }
  // Filtres du catalogue : une valeur par groupe, "" = tous
  var FILTRE = { categorie: "", genre: "", style: "" };
  function tagsOf(item) { return item.tags || {}; }

  // Catégories : l'ordre de DATA.categories est celui du menu, de la barre et des rayons du catalogue
  var CATEGORIES = DATA.categories || [];
  var RANG_CATEGORIE = {};
  CATEGORIES.forEach(function (c, i) { RANG_CATEGORIE[c.id] = i; });
  function categoriesOf(item) { return tagsOf(item).categories || []; }
  function categorieLabel(id) { return CATEGORIES.filter(function (c) { return c.id === id; })[0].label; }
  // Rayon d'un article : sa première catégorie (c'est là qu'il apparaît quand aucune catégorie n'est choisie)
  function rayonOf(item) { return categoriesOf(item)[0] || ""; }
  // Ordre du catalogue : par rayon, et dans un rayon les vêtements Decathlon, puis les vêtements apportés
  function catalogueItems() {
    var tous = DATA.produits.filter(function (p) { return !p.apporte; }).concat(DATA.produits.filter(function (p) { return p.apporte; }));
    return tous.map(function (item, i) { return { item: item, i: i, rang: RANG_CATEGORIE[rayonOf(item)] }; })
      .sort(function (a, b) { return a.rang - b.rang || a.i - b.i; })
      .map(function (x) { return x.item; });
  }
  function compteCategorie(id) {
    return catalogueItems().filter(function (it) { return !id || categoriesOf(it).indexOf(id) >= 0; }).length;
  }
  // Matière d'une pièce apportée (champ matiere de la pièce) : { id, nom, court }
  function matiereDe(p) {
    var l = DATA.matieres || [];
    return l.filter(function (m) { return m.id === p.matiere; })[0] || l.filter(function (m) { return m.id === "inconnu"; })[0] || { id: "inconnu", nom: "Je ne sais pas", court: "matière inconnue" };
  }
  function matchFiltre(item) {
    var t = tagsOf(item);
    if (FILTRE.categorie && categoriesOf(item).indexOf(FILTRE.categorie) < 0) return false;
    if (FILTRE.genre && (t.genre || []).indexOf(FILTRE.genre) < 0) return false;
    if (FILTRE.style && t.style && t.style !== FILTRE.style) return false;
    return true;
  }
  // Nom d'une ligne de prix : le produit
  function groupName(g) {
    return byId[g.produitId].nomCourt;
  }

  // Article d'un vendeur en ligne (place de marché Decathlon ou AliExpress) : frais de port estimés dans prix.js (livraisonVendeur)
  function vendeurInfo(prod) {
    if (!prod || !prod.vendeur) return null;
    var lv = PRIX.livraisonVendeur || {}, d = (lv.vendeurs || {})[prod.vendeur] || {};
    return { id: prod.vendeur, nom: d.nom || prod.vendeur, frais: d.frais != null ? d.frais : (lv.defaut || 0), delai: d.delai || "", lien: d.lien || "", plateforme: d.plateforme || "Decathlon", note: d.note || "" };
  }
  // Photos d'une couleur (la série de photos de cette couleur sur Decathlon), à défaut celles de l'article
  function photosOf(prod, col) { return col && col.photos && col.photos.length ? col.photos : (prod.photos || []); }
  // Page Decathlon de l'article dans cette couleur
  function lienOf(prod, col) { return (col && col.lien) || prod.lien || ""; }
  // Raccourcis vers le vendeur de la pièce : la page de l'article dans cette couleur, et la boutique du vendeur si on la connaît.
  // Un article en magasin n'a qu'un lien, vers Decathlon.
  function liensVendeur(prod, col) {
    var v = vendeurInfo(prod), art = lienOf(prod, col), out = [];
    if (art) out.push({ href: art, texte: v ? "Voir l'article chez " + v.nom : "Voir l'article sur Decathlon", art: true });
    if (v && v.lien) out.push({ href: v.lien, texte: "Boutique de " + v.nom, art: false });
    return out;
  }
  function liensHTML(prod, col) {
    var rupt = col && col.rupture && /^\d{4}-\d{2}-\d{2}$/.test(col.rupture)
      ? '<span class="rupt-note">Cette couleur était en rupture de stock chez Decathlon le ' + esc(col.rupture.slice(8) + "/" + col.rupture.slice(5, 7)) + " : Fabr'Icam confirme sa disponibilité avant de commander.</span>" : "";
    return liensVendeur(prod, col).map(function (l) {
      return '<a class="lien-ext" href="' + esc(l.href) + '" target="_blank" rel="noopener noreferrer">' + esc(l.texte) + '<span class="sr"> (nouvelle fenêtre)</span></a>';
    }).join("") + rupt;
  }
  // Texte d'information pour un ou plusieurs articles d'un même vendeur (noms : liste de noms à citer en tête, facultatif)
  function vendeurTexte(prod, noms) {
    var v = vendeurInfo(prod); if (!v) return "";
    var pl = noms && noms.length > 1;
    return (noms ? noms.join(", ") + " : " + (pl ? "articles vendus" : "article vendu") : (pl ? "Articles vendus" : "Article vendu")) + " par " + v.nom + (v.plateforme === "AliExpress" ? " sur AliExpress" : v.plateforme === "Amazon" ? (v.id === "amazon" ? "" : " sur Amazon") : " sur la place de marché Decathlon") + ". " +
      (pl ? "Ils sont livrés" : "Il est livré") + " à Fabr'Icam par le vendeur" + (v.delai ? " (" + v.delai + ")" : "") + ", sans retrait en magasin. " +
      (v.frais > 0 ? "Les frais de port du vendeur, estimés à " + fmtEUR(v.frais) + " pour toute la commande chez lui, sont compris dans le prix. " : v.note ? v.note + " " : "") +
      "Une fois floqué" + (pl ? "s" : "") + ", " + (pl ? "ils ne sont" : "il n'est") + " ni repris ni échangé" + (pl ? "s" : "") + ".";
  }
  // « 2XL seulement », « XS, S et 2XL » ou « XS à 3XL »
  function taillesTxt(pr) {
    var a = pr.tailles;
    if (a.length === 1) return /unique/i.test(a[0]) ? "taille unique" : a[0] + " seulement";
    return a.length <= 4 ? a.slice(0, -1).join(", ") + " et " + a[a.length - 1] : a[0] + " à " + a[a.length - 1];
  }

  function darkColor(prod) { return P.lum(prod.couleurs[0].hex) < 0.5; }

  function newMarquage(empId, prod) {
    var emp = DATA.emplacements[empId], f = emp.formats;
    var big = empId === "dos", tiny = empId === "bas_jambe_g" || /^chaussette/.test(empId), small = /^(manche|cuisse)/.test(empId);
    var mini = /^(gourde|casquette|bonnet|tour_de_cou|bandeau|ceinture|ouvre_bouteille|porte_cles)$/.test(empId);   // accessoires : très petite surface
    var micro = empId === "porte_cles";   // barre de 2 cm de large : texte minuscule
    var txt = darkColor(prod) ? "#ffffff" : "#14213d";
    var fmt = f.length ? (big ? f[f.length - 1] : f[0]) : "A6";
    var base = {
      actif: false, avecImage: !emp.texteSeul, image: null,
      format: f.length ? (big ? f[f.length - 1] : f[0]) : "A6", orient: "portrait",
      largeur: E.largeurPourFormat(fmt, 0, 0, CTX), libre: false, rot: 0, dx: 0, dy: 0,      // taille libre, quart de tour et position du visuel (version 6.2.0)
      prenom: { actif: false, hauteur: big ? 4 : tiny ? 2.5 : small ? 1.5 : micro ? 0.5 : mini ? 1.2 : 2, police: "Bebas Neue", couleur: txt },
      numero: { actif: false, hauteur: big ? 14 : tiny ? 3.5 : small ? 4 : micro ? 1 : mini ? 2.5 : 5, police: "Bebas Neue", couleur: txt },
      maj: true, textePos: "dessous",
      bloc: true      // prénom et numéro collés au visuel : un seul transfert, pressé d'un coup (voir moteur, stackFor)
    };
    if (emp.texteLibre) base.texte = texteLibreDefaut(txt);
    return base;
  }
  // Texte libre (version 7.3.0, gourdes) : une phrase sur plusieurs lignes, identique sur toute la commande
  function texteLibreDefaut(couleur) {
    return { actif: false, valeur: "", police: "Bebas Neue", hauteur: 1.2, interligne: 1.5, couleur: couleur, rot: 0, dx: 0, dy: 0 };
  }

  // Couleur cliquée sur la carte d'un article du catalogue (produit -> identifiant de couleur) : la commande démarre dans cette couleur.
  // Vidée à chaque affichage de la vitrine, où les cartes repartent de leur première couleur.
  var COULEUR_CARTE = {};
  function couleurChoisie(item) {
    var id = COULEUR_CARTE[item.id];
    return id && item.couleurs.some(function (c) { return c.id === id; }) ? { couleurId: id } : null;
  }

  function newPiece(prod, over) {
    var p = { id: "p" + (S.nextId++), produitId: prod.id, couleurId: prod.couleurs[0].id, taille: prod.tailles[Math.min(1, prod.tailles.length - 1)], prenom: "", numero: "" };
    if (prod.apporte) p.matiere = "inconnu";   // vêtement apporté : la matière se choisit sur la pièce
    return Object.assign(p, over || {});
  }

  // Ajoute n pièces du modèle choisi
  function addModel(id, n) {
    var last = S.pieces[S.pieces.length - 1];
    for (var i = 0; i < n; i++) {
      var same = last && last.produitId === id ? last : null;
      S.pieces.push(newPiece(byId[id], same ? { couleurId: same.couleurId, taille: same.taille } : {}));
    }
  }

  function ensureState(item) {
    var prods = [item];
    if (!S.marquages) {
      S.marquages = {};
      EMP_ORDER.forEach(function (e) { S.marquages[e] = newMarquage(e, prods.filter(function (pr) { return pr.zones[e]; })[0] || prods[0]); });
      (item.vitrine || ["poitrine"]).forEach(function (e) {   // même configuration que le prix affiché sur la vitrine
        if (!S.marquages[e]) return;
        S.marquages[e].actif = true;
        if (DATA.emplacements[e].texteSeul) S.marquages[e].prenom.actif = true;
      });
    }
    if (!S.pieces.length) S.pieces = [newPiece(item, couleurChoisie(item))];
    if (!S.addModel) S.addModel = item.id;
    fixPreview();
  }

  function fixPreview() {
    if (!S.previewId || !S.pieces.some(function (p) { return p.id === S.previewId; })) S.previewId = S.pieces[0].id;
  }

  // Commande encore vierge : on peut la remplacer sans rien perdre
  function pristine() {
    return S.pieces.length <= 1 && S.pieces.every(function (p) { return !p.prenom && !p.numero; }) &&
      EMP_ORDER.every(function (e) { var m = S.marquages[e]; return !m.image && (DATA.emplacements[e].texteSeul || (!m.prenom.actif && !m.numero.actif && !(m.texte && m.texte.actif))); });
  }

  // Arrivée sur un produit depuis la vitrine : on repart de zéro si la commande est vierge, sinon on l'ajoute à la commande
  function enter(item) {
    var coul = couleurChoisie(item);
    if (S.marquages && S.entryId !== item.id) {
      if (pristine()) { S.marquages = null; S.pieces = []; S.previewId = null; S.technique = "dtf"; S.addModel = null; }
      else {
        S.pieces = S.pieces.concat([newPiece(item, coul)]);
        S.addModel = item.id;
        toast((item.nomCourt || item.nom) + " ajouté à la configuration en cours.");
      }
    } else if (S.marquages && coul && !S.pieces.some(function (x) { return x.produitId === item.id && x.couleurId === coul.couleurId; })) {
      // Retour sur le même article dans une autre couleur : une commande vierge change de couleur, sinon la pièce s'ajoute
      if (pristine()) S.pieces.forEach(function (x) { if (x.produitId === item.id) x.couleurId = coul.couleurId; });
      else { S.pieces.push(newPiece(item, coul)); toast((item.nomCourt || item.nom) + " ajouté à la configuration en cours."); }
    }
    ensureState(item);
    S.entryId = item.id;
  }

  function orderOf() { return { pieces: S.pieces, marquages: S.marquages, technique: S.technique }; }

  /* ---------------- panier : plusieurs configurations dans une seule demande ---------------- */
  // Une ligne du panier = une configuration terminée { id, order: { pieces, marquages, technique } }.
  // Le panier est gardé dans le navigateur (localStorage), avec les coordonnées saisies.
  var CLE_PANIER = "fabricam-panier-v1";
  var PANIER = { lignes: [], next: 1, edit: null };   // edit : id de la ligne en cours de modification

  function sansUrl(k, v) { return k === "url" ? undefined : v; }
  // Copie profonde d'une configuration ; l'adresse temporaire des visuels est refaite depuis leur contenu
  function cloneOrder(o) {
    var c = JSON.parse(JSON.stringify(o, sansUrl));
    Object.keys(c.marquages).forEach(function (e) { var m = c.marquages[e]; if (m && m.image && m.image.dataUrl) m.image.url = m.image.dataUrl; });
    return c;
  }
  var panierAverti = false;
  function panierSauve() {
    try { window.localStorage.setItem(CLE_PANIER, JSON.stringify({ lignes: PANIER.lignes, next: PANIER.next, contact: S.contact }, sansUrl)); }
    catch (_) { if (!panierAverti) { panierAverti = true; toast("Le panier est trop lourd pour être gardé dans ce navigateur : il sera perdu si tu fermes la page."); } }
  }
  function ligneValide(l) {
    return !!(l && l.order && Array.isArray(l.order.pieces) && l.order.pieces.length && l.order.marquages &&
      l.order.pieces.every(function (p) { return byId[p.produitId]; }));
  }
  function panierCharge() {
    var d = null;
    try { var v = window.localStorage.getItem(CLE_PANIER); d = v ? JSON.parse(v) : null; } catch (_) { d = null; }
    if (!d || !Array.isArray(d.lignes)) return;
    PANIER.lignes = d.lignes.filter(ligneValide).map(function (l) { return { id: l.id, order: cloneOrder(l.order) }; });
    PANIER.next = PANIER.lignes.reduce(function (m, l) { return Math.max(m, l.id + 1); }, d.next || 1);
    if (d.contact) Object.keys(S.contact).forEach(function (k) { if (typeof d.contact[k] === "string") S.contact[k] = d.contact[k]; });
  }
  function indexLigne(id) { for (var i = 0; i < PANIER.lignes.length; i++) if (PANIER.lignes[i].id === id) return i; return -1; }
  function resultatLigne(l) { try { return E.computeOrder(l.order, CTX); } catch (_) { return null; } }
  function totauxPanier() {
    var t = { total: 0, pieces: 0, lignes: PANIER.lignes.length };
    PANIER.lignes.forEach(function (l) { var r = resultatLigne(l); t.pieces += l.order.pieces.length; if (r && r.prix) t.total += r.prix.total; });
    return t;
  }
  function majBadgePanier() {
    var b = $("#panier-n"); if (!b) return;
    var n = PANIER.lignes.length;
    b.textContent = n; b.hidden = !n;
    var a = $("[data-nav=panier]"); if (a) a.setAttribute("aria-label", "Panier" + (n ? ", " + n + (n > 1 ? " configurations" : " configuration") : ", vide"));
  }
  // Repart d'une configuration vierge (après un ajout au panier)
  function razConfig() {
    S.pieces = []; S.marquages = null; S.technique = "dtf"; S.addModel = null; S.entryId = null; S.previewId = null; S.sel = null;
    S.nextId = 1; S.result = null;
  }
  // Les identifiants de pièces d'une configuration rechargée ne doivent pas être réutilisés
  function reprendIds() {
    var n = 0;
    S.pieces.forEach(function (p) { n = Math.max(n, parseInt(String(p.id).replace(/\D/g, ""), 10) || 0); });
    S.nextId = n + 1;
  }
  function configEnCours() { return !!(S.marquages && S.pieces.length); }
  function prodOf(piece) { return byId[piece.produitId]; }
  function colorOf(piece) { var pr = prodOf(piece); return pr.couleurs.filter(function (c) { return c.id === piece.couleurId; })[0] || pr.couleurs[0]; }

  function usedEmps(c) {
    c = c || S;
    var set = {};
    c.pieces.forEach(function (p) { Object.keys(prodOf(p).zones).forEach(function (k) { set[k] = 1; }); });
    return EMP_ORDER.filter(function (k) { return set[k]; });
  }
  function anyText(kind) {
    return usedEmps().some(function (e) { var m = S.marquages[e]; return m.actif && m[kind] && m[kind].actif; });
  }

  /* ---------------- divers ---------------- */
  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("on");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("on"); }, 5000);
  }
  var refreshTimer;
  function scheduleRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, 90); }

  function slug(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "asso"; }

  function download(name, text, mime) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime || "application/json" }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* =================================================================== */
  /* VITRINE                                                             */
  /* =================================================================== */
  var app;

  function heroArt() {
    var prod = DATA.produits[0], hex = prod.couleurs[0].hex;
    var piece = { id: "h", produitId: prod.id, couleurId: prod.couleurs[0].id, taille: "M", prenom: "Léo", numero: "7" };
    var face = P.render({ prod: prod, hex: hex, vue: "face", piece: piece, ctx: CTX, sample: true, bare: true,
      marquages: { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait", image: null } } });
    var dos = P.render({ prod: prod, hex: hex, vue: "dos", piece: piece, ctx: CTX, bare: true,
      marquages: { dos: { actif: true, avecImage: false, textePos: "dessous", maj: true,
        prenom: { actif: true, hauteur: 5, police: "Anton", couleur: "#ffffff" },
        numero: { actif: true, hauteur: 17, police: "Anton", couleur: "#e8451e" } } } });
    return '<div class="hero-art" aria-hidden="true"><div class="tile">' + face + '</div><div class="tile">' + dos + '</div></div>';
  }

  function priceStrip(item) {
    var rows = E.priceTable(item, QUANTITES_VITRINE, CTX), unit = ["pièce", "pièces"];
    return '<dl class="prices">' + rows.map(function (r) {
      return '<div class="pc"><dt>' + r.q + " " + (r.q > 1 ? unit[1] : unit[0]) + '</dt><dd>' + fmtEUR(r.unitaire) + '</dd></div>';
    }).join("") + '</dl>';
  }

  function silhouette(prod) {
    return P.render({ prod: prod, hex: prod.couleurs[0].hex, vue: "face", marquages: {}, ctx: CTX, bare: true });
  }

  // Les photos sont liées depuis Decathlon : on demande la taille voulue (largeur en px) dans l'adresse
  // Decathlon redimensionne ses photos à la demande ; une photo d'un autre site (AliExpress) reste telle quelle
  function photoSrc(url, w) { return url + (url.indexOf("?") < 0 && /mediadecathlon\.com/.test(url) ? "?format=auto&f=" + w + "x0" : ""); }

  function photoImg(prod, url, w) {
    return '<img src="' + esc(photoSrc(url, w)) + '" alt="' + esc(prod.nom) + '" loading="lazy" referrerpolicy="no-referrer">';
  }

  var ZOOM_ICON = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12.6 12.6L18 18M8.5 6v5M6 8.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function zoomBtn(pr) {
    return '<button type="button" class="p-zoom" data-zoom="' + pr.id + '" aria-label="Agrandir les photos : ' + esc(pr.nomCourt.toLowerCase()) + '">' + ZOOM_ICON + '</button>';
  }

  function cardPhoto(item) {
    var ph = photosOf(item, item.couleurs[0]);
    if (!ph.length) return '<div class="p-photo">' + silhouette(item) + '</div>';
    return '<div class="p-media" data-prod="' + item.id + '" data-i="0" data-c="0"><div class="p-photo" data-prod="' + item.id + '">' + photoImg(item, ph[0], 800) + zoomBtn(item) + '</div>' + thumbsHTML(item, ph, item.couleurs[0]) + '</div>';
  }

  // Vignettes des photos de la couleur affichée (rien s'il n'y a qu'une photo)
  function thumbsHTML(item, ph, col) {
    if (ph.length < 2) return "";
    return '<div class="p-thumbs" role="group" aria-label="Photos de ' + esc(item.nomCourt.toLowerCase()) + ", " + esc(col.nom.toLowerCase()) + '">' + ph.map(function (u, i) {
      return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === 0 ? "true" : "false") + '" aria-label="Photo ' + (i + 1) + ' sur ' + ph.length + '">' +
        '<img src="' + esc(photoSrc(u, 120)) + '" alt="" loading="lazy" referrerpolicy="no-referrer"></button>';
    }).join("") + '</div>';
  }

  function valeurLabel(groupe, id) {
    var g = DATA.filtres && DATA.filtres[groupe], v = g && g.valeurs.filter(function (x) { return x.id === id; })[0];
    return v ? v.label : id;
  }

  // Barre de catégories : reste collée sous l'en-tête pendant qu'on parcourt le catalogue
  function barreCategoriesHTML() {
    var puces = [{ id: "", label: "Tout" }].concat(CATEGORIES).map(function (c) {
      return '<button type="button" class="chip cat-chip" data-cat="' + esc(c.id) + '" aria-pressed="' + (FILTRE.categorie === c.id ? "true" : "false") + '">' + esc(c.label) + '</button>';
    }).join("");
    return '<div class="cat-bar" id="cat-bar"><div class="cat-chips" role="group" aria-label="Catégories de produits">' + puces + '</div></div>';
  }

  // Filtres secondaires (pour qui, quel style), sous la barre de catégories
  function filtresHTML() {
    var f = DATA.filtres || {};
    var groupes = ["genre", "style"].filter(function (k) { return f[k]; }).map(function (k) {
      var g = f[k];
      return '<div class="f-group" role="group" aria-label="' + esc(g.label) + '"><span class="f-label">' + esc(g.label) + '</span>' +
        [{ id: "", label: "Tous" }].concat(g.valeurs).map(function (v) {
          return '<button type="button" class="chip" data-filtre="' + k + '" data-valeur="' + esc(v.id) + '" aria-pressed="' + (FILTRE[k] === v.id ? "true" : "false") + '">' + esc(v.label) + '</button>';
        }).join("") + '</div>';
    }).join("");
    return '<div class="filtres">' + groupes + '</div><p class="f-count" id="f-count" aria-live="polite"></p>';
  }

  function majFiltres() {
    var all = catalogueItems(), cards = $$(".catalogue .produit"), nV = 0, rayons = {};
    cards.forEach(function (c, i) {
      var ok = matchFiltre(all[i]);
      c.hidden = !ok;
      if (ok) { rayons[c.dataset.rayon] = true; nV++; }
    });
    // Titres de rayon : seulement quand toutes les catégories sont affichées, et pas pour un rayon vide
    $$(".cat-titre").forEach(function (h) { h.hidden = !!FILTRE.categorie || !rayons[h.dataset.rayon]; });
    $$("[data-filtre]").forEach(function (b) { b.setAttribute("aria-pressed", FILTRE[b.dataset.filtre] === b.dataset.valeur ? "true" : "false"); });
    $$(".cat-chip").forEach(function (b) { b.setAttribute("aria-pressed", FILTRE.categorie === b.dataset.cat ? "true" : "false"); });
    var out = $("#f-count"); if (!out) return;
    if (!nV) out.innerHTML = "Aucun article ne correspond à ces filtres. Tu peux nous <a href=\"" + autreVetementHref() + "\">demander le vêtement que tu cherches</a>.";
    else out.textContent = nV + (nV > 1 ? " articles" : " article");
  }

  // Les cartes du catalogue, avec un titre devant chaque rayon
  function rayonsHTML() {
    var dernier = null;
    return catalogueItems().map(function (item) {
      var r = rayonOf(item), titre = "";
      if (r !== dernier) { dernier = r; titre = '<h3 class="cat-titre" data-rayon="' + esc(r) + '" id="rayon-' + esc(r) + '">' + esc(categorieLabel(r)) + '</h3>'; }
      return titre + cardHTML(item);
    }).join("");
  }

  /* ---------- navigation par catégories (menu « Produits » de l'en-tête, barre du catalogue, adresses #/produits/…) ---------- */
  function adresseCategorie(id) { return id ? "#/produits/" + id : "#/produits"; }
  function categorieValide(id) { return id in RANG_CATEGORIE; }
  function defileVersCatalogue() {
    var cat = $("#catalogue"); if (!cat) return;
    cat.scrollIntoView({ behavior: "auto", block: "start" });
  }
  // Choisit une catégorie : sur la vitrine on filtre sur place, ailleurs on y revient par l'adresse.
  // Depuis le menu on va toujours au catalogue ; depuis la barre, seulement si on a défilé plus bas que son début.
  function allerCategorie(id, depuisMenu) {
    if (!$(".catalogue")) { location.hash = adresseCategorie(id); return; }
    FILTRE.categorie = id;
    majFiltres();
    history.replaceState(null, "", adresseCategorie(id));
    if (depuisMenu || $("#catalogue").getBoundingClientRect().top < 0) defileVersCatalogue();
  }
  function menuHTML() {
    var ligne = function (id, label) {
      return '<li><a href="' + adresseCategorie(id) + '" data-cat="' + esc(id) + '"><span>' + esc(label) + '</span><span class="menu-n">' + compteCategorie(id) + '</span></a></li>';
    };
    return '<ul class="menu-list">' + ligne("", "Tous les produits") + CATEGORIES.map(function (c) { return ligne(c.id, c.label); }).join("") + '</ul>';
  }
  function menuOuvert() { return !$("#menu-panel").hidden; }
  function basculeMenu(ouvre) {
    var btn = $("#menu-btn"), panel = $("#menu-panel");
    panel.hidden = !ouvre;
    btn.setAttribute("aria-expanded", ouvre ? "true" : "false");
  }
  function onMenuClick(e) {
    var lien = e.target.closest("[data-cat]");
    if (lien && lien.tagName === "A") { e.preventDefault(); basculeMenu(false); allerCategorie(lien.dataset.cat, true); return; }
    if (lien) { allerCategorie(lien.dataset.cat); return; }          // puce de la barre du catalogue
    if (e.target.closest("#menu-btn")) { basculeMenu(!menuOuvert()); return; }
    if (menuOuvert() && !e.target.closest("#menu-panel")) basculeMenu(false);
  }
  function onMenuKey(e) {
    if (e.key === "Escape" && menuOuvert()) { basculeMenu(false); $("#menu-btn").focus(); }
  }
  // Hauteur de l'en-tête : la barre de catégories se cale juste dessous
  function suitHauteurEntete() {
    var hd = $("#site-header"), maj = function () { document.documentElement.style.setProperty("--header-h", hd.offsetHeight + "px"); };
    maj();
    window.addEventListener("resize", maj);
    if (window.ResizeObserver) new ResizeObserver(maj).observe(hd);
  }


  // Format du visuel compté dans le prix de la vitrine : A6, ou le plus petit format de l'emplacement pour un accessoire (Mini 5 × 5 cm)
  function formatVitrine(item) {
    var emp = DATA.emplacements[(item.vitrine || ["poitrine"])[0]], f = emp && emp.formats || [];
    var id = f.indexOf("A6") >= 0 || !f.length ? "A6" : f[0], d = PRIX.formatsMotif[id];
    return id === "A6" ? "A6" : id + " (" + fmtN(d.w) + " × " + fmtN(d.h) + " cm)";
  }

  // Quand le vêtement ne coûte pas pareil selon la couleur, le prix de la vitrine est celui de la première couleur
  function prixParCouleurTxt(prods) {
    var pr = prods.filter(function (x) {
      var p0 = E.prixAchatPiece(x, x.couleurs[0].id);
      return x.couleurs.some(function (c) { return E.prixAchatPiece(x, c.id) !== p0; });
    })[0];
    return pr ? " Le prix affiché est celui de la couleur " + pr.couleurs[0].nom.toLowerCase() + " : le prix exact des autres couleurs apparaît quand tu personnalises l'article." : "";
  }

  function cardHTML(item) {
    var prods = [item];
    var app = !!item.apporte;     // vêtement que le client apporte : ni couleurs de Decathlon, ni tailles, ni photo
    var sw = app ? "" : item.couleurs.map(function (c, i) {
      return '<li><button type="button" class="sw-btn" data-c="' + i + '" aria-pressed="' + (i === 0 ? "true" : "false") + '" title="Voir cet article en ' + esc(c.nom.toLowerCase()) + '">' +
        '<span class="sw" style="background:' + c.hex + '"></span>' + esc(c.nom) + '</button></li>';
    }).join("");
    var pointures = !app && /^\d/.test(item.tailles[0]);
    var tailles = esc(taillesTxt(item));
    var meta = app ? "Tu apportes ton vêtement, Fabr'Icam le floque. Aucun vêtement n'est compté dans le prix." : esc(item.marque) + ". " + esc(item.matiere) + ".";
    var t = tagsOf(item), labels = [];
    (t.genre || []).forEach(function (g) { labels.push(valeurLabel("genre", g)); });
    if (t.style) labels.push(valeurLabel("style", t.style));
    if (t.sport) labels.push(t.sport);
    categoriesOf(item).forEach(function (c) { labels.push(categorieLabel(c)); });
    var mp = prods.filter(function (pr) { return pr.vendeur; })[0];
    var chips = labels.length || mp ? '<ul class="tags" aria-label="Étiquettes">' + labels.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") +
      (mp ? '<li class="mp">Livré par le vendeur</li>' : "") + "</ul>" : "";
    return '<article class="produit" data-prod="' + item.id + '" data-rayon="' + esc(rayonOf(item)) + '"' + (matchFiltre(item) ? "" : " hidden") + '>' + cardPhoto(item) +
      '<div class="p-info">' + chips + '<h3>' + esc(item.nom) + '</h3>' +
      '<p class="p-meta">' + meta + '</p>' +
      (app ? "" : '<ul class="swatches" aria-label="Couleurs">' + sw + '</ul>') +
      (app ? "" : '<p class="p-liens">' + liensHTML(item, item.couleurs[0]) + '</p>') +
      '<p class="p-meta">' + (app ? "Tu indiques la couleur, la taille et la matière de ton vêtement à l'étape suivante." : (pointures ? "Pointures" : "Tailles") + ' : ' + tailles + '.') + '</p>' +
      '<h4>Prix par pièce</h4>' + priceStrip(item) +
      '<p class="note">' + esc(item.noteVitrine || ("Avec un visuel " + formatVitrine(item) + " " + (item.texteVitrine || "à la poitrine") + ".")) + ' Prix TTC, ' + (app ? "marquage" : "article") + (item.technique === "gravure" ? ", gravure ou vinyle thermocollant et livraison compris" : ", planche de transfert et livraison compris") + (app ? ", sans vêtement (c'est toi qui l'apportes)" : "") + (item.technique === "gravure" ? ". Le prix est le même quelle que soit la quantité : rien à partager entre les pièces, ni planche ni livraison de transferts." : '. Le prix baisse avec la quantité' + (app && seuilApporte() != null ? ", et dès " + (seuilApporte() + 1) + " vêtements apportés dans une commande, le prix de ces pièces baisse encore" : "") + '.') + prixParCouleurTxt(prods) + '</p>' +
      prods.filter(function (pr) { return pr.vendeur; }).map(function (pr) { return '<p class="note note-vendeur">' + esc(vendeurTexte(pr)) + '</p>'; }).join("") +
      '<a class="btn btn-primary" href="#/configurer/' + item.id + '">Personnaliser ' + esc(item.demonstratif || "ce produit") + '</a>' +
      '</div></article>';
  }

  /* ---------- visionneuse de photos (catalogue) ---------- */
  var LB = { prod: null, c: 0, i: 0, dlg: null };
  function lbEnsure() {
    if (LB.dlg) return LB.dlg;
    var d = document.createElement("dialog");
    d.className = "lightbox";
    d.setAttribute("aria-labelledby", "lb-title");
    d.innerHTML = '<div class="lb-top"><p class="lb-title" id="lb-title"></p><p class="lb-count" id="lb-count" aria-live="polite"></p>' +
      '<button type="button" class="lb-close" data-lb="close" aria-label="Fermer">&times;</button></div>' +
      '<div class="lb-stage"><button type="button" class="lb-nav" data-lb="prev" aria-label="Photo précédente">&#8249;</button>' +
      '<figure class="lb-fig"><img id="lb-img" alt="" referrerpolicy="no-referrer"><p class="lb-err" id="lb-err" hidden>Cette photo ne se charge pas. Vérifie ta connexion.</p></figure>' +
      '<button type="button" class="lb-nav" data-lb="next" aria-label="Photo suivante">&#8250;</button></div>';
    document.body.appendChild(d);
    d.addEventListener("click", function (e) {
      if (e.target === d) { d.close(); return; }
      var b = e.target.closest("[data-lb]"); if (!b) return;
      if (b.dataset.lb === "close") d.close();
      else lbShow(LB.i + (b.dataset.lb === "next" ? 1 : -1));
    });
    d.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); lbShow(LB.i - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); lbShow(LB.i + 1); }
    });
    var img = $("#lb-img", d);
    img.addEventListener("error", function () { img.hidden = true; $("#lb-err", d).hidden = false; });
    img.addEventListener("load", function () { img.hidden = false; $("#lb-err", d).hidden = true; });
    LB.dlg = d;
    return d;
  }
  function lbShow(i) {
    var pr = byId[LB.prod], col = pr.couleurs[LB.c] || pr.couleurs[0], ph = photosOf(pr, col), n = ph.length, d = LB.dlg;
    LB.i = ((i % n) + n) % n;
    var img = $("#lb-img", d), titre = pr.nom + (pr.couleurs.length > 1 ? ", " + col.nom.toLowerCase() : "");
    img.alt = titre + ", photo " + (LB.i + 1) + " sur " + n;
    img.src = photoSrc(ph[LB.i], 1600);
    $("#lb-title", d).textContent = titre;
    $("#lb-count", d).textContent = (LB.i + 1) + " / " + n;
    $$(".lb-nav", d).forEach(function (b) { b.hidden = n < 2; });
    // précharge la photo suivante pour que le passage soit rapide
    if (n > 1) { var nx = new Image(); nx.referrerPolicy = "no-referrer"; nx.src = photoSrc(ph[(LB.i + 1) % n], 1600); }
  }
  function openLightbox(prodId, i, ci) {
    var pr = byId[prodId];
    if (!pr || !photosOf(pr, pr.couleurs[ci || 0]).length) return;
    var d = lbEnsure();
    LB.prod = prodId; LB.c = ci || 0;
    lbShow(i || 0);
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  }

  function bindPhotoErrors(root) {
    $$(".p-photo > img, .p-photo .cell > img", root).forEach(function (img) {
      img.addEventListener("error", function () {
        var host = img.closest("[data-prod]"), media = img.closest(".p-media");
        host.innerHTML = silhouette(byId[host.dataset.prod]);
        var th = media && $(".p-thumbs", media); if (th) th.remove();
      });
    });
  }

  // Affiche la photo n° i de la couleur choisie dans la carte du catalogue
  function montrePhoto(media, i) {
    var prod = byId[media.dataset.prod], ph = photosOf(prod, prod.couleurs[Number(media.dataset.c) || 0]), host = $(".p-photo", media);
    if (!ph[i]) return;
    var main = $("img", host);
    if (!main) {     // la photo précédente ne s'était pas chargée : on remet une image
      host.innerHTML = photoImg(prod, ph[i], 800) + zoomBtn(prod);
      bindPhotoErrors(media);
    } else main.src = photoSrc(ph[i], 800);
    media.dataset.i = String(i);
    $$(".p-thumbs button", media).forEach(function (x) { x.setAttribute("aria-pressed", Number(x.dataset.i) === i ? "true" : "false"); });
  }

  // Un clic sur une couleur de la carte : sa série de photos et le lien vers sa page
  function choisitCouleur(card, ci) {
    var media = $(".p-media", card), prod = byId[card.dataset.prod], col = prod.couleurs[ci];
    COULEUR_CARTE[prod.id] = col.id;
    $$(".sw-btn", card).forEach(function (x) { x.setAttribute("aria-pressed", Number(x.dataset.c) === ci ? "true" : "false"); });
    var liens = $(".p-liens", card); if (liens) liens.innerHTML = liensHTML(prod, col);
    if (!media) return;
    media.dataset.c = String(ci);
    var th = $(".p-thumbs", media); if (th) th.remove();
    var ph = photosOf(prod, col), html = thumbsHTML(prod, ph, col);
    if (html) $(".p-photo", media).insertAdjacentHTML("afterend", html);
    montrePhoto(media, 0);
  }

  function viewVitrine() {
    COULEUR_CARTE = {};
    app.innerHTML =
      '<section class="hero">' +
      '<div class="hero-text">' +
      '<h1>Des vêtements floqués pour ton asso</h1>' +
      '<p class="lead">Tu choisis le vêtement, tu importes ton logo, tu ajoutes les prénoms et les numéros. On presse à l\'atelier de Fabr\'Icam, et tu vois le prix à chaque changement.</p>' +
      '<p><a class="btn btn-primary" href="#catalogue" data-scroll="catalogue">Choisir un vêtement</a></p>' +
      '</div>' + heroArt() + '</section>' +
      '<section class="block" id="catalogue"><h2>Catalogue</h2>' + barreCategoriesHTML() + filtresHTML() + '<div class="catalogue">' + rayonsHTML() + '</div></section>' +
      '<section class="block steps"><h2>Comment ça marche</h2><ol class="seq">' +
      '<li><b>Tu configures.</b> Couleurs, tailles, visuels, prénoms et numéros, avec un aperçu à la taille réelle.</li>' +
      '<li><b>Tu vois le prix.</b> Il se met à jour à chaque changement, vêtements et marquage compris.</li>' +
      '<li><b>Tu envoies la demande.</b> Un mail pré-rempli part vers Fabr\'Icam, avec ton fichier de commande.</li>' +
      '<li><b>On valide le devis.</b> Fabr\'Icam te le confirme et te réclame le règlement, puis on presse.</li></ol></section>' +
      '<section class="block facts"><h2>Bon à savoir</h2><dl>' +
      '<div><dt>Aucun minimum</dt><dd>Une seule pièce ou toute l\'équipe, le calcul est le même. Tu peux mélanger plusieurs vêtements dans une commande.</dd></div>' +
      '<div><dt>Deux techniques</dt><dd>Le DTF convient à toutes les couleurs. La sublimation, plus lisse, ne marche que sur polyester blanc ou clair.</dd></div>' +
      '<div><dt>Tu as déjà tes vêtements ?</dt><dd>Choisis « Ton vêtement » dans le catalogue : tu apportes tes vêtements et on les floque. Le prix compte les planches de transfert, la livraison et le flocage, sans vêtement. ' + (seuilApporte() != null ? "À partir de " + (seuilApporte() + 1) + " vêtements apportés dans une commande, le prix de ces pièces baisse. " : "") + 'Fabr\'Icam t\'indique où et quand les déposer.</dd></div>' +
      '<div><dt>Des vêtements Decathlon</dt><dd>Fabr\'Icam les retire en magasin, il n\'y a donc pas de frais de livraison sur les vêtements. Les articles marqués « Livré par le vendeur » viennent de vendeurs partenaires de Decathlon, d\'AliExpress ou d\'Amazon : ils sont livrés à Fabr\'Icam, et leurs frais de port sont déjà dans le prix.</dd></div>' +
      '</dl></section>';

    majFiltres();
    $$("[data-filtre]").forEach(function (b) {
      b.addEventListener("click", function () { FILTRE[b.dataset.filtre] = b.dataset.valeur; majFiltres(); });
    });
    // Photo introuvable (hors ligne, lien périmé) : on affiche le dessin du vêtement à la place
    bindPhotoErrors(app);
    // Agrandir : le bouton loupe ou un clic sur la photo ouvre la visionneuse
    $$(".p-photo").forEach(function (box) {
      box.addEventListener("click", function (e) {
        var cell = e.target.closest(".cell"), host = cell || box, z = $(".p-zoom", host);
        if (!z) return;
        var media = box.closest(".p-media");
        openLightbox(z.dataset.zoom, media ? Number(media.dataset.i) || 0 : 0, media ? Number(media.dataset.c) || 0 : 0);
      });
    });
    // Vignettes : un clic affiche la photo choisie. Couleurs : un clic affiche la série de photos de cette couleur.
    $$(".p-media").forEach(function (media) {
      media.addEventListener("click", function (e) {
        var b = e.target.closest(".p-thumbs button"); if (b) montrePhoto(media, Number(b.dataset.i));
      });
    });
    $$(".sw-btn").forEach(function (b) {
      b.addEventListener("click", function () { choisitCouleur(b.closest(".produit"), Number(b.dataset.c)); });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      var art = $(".hero-art"); if (art) art.outerHTML = heroArt();
    });
  }

  /* =================================================================== */
  /* CONFIGURATEUR                                                       */
  /* =================================================================== */
  function viewConfigurator(id) {
    var item = id ? (itemOf(id) || DATA.produits[0]) : (S.entryId ? itemOf(S.entryId) : DATA.produits[0]);
    if (id || !S.marquages) enter(item); else ensureState(item);
    var titre = S.pieces.some(function (p) { return prodOf(p).id !== S.pieces[0].produitId; }) ? "Ta configuration" : item.nom;
    app.innerHTML =
      '<div class="cfg" data-view="cfg">' +
      '<div class="cfg-head"><a class="back" href="#/">Catalogue</a><h1>' + esc(titre) + '</h1></div>' +
      '<div class="cfg-grid">' +
      '<div class="cfg-main">' +
      '<section class="step" id="s-pieces"><h2><span class="n">1</span>Tes pièces</h2><div id="pieces"></div></section>' +
      '<section class="step" id="s-marq"><h2><span class="n">2</span>Les marquages</h2><div id="marquages"></div></section>' +
      '<section class="step" id="s-tech"><h2><span class="n">3</span>La technique</h2><div id="technique"></div></section>' +
      '<section class="step" id="s-devis"><h2><span class="n">4</span>Ton panier</h2><div id="devis"></div></section>' +
      '</div>' +
      '<aside class="cfg-side"><div class="pv-card">' +
      '<div class="pv-bar"><div class="seg" role="group" aria-label="Vue"><button type="button" data-vue="face">Face</button><button type="button" data-vue="dos">Dos</button></div>' +
      '<div class="seg" role="group" aria-label="Type d\'aperçu"><button type="button" data-mode="dessin" title="Dessin à la taille réelle">Dessin</button><button type="button" data-mode="photo">Photo</button></div>' +
      '<label class="pv-piece">Aperçu pour <select id="pv-piece"></select></label></div>' +
      '<div id="pv"></div><p class="pv-note" id="pv-note" hidden></p><p class="pv-lien p-liens" id="pv-lien" hidden></p></div>' +
      '<div class="total" id="total" aria-live="polite"></div></aside>' +
      '</div></div>';
    renderPieces(); renderMarquages(); renderTechnique(); renderAjout();
    refresh();
  }

  /* ---------- 1. pièces ---------- */
  function pieceRow(p, i) {
    var prod = prodOf(p);
    var opts = function (arr, cur, lab) { return arr.map(function (v) { var val = v.id || v; return '<option value="' + esc(val) + '"' + (val === cur ? " selected" : "") + ">" + esc(lab ? lab(v) : v) + "</option>"; }).join(""); };
    var modele = '<td class="col-modele"><select data-f="produitId" aria-label="Modèle, pièce ' + (i + 1) + '">' + modelOptions(p.produitId) + '</select></td>';
    return '<tr data-pid="' + p.id + '">' +
      '<td class="idx">' + (i + 1) + '</td>' + modele +
      '<td class="col-couleur"><span class="sw" style="background:' + colorOf(p).hex + '"></span><select data-f="couleurId" aria-label="Couleur, pièce ' + (i + 1) + '">' + opts(prod.couleurs, p.couleurId, function (c) { return c.nom; }) + '</select></td>' +
      '<td><select data-f="taille" aria-label="Taille, pièce ' + (i + 1) + '">' + opts(prod.tailles, p.taille) + '</select></td>' +
      '<td class="col-matiere">' + (prod.apporte ? '<select data-f="matiere" aria-label="Matière, pièce ' + (i + 1) + '">' + opts(DATA.matieres, matiereDe(p).id, function (m) { return m.nom; }) + '</select>' : "") + '</td>' +
      '<td class="col-prenom"><input data-f="prenom" type="text" maxlength="24" value="' + esc(p.prenom) + '" aria-label="Prénom, pièce ' + (i + 1) + '" autocomplete="off"></td>' +
      '<td class="col-numero"><input data-f="numero" type="text" maxlength="4" value="' + esc(p.numero) + '" aria-label="Numéro, pièce ' + (i + 1) + '" autocomplete="off"></td>' +
      '<td class="act"><button type="button" class="ico" data-act="dup" title="Dupliquer cette pièce" aria-label="Dupliquer la pièce ' + (i + 1) + '">+</button>' +
      '<button type="button" class="ico" data-act="del" title="Retirer cette pièce" aria-label="Retirer la pièce ' + (i + 1) + '">×</button></td></tr>';
  }

  // Liste des modèles, par groupes : vêtements du catalogue, vêtements apportés par le client
  function modelOptions(cur) {
    var o = function (id, lab) { return '<option value="' + esc(id) + '"' + (id === cur ? " selected" : "") + ">" + esc(lab) + "</option>"; };
    var cat = DATA.produits.filter(function (x) { return !x.apporte; }), app = DATA.produits.filter(function (x) { return x.apporte; });
    return '<optgroup label="Vêtements">' + cat.map(function (x) { return o(x.id, x.nomCourt); }).join("") + '</optgroup>' +
      (app.length ? '<optgroup label="Ton vêtement (tu l\'apportes)">' + app.map(function (x) { return o(x.id, x.nomCourt); }).join("") + '</optgroup>' : "");
  }

  function renderPieces() {
    $("#pieces").innerHTML =
      '<div class="tablewrap"><table class="pieces' + (S.pieces.some(function (p) { return prodOf(p).apporte; }) ? " has-matiere" : "") + (anyText("prenom") ? " has-prenom" : "") + (anyText("numero") ? " has-numero" : "") + '">' +
      '<thead><tr><th class="idx"><span class="sr">N°</span></th><th>Modèle</th><th>Couleur</th><th>Taille</th><th class="col-matiere">Matière</th><th class="col-prenom">Prénom</th><th class="col-numero">Numéro</th><th></th></tr></thead>' +
      '<tbody>' + S.pieces.map(pieceRow).join("") + '</tbody></table></div>' +
      (S.pieces.some(function (p) { return prodOf(p).apporte; }) ? '<p class="hint hint-matiere">Fais glisser le tableau vers la gauche pour indiquer la matière de chaque vêtement.</p>' : "") +
      '<p class="hint hint-text" ' + (anyText("prenom") || anyText("numero") ? "hidden" : "") + '>Pour personnaliser chaque pièce, coche « Prénom » ou « Numéro » dans les marquages.</p>' +
      '<div class="toolbar">' +
      '<label class="sr" for="addmodel">Modèle à ajouter</label><select id="addmodel">' + modelOptions(S.addModel) + '</select>' +
      '<button type="button" class="btn btn-quiet" data-act="add">Ajouter</button>' +
      '<span class="addn"><label class="sr" for="addn">Nombre de pièces à ajouter</label><input id="addn" type="number" min="1" max="200" value="5"><button type="button" class="btn btn-quiet" data-act="addn">identiques à la dernière</button></span>' +
      '<button type="button" class="btn btn-quiet" data-act="paste">Coller une liste</button></div>' +
      '<div class="pastebox" id="pastebox" hidden><label for="pastetxt">Une ligne par pièce, pour le modèle choisi ci-dessus : prénom ; numéro ; taille ; couleur ; matière (la taille, la couleur et, pour un vêtement apporté, la matière sont facultatives)</label>' +
      '<textarea id="pastetxt" rows="6" placeholder="Léo ; 7 ; M&#10;Inès ; 10 ; S ; Blanc&#10;Sam ; 4 ; L"></textarea>' +
      '<button type="button" class="btn btn-primary" data-act="pasteok">Ajouter ces pièces</button></div>';
    updatePieceSelect();
  }

  function parseLine(line) {
    var parts = line.split(/[;\t]/).map(function (x) { return x.trim(); });
    if (parts.length < 2 && line.indexOf(",") > -1) parts = line.split(",").map(function (x) { return x.trim(); });
    return parts;
  }

  function addFromList(text) {
    var id = S.addModel || S.entryId, added = 0, list = [];
    var blank = S.pieces.length === 1 && !S.pieces[0].prenom && !S.pieces[0].numero;
    text.split(/\r?\n/).forEach(function (line) {
      if (!line.trim()) return;
      var f = parseLine(line);
      var batch = [newPiece(byId[id])];
      batch.forEach(function (p) {
        var prod = byId[p.produitId];
        p.prenom = (f[0] || "").slice(0, 24); p.numero = (f[1] || "").slice(0, 4);
        if (f[2]) { var t = prod.tailles.filter(function (x) { return x.toLowerCase() === f[2].toLowerCase(); })[0]; if (t) p.taille = t; }
        if (f[3]) { var c = prod.couleurs.filter(function (x) { return x.id === f[3].toLowerCase() || x.nom.toLowerCase() === f[3].toLowerCase(); })[0]; if (c) p.couleurId = c.id; }
        if (f[4] && prod.apporte) { var v4 = f[4].toLowerCase(), mt = DATA.matieres.filter(function (x) { return x.id === v4 || x.court.indexOf(v4) === 0 || x.nom.toLowerCase().indexOf(v4) === 0; })[0]; if (mt) p.matiere = mt.id; }
        list.push(p);
      });
      added++;
    });
    if (!added) { toast("Aucune ligne reconnue. Écris un prénom, un point-virgule, puis un numéro."); return; }
    if (blank) S.pieces = list; else S.pieces = S.pieces.concat(list);
    fixPreview();
    toast(added + (added > 1 ? " pièces ajoutées." : " pièce ajoutée."));
  }

  function updatePieceSelect() {
    var sel = $("#pv-piece"); if (!sel) return;
    sel.innerHTML = S.pieces.map(function (p, i) {
      return '<option value="' + p.id + '"' + (p.id === S.previewId ? " selected" : "") + ">" + (i + 1) + ". " + esc(p.prenom ? p.prenom + ", " : "") + esc(p.taille) + ", " + esc(colorOf(p).nom) + "</option>";
    }).join("");
  }

  /* ---------- 2. marquages ---------- */
  function fontOptions(cur) {
    return DATA.polices.map(function (f) { return '<option value="' + esc(f) + '"' + (f === cur ? " selected" : "") + ">" + esc(f) + "</option>"; }).join("");
  }

  function textBlock(m, kind, label) {
    var o = m[kind], libre = kind === "texte";
    return '<div class="txt' + (o.actif ? " on" : "") + '">' +
      '<label class="chk"><input type="checkbox" data-k="' + kind + '.actif"' + (o.actif ? " checked" : "") + '> ' + label + '</label>' +
      (o.actif && libre ? '<label class="txt-libre">Ton texte <small>(une ligne par retour à la ligne, écrit tel que tu le tapes)</small>' +
        '<textarea data-k="texte.valeur" rows="3" maxlength="300" placeholder="Ex. : Fabr\'Icam" aria-label="Texte libre">' + esc(o.valeur || "") + '</textarea></label>' : "") +
      (o.actif ? '<div class="txt-opts">' +
        '<label>Police<select data-k="' + kind + '.police">' + fontOptions(o.police) + '</select></label>' +
        '<label>Hauteur des lettres<span class="unit"><input type="number" data-k="' + kind + '.hauteur" min="0.5" max="28" step="0.5" value="' + o.hauteur + '"> cm</span></label>' +
        (libre ? '<label>Écart entre les lignes <small>(1 = serré)</small><span class="unit"><input type="number" data-k="texte.interligne" min="1" max="4" step="0.1" value="' + fmtField(o.interligne || 1.5) + '"> ×</span></label>' : "") +
        '<label>Couleur<input type="color" data-k="' + kind + '.couleur" value="' + esc(o.couleur) + '"></label></div>' +
        '<div class="txt-pos" data-txt="' + kind + '">' +
        '<label>Orientation<span class="unit"><input type="number" data-k="' + kind + '.rot" min="-180" max="180" step="1" value="' + fmtField(o.rot || 0) + '"> °</span></label>' +
        '<div class="seg" role="group" aria-label="Tourner le texte"><button type="button" data-act="trot" data-kind="' + kind + '" data-dir="-1" title="Quart de tour vers la gauche">&#8634; 90°</button><button type="button" data-act="trot" data-kind="' + kind + '" data-dir="1" title="Quart de tour vers la droite">&#8635; 90°</button><button type="button" data-act="trot" data-kind="' + kind + '" data-dir="0" title="Remettre le texte à l\'endroit">0°</button></div>' +
        '<label>Décalage horizontal <small>(+ vers la droite)</small><span class="unit"><input type="number" data-k="' + kind + '.dx" min="-60" max="60" step="0.5" value="' + fmtField(o.dx || 0) + '"> cm</span></label>' +
        '<label>Décalage vertical <small>(+ vers le bas)</small><span class="unit"><input type="number" data-k="' + kind + '.dy" min="-60" max="60" step="0.5" value="' + fmtField(o.dy || 0) + '"> cm</span></label>' +
        '<button type="button" class="linkbtn" data-act="tcenter" data-kind="' + kind + '">Recentrer</button></div>' : "") +
      '</div>';
  }

  function dpiText(m) {
    if (!m.image) return "";
    if (m.image.svg) return "Fichier SVG : net à toutes les tailles.";
    var g = E.imageGeom(m, CTX) || { w0: 0, h0: 0 }, ar = (m.image.pxW || 1) / (m.image.pxH || 1);
    var printedW = Math.min(g.w0, g.h0 * ar), dpi = Math.round((m.image.pxW || 0) / (printedW / 2.54));
    if (dpi >= 280) return "Résolution : " + dpi + " dpi, c'est bon.";
    if (dpi >= 150) return "Résolution : " + dpi + " dpi. " + PRIX.fournisseur.nom + " demande 300 dpi minimum, le rendu sera moins net.";
    return "Résolution : " + dpi + " dpi, trop faible. Utilise une image plus grande (300 dpi minimum).";
  }

  // Case « collés » : visible quand l'emplacement porte au moins deux éléments (visuel, prénom, numéro)
  function blocOption(m, emp) {
    var visuel = m.avecImage && !emp.texteSeul, n = (visuel ? 1 : 0) + (m.prenom.actif ? 1 : 0) + (m.numero.actif ? 1 : 0);
    if (n < 2) return "";
    var qui = m.prenom.actif && m.numero.actif ? "Prénom et numéro" : m.prenom.actif ? "Prénom" : "Numéro";
    return '<div class="bloc-opt"><label class="chk"><input type="checkbox" data-k="bloc"' + (m.bloc ? " checked" : "") + '> ' +
      (visuel ? qui + " collé" + (m.prenom.actif && m.numero.actif ? "s" : "") + " au visuel" : "Prénom et numéro collés") + ' : un seul transfert, posé d\'un coup</label>' +
      '<p class="hint">Fabr\'Icam presse le bloc en une fois, ce qui compte pour un seul motif dans le prix.</p></div>';
  }

  /* ---------- taille, rotation et position du visuel (version 6.2.0) ---------- */
  function fmtField(n) { return String(Math.round(n * 100) / 100); }
  function visuelControles(m, emp) {
    var g = E.imageGeom(m, CTX); if (!g) return "";
    var ratio = g.h0 / g.w0, max = Math.floor(E.largeurMax(ratio, g.rot, PRIX.plateau) * 10) / 10;
    var chips = emp.formats.map(function (id) {
      var f = PRIX.formatsMotif[id];
      return '<button type="button" class="chip" data-act="fmt" data-fmt="' + id + '" aria-pressed="' + (!m.libre && m.format === id) + '">' + esc(f.nom) + " · " + fmtN(f.w) + " × " + fmtN(f.h) + " cm</button>";
    }).join("");
    return '<div class="vis" data-vis>' +
      '<div class="vis-row"><span class="vis-lab">Taille de départ</span><div class="chips" role="group" aria-label="Taille de départ">' + chips + "</div></div>" +
      '<div class="vis-size"><label>Largeur du visuel<span class="unit"><input type="number" data-k="largeur" min="0.5" max="' + max + '" step="0.1" value="' + fmtField(g.w0) + '"> cm</span></label>' +
      '<input type="range" class="vis-range" data-k="largeur" aria-label="Largeur du visuel" min="0.5" max="' + max + '" step="0.1" value="' + fmtField(g.w0) + '"></div>' +
      '<p class="hint" data-dims>' + dimsTexte(g) + "</p>" +
      '<div class="vis-row"><span class="vis-lab">Rotation</span><div class="seg" role="group" aria-label="Rotation"><button type="button" data-act="rot" data-dir="-1" title="Quart de tour vers la gauche">&#8634; 90°</button><button type="button" data-act="rot" data-dir="1" title="Quart de tour vers la droite">&#8635; 90°</button></div><output data-rot>' + g.rot + "°</output></div>" +
      '<div class="vis-pos"><label>Décalage horizontal <small>(+ vers la droite)</small><span class="unit"><input type="number" data-k="dx" min="-60" max="60" step="0.5" value="' + fmtField(g.dx) + '"> cm</span></label>' +
      '<label>Décalage vertical <small>(+ vers le bas)</small><span class="unit"><input type="number" data-k="dy" min="-60" max="60" step="0.5" value="' + fmtField(g.dy) + '"> cm</span></label>' +
      '<button type="button" class="btn btn-quiet" data-act="center">Recentrer</button></div>' +
      '<p class="hint">Sur l\'aperçu (vue Dessin), glisse le visuel pour le placer, tire le coin vert pour l\'agrandir, touche le bouton rond pour le tourner. Il peut dépasser le cadre rouge, pas le plateau de la presse (' + PRIX.plateau.w + " × " + PRIX.plateau.h + " cm).</p></div>";
  }
  function dimsTexte(g) {
    return "Hauteur : " + fmtN(g.h0) + " cm, les proportions du visuel sont gardées." + (g.rot ? " Une fois tourné, il occupe " + fmtN(g.w) + " × " + fmtN(g.h) + " cm." : "");
  }

  // Applique une nouvelle largeur (en cm) au visuel d'un emplacement : bornée par le plateau de la presse
  function fixeLargeur(m, v) {
    var g = E.imageGeom(m, CTX), ratio = g.h0 / g.w0;
    m.largeur = Math.max(0.5, Math.min(Math.floor(E.largeurMax(ratio, g.rot, PRIX.plateau) * 10) / 10, Math.round(v * 10) / 10)); m.libre = true;
    return m.largeur;
  }
  // Raccourci A7, A6... : le visuel entier tient dans ce format, dans son sens
  function ajusteFormat(m, fmt) {
    m.format = fmt; m.libre = false;
    m.largeur = E.largeurPourFormat(fmt, m.image && m.image.ratio, m.rot, CTX);
  }
  // Remet à jour les champs de la carte d'un emplacement sans la redessiner (on garde le focus pendant qu'on tape ou qu'on glisse)
  function majChampsVisuel(empId, sauf) {
    var m = S.marquages[empId], card = $('[data-emp="' + empId + '"]'), g = E.imageGeom(m, CTX);
    if (!card || !g) return;
    var vals = { largeur: g.w0, dx: g.dx, dy: g.dy };
    $$("[data-vis] [data-k]", card).forEach(function (inp) { if (inp !== sauf && vals[inp.dataset.k] != null) inp.value = fmtField(vals[inp.dataset.k]); });
    var d = $("[data-dims]", card); if (d) d.textContent = dimsTexte(g);
    var rt = $("[data-rot]", card); if (rt) rt.textContent = g.rot + "°";
    $$("[data-fmt]", card).forEach(function (b) { b.setAttribute("aria-pressed", String(!m.libre && m.format === b.dataset.fmt)); });
  }

  function empCard(empId) {
    var m = S.marquages[empId], emp = DATA.emplacements[empId];
    if (emp.texteLibre && !m.texte) m.texte = texteLibreDefaut(m.prenom.couleur);      // commande enregistrée avant la 7.3.0
    var prod = DATA.produits.filter(function (p) { return p.zones[empId]; })[0];
    var label = (prod.zones[empId].label) || emp.label;
    var body = "";
    if (m.actif) {
      var imgGroup = "";
      if (!emp.texteSeul) imgGroup = '<div class="grp"><label class="chk"><input type="checkbox" data-k="avecImage"' + (m.avecImage ? " checked" : "") + '> Ajouter un visuel (logo, image)</label>' +
        (m.avecImage ? '<div class="up">' +
          '<label class="filebtn">' + (m.image ? "Changer le fichier" : "Importer le fichier") + '<input type="file" data-upload accept="image/png,image/jpeg,image/svg+xml,image/webp"></label>' +
          (m.image ? '<span class="fname">' + esc(m.image.nom) + '</span><button type="button" class="linkbtn" data-act="rmimg">Retirer</button>' : '<span class="fname muted">PNG, JPG, SVG ou WebP, fond transparent conseillé</span>') + '</div>' +
          visuelControles(m, emp) +
          '<p class="hint dpi" data-dpi>' + esc(dpiText(m)) + '</p>' : "") + '</div>';
      body = '<div class="emp-body">' + imgGroup +
        '<div class="grp">' + textBlock(m, "prenom", "Prénom de chaque pièce") + textBlock(m, "numero", "Numéro de chaque pièce") +
        (emp.texteLibre ? textBlock(m, "texte", "Texte libre, identique sur toutes les gourdes") : "") +
        ((m.prenom.actif || m.numero.actif) ? '<div class="row2"><label class="chk"><input type="checkbox" data-k="maj"' + (m.maj ? " checked" : "") + '> Majuscules</label>' +
          ((m.avecImage && !emp.texteSeul) ? '<label>Texte placé<select data-k="textePos"><option value="dessous"' + (m.textePos === "dessous" ? " selected" : "") + '>Sous le visuel</option><option value="dessus"' + (m.textePos === "dessus" ? " selected" : "") + '>Au-dessus du visuel</option></select></label>' : "") + '</div>' : "") +
        blocOption(m, emp) +
        '</div></div>';
    }
    var here = [];
    S.pieces.forEach(function (p) { var pr = prodOf(p); if (pr.zones[empId] && here.indexOf(pr) < 0) here.push(pr); });
    var pour = here.length > 1 ? '<p class="hint emp-for">S\'applique à : ' + here.map(function (x) { return esc(x.nomCourt); }).join(", ") + '.</p>' : "";
    return '<fieldset class="emp' + (m.actif ? " on" : "") + '" data-emp="' + empId + '"><legend class="sr">' + esc(label) + '</legend>' +
      '<label class="emp-head"><input type="checkbox" data-k="actif"' + (m.actif ? " checked" : "") + '><span class="emp-name">' + esc(label) + '</span></label>' + pour + body + '</fieldset>';
  }

  function renderMarquages() {
    $("#marquages").innerHTML = usedEmps().map(empCard).join("");
    (usedEmps()).forEach(function (e) { var m = S.marquages[e]; ["prenom", "numero", "texte"].forEach(function (k) { if (m[k] && m[k].actif) ensureFont(m[k].police); }); });
  }

  function renderEmp(empId) {
    var el = $('[data-emp="' + empId + '"]');
    if (el) { var t = document.createElement("div"); t.innerHTML = empCard(empId); el.replaceWith(t.firstChild); }
  }

  // Proportions (hauteur / largeur) d'un SVG : sa fenêtre (viewBox), sinon ses attributs width et height ; 0 si on ne sait pas
  function svgRatio(texte) {
    try {
      var el = new DOMParser().parseFromString(texte, "image/svg+xml").documentElement;
      if (!el || String(el.nodeName).toLowerCase() !== "svg") return 0;
      var vb = String(el.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
      if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) return vb[3] / vb[2];
      var w = parseFloat(el.getAttribute("width")), h = parseFloat(el.getAttribute("height"));
      if (w > 0 && h > 0) return h / w;
    } catch (_) { /* on retombe sur les dimensions lues par le navigateur */ }
    return 0;
  }

  // Quart de tour du visuel d'un emplacement (dir : 1 vers la droite, -1 vers la gauche)
  function tourne(m, dir) {
    m.rot = E.quartDeTour((m.rot || 0) + 90 * dir);
    fixeLargeur(m, m.largeur);                // le plateau n'est pas pareil dans l'autre sens
  }

  function handleUpload(empId, file) {
    if (!file) return;
    var ok = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (ok.indexOf(file.type) < 0) { toast("Ce format n'est pas pris en compte. Utilise un PNG, JPG, SVG ou WebP."); return; }
    if (file.size > 12 * 1024 * 1024) { toast("Ce fichier dépasse 12 Mo. Réduis-le ou envoie-le directement par mail."); return; }
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () {
        var m = S.marquages[empId], svg = file.type === "image/svg+xml";
        var fin = function (ratioSvg) {
          var nat = img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalHeight / img.naturalWidth : 1;
          m.image = { nom: file.name, dataUrl: rd.result, url: URL.createObjectURL(file), pxW: img.naturalWidth || 0, pxH: img.naturalHeight || 0, svg: svg, ratio: Math.round((ratioSvg || nat) * 1000) / 1000 };
          if (svg) m.image.pxW = 0;
          if (!m.libre) ajusteFormat(m, m.format);        // la taille de départ s'applique aux proportions du visuel ; une taille choisie à la main est gardée
          else fixeLargeur(m, m.largeur);                // et reste dans le plateau si les proportions ont changé
          S.sel = empId;
          renderEmp(empId); refresh();
        };
        if (svg && file.text) file.text().then(function (t) { fin(svgRatio(t)); }, function () { fin(0); }); else fin(0);
      };
      img.onerror = function () { toast("Impossible de lire cette image."); };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  /* ---------- 3. technique ---------- */
  function eligibleCount() {
    return S.pieces.filter(function (p) { return E.pieceTechno({ technique: "sublimation" }, p, CTX) === "sublimation"; }).length;
  }

  function renderTechnique() {
    $("#technique").innerHTML =
      '<label class="radio"><input type="radio" name="tech" value="dtf"' + (S.technique === "dtf" ? " checked" : "") + '><span><b>DTF</b> Couleurs vives et opaques, sur toutes les couleurs de vêtement. Léger relief au toucher. Recommandé.</span></label>' +
      '<label class="radio" id="r-sub"><input type="radio" name="tech" value="sublimation"' + (S.technique === "sublimation" ? " checked" : "") + '><span><b>Sublimation</b> Rendu lisse, sans relief, très résistant. Seulement sur polyester blanc ou très clair, et le blanc de ton visuel n\'est pas imprimé.</span></label>' +
      '<p class="hint" id="tech-info"></p>';
  }

  // Pièces gravées au laser ou marquées en vinyle (ouvre-bouteilles, porte-clés) : elles échappent au choix DTF ou sublimation
  function nGravure(c) {
    return (c || S).pieces.filter(function (p) { return E.pieceTechno({ technique: "dtf" }, p, CTX) === "gravure"; }).length;
  }
  // Pièces en vinyle thermocollant (flex découpé à l'atelier, sans planche) : les articles où le DTF n'est pas idéal, hors gravure
  function nVinyle(c) {
    return (c || S).pieces.filter(function (p) { return E.pieceTechno({ technique: "dtf" }, p, CTX) === "vinyle"; }).length;
  }
  function vinyleTxt() {
    var v = nVinyle();
    return v ? " " + (v > 1 ? v + " pièces sont en vinyle thermocollant" : "1 pièce est en vinyle thermocollant") + " (le DTF n'est pas idéal sur " + (v > 1 ? "leur matière" : "sa matière") + ") : ce choix ne " + (v > 1 ? "les concerne" : "la concerne") + " pas." : "";
  }
  function gravureTxt() {
    var g = nGravure();
    return (g ? " " + (g > 1 ? g + " pièces sont gravées au laser ou marquées en vinyle thermocollant" : "1 pièce est gravée au laser ou marquée en vinyle thermocollant") + " : ce choix ne " + (g > 1 ? "les concerne" : "la concerne") + " pas." : "") + vinyleTxt();
  }

  function updateTechniqueInfo() {
    var n = eligibleCount(), info = $("#tech-info"), sub = $("#r-sub input");
    if (!info) return;
    sub.disabled = n === 0;
    $("#r-sub").classList.toggle("off", n === 0);
    if (n === 0) {
      info.textContent = "La sublimation n'est pas disponible : aucune pièce blanche ou claire en polyester dans ta commande." + gravureTxt();
      if (S.technique === "sublimation") { S.technique = "dtf"; $('input[name="tech"][value="dtf"]').checked = true; scheduleRefresh(); }
    } else if (S.technique === "sublimation") {
      info.textContent = (n === S.pieces.length ? "La sublimation s'applique sur toutes tes pièces." : "La sublimation s'applique sur " + n + (n > 1 ? " pièces claires" : " pièce claire") + ". Les autres restent en DTF.") + gravureTxt();
    } else {
      info.textContent = n + (n > 1 ? " pièces pourraient être en sublimation." : " pièce pourrait être en sublimation.") + gravureTxt();
    }
  }

  /* ---------- 4. demande ---------- */
  // Étape 4 du configurateur : la configuration part dans le panier
  function renderAjout() {
    var edit = PANIER.edit != null && indexLigne(PANIER.edit) >= 0, n = PANIER.lignes.length;
    $("#devis").innerHTML =
      '<p class="hint">' + (edit ? "Tu modifies la configuration n° " + (indexLigne(PANIER.edit) + 1) + " du panier." : "Quand cette configuration est prête, mets-la au panier. Tu pourras ensuite en configurer d'autres, puis tout envoyer d'un coup.") + '</p>' +
      '<div class="cart-actions"><button type="button" class="btn btn-primary" data-act="cart">' + (edit ? "Mettre à jour le panier" : "Ajouter au panier") + '</button>' +
      (edit ? '<button type="button" class="btn btn-quiet" data-act="pncancel">Annuler la modification</button>' : "") +
      '<a class="btn btn-quiet" href="#/panier">Voir le panier' + (n ? " (" + n + ")" : "") + '</a></div>' +
      '<div class="issues" id="issues" aria-live="polite"></div>';
  }

  // Coordonnées et envoi, dans la page du panier
  function renderContact() {
    var c = S.contact;
    var field = function (id, label, type, extra) { return '<label>' + label + '<input id="c-' + id + '" data-c="' + id + '" type="' + (type || "text") + '" value="' + esc(c[id]) + '" ' + (extra || "") + '></label>'; };
    $("#devis").innerHTML =
      '<div class="form2">' + field("asso", "Ton association", "text", 'autocomplete="organization"') + field("nom", "Ton nom", "text", 'autocomplete="name"') +
      field("email", "Ton e-mail", "email", 'autocomplete="email"') + field("tel", "Téléphone (facultatif)", "tel", 'autocomplete="tel"') +
      field("date", "Date souhaitée (facultatif)", "date") + '</div>' +
      '<label>Un message pour nous (facultatif)<textarea id="c-message" data-c="message" rows="3">' + esc(c.message) + '</textarea></label>' +
      '<ol class="send">' +
      '<li><button type="button" class="btn btn-primary" data-act="dl">Télécharger mon fichier de commande</button><span class="hint">Il contient toutes les configurations du panier, avec tes visuels. Tu le joins au mail.</span></li>' +
      '<li><button type="button" class="btn btn-primary" data-act="mail">Écrire le mail à Fabr\'Icam</button><span class="hint">Gmail s\'ouvre dans un nouvel onglet, le message est déjà rempli. N\'oublie pas d\'y joindre le fichier.</span></li></ol>' +
      '<p><button type="button" class="linkbtn" data-act="copy">Pas de Gmail ? Copier le texte du mail</button></p>' +
      '<div class="issues" id="issues" aria-live="polite"></div>';
  }

  /* ---------- le panier ---------- */
  function resumeLigne(l) {
    var g = {}, ordre = [];
    l.order.pieces.forEach(function (p) {
      var k = prodOf(p).nomCourt + (prodOf(p).apporte ? "" : " " + colorOf(p).nom.toLowerCase());
      if (!g[k]) { g[k] = { n: 0, hex: prodOf(p).apporte ? null : colorOf(p).hex }; ordre.push(k); }
      g[k].n++;
    });
    return ordre.map(function (k) { return { nom: k, n: g[k].n, hex: g[k].hex }; });
  }
  function ligneHTML(l, i) {
    var r = resultatLigne(l), res = resumeLigne(l), emps = usedEmps(l.order).filter(function (e) { return l.order.marquages[e].actif; });
    var edit = PANIER.edit === l.id;
    return '<li class="pn-ligne' + (edit ? " editing" : "") + '" data-lid="' + l.id + '">' +
      '<div class="pn-main"><h3>Configuration ' + (i + 1) + (edit ? ' <span class="pn-tag">en cours de modification</span>' : "") + '</h3>' +
      '<ul class="pn-res">' + res.map(function (x) { return "<li>" + (x.hex ? '<span class="sw" style="background:' + x.hex + '"></span>' : "") + x.n + " × " + esc(x.nom) + "</li>"; }).join("") + '</ul>' +
      '<p class="pn-sub">' + emps.map(function (e) { return esc(DATA.emplacements[e].label); }).join(", ") + (l.order.technique === "sublimation" ? " · sublimation" : " · DTF") + '</p></div>' +
      '<div class="pn-prix"><b>' + (r && r.prix ? fmtEUR(r.prix.total) : "–") + '</b><span>' + l.order.pieces.length + (l.order.pieces.length > 1 ? " pièces" : " pièce") + ', TTC</span></div>' +
      '<div class="pn-actions"><button type="button" class="btn btn-quiet" data-act="pnedit" data-lid="' + l.id + '">Modifier</button>' +
      '<button type="button" class="btn btn-quiet" data-act="pndup" data-lid="' + l.id + '">Dupliquer</button>' +
      '<button type="button" class="btn btn-quiet" data-act="pndel" data-lid="' + l.id + '">Retirer</button></div></li>';
  }
  function viewPanier() {
    var lignes = PANIER.lignes, tot = totauxPanier();
    var encours = configEnCours() && PANIER.edit == null
      ? '<p class="pn-encours">Une configuration est en cours (' + S.pieces.length + (S.pieces.length > 1 ? " pièces" : " pièce") + '). <a href="#/configurer">La reprendre</a></p>' : "";
    if (!lignes.length) {
      app.innerHTML = '<div class="panier" data-view="panier"><div class="cfg-head"><a class="back" href="#/produits">Catalogue</a><h1>Ton panier</h1></div>' + encours +
        '<div class="pn-vide"><p>Ton panier est vide. Choisis un article, configure-le, puis ajoute-le au panier : tu peux en mettre autant que tu veux, tout part dans une seule demande.</p>' +
        '<a class="btn btn-primary" href="#/produits">Voir le catalogue</a></div></div>';
      return;
    }
    app.innerHTML = '<div class="panier" data-view="panier"><div class="cfg-head"><a class="back" href="#/produits">Catalogue</a><h1>Ton panier</h1></div>' + encours +
      '<div class="pn-grid"><div class="pn-liste"><ol class="pn-lignes">' + lignes.map(ligneHTML).join("") + '</ol>' +
      '<p><a class="btn btn-quiet" href="#/produits">Ajouter un autre article</a></p></div>' +
      '<aside class="pn-side"><div class="total"><div class="t-main"><span class="t-big">' + fmtEUR(tot.total) + '</span><span class="t-unit">au total, TTC</span></div>' +
      '<p class="t-sub">' + tot.pieces + (tot.pieces > 1 ? " pièces" : " pièce") + ' en ' + tot.lignes + (tot.lignes > 1 ? " configurations" : " configuration") + '</p>' +
      '<p class="t-note">Chaque configuration est chiffrée séparément. Tout part dans une seule demande : Fabr\'Icam confirme le devis et regroupe la commande avant toute fabrication.</p></div></aside></div>' +
      '<section class="step pn-envoi"><h2>Envoyer ma demande</h2><div id="devis"></div></section></div>';
    renderContact();
  }


  // Ce qui empêche d'ajouter une configuration au panier (ou de l'envoyer)
  function problemesConfig(c) {
    var out = [], actifs = usedEmps(c).filter(function (e) { return c.marquages[e].actif; });
    if (!actifs.length) out.push("Active au moins un marquage.");
    else {
      var r = resultatLigne({ order: c });
      if (r && r.motifs && !r.motifs.length) out.push("Il n'y a encore rien à presser : ajoute un visuel, ou écris les prénoms ou les numéros des pièces.");
    }
    var manque = actifs.filter(function (e) { var m = c.marquages[e]; return m.avecImage && !m.image; });
    if (manque.length) out.push("Il manque le fichier du visuel : " + manque.map(function (e) { return DATA.emplacements[e].label.toLowerCase(); }).join(", ") + ". Tu peux aussi le joindre au mail à la main.");
    return out;
  }
  function triProblemes(out) {
    var info = function (t) { return /il manque le fichier/i.test(t); };   // le fichier d'un visuel peut aussi être joint au mail à la main : pas bloquant
    return { bloquants: out.filter(function (t) { return !info(t); }), infos: out.filter(info) };
  }
  function problems() {
    var out = [], c = S.contact, n = PANIER.lignes.length;
    if (!n) out.push("Le panier est vide : ajoute au moins une configuration.");
    if (!c.asso.trim()) out.push("Indique le nom de ton association.");
    if (!c.nom.trim()) out.push("Indique ton nom.");
    if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) out.push("Indique une adresse e-mail valide.");
    PANIER.lignes.forEach(function (l, i) {
      problemesConfig(l.order).forEach(function (t) { out.push(n > 1 ? "Configuration " + (i + 1) + " : " + t.charAt(0).toLowerCase() + t.slice(1) : t); });
    });
    return triProblemes(out);
  }

  function showIssues(pb) {
    var box = $("#issues"); if (!box) return;
    box.innerHTML = (pb.bloquants.length ? '<ul class="err">' + pb.bloquants.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
      (pb.infos.length ? '<ul class="warn">' + pb.infos.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "");
  }

  function lignePayload(l) {
    var o = l.order, r = resultatLigne(l);
    return {
      version: 2, technique: o.technique, pieces: o.pieces,
      marquages: JSON.parse(JSON.stringify(o.marquages, sansUrl)),
      prixAffiche: r && r.prix ? {
        unitaire: r.prix.unitaire, total: r.prix.total, pieces: r.N,
        parProduit: r.prix.groupes.map(function (g) { return { produitId: g.produitId, n: g.n, unitaire: g.unitaire }; })
      } : null
    };
  }
  // Une seule configuration : le même fichier qu'avant (version 2). Plusieurs : version 3, une entrée par configuration.
  function orderPayload() {
    var tete = { service: DATA.service.nom, creeLe: new Date().toISOString(), contact: S.contact };
    if (PANIER.lignes.length === 1) return Object.assign({}, tete, lignePayload(PANIER.lignes[0]));
    return Object.assign({ version: 3 }, tete, { commandes: PANIER.lignes.map(lignePayload) });
  }
  function fileName() {
    var d = new Date(), z = function (n) { return ("0" + n).slice(-2); };
    return "commande-flocage-" + slug(S.contact.asso) + "-" + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + ".json";
  }

  function pieceLine(p, i) {
    var parts = [prodOf(p).nomCourt + " " + colorOf(p).nom.toLowerCase() + " " + p.taille + (prodOf(p).apporte ? " (" + matiereDe(p).court + ")" : "")];
    if (p.prenom) parts.push(p.prenom);
    if (p.numero) parts.push("n° " + p.numero);
    return (i + 1) + ". " + parts.join(", ");
  }

  function prixLignes(r) {
    var pv = r.prix;
    if (pv.unitaire != null) return ["Prix affiché : " + fmtEUR(pv.unitaire) + " par pièce, soit " + fmtEUR(pv.total) + " TTC."];
    var out = ["Prix affiché :"];
    pv.groupes.forEach(function (g) { out.push("- " + g.n + " × " + groupName(g) + " : " + fmtEUR(g.unitaire) + " l'unité"); });
    out.push("Total : " + fmtEUR(pv.total) + " TTC.");
    return out;
  }

  // Orientation et position d'un prénom ou d'un numéro, pour le mail : ", tourné de 30°, décalé de 2 cm vers la droite"
  function posTexte(o) {
    var p = [], dec = [], dx = Number(o.dx) || 0, dy = Number(o.dy) || 0, rot = E.angleTexte(o.rot);
    if (rot) p.push("tourné de " + fmtN(rot) + "°");
    if (Math.abs(dx) >= 0.05) dec.push(fmtN(Math.abs(dx)) + " cm vers la " + (dx > 0 ? "droite" : "gauche"));
    if (Math.abs(dy) >= 0.05) dec.push(fmtN(Math.abs(dy)) + " cm vers le " + (dy > 0 ? "bas" : "haut"));
    if (dec.length) p.push("décalé de " + dec.join(" et "));
    return p.length ? ", " + p.join(", ") : "";
  }

  // Le texte d'une configuration : pièces, technique, marquages, prix
  function configTexte(c, r, compact) {
    var t = [], gv = nGravure(c), vn = nVinyle(c), techBase = c.technique === "sublimation" ? "sublimation (polyester clair), DTF sinon" : "DTF";
    t.push("Technique : " + (gv === c.pieces.length ? "gravure laser ou vinyle thermocollant" : vn + gv === c.pieces.length ? "vinyle thermocollant" : techBase + (vn ? ", vinyle thermocollant pour " + vn + (vn > 1 ? " pièces" : " pièce") : "") + (gv ? ", gravure laser ou vinyle thermocollant pour " + gv + (gv > 1 ? " pièces" : " pièce") : "")), "");
    t.push(c.pieces.length + (c.pieces.length > 1 ? " pièces" : " pièce") + " :");
    if (compact) {
      var g = {};
      c.pieces.forEach(function (p) { var k = prodOf(p).nomCourt + " " + colorOf(p).nom.toLowerCase() + " " + p.taille + (prodOf(p).apporte ? " (" + matiereDe(p).court + ")" : ""); g[k] = (g[k] || 0) + 1; });
      Object.keys(g).forEach(function (k) { t.push("- " + g[k] + " × " + k); });
    } else {
      c.pieces.forEach(function (p, i) { t.push(pieceLine(p, i)); });
    }
    var nApp = c.pieces.filter(function (p) { return prodOf(p).apporte; }).length;
    if (nApp) t.push("", nApp + (nApp > 1 ? " pièces sont des vêtements que j'apporte" : " pièce est un vêtement que j'apporte") + " : merci de m'indiquer où et quand les déposer.");
    t.push("", "Marquages :");
    usedEmps(c).forEach(function (e) {
      var m = c.marquages[e]; if (!m.actif) return;
      var d = [];
      if (m.avecImage) d.push("visuel " + E.descriptionVisuel(m, CTX) + (m.image ? " (" + m.image.nom + ")" : ""));
      ["prenom", "numero"].forEach(function (k) { if (m[k].actif) d.push((k === "prenom" ? "prénom" : "numéro") + " en " + m[k].police + ", " + fmtN(m[k].hauteur) + " cm, " + m[k].couleur + posTexte(m[k])); });
      if (m.texte && m.texte.actif && String(m.texte.valeur || "").trim()) {      // texte libre (gourdes), identique sur toute la commande
        var tl = m.texte;
        d.push("texte libre « " + String(tl.valeur).trim().split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean).join(" / ") + " » en " + tl.police + ", " + fmtN(tl.hauteur) + " cm, " + tl.couleur + posTexte(tl));
      }
      t.push("- " + DATA.emplacements[e].label + " : " + d.join(" + ") + (m.bloc && d.length > 1 ? " (collés en un seul bloc)" : ""));
    });
    if (r && r.prix) { t.push(""); prixLignes(r).forEach(function (l) { t.push(l); }); }
    return t;
  }

  function mailText(compact) {
    var c = S.contact, t = [], lignes = PANIER.lignes, n = lignes.length, tot = totauxPanier();
    t.push("Bonjour,", "", "Demande de flocage pour " + c.asso.trim() + (n > 1 ? " (" + n + " configurations)" : "") + ".", "");
    t.push("Contact : " + c.nom.trim() + ", " + c.email.trim() + (c.tel.trim() ? ", " + c.tel.trim() : ""));
    if (c.date) t.push("Date souhaitée : " + new Date(c.date + "T12:00:00").toLocaleDateString("fr-FR"));
    t.push("");
    lignes.forEach(function (l, i) {
      if (n > 1) t.push("=== Configuration " + (i + 1) + " sur " + n + " ===");
      configTexte(l.order, resultatLigne(l), compact).forEach(function (x) { t.push(x); });
      t.push("");
    });
    if (compact) t.push("(liste détaillée avec prénoms et numéros dans le fichier de commande joint)", "");
    if (n > 1) t.push("Total du panier : " + fmtEUR(tot.total) + " TTC pour " + tot.pieces + " pièces.");
    if (c.message.trim()) t.push("", c.message.trim());
    t.push("", "Je joins le fichier de commande (" + fileName() + ")" + ".", "", "Merci,", c.nom.trim());
    return t.join("\n");
  }

  function mailHref() {
    var tot = totauxPanier();
    var subject = "Demande de flocage, " + S.contact.asso.trim() + ", " + tot.pieces + (tot.pieces > 1 ? " pièces" : " pièce") + (tot.lignes > 1 ? " en " + tot.lignes + " configurations" : "");
    var body = mailText(false);
    if (encodeURIComponent(body).length > 1700) body = mailText(true);
    return gmailHref(DATA.service.email, subject, body);
  }

  /* ---------- aperçu et total ---------- */
  /* Aperçu sur photo : possible seulement dans la couleur de la photo, et pour une vue calibrée (voir data.js, apercuPhoto). */
  var PHOTO_KO = {};
  function photoApercu(piece, vue) {
    var prod = prodOf(piece), ap = prod.apercuPhoto;
    if (prod.apporte) return { ok: false, why: "Ton vêtement n'a pas de photo ici : l'aperçu montre un modèle type en dessin." };
    if (!ap) return { ok: false, why: "Pas de photo de face ou de dos exploitable pour ce vêtement." };
    var coul = prod.couleurs.filter(function (c) { return c.id === ap.couleur; })[0];
    if (colorOf(piece).id !== ap.couleur) return { ok: false, why: "Les photos montrent le vêtement en " + (coul ? coul.nom.toLowerCase() : ap.couleur) + ". Choisis cette couleur pour voir ton visuel dessus." };
    var cfg = ap[vue], url = cfg && prod.photos[cfg.photo];
    if (!cfg || !url) return { ok: false, why: "Pas de photo de " + (vue === "dos" ? "dos" : "face") + " pour ce vêtement." };
    var src = photoSrc(url, 800);
    if (PHOTO_KO[src]) return { ok: false, why: "La photo ne s'est pas chargée (connexion ?). Le dessin la remplace." };
    return { ok: true, cfg: cfg, src: src };
  }

  function renderPreview() {
    var piece = S.pieces.filter(function (p) { return p.id === S.previewId; })[0] || S.pieces[0];
    if (!piece) return;
    var prod = prodOf(piece);
    var hasBack = Object.keys(prod.zones).some(function (k) { var v = prod.zones[k].vue; return v === "dos" || v === "cote"; });
    if (!hasBack && S.vue === "dos") S.vue = "face";
    var ph = photoApercu(piece, S.vue), photo = S.mode !== "dessin" && ph.ok;     // « auto » : la photo avec son calque quand elle existe, sinon le dessin
    var pv = $("#pv");
    var opts = { prod: prod, hex: colorOf(piece).hex, vue: S.vue, marquages: S.marquages, piece: piece, ctx: CTX };
    if (!photo) {        // vue Dessin : le visuel se déplace, s'agrandit et se tourne à la souris ou au doigt
      opts.interactif = true; opts.sel = empChoisi(piece);
      opts.pxPerCm = (pv.clientWidth || 560) / ((P.models[prod.modele] || {}).w || 90);
    }
    if (photo) {
      var html = P.renderPhoto(Object.assign({}, opts, { cfg: ph.cfg, src: ph.src })), cur = $(".pv-photo img", pv);
      if (cur && cur.getAttribute("src") === ph.src) {
        // même photo : on ne remplace que le calque, pour que l'image ne clignote pas à chaque frappe
        var tmp = document.createElement("div"); tmp.innerHTML = html;
        $(".pv-overlay", pv).replaceWith($(".pv-overlay", tmp));
      } else {
        pv.innerHTML = html;
        var img = $(".pv-photo img", pv);
        if (img) img.addEventListener("error", function () { PHOTO_KO[ph.src] = true; renderPreview(); });
      }
    } else {
      pv.innerHTML = P.render(opts);
    }
    // note sous l'aperçu : pourquoi la photo n'est pas affichée, ou ce qu'elle ne montre pas
    var note = $("#pv-note"), txt = "";
    if (S.mode === "photo" && !ph.ok) txt = ph.why;
    else if (photo) {
      txt = "Aperçu indicatif : la photo est prise sous un angle, les positions sont approximatives.";
      var manches = Object.keys(prod.zones).some(function (k) { var z = prod.zones[k]; return z.cy != null && S.marquages[k] && S.marquages[k].actif; });
      if (manches) txt += " Les manches ne sont pas montrées sur la photo, elles restent visibles sur le dessin.";
    }
    note.textContent = txt; note.hidden = !txt;
    // raccourci vers la page de la pièce (couleur comprise) chez Decathlon ou chez son vendeur
    var lk = $("#pv-lien"), cle = prod.id + "/" + colorOf(piece).id;
    if (lk && lk.dataset.k !== cle) { lk.dataset.k = cle; lk.innerHTML = liensHTML(prod, colorOf(piece)); lk.hidden = !lk.innerHTML; }
    $$(".seg button").forEach(function (b) {
      if (b.dataset.vue) {
        b.setAttribute("aria-pressed", b.dataset.vue === S.vue ? "true" : "false");
        if (b.dataset.vue === "dos") { b.disabled = !hasBack; b.title = hasBack ? "" : "Pas de marquage au dos sur ce vêtement"; }
      } else if (b.dataset.mode) {
        b.setAttribute("aria-pressed", b.dataset.mode === (photo ? "photo" : "dessin") ? "true" : "false");
        if (b.dataset.mode === "photo") { b.setAttribute("aria-disabled", ph.ok ? "false" : "true"); b.classList.toggle("is-off", !ph.ok); b.title = ph.ok ? "Ton visuel sur la photo du vêtement" : ph.why; }
      }
    });
  }

  /* Avertit quand un prénom ou un numéro serait illisible sur le polo choisi. */
  function contrastNotes() {
    var out = [];
    usedEmps().forEach(function (e) {
      var m = S.marquages[e]; if (!m.actif) return;
      var label = (DATA.emplacements[e].label || e).toLowerCase();
      ["prenom", "numero"].forEach(function (k) {
        var o = m[k]; if (!o.actif) return;
        var lt = P.lum(o.couleur), noms = {}, sublBlanc = false;
        S.pieces.forEach(function (p) {
          if (k === "prenom" ? !p.prenom : !p.numero) return;
          var c = colorOf(p);
          if (Math.abs(lt - P.lum(c.hex)) < 0.22) noms[c.nom.toLowerCase()] = 1;
          if (lt > 0.85 && E.pieceTechno(orderOf(), p, CTX) === "sublimation") sublBlanc = true;
        });
        var l = Object.keys(noms);
        var nom = (k === "prenom" ? "Prénom" : "Numéro") + " (" + label + ")";
        if (l.length) out.push(nom + " : cette couleur se voit mal sur le vêtement " + l.join(" et ") + ". Choisis une couleur plus contrastée.");
        else if (sublBlanc) out.push(nom + " : en sublimation, le blanc n'est pas imprimé, le texte ne sera pas visible.");
      });
      if (m.texte && m.texte.actif && String(m.texte.valeur || "").trim()) {      // texte libre : même contrôle, sur toutes les pièces
        var ltl = P.lum(m.texte.couleur), nl = {};
        S.pieces.forEach(function (p) { var c = colorOf(p); if (Math.abs(ltl - P.lum(c.hex)) < 0.22) nl[c.nom.toLowerCase()] = 1; });
        if (Object.keys(nl).length) out.push("Texte libre (" + label + ") : cette couleur se voit mal sur le vêtement " + Object.keys(nl).join(" et ") + ". Choisis une couleur plus contrastée.");
      }
    });
    return out;
  }

  function fraisVendeurTxt(r) {
    if (!r.vendeurs || !r.vendeurs.length || !r.couts.livraisonVendeurs) return "";   // livraison offerte (AliExpress) : rien à ajouter
    var tot = r.couts.livraisonVendeurs;
    return ", ainsi que les frais de port " + (r.vendeurs.length > 1 ? "des vendeurs partenaires" : "du vendeur partenaire") + " (estimés à " + fmtEUR(tot) + ")";
  }

  // Ce que le prix comprend, selon la part de vêtements que le client apporte
  function inclusTxt() {
    var nApp = S.pieces.filter(function (p) { return prodOf(p).apporte; }).length;
    if (nGravure() === S.pieces.length) return "articles, gravure ou vinyle thermocollant et livraison compris";
    if (!nApp) return "vêtements, planches de transfert et livraison compris";
    if (nApp === S.pieces.length) return "planches de transfert et livraison compris, sans vêtement (tu apportes les tiens)";
    return "vêtements Decathlon, planches de transfert et livraison compris, sans les " + nApp + (nApp > 1 ? " vêtements" : " vêtement") + " que tu apportes";
  }
  function ucfirst(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  // Plus de PRIX.regles.apporte.seuil vêtements apportés dans la commande : le prix de ces pièces est réduit
  function remiseApporteTxt(r) {
    var a = r.prix && r.prix.apporte;
    return a && a.reduite ? '<p class="t-note t-remise">Tu apportes plus de ' + a.seuil + ' vêtements : le prix de ces pièces est réduit.</p>' : "";
  }
  function seuilApporte() { var a = PRIX.regles.apporte; return a && a.facteur != null && a.facteur !== 1 ? a.seuil : null; }

  function renderTotal(r) {
    var box = $("#total"); if (!box) return;
    var html;
    if (!r.prix) html = '<p class="empty">Ajoute une pièce pour voir le prix.</p>';
    else if (r.prix.unitaire != null) {
      html = '<div class="t-main"><span class="t-big">' + fmtEUR(r.prix.unitaire) + '</span><span class="t-unit">par pièce, TTC</span></div>' +
        '<p class="t-sub">' + r.N + (r.N > 1 ? " pièces" : " pièce") + ' : <b>' + fmtEUR(r.prix.total) + '</b></p>' +
        remiseApporteTxt(r) +
        '<p class="t-note">' + ucfirst(inclusTxt()) + fraisVendeurTxt(r) + '. Fabr\'Icam confirme le devis avant toute commande.</p>';
    } else {
      var pv = r.prix;
      html = '<div class="t-main"><span class="t-big">' + fmtEUR(pv.total) + '</span><span class="t-unit">au total, TTC, pour ' + r.N + (r.N > 1 ? " pièces" : " pièce") + '</span></div>' +
        '<ul class="t-lines">' + pv.groupes.map(function (g) { return '<li><span>' + g.n + ' × ' + esc(groupName(g)) + '</span><b>' + fmtEUR(g.unitaire) + '</b></li>'; }).join("") + '</ul>' +
        remiseApporteTxt(r) +
        '<p class="t-note">Prix à l\'unité, ' + inclusTxt() + fraisVendeurTxt(r) + '. Fabr\'Icam confirme le devis avant toute commande.</p>';
    }
    if (r.warnings.length) html += '<ul class="warn">' + r.warnings.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>";
    box.innerHTML = html;
  }

  function refresh() {
    if (!$("[data-view=cfg]")) return;
    usedEmps().forEach(function (e) { var m = S.marquages[e]; if (m.actif) ["prenom", "numero"].forEach(function (k) { if (m[k].actif) ensureFont(m[k].police); }); });
    var r = E.computeOrder(orderOf(), CTX);
    S.result = r;
    r.warnings = r.warnings.concat(contrastNotes());
    var vus = {};
    S.pieces.forEach(function (p) { var pr = prodOf(p); if (pr.avertissement && !vus[pr.id]) { vus[pr.id] = 1; r.warnings.push(pr.avertissement); } });
    var vv = {}, ordre = [];       // une information par vendeur, avec la liste de ses articles
    S.pieces.forEach(function (p) {
      var pr = prodOf(p); if (!pr.vendeur) return;
      if (!vv[pr.vendeur]) { vv[pr.vendeur] = { prod: pr, noms: [] }; ordre.push(pr.vendeur); }
      if (vv[pr.vendeur].noms.indexOf(pr.nomCourt) < 0) vv[pr.vendeur].noms.push(pr.nomCourt);
    });
    ordre.forEach(function (k) { r.warnings.push(vendeurTexte(vv[k].prod, vv[k].noms) + " Le stock est limité : Fabr'Icam le confirme avant de commander."); });
    renderTotal(r); renderPreview(); updateTechniqueInfo();
    $$("[data-emp]").forEach(function (card) { var d = $("[data-dpi]", card); if (d) d.textContent = dpiText(S.marquages[card.dataset.emp]); });
    updatePieceSelect();
  }

  /* =================================================================== */
  /* ÉVÉNEMENTS                                                          */
  /* =================================================================== */
  function setPath(obj, path, val) {
    var ks = path.split("."), o = obj;
    for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = val;
  }
  var STRUCTURAL = { "actif": 1, "avecImage": 1, "prenom.actif": 1, "numero.actif": 1, "texte.actif": 1 };

  function onInput(e) {
    var t = e.target;
    if (t.matches("[data-upload]")) return;
    var tr = t.closest("tr[data-pid]");
    if (tr && t.dataset.f) {
      var p = S.pieces.filter(function (x) { return x.id === tr.dataset.pid; })[0], f = t.dataset.f;
      p[f] = t.value;
      if (f === "produitId") { var pr = prodOf(p); p.couleurId = pr.couleurs[0].id; if (pr.tailles.indexOf(p.taille) < 0) p.taille = pr.tailles[0]; if (pr.apporte) p.matiere = p.matiere || "inconnu"; else delete p.matiere; renderPieces(); renderMarquages(); }
      if (f === "couleurId") { var sw = $(".sw", tr); if (sw) sw.style.background = colorOf(p).hex; }
      S.previewId = p.id;
      scheduleRefresh(); return;
    }
    var card = t.closest("[data-emp]");
    if (card && t.dataset.k) {
      var emp = card.dataset.emp, m = S.marquages[emp], k = t.dataset.k, v;
      if (k === "largeur" || k === "dx" || k === "dy") {          // visuel : taille libre et position (champ ou curseur)
        v = parseFloat(String(t.value).replace(",", ".")); if (!isFinite(v)) return;
        S.sel = emp;
        if (k === "largeur") { fixeLargeur(m, v); }
        else m[k] = Math.max(-60, Math.min(60, Math.round(v * 10) / 10));
        majChampsVisuel(emp, t);
        scheduleRefresh(); return;
      }
      if (/^(prenom|numero|texte)\.(rot|dx|dy)$/.test(k)) {              // texte : orientation (degrés) et position (cm), libres
        v = parseFloat(String(t.value).replace(",", ".")); if (!isFinite(v)) return;
        v = k.slice(-3) === "rot" ? Math.max(-180, Math.min(180, Math.round(v * 10) / 10)) : Math.max(-60, Math.min(60, Math.round(v * 10) / 10));
        setPath(m, k, v); scheduleRefresh(); return;
      }
      if (k === "texte.interligne") {                              // écart entre les lignes du texte libre
        v = parseFloat(String(t.value).replace(",", ".")); if (!isFinite(v)) return;
        setPath(m, k, Math.max(1, Math.min(4, v))); scheduleRefresh(); return;
      }
      if (t.type === "checkbox") v = t.checked;
      else if (t.type === "number") { v = parseFloat(String(t.value).replace(",", ".")); if (!isFinite(v)) return; v = Math.max(0.5, Math.min(28, v)); }
      else v = t.value;
      setPath(m, k, v);
      if (STRUCTURAL[k]) {
        if (k.slice(-5) === "actif" && k !== "actif" && t.checked) ensureFont(m[k.split(".")[0]].police);
        renderEmp(emp); renderPieces();
      }
      scheduleRefresh(); return;
    }
    if (t.id === "pv-piece") { S.previewId = t.value; scheduleRefresh(); return; }
    if (t.id === "addmodel") { S.addModel = t.value; return; }
    if (t.name === "tech") { S.technique = t.value; scheduleRefresh(); return; }
    if (t.dataset.c) { S.contact[t.dataset.c] = t.value; panierSauve(); }
  }

  function onChange(e) {
    var t = e.target;
    if (t.matches("[data-vis] [data-k]")) { var c0 = t.closest("[data-emp]"); if (c0) majChampsVisuel(c0.dataset.emp); return; }
    if (t.matches("[data-upload]")) { var card = t.closest("[data-emp]"); handleUpload(card.dataset.emp, t.files && t.files[0]); }
  }

  function ajouteAuPanier() {
    var pb = triProblemes(problemesConfig(S)); showIssues(pb);
    if (pb.bloquants.length) return;
    var ordre = cloneOrder(orderOf()), i = PANIER.edit != null ? indexLigne(PANIER.edit) : -1, modif = i >= 0;
    if (modif) PANIER.lignes[i].order = ordre;
    else PANIER.lignes.push({ id: PANIER.next++, order: ordre });
    PANIER.edit = null;
    razConfig(); panierSauve(); majBadgePanier();
    toast(modif ? "Panier mis à jour." : "Ajouté au panier. Tu peux configurer un autre article.");
    location.hash = modif ? "#/panier" : "#/produits";
  }
  function actionLigne(act, id) {
    var i = indexLigne(id); if (i < 0) return;
    if (act === "pndel") {
      PANIER.lignes.splice(i, 1);
      if (PANIER.edit === id) { PANIER.edit = null; razConfig(); }
      panierSauve(); majBadgePanier(); viewPanier(); toast("Configuration retirée du panier.");
    } else if (act === "pndup") {
      PANIER.lignes.splice(i + 1, 0, { id: PANIER.next++, order: cloneOrder(PANIER.lignes[i].order) });
      panierSauve(); majBadgePanier(); viewPanier(); toast("Configuration dupliquée.");
    } else {
      if (configEnCours() && !pristine() && PANIER.edit == null) { toast("Une configuration est déjà en cours : ajoute-la au panier avant d'en modifier une autre."); return; }
      var o = cloneOrder(PANIER.lignes[i].order);
      S.pieces = o.pieces; S.marquages = o.marquages; S.technique = o.technique; S.previewId = null; S.sel = null; S.addModel = o.pieces[0].produitId;
      S.entryId = o.pieces[0].produitId;
      reprendIds(); PANIER.edit = id;
      location.hash = "#/configurer";
    }
  }

  function onClick(e) {
    var b = e.target.closest("button, a[data-scroll]");
    if (!b) return;
    if (b.dataset.scroll) { e.preventDefault(); var el = document.getElementById(b.dataset.scroll); if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); return; }
    if (b.dataset.vue) { S.vue = b.dataset.vue; renderPreview(); return; }
    if (b.dataset.mode) { S.mode = b.dataset.mode; renderPreview(); return; }
    var act = b.dataset.act; if (!act) return;
    var tr = b.closest("tr[data-pid]");
    var piecesChanged = function () { fixPreview(); renderPieces(); renderMarquages(); refresh(); };
    var pieceOf = function (row) { return S.pieces.filter(function (x) { return x.id === row.dataset.pid; })[0]; };
    var clone = function (src) { return [newPiece(prodOf(src), { couleurId: src.couleurId, taille: src.taille })]; };
    if (act === "add") { var sel = $("#addmodel"); if (sel) S.addModel = sel.value; addModel(S.addModel, 1); piecesChanged(); }
    else if (act === "addn") {
      var n = Math.max(1, Math.min(200, parseInt($("#addn").value, 10) || 1)), last = S.pieces[S.pieces.length - 1];
      for (var i = 0; i < n; i++) S.pieces = S.pieces.concat(clone(last));
      piecesChanged();
    }
    else if (act === "dup" && tr) {
      var src = pieceOf(tr), at = S.pieces.indexOf(src);
      S.pieces.splice.apply(S.pieces, [at + 1, 0].concat(clone(src)));
      piecesChanged();
    }
    else if (act === "del" && tr) {
      var gone = pieceOf(tr), left = S.pieces.filter(function (x) { return x.id !== gone.id; });
      if (!left.length) { toast("Il faut au moins une pièce."); return; }
      S.pieces = left;
      piecesChanged();
    }
    else if (act === "paste") { var pb = $("#pastebox"); pb.hidden = !pb.hidden; if (!pb.hidden) $("#pastetxt").focus(); }
    else if (act === "pasteok") { addFromList($("#pastetxt").value); $("#pastetxt").value = ""; $("#pastebox").hidden = true; renderPieces(); refresh(); }
    else if (act === "trot" || act === "tcenter") {
      var c2 = b.closest("[data-emp]"); if (!c2) return;
      var emp2 = c2.dataset.emp, o2 = S.marquages[emp2][b.dataset.kind]; S.sel = emp2;
      if (act === "tcenter") { o2.dx = 0; o2.dy = 0; }
      else { var dir = parseInt(b.dataset.dir, 10); o2.rot = dir === 0 ? 0 : E.angleTexte((o2.rot || 0) + 90 * dir); }
      renderEmp(emp2); refresh();
    }
    else if (act === "fmt" || act === "rot" || act === "center") {
      var c1 = b.closest("[data-emp]"); if (!c1) return;
      var emp1 = c1.dataset.emp, m1 = S.marquages[emp1]; S.sel = emp1;
      if (act === "fmt") ajusteFormat(m1, b.dataset.fmt);
      else if (act === "rot") tourne(m1, parseInt(b.dataset.dir, 10) || 1);
      else { m1.dx = 0; m1.dy = 0; }
      renderEmp(emp1); refresh();
    }
    else if (act === "rmimg") { var card = b.closest("[data-emp]"); S.marquages[card.dataset.emp].image = null; renderEmp(card.dataset.emp); refresh(); }
    else if (act === "cart") ajouteAuPanier();
    else if (act === "pncancel") { PANIER.edit = null; razConfig(); panierSauve(); location.hash = "#/panier"; }
    else if (act === "pnedit" || act === "pndup" || act === "pndel") actionLigne(act, parseInt(b.dataset.lid, 10));
    else if (act === "dl") {
      var pb1 = problems(); showIssues(pb1);
      if (pb1.bloquants.length) return;
      download(fileName(), JSON.stringify(orderPayload()));
      toast("Fichier téléchargé. Joins-le au mail à l'étape suivante.");
    }
    else if (act === "mail") {
      var pb2 = problems(); showIssues(pb2);
      if (pb2.bloquants.length) return;
      var gm = document.createElement("a"); gmailLink(gm, mailHref()); document.body.appendChild(gm); gm.click(); gm.remove();   // Gmail s'ouvre dans un nouvel onglet
    }
    else if (act === "copy") {
      var pb3 = problems(); showIssues(pb3);
      if (pb3.bloquants.length) return;
      var txt = mailText(false);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast("Texte copié. Colle-le dans un mail à " + DATA.service.email + "."); }, function () { toast("Copie impossible, sélectionne le texte à la main."); });
      else toast("Copie impossible sur ce navigateur.");
    }
  }

  /* ---------- aperçu interactif : déplacer, agrandir, tourner le visuel ---------- */
  // Emplacement dont le visuel porte les poignées : celui qu'on a touché en dernier, s'il est visible sur cette vue, sinon le premier visible
  function empChoisi(piece) {
    var prod = prodOf(piece);
    var ok = usedEmps().filter(function (e) {
      var m = S.marquages[e], emp = DATA.emplacements[e];
      return m.actif && m.avecImage && !emp.texteSeul && P.zoneForView(prod, e, S.vue);
    });
    return ok.indexOf(S.sel) >= 0 ? S.sel : (ok[0] || null);
  }

  var drag = null, rafId = 0, dernierRefresh = 0;
  // Point de la souris dans le repère de la zone de l'emplacement (en cm, sur le dessin)
  function pointZone(ev, empId) {
    var g = $('#pv [data-zone="' + empId + '"]'), svg = g && g.ownerSVGElement, ctm = g && g.getScreenCTM();
    if (!svg || !ctm) return null;
    var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    return pt.matrixTransform(ctm.inverse());
  }
  function planifie(complet) {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = 0;
      var now = Date.now();
      if (complet && now - dernierRefresh > 140) { dernierRefresh = now; refresh(); } else renderPreview();
    });
  }
  function onPointerDown(e) {
    var pv = $("#pv");
    if (!pv || !pv.contains(e.target) || (e.button != null && e.button > 0)) return;
    var ro = e.target.closest("[data-pv-rotate]"), rs = e.target.closest("[data-pv-resize]"), mv = e.target.closest("[data-pv-move]");
    var empId = ro ? ro.dataset.pvRotate : rs ? rs.dataset.pvResize : mv ? mv.dataset.pvMove : null;
    if (!empId || !S.marquages[empId]) return;
    var m = S.marquages[empId]; S.sel = empId;
    e.preventDefault();
    if (ro) { tourne(m, 1); renderEmp(empId); refresh(); return; }
    var p0 = pointZone(e, empId); if (!p0) return;
    try { pv.setPointerCapture(e.pointerId); } catch (_) { /* sans capture, le glisser marche quand même tant que la souris reste sur l'aperçu */ }
    var g = E.imageGeom(m, CTX);
    if (rs) {
      // le coin tiré suit la souris : le visuel grandit à partir de son bord haut (ou de son centre sur une manche), sans se déformer
      var piece = S.pieces.filter(function (x) { return x.id === S.previewId; })[0] || S.pieces[0], prod = prodOf(piece), z = prod.zones[empId];
      var lay = E.stackFor(empId, m, piece, prod, CTX), it = lay.items.filter(function (x) { return x.kind === "image"; })[0];
      if (!it) return;
      var sleeve = z.cy != null, y0 = sleeve ? -lay.H / 2 : 0, bx = (it.ux || 0) - it.w / 2, by = y0 + it.dy + (it.uy || 0);
      var anchor = { x: bx + it.w / 2, y: sleeve ? by + it.h / 2 : by };
      var v0 = { x: bx + it.w - anchor.x, y: by + it.h - anchor.y };
      drag = { kind: "resize", emp: empId, id: e.pointerId, anchor: anchor, v0: v0, L0: g.w0 };
    } else drag = { kind: "move", emp: empId, id: e.pointerId, p0: p0, dx0: g.dx, dy0: g.dy };
    renderPreview();
  }
  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var m = S.marquages[drag.emp], p = pointZone(e, drag.emp); if (!p) return;
    if (drag.kind === "move") {
      m.dx = Math.max(-60, Math.min(60, Math.round((drag.dx0 + p.x - drag.p0.x) * 10) / 10));
      m.dy = Math.max(-60, Math.min(60, Math.round((drag.dy0 + p.y - drag.p0.y) * 10) / 10));
      planifie(false);
    } else {
      var v = { x: p.x - drag.anchor.x, y: p.y - drag.anchor.y }, d2 = drag.v0.x * drag.v0.x + drag.v0.y * drag.v0.y;
      if (d2 > 0) fixeLargeur(m, drag.L0 * Math.max(0.05, (v.x * drag.v0.x + v.y * drag.v0.y) / d2));
      planifie(true);
    }
    majChampsVisuel(drag.emp);
  }
  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var emp = drag.emp; drag = null;
    var pv = $("#pv"); try { if (pv) pv.releasePointerCapture(e.pointerId); } catch (_) { /* déjà relâché */ }
    renderEmp(emp); refresh();
  }
  function onFocusIn(e) {
    var card = e.target.closest && e.target.closest("[data-emp]");
    if (card && $("[data-view=cfg]") && S.sel !== card.dataset.emp) { S.sel = card.dataset.emp; renderPreview(); }
  }

  /* =================================================================== */
  /* ROUTAGE                                                             */
  /* =================================================================== */
  function route() {
    var h = location.hash || "#/";
    if (h.indexOf("#catalogue") === 0) return;
    if (h.indexOf("#/atelier") === 0) { location.replace("atelier.html"); return; }   // anciens liens vers l'atelier
    var cfg = h.match(/^#\/configurer(?:\/(.+))?$/), prod = h.match(/^#\/produits(?:\/([\w-]+))?$/), pan = h === "#/panier";
    if (cfg) {
      viewConfigurator(cfg[1]);
      window.scrollTo(0, 0);
    } else if (pan) {
      viewPanier();
      window.scrollTo(0, 0);
    } else {
      FILTRE.categorie = prod && prod[1] && categorieValide(prod[1]) ? prod[1] : "";
      viewVitrine();
      if (prod) defileVersCatalogue(); else window.scrollTo(0, 0);
    }
    $$("[data-nav]").forEach(function (el) {
      var actif = el.dataset.nav === (pan ? "panier" : cfg ? "cfg" : "vitrine");
      el.classList.toggle("on", actif);
      if (actif) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current");
    });
    basculeMenu(false);
  }

  function start() {
    app = $("#app");
    panierCharge(); majBadgePanier();
    document.addEventListener("input", onInput);
    document.addEventListener("change", onChange);
    document.addEventListener("click", onClick);
    document.addEventListener("click", onMenuClick);
    document.addEventListener("keydown", onMenuKey);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("focusin", onFocusIn);
    window.addEventListener("hashchange", route);
    $("#brand-name").textContent = DATA.service.nom.replace(/^Fabr'Icam\s+/i, "") || DATA.service.nom;   // le logo porte déjà « Fabr'Icam »
    $("#menu-panel").innerHTML = menuHTML();
    suitHauteurEntete();
    gmailLink($("#foot-mail"), gmailHref(DATA.service.email));
    gmailLink($("#top-note-mail"), autreVetementHref());
    $("#foot-mail").textContent = DATA.service.email;
    route();
  }

  var App = window.App = {
    CTX: CTX, S: S, DATA: DATA, PRIX: PRIX, esc: esc, fmtEUR: fmtEUR, fmtN: fmtN, $: $, $$: $$, byId: byId,
    EMP_ORDER: EMP_ORDER, toast: toast, download: download, slug: slug, measure: measure, ensureFont: ensureFont,
    orderOf: orderOf, start: start, colorOf: colorOf, pieceLine: pieceLine,
    vendeurInfo: vendeurInfo, matiereDe: matiereDe, photosOf: photosOf, lienOf: lienOf, liensVendeur: liensVendeur, liensHTML: liensHTML, mailHref: mailHref, gmailHref: gmailHref, mailText: mailText, problems: problems, orderPayload: orderPayload, itemOf: itemOf, groupName: groupName
  };
  if (!window.ATELIER_PAGE) window.addEventListener("load", start);
})();
