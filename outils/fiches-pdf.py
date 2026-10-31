"""Fabrique les fiches « méthodes d'application » : un PDF par matière dans fiches/, et js/methodes-data.js (lu par l'atelier).

À lancer depuis la racine du dépôt quand le contenu change (outils/fiches_donnees.py) :   python3 outils/fiches-pdf.py
Il faut reportlab (pip install reportlab). Les PDF sont en A4 paysage, sur fond blanc (à imprimer sans gâcher d'encre),
avec le logo de Fabr'Icam et les réglages en gros.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

import fiches_donnees as D

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSSIER = os.path.join(RACINE, "fiches")
W, H = landscape(A4)
M = 12 * mm

INK, HEAT, HEAT_STRONG, MAT = "#14213d", "#e8451e", "#c2360f", "#1f6b57"
MUTED, LINE, FILM = "#55665f", "#c9d4ce", "#edf1ef"
STATUT = {
    D.OK: dict(mot="Applicable", fond="#e4f1ec", encre="#1f6b57"),
    D.PRU: dict(mot="Avec précautions", fond="#fff3e0", encre="#6b4200"),
    D.NON: dict(mot="Non applicable", fond="#fdecea", encre="#7f1d1d"),
}
NOM_METHODE = {"dtf": "DTF", "sublimation": "Sublimation", "vinyle": "Vinyle thermocollant et adhésif", "laser": "Gravure laser"}
ORDRE = ["dtf", "sublimation", "vinyle", "laser"]


# ---------------------------------------------------------------------------------------------------------------------------
# Polices : on cherche des polices avec les accents sur la machine, sinon Helvetica (toujours là, accents compris)
# ---------------------------------------------------------------------------------------------------------------------------
def charger_polices():
    cherche = {
        "Corps": ["/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "C:/Windows/Fonts/arial.ttf",
                  "/Library/Fonts/Arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"],
        "CorpsG": ["/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", "C:/Windows/Fonts/arialbd.ttf",
                   "/Library/Fonts/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
        "Titre": ["/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf", "C:/Windows/Fonts/arialnb.ttf",
                  "C:/Windows/Fonts/arialbd.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"],
    }
    noms = {}
    for nom, chemins in cherche.items():
        for chemin in chemins:
            if os.path.exists(chemin):
                pdfmetrics.registerFont(TTFont(nom, chemin))
                noms[nom] = nom
                break
        else:
            noms[nom] = "Helvetica-Bold" if nom != "Corps" else "Helvetica"
    return noms


F = charger_polices()


def couleur(c, hexa, fond=False):
    (c.setFillColor if fond else c.setStrokeColor)(hexa)


# ---------------------------------------------------------------------------------------------------------------------------
# Mesure et dessin de texte
# ---------------------------------------------------------------------------------------------------------------------------
def lignes(texte, police, taille, largeur):
    return simpleSplit(texte, police, taille, largeur) or [""]


def texte(c, t, x, y, largeur, police, taille, encre=INK, interligne=1.28, aligne="g"):
    """Écrit un paragraphe ; y = haut du bloc ; renvoie le y du dessous."""
    couleur(c, encre, True)
    c.setFont(police, taille)
    for ln in lignes(t, police, taille, largeur):
        y -= taille * interligne
        if aligne == "c":
            c.drawCentredString(x + largeur / 2, y + taille * 0.28, ln)
        else:
            c.drawString(x, y + taille * 0.28, ln)
    return y


def hauteur_texte(t, police, taille, largeur, interligne=1.28):
    return len(lignes(t, police, taille, largeur)) * taille * interligne


def pastille_statut(c, statut, x, y, hauteur=6.2 * mm, taille=9.5):
    """Étiquette de statut (couleur + mot + pictogramme dessiné, lisible aussi en noir et blanc). x, y = coin bas gauche."""
    s = STATUT[statut]
    largeur = pdfmetrics.stringWidth(s["mot"], F["CorpsG"], taille) + hauteur + 4 * mm
    couleur(c, s["fond"], True); couleur(c, s["encre"])
    c.setLineWidth(0.9)
    c.roundRect(x, y, largeur, hauteur, 1.2 * mm, stroke=1, fill=1)
    cx, cy, r = x + hauteur * 0.62, y + hauteur / 2, hauteur * 0.27
    couleur(c, s["encre"], True)
    c.circle(cx, cy, r, stroke=0, fill=1)
    c.setStrokeColor("#ffffff"); c.setLineWidth(1.1)
    if statut == D.OK:
        c.line(cx - r * 0.5, cy, cx - r * 0.1, cy - r * 0.45); c.line(cx - r * 0.1, cy - r * 0.45, cx + r * 0.55, cy + r * 0.5)
    elif statut == D.PRU:
        c.line(cx, cy + r * 0.55, cx, cy - r * 0.05); c.circle(cx, cy - r * 0.5, 0.4, stroke=0, fill=1)
        c.setFillColor("#ffffff"); c.circle(cx, cy - r * 0.5, 0.45, stroke=0, fill=1)
    else:
        c.line(cx - r * 0.45, cy - r * 0.45, cx + r * 0.45, cy + r * 0.45); c.line(cx - r * 0.45, cy + r * 0.45, cx + r * 0.45, cy - r * 0.45)
    couleur(c, s["encre"], True)
    c.setFont(F["CorpsG"], taille)
    c.drawString(x + hauteur + 1.2 * mm, y + hauteur / 2 - taille * 0.34, s["mot"])
    return largeur


# ---------------------------------------------------------------------------------------------------------------------------
# Cadre commun des pages
# ---------------------------------------------------------------------------------------------------------------------------
class Doc:
    def __init__(self, chemin, matiere, total):
        self.c = canvas.Canvas(chemin, pagesize=(W, H))
        self.c.setTitle("Fiche matière : " + matiere["nom"])
        self.c.setAuthor("Fabr'Icam Flocage")
        self.c.setSubject("Méthodes d'application du marquage, atelier")
        self.matiere, self.total, self.n = matiere, total, 0

    def page(self, etiquette, titre):
        c = self.c
        if self.n:
            c.showPage()
        self.n += 1
        c.setFillColor("#ffffff"); c.rect(0, 0, W, H, stroke=0, fill=1)
        logo = os.path.join(RACINE, "img", "logo-fabricam.png")
        hl = 15 * mm
        if os.path.exists(logo):
            c.drawImage(logo, M, H - M - hl, width=hl * 900 / 880, height=hl, mask="auto")
        x = M + hl * 900 / 880 + 6 * mm
        texte(c, etiquette.upper(), x, H - M + 0.5 * mm, W - x - M, F["Titre"], 9.5, HEAT_STRONG)
        taille = 26
        while pdfmetrics.stringWidth(titre, F["Titre"], taille) > W - x - M - 70 * mm and taille > 14:
            taille -= 1
        couleur(c, INK, True); c.setFont(F["Titre"], taille)
        c.drawString(x, H - M - 11.5 * mm, titre)
        if self.n > 1:   # rappel de la matière en haut à droite
            c.setFont(F["Titre"], 12); couleur(c, MUTED, True)
            c.drawRightString(W - M, H - M - 11.5 * mm, self.matiere["nom"])
        y = H - M - hl - 3 * mm
        couleur(c, INK); c.setLineWidth(1.4); c.line(M, y, W - M, y)
        couleur(c, HEAT, True); c.rect(M, y - 1.4, 34 * mm, 3.2, stroke=0, fill=1)
        # pied de page
        c.setFont(F["Corps"], 8); couleur(c, MUTED, True)
        c.drawString(M, M - 4 * mm, "Fabr'Icam Flocage, atelier · Fiche matière : " + self.matiere["nom"] + " · mise à jour " + D.MAJ)
        c.drawRightString(W - M, M - 4 * mm, "Page %d / %d" % (self.n, self.total))
        couleur(c, LINE); c.setLineWidth(0.6); c.line(M, M - 1.5 * mm, W - M, M - 1.5 * mm)
        return y - 6 * mm   # haut de la zone de contenu

    def fin(self):
        self.c.save()


BAS = M + 2 * mm   # le contenu ne descend pas sous ce y


def etiquette_champ(c, t, x, y, encre=MUTED):
    couleur(c, encre, True); c.setFont(F["CorpsG"], 8.5)
    c.drawString(x, y, t.upper())


# ---------------------------------------------------------------------------------------------------------------------------
# Éléments réutilisables : cases de réglages, étapes, points d'attention
# ---------------------------------------------------------------------------------------------------------------------------
def cases_reglages(c, reglages, y, hauteur=33 * mm):
    """Une rangée de grandes cases (réglage en gros). Renvoie le y du dessous."""
    n = len(reglages)
    ecart = 4 * mm
    larg = (W - 2 * M - (n - 1) * ecart) / n
    for i, (lib, val) in enumerate(reglages):
        x = M + i * (larg + ecart)
        couleur(c, FILM, True); couleur(c, INK); c.setLineWidth(1.3)
        c.rect(x, y - hauteur, larg, hauteur, stroke=1, fill=1)
        etiquette_champ(c, lib, x + 3 * mm, y - 6 * mm)
        taille = 30
        # une valeur courte tient sur une seule ligne (« 190 à 200 °C » ne se coupe pas avant l'unité) ; sinon elle passe à la ligne
        if len(val) <= 16:
            while taille > 18 and pdfmetrics.stringWidth(val, F["Titre"], taille) > larg - 6 * mm:
                taille -= 1
            if pdfmetrics.stringWidth(val, F["Titre"], taille) > larg - 6 * mm:
                taille = 30
        while taille > 11 and (hauteur_texte(val, F["Titre"], taille, larg - 6 * mm, 1.05) > hauteur - 12 * mm
                               or max(pdfmetrics.stringWidth(w, F["Titre"], taille) for w in val.split()) > larg - 6 * mm):
            taille -= 1
        h = hauteur_texte(val, F["Titre"], taille, larg - 6 * mm, 1.05)
        texte(c, val, x + 3 * mm, y - 8 * mm - (hauteur - 12 * mm - h) / 2, larg - 6 * mm, F["Titre"], taille, INK, 1.05)
    return y - hauteur


def etapes(c, liste, x, y, largeur, ymin, titre="MARCHE À SUIVRE"):
    """Étapes numérotées ; on prend la plus grande taille de texte qui tient jusqu'à ymin."""
    etiquette_champ(c, titre, x, y, HEAT_STRONG)
    y -= 4 * mm
    for taille in (12, 11.5, 11, 10.5, 10, 9.5, 9, 8.5, 8):
        total = sum(max(hauteur_texte(s, F["Corps"], taille, largeur - 9 * mm), 7 * mm) + 2.2 * mm for s in liste)
        if y - total >= ymin:
            break
    for i, s in enumerate(liste, 1):
        h = max(hauteur_texte(s, F["Corps"], taille, largeur - 9 * mm), 6.4 * mm)
        couleur(c, HEAT, True); c.circle(x + 3.1 * mm, y - 3.6 * mm, 3.1 * mm, stroke=0, fill=1)
        c.setFillColor("#ffffff"); c.setFont(F["CorpsG"], 9); c.drawCentredString(x + 3.1 * mm, y - 4.8 * mm, str(i))
        texte(c, s, x + 9 * mm, y - 0.6 * mm, largeur - 9 * mm, F["Corps"], taille, INK)
        y -= h + 2.2 * mm
    return y


