/*
 * GUIDE DES MÉTHODES (atelier, onglet « Fiche de fabrication ») :
 * on choisit un article du catalogue (ou une matière) et une couleur, et le guide liste toutes les méthodes applicables
 * (DTF, sublimation, vinyle, gravure laser), avec les réglages et le lien vers la page de la fiche PDF.
 *
 * Les données viennent de js/methodes-data.js, généré par outils/fiches-pdf.py à partir de outils/fiches_donnees.py (le fichier à modifier
 * pour changer un réglage ou un statut). Ce fichier-ci ne contient que la logique et l'affichage.
 */
(function () {
  "use strict";

  var D = window.MethodesData;
  var MOTS = { ok: "Applicable", prudence: "Avec précautions", non: "Non applicable" };
  var ICONE = { ok: "✓", prudence: "!", non: "✕" };
  var NOMS = { dtf: "DTF", sublimation: "Sublimation", vinyle: "Vinyle", laser: "Gravure laser" };
  var RANG = { ok: 0, prudence: 1, non: 2 };
  var APPORTE_DEFAUT = "coton-polyester";   // vêtement apporté dont la matière n'est pas choisie : le cas où l'on ne sublime pas

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- logique ---------- */
  function matiere(id) {
    for (var i = 0; i < D.matieres.length; i++) if (D.matieres[i].id === id) return D.matieres[i];
    return null;
  }

  // Fiche à utiliser pour un article du catalogue. Un vêtement apporté n'en a pas d'office : on prend celle de sa matière déclarée
  // (« polyester », « coton » ou « inconnu », voir js/data.js), ou celle qu'on choisit à la main.
  function matiereDuProduit(prod, matiereId) {
    if (!prod) return null;
    if (prod.apporte) return matiereId || APPORTE_DEFAUT;
    return D.produits[prod.id] || null;
  }

  // Fiche proposée par défaut pour la matière déclarée sur un vêtement apporté
  function matiereApportee(declaree) {
    var l = D.matiereApportee[declaree];
    return l && l.length ? l[0] : APPORTE_DEFAUT;
  }

  // Les méthodes d'une matière pour une couleur ("clair" : blanc ou très clair, "fonce" : toutes les autres). Si on connaît l'article,
  // on tient aussi compte de ses réserves propres : sublimation désactivée dans le catalogue, part de polyester.
  function methodesPour(matiereId, couleur, prod) {
    var m = matiere(matiereId);
    if (!m) return [];
    var cle = couleur === "clair" ? "clair" : "fonce";
    return m.methodes.map(function (me) {
      var statut = me[cle], raison = me.raison;
      if (me.id === "sublimation" && cle === "fonce" && me.fonce === "non" && me.clair !== "non") {
        raison = "La sublimation ne marche que sur blanc ou couleur très claire : sur une couleur foncée, choisis le DTF ou le vinyle.";
      }
      if (me.id === "sublimation" && prod && !prod.apporte && statut !== "non") {
        var pct = prod.polyesterPct;
        if (prod.sublimation === false) {
          statut = "non"; raison = "Le catalogue désactive la sublimation sur cet article (forme ronde, enduit ou élastique).";
        } else if (pct != null && pct < 65) {
          statut = "non"; raison = "Moins de 65 % de polyester (" + pct + " %) : le fournisseur déconseille la sublimation.";
        } else if (pct != null && pct < 90 && statut === "ok") {
          statut = "prudence"; raison = "Possible dès 65 % de polyester, mais l'article n'en a que " + pct + " % : le rendu est moins vif, fais un essai.";
        }
      }
      return { id: me.id, nom: NOMS[me.id], statut: statut, raison: raison, reglages: me.reglages || [], attention: me.attention || [],
               types: me.types || [], source: me.source || "", pdf: m.pdf, page: m.pages[me.id] || 1, matiere: m };
    });
  }

  // Applicables d'abord, puis avec précautions, puis non applicables (l'ordre DTF, sublimation, vinyle, laser est gardé dans chaque groupe)
  function trier(liste) {
    return liste.map(function (x, i) { return { x: x, i: i }; })
      .sort(function (a, b) { return RANG[a.x.statut] - RANG[b.x.statut] || a.i - b.i; })
      .map(function (o) { return o.x; });
  }

  /* ---------- affichage ---------- */
  function badge(statut) { return '<span class="g-badge g-' + statut + '"><span aria-hidden="true">' + ICONE[statut] + "</span> " + MOTS[statut] + "</span>"; }

  function reglagesHtml(reglages) {
    if (!reglages.length) return "";
    return '<dl class="g-reg">' + reglages.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>";
  }

  function typesHtml(types, id) {
    if (!types.length) return "";
    var bons = types.filter(function (t) { return t.statut !== "non"; }), ecartes = types.filter(function (t) { return t.statut === "non"; });
    function li(t) {
      var reg = {}; t.reglages.forEach(function (r) { reg[r[0]] = r[1]; });
      var detail = id === "vinyle" && t.statut !== "non" && reg["Température"] && reg["Température"] !== "aucune"
        ? '<span class="g-t-reg">' + esc(reg["Température"] + ", " + reg["Durée"] + ", pression " + reg["Pression"]) + "</span>" : "";
      return '<li class="g-t g-t-' + t.statut + '">' + badge(t.statut) + " <b>" + esc(t.nom) + "</b>" + detail + (t.note ? '<span class="g-t-note">' + esc(t.note) + "</span>" : "") + "</li>";
    }
    return '<ul class="g-types">' + bons.map(li).join("") + "</ul>" +
      (ecartes.length ? '<details class="g-ecartes"><summary>' + (ecartes.length > 1 ? ecartes.length + " types écartés" : "1 type écarté") + "</summary><ul class=\"g-types\">" + ecartes.map(li).join("") + "</ul></details>" : "");
  }

  function carteHtml(r) {
    var non = r.statut === "non";
    return '<article class="g-card g-c-' + r.statut + '"><header><h4>' + esc(r.nom) + "</h4>" + badge(r.statut) + "</header>" +
      "<p>" + esc(r.raison) + "</p>" +
      (non ? "" : reglagesHtml(r.reglages) + typesHtml(r.types, r.id) +
        (r.attention.length ? '<ul class="g-att">' + r.attention.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" : "") +
        (r.source ? '<p class="g-src">Source : ' + esc(r.source) + "</p>" : "") +
        '<a class="g-page" href="' + esc(r.pdf) + "#page=" + r.page + '" target="_blank" rel="noopener">Ouvrir la page ' + r.page + " de la fiche PDF</a>") +
      "</article>";
  }

  // Résultat complet pour un choix : { matiere, couleur ("clair"|"fonce"), couleurNom, prod }
  function resultatHtml(c) {
    var m = matiere(c.matiere);
    if (!m) return '<p class="g-vide">Aucune fiche pour cet article : ajoute-le dans outils/fiches_donnees.py puis relance outils/fiches-pdf.py.</p>';
    var liste = trier(methodesPour(c.matiere, c.couleur, c.prod));
    var utiles = liste.filter(function (r) { return r.statut !== "non"; }).length;
    return '<div class="g-head"><div><h3>' + esc(m.nom) + '</h3><p class="muted">' + esc(c.couleur === "clair" ? "Couleur claire" : "Couleur foncée") + (c.couleurNom ? " (" + esc(c.couleurNom) + ")" : "") + " · " +
      utiles + (utiles > 1 ? " méthodes possibles" : " méthode possible") + "</p></div>" +
      '<a class="btn btn-quiet" href="' + esc(m.pdf) + '" target="_blank" rel="noopener">Ouvrir la fiche PDF complète</a></div>' +
      '<p class="g-resume">' + esc(m.resume) + '</p><p class="g-compo muted">Matière : ' + esc(m.compo) + "</p>" +
      '<div class="g-grid">' + liste.map(carteHtml).join("") + "</div>" +
      '<p class="hint">Toujours un essai sur une chute du même tissu avant la série. Réglages DTF et sublimation : ' + esc((window.PRIX && window.PRIX.fournisseur && window.PRIX.fournisseur.nom) || "DTF Print") +
      ". Vinyles : fiches des fabricants. Un réglage « à valider » n'a pas de source : l'essai le confirme.</p>";
  }

  function options(liste, sel) { return liste.map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === sel ? " selected" : "") + ">" + esc(o.t) + "</option>"; }).join(""); }

  function produitsOptions() {
    var cats = (window.DATA && window.DATA.categories) || [], prods = (window.DATA && window.DATA.produits) || [], out = "";
    cats.forEach(function (cat) {
      var l = prods.filter(function (p) { return p.tags && p.tags.categories && p.tags.categories[0] === cat.id; });
      if (l.length) out += '<optgroup label="' + esc(cat.label) + '">' + l.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nom) + "</option>"; }).join("") + "</optgroup>";
    });
    return out;
  }

  function matieresOptions(sel) {
    return ["textile", "rigide"].map(function (g) {
      return '<optgroup label="' + (g === "textile" ? "Textiles" : "Supports rigides") + '">' +
        options(D.matieres.filter(function (m) { return m.groupe === g; }).map(function (m) { return { v: m.id, t: m.nom }; }), sel) + "</optgroup>";
    }).join("");
  }

  // Le guide, à poser dans la vue Fabrication. opts.pieces : les pièces de la commande chargée (raccourcis), facultatif.
  function guideHtml(opts) {
    var pieces = (opts && opts.pieces) || [];
    return '<section class="a-block guide no-print" id="guide-methodes" aria-labelledby="g-titre"><h2 id="g-titre">Guide des méthodes</h2>' +
      "<p class=\"lead-s\">Choisis un article du catalogue, ou une matière, et sa couleur : le guide liste toutes les méthodes possibles (DTF, sublimation, vinyle, gravure laser) avec leurs réglages, et ouvre la bonne page de la fiche PDF à imprimer.</p>" +
      '<div class="g-mode" role="group" aria-label="Choisir par"><button type="button" class="chip" data-g-mode="produit" aria-pressed="true">Par article</button>' +
      '<button type="button" class="chip" data-g-mode="matiere" aria-pressed="false">Par matière</button></div>' +
      (pieces.length ? '<div class="g-pieces"><span class="muted">Pièces de la commande :</span> ' + pieces.map(function (p, i) {
        return '<button type="button" class="chip" data-g-piece="' + i + '">' + esc(p.libelle) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="g-form"><div class="g-f-produit">' +
      '<label>Article<select id="g-prod">' + produitsOptions() + "</select></label>" +
      '<label>Couleur<select id="g-col"></select></label>' +
      '<label id="g-matA-l" hidden>Matière du vêtement apporté<select id="g-matA">' + matieresOptions(APPORTE_DEFAUT) + "</select></label></div>" +
      '<div class="g-f-matiere" hidden><label>Matière ou composition<select id="g-mat">' + matieresOptions("coton-100") + "</select></label>" +
      '<label>Couleur<select id="g-clr"><option value="clair">Blanche ou très claire</option><option value="fonce">Foncée ou colorée</option></select></label></div></div>' +
      '<div id="g-out" class="g-out" aria-live="polite"></div></section>';
  }

  // Branche le guide (après l'avoir posé dans la page). opts.pieces : [{ libelle, produitId, couleurId, matiere }]
  function lier(racine, opts) {
    var pieces = (opts && opts.pieces) || [], prods = (window.DATA && window.DATA.produits) || [];
    var $ = function (s) { return racine.querySelector(s); };
    var G = { mode: "produit" };
    function prodDe(id) { for (var i = 0; i < prods.length; i++) if (prods[i].id === id) return prods[i]; return null; }
    function majCouleurs(couleurId) {
      var p = prodDe($("#g-prod").value);
      $("#g-col").innerHTML = options((p ? p.couleurs : []).map(function (c) { return { v: c.id, t: c.nom + (c.clair ? " (claire)" : "") }; }), couleurId);
      $("#g-matA-l").hidden = !(p && p.apporte);
    }
    function rendre() {
      var c;
      if (G.mode === "produit") {
        var p = prodDe($("#g-prod").value), col = p ? p.couleurs.filter(function (x) { return x.id === $("#g-col").value; })[0] : null;
        c = { matiere: matiereDuProduit(p, $("#g-matA").value), couleur: col && col.clair ? "clair" : "fonce", couleurNom: col ? col.nom : "", prod: p };
      } else {
        c = { matiere: $("#g-mat").value, couleur: $("#g-clr").value, couleurNom: "", prod: null };
      }
      $("#g-out").innerHTML = resultatHtml(c);
    }
    function mode(m) {
      G.mode = m;
      Array.prototype.forEach.call(racine.querySelectorAll("[data-g-mode]"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-g-mode") === m)); });
      $(".g-f-produit").hidden = m !== "produit"; $(".g-f-matiere").hidden = m !== "matiere";
      rendre();
    }
    Array.prototype.forEach.call(racine.querySelectorAll("[data-g-mode]"), function (b) { b.addEventListener("click", function () { mode(b.getAttribute("data-g-mode")); }); });
    $("#g-prod").addEventListener("change", function () { majCouleurs(); rendre(); });
    ["#g-col", "#g-matA", "#g-mat", "#g-clr"].forEach(function (s) { $(s).addEventListener("change", rendre); });
    Array.prototype.forEach.call(racine.querySelectorAll("[data-g-piece]"), function (b) {
      b.addEventListener("click", function () {
        var p = pieces[Number(b.getAttribute("data-g-piece"))];
        if (!p) return;
        $("#g-prod").value = p.produitId; majCouleurs(p.couleurId);
        if (p.matiere) $("#g-matA").value = matiereApportee(p.matiere);
        mode("produit");
        $("#g-out").scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
    var premier = $("#g-prod").options[0];
    if (premier) $("#g-prod").value = premier.value;
    majCouleurs();
    rendre();
  }

  window.Methodes = { data: D, matiere: matiere, matiereDuProduit: matiereDuProduit, matiereApportee: matiereApportee, methodesPour: methodesPour, trier: trier,
                      guideHtml: guideHtml, lier: lier, resultatHtml: resultatHtml };
  if (typeof module !== "undefined" && module.exports) module.exports = window.Methodes;
})();
