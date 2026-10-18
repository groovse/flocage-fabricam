# Fabr'Icam Flocage

Site de flocage pour les associations de l'Icam : vitrine avec prix par quantité, configurateur de vêtements avec aperçu à la taille réelle, calcul des planches de transfert DTF Print, demande de devis par mail, et une page atelier pour toi (`atelier.html`).

## Ouvrir le site

Double-clique sur `index.html`. Aucun serveur, aucune installation. Il faut juste internet pour les polices (Google Fonts) ; sans connexion, le site marche avec des polices de secours.

## Utiliser côté client

1. L'association configure : pièces (couleur, taille, prénom, numéro), marquages par emplacement (poitrine, dos, manches), technique.
2. Le prix TTC par pièce se met à jour à chaque changement. L'aperçu montre le vêtement en dessin à la taille réelle, ou sur la photo du vêtement (bouton Dessin / Photo).
3. Elle télécharge le fichier de commande, puis clique sur « Écrire le mail » : Gmail s'ouvre dans un nouvel onglet avec le message pré-rempli vers fabricam.toulouse@icam.fr. Elle joint le fichier.

## Utiliser côté atelier

Ouvre `atelier.html` (lien « Espace atelier » en bas du site client). Mot de passe : `2024`. Charge le fichier de commande reçu par mail (bouton, ou glisse-le sur la page) : l'atelier le garde dans ton navigateur jusqu'à ce que tu le fermes. Cinq onglets :

- **Commande** : l'association, le contact, la date, le message ; les chiffres clés ; ce qu'il faut acheter chez Decathlon (en magasin, puis les articles de la place de marché avec leur vendeur et ses frais de port), avec le lien de la fiche de chaque couleur et un bouton « Copier la liste » ; les planches à commander chez DTF Print ; le coût de revient, le prix de chaque produit (coût moyen + marge de 20 %) et la marge finale ; les points à vérifier.
- **Pièces** : un diaporama, une pièce à la fois (flèches du clavier, boutons, balayage au doigt, ou la rangée de pastilles en bas). Pour chaque pièce : le dessin de face et de dos avec les visuels du client posés dessus, la couleur et la taille, le prénom et le numéro en grand, ce qu'il faut poser à chaque emplacement (visuel, prénom, numéro, taille en cm) avec la planche et la case où le trouver, le réglage de presse, et l'article à acheter avec son lien.
- **Fiche de fabrication** : un document A4 à imprimer (bouton « Imprimer la fiche »). Les vêtements à réunir avec les quantités, les planches du fournisseur avec leur plan, le récapitulatif des motifs, la liste des pièces à presser avec cases « pressée » et « contrôlée », les réglages de presse, et trois lignes de signature.
- **Planches à envoyer** : une image PNG par planche, prête à déposer sur le site du fournisseur : dimensions exactes du format choisi (par exemple 2480 × 3307 px pour une A4 de 21 × 28 cm, 6614 × 11811 px pour le mètre), 300 dpi inscrits dans le fichier, fond transparent, à l'endroit. Chaque planche a aussi un « plan de coupe » (PNG annoté avec les repères de chaque motif) qui n'est pas à envoyer. « Tout télécharger » donne un seul fichier .zip avec les deux, et un `lisez-moi.txt`. En dessous, les visuels reçus : leur définition en dpi, un avertissement s'ils n'ont pas de fond transparent, et un bouton pour en remplacer un.
- **Base d'achats** : les fournisseurs (DTF Print avec ses tarifs et la règle du fichier, Decathlon, chaque vendeur de la place de marché avec ses frais) et la liste de tous les articles du catalogue, avec le prix d'achat, les tailles, la matière et le lien de chaque couleur. Recherche par nom, couleur ou référence, filtre par catégorie, export CSV pour Excel.

## Catalogue

27 vêtements, 18 accessoires et 5 packs.

