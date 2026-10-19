/*
 * PDF : un tout petit générateur de PDF, sans dépendance (ce fichier tourne aussi dans Node, pour les tests).
 * Il sert aux fiches de paiement et aux factures de l'atelier : du texte (Helvetica, accents compris), des traits,
 * des rectangles et une image PNG (le logo). Pas de polices à embarquer : Helvetica fait partie de tout lecteur de PDF.
 *
 *   var doc = Pdf.create({ title: "...", author: "..." });
 *   doc.addImage("logo", pngBytes);              // PNG RVB 8 bits, sans transparence ni entrelacement
 *   var p = doc.page();                          // A4 par défaut, origine en haut à gauche, unités en points (1 pt = 1/72 pouce)
 *   p.text("Bonjour", 40, 60, { size: 12, bold: true, align: "left" });   // y = ligne de base du texte
 *   p.rect(40, 80, 200, 30, { fill: "#f2f2f2", stroke: "#999", lw: 0.5 });
 *   p.line(40, 120, 555, 120, { lw: 1, color: "#e9920e" });
 *   p.image("logo", 40, 20, 120, 60);
 *   var octets = doc.output();                   // Uint8Array du fichier .pdf
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Pdf = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Largeurs des caractères d'Helvetica et d'Helvetica-Bold (en 1/1000 de la taille), codes WinAnsi 32 à 255
  var W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
  var W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556];

  // Les caractères au-delà de Latin-1 qui existent en WinAnsi (€, ’, –, œ...)
  var WIN = { 8364: 128, 8218: 130, 402: 131, 8222: 132, 8230: 133, 8224: 134, 8225: 135, 710: 136, 8240: 137, 352: 138, 8249: 139, 338: 140, 381: 142,
    8216: 145, 8217: 146, 8220: 147, 8221: 148, 8226: 149, 8211: 150, 8212: 151, 732: 152, 8482: 153, 353: 154, 8250: 155, 339: 156, 382: 158, 376: 159 };

  // Code WinAnsi d'un caractère. Espaces insécables (dont l'espace fine du français) : l'espace insécable. Inconnu : « ? ».
  function code(ch) {
    var c = ch.charCodeAt(0);
    if (c === 0x202f || c === 0x00a0 || c === 0x2009) return 160;
    if (c >= 32 && c < 127) return c;
    if (c >= 161 && c <= 255) return c;
    if (WIN[c]) return WIN[c];
    return 63;
  }
  function propre(s) { return String(s == null ? "" : s).replace(/[\r\n\t]+/g, " "); }

  // Largeur d'un texte, en points
  function width(s, size, bold) {
    var t = bold ? W_BOLD : W_REG, w = 0;
    s = propre(s);
    for (var i = 0; i < s.length; i++) w += t[code(s.charAt(i)) - 32] || 0;
    return w * size / 1000;
  }

  // Coupe un texte en lignes qui tiennent dans maxW points. Un mot plus long que la ligne est coupé net.
  function wrap(s, size, bold, maxW) {
    var out = [];
    String(s == null ? "" : s).split(/\r?\n/).forEach(function (para) {
      var words = para.split(/ +/).filter(function (w) { return w.length; }), line = "";
      if (!words.length) { out.push(""); return; }
      words.forEach(function (w) {
        while (width(w, size, bold) > maxW && w.length > 1) {     // mot trop long : on le coupe
          var k = w.length - 1;
          while (k > 1 && width(w.slice(0, k), size, bold) > maxW) k--;
          if (line) { out.push(line); line = ""; }
          out.push(w.slice(0, k)); w = w.slice(k);
        }
        var test = line ? line + " " + w : w;
        if (line && width(test, size, bold) > maxW) { out.push(line); line = w; } else line = test;
      });
      out.push(line);
    });
    return out;
  }

  /* ---------- petits outils d'écriture ---------- */
  function num(x) { var r = Math.round(x * 100) / 100; return String(Object.is(r, -0) ? 0 : r); }
  function hex2(n) { return (n < 16 ? "0" : "") + n.toString(16).toUpperCase(); }
  function textHex(s) {
    s = propre(s); var out = "";
    for (var i = 0; i < s.length; i++) out += hex2(code(s.charAt(i)));
    return "<" + out + ">";
  }
  function utf16Hex(s) {      // chaîne de métadonnées (titre du document) en UTF-16BE
    var out = "FEFF";
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); out += hex2(c >> 8) + hex2(c & 255); }
    return "<" + out + ">";
  }
  function rgb(c, fallback) {
    if (c == null) c = fallback;
    if (typeof c === "string") {
      var m = /^#?([0-9a-f]{6})$/i.exec(c);
      if (!m) c = fallback; else { var v = parseInt(m[1], 16); c = [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
      if (typeof c === "string") return rgb(c, [0, 0, 0]);
    }
    return num(c[0] / 255) + " " + num(c[1] / 255) + " " + num(c[2] / 255);
  }
  function ascii(s) { var a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; }
  function concat(parts) {
    var n = 0, i; for (i = 0; i < parts.length; i++) n += parts[i].length;
    var out = new Uint8Array(n), o = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
    return out;
  }

  // Lit un PNG RVB 8 bits non entrelacé : dimensions et flux de données compressé (IDAT), repris tel quel par le PDF.
  function lirePng(bytes) {
    var sig = [137, 80, 78, 71, 13, 10, 26, 10], i;
    for (i = 0; i < 8; i++) if (bytes[i] !== sig[i]) throw new Error("Ce n'est pas un PNG.");
    var pos = 8, w = 0, h = 0, prof = 0, type = -1, inter = 0, idat = [];
    function r32(o) { return ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0; }
    while (pos + 8 <= bytes.length) {
      var len = r32(pos), t = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
      if (t === "IHDR") { w = r32(pos + 8); h = r32(pos + 12); prof = bytes[pos + 16]; type = bytes[pos + 17]; inter = bytes[pos + 20]; }
      else if (t === "IDAT") idat.push(bytes.subarray(pos + 8, pos + 8 + len));
      else if (t === "IEND") break;
      pos += 12 + len;
    }
    if (prof !== 8 || type !== 2 || inter !== 0) throw new Error("Le logo du PDF doit être un PNG RVB 8 bits, sans transparence ni entrelacement.");
    return { w: w, h: h, data: concat(idat) };
  }

  var A4 = { w: 595.28, h: 841.89 };

  function create(opts) {
    opts = opts || {};
    var pages = [], images = {}, imageOrder = [];

    function addImage(name, bytes) {
      var png = lirePng(bytes);
      images[name] = png; imageOrder.push(name);
      return png;
    }

    function page(w, h) {
      var PW = w || A4.w, PH = h || A4.h, ops = [], used = {};
      var p = {
        width: PW, height: PH,
        // y : ligne de base du texte. align : left (par défaut), right ou center autour de x.
        text: function (s, x, y, o) {
          o = o || {};
          var size = o.size || 10, bold = !!o.bold, tw = width(s, size, bold);
          if (o.align === "right") x -= tw; else if (o.align === "center") x -= tw / 2;
          ops.push("BT /" + (bold ? "F2" : "F1") + " " + num(size) + " Tf " + rgb(o.color, [0, 0, 0]) + " rg " + num(x) + " " + num(PH - y) + " Td " + textHex(s) + " Tj ET");
          return tw;
        },
        // Texte sur plusieurs lignes dans une largeur donnée ; rend la ligne de base de la ligne suivante.
        paragraph: function (s, x, y, maxW, o) {
          o = o || {};
          var size = o.size || 10, lead = o.leading || size * 1.35;
          wrap(s, size, !!o.bold, maxW).forEach(function (l) { if (l) p.text(l, x, y, o); y += lead; });
          return y;
        },
        line: function (x1, y1, x2, y2, o) {
          o = o || {};
          ops.push("q " + num(o.lw || 1) + " w " + rgb(o.color, [0, 0, 0]) + " RG " + (o.dash ? "[" + o.dash.map(num).join(" ") + "] 0 d " : "") + num(x1) + " " + num(PH - y1) + " m " + num(x2) + " " + num(PH - y2) + " l S Q");
        },
        rect: function (x, y, rw, rh, o) {
          o = o || {};
          var op = o.fill && o.stroke ? "B" : o.fill ? "f" : "S";
          ops.push("q " + (o.fill ? rgb(o.fill, [255, 255, 255]) + " rg " : "") + (o.stroke || !o.fill ? num(o.lw || 1) + " w " + rgb(o.stroke, [0, 0, 0]) + " RG " : "") +
            num(x) + " " + num(PH - y - rh) + " " + num(rw) + " " + num(rh) + " re " + op + " Q");
        },
        image: function (name, x, y, iw, ih) {
          if (!images[name]) throw new Error("Image inconnue : " + name);
          used[name] = 1;
          ops.push("q " + num(iw) + " 0 0 " + num(ih) + " " + num(x) + " " + num(PH - y - ih) + " cm /Im_" + name + " Do Q");
        },
        _ops: ops, _used: used
      };
      pages.push(p);
      return p;
    }

    function output() {
      if (!pages.length) page();
      var chunks = [], offs = [], len = 0;
      function put(part) { var b = typeof part === "string" ? ascii(part) : part; chunks.push(b); len += b.length; }
      function obj(n, body, stream) {
        offs[n] = len;
        if (stream) { put(n + " 0 obj\n<< " + body + " /Length " + stream.length + " >>\nstream\n"); put(stream); put("\nendstream\nendobj\n"); }
        else put(n + " 0 obj\n" + body + "\nendobj\n");
      }
      // numéros d'objets : 1 catalogue, 2 pages, 3 et 4 polices, 5 informations, puis images, puis (page, contenu) par page
      var next = 6, imgNum = {};
      imageOrder.forEach(function (name) { imgNum[name] = next++; });
      var pageNum = pages.map(function () { var pn = next; next += 2; return pn; });
      var total = next;

      put("%PDF-1.4\n"); put(new Uint8Array([37, 226, 227, 207, 211, 10]));
      obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
      obj(2, "<< /Type /Pages /Count " + pages.length + " /Kids [" + pageNum.map(function (n) { return n + " 0 R"; }).join(" ") + "] >>");
      obj(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
      obj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
      var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; };
      var info = "<< /Producer (Fabr'Icam) /Creator (Fabr'Icam Flocage)" + (opts.title ? " /Title " + utf16Hex(opts.title) : "") + (opts.author ? " /Author " + utf16Hex(opts.author) : "") +
        " /CreationDate (D:" + d.getUTCFullYear() + z(d.getUTCMonth() + 1) + z(d.getUTCDate()) + z(d.getUTCHours()) + z(d.getUTCMinutes()) + z(d.getUTCSeconds()) + "Z) >>";
      obj(5, info);
      imageOrder.forEach(function (name) {
        var im = images[name];
        obj(imgNum[name], "/Type /XObject /Subtype /Image /Width " + im.w + " /Height " + im.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode " +
          "/DecodeParms << /Predictor 15 /Colors 3 /BitsPerComponent 8 /Columns " + im.w + " >>", im.data);
      });
      pages.forEach(function (pg, i) {
        var xo = Object.keys(pg._used).map(function (n) { return "/Im_" + n + " " + imgNum[n] + " 0 R"; }).join(" ");
        obj(pageNum[i], "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + num(pg.width) + " " + num(pg.height) + "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>" + (xo ? " /XObject << " + xo + " >>" : "") + " >> /Contents " + (pageNum[i] + 1) + " 0 R >>");
        obj(pageNum[i] + 1, "", ascii(pg._ops.join("\n")));
      });
      var xref = len, t = "xref\n0 " + total + "\n0000000000 65535 f \n";
      for (var n = 1; n < total; n++) t += ("0000000000" + offs[n]).slice(-10) + " 00000 n \n";
      put(t + "trailer\n<< /Size " + total + " /Root 1 0 R /Info 5 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
      return concat(chunks);
    }

    return { addImage: addImage, page: page, output: output, measure: width, wrap: wrap, A4: A4 };
  }

  return { create: create, width: width, wrap: wrap, A4: A4 };
});
