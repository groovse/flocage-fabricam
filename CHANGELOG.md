# Historique des versions

Les versions suivent le principe `MAJEUR.MINEUR.CORRECTIF` :
- **MAJEUR** : changement qui casse quelque chose (format du fichier de commande, règle de prix).
- **MINEUR** : nouveau produit ou nouvelle fonction.
- **CORRECTIF** : correction, mise à jour d'un prix, retouche d'affichage.

## 8.0.0 — 31/10/2026

Planches communes à toutes les configurations du panier, et marge plafonnée à 20 %. **Version MAJEUR : les prix changent (plafond de marge et planches partagées) ; le fichier de commande reste compatible.**

- **Planches communes.** Avant, chaque configuration du panier était calculée seule : ses motifs avaient leurs propres planches et leur propre livraison, même quand deux configurations auraient tenu sur la même planche. Maintenant le panier est calculé d'un seul bloc (`Engine.computeBasket`) : les motifs de toutes les configurations sont rangés ensemble (DTF avec DTF, sublimation avec sublimation), on commande moins de planches, et la facture du fournisseur baisse.
- **Livraison et frais de port une seule fois.** La livraison des transferts (offerte au-dessus de 100 €) se calcule sur l'ensemble des planches du panier ; les frais de port d'un vendeur ne comptent qu'une fois pour tout le panier, même si ses articles sont dans plusieurs configurations. Ces coûts communs sont répartis sur les pièces au prorata de la surface de leurs motifs.
- **Prix du client.** Le prix de chaque configuration tient compte du regroupement : il baisse quand on ajoute une configuration qui partage des planches. Le panier affiche l'économie par rapport à des configurations chiffrées séparément. Dans le configurateur, le prix de la configuration en cours tient compte du panier. Un seul prix par produit et par configuration, comme avant.
- **Plafond de marge : 20 %.** Nouveau réglage `regles.margeMaxPct` (0,20) dans `js/prix.js` : la marge d'un produit ne dépasse pas 20 % de son coût moyen. Quand l'arrondi à l'euro pair la ferait dépasser, le prix devient le plafond arrondi vers le bas à 0,10 € (`regles.pasPlafond`), sans jamais passer sous le coût. Le plafond passe avant la marge minimale de 3 € ; les prix peuvent donc ne plus être pairs. Exemples : dix polos avec un visuel passent de 14 € à 11,70 € ; un polo seul reste à 22 €. `margeMaxPct: null` supprime le plafond.
- **Atelier.** Les planches, le plan de coupe, la fiche de fabrication et les PNG à envoyer sont communs à toutes les configurations : chaque planche affiche les visuels de chaque configuration (images chargées pour toutes). Les repères des motifs commencent par le numéro de la configuration (`C2·3·Pv`). L'onglet Commande indique les planches à commander pour toute la demande, la part de la configuration affichée et un récapitulatif de la demande entière (coût, total à facturer, marge). Une ligne dont le prix est plafonné le dit.
- **À savoir.** La fiche de paiement et la facture restent faites configuration par configuration, comme avant. Les motifs d'un panier de plusieurs configurations ont des identifiants préfixés (`C2|...`) et portent `lot` ; avec une seule configuration, rien ne change.
- Moteur : `computeBasket(orders, ctx)` ; `computeOrder` en est le cas d'une seule configuration. `fixerPrix` applique le plafond.
- Tests : 180 (123 moteur, 8 fichiers, 24 facturation, 25 méthodes). Les anciens tests de la règle d'arrondi tournent sans plafond ; une section dédiée teste le plafond et le panier.

## 7.4.0 — 26/10/2026

Texte libre sur tous les emplacements, prénom sur plusieurs lignes, textes sans limite de zone. **Version MINEUR : aucun prix existant ne change ; le fichier de commande reste compatible.**

- **Texte libre partout.** Le texte libre multi-lignes de la 7.3.0 (gourdes) est disponible sur tous les emplacements : poitrine, dos, manches, chaussettes, accessoires... Un emplacement peut le refuser avec `texteLibre: false` dans `js/data.js`.
- **Prénom sur plusieurs lignes.** Une case « Prénom sur plusieurs lignes » (`prenom.coupe`) met un mot par ligne : « Jean Dupont » s'imprime sur 2 lignes. Réglage de l'écart entre lignes (`prenom.interligne`). La case Majuscules continue de s'appliquer.
- **Sans limite de zone.** Prénom, numéro et texte libre ne sont plus réduits à la largeur de la zone du vêtement : seul le plateau de la presse (A4) les borne. Un texte qui sort de la zone donne un avertissement non bloquant (« sort de la zone prévue »), l'atelier vérifie la place.
- Moteur : `multiLignes` factorise le calcul des textes à plusieurs lignes (texte libre et prénom coupé).
- Tests : 168 (111 moteur, 8 fichiers, 24 facturation, 25 méthodes).

## 7.3.0 — 26/10/2026

Texte libre sur les gourdes. **Version MINEUR : aucun prix existant ne change ; le fichier de commande reste compatible (une commande d'avant la 7.3.0 s'ouvre sans texte libre).**

- **Texte libre.** Sur la face des gourdes (les 3 gourdes du catalogue et la gourde apportée), une case « Texte libre, identique sur toutes les gourdes » ouvre une zone de texte : une phrase, un slogan, sur une ou plusieurs lignes (un retour à la ligne = une ligne). Le texte est écrit tel qu'il est tapé, sans passage en majuscules.
- **Réglages.** Police, hauteur des lettres, couleur, écart entre les lignes (`interligne`), orientation libre (-180° à 180°, quarts de tour), décalage horizontal et vertical, comme pour le prénom et le numéro. Un champ `texte` (`actif`, `valeur`, `police`, `hauteur`, `interligne`, `couleur`, `rot`, `dx`, `dy`) s'ajoute au marquage `gourde`.
- **Identique sur toute la commande.** Chaque gourde reçoit son propre transfert du même texte. Il s'ajoute au prénom et au numéro de chaque gourde, qui gardent leur valeur.
- **Aucune limite de zone.** Seul le plateau de la presse (A4) compte : un texte plus large est réduit pour y tenir. Le configurateur affiche « texte libre, sans limite de zone » et l'atelier vérifie la place sur la gourde avant de presser.
- **Moteur.** Nouvel élément `texte` dans `elementsFor` (`lignes` : texte et ligne de base de chaque ligne), nouvel indicateur `texteLibre: true` sur l'emplacement `gourde` de `js/data.js`. L'aperçu, les planches (SVG et PNG), le mail, l'atelier, le récapitulatif des motifs et le repère `t` des planches prennent en charge le texte libre.
- Tests : 163 (106 moteur, 8 fichiers, 24 facturation, 25 méthodes).

