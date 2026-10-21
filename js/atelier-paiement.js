/*
 * ATELIER, partie paiement : onglet « Paiement et facture ».
 *   Fiche de paiement : créée après la validation du devis. Les lignes viennent de la commande chargée (et se corrigent),
 *                       avec le total, l'IBAN de l'asso et la référence à mettre dans le virement.
 *   Facture           : créée à la remise des vêtements, une fois le paiement reçu (« facture acquittée »).
 * Les deux sortent en PDF avec le logo, le nom et le prénom de la personne qui les crée, et un nom de fichier du type
 *   2026-10-19_Fiche-paiement_Nom-de-l-asso_FP-2026-001.pdf
 * Les coordonnées de l'asso (IBAN, adresse...) sont dans js/facturation.js (CONFIG).
 */
(function () {
  "use strict";

  var At = window.Atelier, A = At.A, st = At.st, Fa = window.Facturation;
  var esc = At.esc, $ = A.$, $$ = A.$$;
  var CLE_NOM = "fabricam-atelier-createur", CLE_CPT = "fabricam-atelier-compteurs";

  /* ---------- mémoire du navigateur : qui crée, et dernier numéro de chaque série ---------- */
  function lire(k, defaut) { try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : defaut; } catch (e) { return defaut; } }
  function ecrire(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  var D = {
    order: undefined,                    // la commande dont les lignes viennent (pour savoir quand la remplacer)
    type: "fiche",
    createur: lire(CLE_NOM, { prenom: "", nom: "" }),
    client: { asso: "", contact: "", email: "" },
    lignes: [], dateIso: Fa.aujourdhui(), payeLe: "", refFiche: "",
    num: { fiche: "", facture: "" },     // numéro saisi à la main ; vide = numéro proposé
    sansMarge: false,                    // production pour Fabr'Icam : lignes au prix coûtant, sans marge
    erreurs: []
  };

  function ligneVide() { return { designation: "", qty: 1, unit: "" }; }

  function lignesDepuisCommande() {
    var pv = st.res && st.res.prix;
    if (!pv) return [ligneVide()];
    return pv.groupes.map(function (g) {
      return { designation: A.groupName(g), qty: g.n, unit: D.sansMarge ? g.coutMoyen : g.unitaire, cle: "produit:" + g.produitId };
    });
  }

  function coutTotalLignes() {
    var pv = st.res && st.res.prix;
    return pv ? pv.groupes.reduce(function (t, g) { return t + g.coutMoyen * g.n; }, 0) : 0;
  }

  // Quand une autre commande est chargée (ou fermée), le client et les lignes suivent
  function synchroniser() {
    if (D.order === st.order) return;
    D.order = st.order;
    var c = st.contact || {};
    D.client = { asso: c.asso || "", contact: c.nom || "", email: c.email || "" };
    D.lignes = st.order ? lignesDepuisCommande() : [ligneVide()];
    D.refFiche = ""; D.payeLe = ""; D.erreurs = [];
  }

  // Le client a vu des prix à l'écran : si les tarifs ont bougé depuis, on peut revenir à ceux-là
  function prixVusDifferents() {
    var pa = st.prixAffiche, pv = st.res && st.res.prix;
    return !!(pa && pv && pa.parProduit && Math.abs(pa.total - pv.total) > 0.005);
  }
  function appliquerPrixVus() {
    var pa = st.prixAffiche, n = 0;
    D.lignes.forEach(function (l) {
      if (!l.cle) return;
      var m = pa.parProduit.filter(function (x) { return "produit:" + x.produitId === l.cle; })[0];
      if (m && m.unitaire != null) { l.unit = m.unitaire; n++; }
    });
    return n;
  }

  /* ---------- le document, tel qu'il sera fabriqué ---------- */
  function annee() { return Fa.dateValide(D.dateIso) ? Number(D.dateIso.slice(0, 4)) : new Date().getFullYear(); }
  function numeroPropose() { return Fa.prochainNumero(lire(CLE_CPT, {}), D.type, annee()); }
  function numeroActuel() { return (D.num[D.type] || "").trim() || numeroPropose(); }

  function nombre(v) { var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isNaN(n) ? NaN : n; }
  function construire() {
    return {
      type: D.type, numero: numeroActuel(), dateIso: D.dateIso, payeLe: D.payeLe, refFiche: D.refFiche.trim(),
      createur: { prenom: D.createur.prenom.trim(), nom: D.createur.nom.trim() },
      client: { asso: D.client.asso.trim(), contact: D.client.contact.trim(), email: D.client.email.trim() },
      lignes: D.lignes.map(function (l) { return { designation: l.designation, qty: nombre(l.qty), unit: l.unit === "" ? NaN : nombre(l.unit) }; })
    };
  }
  function logoOctets() {
    if (!window.LogoPdf) return null;
    var bin = atob(window.LogoPdf), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function fabriquer() {
    var d = construire(), err = Fa.verifier(d);
    if (err.length) return { err: err };
    try { return { d: d, bytes: Fa.creerPdf(d, logoOctets()) }; }
    catch (e) { return { err: ["Le PDF n'a pas pu être fabriqué (" + ((e && e.message) || "erreur inconnue") + ")."] }; }
  }

  /* ---------- affichage ---------- */
  function champ(id, label, valeur, extra) {
    extra = extra || {};
    return '<label class="pay-f' + (extra.large ? " large" : "") + '">' + esc(label) +
      '<input id="' + id + '" type="' + (extra.type || "text") + '" value="' + esc(valeur) + '"' + (extra.attrs || "") + "></label>";
  }

  function ligneHtml(l, i) {
    return "<tr>" +
      '<td><input type="text" class="pl-des" data-i="' + i + '" value="' + esc(l.designation) + '" placeholder="Ex. : Polo de tennis Essential" aria-label="Désignation de la ligne ' + (i + 1) + '"></td>' +
      '<td class="num" data-l="Quantité"><input type="number" class="pl-qty" data-i="' + i + '" value="' + esc(l.qty) + '" min="1" step="1" inputmode="numeric" aria-label="Quantité de la ligne ' + (i + 1) + '"></td>' +
      '<td class="num" data-l="Prix (€)"><input type="number" class="pl-unit" data-i="' + i + '" value="' + esc(l.unit) + '" min="0" step="0.01" inputmode="decimal" placeholder="0,00" aria-label="Prix unitaire en euros de la ligne ' + (i + 1) + '"></td>' +
      '<td class="num pl-tot" data-l="Total" data-t="' + i + '"></td>' +
      '<td><button type="button" class="btn btn-quiet pl-del" data-i="' + i + '" aria-label="Supprimer la ligne ' + (i + 1) + '" title="Supprimer la ligne">×</button></td></tr>';
  }

  At.views.paiement = function () {
    var app = $("#app");
    synchroniser();
    var fiche = D.type === "fiche", T = Fa.TYPES[D.type], html = "";

    html += '<section class="pay"><div class="h-row"><h1>Paiement et facture</h1></div>' +
      '<p class="lead-s">La <b>fiche de paiement</b> se crée une fois le devis validé : elle donne le montant et l\'IBAN de l\'asso. La <b>facture</b> se crée à la remise des vêtements, quand le paiement est reçu. Les deux sortent en PDF, avec le logo de Fabr\'Icam.</p>' +
      (st.order ? "" : '<p class="warn-line">Aucune commande n\'est chargée : saisis les lignes à la main, ou <a href="#/commande">charge un fichier de commande</a> pour qu\'elles se remplissent toutes seules.</p>');

    html += '<div class="a-block"><h2>Quel document ?</h2><div class="pay-type" role="group" aria-label="Type de document">' +
      '<button type="button" class="chip" data-type="fiche" aria-pressed="' + fiche + '">Fiche de paiement</button>' +
      '<button type="button" class="chip" data-type="facture" aria-pressed="' + !fiche + '">Facture</button></div>' +
      '<div class="pay-grid">' +
      champ("pay-num", "Numéro", D.num[D.type] || numeroPropose(), { attrs: ' autocomplete="off" spellcheck="false"' }) +
      champ("pay-date", fiche ? "Date de la fiche" : "Date de la facture (remise des vêtements)", D.dateIso, { type: "date" }) +
      (fiche ? "" : champ("pay-paye", "Paiement reçu le", D.payeLe, { type: "date" })) +
      (fiche ? "" : champ("pay-ref", "Fiche de paiement associée (facultatif)", D.refFiche, { attrs: ' placeholder="FP-2026-001" autocomplete="off"' })) +
      "</div>" +
      '<p class="hint">Le numéro est proposé d\'après les documents déjà créés <b>dans ce navigateur</b> : un autre ordinateur ne les connaît pas. Vérifie qu\'il n\'existe pas déjà avant de l\'envoyer.</p></div>';

    html += '<div class="a-block"><h2>Qui crée le document ?</h2><div class="pay-grid">' +
      champ("pay-prenom", "Prénom", D.createur.prenom, { attrs: ' autocomplete="given-name"' }) +
      champ("pay-nom", "Nom", D.createur.nom, { attrs: ' autocomplete="family-name"' }) + "</div>" +
      '<p class="hint">Ils figurent sur le document (« Document créé par… »). Ce navigateur s\'en souvient pour la prochaine fois.</p></div>';

    html += '<div class="a-block"><h2>Client</h2><div class="pay-grid">' +
      champ("pay-asso", "Association", D.client.asso, { attrs: ' autocomplete="off"' }) +
      champ("pay-contact", "Contact", D.client.contact, { attrs: ' autocomplete="off"' }) +
      champ("pay-mail", "E-mail", D.client.email, { type: "email", attrs: ' autocomplete="off"' }) + "</div></div>";

    if (st.order) html += '<div class="a-block"><label class="pay-marge"><input type="checkbox" id="pay-sansmarge"' + (D.sansMarge ? " checked" : "") + '> <b>Retirer la marge</b> (production pour Fabr\'Icam : les prix sont au coût réel)</label>' +
      '<p class="hint">' + (D.sansMarge ? "Les lignes sont au prix coûtant" + (st.res && st.res.prix ? " : " + esc(A.fmtEUR(coutTotalLignes())) + " au lieu de " + esc(A.fmtEUR(st.res.prix.total)) + " avec la marge" : "") + "." : "Les lignes incluent la marge de Fabr'Icam.") + "</p></div>";
    html += '<div class="a-block"><div class="h-row"><h2>Lignes</h2><div class="a-actions">' +
      (st.order ? '<button type="button" class="btn btn-quiet" id="pay-refill">Remplir depuis la commande</button>' : "") +
      (prixVusDifferents() ? '<button type="button" class="btn btn-quiet" id="pay-vus" title="Le client a vu ' + esc(A.fmtEUR(st.prixAffiche.total)) + ' au moment de commander">Reprendre les prix vus par le client</button>' : "") +
      '<button type="button" class="btn btn-quiet" id="pay-add">Ajouter une ligne</button></div></div>' +
      '<div class="tablewrap"><table class="tbl pay-tbl"><thead><tr><th>Désignation</th><th class="num">Quantité</th><th class="num">Prix unitaire (€)</th><th class="num">Total</th><th><span class="sr">Supprimer</span></th></tr></thead><tbody>' +
      D.lignes.map(ligneHtml).join("") + '</tbody></table></div>' +
      '<p class="pay-total">Total <b id="pay-total"></b></p>' +
      (prixVusDifferents() ? '<p class="warn-line">Le client a vu un total de ' + esc(A.fmtEUR(st.prixAffiche.total)) + ", et les tarifs actuels donnent " + esc(A.fmtEUR(st.res.prix.total)) + ". Les lignes ci-dessus suivent les tarifs actuels.</p>" : "") +
      "</div>";

    html += '<div class="a-block pay-end"><div id="pay-err" role="alert"></div>' +
      '<p class="pay-file">Nom du fichier : <b id="pay-fichier"></b></p>' +
      '<div class="toolbar"><button type="button" class="btn btn-primary" id="pay-dl">Télécharger ' + (fiche ? "la fiche de paiement" : "la facture") + " (PDF)</button>" +
      '<button type="button" class="btn btn-quiet" id="pay-view">Aperçu</button></div>' +
      (fiche ? '<p class="hint">La fiche indique le titulaire du compte (' + esc(Fa.CONFIG.titulaire) + "), l'IBAN (" + esc(Fa.ibanFormate(Fa.CONFIG.iban)) + ")" + (Fa.CONFIG.bic ? ", le BIC (" + esc(Fa.CONFIG.bic) + ")" : "") + ", le montant et la référence à mettre dans le virement. Le travail commence dès réception du paiement.</p>" :
        '<p class="hint">La facture est marquée « acquittée » : elle indique la date du paiement et que les vêtements sont remis.</p>') +
      "</div></section>";

    app.innerHTML = html;
    maj(); montrerErreurs();
    lier();
  };

  // Totaux, nom du fichier : tout ce qui change quand on tape, sans refaire la page (sinon on perd le curseur)
  function maj() {
    var d = construire();
    $$(".pl-tot").forEach(function (td) { var l = d.lignes[Number(td.dataset.t)]; td.textContent = l && l.qty > 0 && l.unit >= 0 ? Fa.eur(Fa.totalLigne(l)) : "–"; });
    $("#pay-total").textContent = Fa.eur(Fa.total(d.lignes));
    $("#pay-fichier").textContent = Fa.nomFichier(d);
  }
  function montrerErreurs() {
    var box = $("#pay-err"); if (!box) return;
    box.innerHTML = D.erreurs.length ? '<ul class="err">' + D.erreurs.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul>" : "";
  }

  function lier() {
    function suit(id, fn, evt) { var el = $(id); if (el) el.addEventListener(evt || "input", function () { fn(el.value); maj(); }); }
    suit("#pay-prenom", function (v) { D.createur.prenom = v; });
    suit("#pay-nom", function (v) { D.createur.nom = v; });
    suit("#pay-asso", function (v) { D.client.asso = v; });
    suit("#pay-contact", function (v) { D.client.contact = v; });
    suit("#pay-mail", function (v) { D.client.email = v; });
    suit("#pay-num", function (v) { D.num[D.type] = v; });
    suit("#pay-ref", function (v) { D.refFiche = v; });
    suit("#pay-paye", function (v) { D.payeLe = v; });
    // changer la date peut changer l'année du numéro proposé
    var dt = $("#pay-date");
    dt.addEventListener("input", function () { D.dateIso = dt.value; maj(); });
    dt.addEventListener("change", function () { D.dateIso = dt.value; if (!D.num[D.type]) $("#pay-num").value = numeroPropose(); maj(); });

    $$("[data-type]").forEach(function (b) { b.addEventListener("click", function () { D.type = b.dataset.type; D.erreurs = []; At.views.paiement(); }); });
    $$(".pl-des").forEach(function (el) { el.addEventListener("input", function () { D.lignes[Number(el.dataset.i)].designation = el.value; maj(); }); });
    $$(".pl-qty").forEach(function (el) { el.addEventListener("input", function () { D.lignes[Number(el.dataset.i)].qty = el.value; maj(); }); });
    $$(".pl-unit").forEach(function (el) { el.addEventListener("input", function () { D.lignes[Number(el.dataset.i)].unit = el.value; maj(); }); });
    $$(".pl-del").forEach(function (el) {
      el.addEventListener("click", function () { D.lignes.splice(Number(el.dataset.i), 1); if (!D.lignes.length) D.lignes.push(ligneVide()); At.views.paiement(); });
    });
    $("#pay-add").addEventListener("click", function () { D.lignes.push(ligneVide()); At.views.paiement(); var s = $$(".pl-des"); if (s.length) s[s.length - 1].focus(); });
    var sm = $("#pay-sansmarge"); if (sm) sm.addEventListener("change", function () { D.sansMarge = sm.checked; D.lignes = lignesDepuisCommande(); D.erreurs = []; At.views.paiement(); A.toast(D.sansMarge ? "Marge retirée : prix coûtant." : "Marge remise."); });
    var rf = $("#pay-refill"); if (rf) rf.addEventListener("click", function () { D.lignes = lignesDepuisCommande(); D.erreurs = []; At.views.paiement(); A.toast("Lignes remplies d'après la commande."); });
    var pv = $("#pay-vus"); if (pv) pv.addEventListener("click", function () { var n = appliquerPrixVus(); At.views.paiement(); A.toast(n ? "Prix vus par le client repris." : "Aucun prix à reprendre."); });

    $("#pay-dl").addEventListener("click", function () {
      var r = fabriquer(); D.erreurs = r.err || []; montrerErreurs();
      if (r.err) { var box = $("#pay-err"); if (box && box.scrollIntoView) box.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
      ecrire(CLE_NOM, { prenom: r.d.createur.prenom, nom: r.d.createur.nom });
      ecrire(CLE_CPT, Fa.noterNumero(lire(CLE_CPT, {}), r.d.numero));
      D.num[D.type] = "";
      A.download(Fa.nomFichier(r.d), r.bytes, "application/pdf");
      A.toast((D.type === "fiche" ? "Fiche de paiement" : "Facture") + " " + r.d.numero + " téléchargée.");
      $("#pay-num").value = numeroPropose(); maj();
    });
    $("#pay-view").addEventListener("click", function () {
      var r = fabriquer(); D.erreurs = r.err || []; montrerErreurs();
      if (r.err) return;
      var url = URL.createObjectURL(new Blob([r.bytes], { type: "application/pdf" }));
      var w = window.open(url, "_blank");
      if (!w) A.toast("Le navigateur a bloqué l'aperçu : autorise les fenêtres pour ce site, ou télécharge le PDF.");
      setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
    });
  }
})();
