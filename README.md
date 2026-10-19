# Fabr'Icam Flocage

Site de flocage pour les associations de l'Icam : vitrine avec prix par quantité, configurateur de vêtements avec aperçu à la taille réelle, calcul des planches de transfert DTF Print, demande de devis par mail, et une page atelier pour toi (`atelier.html`).

## Ouvrir le site

Double-clique sur `index.html`. Aucun serveur, aucune installation. Il faut juste internet pour les polices (Google Fonts) ; sans connexion, le site marche avec des polices de secours.

## Utiliser côté client

1. L'association configure : pièces (couleur, taille, prénom, numéro), marquages par emplacement (poitrine, dos, manches), technique. Quand un emplacement porte un visuel avec un prénom ou un numéro, ou un prénom avec un numéro, la case « collés au visuel : un seul transfert, posé d'un coup » est **cochée par défaut** (voir « Règle de prix »).
2. Le prix TTC par pièce se met à jour à chaque changement. L'aperçu montre le vêtement en dessin à la taille réelle, ou sur la photo du vêtement (bouton Dessin / Photo).
   Si elle a déjà ses vêtements, elle choisit le filtre « Ton vêtement » (voir plus bas) : elle ne paie que le flocage.
3. Elle télécharge le fichier de commande, puis clique sur « Écrire le mail » : Gmail s'ouvre dans un nouvel onglet avec le message pré-rempli vers fabricam.toulouse@icam.fr. Elle joint le fichier.

## Utiliser côté atelier

Ouvre `atelier.html` (lien « Espace atelier » en bas du site client). Mot de passe : `2024`. Charge le fichier de commande reçu par mail (bouton, ou glisse-le sur la page) : l'atelier le garde dans ton navigateur jusqu'à ce que tu le fermes. Cinq onglets :

- **Commande** : l'association, le contact, la date, le message ; les chiffres clés ; ce qu'il faut acheter chez Decathlon (en magasin, puis les articles de la place de marché avec leur vendeur et ses frais de port ; les vêtements apportés par le client sont dans un tableau à part, « Apportés par le client », sans prix d'achat ni bouton de copie), avec la photo, le lien de la fiche de chaque couleur, le lien vers la boutique du vendeur et un bouton « Copier la liste » (une couleur en rupture de stock chez Decathlon porte une pastille rouge) ; les planches à commander chez DTF Print ; le coût de revient, le prix de chaque produit (coût moyen + marge par motif ou par pièce de pack) et la marge finale ; les points à vérifier.
- **Blocs collés** : sur une planche, un bloc est un seul rectangle (visuel, prénom et numéro l'un sous l'autre, centrés), avec un repère à plusieurs lettres (`3·Pvpn` : visuel, prénom et numéro collés de la poitrine de la pièce 3). Le diaporama et la fiche l'indiquent (« Bloc collé, à presser d'un coup », colonne « Blocs collés » du récapitulatif).
- **Pièces** : un diaporama, une pièce à la fois (flèches du clavier, boutons, balayage au doigt, ou la rangée de pastilles en bas). Pour chaque pièce : le dessin de face et de dos avec les visuels du client posés dessus, la couleur et la taille, le prénom et le numéro en grand, ce qu'il faut poser à chaque emplacement (visuel, prénom, numéro, taille en cm) avec la planche et la case où le trouver, le réglage de presse, et l'article à acheter avec son lien.
- **Fiche de fabrication** : un document A4 à imprimer (bouton « Imprimer la fiche »). Les vêtements à réunir avec les quantités, les planches du fournisseur avec leur plan, le récapitulatif des motifs, la liste des pièces à presser avec cases « pressée » et « contrôlée », les réglages de presse, et trois lignes de signature.
- **Planches à envoyer** : une image PNG par planche, prête à déposer sur le site du fournisseur : dimensions exactes du format choisi (par exemple 2480 × 3307 px pour une A4 de 21 × 28 cm, 6614 × 11811 px pour le mètre), 300 dpi inscrits dans le fichier, fond transparent, à l'endroit. Chaque planche a aussi un « plan de coupe » (PNG annoté avec les repères de chaque motif) qui n'est pas à envoyer. « Tout télécharger » donne un seul fichier .zip avec les deux, et un `lisez-moi.txt`. En dessous, les visuels reçus : leur définition en dpi, un avertissement s'ils n'ont pas de fond transparent, et un bouton pour en remplacer un.
- **Base d'achats** : les fournisseurs (DTF Print avec ses tarifs et la règle du fichier, Decathlon, chaque vendeur de la place de marché avec ses frais) et la liste de tous les articles Decathlon du catalogue (les articles « Ton vêtement » n'y sont pas : rien à acheter), avec le prix d'achat (une fourchette si les couleurs ne coûtent pas pareil), les tailles, la matière, et pour chaque couleur sa miniature, son nom Decathlon, sa référence et son lien. Recherche par nom, couleur ou référence, filtre par catégorie, export CSV pour Excel.