- **Hauts** : polo de tennis Essential, sweat chaud en molleton, maillot de basket TANK 100, débardeur fitness 500, polo de golf MW500, t-shirts (coton femme Essentiel, manches courtes femme, fitness femme 100, coton homme, tee-shirt homme gris), sweats de football (T100 et 1/2 zip Viralto Axton), hauts thermiques BL100 (femme et homme), veste micropolaire Kariban, veste sans manches Regatta, doudoune sans manche Result Core.
- **Bas** : short de basket SHORT 100, short de tennis Essential, short 2 en 1 fitness femme, short slim fitness femme 500, pantalon de jogging droit femme, jogging molleton homme Domyos, short de football Essentiel Kipsta.
- **Robe** : robe Hummel à manches courtes. **Accessoires** : chaussettes de football (prénom ou numéro seulement), gourdes (alu 1 L Quechua, fitness 750 mL Domyos, verre Phoenix), casquettes (randonnée Forclaz, chasse orange Solognac, tennis Artengo), bonnets (Rider 500 à revers Wedze, running seamless Kiprun), tour de cou Morf (vendeur partenaire Atelier Katanga), sacs (tube 30 L Move 100, sport 20 L Club 100), sacs à dos (Arpenaz 50, Travel 100 pliable, Arpenaz 100, Arpenaz 500, MH100), bandeau et ceinture de running Kiprun.
- **Ensembles** : survêtement Joma Eco Championship (vendu en un seul article, flocage sur la veste), pack basket (maillot + short + chaussettes), pack fitness femme (t-shirt + short slim + chaussettes), pack jogging femme (pantalon + t-shirt coton + chaussettes), pack football (sweat T100 + short Essentiel + chaussettes), pack entraîneur (veste micropolaire + haut thermique homme + jogging homme + chaussettes). Un pack est fait de pièces achetées séparément et vendu comme un seul article.

Le catalogue se filtre par genre (Homme, Femme), par style (Sport, Casual) et par type (Hauts, Bas, Robes, Ensembles, Accessoires) ; un vêtement mixte apparaît dans les deux genres. Un bandeau tout en haut du site invite à demander un vêtement qui n'est pas au catalogue : il ouvre un message Gmail pré-rempli vers Fabr'Icam.

Sur le catalogue, chaque photo a une loupe : un clic ouvre la visionneuse en grand (flèches du clavier pour changer de photo, Échap pour fermer). Pour le pack, la loupe de chaque pièce ouvre les photos de cette pièce.

Emplacements : poitrine, dos et manches pour les hauts ; cuisse gauche, cuisse droite (visuel A6 ou A5, avec prénom ou numéro possible) et bas de la jambe gauche (petit texte seul) pour les shorts et le pantalon ; chaussette gauche et droite (prénom ou numéro seulement) pour les chaussettes. Les maillots, débardeurs, gilets, doudoune, robe et hauts thermiques n'ont pas de manches à floquer.

### Articles de la place de marché Decathlon

Cinq articles (veste sans manches Regatta, doudoune Result Core, veste micropolaire Kariban, robe Hummel, survêtement Joma) sont vendus par des vendeurs partenaires de Decathlon : pas de retrait en magasin, le vendeur livre à Fabr'Icam. Le site les repère par l'étiquette « Livré par le vendeur » et une note sur la fiche et dans le configurateur (livraison par le vendeur, stock limité, article personnalisé ni repris ni échangé). Les frais de port du vendeur sont comptés **une seule fois par vendeur et par commande**, répartis sur ses pièces et compris dans le prix. Decathlon n'affiche ces frais qu'au moment de commander : **4,99 € par vendeur est une estimation**, à corriger dans `js/prix.js` (`livraisonVendeur`) quand tu connais le vrai montant.

## Aperçu sur photo

Dans le configurateur, le bouton **Photo** pose le logo, les prénoms et les numéros sur la vraie photo du vêtement, en face et au dos. C'est indicatif : les photos sont prises de trois quarts, les positions sont approchées. Les limites :

- il faut choisir la couleur de la photo (polo marine, sweat bleu foncé, maillot, short de basket et débardeur blancs) ; sinon le site explique pourquoi et garde le dessin ;
- les manches ne sont pas montrées sur la photo (elles restent sur le dessin) ;
- le short de tennis n'a pas de photo exploitable ;
- si la photo ne se charge pas, le dessin la remplace.

Le dessin à la taille réelle reste la référence pour vérifier les dimensions.

## Règle de prix

