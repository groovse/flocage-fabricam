// Tests de l'onglet Paiement et facture (lignes d'une demande à plusieurs configurations) : node tests/paiement.test.js
const assert = require("assert");
const path = require("path");
global.window = {};
require(path.join("..", "js", "prix.js"));
require(path.join("..", "js", "data.js"));
require(path.join("..", "js", "preview.js"));
const E = require(path.join("..", "js", "engine.js"));
window.Facturation = require(path.join("..", "js", "facturation.js"));

const PRIX = window.PRIX, DATA = window.DATA;
const produits = {}; DATA.produits.forEach(p => produits[p.id] = p);
const ctx = { prix: PRIX, produits, emplacements: DATA.emplacements, measure: E.approxMeasure };
let ok = 0;
function test(nom, fn) { try { fn(); ok++; console.log("  ok  " + nom); } catch (e) { console.log("  ECHEC " + nom + "\n   " + e.message); process.exitCode = 1; } }

// Un faux atelier : juste ce dont le fichier a besoin à son chargement
const st = { order: null, lots: null, lot: 0, basket: null, res: null, contact: { asso: "BDE test", nom: "Camille", email: "c@exemple.fr" }, prixAffiche: null };
const A = { $: () => null, $$: () => [], fmtEUR: x => x.toFixed(2).replace(".", ",") + " €", groupName: g => (produits[g.produitId].nomCourt || produits[g.produitId].nom), toast() {}, download() {} };
window.Atelier = { A, st, esc: String, views: {} };
require(path.join("..", "js", "atelier-paiement.js"));
const P = window.Atelier.paiement;

const A6 = e => ({ [e]: { actif: true, avecImage: true, format: "A6", orient: "portrait" } });
function commande(produitId, n, prefixe) {
  const prod = produits[produitId], emp = Object.keys(prod.zones).filter(e => !(DATA.emplacements[e] && DATA.emplacements[e].texteSeul))[0];
  return { pieces: Array.from({ length: n }, (_, i) => ({ id: prefixe + i, produitId, couleurId: prod.couleurs[0].id, taille: prod.tailles[0], prenom: "", numero: "" })), marquages: A6(emp), technique: "dtf" };
}
function charger(orders, prixAffiches, noms) {
  st.lots = orders.length > 1 ? orders.map((o, i) => ({ order: o, prixAffiche: prixAffiches ? prixAffiches[i] : null, nom: noms ? noms[i] : "" })) : null;
  st.lot = 0; st.order = orders[0]; st.prixAffiche = prixAffiches ? prixAffiches[0] : null;
  st.basket = E.computeBasket(orders, ctx); st.res = st.basket.lots[0];
  P.D.order = undefined; P.D.sansMarge = false; P.D.parties = {};
  P.synchroniser();
}
const polo = commande("polo-essential", 3, "a"), pull = commande(Object.keys(produits).filter(id => /sweat|pull/.test(id) && !produits[id].apporte && !produits[id].vendeur)[0], 2, "b");

