# Historique des versions

Les versions suivent le principe `MAJEUR.MINEUR.CORRECTIF` :
- **MAJEUR** : changement qui casse quelque chose (format du fichier de commande, règle de prix).
- **MINEUR** : nouveau produit ou nouvelle fonction.
- **CORRECTIF** : correction, mise à jour d'un prix, retouche d'affichage.

## 3.2.0 — 19/10/2026

Catégorie Accessoires : 18 articles Decathlon.

- **Gourdes** : alu 1 L Quechua (9,99 €), fitness 750 mL Domyos (9,00 €), verre Phoenix (7,99 €).
- **Coiffes** : casquettes de randonnée Forclaz (4,99 €), de chasse orange Solognac (5,99 €) et de tennis Artengo (5,99 €) ; bonnet à revers Rider 500 Wedze (8,99 €) et bonnet de running seamless Kiprun (5,99 €) ; tour de cou Morf (7,99 €, 13 coloris, vendeur partenaire Atelier Katanga : 4,99 € de port estimés, une seule fois par commande).
- **Sacs** : sac tube pliable Move 100 30 L, sac de sport pliable Club 100 20 L, sacs à dos Arpenaz 50, Travel 100 pliable, Arpenaz 100, Arpenaz 500 et MH100. **Running** : bandeau V2 et ceinture smartphone Basique 2 Kiprun.
- Neuf nouveaux dessins à l'échelle réelle (gourde, casquette, bonnet, tour de cou, bandeau, sac tube, sac de sport, sac à dos, ceinture) avec vue de face et de dos. Deux nouveaux formats de visuel pour les petites surfaces : Mini (5 × 5 cm) et A7 (7 × 10 cm). Le prix affiché d'un petit accessoire compte un Mini, celui d'un sac un A6.
- Sept nouveaux emplacements : face du sac, gourde, devant de la casquette, du bonnet et du bandeau, tour de cou, ceinture. Prénoms et numéros possibles partout, en petit.
- Avertissements : les gourdes (surface ronde, technique de pose à confirmer), les bonnets en maille, le tour de cou, le bandeau et les casquettes demandent un essai avant la série. Pas de sublimation sur ces articles, sauf le tour de cou blanc (`sublimation: false` dans les données).
- Chaque couleur garde sa référence Decathlon et le lien de sa page (`ref`, `lien`), pour la future base d'achat de l'atelier.
- Packs de trois ou quatre pièces : les photos du catalogue s'affichent en trois colonnes ou en grille de deux par deux.
- Le catalogue compte des « articles » (et non plus des « vêtements »).
- Aucun changement de règle de prix ni de format du fichier de commande. Tests : 37 en tout (formats et zones des accessoires, sublimation, frais de port des deux vendeurs).

## 3.1.0 — 18/10/2026

Chaussettes dans les packs, pack entraîneur et deux nouveaux vêtements.

- **Chaussettes dans les packs** : les packs basket, fitness femme et jogging femme passent à trois pièces avec les chaussettes de football blanches. Le pack football passe aussi à trois pièces (sweat T100, short Essentiel et chaussettes). Le prix affiché compte un visuel A6 sur chaque vêtement et un prénom de 3 cm sur une chaussette.
- **Pack entraîneur** (homme) : veste micropolaire Kariban, haut thermique BL100 homme, jogging molleton homme et chaussettes, quatre pièces vendues comme un seul article (une seule marge, plafonnée à 2 €). La veste vient d'un vendeur partenaire : ses frais de port s'ajoutent une fois par commande.
- **Deux nouveaux vêtements** : jogging molleton homme Domyos (9,99 €, 100 % polyester, noir ou bleu acier, S à 4XL) et short de football adulte Essentiel Kipsta (4,99 €, 100 % polyester, 8 coloris, XS à 4XL). Ils se commandent aussi seuls.
- Les packs de plus de deux pièces s'affichent correctement dans le catalogue (« Trois pièces : … ») et une commande qui ne contient qu'un pack non personnalisé reste remplaçable.
- Aucun changement de règle de prix ni de format du fichier de commande. Tests : 34 en tout (composition des packs, marge plafonnée par pack, nouveaux vêtements).

