/*
 * APERÇU : dessine le vêtement en SVG (1 unité = 1 cm), sur une grille à carreaux de 5 cm,
 * avec les visuels, prénoms et numéros à leur taille réelle.
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function hexToRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function lum(hex) { var c = hexToRgb(hex); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  // amt > 0 éclaircit, amt < 0 assombrit
  function tone(hex, amt) {
    var c = hexToRgb(hex).map(function (v) {
      var t = amt >= 0 ? 255 : 0;
      return Math.round(v + (t - v) * Math.abs(amt));
    });
    return "#" + c.map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
  }

  var BODY_FRONT = "M36 6.5 C39.5 10.5 50.5 10.5 54 6.5 L71 11.5 L87 24.5 L77 36 L69 28 L69 75 Q45 77.5 21 75 L21 28 L13 36 L3 24.5 L19 11.5 Z";
  var BODY_BACK = "M36.5 5.5 C40 7.5 50 7.5 53.5 5.5 L71 11.5 L87 24.5 L77 36 L69 28 L69 75 Q45 77.5 21 75 L21 28 L13 36 L3 24.5 L19 11.5 Z";

  function garment(hex, vue) {
    var dark = lum(hex) < 0.5;
    var stroke = tone(hex, dark ? 0.28 : -0.28);
    var collar = tone(hex, dark ? 0.12 : -0.07);
    var out = "";
    out += '<path d="' + (vue === "dos" ? BODY_BACK : BODY_FRONT) + '" fill="' + hex + '" stroke="' + stroke + '" stroke-width=".35" stroke-linejoin="round"/>';
    out += '<path d="' + (vue === "dos" ? BODY_BACK : BODY_FRONT) + '" fill="url(#pv-shade)"/>';
    // revers de manches
    out += '<path d="M85.2 22.7 L75.2 34.2 M4.8 22.7 L14.8 34.2" stroke="' + stroke + '" stroke-width=".3" fill="none" opacity=".7"/>';
    if (vue === "dos") {
      out += '<path d="M35.5 5.3 C40 9.5 50 9.5 54.5 5.3 L54.5 7.6 C50 12 40 12 35.5 7.6 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".3"/>';
    } else {
      out += '<path d="M35 5.5 L44.4 9.5 L44.4 18 L36.5 12.5 Z M55 5.5 L45.6 9.5 L45.6 18 L53.5 12.5 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".3" stroke-linejoin="round"/>';
      out += '<rect x="43.9" y="9.5" width="2.2" height="17" rx=".3" fill="none" stroke="' + stroke + '" stroke-width=".3"/>';
      [13, 17.5, 22].forEach(function (y) { out += '<circle cx="45" cy="' + y + '" r=".55" fill="' + stroke + '" opacity=".8"/>'; });
    }
    return out;
  }

  // Zone d'un emplacement selon la vue (face ou dos). Les manches sont inversées au dos.
  function zoneForView(prod, empId, vue) {
    var z = prod.zones[empId];
    if (!z) return null;
    if (z.vue === "face" && vue !== "face") return null;
    if (z.vue === "dos" && vue !== "dos") return null;
    if (z.vue === "cote" && vue === "dos") return Object.assign({}, z, { cx: 90 - z.cx, rot: -z.rot });
    return z;
  }

  function defs() {
    return '<defs>' +
      '<pattern id="pv-g1" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#dde5e1" stroke-width=".05"/></pattern>' +
      '<pattern id="pv-g5" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="url(#pv-g1)"/><path d="M5 0H0V5" fill="none" stroke="#c4d0ca" stroke-width=".11"/></pattern>' +
      '<linearGradient id="pv-shade" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>' +
      '</defs>';
  }

  function elementSVG(el, y, sample) {
    var x = -el.w / 2;
    if (el.kind === "image") {
      if (el.src) {
        return '<image href="' + esc(el.src) + '" x="' + x + '" y="' + y + '" width="' + el.w + '" height="' + el.h + '" preserveAspectRatio="xMidYMid meet"/>';
      }
      var cx = 0, cy = y + el.h / 2, r = Math.min(el.w, el.h) * 0.36;
      if (sample) {
        return '<g><rect x="' + x + '" y="' + y + '" width="' + el.w + '" height="' + el.h + '" fill="none"/>' +
          '<circle cx="' + cx + '" cy="' + (cy - el.h * 0.1) + '" r="' + r + '" fill="#e8451e"/>' +
          '<path d="M' + (cx - r * 0.35) + ' ' + (cy - el.h * 0.1 - r * 0.55) + ' L' + (cx + r * 0.45) + ' ' + (cy - el.h * 0.1 - r * 0.05) + ' L' + (cx - r * 0.05) + ' ' + (cy - el.h * 0.1 + 0.05 * r) + ' L' + (cx + r * 0.3) + ' ' + (cy - el.h * 0.1 + r * 0.6) + ' L' + (cx - r * 0.5) + ' ' + (cy - el.h * 0.1 - 0.05 * r) + ' L' + (cx - r * 0.05) + ' ' + (cy - el.h * 0.1 - 0.15 * r) + ' Z" fill="#fff"/>' +
          '<text x="0" y="' + (y + el.h * 0.88) + '" text-anchor="middle" font-family="\'Big Shoulders Display\', Impact, sans-serif" font-weight="800" font-size="' + (el.h * 0.17) + '" fill="#fff">ASSO</text></g>';
      }
      return '<g><rect x="' + x + '" y="' + y + '" width="' + el.w + '" height="' + el.h + '" fill="rgba(255,255,255,.18)" stroke="#e8451e" stroke-width=".25" stroke-dasharray=".9 .7"/>' +
        '<text x="0" y="' + (y + el.h / 2 + 0.55) + '" text-anchor="middle" font-size="1.7" fill="#e8451e" font-family="Hanken Grotesk, sans-serif" font-weight="600">ton visuel</text></g>';
    }
    return '<text x="0" y="' + (y + el.asc) + '" text-anchor="middle" font-family="\'' + esc(el.police) + '\', Impact, sans-serif" font-size="' + el.fontCm +
      '" fill="' + esc(el.couleur) + '" style="paint-order:stroke;stroke:rgba(0,0,0,.28);stroke-width:.09px">' + esc(el.text) + '</text>';
  }

  /*
   * opts : { prod, hex, vue, marquages, piece, ctx, sample, zones }
   * ctx : { prix, produits, emplacements, measure }
   */
  function render(opts) {
    var E = window.Engine, prod = opts.prod, vue = opts.vue || "face", out = "";
    out += '<svg class="pv-svg" viewBox="0 0 90 82" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aperçu du vêtement, vue ' + (vue === "dos" ? "de dos" : "de face") + '">';
    out += defs();
    out += '<rect width="90" height="82" fill="url(#pv-g5)"/>';
    out += garment(opts.hex, vue);

    Object.keys(prod.zones).forEach(function (empId) {
      var z = zoneForView(prod, empId, vue);
      if (!z) return;
      var cfg = opts.marquages && opts.marquages[empId];
      var actif = !!(cfg && cfg.actif);
      if (opts.bare && !actif) return;
      var top = z.top != null ? z.top : z.cy - z.h / 2;
      var sleeve = z.cy != null;
      var tf = sleeve ? "translate(" + z.cx + " " + z.cy + ") rotate(" + (z.rot || 0) + ")" : "translate(" + z.cx + " " + top + ")";
      var zy = sleeve ? -z.h / 2 : 0;
      out += '<g transform="' + tf + '">';
      out += '<rect x="' + (-z.w / 2) + '" y="' + zy + '" width="' + z.w + '" height="' + z.h + '" fill="none" stroke="' + (actif ? "#e8451e" : "#8fa39a") +
        '" stroke-width="' + (actif ? 0.22 : 0.14) + '" stroke-dasharray="' + (actif ? "1 .6" : ".6 .8") + '" opacity="' + (actif ? 0.9 : 0.55) + '"/>';
      if (!actif) {
        out += '<text x="0" y="' + (zy + 1.9) + '" text-anchor="middle" font-size="1.6" fill="#6d8077" font-family="Hanken Grotesk, sans-serif">' + esc(emplLabel(opts, empId)) + '</text>';
      }
      if (actif && opts.piece) {
        var els = E.elementsFor(empId, cfg, opts.piece, prod, opts.ctx);
        var lay = E.layoutStack(els);
        var y0 = sleeve ? -lay.H / 2 : 0;
        lay.items.forEach(function (it) {
          if (it.kind === "image") it.src = cfg.image ? (cfg.image.url || cfg.image.dataUrl) : null;
          out += elementSVG(it, y0 + it.dy, opts.sample);
        });
      }
      out += '</g>';
    });

    out += '<text x="1.5" y="80.4" font-size="1.7" fill="#6d8077" font-family="Hanken Grotesk, sans-serif">carreaux de 5 cm</text>';
    out += '</svg>';
    return out;
  }

  function emplLabel(opts, empId) {
    var z = opts.prod.zones[empId];
    return (z && z.label) || (opts.ctx.emplacements[empId] || {}).label || empId;
  }

  window.Preview = { render: render, esc: esc, lum: lum, tone: tone, zoneForView: zoneForView };
})();
