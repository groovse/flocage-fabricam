/*
 * APPLICATION : vitrine, configurateur, devis par mail.
 * L'espace atelier (récap interne) est dans atelier.js.
 */
(function () {
  "use strict";

  var DATA = window.DATA, PRIX = window.PRIX, E = window.Engine, P = window.Preview;
  var esc = P.esc;
  var byId = {};
  DATA.produits.forEach(function (p) { byId[p.id] = p; });
  var PACKS = {};
  (DATA.packs || []).forEach(function (p) { PACKS[p.id] = p; });
  var EMP_ORDER = ["poitrine", "dos", "manche_g", "manche_d", "cuisse_g", "cuisse_d", "bas_jambe_g", "chaussette_g", "chaussette_d"];
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

  var CTX = { prix: PRIX, produits: byId, packs: PACKS, emplacements: DATA.emplacements, measure: measure };

  /* ---------------- état de la commande en cours ---------------- */
  var S = { pieces: [], nextId: 1, marquages: null, technique: "dtf", vue: "face", mode: "dessin", previewId: null,
    contact: { asso: "", nom: "", email: "", tel: "", date: "", message: "" }, result: null,
    entryId: null, addModel: null, nextPack: 1 };
  function itemOf(id) { return byId[id] || PACKS[id]; }
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
  var FILTRE = { genre: "", style: "", type: "" };
  function tagsOf(item) { return item.tags || {}; }
  function matchFiltre(item) {
    var t = tagsOf(item);
    if (FILTRE.genre && (t.genre || []).indexOf(FILTRE.genre) < 0) return false;
    if (FILTRE.style && t.style !== FILTRE.style) return false;
    if (FILTRE.type && t.type !== FILTRE.type) return false;
    return true;
  }
  // Nom d'une ligne de prix : un produit, ou un pack
  function groupName(g) {
    if (g.pack) { var d = g.packType && PACKS[g.packType]; return d ? (d.nomCourt || d.nom) : "Pack"; }
    return byId[g.produitId].nomCourt;
  }

  // Article d'un vendeur de la place de marché Decathlon : frais de port estimés dans prix.js (livraisonVendeur)
  function vendeurInfo(prod) {
    if (!prod || !prod.vendeur) return null;
    var lv = PRIX.livraisonVendeur || {}, d = (lv.vendeurs || {})[prod.vendeur] || {};
    return { id: prod.vendeur, nom: d.nom || prod.vendeur, frais: d.frais != null ? d.frais : (lv.defaut || 0), delai: d.delai || "" };
  }
  // Texte d'information pour un ou plusieurs articles d'un même vendeur (noms : liste de noms à citer en tête, facultatif)
  function vendeurTexte(prod, noms) {
    var v = vendeurInfo(prod); if (!v) return "";
    var pl = noms && noms.length > 1;
    return (noms ? noms.join(", ") + " : " + (pl ? "articles vendus" : "article vendu") : (pl ? "Articles vendus" : "Article vendu")) + " par " + v.nom + " sur la place de marché Decathlon. " +
      (pl ? "Ils sont livrés" : "Il est livré") + " à Fabr'Icam par le vendeur" + (v.delai ? " (" + v.delai + ")" : "") + ", sans retrait en magasin. " +
      "Les frais de port du vendeur, estimés à " + fmtEUR(v.frais) + " pour toute la commande chez lui, sont compris dans le prix. " +
      "Une fois floqué" + (pl ? "s" : "") + ", " + (pl ? "ils ne sont" : "il n'est") + " ni repris ni échangé" + (pl ? "s" : "") + ".";
  }
  // « 2XL seulement », « XS, S et 2XL » ou « XS à 3XL »
  function taillesTxt(pr) {
    var a = pr.tailles;
    if (a.length === 1) return a[0] + " seulement";
    return a.length <= 4 ? a.slice(0, -1).join(", ") + " et " + a[a.length - 1] : a[0] + " à " + a[a.length - 1];
  }

  function darkColor(prod) { return P.lum(prod.couleurs[0].hex) < 0.5; }

  function newMarquage(empId, prod) {
    var emp = DATA.emplacements[empId], f = emp.formats;
    var big = empId === "dos", tiny = empId === "bas_jambe_g" || /^chaussette/.test(empId), small = /^(manche|cuisse)/.test(empId);
    var txt = darkColor(prod) ? "#ffffff" : "#14213d";
    return {
      actif: false, avecImage: !emp.texteSeul, image: null,
      format: f.length ? (big ? f[f.length - 1] : f[0]) : "A6", orient: "portrait",
      prenom: { actif: false, hauteur: big ? 4 : tiny ? 2.5 : small ? 1.5 : 2, police: "Bebas Neue", couleur: txt },
      numero: { actif: false, hauteur: big ? 14 : tiny ? 3.5 : small ? 4 : 5, police: "Bebas Neue", couleur: txt },
      maj: true, textePos: "dessous"
    };
  }

  function newPiece(prod, over) {
    var p = { id: "p" + (S.nextId++), produitId: prod.id, couleurId: prod.couleurs[0].id, taille: prod.tailles[Math.min(1, prod.tailles.length - 1)], prenom: "", numero: "" };
    return Object.assign(p, over || {});
  }

  // Un pack = une pièce par produit, liées par un identifiant. from : pièces à imiter (couleur, taille, et noms si withNames).
  function newPack(def, from, withNames) {
    var id = "k" + (S.nextPack++);
    return def.produits.map(function (pid) {
      var src = from && from.filter(function (x) { return x.produitId === pid; })[0], over = { pack: id, packType: def.id };
      if (src) { over.couleurId = src.couleurId; over.taille = src.taille; if (withNames) { over.prenom = src.prenom; over.numero = src.numero; } }
      return newPiece(byId[pid], over);
    });
  }

  // Ajoute n pièces (ou n packs) du modèle choisi
  function addModel(id, n) {
    var last = S.pieces[S.pieces.length - 1];
    for (var i = 0; i < n; i++) {
      if (PACKS[id]) S.pieces = S.pieces.concat(newPack(PACKS[id], null));
      else {
        var same = last && !last.pack && last.produitId === id ? last : null;
        S.pieces.push(newPiece(byId[id], same ? { couleurId: same.couleurId, taille: same.taille } : {}));
      }
    }
  }

  function ensureState(item) {
    var prods = item.produits ? item.produits.map(function (id) { return byId[id]; }) : [item];
    if (!S.marquages) {
      S.marquages = {};
      EMP_ORDER.forEach(function (e) { S.marquages[e] = newMarquage(e, prods.filter(function (pr) { return pr.zones[e]; })[0] || prods[0]); });
      (item.vitrine || ["poitrine"]).forEach(function (e) {   // même configuration que le prix affiché sur la vitrine
        if (!S.marquages[e]) return;
        S.marquages[e].actif = true;
        if (DATA.emplacements[e].texteSeul) S.marquages[e].prenom.actif = true;
      });
    }
    if (!S.pieces.length) S.pieces = item.produits ? newPack(item, null) : [newPiece(item)];
    if (!S.addModel) S.addModel = item.id;
    fixPreview();
  }

  function fixPreview() {
    if (!S.previewId || !S.pieces.some(function (p) { return p.id === S.previewId; })) S.previewId = S.pieces[0].id;
  }

  // Commande encore vierge : on peut la remplacer sans rien perdre
  function pristine() {
    return S.pieces.length <= taillePackMax() && S.pieces.every(function (p) { return !p.prenom && !p.numero; }) &&
      EMP_ORDER.every(function (e) { var m = S.marquages[e]; return !m.image && (DATA.emplacements[e].texteSeul || (!m.prenom.actif && !m.numero.actif)); });
  }

  // Arrivée sur un produit depuis la vitrine : on repart de zéro si la commande est vierge, sinon on l'ajoute à la commande
  function enter(item) {
    if (S.marquages && S.entryId !== item.id) {
      if (pristine()) { S.marquages = null; S.pieces = []; S.previewId = null; S.technique = "dtf"; S.addModel = null; }
      else {
        S.pieces = S.pieces.concat(item.produits ? newPack(item, null) : [newPiece(item)]);
        S.addModel = item.id;
        toast((item.nomCourt || item.nom) + " ajouté à ta commande.");
      }
    }
    ensureState(item);
    S.entryId = item.id;
  }

  function orderOf() { return { pieces: S.pieces, marquages: S.marquages, technique: S.technique }; }
  function prodOf(piece) { return byId[piece.produitId]; }
  function colorOf(piece) { var pr = prodOf(piece); return pr.couleurs.filter(function (c) { return c.id === piece.couleurId; })[0] || pr.couleurs[0]; }

  function usedEmps() {
    var set = {};
    S.pieces.forEach(function (p) { Object.keys(prodOf(p).zones).forEach(function (k) { set[k] = 1; }); });
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
    var rows = E.priceTable(item, QUANTITES_VITRINE, CTX), unit = item.produits ? ["pack", "packs"] : ["pièce", "pièces"];
    return '<dl class="prices">' + rows.map(function (r) {
      return '<div class="pc"><dt>' + r.q + " " + (r.q > 1 ? unit[1] : unit[0]) + '</dt><dd>' + fmtEUR(r.unitaire) + '</dd></div>';
    }).join("") + '</dl>';
  }

  function silhouette(prod) {
    return P.render({ prod: prod, hex: prod.couleurs[0].hex, vue: "face", marquages: {}, ctx: CTX, bare: true });
  }

  // Les photos sont liées depuis Decathlon : on demande la taille voulue (largeur en px) dans l'adresse
  function photoSrc(url, w) { return url + (url.indexOf("?") < 0 ? "?format=auto&f=" + w + "x0" : ""); }

  function photoImg(prod, url, w) {
    return '<img src="' + esc(photoSrc(url, w)) + '" alt="' + esc(prod.nom) + '" loading="lazy" referrerpolicy="no-referrer">';
  }

  var ZOOM_ICON = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12.6 12.6L18 18M8.5 6v5M6 8.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function zoomBtn(pr) {
    return '<button type="button" class="p-zoom" data-zoom="' + pr.id + '" aria-label="Agrandir les photos : ' + esc(pr.nomCourt.toLowerCase()) + '">' + ZOOM_ICON + '</button>';
  }

  function cardPhoto(item) {
    if (item.produits) {
      return '<div class="p-photo duo">' + item.produits.map(function (id) {
        var pr = byId[id], ok = pr.photos && pr.photos[0];
        return '<div class="cell" data-prod="' + pr.id + '">' + (ok ? photoImg(pr, pr.photos[0], 600) + zoomBtn(pr) : silhouette(pr)) + '</div>';
      }).join("") + '</div>';
    }
    var ph = item.photos || [];
    if (!ph.length) return '<div class="p-photo">' + silhouette(item) + '</div>';
    var thumbs = ph.length > 1
      ? '<div class="p-thumbs" role="group" aria-label="Photos de ' + esc(item.nomCourt.toLowerCase()) + '">' + ph.map(function (u, i) {
        return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === 0 ? "true" : "false") + '" aria-label="Photo ' + (i + 1) + ' sur ' + ph.length + '">' +
          '<img src="' + esc(photoSrc(u, 120)) + '" alt="" loading="lazy" referrerpolicy="no-referrer"></button>';
      }).join("") + '</div>'
      : "";
    return '<div class="p-media" data-prod="' + item.id + '" data-i="0"><div class="p-photo" data-prod="' + item.id + '">' + photoImg(item, ph[0], 800) + zoomBtn(item) + '</div>' + thumbs + '</div>';
  }

  function valeurLabel(groupe, id) {
    var g = DATA.filtres && DATA.filtres[groupe], v = g && g.valeurs.filter(function (x) { return x.id === id; })[0];
    return v ? v.label : id;
  }

  function filtresHTML() {
    var f = DATA.filtres; if (!f) return "";
    var groupes = Object.keys(f).map(function (k) {
      var g = f[k];
      return '<div class="f-group" role="group" aria-label="' + esc(g.label) + '"><span class="f-label">' + esc(g.label) + '</span>' +
        [{ id: "", label: "Tous" }].concat(g.valeurs).map(function (v) {
          return '<button type="button" class="chip" data-filtre="' + k + '" data-valeur="' + esc(v.id) + '" aria-pressed="' + (FILTRE[k] === v.id ? "true" : "false") + '">' + esc(v.label) + '</button>';
        }).join("") + '</div>';
    }).join("");
    return '<div class="filtres">' + groupes + '</div><p class="f-count" id="f-count" aria-live="polite"></p>';
  }

  function majFiltres() {
    var all = DATA.produits.concat(DATA.packs || []), cards = $$(".catalogue .produit"), nV = 0, nP = 0;
    cards.forEach(function (c, i) {
      var ok = matchFiltre(all[i]);
      c.hidden = !ok;
      if (ok) { if (c.dataset.pack) nP++; else nV++; }
    });
    $$("[data-filtre]").forEach(function (b) { b.setAttribute("aria-pressed", FILTRE[b.dataset.filtre] === b.dataset.valeur ? "true" : "false"); });
    var out = $("#f-count"); if (!out) return;
    if (!nV && !nP) out.innerHTML = "Aucun vêtement ne correspond à ces filtres. Tu peux nous <a href=\"" + autreVetementHref() + "\">demander le vêtement que tu cherches</a>.";
    else out.textContent = nV + (nV > 1 ? " vêtements" : " vêtement") + (nP ? " et " + nP + (nP > 1 ? " packs" : " pack") : "");
  }

  function nombreEnLettres(n) { return ["Zéro", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six"][n] || String(n); }
  // Plus grand nombre de pièces d'un pack : une commande qui ne contient qu'un pack non personnalisé reste « vierge »
  function taillePackMax() { return Math.max(2, ...(DATA.packs || []).map(function (pk) { return pk.produits.length; })); }

  function cardHTML(item) {
    var isPack = !!item.produits, prods = isPack ? item.produits.map(function (id) { return byId[id]; }) : [item];
    var sw = isPack
      ? prods.map(function (pr) { return '<li><b>' + esc(pr.nomCourt) + '</b> ' + pr.couleurs.map(function (c) { return '<span class="sw" style="background:' + c.hex + '"></span>' + esc(c.nom); }).join(" ") + '</li>'; }).join("")
      : item.couleurs.map(function (c) { return '<li><span class="sw" style="background:' + c.hex + '"></span>' + esc(c.nom) + '</li>'; }).join("");
    var pointures = prods.every(function (pr) { return /^\d/.test(pr.tailles[0]); });
    var tailles = prods.map(function (pr) { return (isPack ? esc(pr.nomCourt) + " " : "") + esc(taillesTxt(pr)); }).join(", ");
    var noms = prods.map(function (pr) { return esc(pr.nomCourt.toLowerCase()); });
    var meta = isPack ? nombreEnLettres(prods.length) + " pièces : " + (noms.length > 1 ? noms.slice(0, -1).join(", ") + " et " + noms[noms.length - 1] : noms[0]) + ". Le pack coûte moins cher que les pièces prises séparément." : esc(item.marque) + ". " + esc(item.matiere) + ".";
    var t = tagsOf(item), labels = [];
    (t.genre || []).forEach(function (g) { labels.push(valeurLabel("genre", g)); });
    if (t.style) labels.push(valeurLabel("style", t.style));
    if (t.sport) labels.push(t.sport);
    if (t.type) labels.push(valeurLabel("type", t.type));
    var mp = prods.filter(function (pr) { return pr.vendeur; })[0];
    var chips = labels.length || mp ? '<ul class="tags" aria-label="Étiquettes">' + labels.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") +
      (mp ? '<li class="mp">Livré par le vendeur</li>' : "") + "</ul>" : "";
    return '<article class="produit" data-pack="' + (isPack ? "1" : "") + '"' + (matchFiltre(item) ? "" : " hidden") + '>' + cardPhoto(item) +
      '<div class="p-info">' + chips + '<h3>' + esc(item.nom) + '</h3>' +
      '<p class="p-meta">' + meta + '</p>' +
      '<ul class="swatches" aria-label="Couleurs">' + sw + '</ul>' +
      '<p class="p-meta">' + (pointures ? "Pointures" : "Tailles") + ' : ' + tailles + '.</p>' +
      '<h4>Prix par ' + (isPack ? "pack" : "pièce") + '</h4>' + priceStrip(item) +
      '<p class="note">' + esc(item.noteVitrine || ("Avec un visuel A6 " + (item.texteVitrine || "à la poitrine") + ".")) + ' Prix TTC, ' + (isPack ? "vêtements" : "vêtement") + ', planche de transfert et livraison compris. Le prix baisse avec la quantité.</p>' +
      prods.filter(function (pr) { return pr.vendeur; }).map(function (pr) { return '<p class="note note-vendeur">' + esc(vendeurTexte(pr)) + '</p>'; }).join("") +
      '<a class="btn btn-primary" href="#/configurer/' + item.id + '">Personnaliser ' + esc(item.demonstratif || "ce produit") + '</a>' +
      '</div></article>';
  }

  /* ---------- visionneuse de photos (catalogue) ---------- */
  var LB = { prod: null, i: 0, dlg: null };
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
    var pr = byId[LB.prod], n = pr.photos.length, d = LB.dlg;
    LB.i = ((i % n) + n) % n;
    var img = $("#lb-img", d);
    img.alt = pr.nom + ", photo " + (LB.i + 1) + " sur " + n;
    img.src = photoSrc(pr.photos[LB.i], 1600);
    $("#lb-title", d).textContent = pr.nom;
    $("#lb-count", d).textContent = (LB.i + 1) + " / " + n;
    $$(".lb-nav", d).forEach(function (b) { b.hidden = n < 2; });
    // précharge la photo suivante pour que le passage soit rapide
    if (n > 1) { var nx = new Image(); nx.referrerPolicy = "no-referrer"; nx.src = photoSrc(pr.photos[(LB.i + 1) % n], 1600); }
  }
  function openLightbox(prodId, i) {
    var pr = byId[prodId];
    if (!pr || !pr.photos || !pr.photos.length) return;
    var d = lbEnsure();
    LB.prod = prodId;
    lbShow(i || 0);
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  }

  function viewVitrine() {
    var cards = DATA.produits.concat(DATA.packs || []).map(cardHTML).join("");

    app.innerHTML =
      '<section class="hero">' +
      '<div class="hero-text">' +
      '<h1>Des vêtements floqués pour ton asso</h1>' +
      '<p class="lead">Tu choisis le vêtement, tu importes ton logo, tu ajoutes les prénoms et les numéros. On presse à l\'atelier de Fabr\'Icam, et tu vois le prix à chaque changement.</p>' +
      '<p><a class="btn btn-primary" href="#catalogue" data-scroll="catalogue">Choisir un vêtement</a></p>' +
      '</div>' + heroArt() + '</section>' +
      '<section class="block" id="catalogue"><h2>Catalogue</h2>' + filtresHTML() + '<div class="catalogue">' + cards + '</div></section>' +
      '<section class="block steps"><h2>Comment ça marche</h2><ol class="seq">' +
      '<li><b>Tu configures.</b> Couleurs, tailles, visuels, prénoms et numéros, avec un aperçu à la taille réelle.</li>' +
      '<li><b>Tu vois le prix.</b> Il se met à jour à chaque changement, vêtements et marquage compris.</li>' +
      '<li><b>Tu envoies la demande.</b> Un mail pré-rempli part vers Fabr\'Icam, avec ton fichier de commande.</li>' +
      '<li><b>On valide le devis.</b> Fabr\'Icam te le confirme et te réclame le règlement, puis on presse.</li></ol></section>' +
      '<section class="block facts"><h2>Bon à savoir</h2><dl>' +
      '<div><dt>Aucun minimum</dt><dd>Une seule pièce ou toute l\'équipe, le calcul est le même. Tu peux mélanger plusieurs vêtements dans une commande.</dd></div>' +
      '<div><dt>Deux techniques</dt><dd>Le DTF convient à toutes les couleurs. La sublimation, plus lisse, ne marche que sur polyester blanc ou clair.</dd></div>' +
      '<div><dt>Des vêtements Decathlon</dt><dd>Fabr\'Icam les retire en magasin, il n\'y a donc pas de frais de livraison sur les vêtements. Les articles marqués « Livré par le vendeur » viennent de vendeurs partenaires de Decathlon : ils sont livrés à Fabr\'Icam, et leurs frais de port sont déjà dans le prix.</dd></div>' +
      '</dl></section>';

    majFiltres();
    $$("[data-filtre]").forEach(function (b) {
      b.addEventListener("click", function () { FILTRE[b.dataset.filtre] = b.dataset.valeur; majFiltres(); });
    });
    // Photo introuvable (hors ligne, lien périmé) : on affiche le dessin du vêtement à la place
    $$(".p-photo > img, .p-photo .cell > img").forEach(function (img) {
      img.addEventListener("error", function () {
        var host = img.closest("[data-prod]"), media = img.closest(".p-media");
        host.innerHTML = silhouette(byId[host.dataset.prod]);
        var th = media && $(".p-thumbs", media); if (th) th.remove();
      });
    });
    // Agrandir : le bouton loupe ou un clic sur la photo ouvre la visionneuse
    $$(".p-photo").forEach(function (box) {
      box.addEventListener("click", function (e) {
        var cell = e.target.closest(".cell"), host = cell || box, z = $(".p-zoom", host);
        if (!z) return;
        var media = box.closest(".p-media");
        openLightbox(z.dataset.zoom, media ? Number(media.dataset.i) || 0 : 0, z);
      });
    });
    // Vignettes : un clic affiche la photo choisie
    $$(".p-thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        var media = b.closest(".p-media"), prod = byId[media.dataset.prod], main = $(".p-photo > img", media);
        if (!main) return;
        main.src = photoSrc(prod.photos[Number(b.dataset.i)], 800);
        media.dataset.i = b.dataset.i;
        $$(".p-thumbs button", media).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      });
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
    var titre = S.pieces.some(function (p) { return prodOf(p).id !== S.pieces[0].produitId; }) ? "Ta commande" : item.nom;
    app.innerHTML =
      '<div class="cfg" data-view="cfg">' +
      '<div class="cfg-head"><a class="back" href="#/">Catalogue</a><h1>' + esc(titre) + '</h1></div>' +
      '<div class="cfg-grid">' +
      '<div class="cfg-main">' +
      '<section class="step" id="s-pieces"><h2><span class="n">1</span>Tes pièces</h2><div id="pieces"></div></section>' +
      '<section class="step" id="s-marq"><h2><span class="n">2</span>Les marquages</h2><div id="marquages"></div></section>' +
      '<section class="step" id="s-tech"><h2><span class="n">3</span>La technique</h2><div id="technique"></div></section>' +
      '<section class="step" id="s-devis"><h2><span class="n">4</span>Ta demande</h2><div id="devis"></div></section>' +
      '</div>' +
      '<aside class="cfg-side"><div class="pv-card">' +
      '<div class="pv-bar"><div class="seg" role="group" aria-label="Vue"><button type="button" data-vue="face">Face</button><button type="button" data-vue="dos">Dos</button></div>' +
      '<div class="seg" role="group" aria-label="Type d\'aperçu"><button type="button" data-mode="dessin" title="Dessin à la taille réelle">Dessin</button><button type="button" data-mode="photo">Photo</button></div>' +
      '<label class="pv-piece">Aperçu pour <select id="pv-piece"></select></label></div>' +
      '<div id="pv"></div><p class="pv-note" id="pv-note" hidden></p></div>' +
      '<div class="total" id="total" aria-live="polite"></div></aside>' +
      '</div></div>';
    renderPieces(); renderMarquages(); renderTechnique(); renderDevis();
    refresh();
  }

  /* ---------- 1. pièces ---------- */
  function pieceRow(p, i) {
    var prod = prodOf(p), inpack = !!p.pack;
    var opts = function (arr, cur, lab) { return arr.map(function (v) { var val = v.id || v; return '<option value="' + esc(val) + '"' + (val === cur ? " selected" : "") + ">" + esc(lab ? lab(v) : v) + "</option>"; }).join(""); };
    var modele = inpack
      ? '<td class="col-modele"><span class="pk">Pack</span> ' + esc(prod.nomCourt) + '</td>'
      : '<td class="col-modele"><select data-f="produitId" aria-label="Modèle, pièce ' + (i + 1) + '">' + opts(DATA.produits, p.produitId, function (x) { return x.nomCourt; }) + '</select></td>';
    return '<tr data-pid="' + p.id + '"' + (inpack ? ' class="inpack"' : "") + '>' +
      '<td class="idx">' + (i + 1) + '</td>' + modele +
      '<td class="col-couleur"><span class="sw" style="background:' + colorOf(p).hex + '"></span><select data-f="couleurId" aria-label="Couleur, pièce ' + (i + 1) + '">' + opts(prod.couleurs, p.couleurId, function (c) { return c.nom; }) + '</select></td>' +
      '<td><select data-f="taille" aria-label="Taille, pièce ' + (i + 1) + '">' + opts(prod.tailles, p.taille) + '</select></td>' +
      '<td class="col-prenom"><input data-f="prenom" type="text" maxlength="24" value="' + esc(p.prenom) + '" aria-label="Prénom, pièce ' + (i + 1) + '" autocomplete="off"></td>' +
      '<td class="col-numero"><input data-f="numero" type="text" maxlength="4" value="' + esc(p.numero) + '" aria-label="Numéro, pièce ' + (i + 1) + '" autocomplete="off"></td>' +
      '<td class="act"><button type="button" class="ico" data-act="dup" title="' + (inpack ? "Dupliquer ce pack" : "Dupliquer cette pièce") + '" aria-label="Dupliquer la pièce ' + (i + 1) + '">+</button>' +
      '<button type="button" class="ico" data-act="del" title="' + (inpack ? "Retirer ce pack" : "Retirer cette pièce") + '" aria-label="Retirer la pièce ' + (i + 1) + '">×</button></td></tr>';
  }

  function modelOptions() {
    var o = function (id, lab) { return '<option value="' + esc(id) + '"' + (id === S.addModel ? " selected" : "") + ">" + esc(lab) + "</option>"; };
    return '<optgroup label="Vêtements">' + DATA.produits.map(function (x) { return o(x.id, x.nomCourt); }).join("") + '</optgroup>' +
      ((DATA.packs || []).length ? '<optgroup label="Packs (ensembles)">' + DATA.packs.map(function (x) { return o(x.id, x.nom); }).join("") + '</optgroup>' : "");
  }

  function renderPieces() {
    $("#pieces").innerHTML =
      '<div class="tablewrap"><table class="pieces' + (anyText("prenom") ? " has-prenom" : "") + (anyText("numero") ? " has-numero" : "") + '">' +
      '<thead><tr><th class="idx"><span class="sr">N°</span></th><th>Modèle</th><th>Couleur</th><th>Taille</th><th class="col-prenom">Prénom</th><th class="col-numero">Numéro</th><th></th></tr></thead>' +
      '<tbody>' + S.pieces.map(pieceRow).join("") + '</tbody></table></div>' +
      '<p class="hint hint-text" ' + (anyText("prenom") || anyText("numero") ? "hidden" : "") + '>Pour personnaliser chaque pièce, coche « Prénom » ou « Numéro » dans les marquages.</p>' +
      '<div class="toolbar">' +
      '<label class="sr" for="addmodel">Modèle à ajouter</label><select id="addmodel">' + modelOptions() + '</select>' +
      '<button type="button" class="btn btn-quiet" data-act="add">Ajouter</button>' +
      '<span class="addn"><label class="sr" for="addn">Nombre de pièces à ajouter</label><input id="addn" type="number" min="1" max="200" value="5"><button type="button" class="btn btn-quiet" data-act="addn">identiques à la dernière</button></span>' +
      '<button type="button" class="btn btn-quiet" data-act="paste">Coller une liste</button></div>' +
      '<div class="pastebox" id="pastebox" hidden><label for="pastetxt">Une ligne par pièce, pour le modèle choisi ci-dessus : prénom ; numéro ; taille ; couleur (la taille et la couleur sont facultatives)</label>' +
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
      var batch = PACKS[id] ? newPack(PACKS[id], null) : [newPiece(byId[id])];
      batch.forEach(function (p) {
        var prod = byId[p.produitId];
        p.prenom = (f[0] || "").slice(0, 24); p.numero = (f[1] || "").slice(0, 4);
        if (f[2]) { var t = prod.tailles.filter(function (x) { return x.toLowerCase() === f[2].toLowerCase(); })[0]; if (t) p.taille = t; }
        if (f[3]) { var c = prod.couleurs.filter(function (x) { return x.id === f[3].toLowerCase() || x.nom.toLowerCase() === f[3].toLowerCase(); })[0]; if (c) p.couleurId = c.id; }
        list.push(p);
      });
      added++;
    });
    if (!added) { toast("Aucune ligne reconnue. Écris un prénom, un point-virgule, puis un numéro."); return; }
    if (blank) S.pieces = list; else S.pieces = S.pieces.concat(list);
    fixPreview();
    toast(added + (PACKS[id] ? (added > 1 ? " packs ajoutés." : " pack ajouté.") : (added > 1 ? " pièces ajoutées." : " pièce ajoutée.")));
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
    var o = m[kind];
    return '<div class="txt' + (o.actif ? " on" : "") + '">' +
      '<label class="chk"><input type="checkbox" data-k="' + kind + '.actif"' + (o.actif ? " checked" : "") + '> ' + label + '</label>' +
      (o.actif ? '<div class="txt-opts">' +
        '<label>Police<select data-k="' + kind + '.police">' + fontOptions(o.police) + '</select></label>' +
        '<label>Hauteur des lettres<span class="unit"><input type="number" data-k="' + kind + '.hauteur" min="0.5" max="28" step="0.5" value="' + o.hauteur + '"> cm</span></label>' +
        '<label>Couleur<input type="color" data-k="' + kind + '.couleur" value="' + esc(o.couleur) + '"></label></div>' : "") +
      '</div>';
  }

  function dimsOf(m) {
    var f = PRIX.formatsMotif[m.format]; if (!f) return { w: 0, h: 0 };
    return m.orient === "paysage" ? { w: f.h, h: f.w } : { w: f.w, h: f.h };
  }

  function dpiText(m) {
    if (!m.image) return "";
    if (m.image.svg) return "Fichier SVG : net à toutes les tailles.";
    var d = dimsOf(m), ar = (m.image.pxW || 1) / (m.image.pxH || 1);
    var printedW = Math.min(d.w, d.h * ar), dpi = Math.round((m.image.pxW || 0) / (printedW / 2.54));
    if (dpi >= 280) return "Résolution : " + dpi + " dpi, c'est bon.";
    if (dpi >= 150) return "Résolution : " + dpi + " dpi. " + PRIX.fournisseur.nom + " demande 300 dpi minimum, le rendu sera moins net.";
    return "Résolution : " + dpi + " dpi, trop faible. Utilise une image plus grande (300 dpi minimum).";
  }

  function empCard(empId) {
    var m = S.marquages[empId], emp = DATA.emplacements[empId];
    var prod = DATA.produits.filter(function (p) { return p.zones[empId]; })[0];
    var label = (prod.zones[empId].label) || emp.label;
    var body = "";
    if (m.actif) {
      var imgGroup = "";
      var fm = emp.formats.map(function (id) { var f = PRIX.formatsMotif[id]; return '<option value="' + id + '"' + (id === m.format ? " selected" : "") + ">" + f.nom + " : " + f.w + " × " + f.h + " cm</option>"; }).join("");
      if (!emp.texteSeul) imgGroup = '<div class="grp"><label class="chk"><input type="checkbox" data-k="avecImage"' + (m.avecImage ? " checked" : "") + '> Ajouter un visuel (logo, image)</label>' +
        (m.avecImage ? '<div class="up">' +
          '<label class="filebtn">' + (m.image ? "Changer le fichier" : "Importer le fichier") + '<input type="file" data-upload accept="image/png,image/jpeg,image/svg+xml,image/webp"></label>' +
          (m.image ? '<span class="fname">' + esc(m.image.nom) + '</span><button type="button" class="linkbtn" data-act="rmimg">Retirer</button>' : '<span class="fname muted">PNG, JPG, SVG ou WebP, fond transparent conseillé</span>') + '</div>' +
          '<div class="row2"><label>Taille du visuel<select data-k="format">' + fm + '</select></label>' +
          '<label>Sens<select data-k="orient"><option value="portrait"' + (m.orient === "portrait" ? " selected" : "") + '>Portrait</option><option value="paysage"' + (m.orient === "paysage" ? " selected" : "") + '>Paysage</option></select></label></div>' +
          '<p class="hint dpi" data-dpi>' + esc(dpiText(m)) + '</p>' : "") + '</div>';
      body = '<div class="emp-body">' + imgGroup +
        '<div class="grp">' + textBlock(m, "prenom", "Prénom de chaque pièce") + textBlock(m, "numero", "Numéro de chaque pièce") +
        ((m.prenom.actif || m.numero.actif) ? '<div class="row2"><label class="chk"><input type="checkbox" data-k="maj"' + (m.maj ? " checked" : "") + '> Majuscules</label>' +
          ((m.avecImage && !emp.texteSeul) ? '<label>Texte placé<select data-k="textePos"><option value="dessous"' + (m.textePos === "dessous" ? " selected" : "") + '>Sous le visuel</option><option value="dessus"' + (m.textePos === "dessus" ? " selected" : "") + '>Au-dessus du visuel</option></select></label>' : "") + '</div>' : "") +
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
    (usedEmps()).forEach(function (e) { var m = S.marquages[e]; ["prenom", "numero"].forEach(function (k) { if (m[k].actif) ensureFont(m[k].police); }); });
  }

  function renderEmp(empId) {
    var el = $('[data-emp="' + empId + '"]');
    if (el) { var t = document.createElement("div"); t.innerHTML = empCard(empId); el.replaceWith(t.firstChild); }
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
        S.marquages[empId].image = { nom: file.name, dataUrl: rd.result, url: URL.createObjectURL(file), pxW: img.naturalWidth || 0, pxH: img.naturalHeight || 0, svg: file.type === "image/svg+xml" };
        if (S.marquages[empId].image.svg) { S.marquages[empId].image.pxW = 0; }
        renderEmp(empId); refresh();
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

  function updateTechniqueInfo() {
    var n = eligibleCount(), info = $("#tech-info"), sub = $("#r-sub input");
    if (!info) return;
    sub.disabled = n === 0;
    $("#r-sub").classList.toggle("off", n === 0);
    if (n === 0) {
      info.textContent = "La sublimation n'est pas disponible : aucune pièce blanche ou claire en polyester dans ta commande.";
      if (S.technique === "sublimation") { S.technique = "dtf"; $('input[name="tech"][value="dtf"]').checked = true; scheduleRefresh(); }
    } else if (S.technique === "sublimation") {
      info.textContent = n === S.pieces.length ? "La sublimation s'applique sur toutes tes pièces." : "La sublimation s'applique sur " + n + (n > 1 ? " pièces claires" : " pièce claire") + ". Les autres restent en DTF.";
    } else {
      info.textContent = n + (n > 1 ? " pièces pourraient être en sublimation." : " pièce pourrait être en sublimation.");
    }
  }

  /* ---------- 4. demande ---------- */
  function renderDevis() {
    var c = S.contact;
    var field = function (id, label, type, extra) { return '<label>' + label + '<input id="c-' + id + '" data-c="' + id + '" type="' + (type || "text") + '" value="' + esc(c[id]) + '" ' + (extra || "") + '></label>'; };
    $("#devis").innerHTML =
      '<div class="form2">' + field("asso", "Ton association", "text", 'autocomplete="organization"') + field("nom", "Ton nom", "text", 'autocomplete="name"') +
      field("email", "Ton e-mail", "email", 'autocomplete="email"') + field("tel", "Téléphone (facultatif)", "tel", 'autocomplete="tel"') +
      field("date", "Date souhaitée (facultatif)", "date") + '</div>' +
      '<label>Un message pour nous (facultatif)<textarea id="c-message" data-c="message" rows="3">' + esc(c.message) + '</textarea></label>' +
      '<ol class="send">' +
      '<li><button type="button" class="btn btn-primary" data-act="dl">Télécharger mon fichier de commande</button><span class="hint">Il contient tes pièces et tes visuels. Tu le joins au mail.</span></li>' +
      '<li><button type="button" class="btn btn-primary" data-act="mail">Écrire le mail à Fabr\'Icam</button><span class="hint">Gmail s\'ouvre dans un nouvel onglet, le message est déjà rempli. N\'oublie pas d\'y joindre le fichier.</span></li></ol>' +
      '<p><button type="button" class="linkbtn" data-act="copy">Pas de Gmail ? Copier le texte du mail</button></p>' +
      '<div class="issues" id="issues" aria-live="polite"></div>';
  }

  function problems() {
    var out = [], c = S.contact;
    if (!c.asso.trim()) out.push("Indique le nom de ton association.");
    if (!c.nom.trim()) out.push("Indique ton nom.");
    if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) out.push("Indique une adresse e-mail valide.");
    var actifs = usedEmps().filter(function (e) { return S.marquages[e].actif; });
    if (!actifs.length) out.push("Active au moins un marquage.");
    else if (S.result && S.result.motifs && !S.result.motifs.length) out.push("Il n'y a encore rien à presser : ajoute un visuel, ou écris les prénoms ou les numéros des pièces.");
    var manque = actifs.filter(function (e) { var m = S.marquages[e]; return m.avecImage && !m.image; });
    if (manque.length) out.push("Il manque le fichier du visuel : " + manque.map(function (e) { return DATA.emplacements[e].label.toLowerCase(); }).join(", ") + ". Tu peux aussi le joindre au mail à la main.");
    return { bloquants: out.filter(function (t) { return t.indexOf("Il manque le fichier") !== 0; }), infos: out.filter(function (t) { return t.indexOf("Il manque le fichier") === 0; }) };
  }

  function showIssues(pb) {
    var box = $("#issues"); if (!box) return;
    box.innerHTML = (pb.bloquants.length ? '<ul class="err">' + pb.bloquants.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
      (pb.infos.length ? '<ul class="warn">' + pb.infos.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "");
  }

  function orderPayload() {
    var r = S.result;
    return {
      version: 2, service: DATA.service.nom, creeLe: new Date().toISOString(),
      contact: S.contact, technique: S.technique,
      pieces: S.pieces,
      marquages: JSON.parse(JSON.stringify(S.marquages, function (k, v) { return k === "url" ? undefined : v; })),
      prixAffiche: r && r.prix ? {
        unitaire: r.prix.unitaire, total: r.prix.total, pieces: r.N,
        parProduit: r.prix.groupes.map(function (g) { return { produitId: g.produitId, packType: g.packType, n: g.n, unitaire: g.unitaire }; }),
        packs: r.prix.packs.n
      } : null
    };
  }
  function fileName() {
    var d = new Date(), z = function (n) { return ("0" + n).slice(-2); };
    return "commande-flocage-" + slug(S.contact.asso) + "-" + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + ".json";
  }

  function pieceLine(p, i) {
    var parts = [prodOf(p).nomCourt + " " + colorOf(p).nom.toLowerCase() + " " + p.taille];
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

  function mailText(compact) {
    var c = S.contact, r = S.result, t = [];
    t.push("Bonjour,", "", "Demande de flocage pour " + c.asso.trim() + ".", "");
    t.push("Contact : " + c.nom.trim() + ", " + c.email.trim() + (c.tel.trim() ? ", " + c.tel.trim() : ""));
    if (c.date) t.push("Date souhaitée : " + new Date(c.date + "T12:00:00").toLocaleDateString("fr-FR"));
    t.push("Technique : " + (S.technique === "sublimation" ? "sublimation (polyester clair), DTF sinon" : "DTF"), "");
    t.push(S.pieces.length + (S.pieces.length > 1 ? " pièces" : " pièce") + " :");
    if (compact) {
      var g = {};
      S.pieces.forEach(function (p) { var k = prodOf(p).nomCourt + " " + colorOf(p).nom.toLowerCase() + " " + p.taille; g[k] = (g[k] || 0) + 1; });
      Object.keys(g).forEach(function (k) { t.push("- " + g[k] + " × " + k); });
      t.push("(liste détaillée avec prénoms et numéros dans le fichier de commande joint)");
    } else {
      S.pieces.forEach(function (p, i) { t.push(pieceLine(p, i)); });
    }
    t.push("", "Marquages :");
    usedEmps().forEach(function (e) {
      var m = S.marquages[e]; if (!m.actif) return;
      var d = [];
      if (m.avecImage) d.push("visuel " + m.format + (m.orient === "paysage" ? " paysage" : "") + (m.image ? " (" + m.image.nom + ")" : ""));
      ["prenom", "numero"].forEach(function (k) { if (m[k].actif) d.push((k === "prenom" ? "prénom" : "numéro") + " en " + m[k].police + ", " + fmtN(m[k].hauteur) + " cm, " + m[k].couleur); });
      t.push("- " + DATA.emplacements[e].label + " : " + d.join(" + "));
    });
    if (r && r.prix) { t.push(""); prixLignes(r).forEach(function (l) { t.push(l); }); }
    if (c.message.trim()) t.push("", c.message.trim());
    t.push("", "Je joins le fichier de commande (" + fileName() + ")" + ".", "", "Merci,", c.nom.trim());
    return t.join("\n");
  }

  function mailHref() {
    var subject = "Demande de flocage, " + S.contact.asso.trim() + ", " + S.pieces.length + (S.pieces.length > 1 ? " pièces" : " pièce");
    var body = mailText(false);
    if (encodeURIComponent(body).length > 1700) body = mailText(true);
    return gmailHref(DATA.service.email, subject, body);
  }

  /* ---------- aperçu et total ---------- */
  /* Aperçu sur photo : possible seulement dans la couleur de la photo, et pour une vue calibrée (voir data.js, apercuPhoto). */
  var PHOTO_KO = {};
  function photoApercu(piece, vue) {
    var prod = prodOf(piece), ap = prod.apercuPhoto;
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
    var ph = photoApercu(piece, S.vue), photo = S.mode === "photo" && ph.ok;
    var opts = { prod: prod, hex: colorOf(piece).hex, vue: S.vue, marquages: S.marquages, piece: piece, ctx: CTX };
    var pv = $("#pv");
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
    });
    return out;
  }

  function fraisVendeurTxt(r) {
    if (!r.vendeurs || !r.vendeurs.length) return "";
    var tot = r.couts.livraisonVendeurs;
    return ", ainsi que les frais de port " + (r.vendeurs.length > 1 ? "des vendeurs partenaires" : "du vendeur partenaire") + " (estimés à " + fmtEUR(tot) + ")";
  }

  function renderTotal(r) {
    var box = $("#total"); if (!box) return;
    var html;
    if (!r.prix) html = '<p class="empty">Ajoute une pièce pour voir le prix.</p>';
    else if (r.prix.unitaire != null) {
      html = '<div class="t-main"><span class="t-big">' + fmtEUR(r.prix.unitaire) + '</span><span class="t-unit">par pièce, TTC</span></div>' +
        '<p class="t-sub">' + r.N + (r.N > 1 ? " pièces" : " pièce") + ' : <b>' + fmtEUR(r.prix.total) + '</b></p>' +
        '<p class="t-note">Vêtements, planches de transfert et livraison compris' + fraisVendeurTxt(r) + '. Fabr\'Icam confirme le devis avant toute commande.</p>';
    } else {
      var pv = r.prix;
      html = '<div class="t-main"><span class="t-big">' + fmtEUR(pv.total) + '</span><span class="t-unit">au total, TTC, pour ' + r.N + (r.N > 1 ? " pièces" : " pièce") + '</span></div>' +
        '<ul class="t-lines">' + pv.groupes.map(function (g) { return '<li><span>' + g.n + ' × ' + esc(groupName(g)) + '</span><b>' + fmtEUR(g.unitaire) + '</b></li>'; }).join("") + '</ul>' +
        '<p class="t-note">Prix à l\'unité, vêtements, planches de transfert et livraison compris' + fraisVendeurTxt(r) + '. Fabr\'Icam confirme le devis avant toute commande.</p>';
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
  var STRUCTURAL = { "actif": 1, "avecImage": 1, "prenom.actif": 1, "numero.actif": 1 };

  function onInput(e) {
    var t = e.target;
    if (t.matches("[data-upload]")) return;
    var tr = t.closest("tr[data-pid]");
    if (tr && t.dataset.f) {
      var p = S.pieces.filter(function (x) { return x.id === tr.dataset.pid; })[0], f = t.dataset.f;
      p[f] = t.value;
      if ((f === "prenom" || f === "numero") && p.pack) {   // un pack = une personne : même prénom et même numéro sur les deux pièces
        S.pieces.forEach(function (x) {
          if (x.pack !== p.pack || x === p) return;
          x[f] = p[f];
          var other = $('tr[data-pid="' + x.id + '"] [data-f="' + f + '"]'); if (other) other.value = p[f];
        });
      }
      if (f === "produitId") { var pr = prodOf(p); p.couleurId = pr.couleurs[0].id; if (pr.tailles.indexOf(p.taille) < 0) p.taille = pr.tailles[0]; renderPieces(); renderMarquages(); }
      if (f === "couleurId") { var sw = $(".sw", tr); if (sw) sw.style.background = colorOf(p).hex; }
      S.previewId = p.id;
      scheduleRefresh(); return;
    }
    var card = t.closest("[data-emp]");
    if (card && t.dataset.k) {
      var emp = card.dataset.emp, m = S.marquages[emp], k = t.dataset.k, v;
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
    if (t.dataset.c) { S.contact[t.dataset.c] = t.value; }
  }

  function onChange(e) {
    var t = e.target;
    if (t.matches("[data-upload]")) { var card = t.closest("[data-emp]"); handleUpload(card.dataset.emp, t.files && t.files[0]); }
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
    var clone = function (src) { return src.pack ? newPack(PACKS[src.packType], S.pieces.filter(function (x) { return x.pack === src.pack; }), false) : [newPiece(prodOf(src), { couleurId: src.couleurId, taille: src.taille })]; };
    if (act === "add") { var sel = $("#addmodel"); if (sel) S.addModel = sel.value; addModel(S.addModel, 1); piecesChanged(); }
    else if (act === "addn") {
      var n = Math.max(1, Math.min(200, parseInt($("#addn").value, 10) || 1)), last = S.pieces[S.pieces.length - 1];
      for (var i = 0; i < n; i++) S.pieces = S.pieces.concat(clone(last));
      piecesChanged();
    }
    else if (act === "dup" && tr) {
      var src = pieceOf(tr), members = src.pack ? S.pieces.filter(function (x) { return x.pack === src.pack; }) : [src];
      var at = S.pieces.indexOf(members[members.length - 1]);
      S.pieces.splice.apply(S.pieces, [at + 1, 0].concat(clone(src)));
      piecesChanged();
    }
    else if (act === "del" && tr) {
      var gone = pieceOf(tr), left = S.pieces.filter(function (x) { return gone.pack ? x.pack !== gone.pack : x.id !== gone.id; });
      if (!left.length) { toast("Il faut au moins une pièce."); return; }
      S.pieces = left;
      piecesChanged();
    }
    else if (act === "paste") { var pb = $("#pastebox"); pb.hidden = !pb.hidden; if (!pb.hidden) $("#pastetxt").focus(); }
    else if (act === "pasteok") { addFromList($("#pastetxt").value); $("#pastetxt").value = ""; $("#pastebox").hidden = true; renderPieces(); refresh(); }
    else if (act === "rmimg") { var card = b.closest("[data-emp]"); S.marquages[card.dataset.emp].image = null; renderEmp(card.dataset.emp); refresh(); }
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

  /* =================================================================== */
  /* ROUTAGE                                                             */
  /* =================================================================== */
  function route() {
    var h = location.hash || "#/";
    if (h.indexOf("#catalogue") === 0) return;
    if (h.indexOf("#/atelier") === 0) { if (App.viewAtelier) App.viewAtelier(); }
    else {
      var m = h.match(/^#\/configurer(?:\/(.+))?$/);
      if (m) viewConfigurator(m[1]); else viewVitrine();
    }
    window.scrollTo(0, 0);
    $("#top-note").hidden = h.indexOf("#/atelier") === 0;
    $$(".nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === (h.indexOf("#/atelier") === 0 ? "#/atelier" : h.indexOf("#/configurer") === 0 ? "#/configurer" : "#/")); });
  }

  function start() {
    app = $("#app");
    document.addEventListener("input", onInput);
    document.addEventListener("change", onChange);
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", route);
    $("#brand-name").textContent = DATA.service.nom;
    var cfgLink = $(".nav a[data-cfg]"); if (cfgLink) cfgLink.href = "#/configurer";
    gmailLink($("#foot-mail"), gmailHref(DATA.service.email));
    gmailLink($("#top-note-mail"), autreVetementHref());
    $("#foot-mail").textContent = DATA.service.email;
    route();
  }

  var App = window.App = {
    CTX: CTX, S: S, DATA: DATA, PRIX: PRIX, esc: esc, fmtEUR: fmtEUR, fmtN: fmtN, $: $, $$: $$, byId: byId,
    EMP_ORDER: EMP_ORDER, toast: toast, download: download, slug: slug, measure: measure, ensureFont: ensureFont,
    orderOf: orderOf, start: start, colorOf: colorOf, pieceLine: pieceLine,
    vendeurInfo: vendeurInfo, mailHref: mailHref, gmailHref: gmailHref, mailText: mailText, problems: problems, orderPayload: orderPayload, PACKS: PACKS, itemOf: itemOf, groupName: groupName
  };
  window.addEventListener("load", start);
})();
