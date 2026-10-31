/*
 * ATELIER (interne) : page atelier.html, protégée par un mot de passe.
 *   Commande     : charger le fichier reçu par mail, ce qu'il faut acheter, commander, coûts et marge
 *   Pièces       : diaporama, une pièce à la fois (visuel, descriptif, emplacements, planche)
 *   Fabrication  : fiche imprimable avec les quantités          (atelier-impression.js)
 *   Planches     : les PNG prêts à envoyer au fournisseur        (atelier-impression.js)
 *   Paiement     : fiche de paiement et facture en PDF           (atelier-paiement.js)
 *   Base d'achats: tous les articles, leurs liens et les fournisseurs
 *
 * Le mot de passe n'est qu'une porte pour les curieux : le site est statique, tout le code est lisible dans le navigateur.
 * Il ne protège aucune donnée confidentielle.
 */
(function () {
  "use strict";

  var A = window.App, E = window.Engine, P = window.Preview, F = window.Fichiers;
  var esc = A.esc, fmtEUR = A.fmtEUR, fmtN = A.fmtN, $ = A.$, $$ = A.$$;

  var MDP = "2024";
  var CLE_OK = "fabricam-atelier-ok", CLE_CMD = "fabricam-atelier-commande";
  var VUES = ["commande", "pieces", "fabrication", "planches", "paiement", "base"];
  var ABBR = { poitrine: "P", dos: "D", manche_g: "MG", manche_d: "MD", cuisse_g: "CG", cuisse_d: "CD", bas_jambe_g: "BJ", chaussette_g: "SG", chaussette_d: "SD", sac: "SA", gourde: "GO", casquette: "CA", bonnet: "BO", tour_de_cou: "TC", bandeau: "BA", ceinture: "CE", serviette: "SE", ouvre_bouteille: "OB", porte_cles: "PC" };
  var KIND = { image: "v", prenom: "p", numero: "n", texte: "t" };
  var KIND_NOM = { image: "visuel", prenom: "prénom", numero: "numéro", texte: "texte libre" };
  var views = {};

  // st : la commande chargée et tout ce qu'on en déduit
  var st = { unlocked: false, order: null, contact: {}, prixAffiche: null, creeLe: null, fichier: "", res: null, sheets: [], motifSheet: {}, imgs: {}, alertes: [], vue: "commande" };

  /* ---------- petits outils ---------- */
  function sget(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { if (v == null) window.sessionStorage.removeItem(k); else window.sessionStorage.setItem(k, v); } catch (e) { /* stockage refusé : on s'en passe */ } }
  function lget(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function plur(n, un, plusieurs) { return n + " " + (n > 1 ? plusieurs : un); }
  function fmtPct(x) { return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(x * 100) + " %"; }
  function fmtDate(iso) { return iso ? new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""; }
  function photoSrc(url, w) { return url + (url.indexOf("?") < 0 && /mediadecathlon\.com/.test(url) ? "?format=auto&f=" + w + "x0" : ""); }
  function colorOf(piece) { return A.colorOf(piece); }
  function prodOf(piece) { return A.byId[piece.produitId]; }
  function lienDe(prod, col) { return (col && col.lien) || prod.lien || ""; }
  // Prix d'achat de cette couleur (celui de la couleur si elle en a un, sinon celui de l'article)
  function achatDe(prod, col) { return E.prixAchatPiece(prod, col && col.id); }
  // Photo de cette couleur (la première de sa série), à défaut celle de l'article
  function photoDe(prod, col) { return A.photosOf(prod, col)[0] || ""; }
  // Couleur signalée en rupture de stock sur Decathlon au moment de la relecture du catalogue (champ rupture : date AAAA-MM-JJ)
  function ruptureTag(col) {
    return col && col.rupture ? ' <span class="tag rupt" title="Signalée en rupture de stock sur Decathlon le ' + esc(fmtDateCourte(col.rupture)) + '. Vérifie le stock avant de commander.">rupture au ' + esc(fmtDateCourte(col.rupture)) + "</span>" : "";
  }
  // Nom de la couleur tel que la boutique l'affiche, quand il diffère du nom du catalogue (« bleu acier » pour notre « Marine »)
  function nomDecTag(col, prod) {
    var v = prod ? A.vendeurInfo(prod) : null, ou = v && v.plateforme !== "Decathlon" ? v.plateforme : "Decathlon";
    return col && col.nomDec && norm(col.nomDec) !== norm(col.nom) ? ' <span class="muted">(' + esc(ou) + " : " + esc(col.nomDec) + ")</span>" : "";
  }
  function fmtDateCourte(iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(8) + "/" + iso.slice(5, 7) : String(iso); }
  // Fourchette de prix d'achat d'un article dont les couleurs ne coûtent pas toutes pareil
  function prixAchatTxt(prod) {
    var v = prod.couleurs.map(function (c) { return achatDe(prod, c); }), min = Math.min.apply(null, v), max = Math.max.apply(null, v);
    return min === max ? fmtEUR(min) : "de " + fmtEUR(min) + " à " + fmtEUR(max);
  }
  // Raccourcis vers l'article (dans cette couleur) et vers la boutique de son vendeur
  function liensAchat(prod, col) {
    var v = A.vendeurInfo(prod), href = lienDe(prod, col), out = [];
    if (href) out.push(lien(href, v ? "Voir chez " + esc(v.nom) : "Ouvrir la fiche Decathlon"));
    if (v && v.lien) out.push(lien(v.lien, "Boutique du vendeur"));
    return out;
  }
  // Plateforme de vente d'un article : Decathlon (magasin ou place de marché) ou AliExpress
  function plateformeDe(prod) { var v = A.vendeurInfo(prod); return v ? v.plateforme : "Decathlon"; }
  // Nom d'un ou plusieurs lieux d'achat en ligne : « Articles de la place de marché Decathlon », « Articles Amazon », « Articles de la place de marché Decathlon, d'AliExpress et d'Amazon »
  function libelleMarche(pfs) {
    if (pfs.length === 1) return pfs[0] === "Decathlon" ? "Articles de la place de marché Decathlon" : "Articles " + pfs[0];
    var noms = pfs.map(function (p) { return p === "Decathlon" ? "de la place de marché Decathlon" : (/^[AEIOUH]/.test(p) ? "d'" : "de ") + p; });
    return "Articles " + noms.slice(0, -1).join(", ") + " et " + noms[noms.length - 1];
  }
  // Où s'achète un article, en une phrase : « Place de marché : X » (Decathlon), « AliExpress : X » ou « Decathlon, retrait en magasin »
  function sourceTxt(v) { return v ? (v.plateforme === "Decathlon" ? "Place de marché : " : v.plateforme + " : ") + v.nom : "Decathlon, retrait en magasin"; }
  function lien(href, texte) { return href ? '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + texte + "</a>" : ""; }
  function sw(hex) { return '<span class="sw" style="background:' + esc(hex) + '"></span>'; }
  function table(head, rows, cls) {
    return '<div class="tablewrap"><table class="tbl ' + (cls || "") + '"><thead><tr>' + head.map(function (h) { return "<th" + (h.num ? ' class="num"' : "") + ">" + esc(typeof h === "string" ? h : h.t) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c, i) { var n = head[i] && head[i].num; return "<td" + (n ? ' class="num"' : "") + ">" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }
  function empty(titre, texte) {
    return '<section class="at-empty"><h1>' + esc(titre) + "</h1><p>" + texte + '</p><a class="btn btn-primary" href="#/commande">Charger une commande</a></section>';
  }

  /* ---------- lecture du fichier de commande ---------- */
  // Fichier à plusieurs configurations (version 3, panier du site) : une commande par entrée, commune au contact
  function parseOrderFile(text) {
    var j = JSON.parse(text);
    if (j && Array.isArray(j.commandes)) {
      if (!j.commandes.length) throw new Error("Cette commande ne contient aucune configuration.");
      var lots = j.commandes.map(function (c) { return parseOne(Object.assign({}, c, { contact: j.contact || c.contact, creeLe: j.creeLe || c.creeLe })); });
      lots.forEach(function (o, i) { o.lots = lots; o.lot = i; });
      return lots[0];
    }
    return parseOne(j);
  }
  function parseOne(j) {
    if (!j || !Array.isArray(j.pieces) || !j.marquages) throw new Error("Ce fichier n'est pas une commande de " + A.DATA.service.nom + ".");
    // un produit renommé garde l'ancien identifiant dans « anciensId » : la commande déjà envoyée se recharge quand même
    var ancien = {};
    A.DATA.produits.forEach(function (pr) { (pr.anciensId || []).forEach(function (id) { ancien[id] = pr.id; }); });
    j.pieces.forEach(function (p) { if (!A.byId[p.produitId] && ancien[p.produitId]) p.produitId = ancien[p.produitId]; });
    var bad = j.pieces.filter(function (p) { return !A.byId[p.produitId]; })[0];
    if (bad) throw new Error("Un modèle de la commande n'est plus dans le catalogue : " + bad.produitId + ".");
    if (!j.pieces.length) throw new Error("Cette commande ne contient aucune pièce.");
    return { order: { pieces: j.pieces, marquages: j.marquages, technique: j.technique || "dtf" }, contact: j.contact || {}, prixAffiche: j.prixAffiche || null, creeLe: j.creeLe || null };
  }

  function fontsFor(order) {
    var set = {};
    Object.keys(order.marquages || {}).forEach(function (e) {
      var m = order.marquages[e];
      ["prenom", "numero", "texte"].forEach(function (k) { if (m && m[k] && m[k].actif && m[k].police) set[m[k].police] = 1; });
    });
    return Object.keys(set);
  }
  function loadFonts(order) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(fontsFor(order).map(function (f) { return document.fonts.load('200px "' + f + '"', "AÉHg0").catch(function () {}); }));
  }

  // Charge les visuels de la commande (dimensions, transparence) pour dessiner les planches et vérifier leur qualité
  // Configurations de la demande : la liste des commandes (la configuration affichée est st.order, qui peut avoir été retouchée)
  function lotOrders() {
    if (!st.order) return [];
    if (!st.lots) return [st.order];
    return st.lots.map(function (o, k) { return k === st.lot ? st.order : o.order; });
  }
  // Commande d'un motif (de la configuration affichée ou d'une autre, quand une planche est partagée entre configurations)
  function orderDe(mo) {
    if (mo.lot == null || !st.lots) return st.order;
    return mo.lot === st.lot ? st.order : st.lots[mo.lot].order;
  }
  // Image chargée du visuel d'un motif
  function imgInfo(mo) {
    var m = mo.lot != null && st.lotImgs && st.lotImgs[mo.lot];
    return (m ? m : st.imgs)[mo.emp];
  }
  // Charge les visuels de toutes les configurations : les planches sont communes, elles portent des visuels de chacune
  function loadImgs() {
    var orders = lotOrders();
    st.lotImgs = orders.map(function () { return {}; });
    return Promise.all(orders.map(function (o, k) { return loadImgsDe(o, st.lotImgs[k]); })).then(function () { st.imgs = st.lotImgs[st.lots ? st.lot : 0] || {}; });
  }
  function loadImgsDe(order, imgs) {
    var jobs = [];
    Object.keys(order.marquages).forEach(function (e) {
      var m = order.marquages[e];
      if (!m || !m.actif || m.avecImage === false || !m.image || !m.image.dataUrl) return;
      jobs.push(new Promise(function (ok) {
        var img = new Image(), url = m.image.dataUrl;
        var type = (url.match(/^data:([^;,]+)/) || [])[1] || "";
        img.onload = function () {
          var info = { img: img, nw: img.naturalWidth || 0, nh: img.naturalHeight || 0, type: type, vector: /svg/.test(type), jpeg: /jpe?g/.test(type), opaque: /jpe?g/.test(type) };
          if (!info.vector && !info.jpeg && info.nw && info.nh) {
            try {   // une image PNG ou WebP sans aucun pixel transparent imprimera son fond
              var k = Math.min(1, 160 / Math.max(info.nw, info.nh)), c = document.createElement("canvas");
              c.width = Math.max(1, Math.round(info.nw * k)); c.height = Math.max(1, Math.round(info.nh * k));
              var cx = c.getContext("2d"); cx.drawImage(img, 0, 0, c.width, c.height);
              var d = cx.getImageData(0, 0, c.width, c.height).data, min = 255;
              for (var i = 3; i < d.length; i += 4) if (d[i] < min) min = d[i];
              info.opaque = min >= 250;
            } catch (err) { /* lecture des pixels impossible : on ne dit rien */ }
          }
          imgs[e] = info; ok();
        };
        img.onerror = function () { imgs[e] = { img: null, error: true, type: type }; ok(); };
        img.src = url;
      }));
    });
    return Promise.all(jobs);
  }

  /* ---------- calculs déduits de la commande ---------- */
  function recompute() {
    var o = st.order;
    st.sheets = []; st.motifSheet = {}; st.basket = null;
    if (!o) { st.res = null; st.alertes = []; return; }
    // Les motifs de toutes les configurations sont rangés ensemble sur les mêmes planches (version 8.0.0) ;
    // st.res est le résultat de la configuration affichée (ses coûts sont sa part), les planches sont celles de toute la demande.
    st.basket = E.computeBasket(lotOrders(), A.CTX);
    var r = st.res = st.basket.lots[st.lots ? st.lot : 0];
    ["dtf", "sublimation"].forEach(function (techno) {
      var plan = r.plans[techno]; if (!plan) return;
      var sorted = plan.sheets.slice().sort(function (a, b) { return b.format.w * b.format.h - a.format.w * a.format.h; });
      sorted.forEach(function (sh, i) {
        st.sheets.push({ techno: techno, num: i + 1, total: sorted.length, sheet: sh, key: techno + "-" + (i + 1), code: (techno === "dtf" ? "DTF " : "Subli ") + (i + 1) });
      });
    });
    st.sheets.forEach(function (s) { s.sheet.placed.forEach(function (p) { st.motifSheet[p.ref.motif.id] = s; }); });
    st.alertes = alertes();
  }

  // Résolution effective d'un visuel raster une fois posé dans sa case, en points par pouce
  function dpiVisuel(emp) {
    var info = st.imgs[emp], m = st.res && st.res.motifs.filter(function (x) { return x.emp === emp && x.avecImage; })[0];
    var vis = m && E.motifImage(m);      // le visuel, seul ou dans un bloc collé : c'est sa taille qui compte
    if (!info || !info.img || info.vector || !vis || !info.nw || !info.nh) return null;
    return Math.round(2.54 / Math.min((vis.w0 != null ? vis.w0 : vis.w) / info.nw, (vis.h0 != null ? vis.h0 : vis.h) / info.nh));      // taille du visuel avant rotation
  }

  function alertes() {
    var o = st.order, r = st.res, out = r.warnings.slice();
    Object.keys(o.marquages).forEach(function (e) {
      var m = o.marquages[e], emp = A.DATA.emplacements[e];
      if (!m || !m.actif || m.avecImage === false || !emp || emp.texteSeul) return;
      var usedBy = r.motifs.some(function (x) { return x.emp === e && x.avecImage; });
      if (!usedBy) return;
      var nom = emp.label;
      var info = st.imgs[e];
      if (!m.image || !m.image.dataUrl) { out.push(nom + " : le fichier de commande ne contient pas le visuel. Récupère-le dans le mail du client et ajoute-le dans l'onglet Planches."); return; }
      if (!info || info.error || !info.img) { out.push(nom + " : le visuel n'a pas pu être lu (format non pris en charge). Remplace-le par un PNG."); return; }
      if (info.jpeg) out.push(nom + " : le visuel est un JPEG, il n'a pas de transparence. Son fond blanc sera imprimé en blanc sur la planche.");
      else if (info.opaque) out.push(nom + " : le visuel n'a aucune zone transparente. Son fond sera imprimé comme un rectangle.");
      var dpi = dpiVisuel(e);
      if (dpi != null && dpi < 150) out.push(nom + " : le visuel est peu défini (" + info.nw + " × " + info.nh + " px, environ " + dpi + " dpi à la taille imprimée). Le rendu risque d'être flou, 300 dpi est l'idéal.");
      // Gravure laser ou vinyle : la machine suit un tracé, pas des pixels
      if (!info.vector && r.motifs.some(function (x) { return x.emp === e && x.avecImage && x.techno === "gravure"; })) out.push(nom + " : gravure laser ou vinyle thermocollant, la machine suit un tracé. Ce visuel est une image (PNG ou JPEG) : demande le fichier vectoriel (SVG) au client, ou vectorise-le et fais un essai avant de lancer la série.");
    });
    var apportes = o.pieces.filter(function (p) { return prodOf(p).apporte; }), inconnues = apportes.filter(function (p) { return A.matiereDe(p).id === "inconnu"; });
    if (apportes.length) out.push(plur(apportes.length, "vêtement apporté", "vêtements apportés") + " par le client : à réceptionner et à contrôler (matière, état, tenue à la chaleur) avant de presser. Convenir avec lui du lieu et de la date de dépôt.");
    if (inconnues.length) out.push(plur(inconnues.length, "pièce apportée dont la matière est inconnue", "pièces apportées dont la matière est inconnue") + " : lis l'étiquette avant de régler la presse. Le DTF est prévu par défaut.");
    fontsFor(o).forEach(function (f) {
      if (document.fonts && document.fonts.check && !document.fonts.check('200px "' + f + '"', "AÉHg0")) out.push("La police " + f + " n'est pas chargée (connexion ?). Les planches utiliseraient une police de remplacement : reconnecte-toi et recharge la page avant de les télécharger.");
    });
    return out;
  }

  function prepare() {
    return loadFonts(st.order).then(function () { return loadImgs(); }).then(recompute);
  }

  var saveWarned = false;
  function save() {
    if (!st.order) { lset(CLE_CMD, null); return; }
    var ok = lset(CLE_CMD, JSON.stringify({ order: st.order, contact: st.contact, prixAffiche: st.prixAffiche, creeLe: st.creeLe, fichier: st.fichier,
      lots: st.lots ? st.lots.map(function (o) { return { order: o.order, contact: o.contact, prixAffiche: o.prixAffiche, creeLe: o.creeLe }; }) : null, lot: st.lot }));
    if (!ok && !saveWarned) { saveWarned = true; A.toast("La commande est trop lourde pour être gardée dans ce navigateur : recharge le fichier si tu rafraîchis la page."); }
  }

  function setLoaded(obj, fichier, silent) {
    st.lots = obj.lots || null; st.lot = obj.lot || 0;
    st.order = obj.order; st.contact = obj.contact || {}; st.prixAffiche = obj.prixAffiche || null; st.creeLe = obj.creeLe || null; st.fichier = fichier || "";
    if (st.lots && st.lots[st.lot]) st.lots[st.lot].order = st.order;      // une même commande pour la configuration affichée et la liste (visuels remplacés compris)
    return prepare().then(function () {
      save();
      if (silent) return;
      if ((location.hash || "").indexOf("#/commande") === 0 || !location.hash) route(); else location.hash = "#/commande";
    });
  }

  function closeOrder() {
    st.lots = null; st.lot = 0;
    st.order = null; st.contact = {}; st.prixAffiche = null; st.creeLe = null; st.fichier = ""; st.imgs = {}; st.lotImgs = [];
    recompute(); save(); route();
  }

  function readFile(file) {
    if (!file) return;
    var rd = new FileReader();
    rd.onload = function () {
      var obj;
      try { obj = parseOrderFile(rd.result); } catch (err) { A.toast(err instanceof SyntaxError ? "Ce fichier est illisible. Il faut le fichier .json joint au mail de commande." : (err.message || "Fichier illisible.")); return; }
      setLoaded(obj, file.name).then(function () { A.toast("Commande chargée : " + plur(st.order.pieces.length, "pièce", "pièces") + "."); });
    };
    rd.readAsText(file);
  }

  /* ---------- commande d'exemple (pour essayer l'atelier sans fichier) ---------- */
  function exemple() {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560"><path d="M40 40h320v300c0 110-90 170-160 200C130 510 40 450 40 340z" fill="#e8451e"/><path d="M80 80h240v250c0 80-65 130-120 155-55-25-120-75-120-155z" fill="#fff"/><text x="200" y="300" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="120" fill="#14213d">FC</text></svg>';
    var img = { nom: "exemple-ecusson.svg", dataUrl: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg) };
    function mk(emp, o) {
      var f = A.DATA.emplacements[emp];
      return Object.assign({ actif: false, avecImage: !f.texteSeul, image: null, format: f.formats[0] || "A6", orient: "portrait", maj: true, textePos: "dessous",
        prenom: { actif: false, hauteur: 3, police: "Bebas Neue", couleur: "#ffffff" }, numero: { actif: false, hauteur: 8, police: "Bebas Neue", couleur: "#ffffff" } }, o);
    }
    var marq = {};
    Object.keys(A.DATA.emplacements).forEach(function (e) { marq[e] = mk(e, {}); });
    marq.poitrine = mk("poitrine", { actif: true, image: img, format: "A6" });
    marq.dos = mk("dos", { actif: true, avecImage: false, format: "A5", prenom: { actif: true, hauteur: 5, police: "Anton", couleur: "#ffffff" }, numero: { actif: true, hauteur: 16, police: "Anton", couleur: "#e8451e" } });
    marq.cuisse_g = mk("cuisse_g", { actif: true, image: img, format: "A6" });
    marq.chaussette_g = mk("chaussette_g", { actif: true, prenom: { actif: true, hauteur: 2.5, police: "Bebas Neue", couleur: "#ffffff" } });
    var noms = [["Léo", "7"], ["Inès", "10"], ["Hugo", "4"], ["Zoé", "23"]], pieces = [], n = 1;
    noms.forEach(function (x, i) {
      ["maillot-basket", "short-basket", "chaussettes-football"].forEach(function (pid) {
        var pr = A.byId[pid];
        pieces.push({ id: "p" + (n++), produitId: pid, couleurId: pr.couleurs[0].id, taille: pr.tailles[Math.min(2, pr.tailles.length - 1)], prenom: x[0], numero: x[1] });
      });
    });
    ["polo-essential"].forEach(function (pid) {
      for (var i = 0; i < 3; i++) pieces.push({ id: "p" + (n++), produitId: pid, couleurId: A.byId[pid].couleurs[i % A.byId[pid].couleurs.length].id, taille: ["M", "L", "XL"][i], prenom: "", numero: "" });
    });
    return { order: { pieces: pieces, marquages: marq, technique: "dtf" }, contact: { asso: "BDE d'exemple", nom: "Camille Martin", email: "camille@exemple.fr", tel: "06 00 00 00 00", date: "", message: "Commande d'exemple pour essayer l'atelier : rien de réel." }, prixAffiche: null, creeLe: null };
  }

  /* ---------- listes : achats, presse ---------- */
  function achats(order) {
    var g = {}, list = [];
    order.pieces.forEach(function (p) {
      var prod = prodOf(p), col = colorOf(p);
      var mat = prod.apporte ? A.matiereDe(p) : null;     // vêtement apporté par le client : sa matière compte pour le réglage
      var k = prod.id + "|" + col.id + "|" + p.taille + "|" + (mat ? mat.id : "");
      if (!g[k]) { g[k] = { prod: prod, col: col, taille: p.taille, matiere: mat, qty: 0 }; list.push(g[k]); }
      g[k].qty++;
    });
    list.sort(function (a, b) { return a.prod.nom.localeCompare(b.prod.nom) || a.col.nom.localeCompare(b.col.nom) || a.prod.tailles.indexOf(a.taille) - b.prod.tailles.indexOf(b.taille); });
    return list;
  }

  function pressNotes(order, r) {
    var notes = [], pr = A.PRIX.presse;
    var usesPoly = false, usesOther = false, usesGrav = false, usesVin = false, usesSub = r.motifs.some(function (m) { return m.techno === "sublimation"; });
    order.pieces.forEach(function (p) {
      var prod = prodOf(p), tech = E.pieceTechno(order, p, A.CTX);
      if (tech === "dtf") { if (E.polyesterPiece(prod, p) >= 50) usesPoly = true; else usesOther = true; }
      if (tech === "gravure") usesGrav = true;
      if (tech === "vinyle") usesVin = true;
    });
    if (usesPoly) notes.push(pr.dtf_polyester);
    if (usesOther) notes.push(pr.dtf_autre);
    if (usesSub) notes.push(pr.sublimation);
    if (usesVin) notes.push(pr.vinyle);
    if (usesGrav) notes.push(pr.gravure);
    var vus = {};
    order.pieces.forEach(function (p) { var prod = prodOf(p); if (prod.avertissement && !vus[prod.id]) { vus[prod.id] = 1; notes.push(prod.avertissement); } });
    if (usesPoly || usesOther || usesSub || usesVin || !usesGrav) notes.push("Plateau de la presse : " + A.PRIX.plateau.w + " × " + A.PRIX.plateau.h + " cm au maximum. Les motifs en DTF se découpent le long de leur case sur la planche.");
    return notes;
  }

  // Réglage de presse à afficher pour une pièce
  function presseDe(piece) {
    var pr = A.PRIX.presse, prod = prodOf(piece), tech = E.pieceTechno(st.order, piece, A.CTX);
    if (tech === "sublimation") return { tech: "sublimation", texte: pr.sublimation };
    if (tech === "gravure") return { tech: "gravure", texte: pr.gravure };
    if (tech === "vinyle") return { tech: "vinyle", texte: pr.vinyle };
    return { tech: "dtf", texte: E.polyesterPiece(prod, piece) >= 50 ? pr.dtf_polyester : pr.dtf_autre };
  }

  // Éléments à poser sur une pièce, dans l'ordre des emplacements : { emp, label, items:[motif] }
  function marquagesDe(piece) {
    var r = st.res, prod = prodOf(piece), out = [];
    A.EMP_ORDER.forEach(function (e) {
      if (!prod.zones[e]) return;
      var mine = r.motifs.filter(function (m) { return m.pieceId === piece.id && m.emp === e; });
      if (!mine.length) return;
      var order = { bloc: 0, image: 0, prenom: 1, numero: 2 };
      mine.sort(function (a, b) { return order[a.kind] - order[b.kind]; });
      out.push({ emp: e, label: (prod.zones[e] && prod.zones[e].label) || A.DATA.emplacements[e].label, items: mine });
    });
    return out;
  }

  // Description lisible d'un motif : « Visuel A6, 10 × 14 cm », « Prénom LÉO, Bebas Neue, 4 cm »
  function elementTexte(el, cfg) {
    if (el.kind === "image") return "Visuel " + esc(E.descriptionVisuel(cfg, A.CTX) || (fmtN(el.w) + " × " + fmtN(el.h) + " cm"));
    var pos = [];
    if (el.rot) pos.push("tourné de " + fmtN(el.rot) + "°");
    if (Math.abs(el.tx || 0) >= 0.05) pos.push("décalé de " + fmtN(Math.abs(el.tx)) + " cm vers la " + (el.tx > 0 ? "droite" : "gauche"));
    if (Math.abs(el.ty || 0) >= 0.05) pos.push("décalé de " + fmtN(Math.abs(el.ty)) + " cm vers le " + (el.ty > 0 ? "bas" : "haut"));
    return (el.kind === "prenom" ? "Prénom " : el.kind === "texte" ? "Texte libre (" + (el.lignes ? el.lignes.length : 1) + (el.lignes && el.lignes.length > 1 ? " lignes" : " ligne") + ") " : "Numéro ") + "<b>" + esc(el.text) + "</b>, " + esc(el.police) + ", " + fmtN(el.hauteur) + " cm de haut" + (pos.length ? ", " + pos.join(", ") : "");
  }
  // Un bloc collé : « Bloc collé, 10 × 23,1 cm : visuel A6 + prénom LÉO + numéro 7 », éléments centrés, de haut en bas
  function motifTexte(m) {
    var cfg = orderDe(m).marquages[m.emp] || {};
    if (m.kind !== "bloc") return elementTexte(m.el, cfg);
    return "<b>Bloc collé</b>, " + fmtN(m.w) + " × " + fmtN(m.h) + " cm, à presser d'un coup" +
      '<ul class="bloc-liste">' + m.el.items.map(function (it) { return "<li>" + elementTexte(it, cfg) + "</li>"; }).join("") + "</ul>";
  }
  // Repère d'un motif : numéro de la pièce, emplacement, puis une lettre par élément (un bloc en porte plusieurs : 3·Pvpn)
  // Avec plusieurs configurations (planches communes), le repère commence par le numéro de la configuration : C2·3·Pv
  function codeMotif(m) { return (m.lot != null ? "C" + (m.lot + 1) + "·" : "") + (m.pieceIdx + 1) + "·" + ABBR[m.emp] + (m.kind === "bloc" ? m.el.items.map(function (i) { return KIND[i.kind]; }).join("") : KIND[m.kind]); }

  /* =================================================================== */
  /* PORTE                                                               */
  /* =================================================================== */
  function showGate() {
    $("#at-nav").hidden = true; $("#at-tools").hidden = true;
    $("#app").innerHTML =
      '<section class="gate"><form id="gate-form" class="gate-card" autocomplete="off"><img class="gate-logo" src="img/logo-fabricam.png" alt="Fabr\'Icam" width="900" height="880"><h1>Atelier</h1>' +
      "<p>Cet espace est réservé à l'équipe Fabr'Icam : fiche de fabrication, planches prêtes à envoyer, fiches de paiement, factures et base d'achats.</p>" +
      '<label>Mot de passe<input id="gate-pw" type="password" inputmode="numeric" autocomplete="off" required></label>' +
      '<p class="gate-err" id="gate-err" role="alert" hidden>Mot de passe incorrect. Réessaie.</p>' +
      '<div class="toolbar"><button class="btn btn-primary" type="submit">Ouvrir l\'atelier</button><a href="index.html">Retour au catalogue</a></div></form></section>';
    $("#gate-pw").focus();
    $("#gate-form").addEventListener("submit", function (e) {
      e.preventDefault();
      if ($("#gate-pw").value.trim() === MDP) unlock();
      else { $("#gate-err").hidden = false; $("#gate-pw").select(); }
    });
  }

  function unlock() {
    st.unlocked = true; sset(CLE_OK, "1");
    $("#at-tools").hidden = false;
    var saved = lget(CLE_CMD);
    if (saved && !st.order) {
      try {
        var j = JSON.parse(saved), lots = Array.isArray(j.lots) ? j.lots : null;
        if (lots) lots.forEach(function (o, i) { o.lots = lots; o.lot = i; });
        setLoaded({ order: j.order, contact: j.contact, prixAffiche: j.prixAffiche, creeLe: j.creeLe, lots: lots, lot: j.lot || 0 }, j.fichier, true).then(route); return;
      }
      catch (e) { lset(CLE_CMD, null); }
    }
    route();
  }

  function lock() {
    st.unlocked = false; sset(CLE_OK, null); showGate();
  }

  /* =================================================================== */
  /* NAVIGATION                                                          */
  /* =================================================================== */
  var LABELS = { commande: "Commande", pieces: "Pièces", fabrication: "Fiche de fabrication", planches: "Planches à envoyer", paiement: "Paiement et facture", base: "Base d'achats" };
  function renderNav(v) {
    var n = st.order ? st.order.pieces.length : 0, s = st.sheets.length;
    var count = { pieces: n ? n : "", planches: s ? s : "" };
    $("#at-nav").hidden = false;
    $("#at-nav").innerHTML = VUES.map(function (k) {
      return '<a href="#/' + k + '"' + (k === v ? ' class="on" aria-current="page"' : "") + ">" + esc(LABELS[k]) + (count[k] ? ' <span class="cnt">' + count[k] + "</span>" : "") + "</a>";
    }).join("");
  }

  function route() {
    if (!st.unlocked) { showGate(); return; }
    var parts = (location.hash || "#/commande").replace(/^#\/?/, "").split("/");
    var v = VUES.indexOf(parts[0]) >= 0 ? parts[0] : "commande";
    st.vue = v;
    renderNav(v);
    document.title = LABELS[v] + " – Atelier Fabr'Icam";
    views[v](parts[1]);
    window.scrollTo(0, 0);
  }

  /* =================================================================== */
  /* COMMANDE                                                            */
  /* =================================================================== */
  views.commande = function () {
    var app = $("#app");
    if (!st.order) {
      app.innerHTML =
        '<section class="drop" id="drop"><h1>Une commande à préparer</h1>' +
        "<p>Dépose ici le fichier de commande reçu par mail (un fichier <b>.json</b>), ou choisis-le sur l'ordinateur. L'atelier en tire la liste des achats, les pièces une à une, la fiche de fabrication et les planches à envoyer à " + esc(A.PRIX.fournisseur.nom) + ".</p>" +
        '<div class="toolbar"><label class="filebtn big">Choisir le fichier de commande<input id="a-file" type="file" accept=".json,application/json"></label>' +
        '<button type="button" class="linkbtn" id="a-exemple">Essayer avec une commande d\'exemple</button></div></section>' + etapes(false);
      $("#a-file").addEventListener("change", function (e) { readFile(e.target.files && e.target.files[0]); });
      $("#a-exemple").addEventListener("click", function () { setLoaded(exemple(), "exemple").then(function () { A.toast("Commande d'exemple chargée."); }); });
      return;
    }
    var o = st.order, c = st.contact, r = st.res, pv = r.prix, html = "";

    html += '<section class="a-head"><div><h1>' + esc(c.asso || "Association inconnue") + "</h1><p class=\"a-who\">" +
      (c.nom ? esc(c.nom) : "") + (c.email ? ", " + lien(A.gmailHref(c.email, "Ta commande de flocage"), esc(c.email)) : "") + (c.tel ? ", " + esc(c.tel) : "") + "</p>" +
      (c.date ? '<p class="a-date">Pour le <b>' + esc(fmtDate(c.date)) + "</b> " + joursRestants(c.date) + "</p>" : "") +
      (c.message ? "<blockquote>" + esc(c.message) + "</blockquote>" : "") + "</div>" +
      (st.lots ? '<div class="a-lots" role="group" aria-label="Configurations de la demande"><span>Configuration</span>' + st.lots.map(function (o, k) {
        return '<button type="button" class="chip" data-lot="' + k + '" aria-pressed="' + (k === st.lot) + '">' + (k + 1) + " · " + plur(o.order.pieces.length, "pièce", "pièces") + "</button>"; }).join("") + "</div>" : "") +
      '<div class="a-actions"><label class="filebtn">Charger une autre commande<input id="a-file" type="file" accept=".json,application/json"></label>' +
      '<button type="button" class="btn btn-quiet" id="a-close">Fermer la commande</button></div></section>';

    var motifs = r.motifs.length, nbPl = st.sheets.length;
    html += '<dl class="at-stats">' +
      stat(r.N, r.N > 1 ? "pièces" : "pièce") + stat(motifs, motifs > 1 ? "motifs à presser" : "motif à presser") +
      stat(nbPl, nbPl > 1 ? "planches à commander" : "planche à commander") + stat(pv ? fmtEUR(pv.total) : "–", "à facturer") + stat(pv ? fmtEUR(pv.marge) : "–", "de marge") + "</dl>";

    html += etapes(true);
    html += '<section class="a-block" id="achats-bloc">' + achatsHtml() + "</section>";
    html += '<section class="a-block">' + planchesHtml() + "</section>";
    html += '<section class="a-block"><h2>Coûts et prix</h2>' + coutsHtml() + "</section>";
    if (st.alertes.length) html += '<section class="a-block"><h2>À vérifier</h2><ul class="warn">' + st.alertes.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></section>";
    app.innerHTML = html;

    $("#a-file").addEventListener("change", function (e) { readFile(e.target.files && e.target.files[0]); });
    $$("[data-lot]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = Number(b.dataset.lot), o = st.lots[k];
        setLoaded({ order: o.order, contact: o.contact, prixAffiche: o.prixAffiche, creeLe: o.creeLe, lots: st.lots, lot: k }, st.fichier);
      });
    });
    $("#a-close").addEventListener("click", function () { if (window.confirm("Fermer cette commande ? Elle ne sera plus gardée dans ce navigateur. Le fichier reçu par mail reste valable.")) closeOrder(); });
    $$("[data-scroll]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); var t = $(b.dataset.scroll); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }); });
    var cp = $("#a-copy"); if (cp) cp.addEventListener("click", copierAchats);
  };

  function stat(v, label) { return '<div class="st"><dt>' + esc(label) + "</dt><dd>" + esc(v) + "</dd></div>"; }

  function joursRestants(iso) {
    var d = Math.round((new Date(iso + "T12:00:00") - new Date(new Date().toDateString() + " 12:00:00")) / 86400000);
    if (d > 1) return '<span class="muted">(dans ' + d + " jours)</span>";
    if (d === 1) return '<span class="muted">(demain)</span>';
    if (d === 0) return '<span class="late">(aujourd\'hui)</span>';
    return '<span class="late">(en retard de ' + plur(-d, "jour", "jours") + ")</span>";
  }

  function etapes(avecLiens) {
    function it(titre, texte, href, scroll) {
      var inner = "<b>" + esc(titre) + "</b><span>" + esc(texte) + "</span>";
      if (!avecLiens) return "<li>" + inner + "</li>";
      return scroll ? '<li><a href="#" data-scroll="' + scroll + '">' + inner + "</a></li>" : '<li><a href="' + href + '">' + inner + "</a></li>";
    }
    return '<ol class="at-steps" aria-label="Le principe">' +
      it("Acheter les vêtements", "Decathlon en magasin ou en ligne, Amazon et AliExpress pour quelques articles, avec les liens de chaque article.", "", "#achats-bloc") +
      it("Commander les planches", "Une image prête à envoyer par planche, au format exact du fournisseur.", "#/planches") +
      it("Presser et contrôler", "Une fiche de fabrication à imprimer, et les pièces à la suite sur écran.", "#/fabrication") + "</ol>";
  }

  function achatsHtml() {
    var o = st.order, tous = achats(o), r = st.res;
    var apportes = tous.filter(function (a) { return a.prod.apporte; }), ach = tous.filter(function (a) { return !a.prod.apporte; });
    var magasin = ach.filter(function (a) { return !a.prod.vendeur; }), enligne = ach.filter(function (a) { return a.prod.vendeur; });
    var aliex = ach.some(function (a) { return plateformeDe(a.prod) !== "Decathlon"; });
    var html = '<div class="h-row"><h2>' + (aliex ? "À acheter" : "À acheter chez Decathlon") + "</h2>" + (ach.length ? '<button type="button" class="btn btn-quiet" id="a-copy">Copier la liste</button>' : "") + '</div>';
    if (!ach.length) html += '<p class="empty">Rien à acheter : tous les vêtements sont apportés par le client.</p>';
    var photo = function (a) { var u = photoDe(a.prod, a.col); return u ? '<img class="thumb" src="' + esc(photoSrc(u, 120)) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '<span class="thumb"></span>'; };
    var nom = function (a) {
      var liens = liensAchat(a.prod, a.col);
      return '<div class="art">' + photo(a) + "<div><b>" + esc(a.prod.nom) + "</b>" + (a.col.ref ? ' <span class="muted">réf. ' + esc(a.col.ref) + "</span>" : "") + ruptureTag(a.col) + "<br>" + (liens.length ? liens.join(" · ") : '<span class="muted">pas de lien</span>') + "</div></div>";
    };
    var coul = function (a) { return sw(a.col.hex) + esc(a.col.nom) + nomDecTag(a.col, a.prod); };
    var prixConnus = function (list) { return list.map(function (a) { return a.prod.nom + (a.prod.couleurs.length > 1 && prixAchatTxt(a.prod).indexOf("de ") === 0 ? ", " + a.col.nom.toLowerCase() : "") + " " + fmtEUR(achatDe(a.prod, a.col)); }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).map(esc).join(", "); };
    if (magasin.length) {
      html += "<h3>En magasin</h3>" + table(["Article", "Couleur", "Taille", { t: "Quantité", num: true }, { t: "Prix", num: true }],
        magasin.map(function (a) { return [nom(a), coul(a), esc(a.taille), '<b class="qty">' + a.qty + "</b>", fmtEUR(a.qty * achatDe(a.prod, a.col))]; }), "achats") +
        '<p class="hint">Prix d\'achat enregistré (TTC) : ' + prixConnus(magasin) + ". Vérifie-le en magasin.</p>";
    }
    var plats = [];
    enligne.forEach(function (a) { var pf = plateformeDe(a.prod); if (plats.indexOf(pf) < 0) plats.push(pf); });
    plats.forEach(function (pf) {
      var list = enligne.filter(function (a) { return plateformeDe(a.prod) === pf; }), deca = pf === "Decathlon";
      html += "<h3>" + (deca ? "En ligne, place de marché Decathlon" : "En ligne, " + esc(pf)) + "</h3>" + table(["Article", "Vendeur", "Couleur", "Taille", { t: "Quantité", num: true }, { t: "Prix", num: true }],
        list.map(function (a) { var v = A.vendeurInfo(a.prod); return [nom(a), esc(v.nom), coul(a), esc(a.taille), '<b class="qty">' + a.qty + "</b>", fmtEUR(a.qty * achatDe(a.prod, a.col))]; }), "achats") +
        '<ul class="notes">' + r.vendeurs.filter(function (v) { return v.plateforme === pf; }).map(function (v) {
          return "<li>" + esc(v.nom) + (v.frais ? " : frais de port estimés à " + fmtEUR(v.frais) + " pour tout ce que tu commandes chez ce vendeur" : " : frais de port comptés à " + fmtEUR(0)) + (v.delai ? ", livraison en " + esc(v.delai) : "") + ". " + (!v.frais && v.note ? esc(v.note) + " " : "") + "Le montant réel s'affiche seulement au moment de la commande : s'il est différent, corrige-le dans prix.js (livraisonVendeur).</li>";
        }).join("") + (deca ? "<li>Pas de retrait en magasin. Vérifie le stock de la taille avant de commander : il est souvent très limité. Une fois floqué, l'article n'est ni repris ni échangé.</li>" : "<li>Pas de retrait en magasin. Vérifie le stock de la variante avant de commander : il est parfois très limité (quelques pièces). Une fois marqué, l'article ne peut plus être retourné.</li>") + "</ul>" +
        '<p class="hint">Prix d\'achat enregistré : ' + prixConnus(list) + ".</p>";
    });
    if (apportes.length) {
      html += "<h3>Apportés par le client</h3>" + table(["Article", "Couleur", "Matière", "Taille", { t: "Quantité", num: true }],
        apportes.map(function (a) { return ["<b>" + esc(a.prod.nom) + "</b>", coul(a), esc(a.matiere.court), esc(a.taille), '<b class="qty">' + a.qty + "</b>"]; }), "achats") +
        '<ul class="notes"><li>À réceptionner avant de presser : matière (étiquette), état, tenue à la chaleur. Convenir avec le client du lieu et de la date de dépôt.</li>' +
        "<li>Pas de prix d'achat : seuls les planches, la livraison et le flocage sont facturés.</li></ul>";
    }
    return html;
  }

  function copierAchats() {
    var lignes = achats(st.order).filter(function (a) { return !a.prod.apporte; }).map(function (a) {
      return a.qty + " × " + a.prod.nom + ", " + a.col.nom + ", taille " + a.taille + (a.col.ref ? " (réf. " + a.col.ref + ")" : "") + (a.prod.vendeur ? " (vendeur : " + A.vendeurInfo(a.prod).nom + ")" : "") + " : " + lienDe(a.prod, a.col);
    });
    var txt = "À acheter pour " + (st.contact.asso || "la commande") + "\n" + lignes.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { A.toast("Liste copiée."); }, function () { A.toast("Copie impossible sur ce navigateur."); });
    else A.toast("Copie impossible sur ce navigateur.");
  }

  function planchesHtml() {
    var r = st.res, F0 = A.PRIX.fournisseur, suf = A.PRIX.prixPlanchesHT ? "HT" : "TTC", lines = r.lignesPlanches;
    var gc = st.basket ? st.basket.couts : r.couts;      // planches et livraison de TOUTE la demande (elles sont communes aux configurations)
    var html = '<div class="h-row"><h2>À commander chez ' + esc(F0.nom) + '</h2><a class="btn btn-primary" href="#/planches">Préparer les fichiers à envoyer</a></div>';
    if (st.lots) html += '<p class="hint"><b>Planches communes :</b> les motifs des ' + st.lots.length + ' configurations sont rangés ensemble sur les mêmes planches, pour payer moins. Cette commande est valable pour toute la demande, pas seulement pour la configuration ' + (st.lot + 1) + '. Les repères des motifs commencent par le numéro de la configuration (C2·3·Pv : configuration 2, pièce 3).</p>';
    if (lines.length) {
      html += table(["Technique", "Format", { t: "Quantité", num: true }, { t: "Prix " + suf + " l'unité", num: true }, { t: "Remise", num: true }, { t: "Total " + suf, num: true }],
        lines.map(function (l) { return [esc(A.PRIX.planches[l.techno].nom), esc(l.nom), '<b class="qty">' + l.qty + "</b>", fmtEUR(l.prixUnitaire), l.remise ? Math.round(l.remise * 100) + " %" : "aucune", fmtEUR(l.totalHT)]; }));
      html += '<p class="hint">' + (A.PRIX.prixPlanchesHT ? "Total HT " + fmtEUR(gc.planchesHT) + ", soit " + fmtEUR(gc.planchesTTC) + " TTC. " : "Total " + fmtEUR(gc.planchesTTC) + " TTC. ") +
        (gc.livraison ? "Livraison estimée à " + fmtEUR(gc.livraison) + " (le prix réel s'affiche au panier)." : "Livraison offerte.") + " " + esc(F0.delai) + "</p>" +
        '<p class="hint">' + esc(F0.nom) + " demande : " + esc(F0.fichier) + (F0.url ? " " + lien(F0.url, "Ouvrir le site") + "." : "") + "</p>";
    } else html += '<p class="empty">Aucune planche à commander (aucun marquage actif).</p>';
    return html;
  }

  function coutsHtml() {
    var o = st.order, r = st.res, pv = r.prix;
    if (!pv) return '<p class="empty">Cette commande ne contient aucune pièce.</p>';
    var nMag = 0, nMp = 0, nApp = 0, eurMag = 0, eurMp = 0, pfsMp = [];
    o.pieces.forEach(function (p) { var pr = prodOf(p), px = achatDe(pr, colorOf(p)); if (pr.apporte) nApp++; else if (pr.vendeur) { nMp++; eurMp += px; var pfMp = plateformeDe(pr); if (pfsMp.indexOf(pfMp) < 0) pfsMp.push(pfMp); } else { nMag++; eurMag += px; } });
    var rows = [];
    if (nApp) rows.push(["Vêtements apportés par le client (aucun achat)", plur(nApp, "pièce", "pièces"), fmtEUR(0)]);
    if (nMag) rows.push(["Articles Decathlon (retrait en magasin)", plur(nMag, "pièce", "pièces"), fmtEUR(eurMag)]);
    if (nMp) rows.push([libelleMarche(pfsMp) + " (livrés par le vendeur)", plur(nMp, "pièce", "pièces"), fmtEUR(eurMp)]);
    if (r.couts.livraisonVendeurs) rows.push(["Frais de port des vendeurs (estimation)", r.vendeurs.map(function (v) { return v.nom + " " + fmtEUR(v.frais); }).join(", "), fmtEUR(r.couts.livraisonVendeurs)]);
    var fn = A.PRIX.fournisseur.nom, plHT = A.PRIX.prixPlanchesHT;
    if (r.couts.vinyle) rows.push(["Vinyle thermocollant (découpé à l'atelier)", plur(r.motifs.filter(function (m) { return m.techno === "vinyle"; }).length, "motif", "motifs") + ", " + String(Math.round(A.PRIX.vinyle.coutCm2 * 1000) / 1000).replace(".", ",") + " € le cm² + " + Math.round((A.PRIX.vinyle.chute - 1) * 100) + " % de chutes", fmtEUR(r.couts.vinyle)]);
    if (plHT) rows.push(["Planches " + fn + ", hors taxes", "", fmtEUR(r.couts.planchesHT)]);
    rows = rows.concat([
      ["Planches " + fn + ", TTC", plHT ? "TVA " + Math.round(A.PRIX.tva * 100) + " %" : "", fmtEUR(r.couts.planchesTTC)],
      ["Livraison " + fn, r.couts.livraison ? "estimation" : "offerte", fmtEUR(r.couts.livraison)],
      ["<b>Coût de revient</b>", "", "<b>" + fmtEUR(r.couts.total) + "</b>"]
    ]);
    pv.groupes.forEach(function (g) {
      var rg = A.PRIX.regles, detail = "coût moyen " + fmtEUR(g.coutMoyen) + ", marge " + fmtEUR(g.margeMoyenne);
      var f = g.margeReduite && rg.apporte ? rg.apporte.facteur : 1;   // marge réduite si le facteur d'apporté n'est pas 1
      detail += g.motifs ? " (" + fmtEUR(rg.margePiece * f) + " par pièce" + (f !== 1 ? " : marge × " + String(f).replace(".", ",") + ", plus de " + rg.apporte.seuil + " vêtements apportés" : "") + ")" : " (aucun motif)";
      detail += g.plafonne ? ", prix plafonné à " + fmtEUR(g.unitaire) + " l'unité (marge limitée à " + Math.round((rg.margeMaxPct || 0) * 100) + " % du coût)" : ", arrondi à " + fmtEUR(g.unitaire) + " l'unité";
      rows.push([esc(A.groupName(g)) + " × " + g.n, detail, fmtEUR(g.total)]);
    });
    rows.push(["<b>Total à facturer</b>", pv.unitaire != null ? r.N + " × " + fmtEUR(pv.unitaire) : "", "<b>" + fmtEUR(pv.total) + "</b>"]);
    rows.push(["<b>Marge</b>", pv.total > 0 ? fmtPct(pv.marge / r.couts.total) + " du coût de revient" : "", "<b>" + fmtEUR(pv.marge) + "</b>"]);
    var html = "";
    if (st.lots) html += '<p class="hint">Configuration ' + (st.lot + 1) + ' sur ' + st.lots.length + ' : les planches, la livraison et les frais de port des vendeurs sont partagés par toute la demande, chaque configuration en porte sa part (au prorata de la surface de ses motifs et de ses pièces).</p>';
    html += table(["Ligne", "Détail", { t: "Montant", num: true }], rows, "calc");
    if (st.lots && st.basket) {
      var bk = st.basket;
      html += '<h3>Toute la demande (' + st.lots.length + ' configurations, ' + plur(bk.N, "pièce", "pièces") + ')</h3>' + table(["Ligne", "Détail", { t: "Montant", num: true }], [
        ["Planches " + fn + (plHT ? ", hors taxes" : ", TTC") + " (communes)", plur(st.sheets.length, "planche", "planches"), fmtEUR(plHT ? bk.couts.planchesHT : bk.couts.planchesTTC)],
        ["Livraison " + fn + " (une seule fois)", bk.couts.livraison ? "estimation" : "offerte", fmtEUR(bk.couts.livraison)],
        ["<b>Coût de revient</b>", "", "<b>" + fmtEUR(bk.couts.total) + "</b>"],
        ["<b>Total à facturer</b>", "somme des " + st.lots.length + " configurations", "<b>" + fmtEUR(bk.prix.total) + "</b>"],
        ["<b>Marge</b>", bk.prix.total > 0 ? fmtPct(bk.prix.marge / bk.couts.total) + " du coût de revient" : "", "<b>" + fmtEUR(bk.prix.marge) + "</b>"]], "calc");
    }
    if (st.prixAffiche && Math.abs(st.prixAffiche.total - pv.total) > 0.005) {
      html += '<p class="warn-line">Le client a vu un total de ' + fmtEUR(st.prixAffiche.total) + ". Avec les tarifs actuels, le calcul donne " + fmtEUR(pv.total) + ". Les tarifs ont changé entre-temps.</p>";
    } else if (st.prixAffiche) {
      html += '<p class="ok-line">Le prix recalculé est identique à celui vu par le client.</p>';
    }
    return html;
  }

  /* =================================================================== */
  /* PIÈCES : diaporama                                                  */
  /* =================================================================== */
  views.pieces = function (arg) {
    var app = $("#app");
    if (!st.order) { app.innerHTML = empty("Les pièces, une à une", "Charge un fichier de commande pour passer les pièces en revue : visuel, emplacements, prénom, numéro et planche de chacune."); return; }
    var n = st.order.pieces.length, i = Math.max(0, Math.min(n - 1, (parseInt(arg, 10) || 1) - 1));
    app.innerHTML =
      '<section class="sl" aria-roledescription="carrousel" aria-label="Pièces de la commande">' +
      '<div class="sl-bar"><h1>Pièces</h1><p class="sl-count" id="sl-count" aria-live="polite"></p>' +
      '<div class="sl-nav"><button type="button" class="btn btn-quiet" id="sl-prev">Précédente</button><button type="button" class="btn btn-primary" id="sl-next">Suivante</button></div></div>' +
      '<div id="sl-body"></div>' +
      '<ol class="sl-strip" id="sl-strip" aria-label="Toutes les pièces">' + st.order.pieces.map(function (p, k) {
        var col = colorOf(p), who = [p.prenom, p.numero].filter(Boolean).join(" ") || prodOf(p).nomCourt;
        return '<li><button type="button" data-i="' + k + '" title="' + esc(prodOf(p).nomCourt + ", " + col.nom + " " + p.taille) + '"><span class="n">' + (k + 1) + "</span>" + sw(col.hex) + '<span class="w">' + esc(who) + "</span></button></li>";
      }).join("") + "</ol></section>";
    var cur = -1;
    function show(k, push) {
      k = Math.max(0, Math.min(n - 1, k)); cur = k;
      $("#sl-body").innerHTML = slideHtml(k);
      $("#sl-count").innerHTML = "Pièce <b>" + (k + 1) + "</b> sur " + n;
      $("#sl-prev").disabled = k === 0; $("#sl-next").disabled = k === n - 1;
      $$("#sl-strip button").forEach(function (b) {
        var on = +b.dataset.i === k; b.classList.toggle("on", on); if (on) { b.setAttribute("aria-current", "true"); keepVisible(b); } else b.removeAttribute("aria-current");
      });
      if (push !== false) { try { history.replaceState(null, "", "#/pieces/" + (k + 1)); } catch (e) { /* file:// refuse parfois */ } }
    }
    function keepVisible(b) {
      var s = $("#sl-strip"), l = b.offsetLeft, r = l + b.offsetWidth;
      if (l < s.scrollLeft) s.scrollLeft = l - 8; else if (r > s.scrollLeft + s.clientWidth) s.scrollLeft = r - s.clientWidth + 8;
    }
    $("#sl-prev").addEventListener("click", function () { show(cur - 1); });
    $("#sl-next").addEventListener("click", function () { show(cur + 1); });
    $("#sl-strip").addEventListener("click", function (e) { var b = e.target.closest("button[data-i]"); if (b) show(+b.dataset.i); });
    $("#sl-body").addEventListener("change", function (e) {
      var sel = e.target.closest("select[data-tech]"); if (!sel) return;
      var piece = st.order.pieces.filter(function (x) { return x.id === sel.dataset.tech; })[0]; if (!piece) return;
      if (sel.value) piece.technique = sel.value; else delete piece.technique;
      recompute(); save(); show(cur, false);
      A.toast("Technique de la pièce " + (st.order.pieces.indexOf(piece) + 1) + " : " + (sel.value ? sel.value.toUpperCase() : "automatique") + ". Les planches et le coût sont recalculés.");
    });
    // flèches du clavier, et balayage au doigt
    At.onKey = function (e) {
      if (/^(INPUT|SELECT|TEXTAREA)$/.test((e.target.tagName || ""))) return;
      if (e.key === "ArrowLeft") { show(cur - 1); e.preventDefault(); }
      else if (e.key === "ArrowRight") { show(cur + 1); e.preventDefault(); }
      else if (e.key === "Home") { show(0); e.preventDefault(); }
      else if (e.key === "End") { show(n - 1); e.preventDefault(); }
    };
    var x0 = null, y0 = null, body = $("#sl-body");
    body.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") { x0 = e.clientX; y0 = e.clientY; } });
    body.addEventListener("pointerup", function (e) {
      if (x0 == null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 50) show(cur + (dx < 0 ? 1 : -1));
    });
    show(i, false);
  };

  function slideHtml(i) {
    var o = st.order, p = o.pieces[i], prod = prodOf(p), col = colorOf(p), r = st.res, n = o.pieces.length;
    var hasBack = Object.keys(prod.zones).some(function (k) { var v = prod.zones[k].vue; return v === "dos" || v === "cote"; });
    var vues = hasBack ? ["face", "dos"] : ["face"];
    var stage = vues.map(function (v) {
      return '<figure class="sl-fig">' + P.render({ prod: prod, hex: col.hex, vue: v, marquages: o.marquages, piece: p, ctx: A.CTX, bare: true }) + "<figcaption>" + (hasBack ? (v === "dos" ? "Dos" : "Face") : "Face") + "</figcaption></figure>";
    }).join("");
    var who = "";
    if (p.prenom || p.numero) who = '<p class="sl-who">' + (p.prenom ? "<span>" + esc(p.prenom.toLocaleUpperCase("fr-FR")) + "</span>" : "") + (p.numero ? '<span class="num">' + esc(p.numero) + "</span>" : "") + "</p>";
    var marqs = marquagesDe(p), pr = presseDe(p);
    var rows = marqs.map(function (g) {
      return "<tr><th scope=\"row\">" + esc(g.label) + "</th><td>" + g.items.map(function (m) {
        var sh = st.motifSheet[m.id];
        var cfg = o.marquages[m.emp] || {}, vis = "";
        var imgEl = E.motifImage(m), txtEl = m.kind === "bloc" ? m.el.items.filter(function (i) { return i.kind !== "image"; })[0] : (m.kind !== "image" ? m.el : null);
        if (imgEl && cfg.image && cfg.image.dataUrl) vis = '<img class="mini" src="' + esc(cfg.image.dataUrl) + '" alt="">';
        if (txtEl) vis += '<span class="chip-c" style="background:' + esc(txtEl.couleur) + '"></span>';
        return '<div class="mo' + (m.kind === "bloc" ? " mo-bloc" : "") + '">' + vis + "<div>" + motifTexte(m) + "</div></div>";
      }).join("") + "</td><td>" + g.items.map(function (m) {
        var sh = st.motifSheet[m.id];
        return '<div class="mo">' + (sh ? "<b>" + esc(sh.code) + "</b> <span class=\"muted\">case " + esc(codeMotif(m)) + "</span>" : m.techno === "gravure" ? "<b>Gravure</b> <span class=\"muted\">sans planche</span>" : m.techno === "vinyle" ? "<b>Vinyle</b> <span class=\"muted\">à découper, sans planche</span>" : "–") + "</div>";
      }).join("") + "</td></tr>";
    }).join("");
    var photo = photoDe(prod, col), liens = liensAchat(prod, col);
    var v = A.vendeurInfo(prod);
    var src = sourceTxt(v);
    var photoPropre = col.photos && col.photos.length;
    var apercuCouleur = !photoPropre && prod.apercuPhoto && prod.apercuPhoto.couleur && prod.apercuPhoto.couleur !== col.id ? " Photo de référence : la couleur peut différer." : "";
    var carteApporte = '<div class="art-card"><div><b>L\'article</b><p>Vêtement apporté par le client.<br>Matière déclarée : <b>' + esc(A.matiereDe(p).court) + "</b>. À contrôler à la réception avant de presser.</p></div></div>";
    var carte = prod.apporte ? carteApporte : '<div class="art-card">' + (photo ? '<img src="' + esc(photoSrc(photo, 220)) + '" alt="' + esc(prod.nom) + '" loading="lazy" referrerpolicy="no-referrer">' : "") +
      '<div><b>L\'article</b><p>' + esc(prod.marque) + ". " + esc(prod.matiere) + ".<br>" + esc(src) + ", " + fmtEUR(achatDe(prod, col)) + (col.ref ? ", réf. " + esc(col.ref) : "") + "." + esc(apercuCouleur) + ruptureTag(col) + "</p>" +
      (liens.length ? "<p>" + liens.join(" · ") + "</p>" : "") + "</div></div>";
    return '<article class="slide">' +
      '<div class="sl-left"><div class="sl-stage">' + stage + "</div>" + carte + "</div>" +
      '<div class="sl-spec"><header><p class="sl-n">Pièce ' + (i + 1) + " sur " + n + "</p><h2>" + esc(prod.nom) + "</h2>" +
      '<p class="sl-line">' + sw(col.hex) + "<b>" + esc(col.nom) + "</b> · taille <b>" + esc(p.taille) + "</b>" + (tech(p) === "sublimation" ? ' <span class="tag">sublimation</span>' : tech(p) === "gravure" ? ' <span class="tag">gravure / vinyle</span>' : tech(p) === "vinyle" ? ' <span class="tag">vinyle</span>' : "") + "</p>" + choixTechnique(p, prod) + who + "</header>" +
      (marqs.length ? '<table class="sl-tab"><thead><tr><th>Emplacement</th><th>À poser</th><th>Planche</th></tr></thead><tbody>' + rows + "</tbody></table>" : '<p class="empty">Aucun marquage sur cette pièce : rien à presser.</p>') +
      '<div class="callout"><b>' + (pr.tech === "sublimation" ? "Presse, sublimation" : pr.tech === "gravure" ? "Gravure laser ou vinyle thermocollant" : pr.tech === "vinyle" ? "Presse, vinyle thermocollant (flex)" : "Presse, transfert DTF") + "</b><p>" + esc(pr.texte) + "</p></div>" +
      (prod.avertissement ? '<p class="warn-line">' + esc(prod.avertissement) + "</p>" : "") +
      "</div></article>";
  }
  function tech(piece) { return E.pieceTechno(st.order, piece, A.CTX); }

  // Choix de la technique de pose d'une pièce (DTF ou vinyle) : « Automatique » suit l'article (vinyle quand le DTF n'est pas idéal).
  // Le choix est gardé sur la pièce (piece.technique) ; les planches et le coût de revient se recalculent.
  function choixTechnique(p, prod) {
    if (prod.technique === "gravure" || !st.order) return "";
    var auto = (function () { var q = Object.assign({}, p); delete q.technique; return E.pieceTechno(st.order, q, A.CTX); })();
    var nom = { dtf: "DTF", vinyle: "vinyle", sublimation: "sublimation" };
    return '<p class="sl-tech no-print"><label>Technique de pose <select data-tech="' + esc(p.id) + '">' +
      '<option value=""' + (!p.technique ? " selected" : "") + ">Automatique (" + nom[auto] + ")</option>" +
      '<option value="dtf"' + (p.technique === "dtf" ? " selected" : "") + ">DTF</option>" +
      '<option value="vinyle"' + (p.technique === "vinyle" ? " selected" : "") + ">Vinyle</option></select></label></p>";
  }

  /* =================================================================== */
  /* BASE D'ACHATS                                                       */
  /* =================================================================== */
  var baseFiltre = { q: "", type: "" };
  function typeNom(prod) {
    var t = (prod.tags || {}).type, vals = A.DATA.filtres.type.valeurs.filter(function (x) { return x.id === t; })[0];
    return vals ? vals.label : "";
  }
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function baseMatch(prod) {
    if (baseFiltre.type && (prod.tags || {}).type !== baseFiltre.type) return false;
    if (!baseFiltre.q) return true;
    var hay = norm([prod.nom, prod.nomCourt, prod.marque, prod.id, prod.matiere, prod.vendeur, typeNom(prod)].concat(prod.couleurs.map(function (c) { return c.nom + " " + (c.nomDec || "") + " " + (c.ref || ""); })).join(" "));
    return norm(baseFiltre.q).split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  }

  views.base = function () {
    var PRIX = A.PRIX, Fo = PRIX.fournisseur, app = $("#app");
    var fmts = function (techno) {
      return PRIX.planches[techno].formats.map(function (f) { return "<tr><td>" + esc(PRIX.planches[techno].nom) + "</td><td>" + esc(f.nom) + '</td><td class="num">' + fmtEUR(f.prix) + "</td></tr>"; }).join("");
    };
    var lv = PRIX.livraisonVendeur || { vendeurs: {} };
    var vendeurs = Object.keys(lv.vendeurs).map(function (id) {
      var d = lv.vendeurs[id], arts = A.DATA.produits.filter(function (p) { return p.vendeur === id; });
      var deca = (d.plateforme || "Decathlon") === "Decathlon";
      return '<article class="four"><h3>' + esc(d.nom) + '</h3><p class="muted">' + (deca ? "Vendeur de la place de marché Decathlon" : "Boutique " + esc(d.plateforme)) + '</p><ul class="notes"><li>' + (d.frais ? "Frais de port estimés : " + fmtEUR(d.frais) + " par commande" : "Frais de port comptés : " + fmtEUR(0)) + (d.delai ? ", livraison en " + esc(d.delai) : "") + "</li>" +
        (d.frais ? "<li>Pas de retrait en magasin, une seule fois les frais quel que soit le nombre d'articles.</li>" : "<li>Pas de retrait en magasin." + (d.note ? " " + esc(d.note) : "") + "</li>") + "</ul>" +
        (d.lien ? "<p>" + lien(d.lien, "Boutique de " + esc(d.nom) + " sur " + esc(d.plateforme || "Decathlon")) + "</p>" : "") +
        "<p><b>Articles</b></p><ul class=\"notes\">" + arts.map(function (a) { return "<li>" + lien(a.lien, esc(a.nom)) + "</li>"; }).join("") + "</ul></article>";
    }).join("");
    var typeChips = '<button type="button" class="chip" data-type="" aria-pressed="' + (baseFiltre.type === "") + '">Tout</button>' + A.DATA.filtres.type.valeurs.filter(function (t) { return t.id !== "apporte"; }).map(function (t) {
      return '<button type="button" class="chip" data-type="' + t.id + '" aria-pressed="' + (baseFiltre.type === t.id) + '">' + esc(t.label) + "</button>";
    }).join("");

    app.innerHTML =
      '<section class="base"><div class="h-row"><h1>Base d\'achats</h1><button type="button" class="btn btn-quiet" id="b-csv">Exporter en CSV</button></div>' +
      '<p class="lead-s">Où acheter chaque article, avec le lien de chaque couleur, et les fournisseurs à qui commander. Prix mis à jour le ' + esc(new Date(PRIX.maj + "T12:00:00").toLocaleDateString("fr-FR")) + ".</p>" +
      '<h2 class="b-h">Fournisseurs</h2><div class="fours">' +
      '<article class="four"><h3>' + esc(Fo.nom) + '</h3><p class="muted">Planches de transfert, ' + esc(Fo.ville) + "</p>" +
      "<p>" + lien(Fo.url, "Site de commande") + " · " + lien(Fo.tarifs, "Tarifs") + "</p><p>" + esc(Fo.delai) + "</p>" +
      '<p><b>Fichier à envoyer</b><br>' + esc(Fo.fichier) + "</p>" +
      '<table class="tbl mini-tbl"><thead><tr><th>Technique</th><th>Format</th><th class="num">Prix TTC</th></tr></thead><tbody>' + fmts("dtf") + fmts("sublimation") + "</tbody></table>" +
      '<p class="hint">Livraison offerte dès ' + fmtEUR(PRIX.livraison.seuilGratuit) + " de transferts, sinon environ " + fmtEUR(PRIX.livraison.colissimo) + " (estimation). Les remises à partir de 10 planches ne sont pas appliquées ici.</p></article>" +
      '<article class="four"><h3>Decathlon</h3><p class="muted">Vêtements et accessoires, retrait en magasin</p><p>' + lien("https://www.decathlon.fr/", "decathlon.fr") + "</p>" +
      "<p>" + A.DATA.produits.filter(function (p) { return !p.vendeur && !p.apporte; }).length + " articles du catalogue s'achètent en magasin. Les prix d'achat (TTC) sont enregistrés dans le catalogue ; vérifie-les à l'achat.</p></article>" +
      vendeurs + "</div>" +
      '<h2 class="b-h">Articles</h2>' +
      '<div class="b-tools"><label class="b-search">Chercher un article, une couleur, une référence<input id="b-q" type="search" value="' + esc(baseFiltre.q) + '" placeholder="polo, noir, 8336032…"></label><div class="f-group" id="b-types" role="group" aria-label="Catégorie">' + typeChips + "</div></div>" +
      '<p class="f-count" id="b-count" aria-live="polite"></p><div id="b-rows"></div></section>';

    $("#b-q").addEventListener("input", function (e) { baseFiltre.q = e.target.value; baseRows(); });
    $("#b-types").addEventListener("click", function (e) {
      var b = e.target.closest("[data-type]"); if (!b) return;
      baseFiltre.type = b.dataset.type; $$("#b-types .chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.type === baseFiltre.type)); }); baseRows();
    });
    $("#b-csv").addEventListener("click", exportCsv);
    baseRows();
  };

  function baseRows() {
    var achetables = A.DATA.produits.filter(function (p) { return !p.apporte; });      // les vêtements apportés par le client ne s'achètent pas
    var list = achetables.filter(baseMatch);
    $("#b-count").textContent = list.length === achetables.length ? plur(list.length, "article", "articles") : plur(list.length, "article", "articles") + " sur " + achetables.length;
    if (!list.length) { $("#b-rows").innerHTML = '<p class="empty">Aucun article ne correspond. Efface la recherche ou change de catégorie.</p>'; return; }
    $("#b-rows").innerHTML = table(["Article", "Achat", "Tailles", "Couleurs et liens"], list.map(function (prod) {
      var photo = photoDe(prod, prod.couleurs[0]), v = A.vendeurInfo(prod);
      var cols = prod.couleurs.map(function (c) {
        var href = c.lien || "", mini = photoDe(prod, c);
        var diff = achatDe(prod, c) !== prod.prixAchat ? ' <span class="muted">' + esc(fmtEUR(achatDe(prod, c))) + "</span>" : "";
        return '<li>' + (c.photos && c.photos.length && mini ? '<img class="thumb thumb-c" src="' + esc(photoSrc(mini, 80)) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : "") +
          sw(c.hex) + (href ? lien(href, esc(c.nom)) : esc(c.nom)) + nomDecTag(c, prod) + (c.ref ? ' <span class="muted">réf. ' + esc(c.ref) + "</span>" : "") + diff + ruptureTag(c) + "</li>";
      }).join("");
      var noColLinks = !prod.couleurs.some(function (c) { return c.lien; });
      return [
        '<div class="art">' + (photo ? '<img class="thumb" src="' + esc(photoSrc(photo, 120)) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '<span class="thumb"></span>') +
          "<div><b>" + esc(prod.nom) + '</b><br><span class="muted">' + esc(prod.marque) + (typeNom(prod) ? " · " + esc(typeNom(prod)) : "") + "</span></div></div>",
        "<b>" + prixAchatTxt(prod) + "</b><br>" + (v ? '<span class="tag mp">' + esc(v.nom) + "</span>" + (v.lien ? "<br>" + lien(v.lien, "Boutique du vendeur") : "") : '<span class="muted">Decathlon, magasin</span>'),
        esc(prod.tailles.join(", ")) + '<br><span class="muted">' + esc(prod.matiere) + "</span>",
        '<ul class="cols">' + cols + "</ul>" + (noColLinks && prod.lien ? "<p>" + lien(prod.lien, "Fiche de l'article") + "</p>" : "")
      ];
    }), "base-tbl");
  }

  function exportCsv() {
    var rows = [["Article", "Identifiant", "Catégorie", "Marque", "Source", "Prix d'achat TTC (€)", "Tailles", "Matière", "Couleur", "Référence", "Lien", "Boutique du vendeur", "Stock Decathlon"]];
    A.DATA.produits.filter(function (p) { return !p.apporte; }).forEach(function (prod) {
      var v = A.vendeurInfo(prod);
      prod.couleurs.forEach(function (c) {
        rows.push([prod.nom, prod.id, typeNom(prod), prod.marque, v ? sourceTxt(v) : "Decathlon, magasin", String(achatDe(prod, c)).replace(".", ","), prod.tailles.join(" "), prod.matiere, c.nom, c.ref || "", lienDe(prod, c), v && v.lien ? v.lien : "", c.rupture ? "Rupture signalée le " + c.rupture : ""]);
      });
    });
    A.download("base-achats-fabricam.csv", F.csv(rows), "text/csv;charset=utf-8");
    A.toast("Base d'achats exportée (CSV, à ouvrir avec Excel).");
  }

  /* =================================================================== */
  /* DÉMARRAGE                                                           */
  /* =================================================================== */
  var At = window.Atelier = {
    A: A, st: st, views: views, ABBR: ABBR, KIND: KIND, KIND_NOM: KIND_NOM, esc: esc, fmtEUR: fmtEUR, fmtN: fmtN, plur: plur, table: table, empty: empty, lien: lien, sw: sw,
    achats: achats, pressNotes: pressNotes, presseDe: presseDe, marquagesDe: marquagesDe, motifTexte: motifTexte, codeMotif: codeMotif, dpiVisuel: dpiVisuel, orderDe: orderDe, imgInfo: imgInfo, lotOrders: lotOrders,
    colorOf: colorOf, prodOf: prodOf, lienDe: lienDe, fmtDate: fmtDate, route: route, prepare: prepare, save: save, photoSrc: photoSrc, onKey: null, alertes: alertes
  };

  function start() {
    $("#brand-name").textContent = A.DATA.service.nom.replace(/^Fabr'Icam\s+/i, "") || A.DATA.service.nom;   // le logo porte déjà « Fabr'Icam »
    $("#at-lock").addEventListener("click", lock);
    window.addEventListener("hashchange", route);
    document.addEventListener("keydown", function (e) { if (At.onKey && st.vue === "pieces" && !e.ctrlKey && !e.metaKey && !e.altKey) At.onKey(e); });
    // un fichier déposé n'importe où sur la page est lu comme une commande
    window.addEventListener("dragover", function (e) { if (st.unlocked) e.preventDefault(); });
    window.addEventListener("drop", function (e) {
      if (!st.unlocked) return;
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) readFile(f);
    });
    if (sget(CLE_OK) === "1") unlock(); else showGate();
  }
  window.addEventListener("load", start);
})();
