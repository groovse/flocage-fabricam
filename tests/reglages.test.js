// Tests des réglages modifiables dans Excel : node tests/reglages.test.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const racine = path.join(__dirname, "..");
global.window = {};
const R = require(path.join(racine, "js", "reglages.js"));
require(path.join(racine, "js", "prix.js")); require(path.join(racine, "js", "data.js")); require(path.join(racine, "js", "preview.js"));
const E = require(path.join(racine, "js", "engine.js"));

// valeurs intégrées toutes neuves à chaque appel
function neuf() {
  const w = {};
  ["prix.js", "data.js"].forEach(f => new Function("window", fs.readFileSync(path.join(racine, "js", f), "utf8"))(w));
  return { PRIX: w.PRIX, DATA: w.DATA };
}
const tel = o => JSON.stringify(o);
function ctxDe(x) { const produits = {}; x.DATA.produits.forEach(p => produits[p.id] = p); return { prix: x.PRIX, produits, emplacements: x.DATA.emplacements, measure: E.approxMeasure }; }
const A6 = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" } };
const cmd = (x, pid, n, extra) => E.computeOrder({ pieces: Array.from({ length: n || 1 }, (_, i) => Object.assign({ id: "p" + i, produitId: pid, couleurId: x.DATA.produits.find(p => p.id === pid).couleurs[0].id, taille: "M", prenom: "", numero: "" }, extra || {})), marquages: A6, technique: "dtf" }, ctxDe(x));
const prixUnit = (x, pid) => E.priceTable(x.DATA.produits.find(p => p.id === pid), [1], ctxDe(x))[0].unitaire;
const csv = (tetes, lignes) => [tetes.join(";")].concat(lignes.map(l => l.join(";"))).join("\r\n");
let ok = 0;
function test(nom, fn) { try { fn(); ok++; console.log("  ok  " + nom); } catch (e) { console.log("  ECHEC " + nom + "\n   " + e.message); process.exitCode = 1; } }

console.log("Lecture du CSV");
test("lecture : BOM, point-virgule, guillemets doublés, lignes vides et commentaires", () => {
  const l = R.lireCSV("﻿Id;Nom d'article;Prix\r\n# commentaire;x;y\r\na;\"Maillot; \"\"pro\"\"\";5,5\r\n\r\nb;simple;6\r\n");
  assert.strictEqual(l.length, 2);
  assert.deepStrictEqual([l[0].id, l[0].nom_d_article, l[0].prix], ["a", 'Maillot; "pro"', "5,5"]);
  assert.strictEqual(l[1].prix, "6");
});
test("lecture : séparateur virgule ou tabulation détecté (Excel d'une autre langue)", () => {
  assert.strictEqual(R.lireCSV("id,prix\na,5.5")[0].prix, "5.5");
  assert.strictEqual(R.lireCSV("id\tprix\na\t5,5")[0].prix, "5,5");
});
test("nombres : virgule, point, euro, espaces ; le reste est refusé", () => {
  assert.strictEqual(R.nombre("5,50"), 5.5); assert.strictEqual(R.nombre("5.5"), 5.5); assert.strictEqual(R.nombre(" 12 € "), 12);
  assert.ok(isNaN(R.nombre("abc"))); assert.ok(isNaN(R.nombre("")));
});

console.log("\nFichiers du dépôt");
test("aller-retour : exporter puis appliquer redonne exactement les valeurs intégrées", () => {
  const a = neuf(), f = R.exporter(a.PRIX, a.DATA), b = neuf();
  const rap = R.appliquer(f, b.PRIX, b.DATA);
  assert.deepStrictEqual(rap.erreurs, []); assert.deepStrictEqual(rap.avertissements, []);
  assert.strictEqual(tel(b.PRIX), tel(a.PRIX)); assert.strictEqual(tel(b.DATA), tel(a.DATA));
});
test("les CSV du dépôt (donnees/) se lisent sans erreur : à relancer après chaque modification dans Excel", () => {
  const b = neuf(), fich = {};
  Object.keys(R.FICHIERS).forEach(k => fich[k] = fs.readFileSync(path.join(racine, R.FICHIERS[k]), "utf8"));
  const rap = R.appliquer(fich, b.PRIX, b.DATA);
  assert.deepStrictEqual(rap.erreurs, [], rap.erreurs.join("\n")); assert.strictEqual(rap.charges.length, 5);
  assert.ok(b.DATA.produits.some(p => !p.masque), "au moins un article visible");
  const catalogue = {}; b.DATA.produits.forEach(p => catalogue[p.id] = p);
  b.DATA.produits.filter(p => !p.masque && !p.apporte).forEach(p => {
    const t = E.priceTable(p, [1, 10], { prix: b.PRIX, produits: catalogue, emplacements: b.DATA.emplacements, measure: E.approxMeasure });
    t.forEach(r => assert.ok(r.unitaire > 0, p.id + " : prix non calculable"));
  });
});
test("fichiers absents : on garde les valeurs intégrées", () => {
  const a = neuf(), b = neuf(), rap = R.appliquer({}, b.PRIX, b.DATA);
  assert.strictEqual(rap.absents.length, 5); assert.deepStrictEqual(rap.erreurs, []);
  assert.strictEqual(tel(b.DATA), tel(a.DATA));
});