Les planches DTF Print et la livraison sont réparties sur les pièces au prorata de la surface de leurs motifs. Chaque produit a son propre prix unitaire : coût moyen de ses pièces (vêtement + part des planches et de la livraison) + 20 %, **avec une marge qui ne dépasse jamais 2 € par article**, arrondi au centime supérieur. Une pièce qui coûte 10 € est vendue 12 €, une pièce qui coûte 30 € est vendue 32 € (et non 36 €). Le plafond est `regles.margeMax` dans `js/prix.js` (mets `null` pour le supprimer). Le prix suit le coût, sans palier.

Un pack (basket, fitness, jogging, football, entraîneur) est vendu comme un seul article, avec une seule marge. Elle vaut 20 % du coût moyen d'une pièce, soit 20 % divisé par le nombre de pièces du coût du pack (6,7 % pour trois pièces, 5 % pour quatre), et reste plafonnée à 2 € pour tout le pack. Le pack coûte donc moins cher que les pièces séparées. Le taux est dans `js/prix.js` (`regles.marge`).

Frais de port d'un vendeur de la place de marché : un montant par vendeur et par commande (`livraisonVendeur` dans `js/prix.js`), ajouté au coût de revient et réparti sur les pièces de ce vendeur, avant la marge (20 %, plafonnée à 2 €). Plus la commande est grosse, plus la part par pièce baisse.

Prix de la vitrine = un vêtement avec un visuel A6 à l'emplacement de référence (poitrine, ou une cuisse pour les shorts), pour 1, 5, 10, 20 et 50 pièces. Pour un pack : le visuel A6 sur chaque pièce de référence, prix par pack. Pour les chaussettes (prénom seul), le prix affiché compte un prénom de 3 cm de haut : tous les packs en contiennent une paire.

## Choses à vérifier

