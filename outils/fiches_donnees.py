"""Contenu des fiches « méthodes d'application » (une par matière) : c'est le seul fichier à modifier pour changer un réglage,
une consigne ou un statut. Il alimente deux choses, produites par outils/fiches-pdf.py :
  - les PDF imprimables du dossier fiches/ ;
  - js/methodes-data.js, lu par le sélecteur de méthodes de l'atelier (onglet « Fiche de fabrication »).

Statuts d'une méthode : "ok" (applicable), "prudence" (applicable avec précautions ou un essai obligatoire), "non" (inapplicable).
Chaque méthode peut avoir un statut différent sur couleur claire ("clair") et foncée ("fonce") : voir le champ « couleurs ».

Sources des réglages :
  - DTF et sublimation : tableau de pose de DTF Print (dtfprint.fr), le fournisseur de planches actuel (voir js/prix.js) ;
  - vinyles : fiches des fabricants (Siser, Stahls) relevées le 20/10/2026 ; une valeur marquée « à valider » n'a pas de source ;
  - laser : aucune valeur chiffrée, parce que les puissances et les vitesses dépendent de la machine : une grille d'essai à remplir
    donne les réglages de départ.
"""

OK, PRU, NON = "ok", "prudence", "non"

MAJ = "20/10/2026"
CONTACT_DTF = "contact@dtfprint.fr ou 04 86 17 47 92"

# ---------------------------------------------------------------------------------------------------------------------------
# Vinyles thermocollants (réglages des fabricants)
# ---------------------------------------------------------------------------------------------------------------------------
VINYLES = {
    "standard": dict(nom="Flex standard", ex="type Siser EasyWeed", temp="152 °C", duree="10 à 15 s", pression="moyenne",
                     pelage="selon la fiche du rouleau", source="Siser EasyWeed (305 °F), relevé HeatPressNation"),
    "stretch": dict(nom="Flex stretch", ex="type Siser EasyWeed Stretch", temp="152 °C", duree="15 s", pression="moyenne à ferme",
                    pelage="selon la fiche du rouleau", source="Siser EasyWeed Stretch (305 °F), relevé HeatPressNation"),
    "flock": dict(nom="Flock (velouté)", ex="type Stahls Flock", temp="170 °C", duree="20 s", pression="moyenne",
                  pelage="à froid", source="Stahls, fiche du flock"),
    "reflechissant": dict(nom="Réfléchissant", ex="type Siser EasyReflective", temp="150 °C", duree="15 s, après 2 à 3 s de préchauffe",
                          pression="moyenne", pelage="support retiré tiède, au moins 15 s après le pressage",
                          source="Siser EasyReflective, instructions ProWorld"),
    "pailleté": dict(nom="Pailleté (glitter)", ex="type Siser Glitter", temp="160 °C", duree="10 à 15 s", pression="ferme",
                     pelage="selon la fiche du rouleau", source="Siser Glitter (320 °F), relevé HeatPressNation"),
    "metallise": dict(nom="Métallisé", ex="flex métallisé ou stretch métallisé", temp="150 à 160 °C", duree="10 à 15 s", pression="moyenne",
                      pelage="selon la fiche du rouleau", source="valeur courante, À VALIDER avec la fiche du rouleau acheté"),
    "adhesif": dict(nom="Vinyle adhésif (sans chaleur)", ex="vinyle adhésif permanent, type signalétique", temp="aucune", duree="aucune",
                    pression="à la main, du centre vers les bords", pelage="le support se retire avant la pose",
                    source="pose à froid, sans presse"),
}
ORDRE_VINYLES = ["standard", "stretch", "flock", "reflechissant", "pailleté", "metallise", "adhesif"]


def vinyle_types(**statuts):
    """statuts : id du vinyle -> (statut, note). Les vinyles non cités sont « non »."""
    out = []
    for vid in ORDRE_VINYLES:
        st, note = statuts.get(vid, (NON, ""))
        v = VINYLES[vid]
        out.append(dict(id=vid, nom=v["nom"], ex=v["ex"], statut=st, note=note,
                        reglages=[("Température", v["temp"]), ("Durée", v["duree"]), ("Pression", v["pression"]), ("Pelage", v["pelage"])],
                        source=v["source"]))
    return out


