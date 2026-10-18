# Historique des versions

Les versions suivent le principe `MAJEUR.MINEUR.CORRECTIF` :
- **MAJEUR** : changement qui casse quelque chose (format du fichier de commande, règle de prix).
- **MINEUR** : nouveau produit ou nouvelle fonction.
- **CORRECTIF** : correction, mise à jour d'un prix, retouche d'affichage.

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
