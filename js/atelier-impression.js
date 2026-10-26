/*
 * ATELIER, partie impression :
 *   Fiche de fabrication : un document A4 à imprimer, avec les quantités, les planches, les pièces à presser.
 *   Planches à envoyer   : une image PNG par planche, aux dimensions exactes du fournisseur (300 dpi, fond transparent, à l'endroit),
 *                          et un plan de coupe annoté pour s'y retrouver.
 */
(function () {
  "use strict";

  var At = window.Atelier, A = At.A, st = At.st, F = window.Fichiers;
  var esc = At.esc, fmtEUR = At.fmtEUR, fmtN = At.fmtN, plur = At.plur, $ = A.$, $$ = A.$$;
  var DPI = 300;
  var NOM_ELEMENT = { image: "visuel", prenom: "prénom", numero: "numéro", texte: "texte libre" };

  /* ---------- plan d'une planche en SVG (aperçu à l'écran et fiche imprimée) ---------- */
  function sheetSVG(s) {
    var sheet = s.sheet, W = sheet.format.w, H = sheet.format.h, order = st.order;
    var out = '<svg class="sheet" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plan de la planche ' + esc(s.code) + ", " + esc(sheet.format.nom) + '">';
    out += '<rect width="' + W + '" height="' + H + '" fill="#fff" stroke="#14213d" stroke-width=".25"/>';
    sheet.placed.forEach(function (p) {
      var mo = p.ref.motif, ow = p.ref.w, oh = p.ref.h;
      var tf = p.rot ? "translate(" + (p.x + p.w) + " " + p.y + ") rotate(90)" : "translate(" + p.x + " " + p.y + ")";
      var isImg = !!mo.avecImage;
      out += '<g transform="' + tf + '"><title>' + esc(mo.label) + "</title>";
      out += '<rect width="' + ow + '" height="' + oh + '" fill="' + (isImg ? "#fdf0ea" : "#e3e9e5") + '" stroke="' + (isImg ? "#e8451e" : "#14213d") + '" stroke-width=".12"/>';
      composants(mo).forEach(function (c) {
        var el = c.el;
        if (el.kind === "image") {
          var img = order.marquages[mo.emp] && order.marquages[mo.emp].image;
          if (img && img.dataUrl) {
            // le visuel tourné d'un quart de tour : sa case (w × h) est le rectangle qui l'englobe, on le tourne autour de son centre
            var w0 = el.w0 != null ? el.w0 : el.w, h0 = el.h0 != null ? el.h0 : el.h, cx = c.x + el.w / 2, cy = c.y + el.h / 2;
            out += '<image href="' + esc(img.dataUrl) + '" x="' + (cx - w0 / 2) + '" y="' + (cy - h0 / 2) + '" width="' + w0 + '" height="' + h0 + '" preserveAspectRatio="xMidYMid meet"' + (el.rot ? ' transform="rotate(' + el.rot + " " + cx + " " + cy + ')"' : "") + "/>";
          }
        } else {
          // texte tourné : la case (w × h) englobe le texte, qui est tourné autour de son centre
          var h0 = el.h0 != null ? el.h0 : el.h, cxT = c.x + el.w / 2, cyT = c.y + el.h / 2;
          (el.lignes || [{ text: el.text, y: el.asc }]).forEach(function (l) {
            out += '<text x="' + cxT + '" y="' + (cyT - h0 / 2 + l.y) + '" text-anchor="middle" font-family="\'' + esc(el.police) + '\', Impact, sans-serif" font-size="' + el.fontCm +
              '" fill="' + esc(el.couleur) + '"' + (el.rot ? ' transform="rotate(' + el.rot + " " + cxT + " " + cyT + ')"' : "") + ' style="paint-order:stroke;stroke:rgba(0,0,0,.35);stroke-width:.08px">' + esc(l.text) + "</text>";
          });
        }
      });
      out += '<text x=".4" y="1.5" font-size="1.4" fill="#14213d" font-family="Hanken Grotesk, sans-serif" font-weight="700" opacity=".8">' + esc(At.codeMotif(mo)) + "</text></g>";
    });
    return out + "</svg>";
  }

  // Ce qu'il y a dans la case d'un motif, avec sa position (en cm, depuis le coin de la case) : un visuel ou un texte seul,
  // ou, pour un bloc collé, ses éléments empilés et centrés. Le visuel seul remplit sa case.
  function composants(mo) {
    if (mo.kind === "bloc") return mo.el.items.map(function (it) { return { el: it, x: it.dx, y: it.dy }; });
    return [{ el: mo.el, x: 0, y: 0 }];
  }

  /* ---------- planche en PNG ---------- */
  // dpi : résolution du fichier. annot : plan de coupe (fond blanc, cadres, repères, bandeau de titre) au lieu du fichier à envoyer.
  function dessiner(s, dpi, annot) {
    var sheet = s.sheet, W = sheet.format.w, H = sheet.format.h, ppcm = dpi / 2.54, bandeau = annot ? 2.6 : 0;
    var cv = document.createElement("canvas");
    cv.width = F.px(W, dpi); cv.height = F.px(H + bandeau, dpi);
    var ctx = cv.getContext("2d");
    if (!ctx) throw new Error("taille");
    if (annot) {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#14213d"; ctx.font = "700 " + (1.2 * ppcm) + 'px "Hanken Grotesk", Arial, sans-serif'; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
      ctx.fillText((st.contact.asso || "Commande") + " – " + s.code + " sur " + s.total + ", " + sheet.format.nom, 0.5 * ppcm, 1.7 * ppcm);
      ctx.strokeStyle = "#14213d"; ctx.lineWidth = 0.08 * ppcm; ctx.strokeRect(0.04 * ppcm, bandeau * ppcm, cv.width - 0.08 * ppcm, H * ppcm - 0.04 * ppcm);
    }
    sheet.placed.forEach(function (p) {
      var mo = p.ref.motif, ow = p.ref.w, oh = p.ref.h;
      ctx.save();
      if (p.rot) { ctx.translate((p.x + p.w) * ppcm, (bandeau + p.y) * ppcm); ctx.rotate(Math.PI / 2); }
      else ctx.translate(p.x * ppcm, (bandeau + p.y) * ppcm);
      composants(mo).forEach(function (c) {
        var el = c.el;
        if (el.kind === "image") {
          var info = st.imgs[mo.emp];
          if (info && info.img && info.nw && info.nh) {
            var w0 = el.w0 != null ? el.w0 : el.w, h0 = el.h0 != null ? el.h0 : el.h;
            var k = Math.min(w0 / info.nw, h0 / info.nh), dw = info.nw * k, dh = info.nh * k;
            ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
            ctx.save(); ctx.translate((c.x + el.w / 2) * ppcm, (c.y + el.h / 2) * ppcm);
            if (el.rot) ctx.rotate(el.rot * Math.PI / 180);
            ctx.drawImage(info.img, -dw / 2 * ppcm, -dh / 2 * ppcm, dw * ppcm, dh * ppcm);
            ctx.restore();
          }
        } else {
          ctx.font = (el.fontCm * ppcm) + 'px "' + el.police + '", Impact, sans-serif';
          ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
          var h0 = el.h0 != null ? el.h0 : el.h;
          ctx.save(); ctx.translate((c.x + el.w / 2) * ppcm, (c.y + el.h / 2) * ppcm);
          if (el.rot) ctx.rotate(el.rot * Math.PI / 180);
          (el.lignes || [{ text: el.text, y: el.asc }]).forEach(function (l) {
            var tx = 0, ty = (-h0 / 2 + l.y) * ppcm;
            if (annot) { ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 0.08 * ppcm; ctx.strokeText(l.text, tx, ty); }
            ctx.fillStyle = el.couleur;
            ctx.fillText(l.text, tx, ty);
          });
          ctx.restore();
        }
      });
      if (annot) {
        ctx.setLineDash([0.3 * ppcm, 0.2 * ppcm]); ctx.strokeStyle = mo.avecImage ? "#e8451e" : "#1f6b57"; ctx.lineWidth = 0.1 * ppcm;
        ctx.strokeRect(0.05 * ppcm, 0.05 * ppcm, (ow - 0.1) * ppcm, (oh - 0.1) * ppcm); ctx.setLineDash([]);
        var lab = At.codeMotif(mo);
        ctx.font = "700 " + (1.1 * ppcm) + 'px "Hanken Grotesk", Arial, sans-serif'; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        var tw = ctx.measureText(lab).width;
        ctx.fillStyle = "rgba(255,255,255,.88)"; ctx.fillRect(0.2 * ppcm, 0.2 * ppcm, tw + 0.5 * ppcm, 1.5 * ppcm);
        ctx.fillStyle = "#14213d"; ctx.fillText(lab, 0.45 * ppcm, 1.3 * ppcm);
      }
      ctx.restore();
    });
    return cv;
  }

  function pngBytes(cv, dpi) {
    return new Promise(function (ok, ko) {
      cv.toBlob(function (b) {
        if (!b) { ko(new Error("taille")); return; }
        b.arrayBuffer().then(function (ab) { ok(F.pngAvecDpi(new Uint8Array(ab), dpi)); }, ko);
      }, "image/png");
    });
  }

  function nomFichier(s, annot) {
    var f = s.sheet.format;
    return A.slug(st.contact.asso || "commande") + "-" + (s.techno === "dtf" ? "dtf" : "sublimation") + "-" + s.num + "-sur-" + s.total + "-" + f.id + "-" + fmtDim(f.w) + "x" + fmtDim(f.h) + "cm" + (annot ? "-plan-de-coupe" : "") + ".png";
  }
  function fmtDim(x) { return String(x).replace(".", ","); }

  function fabriquer(s, annot) {
    var dpi = annot ? 100 : DPI;
    return new Promise(function (ok, ko) {
      try { var cv = dessiner(s, dpi, annot); pngBytes(cv, dpi).then(ok, ko); } catch (e) { ko(e); }
    });
  }
  function erreurPng(e, s) {
    if (e && e.message === "taille") return "Ce navigateur ne peut pas fabriquer une image aussi grande (" + s.sheet.format.nom + " à " + DPI + " dpi). Essaie avec Chrome sur un ordinateur.";
    return "La planche n'a pas pu être préparée (" + ((e && e.message) || "erreur inconnue") + ").";
  }

  function telecharger(nom, bytes, mime) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bytes], { type: mime || "image/png" }));
    a.download = nom; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  function lisezMoi() {
    var Fo = A.PRIX.fournisseur;
    var l = ["Planches à envoyer à " + Fo.nom + " – " + (st.contact.asso || "commande"), "",
      "Pour chaque planche : choisis le format indiqué sur le site, puis dépose le fichier sans le modifier.", Fo.url || "", "",
      "Fichier demandé : " + Fo.fichier, ""];
    st.sheets.forEach(function (s) { l.push(s.code + " sur " + s.total + " : " + s.sheet.format.nom + ", " + plur(s.sheet.placed.length, "motif", "motifs") + " -> " + nomFichier(s, false)); });
    l.push("", "Les fichiers « plan-de-coupe » ne sont pas à envoyer : ils servent à reconnaître chaque motif à la découpe.");
    return l.join("\r\n") + "\r\n";
  }

  /* =================================================================== */
  /* PLANCHES                                                            */
  /* =================================================================== */
  At.views.planches = function () {
    var app = $("#app");
    if (!st.order) { app.innerHTML = At.empty("Les planches à envoyer", "Charge un fichier de commande : l'atelier prépare une image par planche, prête à déposer chez le fournisseur."); return; }
    var Fo = A.PRIX.fournisseur, html = "";
    html += '<section class="pl"><div class="h-row"><h1>Planches à envoyer</h1><div class="a-actions">' +
      (st.sheets.length ? '<button type="button" class="btn btn-primary" id="pl-zip">Tout télécharger (.zip)</button>' : "") + At.lien(Fo.url, "Ouvrir " + esc(Fo.nom)).replace("<a ", '<a class="btn btn-quiet" ') + "</div></div>" +
      '<p class="lead-s">Une image par planche, au format exact demandé par ' + esc(Fo.nom) + ' : fond transparent, ' + DPI + ' dpi, à l\'endroit. Il n\'y a rien à retoucher.</p>' +
      '<ol class="at-steps" aria-label="Comment faire"><li><b>Télécharge</b><span>Le PNG de chaque planche, ou tout dans un seul zip.</span></li>' +
      '<li><b>Dépose-le chez ' + esc(Fo.nom) + '</b><span>Choisis le même format que sur la carte, puis envoie le fichier tel quel.</span></li>' +
      '<li><b>Garde le plan de coupe</b><span>Il montre où se trouve chaque motif pour les découper à la réception.</span></li></ol>';
    if (st.alertes.length) html += '<ul class="warn">' + st.alertes.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>";
    if (!st.sheets.length) html += '<p class="empty">Aucune planche à commander : aucun marquage actif dans cette commande.</p>';
    st.sheets.forEach(function (s) {
      var f = s.sheet.format, nb = s.sheet.placed.length;
      html += '<article class="shc" data-key="' + s.key + '"><div class="shc-fig"><div class="sheetscroll">' + sheetSVG(s) + "</div></div><div class=\"shc-info\">" +
        "<h2>" + esc(s.code) + " sur " + s.total + "</h2><p class=\"shc-fmt\">" + esc(A.PRIX.planches[s.techno].nom) + ", " + esc(f.nom) + "</p>" +
        '<dl class="shc-dl"><div><dt>Fichier</dt><dd>' + F.px(f.w, DPI) + " × " + F.px(f.h, DPI) + " px, " + DPI + " dpi</dd></div><div><dt>Contenu</dt><dd>" + plur(nb, "motif", "motifs") + "</dd></div><div><dt>Prix</dt><dd>" + fmtEUR(f.prix) + " TTC</dd></div></dl>" +
        '<div class="shc-act"><button type="button" class="btn btn-primary" data-dl="' + s.key + '">Télécharger le PNG à envoyer</button><button type="button" class="btn btn-quiet" data-plan="' + s.key + '">Plan de coupe</button></div>' +
        '<p class="shc-err" data-err="' + s.key + '" role="alert" hidden></p>' +
        (s.techno === "sublimation" ? '<p class="hint">Sublimation : envoie le fichier à l\'endroit, sans miroir.</p>' : "") +
        "<details><summary>Ce qu'il y a sur la planche</summary><ul class=\"notes\">" + s.sheet.placed.map(function (p) { return "<li><b>" + esc(At.codeMotif(p.ref.motif)) + "</b> " + esc(p.ref.motif.label) + ", " + fmtN(p.ref.w) + " × " + fmtN(p.ref.h) + " cm" + (p.rot ? ", tourné" : "") + "</li>"; }).join("") + "</ul></details>" +
        "</div></article>";
    });
    html += visuelsHtml() + "</section>";
    app.innerHTML = html;

    var byKey = {}; st.sheets.forEach(function (s) { byKey[s.key] = s; });
    function occupe(btn, txt, fn) {
      var old = btn.textContent; btn.disabled = true; btn.textContent = txt;
      return fn().then(function () { btn.disabled = false; btn.textContent = old; }, function (e) { btn.disabled = false; btn.textContent = old; throw e; });
    }
    function montrer(key, msg) { var el = $('[data-err="' + key + '"]'); if (!el) { A.toast(msg); return; } el.textContent = msg; el.hidden = !msg; }
    $$("[data-dl]").forEach(function (b) {
      b.addEventListener("click", function () {
        var s = byKey[b.dataset.dl]; montrer(s.key, "");
        occupe(b, "Préparation…", function () { return fabriquer(s, false).then(function (bytes) { telecharger(nomFichier(s, false), bytes); }); }).catch(function (e) { montrer(s.key, erreurPng(e, s)); });
      });
    });
    $$("[data-plan]").forEach(function (b) {
      b.addEventListener("click", function () {
        var s = byKey[b.dataset.plan]; montrer(s.key, "");
        occupe(b, "Préparation…", function () { return fabriquer(s, true).then(function (bytes) { telecharger(nomFichier(s, true), bytes); }); }).catch(function (e) { montrer(s.key, erreurPng(e, s)); });
      });
    });
    var zb = $("#pl-zip");
    if (zb) zb.addEventListener("click", function () {
      var files = [], i = 0, total = st.sheets.length * 2, old = zb.textContent;
      zb.disabled = true;
      var chaine = Promise.resolve();
      st.sheets.forEach(function (s) {
        [false, true].forEach(function (annot) {
          chaine = chaine.then(function () { zb.textContent = "Préparation " + (++i) + " sur " + total + "…"; return fabriquer(s, annot); })
            .then(function (bytes) { files.push({ name: nomFichier(s, annot), data: bytes }); });
        });
      });
      chaine.then(function () {
        files.push({ name: "lisez-moi.txt", data: new TextEncoder().encode(lisezMoi()) });
        telecharger("planches-" + A.slug(st.contact.asso || "commande") + ".zip", F.zip(files), "application/zip");
        A.toast("Archive prête : " + plur(st.sheets.length, "planche", "planches") + " et leurs plans de coupe.");
      }).catch(function (e) { A.toast(erreurPng(e, st.sheets[Math.max(0, Math.floor((i - 1) / 2))])); })
        .then(function () { zb.disabled = false; zb.textContent = old; });
    });
    $$("[data-replace]").forEach(function (inp) {
      inp.addEventListener("change", function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(f.type)) { A.toast("Il faut un PNG, un JPEG, un SVG ou un WebP."); return; }
        var rd = new FileReader();
        rd.onload = function () {
          var ancien = st.order.marquages[inp.dataset.replace].image;
          st.order.marquages[inp.dataset.replace].image = { nom: f.name, dataUrl: rd.result, ratio: ancien && ancien.ratio };   // les proportions choisies par le client restent celles de la case
          At.prepare().then(function () { At.save(); At.route(); A.toast("Visuel remplacé : " + f.name + "."); });
        };
        rd.readAsDataURL(f);
      });
    });
  };

  function visuelsHtml() {
    var o = st.order, emps = Object.keys(o.marquages).filter(function (e) {
      var m = o.marquages[e], emp = A.DATA.emplacements[e];
      return m && m.actif && m.avecImage !== false && emp && !emp.texteSeul && st.res.motifs.some(function (x) { return x.emp === e && x.avecImage; });
    });
    if (!emps.length) return "";
    return '<section class="a-block"><h2>Visuels de la commande</h2><p class="hint">Les visuels reçus du client. Si l\'un est manquant, flou ou avec un fond, remplace-le : les planches se mettent à jour.</p><div class="imgs">' +
      emps.map(function (e) {
        var m = o.marquages[e], info = st.imgs[e] || {}, dpi = At.dpiVisuel(e), emp = A.DATA.emplacements[e];
        var etat = [];
        if (!m.image || !m.image.dataUrl) etat.push('<span class="bad">visuel manquant</span>');
        else {
          if (info.nw) etat.push(info.nw + " × " + info.nh + " px" + (dpi ? ", environ " + dpi + " dpi" : ""));
          if (info.vector) etat.push("vectoriel, net à toute taille");
          if (info.jpeg) etat.push('<span class="bad">JPEG, sans transparence</span>');
          else if (info.opaque) etat.push('<span class="bad">pas de zone transparente</span>');
          else if (info.img && !info.vector) etat.push('<span class="good">fond transparent</span>');
          if (dpi && dpi < 150) etat.push('<span class="bad">définition faible</span>');
        }
        return "<figure>" + (m.image && m.image.dataUrl ? '<img src="' + esc(m.image.dataUrl) + '" alt="Visuel ' + esc(emp.label) + '">' : '<div class="noimg">Aucun visuel</div>') +
          "<figcaption><b>" + esc(emp.label) + "</b>, " + esc(m.format || "") + "<br>" + (m.image ? esc(m.image.nom || "") + "<br>" : "") + etat.join("<br>") +
          '<div class="fig-act">' + (m.image && m.image.dataUrl ? '<a class="btn btn-quiet" download="' + esc(e + "-" + (m.image.nom || "visuel.png")) + '" href="' + esc(m.image.dataUrl) + '">Télécharger</a>' : "") +
          '<label class="filebtn">Remplacer<input type="file" data-replace="' + e + '" accept="image/png,image/jpeg,image/svg+xml,image/webp"></label></div></figcaption></figure>';
      }).join("") + "</div></section>";
  }

  /* =================================================================== */
  /* FICHE DE FABRICATION                                                */
  /* =================================================================== */
  // Guide des méthodes (js/methodes.js) : raccourcis vers les pièces de la commande chargée, une ligne par article et couleur
  function guidePieces() {
    if (!st.order) return [];
    var vus = {}, out = [];
    st.order.pieces.forEach(function (p) {
      var prod = At.prodOf(p), col = At.colorOf(p), mat = prod.apporte && A.matiereDe ? A.matiereDe(p) : null, k = prod.id + "|" + col.id + "|" + (mat ? mat.id : "");
      if (vus[k]) return;
      vus[k] = 1;
      out.push({ libelle: prod.nomCourt + ", " + col.nom.toLowerCase() + (mat ? " (" + mat.court + ")" : ""), produitId: prod.id, couleurId: col.id, matiere: mat ? mat.id : "" });
    });
    return out;
  }
  // Pose le guide au-dessus du contenu de la vue : renvoie le html complet et la fonction qui branche le guide une fois la page écrite
  function avecGuide(app, html) {
    if (!window.Methodes) return { html: html, lier: function () {} };
    var opts = { pieces: guidePieces() };
    return { html: window.Methodes.guideHtml(opts) + html, lier: function () { window.Methodes.lier(app, opts); } };
  }

  At.views.fabrication = function () {
    var app = $("#app");
    if (!st.order) {
      var vide = avecGuide(app, At.empty("Fiche de fabrication", "Charge un fichier de commande : la fiche à imprimer se remplit toute seule, avec les quantités à acheter, les planches et les pièces à presser."));
      app.innerHTML = vide.html;
      vide.lier();
      return;
    }
    var o = st.order, r = st.res, c = st.contact, pv = r.prix;
    var box = '<span class="box" aria-hidden="true"></span>';
    var today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    var recu = st.creeLe ? new Date(st.creeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
    var ach = At.achats(o);

    var html = '<div class="fiche-bar no-print"><h1>Fiche de fabrication</h1><button type="button" class="btn btn-primary" id="f-print">Imprimer la fiche</button>' +
      '<p class="hint">Une feuille A4 par tranche d\'une trentaine de pièces. Les cases à cocher servent à suivre l\'avancement à la main.</p></div>';

    html += '<article class="fiche"><header class="f-head"><div><img class="f-logo" src="img/logo-fabricam.png" alt="Fabr\'Icam" width="782" height="414"><p class="f-brand">' + esc(A.DATA.service.nom) + ", atelier</p><h2>Fiche de fabrication</h2></div>" +
      "<dl><div><dt>Association</dt><dd>" + esc(c.asso || "–") + "</dd></div><div><dt>Contact</dt><dd>" + esc([c.nom, c.email, c.tel].filter(Boolean).join(", ") || "–") + "</dd></div>" +
      "<div><dt>À rendre pour le</dt><dd>" + (c.date ? esc(At.fmtDate(c.date)) : "pas de date") + "</dd></div>" +
      (recu ? "<div><dt>Commande reçue le</dt><dd>" + esc(recu) + "</dd></div>" : "") + "<div><dt>Fiche éditée le</dt><dd>" + esc(today) + "</dd></div></dl></header>";

    html += '<dl class="f-tot"><div><dt>' + (r.N > 1 ? "pièces" : "pièce") + "</dt><dd>" + r.N + "</dd></div><div><dt>" + (r.motifs.length > 1 ? "motifs à presser" : "motif à presser") + "</dt><dd>" + r.motifs.length + "</dd></div><div><dt>" + (st.sheets.length > 1 ? "planches" : "planche") + "</dt><dd>" + st.sheets.length + "</dd></div></dl>";
    if (c.message) html += '<p class="f-msg"><b>Message du client :</b> ' + esc(c.message) + "</p>";

    // 1. vêtements
    html += '<section class="f-sec long"><h3><span class="f-n">1</span>Vêtements à réunir</h3>' + At.table([{ t: "" }, { t: "Quantité", num: true }, "Article", "Couleur", "Taille", "Source"],
      ach.map(function (a) {
        var v = A.vendeurInfo(a.prod);
        return [box, '<b class="big">' + a.qty + "</b>", esc(a.prod.nom), At.sw(a.col.hex) + esc(a.col.nom) + (a.matiere ? " <small>(" + esc(a.matiere.court) + ")</small>" : ""), "<b>" + esc(a.taille) + "</b>", a.prod.apporte ? "Apporté par le client" : v ? esc((v.plateforme === "Decathlon" ? "" : v.plateforme + ", ") + v.nom) : "Decathlon, magasin"];
      }), "f-tbl") + "</section>";

    // 2. planches
    html += '<section class="f-sec long"><h3><span class="f-n">2</span>Planches du fournisseur</h3>';
    if (st.sheets.length) {
      html += At.table([{ t: "" }, "Planche", "Format", { t: "Motifs", num: true }, "Fournisseur", "Reçue", "Découpée"],
        st.sheets.map(function (s) {
          return [box, "<b>" + esc(s.code) + "</b> sur " + s.total, esc(A.PRIX.planches[s.techno].nom + ", " + s.sheet.format.nom), s.sheet.placed.length, esc(A.PRIX.fournisseur.nom), box, box];
        }), "f-tbl") +
        '<div class="f-plans">' + st.sheets.map(function (s) { return "<figure>" + sheetSVG(s) + "<figcaption><b>" + esc(s.code) + "</b>, " + esc(s.sheet.format.nom) + "</figcaption></figure>"; }).join("") + "</div>" +
        '<p class="f-key">Repères : numéro de la pièce, puis P poitrine, D dos, MG manche gauche, MD manche droite, CG cuisse gauche, CD cuisse droite, BJ bas de jambe, SG et SD chaussettes, SA sac, GO gourde, CA casquette, BO bonnet, TC tour de cou, BA bandeau, CE ceinture, SE serviette, OB ouvre-bouteille, PC porte-clés, puis v visuel, p prénom, n numéro, t texte libre. Exemple : 3·Dp = prénom du dos de la pièce 3. Un bloc collé (visuel, prénom et numéro sur un seul transfert, à presser d\'un coup) porte plusieurs lettres : 3·Pvpn = visuel, prénom et numéro collés de la poitrine de la pièce 3.</p>';
    } else html += '<p class="empty">Aucune planche : aucun marquage actif.</p>';
    html += "</section>";

    // 3. récap des motifs
    var rec = {};
    r.motifs.forEach(function (m) {
      var k = m.emp; rec[k] = rec[k] || { image: 0, prenom: 0, numero: 0, texte: 0, bloc: 0, fmt: {}, compo: {} };
      rec[k][m.kind]++;
      if (m.avecImage) {
        var cfgM = o.marquages[m.emp] || {}, vis = A.CTX && window.Engine.motifImage(m);
        // un visuel de taille libre se compte par ses dimensions (« 8 × 4 cm »), un visuel au format par le nom du format (« A6 »)
        rec[k].fmt[cfgM.largeur > 0 && vis ? fmtN(vis.w0 != null ? vis.w0 : vis.w) + " × " + fmtN(vis.h0 != null ? vis.h0 : vis.h) + " cm" + (vis.rot ? ", tourné de " + vis.rot + "°" : "") : (cfgM.format || "")] = 1;
      }
      if (m.kind === "bloc") rec[k].compo[m.el.items.map(function (i) { return i.kind === "image" ? "visuel " + ((o.marquages[m.emp] || {}).format || "") : NOM_ELEMENT[i.kind]; }).join(" + ")] = 1;
    });
    var avecTextes = r.motifs.some(function (m) { return m.kind === "texte"; });
    var avecBlocs = r.motifs.some(function (m) { return m.kind === "bloc"; });
    var empRows = A.EMP_ORDER.filter(function (e) { return rec[e]; }).map(function (e) {
      var x = rec[e];
      var ligne = [esc(A.DATA.emplacements[e].label), x.image ? "<b>" + x.image + "</b> × " + esc(Object.keys(x.fmt).join(", ")) : "–", x.prenom ? "<b>" + x.prenom + "</b>" : "–", x.numero ? "<b>" + x.numero + "</b>" : "–"];
      if (avecTextes) ligne.push(x.texte ? "<b>" + x.texte + "</b>" : "–");
      if (avecBlocs) ligne.push(x.bloc ? "<b>" + x.bloc + "</b> × " + esc(Object.keys(x.compo).join(" ; ")) : "–");
      return ligne;
    });
    html += '<section class="f-sec"><h3><span class="f-n">3</span>Motifs à presser</h3>' + (empRows.length ? At.table(["Emplacement", { t: "Visuels", num: false }, "Prénoms", "Numéros"].concat(avecTextes ? ["Textes libres"] : []).concat(avecBlocs ? ["Blocs collés"] : []), empRows, "f-tbl") : '<p class="empty">Aucun motif.</p>') + "</section>";

    // 4. pièces
    html += '<section class="f-sec long"><h3><span class="f-n">4</span>Pièces à presser</h3>' + At.table([{ t: "Pressée" }, { t: "N°", num: true }, "Article", "Taille", "Prénom", "Numéro", "À poser", "Planches", "Contrôlée"],
      o.pieces.map(function (p, i) {
        var col = At.colorOf(p), mine = r.motifs.filter(function (m) { return m.pieceId === p.id; }), emps = {}, codes = {};
        mine.forEach(function (m) { (emps[m.emp] = emps[m.emp] || []).push(m.kind === "bloc" ? "bloc " + m.el.items.map(function (i) { return At.KIND[i.kind]; }).join("+") : At.KIND[m.kind]); var sh = st.motifSheet[m.id]; if (sh) codes[sh.code] = 1; });
        var txt = A.EMP_ORDER.filter(function (e) { return emps[e]; }).map(function (e) { return At.ABBR[e] + " " + emps[e].join("+"); }).join(", ");
        var tc = At.presseDe(p).tech, t = tc === "sublimation" ? ' <span class="tag">sublimation</span>' : tc === "gravure" ? ' <span class="tag">gravure / vinyle</span>' : tc === "vinyle" ? ' <span class="tag">vinyle</span>' : "";
        return [box, i + 1, esc(At.prodOf(p).nomCourt) + ", " + esc(col.nom.toLowerCase()) + t, "<b>" + esc(p.taille) + "</b>", esc(p.prenom || ""), esc(p.numero || ""), esc(txt || "rien"), esc(Object.keys(codes).join(", ")), box];
      }), "f-tbl f-pieces") + "</section>";

    // 5. presse
    html += '<section class="f-sec"><h3><span class="f-n">5</span>Réglages de presse</h3><ul class="notes">' + At.pressNotes(o, r).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></section>";

    if (st.alertes.length) html += '<section class="f-sec"><h3>À vérifier avant de commencer</h3><ul class="notes">' + st.alertes.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></section>";

    html += '<footer class="f-foot"><div>Pressé par<span class="line"></span></div><div>Contrôlé par<span class="line"></span></div><div>Remis le<span class="line"></span></div></footer></article>';
    var page = avecGuide(app, html);
    app.innerHTML = page.html;
    page.lier();
    $("#f-print").addEventListener("click", function () { window.print(); });
  };
})();
