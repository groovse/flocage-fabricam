// Tests du guide des méthodes : node tests/methodes.test.js
// (les données viennent de js/methodes-data.js, généré par outils/fiches-pdf.py ; les PDF sont dans fiches/)
const assert = require("assert");
const fs = require("fs");
const path = require("path");
global.window = {};
require(path.join("..", "js", "prix.js"));
require(path.join("..", "js", "data.js"));
require(path.join("..", "js", "methodes-data.js"));
const M = require(path.join("..", "js", "methodes.js"));

const DATA = window.DATA, PRIX = window.PRIX, D = window.MethodesData;
const racine = path.join(__dirname, "..");
const produits = {}; DATA.produits.forEach(p => produits[p.id] = p);
let ok = 0;
function test(nom, fn) { try { fn(); ok++; console.log("  ok  " + nom); } catch (e) { console.log("  ECHEC " + nom + "\n   " + e.message); process.exitCode = 1; } }
const statut = (mat, couleur, methode, prod) => M.methodesPour(mat, couleur, prod).find(r => r.id === methode).statut;

console.log("Données des fiches");
test("chaque matière a les quatre méthodes, avec des statuts valides", () => {
  assert.ok(D.matieres.length >= 12);
  D.matieres.forEach(m => {
    assert.deepStrictEqual(m.methodes.map(x => x.id), ["dtf", "sublimation", "vinyle", "laser"], m.id);
    m.methodes.forEach(x => ["statut", "clair", "fonce"].forEach(k => assert.ok(["ok", "prudence", "non"].includes(x[k]), m.id + " " + x.id + " " + k)));
  });
});
test("chaque matière a son PDF, et les pages citées existent", () => {
  D.matieres.forEach(m => {
    assert.ok(fs.existsSync(path.join(racine, m.pdf)), "PDF manquant : " + m.pdf);
    Object.keys(m.pages).forEach(k => assert.ok(m.pages[k] >= 1 && m.pages[k] <= m.nbPages, m.id + " page " + k));
    assert.strictEqual(m.pages.resume, 1);
    const pdf = fs.readFileSync(path.join(racine, m.pdf), "latin1");
    assert.ok(pdf.startsWith("%PDF"), m.pdf + " n'est pas un PDF");
    assert.strictEqual((pdf.match(/\/Type \/Page\b/g) || []).length, m.nbPages, m.id + " : nombre de pages");
  });
});
test("une méthode sans aucune couleur possible n'a pas de page", () => {
  D.matieres.forEach(m => m.methodes.forEach(x => {
    if (x.statut === "non" && x.clair === "non" && x.fonce === "non") assert.ok(!(x.id in m.pages) || x.id === "resume", m.id + " " + x.id);
  }));
});
test("chaque article du catalogue (hors vêtements apportés) a sa fiche, et inversement", () => {
  DATA.produits.filter(p => !p.apporte).forEach(p => assert.ok(D.produits[p.id], "pas de fiche pour " + p.id));
  Object.keys(D.produits).forEach(id => { assert.ok(produits[id], "article inconnu du catalogue : " + id); assert.ok(M.matiere(D.produits[id]), "fiche inconnue : " + D.produits[id]); });
});
test("la fiche correspond à la composition de l'article", () => {
  DATA.produits.filter(p => !p.apporte).forEach(p => {
    const f = D.produits[p.id], poly = p.polyesterPct;
    if (f === "coton-100" || f === "coton-extensible") assert.strictEqual(poly, 0, p.id);
    if (f === "coton-polyester") assert.ok(poly >= 20 && poly <= 60, p.id + " " + poly);
    if (/^polyester|^polaire|^microfibre/.test(f)) assert.ok(poly >= 80, p.id + " " + poly);
    if (f === "coton-100") assert.ok(/^100 % coton/.test(p.matiere), p.id);
    if (["aluminium", "inox", "verre"].includes(f)) assert.strictEqual(M.matiere(f).groupe, "rigide");
  });
});
test("les matières apportées proposées existent", () => {
  Object.keys(D.matiereApportee).forEach(k => D.matiereApportee[k].forEach(id => assert.ok(M.matiere(id), id)));
  DATA.matieres.forEach(m => assert.ok(D.matiereApportee[m.id], "matière apportée sans fiche : " + m.id));
});
test("aucune mention du BDE dans les fiches", () => {
  const src = fs.readFileSync(path.join(racine, "js", "methodes-data.js"), "utf8") + fs.readFileSync(path.join(racine, "outils", "fiches_donnees.py"), "utf8");
  assert.ok(!/\bBDE\b/.test(src));
});

