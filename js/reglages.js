/*
 * RÉGLAGES MODIFIABLES DANS EXCEL (version 7.2.0)
 *
 * Les prix, les marges et le catalogue peuvent être changés sans toucher au code : cinq fichiers CSV dans le dossier « donnees »
 * (articles, couleurs, prix, planches, vendeurs). On les ouvre dans Excel, on les enregistre au format CSV, puis on les remplace
 * dans le dépôt GitHub. Au chargement, ce fichier lit ces CSV et remplace les valeurs de prix.js et data.js.
 *
 * - Un fichier absent ou illisible est ignoré : le site garde les valeurs écrites dans prix.js et data.js.
 * - Une ligne invalide est ignorée et signalée (page « Catalogue et prix » de l'atelier, window.REGLAGES.erreurs).
 * - Une valeur laissée vide ne change rien, sauf mention contraire (marge, prix fixe et prix d'achat d'une couleur : vide = pas de réglage propre).
 * - Un article absent du CSV garde ses valeurs : pour le retirer de la vitrine, on met « non » dans la colonne visible.
 * - Pour ajouter un article : une nouvelle ligne avec un nouvel identifiant et la colonne copie_de (l'article dont on reprend
 *   le dessin, les emplacements, les couleurs et les photos).
 *
 * Fonctionne aussi sous Node (tests) : Reglages.appliquer(fichiers, PRIX, DATA) et Reglages.exporter(PRIX, DATA).
 */