# ---------------------------------------------------------------------------------------------------------------------------
# Modèles de méthodes
# ---------------------------------------------------------------------------------------------------------------------------
def dtf(statut, raison, temp, duree, pression="moyenne", attention=(), source="DTF Print, tableau de pose", couleurs=None, titre_reglage=None):
    return dict(id="dtf", statut=statut, raison=raison, couleurs=couleurs or {},
                reglages=[("Température", temp), ("Durée", duree), ("Pression", pression),
                          ("Pelage", "à chaud ou à froid"), ("Repressage", "10 s, papier kraft, pression moyenne")],
                attention=list(attention), source=source)


def non_dtf(raison):
    return dict(id="dtf", statut=NON, raison=raison, couleurs={}, reglages=[], attention=[], source="")


def subl(statut, raison, attention=(), couleurs=None, source="DTF Print, fiche sublimation"):
    return dict(id="sublimation", statut=statut, raison=raison, couleurs=couleurs or {"clair": statut, "fonce": NON},
                reglages=[("Température", "190 à 200 °C"), ("Durée", "40 à 60 s"), ("Pression", "moyenne à forte"),
                          ("Papier", "face imprimée contre le vêtement")],
                attention=list(attention), source=source)


def non_subl(raison):
    return dict(id="sublimation", statut=NON, raison=raison, couleurs={}, reglages=[], attention=[], source="")


def vinyle(statut, raison, types, attention=(), couleurs=None):
    return dict(id="vinyle", statut=statut, raison=raison, couleurs=couleurs or {}, types=types, reglages=[], attention=list(attention),
                source="fiches des fabricants (Siser, Stahls)")


def laser_non(raison="Le laser grave les matières dures ou le cuir ; il ne sert pas à poser un visuel sur un tissu."):
    return dict(id="laser", statut=NON, raison=raison, couleurs={}, types=[], reglages=[], attention=[], source="")


def laser(statut, raison, co2, diode, fibre, attention=()):
    """co2, diode, fibre : (statut, note)"""
    types = [
        dict(id="co2", nom="Laser CO2 (Mira 9S)", statut=co2[0], note=co2[1]),
        dict(id="diode", nom="Laser diode (xTool, si c'est une diode)", statut=diode[0], note=diode[1]),
        dict(id="fibre", nom="Laser fibre (xTool, si c'est un modèle à fibre)", statut=fibre[0], note=fibre[1]),
    ]
    return dict(id="laser", statut=statut, raison=raison, couleurs={}, types=types, reglages=[], attention=list(attention),
                source="aucune valeur chiffrée : à régler par essai (grille d'essai dans la fiche)")


# ---------------------------------------------------------------------------------------------------------------------------
# Consignes qui reviennent
# ---------------------------------------------------------------------------------------------------------------------------
POSE_SENSIBLE = ("Essai obligatoire sur une chute du même tissu avant la série : aucun réglage n'est donné par le fournisseur pour cette matière "
                 "(contact DTF Print : " + CONTACT_DTF + ").")
MIGRATION = ("Couleurs sensibles (rouge, marine, noir, vert foncé) : la teinture peut migrer dans le motif. Presse le moins chaud et le moins "
             "longtemps possible, laisse refroidir, regarde à nouveau après 24 h : une tache rosée ou grisée autour du motif = migration.")
TEXTILE_SENSIBLE_VINYLE = "Fais un essai sur une chute avant la série : la chaleur marque ou écrase ce tissu."