- **Fournisseur des planches** : DTF Print (Port-de-Bouc), prix relevés TTC le 18/10/2026 sur dtfprint.fr : DTF A4 5,50 €, A3 8,00 €, A2 14,00 €, mètre 18,00 € ; sublimation A4 3,90 €, A3 7,50 €, A2 13,00 €. Avant, le site utilisait Sprint Transfert (plus cher et sans remise relevée). Un fournisseur qui affiche des prix HT se règle avec `prixPlanchesHT: true` dans `js/prix.js`.
- **Remises par quantité de DTF Print** : elles démarrent à 10 planches (A4 4,00 € au lieu de 5,50 €). Une commande de flocage en compte rarement autant, donc elles ne sont pas appliquées. Pour les ajouter, remplis `remises` dans `js/prix.js` (`{ min: 10, pct: 0.27 }`).
- **Livraison** : offerte dès 100 € TTC de transferts. En dessous, DTF Print n'affiche le prix qu'au panier : 4,90 € est une estimation à corriger dans `livraison.colissimo`.
- **Sublimation** : DTF Print annonce un polyester d'au moins 65 % ; le site garde 90 % pour un rendu net. La planche A4 de sublimation fait 20 × 28 cm (le visuel A4 de 21 cm de large part donc sur une A3).
- **Prix d'achat** : relevés sur les fiches Decathlon le 18/10/2026 (polo 7,99 €, sweat 14,99 €, maillot 6,99 €, short de basket 6,99 €, short de tennis 5,99 €, débardeur 9,99 €, et ceux des 19 articles ajoutés en 2.3.0). Le polo blanc est supposé au même prix que le marine. Vérifie en magasin et corrige `prixAchat` dans `js/data.js`.
- **Stock** : les articles de la place de marché ont un stock très limité (le survêtement Joma n'a que les tailles XS, S et 2XL, le sweat Viralto Axton que la 2XL). Les tailles du catalogue sont celles des fiches du 18/10/2026 ; vérifie avant de promettre une commande.
- **Aperçu sur photo** : il n'existe que pour les 6 premiers vêtements. Les 19 articles ajoutés en 2.3.0 s'affichent en dessin (le bouton Photo est grisé avec une explication).
- **Accessoires et formats** : les petits articles utilisent deux formats de visuel en plus de l'A6 : Mini (5 × 5 cm, casquette, bonnet, bandeau, gourde) et A7 (7 × 10 cm). Le prix affiché compte un Mini sur ces articles, un A6 sur un sac. Les emplacements sont dans `emplacements` de `js/data.js`, les formats dans `formatsMotif` de `js/prix.js`.
- **Gourdes** : floquées en transfert DTF sur la face (confirmé le 19/10/2026). Surface ronde : petit visuel seulement (Mini ou A7), avec un avertissement et un essai avant la série.
- **Casquettes, bonnets, bandeau, ceinture, tour de cou** : tissus bombés ou très élastiques, avertissement et essai avant la série. Le bonnet Rider 500 est en acrylique tricoté : le DTF y tient mal.
- **Prix par couleur** : certains coloris coûtent un peu plus (bonnet Rider 500 à 4,99 € ou 8,99 € selon la couleur, sac tube 5,99 ou 6,00 €) : le site garde le prix le plus haut et ne propose que les coloris à ce prix.
- **Articles délicats** : chaussettes, sous-vêtements thermiques, micropolaire et doudoune portent un avertissement (essai de pressage avant la série) dans le configurateur et dans l'atelier.
- **Couleurs** : seules les couleurs dont la référence est connue sont dans le catalogue. Les fiches indiquent d'autres coloris (par exemple 5 couleurs pour les articles Kipsta) : ajoute-les dans `couleurs` quand tu as leur référence.
- **Teintes d'aperçu** : les codes couleur du dessin sont estimés, ils n'ont aucun effet sur les prix.
- **Sweat** : le molleton est en mélange polyester et coton (59 % de polyester), il part donc toujours en DTF. Fais un essai de pressage avant de lancer toute la commande.
- **Maillot et débardeur** : le maillot de basket a des bordures noires, le débardeur est en coton (DTF uniquement).
- **Calage de l'aperçu sur photo** : `u0` et `v0` donnent la position de l'origine du dessin sur la photo (0 à 1, fraction de la largeur et de la hauteur), `kx` et `ky` la fraction de photo par centimètre. Si tu changes une photo, recale ces quatre nombres : le test `node tests/engine.test.js` vérifie au moins que les emplacements restent dans la photo.
- **Écart entre motifs** : `placement.ecart` vaut 0 cm, ce qui permet de loger 4 A6 sur une A4. Monte-le à 0,3 si tu veux plus de marge de découpe.
- **Plateau** : aucun motif ne dépasse l'A4 (21 × 28 cm), les planches plus grandes ne servent qu'à regrouper plusieurs motifs.
- **Sublimation** : seulement sur polyester blanc ou clair (90 % de polyester minimum). Le blanc n'est pas imprimé. Tout le reste part en DTF.
- **DTF sur polyester** : environ 135 °C pendant 10 s, pelage à froid. Fais un essai sur un polo d'essai (risque de migration de teinture sur les couleurs foncées).

## Modifier le site

| Je veux… | Je modifie |
|---|---|
| changer un prix de planche, le fournisseur, la TVA, la livraison, la marge (20 %, plafond 2 €), l'arrondi | `js/prix.js` |
| ajouter un vêtement ou un accessoire, une couleur, une taille | `js/data.js` (copie un bloc de `produits`) |
| ajouter un pack ou un ensemble | `js/data.js` (`packs`, avec `type: "ensemble"` dans les `tags`) |
| marquer un article de la place de marché, ou changer les frais de port d'un vendeur | `js/data.js` (`vendeur` du produit) et `js/prix.js` (`livraisonVendeur`) |
| changer les filtres du catalogue (Homme, Femme, Sport, Casual, Hauts, Bas…) ou les étiquettes d'un vêtement | `js/data.js` (`filtres`, et `tags` du produit) |
| ajouter l'aperçu sur photo à un vêtement, ou corriger la position du visuel sur une photo | `js/data.js` (`apercuPhoto` du produit : `couleur`, puis `face` et `dos` avec `photo` = rang dans `photos`, `u0`, `v0`, `kx`, `ky`) |
| changer le bandeau du haut (vêtement hors catalogue) | `index.html` (`#top-note`) et le mail pré-rempli dans `js/app.js` (`autreVetementHref`) |
| changer la liste des polices | `js/data.js` (`polices`) |
| changer le mot de passe de l'atelier | `js/atelier.js` (`MDP`) |
| changer la mise en page de l'atelier ou de la fiche imprimée | `css/atelier.css` |
| changer les couleurs, les polices du site | `css/style.css` (variables en haut) |

Pour un nouveau produit, il faut : `id`, `nom`, `nomCourt`, `marque`, `modele` (le dessin : `polo`, `sweat`, `debardeur`, `maillot`, `short-basket`, `short-tennis`, `short-slim`, `tshirt`, `manches-longues`, `veste`, `sweat-zip`, `gilet`, `gilet-matelasse`, `robe`, `pantalon`, `chaussette`, ou pour un accessoire `gourde`, `casquette`, `bonnet`, `tour-de-cou`, `bandeau`, `sac-tube`, `sac-sport`, `sac-a-dos` ou `ceinture`), `tags` (genre, style, type : haut, bas, robe, ensemble ou accessoire, et le sport en étiquette), `prixAchat` (TTC), `polyesterPct`, `tailles`, `couleurs` (avec `clair: true` pour les couleurs claires), `vitrine` (emplacements du prix affiché) et les `zones` (position en cm sur le dessin). Un nouveau modèle de dessin se code dans `js/preview.js` ; les accessoires y sont dessinés à l'échelle réelle sur un fond plus petit (`w` et `h` du modèle). Un article qui ne se sublime pas (forme ronde, enduit, élastique) porte `sublimation: false`. Chaque couleur peut garder sa référence Decathlon (`ref`) et le lien de sa page (`lien`). Chaque produit a ses photos Decathlon (4 à 8), chargées depuis leur site : la première est celle du catalogue, les autres apparaissent en vignettes. Si une photo ne s'affiche pas (hors ligne, lien périmé), le catalogue montre le dessin du vêtement. Pour changer ou ajouter une photo : champ `photos` du produit, avec l'adresse de l'image sans paramètres (la taille est ajoutée par le site).

## Versions et modifications

- La branche `main` est la version en ligne : on n'y met que du travail terminé et testé.
- Chaque grosse modification se fait sur sa propre branche (`ajout/<produit>`, `fonction/<nom>`, `correctif/<nom>`), puis est fusionnée dans `main` par une pull request.
- Chaque version publiée reçoit un numéro (`v1.1.0`) sous forme de tag Git, une entrée dans `CHANGELOG.md` et une release GitHub.
- Les messages de commit disent ce qui change, en une ligne.

## Tests

```
node tests/engine.test.js
node tests/fichiers.test.js
```

45 tests : 37 sur le moteur et le catalogue (`engine.test.js`) et 8 sur les outils de fichiers de l'atelier (`fichiers.test.js` : dimensions en pixels, résolution 300 dpi écrite dans le PNG, archive zip, CSV). Les 37 premiers : 22 sur le moteur, marge de 20 % plafonnée à 2 €, arrondi au centime, prix par produit, pack à une seule marge, texte seul, regroupement de motifs sur les planches, sublimation, livraison offerte, rapidité ; 3 sur les réglages de l'aperçu sur photo (couleur et rang de photo valides, emplacements dans la photo) ; 12 sur le catalogue étendu (données cohérentes, dessins de face et de dos, frais de port par vendeur, chaussettes, composition et marge des packs, nouveaux vêtements, formats et zones des accessoires, sublimation).

## Publier sur GitHub Pages

1. Crée un dépôt, mets-y tout le dossier tel quel (`index.html` à la racine).
2. Settings, Pages, « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le site est alors en ligne à `https://<ton-compte>.github.io/<dépôt>/`.

Points d'attention :
- Les photos Decathlon sont liées, pas copiées. Sur un site public, mieux vaut les remplacer par tes propres photos (dossier `img/`, champ `photos` dans `data.js`).
- Le mot de passe de l'atelier (`MDP` en haut de `js/atelier.js`, `2024` pour l'instant) n'est qu'une porte pour les curieux. Le site est statique : tout le code, et donc le mot de passe, se lit dans le navigateur. Il ne protège rien de confidentiel ; l'atelier ne contient d'ailleurs aucune donnée, il lit seulement le fichier de commande que tu charges toi-même (gardé dans ton navigateur, jamais envoyé nulle part).
- Les commandes passent uniquement par mail (Gmail, pas l'application de mail de l'ordinateur) et fichier joint, rien n'est stocké sur le site. Les liens de mail sont construits par `gmailHref` dans `js/app.js` ; sans Gmail, le bouton « Copier le texte du mail » reste disponible.
