# Fabr'Icam Flocage

Site de flocage pour les associations de l'Icam : vitrine avec prix par quantité, configurateur de vêtements avec aperçu à la taille réelle, calcul des planches de transfert Sprint Transfert, demande de devis par mail, et un espace atelier pour toi.

## Ouvrir le site

Double-clique sur `index.html`. Aucun serveur, aucune installation. Il faut juste internet pour les polices (Google Fonts) ; sans connexion, le site marche avec des polices de secours.

## Utiliser côté client

1. L'association configure : pièces (couleur, taille, prénom, numéro), marquages par emplacement (poitrine, dos, manches), technique.
2. Le prix TTC par pièce se met à jour à chaque changement.
3. Elle télécharge le fichier de commande, puis clique sur « Écrire le mail » : le message est pré-rempli vers fabricam.toulouse@icam.fr. Elle joint le fichier.

## Utiliser côté atelier

Ouvre `index.html#/atelier` (lien « Espace atelier » en bas de page) et charge le fichier de commande reçu. Tu obtiens :

- le coût de revient, l'arrondi à 2,50 €, l'ajustement de marge et la marge finale ;
- la liste à acheter chez Decathlon ;
- les lignes à commander chez Sprint Transfert (DTF et sublimation séparés) ;
- le plan de chaque planche (quel motif de quelle pièce, où) ;
- les réglages de presse, les visuels à télécharger, les points à vérifier.

## Catalogue

Polo de tennis Essential, sweat chaud en molleton, polaire MH100 demi-zip, maillot de basket TANK 100, short de basket SHORT 100, short de tennis Essential, débardeur fitness 500, et un pack basket (maillot + short).

Emplacements : poitrine, dos et manches pour les hauts ; cuisse gauche, cuisse droite (visuel A6 ou A5, avec prénom ou numéro possible) et bas de la jambe gauche (petit texte seul) pour les shorts. Les maillots et débardeurs n'ont ni manches.

## Règle de prix

Les planches Sprint et la livraison sont réparties sur les pièces au prorata de la surface de leurs motifs. Chaque produit a son propre prix unitaire : coût moyen de ses pièces (vêtement + part des planches et de la livraison), arrondi au supérieur de 2,50 €. Si la marge totale de la commande est inférieure ou égale à 2 €, on ajoute 1 € à chaque pièce et on revérifie.

Pack basket : une remise de 2,50 € par pack complet (maillot + short), retirée après l'arrondi. La marge reste vérifiée, donc sur une très petite commande la remise peut être en partie absorbée. Le montant est dans `js/prix.js` (`packs.remise`).

Prix de la vitrine = un vêtement avec un visuel A6 à l'emplacement de référence (poitrine, ou une cuisse pour les shorts), pour 1, 5, 10, 20 et 50 pièces. Pour le pack : maillot avec A6 à la poitrine et short avec A6 sur une cuisse, prix par pack.

## Choses à vérifier