## 3.0.0 — 18/10/2026

Nouveau fournisseur de planches (DTF Print) et marge plafonnée à 2 € par article. **Règle de prix modifiée : les prix du site changent.**

- **Marge plafonnée** : toujours 20 % du coût, mais jamais plus de 2 € par article. Une pièce qui coûte 10 € reste vendue 12 €, une pièce à 30 € est vendue 32 € (36 € avant). Un pack compte pour un seul article : 2 € au maximum pour tout le pack. Réglage `regles.margeMax` dans `js/prix.js` (`null` = pas de plafond). L'espace atelier indique « marge plafonnée à 2,00 € » sur les lignes concernées.
- **DTF Print à la place de Sprint Transfert** (Port-de-Bouc, 13, 4,9/5 sur 144 avis Google, fabrication en 1 jour). Prix TTC, une planche : DTF A4 5,50 € (Sprint 6,05 €), A3 8,00 € (9,79 €), A2 14,00 € (18,36 €), mètre 18,00 € (34,56 €) ; sublimation A4 3,90 € (6,30 €), A3 7,50 €, A2 13,00 €. Plus de planches A6 et A5 : une petite commande part sur une A4. Livraison offerte dès 100 € TTC ; en dessous, 4,90 € estimés.
- Réglages de presse mis à jour : DTF sur polyester ou nylon 135 °C pendant 10 s, coton 150 °C pendant 10 à 15 s, mélange 145 °C pendant 12 s, sublimation 190 à 200 °C pendant 40 à 60 s. Les fichiers se préparent à l'endroit, aux dimensions exactes de la planche (PNG ou PDF sans fond, 300 dpi) : l'espace atelier le rappelle et le nom du fournisseur est lu dans `PRIX.fournisseur`.
- Nouveau réglage `prixPlanchesHT` (remplace `sprintPrixHT`) : `false` car DTF Print affiche des prix TTC. Les fichiers de commande se lisent toujours, mais le total recalculé est plus bas que celui qu'un client avait vu avant : l'atelier le signale (« Les tarifs ont changé »).
- Remises par quantité de DTF Print (dès 10 planches) non appliquées, voir le README.
- Tests : 32 en tout, règles de marge réécrites (plafond, pack, sans plafond).

## 2.3.1 — 18/10/2026

Les mails s'ouvrent dans Gmail.

- Le bouton « Écrire le mail à Fabr'Icam », la demande de vêtement hors catalogue, le lien du pied de page et le mail du client dans l'espace atelier ouvrent maintenant la rédaction de Gmail dans un nouvel onglet, au lieu de l'application de mail installée sur l'ordinateur. Le message reste pré-rempli ; le fichier de commande se joint toujours à la main.
- Le bouton « Pas de Gmail ? Copier le texte du mail » reste là pour les autres messageries.
- Aucun changement de prix ni de fichier de commande.

## 2.3.0 — 18/10/2026

19 nouveaux vêtements, une catégorie Ensembles et la livraison des vendeurs de la place de marché Decathlon.