console.log("\nPrix et marges");
const T = R.TETES;
test("prix.csv : la marge, l'arrondi et le vinyle changent les prix", () => {
  const x = neuf(), avant = prixUnit(x, "polo-essential");
  const rap = R.appliquer({ prix: csv(T.prix, [["marge_piece", "5", ""], ["arrondi_pas", "1", ""], ["vinyle_cout_cm2", "0,01", ""]]) }, x.PRIX, x.DATA);
  assert.deepStrictEqual(rap.erreurs, []);
  assert.strictEqual(x.PRIX.regles.margePiece, 5); assert.strictEqual(x.PRIX.regles.pas, 1); assert.strictEqual(x.PRIX.vinyle.coutCm2, 0.01);
  const r = cmd(x, "polo-essential", 1);
  assert.strictEqual(r.prix.groupes[0].unitaire, Math.ceil((r.prix.groupes[0].coutMoyen + 5) - 1e-9));
  assert.notStrictEqual(prixUnit(x, "polo-essential"), avant);
});
test("prix.csv : TVA en pourcentage, oui/non, réglage inconnu et valeur fausse signalés", () => {
  const x = neuf();
  const rap = R.appliquer({ prix: csv(T.prix, [["tva", "10 %", ""], ["planches_prix_hors_taxes", "oui", ""], ["inconnu", "1", ""], ["marge_piece", "abc", ""], ["arrondi_pas", "0", ""]]) }, x.PRIX, x.DATA);
  assert.strictEqual(x.PRIX.tva, 0.1); assert.strictEqual(x.PRIX.prixPlanchesHT, true);
  assert.strictEqual(x.PRIX.regles.margePiece, 3, "une valeur fausse ne change rien"); assert.strictEqual(x.PRIX.regles.pas, 2);
  assert.strictEqual(rap.erreurs.length, 2); assert.strictEqual(rap.avertissements.length, 1);
});
test("planches.csv et vendeurs.csv : le coût de revient suit", () => {
  const x = neuf(), avant = cmd(x, "polo-essential", 1).couts.planchesTTC;
  R.appliquer({ planches: csv(T.planches, [["dtf", "A4", "", "", "", "11"]]) }, x.PRIX, x.DATA);
  assert.strictEqual(x.PRIX.planches.dtf.formats.find(f => f.id === "A4").prix, 11);
  assert.ok(cmd(x, "polo-essential", 1).couts.planchesTTC > avant);
  const y = neuf();
  R.appliquer({ vendeurs: csv(T.vendeurs, [["pertemba-fr", "", "", "7,5", "", "", ""]]) }, y.PRIX, y.DATA);
  assert.strictEqual(y.PRIX.livraisonVendeur.vendeurs["pertemba-fr"].frais, 7.5);
  const z = neuf();
  const rap = R.appliquer({ planches: csv(T.planches, [["dtf", "A0", "", "", "", "30"], ["autre", "A4", "", "", "", "1"]]), vendeurs: csv(T.vendeurs, [["nouveau", "", "", "5", "", "", ""]]) }, z.PRIX, z.DATA);
  assert.strictEqual(rap.erreurs.length, 3);
});
test("un nouveau format de planche et un nouveau vendeur complets sont ajoutés", () => {
  const x = neuf();
  const rap = R.appliquer({ planches: csv(T.planches, [["dtf", "A5", "A5 (14 × 21 cm)", "14", "21", "3"]]), vendeurs: csv(T.vendeurs, [["mon-vendeur", "Mon vendeur", "", "3,2", "3 jours", "", ""]]) }, x.PRIX, x.DATA);
  assert.deepStrictEqual(rap.erreurs, []);
  assert.ok(x.PRIX.planches.dtf.formats.some(f => f.id === "A5")); assert.strictEqual(x.PRIX.livraisonVendeur.vendeurs["mon-vendeur"].frais, 3.2);
});

