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
test("prix = coût + 20 % plafonné à 2 €, arrondi au centime supérieur, 1 pièce A6 poitrine", () => {
  const r = E.computeOrder({ pieces: pieces(1), marquages: A6poitrine, technique: "dtf" }, ctx);
  assert.strictEqual(r.couts.achats, 7.99);
  assert.strictEqual(r.couts.planchesTTC, 5.50);   // une A6 prend une planche A4 chez DTF Print (prix TTC)
  assert.strictEqual(r.couts.livraison, 4.90);
  assert.strictEqual(r.couts.total, 18.39);
  assert.strictEqual(r.prix.unitaire, 20.39);   // 20 % de 18,39 = 3,68 € : plafonné à 2 €
  assert.strictEqual(r.prix.marge, 2);
  assert.ok(r.prix.groupes[0].plafonne);
});
test("calcPrix : pas de palier de 2,50 €, seulement l'arrondi au centime", () => {
  const p = E.calcPrix(70, 10, PRIX.regles);        // 7,00 x 1,2 = 8,40
  assert.strictEqual(p.unitaire, 8.4); assert.strictEqual(p.marge, 14);
  const q = E.calcPrix(10.07, 1, PRIX.regles);      // 20 % = 2,014 € : plafonné à 2 € -> 12,07
  assert.strictEqual(q.unitaire, 12.07);
  const r = E.calcPrix(9.51, 1, PRIX.regles);       // 9,51 x 1,2 = 11,412 -> 11,42
  assert.strictEqual(r.unitaire, 11.42);
});
test("calcPrix : jusqu'à 10 € de coût la marge est de 20 %, au-delà elle reste à 2 €", () => {
  const u = c => E.calcPrix(c, 1, PRIX.regles).unitaire;
  assert.strictEqual(u(5), 6); assert.strictEqual(u(10), 12);
  assert.strictEqual(u(11), 13); assert.strictEqual(u(30), 32); assert.strictEqual(u(100), 102);
});
test("calcPrix : sans plafond (margeMax null) on retrouve les 20 %", () => {
  const sans = Object.assign({}, PRIX.regles, { margeMax: null });
  assert.strictEqual(E.calcPrix(30, 1, sans).unitaire, 36);
});
test("la marge d'une commande vaut 20 % du coût, plafonnée à 2 € par pièce", () => {
  [1, 2, 3, 5, 6, 7, 8, 12, 20, 50].forEach(n => {
    const r = E.computeOrder({ pieces: pieces(n), marquages: A6poitrine, technique: "dtf" }, ctx);
    const attendu = n * Math.min(0.2 * r.couts.total / n, PRIX.regles.margeMax);
    assert.ok(r.prix.marge >= attendu - 1e-6, n + " pièces : marge " + r.prix.marge + " pour un coût de " + r.couts.total);
    assert.ok(r.prix.marge <= attendu + 0.01 * n + 1e-6, n + " pièces : marge trop haute " + r.prix.marge);
    assert.ok(r.prix.marge <= PRIX.regles.margeMax * n + 0.01 * n + 1e-6, n + " pièces : au-dessus du plafond");
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
test("un prix par produit : chaque produit a le sien, marge de 20 % plafonnée à 2 €", () => {
  const ps = [piece("a", "short-basket"), piece("b", "short-basket"), piece("c", "sweat-molleton")];
  const r = E.computeOrder({ pieces: ps, marquages: marqMixte, technique: "dtf" }, ctx);
  assert.strictEqual(r.prix.groupes.length, 2);
  const short = r.prix.groupes.find(g => g.produitId === "short-basket"), sweat = r.prix.groupes.find(g => g.produitId === "sweat-molleton");
  assert.strictEqual(short.n, 2); assert.strictEqual(sweat.n, 1);
  assert.ok(short.unitaire < sweat.unitaire, "le short doit coûter moins cher que le sweat");
  assert.strictEqual(r.prix.unitaire, null);
  r.prix.groupes.forEach(g => {
    const marge = g.unitaire - g.coutMoyen, attendue = Math.min(0.2 * g.coutMoyen, PRIX.regles.margeMax);
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
test("pack basket : un seul article, une seule marge (celle d'une pièce)", () => {
  const avec = [piece("a", "maillot-basket", { pack: "k1", packType: "pack-basket" }), piece("b", "short-basket", { pack: "k1", packType: "pack-basket" })];
  const sans = avec.map(p => Object.assign({}, p, { pack: undefined, packType: undefined }));
  const r1 = E.computeOrder({ pieces: avec, marquages: marqMixte, technique: "dtf" }, ctx);
  const r2 = E.computeOrder({ pieces: sans, marquages: marqMixte, technique: "dtf" }, ctx);
  assert.strictEqual(r1.prix.packs.n, 1);
  assert.strictEqual(r1.prix.groupes.length, 1);
  const g = r1.prix.groupes[0];
  assert.ok(g.pack && g.n === 1 && g.pieces === 2);
  assert.strictEqual(g.unitaire, r1.prix.total);
  // marge du pack = 20 % du coût moyen d'une pièce = 10 % du coût du pack, plafonnée à 2 € pour tout le pack
  const margePack = Math.min(0.1 * r1.couts.total, PRIX.regles.margeMax);
  assert.ok(r1.prix.marge >= margePack - 1e-6 && r1.prix.marge <= margePack + 0.01 + 1e-6, "marge " + r1.prix.marge);
  assert.ok(r1.prix.total < r2.prix.total, "le pack doit coûter moins cher que les deux pièces séparées");
  const margeSeparees = r2.prix.groupes.reduce((s, g) => s + g.n * Math.min(0.2 * g.coutMoyen, PRIX.regles.margeMax), 0);
  assert.ok(Math.abs(r2.prix.marge - margeSeparees) < 0.03, "marge séparée " + r2.prix.marge + " attendue " + margeSeparees.toFixed(2));
  console.log("     pack", r1.prix.total, "€ contre", r2.prix.total, "€ séparés");
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
    assert.ok(Math.abs(u - (cm + Math.min(0.2 * cm, PRIX.regles.margeMax))) < 0.02, n + " : prix " + u + " pour un coût moyen de " + cm);
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
  const margeVoulue = deux.prix.groupes.reduce((s, g) => s + g.n * Math.min(0.2 * g.coutMoyen, PRIX.regles.margeMax), 0);
  assert.ok(deux.prix.total >= deux.couts.total + margeVoulue - 0.02, "la marge (20 %, plafonnée à 2 €) est respectée avec les frais du vendeur");
});
test("place de marché : plus on commande de pièces, plus la part des frais de port baisse", () => {
  const prix = [1, 5, 20].map(q => E.priceTable(produits["doudoune-sans-manche"], [q], ctx)[0].unitaire);
  assert.ok(prix[0] > prix[1] && prix[1] > prix[2], prix.join(" > "));
});
test("chaussettes : le prix de la vitrine compte un prénom pressé (emplacement réservé aux prénoms)", () => {
  const t = E.priceTable(produits["chaussettes-football"], [1, 10], ctx);
  assert.ok(t[0].unitaire > produits["chaussettes-football"].prixAchat * 1.2 + 2.88, "la planche A6 et la livraison sont comptées : " + t[0].unitaire);
  const marq = { chaussette_g: { actif: true, avecImage: false, prenom: { actif: true, hauteur: 2.5, police: "Bebas Neue", couleur: "#fff" }, numero: { actif: false }, maj: true } };
  const r = E.computeOrder({ pieces: [piece2("a", "chaussettes-football", { prenom: "Léo" })], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(r.motifs.length, 1); assert.strictEqual(r.motifs[0].kind, "prenom"); assert.strictEqual(r.motifs[0].emp, "chaussette_g");
  const vide = E.computeOrder({ pieces: [piece2("a", "chaussettes-football")], marquages: marq, technique: "dtf" }, ctx);
  assert.strictEqual(vide.motifs.length, 0);
});
test("packs d'ensembles : une seule marge, moins cher que les pièces séparées", () => {
  ["pack-fitness-femme", "pack-jogging-femme", "pack-football", "pack-basket", "pack-entraineur"].forEach(id => {
    const k = DATA.packs.filter(x => x.id === id)[0];
    const pk = E.priceTable(k, [1], ctx)[0].unitaire;
    const sep = k.produits.reduce((s, pid) => s + E.priceTable(Object.assign({}, produits[pid], { vitrine: k.vitrine.filter(e => produits[pid].zones[e]) }), [1], ctx)[0].unitaire, 0);
    assert.ok(pk < sep, id + " : pack " + pk + " contre " + sep + " séparés");
  });
});
test("packs : chaque pack contient les chaussettes, trois pièces (quatre pour l'entraîneur), et une seule marge plafonnée à 2 €", () => {
  const taille = { "pack-basket": 3, "pack-fitness-femme": 3, "pack-jogging-femme": 3, "pack-football": 3, "pack-entraineur": 4 };
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
    assert.ok(r.prix.marge <= 2 + 1e-9, k.id + " : marge " + r.prix.marge);
    assert.ok(r.prix.groupes[0].pack, k.id);
  });
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
test("sublimation : chaussettes et robe blanches en polyester oui, t-shirt coton non", () => {
  const ps = [piece2("a", "chaussettes-football"), piece2("b", "robe-hummel"), piece2("c", "tshirt-fitness-femme"), piece2("d", "thermique-femme")];
  const order = { pieces: ps, marquages: A6poitrine, technique: "sublimation" };
  assert.deepStrictEqual(ps.map(p => E.pieceTechno(order, p, ctx)), ["sublimation", "sublimation", "dtf", "dtf"]);
});

console.log("\n" + ok + " tests passés");
