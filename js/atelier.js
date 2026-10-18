/*
 * ESPACE ATELIER (interne) : charge un fichier de commande reçu par mail et montre
 * ce qu'il faut acheter, commander, presser, avec le détail des coûts et de la marge.
 */
(function () {
  "use strict";

  var A = window.App, E = window.Engine, P = window.Preview;
  var esc = A.esc, fmtEUR = A.fmtEUR, fmtN = A.fmtN, $ = A.$, $$ = A.$$;
  var loaded = null;
  function fmtPct(x) { return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(x * 100) + " %"; }

  var ABBR = { poitrine: "P", dos: "D", manche_g: "MG", manche_d: "MD", cuisse_g: "CG", cuisse_d: "CD", bas_jambe_g: "BJ", chaussette_g: "SG", chaussette_d: "SD" };
  var KIND = { image: "v", prenom: "p", numero: "n" };

  function fontsFor(order) {
    var set = {};
    Object.keys(order.marquages || {}).forEach(function (e) {
      var m = order.marquages[e];
      ["prenom", "numero"].forEach(function (k) { if (m && m[k] && m[k].actif && m[k].police) set[m[k].police] = 1; });
    });
    return Object.keys(set);
  }

  function loadFonts(order) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(fontsFor(order).map(function (f) { return document.fonts.load('200px "' + f + '"', "AÉHg0").catch(function () {}); }));
  }

  function setLoaded(obj) {
    loaded = obj;
    loadFonts(obj.order).then(renderOut);
  }

  function parseOrderFile(text) {
    var j = JSON.parse(text);
    if (!j || !Array.isArray(j.pieces) || !j.marquages) throw new Error("Ce fichier n'est pas une commande de " + A.DATA.service.nom + ".");
    var bad = j.pieces.filter(function (p) { return !A.byId[p.produitId]; })[0];
    if (bad) throw new Error("Un modèle de la commande n'est plus dans le catalogue : " + bad.produitId + ".");
    return { order: { pieces: j.pieces, marquages: j.marquages, technique: j.technique || "dtf" }, contact: j.contact || {}, prixAffiche: j.prixAffiche || null, creeLe: j.creeLe || null };
  }

  /* ---------- plan d'une planche ---------- */
  function sheetSVG(sheet, order) {
    var W = sheet.format.w, H = sheet.format.h, sc = 7;
    var s = '<svg class="sheet" viewBox="0 0 ' + W + " " + H + '" width="' + Math.round(W * sc) + '" height="' + Math.round(H * sc) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plan de la planche ' + esc(sheet.format.nom) + '">';
    s += '<rect width="' + W + '" height="' + H + '" fill="#fff" stroke="#14213d" stroke-width=".25"/>';
    sheet.placed.forEach(function (p) {
      var mo = p.ref.motif, el = mo.el, ow = p.ref.w, oh = p.ref.h;
      var tf = p.rot ? "translate(" + (p.x + p.w) + " " + p.y + ") rotate(90)" : "translate(" + p.x + " " + p.y + ")";
      var isImg = el.kind === "image";
      s += '<g transform="' + tf + '"><title>' + esc(mo.label) + "</title>";
      s += '<rect width="' + ow + '" height="' + oh + '" fill="' + (isImg ? "#fdf0ea" : "#e3e9e5") + '" stroke="' + (isImg ? "#e8451e" : "#14213d") + '" stroke-width=".12"/>';
      if (isImg) {
        var img = order.marquages[mo.emp] && order.marquages[mo.emp].image;
        if (img) s += '<image href="' + esc(img.dataUrl || img.url) + '" width="' + ow + '" height="' + oh + '" preserveAspectRatio="xMidYMid meet"/>';
      } else {
        s += '<text x="' + ow / 2 + '" y="' + el.asc + '" text-anchor="middle" font-family="\'' + esc(el.police) + '\', Impact, sans-serif" font-size="' + el.fontCm +
          '" fill="' + esc(el.couleur) + '" style="paint-order:stroke;stroke:rgba(0,0,0,.35);stroke-width:.08px">' + esc(el.text) + "</text>";
      }
      var lab = (mo.pieceIdx + 1) + "·" + ABBR[mo.emp] + KIND[el.kind];
      s += '<text x=".4" y="1.5" font-size="1.4" fill="#14213d" font-family="Hanken Grotesk, sans-serif" font-weight="700" opacity=".8">' + lab + "</text></g>";
    });
    return s + "</svg>";
  }

  /* ---------- sections ---------- */
  function table(head, rows, cls) {
    return '<div class="tablewrap"><table class="tbl ' + (cls || "") + '"><thead><tr>' + head.map(function (h, i) { return "<th" + (h.num ? ' class="num"' : "") + ">" + esc(h.t || h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c, i) { var n = head[i] && head[i].num; return "<td" + (n ? ' class="num"' : "") + ">" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }

  function achats(order) {
    var g = {}, list = [];
    order.pieces.forEach(function (p) {
      var prod = A.byId[p.produitId], col = prod.couleurs.filter(function (c) { return c.id === p.couleurId; })[0] || prod.couleurs[0];
      var k = prod.id + "|" + col.id + "|" + p.taille;
      if (!g[k]) { g[k] = { prod: prod, col: col, taille: p.taille, qty: 0 }; list.push(g[k]); }
      g[k].qty++;
    });
    list.sort(function (a, b) { return a.prod.nom.localeCompare(b.prod.nom) || a.col.nom.localeCompare(b.col.nom) || a.prod.tailles.indexOf(a.taille) - b.prod.tailles.indexOf(b.taille); });
    return list;
  }

  function pressNotes(order, r) {
    var notes = [], pr = A.PRIX.presse;
    var usesPoly = false, usesOther = false, usesSub = r.motifs.some(function (m) { return m.techno === "sublimation"; });
    order.pieces.forEach(function (p) {
      var prod = A.byId[p.produitId], tech = E.pieceTechno(order, p, A.CTX);
      if (tech === "dtf") { if ((prod.polyesterPct || 0) >= 50) usesPoly = true; else usesOther = true; }
    });
    if (usesPoly) notes.push(pr.dtf_polyester);
    if (usesOther) notes.push(pr.dtf_autre);
    if (usesSub) notes.push(pr.sublimation);
    var vus = {};
    order.pieces.forEach(function (p) { var prod = A.byId[p.produitId]; if (prod.avertissement && !vus[prod.id]) { vus[prod.id] = 1; notes.push(prod.avertissement); } });
    notes.push("Plateau de la presse : " + A.PRIX.plateau.w + " × " + A.PRIX.plateau.h + " cm au maximum. Les motifs en DTF se découpent le long de leur case sur la planche.");
    return notes;
  }

  function renderOut() {
    var out = $("#atelier-out"); if (!out || !loaded) return;
    var order = loaded.order, c = loaded.contact, r = E.computeOrder(order, A.CTX), pv = r.prix;
    if (!pv) { out.innerHTML = '<p class="empty">Cette commande ne contient aucune pièce.</p>'; return; }
    var html = "";

    // en-tête
    html += '<section class="a-block a-head"><h2>Commande de ' + esc(c.asso || "asso inconnue") + '</h2><p>' +
      (c.nom ? esc(c.nom) : "") + (c.email ? ', <a href="' + esc(A.gmailHref(c.email, "Ta commande de flocage")) + '" target="_blank" rel="noopener">' + esc(c.email) + "</a>" : "") + (c.tel ? ", " + esc(c.tel) : "") + "<br>" +
      r.N + (r.N > 1 ? " pièces" : " pièce") + ", technique demandée : " + (order.technique === "sublimation" ? "sublimation quand c'est possible, DTF sinon" : "DTF") +
      (c.date ? ", pour le " + new Date(c.date + "T12:00:00").toLocaleDateString("fr-FR") : "") + "</p>" +
      (c.message ? '<blockquote>' + esc(c.message) + "</blockquote>" : "") + "</section>";

    // calcul
    var nMag = 0, nMp = 0, eurMag = 0, eurMp = 0;
    order.pieces.forEach(function (p) {
      var pr = A.byId[p.produitId];
      if (pr.vendeur) { nMp++; eurMp += pr.prixAchat; } else { nMag++; eurMag += pr.prixAchat; }
    });
    var plur = function (n) { return n + (n > 1 ? " pièces" : " pièce"); };
    var rows = [];
    if (nMag) rows.push(["Vêtements Decathlon (retrait en magasin)", plur(nMag), fmtEUR(eurMag)]);
    if (nMp) rows.push(["Vêtements de la place de marché Decathlon (livrés par le vendeur)", plur(nMp), fmtEUR(eurMp)]);
    if (r.couts.livraisonVendeurs) rows.push(["Frais de port des vendeurs (estimation)", r.vendeurs.map(function (v) { return v.nom + " " + fmtEUR(v.frais); }).join(", "), fmtEUR(r.couts.livraisonVendeurs)]);
    var fn = A.PRIX.fournisseur.nom, plHT = A.PRIX.prixPlanchesHT;
    if (plHT) rows.push(["Planches " + fn + ", hors taxes", "", fmtEUR(r.couts.planchesHT)]);
    rows = rows.concat([
      ["Planches " + fn + ", TTC", plHT ? "TVA " + Math.round(A.PRIX.tva * 100) + " %" : "", fmtEUR(r.couts.planchesTTC)],
      ["Livraison " + fn, r.couts.livraison ? "estimation" : "offerte", fmtEUR(r.couts.livraison)],
      ["<b>Coût de revient</b>", "", "<b>" + fmtEUR(r.couts.total) + "</b>"]
    ]);
    pv.groupes.forEach(function (g) {
      var detail = "coût moyen " + fmtEUR(g.coutMoyen) + ", marge " + (g.plafonne ? "plafonnée à " + fmtEUR(A.PRIX.regles.margeMax) : fmtPct(g.taux)) + (g.pack ? " (une seule pièce du pack)" : "") + ", soit " + fmtEUR(g.unitaire) + " l'unité";
      rows.push([esc(A.groupName(g)) + " × " + g.n, detail, fmtEUR(g.total)]);
    });
    rows.push(["<b>Total à facturer</b>", pv.unitaire != null ? r.N + " × " + fmtEUR(pv.unitaire) : "", "<b>" + fmtEUR(pv.total) + "</b>"]);
    rows.push(["<b>Marge</b>", pv.total > 0 ? fmtPct(pv.marge / r.couts.total) + " du coût de revient" : "", "<b>" + fmtEUR(pv.marge) + "</b>"]);
    html += '<section class="a-block"><h2>Coûts et prix</h2>' + table(["Ligne", "Détail", { t: "Montant", num: true }], rows.map(function (x) { return [x[0], x[1], x[2]]; }), "calc");
    if (loaded.prixAffiche && Math.abs(loaded.prixAffiche.total - pv.total) > 0.005) {
      html += '<p class="warn-line">Le client a vu un total de ' + fmtEUR(loaded.prixAffiche.total) + ". Avec les tarifs actuels, le calcul donne " + fmtEUR(pv.total) + ". Les tarifs ont changé entre-temps.</p>";
    } else if (loaded.prixAffiche) {
      html += '<p class="ok-line">Le prix recalculé est identique à celui vu par le client.</p>';
    }
    html += "</section>";

    // Decathlon : en magasin, puis en ligne pour les articles de la place de marché
    var ach = achats(order), magasin = ach.filter(function (a) { return !a.prod.vendeur; }), enligne = ach.filter(function (a) { return a.prod.vendeur; });
    var fiche = function (a) { return a.prod.lien ? ' <a href="' + esc(a.prod.lien) + '" target="_blank" rel="noopener">fiche</a>' : ""; };
    var prixConnus = function (list) { return list.map(function (a) { return a.prod.nom + " " + fmtEUR(a.prod.prixAchat); }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).map(esc).join(", "); };
    if (magasin.length) {
      html += '<section class="a-block"><h2>À acheter chez Decathlon, en magasin</h2>' + table(["Modèle", "Couleur", "Taille", { t: "Quantité", num: true }, { t: "Prix", num: true }],
        magasin.map(function (a) { return [esc(a.prod.nom) + (a.col.ref ? ' <span class="muted">réf. ' + esc(a.col.ref) + "</span>" : "") + fiche(a), esc(a.col.nom), esc(a.taille), a.qty, fmtEUR(a.qty * a.prod.prixAchat)]; })) +
        '<p class="hint">Prix d\'achat enregistré : ' + prixConnus(magasin) + ". Vérifie-le en magasin.</p></section>";
    }
    if (enligne.length) {
      html += '<section class="a-block"><h2>À commander en ligne sur Decathlon (place de marché)</h2>' + table(["Modèle", "Vendeur", "Couleur", "Taille", { t: "Quantité", num: true }, { t: "Prix", num: true }],
        enligne.map(function (a) { var v = A.vendeurInfo(a.prod); return [esc(a.prod.nom) + fiche(a), esc(v.nom), esc(a.col.nom), esc(a.taille), a.qty, fmtEUR(a.qty * a.prod.prixAchat)]; })) +
        '<ul class="notes">' + r.vendeurs.map(function (v) {
          return "<li>" + esc(v.nom) + " : frais de port estimés à " + fmtEUR(v.frais) + " pour tout ce que tu commandes chez ce vendeur" + (v.delai ? ", livraison en " + v.delai : "") + ". Le montant réel s'affiche seulement au moment de la commande : s'il est différent, corrige-le dans prix.js (livraisonVendeur).</li>";
        }).join("") + "<li>Pas de retrait en magasin. Vérifie le stock de la taille avant de commander : il est souvent très limité. Une fois floqué, l'article n'est ni repris ni échangé.</li></ul>" +
        '<p class="hint">Prix d\'achat enregistré : ' + prixConnus(enligne) + ".</p></section>";
    }

    // Fournisseur
    var lines = r.lignesPlanches, F = A.PRIX.fournisseur, suf = A.PRIX.prixPlanchesHT ? "HT" : "TTC";
    html += '<section class="a-block"><h2>À commander chez ' + esc(F.nom) + '</h2>';
    if (lines.length) {
      html += table(["Technique", "Format", { t: "Quantité", num: true }, { t: "Prix " + suf + " l'unité", num: true }, { t: "Remise", num: true }, { t: "Total " + suf, num: true }],
        lines.map(function (l) { return [esc(A.PRIX.planches[l.techno].nom), esc(l.nom), l.qty, fmtEUR(l.prixUnitaire), l.remise ? Math.round(l.remise * 100) + " %" : "aucune", fmtEUR(l.totalHT)]; }));
      html += '<p class="hint">' + (A.PRIX.prixPlanchesHT ? "Total HT " + fmtEUR(r.couts.planchesHT) + ", soit " + fmtEUR(r.couts.planchesTTC) + " TTC. " : "Total " + fmtEUR(r.couts.planchesTTC) + " TTC. ") +
        (r.couts.livraison ? "Livraison estimée à " + fmtEUR(r.couts.livraison) + " (le prix réel s'affiche au panier)." : "Livraison offerte.") + " " + esc(F.delai) + "</p>" +
        '<p class="hint">' + esc(F.nom) + " demande : " + esc(F.fichier) + (F.url ? ' <a href="' + esc(F.url) + '" target="_blank" rel="noopener">Ouvrir le site</a>.' : "") + "</p>";
    } else html += '<p class="empty">Aucune planche à commander (aucun marquage actif).</p>';
    html += "</section>";

    // plans
    ["dtf", "sublimation"].forEach(function (techno) {
      var plan = r.plans[techno]; if (!plan) return;
      html += '<section class="a-block"><h2>Plan des planches, ' + esc(A.PRIX.planches[techno].nom) + "</h2>";
      var sorted = plan.sheets.slice().sort(function (a, b) { return b.format.w * b.format.h - a.format.w * a.format.h; });
      sorted.forEach(function (sh, i) {
        html += '<figure class="sheetfig"><figcaption>Planche ' + (i + 1) + " sur " + sorted.length + " : " + esc(sh.format.nom) + ", " + sh.placed.length + (sh.placed.length > 1 ? " motifs" : " motif") +
          (techno === "sublimation" ? ". Envoie le fichier à l'endroit, sans miroir." : "") + '</figcaption><div class="sheetscroll">' + sheetSVG(sh, order) + "</div></figure>";
      });
      html += "</section>";
    });
    if (lines.length) html += '<p class="hint key">Lecture des étiquettes : numéro de pièce, puis P poitrine, D dos, MG manche gauche, MD manche droite, CG cuisse gauche, CD cuisse droite, BJ bas de la jambe gauche, SG chaussette gauche, SD chaussette droite, puis v visuel, p prénom, n numéro. Exemple : 3·Dp = prénom du dos de la pièce 3. Les motifs tournés de 90° sont déjà dessinés tournés.</p>';

    // pièces
    html += '<section class="a-block"><h2>Pièces à presser</h2>' + table(["N°", "Modèle", "Prénom", "Numéro", "Motifs"],
      order.pieces.map(function (p, i) {
        var col = A.colorOf(p), mine = r.motifs.filter(function (m) { return m.pieceId === p.id; });
        var emps = {}; mine.forEach(function (m) { (emps[m.emp] = emps[m.emp] || []).push(KIND[m.kind]); });
        var txt = Object.keys(emps).map(function (e) { return ABBR[e] + " " + emps[e].join("+"); }).join(", ");
        var tech = E.pieceTechno(order, p, A.CTX) === "sublimation" ? ' <span class="tag">sublimation</span>' : "";
        var pack = p.pack ? ' <span class="tag">pack</span>' : "";
        return [i + 1, esc(A.byId[p.produitId].nomCourt) + ", " + esc(col.nom.toLowerCase()) + " " + esc(p.taille) + pack + tech, esc(p.prenom || ""), esc(p.numero || ""), esc(txt)];
      })) + "</section>";

    // presse
    html += '<section class="a-block"><h2>Réglages de presse</h2><ul class="notes">' + pressNotes(order, r).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></section>";

    // visuels
    var imgs = Object.keys(order.marquages).filter(function (e) { var m = order.marquages[e]; return m.actif && m.avecImage && m.image; });
    html += '<section class="a-block"><h2>Visuels reçus</h2>';
    if (imgs.length) {
      html += '<div class="imgs">' + imgs.map(function (e) {
        var m = order.marquages[e];
        return '<figure><img src="' + esc(m.image.dataUrl) + '" alt="Visuel ' + esc(A.DATA.emplacements[e].label) + '"><figcaption>' + esc(A.DATA.emplacements[e].label) + ", " + esc(m.format) + '<br><a download="' + esc(e + "-" + m.image.nom) + '" href="' + esc(m.image.dataUrl) + '">Télécharger ' + esc(m.image.nom) + "</a></figcaption></figure>";
      }).join("") + "</div>";
    } else html += '<p class="hint">Aucun visuel dans ce fichier. Regarde les pièces jointes du mail.</p>';
    html += "</section>";

    // avertissements
    if (r.warnings.length) html += '<section class="a-block"><h2>À vérifier</h2><ul class="warn">' + r.warnings.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></section>";

    out.innerHTML = html;
  }

  /* ---------- vue ---------- */
  A.viewAtelier = function () {
    A.$("#app").innerHTML =
      '<div class="atelier" data-view="atelier"><div class="cfg-head"><a class="back" href="#/">Catalogue</a><h1>Espace atelier</h1></div>' +
      '<p class="lead-s">Charge le fichier de commande reçu par mail pour voir ce qu\'il faut acheter, commander et presser, avec les coûts et la marge. Cette page est faite pour toi, pas pour les clients.</p>' +
      '<div class="loader"><label class="filebtn">Charger un fichier de commande<input id="a-file" type="file" accept=".json,application/json"></label>' +
      '<button type="button" class="btn btn-quiet" id="a-current">Utiliser la commande en cours de configuration</button>' +
      '<button type="button" class="btn btn-quiet" id="a-print">Imprimer</button></div>' +
      '<div id="atelier-out"><p class="empty">Aucune commande chargée.</p></div></div>';

    $("#a-file").addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try { setLoaded(parseOrderFile(rd.result)); }
        catch (err) { A.toast(err.message || "Fichier illisible."); }
      };
      rd.readAsText(f);
    });
    $("#a-current").addEventListener("click", function () {
      if (!A.S.marquages || !A.S.pieces.length) { A.toast("Aucune commande en cours. Configure d'abord une commande, ou charge un fichier."); return; }
      setLoaded({ order: JSON.parse(JSON.stringify(A.orderOf(), function (k, v) { return k === "url" ? undefined : v; })), contact: Object.assign({}, A.S.contact), prixAffiche: null, creeLe: null });
    });
    $("#a-print").addEventListener("click", function () { window.print(); });
    if (loaded) renderOut();
  };
})();
