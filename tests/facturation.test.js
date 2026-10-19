// Tests des fiches de paiement et des factures : node tests/facturation.test.js
const assert = require("assert");
const path = require("path");
const fs = require("fs");
const Pdf = require(path.join("..", "js", "pdf.js"));
const Fa = require(path.join("..", "js", "facturation.js"));

let ok = 0;
function test(nom, fn) { try { fn(); ok++; console.log("  ok  " + nom); } catch (e) { console.log("  ECHEC " + nom + "\n   " + e.message); process.exitCode = 1; } }

// Le logo des PDF, tel que le site le charge (base64 dans js/logo-pdf.js)
const src = fs.readFileSync(path.join(__dirname, "..", "js", "logo-pdf.js"), "utf8");
const LOGO = Uint8Array.from(Buffer.from(/"([A-Za-z0-9+/=]+)"/.exec(src)[1], "base64"));

const CP1252 = { 0x80: "€", 0x92: "’", 0x96: "–", 0x9c: "œ" };
// Tous les textes d'un PDF fabriqué par js/pdf.js (chaînes hexadécimales avant « Tj »), pour vérifier ce qui est écrit
function textes(bytes) {
  const s = Buffer.from(bytes).toString("latin1"), out = [], re = /<([0-9A-F]+)> Tj/g;
  let m;
  while ((m = re.exec(s))) {
    let t = "";
    for (let i = 0; i < m[1].length; i += 2) { const c = parseInt(m[1].substr(i, 2), 16); t += CP1252[c] || String.fromCharCode(c === 160 ? 32 : c); }
    out.push(t);
  }
  return out;
}
function nbPages(bytes) { return (Buffer.from(bytes).toString("latin1").match(/\/Type \/Page /g) || []).length; }

const LIGNES = [
  { designation: "Maillot de basket TANK 100", qty: 4, unit: 17.5 },
  { designation: "Pack basket (maillot + short + chaussettes)", qty: 2, unit: 42.5 },
  { designation: "", qty: 1, unit: 9 },                    // sans nom : ignorée
  { designation: "T-shirt apporté", qty: 3, unit: 4.2 }
];
const BASE = { numero: "FP-2026-001", dateIso: "2026-10-19", createur: { prenom: "Martin", nom: "Ernst" }, client: { asso: "Section basket", contact: "Camille Martin", email: "camille@exemple.fr" }, lignes: LIGNES };

console.log("IBAN");
test("l'IBAN de l'asso est valide (clé de contrôle)", () => assert.strictEqual(Fa.ibanValide(Fa.CONFIG.iban), true));
test("un IBAN avec un chiffre faux est refusé", () => assert.strictEqual(Fa.ibanValide("FR7617598000010003321323382"), false));
test("IBAN d'exemple connu (Allemagne)", () => assert.strictEqual(Fa.ibanValide("DE89 3704 0044 0532 0130 00"), true));
test("mise en forme par groupes de 4", () => assert.strictEqual(Fa.ibanFormate("FR7617598000010003321323381"), "FR76 1759 8000 0100 0332 1323 381"));

console.log("Montants et dates");
test("euros : virgule, espace insécable avant le symbole, milliers séparés", () => {
  assert.strictEqual(Fa.eur(17.5), "17,50 €");
  assert.strictEqual(Fa.eur(1234.5), "1 234,50 €");
  assert.strictEqual(Fa.eur(0), "0,00 €");
});
test("dates en toutes lettres", () => {
  assert.strictEqual(Fa.dateLongue("2026-10-19"), "19 octobre 2026");
  assert.strictEqual(Fa.dateLongue("2026-11-01"), "1er novembre 2026");
  assert.strictEqual(Fa.dateCourte("2026-10-19"), "19/10/2026");
  assert.strictEqual(Fa.dateValide("2026-13-40"), false);
});
test("total : une ligne sans nom ou sans quantité ne compte pas, arrondi au centime", () => {
  assert.strictEqual(Fa.total(LIGNES), 167.6);
  assert.strictEqual(Fa.totalLigne({ qty: 3, unit: 0.1 }), 0.3);
});

