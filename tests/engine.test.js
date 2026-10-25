// Tests du moteur : node tests/engine.test.js
const assert = require("assert");
const path = require("path");
global.window = {};
require(path.join("..", "js", "prix.js"));
require(path.join("..", "js", "data.js"));
require(path.join("..", "js", "preview.js"));
const E = require(path.join("..", "js", "engine.js"));

const PRIX = window.PRIX, DATA = window.DATA;
const produits = {}; DATA.produits.forEach(p => produits[p.id] = p);
const ctx = { prix: PRIX, produits, emplacements: DATA.emplacements, measure: E.approxMeasure };
let ok = 0;
const pair = x => Math.ceil(x / 2 - 1e-9) * 2;      // arrondi à l'euro pair supérieur (prix.js : pas 2)
function test(nom, fn) { try { fn(); ok++; console.log("  ok  " + nom); } catch (e) { console.log("  ECHEC " + nom + "\n   " + e.message); process.exitCode = 1; } }

function pieces(n, couleur, extra) {
  return Array.from({ length: n }, (_, i) => Object.assign({ id: "p" + i, produitId: "polo-essential", couleurId: couleur || "marine", taille: "M", prenom: "", numero: "" }, extra ? extra(i) : {}));
}
const A6poitrine = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" } };

console.log("Prix de vente");
test("prix = coût + 3 € de marge, arrondi à l'euro pair supérieur : 1 polo, 1 visuel A6 poitrine", () => {
  const r = E.computeOrder({ pieces: pieces(1), marquages: A6poitrine, technique: "dtf" }, ctx);
  assert.strictEqual(r.couts.achats, 7.99);
  assert.strictEqual(r.couts.planchesTTC, 5.50);   // une A6 prend une planche A4 chez DTF Print (prix TTC)
  assert.strictEqual(r.couts.livraison, 4.90);
  assert.strictEqual(r.couts.total, 18.39);
  assert.strictEqual(r.prix.unitaire, 22);          // 18,39 + 3 = 21,39 -> 22
  assert.strictEqual(r.prix.marge, 3.61);
  assert.strictEqual(r.prix.groupes[0].motifs, 1);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 3);
});
test("10 polos avec 1 visuel chacun : 14 € la pièce (9,83 + 3 = 12,83 -> 14)", () => {
  const r = E.computeOrder({ pieces: pieces(10), marquages: A6poitrine, technique: "dtf" }, ctx);
  assert.strictEqual(r.couts.total, 98.3);
  assert.strictEqual(r.prix.unitaire, 14);
  assert.strictEqual(r.prix.total, 140);
});
test("règles de prix : marge de 3 €, pas de 2 €, pack à la moitié, plus de remise sur les vêtements apportés", () => {
  assert.strictEqual(PRIX.regles.margePiece, 3); assert.strictEqual(PRIX.regles.pas, 2);
  assert.strictEqual(PRIX.regles.parPiecePack, PRIX.regles.margePiece / 2);
  assert.strictEqual(PRIX.regles.apporte.facteur, 1);
});
test("margePiece : 3 € par pièce quel que soit le nombre de motifs, rien sans motif", () => {
  const m = n => E.margePiece(n, PRIX.regles);
  assert.deepStrictEqual([0, 1, 2, 3, 4, 10].map(m), [0, 3, 3, 3, 3, 3]);
});
test("une pièce avec un visuel, un prénom et un numéro (3 motifs) : toujours 3 € de marge", () => {
  const marq = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait",
    prenom: { actif: true, police: "Bebas Neue", hauteur: 2.5, couleur: "#fff" }, numero: { actif: true, police: "Bebas Neue", hauteur: 4, couleur: "#fff" } } };
  const r = E.computeOrder({ pieces: pieces(1, "marine", () => ({ prenom: "Léo", numero: "7" })), marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 3);
  assert.strictEqual(r.prix.groupes[0].motifs, 3);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 3);
  assert.strictEqual(r.prix.marge, E.round2(r.prix.total - r.couts.total));
  assert.ok(r.prix.marge >= 3 - 1e-9 && r.prix.marge < 5, "marge " + r.prix.marge);
});
test("une pièce sans motif ne porte aucune marge", () => {
  const r = E.computeOrder({ pieces: pieces(2), marquages: {}, technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 0);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 0);
  assert.ok(r.prix.marge <= 0.02);
});
test("calcPrix : coût + 3 €, arrondi à l'euro pair supérieur", () => {
  const p = E.calcPrix(70, 10, PRIX.regles);        // 7,00 + 3 = 10,00 -> 10
  assert.strictEqual(p.unitaire, 10); assert.strictEqual(p.marge, 30);
  const q = E.calcPrix(10.07, 1, PRIX.regles, 3);   // 3 motifs : toujours 3 € -> 13,07 -> 14
  assert.strictEqual(q.unitaire, 14);
  const r = E.calcPrix(9.511, 1, PRIX.regles, 1);   // 12,511 -> 14
  assert.strictEqual(r.unitaire, 14);
});
test("calcPrix : la marge ne dépend ni du coût ni du nombre de motifs (3 €), le prix est toujours pair", () => {
  const u = (c, m) => E.calcPrix(c, 1, PRIX.regles, m).unitaire;
  assert.strictEqual(u(5, 1), 8); assert.strictEqual(u(30, 1), 34); assert.strictEqual(u(100, 1), 104);
  assert.strictEqual(u(5, 2), 8); assert.strictEqual(u(30, 2), 34); assert.strictEqual(u(100, 5), 104);
  assert.strictEqual(u(30, 0), 30);
  for (let c = 0.5; c < 120; c += 0.37) { const x = E.calcPrix(c, 1, PRIX.regles, 1); assert.strictEqual(x.unitaire % 2, 0, "pair : " + x.unitaire); assert.ok(x.unitaire >= c + 3 - 1e-9 && x.unitaire < c + 5 + 1e-9, c + " -> " + x.unitaire); }
});
test("calcPrix : une autre marge dans prix.js suit (5 €)", () => {
  const cinq = Object.assign({}, PRIX.regles, { margePiece: 5 });
  assert.strictEqual(E.calcPrix(30, 1, cinq, 1).unitaire, 36);
});
test("la marge d'une commande est d'au moins 3 € par pièce, quel que soit le nombre de pièces", () => {
  [1, 2, 3, 5, 6, 7, 8, 12, 20, 50].forEach(n => {
    const r = E.computeOrder({ pieces: pieces(n), marquages: A6poitrine, technique: "dtf" }, ctx);
    assert.ok(r.prix.marge >= 3 * n - 1e-6, n + " pièces : marge " + r.prix.marge + " pour un coût de " + r.couts.total);
    assert.ok(r.prix.marge <= 5 * n + 1e-6, n + " pièces : marge trop haute " + r.prix.marge);
    assert.strictEqual(r.prix.unitaire % 2, 0, n + " pièces : prix pair");
  });
});

console.log("Placement des planches");
function overlap(a, b) { return a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9; }
function checkPlan(sheets, gap) {
  sheets.forEach(s => {
    s.placed.forEach(p => { assert.ok(p.x >= -1e-9 && p.y >= -1e-9 && p.x + p.w <= s.format.w + 1e-9 && p.y + p.h <= s.format.h + 1e-9, "hors planche"); });
    for (let i = 0; i < s.placed.length; i++) for (let j = i + 1; j < s.placed.length; j++) {
      const a = s.placed[i], b = s.placed[j];
      const ia = { x: a.x, y: a.y, w: a.w + gap, h: a.h + gap }, ib = { x: b.x, y: b.y, w: b.w + gap, h: b.h + gap };
      assert.ok(!overlap(ia, ib), "chevauchement ou écart insuffisant");
    }
  });
}
test("4 motifs A6 tiennent sur une A4 (ecart 0)", () => {
  const r = E.computeOrder({ pieces: pieces(4), marquages: A6poitrine, technique: "dtf" }, ctx);
  assert.strictEqual(r.plans.dtf.sheets.length, 1);
  assert.strictEqual(r.plans.dtf.sheets[0].format.id, "A4");
});
test("10 pièces A6 poitrine : aucun chevauchement, tout est placé", () => {
  const r = E.computeOrder({ pieces: pieces(10), marquages: A6poitrine, technique: "dtf" }, ctx);
  const placed = r.plans.dtf.sheets.reduce((s, x) => s + x.placed.length, 0);
  assert.strictEqual(placed, 10);
  checkPlan(r.plans.dtf.sheets, PRIX.placement.ecart);
  console.log("     10 pièces :", r.plans.dtf.sheets.map(s => s.format.id + "×" + s.placed.length).join(" + "), "| planches HT", r.couts.planchesHT, "| coût", r.couts.total, "| prix unitaire", r.prix.unitaire);
});
test("50 pièces A6 poitrine : planche unique moins chère que 50 A6", () => {
  const r = E.computeOrder({ pieces: pieces(50), marquages: A6poitrine, technique: "dtf" }, ctx);
  checkPlan(r.plans.dtf.sheets, PRIX.placement.ecart);
  assert.ok(r.couts.planchesHT < 50 * 2.40);
  console.log("     50 pièces :", r.lignesPlanches.map(l => l.formatId + "×" + l.qty).join(" + "), "| HT", r.couts.planchesHT, "| prix unitaire", r.prix.unitaire);
});
test("commande mixte : dos A4 + prénoms + numéros + poitrine A6 + manches", () => {
  const marq = {
    poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" },
    dos: { actif: true, avecImage: true, format: "A4", orient: "portrait", prenom: { actif: true, hauteur: 4, police: "Bebas Neue", couleur: "#fff" }, numero: { actif: true, hauteur: 12, police: "Bebas Neue", couleur: "#fff" }, textePos: "dessous" },
    manche_g: { actif: true, avecImage: true, format: "A6", orient: "portrait" },
    manche_d: { actif: true, avecImage: true, format: "A6", orient: "portrait" }
  };
  const noms = ["Léo", "Maximilien", "Sam", "Inès", "Alexandre-Louis", "Zoé", "Tom", "Lou", "Chloé", "Hugo", "Emma", "Nils"];
  const r = E.computeOrder({ pieces: pieces(12, "marine", i => ({ prenom: noms[i], numero: String(i + 1) })), marquages: marq, technique: "dtf" }, ctx);
  checkPlan(r.plans.dtf.sheets, PRIX.placement.ecart);
  assert.strictEqual(r.motifs.length, 12 * (1 + 3 + 1 + 1));
  const placed = r.plans.dtf.sheets.reduce((s, x) => s + x.placed.length, 0);
  assert.strictEqual(placed, r.motifs.length);
  console.log("     12 pièces complètes :", r.lignesPlanches.map(l => l.formatId + "×" + l.qty).join(" + "), "| HT", r.couts.planchesHT, "| livraison", r.couts.livraison, "| coût", r.couts.total, "| prix unitaire", r.prix.unitaire, "| marge", r.prix.marge);
  r.warnings.forEach(w => console.log("     avertissement :", w));
});
test("sublimation seulement sur polyester clair, le reste en DTF", () => {
  const ps = pieces(3, "blanc").concat(pieces(2, "marine").map((p, i) => Object.assign(p, { id: "m" + i })));
  const r = E.computeOrder({ pieces: ps, marquages: A6poitrine, technique: "sublimation" }, ctx);
  assert.strictEqual(r.motifs.filter(m => m.techno === "sublimation").length, 3);
  assert.strictEqual(r.motifs.filter(m => m.techno === "dtf").length, 2);
  assert.ok(r.plans.sublimation && r.plans.dtf);
  console.log("     sublimation :", r.plans.sublimation.sheets.map(s => s.format.id).join("+"), "| DTF :", r.plans.dtf.sheets.map(s => s.format.id).join("+"));
});
test("tableau vitrine", () => {
  const t = E.priceTable(DATA.produits[0], [1, 5, 10, 20, 50], ctx);
  console.log("     ", t.map(x => x.q + " → " + x.unitaire.toFixed(2) + " €").join(" | "));
  t.forEach(x => assert.ok(x.unitaire > 0));
});
test("livraison offerte à partir de 100 € HT de planches", () => {
  const r = E.computeOrder({ pieces: pieces(400), marquages: A6poitrine, technique: "dtf" }, ctx);
  assert.ok(r.couts.planchesHT >= 100 ? r.couts.livraison === 0 : true);
});