def attention(c, points, x, y, largeur, ymin, titre="À SURVEILLER"):
    """Encadré de points d'attention (barre rouge à gauche)."""
    if not points:
        return y
    for taille in (11, 10.5, 10, 9.5, 9, 8.5, 8, 7.5):
        total = 9 * mm + sum(hauteur_texte(p, F["Corps"], taille, largeur - 11 * mm) + 2.4 * mm for p in points)
        if y - total >= ymin:
            break
    total = 9 * mm + sum(hauteur_texte(p, F["Corps"], taille, largeur - 11 * mm) + 2.4 * mm for p in points)
    couleur(c, "#fff8f5", True); c.rect(x, y - total, largeur, total, stroke=0, fill=1)
    couleur(c, HEAT, True); c.rect(x, y - total, 1.6 * mm, total, stroke=0, fill=1)
    etiquette_champ(c, titre, x + 5 * mm, y - 6 * mm, HEAT_STRONG)
    yy = y - 8 * mm
    for p in points:
        couleur(c, HEAT, True); c.circle(x + 6.2 * mm, yy - 3.2 * mm, 0.9 * mm, stroke=0, fill=1)
        yy = texte(c, p, x + 9 * mm, yy, largeur - 11 * mm, F["Corps"], taille, INK) - 2.4 * mm
    return y - total