# ---------------------------------------------------------------------------------------------------------------------------
# Les matières (une fiche PDF chacune)
# ---------------------------------------------------------------------------------------------------------------------------
MATIERES = [

    # ------------------------------------------------------------------------------------------------ COTON
    dict(id="coton-100", nom="Coton 100 %", groupe="textile", compo="100 % coton",
         resume="La matière la plus facile : elle supporte la chaleur et ne migre pas. DTF et vinyle conviennent sur toutes les couleurs.",
         methodes=[
             dtf(OK, "Réglages du fournisseur : 150 °C, 10 à 15 s.", "150 °C", "10 à 15 s",
                 attention=["Pré-presse 5 s : le coton garde l'humidité, qui nuit à l'adhérence.",
                            "Un coton très texturé (gaufré, côtelé, molletonné) accroche moins bien : presse 15 s ou represse."]),
             non_subl("Le coton ne se sublime pas : l'encre de sublimation ne se fixe que sur le polyester."),
             vinyle(OK, "Tous les vinyles thermocollants conviennent sur le coton.", vinyle_types(
                 standard=(OK, "Le choix courant : prénoms, numéros, logos en une couleur."),
                 stretch=(OK, "Utile seulement sur un coton très fin ou extensible."),
                 flock=(OK, "Bon rendu sur le coton ; épaisseur de trait d'au moins 1,5 mm."),
                 reflechissant=(OK, ""), pailleté=(OK, ""), metallise=(OK, "À valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="polyester-100", nom="Polyester 100 %", groupe="textile", compo="100 % polyester (maillots, shorts, polos, sweats, thermiques)",
         resume="Le sportswear de ton catalogue. DTF à basse température ; la sublimation n'est possible que sur blanc ou couleur très claire.",
         methodes=[
             dtf(OK, "Réglages du fournisseur : 135 °C, 10 s.", "135 °C", "10 s",
                 attention=[MIGRATION,
                            "Polyester fin (maillot, short) : ne dépasse pas 10 s ; si le tissu brille ou se marque, descends de 10 °C.",
                            "Évite les coutures et les zones imprimées d'origine sous le plateau."]),
             subl(OK, "Blanc ou couleur très claire uniquement, polyester à 90 % ou plus : rendu net et durable.",
                  attention=["Le blanc du visuel n'est pas imprimé : il laisse voir la couleur du vêtement.",
                             "Une couleur même moyenne change la teinte du visuel : ne sublime que sur blanc ou très clair.",
                             "Mets une feuille de papier propre sous le vêtement pour ne pas marquer le plateau."]),
             vinyle(OK, "Flex standard ou stretch pour les prénoms et numéros ; attention à la migration sur les couleurs sensibles.", vinyle_types(
                 standard=(OK, "Sur teinte sensible (rouge, marine, noir) : choisis un flex anti-migration ou fais un essai."),
                 stretch=(OK, "Recommandé pour le polyester fin et élastique du sportswear."),
                 flock=(PRU, "À tester avant : le fabricant demande un essai sur 100 % polyester."),
                 reflechissant=(OK, ""), pailleté=(OK, "Pression ferme : vérifie que le tissu ne marque pas."),
                 metallise=(OK, "À valider avec la fiche du rouleau.")),
                 attention=[MIGRATION]),
             laser_non(),
         ]),

    dict(id="coton-polyester", nom="Mélange coton / polyester", groupe="textile", compo="50/50 à 60/40 (t-shirts, polo de golf, sweat molleton)",
         resume="Un tissu sans souci : le DTF se règle entre le coton et le polyester. Pas de sublimation (trop peu de polyester).",
         methodes=[
             dtf(OK, "Réglages du fournisseur pour le 50/50 : 145 °C, 12 s.", "145 °C", "12 s",
                 attention=["Réglage donné par le fournisseur pour le 50/50, appliqué aux 60/40 du catalogue.",
                            "Sweat molleton : pré-presse 5 s pour aplatir le tissu, et represse 10 s pour bien fixer.",
                            "Teintes foncées : regarde les bords après 24 h (migration possible du polyester)."]),
             non_subl("Moins de 65 % de polyester : le fournisseur déconseille la sublimation sur ce tissu."),
             vinyle(OK, "Tous les vinyles conviennent, le flex standard est le plus courant.", vinyle_types(
                 standard=(OK, ""), stretch=(OK, "Utile sur un t-shirt très fin."), flock=(OK, "Épaisseur de trait d'au moins 1,5 mm."),
                 reflechissant=(OK, ""), pailleté=(OK, ""), metallise=(OK, "À valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="polyester-extensible", nom="Polyester extensible (avec élasthanne)", groupe="textile",
         compo="83 à 96 % polyester + élasthanne (t-shirt, sweat Viralto, veste Regatta, short 2 en 1, bandeau, chaussettes)",
         resume="Tissu fin et qui s'étire : température basse en DTF, flex stretch obligatoire en vinyle.",
         methodes=[
             dtf(PRU, "Basse température : 135 °C et jusqu'à 120-125 °C sur un tissu très fin.", "135 °C (120-125 °C si très fin)", "10 s",
                 attention=["Tissu fin (lycra, softshell) : descends à 120-125 °C et fais un essai sur une chute.",
                            "Presse à plat, sans étirer le tissu : un motif posé tendu se plisse au relâchement.",
                            MIGRATION],
                 source="DTF Print (135 °C) et consigne interne js/prix.js pour le tissu fin"),
             subl(PRU, "Possible sur blanc ou clair dès 65 % de polyester (fournisseur) ; ce site demande 90 % pour un rendu net.",
                  attention=["Sous 90 % de polyester, le rendu est moins vif : fais un essai avant la série.",
                             "Les parties en élasthanne ne prennent pas l'encre : évite les bandes et les ourlets.",
                             "Blanc ou très clair seulement ; le blanc du visuel n'est pas imprimé."]),
             vinyle(OK, "Flex stretch obligatoire : un flex standard se fissure quand le tissu s'étire.", vinyle_types(
                 standard=(PRU, "Se fissure à l'étirement : réserve-le aux zones qui ne s'étirent pas."),
                 stretch=(OK, "Le bon choix pour ce tissu."),
                 reflechissant=(PRU, "Rigide : zone qui ne bouge pas, petit motif."),
                 pailleté=(PRU, "Rigide : zone qui ne bouge pas, petit motif."),
                 metallise=(OK, "Prends la version stretch ; à valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="coton-extensible", nom="Coton extensible (avec élasthanne)", groupe="textile",
         compo="88 à 92 % coton + 8 à 12 % élasthanne (short slim, jogging femme)",
         resume="Coton souple : on le traite comme du coton, avec une température un peu plus prudente et du flex stretch.",
         methodes=[
             dtf(OK, "Valeur prudente, entre le coton et le mélange : 145 °C, 10 s.", "145 °C", "10 s",
                 attention=["Réglage non donné par le fournisseur (valeur prudente) : valide-le par un essai sur une chute.",
                            "Presse à plat, sans étirer le tissu."],
                 source="DTF Print (coton, mélange) : valeur prudente À VALIDER"),
             non_subl("Le coton ne se sublime pas."),
             vinyle(OK, "Flex stretch recommandé pour suivre l'élasticité du tissu.", vinyle_types(
                 standard=(PRU, "Se fissure si le tissu s'étire beaucoup."),
                 stretch=(OK, "Le bon choix pour ce tissu."),
                 flock=(PRU, "Peu extensible : zone qui ne s'étire pas."),
                 reflechissant=(PRU, "Rigide : petit motif sur une zone qui ne bouge pas."),
                 pailleté=(PRU, "Rigide : petit motif sur une zone qui ne bouge pas."),
                 metallise=(OK, "Version stretch ; à valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="polyester-enduit", nom="Polyester enduit polyuréthane (sacs, imperméable)", groupe="textile",
         compo="100 % polyester avec enduction polyuréthane (sacs à dos, sacs de sport, sac tube) ; ceinture de running",
         resume="Tissu imperméable : l'enduit fond si on chauffe trop. Un essai sur une chute est obligatoire, et seulement des petits motifs sur une face plane.",
         methodes=[
             dtf(PRU, "Aucun réglage du fournisseur : essai obligatoire, partir à 120-125 °C.", "120-125 °C (à valider)", "10 s",
                 pression="légère à moyenne",
                 attention=[POSE_SENSIBLE,
                            "Utilise une feuille de téflon ou de papier kraft : l'enduit peut coller à la presse.",
                            "Évite coutures, soudures et zip sous le plateau ; vise une face plane (formats Mini, A7, A6 du site).",
                            "Si l'essai échoue (motif qui se décolle à la pliure ou au lavage), propose un autre article au client plutôt que de livrer une pièce fragile."],
                 source="aucune valeur du fournisseur : À VALIDER par un essai"),
             non_subl("L'enduit polyuréthane bloque l'encre de sublimation et fond à 190 °C."),
             vinyle(PRU, "Possible en petit motif avec un essai : l'adhérence sur l'enduit est incertaine.", vinyle_types(
                 standard=(PRU, "Adhérence incertaine sur l'enduit ; essai obligatoire."),
                 stretch=(PRU, "Adhérence incertaine sur l'enduit ; essai obligatoire."),
                 reflechissant=(PRU, "Petit motif plat ; essai obligatoire."),
                 pailleté=(PRU, "Pression ferme : déconseillé sur l'enduit."),
                 metallise=(PRU, "À valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="polaire", nom="Polaire et micropolaire", groupe="textile", compo="100 % polyester à poil (veste micropolaire Kariban)",
         resume="Le poil s'écrase sous la presse et le tissu supporte mal la chaleur. Pose sur une zone lisse, essai obligatoire.",
         methodes=[
             dtf(PRU, "Aucun réglage du fournisseur : essai obligatoire, partir à 120-125 °C.", "120-125 °C (à valider)", "10 s",
                 pression="légère à moyenne",
                 attention=[POSE_SENSIBLE,
                            "Le poil écrasé marque autour du motif : brosse-le après le refroidissement.",
                            "Sur poil long, le transfert tient mal : choisis un motif compact et represse."],
                 source="aucune valeur du fournisseur : À VALIDER par un essai"),
             subl(PRU, "Possible sur polaire 100 % polyester blanche ou claire, mais le poil s'écrase : essai obligatoire.",
                  attention=["La polaire se tasse à 190 °C : presse sous la durée minimale et fais un essai.",
                             "Le blanc du visuel n'est pas imprimé : il laisse voir la couleur de la polaire."]),
             vinyle(PRU, "Possible avec essai : le poil gêne l'adhérence.", vinyle_types(
                 standard=(PRU, "Adhère mal sur le poil : presse 15 s et essaie."),
                 stretch=(PRU, "Adhère mal sur le poil : essaie."),
                 flock=(NON, "Le poil sur poil n'accroche pas."),
                 reflechissant=(PRU, "Petit motif ; essai obligatoire."),
                 pailleté=(NON, "Pression ferme : écrase la polaire."),
                 metallise=(PRU, "À valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="microfibre", nom="Microfibre (serviette, tour de cou)", groupe="textile",
         compo="88 % polyester + 12 % polyamide (serviette) ; polyester microfibre (tour de cou)",
         resume="Fibre très fine, sensible à la chaleur. DTF et vinyle avec précautions ; la sublimation est possible sur blanc ou clair.",
         methodes=[
             dtf(PRU, "Aucun réglage du fournisseur : essai obligatoire, partir à 120-125 °C.", "120-125 °C (à valider)", "10 s",
                 pression="moyenne",
                 attention=[POSE_SENSIBLE,
                            "Serviette : presse à plat sur la zone lisse du bas ; une boucle ou un poil rend le transfert flou.",
                            "Tour de cou : presse le tissu à plat, pas tendu."],
                 source="aucune valeur du fournisseur : À VALIDER par un essai"),
             subl(PRU, "Possible sur blanc ou clair (88 % de polyester pour la serviette) ; le site désactive la sublimation sur la serviette.",
                  attention=["Le catalogue marque la serviette comme non sublimable ; fais l'essai avant de proposer cette technique au client."]),
             vinyle(PRU, "Possible sur zone plate avec essai.", vinyle_types(
                 standard=(PRU, TEXTILE_SENSIBLE_VINYLE), stretch=(PRU, TEXTILE_SENSIBLE_VINYLE),
                 reflechissant=(PRU, ""), metallise=(PRU, "À valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="nylon", nom="Nylon / polyamide", groupe="textile", compo="nylon, polyamide (coupe-vent, certaines vestes et sacs, apportés par le client)",
         resume="Aucun article du catalogue, mais un client peut en apporter : le DTF est indiqué par le fournisseur à 135 °C.",
         methodes=[
             dtf(OK, "Réglages du fournisseur : 135 °C, 10 s.", "135 °C", "10 s",
                 attention=["Fais un essai sur une chute : certains nylons brillent ou se marquent.",
                            "Évite les coutures étanches et les zones enduites (voir « polyester enduit »)."]),
             non_subl("Le nylon ne se sublime pas correctement : l'encre ne tient bien que sur le polyester."),
             vinyle(PRU, "Possible avec un essai.", vinyle_types(
                 standard=(PRU, "Essai obligatoire sur le nylon."), stretch=(PRU, "Essai obligatoire."),
                 reflechissant=(PRU, "Le fabricant liste le nylon avec un essai recommandé."),
                 pailleté=(PRU, "Pression ferme : essaie."), metallise=(PRU, "À valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="acrylique-maille", nom="Acrylique et mailles (bonnets)", groupe="textile",
         compo="100 % acrylique (bonnet Rider) ; 72 % polyester, 23 % polyamide, 5 % élasthanne (bonnet seamless)",
         resume="Tricot en relief : un motif ne tient que sur une zone plate et petite. Essai obligatoire.",
         methodes=[
             dtf(PRU, "Aucun réglage du fournisseur : petit motif sur zone plate, essai obligatoire, partir à 120-125 °C.", "120-125 °C (à valider)", "10 s",
                 pression="légère à moyenne",
                 attention=[POSE_SENSIBLE,
                            "Formats Mini et A7 seulement : le tricot ne supporte pas un grand motif.",
                            "Presse sur le revers plat, mets un coussin (serviette roulée) à l'intérieur du bonnet pour presser à plat.",
                            "L'acrylique ramollit vers la chaleur : ne dépasse jamais 125 °C."],
                 source="aucune valeur du fournisseur : À VALIDER par un essai"),
             non_subl("L'acrylique ne se sublime pas, et le catalogue désactive la sublimation sur les bonnets."),
             vinyle(PRU, "Petit motif en flex stretch sur zone plate, avec essai.", vinyle_types(
                 stretch=(PRU, "Zone plate seulement, petit motif ; essai obligatoire."),
                 standard=(PRU, "Se fissure sur la maille : petit motif seulement."),
                 metallise=(PRU, "À valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="casquette", nom="Casquettes", groupe="textile", compo="100 % polyester (randonnée, chasse, tennis) ; casquette apportée",
         resume="Panneau courbe sur une presse plate : motif de petite taille et coussin sous le tissu. Pas de sublimation.",
         methodes=[
             dtf(PRU, "Réglages du polyester : 135 °C, 10 s ; motif Mini seulement, presse plate sur panneau courbe.", "135 °C", "10 s",
                 attention=["Format Mini (5 × 5 cm) seulement : plus grand, le transfert plisse sur la courbe.",
                            "Roule une serviette sous le panneau pour presser à plat, et évite la couture centrale.",
                            "Protège la visière et la bande intérieure de la chaleur.",
                            MIGRATION],
                 source="DTF Print (polyester), adapté à la casquette"),
             non_subl("Le catalogue désactive la sublimation sur les casquettes (forme courbe)."),
             vinyle(PRU, "Petit flex stretch sur le panneau, avec un coussin sous le tissu.", vinyle_types(
                 standard=(PRU, "Petit motif ; essai conseillé."), stretch=(PRU, "Petit motif ; essai conseillé."),
                 metallise=(PRU, "À valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    dict(id="imper-membrane", nom="Imperméable à membrane et softshell", groupe="textile",
         compo="vestes à membrane étanche, softshell, coupe-vent technique (apportés par le client)",
         resume="Aucun article du catalogue. La chaleur peut détruire l'étanchéité : essai obligatoire, jamais sur les coutures étanches.",
         methodes=[
             dtf(PRU, "Aucun réglage du fournisseur : essai obligatoire, partir à 120-125 °C.", "120-125 °C (à valider)", "10 s",
                 pression="légère à moyenne",
                 attention=[POSE_SENSIBLE,
                            "Ne presse jamais sur une couture étanchée (bande thermosoudée) ni sur une poche : la chaleur la décolle.",
                            "Prévois l'accord écrit du client : la membrane peut perdre son étanchéité à l'endroit pressé.",
                            "Feuille de téflon obligatoire : la face externe fond ou brille facilement."],
                 source="aucune valeur du fournisseur : À VALIDER par un essai"),
             non_subl("Le tissu technique et sa membrane ne supportent pas 190 °C."),
             vinyle(PRU, "Essai obligatoire sur une chute : l'adhérence et la chaleur sont à valider.", vinyle_types(
                 standard=(PRU, "Essai obligatoire."), stretch=(PRU, "Essai obligatoire."),
                 reflechissant=(PRU, "Souvent utilisé sur l'imperméable ; essai obligatoire."),
                 metallise=(PRU, "À valider avec la fiche du rouleau."))),
             laser_non(),
         ]),

    # ------------------------------------------------------------------------------------------------ SUPPORTS RIGIDES
    dict(id="aluminium", nom="Aluminium (gourdes, porte-clés)", groupe="rigide",
         compo="aluminium anodisé, peint ou brut (gourdes Quechua et Domyos, porte-clés décapsuleur)",
         resume="Pas de DTF ni de sublimation. On grave au laser (décape la couleur) ou on colle un vinyle adhésif.",
         methodes=[
             non_dtf("Le DTF se presse sur un tissu, pas sur le métal."),
             non_subl("La sublimation demande un support revêtu ou un tissu polyester : l'aluminium non traité ne convient pas."),
             vinyle(OK, "Vinyle adhésif posé à froid : simple et net sur une surface lisse et propre.", vinyle_types(
                 adhesif=(OK, "Dégraisse à l'alcool et laisse sécher ; lisse du centre vers les bords."),
                 standard=(PRU, "Le flex adhère mal sur le métal lisse : tenue limitée, essai obligatoire.")),
                 attention=["Gourde : évite le bouchon en plastique et la zone des coutures de sertissage."]),
             laser(OK, "Gravure au CO2 (Mira 9S) sur aluminium anodisé ou peint ; le laser fibre grave aussi l'aluminium brut.",
                   co2=(OK, "Retire la couche anodisée ou peinte : la gravure apparaît en clair. Ne grave pas l'aluminium brut."),
                   diode=(PRU, "Marque seulement une surface peinte ou anodisée, avec une marque faible : essai obligatoire."),
                   fibre=(OK, "Grave l'aluminium anodisé, peint ou brut : le plus net."),
                   attention=["Grave seulement l'extérieur d'une gourde : l'intérieur est en contact avec la boisson.",
                              "Nettoie la gravure à l'alcool après (résidu noir de la combustion).",
                              "Fixe la pièce : une gourde ronde roule, cale-la avec deux cales ou un support rotatif."]),
         ]),

    dict(id="inox", nom="Acier inoxydable (ouvre-bouteille)", groupe="rigide",
         compo="acier inoxydable (ouvre-bouteille format carte)",
         resume="Seul un laser à fibre grave l'inox nu. Sinon, vinyle adhésif posé à froid.",
         methodes=[
             non_dtf("Le DTF se presse sur un tissu, pas sur le métal."),
             non_subl("L'inox ne se sublime pas."),
             vinyle(OK, "Vinyle adhésif posé à froid : la solution simple si tu n'as pas de laser à fibre.", vinyle_types(
                 adhesif=(OK, "Dégraisse à l'alcool et laisse sécher ; lisse du centre vers les bords."),
                 standard=(PRU, "Le flex adhère mal sur l'inox lisse : tenue limitée, essai obligatoire."))),
             laser(PRU, "Seulement avec un laser fibre : à confirmer sur ton xTool.",
                   co2=(NON, "Le CO2 ne marque pas l'inox nu sans produit de marquage spécial."),
                   diode=(NON, "La diode ne marque pas l'inox nu sans produit de marquage spécial."),
                   fibre=(OK, "Le laser fibre marque l'inox : noir ou blanc selon les réglages."),
                   attention=["Vérifie d'abord le modèle exact de ton xTool : si c'est une diode, il ne grave pas l'inox.",
                              "Le métal chauffe pendant la gravure : utilise une pince et laisse refroidir avant de toucher."]),
         ]),

    dict(id="verre", nom="Verre (gourde en verre)", groupe="rigide", compo="verre (gourde Phoenix, 500 à 600 mL)",
         resume="La gravure au laser CO2 (Mira 9S) donne un dépoli net. Le vinyle adhésif est la solution sans laser. Pas de chaleur de presse.",
         methodes=[
             non_dtf("Le DTF se presse sur un tissu, pas sur le verre."),
             non_subl("La sublimation sur verre demande un revêtement spécial : le verre nu ne convient pas."),
             vinyle(OK, "Vinyle adhésif posé à froid ; le flex thermocollant est impossible sur le verre.", vinyle_types(
                 adhesif=(OK, "Nettoie le verre à l'alcool ; pose à froid et chasse les bulles de l'intérieur vers l'extérieur.")),
                 attention=["Pas de lave-vaisselle : le vinyle se décolle au lavage à haute température."]),
             laser(OK, "Gravure au CO2 (Mira 9S) : dépoli net, sans chaleur de presse.",
                   co2=(OK, "Le CO2 dépolit le verre : le bon laser pour cette matière."),
                   diode=(NON, "La diode traverse ou rate le verre : déconseillée."),
                   fibre=(NON, "Le laser fibre ne grave pas le verre."),
                   attention=["Un verre trempé ou très mince peut se fendre : essai sur une chute d'abord.",
                              "Un petit film de papier humide sur la zone aide à éviter les micro-fissures (à valider par essai).",
                              "Une gourde ronde roule : cale-la ou utilise un support rotatif ; la gravure ne se fait qu'à plat."]),
         ]),
]

# ---------------------------------------------------------------------------------------------------------------------------
# Quel article du catalogue relève de quelle fiche (js/data.js). Un article apporté par le client n'est pas listé : on choisit la matière.
# tests/methodes.test.js vérifie que chaque article du catalogue figure ici (un nouvel article sans fiche fait échouer le test).
# ---------------------------------------------------------------------------------------------------------------------------
PRODUITS = {
    "polo-essential": "polyester-100", "maillot-basket": "polyester-100", "short-basket": "polyester-100", "short-tennis": "polyester-100",
    "thermique-femme": "polyester-100", "thermique-homme": "polyester-100", "ensemble-hummel": "polyester-100", "survetement-joma": "polyester-100",
    "sweat-football-t100": "polyester-100", "jogging-homme": "polyester-100", "short-football-essentiel": "polyester-100",
    "chasuble-football": "polyester-100", "doudoune-sans-manche": "polyester-100",
    "sweat-molleton": "coton-polyester", "sweat-capuche-essentials": "coton-polyester", "tshirt-coton-femme": "coton-polyester", "polo-golf-mw500": "coton-polyester",
    "tshirt-coton-homme": "coton-polyester", "tshirt-homme-gris": "coton-polyester",
    "debardeur-fitness": "coton-100", "tshirt-fitness-femme": "coton-100",
    "short-slim-fitness": "coton-extensible", "jogging-femme": "coton-extensible",
    "veste-sans-manches": "polyester-extensible", "short-2-en-1-fitness": "polyester-extensible", "tshirt-femme-noir": "polyester-extensible",
    "sweat-viralto-axton": "polyester-extensible", "chaussettes-football": "polyester-extensible", "bandeau-running-v2": "polyester-extensible",
    "veste-micropolaire": "polaire", "gilet-polaire-velilla": "polaire",
    "tour-de-cou-morf": "microfibre", "serviette-microfibre-l": "microfibre",
    "bonnet-rider-500": "acrylique-maille", "bonnet-running-seamless": "acrylique-maille",
    "casquette-hike-100": "casquette", "casquette-chasse-100": "casquette", "casquette-tennis-tc100": "casquette",
    "sac-tube-move-100": "polyester-enduit", "sac-sport-club-100": "polyester-enduit", "sac-a-dos-arpenaz-50": "polyester-enduit",
    "sac-a-dos-travel-100": "polyester-enduit", "sac-a-dos-arpenaz-100": "polyester-enduit", "sac-a-dos-arpenaz-500": "polyester-enduit",
    "sac-a-dos-mh100": "polyester-enduit", "ceinture-running-basique-2": "polyester-enduit",
    "gourde-alu-1l": "aluminium", "gourde-fitness-750": "aluminium", "porte-cles-decapsuleur": "aluminium",
    "ouvre-bouteille-carte": "inox", "gourde-verre": "verre",
}

# Matière à proposer pour un article apporté par le client, selon ce qu'il a déclaré (js/data.js, « matieres ») :
# plusieurs fiches possibles, la première est proposée par défaut.
MATIERE_APPORTEE = {
    "polyester": ["polyester-100", "polyester-extensible", "polaire", "microfibre", "nylon", "imper-membrane", "polyester-enduit"],
    "coton": ["coton-100", "coton-polyester", "coton-extensible"],
    "inconnu": ["coton-polyester", "polyester-100"],
}