console.log("Numéros et nom de fichier");
test("FP-2026-001 et FAC-2026-012", () => {
  assert.strictEqual(Fa.numero("fiche", 2026, 1), "FP-2026-001");
  assert.strictEqual(Fa.numero("facture", 2026, 12), "FAC-2026-012");
  assert.deepStrictEqual(Fa.lireNumero("FAC-2026-012"), { type: "facture", annee: 2026, n: 12 });
  assert.strictEqual(Fa.lireNumero("2026-12"), null);
});
test("le numéro proposé avance avec les documents créés, séparément pour chaque série et chaque année", () => {
  let c = {};
  assert.strictEqual(Fa.prochainNumero(c, "fiche", 2026), "FP-2026-001");
  c = Fa.noterNumero(c, "FP-2026-001");
  assert.strictEqual(Fa.prochainNumero(c, "fiche", 2026), "FP-2026-002");
  assert.strictEqual(Fa.prochainNumero(c, "facture", 2026), "FAC-2026-001");
  assert.strictEqual(Fa.prochainNumero(c, "fiche", 2027), "FP-2027-001");
});
test("un numéro saisi à la main plus grand fait avancer le compteur, un plus petit ne le fait pas reculer", () => {
  let c = Fa.noterNumero({}, "FP-2026-007");
  assert.strictEqual(Fa.prochainNumero(c, "fiche", 2026), "FP-2026-008");
  c = Fa.noterNumero(c, "FP-2026-003");
  assert.strictEqual(Fa.prochainNumero(c, "fiche", 2026), "FP-2026-008");
});
test("nom de fichier : date, titre, asso, numéro", () => {
  assert.strictEqual(Fa.nomFichier(Object.assign({ type: "fiche" }, BASE)), "2026-10-19_Fiche-paiement_Section-basket_FP-2026-001.pdf");
  assert.strictEqual(Fa.nomFichier(Object.assign({}, BASE, { type: "facture", numero: "FAC-2026-001", client: { asso: "BDE d'Électro / Élèves" } })), "2026-10-19_Facture_BDE-d-Electro-Eleves_FAC-2026-001.pdf");
  assert.strictEqual(Fa.nomAsso(""), "Asso");
});

console.log("Vérifications avant de créer");
test("le nom et le prénom du créateur sont obligatoires", () => {
  const e = Fa.verifier(Object.assign({ type: "fiche" }, BASE, { createur: { prenom: "Martin", nom: " " } }));
  assert.ok(e.some(m => /prénom et ton nom/.test(m)));
});
test("une facture demande la date du paiement", () => {
  const f = Object.assign({}, BASE, { type: "facture", numero: "FAC-2026-001" });
  assert.ok(Fa.verifier(f).some(m => /paiement a été reçu/.test(m)));
  assert.deepStrictEqual(Fa.verifier(Object.assign({}, f, { payeLe: "2026-10-15" })), []);
});
test("un numéro de facture ne convient pas à une fiche", () => {
  assert.ok(Fa.verifier(Object.assign({ type: "fiche" }, BASE, { numero: "FAC-2026-001" })).length > 0);
});
test("aucune ligne utile : refusé", () => {
  assert.ok(Fa.verifier(Object.assign({ type: "fiche" }, BASE, { lignes: [{ designation: "", qty: 1, unit: 3 }] })).some(m => /au moins une ligne/.test(m)));
});

