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
function test(nom, fn) { try { fn(); ok++; console.log("  ok  " + nom); } catch (e) { console.log("  ECHEC " + nom + "\n   " + e.message); process.exitCode = 1; } }

function pieces(n, couleur, extra) {
  return Array.from({ length: n }, (_, i) => Object.assign({ id: "p" + i, produitId: "polo-essential", couleurId: couleur || "marine", taille: "M", prenom: "", numero: "" }, extra ? extra(i) : {}));
}
const A6poitrine = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" } };

console.log("Prix de vente");
test("prix = coût + 1 € par motif, arrondi au centime supérieur : 1 polo, 1 visuel A6 poitrine", () => {
  const r = E.computeOrder({ pieces: pieces(1), marquages: A6poitrine, technique: "dtf" }, ctx);
  assert.strictEqual(r.couts.achats, 7.99);
  assert.strictEqual(r.couts.planchesTTC, 5.50);   // une A6 prend une planche A4 chez DTF Print (prix TTC)
  assert.strictEqual(r.couts.livraison, 4.90);
  assert.strictEqual(r.couts.total, 18.39);
  assert.strictEqual(r.prix.unitaire, 19.39);   // un seul motif : 1 € de marge
  assert.strictEqual(r.prix.marge, 1);
  assert.strictEqual(r.prix.groupes[0].motifs, 1);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 1);
});
test("10 polos avec 1 visuel chacun : 108,30 € au total, soit 1 € de marge par polo", () => {
  const r = E.computeOrder({ pieces: pieces(10), marquages: A6poitrine, technique: "dtf" }, ctx);
  assert.strictEqual(r.couts.total, 98.3);
  assert.strictEqual(r.prix.unitaire, 10.83);
  assert.strictEqual(r.prix.total, 108.3);
});
test("margePiece : 1 € par motif, 2 € au plus par pièce, rien sans motif", () => {
  const m = n => E.margePiece(n, PRIX.regles);
  assert.deepStrictEqual([0, 1, 2, 3, 4, 10].map(m), [0, 1, 2, 2, 2, 2]);
  const sans = Object.assign({}, PRIX.regles, { maxParPiece: null });
  assert.strictEqual(E.margePiece(3, sans), 3);
});
test("une pièce avec un visuel, un prénom et un numéro (3 motifs) : marge plafonnée à 2 €", () => {
  const marq = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait",
    prenom: { actif: true, police: "Bebas Neue", hauteur: 2.5, couleur: "#fff" }, numero: { actif: true, police: "Bebas Neue", hauteur: 4, couleur: "#fff" } } };
  const r = E.computeOrder({ pieces: pieces(1, "marine", () => ({ prenom: "Léo", numero: "7" })), marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 3);
  assert.strictEqual(r.prix.groupes[0].motifs, 3);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 2);
  assert.strictEqual(r.prix.marge, E.round2(r.prix.total - r.couts.total));
  assert.ok(r.prix.marge >= 2 - 1e-9 && r.prix.marge <= 2.01);
});
test("une pièce sans motif ne porte aucune marge", () => {
  const r = E.computeOrder({ pieces: pieces(2), marquages: {}, technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 0);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 0);
  assert.ok(r.prix.marge <= 0.02);
});
test("calcPrix : pas de palier de 2,50 €, seulement l'arrondi au centime", () => {
  const p = E.calcPrix(70, 10, PRIX.regles);        // 7,00 + 1 motif = 8,00
  assert.strictEqual(p.unitaire, 8); assert.strictEqual(p.marge, 10);
  const q = E.calcPrix(10.07, 1, PRIX.regles, 3);   // 3 motifs : plafonné à 2 € -> 12,07
  assert.strictEqual(q.unitaire, 12.07);
  const r = E.calcPrix(9.511, 1, PRIX.regles, 1);   // 9,511 + 1 = 10,511 -> 10,52
  assert.strictEqual(r.unitaire, 10.52);
});
test("calcPrix : la marge ne dépend plus du coût, seulement du nombre de motifs", () => {
  const u = (c, m) => E.calcPrix(c, 1, PRIX.regles, m).unitaire;
  assert.strictEqual(u(5, 1), 6); assert.strictEqual(u(30, 1), 31); assert.strictEqual(u(100, 1), 101);
  assert.strictEqual(u(5, 2), 7); assert.strictEqual(u(30, 2), 32); assert.strictEqual(u(100, 5), 102);
  assert.strictEqual(u(30, 0), 30);
});
test("calcPrix : sans plafond (maxParPiece null) la marge suit le nombre de motifs", () => {
  const sans = Object.assign({}, PRIX.regles, { maxParPiece: null });
  assert.strictEqual(E.calcPrix(30, 1, sans, 3).unitaire, 33);
});
test("la marge d'une commande vaut 1 € par pièce quand chaque pièce a un seul motif", () => {
  [1, 2, 3, 5, 6, 7, 8, 12, 20, 50].forEach(n => {
    const r = E.computeOrder({ pieces: pieces(n), marquages: A6poitrine, technique: "dtf" }, ctx);
    assert.ok(r.prix.marge >= n - 1e-6, n + " pièces : marge " + r.prix.marge + " pour un coût de " + r.couts.total);
    assert.ok(r.prix.marge <= n + 0.01 * n + 1e-6, n + " pièces : marge trop haute " + r.prix.marge);
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
test("un prix par produit : chaque produit a le sien, 1 € de marge par motif", () => {
  const ps = [piece("a", "short-basket"), piece("b", "short-basket"), piece("c", "sweat-molleton")];
  const r = E.computeOrder({ pieces: ps, marquages: marqMixte, technique: "dtf" }, ctx);
  assert.strictEqual(r.prix.groupes.length, 2);
  const short = r.prix.groupes.find(g => g.produitId === "short-basket"), sweat = r.prix.groupes.find(g => g.produitId === "sweat-molleton");
  assert.strictEqual(short.n, 2); assert.strictEqual(sweat.n, 1);
  assert.ok(short.unitaire < sweat.unitaire, "le short doit coûter moins cher que le sweat");
  assert.strictEqual(r.prix.unitaire, null);
  r.prix.groupes.forEach(g => {
    const marge = g.unitaire - g.coutMoyen, attendue = 1;   // un seul motif par pièce (cuisse du short, poitrine du sweat)
    assert.ok(marge >= attendue - 1e-6 && marge <= attendue + 0.01 + 1e-6, g.produitId + " : marge " + marge.toFixed(3));
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
test("pack basket : un seul article, 1 € de marge par pièce du pack", () => {
  const avec = [piece("a", "maillot-basket", { pack: "k1", packType: "pack-basket" }), piece("b", "short-basket", { pack: "k1", packType: "pack-basket" })];
  const sans = avec.map(p => Object.assign({}, p, { pack: undefined, packType: undefined }));
  const r1 = E.computeOrder({ pieces: avec, marquages: marqMixte, technique: "dtf" }, ctx);
  const r2 = E.computeOrder({ pieces: sans, marquages: marqMixte, technique: "dtf" }, ctx);
  assert.strictEqual(r1.prix.packs.n, 1);
  assert.strictEqual(r1.prix.groupes.length, 1);
  const g = r1.prix.groupes[0];
  assert.ok(g.pack && g.n === 1 && g.pieces === 2);
  assert.strictEqual(g.unitaire, r1.prix.total);
  assert.strictEqual(g.margeMoyenne, 2);   // deux pièces, 1 € chacune
  assert.ok(r1.prix.marge >= 2 - 1e-6 && r1.prix.marge <= 2.01, "marge " + r1.prix.marge);
  // un motif par pièce : 1 € de marge par pièce, que la pièce soit vendue seule ou dans le pack ; le pack n'est jamais plus cher
  assert.ok(r1.prix.total <= r2.prix.total, "le pack ne doit pas coûter plus cher que les deux pièces séparées");
  assert.strictEqual(r2.prix.groupes.reduce((s, x) => s + x.margeMoyenne * x.n, 0), 2);
  console.log("     pack", r1.prix.total, "€ contre", r2.prix.total, "€ séparés");
});
test("pack : la marge de chaque pièce reste 1 € quel que soit son nombre de motifs, chaussettes à 0 €", () => {
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
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 2);   // maillot 1 € + short 1 € + chaussettes 0 €
  assert.strictEqual(E.margePiecePack(produits["chaussettes-football"], PRIX.regles), 0);
  assert.strictEqual(E.margePiecePack(produits["maillot-basket"], PRIX.regles), 1);
  // vendues séparément, les mêmes pièces portent plus de marge (jusqu'à 2 € le maillot, 2 € le short, 1 € les chaussettes)
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
test("short de basket, 2 A6 (une par cuisse) : le prix suit le coût sans palier", () => {
  const marq = { cuisse_g: marqMixte.cuisse_g, cuisse_d: { actif: true, avecImage: true, format: "A6", orient: "portrait" } };
  let prev = null;
  [4, 5, 6, 7, 8, 9, 10, 12].forEach(n => {
    const ps = Array.from({ length: n }, (_, i) => piece("s" + i, "short-basket"));
    const r = E.computeOrder({ pieces: ps, marquages: marq, technique: "dtf" }, ctx);
    const u = r.prix.groupes[0].unitaire, cm = r.prix.groupes[0].coutMoyen;
    assert.ok(Math.abs(u - (cm + 2)) < 0.02, n + " : prix " + u + " pour un coût moyen de " + cm);   // deux motifs : 2 € de marge
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
    assert.ok(styles.indexOf(it.tags.style) >= 0, it.id + " : style inconnu");
    it.tags.genre.forEach(g => assert.ok(genres.indexOf(g) >= 0, it.id + " : genre inconnu"));
  });
  DATA.produits.forEach(p => {
    assert.ok(window.Preview.models[p.modele], p.id + " : modèle de dessin inconnu " + p.modele);
    Object.keys(p.zones).forEach(e => assert.ok(DATA.emplacements[e], p.id + " : emplacement inconnu " + e));
    p.vitrine.forEach(e => assert.ok(p.zones[e], p.id + " : la vitrine utilise un emplacement absent " + e));
    assert.ok(p.couleurs.length && p.tailles.length && p.photos.length, p.id + " : couleurs, tailles ou photos manquantes");
    assert.ok(p.prixAchat > 0 && p.polyesterPct >= 0 && p.polyesterPct <= 100, p.id + " : prix ou matière");
    if (p.vendeur) assert.ok(PRIX.livraisonVendeur.vendeurs[p.vendeur], p.id + " : vendeur absent de prix.js");
  });
  DATA.packs.forEach(k => {
    k.produits.forEach(id => assert.ok(produits[id], k.id + " : produit inconnu " + id));
    k.vitrine.forEach(e => assert.ok(k.produits.some(id => produits[id].zones[e]), k.id + " : la vitrine utilise un emplacement absent " + e));
  });
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
  assert.strictEqual(deux.couts.total, E.round2(deux.couts.achats + deux.couts.planchesTTC + deux.couts.livraison + 9.98));
  const margeVoulue = deux.prix.groupes.reduce((s, g) => s + g.n * g.margeMoyenne, 0);
  assert.strictEqual(margeVoulue, 2);   // un motif par pièce, deux pièces
  assert.ok(deux.prix.total >= deux.couts.total + margeVoulue - 0.02, "la marge (1 € par motif) est respectée avec les frais du vendeur");
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
test("packs : chaque pack contient les chaussettes, 1 € de marge par pièce hors chaussettes", () => {
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
    const attendue = k.produits.filter(pid => produits[pid].margePack !== 0).length;
    assert.ok(r.prix.marge >= attendue - 1e-6 && r.prix.marge <= attendue + 0.01 + 1e-6, k.id + " : marge " + r.prix.marge + " au lieu de " + attendue);
    assert.ok(r.prix.groupes[0].pack, k.id);
  });
});
test("packs : prix de la vitrine d'un pack basket (29,37 €) et d'un pack entraîneur (56,45 €)", () => {
  const prixPack = id => E.priceTable(DATA.packs.filter(k => k.id === id)[0], [1], ctx)[0].unitaire;
  assert.strictEqual(prixPack("pack-basket"), 29.37);       // coût 27,37 + 2 € (maillot et short)
  assert.strictEqual(prixPack("pack-entraineur"), 56.45);   // coût 53,45 + 3 € (veste, haut thermique, jogging)
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
  assert.strictEqual(m(1, ["poitrine"]), 1);
  assert.strictEqual(m(2, ["poitrine", "cuisse_g"]), 2);
  assert.strictEqual(m(3, ["poitrine", "cuisse_g", "cuisse_d"]), 2);   // trois motifs : plafonné à 2 € pour tout l'ensemble
  // dans le pack Hummel : 1 € pour l'ensemble + 1 € pour la veste + 0 € pour les chaussettes
  const k = DATA.packs.filter(x => x.id === "pack-hummel")[0];
  assert.deepStrictEqual(k.produits, ["ensemble-hummel", "veste-micropolaire", "chaussettes-football"]);
  const ps = k.produits.map((pid, j) => piece("h" + j, pid, { pack: "pk0", packType: "pack-hummel" }));
  const marq = { poitrine: { actif: true, avecImage: true, format: "A6", orient: "portrait" }, cuisse_g: marqMixte.cuisse_g, cuisse_d: marqMixte.cuisse_g };
  const r = E.computeOrder({ pieces: ps, marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(r.prix.groupes[0].margeMoyenne, 2);
});
test("catalogue : plus de robe, chaque dessin existe dans l'aperçu", () => {
  assert.ok(!DATA.produits.some(p => p.tags.type === "robe"), "plus aucune robe");
  assert.ok(!DATA.filtres.type.valeurs.some(v => v.id === "robe"), "plus de filtre Robes");
  assert.ok(!DATA.produits.some(p => p.id === "robe-hummel"));
  const modeles = window.Preview.models;
  DATA.produits.forEach(p => assert.ok(modeles[p.modele], p.id + " : dessin « " + p.modele + " » absent de preview.js"));
  assert.strictEqual(DATA.produits.length, 45);
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
    assert.ok(t[0].unitaire > t[1].unitaire && t[1].unitaire > p.prixAchat, p.id + " : prix " + t.map(x => x.unitaire));
    p.couleurs.forEach(c => assert.ok(/^https:\/\/www\.decathlon\.fr\/p\//.test(c.lien || p.lien), p.id + " : lien de la couleur " + c.id));
  });
  // le prix de la vitrine d'un petit accessoire compte un visuel Mini (5 x 5 cm), pas un A6
  const marq = { casquette: { actif: true, avecImage: true, format: "Mini", orient: "portrait" } };
  const r = E.computeOrder({ pieces: [piece2("c", "casquette-tennis-tc100")], marquages: marq, technique: "dtf" }, ctx);
  assert.deepStrictEqual(r.motifs.map(m => [m.w, m.h]), [[5, 5]]);
  assert.strictEqual(r.couts.planchesTTC, 5.50);
});
test("accessoires : pas de sublimation sur une casquette ou un sac blancs, mais oui sur un tour de cou blanc en polyester", () => {
  const ps = [piece2("a", "casquette-tennis-tc100", { couleurId: "blanc" }), piece2("b", "tour-de-cou-morf", { couleurId: "blanc" }), piece2("c", "bandeau-running-v2", { couleurId: "blanc" })];
  const order = { pieces: ps, marquages: {}, technique: "sublimation" };
  assert.deepStrictEqual(ps.map(p => E.pieceTechno(order, p, ctx)), ["dtf", "sublimation", "dtf"]);
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
const URL_PHOTO = /^https:\/\/contents\.mediadecathlon\.com\/[pm]\d+\/k\$[0-9a-f]{32}\/picture\.jpg$/;
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
        assert.ok(/^https:\/\/www\.decathlon\.fr\/p\//.test(c.lien || ""), p.id + " " + c.id + " : une couleur avec photos a aussi son lien");
      }
      if (c.rupture != null) assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(c.rupture), p.id + " " + c.id + " : date de rupture");
      if (c.prixAchat != null) assert.ok(c.prixAchat > 0, p.id + " " + c.id + " : prix d'achat de la couleur");
    });
    p.photos.forEach(u => assert.ok(URL_PHOTO.test(u), p.id + " : adresse de photo " + u));
  });
  assert.ok(avecPhotos >= 11, "couleurs avec leur série de photos : " + avecPhotos);
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
test("vendeurs : chaque vendeur a un nom, et son lien (s'il est connu) est une page vendeur Decathlon", () => {
  Object.keys(PRIX.livraisonVendeur.vendeurs).forEach(id => {
    const v = PRIX.livraisonVendeur.vendeurs[id];
    assert.ok(v.nom && v.frais > 0, id);
    assert.ok(v.lien === "" || /^https:\/\/www\.decathlon\.fr\/mp\/seller\/[a-z0-9-]+\/[0-9a-f-]{36}$/.test(v.lien), id + " : lien du vendeur " + v.lien);
  });
  assert.ok(/sport-et-go-eu/.test(PRIX.livraisonVendeur.vendeurs["sport-et-go-eu"].lien), "le lien de Sport & Go EU est connu");
});

console.log("\n" + ok + " tests passés");
