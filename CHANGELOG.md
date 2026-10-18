# Historique des versions

Les versions suivent le principe `MAJEUR.MINEUR.CORRECTIF` :
- **MAJEUR** : changement qui casse quelque chose (format du fichier de commande, règle de prix).
- **MINEUR** : nouveau produit ou nouvelle fonction.
- **CORRECTIF** : correction, mise à jour d'un prix, retouche d'affichage.

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