## Catalogue

27 vêtements, 18 accessoires et 6 packs, plus 16 articles « Ton vêtement » (voir plus bas).

- **Hauts** : polo de tennis Essential, sweat chaud en molleton, maillot de basket TANK 100, débardeur fitness 500, polo de golf MW500, t-shirts (coton femme Essentiel, manches courtes femme, fitness femme 100, coton homme, tee-shirt homme gris), sweats de football (T100 et 1/2 zip Viralto Axton), hauts thermiques BL100 (femme et homme), veste micropolaire Kariban, veste sans manches Regatta, doudoune sans manche Result Core.
- **Bas** : short de basket SHORT 100, short de tennis Essential, short 2 en 1 fitness femme, short slim fitness femme 500, pantalon de jogging droit femme, jogging molleton homme Domyos, short de football Essentiel Kipsta.
- **Accessoires** : chaussettes de football (prénom ou numéro seulement), gourdes (alu 1 L Quechua, fitness 750 mL Domyos, verre Phoenix), casquettes (randonnée Forclaz, chasse orange Solognac, tennis Artengo), bonnets (Rider 500 à revers Wedze, running seamless Kiprun), tour de cou Morf (vendeur partenaire Atelier Katanga), sacs (tube 30 L Move 100, sport 20 L Club 100), sacs à dos (Arpenaz 50, Travel 100 pliable, Arpenaz 100, Arpenaz 500, MH100), bandeau et ceinture de running Kiprun.
- **Ensembles** : survêtement Joma Eco Championship (vendu en un seul article, flocage sur la veste), pack basket (maillot + short + chaussettes), pack fitness femme (t-shirt + short slim + chaussettes), pack jogging femme (pantalon + t-shirt coton + chaussettes), pack football (sweat T100 + short Essentiel + chaussettes), pack entraîneur (veste micropolaire + haut thermique homme + jogging homme + chaussettes), pack Hummel (ensemble t-shirt et short Hummel + veste micropolaire + chaussettes). L'ensemble Hummel est un seul article de deux pièces (t-shirt et short vendus ensemble), floqué à la poitrine, au dos et sur les cuisses. Un pack est fait de pièces achetées séparément et vendu comme un seul article.

Le catalogue se filtre par genre (Homme, Femme), par style (Sport, Casual) et par type (Hauts, Bas, Ensembles, Accessoires, Ton vêtement) ; un vêtement mixte apparaît dans les deux genres. Un bandeau tout en haut du site invite à demander un vêtement qui n'est pas au catalogue : il ouvre un message Gmail pré-rempli vers Fabr'Icam.

Sur le catalogue, chaque photo a une loupe : un clic ouvre la visionneuse en grand (flèches du clavier pour changer de photo, Échap pour fermer). Pour le pack, la loupe de chaque pièce ouvre les photos de cette pièce.