- **Prix Sprint HT ou TTC** : le site les traite comme HT (TVA 20 % ajoutée). Vérifie au panier. Si ce sont déjà des TTC, mets `sprintPrixHT: false` dans `js/prix.js`.
- **Remises par quantité de Sprint** : leur page ne les affiche pas ici. Si tu les relèves, remplis `remises` dans `js/prix.js` (`{ min: 10, pct: 0.05 }`) et le calcul en tient compte.
- **Livraison** : Colissimo 4,90 €, offerte dès 100 € HT de planches.
- **Prix d'achat** : relevés sur les fiches Decathlon le 18/10/2026 (polo 7,99 €, sweat 14,99 €, polaire 8,99 €, maillot 6,99 €, short de basket 6,99 €, short de tennis 5,99 €, débardeur 9,99 €). Le polo blanc est supposé au même prix que le marine. Vérifie en magasin et corrige `prixAchat` dans `js/data.js`.
- **Couleurs** : seules les couleurs dont la référence est connue sont dans le catalogue. Les fiches indiquent d'autres coloris (par exemple 5 couleurs pour les articles Kipsta) : ajoute-les dans `couleurs` quand tu as leur référence.
- **Teintes d'aperçu** : les codes couleur du dessin sont estimés, ils n'ont aucun effet sur les prix.
- **Polaire** : le duvet retient mal le DTF, un avertissement est affiché. Fais un essai.
- **Maillot et débardeur** : le maillot de basket a des bordures noires, le débardeur est en coton (DTF uniquement).
- **Écart entre motifs** : `placement.ecart` vaut 0 cm, ce qui permet de loger 4 A6 sur une A4. Monte-le à 0,3 si tu veux plus de marge de découpe.
- **Plateau** : aucun motif ne dépasse l'A4 (21 × 28 cm), les planches plus grandes ne servent qu'à regrouper plusieurs motifs.
- **Sublimation** : seulement sur polyester blanc ou clair (90 % de polyester minimum). Le blanc n'est pas imprimé. Tout le reste part en DTF.
- **DTF sur polyester** : environ 135 °C pendant 10 s, pelage à froid. Fais un essai sur un polo d'essai (risque de migration de teinture sur les couleurs foncées).

## Modifier le site

| Je veux… | Je modifie |
|---|---|
| changer un prix de planche, la TVA, la livraison, la règle d'arrondi | `js/prix.js` |
| ajouter un vêtement, une couleur, une taille | `js/data.js` (copie un bloc de `produits`) |
| changer la remise du pack ou ajouter un pack | `js/prix.js` (`packs.remise`) et `js/data.js` (`packs`) |
| changer la liste des polices | `js/data.js` (`polices`) |
| changer les couleurs, les polices du site | `css/style.css` (variables en haut) |

Pour un nouveau produit, il faut : `id`, `nom`, `nomCourt`, `marque`, `modele` (le dessin : `polo`, `sweat`, `polaire`, `debardeur`, `maillot`, `short-basket` ou `short-tennis`), `prixAchat` (TTC), `polyesterPct`, `tailles`, `couleurs` (avec `clair: true` pour les couleurs claires), `vitrine` (emplacements du prix affiché) et les `zones` (position en cm sur le dessin). Un nouveau modèle de dessin se code dans `js/preview.js`. Seul le polo a des photos Decathlon, chargées depuis leur site ; les autres produits (et le polo si ses photos ne s'affichent pas) utilisent un dessin. Pour ajouter une photo : champ `photos` du produit.

## Versions et modifications

- La branche `main` est la version en ligne : on n'y met que du travail terminé et testé.
- Chaque grosse modification se fait sur sa propre branche (`ajout/<produit>`, `fonction/<nom>`, `correctif/<nom>`), puis est fusionnée dans `main` par une pull request.
- Chaque version publiée reçoit un numéro (`v1.1.0`) sous forme de tag Git, une entrée dans `CHANGELOG.md` et une release GitHub.
- Les messages de commit disent ce qui change, en une ligne.

## Tests

```
node tests/engine.test.js
```

19 tests sur le moteur : arrondi, marge, prix par produit, pack, texte seul, regroupement de motifs sur les planches, sublimation, livraison offerte, rapidité.

## Publier sur GitHub Pages

1. Crée un dépôt, mets-y tout le dossier tel quel (`index.html` à la racine).
2. Settings, Pages, « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le site est alors en ligne à `https://<ton-compte>.github.io/<dépôt>/`.

Points d'attention :
- Les photos Decathlon sont liées, pas copiées. Sur un site public, mieux vaut les remplacer par tes propres photos (dossier `img/`, champ `photos` dans `data.js`).
- L'espace atelier n'est pas protégé : il ne contient aucune donnée, il lit seulement un fichier de commande que tu charges toi-même.
- Les commandes passent uniquement par mail et fichier joint, rien n'est stocké sur le site.