console.log("\nCatalogue");
const A = T.articles;
const ligneArt = (o) => A.map(c => o[c] == null ? "" : o[c]);
test("articles.csv : prix d'achat, tailles, nom et visibilité", () => {
  const x = neuf(), avant = prixUnit(x, "polo-essential");
  const rap = R.appliquer({ articles: csv(A, [ligneArt({ id: "polo-essential", nom: "Polo test", prix_achat: "12,5", tailles: "S | M | L", visible: "non" })]) }, x.PRIX, x.DATA);
  const p = x.DATA.produits.find(q => q.id === "polo-essential");
  assert.deepStrictEqual(rap.erreurs, []);
  assert.strictEqual(p.nom, "Polo test"); assert.strictEqual(p.prixAchat, 12.5); assert.deepStrictEqual(p.tailles, ["S", "M", "L"]); assert.strictEqual(p.masque, true);
  assert.ok(prixUnit(x, "polo-essential") > avant);
  R.appliquer({ articles: csv(A, [ligneArt({ id: "polo-essential", visible: "oui", marge: "", prix_fixe: "" })]) }, x.PRIX, x.DATA);
  assert.strictEqual(p.masque, undefined);
});
test("articles.csv : une marge propre à l'article et un prix fixe", () => {
  const x = neuf(), pid = "polo-essential", r0 = cmd(x, pid, 1);
  R.appliquer({ articles: csv(A, [ligneArt({ id: pid, marge: "6" })]) }, x.PRIX, x.DATA);
  const r1 = cmd(x, pid, 1);
  assert.strictEqual(r1.prix.groupes[0].margeMoyenne, 6); assert.ok(r1.prix.groupes[0].unitaire >= r0.prix.groupes[0].coutMoyen + 6);
  assert.strictEqual(cmd(x, "sweat-molleton", 1).prix.groupes[0].margeMoyenne, 3, "les autres articles gardent 3 €");
  R.appliquer({ articles: csv(A, [ligneArt({ id: pid, prix_fixe: "25" })]) }, x.PRIX, x.DATA);
  const r2 = cmd(x, pid, 3);
  assert.strictEqual(r2.prix.groupes[0].unitaire, 25); assert.strictEqual(r2.prix.total, 75); assert.strictEqual(r2.prix.groupes[0].prixFixe, true);
  assert.strictEqual(prixUnit(x, pid), 25);
  R.appliquer({ articles: csv(A, [ligneArt({ id: pid })]) }, x.PRIX, x.DATA);   // cellules vides : retour à la règle
  assert.strictEqual(x.DATA.produits.find(p => p.id === pid).prixFixe, undefined);
});
test("articles.csv : nouvel article d'après un modèle, placé juste après lui", () => {
  const x = neuf(), n0 = x.DATA.produits.length;
  const rap = R.appliquer({ articles: csv(A, [ligneArt({ id: "polo-club", nom: "Polo du club", nom_court: "Polo club", prix_achat: "9,99", copie_de: "polo-essential", tailles: "M | L", categories: "polos", visible: "oui" })]) }, x.PRIX, x.DATA);
  assert.deepStrictEqual(rap.erreurs, []); assert.deepStrictEqual(rap.articlesAjoutes, ["polo-club"]);
  assert.strictEqual(x.DATA.produits.length, n0 + 1);
  const i = x.DATA.produits.findIndex(p => p.id === "polo-essential"), p = x.DATA.produits[i + 1];
  assert.strictEqual(p.id, "polo-club"); assert.strictEqual(p.nomCourt, "Polo club"); assert.strictEqual(p.prixAchat, 9.99);
  assert.deepStrictEqual(p.tailles, ["M", "L"]); assert.strictEqual(p.modele, x.DATA.produits[i].modele);
  assert.ok(prixUnit(x, "polo-club") > 0);
  p.couleurs.push; assert.notStrictEqual(p.couleurs, x.DATA.produits[i].couleurs, "copie profonde");
  assert.ok(cmd(x, "polo-club", 2).prix.total > 0);
});
test("articles.csv : erreurs signalées, ligne ignorée", () => {
  const x = neuf(), n0 = x.DATA.produits.length;
  const rap = R.appliquer({ articles: csv(A, [
    ligneArt({ id: "inconnu", nom: "X", prix_achat: "5" }),
    ligneArt({ id: "Mauvais Id", nom: "X", prix_achat: "5", copie_de: "polo-essential" }),
    ligneArt({ id: "sans-nom", prix_achat: "5", copie_de: "polo-essential" }),
    ligneArt({ id: "sans-prix", nom: "X", copie_de: "polo-essential" }),
    ligneArt({ id: "polo-essential", prix_achat: "beaucoup", categories: "nimportequoi", visible: "peut-etre", technique_par_defaut: "laser" })]) }, x.PRIX, x.DATA);
  assert.strictEqual(x.DATA.produits.length, n0);
  assert.strictEqual(x.DATA.produits.find(p => p.id === "polo-essential").prixAchat, 7.99);
  assert.ok(rap.erreurs.length >= 8, rap.erreurs.join("\n"));
  rap.erreurs.forEach(e => assert.ok(/articles\.csv, ligne \d/.test(e), e));
});
test("articles.csv : technique par défaut vinyle / dtf (un article gravé reste gravé)", () => {
  const x = neuf(), vin = x.DATA.produits.find(p => p.techniqueDefaut === "vinyle"), grav = x.DATA.produits.find(p => p.technique === "gravure");
  R.appliquer({ articles: csv(A, [ligneArt({ id: vin.id, technique_par_defaut: "dtf" }), ligneArt({ id: "polo-essential", technique_par_defaut: "vinyle" }), ligneArt({ id: grav.id, technique_par_defaut: "vinyle" })]) }, x.PRIX, x.DATA);
  assert.strictEqual(vin.techniqueDefaut, undefined);
  assert.strictEqual(E.pieceTechno({ technique: "dtf" }, { id: "a", produitId: "polo-essential", couleurId: "marine" }, ctxDe(x)), "vinyle");
  assert.strictEqual(grav.techniqueDefaut, undefined); assert.strictEqual(grav.technique, "gravure");
});
test("couleurs.csv : prix d'une couleur, rupture, couleur masquée, nouvelle couleur", () => {
  const x = neuf(), pid = "maillot-basket", p = x.DATA.produits.find(q => q.id === pid), nb = p.couleurs.length;
  const rap = R.appliquer({ couleurs: csv(T.couleurs, [
    [pid, "blanc", "", "", "9,5", "", "", "", "", "", ""],
    [pid, "rouge", "", "", "", "non", "", "", "", "", ""],
    [pid, "vert", "Vert", "#2a8a3a", "7,2", "oui", "", "", "", "", "non"]]) }, x.PRIX, x.DATA);
  assert.deepStrictEqual(rap.erreurs, []);
  assert.strictEqual(p.couleurs.find(c => c.id === "blanc").prixAchat, 9.5);
  assert.strictEqual(E.prixAchatPiece(p, "blanc"), 9.5); assert.strictEqual(E.prixAchatPiece(p, "noir"), 6.99);
  assert.ok(!p.couleurs.some(c => c.id === "rouge")); assert.strictEqual(p.couleurs.length, nb);   // -1 masquée, +1 ajoutée
  assert.strictEqual(p.couleurs.find(c => c.id === "vert").prixAchat, 7.2);
  assert.ok(cmd(x, pid, 1, { couleurId: "vert" }).prix.total > 0);
});
test("couleurs.csv : article ou couleur invalide signalé, au moins une couleur reste", () => {
  const x = neuf(), pid = "maillot-basket", p = x.DATA.produits.find(q => q.id === pid);
  const rap = R.appliquer({ couleurs: csv(T.couleurs, [["nimporte", "blanc", "", "", "", "", "", "", "", "", ""], [pid, "nouveau", "Nouveau", "rouge", "", "", "", "", "", "", ""], [pid, "blanc", "", "#zzz", "", "", "", "", "", "", ""],
    ...p.couleurs.map(c => [pid, c.id, "", "", "", "non", "", "", "", "", ""])]) }, x.PRIX, x.DATA);
  assert.ok(rap.erreurs.length >= 3); assert.ok(p.couleurs.length >= 1);
  assert.ok(rap.avertissements.some(w => /toutes les couleurs sont masquées/.test(w)));
});
test("un article masqué ne change rien aux anciennes commandes : il se chiffre toujours", () => {
  const x = neuf();
  R.appliquer({ articles: csv(A, [ligneArt({ id: "polo-essential", visible: "non" })]) }, x.PRIX, x.DATA);
  assert.ok(cmd(x, "polo-essential", 2).prix.total > 0);
});
test("le site est compatible : aucun effet sans CSV, un nouvel article passe par la vitrine du moteur", () => {
  const x = neuf();
  R.appliquer({ articles: csv(A, [ligneArt({ id: "short-club", nom: "Short du club", prix_achat: "8", copie_de: "short-basket" })]) }, x.PRIX, x.DATA);
  const t = E.priceTable(x.DATA.produits.find(p => p.id === "short-club"), [1, 5, 10, 20, 50], ctxDe(x));
  t.forEach(r => { assert.ok(r.unitaire > 0); assert.strictEqual(r.unitaire % 2, 0); });
});

console.log("\n" + ok + " tests réussis.");
