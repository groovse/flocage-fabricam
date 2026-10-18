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
  var EMP_ORDER = ["poitrine", "dos", "manche_g", "manche_d", "cuisse_g", "cuisse_d", "bas_jambe_g"];
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
  var S = { pieces: [], nextId: 1, marquages: null, technique: "dtf", vue: "face", previewId: null,
    contact: { asso: "", nom: "", email: "", tel: "", date: "", message: "" }, result: null,
    entryId: null, addModel: null, nextPack: 1 };
  function itemOf(id) { return byId[id] || PACKS[id]; }
  // Nom d'une ligne de prix : un produit, ou un pack
  function groupName(g) {
    if (g.pack) { var d = g.packType && PACKS[g.packType]; return d ? (d.nomCourt || d.nom) : "Pack"; }
    return byId[g.produitId].nomCourt;
  }

  function darkColor(prod) { return P.lum(prod.couleurs[0].hex) < 0.5; }

  function newMarquage(empId, prod) {
    var emp = DATA.emplacements[empId], f = emp.formats;
    var big = empId === "dos", tiny = empId === "bas_jambe_g", small = /^(manche|cuisse)/.test(empId);
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
      EMP_ORDER.forEach(function (e) { S.marquages[e] = newMarquage(e, prods[0]); });
      (item.vitrine || ["poitrine"]).forEach(function (e) { if (S.marquages[e]) S.marquages[e].actif = true; });   // même configuration que le prix affiché sur la vitrine
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
    return S.pieces.length <= 2 && S.pieces.every(function (p) { return !p.prenom && !p.numero; }) &&
      EMP_ORDER.every(function (e) { var m = S.marquages[e]; return !m.image && !m.prenom.actif && !m.numero.actif; });
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

  function cardPhoto(item) {
    if (item.produits) {
      return '<div class="p-photo duo">' + item.produits.map(function (id) {
        var pr = byId[id];
        return '<div class="cell" data-prod="' + pr.id + '">' + (pr.photos && pr.photos[0] ? photoImg(pr, pr.photos[0], 600) : silhouette(pr)) + '</div>';
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
    return '<div class="p-media" data-prod="' + item.id + '"><div class="p-photo" data-prod="' + item.id + '">' + photoImg(item, ph[0], 800) + '</div>' + thumbs + '</div>';
  }

  function cardHTML(item) {
    var isPack = !!item.produits, prods = isPack ? item.produits.map(function (id) { return byId[id]; }) : [item];
    var sw = isPack
      ? prods.map(function (pr) { return '<li><b>' + esc(pr.nomCourt) + '</b> ' + pr.couleurs.map(function (c) { return '<span class="sw" style="background:' + c.hex + '"></span>' + esc(c.nom); }).join(" ") + '</li>'; }).join("")
      : item.couleurs.map(function (c) { return '<li><span class="sw" style="background:' + c.hex + '"></span>' + esc(c.nom) + '</li>'; }).join("");
    var tailles = prods.map(function (pr) { return (isPack ? esc(pr.nomCourt) + " " : "") + esc(pr.tailles[0]) + " à " + esc(pr.tailles[pr.tailles.length - 1]); }).join(", ");
    var meta = isPack ? "Deux pièces Kipsta, Decathlon. Le pack coûte moins cher que le maillot et le short pris séparément." : esc(item.marque) + ". " + esc(item.matiere) + ".";
    return '<article class="produit">' + cardPhoto(item) +
      '<div class="p-info"><h3>' + esc(item.nom) + '</h3>' +
      '<p class="p-meta">' + meta + '</p>' +
      '<ul class="swatches" aria-label="Couleurs">' + sw + '</ul>' +
      '<p class="p-meta">Tailles : ' + tailles + '.</p>' +
      '<h4>Prix par ' + (isPack ? "pack" : "pièce") + '</h4>' + priceStrip(item) +
      '<p class="note">Avec un visuel A6 ' + esc(item.texteVitrine || "à la poitrine") + '. Prix TTC, ' + (isPack ? "vêtements" : "vêtement") + ', planche de transfert et livraison compris. Le prix baisse avec la quantité.</p>' +
      '<a class="btn btn-primary" href="#/configurer/' + item.id + '">Personnaliser ' + esc(item.demonstratif || "ce produit") + '</a>' +
      '</div></article>';
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
      '<section class="block" id="catalogue"><h2>Catalogue</h2><div class="catalogue">' + cards + '</div></section>' +
      '<section class="block steps"><h2>Comment ça marche</h2><ol class="seq">' +
      '<li><b>Tu configures.</b> Couleurs, tailles, visuels, prénoms et numéros, avec un aperçu à la taille réelle.</li>' +
      '<li><b>Tu vois le prix.</b> Il se met à jour à chaque changement, vêtements et marquage compris.</li>' +
      '<li><b>Tu envoies la demande.</b> Un mail pré-rempli part vers Fabr\'Icam, avec ton fichier de commande.</li>' +
      '<li><b>On valide le devis.</b> Fabr\'Icam te le confirme et te réclame le règlement, puis on presse.</li></ol></section>' +
      '<section class="block facts"><h2>Bon à savoir</h2><dl>' +
      '<div><dt>Aucun minimum</dt><dd>Une seule pièce ou toute l\'équipe, le calcul est le même. Tu peux mélanger plusieurs vêtements dans une commande.</dd></div>' +
      '<div><dt>Deux techniques</dt><dd>Le DTF convient à toutes les couleurs. La sublimation, plus lisse, ne marche que sur polyester blanc ou clair.</dd></div>' +
      '<div><dt>Des vêtements Decathlon</dt><dd>Fabr\'Icam les retire en magasin, il n\'y a donc pas de frais de livraison sur les vêtements.</dd></div>' +
      '</dl></section>';

    // Photo introuvable (hors ligne, lien périmé) : on affiche le dessin du vêtement à la place
    $$(".p-photo > img, .p-photo .cell > img").forEach(function (img) {
      img.addEventListener("error", function () {
        var host = img.closest("[data-prod]"), media = img.closest(".p-media");
        host.innerHTML = silhouette(byId[host.dataset.prod]);
        var th = media && $(".p-thumbs", media); if (th) th.remove();
      });
    });
    // Vignettes : un clic affiche la photo choisie
    $$(".p-thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        var media = b.closest(".p-media"), prod = byId[media.dataset.prod], main = $(".p-photo > img", media);
        if (!main) return;
        main.src = photoSrc(prod.photos[Number(b.dataset.i)], 800);
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
      '<label class="pv-piece">Aperçu pour <select id="pv-piece"></select></label></div>' +
      '<div id="pv"></div></div>' +
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
      ((DATA.packs || []).length ? '<optgroup label="Packs">' + DATA.packs.map(function (x) { return o(x.id, x.nom); }).join("") + '</optgroup>' : "");
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
    if (dpi >= 150) return "Résolution : " + dpi + " dpi. Sprint demande 300 dpi minimum, le rendu sera moins net.";
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
      '<li><button type="button" class="btn btn-primary" data-act="mail">Écrire le mail à Fabr\'Icam</button><span class="hint">Ton application de mail s\'ouvre, le message est déjà rempli.</span></li></ol>' +
      '<p><button type="button" class="linkbtn" data-act="copy">Copier le texte du mail</button></p>' +
      '<div class="issues" id="issues" aria-live="polite"></div>';
  }

  function problems() {
    var out = [], c = S.contact;
    if (!c.asso.trim()) out.push("Indique le nom de ton association.");
    if (!c.nom.trim()) out.push("Indique ton nom.");
    if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) out.push("Indique une adresse e-mail valide.");
    var actifs = usedEmps().filter(function (e) { return S.marquages[e].actif; });
    if (!actifs.length) out.push("Active au moins un marquage.");
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
    return "mailto:" + DATA.service.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  /* ---------- aperçu et total ---------- */
  function renderPreview() {
    var piece = S.pieces.filter(function (p) { return p.id === S.previewId; })[0] || S.pieces[0];
    if (!piece) return;
    var prod = prodOf(piece);
    var hasBack = Object.keys(prod.zones).some(function (k) { var v = prod.zones[k].vue; return v === "dos" || v === "cote"; });
    if (!hasBack && S.vue === "dos") S.vue = "face";
    $("#pv").innerHTML = P.render({ prod: prod, hex: colorOf(piece).hex, vue: S.vue, marquages: S.marquages, piece: piece, ctx: CTX });
    $$(".seg button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.vue === S.vue ? "true" : "false");
      if (b.dataset.vue === "dos") { b.disabled = !hasBack; b.title = hasBack ? "" : "Pas de marquage au dos sur ce vêtement"; }
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
        if (l.length) out.push(nom + " : cette couleur se voit mal sur le polo " + l.join(" et ") + ". Choisis une couleur plus contrastée.");
        else if (sublBlanc) out.push(nom + " : en sublimation, le blanc n'est pas imprimé, le texte ne sera pas visible.");
      });
    });
    return out;
  }

  function renderTotal(r) {
    var box = $("#total"); if (!box) return;
    var html;
    if (!r.prix) html = '<p class="empty">Ajoute une pièce pour voir le prix.</p>';
    else if (r.prix.unitaire != null) {
      html = '<div class="t-main"><span class="t-big">' + fmtEUR(r.prix.unitaire) + '</span><span class="t-unit">par pièce, TTC</span></div>' +
        '<p class="t-sub">' + r.N + (r.N > 1 ? " pièces" : " pièce") + ' : <b>' + fmtEUR(r.prix.total) + '</b></p>' +
        '<p class="t-note">Vêtements, planches de transfert et livraison compris. Fabr\'Icam confirme le devis avant toute commande.</p>';
    } else {
      var pv = r.prix;
      html = '<div class="t-main"><span class="t-big">' + fmtEUR(pv.total) + '</span><span class="t-unit">au total, TTC, pour ' + r.N + (r.N > 1 ? " pièces" : " pièce") + '</span></div>' +
        '<ul class="t-lines">' + pv.groupes.map(function (g) { return '<li><span>' + g.n + ' × ' + esc(groupName(g)) + '</span><b>' + fmtEUR(g.unitaire) + '</b></li>'; }).join("") + '</ul>' +
        '<p class="t-note">Prix à l\'unité, vêtements, planches de transfert et livraison compris. Fabr\'Icam confirme le devis avant toute commande.</p>';
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
      window.location.href = mailHref();
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
    $("#foot-mail").href = "mailto:" + DATA.service.email;
    $("#foot-mail").textContent = DATA.service.email;
    route();
  }

  var App = window.App = {
    CTX: CTX, S: S, DATA: DATA, PRIX: PRIX, esc: esc, fmtEUR: fmtEUR, fmtN: fmtN, $: $, $$: $$, byId: byId,
    EMP_ORDER: EMP_ORDER, toast: toast, download: download, slug: slug, measure: measure, ensureFont: ensureFont,
    orderOf: orderOf, start: start, colorOf: colorOf, pieceLine: pieceLine,
    mailHref: mailHref, mailText: mailText, problems: problems, orderPayload: orderPayload, PACKS: PACKS, itemOf: itemOf, groupName: groupName
  };
  window.addEventListener("load", start);
})();