def source(c, t, y):
    if t:
        texte(c, "Source : " + t, M, y, W - 2 * M, F["Corps"], 8.5, MUTED)


# ---------------------------------------------------------------------------------------------------------------------------
# Marches à suivre
# ---------------------------------------------------------------------------------------------------------------------------
def marche_dtf(m):
    return [
        "Chauffe la presse sur la température de la fiche. Toute presse convient si elle monte à 160 °C avec une pression uniforme sur le plateau (21 × 28 cm).",
        "Pré-presse le vêtement 5 s, à plat : les plis et l'humidité partent.",
        "Pose le transfert face encre contre le tissu, bien droit, à l'emplacement repéré sur la fiche de fabrication. Évite coutures, fermetures et boutons sous le plateau.",
        "Recouvre le transfert d'une feuille de protection (papier sulfurisé ou téflon).",
        "Presse avec les réglages ci-dessus, sans bouger la presse pendant le temps.",
        "Retire le film à chaud ou à froid, d'un geste régulier.",
        "Finition recommandée : represse 10 s avec du papier kraft, pression moyenne. Le fini est mat et la tenue meilleure.",
        "Contrôle les bords. Un coin qui n'a pas pris : remets le film et represse en serrant un peu plus. Coche « pressée » sur la fiche de fabrication.",
        "Dis au client : lavage à 40 °C maximum, vêtement retourné, pas de sèche-linge à haute température.",
    ]


def marche_sublimation(m):
    return [
        "Chauffe la presse à 190-200 °C. Vérifie que la planche est imprimée à l'endroit (sans effet miroir).",
        "Vêtement blanc ou très clair, propre et sec. Pré-presse 5 s pour chasser les plis et l'humidité.",
        "Pose la planche face imprimée contre le vêtement et fixe-la avec du ruban haute température : elle ne doit pas bouger.",
        "Glisse une feuille de papier propre à l'intérieur du vêtement et pose-en une autre sur la planche : le plateau et le dos du vêtement restent nets.",
        "Presse 40 à 60 s, pression moyenne à forte, sans ouvrir la presse.",
        "Retire la planche doucement, à chaud ou à froid selon le support.",
        "Contrôle : couleurs vives, aucun double contour. Un double contour = la planche a bougé : la pièce est à refaire.",
        "Dis au client : lavage à 30-40 °C, sans javel.",
    ]