(function (root) {
  "use strict";

  /* ---------- lecture et écriture du CSV ---------- */
  function sansAccent(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function cle(s) { return sansAccent(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }

  // Texte CSV -> tableau d'objets (clés = en-têtes normalisés). Séparateur détecté (; , ou tabulation), guillemets doublés gérés.
  function lireCSV(texte) {
    texte = String(texte == null ? "" : texte).replace(/^﻿/, "");
    var premiere = texte.split(/\r?\n/)[0] || "";
    var sep = ";", n = 0;
    [";", ",", "\t"].forEach(function (c) { var k = premiere.split(c).length; if (k > n) { n = k; sep = c; } });
    var rows = [], row = [], cell = "", q = false, i, c;
    for (i = 0; i < texte.length; i++) {
      c = texte.charAt(i);
      if (q) {
        if (c === '"') { if (texte.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && texte.charAt(i + 1) === "\n") i++;
        row.push(cell); cell = ""; rows.push(row); row = [];
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ""; }); });
    if (!rows.length) return [];
    var tetes = rows[0].map(cle);
    return rows.slice(1).map(function (r, k) {
      var o = { _ligne: k + 2 };
      tetes.forEach(function (t, j) { if (t) o[t] = (r[j] == null ? "" : String(r[j])).trim(); });
      return o;
    }).filter(function (o) { return String(o[tetes[0]] || "").charAt(0) !== "#"; });   // une ligne dont la 1re cellule commence par # est un commentaire
  }

  function fmtNb(x) { return String(x).replace(".", ","); }
  function celluleCSV(v) {
    var s = v == null ? "" : typeof v === "number" ? fmtNb(v) : String(v);
    return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function ecrireCSV(tetes, lignes) {
    var out = [tetes.join(";")];
    lignes.forEach(function (l) { out.push(l.map(celluleCSV).join(";")); });
    return "﻿" + out.join("\r\n") + "\r\n";
  }

  /* ---------- conversions ---------- */
  // "5,50", "5.50", "5,50 €" -> 5.5 ; NaN si ce n'est pas un nombre
  function nombre(s) {
    var t = String(s == null ? "" : s).replace(/ |\s|€/g, "").replace(",", ".");
    if (t === "" || !/^-?\d+(\.\d+)?$/.test(t)) return NaN;
    return parseFloat(t);
  }
  function pourcent(s) {   // "20 %", "20", "0,2" -> 0.2
    var t = String(s || ""), pc = t.indexOf("%") >= 0, x = nombre(t.replace("%", ""));
    if (isNaN(x)) return NaN;
    return pc || x > 1 ? x / 100 : x;
  }
  function oui(s) {   // true / false / null (vide ou inconnu)
    var t = cle(s);
    if (["oui", "o", "vrai", "true", "1", "x", "yes"].indexOf(t) >= 0) return true;
    if (["non", "n", "faux", "false", "0", "no"].indexOf(t) >= 0) return false;
    return null;
  }
  function liste(s) { return String(s || "").split(/[|\n]/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function copie(o) { return JSON.parse(JSON.stringify(o)); }
  function egal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function majSi(o, k, v) { if (!egal(o[k], v)) o[k] = v; }

  /* ---------- exemple de contenu : les en-têtes de chaque fichier ---------- */
  var TETES = {
    articles: ["id", "nom", "nom_court", "visible", "prix_achat", "marge", "prix_fixe", "tailles", "categories", "technique_par_defaut", "sublimation", "lien", "copie_de"],
    couleurs: ["article", "couleur", "nom", "hex", "prix_achat", "visible", "rupture", "lien", "nom_decathlon", "ref", "clair"],
    prix: ["reglage", "valeur", "explication"],
    planches: ["type", "format", "nom", "largeur_cm", "hauteur_cm", "prix_ttc"],
    vendeurs: ["id", "nom", "plateforme", "frais", "delai", "lien", "note"]
  };
  var FICHIERS = { articles: "donnees/articles.csv", couleurs: "donnees/couleurs.csv", prix: "donnees/prix.csv", planches: "donnees/planches.csv", vendeurs: "donnees/vendeurs.csv" };

  // Réglages de prix : clé du CSV -> où ça se trouve dans PRIX, type, explication
  var REGLAGES = [
    { k: "marge_piece", get: function (P) { return P.regles.margePiece; }, set: function (P, v) { P.regles.margePiece = v; }, t: "eur", min: 0, aide: "Marge ajoutée à chaque pièce qui porte au moins un motif (€)" },
    { k: "arrondi_pas", get: function (P) { return P.regles.pas; }, set: function (P, v) { P.regles.pas = v; }, t: "eur", min: 0.01, aide: "Le prix de vente est arrondi au multiple supérieur de ce pas (2 = prix pairs)" },
    { k: "apporte_seuil", get: function (P) { return P.regles.apporte.seuil; }, set: function (P, v) { P.regles.apporte.seuil = v; }, t: "entier", min: 0, aide: "Vêtements apportés par le client : la remise joue au-delà de ce nombre de pièces" },
    { k: "apporte_facteur", get: function (P) { return P.regles.apporte.facteur; }, set: function (P, v) { P.regles.apporte.facteur = v; }, t: "nb", min: 0, aide: "Facteur appliqué à la marge des vêtements apportés au-delà du seuil (1 = pas de remise, 0,5 = marge divisée par 2)" },
    { k: "tva", get: function (P) { return P.tva; }, set: function (P, v) { P.tva = v; }, t: "pct", aide: "TVA (20 % ou 0,2). Ajoutée seulement si les prix de planches sont hors taxes" },
    { k: "planches_prix_hors_taxes", get: function (P) { return P.prixPlanchesHT; }, set: function (P, v) { P.prixPlanchesHT = v; }, t: "bool", aide: "oui si les prix de planches de planches.csv sont hors taxes, non s'ils sont TTC" },
    { k: "livraison_offerte_des", get: function (P) { return P.livraison.seuilGratuit; }, set: function (P, v) { P.livraison.seuilGratuit = v; }, t: "eur", min: 0, aide: "Livraison des planches offerte à partir de ce montant TTC de transferts (€)" },
    { k: "livraison_planches", get: function (P) { return P.livraison.colissimo; }, set: function (P, v) { P.livraison.colissimo = v; }, t: "eur", min: 0, aide: "Frais de livraison des planches sous ce seuil (€, estimation)" },
    { k: "livraison_vendeur_defaut", get: function (P) { return P.livraisonVendeur.defaut; }, set: function (P, v) { P.livraisonVendeur.defaut = v; }, t: "eur", min: 0, aide: "Frais de port d'un vendeur absent de vendeurs.csv (€)" },
    { k: "vinyle_cout_cm2", get: function (P) { return P.vinyle.coutCm2; }, set: function (P, v) { P.vinyle.coutCm2 = v; }, t: "nb", min: 0, aide: "Prix du vinyle thermocollant au cm² (€)" },
    { k: "vinyle_chute", get: function (P) { return P.vinyle.chute; }, set: function (P, v) { P.vinyle.chute = v; }, t: "nb", min: 1, aide: "Coefficient de chute de découpe du vinyle (1,3 = 30 % de plus que le motif)" },
    { k: "ecart_motifs", get: function (P) { return P.placement.ecart; }, set: function (P, v) { P.placement.ecart = v; }, t: "nb", min: 0, aide: "Écart de coupe entre deux motifs sur une planche (cm)" },
    { k: "ecart_bloc", get: function (P) { return P.placement.ecartBloc; }, set: function (P, v) { P.placement.ecartBloc = v; }, t: "nb", min: 0, aide: "Écart entre visuel, prénom et numéro d'un bloc collé (cm)" }
  ];

  /* ---------- export : l'état courant -> 5 textes CSV ---------- */
  function exporter(PRIX, DATA) {
    var out = {};
    var tech = function (p) { return p.technique === "gravure" ? "gravure" : p.techniqueDefaut === "vinyle" ? "vinyle" : "dtf"; };
    out.articles = ecrireCSV(TETES.articles, DATA.produits.map(function (p) {
      return [p.id, p.nom, p.nomCourt || "", p.masque ? "non" : "oui", p.prixAchat, p.marge != null ? p.marge : "", p.prixFixe != null ? p.prixFixe : "",
        (p.tailles || []).join(" | "), ((p.tags && p.tags.categories) || []).join(" | "), tech(p), p.sublimation === false ? "non" : "oui", p.lien || "", ""];
    }));
    var lc = [];
    DATA.produits.forEach(function (p) {
      (p.couleurs || []).forEach(function (c) {
        lc.push([p.id, c.id, c.nom, c.hex, c.prixAchat != null ? c.prixAchat : "", c.masque ? "non" : "oui", c.rupture || "", c.lien || "", c.nomDec || "", c.ref || "", c.clair ? "oui" : "non"]);
      });
    });
    out.couleurs = ecrireCSV(TETES.couleurs, lc);
    out.prix = ecrireCSV(TETES.prix, REGLAGES.map(function (r) {
      var v = r.get(PRIX);
      return [r.k, r.t === "bool" ? (v ? "oui" : "non") : r.t === "pct" ? fmtNb(Math.round(v * 10000) / 100) + " %" : v, r.aide];
    }));
    var lp = [];
    Object.keys(PRIX.planches).forEach(function (t) {
      PRIX.planches[t].formats.forEach(function (f) { lp.push([t, f.id, f.nom, f.w, f.h, f.prix]); });
    });
    out.planches = ecrireCSV(TETES.planches, lp);
    var lv = [], vs = PRIX.livraisonVendeur.vendeurs;
    Object.keys(vs).forEach(function (id) { var v = vs[id]; lv.push([id, v.nom, v.plateforme || "", v.frais, v.delai || "", v.lien || "", v.note || ""]); });
    out.vendeurs = ecrireCSV(TETES.vendeurs, lv);
    return out;
  }

  /* ---------- application : 5 textes CSV -> PRIX et DATA ---------- */
  function appliquer(fichiers, PRIX, DATA) {
    var rap = { charges: [], absents: [], erreurs: [], avertissements: [], articlesAjoutes: [] };
    function err(f, l, msg) { rap.erreurs.push(FICHIERS[f] + (l ? ", ligne " + l : "") + " : " + msg); }
    function warn(f, l, msg) { rap.avertissements.push(FICHIERS[f] + (l ? ", ligne " + l : "") + " : " + msg); }
    function lignes(f) {
      var t = fichiers && fichiers[f];
      if (t == null) { rap.absents.push(f); return null; }
      try { var r = lireCSV(t); rap.charges.push(f); return r; } catch (e) { err(f, 0, "fichier illisible (" + e.message + ")"); return null; }
    }
    function nb(f, l, champ, v, min) {   // nombre validé ; undefined si la cellule est vide ; NaN (et une erreur signalée) si elle est invalide
      if (String(v || "").trim() === "") return undefined;
      var x = nombre(v);
      if (isNaN(x)) { err(f, l, champ + " : « " + v + " » n'est pas un nombre"); return NaN; }
      if (min != null && x < min) { err(f, l, champ + " : " + x + " est trop petit (minimum " + min + ")"); return NaN; }
      return x;
    }
    function mauvais(x) { return x !== undefined && isNaN(x); }
    function produitDe(id) { return DATA.produits.filter(function (p) { return p.id === id; })[0]; }

    /* --- prix.csv --- */
    var lPrix = lignes("prix");
    if (lPrix) lPrix.forEach(function (l) {
      var k = cle(l.reglage || ""), r = REGLAGES.filter(function (x) { return x.k === k; })[0];
      if (!k) return;
      if (!r) { warn("prix", l._ligne, "réglage inconnu « " + l.reglage + " », ignoré"); return; }
      if (String(l.valeur || "").trim() === "") return;
      var v;
      if (r.t === "bool") { v = oui(l.valeur); if (v == null) { err("prix", l._ligne, k + " : réponds oui ou non"); return; } }
      else if (r.t === "pct") { v = pourcent(l.valeur); if (isNaN(v) || v < 0 || v > 1) { err("prix", l._ligne, k + " : « " + l.valeur + " » n'est pas un pourcentage valable"); return; } }
      else {
        v = nb("prix", l._ligne, k, l.valeur, r.min); if (v === undefined || isNaN(v)) return;
        if (r.t === "entier" && Math.floor(v) !== v) { err("prix", l._ligne, k + " : nombre entier attendu"); return; }
      }
      if (r.get(PRIX) !== v) r.set(PRIX, v);
    });

    /* --- planches.csv --- */
    var lPl = lignes("planches");
    if (lPl) lPl.forEach(function (l) {
      var t = cle(l.type || ""), fam = PRIX.planches[t];
      if (!fam) { err("planches", l._ligne, "type « " + l.type + " » inconnu (dtf ou sublimation)"); return; }
      var id = String(l.format || "").trim(); if (!id) return;
      var f = fam.formats.filter(function (x) { return x.id === id; })[0];
      var prix = nb("planches", l._ligne, "prix_ttc", l.prix_ttc, 0), w = nb("planches", l._ligne, "largeur_cm", l.largeur_cm, 1), h = nb("planches", l._ligne, "hauteur_cm", l.hauteur_cm, 1);
      if (mauvais(prix) || mauvais(w) || mauvais(h)) return;
      if (!f) {
        if (prix === undefined || w === undefined || h === undefined || !l.nom) { err("planches", l._ligne, "nouveau format « " + id + " » : nom, largeur, hauteur et prix sont obligatoires"); return; }
        fam.formats.push({ id: id, nom: l.nom, w: w, h: h, prix: prix });
        fam.formats.sort(function (a, b) { return a.w * a.h - b.w * b.h; });
        return;
      }
      if (prix !== undefined) majSi(f, "prix", prix);
      if (w !== undefined) majSi(f, "w", w);
      if (h !== undefined) majSi(f, "h", h);
      if (l.nom) majSi(f, "nom", l.nom);
    });

    /* --- vendeurs.csv --- */
    var lV = lignes("vendeurs");
    if (lV) lV.forEach(function (l) {
      var id = cle(l.id || "").replace(/_/g, "-"); if (!id) return;
      var vs = PRIX.livraisonVendeur.vendeurs, v = vs[String(l.id).trim()] || vs[id];
      var frais = nb("vendeurs", l._ligne, "frais", l.frais, 0);
      if (mauvais(frais)) return;
      if (!v) {
        if (!l.nom || frais === undefined) { err("vendeurs", l._ligne, "nouveau vendeur « " + l.id + " » : nom et frais obligatoires"); return; }
        v = vs[String(l.id).trim()] = { nom: l.nom, frais: frais, delai: "", lien: "" };
      }
      if (frais !== undefined) majSi(v, "frais", frais);
      ["nom", "delai", "lien", "note", "plateforme"].forEach(function (c) {
        if (!(c in l)) return;
        if (l[c] !== "") majSi(v, c, l[c]);
        else if (c !== "nom" && v[c]) delete v[c];   // cellule vidée = réglage retiré
      });
    });

    /* --- articles.csv --- */
    var catIds = DATA.categories.map(function (c) { return c.id; });
    var lA = lignes("articles");
    if (lA) lA.forEach(function (l) {
      var id = String(l.id || "").trim(); if (!id) return;
      var p = produitDe(id);
      if (!p) {
        if (!/^[a-z0-9-]+$/.test(id)) { err("articles", l._ligne, "identifiant « " + id + " » : lettres minuscules, chiffres et tirets seulement"); return; }
        var modele = produitDe(String(l.copie_de || "").trim());
        if (!modele) { err("articles", l._ligne, "article « " + id + " » inconnu : pour le créer, remplis copie_de avec l'identifiant d'un article existant"); return; }
        if (!l.nom) { err("articles", l._ligne, "nouvel article « " + id + " » : le nom est obligatoire"); return; }
        if (String(l.prix_achat || "").trim() === "") { err("articles", l._ligne, "nouvel article « " + id + " » : le prix d'achat est obligatoire"); return; }
        p = copie(modele); p.id = id; delete p.anciensId; delete p.masque; delete p.marge; delete p.prixFixe;
        p.nom = l.nom; p.nomCourt = l.nom_court || l.nom;
        DATA.produits.splice(DATA.produits.indexOf(modele) + 1, 0, p);
        rap.articlesAjoutes.push(id);
        warn("articles", l._ligne, "article « " + id + " » créé d'après « " + modele.id + " » (mêmes dessin, emplacements, photos et couleurs : modifie couleurs.csv pour les adapter)");
      }
      var x;
      if (l.nom) majSi(p, "nom", l.nom);
      if (l.nom_court) majSi(p, "nomCourt", l.nom_court);
      x = oui(l.visible); if (String(l.visible || "").trim() !== "" && x == null) err("articles", l._ligne, "visible : réponds oui ou non");
      else if (x === false) { if (!p.masque) p.masque = true; } else if (x === true && p.masque) delete p.masque;
      x = nb("articles", l._ligne, "prix_achat", l.prix_achat, 0); if (x !== undefined && !isNaN(x)) majSi(p, "prixAchat", x);
      // marge et prix fixe : cellule vide = pas de réglage propre à cet article (on revient à la règle générale)
      x = nb("articles", l._ligne, "marge", l.marge, 0);
      if (x === undefined) { if (p.marge != null) delete p.marge; } else if (!isNaN(x)) majSi(p, "marge", x);
      x = nb("articles", l._ligne, "prix_fixe", l.prix_fixe, 0.01);
      if (x === undefined) { if (p.prixFixe != null) delete p.prixFixe; } else if (!isNaN(x)) majSi(p, "prixFixe", x);
      if (String(l.tailles || "").trim() !== "") {
        var tl = liste(l.tailles); if (tl.length) majSi(p, "tailles", tl);
      }
      if (String(l.categories || "").trim() !== "") {
        var cs = liste(l.categories), mauvaises = cs.filter(function (c) { return catIds.indexOf(c) < 0; });
        if (mauvaises.length) err("articles", l._ligne, "catégorie inconnue : " + mauvaises.join(", ") + " (possibles : " + catIds.join(", ") + ")");
        else { p.tags = p.tags || {}; majSi(p.tags, "categories", cs); }
      }
      var tc = cle(l.technique_par_defaut || "");
      if (tc) {
        if (p.technique === "gravure") { if (tc !== "gravure") warn("articles", l._ligne, id + " est gravé au laser : technique_par_defaut ignoré"); }
        else if (tc === "vinyle") { if (p.techniqueDefaut !== "vinyle") p.techniqueDefaut = "vinyle"; }
        else if (tc === "dtf") { if (p.techniqueDefaut) delete p.techniqueDefaut; }
        else err("articles", l._ligne, "technique_par_defaut : dtf ou vinyle");
      }
      x = oui(l.sublimation); if (String(l.sublimation || "").trim() !== "" && x == null) err("articles", l._ligne, "sublimation : réponds oui ou non");
      else if (x === false) { if (p.sublimation !== false) p.sublimation = false; } else if (x === true && p.sublimation === false) delete p.sublimation;
      if (l.lien) majSi(p, "lien", l.lien);
    });

    /* --- couleurs.csv (après les articles, pour les nouveaux articles) --- */
    var lC = lignes("couleurs");
    if (lC) lC.forEach(function (l) {
      var pid = String(l.article || "").trim(), cid = String(l.couleur || "").trim(); if (!pid && !cid) return;
      var p = produitDe(pid);
      if (!p) { err("couleurs", l._ligne, "article « " + pid + " » inconnu"); return; }
      var c = p.couleurs.filter(function (z) { return z.id === cid; })[0];
      if (!c) {
        if (!/^[a-z0-9-]+$/.test(cid) || !l.nom || !/^#[0-9a-fA-F]{6}$/.test(l.hex || "")) { err("couleurs", l._ligne, "nouvelle couleur « " + cid + " » : identifiant en minuscules, nom et code couleur #rrggbb obligatoires"); return; }
        c = { id: cid, nom: l.nom, hex: l.hex, clair: false, photos: [] };
        p.couleurs.push(c);
        warn("couleurs", l._ligne, "couleur « " + cid + " » ajoutée à " + pid + " sans photo");
      }
      if (l.nom) majSi(c, "nom", l.nom);
      if (l.hex) { if (/^#[0-9a-fA-F]{6}$/.test(l.hex)) majSi(c, "hex", l.hex); else err("couleurs", l._ligne, "hex : code couleur #rrggbb attendu"); }
      var x = nb("couleurs", l._ligne, "prix_achat", l.prix_achat, 0);
      if (x === undefined) { if (c.prixAchat != null) delete c.prixAchat; } else if (!isNaN(x)) majSi(c, "prixAchat", x);
      var v = oui(l.visible);
      if (v === false) { if (!c.masque) c.masque = true; } else if (v === true && c.masque) delete c.masque;
      if ("rupture" in l) { if (/^\d{4}-\d{2}-\d{2}$/.test(l.rupture)) majSi(c, "rupture", l.rupture); else if (l.rupture === "") { if (c.rupture) delete c.rupture; } else err("couleurs", l._ligne, "rupture : date AAAA-MM-JJ attendue"); }
      if (l.lien) majSi(c, "lien", l.lien);
      if (l.nom_decathlon) majSi(c, "nomDec", l.nom_decathlon);
      if (l.ref) majSi(c, "ref", l.ref);
      var cl = oui(l.clair); if (cl != null && !!c.clair !== cl) c.clair = cl;
    });
    // les couleurs masquées sont retirées de la liste (au moins une doit rester)
    DATA.produits.forEach(function (p) {
      if (!p.couleurs.some(function (c) { return c.masque; })) return;
      var reste = p.couleurs.filter(function (c) { return !c.masque; });
      if (!reste.length) { warn("couleurs", 0, p.id + " : toutes les couleurs sont masquées, elles sont gardées"); p.couleurs.forEach(function (c) { delete c.masque; }); return; }
      p.couleurs = reste;
    });
    return rap;
  }

  /* ---------- chargement dans le navigateur ---------- */
  function lire(url) {
    try {
      var x = new XMLHttpRequest();
      x.open("GET", url + "?t=" + Math.floor(Date.now() / 60000), false);   // lecture synchrone : tout le site a besoin des prix dès le départ
      x.send();
      if ((x.status >= 200 && x.status < 300) || (x.status === 0 && x.responseText)) return x.responseText;
    } catch (e) { /* hors ligne, page ouverte depuis un fichier... : on garde les valeurs intégrées */ }
    return null;
  }

  var API = { lireCSV: lireCSV, ecrireCSV: ecrireCSV, appliquer: appliquer, exporter: exporter, FICHIERS: FICHIERS, TETES: TETES, REGLAGES: REGLAGES, nombre: nombre };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.Reglages = API;

  if (typeof XMLHttpRequest !== "undefined" && root.PRIX && root.DATA && !root.REGLAGES_MANUEL) {
    var base = {};
    Object.keys(FICHIERS).forEach(function (f) { base[f] = lire(FICHIERS[f]); });
    root.REGLAGES = appliquer(base, root.PRIX, root.DATA);
    if (root.REGLAGES.erreurs.length && typeof console !== "undefined") console.warn("Réglages CSV : " + root.REGLAGES.erreurs.join(" | "));
  }
})(typeof window !== "undefined" ? window : this);