- Catalogue : 25 vêtements et 4 packs (6 vêtements et 1 pack avant). Nouveaux : 5 t-shirts (femme et homme), polo de golf, sweats de football (T100 et 1/2 zip Viralto Axton), hauts thermiques femme et homme, short 2 en 1 et short slim fitness femme, pantalon de jogging femme, chaussettes de football, et 5 articles de la place de marché (veste sans manches Regatta, doudoune Result Core, veste micropolaire Kariban, robe Hummel, survêtement Joma). Prix d'achat, tailles, compositions et photos relevés sur les fiches Decathlon.
- Catégorie **Ensembles** : pack fitness femme (t-shirt + short slim), pack jogging femme (pantalon + t-shirt coton) et pack football (sweat T100 + chaussettes), en plus du pack basket. Chaque pack est fait de pièces achetées séparément et vendu comme un seul article, avec une seule marge. Le survêtement Joma n'existe qu'en un seul article (veste et pantalon ne s'achètent pas séparément) : il est classé dans Ensembles, le flocage se fait sur la veste.
- Nouveau filtre **Type** (Hauts, Bas, Robes, Ensembles, Accessoires) à côté de Pour et Style.
- Articles de la place de marché : étiquette « Livré par le vendeur », note sur la fiche et dans le configurateur (livraison par le vendeur, pas de retrait en magasin, stock limité, article personnalisé ni repris ni échangé). Frais de port du vendeur comptés une seule fois par vendeur et par commande, répartis sur ses pièces et inclus dans le prix. **Le montant (4,99 €) est une estimation** : Decathlon ne l'affiche qu'au moment de commander. À corriger dans `js/prix.js` (`livraisonVendeur`).
- Espace atelier : les achats sont séparés en « en magasin » et « en ligne (place de marché) » avec le vendeur, le lien de la fiche et les frais de port estimés ; le détail des coûts ajoute les lignes correspondantes.
- Chaussettes : nouveaux emplacements chaussette gauche et droite, réservés aux prénoms et aux numéros. Le prix de la vitrine compte un prénom de 3 cm. Le configurateur signale quand il n'y a encore rien à presser.
- 10 nouveaux dessins : t-shirt, haut à manches longues, veste zippée, sweat 1/2 zip, gilet, gilet matelassé, robe, pantalon, short slim, chaussettes (le dessin peut maintenant être plus haut que large). Photos de l'aperçu : pas encore calées pour ces 19 articles, le bouton Photo est grisé avec une explication.
- Avertissements ajoutés : chaussettes, hauts thermiques, micropolaire, doudoune, survêtement Joma (vendu en un seul article), sweat Viralto (une seule taille).
- 7 tests de plus : 31 en tout. Aucun changement de règle de prix ni de format du fichier de commande (les anciens fichiers se lisent toujours).

## 2.2.0 — 18/10/2026

Aperçu du logo, des prénoms et des numéros sur les vraies photos.

- Configurateur : bouton Dessin / Photo au-dessus de l'aperçu. En mode Photo, les marquages se posent sur la photo du vêtement, en face et au dos (polo, sweat, maillot, short de basket, débardeur). Les positions sont indicatives, car les photos sont prises de trois quarts.
- Disponible dans la couleur de la photo et pour les vues calibrées. Sinon la note sous l'aperçu explique pourquoi (autre couleur, pas de photo de dos, short de tennis sans photo exploitable) et le dessin reste affiché. Les manches ne sont pas montrées sur la photo. Si la photo ne charge pas, le dessin la remplace.
- Catalogue : une loupe sur chaque photo ouvre une visionneuse en grand, avec flèches, compteur, touches clavier (flèches, Échap) et clic à côté pour fermer. Elle s'ouvre sur la photo choisie en vignette ; pour le pack, chaque pièce ouvre ses propres photos.
- Nouveau champ `apercuPhoto` dans `js/data.js` (couleur de la photo, rang et calage de chaque vue). 3 tests de plus : 24 en tout.
- Aucun changement de prix ni de fichier de commande.

## 2.1.0 — 18/10/2026

Filtres du catalogue et demandes hors catalogue.

- Étiquettes sur chaque vêtement : genre (Homme, Femme), style (Sport, Casual) et sport (Tennis, Basket, Fitness).
- Filtres au-dessus du catalogue : Pour (Tous, Homme, Femme) et Style (Tous, Sport, Casual), avec le nombre de résultats. Le filtre est gardé quand on revient du configurateur. Les articles mixtes (maillot, short de basket, pack) sont dans Homme et dans Femme ; les autres sont en Homme.
- Bandeau tout en haut du site : on peut aussi demander à Fabr'Icam de floquer un vêtement qui n'est pas au catalogue. Le lien ouvre un mail pré-rempli (vêtement souhaité, quantité, tailles, marquages). Il est masqué sur l'espace atelier.
- Si aucun vêtement ne correspond aux filtres, le message propose la même demande.

## 2.0.0 — 18/10/2026

Nouvelle règle de prix : marge de 20 %, sans palier. Le prix de vente change pour tous les produits, d'où le saut de version.

- Prix d'un produit = coût moyen de ses pièces + 20 %, arrondi au centime supérieur. Fin de l'arrondi à 2,50 € et de la marge minimale de 2 € (avec son « +1 € par pièce ») : le prix suit le coût au lieu de monter par paliers. Exemple : le short de basket avec 2 A6 passe de 6 à 7 pièces sans hausse de prix.
- Pack basket : maillot et short sont vendus comme un seul article, avec une seule marge (20 % du coût d'une pièce, soit 10 % du coût du pack). La remise fixe de 2,50 € disparaît.
- Polaire MH100 retirée du catalogue (le duvet retient mal le DTF), avec son dessin et son avertissement.
- Le sweat reste : mélange polyester et coton, DTF uniquement.
- Espace atelier : le détail des coûts montre le taux de marge par produit et la marge finale en pourcentage du coût de revient.
- Réglages dans `js/prix.js` : `regles.marge` et `regles.pas`. Le fichier de commande reste en version 2, les anciens fichiers se lisent toujours (les prix sont recalculés avec les tarifs actuels).

## 1.1.1 — 18/10/2026

Photos des produits.

- Photos Decathlon pour les 6 produits du catalogue (le polo en avait 2, il en a maintenant 4) : 4 à 8 par produit, relevées sur les fiches le 18/10/2026.
- Catalogue : la première photo s'affiche en grand, les autres en vignettes cliquables. Le pack montre la photo du maillot et celle du short.
- Si une photo ne charge pas, le dessin du vêtement la remplace.
- Les photos restent liées depuis Decathlon, elles ne sont pas copiées dans le dépôt.

## 1.1.0 — 18/10/2026

Ajout de la sélection de produits.

- Nouveaux produits : sweat chaud en molleton, polaire MH100 demi-zip, maillot de basket TANK 100, short de basket SHORT 100, short de tennis Essential, débardeur fitness 500.
- Pack basket (maillot + short) avec remise de 2,50 € par pack.
- Nouveaux emplacements pour les shorts : cuisse gauche, cuisse droite (visuel A6 ou A5, prénom, numéro) et bas de la jambe gauche (petit texte).
- Un prix par produit dans une même commande (avant : un prix moyen unique). Les planches et la livraison sont réparties selon la surface des motifs.
- Une commande peut mélanger plusieurs produits ; « Ma commande » permet de la reprendre depuis le catalogue.
- Dessins des nouveaux vêtements, avec les zones de marquage ; le bouton Dos est grisé quand le vêtement n'a rien au dos.
- Avertissement sur la polaire (DTF sur duvet) et sur les couleurs de texte peu lisibles.
- Catalogue en grille, fichier de commande en version 2 (les fichiers de la version 1 restent lisibles dans l'espace atelier).
- Non repris pour l'instant : les 2 t-shirts vendus par un vendeur tiers (Bahrain, Gildan), qui n'ont pas de retrait en magasin.

## 1.0.0 — 18/10/2026

Première version publiée.

- Vitrine avec le polo Essential (marine, blanc) et ses prix par quantité (1, 5, 10, 20, 50 pièces).
- Configurateur : pièces avec prénom et numéro, marquages poitrine, dos et manches, import de visuels, polices, aperçu à taille réelle.
- Moteur de calcul : planches Sprint Transfert (DTF et sublimation), regroupement des motifs, motifs limités à l'A4, prix arrondi à 2,50 € avec vérification de la marge.
- Demande par mail pré-rempli à fabricam.toulouse@icam.fr, avec fichier de commande.
- Espace atelier : coûts, marge, liste Decathlon, lignes Sprint, plan des planches, réglages de presse.
- Balise `noindex` pour ne pas être référencé par les moteurs de recherche.