def marche_vinyle_chaud(m):
    return [
        "Découpe le motif en miroir (à l'envers), face brillante du support vers le haut. Prénoms et numéros : traits d'au moins 1,5 mm.",
        "Désherbe : retire tout ce qui n'est pas le motif, sans déchirer les détails.",
        "Pré-presse le vêtement 2 à 3 s, à plat.",
        "Pose le motif, support transparent vers le haut, à l'emplacement de la fiche de fabrication.",
        "Presse avec les réglages du tableau de la page précédente, pour le vinyle choisi.",
        "Retire le support selon le type : à froid pour le flock, tiède pour le réfléchissant, sinon selon la fiche du rouleau.",
        "Attends 24 h avant le premier lavage. Lavage à 40 °C maximum, sans javel, ne jamais repasser sur le motif.",
        "Contrôle les bords et les détails fins. Un bord relevé : repose le support et represse 5 s.",
    ]


def marche_vinyle_adhesif(m):
    return [
        "Nettoie la surface à l'alcool et laisse sécher : elle doit être propre, sèche et dégraissée.",
        "Découpe le motif (pas en miroir), désherbe, puis pose le papier de transfert dessus et frotte.",
        "Présente le motif à sec, repère sa place avec un bout de ruban sur un côté.",
        "Retire le support, pose le motif de l'axe vers les bords et lisse à la raclette pour chasser les bulles.",
        "Retire le papier de transfert lentement, en le repliant sur lui-même. Un bord qui reste accroché : repose le papier et lisse encore.",
        "Laisse 24 h avant de remplir ou de laver la pièce, et lave-la à la main.",
    ]


SECURITE_LASER = [
    "Lunettes de protection adaptées à CHAQUE laser (la longueur d'onde du CO2, de la diode et de la fibre n'est pas la même), capot fermé quand la machine en a un.",
    "Extraction ou ventilation en marche pendant toute la gravure ; ne laisse jamais la machine sans surveillance ; extincteur à portée.",
    "Ne grave jamais de PVC ou de vinyle contenant du chlore (il dégage un gaz corrosif et toxique) : le vinyle de découpe se colle, il ne se grave pas.",
]


def marche_laser(m):
    return [
        "Vérifie le modèle de ta machine et choisis le laser du tableau : un laser qui n'est pas dans la colonne « Applicable » ne doit pas servir.",
        "Nettoie la pièce, retire les films de protection, cale-la pour qu'elle ne bouge pas (une gourde ronde roule).",
        "Règle la mise au point (distance focale de ta machine), sur la surface de gravure.",
        "Fais la grille d'essai de la page suivante sur une chute, ou sur une zone cachée de la pièce. Commence bas et monte par paliers.",
        "Choisis la case la plus nette, note ses réglages (cadre « Réglages retenus »), puis grave le motif.",
        "Préfère plusieurs passes à une puissance maximale : la matière chauffe moins et la gravure est plus propre.",
        "Nettoie à l'alcool, contrôle, puis coche « pressée » sur la fiche de fabrication.",
    ]


# ---------------------------------------------------------------------------------------------------------------------------
# Les pages d'une fiche
# ---------------------------------------------------------------------------------------------------------------------------
def methode(mat, mid):
    return next(x for x in mat["methodes"] if x["id"] == mid)


def statut_couleur(m, cle):
    return m["couleurs"].get(cle, m["statut"])


