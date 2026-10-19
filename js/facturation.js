/*
 * FACTURATION : fiches de paiement et factures de Fabr'Icam, en PDF (ce fichier tourne aussi dans Node, pour les tests).
 *   - les coordonnées de l'asso (nom du compte, IBAN, adresse) : CONFIG, à modifier ici si elles changent
 *   - les outils : IBAN (contrôle et mise en forme), euros, dates, numéros FP-2026-001 / FAC-2026-001, nom de fichier
 *   - creerPdf : dessine le document (logo, émetteur, client, lignes, total, IBAN ou « payée ») avec js/pdf.js
 *
 * Aucune TVA ni aucun SIRET n'apparaissent sur les documents : Fabr'Icam est une asso, la mention ne s'applique pas.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./pdf.js"));
  else root.Facturation = factory(root.Pdf);
})(typeof self !== "undefined" ? self : this, function (Pdf) {
  "use strict";

  /* ---------- coordonnées de l'asso ---------- */
  var CONFIG = {
    nom: "Fabr'Icam",
    titulaire: "Fablab Icam 26-29",                       // nom du titulaire du compte, tel qu'il doit figurer sur le virement
    adresse: ["75 avenue de Grande-Bretagne", "31300 Toulouse"],
    email: "fabricam.toulouse@icam.fr",
    iban: "FR7617598000010003321323381",
    phrasePaiement: "Le travail commence dès réception du paiement."
  };

  var TYPES = {
    fiche: { prefixe: "FP", titre: "Fiche de paiement", fichier: "Fiche-paiement" },
    facture: { prefixe: "FAC", titre: "Facture", fichier: "Facture" }
  };
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  /* ---------- IBAN ---------- */
  function ibanPropre(s) { return String(s || "").replace(/\s+/g, "").toUpperCase(); }
  // Contrôle de la clé : on déplace les 4 premiers caractères à la fin, on remplace les lettres par des nombres (A = 10), le reste de la division par 97 doit être 1.
  function ibanValide(s) {
    s = ibanPropre(s);
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return false;
    var r = 0, t = s.slice(4) + s.slice(0, 4);
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i), v = /\d/.test(c) ? c : String(c.charCodeAt(0) - 55);
      for (var k = 0; k < v.length; k++) r = (r * 10 + Number(v.charAt(k))) % 97;
    }
    return r === 1;
  }
  function ibanFormate(s) { return ibanPropre(s).replace(/(.{4})/g, "$1 ").trim(); }

  /* ---------- montants et dates ---------- */
  function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  // 1 234,50 € (espaces insécables)
  function eur(x) {
    var n = round2(Math.abs(Number(x) || 0)), s = n.toFixed(2).split("."), ent = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (x < 0 ? "-" : "") + ent + "," + s[1] + " €";
  }
  function dateValide(iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso || "") && !isNaN(new Date(iso + "T12:00:00").getTime()); }
  function dateLongue(iso) { return dateValide(iso) ? Number(iso.slice(8)) + (iso.slice(8) === "01" ? "er " : " ") + MOIS[Number(iso.slice(5, 7)) - 1] + " " + iso.slice(0, 4) : ""; }
  function dateCourte(iso) { return dateValide(iso) ? iso.slice(8) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : ""; }
  function aujourdhui() { var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); }

  /* ---------- lignes ---------- */
  function totalLigne(l) { return round2((Number(l.qty) || 0) * (Number(l.unit) || 0)); }
  function lignesUtiles(lignes) { return (lignes || []).filter(function (l) { return String(l.designation || "").trim() && Number(l.qty) > 0; }); }
  function total(lignes) { return round2(lignesUtiles(lignes).reduce(function (s, l) { return s + totalLigne(l); }, 0)); }

  /* ---------- numéros : FP-2026-001, FAC-2026-001 ---------- */
  function numero(type, annee, n) { return TYPES[type].prefixe + "-" + annee + "-" + ("000" + n).slice(-3); }
  function lireNumero(s) {
    var m = /^(FP|FAC)-(\d{4})-(\d{1,6})$/.exec(String(s || "").trim());
    return m ? { type: m[1] === "FAC" ? "facture" : "fiche", annee: Number(m[2]), n: Number(m[3]) } : null;
  }
  // compteurs : { "fiche-2026": 3, "facture-2026": 1 } = dernier numéro donné
  function cleCompteur(type, annee) { return type + "-" + annee; }
  function prochainNumero(compteurs, type, annee) { return numero(type, annee, ((compteurs || {})[cleCompteur(type, annee)] || 0) + 1); }
  // Retient un numéro utilisé : le compteur ne redescend jamais (un numéro saisi à la main plus grand le fait avancer).
  function noterNumero(compteurs, num) {
    var r = lireNumero(num), c = Object.assign({}, compteurs || {});
    if (r) { var k = cleCompteur(r.type, r.annee); c[k] = Math.max(c[k] || 0, r.n); }
    return c;
  }

  /* ---------- nom de fichier : date, titre, asso, numéro ---------- */
  function nomAsso(s) {
    var t = String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return t || "Asso";
  }
  function nomFichier(d) { return d.dateIso + "_" + TYPES[d.type].fichier + "_" + nomAsso(d.client && d.client.asso) + "_" + d.numero + ".pdf"; }

  /* ---------- vérification avant de créer le document ---------- */
  function verifier(d) {
    var e = [], c = d.client || {}, cr = d.createur || {};
    if (!String(cr.prenom || "").trim() || !String(cr.nom || "").trim()) e.push("Indique ton prénom et ton nom : ils figurent sur le document.");
    if (!String(c.asso || "").trim()) e.push("Indique le nom de l'association.");
    if (!lireNumero(d.numero) || lireNumero(d.numero).type !== d.type) e.push("Le numéro doit ressembler à " + numero(d.type, new Date().getFullYear(), 1) + ".");
    if (!dateValide(d.dateIso)) e.push("La date du document n'est pas valide.");
    if (d.type === "facture" && !dateValide(d.payeLe)) e.push("Indique la date à laquelle le paiement a été reçu.");
    if (!lignesUtiles(d.lignes).length) e.push("Ajoute au moins une ligne avec un nom et une quantité.");
    if (lignesUtiles(d.lignes).some(function (l) { return !(Number(l.unit) >= 0); })) e.push("Un prix unitaire n'est pas un nombre.");
    return e;
  }

  /* ---------- le document ---------- */
  var ORANGE = "#f29100", GRIS = "#6b6b6b", ENCRE = "#262626", FOND = "#f5f5f5", TRAIT = "#d6d6d6";

  // d : { type: "fiche"|"facture", numero, dateIso, createur: {prenom, nom}, client: {asso, contact, email}, lignes: [{designation, qty, unit}],
  //       payeLe (facture), refFiche (facture, facultatif) }
  // logo : octets du PNG RVB du logo. Rend un Uint8Array (le fichier PDF).
  function creerPdf(d, logo, cfg) {
    cfg = cfg || CONFIG;
    var T = TYPES[d.type], c = d.client || {}, lignes = lignesUtiles(d.lignes), tot = total(lignes);
    var doc = Pdf.create({ title: T.titre + " " + d.numero + " – " + (c.asso || ""), author: cfg.nom });
    var im = logo ? doc.addImage("logo", logo) : null;
    var pages = [], W = Pdf.A4.w, H = Pdf.A4.h, M = 42, TW = W - 2 * M;

    function nouvellePage() { var p = doc.page(); pages.push(p); return p; }
    var p = nouvellePage(), y;

    /* en-tête : logo à gauche, titre et numéro à droite */
    var lw = 132, lh = im ? lw * im.h / im.w : 0;
    if (im) p.image("logo", M, 32, lw, lh);
    else p.text(cfg.nom, M, 62, { size: 24, bold: true, color: ORANGE });
    p.text(T.titre.toUpperCase(), W - M, 54, { size: 21, bold: true, color: ENCRE, align: "right" });
    p.text("N° " + d.numero, W - M, 74, { size: 12, bold: true, color: ORANGE, align: "right" });
    p.text("Date : " + dateLongue(d.dateIso), W - M, 90, { size: 10, color: GRIS, align: "right" });
    var yl = Math.max(32 + lh, 96) + 12;
    p.line(M, yl, W - M, yl, { lw: 1.6, color: ORANGE });

    /* émetteur et client */
    y = yl + 28;
    var colX = M + TW / 2 + 16;
    p.text("ÉMIS PAR", M, y, { size: 8, bold: true, color: GRIS });
    p.text("CLIENT", colX, y, { size: 8, bold: true, color: GRIS });
    var ye = y + 17, yc = y + 17;
    p.text(cfg.nom, M, ye, { size: 11.5, bold: true, color: ENCRE }); ye += 15;
    cfg.adresse.forEach(function (l) { p.text(l, M, ye, { size: 10, color: ENCRE }); ye += 13.5; });
    p.text(cfg.email, M, ye, { size: 10, color: ENCRE }); ye += 13.5;
    p.text("Document créé par " + String(d.createur.prenom).trim() + " " + String(d.createur.nom).trim(), M, ye + 3, { size: 9, color: GRIS }); ye += 16;
    yc = p.paragraph(c.asso || "", colX, yc, TW / 2 - 16, { size: 11.5, bold: true, color: ENCRE, leading: 15 });
    if (c.contact) yc = p.paragraph(c.contact, colX, yc, TW / 2 - 16, { size: 10, color: ENCRE, leading: 13.5 });
    if (c.email) yc = p.paragraph(c.email, colX, yc, TW / 2 - 16, { size: 10, color: ENCRE, leading: 13.5 });
    if (d.type === "facture" && d.refFiche) { p.text("Fiche de paiement associée : " + d.refFiche, colX, yc + 3, { size: 9, color: GRIS }); yc += 16; }
    y = Math.max(ye, yc) + 24;

    /* tableau des lignes */
    var X = { des: M + 10, qty: M + 318, pu: M + 408, tot: W - M - 10 }, DES_W = 290;
    function enteteTableau(pg, yy) {
      pg.rect(M, yy, TW, 22, { fill: FOND });
      pg.text("Désignation", X.des, yy + 14.5, { size: 8.5, bold: true, color: GRIS });
      pg.text("Quantité", X.qty, yy + 14.5, { size: 8.5, bold: true, color: GRIS, align: "right" });
      pg.text("Prix unitaire", X.pu, yy + 14.5, { size: 8.5, bold: true, color: GRIS, align: "right" });
      pg.text("Total", X.tot, yy + 14.5, { size: 8.5, bold: true, color: GRIS, align: "right" });
      return yy + 22;
    }
    var BAS = H - 70;                        // au-dessous, c'est le pied de page
    y = enteteTableau(p, y);
    lignes.forEach(function (l) {
      var txt = String(l.designation).trim(), n = Pdf.wrap(txt, 10, false, DES_W).length, rh = n * 13.5 + 10;
      if (y + rh > BAS - 20) { p = nouvellePage(); y = enteteTableau(p, 50); }
      p.paragraph(txt, X.des, y + 15.5, DES_W, { size: 10, color: ENCRE, leading: 13.5 });
      p.text(String(Number(l.qty)).replace(".", ","), X.qty, y + 15.5, { size: 10, color: ENCRE, align: "right" });
      p.text(eur(l.unit), X.pu, y + 15.5, { size: 10, color: ENCRE, align: "right" });
      p.text(eur(totalLigne(l)), X.tot, y + 15.5, { size: 10, bold: true, color: ENCRE, align: "right" });
      y += rh;
      p.line(M, y, W - M, y, { lw: 0.5, color: TRAIT });
    });

    /* total */
    var hTot = 44, hBloc = d.type === "fiche" ? 160 : 100;
    if (y + 16 + hTot + 22 + hBloc > BAS) { p = nouvellePage(); y = 50; } else y += 16;
    var bx = W - M - 230;
    p.rect(bx, y, 230, hTot, { fill: FOND });
    p.rect(bx, y, 4, hTot, { fill: ORANGE });
    p.text(d.type === "fiche" ? "TOTAL À PAYER" : "TOTAL", bx + 16, y + 26.5, { size: 9.5, bold: true, color: GRIS });
    p.text(eur(tot), bx + 218, y + 28, { size: 17, bold: true, color: ENCRE, align: "right" });
    y += hTot + 22;

    /* bloc du bas : comment payer (fiche) ou facture acquittée */
    var ref = (d.numero + (c.asso ? " " + c.asso : "")).trim();
    if (d.type === "fiche") {
      p.rect(M, y, TW, hBloc, { stroke: ORANGE, lw: 1.2 });
      p.text("Comment payer ?", M + 16, y + 24, { size: 12.5, bold: true, color: ENCRE });
      p.text("Par virement bancaire, vers le compte de l'association :", M + 16, y + 40, { size: 10, color: GRIS });
      var rows = [["Titulaire du compte", cfg.titulaire, false], ["IBAN", ibanFormate(cfg.iban), true], ["Montant", eur(tot), true], ["Référence à indiquer", ref, false]], yy = y + 62;
      rows.forEach(function (r) {
        p.text(r[0], M + 16, yy, { size: 9.5, color: GRIS });
        p.paragraph(r[1], M + 150, yy, TW - 166, { size: r[2] ? 12 : 10.5, bold: r[2], color: ENCRE });
        yy += 19;
      });
      p.text(cfg.phrasePaiement, M + 16, y + hBloc - 14, { size: 10, bold: true, color: ORANGE });
    } else {
      p.rect(M, y, TW, hBloc, { stroke: ORANGE, lw: 1.2 });
      p.text("Facture acquittée", M + 16, y + 24, { size: 12.5, bold: true, color: ENCRE });
      p.text("Paiement reçu le " + dateLongue(d.payeLe) + ", par virement : " + eur(tot) + ".", M + 16, y + 44, { size: 10.5, color: ENCRE });
      p.text("Vêtements remis le " + dateLongue(d.dateIso) + ".", M + 16, y + 60, { size: 10.5, color: ENCRE });
      p.text("Reste à payer : " + eur(0), M + 16, y + 80, { size: 10.5, bold: true, color: ENCRE });
      p.text("Merci pour votre confiance.", W - M - 16, y + 80, { size: 10.5, color: GRIS, align: "right" });
    }

    /* pied de page sur chaque page */
    pages.forEach(function (pg, i) {
      pg.line(M, H - 50, W - M, H - 50, { lw: 0.5, color: TRAIT });
      pg.text(cfg.nom + "  ·  " + cfg.adresse.join(", ") + "  ·  " + cfg.email, W / 2, H - 34, { size: 8.5, color: GRIS, align: "center" });
      if (pages.length > 1) pg.text("Page " + (i + 1) + " sur " + pages.length, W - M, H - 20, { size: 8, color: GRIS, align: "right" });
    });
    return doc.output();
  }

  return {
    CONFIG: CONFIG, TYPES: TYPES, ibanValide: ibanValide, ibanFormate: ibanFormate, ibanPropre: ibanPropre, eur: eur, round2: round2,
    dateValide: dateValide, dateLongue: dateLongue, dateCourte: dateCourte, aujourdhui: aujourdhui,
    totalLigne: totalLigne, lignesUtiles: lignesUtiles, total: total,
    numero: numero, lireNumero: lireNumero, prochainNumero: prochainNumero, noterNumero: noterNumero, cleCompteur: cleCompteur,
    nomAsso: nomAsso, nomFichier: nomFichier, verifier: verifier, creerPdf: creerPdf
  };
});