console.log("Paiement et facture : plusieurs configurations (8.1.0)");
test("une seule configuration : les lignes sont celles de la commande, sans numéro de configuration", () => {
  charger([polo]);
  assert.strictEqual(P.D.lignes.length, 1);
  assert.ok(!/configuration/.test(P.D.lignes[0].designation));
  assert.strictEqual(P.D.lignes[0].qty, 3);
  assert.strictEqual(P.D.lignes[0].unit, st.basket.lots[0].prix.groupes[0].unitaire);
});
test("deux configurations (polo et pull) : les lignes des deux sont réunies sur un seul document", () => {
  charger([polo, pull]);
  assert.strictEqual(P.D.lignes.length, 2);
  assert.deepStrictEqual(P.D.lignes.map(l => l.qty), [3, 2]);
  assert.ok(/configuration 1/.test(P.D.lignes[0].designation) && /configuration 2/.test(P.D.lignes[1].designation));
  const total = P.D.lignes.reduce((t, l) => t + l.qty * l.unit, 0);
  assert.ok(Math.abs(total - st.basket.prix.total) < 0.005, total + " vs " + st.basket.prix.total);
  assert.ok(Math.abs(P.totalChoisi() - st.basket.prix.total) < 0.005);
});
test("les prix des lignes sont ceux du panier calculé d'un bloc (planches communes), pas ceux de chaque configuration seule", () => {
  charger([polo, pull]);
  const seul = E.computeOrder(polo, ctx).prix.groupes[0].unitaire;
  assert.ok(P.D.lignes[0].unit < seul || P.D.lignes[0].unit === st.basket.lots[0].prix.groupes[0].unitaire);
  assert.strictEqual(P.D.lignes[0].unit, st.basket.lots[0].prix.groupes[0].unitaire);
});
test("décocher une configuration : le document ne reprend que l'autre, au prix du panier entier", () => {
  charger([polo, pull]);
  P.D.parties[0] = false; P.D.lignes = P.lignesDepuisCommande();
  assert.strictEqual(P.D.lignes.length, 1);
  assert.ok(/configuration 2/.test(P.D.lignes[0].designation) && P.D.lignes[0].qty === 2);
  assert.strictEqual(P.D.lignes[0].unit, st.basket.lots[1].prix.groupes[0].unitaire);
  assert.ok(Math.abs(P.totalChoisi() - st.basket.lots[1].prix.total) < 0.005);
});
test("tout décocher laisse une ligne vide à remplir à la main", () => {
  charger([polo, pull]);
  P.D.parties[0] = false; P.D.parties[1] = false; P.D.lignes = P.lignesDepuisCommande();
  assert.strictEqual(P.D.lignes.length, 1); assert.strictEqual(P.D.lignes[0].designation, "");
});
test("sans marge : toutes les configurations cochées au prix coûtant", () => {
  charger([polo, pull]); P.D.sansMarge = true; P.D.lignes = P.lignesDepuisCommande();
  P.D.lignes.forEach((l, i) => assert.strictEqual(l.unit, st.basket.lots[i].prix.groupes[0].coutMoyen));
});
test("changer de configuration affichée dans l'atelier ne refait pas les lignes ni la sélection", () => {
  charger([polo, pull]); P.D.parties[1] = false; P.D.lignes[0].qty = 9;
  st.lot = 1; st.order = pull; st.res = st.basket.lots[1]; P.synchroniser();
  assert.strictEqual(P.D.lignes[0].qty, 9); assert.strictEqual(P.D.parties[1], false);
});
test("prix vus par le client : comparés configuration par configuration, repris sur les bonnes lignes", () => {
  const vus = i => ({ total: 100 + i, pieces: 1, parProduit: [{ produitId: i ? pull.pieces[0].produitId : polo.pieces[0].produitId, n: 1, unitaire: 50 + i }] });
  charger([polo, pull], [vus(0), vus(1)]);
  assert.strictEqual(P.prixVusDifferents(), true);
  assert.strictEqual(P.appliquerPrixVus(), 2);
  assert.deepStrictEqual(P.D.lignes.map(l => l.unit), [50, 51]);
  P.D.parties[0] = false; P.D.lignes = P.lignesDepuisCommande();
  assert.strictEqual(P.appliquerPrixVus(), 1);
});
test("le PDF d'une fiche réunissant les deux configurations se fabrique, avec les deux lignes", () => {
  charger([polo, pull]);
  const Fa = window.Facturation, d = { type: "fiche", numero: "FP-2026-001", dateIso: "2026-10-31", payeLe: "", refFiche: "", createur: { prenom: "Martin", nom: "Test" },
    client: { asso: "BDE test", contact: "Camille", email: "c@exemple.fr" }, lignes: P.D.lignes.map(l => ({ designation: l.designation, qty: l.qty, unit: l.unit })) };
  assert.deepStrictEqual(Fa.verifier(d), []);
  assert.ok(Fa.creerPdf(d, null).length > 500);
  assert.ok(Math.abs(Fa.total(d.lignes) - st.basket.prix.total) < 0.005);
});

console.log("Noms des configurations (8.2.0)");
test("une configuration nommée donne son nom à sa ligne ; sans nom, « configuration N »", () => {
  charger([polo, pull], null, ["Maillots équipe A", ""]);
  assert.ok(/, Maillots équipe A$/.test(P.D.lignes[0].designation), P.D.lignes[0].designation);
  assert.ok(/, configuration 2$/.test(P.D.lignes[1].designation), P.D.lignes[1].designation);
});
test("le nom ne change ni les prix ni les quantités", () => {
  charger([polo, pull]); const avant = P.D.lignes.map(l => [l.qty, l.unit]);
  charger([polo, pull], null, ["A", "B"]);
  assert.deepStrictEqual(P.D.lignes.map(l => [l.qty, l.unit]), avant);
});
console.log("\n" + ok + " tests réussis.");
