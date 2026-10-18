/*
 * MOTEUR DE CALCUL
 * - construit la liste des motifs à presser (un par pièce, par emplacement, par élément)
 * - les range sur les planches Sprint au moindre coût (rotation autorisée, écart entre motifs)
 * - calcule coûts TTC, prix unitaire (arrondi 2,50 €) et marge
 * Fonctionne dans le navigateur (window.Engine) et sous Node (tests).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var EPS = 1e-9;
  function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }

  /* ------------------------------------------------------------------ */
  /* Placement (MaxRects, meilleur ajustement sur le petit côté)          */
  /* ------------------------------------------------------------------ */
  function MaxRects(w, h) { this.free = [{ x: 0, y: 0, w: w, h: h }]; }

  function contains(b, a) {
    return a.x >= b.x - EPS && a.y >= b.y - EPS &&
      a.x + a.w <= b.x + b.w + EPS && a.y + a.h <= b.y + b.h + EPS;
  }

  // mode : "bssf" (petit côté), "blsf" (grand côté) ou "bl" (en bas à gauche)
  MaxRects.prototype.insert = function (rw, rh, allowRot, mode) {
    var best = null, tries = (allowRot && Math.abs(rw - rh) > EPS) ? 2 : 1;
    for (var i = 0; i < this.free.length; i++) {
      var f = this.free[i];
      for (var r = 0; r < tries; r++) {
        var w = r ? rh : rw, h = r ? rw : rh;
        if (w <= f.w + EPS && h <= f.h + EPS) {
          var dw = f.w - w, dh = f.h - h, s1, s2;
          if (mode === "blsf") { s1 = Math.max(dw, dh); s2 = Math.min(dw, dh); }
          else if (mode === "bl") { s1 = f.y + h; s2 = f.x; }
          else { s1 = Math.min(dw, dh); s2 = Math.max(dw, dh); }
          if (!best || s1 < best.s1 - EPS || (Math.abs(s1 - best.s1) <= EPS && s2 < best.s2 - EPS)) {
            best = { x: f.x, y: f.y, w: w, h: h, rot: !!r, s1: s1, s2: s2 };
          }
        }
      }
    }
    if (!best) return null;
    this.split({ x: best.x, y: best.y, w: best.w, h: best.h });
    return { x: best.x, y: best.y, w: best.w, h: best.h, rot: best.rot };
  };

  MaxRects.prototype.split = function (r) {
    var out = [];
    this.free.forEach(function (f) {
      if (r.x >= f.x + f.w - EPS || r.x + r.w <= f.x + EPS || r.y >= f.y + f.h - EPS || r.y + r.h <= f.y + EPS) {
        out.push(f); return;
      }
      if (r.x > f.x + EPS) out.push({ x: f.x, y: f.y, w: r.x - f.x, h: f.h });
      if (r.x + r.w < f.x + f.w - EPS) out.push({ x: r.x + r.w, y: f.y, w: f.x + f.w - (r.x + r.w), h: f.h });
      if (r.y > f.y + EPS) out.push({ x: f.x, y: f.y, w: f.w, h: r.y - f.y });
      if (r.y + r.h < f.y + f.h - EPS) out.push({ x: f.x, y: r.y + r.h, w: f.w, h: f.y + f.h - (r.y + r.h) });
    });
    this.free = out.filter(function (a, i) {
      return !out.some(function (b, j) {
        return i !== j && contains(b, a) && !(contains(a, b) && j > i);
      });
    });
  };

  function packOnce(W, H, rects, gap, rot, mode) {
    var bin = new MaxRects(W + gap, H + gap), placed = [], rest = [];
    rects.forEach(function (r) {
      var p = bin.insert(r.w + gap, r.h + gap, rot, mode);
      if (p) placed.push({ id: r.id, ref: r, x: p.x, y: p.y, w: p.w - gap, h: p.h - gap, rot: p.rot });
      else rest.push(r);
    });
    return { placed: placed, rest: rest };
  }

  // Range un maximum de rectangles dans une planche W x H (gap = écart entre motifs).
  // Plusieurs stratégies sont essayées, on garde celle qui place le plus de motifs.
  function packSheet(W, H, rects, gap, rot) {
    var strategies = rects.length > 80
      ? [["bssf", true], ["bl", true]]
      : [["bssf", false], ["bssf", true], ["bl", true], ["blsf", true]];
    var best = null;
    for (var i = 0; i < strategies.length; i++) {
      if (strategies[i][1] && !rot) continue;
      var res = packOnce(W, H, rects, gap, strategies[i][1], strategies[i][0]);
      if (!best || res.placed.length > best.placed.length) best = res;
      if (!best.rest.length) break;
    }
    return best;
  }

  function sortRects(rects) {
    return rects.slice().sort(function (a, b) {
      return (b.w * b.h) - (a.w * a.h) || Math.max(b.w, b.h) - Math.max(a.w, a.h);
    });
  }

  function totalArea(rects) { return rects.reduce(function (s, r) { return s + r.w * r.h; }, 0); }

  function cheapestSingle(rects, formats, gap, rot) {
    var best = null, sorted = sortRects(rects), area = totalArea(rects);
    formats.forEach(function (f) {
      if (best && f.prix >= best.format.prix) return;
      if (area > f.w * f.h + EPS) return;
      var res = packSheet(f.w, f.h, sorted, gap, rot);
      if (!res.rest.length) best = { format: f, placed: res.placed };
    });
    return best;
  }

  function greedyPlan(rects, formats, gap, rot) {
    var rest = sortRects(rects), sheets = [];
    while (rest.length) {
      var best = null;
      for (var i = 0; i < formats.length; i++) {
        var f = formats[i], res = packSheet(f.w, f.h, rest, gap, rot);
        if (!res.placed.length) continue;
        var area = res.placed.reduce(function (s, p) { return s + p.ref.w * p.ref.h; }, 0);
        var ratio = f.prix / area;
        if (!best || ratio < best.ratio - 1e-12 || (Math.abs(ratio - best.ratio) <= 1e-12 && f.prix < best.f.prix)) {
          best = { f: f, placed: res.placed, rest: res.rest, ratio: ratio };
        }
      }
      if (!best) return null;
      sheets.push({ format: best.f, placed: best.placed });
      rest = best.rest;
    }
    return sheets;
  }

  function uniformPlan(rects, f, gap, rot) {
    var rest = sortRects(rects), sheets = [];
    while (rest.length) {
      var res = packSheet(f.w, f.h, rest, gap, rot);
      if (!res.placed.length) return null;
      sheets.push({ format: f, placed: res.placed });
      rest = res.rest;
    }
    return sheets;
  }

  // Remplit des planches de format f ; dès que le reste tient sur une seule planche, on prend la moins chère
  function closingPlan(rects, f, formats, gap, rot) {
    var rest = sortRects(rects), sheets = [];
    while (rest.length) {
      var single = cheapestSingle(rest, formats, gap, rot);
      if (single) { sheets.push(single); return sheets; }
      var res = packSheet(f.w, f.h, rest, gap, rot);
      if (!res.placed.length) return null;
      sheets.push({ format: f, placed: res.placed });
      rest = res.rest;
    }
    return sheets;
  }

  // Réduit le coût : planche plus petite si possible, fusion de deux planches en une seule moins chère.
  function improve(sheets, formats, gap, rot) {
    if (!sheets) return null;
    var changed = true, guard = 0;
    while (changed && guard++ < 200) {
      changed = false;
      sheets.forEach(function (s) {
        var alt = cheapestSingle(s.placed.map(function (p) { return p.ref; }), formats, gap, rot);
        if (alt && alt.format.prix < s.format.prix - EPS) { s.format = alt.format; s.placed = alt.placed; changed = true; }
      });
      if (sheets.length > 1 && sheets.length <= 24) {
        outer:
        for (var i = 0; i < sheets.length; i++) {
          for (var j = i + 1; j < sheets.length; j++) {
            var rects = sheets[i].placed.concat(sheets[j].placed).map(function (p) { return p.ref; });
            var alt2 = cheapestSingle(rects, formats, gap, rot);
            if (alt2 && alt2.format.prix < sheets[i].format.prix + sheets[j].format.prix - EPS) {
              sheets[i] = { format: alt2.format, placed: alt2.placed };
              sheets.splice(j, 1);
              changed = true;
              break outer;
            }
          }
        }
      }
    }
    return sheets;
  }

  function remiseFor(remises, qty) {
    var pct = 0;
    (remises || []).forEach(function (t) { if (qty >= t.min && t.pct > pct) pct = t.pct; });
    return pct;
  }

  // Coût HT d'un ensemble de planches (avec remises par quantité identique)
  function costSheets(sheets, remises) {
    var byFormat = {}, order = [];
    sheets.forEach(function (s) {
      if (!byFormat[s.format.id]) { byFormat[s.format.id] = { format: s.format, qty: 0 }; order.push(s.format.id); }
      byFormat[s.format.id].qty++;
    });
    var lines = order.map(function (id) {
      var g = byFormat[id], pct = remiseFor(remises, g.qty);
      var unit = round2(g.format.prix * (1 - pct));
      return { formatId: id, nom: g.format.nom, qty: g.qty, prixCatalogue: g.format.prix, remise: pct, prixUnitaire: unit, totalHT: round2(unit * g.qty) };
    });
    return { lines: lines, totalHT: round2(lines.reduce(function (s, l) { return s + l.totalHT; }, 0)) };
  }

  // Cherche le rangement le moins cher pour un ensemble de motifs
  function planSheets(rects, formats, opts) {
    var gap = opts.gap, rot = opts.rot, remises = opts.remises;
    var best = null;
    function consider(c) {
      if (!c) return;
      var cost = costSheets(c, remises).totalHT;
      if (!best || cost < best.cost - EPS) best = { sheets: c, cost: cost };
    }
    var g = greedyPlan(rects, formats, gap, rot);
    if (g) consider(improve(g, formats, gap, rot));

    var T = totalArea(rects), maxR = 0;
    (remises || []).forEach(function (t) { if (t.pct > maxR) maxR = t.pct; });
    formats.slice().sort(function (a, b) { return a.prix / (a.w * a.h) - b.prix / (b.w * b.h); }).forEach(function (f) {
      var nb = Math.ceil(T / (f.w * f.h));
      if (nb > 40) return;
      if (best && nb * f.prix * (1 - maxR) >= best.cost - EPS) return;   // ne peut pas faire mieux
      consider(improve(closingPlan(rects, f, formats, gap, rot), formats, gap, rot));
    });
    return best ? best.sheets : null;
  }

  /* ------------------------------------------------------------------ */
  /* Éléments à presser sur un emplacement                               */
  /* ------------------------------------------------------------------ */
  function fitsPlateau(w, h, P) {
    return (w <= P.w + EPS && h <= P.h + EPS) || (w <= P.h + EPS && h <= P.w + EPS);
  }

  // Liste ordonnée (de haut en bas) des éléments d'un emplacement pour une pièce
  function elementsFor(empId, cfg, piece, prod, ctx) {
    var zone = prod.zones[empId], P = ctx.prix.plateau, out = [];
    function image() {
      var f = ctx.prix.formatsMotif[cfg.format];
      if (!f) return null;
      var w = f.w, h = f.h;
      if (cfg.orient === "paysage") { var t = w; w = h; h = t; }
      return { kind: "image", w: w, h: h };
    }
    function texte(kind, valeur, o) {
      var text = String(valeur || "").trim();
      if (!text || !o) return null;
      if (cfg.maj !== false) text = text.toLocaleUpperCase("fr-FR");
      var hauteur = Math.max(0.5, Math.min(Number(o.hauteur) || 3, 28));
      var m = ctx.measure(text, o.police, hauteur);
      var maxW = Math.min(zone.w, Math.max(P.w, P.h)), s = 1;
      if (m.w > maxW) s = maxW / m.w;
      return { kind: kind, text: text, police: o.police, couleur: o.couleur, hauteur: hauteur * s,
        w: m.w * s, h: m.h * s, fontCm: m.fontCm * s, asc: m.asc * s, reduit: s < 1 };
    }
    var img = cfg.avecImage !== false ? image() : null;
    var pre = cfg.prenom && cfg.prenom.actif ? texte("prenom", piece.prenom, cfg.prenom) : null;
    var num = cfg.numero && cfg.numero.actif ? texte("numero", piece.numero, cfg.numero) : null;
    var txt = [pre, num].filter(Boolean);
    if (cfg.textePos === "dessus") { out = txt.concat(img ? [img] : []); }
    else { out = (img ? [img] : []).concat(txt); }
    return out;
  }

  var STACK_GAP = 0.8;
  function layoutStack(els) {
    var y = 0;
    var items = els.map(function (e) { var it = Object.assign({}, e, { dy: y }); y += e.h + STACK_GAP; return it; });
    return { items: items, H: els.length ? y - STACK_GAP : 0 };
  }

  function pieceTechno(order, piece, ctx) {
    var prod = ctx.produits[piece.produitId];
    if (order.technique === "sublimation" && prod) {
      var col = prod.couleurs.filter(function (c) { return c.id === piece.couleurId; })[0];
      if (col && col.clair && (prod.polyesterPct || 0) >= 90) return "sublimation";
    }
    return "dtf";
  }

  function buildMotifs(order, ctx) {
    var motifs = [], warnings = [], seen = {};
    function warn(msg) { if (!seen[msg]) { seen[msg] = 1; warnings.push(msg); } }
    order.pieces.forEach(function (piece, idx) {
      var prod = ctx.produits[piece.produitId];
      if (!prod) return;
      var techno = pieceTechno(order, piece, ctx);
      Object.keys(prod.zones).forEach(function (empId) {
        var cfg = order.marquages[empId];
        if (!cfg || !cfg.actif) return;
        var els = elementsFor(empId, cfg, piece, prod, ctx);
        var lay = layoutStack(els);
        var zone = prod.zones[empId], emp = ctx.emplacements[empId];
        if (lay.H > zone.h + EPS) warn(emp.label + " : le contenu dépasse la zone prévue sur le vêtement (" + zone.h + " cm de haut).");
        els.forEach(function (el) {
          if (el.reduit) warn(emp.label + " : un prénom ou un numéro est trop large, il est réduit pour tenir.");
          if (!fitsPlateau(el.w, el.h, ctx.prix.plateau)) warn(emp.label + " : un motif dépasse le plateau de la presse (A4).");
          var qui = piece.prenom || ("pièce " + (idx + 1));
          motifs.push({
            id: piece.id + ":" + empId + ":" + el.kind, pieceId: piece.id, pieceIdx: idx,
            emp: empId, kind: el.kind, w: el.w, h: el.h, techno: techno,
            label: emp.label + " – " + (el.kind === "image" ? "visuel" : el.text) + (el.kind === "image" ? " (" + qui + ")" : ""),
            el: el
          });
        });
      });
    });
    return { motifs: motifs, warnings: warnings };
  }

  /* ------------------------------------------------------------------ */
  /* Prix de vente                                                       */
  /* ------------------------------------------------------------------ */
  function calcPrix(cout, N, r) {
    var brut = cout / N;
    var p = round2(Math.ceil(brut / r.pas - 1e-9) * r.pas);
    var arrondi = p, ajouts = 0, marge = round2(p * N - cout);
    while (marge <= r.margeMin + 1e-9 && ajouts < 200) {
      p = round2(p + r.ajout); ajouts++; marge = round2(p * N - cout);
    }
    return { brut: round2(brut), arrondi: arrondi, unitaire: p, total: round2(p * N), marge: marge, ajouts: ajouts };
  }

  function computeOrder(order, ctx) {
    var prix = ctx.prix, N = order.pieces.length;
    var built = buildMotifs(order, ctx);
    var motifs = built.motifs, warnings = built.warnings.slice();
    var plans = {}, allLines = [], planchesHT = 0;

    ["dtf", "sublimation"].forEach(function (techno) {
      var rects = motifs.filter(function (m) { return m.techno === techno; })
        .map(function (m) { return { id: m.id, w: m.w, h: m.h, motif: m }; });
      if (!rects.length) return;
      var formats = prix.planches[techno].formats;
      var sheets = planSheets(rects, formats, { gap: prix.placement.ecart, rot: prix.placement.rotation, remises: prix.remises[techno] });
      if (!sheets) { warnings.push("Un motif est trop grand pour les planches " + prix.planches[techno].nom + "."); return; }
      var cost = costSheets(sheets, prix.remises[techno]);
      plans[techno] = { sheets: sheets, lines: cost.lines, totalHT: cost.totalHT };
      cost.lines.forEach(function (l) { allLines.push(Object.assign({ techno: techno }, l)); });
      planchesHT += cost.totalHT;
    });
    planchesHT = round2(planchesHT);

    var planchesTTC = prix.sprintPrixHT ? round2(planchesHT * (1 + prix.tva)) : planchesHT;
    var achats = round2(order.pieces.reduce(function (s, p) {
      var prod = ctx.produits[p.produitId]; return s + (prod ? prod.prixAchat : 0);
    }, 0));
    var baseSeuil = prix.sprintPrixHT ? planchesHT : planchesTTC;
    var livraison = planchesHT > 0 && baseSeuil < prix.livraison.seuilGratuit ? prix.livraison.colissimo : 0;
    var cout = round2(achats + planchesTTC + livraison);
    var vente = N > 0 ? calcPrix(cout, N, prix.regles) : null;

    return {
      N: N, motifs: motifs, warnings: warnings, plans: plans, lignesPlanches: allLines,
      couts: { achats: achats, planchesHT: planchesHT, planchesTTC: planchesTTC, livraison: livraison, total: cout },
      prix: vente
    };
  }

  // Prix par pièce affichés sur la vitrine : un visuel A6 à la poitrine, DTF
  function priceTable(prod, quantites, ctx) {
    var marq = { poitrine: { actif: true, avecImage: true, image: null, format: "A6", orient: "portrait" } };
    var col = prod.couleurs[0].id;
    return quantites.map(function (q) {
      var pieces = [];
      for (var i = 0; i < q; i++) pieces.push({ id: "v" + i, produitId: prod.id, couleurId: col, taille: prod.tailles[1] || prod.tailles[0], prenom: "", numero: "" });
      var r = computeOrder({ pieces: pieces, marquages: marq, technique: "dtf" }, ctx);
      return { q: q, unitaire: r.prix.unitaire, total: r.prix.total };
    });
  }

  // Mesure de texte de secours (Node) : largeur proportionnelle au nombre de caractères
  function approxMeasure(text, police, hauteur) {
    var font = hauteur / 0.72;
    return { w: text.length * font * 0.55, h: hauteur * 1.25, fontCm: font, asc: hauteur };
  }

  return {
    round2: round2, packSheet: packSheet, planSheets: planSheets, costSheets: costSheets,
    elementsFor: elementsFor, layoutStack: layoutStack, buildMotifs: buildMotifs,
    pieceTechno: pieceTechno, calcPrix: calcPrix, computeOrder: computeOrder, priceTable: priceTable,
    approxMeasure: approxMeasure, fitsPlateau: fitsPlateau, STACK_GAP: STACK_GAP
  };
});