console.log("Réglages du fournisseur");
function reglage(mat, methode, nom) { return M.matiere(mat).methodes.find(m => m.id === methode).reglages.find(r => r[0] === nom)[1]; }
test("DTF : le tableau de pose de DTF Print", () => {
  assert.strictEqual(reglage("coton-100", "dtf", "Température"), "150 °C");
  assert.strictEqual(reglage("coton-100", "dtf", "Durée"), "10 à 15 s");
  assert.strictEqual(reglage("polyester-100", "dtf", "Température"), "135 °C");
  assert.strictEqual(reglage("polyester-100", "dtf", "Durée"), "10 s");
  assert.strictEqual(reglage("coton-polyester", "dtf", "Température"), "145 °C");
  assert.strictEqual(reglage("coton-polyester", "dtf", "Durée"), "12 s");
  assert.strictEqual(reglage("nylon", "dtf", "Température"), "135 °C");
  assert.strictEqual(reglage("nylon", "dtf", "Durée"), "10 s");
});
test("les consignes de js/prix.js disent la même chose que les fiches", () => {
  assert.ok(/135 °C pendant 10 s/.test(PRIX.presse.dtf_polyester));
  assert.ok(/150 °C pendant 10 à 15 s/.test(PRIX.presse.dtf_autre) && /145 °C pendant 12 s/.test(PRIX.presse.dtf_autre));
  assert.ok(/190-200 °C pendant 40 à 60 s/.test(PRIX.presse.sublimation));
  assert.strictEqual(reglage("polyester-100", "sublimation", "Température"), "190 à 200 °C");
  assert.strictEqual(reglage("polyester-100", "sublimation", "Durée"), "40 à 60 s");
});

console.log("Méthodes applicables");
test("polyester 100 % : sublimation seulement sur couleur claire", () => {
  assert.strictEqual(statut("polyester-100", "clair", "sublimation"), "ok");
  assert.strictEqual(statut("polyester-100", "fonce", "sublimation"), "non");
  assert.strictEqual(statut("polyester-100", "fonce", "dtf"), "ok");
  assert.strictEqual(statut("polyester-100", "fonce", "vinyle"), "ok");
  assert.strictEqual(statut("polyester-100", "clair", "laser"), "non");
});
test("coton : ni sublimation ni laser ; DTF et vinyle sur toutes les couleurs", () => {
  ["clair", "fonce"].forEach(c => {
    assert.strictEqual(statut("coton-100", c, "sublimation"), "non");
    assert.strictEqual(statut("coton-100", c, "dtf"), "ok");
    assert.strictEqual(statut("coton-100", c, "vinyle"), "ok");
    assert.strictEqual(statut("coton-100", c, "laser"), "non");
  });
});
test("verre : gravure CO2 (Mira 9S) et vinyle adhésif, ni DTF ni sublimation", () => {
  assert.strictEqual(statut("verre", "clair", "dtf"), "non");
  assert.strictEqual(statut("verre", "clair", "sublimation"), "non");
  assert.strictEqual(statut("verre", "clair", "laser"), "ok");
  assert.strictEqual(statut("verre", "clair", "vinyle"), "ok");
  const types = Object.fromEntries(M.matiere("verre").methodes.find(m => m.id === "laser").types.map(t => [t.id, t.statut]));
  assert.deepStrictEqual(types, { co2: "ok", diode: "non", fibre: "non" });
  const vin = Object.fromEntries(M.matiere("verre").methodes.find(m => m.id === "vinyle").types.map(t => [t.id, t.statut]));
  assert.strictEqual(vin.adhesif, "ok");
  assert.strictEqual(vin.standard, "non");
});
test("inox : le laser n'est possible qu'avec une fibre (statut prudence tant que le xTool n'est pas confirmé)", () => {
  assert.strictEqual(statut("inox", "clair", "laser"), "prudence");
  const types = Object.fromEntries(M.matiere("inox").methodes.find(m => m.id === "laser").types.map(t => [t.id, t.statut]));
  assert.deepStrictEqual(types, { co2: "non", diode: "non", fibre: "ok" });
});
test("aluminium : CO2 et fibre gravent, la diode avec précautions", () => {
  assert.strictEqual(statut("aluminium", "clair", "laser"), "ok");
  const types = Object.fromEntries(M.matiere("aluminium").methodes.find(m => m.id === "laser").types.map(t => [t.id, t.statut]));
  assert.deepStrictEqual(types, { co2: "ok", diode: "prudence", fibre: "ok" });
});
test("polyester extensible : le flex stretch est le bon choix, le flex standard est déconseillé", () => {
  const t = Object.fromEntries(M.matiere("polyester-extensible").methodes.find(m => m.id === "vinyle").types.map(t => [t.id, t.statut]));
  assert.strictEqual(t.stretch, "ok");
  assert.strictEqual(t.standard, "prudence");
  assert.strictEqual(t.flock, "non");
});
test("tous les types de vinyle sont décrits, avec leurs réglages", () => {
  const types = M.matiere("coton-100").methodes.find(m => m.id === "vinyle").types;
  assert.deepStrictEqual(types.map(t => t.id), ["standard", "stretch", "flock", "reflechissant", "pailleté", "metallise", "adhesif"]);
  types.forEach(t => assert.deepStrictEqual(t.reglages.map(r => r[0]), ["Température", "Durée", "Pression", "Pelage"]));
});

