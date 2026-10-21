/*
 * ATELIER, partie réglages : onglet « Catalogue et prix ».
 * Les prix, les marges et le catalogue se changent dans 5 fichiers CSV du dossier « donnees » du dépôt GitHub (js/reglages.js).
 * Cet onglet montre ce que le site a lu, signale les lignes refusées, affiche les prix qui en résultent et propose de
 * télécharger les fichiers à jour pour les modifier dans Excel.
 */
(function () {
  "use strict";

  var At = window.Atelier, A = At.A, F = window.Fichiers, R = window.Reglages, E = window.Engine;
  var esc = At.esc, fmtEUR = At.fmtEUR, $ = A.$, $$ = A.$$;
  var DEPOT = "https://github.com/groovse/flocage-fabricam";
  var NOMS = { articles: "Articles", couleurs: "Couleurs", prix: "Prix et marges", planches: "Planches", vendeurs: "Vendeurs" };
  var QUOI = {
    articles: "un article par ligne : nom, prix d'achat, marge propre, prix fixe, tailles, catégories, visible (oui/non), et copie_de pour créer un article",
    couleurs: "une couleur par ligne : prix d'achat de la couleur, rupture de stock, couleur masquée ou ajoutée",
    prix: "les réglages généraux : marge par pièce, arrondi, TVA, livraison, vinyle, vêtements apportés",
    planches: "le prix et la taille de chaque planche DTF et sublimation",
    vendeurs: "les frais de port et les liens des vendeurs de la place de marché"
  };

  function rapport() { return window.REGLAGES || { charges: [], absents: Object.keys(R.FICHIERS), erreurs: [], avertissements: [], articlesAjoutes: [] }; }

  function liste(titre, items, cls) {
    return items.length ? '<div class="rg-box ' + cls + '"><b>' + esc(titre) + "</b><ul>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" : "";
  }

  function apercu() {
    var rows = A.DATA.produits.map(function (p) {
      var t;
      try { t = E.priceTable(p, [1, 10], A.CTX); } catch (e) { t = [{ unitaire: NaN }, { unitaire: NaN }]; }
      var etat = p.masque ? '<span class="tag">masqué</span>' : "";
      var reglage = (p.prixFixe != null ? '<span class="tag">prix fixe</span> ' : "") + (p.marge != null ? '<span class="tag">marge ' + esc(fmtEUR(p.marge)) + "</span>" : "");
      return [esc(p.nom) + " " + etat, p.apporte ? "—" : esc(fmtEUR(p.prixAchat)), reglage || '<span class="muted">règle générale</span>', isNaN(t[0].unitaire) ? "?" : esc(fmtEUR(t[0].unitaire)), isNaN(t[1].unitaire) ? "?" : esc(fmtEUR(t[1].unitaire))];
    });
    return At.table(["Article", { t: "Achat", num: true }, "Marge", { t: "1 pièce", num: true }, { t: "10 pièces", num: true }], rows, "rg-apercu");
  }

  function telecharger(k) {
    var f = R.exporter(A.PRIX, A.DATA);
    if (k === "tous") {
      var enc = new TextEncoder();
      var files = Object.keys(f).map(function (n) { return { name: R.FICHIERS[n].replace("donnees/", ""), data: enc.encode(f[n]) }; });
      A.download("donnees-fabricam.zip", F.zip(files), "application/zip");
      A.toast("Les 5 fichiers sont dans l'archive : décompresse-la avant de les ouvrir dans Excel.");
    } else {
      A.download(R.FICHIERS[k].replace("donnees/", ""), f[k], "text/csv;charset=utf-8");
      A.toast(NOMS[k] + " : fichier téléchargé, à ouvrir avec Excel.");
    }
  }

  At.views.reglages = function () {
    var rap = rapport(), app = $("#app");
    var etat = Object.keys(R.FICHIERS).map(function (k) {
      var lu = rap.charges.indexOf(k) >= 0;
      return ["<b>" + esc(NOMS[k]) + "</b><br><code>" + esc(R.FICHIERS[k]) + "</code>", esc(QUOI[k]),
        lu ? '<span class="tag ok">lu</span>' : '<span class="tag">absent : valeurs intégrées au code</span>',
        '<button type="button" class="btn btn-quiet" data-dl="' + k + '">Télécharger</button>'];
    });
    app.innerHTML =
      '<section class="base"><div class="h-row"><h1>Catalogue et prix</h1><button type="button" class="btn btn-primary" data-dl="tous">Tout télécharger (zip)</button></div>' +
      '<p class="lead-s">Les prix, les marges et le catalogue se règlent dans 5 fichiers Excel (CSV) rangés dans le dossier <code>donnees</code> du dépôt. ' +
      "Le site les lit à chaque visite : pas de code à toucher.</p>" +
      '<h2 class="b-h">Pour changer un prix</h2><ol class="rg-steps">' +
      "<li>Télécharge le fichier à modifier ci-dessous (ou le zip).</li>" +
      "<li>Ouvre-le dans Excel, change les cellules, puis « Enregistrer sous » au format <b>CSV UTF-8 (délimité par des points-virgules)</b>, avec le même nom.</li>" +
      '<li>Sur GitHub, ouvre le <a href="' + DEPOT + '/tree/main/donnees" target="_blank" rel="noopener">dossier donnees</a>, clique « Add file » puis « Upload files », dépose le fichier et valide (« Commit changes »).</li>' +
      "<li>Une à deux minutes plus tard, le site public et cet atelier utilisent les nouvelles valeurs. Recharge cette page : les lignes refusées apparaissent plus bas.</li></ol>" +
      '<h2 class="b-h">Fichiers lus</h2>' + At.table(["Fichier", "Contenu", "État", ""], etat, "rg-etat") +
      liste(rap.erreurs.length + " ligne" + (rap.erreurs.length > 1 ? "s refusées" : " refusée") + " (rien n'a été changé pour elles)", rap.erreurs, "rg-err") +
      liste("À savoir", rap.avertissements, "rg-warn") +
      (rap.erreurs.length || rap.avertissements.length ? "" : (rap.charges.length ? '<p class="rg-ok">Tout a été lu sans problème.</p>' : "")) +
      '<h2 class="b-h">Prix actuels</h2><p class="hint">Calculés avec les réglages ci-dessus : article seul avec un visuel A6 à l\'emplacement de référence, planches et livraison comprises.</p>' + apercu() +
      '<details class="rg-aide"><summary>Comment remplir les colonnes</summary><div>' +
      "<p><b>articles.csv</b> : <code>visible</code> = non pour retirer un article de la vitrine (les anciennes commandes qui le contiennent restent valables). " +
      "<code>marge</code> et <code>prix_fixe</code> : laisse vide pour suivre la règle générale ; <code>prix_fixe</code> impose le prix de vente unitaire, quel que soit le coût. " +
      "<code>tailles</code> et <code>categories</code> : sépare les valeurs par une barre verticale ( | ). " +
      "<code>technique_par_defaut</code> : dtf ou vinyle. <code>sublimation</code> : non si l'article ne se sublime pas.</p>" +
      "<p><b>Nouvel article</b> : ajoute une ligne avec un nouvel <code>id</code> (minuscules, chiffres, tirets), son <code>nom</code>, son <code>prix_achat</code> et, dans <code>copie_de</code>, l'<code>id</code> d'un article proche : il reprend son dessin, ses emplacements, ses photos et ses couleurs. Adapte ensuite ses couleurs dans couleurs.csv.</p>" +
      "<p><b>couleurs.csv</b> : <code>prix_achat</code> vide = même prix que l'article. <code>visible</code> = non retire la couleur. Une nouvelle couleur demande un identifiant, un nom et un code <code>#rrggbb</code> (elle n'a pas de photo). <code>rupture</code> : date AAAA-MM-JJ.</p>" +
      "<p><b>prix.csv</b> : change seulement la colonne <code>valeur</code>. La TVA s'écrit 20 % ou 0,2.</p>" +
      "<p><b>planches.csv, vendeurs.csv</b> : les prix de planche sont TTC. Un nouveau format ou un nouveau vendeur s'ajoute avec une nouvelle ligne complète.</p>" +
      "<p>Une ligne qui ne va pas est ignorée et expliquée ci-dessus ; le reste est pris en compte. Si un fichier manque, le site garde les valeurs écrites dans le code.</p></div></details>" +
      "</section>";
    $$("[data-dl]").forEach(function (b) { b.addEventListener("click", function () { telecharger(b.dataset.dl); }); });
  };
})();