def page_resume(doc, mat, produits):
    c = doc.c
    y = doc.page("Méthodes d'application", mat["nom"])
    larg_g = 112 * mm
    # colonne gauche : de quoi on parle
    yy = y
    etiquette_champ(c, "Matière", M, yy - 3 * mm, HEAT_STRONG)
    yy = texte(c, mat["compo"][0].upper() + mat["compo"][1:], M, yy - 4 * mm, larg_g, F["Titre"], 14, INK, 1.2)
    yy = texte(c, mat["resume"], M, yy - 2 * mm, larg_g, F["Corps"], 11, INK, 1.32) - 3 * mm
    if produits:
        etiquette_champ(c, "Articles du catalogue concernés", M, yy - 3 * mm, HEAT_STRONG)
        yy -= 5 * mm
        for taille in (10, 9.5, 9, 8.5, 8, 7.5):
            h = sum(hauteur_texte(p, F["Corps"], taille, larg_g - 4 * mm, 1.2) + 0.8 * mm for p in produits)
            if yy - h >= BAS + 34 * mm:
                break
        for p in produits:
            couleur(c, HEAT, True); c.circle(M + 1 * mm, yy - taille * 0.3 - 0.6 * mm, 0.7 * mm, stroke=0, fill=1)
            yy = texte(c, p, M + 4 * mm, yy, larg_g - 4 * mm, F["Corps"], taille, INK, 1.2) - 0.8 * mm
    else:
        yy = texte(c, "Aucun article du catalogue : cette matière concerne les vêtements que le client apporte.", M, yy, larg_g, F["Corps"], 10, MUTED) - 2 * mm

    # colonne droite : tableau des méthodes
    x0 = M + larg_g + 10 * mm
    lt = W - M - x0
    etiquette_champ(c, "Ce qu'on peut faire sur cette matière", x0, y - 3 * mm, HEAT_STRONG)
    ty = y - 7 * mm
    col_m, col_c = 31 * mm, (lt - 31 * mm) / 2
    ent = 6.4 * mm
    couleur(c, INK, True); c.rect(x0, ty - ent, lt, ent, stroke=0, fill=1)
    c.setFillColor("#ffffff"); c.setFont(F["CorpsG"], 9)
    c.drawString(x0 + 2 * mm, ty - ent + 2 * mm, "Méthode")
    c.drawString(x0 + col_m + 2 * mm, ty - ent + 2 * mm, "Couleur claire")
    c.drawString(x0 + col_m + col_c + 2 * mm, ty - ent + 2 * mm, "Couleur foncée")
    ty -= ent
    for mid in ORDRE:
        m = methode(mat, mid)
        sc, sf = statut_couleur(m, "clair"), statut_couleur(m, "fonce")
        hr = hauteur_texte(m["raison"], F["Corps"], 8.8, lt - 4 * mm, 1.22)
        hl = 7.2 * mm + hr + 2 * mm
        couleur(c, LINE); c.setLineWidth(0.7); c.line(x0, ty - hl, x0 + lt, ty - hl)
        couleur(c, INK, True); c.setFont(F["CorpsG"], 10.5)
        c.drawString(x0 + 2 * mm, ty - 6 * mm, NOM_METHODE[mid].split(" ")[0] if mid != "laser" else "Laser")
        pastille_statut(c, sc, x0 + col_m + 1 * mm, ty - 7.3 * mm, 5.8 * mm, 8.2)
        pastille_statut(c, sf, x0 + col_m + col_c + 1 * mm, ty - 7.3 * mm, 5.8 * mm, 8.2)
        texte(c, m["raison"], x0 + 2 * mm, ty - 7.6 * mm, lt - 4 * mm, F["Corps"], 8.8, MUTED, 1.22)
        ty -= hl
    couleur(c, FILM, True); couleur(c, LINE); c.setLineWidth(0.7)
    note_h = hauteur_texte("Toujours un essai sur une chute du même tissu avant de lancer une série. Les réglages « à valider » n'ont pas de source : l'essai les confirme.", F["Corps"], 9, lt - 6 * mm) + 6 * mm
    c.rect(x0, max(BAS, ty - 4 * mm - note_h), lt, note_h, stroke=1, fill=1)
    texte(c, "Toujours un essai sur une chute du même tissu avant de lancer une série. Les réglages « à valider » n'ont pas de source : l'essai les confirme.",
          x0 + 3 * mm, max(BAS, ty - 4 * mm - note_h) + note_h - 2.6 * mm, lt - 6 * mm, F["Corps"], 9, INK)
    texte(c, "Réglages DTF et sublimation : DTF Print, tableau de pose. Vinyles : fiches Siser et Stahls. Laser : à régler par essai.", M, BAS + 6 * mm,
          W - 2 * M, F["Corps"], 8, MUTED)


def page_dtf_ou_subl(doc, mat, mid, marche):
    c = doc.c
    m = methode(mat, mid)
    y = doc.page("Méthode · " + NOM_METHODE[mid], mat["nom"])
    xs = M
    etiquette_champ(c, "Couleur claire", xs, y - 4.6 * mm); etiquette_champ(c, "Couleur foncée", xs + 82 * mm, y - 4.6 * mm)
    pastille_statut(c, statut_couleur(m, "clair"), xs + 30 * mm, y - 6.5 * mm)
    pastille_statut(c, statut_couleur(m, "fonce"), xs + 112 * mm, y - 6.5 * mm)
    y2 = texte(c, m["raison"], xs, y - 9 * mm, W - 2 * M, F["Corps"], 11, INK, 1.25)
    y2 = cases_reglages(c, m["reglages"], y2 - 3 * mm)
    ymin = BAS + 9 * mm
    ytop = y2 - 7 * mm
    larg_g = 164 * mm
    etapes(c, marche(m), M, ytop, larg_g, ymin)
    attention(c, m["attention"], M + larg_g + 8 * mm, ytop, W - 2 * M - larg_g - 8 * mm, ymin)
    source(c, m["source"], BAS + 4 * mm)