console.log("Selon l'article");
test("sublimation : désactivée sur un article que le catalogue ne sublime pas (casquette, serviette, gourde)", () => {
  ["casquette-hike-100", "serviette-microfibre-l", "bonnet-running-seamless"].forEach(id => {
    const p = produits[id], f = D.produits[id];
    assert.strictEqual(statut(f, "clair", "sublimation", p), "non", id);
  });
});
test("sublimation : 87 % de polyester donne « avec précautions », 40 % donne « non »", () => {
  assert.strictEqual(statut("polyester-extensible", "clair", "sublimation", produits["sweat-viralto-axton"]), "prudence");
  assert.strictEqual(statut("polyester-extensible", "clair", "sublimation", produits["short-2-en-1-fitness"]), "prudence");
  assert.strictEqual(statut("coton-polyester", "clair", "sublimation", produits["tshirt-coton-homme"]), "non");
});
test("polo 100 % polyester blanc : sublimation applicable ; marine : seulement DTF et vinyle", () => {
  const p = produits["polo-essential"], f = D.produits[p.id];
  const clair = p.couleurs.find(c => c.clair), fonce = p.couleurs.find(c => !c.clair);
  assert.ok(clair && fonce);
  assert.strictEqual(statut(f, clair.clair ? "clair" : "fonce", "sublimation", p), "ok");
  assert.strictEqual(statut(f, "fonce", "sublimation", p), "non");
  assert.strictEqual(statut(f, "fonce", "dtf", p), "ok");
});
test("vêtement apporté : la fiche suit la matière déclarée", () => {
  const p = produits["apporte-tshirt"];
  assert.strictEqual(M.matiereDuProduit(p), "coton-polyester");
  assert.strictEqual(M.matiereDuProduit(p, "polyester-100"), "polyester-100");
  assert.strictEqual(M.matiereApportee("polyester"), "polyester-100");
  assert.strictEqual(M.matiereApportee("coton"), "coton-100");
  assert.strictEqual(M.matiereApportee("inconnu"), "coton-polyester");
  assert.strictEqual(statut(M.matiereDuProduit(p), "clair", "sublimation", p), "non");
});
test("couleur foncée : la raison de la sublimation l'explique", () => {
  const r = M.methodesPour("polyester-100", "fonce").find(x => x.id === "sublimation");
  assert.ok(/foncée/.test(r.raison));
});

console.log("Affichage");
test("le résultat liste les méthodes applicables en premier, avec le lien vers la bonne page du PDF", () => {
  const html = M.resultatHtml({ matiere: "polyester-100", couleur: "clair", couleurNom: "Blanc", prod: null });
  assert.ok(html.indexOf("DTF") < html.indexOf("Gravure laser"));
  assert.ok(html.includes('href="fiches/polyester-100.pdf#page=2"'));
  assert.ok(html.includes('href="fiches/polyester-100.pdf#page=3"'));
  assert.ok(!/undefined|NaN|\[object/.test(html));
  assert.ok(html.includes("Blanc"));
});
test("un article sans fiche affiche un message au lieu de planter", () => {
  assert.ok(/Aucune fiche/.test(M.resultatHtml({ matiere: null, couleur: "clair", couleurNom: "", prod: null })));
});
test("le guide propose chaque article du catalogue une seule fois", () => {
  const html = M.guideHtml({ pieces: [] });
  DATA.produits.forEach(p => {
    const n = (html.match(new RegExp('value="' + p.id + '"', "g")) || []).length;
    assert.ok(n <= 1, p.id + " proposé " + n + " fois");
  });
  assert.ok((html.match(/<option value="[a-z0-9-]+">/g) || []).length >= DATA.produits.length);
});

console.log("\n" + ok + " tests réussis" + (process.exitCode ? ", des échecs ci-dessus" : ""));
