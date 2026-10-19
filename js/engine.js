/*
 * MOTEUR DE CALCUL
 * - construit la liste des motifs à presser (un par pièce, par emplacement, par élément)
 * - les range sur les planches du fournisseur au moindre coût (rotation autorisée, écart entre motifs)
 * - calcule coûts TTC, prix unitaire (coût moyen + marge par motif ou par pièce de pack) et marge
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

  /* Visuel : taille, rotation et position (version 6.2.0)
   * Avant la 6.2.0, un visuel était un format (A6, A5...) avec un sens (portrait ou paysage) : la case réservée sur la planche était celle du format.
   * Un marquage peut maintenant porter une taille libre :
   *   largeur  : largeur du visuel en cm (la hauteur suit les proportions de l'image, image.ratio = hauteur / largeur) ;
   *   rot      : quart de tour, 0, 90, 180 ou 270 degrés (sens des aiguilles d'une montre) ;
   *   dx, dy   : décalage en cm par rapport à la place par défaut dans la zone (vers la droite, vers le bas).
   * Sans `largeur`, rien ne change : on retrouve la case du format et son sens (anciens fichiers de commande, tableaux de prix de la vitrine).
   * La case qui compte pour les planches et pour le prix est le rectangle qui englobe le visuel tourné (w, h).
   */
  var LARGEUR_MIN = 0.2, LARGEUR_MAX = 60, DECALAGE_MAX = 100;
  function quartDeTour(r) { var n = Math.round((Number(r) || 0) / 90); return (((n % 4) + 4) % 4) * 90; }
  function nombre(v, def) { v = Number(v); return isFinite(v) ? v : def; }
  // Rapport hauteur / largeur de l'image du marquage, sinon celui de la case du format
  function ratioImage(cfg, boite) {
    var r = cfg && cfg.image && Number(cfg.image.ratio);
    return r > 0 && isFinite(r) ? r : boite.h / boite.w;
  }
  function imageGeom(cfg, ctx) {
    var f = ctx.prix.formatsMotif[cfg.format];
    if (!f) return null;
    var boite = cfg.orient === "paysage" ? { w: f.h, h: f.w } : { w: f.w, h: f.h };
    var w0 = boite.w, h0 = boite.h, libre = Number(cfg.largeur) > 0;
    if (libre) {
      w0 = Math.max(LARGEUR_MIN, Math.min(LARGEUR_MAX, Number(cfg.largeur)));
      h0 = w0 * ratioImage(cfg, boite);
    }
    var rot = quartDeTour(cfg.rot), tourne = rot % 180 !== 0;
    return { libre: libre, w0: w0, h0: h0, rot: rot, w: tourne ? h0 : w0, h: tourne ? w0 : h0,
      dx: Math.max(-DECALAGE_MAX, Math.min(DECALAGE_MAX, nombre(cfg.dx, 0))), dy: Math.max(-DECALAGE_MAX, Math.min(DECALAGE_MAX, nombre(cfg.dy, 0))) };
  }
  // Plus grande largeur de visuel dont le rectangle (tourné) tient sur le plateau de la presse
  function largeurMax(ratio, rot, plateau) {
    var r = ratio > 0 ? ratio : 1, tourne = quartDeTour(rot) % 180 !== 0;
    var bw = tourne ? r : 1, bh = tourne ? 1 : r;          // rectangle englobant pour une largeur de 1 cm
    return Math.min(LARGEUR_MAX, Math.max(Math.min(plateau.w / bw, plateau.h / bh), Math.min(plateau.h / bw, plateau.w / bh)));
  }
  // Largeur qui fait tenir le visuel dans un format (raccourci A7, A6...). Le format se prend dans le sens de l'image :
  // en hauteur pour une image haute, en largeur pour une image large (comme avant avec « Paysage »).
  function largeurPourFormat(formatId, ratio, rot, ctx) {
    var f = ctx.prix.formatsMotif[formatId]; if (!f) return null;
    var r = ratio > 0 ? ratio : f.h / f.w, tourne = quartDeTour(rot) % 180 !== 0;
    var rb = tourne ? 1 / r : r;                           // hauteur / largeur du rectangle englobant
    var court = Math.min(f.w, f.h), long = Math.max(f.w, f.h);
    var bw = rb >= 1 ? court : long, bh = rb >= 1 ? long : court;
    var wb = Math.min(bw, bh / rb);                        // largeur du rectangle englobant
    var L = tourne ? wb / r : wb;
    return Math.round(L * 100) / 100;
  }

  function cm(n) { return String(Math.round(n * 10) / 10).replace(".", ","); }
  // Le visuel en une phrase, pour les mails et l'atelier : « A6, 10 × 14 cm » (format sans taille libre, comme avant la 6.2.0)
  // ou « 12 × 8 cm, tourné de 90°, décalé de 2 cm vers la droite et 1,5 cm vers le bas »
  function descriptionVisuel(cfg, ctx) {
    var g = imageGeom(cfg, ctx); if (!g) return "";
    if (!g.libre) return (cfg.format || "") + (cfg.orient === "paysage" ? " en paysage" : "") + ", " + cm(g.w) + " × " + cm(g.h) + " cm" + (g.rot ? ", tourné de " + g.rot + "°" : "") + decalageTxt(g);
    return cm(g.w0) + " × " + cm(g.h0) + " cm" + (g.rot ? ", tourné de " + g.rot + "°" : "") + decalageTxt(g);
  }
  function decalageTxt(g) {
    var p = [];
    if (Math.abs(g.dx) >= 0.05) p.push(cm(Math.abs(g.dx)) + " cm vers la " + (g.dx > 0 ? "droite" : "gauche"));
    if (Math.abs(g.dy) >= 0.05) p.push(cm(Math.abs(g.dy)) + " cm vers le " + (g.dy > 0 ? "bas" : "haut"));
    return p.length ? ", décalé de " + p.join(" et ") : "";
  }

  // Liste ordonnée (de haut en bas) des éléments d'un emplacement pour une pièce
  function elementsFor(empId, cfg, piece, prod, ctx) {
    var zone = prod.zones[empId], P = ctx.prix.plateau, out = [];
    function image() {
      var g = imageGeom(cfg, ctx);
      if (!g) return null;
      return { kind: "image", w: g.w, h: g.h, w0: g.w0, h0: g.h0, rot: g.rot };
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
    var emp = ctx.emplacements[empId];
    var img = (cfg.avecImage !== false && !(emp && emp.texteSeul)) ? image() : null;
    var pre = cfg.prenom && cfg.prenom.actif ? texte("prenom", piece.prenom, cfg.prenom) : null;
    var num = cfg.numero && cfg.numero.actif ? texte("numero", piece.numero, cfg.numero) : null;
    var txt = [pre, num].filter(Boolean);
    if (cfg.textePos === "dessus") { out = txt.concat(img ? [img] : []); }
    else { out = (img ? [img] : []).concat(txt); }
    return out;
  }

  var STACK_GAP = 0.8;      // écart entre deux éléments d'un emplacement pressés séparément, en cm
  var BLOC_GAP = 0.5;       // écart entre deux éléments d'un bloc collé (prix.js : placement.ecartBloc), en cm
  function layoutStack(els, gap) {
    var g = gap == null ? STACK_GAP : gap, y = 0;
    var items = els.map(function (e) { var it = Object.assign({}, e, { dy: y }); y += e.h + g; return it; });
    return { items: items, H: els.length ? y - g : 0 };
  }

  // Pile d'éléments d'un emplacement pour une pièce (visuel, prénom, numéro), de haut en bas.
  // Bloc collé (cfg.bloc === true, au moins deux éléments) : le visuel, le prénom et le numéro sont imprimés sur un seul transfert,
  // à l'écart `placement.ecartBloc` les uns des autres, et pressés d'un seul coup : c'est un seul motif.
  // Si le bloc ne tient pas sur le plateau de la presse, les éléments restent séparés (tropGrand: true).
  // Chaque élément porte dy (décalage vertical dans la pile) ; W est la largeur de la pile.
  function stackFor(empId, cfg, piece, prod, ctx) {
    var els = elementsFor(empId, cfg, piece, prod, ctx);
    var pl = ctx.prix && ctx.prix.placement, gapBloc = pl && pl.ecartBloc != null ? pl.ecartBloc : BLOC_GAP;
    var W = els.reduce(function (m, e) { return Math.max(m, e.w); }, 0);
    var bloc = cfg.bloc === true && els.length >= 2, tropGrand = false;
    var lay = layoutStack(els, bloc ? gapBloc : STACK_GAP);
    if (bloc && !fitsPlateau(W, lay.H, ctx.prix.plateau)) { bloc = false; tropGrand = true; lay = layoutStack(els, STACK_GAP); }
    // Position choisie par le client (cfg.dx, cfg.dy) : elle déplace le visuel seul, ou le bloc entier quand le texte lui est collé.
    // Elle ne change rien aux planches : seulement la place sur le vêtement (aperçu, avertissement de débordement).
    var g = els.some(function (e) { return e.kind === "image"; }) ? imageGeom(cfg, ctx) : null, ux = g ? g.dx : 0, uy = g ? g.dy : 0;
    lay.items.forEach(function (it) {
      it.ux = (bloc || it.kind === "image") ? ux : 0;
      it.uy = (bloc || it.kind === "image") ? uy : 0;
    });
    return { items: lay.items, H: lay.H, W: W, bloc: bloc, tropGrand: tropGrand, ux: bloc ? ux : 0, uy: bloc ? uy : 0 };
  }

  // L'élément « visuel » d'un motif (un motif visuel seul, ou un bloc qui en contient un), sinon null
  function motifImage(m) {
    if (m.kind === "image") return m.el;
    if (m.kind === "bloc") return m.el.items.filter(function (i) { return i.kind === "image"; })[0] || null;
    return null;
  }

  // Part de polyester d'une pièce : celle de l'article ; pour un vêtement apporté par le client (prod.apporte), la matière
  // qu'il déclare sur la pièce (piece.matiere : "polyester", "coton" ou "inconnu"). Sans certitude, on compte 0 : le DTF.
  function polyesterPiece(prod, piece) {
    if (!prod) return 0;
    if (prod.apporte) return piece && piece.matiere === "polyester" ? 100 : 0;
    return prod.polyesterPct || 0;
  }

  // Procédé de pose d'une pièce. Un article qui déclare `technique: "gravure"` (ouvre-bouteilles en métal) est gravé au laser ou
  // marqué en vinyle thermocollant : ses motifs ne vont sur aucune planche et n'en coûtent aucune (ni DTF, ni sublimation),
  // quel que soit le choix du client. Les autres articles sont en sublimation (polyester blanc ou clair, si la commande la demande) ou en DTF.
  function pieceTechno(order, piece, ctx) {
    var prod = ctx.produits[piece.produitId];
    if (prod && prod.technique === "gravure") return "gravure";
    if (order.technique === "sublimation" && prod && prod.sublimation !== false) {
      var col = prod.couleurs.filter(function (c) { return c.id === piece.couleurId; })[0];
      if (col && col.clair && polyesterPiece(prod, piece) >= 90) return "sublimation";
    }
    return "dtf";
  }

  // Le contenu d'un emplacement (pile d'éléments, avec la position choisie) sort-il de sa zone ? Une zone de manche est centrée en hauteur, les autres partent du haut.
  function debordeZone(lay, zone) {
    var y0 = zone.cy != null ? -lay.H / 2 : 0, zy0 = zone.cy != null ? -zone.h / 2 : 0;
    return lay.items.some(function (it) {
      var x0 = -it.w / 2 + it.ux, y = y0 + it.dy + it.uy;      // les éléments d'une pile sont centrés
      return x0 < -zone.w / 2 - 0.05 || x0 + it.w > zone.w / 2 + 0.05 || y < zy0 - 0.05 || y + it.h > zy0 + zone.h + 0.05;
    });
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
        var lay = stackFor(empId, cfg, piece, prod, ctx), els = lay.items;
        var zone = prod.zones[empId], emp = ctx.emplacements[empId];
        var qui = piece.prenom || ("pièce " + (idx + 1));
        if (lay.H > zone.h + EPS) warn(emp.label + " : le contenu dépasse la zone prévue sur le vêtement (" + zone.h + " cm de haut).");
        else if (debordeZone(lay, zone)) warn(emp.label + " : le visuel déborde de la zone prévue sur le vêtement. Fabr'Icam vérifie la place sur le vêtement avant de presser.");
        if (lay.tropGrand) warn(emp.label + " : le bloc (visuel, prénom et numéro collés) est trop grand pour le plateau de la presse (A4) : les éléments sont pressés séparément.");
        els.forEach(function (el) {
          if (el.reduit) warn(emp.label + " : un prénom ou un numéro est trop large, il est réduit pour tenir.");
          if (!fitsPlateau(el.w, el.h, ctx.prix.plateau)) warn(emp.label + " : un motif dépasse le plateau de la presse (A4).");
        });
        if (lay.bloc) {
          // un seul motif : le bloc. Ses éléments sont centrés dans sa largeur (dx) et empilés (dy).
          var items = els.map(function (el) { return Object.assign({}, el, { dx: (lay.W - el.w) / 2 }); });
          motifs.push({
            id: piece.id + ":" + empId + ":bloc", pieceId: piece.id, pieceIdx: idx,
            emp: empId, kind: "bloc", w: lay.W, h: lay.H, techno: techno, avecImage: items.some(function (i) { return i.kind === "image"; }),
            label: emp.label + " – bloc : " + items.map(function (i) { return i.kind === "image" ? "visuel (" + qui + ")" : i.text; }).join(" + "),
            el: { kind: "bloc", w: lay.W, h: lay.H, items: items }
          });
          return;
        }
        els.forEach(function (el) {
          motifs.push({
            id: piece.id + ":" + empId + ":" + el.kind, pieceId: piece.id, pieceIdx: idx,
            emp: empId, kind: el.kind, w: el.w, h: el.h, techno: techno, avecImage: el.kind === "image",
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
  // Marge d'une pièce vendue hors pack : regles.parMotif (1 €) par motif à presser (visuel, prénom ou numéro),
  // au plus regles.maxParPiece (2 €) par pièce. Une pièce sans motif ne porte aucune marge.
  function margePiece(nbMotifs, r) {
    var m = nbMotifs * r.parMotif;
    if (r.maxParPiece != null && m > r.maxParPiece) m = r.maxParPiece;
    return round2(m);
  }

  // Vêtements apportés par le client : au-delà de regles.apporte.seuil pièces apportées dans la commande, la marge de ces pièces
  // est multipliée par regles.apporte.facteur (0,5 : 0,50 € par motif, 1 € au plus par pièce). Renvoie les règles à appliquer à une pièce apportée.
  function reglesApporte(r, nbApportees) {
    var a = r.apporte;
    if (!a || a.facteur == null || a.facteur === 1 || nbApportees <= a.seuil) return r;
    return Object.assign({}, r, { parMotif: r.parMotif * a.facteur, maxParPiece: r.maxParPiece == null ? null : r.maxParPiece * a.facteur });
  }

  // Marge d'une pièce vendue dans un pack : un montant fixe, quel que soit le nombre de motifs.
  // regles.parPiecePack (1 €), sauf pour un produit qui déclare sa propre valeur (margePack : 0 pour les chaussettes).
  function margePiecePack(prod, r) {
    return prod && prod.margePack != null ? prod.margePack : r.parPiecePack;
  }

  // Fixe le prix unitaire de chaque article (groupes : { n, cout, margeTotale } avec cout = coût total du groupe
  // et margeTotale = somme des marges de ses n articles).
  // Prix = coût moyen de l'article + marge moyenne, arrondi au supérieur de regles.pas : un prix moyen par produit.
  function fixerPrix(groupes, coutTotal, r) {
    var total = 0;
    groupes.forEach(function (g) {
      g.coutMoyen = g.cout / g.n;
      g.margeMoyenne = g.margeTotale / g.n;
      g.brut = g.coutMoyen + g.margeMoyenne;
      g.unitaire = round2(Math.ceil(g.brut / r.pas - 1e-9) * r.pas);
      g.total = round2(g.unitaire * g.n);
      total += g.total;
    });
    total = round2(total);
    return { total: total, marge: round2(total - coutTotal) };
  }

  // Cas d'un seul produit : cout = coût total, N = nombre de pièces, motifs = nombre de motifs de chaque pièce (1 par défaut)
  function calcPrix(cout, N, r, motifs) {
    var g = [{ n: N, cout: cout, margeTotale: N * margePiece(motifs == null ? 1 : motifs, r) }];
    var res = fixerPrix(g, cout, r);
    return { brut: round2(g[0].brut), unitaire: g[0].unitaire, total: res.total, marge: res.marge };
  }

  // Prix d'achat d'une pièce : celui de sa couleur si elle en déclare un (prixAchat dans la couleur), sinon celui du produit.
  function prixAchatPiece(prod, couleurId) {
    if (!prod) return 0;
    var col = (prod.couleurs || []).filter(function (c) { return c.id === couleurId; })[0];
    return col && col.prixAchat != null ? col.prixAchat : prod.prixAchat;
  }

  function computeOrder(order, ctx) {
    var prix = ctx.prix, N = order.pieces.length;
    var built = buildMotifs(order, ctx);
    var motifs = built.motifs, warnings = built.warnings.slice();
    var plans = {}, allLines = [], planchesHT = 0;
    var tvaCoef = prix.prixPlanchesHT ? 1 + prix.tva : 1;
    var plancheParPiece = {};     // coût des planches (TTC) imputé à chaque pièce, au prorata de la surface de ses motifs

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
      var unitById = {}; cost.lines.forEach(function (l) { unitById[l.formatId] = l.prixUnitaire; });
      sheets.forEach(function (sh) {
        var prixPlanche = unitById[sh.format.id] * tvaCoef, aire = 0;
        sh.placed.forEach(function (p) { aire += p.ref.w * p.ref.h; });
        sh.placed.forEach(function (p) {
          var pid = p.ref.motif.pieceId;
          plancheParPiece[pid] = (plancheParPiece[pid] || 0) + prixPlanche * (p.ref.w * p.ref.h) / aire;
        });
      });
    });
    planchesHT = round2(planchesHT);

    var planchesTTC = prix.prixPlanchesHT ? round2(planchesHT * (1 + prix.tva)) : planchesHT;
    var achats = round2(order.pieces.reduce(function (s, p) {
      var prod = ctx.produits[p.produitId]; return s + (prod ? prixAchatPiece(prod, p.couleurId) : 0);
    }, 0));
    var baseSeuil = prix.prixPlanchesHT ? planchesHT : planchesTTC;
    var livraison = planchesHT > 0 && baseSeuil < prix.livraison.seuilGratuit ? prix.livraison.colissimo : 0;

    // Articles d'un vendeur en ligne (place de marché Decathlon ou AliExpress) : le vendeur livre et peut facturer des frais de port,
    // une seule fois par vendeur et par commande (prix.livraisonVendeur). Ils sont répartis sur les pièces de ce vendeur.
    var lv = prix.livraisonVendeur || {}, vendeurs = {};
    order.pieces.forEach(function (p) {
      var prod = ctx.produits[p.produitId];
      if (!prod || !prod.vendeur) return;
      var v = vendeurs[prod.vendeur];
      if (!v) {
        var def = (lv.vendeurs && lv.vendeurs[prod.vendeur]) || {};
        v = vendeurs[prod.vendeur] = { id: prod.vendeur, nom: def.nom || prod.vendeur, frais: def.frais != null ? def.frais : (lv.defaut || 0), delai: def.delai || "", plateforme: def.plateforme || "Decathlon", note: def.note || "", pieces: 0 };
      }
      v.pieces++;
    });
    var listeVendeurs = Object.keys(vendeurs).map(function (k) { return vendeurs[k]; });
    var livraisonVendeurs = round2(listeVendeurs.reduce(function (s, v) { return s + v.frais; }, 0));
    var cout = round2(achats + planchesTTC + livraison + livraisonVendeurs);

    // les planches et la livraison sont imputées aux pièces (la somme reste égale au coût réel)
    var sommeBrute = 0;
    Object.keys(plancheParPiece).forEach(function (k) { sommeBrute += plancheParPiece[k]; });
    var k = sommeBrute > 0 ? planchesTTC / sommeBrute : 0;
    var coutPieces = {};
    order.pieces.forEach(function (p) {
      var prod = ctx.produits[p.produitId]; if (!prod) return;
      var pl = (plancheParPiece[p.id] || 0) * k;
      var li = planchesTTC > 0 ? livraison * pl / planchesTTC : 0;
      var lvp = prod.vendeur ? vendeurs[prod.vendeur].frais / vendeurs[prod.vendeur].pieces : 0;
      var achat = prixAchatPiece(prod, p.couleurId);
      coutPieces[p.id] = { achat: achat, planches: pl, livraison: li, livraisonVendeur: lvp, total: achat + pl + li + lvp };
    });

    // Un pack complet (au moins deux pièces avec le même identifiant de pack) est un seul article, avec un seul prix.
    // Sa marge est la somme des marges fixes de ses pièces (1 € par pièce, 0 € pour les chaussettes).
    // Les autres pièces forment un groupe par produit, avec 1 € de marge par motif (2 € au plus par pièce).
    var nbMotifs = {};
    motifs.forEach(function (m) { nbMotifs[m.pieceId] = (nbMotifs[m.pieceId] || 0) + 1; });
    // vêtements apportés : plus de regles.apporte.seuil pièces apportées dans la commande = marge réduite sur toutes ces pièces
    var nApportees = order.pieces.filter(function (p) { var pr = ctx.produits[p.produitId]; return pr && pr.apporte && coutPieces[p.id]; }).length;
    var reglesApp = reglesApporte(prix.regles, nApportees), apporteReduite = reglesApp !== prix.regles;
    var parPack = {};
    order.pieces.forEach(function (p) { if (p.pack && coutPieces[p.id]) (parPack[p.pack] = parPack[p.pack] || []).push(p); });
    var groupes = [], gi = {}, nbPacks = 0;
    function groupe(cle, base) {
      var g = gi[cle]; if (!g) { g = gi[cle] = Object.assign({ n: 0, cout: 0, margeTotale: 0, motifs: 0 }, base); groupes.push(g); } return g;
    }
    order.pieces.forEach(function (p) {
      if (!coutPieces[p.id]) return;
      var pk = p.pack && parPack[p.pack].length >= 2 ? parPack[p.pack] : null;
      if (pk) {
        if (pk[0] !== p) return;                  // le pack est ajouté une seule fois, avec toutes ses pièces
        var ids = pk.map(function (x) { return x.produitId; });
        var g = groupe("pack:" + (p.packType || ids.slice().sort().join("+")), { pack: true, packType: p.packType || null, produitIds: ids, pieces: pk.length });
        g.n++; nbPacks++;
        pk.forEach(function (x) { g.cout += coutPieces[x.id].total; g.margeTotale += margePiecePack(ctx.produits[x.produitId], prix.regles); });
      } else {
        var g2 = groupe("produit:" + p.produitId, { pack: false, produitId: p.produitId, pieces: 1 });
        g2.n++; g2.cout += coutPieces[p.id].total;
        var pr2 = ctx.produits[p.produitId];
        g2.motifs += nbMotifs[p.id] || 0; g2.margeTotale += margePiece(nbMotifs[p.id] || 0, pr2.apporte ? reglesApp : prix.regles);
        if (pr2.apporte && apporteReduite) g2.margeReduite = true;
      }
    });

    var vente = null;
    if (groupes.length) {
      var fx = fixerPrix(groupes, cout, prix.regles);
      var seul = groupes.length === 1 && !groupes[0].pack;
      vente = {
        brut: round2(cout / N),
        unitaire: seul ? groupes[0].unitaire : null,   // un seul prix par pièce seulement s'il n'y a qu'un produit et pas de pack
        groupes: groupes.map(function (g) {
          return { pack: g.pack, produitId: g.produitId || null, packType: g.packType || null, produitIds: g.produitIds || null, n: g.n, pieces: g.pieces,
            coutMoyen: round2(g.coutMoyen), margeMoyenne: round2(g.margeMoyenne), motifs: g.pack ? null : g.motifs, margeReduite: !!g.margeReduite, unitaire: g.unitaire, total: g.total };
        }),
        packs: { n: nbPacks },
        apporte: { n: nApportees, seuil: prix.regles.apporte ? prix.regles.apporte.seuil : null, reduite: apporteReduite },
        total: fx.total, marge: fx.marge
      };
    }

    return {
      N: N, motifs: motifs, warnings: warnings, plans: plans, lignesPlanches: allLines,
      couts: { achats: achats, planchesHT: planchesHT, planchesTTC: planchesTTC, livraison: livraison, livraisonVendeurs: livraisonVendeurs, total: cout },
      vendeurs: listeVendeurs,
      coutPieces: coutPieces,
      prix: vente
    };
  }

  // Prix affichés sur la vitrine, pour un produit (ou un pack) : un visuel A6 (ou Mini sur un accessoire) aux emplacements
  // de référence (item.vitrine). Pour un pack, le prix est celui d'un pack complet.
  function priceTable(item, quantites, ctx) {
    var marq = {}, avecTexte = false;
    (item.vitrine || ["poitrine"]).forEach(function (e) {
      var emp = ctx.emplacements[e], txt = !!(emp && emp.texteSeul);
      var fmts = emp && emp.formats || [];
      marq[e] = { actif: true, avecImage: !txt, image: null, format: fmts.indexOf("A6") >= 0 || !fmts.length ? "A6" : fmts[0], orient: "portrait" };   // A6, ou le plus petit format de l'emplacement (accessoires)
      // emplacement réservé aux prénoms (chaussettes...) : le prix affiché compte un prénom de 3 cm
      if (txt) { avecTexte = true; marq[e].maj = true; marq[e].prenom = { actif: true, police: "Bebas Neue", hauteur: 3, couleur: "#ffffff" }; }
    });
    var ids = item.produits || [item.id];
    return quantites.map(function (q) {
      var pieces = [];
      for (var i = 0; i < q; i++) ids.forEach(function (pid, j) {
        var prod = ctx.produits[pid];
        pieces.push({ id: "v" + i + "_" + j, produitId: pid, couleurId: prod.couleurs[0].id, taille: prod.tailles[1] || prod.tailles[0], prenom: avecTexte ? "Prénom" : "", numero: "",
          pack: item.produits ? "pk" + i : undefined, packType: item.produits ? item.id : undefined });
      });
      var r = computeOrder({ pieces: pieces, marquages: marq, technique: "dtf" }, ctx);
      var unit = r.prix.total / q;
      return { q: q, unitaire: round2(unit), total: r.prix.total };
    });
  }

  // Mesure de texte de secours (Node) : largeur proportionnelle au nombre de caractères
  function approxMeasure(text, police, hauteur) {
    var font = hauteur / 0.72;
    return { w: text.length * font * 0.55, h: hauteur * 1.25, fontCm: font, asc: hauteur };
  }

  return {
    round2: round2, packSheet: packSheet, planSheets: planSheets, costSheets: costSheets,
    elementsFor: elementsFor, layoutStack: layoutStack, stackFor: stackFor, motifImage: motifImage, buildMotifs: buildMotifs,
    pieceTechno: pieceTechno, polyesterPiece: polyesterPiece, prixAchatPiece: prixAchatPiece, margePiece: margePiece, margePiecePack: margePiecePack, reglesApporte: reglesApporte, calcPrix: calcPrix, fixerPrix: fixerPrix, computeOrder: computeOrder, priceTable: priceTable,
    approxMeasure: approxMeasure, fitsPlateau: fitsPlateau, STACK_GAP: STACK_GAP, BLOC_GAP: BLOC_GAP,
    imageGeom: imageGeom, descriptionVisuel: descriptionVisuel, largeurMax: largeurMax, largeurPourFormat: largeurPourFormat, quartDeTour: quartDeTour, LARGEUR_MIN: LARGEUR_MIN
  };
});