def page_vinyle_tableau(doc, mat):
    c = doc.c
    m = methode(mat, "vinyle")
    y = doc.page("Méthode · " + NOM_METHODE["vinyle"], mat["nom"])
    pastille_statut(c, statut_couleur(m, "clair"), M + 24 * mm, y - 6.5 * mm)
    etiquette_champ(c, "Résumé", M, y - 4.6 * mm)
    y = texte(c, m["raison"], M + 64 * mm, y - 1 * mm, W - 2 * M - 64 * mm, F["Corps"], 11, INK, 1.25) - 3 * mm
    types = [t for t in m["types"] if t["statut"] != D.NON or True]
    cols = [("Vinyle", 52 * mm), ("Statut", 36 * mm), ("Température", 30 * mm), ("Durée", 30 * mm), ("Pression", 32 * mm), ("Remarque", 0)]
    cols[-1] = ("Remarque", W - 2 * M - sum(w for _, w in cols[:-1]))
    ent = 7 * mm
    couleur(c, INK, True); c.rect(M, y - ent, W - 2 * M, ent, stroke=0, fill=1)
    c.setFillColor("#ffffff"); c.setFont(F["CorpsG"], 9.5)
    x = M
    for nom, w in cols:
        c.drawString(x + 2 * mm, y - ent + 2.3 * mm, nom); x += w
    y -= ent
    for t in types:
        reg = dict(t["reglages"])
        note = t["note"] or ""
        if t["statut"] == D.NON:
            note = note or "Ne convient pas à cette matière."
        hreg = max([hauteur_texte(reg.get(k, "–"), F["Titre"], 9.5, w - 3 * mm, 1.15) for k, (_, w) in zip(["Température", "Durée", "Pression"], cols[2:5])] + [0])
        hn = max(hauteur_texte(note, F["Corps"], 9, cols[-1][1] - 4 * mm, 1.2), hauteur_texte(t["nom"] + " " + t["ex"], F["Corps"], 9, cols[0][1] - 4 * mm, 1.2), hreg, 8 * mm)
        hl = hn + 4.5 * mm
        if y - hl < BAS + 8 * mm:
            break
        couleur(c, LINE); c.setLineWidth(0.7); c.line(M, y - hl, W - M, y - hl)
        grise = t["statut"] == D.NON
        enc = MUTED if grise else INK
        x = M
        couleur(c, enc, True); c.setFont(F["CorpsG"], 10); c.drawString(x + 2 * mm, y - 5.4 * mm, t["nom"])
        texte(c, t["ex"], x + 2 * mm, y - 6 * mm, cols[0][1] - 3 * mm, F["Corps"], 8, MUTED, 1.15)
        x += cols[0][1]
        pastille_statut(c, t["statut"], x + 1 * mm, y - 8.3 * mm, 6 * mm, 8.2)
        x += cols[1][1]
        for cle, (_, w) in zip(["Température", "Durée", "Pression"], cols[2:5]):
            v = "–" if grise else reg.get(cle, "–")
            taille = 12 if cle != "Pression" else 10
            texte(c, v, x + 2 * mm, y - 3 * mm, w - 3 * mm, F["Titre"], taille if len(v) < 12 else 9.5, enc, 1.15)
            x += w
        texte(c, note, x + 2 * mm, y - 2.4 * mm, cols[-1][1] - 4 * mm, F["Corps"], 9, enc, 1.2)
        y -= hl
    if m["attention"]:
        attention(c, m["attention"], M, y - 5 * mm, W - 2 * M, BAS + 4 * mm)
    source(c, "Siser (EasyWeed, Stretch, Glitter, EasyReflective) et Stahls (Flock), fiches relevées le 20/10/2026. Les pelages notés « selon la fiche du rouleau » dépendent de la référence achetée.", BAS + 4 * mm)


def page_vinyle_marche(doc, mat):
    c = doc.c
    m = methode(mat, "vinyle")
    chaud = any(t["id"] != "adhesif" and t["statut"] != D.NON for t in m["types"])
    adhesif = next((t for t in m["types"] if t["id"] == "adhesif" and t["statut"] != D.NON), None)
    y = doc.page("Méthode · " + NOM_METHODE["vinyle"] + " · marche à suivre", mat["nom"])
    if chaud and adhesif:
        larg = (W - 2 * M - 8 * mm) / 2
        etapes(c, marche_vinyle_chaud(m), M, y, larg, BAS + 4 * mm, "VINYLE THERMOCOLLANT, À LA PRESSE")
        etapes(c, marche_vinyle_adhesif(m), M + larg + 8 * mm, y, larg, BAS + 4 * mm, "VINYLE ADHÉSIF, SANS CHALEUR")
    elif chaud:
        etapes(c, marche_vinyle_chaud(m), M, y, 164 * mm, BAS + 4 * mm)
        attention(c, m["attention"] or ["Essai sur une chute avant la série."], M + 172 * mm, y, W - 2 * M - 172 * mm, BAS + 4 * mm)
    else:
        etapes(c, marche_vinyle_adhesif(m), M, y, 164 * mm, BAS + 4 * mm)
        attention(c, m["attention"] or ["Essai sur une chute avant la série."], M + 172 * mm, y, W - 2 * M - 172 * mm, BAS + 4 * mm)