console.log("PDF");
test("polices : les largeurs d'Helvetica donnent celles de la référence", () => {
  assert.ok(Math.abs(Pdf.width("Pack basket (maillot + short) prénom numéro dans le dos, « logo » à la poitrine 1 234,56 € œuvre Ça Été", 10, false) - 464.38) < 0.01);
  assert.ok(Math.abs(Pdf.width("Pack basket (maillot + short) prénom numéro dans le dos, « logo » à la poitrine 1 234,56 € œuvre Ça Été", 10, true) - 492.12) < 0.01);
});
test("retour à la ligne : aucune ligne plus large que la place, un mot trop long est coupé", () => {
  const l = Pdf.wrap("un texte assez long pour passer sur plusieurs lignes dans une colonne étroite ".repeat(3) + "Supercalifragilisticexpialidocious".repeat(3), 10, false, 120);
  assert.ok(l.length > 3);
  l.forEach(x => assert.ok(Pdf.width(x, 10, false) <= 120.01, x));
});
test("le fichier est un PDF complet : en-tête, table des références exacte, fin", () => {
  const b = Buffer.from(Fa.creerPdf(Object.assign({ type: "fiche" }, BASE), LOGO));
  const s = b.toString("latin1");
  assert.strictEqual(s.slice(0, 8), "%PDF-1.4");
  assert.ok(s.trimEnd().endsWith("%%EOF"));
  const start = Number(/startxref\n(\d+)/.exec(s)[1]);
  assert.strictEqual(s.substr(start, 4), "xref");
  const n = Number(/xref\n0 (\d+)/.exec(s.substr(start))[1]);
  const rows = s.substr(start).split("\n").slice(2, 2 + n);
  rows.slice(1).forEach((r, i) => assert.strictEqual(s.substr(Number(r.slice(0, 10)), (i + 1 + " 0 obj").length), (i + 1) + " 0 obj"));
});
test("la fiche de paiement contient l'IBAN, le titulaire, le total, la référence, le créateur et la phrase sur le paiement", () => {
  const t = textes(Fa.creerPdf(Object.assign({ type: "fiche" }, BASE), LOGO)).join("\n");
  assert.ok(t.includes("FICHE DE PAIEMENT"));
  assert.ok(t.includes("N° FP-2026-001"));
  assert.ok(t.includes("FR76 1759 8000 0100 0332 1323 381"));
  assert.ok(t.includes("Fablab Icam 26-29"));
  assert.ok(t.includes("167,60 €"), t);
  assert.ok(t.includes("FP-2026-001 Section basket"));
  assert.ok(t.includes("Martin Ernst"));
  assert.ok(t.includes("Le travail commence dès réception du paiement."));
  assert.ok(t.includes("75 avenue de Grande-Bretagne"));
  assert.ok(!t.includes("Maillot de basket TANK 100 x"), "la ligne sans nom ne doit pas sortir");
});
test("la facture est acquittée, avec la date du paiement, et ne montre pas l'IBAN", () => {
  const t = textes(Fa.creerPdf(Object.assign({}, BASE, { type: "facture", numero: "FAC-2026-001", payeLe: "2026-10-15", refFiche: "FP-2026-001" }), LOGO)).join("\n");
  assert.ok(t.includes("FACTURE") && t.includes("Facture acquittée"));
  assert.ok(t.includes("Paiement reçu le 15 octobre 2026"));
  assert.ok(t.includes("Fiche de paiement associée : FP-2026-001"));
  assert.ok(!t.includes("FR76"));
});
test("aucune mention de TVA, de SIRET ni du BDE sur les documents", () => {
  ["fiche", "facture"].forEach(type => {
    const t = textes(Fa.creerPdf(Object.assign({}, BASE, { type, numero: type === "fiche" ? "FP-2026-001" : "FAC-2026-001", payeLe: "2026-10-15" }), LOGO)).join("\n");
    assert.ok(!/TVA|TTC|HT\b|SIRET|SIREN|RNA|BDE/i.test(t), t);
  });
});
test("beaucoup de lignes : le tableau passe sur une deuxième page, le total et l'IBAN restent entiers, pied de page numéroté", () => {
  const lignes = Array.from({ length: 45 }, (_, i) => ({ designation: "Polo de tennis Essential, modèle " + (i + 1) + ", logo à la poitrine et prénom dans le dos", qty: 1 + (i % 3), unit: 12.5 }));
  const b = Fa.creerPdf(Object.assign({ type: "fiche" }, BASE, { lignes }), LOGO);
  assert.ok(nbPages(b) >= 2, "pages : " + nbPages(b));
  const t = textes(b).join("\n");
  assert.ok(t.includes("Page 1 sur " + nbPages(b)) && t.includes("FR76 1759 8000 0100 0332 1323 381"));
  assert.ok((t.match(/Désignation/g) || []).length >= 2, "l'en-tête du tableau doit se répéter sur chaque page de lignes");
});
test("sans logo, le document se fabrique quand même (le nom de l'asso en gros)", () => {
  const t = textes(Fa.creerPdf(Object.assign({ type: "fiche" }, BASE), null)).join("\n");
  assert.ok(t.includes("Fabr'Icam"));
});
test("les caractères accentués, € et espaces insécables sont encodés (Latin-1 et WinAnsi)", () => {
  const t = textes(Fa.creerPdf(Object.assign({ type: "fiche" }, BASE, { client: { asso: "Élèves d'Électronique – œuvre", contact: "Zoé Ço", email: "" } }), LOGO)).join("\n");
  assert.ok(t.includes("Élèves d'Électronique – œuvre") && t.includes("Zoé Ço"));
});

console.log(ok + " tests réussis.");
