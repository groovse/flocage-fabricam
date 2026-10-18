// Tests des outils de fichiers de l'atelier : node tests/fichiers.test.js
const assert = require("assert");
const path = require("path");
const zlib = require("zlib");
const F = require(path.join("..", "js", "fichiers.js"));

let ok = 0;
function test(nom, fn) { try { fn(); ok++; console.log("  ok  " + nom); } catch (e) { console.log("  ECHEC " + nom + "\n   " + e.message); process.exitCode = 1; } }

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); out.write(type, 4, "ascii"); data.copy(out, 8);
  out.writeUInt32BE(F.crc32(Uint8Array.from(Buffer.concat([Buffer.from(type, "ascii"), data]))), 8 + data.length);
  return out;
}
// PNG transparent de 2 x 1 pixels, sans bloc de résolution
function petitPng(extra) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.from([0, 0, 0, 0, 0, 255, 0, 0, 255]);
  return Uint8Array.from(Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr)].concat(extra || [], [chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))])));
}

console.log("Dimensions des planches");
test("A4 DTF Print : 21 x 28 cm à 300 dpi = 2480 x 3307 px", () => {
  assert.strictEqual(F.px(21, 300), 2480);
  assert.strictEqual(F.px(28, 300), 3307);
});
test("planche 1 mètre : 56 x 100 cm à 300 dpi = 6614 x 11811 px", () => {
  assert.strictEqual(F.px(56, 300), 6614);
  assert.strictEqual(F.px(100, 300), 11811);
});

console.log("PNG");
test("CRC32 de « 123456789 » = cbf43926", () => {
  assert.strictEqual(F.crc32(Uint8Array.from(Buffer.from("123456789"))), 0xcbf43926);
});
test("la résolution 300 dpi est écrite dans le PNG et l'image reste valide", () => {
  const png = petitPng(), avec = F.pngAvecDpi(png, 300);
  assert.strictEqual(F.pngInfos(png).dpi, null);
  const i = F.pngInfos(avec);
  assert.deepStrictEqual([i.w, i.h, i.dpi], [2, 1, 300]);
  // les blocs sont complets et dans l'ordre : IHDR, pHYs, IDAT, IEND
  const types = []; let pos = 8;
  while (pos < avec.length) { const len = Buffer.from(avec).readUInt32BE(pos); types.push(Buffer.from(avec.subarray(pos + 4, pos + 8)).toString()); pos += 12 + len; }
  assert.deepStrictEqual(types, ["IHDR", "pHYs", "IDAT", "IEND"]);
  assert.strictEqual(pos, avec.length);
});
test("un bloc de résolution déjà présent est remplacé, pas doublé", () => {
  const phys = Buffer.alloc(9); phys.writeUInt32BE(2835, 0); phys.writeUInt32BE(2835, 4); phys[8] = 1;
  const png = petitPng([chunk("pHYs", phys)]);
  assert.strictEqual(F.pngInfos(png).dpi, 72);
  const avec = F.pngAvecDpi(png, 300), s = Buffer.from(avec).toString("latin1");
  assert.strictEqual(s.split("pHYs").length - 1, 1);
  assert.strictEqual(F.pngInfos(avec).dpi, 300);
});
test("un fichier qui n'est pas un PNG est refusé", () => {
  assert.throws(() => F.pngAvecDpi(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]), 300), /PNG/);
});

console.log("Archive zip");
test("l'archive contient les fichiers, avec les bons noms et les bons CRC", () => {
  const a = Uint8Array.from(Buffer.from("bonjour")), b = Uint8Array.from(Buffer.from("planche é"));
  const z = Buffer.from(F.zip([{ name: "dtf-1.png", data: a }, { name: "plan é.png", data: b }], new Date(2026, 9, 19, 10, 30, 0)));
  const eocd = z.length - 22;
  assert.strictEqual(z.readUInt32LE(eocd), 0x06054b50);
  assert.strictEqual(z.readUInt16LE(eocd + 10), 2);
  let pos = z.readUInt32LE(eocd + 16);
  const lus = [];
  for (let i = 0; i < 2; i++) {
    assert.strictEqual(z.readUInt32LE(pos), 0x02014b50);
    const crc = z.readUInt32LE(pos + 16), size = z.readUInt32LE(pos + 24), nl = z.readUInt16LE(pos + 28), off = z.readUInt32LE(pos + 42);
    const nom = z.toString("utf8", pos + 46, pos + 46 + nl);
    assert.strictEqual(z.readUInt32LE(off), 0x04034b50);
    const ln = z.readUInt16LE(off + 26), data = z.subarray(off + 30 + ln, off + 30 + ln + size);
    assert.strictEqual(F.crc32(Uint8Array.from(data)), crc);
    lus.push([nom, data.toString("utf8")]);
    pos += 46 + nl;
  }
  assert.deepStrictEqual(lus, [["dtf-1.png", "bonjour"], ["plan é.png", "planche é"]]);
});

console.log("CSV");
test("séparateur point-virgule, guillemets doublés, BOM pour Excel", () => {
  const t = F.csv([["Nom", "Lien"], ['Polo "Essential"', "https://x.fr/a;b"], ["a\nb", 5]]);
  assert.strictEqual(t.charCodeAt(0), 0xfeff);
  assert.strictEqual(t.slice(1), 'Nom;Lien\r\n"Polo ""Essential""";"https://x.fr/a;b"\r\n"a\nb";5\r\n');
});

console.log(ok + " tests réussis.");
