/*
 * FICHIERS : petits outils sans dépendance pour l'atelier (ce fichier tourne aussi dans Node, pour les tests).
 * - px : nombre de pixels d'une longueur en cm à une résolution donnée
 * - pngAvecDpi : écrit la résolution (300 dpi) dans un PNG, que le canvas du navigateur ne renseigne pas
 * - zip : assemble plusieurs fichiers dans une archive .zip (sans compression : les PNG sont déjà compressés)
 * - csv : texte CSV lisible par Excel en français (séparateur point-virgule)
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Fichiers = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TABLE = null;
  function table() {
    if (TABLE) return TABLE;
    TABLE = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLE[n] = c >>> 0;
    }
    return TABLE;
  }
  function crc32(bytes) {
    var t = table(), c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // 21 cm à 300 dpi = 2480 px
  function px(cm, dpi) { return Math.round(cm / 2.54 * dpi); }

  function u32(v, o, n) { v[o] = (n >>> 24) & 255; v[o + 1] = (n >>> 16) & 255; v[o + 2] = (n >>> 8) & 255; v[o + 3] = n & 255; }
  function r32(v, o) { return ((v[o] << 24) | (v[o + 1] << 16) | (v[o + 2] << 8) | v[o + 3]) >>> 0; }
  function ascii(s) { var a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }

  // Renvoie un nouveau PNG qui déclare « dpi » points par pouce (bloc pHYs, en pixels par mètre).
  // Un éventuel bloc pHYs déjà présent est remplacé.
  function pngAvecDpi(bytes, dpi) {
    var sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (var s = 0; s < 8; s++) if (bytes[s] !== sig[s]) throw new Error("Ce n'est pas un PNG.");
    var parts = [bytes.subarray(0, 8)], pos = 8, done = false;
    var ppm = Math.round(dpi / 0.0254);
    var phys = new Uint8Array(21);
    u32(phys, 0, 9); phys.set(ascii("pHYs"), 4); u32(phys, 8, ppm); u32(phys, 12, ppm); phys[16] = 1;
    u32(phys, 17, crc32(phys.subarray(4, 17)));
    while (pos + 8 <= bytes.length) {
      var len = r32(bytes, pos), type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]), end = pos + 12 + len;
      if (type !== "pHYs") parts.push(bytes.subarray(pos, end));
      if (type === "IHDR" && !done) { parts.push(phys); done = true; }
      pos = end;
    }
    var total = parts.reduce(function (n, p) { return n + p.length; }, 0), out = new Uint8Array(total), o = 0;
    parts.forEach(function (p) { out.set(p, o); o += p.length; });
    return out;
  }

  // Lit la résolution écrite dans un PNG (null s'il n'y en a pas) et ses dimensions
  function pngInfos(bytes) {
    var pos = 8, info = { w: 0, h: 0, dpi: null };
    while (pos + 8 <= bytes.length) {
      var len = r32(bytes, pos), type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
      if (type === "IHDR") { info.w = r32(bytes, pos + 8); info.h = r32(bytes, pos + 12); }
      if (type === "pHYs" && bytes[pos + 16] === 1) info.dpi = Math.round(r32(bytes, pos + 8) * 0.0254);
      pos += 12 + len;
    }
    return info;
  }

  function utf8(s) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(s);
    return Uint8Array.from(Buffer.from(s, "utf8"));
  }

  // files : [{ name, data: Uint8Array }] -> Uint8Array de l'archive
  function zip(files, date) {
    var d = date || new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var locals = [], centrals = [], offset = 0;
    files.forEach(function (f) {
      var name = utf8(f.name), data = f.data, crc = crc32(data);
      var lh = new Uint8Array(30 + name.length), dv = new DataView(lh.buffer);
      dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 0x0800, true); dv.setUint16(8, 0, true);
      dv.setUint16(10, dosTime, true); dv.setUint16(12, dosDate, true); dv.setUint32(14, crc, true);
      dv.setUint32(18, data.length, true); dv.setUint32(22, data.length, true); dv.setUint16(26, name.length, true); dv.setUint16(28, 0, true);
      lh.set(name, 30);
      var ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true); cv.setUint16(14, dosDate, true); cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true);
      cv.setUint16(30, 0, true); cv.setUint16(32, 0, true); cv.setUint16(34, 0, true); cv.setUint16(36, 0, true); cv.setUint32(38, 0, true); cv.setUint32(42, offset, true);
      ch.set(name, 46);
      locals.push(lh, data); centrals.push(ch);
      offset += lh.length + data.length;
    });
    var cdSize = centrals.reduce(function (n, c) { return n + c.length; }, 0);
    var end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
    var all = locals.concat(centrals, [end]), total = all.reduce(function (n, p) { return n + p.length; }, 0), out = new Uint8Array(total), o = 0;
    all.forEach(function (p) { out.set(p, o); o += p.length; });
    return out;
  }

  // lignes : tableau de tableaux ; BOM pour qu'Excel reconnaisse l'UTF-8
  function csv(lignes) {
    var q = function (v) { v = v == null ? "" : String(v); return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return "﻿" + lignes.map(function (l) { return l.map(q).join(";"); }).join("\r\n") + "\r\n";
  }

  return { crc32: crc32, px: px, pngAvecDpi: pngAvecDpi, pngInfos: pngInfos, zip: zip, csv: csv };
});
