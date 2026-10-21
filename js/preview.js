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

  /*
   * Contour symétrique : on ne décrit que la moitié droite (x >= 45), du haut au centre jusqu'au bas au centre.
   * segs : ["L", x, y] | ["Q", cx, cy, x, y] | ["C", c1x, c1y, c2x, c2y, x, y]
   */
  function symPath(start, segs) {
    var d = "M" + start[0] + " " + start[1], pts = [start];
    segs.forEach(function (sg) { d += " " + sg[0] + sg.slice(1).join(" "); pts.push([sg[sg.length - 2], sg[sg.length - 1]]); });
    var m = function (x) { return 90 - x; };
    for (var i = segs.length - 1; i >= 0; i--) {
      var sg = segs[i], to = pts[i];
      if (sg[0] === "L") d += " L" + m(to[0]) + " " + to[1];
      else if (sg[0] === "Q") d += " Q" + m(sg[1]) + " " + sg[2] + " " + m(to[0]) + " " + to[1];
      else d += " C" + m(sg[3]) + " " + sg[4] + " " + m(sg[1]) + " " + sg[2] + " " + m(to[0]) + " " + to[1];
    }
    return d + " Z";
  }

  // détails de la moitié droite, recopiés en miroir pour la moitié gauche
  function both(inner) { return inner + '<g transform="translate(90 0) scale(-1 1)">' + inner + '</g>'; }
  function line(d, stroke, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (w || 0.3) + '" stroke-linecap="round" ' + (extra || "") + '/>'; }

  var SLEEVE_LONG = [["Q", 80.5, 30, 82, 66], ["L", 73, 67], ["Q", 70.5, 52, 68.5, 33]];

  function sweatSegs(back) {
    return { start: [45, back ? 8.5 : 12], segs: [["Q", 51, back ? 8.5 : 12, 53.5, 5], ["L", 70, 9]].concat(SLEEVE_LONG, [["L", 69, 74], ["Q", 58, 76.5, 45, 76.5]]) };
  }
  function debardeurSegs(back) {
    return { start: [45, back ? 9 : 15], segs: [["Q", 50, back ? 9 : 15, 51, 4], ["L", 57.5, 4.5], ["C", 57, 15, 66.5, 19, 67, 30], ["L", 67.5, 74], ["Q", 58, 76, 45, 76]] };
  }
  function maillotSegs(back) {
    return { start: [45, back ? 10 : 17], segs: [["Q", 54, back ? 10 : 17, 55, 4], ["L", 61.5, 4.5], ["C", 61, 16, 71, 21, 71.5, 34], ["L", 70.5, 74], ["Q", 58, 76, 45, 76]] };
  }
  function tshirtSegs(back) {
    return { start: [45, back ? 8.5 : 12], segs: [["Q", 51, back ? 8.5 : 12, 54, 6.5], ["L", 71, 11.5], ["L", 87, 24.5], ["L", 77, 36], ["L", 69, 28], ["L", 69, 75], ["Q", 58, 77, 45, 77]] };
  }
  // décale vers le bas un contour décrit par symPath (toutes les ordonnées de dy cm)
  function descendre(g, dy) {
    return { start: [g.start[0], g.start[1] + dy], segs: g.segs.map(function (sg) {
      var c = sg.slice();
      for (var i = 2; i < c.length; i += 2) c[i] += dy;
      return c;
    }) };
  }
  // ensemble t-shirt et short : le t-shirt en haut, le short dessous (le dessin est plus haut que les autres : h = 126)
  var ENSEMBLE_DY = 68;   // décalage du short sous le t-shirt, en cm
  function shortEnsembleSegs() {
    return descendre({ start: [45, 13], segs: [["L", 67, 13], ["L", 69.5, 50], ["L", 50.5, 51.5], ["L", 45, 33]] }, ENSEMBLE_DY);
  }
  // haut ajusté à manches longues (sous-vêtement thermique)
  function longSegs(back) {
    var y = back ? 8.5 : 11.5;
    return { start: [45, y], segs: [["Q", 50.5, y, 52.5, 5.5], ["L", 66, 9.5], ["Q", 77.5, 30, 79, 68], ["L", 72.5, 68.5], ["Q", 70.5, 52, 65.5, 33], ["L", 65, 74], ["Q", 57, 75.5, 45, 75.5]] };
  }
  // gilet sans manches, col montant
  function giletSegs(back) {
    var y = back ? 9 : 10;
    return { start: [45, y], segs: [["Q", 50, y, 51.5, 3.5], ["L", 59, 4], ["C", 58.5, 15, 66.5, 19, 67, 30], ["L", 68, 74], ["Q", 58, 76, 45, 76]] };
  }
  // chasuble de football : large, sans manches, grandes emmanchures, encolure profonde devant
  function chasubleSegs(back) {
    var y = back ? 8 : 20;
    return { start: [45, y], segs: [["Q", 54, y, 55, 4], ["L", 63, 4.5], ["C", 62, 19, 71, 24, 71.5, 38], ["L", 72, 74], ["Q", 58, 76.5, 45, 76.5]] };
  }
  // bande du col (moitié droite, recopiée en miroir)
  function neckband(y, stroke, collar, top) {
    var t = top == null ? 5 : top;
    return both('<path d="M45 ' + y + ' Q51 ' + y + ' 53.5 ' + t + ' L53.5 ' + (t + 2.4) + ' Q51 ' + (y + 2.4) + ' 45 ' + (y + 2.4) + ' Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>');
  }
  // fermeture éclair devant, de y0 à y1, avec sa tirette
  function zip(y0, y1, stroke) {
    return line("M45 " + y0 + " L45 " + y1, stroke, 0.55, 'stroke-dasharray=".4 .4" opacity=".75"') +
      '<rect x="44.3" y="' + (y0 + 0.4) + '" width="1.4" height="2.6" rx=".4" fill="' + stroke + '"/>';
  }
  // dessin des deux chaussettes (pied vers le centre) ; mx transforme les abscisses
  function sockPath(mx) {
    var p = function (x, y) { return mx(x) + " " + y; };
    return "M" + p(12, 4) + " L" + p(28, 4) + " L" + p(27.5, 40) + " Q" + p(27.5, 46) + " " + p(34, 48.5) + " Q" + p(42, 51) + " " + p(42, 55) +
      " Q" + p(42, 59) + " " + p(37, 59) + " L" + p(17, 59) + " Q" + p(10.5, 59) + " " + p(10.5, 52) + " Z";
  }
  function zipSweat(len, stroke, vue) {
    return vue === "dos" ? "" : zip(12, len, stroke);
  }
  var MODELS = {
    tshirt: {
      path: function (vue) { var g = tshirtSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke, collar) {
        var y = vue === "dos" ? 8.5 : 12;
        return neckband(y, stroke, collar, 6.5) + line("M21 72 Q45 74.4 69 72", stroke, 0.3, 'opacity=".8"') + both(line("M85.2 22.7 L75.2 34.2", stroke, 0.3, 'opacity=".8"'));
      }
    },
    "ensemble-short": {
      h: 126,
      path: function (vue) {
        var t = tshirtSegs(vue === "dos"), sh = shortEnsembleSegs();
        return symPath(t.start, t.segs) + " " + symPath(sh.start, sh.segs);
      },
      details: function (vue, stroke, collar) {
        var y = vue === "dos" ? 8.5 : 12, dy = ENSEMBLE_DY;
        var haut = neckband(y, stroke, collar, 6.5) + line("M21 72 Q45 74.4 69 72", stroke, 0.3, 'opacity=".8"') + both(line("M85.2 22.7 L75.2 34.2", stroke, 0.3, 'opacity=".8"'));
        var bas = both('<path d="M45 13 L67 13 L67.2 18.2 L45 18.2 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>') +
          (vue === "dos" ? "" : line("M45 18.2 L45 22", stroke, 0.3) + both(line("M43.2 19.5 Q44.5 24 44 27.5", stroke, 0.35))) +
          both(line("M50.8 47.2 L69.3 46", stroke, 0.3, 'opacity=".7"'));
        return haut + '<g transform="translate(0 ' + dy + ')">' + bas + '</g>';
      }
    },
    "manches-longues": {
      path: function (vue) { var g = longSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke, collar) {
        var y = vue === "dos" ? 8.5 : 11.5;
        return neckband(y, stroke, collar, 5.5) + line("M25.6 71 Q45 73 64.4 71", stroke, 0.3, 'opacity=".8"') + both(line("M73.6 63.3 L78.6 63"  , stroke, 0.3, 'opacity=".8"'));
      }
    },
    veste: {
      path: function (vue) { var g = sweatSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke, collar) {
        var back = vue === "dos", y = back ? 8.5 : 12;
        return neckband(y, stroke, collar) + line("M21 69.8 Q45 72.3 69 69.8", stroke, 0.3, 'opacity=".8"') + both(line("M72.4 61.4 L81.9 61", stroke, 0.3, 'opacity=".8"')) +
          zipSweat(76, stroke, vue) + (back ? "" : both(line("M55 52 L56.5 68", stroke, 0.35, 'opacity=".8"')));
      }
    },
    "sweat-zip": {
      path: function (vue) { var g = sweatSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke, collar) {
        var back = vue === "dos", y = back ? 8.5 : 12;
        return neckband(y, stroke, collar) + line("M21 69.8 Q45 72.3 69 69.8", stroke, 0.3, 'opacity=".8"') + both(line("M72.4 61.4 L81.9 61", stroke, 0.3, 'opacity=".8"')) +
          zipSweat(28, stroke, vue);
      }
    },
    gilet: {
      path: function (vue) { var g = giletSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke, collar) {
        var back = vue === "dos", y = back ? 9 : 10;
        return neckband(y, stroke, collar, 3.5) + (back ? "" : zip(y + 2.4, 76, stroke) + both(line("M51.5 56 L60 53.5", stroke, 0.35, 'opacity=".8"')));
      }
    },
    "gilet-matelasse": {
      path: function (vue) { var g = giletSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke, collar) {
        var back = vue === "dos", y = back ? 9 : 10, quilt = "";
        [24, 33, 42, 51, 60, 69].forEach(function (yy) { quilt += line("M" + (yy < 30 ? 28 : 22.5) + " " + yy + " Q45 " + (yy + 1.6) + " " + (yy < 30 ? 62 : 67.5) + " " + yy, stroke, 0.3, 'opacity=".55"'); });
        return neckband(y, stroke, collar, 3.5) + quilt + (back ? "" : zip(y + 2.4, 76, stroke));
      }
    },
    pantalon: {
      h: 106,
      path: function () { return symPath([45, 4], [["L", 68, 4], ["L", 71, 24], ["L", 67.5, 102], ["L", 51.5, 102], ["L", 45, 35]]); },
      details: function (vue, stroke, collar) {
        var out = both('<path d="M45 4 L68 4 L68.2 10 L45 10 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>') + both(line("M51.7 97 L67.7 97", stroke, 0.3, 'opacity=".8"'));
        if (vue !== "dos") out += both(line("M43.6 10.8 Q44.6 15 44 19", stroke, 0.35)) + both(line("M68.3 11.5 Q63.5 14 62 25", stroke, 0.3, 'opacity=".75"'));
        return out;
      }
    },
    "short-slim": {
      dy: 12,
      path: function () { return symPath([45, 13], [["L", 66, 13], ["L", 67, 44], ["L", 49, 45.5], ["L", 45, 31]]); },
      details: function (vue, stroke, collar) {
        return both('<path d="M45 13 L66 13 L66.2 18.2 L45 18.2 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>') + both(line("M49.6 41.4 L66.9 40.4", stroke, 0.3, 'opacity=".7"'));
      }
    },
    chaussette: {
      h: 64,
      path: function () { return sockPath(function (x) { return x; }) + " " + sockPath(function (x) { return 90 - x; }); },
      details: function (vue, stroke, collar) {
        return both(line("M11.6 9.5 L28 9.5", stroke, 0.3, 'opacity=".8"') + '<path d="M10.8 50.5 Q10.2 59 17 59 L22 59 L22 55 Q15 55 10.8 50.5 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".2"/>' +
          '<path d="M36 59 Q42 59 42 55 Q42 52 38.5 51 L36 55 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".2"/>');
      }
    },
    /* ---- Accessoires : dessinés à l'échelle réelle (1 unité = 1 cm) sur un fond plus petit que celui des vêtements (w x h) ---- */
    gourde: {
      w: 40, h: 36,
      path: function () { return "M15.7 33.6 L15.7 14 Q15.7 10 18.2 8.6 L18.2 6.3 L21.8 6.3 L21.8 8.6 Q24.3 10 24.3 14 L24.3 33.6 Q24.3 34.6 23.3 34.6 L16.7 34.6 Q15.7 34.6 15.7 33.6 Z"; },
      details: function (vue, stroke, collar) {
        return '<path d="M17.4 3.4 L22.6 3.4 L22.6 6.3 L17.4 6.3 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>' +
          line("M18.6 3.4 Q20 1.2 21.4 3.4", stroke, 0.35) + line("M15.9 31.6 L24.1 31.6", stroke, 0.3, 'opacity=".7"') +
          line("M16.6 14.5 L16.6 30", "#ffffff", 0.5, 'opacity=".3"');
      }
    },
    casquette: {
      w: 36, h: 30,
      path: function (vue) {
        return vue === "dos" ? "M7 19 C7 9 13 4.5 18 4.5 C23 4.5 29 9 29 19 Q18 21.4 7 19 Z"
          : "M7 19 C7 9 13 4.5 18 4.5 C23 4.5 29 9 29 19 Q33.8 20.6 31.6 23.8 Q18 28.8 4.4 23.8 Q2.2 20.6 7 19 Z";
      },
      details: function (vue, stroke, collar) {
        var out = '<circle cx="18" cy="4.9" r=".9" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".2"/>' +
          line("M18 5.6 Q17.2 12 18 19", stroke, 0.25, 'opacity=".7"') + line("M12.4 6.6 Q11 12 12 18.6", stroke, 0.25, 'opacity=".6"') + line("M23.6 6.6 Q25 12 24 18.6", stroke, 0.25, 'opacity=".6"');
        if (vue === "dos") return out + line("M8 17.4 Q18 19.6 28 17.4", stroke, 0.3) + '<rect x="14" y="17.2" width="8" height="1.9" rx=".4" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".2"/>';
        return out + line("M7.2 19 Q18 17.4 28.8 19", stroke, 0.35) + line("M5.6 22.9 Q18 27.4 30.4 22.9", stroke, 0.25, 'opacity=".7"');
      }
    },
    bonnet: {
      w: 36, h: 32,
      path: function () { return "M6 26.6 L6 17.6 C5.4 9.6 11.2 3.2 18 3.2 C24.8 3.2 30.6 9.6 30 17.6 L30 26.6 Q18 28.2 6 26.6 Z"; },
      details: function (vue, stroke, collar) {
        var rib = "";
        for (var x = 8; x < 30; x += 2) rib += line("M" + x + " 18.6 L" + x + " 26.9", stroke, 0.2, 'opacity=".45"');
        return '<path d="M6 17.6 Q18 19.4 30 17.6 L30 26.6 Q18 28.2 6 26.6 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>' + rib +
          line("M6 17.6 Q18 19.4 30 17.6", stroke, 0.3) +
          line("M12 6.4 Q10 11 10.6 15.6", stroke, 0.2, 'opacity=".5"') + line("M18 3.6 L18 15.8", stroke, 0.2, 'opacity=".5"') + line("M24 6.4 Q26 11 25.4 15.6", stroke, 0.2, 'opacity=".5"');
      }
    },
    "tour-de-cou": {
      w: 56, h: 56,
      path: function () { return "M15.5 3.4 L40.5 3.4 L40.5 52.6 L15.5 52.6 Z"; },
      details: function (vue, stroke) {
        return line("M15.5 5.6 L40.5 5.6", stroke, 0.3, 'opacity=".8"') + line("M15.5 50.4 L40.5 50.4", stroke, 0.3, 'opacity=".8"') +
          line("M18 6 Q17 28 18 50", stroke, 0.2, 'opacity=".35"') + line("M38 6 Q39 28 38 50", stroke, 0.2, 'opacity=".35"');
      }
    },
    bandeau: {
      w: 40, h: 30,
      path: function () { return "M9 10.6 Q20 9 31 10.6 L31 19.6 Q20 21.2 9 19.6 Z"; },
      details: function (vue, stroke) {
        return line("M9.6 12.1 Q20 10.6 30.4 12.1", stroke, 0.25, 'opacity=".7"') + line("M9.6 18.2 Q20 19.8 30.4 18.2", stroke, 0.25, 'opacity=".7"');
      }
    },
    "sac-tube": {
      w: 70, h: 44,
      path: function () { return "M12 8 L58 8 Q65 8 65 15 L65 31 Q65 38 58 38 L12 38 Q5 38 5 31 L5 15 Q5 8 12 8 Z"; },
      details: function (vue, stroke, collar) {
        return line("M22 8 Q22 3 27 3 L43 3 Q48 3 48 8", collar, 1.3) + line("M22 8 Q22 3 27 3 L43 3 Q48 3 48 8", stroke, 0.25) +
          line("M12.5 8.3 Q9.6 23 12.5 37.7", stroke, 0.3, 'opacity=".8"') + line("M57.5 8.3 Q60.4 23 57.5 37.7", stroke, 0.3, 'opacity=".8"') +
          line("M16 11.4 Q35 13.2 54 11.4", stroke, 0.3, 'opacity=".7"') + '<rect x="33.2" y="10.6" width="3.6" height="1.8" rx=".5" fill="' + stroke + '"/>';
      }
    },
    "sac-sport": {
      w: 64, h: 50,
      path: function () { return "M8 15 Q8 11.4 11.6 11.4 L52.4 11.4 Q56 11.4 56 15 L56 38.4 Q56 42 52.4 42 L11.6 42 Q8 42 8 38.4 Z"; },
      details: function (vue, stroke, collar) {
        return line("M20 11.4 Q20 5.6 25 5.6 L39 5.6 Q44 5.6 44 11.4", collar, 1.3) + line("M20 11.4 Q20 5.6 25 5.6 L39 5.6 Q44 5.6 44 11.4", stroke, 0.25) +
          line("M12 11.8 Q32 2 52 11.8", stroke, 0.4, 'opacity=".75" stroke-dasharray="1.2 .6"') +
          line("M11 15.6 L53 15.6", stroke, 0.3, 'opacity=".75"') + line("M11 39 L53 39", stroke, 0.3, 'opacity=".6"') +
          '<rect x="29.2" y="14.8" width="5.6" height="1.8" rx=".5" fill="' + stroke + '"/>';
      }
    },
    "sac-a-dos": {
      w: 56, h: 52,
      path: function () { return "M16.4 10.2 Q16.4 5.2 21.4 5.2 L34.6 5.2 Q39.6 5.2 39.6 10.2 L40.8 42.4 Q41 47.4 36 47.4 L20 47.4 Q15 47.4 15.2 42.4 Z"; },
      details: function (vue, stroke, collar) {
        var out = line("M24.4 5.4 Q24.4 2.6 28 2.6 Q31.6 2.6 31.6 5.4", collar, 1.1) + line("M24.4 5.4 Q24.4 2.6 28 2.6 Q31.6 2.6 31.6 5.4", stroke, 0.25);
        if (vue === "dos") {
          return out + '<path d="M19.4 8.6 Q16.6 28 20.2 44.6 L23.8 44.4 Q21.2 28 24.4 8.8 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>' +
            '<path d="M36.6 8.6 Q39.4 28 35.8 44.6 L32.2 44.4 Q34.8 28 31.6 8.8 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>' +
            line("M22 18 Q28 20 34 18", stroke, 0.25, 'opacity=".6"');
        }
        return out + line("M20 10.4 Q28 8.6 36 10.4", stroke, 0.3, 'opacity=".75"') + '<rect x="26.6" y="9.1" width="2.8" height="1.6" rx=".4" fill="' + stroke + '"/>' +
          line("M17.4 33 Q28 35.6 38.6 33", stroke, 0.3, 'opacity=".7"') + line("M17.6 41.4 Q28 43.6 38.4 41.4", stroke, 0.25, 'opacity=".5"');
      }
    },
    ceinture: {
      w: 40, h: 30,
      path: function () { return "M2 13.4 L10 13.4 L10 11.2 Q10 10 11.2 10 L28.8 10 Q30 10 30 11.2 L30 13.4 L38 13.4 L38 18.4 L30 18.4 L30 19.8 Q30 21 28.8 21 L11.2 21 Q10 21 10 19.8 L10 18.4 L2 18.4 Z"; },
      details: function (vue, stroke) {
        return line("M11.4 12.4 L28.6 12.4", stroke, 0.3, 'opacity=".75"') + '<rect x="18" y="11.6" width="4" height="1.6" rx=".5" fill="' + stroke + '"/>' +
          line("M3 15.9 L9.6 15.9", stroke, 0.25, 'opacity=".6"') + line("M30.4 15.9 L37 15.9", stroke, 0.25, 'opacity=".6"');
      }
    },
    chasuble: {
      path: function (vue) { var g = chasubleSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke) {
        return line("M19.5 72.6 Q45 75.4 70.5 72.6", stroke, 0.3, 'opacity=".8"') + both(line("M59 4.8 L59.6 13", stroke, 0.3, 'opacity=".7"'));
      }
    },
    /* ---- Serviette de bain 80 x 130 cm, ouvre-bouteilles : dessinés à l'échelle réelle ---- */
    serviette: {
      w: 90, h: 140,
      path: function () { return "M7 5 L83 5 Q85 5 85 7 L85 133 Q85 135 83 135 L7 135 Q5 135 5 133 L5 7 Q5 5 7 5 Z"; },
      details: function (vue, stroke) {
        return line("M5.8 8.2 L84.2 8.2", stroke, 0.3, 'stroke-dasharray="1.2 .8" opacity=".7"') + line("M5.8 131.8 L84.2 131.8", stroke, 0.3, 'stroke-dasharray="1.2 .8" opacity=".7"') +
          line("M8.2 5.8 L8.2 134.2", stroke, 0.25, 'stroke-dasharray="1.2 .8" opacity=".5"') + line("M81.8 5.8 L81.8 134.2", stroke, 0.25, 'stroke-dasharray="1.2 .8" opacity=".5"');
      }
    },
    // carte de crédit en métal, 5,4 x 8,5 cm : fente d'ouverture en haut (la place du motif est dessous)
    "ouvre-bouteille": {
      w: 24, h: 18,
      path: function () { return "M9.9 4.95 L14.1 4.95 Q14.7 4.95 14.7 5.55 L14.7 12.85 Q14.7 13.45 14.1 13.45 L9.9 13.45 Q9.3 13.45 9.3 12.85 L9.3 5.55 Q9.3 4.95 9.9 4.95 Z"; },
      details: function (vue, stroke) {
        return '<path d="M10.6 5.9 L13.4 5.9 L13.4 7.1 Q13.4 7.4 13.1 7.4 L10.9 7.4 Q10.6 7.4 10.6 7.1 Z" fill="url(#pv-g5)" stroke="' + stroke + '" stroke-width=".25"/>' +
          line("M9.7 13 L14.3 13", stroke, 0.2, 'opacity=".5"');
      }
    },
    // porte-clés décapsuleur en aluminium, debout : anneau en haut, barre d'environ 1,9 x 6,6 cm
    "porte-cles": {
      w: 14, h: 12,
      path: function () { return "M6.25 4.2 L7.75 4.2 Q7.95 4.2 7.95 4.4 L7.95 10.6 Q7.95 10.8 7.75 10.8 L6.25 10.8 Q6.05 10.8 6.05 10.6 L6.05 4.4 Q6.05 4.2 6.25 4.2 Z"; },
      details: function (vue, stroke) {
        return '<circle cx="7" cy="2.7" r="1.4" fill="none" stroke="' + stroke + '" stroke-width=".3"/>' +
          '<circle cx="7" cy="4.9" r=".35" fill="url(#pv-g5)" stroke="' + stroke + '" stroke-width=".2"/>' +
          '<path d="M6.5 9.5 L7.5 9.5 L7.5 10.3 L6.5 10.3 Z" fill="url(#pv-g5)" stroke="' + stroke + '" stroke-width=".2"/>';
      }
    },
    polo: {
      path: function (vue) { return vue === "dos" ? BODY_BACK : BODY_FRONT; },
      details: function (vue, stroke, collar) {
        var out = '<path d="M85.2 22.7 L75.2 34.2 M4.8 22.7 L14.8 34.2" stroke="' + stroke + '" stroke-width=".3" fill="none" opacity=".7"/>';
        if (vue === "dos") {
          out += '<path d="M35.5 5.3 C40 9.5 50 9.5 54.5 5.3 L54.5 7.6 C50 12 40 12 35.5 7.6 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".3"/>';
        } else {
          out += '<path d="M35 5.5 L44.4 9.5 L44.4 18 L36.5 12.5 Z M55 5.5 L45.6 9.5 L45.6 18 L53.5 12.5 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".3" stroke-linejoin="round"/>';
          out += '<rect x="43.9" y="9.5" width="2.2" height="17" rx=".3" fill="none" stroke="' + stroke + '" stroke-width=".3"/>';
          [13, 17.5, 22].forEach(function (y) { out += '<circle cx="45" cy="' + y + '" r=".55" fill="' + stroke + '" opacity=".8"/>'; });
        }
        return out;
      }
    },
    sweat: {
      path: function (vue) { var g = sweatSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke, collar) {
        var back = vue === "dos", y = back ? 8.5 : 12;
        var band = both('<path d="M45 ' + y + ' Q51 ' + y + ' 53.5 5 L53.5 7.6 Q51 ' + (y + 2.6) + ' 45 ' + (y + 2.6) + ' Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>');
        var hem = line("M21 69.8 Q45 72.3 69 69.8", stroke, 0.3, 'opacity=".8"');
        var cuff = both(line("M72.4 61.4 L81.9 61", stroke, 0.3, 'opacity=".8"'));
        return band + hem + cuff;
      }
    },
    debardeur: {
      path: function (vue) { var g = debardeurSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke, collar) {
        var hem = line("M23 71.4 Q45 73.8 67 71.4", stroke, 0.3, 'opacity=".8"');
        return hem;
      }
    },
    maillot: {
      path: function (vue) { var g = maillotSegs(vue === "dos"); return symPath(g.start, g.segs); },
      details: function (vue, stroke, collar) {
        var hem = line("M19.8 71.4 Q45 73.8 70.2 71.4", stroke, 0.3, 'opacity=".8"');
        // liseré noir du col et des emmanchures
        var y = vue === "dos" ? 10 : 17;
        var trim = both('<path d="M45 ' + y + ' Q54 ' + y + ' 55 4" fill="none" stroke="#2a2a2e" stroke-width="1.1" stroke-linecap="round"/><path d="M61.5 4.5 C61 16 71 21 71.5 34" fill="none" stroke="#2a2a2e" stroke-width="1.1" stroke-linecap="round"/>');
        return hem + trim;
      }
    },
    "short-basket": {
      dy: 9,
      path: function () { return symPath([45, 13], [["L", 68, 13], ["L", 71.5, 57], ["L", 49, 58.5], ["L", 45, 35]]); },
      details: function (vue, stroke, collar) {
        return both('<path d="M45 13 L68 13 L68.3 18.8 L45 18.8 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>') +
          line("M45 18.8 L45 23", stroke, 0.3) + both(line("M43.2 20 Q44.5 24.5 44 28", stroke, 0.35)) +
          both(line("M49.6 54.2 L71 52.8", stroke, 0.3, 'opacity=".7"'));
      }
    },
    "short-tennis": {
      dy: 12,
      path: function () { return symPath([45, 13], [["L", 67, 13], ["L", 69.5, 50], ["L", 50.5, 51.5], ["L", 45, 33]]); },
      details: function (vue, stroke, collar) {
        return both('<path d="M45 13 L67 13 L67.2 18.2 L45 18.2 Z" fill="' + collar + '" stroke="' + stroke + '" stroke-width=".25"/>') +
          line("M45 18.2 L45 22", stroke, 0.3) + both(line("M43.2 19.5 Q44.5 24 44 27.5", stroke, 0.35)) +
          both(line("M50.8 47.2 L69.3 46", stroke, 0.3, 'opacity=".7"'));
      }
    }
  };

  function garment(hex, vue, model) {
    var dark = lum(hex) < 0.5;
    var stroke = tone(hex, dark ? 0.28 : -0.28);
    var collar = tone(hex, dark ? 0.12 : -0.07);
    var m = MODELS[model] || MODELS.polo, d = m.path(vue);
    return '<path d="' + d + '" fill="' + hex + '" stroke="' + stroke + '" stroke-width=".35" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="url(#pv-shade)"/>' + m.details(vue, stroke, collar);
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

  // Un élément d'un emplacement, en cm dans le repère de la zone : y = haut de l'élément dans la pile, centré en x.
  // ux, uy : position choisie par le client (décalage). Un visuel porte aussi w0 × h0 (sa taille avant rotation) et rot (quart de tour).
  function elementSVG(el, y, sample) {
    var ux = el.ux || 0, uy = el.uy || 0;
    if (el.kind === "image") {
      var w0 = el.w0 != null ? el.w0 : el.w, h0 = el.h0 != null ? el.h0 : el.h, rot = el.rot || 0;
      var cx = ux, cy = y + uy + el.h / 2, x = cx - w0 / 2, top = cy - h0 / 2;
      var tf = rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : "";
      if (el.src) {
        return '<image href="' + esc(el.src) + '" x="' + x + '" y="' + top + '" width="' + w0 + '" height="' + h0 + '" preserveAspectRatio="xMidYMid meet"' + tf + '/>';
      }
      var r = Math.min(w0, h0) * 0.36;
      if (sample) {
        return '<g' + tf + '><rect x="' + x + '" y="' + top + '" width="' + w0 + '" height="' + h0 + '" fill="none"/>' +
          '<circle cx="' + cx + '" cy="' + (cy - h0 * 0.1) + '" r="' + r + '" fill="#e8451e"/>' +
          '<path d="M' + (cx - r * 0.35) + ' ' + (cy - h0 * 0.1 - r * 0.55) + ' L' + (cx + r * 0.45) + ' ' + (cy - h0 * 0.1 - r * 0.05) + ' L' + (cx - r * 0.05) + ' ' + (cy - h0 * 0.1 + 0.05 * r) + ' L' + (cx + r * 0.3) + ' ' + (cy - h0 * 0.1 + r * 0.6) + ' L' + (cx - r * 0.5) + ' ' + (cy - h0 * 0.1 - 0.05 * r) + ' L' + (cx - r * 0.05) + ' ' + (cy - h0 * 0.1 - 0.15 * r) + ' Z" fill="#fff"/>' +
          '<text x="' + cx + '" y="' + (top + h0 * 0.88) + '" text-anchor="middle" font-family="\'Big Shoulders Display\', Impact, sans-serif" font-weight="800" font-size="' + (h0 * 0.17) + '" fill="#fff">ASSO</text></g>';
      }
      return '<g' + tf + '><rect x="' + x + '" y="' + top + '" width="' + w0 + '" height="' + h0 + '" fill="rgba(255,255,255,.18)" stroke="#e8451e" stroke-width=".25" stroke-dasharray=".9 .7"/>' +
        '<text x="' + cx + '" y="' + (cy + 0.55) + '" text-anchor="middle" font-size="' + Math.max(0.5, Math.min(1.7, w0 / 5)) + '" fill="#e8451e" font-family="Hanken Grotesk, sans-serif" font-weight="600">ton visuel</text></g>';
    }
    // texte tourné : sa case (w × h) est le rectangle qui l'englobe ; le texte à l'endroit (w0 × h0) est tourné autour du centre de cette case
    var h0 = el.h0 != null ? el.h0 : el.h, cyT = y + uy + el.h / 2, rotT = el.rot || 0;
    return '<text x="' + ux + '" y="' + (cyT - h0 / 2 + el.asc) + '" text-anchor="middle" font-family="\'' + esc(el.police) + '\', Impact, sans-serif" font-size="' + el.fontCm +
      '" fill="' + esc(el.couleur) + '"' + (rotT ? ' transform="rotate(' + rotT + ' ' + ux + ' ' + cyT + ')"' : '') + ' style="paint-order:stroke;stroke:rgba(0,0,0,.28);stroke-width:.09px">' + esc(el.text) + '</text>';
  }

  // Poignées du visuel choisi, dans le repère de la zone : un coin pour l'agrandir (data-pv-resize), un bouton rond pour le tourner d'un quart de tour
  // (data-pv-rotate). Leur taille suit l'écran (pxPerCm = pixels affichés par centimètre), pas la taille du vêtement.
  function poignees(empId, bx, by, w, h, pxPerCm) {
    var k = pxPerCm > 0 ? pxPerCm : 6, r = Math.max(0.1, 11 / k), sw = Math.max(0.04, 1.5 / k), ry = by - 2.5 * r;
    return '<g class="pv-poignees">' +
      '<rect x="' + bx + '" y="' + by + '" width="' + w + '" height="' + h + '" fill="none" stroke="#1f6b57" stroke-width="' + sw + '" stroke-dasharray="' + 4 * sw + ' ' + 3 * sw + '" pointer-events="none"/>' +
      '<line x1="' + (bx + w / 2) + '" y1="' + by + '" x2="' + (bx + w / 2) + '" y2="' + (ry + r) + '" stroke="#1f6b57" stroke-width="' + sw + '" pointer-events="none"/>' +
      '<g data-pv-rotate="' + empId + '" class="pv-poignee" role="button" aria-label="Tourner le visuel d\'un quart de tour"><circle cx="' + (bx + w / 2) + '" cy="' + ry + '" r="' + r + '" fill="#fff" stroke="#1f6b57" stroke-width="' + sw * 1.5 + '"/>' +
      '<path d="M' + (bx + w / 2 - r * 0.45) + ' ' + (ry - r * 0.1) + ' a' + r * 0.5 + ' ' + r * 0.5 + ' 0 1 1 ' + r * 0.25 + ' ' + r * 0.6 + '" fill="none" stroke="#1f6b57" stroke-width="' + sw * 1.4 + '" stroke-linecap="round"/>' +
      '<path d="M' + (bx + w / 2 - r * 0.7) + ' ' + (ry - r * 0.35) + ' l' + r * 0.3 + ' ' + r * 0.35 + ' l' + r * 0.35 + ' ' + (-r * 0.3) + '" fill="none" stroke="#1f6b57" stroke-width="' + sw * 1.4 + '" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<g data-pv-resize="' + empId + '" class="pv-poignee" role="button" aria-label="Agrandir ou réduire le visuel"><circle cx="' + (bx + w) + '" cy="' + (by + h) + '" r="' + r + '" fill="#1f6b57" stroke="#fff" stroke-width="' + sw + '"/>' +
      '<path d="M' + (bx + w - r * 0.4) + ' ' + (by + h + r * 0.4) + ' L' + (bx + w + r * 0.4) + ' ' + (by + h - r * 0.4) + ' M' + (bx + w + r * 0.4) + ' ' + (by + h - r * 0.1) + ' V' + (by + h - r * 0.4) + ' H' + (bx + w + r * 0.1) + ' M' + (bx + w - r * 0.4) + ' ' + (by + h + r * 0.1) + ' V' + (by + h + r * 0.4) + ' H' + (bx + w - r * 0.1) + '" fill="none" stroke="#fff" stroke-width="' + sw * 1.2 + '" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '</g>';
  }

  // Marquages d'une vue : cadres des emplacements, visuels, prénoms et numéros (en cm, dans le repère du vêtement).
  // opts.photo : sur une photo, on ne dessine que les emplacements utilisés (pas les manches).
  function markings(opts, vue) {
    var E = window.Engine, prod = opts.prod, out = "";
    Object.keys(prod.zones).forEach(function (empId) {
      var z = zoneForView(prod, empId, vue);
      if (!z) return;
      var cfg = opts.marquages && opts.marquages[empId];
      var actif = !!(cfg && cfg.actif);
      if ((opts.bare || opts.photo) && !actif) return;
      if (opts.photo && z.cy != null) return;
      var top = z.top != null ? z.top : z.cy - z.h / 2;
      var sleeve = z.cy != null;
      var tf = sleeve ? "translate(" + z.cx + " " + z.cy + ") rotate(" + (z.rot || 0) + ")" : "translate(" + z.cx + " " + top + ")";
      var zy = sleeve ? -z.h / 2 : 0;
      out += '<g transform="' + tf + '" data-zone="' + empId + '">';
      out += '<rect x="' + (-z.w / 2) + '" y="' + zy + '" width="' + z.w + '" height="' + z.h + '" fill="none" stroke="' + (actif ? "#e8451e" : "#8fa39a") +
        '" stroke-width="' + (actif ? 0.22 : 0.14) + '" stroke-dasharray="' + (actif ? "1 .6" : ".6 .8") + '" opacity="' + (actif ? 0.9 : 0.55) + '"/>';
      if (!actif) {
        // zone minuscule (porte-clés, ouvre-bouteille) : le nom passe en petit sous le cadre, il ne tiendrait pas dedans
        if (z.w < 8) out += '<text x="0" y="' + (zy + z.h + 1.1) + '" text-anchor="middle" font-size="0.9" fill="#6d8077" font-family="Hanken Grotesk, sans-serif">' + esc(emplLabel(opts, empId)) + '</text>';
        else out += '<text x="0" y="' + (zy + 1.9) + '" text-anchor="middle" font-size="1.6" fill="#6d8077" font-family="Hanken Grotesk, sans-serif">' + esc(emplLabel(opts, empId)) + '</text>';
      }
      if (actif && opts.piece) {
        var lay = E.stackFor(empId, cfg, opts.piece, prod, opts.ctx);   // bloc collé : écart réduit entre le visuel et le texte
        var y0 = sleeve ? -lay.H / 2 : 0;
        var inter = opts.interactif && !opts.photo, poi = "";
        lay.items.forEach(function (it) {
          if (it.kind === "image") it.src = cfg.image ? (cfg.image.url || cfg.image.dataUrl) : null;
          var yy = y0 + it.dy, svg = elementSVG(it, yy, opts.sample);
          if (inter && it.kind === "image") {
            // le visuel se déplace à la souris ou au doigt (zone de prise = tout son rectangle, même sur un fond transparent)
            var bx = (it.ux || 0) - it.w / 2, by = yy + (it.uy || 0);
            svg = '<g data-pv-move="' + empId + '" class="pv-move"><rect x="' + bx + '" y="' + by + '" width="' + it.w + '" height="' + it.h + '" fill="transparent"/>' + svg + '</g>';
            if (opts.sel === empId) poi = poignees(empId, bx, by, it.w, it.h, opts.pxPerCm);
          }
          out += svg;
        });
        out += poi;
      }
      out += '</g>';
    });

    return out;
  }

  /*
   * Aperçu sur photo : la photo avec, par-dessus, un calque SVG transparent. Le calque a pour repère le vêtement en cm ;
   * sa fenêtre (viewBox) est calculée pour que le dessin tombe sur le vêtement porté, d'après le calage de la photo
   * (cfg = { u0, v0, kx, ky }, voir data.js, apercuPhoto). Les échelles horizontale et verticale peuvent différer :
   * c'est la perspective de la photo (vêtement porté de trois quarts).
   */
  function renderPhoto(opts) {
    var prod = opts.prod, vue = opts.vue || "face", cfg = opts.cfg, dy = (MODELS[prod.modele] || {}).dy || 0;
    var vb = [-cfg.u0 / cfg.kx, -cfg.v0 / cfg.ky, 1 / cfg.kx, 1 / cfg.ky].map(function (x) { return Math.round(x * 100) / 100; }).join(" ");
    return '<div class="pv-photo">' +
      '<img src="' + esc(opts.src) + '" alt="Photo : ' + esc(prod.nom) + ', vue ' + (vue === "dos" ? "de dos" : "de face") + '" referrerpolicy="no-referrer">' +
      '<svg class="pv-overlay" viewBox="' + vb + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g transform="translate(0 ' + dy + ')">' + markings(Object.assign({}, opts, { photo: true }), vue) + '</g></svg></div>';
  }

  /*
   * opts : { prod, hex, vue, marquages, piece, ctx, sample, zones }
   * ctx : { prix, produits, emplacements, measure }
   */
  function render(opts) {
    var prod = opts.prod, vue = opts.vue || "face", out = "";
    var mod = MODELS[prod.modele] || {}, W = mod.w || 90, H = mod.h || 82, dy = mod.dy || 0;
    out += '<svg class="pv-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aperçu, vue ' + (vue === "dos" ? "de dos" : "de face") + '">';
    out += defs();
    out += '<rect width="' + W + '" height="' + H + '" fill="url(#pv-g5)"/>';
    out += '<g transform="translate(0 ' + dy + ')">' + garment(opts.hex, vue, prod.modele);

    out += markings(opts, vue);
    out += '</g>';
    var fs = Math.min(1.7, W / 30);     // sur un petit dessin (porte-clés), la légende se réduit
    out += '<text x="' + Math.min(1.5, W * 0.05) + '" y="' + (H - fs * 0.95) + '" font-size="' + fs + '" fill="#6d8077" font-family="Hanken Grotesk, sans-serif">carreaux de 5 cm</text>';
    out += '</svg>';
    return out;
  }

  function emplLabel(opts, empId) {
    var z = opts.prod.zones[empId];
    return (z && z.label) || (opts.ctx.emplacements[empId] || {}).label || empId;
  }

  window.Preview = { render: render, renderPhoto: renderPhoto, esc: esc, lum: lum, tone: tone, zoneForView: zoneForView, models: MODELS };
})();