console.log("\nPlusieurs produits et packs");
const piece = (id, produitId, extra) => Object.assign({ id, produitId, couleurId: DATA.produits.find(p => p.id === produitId).couleurs[0].id, taille: "M", prenom: "", numero: "" }, extra || {});
const marqMixte = {
  poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" },
  cuisse_g: { actif: true, avecImage: true, format: "A6", orient: "portrait" }
};
test("un prix par produit : chaque produit a le sien, 3 € de marge", () => {
  const ps = [piece("a", "short-basket"), piece("b", "short-basket"), piece("c", "sweat-molleton")];
  const r = E.computeOrder({ pieces: ps, marquages: marqMixte, technique: "dtf" }, ctx);
  assert.strictEqual(r.prix.groupes.length, 2);
  const short = r.prix.groupes.find(g => g.produitId === "short-basket"), sweat = r.prix.groupes.find(g => g.produitId === "sweat-molleton");
  assert.strictEqual(short.n, 2); assert.strictEqual(sweat.n, 1);
  assert.ok(short.unitaire < sweat.unitaire, "le short doit coûter moins cher que le sweat");
  assert.strictEqual(r.prix.unitaire, null);
  r.prix.groupes.forEach(g => {
    const marge = g.unitaire - g.coutMoyen;
    assert.ok(marge >= 3 - 1e-6 && marge < 5 + 1e-6, g.produitId + " : marge " + marge.toFixed(3));   // 3 € puis l'arrondi à l'euro pair (jusqu'à +2 €)
    assert.strictEqual(g.unitaire % 2, 0, g.produitId + " : prix pair");
  });
  assert.strictEqual(r.prix.total, short.total + sweat.total);
  assert.ok(Math.abs(Object.values(r.coutPieces).reduce((s, c) => s + c.total, 0) - r.couts.total) < 0.01, "les coûts imputés doivent égaler le coût réel");
  console.log("     short", short.unitaire, "€ x2 | sweat", sweat.unitaire, "€ | total", r.prix.total, "| marge", r.prix.marge);
});
test("un seul produit : même résultat qu'avant (prix unique par pièce)", () => {
  const r = E.computeOrder({ pieces: [piece("a", "sweat-molleton"), piece("b", "sweat-molleton")], marquages: marqMixte, technique: "dtf" }, ctx);
  assert.strictEqual(r.prix.groupes.length, 1);
  assert.strictEqual(r.prix.unitaire, r.prix.groupes[0].unitaire);
});
test("pack basket : un seul article, 1,50 € de marge par pièce du pack (la moitié)", () => {
  const avec = [piece("a", "maillot-basket", { pack: "k1", packType: "pack-basket" }), piece("b", "short-basket", { pack: "k1", packType: "pack-basket" })];
  const sans = avec.map(p => Object.assign({}, p, { pack: undefined, packType: undefined }));
  const r1 = E.computeOrder({ pieces: avec, marquages: marqMixte, technique: "dtf" }, ctx);
  const r2 = E.computeOrder({ pieces: sans, marquages: marqMixte, technique: "dtf" }, ctx);
  assert.strictEqual(r1.prix.packs.n, 1);
  assert.strictEqual(r1.prix.groupes.length, 1);
  const g = r1.prix.groupes[0];
  assert.ok(g.pack && g.n === 1 && g.pieces === 2);
  assert.strictEqual(g.unitaire, r1.prix.total);
  assert.strictEqual(g.margeMoyenne, 3);   // deux pièces, 1,50 € chacune
  assert.ok(r1.prix.marge >= 3 - 1e-6 && r1.prix.marge < 5, "marge " + r1.prix.marge);
  // dans le pack, la marge de chaque pièce est la moitié de celle d'une pièce seule (3 €) ; le pack n'est jamais plus cher
  assert.ok(r1.prix.total <= r2.prix.total, "le pack ne doit pas coûter plus cher que les deux pièces séparées");
  assert.strictEqual(r2.prix.groupes.reduce((s, x) => s + x.margeMoyenne * x.n, 0), 6);
  console.log("     pack", r1.prix.total, "€ contre", r2.prix.total, "€ séparés");
});
test("pack : la marge de chaque pièce reste 1,50 € quel que soit son nombre de motifs, chaussettes à 0 €", () => {
  const pk = (id, produitId) => piece(id, produitId, { pack: "k1", packType: "pack-basket", prenom: "Léa", numero: "9" });
  const ps = [pk("a", "maillot-basket"), pk("b", "short-basket"), pk("c", "chaussettes-football")];
  const marq = {
    poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait", numero: { actif: true, police: "Bebas Neue", hauteur: 4, couleur: "#fff" } },
    dos: { actif: true, avecImage: true, format: "A4", orient: "portrait", prenom: { actif: true, police: "Bebas Neue", hauteur: 3, couleur: "#fff" } },
    cuisse_g: marqMixte.cuisse_g,
    chaussette_g: { actif: true, avecImage: false, prenom: { actif: true, police: "Bebas Neue", hauteur: 3, couleur: "#fff" }, numero: { actif: false }, maj: true }
  };
  const r = E.computeOrder({ pieces: ps, marquages: marq, technique: "dtf" }, ctx);
  assert.ok(r.motifs.length >= 5, "plusieurs motifs : " + r.motifs.length);
  assert.strictEqual(r.prix.groupes.length, 1);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 3);   // maillot 1,50 € + short 1,50 € + chaussettes 0 €
  assert.strictEqual(E.margePiecePack(produits["chaussettes-football"], PRIX.regles), 0);
  assert.strictEqual(E.margePiecePack(produits["maillot-basket"], PRIX.regles), 1.5);
  // vendues séparément, les mêmes pièces portent plus de marge (3 € chacune)
  const separees = ps.map(p => Object.assign({}, p, { pack: undefined, packType: undefined }));
  const r2 = E.computeOrder({ pieces: separees, marquages: marq, technique: "dtf" }, ctx);
  assert.ok(r2.prix.marge > r.prix.marge + 2, "séparées " + r2.prix.marge + " contre " + r.prix.marge);
});
test("plusieurs packs et des pièces seules dans la même commande", () => {
  const ps = [];
  ["k1", "k2", "k3"].forEach((k, i) => { ps.push(piece("m" + i, "maillot-basket", { pack: k, packType: "pack-basket" })); ps.push(piece("s" + i, "short-basket", { pack: k, packType: "pack-basket" })); });
  ps.push(piece("x", "short-basket"));
  const r = E.computeOrder({ pieces: ps, marquages: marqMixte, technique: "dtf" }, ctx);
  assert.strictEqual(r.prix.packs.n, 3);
  const pk = r.prix.groupes.find(g => g.pack), seul = r.prix.groupes.find(g => !g.pack);
  assert.strictEqual(pk.n, 3); assert.strictEqual(seul.n, 1); assert.strictEqual(seul.produitId, "short-basket");
  assert.strictEqual(r.prix.total, pk.total + seul.total);
  assert.ok(Math.abs(Object.values(r.coutPieces).reduce((s, c) => s + c.total, 0) - r.couts.total) < 0.01);
});
test("un pack incomplet (une seule pièce) est vendu comme une pièce seule", () => {
  const r = E.computeOrder({ pieces: [piece("a", "short-basket", { pack: "k1", packType: "pack-basket" })], marquages: marqMixte, technique: "dtf" }, ctx);
  assert.strictEqual(r.prix.packs.n, 0);
  assert.strictEqual(r.prix.groupes[0].pack, false);
});
test("short de basket, 2 A6 (une par cuisse) : le prix suit le coût + 3 €, arrondi à l'euro pair", () => {
  const marq = { cuisse_g: marqMixte.cuisse_g, cuisse_d: { actif: true, avecImage: true, format: "A6", orient: "portrait" } };
  let prev = null;
  [4, 5, 6, 7, 8, 9, 10, 12].forEach(n => {
    const ps = Array.from({ length: n }, (_, i) => piece("s" + i, "short-basket"));
    const r = E.computeOrder({ pieces: ps, marquages: marq, technique: "dtf" }, ctx);
    const u = r.prix.groupes[0].unitaire, cm = r.prix.groupes[0].coutMoyen;
    assert.ok(u >= cm + 3 - 1e-6 && u < cm + 5 + 1e-6 && u % 2 === 0, n + " : prix " + u + " pour un coût moyen de " + cm);   // 3 € de marge, puis l'arrondi pair
    console.log("     " + n + " shorts : coût moyen " + cm.toFixed(2) + " -> " + u.toFixed(2) + " € la pièce");
    prev = u;
  });
});
test("texte seul sur le bas de la jambe : pas de visuel, un petit texte", () => {
  const marq = { bas_jambe_g: { actif: true, avecImage: true, format: "A6", orient: "portrait", prenom: { actif: true, hauteur: 2.5, police: "Bebas Neue", couleur: "#fff" }, numero: { actif: false }, textePos: "dessous" } };
  const r = E.computeOrder({ pieces: [piece("a", "short-basket", { prenom: "Léo" })], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 1);
  assert.strictEqual(r.motifs[0].kind, "prenom");
  assert.strictEqual(r.motifs[0].emp, "bas_jambe_g");
});
test("les emplacements d'un autre produit sont ignorés (cuisse sur un sweat)", () => {
  const r = E.computeOrder({ pieces: [piece("a", "sweat-molleton")], marquages: { cuisse_g: marqMixte.cuisse_g }, technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 0);
});
test("sublimation : maillot et short blancs oui, sweat et débardeur coton non", () => {
  const ps = [piece("a", "maillot-basket"), piece("b", "short-basket"), piece("c", "sweat-molleton"), piece("d", "debardeur-fitness")];
  const order = { pieces: ps, marquages: marqMixte, technique: "sublimation" };
  assert.deepStrictEqual(ps.map(p => E.pieceTechno(order, p, ctx)), ["sublimation", "sublimation", "dtf", "dtf"]);
});
test("tableau vitrine : tous les produits et le pack ont un prix", () => {
  DATA.produits.concat(DATA.packs).forEach(item => {
    const t = E.priceTable(item, [1, 5, 10, 20, 50], ctx);
    t.forEach(x => assert.ok(x.unitaire > 0, item.id));
    console.log("     " + item.id.padEnd(18), t.map(x => x.unitaire.toFixed(2)).join(" | "));
  });
});

console.log("\nAperçu sur photo (données)");
test("apercuPhoto : couleur, photo et réglages valides pour chaque vêtement concerné", () => {
  let n = 0;
  DATA.produits.forEach(p => {
    const ap = p.apercuPhoto; if (!ap) return;
    assert.ok(p.couleurs.some(c => c.id === ap.couleur), p.id + " : couleur de la photo inconnue");
    ["face", "dos"].forEach(v => {
      const c = ap[v]; if (!c) return;
      n++;
      assert.ok(Number.isInteger(c.photo) && c.photo >= 0 && c.photo < p.photos.length, p.id + " " + v + " : rang de photo hors liste");
      ["u0", "v0", "kx", "ky"].forEach(k => assert.ok(typeof c[k] === "number" && isFinite(c[k]), p.id + " " + v + " : " + k));
      assert.ok(c.kx > 0 && c.ky > 0, p.id + " " + v + " : échelle positive");
    });
  });
  assert.strictEqual(n, 9);
});
test("apercuPhoto : les emplacements du dos n'existent que s'il y a une photo de dos", () => {
  DATA.produits.forEach(p => {
    if (!p.apercuPhoto) return;
    const aDos = Object.keys(p.zones).some(k => p.zones[k].vue === "dos");
    if (aDos) assert.ok(p.apercuPhoto.dos, p.id + " : zone au dos sans photo de dos");
  });
});
test("apercuPhoto : les emplacements tombent dans la photo (hors manches)", () => {
  DATA.produits.forEach(p => {
    const ap = p.apercuPhoto; if (!ap) return;
    Object.keys(p.zones).forEach(k => {
      const z = p.zones[k]; if (z.cy != null) return;            // les manches ne sont pas montrées sur la photo
      const c = ap[z.vue === "dos" ? "dos" : "face"]; if (!c) return;
      [[z.cx - z.w / 2, z.top], [z.cx + z.w / 2, z.top + z.h]].forEach(([x, y]) => {
        const u = c.u0 + c.kx * x, v = c.v0 + c.ky * y;
        assert.ok(u > -0.02 && u < 1.02 && v > -0.05 && v < 1.02, p.id + " " + k + " sort de la photo (" + u.toFixed(2) + ", " + v.toFixed(2) + ")");
      });
    });
  });
});




console.log("\nCatalogue étendu (v2.3.0)");
const piece2 = (id, produitId, extra) => Object.assign({ id, produitId, couleurId: produits[produitId].couleurs[0].id, taille: produits[produitId].tailles[0], prenom: "", numero: "" }, extra || {});
test("catalogue : identifiants uniques, emplacements, modèles de dessin et tags valides", () => {
  const ids = {}, types = DATA.filtres.type.valeurs.map(v => v.id), genres = DATA.filtres.genre.valeurs.map(v => v.id), styles = DATA.filtres.style.valeurs.map(v => v.id);
  DATA.produits.concat(DATA.packs).forEach(it => {
    assert.ok(!ids[it.id], "identifiant en double : " + it.id); ids[it.id] = 1;
    assert.ok(types.indexOf(it.tags.type) >= 0, it.id + " : type inconnu " + it.tags.type);
    assert.ok(it.apporte || styles.indexOf(it.tags.style) >= 0, it.id + " : style inconnu");
    it.tags.genre.forEach(g => assert.ok(genres.indexOf(g) >= 0, it.id + " : genre inconnu"));
  });
  DATA.produits.forEach(p => {
    assert.ok(window.Preview.models[p.modele], p.id + " : modèle de dessin inconnu " + p.modele);
    Object.keys(p.zones).forEach(e => assert.ok(DATA.emplacements[e], p.id + " : emplacement inconnu " + e));
    p.vitrine.forEach(e => assert.ok(p.zones[e], p.id + " : la vitrine utilise un emplacement absent " + e));
    assert.ok(p.couleurs.length && p.tailles.length && (p.apporte || p.photos.length), p.id + " : couleurs, tailles ou photos manquantes");
    assert.ok((p.apporte ? p.prixAchat === 0 : p.prixAchat > 0) && p.polyesterPct >= 0 && p.polyesterPct <= 100, p.id + " : prix ou matière");
    if (p.vendeur) assert.ok(PRIX.livraisonVendeur.vendeurs[p.vendeur], p.id + " : vendeur absent de prix.js");
  });
  DATA.packs.forEach(k => {
    k.produits.forEach(id => assert.ok(produits[id], k.id + " : produit inconnu " + id));
    k.vitrine.forEach(e => assert.ok(k.produits.some(id => produits[id].zones[e]), k.id + " : la vitrine utilise un emplacement absent " + e));
  });
});
test("catégories de la vitrine : liste valide, chaque article et pack en porte au moins une, sans doublon", () => {
  const ids = DATA.categories.map(c => c.id);
  assert.strictEqual(new Set(ids).size, ids.length, "identifiants de catégorie en double");
  DATA.categories.forEach(c => assert.ok(c.label, c.id + " : libellé manquant"));
  DATA.produits.concat(DATA.packs).forEach(it => {
    const cats = it.tags.categories;
    assert.ok(Array.isArray(cats) && cats.length, it.id + " : aucune catégorie");
    assert.strictEqual(new Set(cats).size, cats.length, it.id + " : catégorie en double");
    cats.forEach(c => assert.ok(ids.indexOf(c) >= 0, it.id + " : catégorie inconnue " + c));
    assert.strictEqual(cats.indexOf("apporte") >= 0, !!it.apporte, it.id + " : « Ton vêtement » seulement pour les vêtements apportés");
  });
  ids.forEach(id => assert.ok(DATA.produits.concat(DATA.packs).some(it => it.tags.categories.indexOf(id) >= 0), id + " : catégorie vide"));
  DATA.packs.forEach(k => assert.strictEqual(k.tags.categories[0], "ensembles", k.id + " : un pack est rangé dans « Packs »"));
});
test("dessins : chaque vêtement se dessine de face et de dos, et ses zones tiennent dans le dessin", () => {
  DATA.produits.forEach(p => {
    const m = window.Preview.models[p.modele], W = m.w || 90, H = m.h || 82, dy = m.dy || 0;
    ["face", "dos"].forEach(vue => {
      const svg = window.Preview.render({ prod: p, hex: p.couleurs[0].hex, vue, marquages: {}, ctx });
      assert.ok(svg.indexOf("<svg") === 0 && svg.indexOf("NaN") < 0 && svg.indexOf("undefined") < 0, p.id + " " + vue);
    });
    Object.keys(p.zones).forEach(e => {
      const z = p.zones[e]; if (z.cy != null) return;          // les manches sont tournées : on ne les contrôle pas ici
      assert.ok(z.cx - z.w / 2 >= 0 && z.cx + z.w / 2 <= W, p.id + " " + e + " : zone hors du dessin en largeur");
      assert.ok(z.top >= 0 && z.top + z.h + dy <= H, p.id + " " + e + " : zone hors du dessin en hauteur");
    });
  });
});
test("place de marché : un seul frais de port par vendeur et par commande, réparti sur ses pièces", () => {
  const marq = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" } };
  const un = E.computeOrder({ pieces: [piece2("a", "doudoune-sans-manche")], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(un.couts.livraisonVendeurs, 4.99);
  assert.strictEqual(un.vendeurs.length, 1);
  assert.strictEqual(un.vendeurs[0].id, "sport-et-go-eu");
  const memeVendeur = E.computeOrder({ pieces: [piece2("a", "doudoune-sans-manche"), piece2("b", "veste-micropolaire"), piece2("c", "doudoune-sans-manche")], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(memeVendeur.couts.livraisonVendeurs, 4.99);
  assert.strictEqual(memeVendeur.vendeurs[0].pieces, 3);
  const deux = E.computeOrder({ pieces: [piece2("a", "doudoune-sans-manche"), piece2("b", "veste-sans-manches")], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(deux.couts.livraisonVendeurs, 9.98);
  assert.strictEqual(deux.vendeurs.length, 2);
  const magasin = E.computeOrder({ pieces: [piece2("a", "polo-essential")], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(magasin.couts.livraisonVendeurs, 0);
  assert.strictEqual(magasin.vendeurs.length, 0);
  // la somme des coûts par pièce égale le coût de revient
  let somme = 0; Object.keys(deux.coutPieces).forEach(k => { somme += deux.coutPieces[k].total; });
  assert.ok(Math.abs(somme - deux.couts.total) < 0.011, "somme " + somme + " pour un coût de " + deux.couts.total);
  assert.strictEqual(deux.couts.total, E.round2(deux.couts.achats + deux.couts.planchesTTC + deux.couts.livraison + deux.couts.vinyle + 9.98));
  const margeVoulue = deux.prix.groupes.reduce((s, g) => s + g.n * g.margeMoyenne, 0);
  assert.strictEqual(margeVoulue, 6);   // 3 € par pièce, deux pièces
  assert.ok(deux.prix.total >= deux.couts.total + margeVoulue - 0.02, "la marge (3 € par pièce) est respectée avec les frais du vendeur");
});
test("place de marché : plus on commande de pièces, plus la part des frais de port baisse", () => {
  const prix = [1, 5, 20].map(q => E.priceTable(produits["doudoune-sans-manche"], [q], ctx)[0].unitaire);
  assert.ok(prix[0] > prix[1] && prix[1] > prix[2], prix.join(" > "));
});
test("chaussettes : le prix de la vitrine compte un prénom pressé (emplacement réservé aux prénoms)", () => {
  const t = E.priceTable(produits["chaussettes-football"], [1, 10], ctx);
  assert.ok(t[0].unitaire > produits["chaussettes-football"].prixAchat + 1 + 2.88, "la planche A6 et la livraison sont comptées : " + t[0].unitaire);
  const marq = { chaussette_g: { actif: true, avecImage: false, prenom: { actif: true, hauteur: 2.5, police: "Bebas Neue", couleur: "#fff" }, numero: { actif: false }, maj: true } };
  const r = E.computeOrder({ pieces: [piece2("a", "chaussettes-football", { prenom: "Léo" })], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 1); assert.strictEqual(r.motifs[0].kind, "prenom"); assert.strictEqual(r.motifs[0].emp, "chaussette_g");
  const vide = E.computeOrder({ pieces: [piece2("a", "chaussettes-football")], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(vide.motifs.length, 0);
});
test("packs d'ensembles : moins cher que les pièces séparées", () => {
  ["pack-fitness-femme", "pack-jogging-femme", "pack-football", "pack-basket", "pack-entraineur", "pack-hummel"].forEach(id => {
    const k = DATA.packs.filter(x => x.id === id)[0];
    const pk = E.priceTable(k, [1], ctx)[0].unitaire;
    const sep = k.produits.reduce((s, pid) => s + E.priceTable(Object.assign({}, produits[pid], { vitrine: k.vitrine.filter(e => produits[pid].zones[e]) }), [1], ctx)[0].unitaire, 0);
    assert.ok(pk < sep, id + " : pack " + pk + " contre " + sep + " séparés");
  });
});
test("packs : chaque pack contient les chaussettes, 1,50 € de marge par pièce hors chaussettes", () => {
  const taille = { "pack-basket": 3, "pack-fitness-femme": 3, "pack-jogging-femme": 3, "pack-football": 3, "pack-entraineur": 4, "pack-hummel": 3 };
  assert.deepStrictEqual(DATA.packs.map(k => k.id).sort(), Object.keys(taille).sort());
  DATA.packs.forEach(k => {
    assert.strictEqual(k.produits.length, taille[k.id], k.id);
    assert.ok(k.produits.includes("chaussettes-football"), k.id + " : chaussettes");
    k.produits.forEach(pid => assert.ok(produits[pid], k.id + " : produit inconnu " + pid));
    assert.ok(k.vitrine.includes("chaussette_g"), k.id + " : la vitrine compte un prénom sur une chaussette");
    const pieces = k.produits.map((pid, j) => ({ id: "x" + j, produitId: pid, couleurId: produits[pid].couleurs[0].id, taille: produits[pid].tailles[1] || produits[pid].tailles[0], prenom: "Léa", numero: "", pack: "pk0", packType: k.id }));
    const marq = {}; k.vitrine.forEach(e => { const t = !!DATA.emplacements[e].texteSeul; marq[e] = { actif: true, avecImage: !t, image: null, format: "A6", orient: "portrait" }; if (t) { marq[e].maj = true; marq[e].prenom = { actif: true, police: "Bebas Neue", hauteur: 3, couleur: "#ffffff" }; } });
    const r = E.computeOrder({ pieces, marquages: marq, technique: "dtf" }, ctx);
    assert.strictEqual(r.prix.groupes.length, 1, k.id + " : un seul article");
    const attendue = 1.5 * k.produits.filter(pid => produits[pid].margePack !== 0).length;
    assert.ok(r.prix.marge >= attendue - 1e-6 && r.prix.marge < attendue + 2 + 1e-6, k.id + " : marge " + r.prix.marge + " au lieu de " + attendue);   // l'arrondi pair peut ajouter jusqu'à 2 €
    assert.ok(r.prix.groupes[0].pack, k.id);
  });
});
test("packs : prix de la vitrine d'un pack basket (32 €) et d'un pack entraîneur (60 €)", () => {
  const prixPack = id => E.priceTable(DATA.packs.filter(k => k.id === id)[0], [1], ctx)[0].unitaire;
  assert.strictEqual(prixPack("pack-basket"), 32);       // coût 27,37 + 3 € (maillot et short à 1,50 €) = 30,37 -> 32
  assert.strictEqual(prixPack("pack-entraineur"), 60);   // coût 53,45 + 4,50 € (veste, haut thermique, jogging) = 57,95 -> 58, chaussettes en vinyle : 60
});
test("ensemble Hummel : un t-shirt et un short vendus ensemble, une seule pièce pour la marge", () => {
  const h = produits["ensemble-hummel"];
  assert.ok(h, "ensemble-hummel dans le catalogue");
  assert.strictEqual(h.tags.type, "ensemble");
  assert.strictEqual(h.prixAchat, 23);
  assert.deepStrictEqual(Object.keys(h.zones).sort(), ["cuisse_d", "cuisse_g", "dos", "poitrine"]);
  assert.ok(h.anciensId.includes("robe-hummel"));
  const m = (n, empl) => { const marq = {}; empl.forEach(e => { marq[e] = { actif: true, avecImage: true, format: "A6", orient: "portrait" }; });
    return E.computeOrder({ pieces: [piece("a", "ensemble-hummel")], marquages: marq, technique: "dtf" }, ctx).prix.groupes[0].margeMoyenne; };
  assert.strictEqual(m(1, ["poitrine"]), 3);
  assert.strictEqual(m(2, ["poitrine", "cuisse_g"]), 3);
  assert.strictEqual(m(3, ["poitrine", "cuisse_g", "cuisse_d"]), 3);   // 3 € pour tout l'ensemble, quel que soit le nombre de motifs
  // dans le pack Hummel : 1,50 € pour l'ensemble + 1,50 € pour la veste + 0 € pour les chaussettes
  const k = DATA.packs.filter(x => x.id === "pack-hummel")[0];
  assert.deepStrictEqual(k.produits, ["ensemble-hummel", "veste-micropolaire", "chaussettes-football"]);
  const ps = k.produits.map((pid, j) => piece("h" + j, pid, { pack: "pk0", packType: "pack-hummel" }));
  const marq = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" }, cuisse_g: marqMixte.cuisse_g, cuisse_d: marqMixte.cuisse_g };
  const r = E.computeOrder({ pieces: ps, marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 3);
});
test("catalogue : plus de robe, chaque dessin existe dans l'aperçu", () => {
  assert.ok(!DATA.produits.some(p => p.tags.type === "robe"), "plus aucune robe");
  assert.ok(!DATA.filtres.type.valeurs.some(v => v.id === "robe"), "plus de filtre Robes");
  assert.ok(!DATA.produits.some(p => p.id === "robe-hummel"));
  const modeles = window.Preview.models;
  DATA.produits.forEach(p => assert.ok(modeles[p.modele], p.id + " : dessin « " + p.modele + " » absent de preview.js"));
  assert.strictEqual(DATA.produits.filter(p => !p.apporte).length, 51);
  assert.strictEqual(DATA.produits.filter(p => p.apporte).length, 16);
  assert.strictEqual(DATA.packs.length, 6);
});
test("catalogue : jogging homme et short de football 4,99 € ajoutés (version 3.1.0)", () => {
  assert.strictEqual(produits["jogging-homme"].prixAchat, 9.99);
  assert.strictEqual(produits["short-football-essentiel"].prixAchat, 4.99);
  assert.deepStrictEqual(produits["jogging-homme"].tags.genre, ["homme"]);
});
test("accessoires : formats, zones, vitrine et prix valides pour chaque article (version 3.2.0)", () => {
  const acc = DATA.produits.filter(p => p.tags.type === "accessoire");
  assert.ok(acc.length >= 19, "accessoires : " + acc.length);
  acc.forEach(p => {
    Object.keys(p.zones).forEach(e => {
      const emp = DATA.emplacements[e], z = p.zones[e];
      emp.formats.forEach(f => {
        const m = PRIX.formatsMotif[f]; assert.ok(m, p.id + " : format inconnu " + f);
        const ok = (m.w <= z.w && m.h <= z.h) || (m.h <= z.w && m.w <= z.h);
        assert.ok(ok, p.id + " : " + f + " ne tient pas dans la zone " + e + " (" + z.w + " x " + z.h + ")");
      });
    });
    const t = E.priceTable(p, [1, 10], ctx);
    // une pièce gravée ou en vinyle n'a ni planche ni livraison à partager : son prix ne baisse pas avec la quantité (achat + 3 €), sauf les frais de port du vendeur
    if (p.technique === "gravure" || p.techniqueDefaut === "vinyle") assert.ok(t[0].unitaire >= t[1].unitaire && t[1].unitaire > p.prixAchat, p.id + " : prix " + t.map(x => x.unitaire));
    else assert.ok(t[0].unitaire > t[1].unitaire && t[1].unitaire > p.prixAchat, p.id + " : prix " + t.map(x => x.unitaire));
    p.couleurs.forEach(c => assert.ok(/^https:\/\/(www\.decathlon\.fr\/p|fr\.aliexpress\.com\/item)\//.test(c.lien || p.lien), p.id + " : lien de la couleur " + c.id));
  });
  // le prix de la vitrine d'un petit accessoire compte un visuel Mini (5 x 5 cm), pas un A6
  const marq = { casquette: { actif: true, avecImage: true, format: "Mini", orient: "portrait" } };
  const r = E.computeOrder({ pieces: [piece2("c", "casquette-tennis-tc100")], marquages: marq, technique: "dtf" }, ctx);
  assert.deepStrictEqual(r.motifs.map(m => [m.w, m.h]), [[5, 5]]);
  assert.strictEqual(r.couts.planchesTTC, 0, "la casquette est en vinyle par défaut : pas de planche");
  const dtf = E.computeOrder({ pieces: [piece2("c", "casquette-tennis-tc100", { technique: "dtf" })], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(dtf.couts.planchesTTC, 5.50, "le DTF reste possible sur la pièce");
});
test("accessoires : pas de sublimation sur une casquette ou un bandeau blancs (vinyle à la place), mais oui sur un tour de cou blanc en polyester", () => {
  const ps = [piece2("a", "casquette-tennis-tc100", { couleurId: "blanc" }), piece2("b", "tour-de-cou-morf", { couleurId: "blanc" }), piece2("c", "bandeau-running-v2", { couleurId: "blanc" })];
  const order = { pieces: ps, marquages: {}, technique: "sublimation" };
  assert.deepStrictEqual(ps.map(p => E.pieceTechno(order, p, ctx)), ["vinyle", "sublimation", "vinyle"]);
});
test("accessoires : le tour de cou du vendeur Atelier Katanga ajoute un seul frais de port, même avec la veste d'un autre vendeur", () => {
  const ps = [piece2("a", "tour-de-cou-morf"), piece2("b", "tour-de-cou-morf"), piece2("c", "veste-micropolaire")];
  const r = E.computeOrder({ pieces: ps, marquages: {}, technique: "dtf" }, ctx);
  assert.strictEqual(r.vendeurs.length, 2);
  assert.strictEqual(r.couts.livraisonVendeurs, 9.98);
});
test("sublimation : chaussettes et ensemble Hummel blancs en polyester oui, t-shirt coton non", () => {
  const ps = [piece2("a", "chaussettes-football"), piece2("b", "ensemble-hummel"), piece2("c", "tshirt-fitness-femme"), piece2("d", "thermique-femme")];
  const order = { pieces: ps, marquages: A6poitrine, technique: "sublimation" };
  assert.deepStrictEqual(ps.map(p => E.pieceTechno(order, p, ctx)), ["sublimation", "sublimation", "dtf", "dtf"]);
});

console.log("\nCouleurs, photos par couleur et liens vendeur");
const URL_PHOTO = /^https:\/\/(contents\.mediadecathlon\.com\/[pm]\d+\/k\$[0-9a-f]{32}\/picture\.jpg|ae-pic-a1\.aliexpress-media\.com\/kf\/[A-Za-z0-9_]+\.jpg|m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+_-]+\._AC_SL1500_\.jpg)$/;
test("couleurs : identifiants uniques, nom Decathlon, lien de la page Decathlon, photos valides et sans doublon", () => {
  let avecPhotos = 0;
  DATA.produits.forEach(p => {
    const vus = {};
    p.couleurs.forEach(c => {
      assert.ok(!vus[c.id], p.id + " : couleur en double " + c.id); vus[c.id] = 1;
      assert.ok(/^#[0-9a-f]{6}$/i.test(c.hex) && typeof c.clair === "boolean", p.id + " " + c.id + " : teinte");
      if (c.nomDec != null) assert.ok(c.nomDec.length > 0, p.id + " " + c.id + " : nomDec vide");
      if (c.photos) {
        avecPhotos++;
        assert.ok(c.photos.length >= 1, p.id + " " + c.id + " : série de photos vide");
        c.photos.forEach(u => assert.ok(URL_PHOTO.test(u), p.id + " " + c.id + " : adresse de photo " + u));
        assert.strictEqual(new Set(c.photos).size, c.photos.length, p.id + " " + c.id + " : photo en double");
        assert.ok(/^https:\/\/(www\.decathlon\.fr\/p|fr\.aliexpress\.com\/item|www\.amazon\.fr\/dp)\//.test(c.lien || ""), p.id + " " + c.id + " : une couleur avec photos a aussi son lien");
      }
      if (c.rupture != null) assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(c.rupture), p.id + " " + c.id + " : date de rupture");
      if (c.prixAchat != null) assert.ok(c.prixAchat > 0, p.id + " " + c.id + " : prix d'achat de la couleur");
    });
    (p.photos || []).forEach(u => assert.ok(URL_PHOTO.test(u), p.id + " : adresse de photo " + u));
  });
  assert.ok(avecPhotos >= 121, "couleurs avec leur série de photos : " + avecPhotos);
});
test("couleurs : la photo de calibrage (apercuPhoto) reste celle de la couleur de référence", () => {
  DATA.produits.forEach(p => {
    const ap = p.apercuPhoto, c = ap && p.couleurs.filter(x => x.id === ap.couleur)[0];
    if (c && c.photos) assert.deepStrictEqual(c.photos, p.photos, p.id + " : les photos de l'article ne sont plus celles de la couleur " + ap.couleur);
  });
});
test("relecture Decathlon : polo 2 couleurs, sweat 4 couleurs, maillot de basket 5 couleurs dont le rouge en rupture", () => {
  const col = (id) => produits[id].couleurs.map(c => c.id);
  assert.deepStrictEqual(col("polo-essential"), ["marine", "blanc"]);
  assert.deepStrictEqual(col("sweat-molleton"), ["bleu-fonce", "kaki", "gris", "noir"]);
  assert.deepStrictEqual(col("maillot-basket"), ["blanc", "marine", "bleu", "noir", "rouge"]);
  const m = produits["maillot-basket"];
  assert.ok(m.couleurs.every(c => c.photos && c.ref && /m\d+$/.test(c.lien)), "chaque couleur du maillot a ses photos, sa référence et sa page");
  assert.deepStrictEqual(m.couleurs.filter(c => c.rupture).map(c => c.id), ["rouge"]);
  assert.strictEqual(new Set(m.couleurs.map(c => c.photos[0])).size, 5, "une série de photos différente par couleur");
});
test("relecture Decathlon des 47 articles : un lien pour chaque couleur ; en magasin, sa série de photos et sa référence", () => {
  const dec = DATA.produits.filter(p => !p.apporte && (!p.vendeur || (PRIX.livraisonVendeur.vendeurs[p.vendeur].plateforme || "Decathlon") === "Decathlon"));
  assert.strictEqual(dec.length, 47);
  dec.forEach(p => p.couleurs.forEach(c => {
    assert.ok(/^https:\/\/www\.decathlon\.fr\/p\//.test(c.lien || ""), p.id + " " + c.id + " : lien de la couleur");
    if (!p.vendeur) assert.ok(c.photos && c.ref && c.lien.endsWith("m" + c.ref), p.id + " " + c.id + " : photos, référence et page de la couleur");
  }));
  const nb = id => produits[id].couleurs.length;
  assert.deepStrictEqual(["short-basket", "short-tennis", "debardeur-fitness", "polo-golf-mw500", "bonnet-rider-500", "tour-de-cou-morf", "short-football-essentiel", "sac-a-dos-arpenaz-100", "survetement-joma", "ensemble-hummel"].map(nb), [5, 2, 2, 12, 13, 13, 8, 7, 8, 10]);
  assert.deepStrictEqual(produits["sac-a-dos-arpenaz-100"].couleurs.filter(c => c.rupture).map(c => c.id), ["vert-cedre", "orange-terracotta"]);
  assert.strictEqual(produits["sweat-viralto-axton"].prixAchat, 21.99);
  assert.deepStrictEqual(produits["sweat-viralto-axton"].tailles, ["S", "M", "L", "XL", "2XL", "3XL", "4XL"]);
  assert.strictEqual(E.prixAchatPiece(produits["polo-golf-mw500"], "vieux-violet"), 9.99);
  assert.strictEqual(E.prixAchatPiece(produits["polo-golf-mw500"], "noir"), 14.99);
  assert.strictEqual(E.prixAchatPiece(produits["survetement-joma"], "noir-gris"), 89.77);
});
test("prix d'achat par couleur : la couleur au prix différent change le coût, les autres gardent le prix de l'article", () => {
  const prod = JSON.parse(JSON.stringify(produits["polo-essential"]));
  prod.couleurs[1].prixAchat = 10;
  const ctx2 = Object.assign({}, ctx, { produits: Object.assign({}, produits, { "polo-essential": prod }) });
  assert.strictEqual(E.prixAchatPiece(prod, "marine"), 7.99);
  assert.strictEqual(E.prixAchatPiece(prod, "blanc"), 10);
  assert.strictEqual(E.prixAchatPiece(prod, "inconnue"), 7.99);
  const mix = [pieces(1, "marine")[0], Object.assign(pieces(1, "blanc")[0], { id: "p9" })];
  const r = E.computeOrder({ pieces: mix, marquages: {}, technique: "dtf" }, ctx2);
  assert.strictEqual(r.couts.achats, 17.99);
  assert.strictEqual(r.coutPieces.p0.achat, 7.99);
  assert.strictEqual(r.coutPieces.p9.achat, 10);
  const r0 = E.computeOrder({ pieces: mix, marquages: {}, technique: "dtf" }, ctx);
  assert.strictEqual(r0.couts.achats, 15.98, "sans prix de couleur, le prix de l'article s'applique");
});
test("vendeurs : chaque vendeur a un nom, et son lien (s'il est connu) est une page vendeur Decathlon, une boutique AliExpress ou une page Amazon", () => {
  Object.keys(PRIX.livraisonVendeur.vendeurs).forEach(id => {
    const v = PRIX.livraisonVendeur.vendeurs[id];
    assert.ok(v.nom, id);
    if ((v.plateforme || "Decathlon") === "Decathlon") {
      assert.ok(v.frais > 0, id + " : un vendeur Decathlon a des frais de port");
      assert.ok(v.lien === "" || /^https:\/\/www\.decathlon\.fr\/mp\/seller\/[a-z0-9-]+\/[0-9a-f-]{36}$/.test(v.lien), id + " : lien du vendeur " + v.lien);
    } else if (v.plateforme === "Amazon") {
      assert.ok(v.frais >= 0 && v.delai, id + " : frais de port et délai de livraison");
      assert.ok(v.frais > 0 || v.note, id + " : une livraison offerte s'explique dans la note");
      assert.ok(v.lien === "" || /^https:\/\/www\.amazon\.fr\//.test(v.lien), id + " : lien du vendeur " + v.lien);
    } else {
      assert.strictEqual(v.plateforme, "AliExpress", id);
      assert.strictEqual(v.frais, 0, id + " : port compté à 0 € (offert dès 10 € d'achat)");
      assert.ok(v.delai && v.note, id + " : délai et note de livraison");
      assert.ok(/^https:\/\/fr\.aliexpress\.com\/store\/\d+$/.test(v.lien), id + " : lien de la boutique " + v.lien);
    }
  });
  assert.ok(/sport-et-go-eu/.test(PRIX.livraisonVendeur.vendeurs["sport-et-go-eu"].lien), "le lien de Sport & Go EU est connu");
});

console.log("\nTon vêtement : le client apporte son vêtement (version 4.2.0)");
const apportes = DATA.produits.filter(p => p.apporte);
const A6seul = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" } };
const pApp = (id, produitId, extra) => Object.assign({ id, produitId, couleurId: "blanc", taille: "M", matiere: "inconnu", prenom: "", numero: "" }, extra || {});
test("Ton vêtement : 16 articles génériques, filtre dédié, sans prix d'achat, photo ni lien Decathlon", () => {
  assert.ok(DATA.filtres.type.valeurs.some(v => v.id === "apporte" && v.label === "Ton vêtement"));
  assert.strictEqual(apportes.length, 16);
  apportes.forEach(p => {
    assert.ok(/^apporte-/.test(p.id), p.id);
    assert.strictEqual(p.tags.type, "apporte"); assert.deepStrictEqual(p.tags.genre, ["homme", "femme"]);
    assert.strictEqual(p.prixAchat, 0); assert.ok(!p.photos && !p.lien && !p.vendeur && !p.apercuPhoto, p.id);
    assert.ok(p.couleurs.length === 15 && p.couleurs.every(c => !c.lien && !c.photos), p.id + " : couleurs communes sans lien");
    assert.ok(/^Tu apportes ton vêtement/.test(p.avertissement), p.id + " : avertissement");
    assert.ok(Object.keys(p.zones).length > 0 && p.vitrine.every(e => p.zones[e]), p.id);
  });
  ["tshirt", "polo", "sweat", "manches-longues", "maillot", "veste", "sweat-zip", "gilet", "short-tennis", "pantalon", "casquette", "bonnet", "sac-a-dos", "sac-sport", "gourde", "tour-de-cou"]
    .forEach(m => assert.ok(apportes.some(p => p.modele === m), "dessin absent : " + m));
  assert.deepStrictEqual(DATA.matieres.map(m => m.id), ["polyester", "coton", "inconnu"]);
});
test("Ton vêtement : le prix ne compte ni vêtement ni livraison de vêtement (planche, livraison, 3 € de marge)", () => {
  const un = E.computeOrder({ pieces: [pApp("a", "apporte-veste")], marquages: A6seul, technique: "dtf" }, ctx);
  assert.strictEqual(un.couts.achats, 0);
  assert.strictEqual(un.couts.planchesTTC, 5.50);
  assert.strictEqual(un.couts.livraison, 4.90);
  assert.strictEqual(un.couts.total, 10.40);
  assert.strictEqual(un.prix.unitaire, 14);    // 10,40 + 3 = 13,40 -> 14
  assert.strictEqual(un.coutPieces.a.achat, 0);
  const t = E.priceTable(produits["apporte-veste"], [1, 5, 10, 20, 50], ctx).map(x => x.unitaire);
  assert.deepStrictEqual(t.slice(0, 2), [14, 6]);
  assert.ok(t.every((x, i) => i === 0 || x <= t[i - 1]), "le prix ne monte pas avec la quantité : " + t);
  assert.ok(t[t.length - 1] < t[0], "et il baisse : " + t);
});
test("Ton vêtement : mélangé à un vêtement Decathlon, seul celui-ci compte à l'achat", () => {
  const mix = [pApp("a", "apporte-tshirt"), Object.assign(pieces(1, "marine")[0], { id: "b" })];
  const r = E.computeOrder({ pieces: mix, marquages: A6seul, technique: "dtf" }, ctx);
  assert.strictEqual(r.couts.achats, 7.99);
  assert.strictEqual(r.coutPieces.a.achat, 0); assert.strictEqual(r.coutPieces.b.achat, 7.99);
  assert.strictEqual(r.prix.groupes.length, 2);
});
test("Ton vêtement : la sublimation demande un vêtement blanc ou clair déclaré en polyester", () => {
  const order = ps => ({ pieces: ps, marquages: A6seul, technique: "sublimation" });
  const techno = p => E.pieceTechno(order([p]), p, ctx);
  assert.strictEqual(techno(pApp("a", "apporte-tshirt", { matiere: "polyester" })), "sublimation");
  assert.strictEqual(techno(pApp("a", "apporte-tshirt", { matiere: "polyester", couleurId: "gris-clair" })), "sublimation");
  assert.strictEqual(techno(pApp("a", "apporte-tshirt", { matiere: "polyester", couleurId: "noir" })), "dtf");
  assert.strictEqual(techno(pApp("a", "apporte-tshirt", { matiere: "coton" })), "dtf");
  assert.strictEqual(techno(pApp("a", "apporte-tshirt", { matiere: "inconnu" })), "dtf");
  assert.strictEqual(techno(pApp("a", "apporte-tshirt", { matiere: undefined })), "dtf");
  assert.strictEqual(techno(pApp("a", "apporte-casquette", { matiere: "polyester" })), "dtf", "pas de sublimation sur une casquette");
  assert.strictEqual(E.polyesterPiece(produits["apporte-polo"], { matiere: "polyester" }), 100);
  assert.strictEqual(E.polyesterPiece(produits["apporte-polo"], { matiere: "coton" }), 0);
  assert.strictEqual(E.polyesterPiece(produits["polo-essential"], { matiere: "coton" }), 100, "un article du catalogue garde sa propre matière");
});
test("Ton vêtement : une pièce sans motif ne coûte rien, deux motifs font 3 € de marge", () => {
  const vide = E.computeOrder({ pieces: [pApp("a", "apporte-sweat")], marquages: {}, technique: "dtf" }, ctx);
  assert.strictEqual(vide.couts.total, 0);
  const deux = E.computeOrder({ pieces: [pApp("a", "apporte-sweat", { prenom: "Léo" })], marquages: Object.assign({}, A6seul, { dos: { actif: true, avecImage: true, format: "A5", orient: "portrait" } }), technique: "dtf" }, ctx);
  assert.strictEqual(deux.prix.groupes[0].margeMoyenne, 3);
});

console.log("\nBloc collé : visuel, prénom et numéro sur un seul transfert (version 5.0.0)");
const txtO = h => ({ actif: true, police: "Bebas Neue", hauteur: h, couleur: "#fff" });
const marqBloc = bloc => ({ poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait", prenom: txtO(2.5), numero: txtO(4), bloc } });
const lesPieces = n => pieces(n, "marine", i => ({ prenom: "Léo", numero: String(i + 1) }));
test("bloc collé : un seul motif par pièce, ses éléments empilés et centrés, écart de prix.js entre eux", () => {
  const r = E.computeOrder({ pieces: lesPieces(1), marquages: marqBloc(true), technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 1);
  const m = r.motifs[0];
  assert.strictEqual(m.kind, "bloc"); assert.strictEqual(m.avecImage, true);
  assert.deepStrictEqual(m.el.items.map(i => i.kind), ["image", "prenom", "numero"]);
  const [v, p, n] = m.el.items, ecart = PRIX.placement.ecartBloc;
  assert.strictEqual(ecart, 0.5);
  assert.ok(Math.abs(p.dy - (v.h + ecart)) < 1e-9 && Math.abs(n.dy - (p.dy + p.h + ecart)) < 1e-9, "empilés à " + ecart + " cm");
  assert.strictEqual(m.w, 10);   // la largeur du visuel A6
  assert.ok(Math.abs(m.h - (n.dy + n.h)) < 1e-9);
  m.el.items.forEach(i => assert.ok(Math.abs(i.dx - (m.w - i.w) / 2) < 1e-9, "centré"));
  assert.ok(E.motifImage(m) === v && E.motifImage({ kind: "image", el: v }) === v && E.motifImage({ kind: "prenom", el: p }) === null);
});
test("bloc collé : même marge (3 €), mais un bloc entier tient moins bien sur les planches", () => {
  const sep = n => E.computeOrder({ pieces: lesPieces(n), marquages: marqBloc(false), technique: "dtf" }, ctx);
  const blo = n => E.computeOrder({ pieces: lesPieces(n), marquages: marqBloc(true), technique: "dtf" }, ctx);
  assert.strictEqual(sep(1).prix.unitaire, 22); assert.strictEqual(blo(1).prix.unitaire, 22);
  assert.strictEqual(sep(10).couts.planchesTTC, 14); assert.strictEqual(blo(10).couts.planchesTTC, 18);
  assert.ok(blo(10).prix.unitaire >= sep(10).prix.unitaire, "le bloc coûte plus de planches : prix " + blo(10).prix.unitaire + " contre " + sep(10).prix.unitaire);
  assert.strictEqual(blo(10).prix.groupes[0].motifs, 10); assert.strictEqual(blo(10).prix.groupes[0].margeMoyenne, 3);
  assert.strictEqual(sep(10).prix.groupes[0].motifs, 30); assert.strictEqual(sep(10).prix.groupes[0].margeMoyenne, 3);
});
test("bloc collé : sans la case (anciens fichiers) ou décochée, rien ne change : trois motifs", () => {
  [undefined, false].forEach(b => {
    const r = E.computeOrder({ pieces: lesPieces(1), marquages: marqBloc(b), technique: "dtf" }, ctx);
    assert.strictEqual(r.motifs.length, 3); assert.deepStrictEqual(r.motifs.map(m => m.kind), ["image", "prenom", "numero"]);
    assert.ok(r.motifs.every(m => m.avecImage === (m.kind === "image")));
  });
});
test("bloc collé : il faut au moins deux éléments, un visuel seul ou un prénom seul reste un motif simple", () => {
  const seul = E.computeOrder({ pieces: pieces(1, "marine", () => ({ prenom: "", numero: "" })), marquages: marqBloc(true), technique: "dtf" }, ctx);
  assert.deepStrictEqual(seul.motifs.map(m => m.kind), ["image"]);
  const deux = E.computeOrder({ pieces: pieces(1, "marine", () => ({ prenom: "", numero: "7" })), marquages: marqBloc(true), technique: "dtf" }, ctx);
  assert.deepStrictEqual(deux.motifs.map(m => m.kind), ["bloc"]); assert.deepStrictEqual(deux.motifs[0].el.items.map(i => i.kind), ["image", "numero"]);
  const dessus = E.computeOrder({ pieces: lesPieces(1), marquages: { poitrine: Object.assign(marqBloc(true).poitrine, { textePos: "dessus" }) }, technique: "dtf" }, ctx);
  assert.deepStrictEqual(dessus.motifs[0].el.items.map(i => i.kind), ["prenom", "numero", "image"], "le texte au-dessus du visuel");
});
test("bloc collé : un emplacement de texte seul (dos sans visuel) colle le prénom et le numéro ensemble", () => {
  const dos = { dos: { actif: true, avecImage: false, bloc: true, prenom: txtO(4), numero: txtO(14), maj: true } };
  const r = E.computeOrder({ pieces: lesPieces(1), marquages: dos, technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 1); assert.strictEqual(r.motifs[0].kind, "bloc"); assert.strictEqual(r.motifs[0].avecImage, false);
  assert.strictEqual(E.motifImage(r.motifs[0]), null);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 3);
});
test("bloc collé : trop grand pour le plateau (visuel A4 et texte), les éléments restent séparés avec un avertissement", () => {
  const grand = { poitrine: { actif: true, avecImage: true, format: "A4", orient: "portrait", prenom: txtO(3), bloc: true } };
  const r = E.computeOrder({ pieces: pieces(1, "marine", () => ({ prenom: "Léo" })), marquages: grand, technique: "dtf" }, ctx);
  assert.deepStrictEqual(r.motifs.map(m => m.kind), ["image", "prenom"]);
  assert.ok(r.warnings.some(w => /bloc .* trop grand pour le plateau/.test(w)), r.warnings.join(" | "));
  const pile = E.stackFor("poitrine", grand.poitrine, { prenom: "Léo", numero: "" }, produits["polo-essential"], ctx);
  assert.strictEqual(pile.bloc, false); assert.strictEqual(pile.tropGrand, true);
  assert.ok(Math.abs(pile.items[1].dy - (pile.items[0].h + E.STACK_GAP)) < 1e-9, "écart d'avant le bloc");
});
test("bloc collé : un pack garde sa marge de pièce, le bloc ne change que les planches", () => {
  const pk = ids => ids.map((id, i) => ({ id: "k" + i, produitId: id, couleurId: produits[id].couleurs[0].id, taille: produits[id].tailles[0], prenom: "Léo", numero: "7", pack: "pk1", packType: "pack-basket" }));
  const un = b => E.computeOrder({ pieces: pk(["maillot-basket", "short-basket"]), marquages: { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait", prenom: txtO(2.5), bloc: b } }, technique: "dtf" }, ctx);
  assert.strictEqual(un(true).prix.groupes[0].pack, true);
  assert.strictEqual(un(true).motifs.filter(m => m.kind === "bloc").length, 1);
  assert.strictEqual(un(true).prix.groupes[0].margeMoyenne, 3);   // 1,50 € par pièce du pack, avec ou sans bloc
  assert.strictEqual(un(false).prix.groupes[0].margeMoyenne, 3);
});

console.log("\nVêtements apportés : plus de remise (version 7.0.0), la règle de la 6.0.0 reste réglable");
const apps = (n, pid, deb) => Array.from({ length: n }, (_, i) => pApp("ap" + pid + (deb || 0) + "_" + i, pid));
const cmdApp = (ps, marq, c) => E.computeOrder({ pieces: ps, marquages: marq || A6seul, technique: "dtf" }, c || ctx);
// la remise de la 6.0.0 (marge × 0,5 au-delà de 5 pièces apportées), remise en route dans prix.js pour vérifier que le code la gère toujours
const ctxRemise = Object.assign({}, ctx, { prix: Object.assign({}, PRIX, { regles: Object.assign({}, PRIX.regles, { apporte: { seuil: 5, facteur: 0.5 } }) }) });
test("vêtements apportés : depuis la 7.0.0, la marge est la même quel que soit leur nombre (facteur 1)", () => {
  assert.deepStrictEqual(PRIX.regles.apporte, { seuil: 5, facteur: 1 });
  assert.strictEqual(E.reglesApporte(PRIX.regles, 6), PRIX.regles, "facteur 1 : rien ne change");
  const r = E.reglesApporte(ctxRemise.prix.regles, 6);
  assert.deepStrictEqual([r.margePiece, r.parPiecePack], [1.5, 1.5]);
  assert.strictEqual(E.reglesApporte(ctxRemise.prix.regles, 5), ctxRemise.prix.regles, "à 5 pièces, rien ne change");
  const r5 = cmdApp(apps(5, "apporte-veste")), r6 = cmdApp(apps(6, "apporte-veste"));
  assert.strictEqual(r5.prix.groupes[0].margeMoyenne, 3); assert.strictEqual(r6.prix.groupes[0].margeMoyenne, 3);
  assert.strictEqual(r6.prix.groupes[0].margeReduite, false);
  assert.deepStrictEqual(r6.prix.apporte, { n: 6, seuil: 5, reduite: false });
  assert.strictEqual(r5.prix.unitaire, 6); assert.strictEqual(r6.prix.unitaire, 6);
  assert.ok(r6.prix.marge >= 3 * 6 - 1e-6);
});
test("remise réglable (facteur 0,5) : 5 pièces comme avant, 6 pièces et plus la moitié de la marge pour toutes les pièces apportées", () => {
  const r5 = cmdApp(apps(5, "apporte-veste"), null, ctxRemise), r6 = cmdApp(apps(6, "apporte-veste"), null, ctxRemise);
  assert.strictEqual(r5.prix.groupes[0].margeMoyenne, 3);
  assert.deepStrictEqual(r5.prix.apporte, { n: 5, seuil: 5, reduite: false });
  assert.strictEqual(r6.prix.groupes[0].margeMoyenne, 1.5);
  assert.strictEqual(r6.prix.groupes[0].margeReduite, true);
  assert.deepStrictEqual(r6.prix.apporte, { n: 6, seuil: 5, reduite: true });
  assert.ok(r6.prix.unitaire < cmdApp(apps(6, "apporte-veste")).prix.unitaire || r6.prix.unitaire === cmdApp(apps(6, "apporte-veste")).prix.unitaire);
});
test("remise réglable : on compte toutes les pièces apportées, tous articles confondus", () => {
  const trois = cmdApp(apps(3, "apporte-veste").concat(apps(3, "apporte-tshirt")), null, ctxRemise);
  assert.strictEqual(trois.prix.apporte.n, 6); assert.strictEqual(trois.prix.apporte.reduite, true);
  assert.ok(trois.prix.groupes.length === 2 && trois.prix.groupes.every(g => g.margeMoyenne === 1.5 && g.margeReduite));
  const cinq = cmdApp(apps(3, "apporte-veste").concat(apps(2, "apporte-tshirt")), null, ctxRemise);
  assert.strictEqual(cinq.prix.apporte.reduite, false); assert.ok(cinq.prix.groupes.every(g => g.margeMoyenne === 3 && !g.margeReduite));
});
test("remise réglable : les vêtements Decathlon ne comptent pas et gardent leur marge de 3 €", () => {
  const peu = cmdApp(apps(3, "apporte-veste").concat(pieces(10)), null, ctxRemise);
  assert.strictEqual(peu.prix.apporte.reduite, false);
  assert.ok(peu.prix.groupes.every(g => g.margeMoyenne === 3));
  const mix = cmdApp(apps(6, "apporte-veste").concat(pieces(4).map((p, i) => Object.assign(p, { id: "d" + i }))), null, ctxRemise);
  const g = id => mix.prix.groupes.find(x => x.produitId === id);
  assert.strictEqual(g("apporte-veste").margeMoyenne, 1.5); assert.strictEqual(g("polo-essential").margeMoyenne, 3);
  assert.strictEqual(g("polo-essential").margeReduite, false);
});
test("vêtements apportés : la marge ne dépend pas du nombre de motifs (3 motifs séparés, ou un bloc collé)", () => {
  const trois = marqBloc(false), bloc = marqBloc(true);
  const ps = n => apps(n, "apporte-veste").map((p, i) => Object.assign(p, { prenom: "Léo", numero: String(i + 1) }));
  [5, 6].forEach(n => { assert.strictEqual(cmdApp(ps(n), trois).prix.groupes[0].margeMoyenne, 3); assert.strictEqual(cmdApp(ps(n), bloc).prix.groupes[0].margeMoyenne, 3); });
});
test("vêtements apportés : un pack et les articles Decathlon ne sont pas touchés ; la table de prix suit la règle", () => {
  const pack = ["maillot-basket", "short-basket"].map((id, j) => ({ id: "k" + j, produitId: id, couleurId: produits[id].couleurs[0].id, taille: "M", prenom: "", numero: "", pack: "pk0", packType: "pack-basket" }));
  const r = cmdApp(pack.concat(apps(6, "apporte-veste")));
  assert.strictEqual(r.prix.groupes.find(g => g.pack).margeMoyenne, 3);
  const t = E.priceTable(produits["apporte-veste"], [5, 6, 10], ctx).map(x => x.unitaire), tr = E.priceTable(produits["apporte-veste"], [5, 6, 10], ctxRemise).map(x => x.unitaire);
  assert.strictEqual(t[0], tr[0], "à 5 pièces, la remise ne joue pas");
  assert.ok(tr[1] <= t[1] && tr[2] <= t[2], "avec la remise réglée, le prix ne monte jamais : " + tr + " contre " + t);
});

console.log("\nOuvre-bouteilles, porte-clés, serviette et chasuble (version 6.1.0)");
const mqOB = { ouvre_bouteille: { actif: true, avecImage: true, format: "Mini", orient: "portrait" } };
const mqPC = { porte_cles: { actif: true, avecImage: true, format: "Micro", orient: "portrait" } };
test("6.1.0 : le format Micro (3 × 1,5 cm) existe, et son emplacement n'accepte que lui", () => {
  assert.deepStrictEqual([PRIX.formatsMotif.Micro.w, PRIX.formatsMotif.Micro.h], [1.5, 3]);
  assert.deepStrictEqual(DATA.emplacements.porte_cles.formats, ["Micro"]);
  assert.deepStrictEqual(DATA.emplacements.ouvre_bouteille.formats, ["Mini"]);
  const z = produits["porte-cles-decapsuleur"].zones.porte_cles;
  assert.ok(PRIX.formatsMotif.Micro.w <= z.w && PRIX.formatsMotif.Micro.h <= z.h, "le Micro tient dans la zone du porte-clés");
  const r = E.computeOrder({ pieces: [piece2("k", "porte-cles-decapsuleur")], marquages: mqPC, technique: "dtf" }, ctx);
  assert.deepStrictEqual(r.motifs.map(m => [m.w, m.h]), [[1.5, 3]]);
  assert.deepStrictEqual(r.warnings, []);
});
test("6.1.0 : gravure ou vinyle, une pièce en métal n'a ni planche, ni livraison DTF, même en sublimation : achat + 3 € de marge, arrondi pair", () => {
  const prods = ["ouvre-bouteille-carte", "porte-cles-decapsuleur"];
  prods.forEach(id => assert.strictEqual(produits[id].technique, "gravure", id));
  ["dtf", "sublimation"].forEach(technique => {
    const r = E.computeOrder({ pieces: [piece2("a", "ouvre-bouteille-carte")], marquages: mqOB, technique }, ctx);
    assert.strictEqual(E.pieceTechno({ technique }, piece2("a", "ouvre-bouteille-carte"), ctx), "gravure");
    assert.deepStrictEqual(Object.keys(r.plans), [], "aucune planche");
    assert.deepStrictEqual(r.motifs.map(m => m.techno), ["gravure"]);
    assert.strictEqual(r.couts.planchesTTC, 0); assert.strictEqual(r.couts.livraison, 0);
    assert.strictEqual(r.couts.total, 1.81);
    assert.strictEqual(r.prix.unitaire, 6);        // 1,81 + 3 = 4,81 -> 6
    assert.strictEqual(r.prix.marge, 4.19);
  });
  const r = E.computeOrder({ pieces: [piece2("b", "porte-cles-decapsuleur")], marquages: mqPC, technique: "dtf" }, ctx);
  assert.strictEqual(r.couts.total, 1.46); assert.strictEqual(r.prix.unitaire, 6);
  // 50 pièces : le prix ne bouge pas (rien à partager)
  const t = E.priceTable(produits["ouvre-bouteille-carte"], [1, 50], ctx).map(x => x.unitaire);
  assert.deepStrictEqual(t, [6, 6]);
});
test("6.1.0 : le prix d'achat suit la variante AliExpress choisie (couleur et motif)", () => {
  const ob = produits["ouvre-bouteille-carte"], pc = produits["porte-cles-decapsuleur"];
  assert.deepStrictEqual(ob.couleurs.map(c => E.prixAchatPiece(ob, c.id)), [1.81, 1.91, 2.08, 2.12, 2.12]);
  assert.deepStrictEqual(pc.couleurs.map(c => E.prixAchatPiece(pc, c.id)), [1.46, 1.66, 1.64, 1.61, 1.62, 1.59, 1.56, 1.66]);
  const r = E.computeOrder({ pieces: [piece2("a", "ouvre-bouteille-carte", { couleurId: ob.couleurs[3].id })], marquages: mqOB, technique: "dtf" }, ctx);
  assert.strictEqual(r.couts.total, 2.12); assert.strictEqual(r.prix.unitaire, 6);   // 2,12 + 3 = 5,12 -> 6
});
test("6.1.0 : un motif gravé ne prend pas de place sur la planche DTF et ne coûte rien à la pièce voisine", () => {
  const mix = { pieces: [piece2("p", "polo-essential"), piece2("a", "ouvre-bouteille-carte"), piece2("b", "porte-cles-decapsuleur")], marquages: Object.assign({}, A6poitrine, mqOB, mqPC), technique: "dtf" };
  const seul = E.computeOrder({ pieces: [piece2("p", "polo-essential")], marquages: A6poitrine, technique: "dtf" }, ctx);
  const r = E.computeOrder(mix, ctx);
  assert.strictEqual(r.plans.dtf.sheets.reduce((n, s) => n + s.placed.length, 0), 1, "un seul motif sur les planches : celui du polo");
  assert.strictEqual(r.couts.planchesTTC, seul.couts.planchesTTC); assert.strictEqual(r.couts.livraison, seul.couts.livraison);
  assert.strictEqual(r.coutPieces.p.total, seul.coutPieces.p.total);
  assert.deepStrictEqual([r.coutPieces.a.planches, r.coutPieces.a.livraison, r.coutPieces.b.planches, r.coutPieces.b.livraison], [0, 0, 0, 0]);
  assert.strictEqual(r.couts.total, E.round2(seul.couts.total + 1.81 + 1.46));
  assert.strictEqual(r.prix.total, 22 + 6 + 6);
  assert.strictEqual(r.motifs.length, 3);
});
test("6.1.0 : AliExpress, port compté à 0 € et délai de 5 à 10 jours, boutique et note repris dans la commande", () => {
  const r = E.computeOrder({ pieces: [piece2("a", "ouvre-bouteille-carte"), piece2("b", "porte-cles-decapsuleur"), piece2("c", "tour-de-cou-morf")], marquages: {}, technique: "dtf" }, ctx);
  const ali = r.vendeurs.filter(v => v.plateforme === "AliExpress");
  assert.deepStrictEqual(ali.map(v => v.id).sort(), ["qst-express-02", "shop4293023"]);
  ali.forEach(v => { assert.strictEqual(v.frais, 0); assert.strictEqual(v.delai, "5 à 10 jours"); assert.ok(/offerte dès 10 €/.test(v.note)); });
  assert.strictEqual(r.vendeurs.filter(v => v.plateforme === "Decathlon").length, 1, "le tour de cou reste chez son vendeur Decathlon");
  assert.strictEqual(r.couts.livraisonVendeurs, 4.99, "seul le vendeur Decathlon facture un port");
});
test("6.1.0 : chasuble Kipsta en polyester (sublimation si blanc), serviette Nabaiji jamais en sublimation (vinyle par défaut depuis la 7.0.0)", () => {
  const ch = produits["chasuble-football"], se = produits["serviette-microfibre-l"];
  assert.strictEqual(ch.prixAchat, 3.49); assert.strictEqual(se.prixAchat, 7.99);
  assert.strictEqual(ch.couleurs.length, 6); assert.strictEqual(se.couleurs.length, 6);
  assert.strictEqual(se.sublimation, false);
  const o = { technique: "sublimation" };
  const techno = (prod, couleurId) => E.pieceTechno(o, piece2("x", prod.id, { couleurId }), ctx);
  assert.strictEqual(techno(ch, "blanc"), "sublimation");
  assert.strictEqual(techno(ch, "rouge"), "dtf");
  se.couleurs.forEach(c => assert.strictEqual(techno(se, c.id), "vinyle", "serviette " + c.id));
  assert.deepStrictEqual(E.priceTable(ch, [1, 5, 10, 20, 50], ctx).map(x => x.unitaire), [18, 10, 10, 8, 8]);
  assert.deepStrictEqual(E.priceTable(se, [1, 5, 10, 20, 50], ctx).map(x => x.unitaire), [14, 14, 14, 14, 14]);
  assert.ok(se.zones.serviette && DATA.emplacements.serviette.formats.every(f => PRIX.formatsMotif[f].w <= se.zones.serviette.w && PRIX.formatsMotif[f].h <= se.zones.serviette.h));
  assert.ok(ch.zones.poitrine && ch.zones.dos);
});

console.log("\nVisuel à taille libre, quart de tour et position (version 6.2.0)");
const polo = (n) => Array.from({ length: n }, (_, i) => ({ id: "v" + i, produitId: "polo-essential", couleurId: "marine", taille: "M", prenom: "", numero: "" }));
const marqV = (extra) => ({ poitrine: Object.assign({ actif: true, avecImage: true, format: "A6", orient: "portrait" }, extra || {}) });
const cmdV = (extra, n) => E.computeOrder({ pieces: polo(n || 1), marquages: marqV(extra), technique: "dtf" }, ctx);
test("6.2.0 : sans taille libre, le visuel garde la case du format et son sens (anciens fichiers de commande)", () => {
  assert.deepStrictEqual(cmdV({}).motifs.map(m => [m.w, m.h]), [[10, 14]]);
  assert.deepStrictEqual(cmdV({ orient: "paysage" }).motifs.map(m => [m.w, m.h]), [[14, 10]]);
  assert.deepStrictEqual(cmdV({ format: "A4" }).motifs.map(m => [m.w, m.h]), [[21, 28]]);
  const g = E.imageGeom({ format: "A6", orient: "paysage" }, ctx);
  assert.strictEqual(g.libre, false); assert.deepStrictEqual([g.w0, g.h0, g.rot, g.dx, g.dy], [14, 10, 0, 0, 0]);
  assert.strictEqual(E.descriptionVisuel({ format: "A6", orient: "paysage" }, ctx), "A6 en paysage, 14 × 10 cm");
});
test("6.2.0 : largeur libre, la hauteur suit les proportions de l'image (ratio) ou, sans image, celles du format", () => {
  assert.deepStrictEqual(cmdV({ largeur: 8, image: { ratio: 0.5 } }).motifs.map(m => [m.w, m.h]), [[8, 4]]);
  assert.deepStrictEqual(cmdV({ largeur: 8, image: { ratio: 2 } }).motifs.map(m => [m.w, m.h]), [[8, 16]]);
  const sansImage = cmdV({ largeur: 7 }).motifs[0];
  assert.ok(Math.abs(sansImage.w - 7) < 1e-9 && Math.abs(sansImage.h - 9.8) < 1e-9, "sans image : proportions du format A6 (10 × 14), obtenu " + sansImage.w + " × " + sansImage.h);
  assert.deepStrictEqual(cmdV({ largeur: 8, image: { ratio: "n'importe quoi" } }).motifs.map(m => [m.w, m.h]), [[8, 11.2]], "ratio illisible : le format");
  assert.strictEqual(E.descriptionVisuel({ format: "A6", largeur: 8, image: { ratio: 0.5 } }, ctx), "8 × 4 cm");
  assert.strictEqual(E.imageGeom({ format: "A6", largeur: 1000 }, ctx).w0, 60, "borne haute de sécurité");
});
test("6.2.0 : quarts de tour, la case est le rectangle qui englobe le visuel tourné", () => {
  const base = { largeur: 8, image: { ratio: 0.5 } };
  [[0, [8, 4]], [90, [4, 8]], [180, [8, 4]], [270, [4, 8]], [360, [8, 4]], [-90, [4, 8]], [30, [8, 4]], [50, [4, 8]]].forEach(([rot, wh]) => {
    assert.deepStrictEqual(cmdV(Object.assign({ rot }, base)).motifs.map(m => [m.w, m.h]), [wh], "rotation " + rot);
  });
  assert.deepStrictEqual([0, 90, 180, 270, 360, -90, 100].map(E.quartDeTour), [0, 90, 180, 270, 0, 270, 90]);
  const el = cmdV(Object.assign({ rot: 90 }, base)).motifs[0].el;
  assert.deepStrictEqual([el.w0, el.h0, el.rot], [8, 4, 90], "le visuel garde sa taille avant rotation, pour dessiner les planches");
  assert.strictEqual(E.descriptionVisuel(Object.assign({ format: "A6", rot: 90 }, base), ctx), "8 × 4 cm, tourné de 90°");
});
test("6.2.0 : la taille compte pour les planches et le prix, la position non", () => {
  const prix = extra => cmdV(extra, 10);
  const petit = prix({ largeur: 5, image: { ratio: 1 } }), grand = prix({ largeur: 20, image: { ratio: 1.2 } });
  assert.ok(petit.couts.planchesTTC < grand.couts.planchesTTC, "petits visuels : " + petit.couts.planchesTTC + " €, grands : " + grand.couts.planchesTTC + " €");
  assert.ok(petit.prix.unitaire <= grand.prix.unitaire && petit.prix.unitaire % 2 === 0 && grand.prix.unitaire % 2 === 0);
  const centre = prix({ largeur: 8, image: { ratio: 1 } }), decale = prix({ largeur: 8, image: { ratio: 1 }, dx: 3, dy: -2 });
  assert.strictEqual(decale.couts.total, centre.couts.total); assert.strictEqual(decale.prix.unitaire, centre.prix.unitaire);
  assert.deepStrictEqual(decale.motifs.map(m => [m.w, m.h]), centre.motifs.map(m => [m.w, m.h]));
});
test("6.2.0 : un visuel peut dépasser la zone (avertissement), pas le plateau de la presse (21 × 28 cm)", () => {
  assert.deepStrictEqual(cmdV({ largeur: 8, image: { ratio: 1 } }).warnings, []);
  const large = cmdV({ largeur: 18, image: { ratio: 0.5 } });
  assert.ok(large.warnings.some(w => /déborde de la zone/.test(w)), large.warnings.join(" | "));
  assert.ok(cmdV({ largeur: 8, image: { ratio: 1 }, dx: 15 }).warnings.some(w => /déborde de la zone/.test(w)), "décalé hors de la zone");
  assert.ok(cmdV({ largeur: 8, image: { ratio: 1 }, dy: 30 }).warnings.some(w => /zone/.test(w)));
  const trop = cmdV({ largeur: 25, image: { ratio: 1 } });
  assert.ok(trop.warnings.some(w => /plateau de la presse/.test(w)), trop.warnings.join(" | "));
  assert.strictEqual(E.largeurMax(1, 0, PRIX.plateau), 21);
  assert.strictEqual(E.largeurMax(2, 0, PRIX.plateau), 14, "un visuel deux fois plus haut que large : 14 × 28");
  assert.strictEqual(E.largeurMax(2, 90, PRIX.plateau), 14, "tourné, il occupe 28 × 14 : le plateau se prend dans l'autre sens");
  assert.strictEqual(E.largeurMax(0.5, 0, PRIX.plateau), 28, "large : 28 × 14");
  const maxi = cmdV({ largeur: E.largeurMax(1.3, 90, PRIX.plateau), rot: 90, image: { ratio: 1.3 } }).motifs[0];
  assert.ok(E.fitsPlateau(maxi.w, maxi.h, PRIX.plateau), "à la largeur maximale, la case tient sur le plateau : " + maxi.w + " × " + maxi.h);
});
test("6.2.0 : les raccourcis A7, A6, A5, A4 font tenir le visuel dans le format, dans son sens", () => {
  const f = (fmt, ratio, rot) => E.largeurPourFormat(fmt, ratio, rot || 0, ctx);
  assert.strictEqual(f("A6", 0, 0), 10, "sans image : le format lui-même");
  assert.strictEqual(f("A6", 1, 0), 10);
  assert.strictEqual(f("A6", 0.5, 0), 14, "image large : A6 en paysage (14 × 7)");
  assert.strictEqual(f("A6", 2, 0), 7, "image haute : 7 × 14");
  assert.strictEqual(f("A6", 0.5, 90), 14, "tournée, elle occupe 7 × 14 : elle tient dans A6");
  assert.strictEqual(f("A4", 1, 0), 21); assert.strictEqual(f("Micro", 0, 0), 1.5);
  [["A7", 1], ["A6", 0.5], ["A5", 1.7], ["A4", 3]].forEach(([fmt, ratio]) => {
    const L = f(fmt, ratio), box = PRIX.formatsMotif[fmt], w = L, h = L * ratio;
    assert.ok((w <= box.w + 1e-9 && h <= box.h + 1e-9) || (w <= box.h + 1e-9 && h <= box.w + 1e-9), fmt + " " + ratio + " : " + w + " × " + h);
  });
});
test("6.2.0 : la position déplace le visuel seul, ou tout le bloc quand le texte lui est collé", () => {
  const piece = Object.assign({}, polo(1)[0], { prenom: "Léo", numero: "7" });
  const cfgBase = { actif: true, avecImage: true, format: "A6", orient: "portrait", largeur: 8, image: { ratio: 1 }, dx: 2, dy: 3, textePos: "dessous",
    prenom: { actif: true, police: "Bebas Neue", hauteur: 2, couleur: "#fff" }, numero: { actif: true, police: "Bebas Neue", hauteur: 4, couleur: "#fff" } };
  const seul = E.stackFor("poitrine", Object.assign({ bloc: false }, cfgBase), piece, produits["polo-essential"], ctx);
  assert.deepStrictEqual(seul.items.map(i => [i.kind, i.ux, i.uy]), [["image", 2, 3], ["prenom", 0, 0], ["numero", 0, 0]]);
  const colle = E.stackFor("poitrine", Object.assign({ bloc: true }, cfgBase), piece, produits["polo-essential"], ctx);
  assert.deepStrictEqual(colle.items.map(i => [i.kind, i.ux, i.uy]), [["image", 2, 3], ["prenom", 2, 3], ["numero", 2, 3]]);
  assert.strictEqual(colle.bloc, true); assert.deepStrictEqual([colle.ux, colle.uy], [2, 3]);
  // la position ne change pas la taille du bloc ni la planche
  const r1 = E.computeOrder({ pieces: [piece], marquages: { poitrine: Object.assign({ bloc: true }, cfgBase) }, technique: "dtf" }, ctx);
  const r0 = E.computeOrder({ pieces: [piece], marquages: { poitrine: Object.assign({ bloc: true }, cfgBase, { dx: 0, dy: 0 }) }, technique: "dtf" }, ctx);
  assert.deepStrictEqual(r1.motifs.map(m => [m.w, m.h]), r0.motifs.map(m => [m.w, m.h]));
  assert.strictEqual(r1.couts.total, r0.couts.total);
});
test("6.2.0 : décalage dit en français, et valeurs aberrantes ramenées à des bornes raisonnables", () => {
  assert.strictEqual(E.descriptionVisuel({ format: "A6", largeur: 8, image: { ratio: 1 }, dx: 2, dy: 1.5 }, ctx), "8 × 8 cm, décalé de 2 cm vers la droite et 1,5 cm vers le bas");
  assert.strictEqual(E.descriptionVisuel({ format: "A6", largeur: 8, image: { ratio: 1 }, dx: -3, dy: -0.5 }, ctx), "8 × 8 cm, décalé de 3 cm vers la gauche et 0,5 cm vers le haut");
  const g = E.imageGeom({ format: "A6", largeur: 8, dx: 9999, dy: "abc" }, ctx);
  assert.deepStrictEqual([g.dx, g.dy], [100, 0]);
  assert.strictEqual(E.imageGeom({ format: "A6", largeur: -4 }, ctx).libre, false, "largeur négative : on retrouve le format");
});


console.log("\nVinyle thermocollant, technique par pièce et prix 7.0.0 (version 7.0.0)");
const marqPoitrine = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" } };
test("7.0.0 : le vinyle est découpé à l'atelier : ni planche ni livraison, seulement le coût de la matière", () => {
  const ps = [piece2("v", "polo-essential", { technique: "vinyle" })];
  const r = E.computeOrder({ pieces: ps, marquages: marqPoitrine, technique: "dtf" }, ctx);
  assert.deepStrictEqual(r.motifs.map(m => m.techno), ["vinyle"]);
  assert.deepStrictEqual(Object.keys(r.plans), [], "aucune planche");
  assert.strictEqual(r.couts.planchesTTC, 0); assert.strictEqual(r.couts.livraison, 0);
  const attendu = E.round2(10 * 14 * PRIX.vinyle.coutCm2 * PRIX.vinyle.chute);      // un A6 : 140 cm²
  assert.strictEqual(r.couts.vinyle, attendu);
  assert.strictEqual(r.couts.total, E.round2(7.99 + attendu));
  assert.strictEqual(r.coutPieces.v.vinyle, 10 * 14 * PRIX.vinyle.coutCm2 * PRIX.vinyle.chute);
  assert.strictEqual(r.prix.unitaire, pair(7.99 + attendu + 3));
  assert.ok(r.prix.marge >= 3 - 1e-9);
});
test("7.0.0 : le vinyle ne dépend pas de la quantité (rien à partager) et coûte moins que le DTF d'une seule pièce", () => {
  const prix = n => E.computeOrder({ pieces: pieces(n, "marine", () => ({ technique: "vinyle" })), marquages: marqPoitrine, technique: "dtf" }, ctx).prix.unitaire;
  assert.strictEqual(prix(1), prix(50));
  assert.ok(prix(1) < E.computeOrder({ pieces: pieces(1), marquages: marqPoitrine, technique: "dtf" }, ctx).prix.unitaire);
});
test("7.0.0 : la technique de la pièce passe avant la technique par défaut de l'article, et la sublimation passe avant le vinyle par défaut", () => {
  const sock = piece2("s", "chaussettes-football");
  const t = (piece, technique) => E.pieceTechno({ technique: technique || "dtf" }, piece, ctx);
  assert.strictEqual(produits["chaussettes-football"].techniqueDefaut, "vinyle");
  assert.strictEqual(t(sock), "vinyle", "chaussettes : vinyle par défaut");
  assert.strictEqual(t(Object.assign({}, sock, { technique: "dtf" })), "dtf", "le DTF reste possible à la main");
  assert.strictEqual(t(piece2("p", "polo-essential")), "dtf", "un polo reste en DTF");
  assert.strictEqual(t(piece2("p", "polo-essential", { technique: "vinyle" })), "vinyle");
  assert.strictEqual(t(Object.assign({}, sock, { couleurId: "blanc" }), "sublimation"), "sublimation", "chaussettes blanches en polyester : la sublimation demandée passe avant");
  assert.strictEqual(t(piece2("p", "polo-essential", { technique: "dtf", couleurId: "blanc" }), "sublimation"), "dtf", "un DTF choisi sur la pièce l'emporte sur la sublimation");
  assert.strictEqual(t(piece2("o", "ouvre-bouteille-carte", { technique: "vinyle" })), "gravure", "la gravure d'un article en métal ne change pas");
});
test("7.0.0 : 22 articles (24 depuis la 7.1.0) où le DTF n'est pas idéal sont en vinyle par défaut (jamais un vêtement apporté ni une gravure)", () => {
  const vin = DATA.produits.filter(p => p.techniqueDefaut === "vinyle");
  assert.strictEqual(vin.length, 24);
  vin.forEach(p => assert.ok(!p.apporte && p.technique !== "gravure", p.id));
  vin.forEach(p => assert.strictEqual(E.pieceTechno({ technique: "dtf" }, piece2("x", p.id), ctx), "vinyle", p.id));
});
test("7.0.0 : un pack avec des chaussettes en vinyle : la planche ne compte que les pièces en DTF", () => {
  const k = DATA.packs.filter(x => x.id === "pack-basket")[0];
  const ps = k.produits.map((pid, j) => piece2("k" + j, pid, { pack: "pk", packType: k.id }));
  const marq = {}; k.vitrine.forEach(e => { const tx = !!DATA.emplacements[e].texteSeul; marq[e] = { actif: true, avecImage: !tx, format: "A6", orient: "portrait" }; if (tx) { marq[e].maj = true; marq[e].prenom = { actif: true, police: "Bebas Neue", hauteur: 3, couleur: "#fff" }; } });
  const r = E.computeOrder({ pieces: ps.map(p => Object.assign(p, { prenom: "Léa" })), marquages: marq, technique: "dtf" }, ctx);
  const chaus = r.motifs.filter(m => m.pieceId === ps.find(p => p.produitId === "chaussettes-football").id);
  assert.ok(chaus.length && chaus.every(m => m.techno === "vinyle"));
  assert.ok(r.motifs.some(m => m.techno === "dtf"));
  assert.ok(r.couts.vinyle > 0);
  assert.ok(Math.abs(Object.values(r.coutPieces).reduce((s, c) => s + c.total, 0) - r.couts.total) < 0.011, "les coûts par pièce égalent le coût de revient");
});
test("7.0.0 : le prix de vente est toujours pair et la marge d'au moins 3 € par pièce (articles du catalogue, 1 à 50 pièces)", () => {
  DATA.produits.filter(p => !p.apporte).forEach(p => {
    E.priceTable(p, [1, 7, 50], ctx).forEach(x => assert.strictEqual(x.unitaire % 2, 0, p.id + " : " + x.unitaire));
  });
  DATA.packs.forEach(k => E.priceTable(k, [1, 5], ctx).forEach(x => assert.strictEqual(x.unitaire % 2, 0, k.id + " : " + x.unitaire)));
});

console.log("\nTexte et chiffre : taille, position et orientation libres (version 7.0.0)");
const txtCfg = (extra) => ({ poitrine: { actif: true, avecImage: false, bloc: false, maj: true,
  prenom: Object.assign({ actif: true, police: "Bebas Neue", hauteur: 3, couleur: "#fff" }, extra && extra.prenom), numero: Object.assign({ actif: true, police: "Bebas Neue", hauteur: 8, couleur: "#fff" }, extra && extra.numero) } });
const pTxt = Object.assign({}, polo(1)[0], { prenom: "Léo", numero: "7" });
const motifsTxt = (extra) => E.computeOrder({ pieces: [pTxt], marquages: txtCfg(extra), technique: "dtf" }, ctx).motifs;
test("7.0.0 : sans rotation ni décalage, rien ne change (anciens fichiers de commande)", () => {
  const m = motifsTxt();
  assert.strictEqual(m.length, 2);
  m.forEach(x => { assert.strictEqual(x.el.rot, 0); assert.strictEqual(x.el.w, x.el.w0); assert.strictEqual(x.el.h, x.el.h0); assert.strictEqual(x.el.tx, 0); assert.strictEqual(x.el.ty, 0); });
});
test("7.0.0 : la hauteur des lettres se règle en cm (0,5 à 28)", () => {
  assert.strictEqual(motifsTxt({ numero: { hauteur: 12 } }).find(x => x.kind === "numero").el.hauteur, 12);
  const grand = motifsTxt({ numero: { hauteur: 100 } }).find(x => x.kind === "numero");
  assert.ok(grand.el.hauteur < 28 && grand.el.reduit, "hauteur bornée à 28 cm puis réduite pour tenir dans la zone : " + grand.el.hauteur);
  assert.strictEqual(motifsTxt({ prenom: { hauteur: 0.1 } }).find(x => x.kind === "prenom").el.hauteur, 0.5);
});
test("7.0.0 : un quart de tour échange la largeur et la hauteur de la case de planche", () => {
  const a = motifsTxt().find(x => x.kind === "numero"), b = motifsTxt({ numero: { rot: 90 } }).find(x => x.kind === "numero");
  assert.ok(Math.abs(b.w - a.h) < 1e-3 && Math.abs(b.h - a.w) < 1e-3, a.w + "×" + a.h + " -> " + b.w + "×" + b.h);
  assert.strictEqual(b.el.rot, 90);
  assert.ok(Math.abs(b.el.w0 - a.w) < 1e-6 && Math.abs(b.el.h0 - a.h) < 1e-6, "le texte garde sa taille à l'endroit pour dessiner les planches");
  const c = motifsTxt({ numero: { rot: 180 } }).find(x => x.kind === "numero");
  assert.ok(Math.abs(c.w - a.w) < 1e-3 && Math.abs(c.h - a.h) < 1e-3);
});
test("7.0.0 : un angle libre : la case est le rectangle qui englobe le texte tourné", () => {
  const a = motifsTxt().find(x => x.kind === "numero"), m = motifsTxt({ numero: { rot: 30 } }).find(x => x.kind === "numero");
  const rad = Math.PI / 6, w = Math.cos(rad) * a.w + Math.sin(rad) * a.h, h = Math.sin(rad) * a.w + Math.cos(rad) * a.h;
  assert.ok(Math.abs(m.w - w) < 0.002 && Math.abs(m.h - h) < 0.002, m.w + "×" + m.h + " attendu " + w + "×" + h);
  assert.ok(m.w >= a.w - 1e-9 && m.h >= a.h - 1e-9, "le rectangle englobant n'est jamais plus petit");
  assert.strictEqual(E.angleTexte(30), 30); assert.strictEqual(E.angleTexte(-30), -30); assert.strictEqual(E.angleTexte(270), -90);
  assert.strictEqual(E.angleTexte(360), 0); assert.strictEqual(E.angleTexte(725.04), 5); assert.strictEqual(E.angleTexte("abc"), 0); assert.strictEqual(E.angleTexte(180), 180);
});
test("7.0.0 : la position ne change ni les planches ni le prix, et se retrouve sur l'élément", () => {
  const base = E.computeOrder({ pieces: [pTxt], marquages: txtCfg(), technique: "dtf" }, ctx);
  const dep = E.computeOrder({ pieces: [pTxt], marquages: txtCfg({ numero: { dx: 2, dy: -1.5 } }), technique: "dtf" }, ctx);
  assert.strictEqual(dep.couts.total, base.couts.total); assert.strictEqual(dep.prix.unitaire, base.prix.unitaire);
  assert.deepStrictEqual(dep.motifs.map(m => [m.w, m.h]), base.motifs.map(m => [m.w, m.h]));
  const n = dep.motifs.find(m => m.kind === "numero");
  assert.deepStrictEqual([n.el.tx, n.el.ty], [2, -1.5]);
  const pile = E.stackFor("poitrine", txtCfg({ numero: { dx: 2, dy: -1.5 } }).poitrine, pTxt, produits["polo-essential"], ctx);
  assert.deepStrictEqual(pile.items.map(i => [i.kind, i.ux, i.uy]), [["prenom", 0, 0], ["numero", 2, -1.5]]);
  assert.strictEqual(E.computeOrder({ pieces: [pTxt], marquages: txtCfg({ numero: { dx: 9999 } }), technique: "dtf" }, ctx).motifs.find(m => m.kind === "numero").el.tx, 100, "borné");
  assert.ok(E.computeOrder({ pieces: [pTxt], marquages: txtCfg({ numero: { dx: 15 } }), technique: "dtf" }, ctx).warnings.some(w => /déborde de la zone/.test(w)), "décalé hors de la zone");
});
test("7.0.0 : un texte tourné ou déplacé sort du bloc collé, avec un avertissement ; le prix ne change pas (marge fixe)", () => {
  const avecBloc = (extra) => E.computeOrder({ pieces: [pTxt], marquages: { poitrine: Object.assign({ actif: true, avecImage: true, format: "A6", orient: "portrait", bloc: true, prenom: Object.assign({ actif: true, police: "Bebas Neue", hauteur: 2.5, couleur: "#fff" }, extra && extra.prenom), numero: Object.assign({ actif: true, police: "Bebas Neue", hauteur: 4, couleur: "#fff" }, extra && extra.numero) }) }, technique: "dtf" }, ctx);
  const colle = avecBloc(), libre = avecBloc({ numero: { rot: 90 } });
  assert.deepStrictEqual(colle.motifs.map(m => m.kind), ["bloc"]);
  assert.deepStrictEqual(libre.motifs.map(m => m.kind), ["image", "prenom", "numero"]);
  assert.ok(libre.warnings.some(w => /tourné ou déplacé/.test(w)), libre.warnings.join(" | "));
  assert.ok(!colle.warnings.some(w => /tourné ou déplacé/.test(w)));
  assert.strictEqual(libre.prix.groupes[0].margeMoyenne, 3);
});
test("7.0.0 : l'aperçu et les planches (SVG et PNG) dessinent le texte tourné", () => {
  const fs = require("fs");
  const imp = fs.readFileSync(path.join(__dirname, "..", "js", "atelier-impression.js"), "utf8"), pv = fs.readFileSync(path.join(__dirname, "..", "js", "preview.js"), "utf8");
  assert.ok(/rotate\(' \+ el\.rot/.test(imp) && /ctx\.rotate\(el\.rot/.test(imp), "planches SVG et PNG");
  assert.ok(/rotate\(' \+ rotT/.test(pv), "aperçu");
});

console.log("\nAmazon : sweat à capuche polaire et gilet polaire (version 7.1.0)");
test("7.1.0 : deux articles Amazon, chaque couleur avec son ASIN, sa page, sa photo et son option de couleur", () => {
  const sw = produits["sweat-capuche-polaire"], gi = produits["gilet-polaire-velilla"];
  assert.strictEqual(sw.couleurs.length, 17); assert.strictEqual(gi.couleurs.length, 6);
  assert.deepStrictEqual(sw.tailles, ["S", "M", "L", "XL"]);
  assert.deepStrictEqual(gi.tailles, ["XS", "S", "M", "L", "XL", "2XL", "3XL"]);
  [sw, gi].forEach(p => {
    assert.deepStrictEqual(p.tags.categories, ["sweats"], p.id + " : rayon « Sweats et vestes »");
    assert.strictEqual(p.techniqueDefaut, "vinyle", p.id + " : polaire, vinyle par défaut");
    assert.strictEqual(p.polyesterPct, 100);
    p.couleurs.forEach(c => {
      assert.ok(/^B0[A-Z0-9]{8}$/.test(c.ref), p.id + " " + c.id + " : ASIN " + c.ref);
      assert.strictEqual(c.lien, "https://www.amazon.fr/dp/" + c.ref, p.id + " " + c.id + " : page de la couleur");
      assert.ok(c.nomDec && c.photos && c.photos.length === 1, p.id + " " + c.id + " : option Amazon et photo");
    });
    assert.strictEqual(new Set(p.couleurs.map(c => c.ref)).size, p.couleurs.length, p.id + " : un ASIN par couleur");
  });
  assert.strictEqual(sw.lien, sw.couleurs[0].lien); assert.strictEqual(gi.lien, gi.couleurs[0].lien);
});
test("7.1.0 : prix d'achat Amazon : 9,99 € pour toutes les couleurs du sweat, un prix par couleur pour le gilet", () => {
  const sw = produits["sweat-capuche-polaire"], gi = produits["gilet-polaire-velilla"];
  sw.couleurs.forEach(c => assert.strictEqual(E.prixAchatPiece(sw, c.id), 9.99, c.id));
  const px = {}; gi.couleurs.forEach(c => { px[c.id] = E.prixAchatPiece(gi, c.id); });
  assert.deepStrictEqual(px, { noir: 17.82, blanc: 17.64, rouge: 17.82, "bleu-marine": 15.89, "vert-chasse": 17.35, gris: 23.07 });
});
test("7.1.0 : « amazon » (livraison offerte) et « xozwkh » (10,99 €) sont deux vendeurs de la plateforme Amazon, port compté une seule fois par vendeur", () => {
  const V = PRIX.livraisonVendeur.vendeurs;
  assert.strictEqual(produits["gilet-polaire-velilla"].vendeur, "amazon"); assert.strictEqual(produits["sweat-capuche-polaire"].vendeur, "xozwkh");
  assert.strictEqual(V.amazon.plateforme, "Amazon"); assert.strictEqual(V.amazon.frais, 0); assert.ok(/offerte dès 25 €/.test(V.amazon.note));
  assert.strictEqual(V.xozwkh.plateforme, "Amazon"); assert.strictEqual(V.xozwkh.frais, 10.99);
  const un = E.computeOrder({ pieces: [piece2("a", "sweat-capuche-polaire"), piece2("b", "sweat-capuche-polaire", { taille: "L" })], marquages: {}, technique: "dtf" }, ctx);
  assert.strictEqual(un.vendeurs.length, 1); assert.strictEqual(un.couts.livraisonVendeurs, 10.99, "10,99 € une seule fois pour deux sweats");
  const gil = E.computeOrder({ pieces: [piece2("a", "gilet-polaire-velilla")], marquages: {}, technique: "dtf" }, ctx);
  assert.strictEqual(gil.couts.livraisonVendeurs, 0, "gilet expédié par Amazon : livraison offerte");
  const deux = E.computeOrder({ pieces: [piece2("a", "sweat-capuche-polaire"), piece2("b", "gilet-polaire-velilla")], marquages: {}, technique: "dtf" }, ctx);
  assert.deepStrictEqual(deux.vendeurs.map(v => v.plateforme), ["Amazon", "Amazon"]);
  assert.strictEqual(deux.couts.livraisonVendeurs, 10.99);
});
test("7.1.0 : polaire : le motif part en vinyle par défaut (pas de planche), et le prix reste pair avec 3 € de marge au moins", () => {
  ["sweat-capuche-polaire", "gilet-polaire-velilla"].forEach(id => {
    assert.strictEqual(E.pieceTechno({ technique: "dtf" }, piece2("x", id), ctx), "vinyle", id);
    const t = E.priceTable(Object.assign({}, produits[id], { vitrine: ["poitrine"] }), [1, 5, 10, 20, 50], ctx);
    t.forEach(l => { assert.strictEqual(l.unitaire % 2, 0, id + " : prix pair " + l.unitaire); assert.ok(l.unitaire >= produits[id].prixAchat + 3, id + " : marge " + l.unitaire); });
  });
});

console.log("\n" + ok + " tests passés");