def page_laser_machines(doc, mat):
    c = doc.c
    m = methode(mat, "laser")
    y = doc.page("Méthode · " + NOM_METHODE["laser"], mat["nom"])
    pastille_statut(c, m["statut"], M, y - 7 * mm)
    y = texte(c, m["raison"], M + 50 * mm, y - 1.5 * mm, W - 2 * M - 50 * mm, F["Corps"], 11, INK, 1.25) - 4 * mm
    cols = [("Laser", 70 * mm), ("Statut", 40 * mm), ("Sur cette matière", W - 2 * M - 110 * mm)]
    ent = 7 * mm
    couleur(c, INK, True); c.rect(M, y - ent, W - 2 * M, ent, stroke=0, fill=1)
    c.setFillColor("#ffffff"); c.setFont(F["CorpsG"], 9.5)
    x = M
    for nom, w in cols:
        c.drawString(x + 2 * mm, y - ent + 2.3 * mm, nom); x += w
    y -= ent
    for t in m["types"]:
        hn = max(hauteur_texte(t["note"], F["Corps"], 10, cols[2][1] - 4 * mm, 1.22), hauteur_texte(t["nom"], F["CorpsG"], 10.5, cols[0][1] - 4 * mm, 1.2), 8 * mm)
        hl = hn + 5 * mm
        couleur(c, LINE); c.setLineWidth(0.7); c.line(M, y - hl, W - M, y - hl)
        texte(c, t["nom"], M + 2 * mm, y - 2 * mm, cols[0][1] - 4 * mm, F["CorpsG"], 10.5, INK, 1.2)
        pastille_statut(c, t["statut"], M + cols[0][1] + 1 * mm, y - 8.3 * mm, 6 * mm, 8.2)
        texte(c, t["note"], M + cols[0][1] + cols[1][1] + 2 * mm, y - 2 * mm, cols[2][1] - 4 * mm, F["Corps"], 10, INK, 1.22)
        y -= hl
    y -= 5 * mm
    larg = (W - 2 * M - 8 * mm) / 2
    etapes(c, marche_laser(m), M, y, larg, BAS + 10 * mm)
    attention(c, SECURITE_LASER, M + larg + 8 * mm, y, larg, BAS + 10 * mm, "SÉCURITÉ, À CHAQUE FOIS")
    source(c, m["source"], BAS + 4 * mm)


def page_laser_essai(doc, mat):
    c = doc.c
    m = methode(mat, "laser")
    y = doc.page("Méthode · " + NOM_METHODE["laser"] + " · grille d'essai", mat["nom"])
    larg_g = 168 * mm
    y = texte(c, "Grave 9 petits carrés sur une chute : 3 puissances (lignes) × 3 vitesses (colonnes). Commence bas, monte par paliers. Note dans chaque case ce que tu vois "
                 "(trop clair, net, brûlé, fissuré), puis recopie la case gagnante dans « Réglages retenus ».", M, y, larg_g, F["Corps"], 11, INK, 1.3) - 5 * mm
    cw, ch = 40 * mm, 26 * mm
    x0 = M + 30 * mm
    etiquette_champ(c, "Vitesse : lente  →  rapide", x0, y - 1 * mm)
    y -= 5 * mm
    for j in range(3):
        couleur(c, FILM, True); couleur(c, INK); c.setLineWidth(1)
        c.rect(x0 + j * cw, y - 7 * mm, cw, 7 * mm, stroke=1, fill=1)
        texte(c, "Vitesse ______", x0 + j * cw + 2 * mm, y - 0.2 * mm, cw - 4 * mm, F["Corps"], 9, MUTED)
    y -= 7 * mm
    etiquette_champ(c, "Puissance", M, y - 6 * mm)
    for i, nom in enumerate(["basse", "moyenne", "haute"]):
        etiquette_champ(c, nom, M, y - i * ch - 14 * mm, INK)
        for j in range(3):
            couleur(c, "#ffffff", True); couleur(c, INK); c.setLineWidth(1)
            c.rect(x0 + j * cw, y - (i + 1) * ch, cw, ch, stroke=1, fill=1)
            texte(c, "% ______", x0 + j * cw + 2 * mm, y - i * ch - 0.2 * mm, cw - 4 * mm, F["Corps"], 9, MUTED)
    yb = y - 3 * ch - 6 * mm
    etiquette_champ(c, "Réglages retenus (à recopier)", M, yb - 1 * mm, HEAT_STRONG)
    yb -= 6 * mm
    couleur(c, INK); c.setLineWidth(1)
    c.rect(M, yb - 18 * mm, larg_g, 18 * mm, stroke=1, fill=0)
    x = M + 3 * mm
    for lib in ["Puissance ____ %", "Vitesse ______", "Passes ____", "Fréquence ______", "Laser : ______"]:
        texte(c, lib, x, yb - 3 * mm, 36 * mm, F["Corps"], 10, INK); x += 32 * mm
    texte(c, "Date : ________   Pièce : ______________________   Machine : ______________", M + 3 * mm, yb - 11 * mm, larg_g - 6 * mm, F["Corps"], 10, INK)
    xd = M + larg_g + 8 * mm
    attention(c, m["attention"], xd, y + 7 * mm + 5 * mm, W - M - xd, BAS + 4 * mm, "SUR CETTE MATIÈRE")