## 7.2.0 — 26/10/2026

Deux articles Amazon au catalogue : un sweat à capuche et un gilet polaire. **Version MINEUR : aucun prix existant ne change, le format du fichier de commande ne change pas.**

- **Sweat-shirt à capuche Amazon Essentials homme.** Tailles XS à 2XL, 22 couleurs (rose, blanc vif, bleu marine foncé, bordeaux, brun moyen, gris chiné, raisin, vert forêt, blanc, bleu ardoise, bleu cobalt, brun caramel, charbon chiné, noir chiné, or, vert olive chiné, bleu chiné, charbon et gris clair teinture spatiale, orange rouille, rouge foncé, vert camouflage abstrait), de 16,00 € à 16,70 € TTC selon la couleur. 56 % coton et 44 % polyester : DTF, fiche « coton et polyester ». Vendu et expédié par Amazon.
- **Gilet polaire sans manches VELILLA 105905.** Tailles XS à 3XL, 6 couleurs (noir 17,82 €, blanc 17,64 €, rouge 17,82 €, bleu marine 15,89 €, vert chasse 17,35 €, gris 23,07 €), mixte. Microfibre polaire 100 % polyester : vinyle par défaut, fiche « polaire ». Vendu et expédié par Amazon.
- **Nouveau vendeur « Amazon ».** Une entrée `amazon` dans `livraisonVendeur` (`js/prix.js`) avec `plateforme: "Amazon"` : livraison offerte, 2 à 4 jours, aucun frais de port compté. Un premier sweat d'un vendeur tiers (10,99 € de port, 2 à 3 semaines) a été remplacé par le sweat Essentials pour éviter ces frais. Les textes du catalogue, du configurateur et de l'atelier (liste d'achats, coûts, base d'achats) nomment Amazon ; chaque couleur garde son ASIN et son lien.
- **À vérifier.** Les prix relevés sont ceux de la taille L et peuvent varier selon la taille ; le rouge du gilet était en promotion à 16,38 € (prix habituel gardé : 17,82 €) ; le gris du gilet s'affichait à 23,07 € alors qu'une autre offre partait de 14,34 € ; trois couleurs du sweat n'avaient plus que 1 ou 2 pièces en stock et « Or » n'affichait pas de disponibilité ; la livraison offerte se confirme au panier ; l'aperçu sur photo n'est pas calibré pour ces deux articles (le dessin s'affiche).
- Tests : 151 (94 moteur, 8 fichiers, 24 facturation, 25 méthodes).

## 7.1.0 — 21/10/2026

Les packs sont supprimés. **Version MINEUR : le fichier de commande reste compatible.**

- **Plus de packs.** Les 6 packs (basket, fitness femme, jogging femme, football, entraîneur, Hummel) disparaissent du catalogue, du configurateur, de l'atelier et des règles de prix (`parPiecePack`, `margePack`). Tous les articles qui les composaient restent en vente à l'unité.
- **Prix.** Une ligne par produit, 3 € de marge par pièce, arrondi à l'euro pair : rien d'autre ne change.
- **Anciennes commandes.** Un fichier ou un panier enregistré avec des pièces de pack s'ouvre toujours ; ses pièces sont chiffrées une par une, au prix unitaire de chaque article.
- La catégorie « Ensembles » reste pour le survêtement Joma et l'ensemble Hummel.
- Tests : 147 (90 moteur, 8 fichiers, 24 facturation, 25 méthodes).

## 7.0.0 — 21/10/2026

Nouvelle règle de prix, vinyle thermocollant et texte à orientation libre. **Version MAJEUR : tous les prix changent (marge et arrondi) ; le fichier de commande reste compatible.**

- **Marge de 3 € par pièce, prix arrondi à l'euro pair.** Le prix d'un produit est le coût moyen (vêtement, planches, livraison, vinyle) + 3 €, arrondi à l'euro pair supérieur (20 €, 22 €, 24 €...). La marge réelle est donc toujours d'au moins 3 € par pièce. Avant : 1 € par motif, 2 € au plus, arrondi au centime. Exemple : le polo avec un visuel A6 passe de 19,39 € à 22 €.
- **Packs : la moitié de la marge.** 1,50 € par pièce (au lieu de 1 €), 0 € pour les chaussettes. Le pack basket passe de 29,37 € à 32 €.
- **Vêtements apportés : plus de remise.** La marge ne baisse plus au-delà de 5 pièces apportées (`regles.apporte.facteur` à 1, réglable).
- **Vinyle thermocollant.** Le flex est découpé à l'atelier : pas de planche DTF, pas de livraison de transferts, seulement la matière (`vinyle.coutCm2` à 0,008 €, fourchette haute des prix relevés chez des revendeurs français, + 30 % de chutes). 22 articles où le DTF n'est pas idéal d'après les fiches de méthodes (chaussettes, polyester extensible, polaire, microfibre, bonnets, casquettes, sacs enduits) sont en vinyle par défaut ; le DTF reste possible.
- **Atelier : technique de pose par pièce.** Dans l'onglet « Pièces », un choix Automatique / DTF / Vinyle par pièce ; les planches et le coût de revient se recalculent. Le coût de revient montre une ligne « Vinyle thermocollant » et le texte de presse du vinyle.
- **Texte et chiffre : taille, position et orientation libres.** Dans le configurateur, le prénom et le numéro ont une hauteur en cm, une orientation libre (angle de -180° à 180°, boutons quart de tour) et un décalage horizontal et vertical en cm. La case réservée sur la planche est le rectangle qui englobe le texte tourné. L'aperçu, les planches (SVG et PNG), la fiche et le mail le montrent. Un texte tourné ou déplacé sort du bloc collé. Un ancien fichier de commande, sans ces champs, ne change pas.
- **À vérifier.** Les prix du vinyle viennent de sites de revendeurs (Amazon n'était pas accessible) : remplace `vinyle.coutCm2` par ton vrai prix quand tu l'auras.
- Tests : 155 (98 moteur, 8 fichiers, 24 facturation, 25 méthodes).

## 6.6.0 — 20/10/2026

Atelier : guide des méthodes de fabrication et fiches PDF par matière. **Version MINEUR : aucun prix ne change, le format du fichier de commande ne change pas.**

- **Guide des méthodes.** En haut de l'onglet « Fiche de fabrication » : on choisit un article (ou une matière) et sa couleur, et le guide donne toutes les méthodes applicables (DTF, sublimation, vinyle, gravure laser) avec réglages et précautions. Il tient compte de la couleur (sublimation seulement sur clair), de la composition de l'article et des vêtements apportés.
- **Fiches PDF.** 15 fiches A4 paysage à imprimer dans `fiches/`, une par matière (textiles, métal, verre), générées par `python3 outils/fiches-pdf.py` depuis `outils/fiches_donnees.py`.
- **Réglages.** DTF : tableau de pose de DTF Print (coton 150 °C, polyester 135 °C, mélange 145 °C, nylon 135 °C). Sublimation : 190 à 200 °C, 40 à 60 s. Vinyles : tous les types, flex standard en stock. Laser : prudent, par type (CO2, diode, fibre), avec une grille d'essai ; le métal nu n'est gravable qu'avec un laser fibre, à confirmer sur le xTool.
- **À valider par un essai.** Polaire, microfibre, enduit, acrylique, casquette, imperméable, coton extensible, vinyle métallisé, et toutes les valeurs laser.
- Nouveau test : `tests/methodes.test.js`.

## 6.5.0 — 19/10/2026

Le site public a un panier. **Version MINEUR : aucun prix ne change ; le fichier de commande gagne une version 3 quand le panier contient plusieurs configurations.**

- **Panier.** Le dernier bouton du configurateur devient « Ajouter au panier » (ou « Mettre à jour le panier » quand on modifie une ligne). La configuration part dans le panier et on revient au catalogue pour en configurer d'autres.
- **Page « Panier ».** Liste des configurations (articles, couleurs, marquages, prix), avec Modifier, Dupliquer et Retirer ; total du panier ; coordonnées et envoi en une seule fois. Le panier et les coordonnées sont gardés dans le navigateur. L'en-tête affiche le nombre de configurations.
- **Un seul envoi.** Un seul mail et un seul fichier pour tout le panier. Avec une seule configuration le fichier reste identique à avant (version 2) ; avec plusieurs c'est un fichier version 3 qui contient une commande par configuration.
- **Atelier.** Il lit les fichiers version 3 : des boutons « Configuration 1, 2… » en haut de la commande passent de l'une à l'autre (achats, planches et fiche de paiement se font configuration par configuration).

## 6.4.0 — 19/10/2026

Atelier, vue « Paiement et facture » : option pour retirer la marge. **Aucun prix du site public ne change.**

- **Case « Retirer la marge ».** Avant de générer la fiche de paiement ou la facture, elle remplit les lignes au prix coûtant (production pour Fabr'Icam) et affiche le total sans marge à côté du total avec marge. Décochée, les lignes reprennent les prix de vente.

## 6.3.1 — 19/10/2026

La commande reprend la couleur choisie sur la carte du produit, et l'aperçu s'ouvre sur la photo avec son calque. **Version CORRECTIF : aucun prix ne change.**

- **Couleur de la carte reprise dans la commande.** La couleur cliquée sur la carte d'un article du catalogue est celle de la première pièce dans « Ta commande » (avant, la commande démarrait toujours dans la première couleur de la liste). Si l'article est déjà dans une commande vierge, la pièce change de couleur ; si la commande est commencée, une pièce dans cette couleur s'ajoute. Les packs n'ont pas de choix de couleur sur leur carte.
- **Photo avec calque par défaut.** L'aperçu du configurateur montre la photo du vêtement avec le visuel posé dessus dès l'arrivée, quand la photo existe dans la couleur de la pièce (polo, sweat, maillot, short de basket et débardeur, dans leur couleur de référence). Sinon, il affiche le dessin sans message d'erreur. Les boutons Dessin et Photo gardent leur rôle : « Dessin » force le dessin (les poignées de déplacement et de taille n'existent que là), « Photo » explique pourquoi la photo manque quand c'est le cas.
- **À vérifier.** Pour les autres couleurs de ces cinq vêtements, la photo n'est toujours pas calibrée : l'aperçu reste en dessin.

## 6.3.0 — 19/10/2026

L'en-tête du site client et la navigation du catalogue sont refaits. **Version MINEURE : ni les prix, ni le fichier de commande, ni l'atelier ne changent.**

- **En-tête collé en haut.** Il reste visible pendant qu'on défile, aligné sur la largeur de la page, avec le logo à gauche et deux accès : un menu « Produits » et le bouton « Ma commande ». Sur téléphone, le nom « Flocage » à côté du logo disparaît sous 480 px pour laisser la place au menu. L'aperçu du configurateur se cale sous l'en-tête.
- **Menu « Produits ».** Il liste les catégories avec le nombre d'articles de chacune. Il s'ouvre au clic, se ferme avec Échap, un clic à côté ou le choix d'une catégorie, et fonctionne aussi depuis le configurateur (il ramène au catalogue, déjà filtré). Sur téléphone, il prend toute la largeur de l'écran.
- **Barre de catégories collée.** Sur le catalogue, les catégories restent affichées sous l'en-tête pendant qu'on défile (sur plusieurs lignes sur grand écran, sur une ligne qu'on fait glisser sur téléphone). Choisir une catégorie filtre sur place, sans recharger la page, et remonte au début du catalogue si on avait défilé plus bas.
- **Catégories des produits.** Nouvelle liste `categories` dans `js/data.js` (10 catégories) et nouveau champ `tags.categories` sur chacun des 71 articles et packs (65 articles et 6 packs) : un article peut en avoir plusieurs (le survêtement Joma, l'ensemble Hummel, la serviette, le bandeau, les vêtements apportés, qui sont aussi rangés avec leurs équivalents du catalogue). La première catégorie d'un article est son rayon. Le filtre « Type » (Hauts, Bas…) est remplacé par ces catégories sur le site client ; le champ `type` reste dans les données, l'atelier l'utilise toujours.
- **Catalogue rangé par rayons.** Sans catégorie choisie, les articles sont classés par rayon, avec un titre devant chacun (un rayon vide à cause des filtres Homme, Femme, Sport ou Casual disparaît). Les étiquettes d'une carte affichent maintenant les catégories de l'article.
- **Adresses des catégories.** `#/produits` et `#/produits/polos` ouvrent le catalogue au bon endroit, filtré : l'adresse peut se copier et se partager, et suit le choix de l'utilisateur. Une catégorie inconnue affiche tout le catalogue.
- **Nettoyage du code.** CSS : variables `--gutter`, `--page` et `--header-h`, règles en double regroupées (`.pv-bar`, `.radio b`, `.pieces .col-couleur select`), règles inutilisées supprimées (`.brand .mark`, `.t-lines .rem`, `.pv-card svg`). JS : fonction `uniformPlan` jamais appelée et variable inutilisée de l'aperçu supprimées, routage du site client réécrit proprement (`route`), lien « Ma commande » écrit une fois dans la page au lieu d'être recalculé au démarrage.
- **À vérifier.** Les catégories ont été choisies d'après le modèle de dessin de chaque article : relis le rangement (par exemple le haut thermique dans « T-shirts et maillots », le bandeau dans « Casquettes et bonnets » et « Équipement ») et dis-moi ce que tu veux déplacer.
- Tests : 116 en tout (84 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier, 24 sur les fiches de paiement et les factures), dont 1 nouveau : catégories valides, sans doublon, aucune catégorie vide, « Ton vêtement » réservé aux vêtements apportés, packs rangés dans « Packs ».

## 6.2.1 — 19/10/2026

Titulaire du compte de la fiche de paiement remis à « Fablab Icam 26-29 ». **Version CORRECTIF : aucun prix ne change.**

- Le bloc « Comment payer ? » affiche de nouveau **« Fablab Icam 26-29 »** comme titulaire du compte (choix de Fabr'Icam). Le **BIC `LYDIFRP2XXX`** ajouté en 6.0.1 reste en place, avec l'IBAN.
- Le RIB Lydia est au nom des deux titulaires du compte commun : si une banque contrôle le nom du bénéficiaire avant le virement, le nom saisi doit être celui du RIB. Le réglage est `titulaire` dans le bloc `CONFIG` de `js/facturation.js`.
- Tests : la fiche doit contenir « Fablab Icam 26-29 », l'IBAN et le BIC.

## 6.2.0 — 19/10/2026

Le visuel se règle comme un texte : taille libre, rotation et position. **Version MINEURE : un ancien fichier de commande garde son format, sa case et son prix.**

- **Taille libre.** Le choix « A4 / A6 / orientation » est remplacé par une **largeur en cm** (champ précis, curseur) ; la hauteur suit les proportions de l'image. Les boutons A7, A6, A5 et A4 restent comme raccourcis : ils font tenir l'image dans ce format, dans son sens. On peut agrandir l'image au-delà du cadre prévu.
- **Rotation par quarts de tour** (0, 90, 180, 270°) : bouton rond sur l'aperçu, boutons dans le formulaire. Une fois tournée, l'image occupe son rectangle tourné (« Une fois tourné, il occupe 7 × 14 cm »).
- **Position.** On glisse l'image sur l'aperçu, ou on tape un décalage en cm (vers la droite et vers le bas, à partir du centre de la zone). Avec un bloc collé, le décalage déplace tout le bloc. Les champs précis suivent l'aperçu, et inversement.
- **Poignées sur l'aperçu** (mode Dessin) : cadre en pointillés, poignée verte du coin pour redimensionner, bouton rond pour tourner, déplacement par glisser. Le clavier suit : les champs reçoivent le focus et sélectionnent l'image. Pas de poignées en mode Photo.
- **Limites.** Le visuel peut dépasser la zone prévue sur le vêtement (le site affiche « le visuel déborde de la zone prévue » et l'atelier vérifie la place), mais pas le plateau de la presse, 21 × 28 cm : la largeur maximale se calcule d'après les proportions de l'image et sa rotation.
- **Prix.** La case réservée sur la planche est le rectangle réel du visuel (tourné si besoin), plus la marge de découpe. **Un visuel plus étroit que son format coûte donc moins cher qu'avant**, un visuel plus grand coûte plus. La position ne change pas le prix. Les prix de la vitrine (visuel A6 à l'emplacement de référence) sont inchangés.
- **Fichier de commande.** Nouveaux champs facultatifs par marquage : `largeur`, `libre`, `rot`, `dx`, `dy`, et `image.ratio`. Sans `largeur`, le comportement est celui de la 6.1.0 (format et sens).
- **Atelier.** Texte du diaporama, de réglage et du mail : « 8 × 4 cm, tourné de 90°, décalé de 2 cm vers la droite et 1,5 cm vers le bas ». Les planches (aperçu SVG et export PNG) dessinent le visuel tourné ; la fiche de fabrication regroupe les visuels par dimensions ; le contrôle de résolution (dpi) part de la largeur réelle du visuel.
- **À vérifier.** Un client qui agrandit beaucoup l'image avec une résolution faible : l'alerte dpi de l'atelier le signale, mais le site client ne bloque pas. La rotation est limitée aux quarts de tour (pas d'angle libre).
- Tests : 115 en tout (83 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier, 24 sur les fiches de paiement et les factures), dont 8 nouveaux pour la taille libre, la rotation, la position, le débordement et le plateau.

## 6.1.0 — 19/10/2026

Quatre nouveaux produits : un chasuble de football, une serviette de bain et deux accessoires en métal (ouvre-bouteille, porte-clés décapsuleur) achetés sur AliExpress. **Version MINEURE : les prix des articles existants ne changent pas.**

- **Chasuble de football Kipsta** (Decathlon, 3,49 €, 100 % polyester, taille unique) : 6 couleurs (jaune fluo, orange fluo, rouge, blanc, bleu acier, turquoise) avec leur référence, leur lien et leurs photos. Poitrine (A6, A5) et dos (A5, A4). Sublimation possible en blanc seulement. Prix de la vitrine : 14,89 € pour 1 pièce, 7,07 € pour 5, 6,33 € pour 10, 5,64 € pour 20, 5,22 € pour 50.
- **Serviette de bain microfibre Nabaiji, taille L** (Decathlon, 7,99 €, 80 × 130 cm, 88 % polyester et 12 % polyamide) : 6 couleurs (noir, rose, bleu, vert, violet lilas, orange). Un visuel A6, A5 ou A4 **en bas de la serviette**. DTF seulement (`sublimation: false`), à chaleur modérée, avec un essai avant la série. Prix : 19,39 € pour 1, 11,57 € pour 5, 10,83 € pour 10, 10,14 € pour 20, 9,72 € pour 50.
- **Ouvre-bouteille en forme de carte** (AliExpress, boutique QST EXPress-02, acier inoxydable) : 5 variantes avec leur prix d'achat (noir 1,81 €, argent 1,91 €, anthracite 2,08 €, argent à trèfle 2,12 €, noir à trèfle 2,12 €). **Porte-clés décapsuleur** (AliExpress, boutique Shop4293023 Store, aluminium) : 8 couleurs de 1,46 € (argent) à 1,66 € (noir, bleu). Une photo par variante.
- **Gravure laser ou vinyle thermocollant, sans planche DTF.** Ces deux articles portent `technique: "gravure"` : leur motif ne va sur aucune planche, quelle que soit la technique choisie par le client (DTF ou sublimation), et ne coûte ni planche ni livraison DTF Print. **Prix = achat + 1 € de marge par motif**, identique de 1 à 50 pièces : 2,81 € pour l'ouvre-bouteille noir, 2,46 € pour le porte-clés argent. Le coût du vinyle ou de l'énergie du laser n'est pas compté (la marge le couvre). Le client le lit dans le catalogue (« gravure ou vinyle thermocollant et livraison compris ») et à l'étape de la technique.
- **Nouveau format de visuel « Micro »** : 1,5 × 3 cm, seul format du porte-clés (zone de 1,7 × 3,2 cm). L'ouvre-bouteille garde le Mini (5 × 5 cm). Prénom et numéro du porte-clés démarrent à 0,5 et 1 cm de haut.
- **AliExpress comme plateforme de vente.** Deux boutiques dans `livraisonVendeur` (`js/prix.js`) avec `plateforme: "AliExpress"`. **Port compté à 0 €** (livraison offerte dès 10 € d'achat, TVA comprise ; les droits de douane éventuels se calculent au paiement) et **délai de 5 à 10 jours**, annoncés au client et à l'atelier, sans le texte « frais de port estimés » quand le montant est nul.
- **Aperçu** : quatre nouveaux dessins (chasuble avec ourlet et coutures d'épaules, serviette avec ourlets pointillés, ouvre-bouteille carte avec sa fente, porte-clés avec son anneau). Le nom d'une zone très petite s'écrit sous le cadre, et la légende s'adapte aux petits dessins.
- **Atelier** : abréviations SE (serviette), OB (ouvre-bouteille) et PC (porte-clés) ; étiquette « gravure / vinyle » sur la fiche de fabrication et le diaporama, avec la cellule « sans planche » ; texte de réglage `presse.gravure` ; alerte quand le visuel est un PNG ou un JPEG plutôt qu'un SVG ; la liste d'achats distingue « place de marché Decathlon » et « AliExpress » (nom de la variante, port à 0 €, note de livraison) ; la base d'achats et l'export CSV indiquent la plateforme.
- **À vérifier** : le stock AliExpress est très faible sur certaines variantes (3 à 6 pièces au 19/10/2026) ; les teintes (`hex`) sont estimées d'après le nom ; les images des variantes Rouge et Violet du porte-clés n'ont pas été contrôlées une à une ; les dimensions du lien de l'ouvre-bouteille (13 × 11 × 2 cm) sont celles du colis, la carte mesure environ 8,5 × 5,4 cm.
- Catalogue : **49 articles** (28 vêtements, 21 accessoires) plus 16 « Ton vêtement ».
- Tests : 107 en tout (75 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier, 24 sur les fiches de paiement et les factures), dont 6 nouveaux : format Micro, gravure sans planche ni livraison DTF, prix par variante AliExpress, motifs gravés absents des planches, port AliExpress à 0 €, chasuble et serviette.

## 6.0.1 — 19/10/2026

Coordonnées bancaires de la fiche de paiement alignées sur le RIB Lydia. **Version CORRECTIF : aucun prix ne change.**

- **Titulaire du compte** : « Antton GARY et Martin ERNST », comme sur le RIB (compte commun). Le nom « Fablab Icam 26-29 » ne figurait pas sur le RIB ; un virement vers un autre nom que celui du compte peut être refusé ou retardé par certaines banques.
- **BIC ajouté** : `LYDIFRP2XXX`, sur une ligne de plus du bloc « Comment payer ? ». L'IBAN est inchangé.
- Le texte d'aide sous les boutons de la page « Paiement et facture » (atelier) cite le titulaire, l'IBAN et le BIC.
- L'adresse personnelle du titulaire et les autres champs du RIB (code banque, guichet, numéro de compte, clé) ne sont pas repris : l'IBAN les contient déjà et le dépôt GitHub est public.
- Réglage : `titulaire` et `bic` dans le bloc `CONFIG` de `js/facturation.js` (un `bic` vide supprime la ligne).
- Tests : la fiche doit contenir le titulaire et le BIC, la facture ne doit contenir ni IBAN ni BIC.

## 6.0.0 — 19/10/2026

Marge divisée par 2 sur les vêtements apportés au-delà de 5 pièces. **Version MAJEURE : la règle de prix change.**

- **Plus de 5 pièces « Ton vêtement » dans une commande (6 ou plus) : la marge de toutes ces pièces est divisée par 2**, soit 0,50 € par motif et 1 € au plus par pièce (au lieu de 1 € et 2 €). Les pièces apportées se comptent tous articles confondus (3 vestes et 3 t-shirts font 6). À 5 pièces ou moins, rien ne change.
- Les articles Decathlon d'une même commande ne comptent pas dans le seuil et gardent 1 € par motif. Les packs ne sont pas touchés.
- Exemples, une veste apportée avec un visuel A6 à la poitrine : 3,58 € la pièce pour 5 (inchangé), **2,65 € pour 6** (3,15 € avant), 2,34 € pour 10 (2,84 €), 1,65 € pour 20 (2,15 €), 1,23 € pour 50 (1,73 €). La baisse est de 0,50 € par pièce dès la sixième apportée.
- Client : la carte du catalogue et l'aide « Tu as déjà tes vêtements ? » annoncent la règle ; sous le prix, la note « Tu apportes plus de 5 vêtements : le prix de ces pièces est réduit » apparaît quand elle joue. Le tableau de prix par quantité des articles « Ton vêtement » la prend en compte.
- Atelier : le détail des coûts indique « 0,50 € par motif, 1,00 € au plus par pièce : marge × 0,5, plus de 5 vêtements apportés ».
- Réglage : `regles.apporte` dans `js/prix.js` (`seuil: 5`, `facteur: 0.5` ; `facteur: 1` supprime la règle). Le fichier de commande ne change pas ; un ancien fichier avec plus de 5 pièces apportées se recalcule avec la nouvelle règle, et l'atelier signale l'écart avec le prix vu par le client.
- Tests : 101 en tout (69 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier, 24 sur les fiches de paiement et les factures), dont 6 sur cette règle.

## 5.1.1 — 19/10/2026

Relecture des pages Decathlon des 42 articles restants : toutes les couleurs, tous les liens, toutes les photos. **Version CORRECTIF : les prix de vente ne changent pas, sauf celui du sweat Viralto Axton.**

- **166 couleurs au lieu de 102** sur les 45 articles Decathlon. 20 articles gagnent des couleurs : polo de golf MW500 (1 → 12), bonnet Rider 500 (6 → 13), ensemble Hummel (1 → 10), survêtement Joma (1 → 8), doudoune Result (1 → 5), veste micropolaire Kariban (1 → 5), short de basket SHORT 100 (2 → 5), arpenaz 100 (4 → 7), sweat 1/2 zip Viralto (1 → 4), veste sans manches Regatta (1 → 4), puis 2 couleurs pour le short de tennis, le débardeur fitness, les chaussettes, le short 2 en 1 et le short slim femme, les hauts thermiques femme et homme, le sweat T100, le tee-shirt homme gris et le sac Arpenaz 500. Les 22 autres articles avaient déjà toutes leurs couleurs ; leurs liens, références et photos sont rafraîchis.
- **Chaque couleur porte maintenant** son nom Decathlon, sa référence, le lien de sa page et, pour un article du magasin, sa série de photos. Les 6 articles de la place de marché ont le lien de chaque couleur ; ils gardent les photos de l'article (la page du vendeur n'en donne pas par couleur).
- **Photos de l'article** : la série de photos d'un article dont l'aperçu sur photo n'est pas calibré devient celle de sa première couleur, pour que la carte et la fiche montrent le même article. Les articles à l'aperçu calibré gardent leurs photos : l'aperçu sur photo n'est pas touché.
- **37 couleurs ont leur propre prix d'achat** (`prixAchat` de la couleur) : par exemple débardeur noir 7,99 € contre 9,99 € le blanc, short slim gris 3,99 € contre 7,99 €, polo de golf jaune, vieux violet et vert 9,99 € contre 14,99 €, doudoune rouge, grise ou bleue 25 € contre 18 €. Les prix de la place de marché varient beaucoup : survêtement Joma de 26,50 € à 89,77 €, ensemble Hummel de 18,50 € à 35,90 €. Le catalogue précise que le prix affiché est celui d'une couleur ; le prix exact de chaque couleur apparaît à la personnalisation.
- **Couleurs en rupture** : deux de plus, le sac Arpenaz 100 vert cèdre et orange terracotta (avec le rouge du maillot de basket, déjà signalé). Le client est prévenu, Fabr'Icam confirme la disponibilité avant de commander.
- **Sweat de football 1/2 zip Viralto Axton** : l'ancienne variante (noir et zip rose fluo, 12 €, une seule taille) n'existe plus sur Decathlon. Les 4 couleurs actuelles (gris et rouge, gris et noir, vert et gris, marine et bleu) coûtent 21,99 € et vont de la S à la 4XL (taille relevée sur la page de la couleur gris et noir). **Le prix d'achat passe de 12 € à 21,99 €** : un visuel A6 sur une pièce, 23,40 € → 33,39 € ; l'avertissement « fin de série, une seule taille » disparaît.
- Les prix d'achat de base des autres articles ne changent pas ; le sweat en molleton (14,99 € enregistré, 11,99 € relevé le 19/10/2026) reste à confirmer.
- Les teintes (`hex`) des couleurs ajoutées sont estimées d'après le nom Decathlon.
- Tests : 95 en tout (63 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier, 24 sur les fiches de paiement et les factures), dont un test qui vérifie les 45 articles (lien, photos et référence de chaque couleur, nombre de couleurs de dix articles, ruptures, prix par couleur, sweat Viralto).

## 5.1.0 — 19/10/2026

Fiches de paiement et factures en PDF, et le logo de Fabr'Icam sur tout le site. Les prix ne changent pas.

- **Nouvel onglet « Paiement et facture » à l'atelier.** Deux documents PDF, fabriqués dans le navigateur (aucun serveur) :
  - la **fiche de paiement**, à créer une fois le devis validé : lignes de la commande, total à payer, titulaire du compte, **IBAN**, montant, référence à mettre dans le virement, et « Le travail commence dès réception du paiement » ;
  - la **facture**, à créer à la remise des vêtements : « Facture acquittée », avec la date du paiement et celle de la remise.
  Ni TVA, ni SIRET, ni mention du BDE sur les documents.
- **Qui crée le document** : le prénom et le nom sont obligatoires et figurent sur le PDF ; le navigateur s'en souvient.
- **Lignes** préremplies d'après la commande chargée et modifiables (désignation, quantité, prix, ajout, suppression). Boutons « Remplir depuis la commande » et, si les tarifs ont changé depuis ce que le client a vu, « Reprendre les prix vus par le client ». Sans commande chargée, tout se saisit à la main.
- **Numéros** `FP-2026-001` (fiches) et `FAC-2026-001` (factures), une série par année, proposés d'après les documents déjà créés dans ce navigateur et modifiables.
- **Nom du fichier** : date, titre, asso et numéro, par exemple `2026-10-19_Fiche-paiement_Nom-de-l-asso_FP-2026-001.pdf`. Bouton « Télécharger » et bouton « Aperçu ».
- **Logo Fabr'Icam** : en-tête du site et de l'atelier, pied de page, porte de l'atelier, fiche de fabrication imprimée, icône de l'onglet du navigateur, et en haut des PDF. L'en-tête affiche maintenant le logo suivi de « Flocage ».
- **Coordonnées de l'asso** dans `js/facturation.js` (`CONFIG`) : titulaire « Fablab Icam 26-29 », 75 avenue de Grande-Bretagne, 31300 Toulouse, IBAN. Le dépôt étant public, l'IBAN y est lisible.
- Nouveaux fichiers : `js/pdf.js` (petit générateur de PDF sans dépendance : texte Helvetica, traits, image), `js/facturation.js`, `js/atelier-paiement.js`, `js/logo-pdf.js` (logo embarqué, généré par `outils/logo-pdf.py`), dossier `img/`.
- Tests : 94 en tout (62 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier, 24 sur les fiches de paiement et les factures).

## 5.0.0 — 19/10/2026

Prénom et numéro collés au visuel, pour poser les trois d'un coup à la presse. **Version MAJEURE : la règle de prix et le fichier de commande changent.**

- **Option « collés au visuel » sur chaque emplacement, cochée par défaut.** Le visuel, le prénom et le numéro d'un même emplacement sont imprimés sur un seul transfert, à 0,5 cm les uns des autres (`placement.ecartBloc` dans `js/prix.js`), et pressés en une fois. L'aperçu les montre ainsi. La case apparaît dès qu'un emplacement porte au moins deux éléments ; un emplacement de texte seul (dos sans visuel) colle le prénom et le numéro ensemble. Décochée, les éléments redeviennent séparés.
- **Prix : un bloc compte pour un seul motif, 1 € de marge au lieu de 2 €.** En contrepartie, un bloc entier tient moins bien sur les planches que des petits motifs séparés. Polo, visuel A6, prénom de 2,5 cm et numéro de 4 cm : 19,39 € pour 1 pièce (20,39 € avant), 11,28 € pour 10 (11,88 €), 10,36 € pour 30 (10,94 €). Les planches coûtent 18 € au lieu de 14 € pour 10 pièces. Un pack garde sa marge fixe par pièce.
- **Bloc trop grand pour la presse** (visuel A4 avec du texte, plus de 21 × 28 cm) : le bloc n'est pas fait, les éléments restent séparés et le site l'indique.
- **Atelier** : les planches PNG (fichier à envoyer et plan de coupe) et leur aperçu dessinent le bloc en un seul rectangle ; repère à plusieurs lettres (`3·Pvpn`) ; le diaporama écrit « Bloc collé, à presser d'un coup » avec le détail de chaque élément ; la fiche imprimée gagne une colonne « Blocs collés » et la légende des repères ; la résolution du visuel est calculée sur le visuel du bloc.
- **Fichier de commande** : chaque marquage porte `bloc` (`true` ou `false`). Un ancien fichier, sans ce champ, garde les éléments séparés et le même prix qu'avant. Le mail de commande précise « collés en un seul bloc ».
- Tests : 70 en tout (62 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier), dont 7 sur le bloc collé.

## 4.2.0 — 19/10/2026

Nouvelle catégorie « Ton vêtement » : le client apporte son vêtement, Fabr'Icam ne fait que le flocage. Les prix des autres articles ne changent pas.

- **Nouveau filtre « Ton vêtement » dans le catalogue** : 16 articles sans référence, en quatre familles. Hauts (t-shirt, polo, sweat, haut à manches longues, maillot ou débardeur), vestes et gilets (veste, sweat ou veste zippé, gilet), bas (short, pantalon) et accessoires (casquette, bonnet, sac à dos, sac de sport, gourde, tour de cou). Chacun a son dessin et ses emplacements, sans photo ni lien Decathlon.
- **Prix : planches, livraison et marge, sans vêtement.** Même règle de marge que les autres pièces (1 € par motif, 2 € au plus par pièce). Une veste avec un visuel A6 à la poitrine : 11,40 € pour 1 pièce, 3,58 € pour 5, 2,84 € pour 10, 2,15 € pour 20, 1,73 € pour 50. Une pièce sans motif ne coûte rien. On peut mélanger vêtements apportés et articles Decathlon dans une même commande.
- **Couleur et matière de chaque pièce.** 15 couleurs usuelles (dont « Autre couleur claire » et « Autre couleur foncée », comptée comme claire) et une colonne **Matière** dans le tableau des pièces : polyester (90 % ou plus), coton ou mélange, « Je ne sais pas » (par défaut). Sur téléphone, une phrase invite à faire glisser le tableau pour la voir.
- **Technique** : la sublimation n'est proposée que pour une pièce blanche ou claire en polyester. Sinon, DTF.
- **Avertissement au client** sur chaque article et dans le configurateur : le vêtement est contrôlé à la réception (matière, état, tenue à la chaleur), le dessin est un modèle type, la position exacte est confirmée sur le vêtement, et le polaire, le matelassé et le softshell se pressent à basse température. Le texte est une proposition de rédaction, à valider.
- **Atelier** : tableau « Apportés par le client » (sans prix d'achat, sans bouton de copie quand il n'y a rien à acheter), carte de chaque pièce avec la matière déclarée, colonne « Source » de la fiche imprimée, ligne « Vêtements apportés par le client » à 0 € dans les coûts, deux points à vérifier (vêtements à réceptionner, matière inconnue). Les articles « Ton vêtement » ne figurent ni dans la base d'achats ni dans le CSV.
- **Fichier de commande** : chaque pièce peut porter `matiere` (`polyester`, `coton` ou `inconnu`). Le champ est facultatif, les anciens fichiers se rechargent sans changement.
- Tests : 63 en tout (55 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier), dont 5 sur les articles apportés.

## 4.1.0 — 19/10/2026

Photos par couleur, prix d'achat par couleur, raccourcis vers le vendeur. Les prix de vente ne changent pas.

- **Catalogue : les couleurs se cliquent.** Un clic sur une couleur affiche la série de photos de cette couleur (vignettes, visionneuse en grand avec le nom de la couleur) et le lien vers sa page Decathlon. Un article dont la série n'est pas encore relue garde ses photos d'avant.
- **Raccourci vers le vendeur, sur le site client et à l'atelier.** Sur chaque carte du catalogue et sous l'aperçu du configurateur : « Voir l'article sur Decathlon » pour un article en magasin, « Voir l'article chez <vendeur> » et « Boutique de <vendeur> » pour un article de la place de marché. À l'atelier : mêmes liens dans la liste à acheter, la fiche de chaque pièce et la base d'achats ; la page du vendeur est aussi dans sa carte et dans l'export CSV. Le lien de la boutique est le champ `lien` de chaque vendeur dans `js/prix.js` (connu pour Sport & Go EU ; à renseigner pour Pertemba FR et Atelier Katanga).
- **Une couleur peut avoir son propre prix d'achat** (champ `prixAchat` de la couleur, repris par le moteur, la liste à acheter, le détail des coûts et le CSV). Sans ce champ, c'est le prix de l'article. Le catalogue précise quand le prix affiché n'est celui que d'une couleur.
- **Rupture de stock signalée.** Une couleur que Decathlon donne en rupture porte `rupture: "AAAA-MM-JJ"` : pastille rouge à l'atelier, note au client (Fabr'Icam confirme la disponibilité avant de commander).
- **Nom Decathlon de chaque couleur** (`nomDec`) : l'atelier l'affiche quand il diffère du nom du catalogue (« bleu acier » pour notre « Marine »), et la recherche de la base d'achats le trouve.
- **Relecture des pages Decathlon, 3 articles sur 45** : polo Essential (2 couleurs confirmées, liens et photos de chaque couleur), sweat en molleton (**4 couleurs au lieu de 2** : gris et noir ajoutés), maillot de basket TANK 100 (**5 couleurs au lieu d'1** : marine, bleu, noir, rouge ajoutés ; le rouge est en rupture). Le prix d'achat du sweat n'est pas modifié : 14,99 € enregistré, alors que Decathlon l'affichait à 11,99 € ce jour, à confirmer.
- **Les 42 autres articles restent à relire** : Decathlon a affiché une vérification anti-robot pendant la lecture et le site ne la contourne pas. Leurs couleurs, liens et photos sont ceux d'avant. Un article est relu quand chacune de ses couleurs porte `photos` dans `js/data.js`.
- Tests : 58 en tout (50 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier), avec la validité des couleurs, des photos et des liens, le prix par couleur et les liens des vendeurs.

## 4.0.0 — 19/10/2026

Nouvelle règle de marge, ensemble et pack Hummel. **Version MAJEURE : les prix changent.**

- **Marge d'une pièce vendue seule : 1 € par motif à presser, 2 € au plus par pièce.** Elle remplace les 20 % du coût plafonnés à 2 €. Chaque élément posé compte pour un motif (un visuel, un prénom, un numéro) ; une pièce sans motif ne porte aucune marge. Un polo avec un visuel à la poitrine passe de 20,39 € à 19,39 € ; dix polos avec un visuel chacun, de 118 € à 108,30 € au total.
- **Marge d'une pièce dans un pack : 1 € par pièce**, quel que soit son nombre de motifs, et **0 € pour les chaussettes**. Le pack basket porte 2 € (maillot et short), le pack entraîneur 3 €. Prix de la vitrine : pack basket 29,37 €, pack entraîneur 56,45 €.
- Les prix restent un **prix moyen par produit** (coût moyen + marge moyenne, arrondi au centime supérieur). Les planches, la livraison, les frais de port des vendeurs, les prix d'achat et le format du fichier de commande ne changent pas.
- **La « robe » Hummel n'était pas une robe** : c'est un t-shirt et un short vendus ensemble. Elle devient l'**ensemble t-shirt et short Hummel**, un seul article de deux pièces (23 € à l'achat), avec un nouveau dessin et les emplacements poitrine, dos, cuisse gauche et cuisse droite. Il compte pour une seule pièce dans la marge. Le filtre « Robes » disparaît du catalogue, il n'y a plus de robe.
- **Nouveau pack Hummel** : ensemble Hummel, veste micropolaire Kariban et chaussettes (marge de 2 €). Le catalogue compte 27 vêtements, 18 accessoires et 6 packs.
- Atelier : le détail des coûts indique la marge de chaque article (par motif, ou par pièce de pack). Un ancien fichier de commande qui contient la robe Hummel se recharge avec le nouvel ensemble (`anciensId` dans `js/data.js`).
- Dans `js/prix.js`, `regles.marge` et `regles.margeMax` deviennent `regles.parMotif`, `regles.maxParPiece` et `regles.parPiecePack`. Les chaussettes portent `margePack: 0` dans `js/data.js`.
- Tests : 53 en tout (45 sur le moteur et le catalogue, 8 sur les fichiers de l'atelier), avec les cas chiffrés de la nouvelle règle.

## 3.3.0 — 19/10/2026

Nouvelle page atelier : `atelier.html`.

- **Une page à part, protégée par un mot de passe** (`2024`, modifiable dans `js/atelier.js`). C'est une simple porte : le site est statique, le mot de passe se lit dans le code. L'ancien « espace atelier » du site client est remplacé par un lien vers cette page ; les anciens liens `#/atelier` y redirigent.
- **Import du fichier de commande** par bouton ou glisser-déposer. La commande reste dans le navigateur jusqu'à sa fermeture.
- **Commande** : chiffres clés, trois étapes (acheter, commander les planches, presser), liste à acheter avec le lien de la fiche de chaque couleur et « Copier la liste », planches à commander, coûts et marge, points à vérifier.
- **Pièces** : diaporama d'une pièce à la fois, avec le dessin de face et de dos, le prénom et le numéro en grand, les motifs à poser par emplacement avec leur planche et leur case, le réglage de presse et l'article à acheter.
- **Fiche de fabrication** à imprimer en A4 : quantités à réunir, planches et leur plan, récapitulatif des motifs, pièces à presser avec cases à cocher, réglages de presse, signatures.
- **Planches à envoyer** : une image PNG par planche aux dimensions exactes du format DTF Print (300 dpi écrits dans le fichier, fond transparent, à l'endroit), un plan de coupe annoté pour la découpe, et une archive .zip de tout. Contrôle des visuels reçus : définition en dpi, JPEG ou fond opaque signalés, remplacement d'un visuel depuis la page.
- **Base d'achats** : les fournisseurs (DTF Print, Decathlon, vendeurs de la place de marché) et les 45 articles avec leurs liens par couleur, recherche, filtre par catégorie et export CSV.
- Nouveau `js/fichiers.js` (PNG à 300 dpi, zip, CSV) avec 8 tests dans `tests/fichiers.test.js`. Le fichier de commande et les règles de prix ne changent pas. Tests : 45 en tout.

## 3.2.1 — 19/10/2026

Gourdes : technique confirmée.

- Les gourdes sont floquées en transfert DTF sur la face. L'avertissement ne parle plus d'une technique « à confirmer » : petit visuel seulement (Mini ou A7), essai de tenue et de lavage avant la série. Le prix ne change pas.

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