Chaque couleur d'un vêtement se clique : la photo, les vignettes et la visionneuse passent à la série de photos de cette couleur, et le lien « Voir l'article sur Decathlon » (ou « chez <vendeur> » pour un article de la place de marché, avec un lien vers la boutique du vendeur) suit la couleur. Une couleur donnée en rupture de stock par Decathlon le signale au client. **État de la relecture des couleurs (19/10/2026)** : les 45 articles Decathlon sont relus sur leur page, couleur par couleur (166 couleurs, avec le lien, la référence et la série de photos de chacune). Les 6 articles de la place de marché ont le lien de chaque couleur mais pas de série de photos par couleur (la page du vendeur n'en donne pas) : ils gardent les photos de l'article. Les teintes (`hex`) sont estimées d'après le nom Decathlon de la couleur, pas mesurées sur la photo. Pour relire un article, la page Decathlon de chaque couleur donne ses photos (`photos`), son prix et sa disponibilité ; un prix qui diffère d'une couleur à l'autre se note dans le `prixAchat` de la couleur.

Emplacements : poitrine, dos et manches pour les hauts ; cuisse gauche, cuisse droite (visuel A6 ou A5, avec prénom ou numéro possible) et bas de la jambe gauche (petit texte seul) pour les shorts et le pantalon ; chaussette gauche et droite (prénom ou numéro seulement) pour les chaussettes. Les maillots, débardeurs, gilets, doudoune et hauts thermiques n'ont pas de manches à floquer.

### Ton vêtement : le client apporte le sien

Le filtre « Ton vêtement » du catalogue regroupe 16 articles sans vêtement ni référence : une association qui a déjà ses vêtements (ou veut en acheter ailleurs) ne commande que le flocage. Quatre familles :

- **Hauts** : t-shirt, polo, sweat, haut à manches longues, maillot ou débardeur.
- **Vestes et gilets** : veste, sweat ou veste zippé, gilet sans manches.
- **Bas** : short, pantalon.
- **Accessoires** : casquette, bonnet, sac à dos, sac de sport, gourde, tour de cou.

Chaque article a son dessin et ses emplacements (ceux d'un article du catalogue du même type). Aucune photo, aucun lien Decathlon, aucun prix d'achat (`prixAchat: 0`).

- **Prix** : la même règle que les autres pièces, sans vêtement. Le prix d'une pièce est sa part des planches de transfert et de la livraison, plus 1 € de marge par motif (2 € au plus). Exemple, une veste avec un visuel A6 à la poitrine : **11,40 € pour 1 pièce, 3,58 € pour 5, 2,84 € pour 10, 2,15 € pour 20, 1,73 € pour 50**. Le minimum de marge par pièce n'est pas fixé : une grosse commande descend vite. Une pièce sans aucun motif ne coûte rien.
- **Ce que le client indique, pièce par pièce** : la couleur (15 couleurs usuelles, dont « Autre couleur claire » et « Autre couleur foncée »), la taille, et la **matière** : polyester (90 % ou plus), coton ou mélange, ou « Je ne sais pas » (choix par défaut). La matière est une colonne du tableau des pièces ; elle figure dans le fichier de commande (`matiere` sur la pièce : `polyester`, `coton` ou `inconnu`), le mail et la fiche imprimée.
- **Technique** : la sublimation n'est proposée que pour une pièce blanche ou claire déclarée en polyester. Dans tous les autres cas (coton, mélange, matière inconnue, couleur foncée, casquette, sac, gourde) c'est du DTF. C'est le client qui déclare la matière : l'atelier la contrôle à la réception.
- **Avertissement affiché au client** : Fabr'Icam contrôle le vêtement à la réception (matière, état, tenue à la chaleur) avant de presser ; le dessin est un modèle type et la position exacte est confirmée sur le vêtement ; le polaire, le matelassé et le softshell supportent mal la chaleur (basse température, feuille de téflon, essai avant la série). Ces phrases sont dans le champ `avertissement` de chaque article de `js/data.js`.
- **À l'atelier** : le tableau « Apportés par le client » de l'onglet Commande, une carte par pièce dans le diaporama avec la matière déclarée, la colonne « Source » de la fiche imprimée (« Apporté par le client »), deux points à vérifier (vêtements à réceptionner, matière inconnue à lire sur l'étiquette) et une ligne « Vêtements apportés par le client » dans les coûts (0 €). On peut mélanger dans une même commande des vêtements apportés et des articles Decathlon : seuls ces derniers sont à acheter. Un ancien fichier de commande, sans `matiere`, se recharge sans changement.

### Articles de la place de marché Decathlon

Cinq articles (veste sans manches Regatta, doudoune Result Core, veste micropolaire Kariban, ensemble Hummel, survêtement Joma) sont vendus par des vendeurs partenaires de Decathlon : pas de retrait en magasin, le vendeur livre à Fabr'Icam. Le site les repère par l'étiquette « Livré par le vendeur » et une note sur la fiche et dans le configurateur (livraison par le vendeur, stock limité, article personnalisé ni repris ni échangé). Les frais de port du vendeur sont comptés **une seule fois par vendeur et par commande**, répartis sur ses pièces et compris dans le prix. Decathlon n'affiche ces frais qu'au moment de commander : **4,99 € par vendeur est une estimation**, à corriger dans `js/prix.js` (`livraisonVendeur`) quand tu connais le vrai montant.

## Aperçu sur photo

Dans le configurateur, le bouton **Photo** pose le logo, les prénoms et les numéros sur la vraie photo du vêtement, en face et au dos. C'est indicatif : les photos sont prises de trois quarts, les positions sont approchées. Les limites :

- il faut choisir la couleur de la photo (polo marine, sweat bleu foncé, maillot, short de basket et débardeur blancs) ; sinon le site explique pourquoi et garde le dessin ;
- les manches ne sont pas montrées sur la photo (elles restent sur le dessin) ;
- le short de tennis n'a pas de photo exploitable ;
- si la photo ne se charge pas, le dessin la remplace.

Le dessin à la taille réelle reste la référence pour vérifier les dimensions.

## Règle de prix

Les planches DTF Print et la livraison sont réparties sur les pièces au prorata de la surface de leurs motifs. Chaque produit a son propre prix unitaire : le **coût moyen** de ses pièces (vêtement + part des planches et de la livraison) + la **marge moyenne**, arrondi au centime supérieur. Le prix suit le coût, sans palier.

**Marge d'une pièce vendue seule : 1 € par motif à presser, 2 € au plus par pièce.** Chaque élément posé compte pour un motif : un visuel, un prénom, un numéro. Une pièce avec un visuel porte 1 € ; avec un visuel et un prénom, 2 € ; avec un visuel, un prénom et un numéro, toujours 2 €. Ce décompte vaut pour des éléments séparés ; collés en un bloc (réglage par défaut du site), ils ne comptent que pour un seul motif (voir ci-dessous). Une pièce sans motif ne porte aucune marge. Exemple : un polo avec un visuel à la poitrine est vendu 19,39 € (coût de revient 18,39 € + 1 €). Dix polos avec un visuel chacun : 108,30 € au total. Les réglages sont `regles.parMotif` et `regles.maxParPiece` dans `js/prix.js` (mets `null` pour supprimer le plafond).

**Bloc collé (version 5.0.0).** Par défaut, le visuel, le prénom et le numéro d'un même emplacement sont imprimés sur **un seul transfert**, à `placement.ecartBloc` (0,5 cm) les uns des autres, et pressés d'un seul coup : c'est **un seul motif**, donc 1 € de marge au lieu de 2 €. Le bloc est un rectangle de la largeur de son plus large élément (le visuel, en général) : sur les planches il tient moins bien que des petits motifs séparés, la facture de planches monte un peu. Un polo avec un visuel A6, un prénom (2,5 cm) et un numéro (4 cm) : 19,39 € pour 1 pièce (20,39 € si les éléments sont séparés), 11,28 € pour 10 (11,88 €), 10,36 € pour 30 (10,94 €). Le client peut décocher la case sur chaque emplacement : les éléments redeviennent trois motifs séparés (2 € de marge au plus). Un emplacement qui ne porte qu'un élément n'a pas de bloc ; un emplacement de texte seul (dos sans visuel) colle le prénom et le numéro ensemble. Si le bloc dépasse le plateau de la presse (visuel A4 avec du texte), il n'est pas fait : les éléments restent séparés et le site le signale. Dans le fichier de commande, chaque marquage porte `bloc: true` ou `false` ; **un ancien fichier, sans ce champ, garde les éléments séparés** (même prix qu'avant). Un pack garde sa marge fixe par pièce : le bloc n'y change que le coût des planches.

**Marge d'une pièce dans un pack : 1 € par pièce, quel que soit son nombre de motifs, et 0 € pour les chaussettes.** Un pack est vendu comme un seul article. Un pack de trois pièces avec des chaussettes porte donc 2 € ; le pack entraîneur (veste, haut thermique, jogging, chaussettes) en porte 3. Le pack coûte moins cher que les mêmes pièces vendues séparées. Les réglages sont `regles.parPiecePack` dans `js/prix.js` et `margePack: 0` sur le produit « chaussettes » (`js/data.js`).

L'ensemble Hummel (t-shirt et short vendus ensemble) compte pour **une seule pièce** : hors pack, 1 € par motif sur l'ensemble entier, 2 € au plus ; dans le pack Hummel, 1 € pour l'ensemble, 1 € pour la veste et 0 € pour les chaussettes.

Frais de port d'un vendeur de la place de marché : un montant par vendeur et par commande (`livraisonVendeur` dans `js/prix.js`), ajouté au coût de revient et réparti sur les pièces de ce vendeur, avant la marge. Plus la commande est grosse, plus la part par pièce baisse.

Prix de la vitrine = un vêtement avec un visuel A6 à l'emplacement de référence (poitrine, ou une cuisse pour les shorts), pour 1, 5, 10, 20 et 50 pièces. Pour un pack : le visuel A6 sur chaque pièce de référence, prix par pack. Pour les chaussettes (prénom seul), le prix affiché compte un prénom de 3 cm de haut : tous les packs en contiennent une paire.

## Choses à vérifier

- **Fournisseur des planches** : DTF Print (Port-de-Bouc), prix relevés TTC le 18/10/2026 sur dtfprint.fr : DTF A4 5,50 €, A3 8,00 €, A2 14,00 €, mètre 18,00 € ; sublimation A4 3,90 €, A3 7,50 €, A2 13,00 €. Avant, le site utilisait Sprint Transfert (plus cher et sans remise relevée). Un fournisseur qui affiche des prix HT se règle avec `prixPlanchesHT: true` dans `js/prix.js`.
- **Remises par quantité de DTF Print** : elles démarrent à 10 planches (A4 4,00 € au lieu de 5,50 €). Une commande de flocage en compte rarement autant, donc elles ne sont pas appliquées. Pour les ajouter, remplis `remises` dans `js/prix.js` (`{ min: 10, pct: 0.27 }`).
- **Livraison** : offerte dès 100 € TTC de transferts. En dessous, DTF Print n'affiche le prix qu'au panier : 4,90 € est une estimation à corriger dans `livraison.colissimo`.
- **Sublimation** : DTF Print annonce un polyester d'au moins 65 % ; le site garde 90 % pour un rendu net. La planche A4 de sublimation fait 20 × 28 cm (le visuel A4 de 21 cm de large part donc sur une A3).
- **Prix d'achat** : relevés sur les fiches Decathlon le 18/10/2026 (polo 7,99 €, sweat 14,99 €, maillot 6,99 €, short de basket 6,99 €, short de tennis 5,99 €, débardeur 9,99 €, et ceux des 19 articles ajoutés en 2.3.0). Le polo blanc est supposé au même prix que le marine. Relecture du 19/10/2026 : le sweat Viralto passe à 21,99 € (l'ancienne variante à 12 € n'existe plus) et 37 couleurs ont leur propre prix (voir `prixAchat` des couleurs dans `js/data.js`) ; les autres prix de base sont ceux de la première couleur. Vérifie en magasin et corrige `prixAchat` dans `js/data.js`.
- **Stock** : les articles de la place de marché ont un stock très limité (le survêtement Joma n'a que les tailles XS, S et 2XL). Les tailles du catalogue sont celles des fiches du 18/10/2026 (celles du sweat Viralto Axton, du 19/10/2026) ; vérifie avant de promettre une commande. Le 19/10/2026, la relecture n'a vérifié ni les tailles ni le stock par taille, sauf pour le sweat Viralto.
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
| changer un prix de planche, le fournisseur, la TVA, la livraison, la marge (1 € par motif, 2 € au plus par pièce, 1 € par pièce de pack), l'arrondi, l'écart entre le visuel et le texte d'un bloc collé (`placement.ecartBloc`) | `js/prix.js` |
| cocher ou non par défaut la case « collés au visuel » | `js/app.js` (`newMarquage`, champ `bloc`) |
| ajouter un vêtement ou un accessoire, une couleur, une taille | `js/data.js` (copie un bloc de `produits`) |
| ajouter les photos, le lien ou le prix d'une couleur, la signaler en rupture | `js/data.js` (dans la couleur : `nomDec`, `ref`, `lien`, `photos: dec([...])`, `prixAchat` si elle ne coûte pas le prix de l'article, `rupture: "AAAA-MM-JJ"`) |
| ajouter un type de vêtement apporté (« Ton vêtement »), ou changer la liste des couleurs ou des matières proposées | `js/data.js` (un produit avec `apporte: true`, `prixAchat: 0` et `couleurs: COULEURS_APPORTE`, un `id` qui commence par `apporte-` ; `COULEURS_APPORTE` et `matieres` en haut du fichier) |
| ajouter un pack ou un ensemble | `js/data.js` (`packs`, avec `type: "ensemble"` dans les `tags`) |
| marquer un article de la place de marché, ou changer les frais de port ou la page d'un vendeur | `js/data.js` (`vendeur` du produit) et `js/prix.js` (`livraisonVendeur`, avec `lien` = la page du vendeur sur Decathlon) |
| changer les filtres du catalogue (Homme, Femme, Sport, Casual, Hauts, Bas…) ou les étiquettes d'un vêtement | `js/data.js` (`filtres`, et `tags` du produit) |
| ajouter l'aperçu sur photo à un vêtement, ou corriger la position du visuel sur une photo | `js/data.js` (`apercuPhoto` du produit : `couleur`, puis `face` et `dos` avec `photo` = rang dans `photos`, `u0`, `v0`, `kx`, `ky`) |
| changer le bandeau du haut (vêtement hors catalogue) | `index.html` (`#top-note`) et le mail pré-rempli dans `js/app.js` (`autreVetementHref`) |
| changer la liste des polices | `js/data.js` (`polices`) |
| changer le mot de passe de l'atelier | `js/atelier.js` (`MDP`) |
| changer la mise en page de l'atelier ou de la fiche imprimée | `css/atelier.css` |
| changer les couleurs, les polices du site | `css/style.css` (variables en haut) |

Pour un nouveau produit, il faut : `id`, `nom`, `nomCourt`, `marque`, `modele` (le dessin : `polo`, `sweat`, `debardeur`, `maillot`, `short-basket`, `short-tennis`, `short-slim`, `tshirt`, `manches-longues`, `veste`, `sweat-zip`, `gilet`, `gilet-matelasse`, `ensemble-short`, `pantalon`, `chaussette`, ou pour un accessoire `gourde`, `casquette`, `bonnet`, `tour-de-cou`, `bandeau`, `sac-tube`, `sac-sport`, `sac-a-dos` ou `ceinture`), `tags` (genre, style, type : haut, bas, ensemble ou accessoire, et le sport en étiquette), `prixAchat` (TTC), `polyesterPct`, `tailles`, `couleurs` (avec `clair: true` pour les couleurs claires), `vitrine` (emplacements du prix affiché) et les `zones` (position en cm sur le dessin). Un nouveau modèle de dessin se code dans `js/preview.js` ; les accessoires y sont dessinés à l'échelle réelle sur un fond plus petit (`w` et `h` du modèle). Un article qui ne se sublime pas (forme ronde, enduit, élastique) porte `sublimation: false`. Chaque couleur peut garder sa référence Decathlon (`ref`) et le lien de sa page (`lien`). Chaque produit a ses photos Decathlon (4 à 8), chargées depuis leur site : la première est celle du catalogue, les autres apparaissent en vignettes. Si une photo ne s'affiche pas (hors ligne, lien périmé), le catalogue montre le dessin du vêtement. Pour changer ou ajouter une photo : champ `photos` du produit, avec l'adresse de l'image sans paramètres (la taille est ajoutée par le site).

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

71 tests : 63 sur le moteur et le catalogue (`engine.test.js`) et 8 sur les outils de fichiers de l'atelier (`fichiers.test.js` : dimensions en pixels, résolution 300 dpi écrite dans le PNG, archive zip, CSV). Les 63 premiers : 27 sur le moteur, marge de 1 € par motif plafonnée à 2 € par pièce, marge de pack à 1 € par pièce, arrondi au centime, prix par produit, texte seul, regroupement de motifs sur les planches, sublimation, livraison offerte, rapidité ; 3 sur les réglages de l'aperçu sur photo (couleur et rang de photo valides, emplacements dans la photo) ; 15 sur le catalogue étendu (données cohérentes, un dessin pour chaque produit, ensemble et pack Hummel, frais de port par vendeur, chaussettes, composition et marge des packs, prix de vitrine, nouveaux vêtements, formats et zones des accessoires, sublimation) ; 6 sur les couleurs (séries de photos et liens valides, calibrage de l'aperçu, couleurs relues, relecture des 45 articles, prix d'achat par couleur, liens des vendeurs) ; 5 sur « Ton vêtement » (16 articles sans prix d'achat ni photo, prix sans vêtement, mélange avec des articles Decathlon, sublimation selon la matière et la couleur, pièce sans motif) ; 7 sur le bloc collé (un seul motif empilé et centré, prix avec et sans bloc, anciens fichiers sans la case, un seul ou deux éléments, texte seul, bloc trop grand pour le plateau, pack).

## Publier sur GitHub Pages

1. Crée un dépôt, mets-y tout le dossier tel quel (`index.html` à la racine).
2. Settings, Pages, « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le site est alors en ligne à `https://<ton-compte>.github.io/<dépôt>/`.

Points d'attention :
- Les photos Decathlon sont liées, pas copiées. Sur un site public, mieux vaut les remplacer par tes propres photos (dossier `img/`, champ `photos` dans `data.js`).
- Le mot de passe de l'atelier (`MDP` en haut de `js/atelier.js`, `2024` pour l'instant) n'est qu'une porte pour les curieux. Le site est statique : tout le code, et donc le mot de passe, se lit dans le navigateur. Il ne protège rien de confidentiel ; l'atelier ne contient d'ailleurs aucune donnée, il lit seulement le fichier de commande que tu charges toi-même (gardé dans ton navigateur, jamais envoyé nulle part).
- Les commandes passent uniquement par mail (Gmail, pas l'application de mail de l'ordinateur) et fichier joint, rien n'est stocké sur le site. Les liens de mail sont construits par `gmailHref` dans `js/app.js` ; sans Gmail, le bouton « Copier le texte du mail » reste disponible.