def pages_prevues(mat):
    """Ordre des pages : [(clé, fonction)], pour numéroter les pages avant de les dessiner."""
    pages = [("resume", None)]
    for mid in ORDRE:
        m = methode(mat, mid)
        if m["statut"] == D.NON and not any(v != D.NON for v in m["couleurs"].values()):
            continue
        if mid == "vinyle":
            pages += [("vinyle", "tableau"), ("vinyle", "marche")]
        elif mid == "laser":
            pages += [("laser", "machines"), ("laser", "essai")]
        else:
            pages.append((mid, None))
    return pages


def fabrique(mat, produits):
    pages = pages_prevues(mat)
    chemin = os.path.join(DOSSIER, mat["id"] + ".pdf")
    doc = Doc(chemin, mat, len(pages))
    numero = {}
    for i, (cle, sous) in enumerate(pages, 1):
        numero.setdefault(cle, i)
        if cle == "resume":
            page_resume(doc, mat, produits)
        elif cle == "dtf":
            page_dtf_ou_subl(doc, mat, "dtf", marche_dtf)
        elif cle == "sublimation":
            page_dtf_ou_subl(doc, mat, "sublimation", marche_sublimation)
        elif cle == "vinyle":
            if sous == "tableau":
                page_vinyle_tableau(doc, mat)
            else:
                page_vinyle_marche(doc, mat)
        elif cle == "laser":
            if sous == "machines":
                page_laser_machines(doc, mat)
            else:
                page_laser_essai(doc, mat)
    doc.fin()
    return numero, len(pages)


# ---------------------------------------------------------------------------------------------------------------------------
# Noms des articles du catalogue (lus dans js/data.js sans Node : l'identifiant, puis le nom à quelques lignes de là)
# ---------------------------------------------------------------------------------------------------------------------------
def noms_catalogue():
    chemin = os.path.join(RACINE, "js", "data.js")
    noms, dernier = {}, None
    with open(chemin, encoding="utf-8") as f:
        lignes_data = f.read().split("\n")
    for i, ln in enumerate(lignes_data):
        m = re.match(r'^      id: "([a-z0-9-]+)",', ln)
        if m:
            for suite in lignes_data[i + 1:i + 6]:
                n = re.match(r'^      nom: "(.+)",\s*$', suite)
                if n:
                    noms[m.group(1)] = n.group(1).replace('\\"', '"')
                    break
    return noms


def principal():
    os.makedirs(DOSSIER, exist_ok=True)
    noms = noms_catalogue()
    inconnus = [p for p in D.PRODUITS if p not in noms]
    if inconnus:
        sys.exit("Articles de fiches_donnees.PRODUITS absents de js/data.js : " + ", ".join(inconnus))
    donnees = dict(maj=D.MAJ, matieres=[], produits=dict(D.PRODUITS), matiereApportee=D.MATIERE_APPORTEE, contactDtf=D.CONTACT_DTF)
    for mat in D.MATIERES:
        produits = [noms[p] for p, fid in D.PRODUITS.items() if fid == mat["id"]]
        numero, total = fabrique(mat, produits)
        out = dict(id=mat["id"], nom=mat["nom"], groupe=mat["groupe"], compo=mat["compo"], resume=mat["resume"],
                   pdf="fiches/" + mat["id"] + ".pdf", pages=numero, nbPages=total, methodes=[])
        for m in mat["methodes"]:
            e = dict(id=m["id"], statut=m["statut"], raison=m["raison"],
                     clair=statut_couleur(m, "clair"), fonce=statut_couleur(m, "fonce"),
                     reglages=[list(r) for r in m.get("reglages", [])], attention=m["attention"], source=m["source"])
            if m.get("types"):
                e["types"] = [dict(id=t["id"], nom=t["nom"], statut=t["statut"], note=t.get("note", ""),
                                   reglages=[list(r) for r in t.get("reglages", [])]) for t in m["types"]]
            out["methodes"].append(e)
        donnees["matieres"].append(out)
        print("  fiches/%s.pdf : %d pages" % (mat["id"], total))
    with open(os.path.join(RACINE, "js", "methodes-data.js"), "w", encoding="utf-8") as f:
        f.write("/* Données des fiches « méthodes d'application » (matières, méthodes applicables, réglages, pages des PDF).\n"
                "   Fichier généré par outils/fiches-pdf.py à partir de outils/fiches_donnees.py : ne pas modifier à la main. */\n"
                "window.MethodesData = " + json.dumps(donnees, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("js/methodes-data.js écrit.")


if __name__ == "__main__":
    principal()
