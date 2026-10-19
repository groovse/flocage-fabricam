"""Régénère js/logo-pdf.js (le logo des PDF) à partir de img/logo-fabricam.png.

À lancer depuis la racine du dépôt quand le logo change :   python3 outils/logo-pdf.py
Il faut Pillow (pip install pillow). Les PDF se fabriquent dans le navigateur, sans réseau : le logo y est donc
embarqué en base64, en PNG RVB 8 bits sur fond blanc (le PDF n'a pas besoin de transparence), 560 px de large.
"""
import base64
import io

from PIL import Image

LARGEUR = 560

logo = Image.open("img/logo-fabricam.png").convert("RGBA")
fond = Image.new("RGB", logo.size, (255, 255, 255))
fond.paste(logo, mask=logo.getchannel("A"))
fond = fond.resize((LARGEUR, round(logo.height * LARGEUR / logo.width)), Image.LANCZOS)

tampon = io.BytesIO()
fond.save(tampon, "PNG", optimize=True)

with open("js/logo-pdf.js", "w", encoding="utf-8") as f:
    f.write(
        "/* Logo Fabr'Icam pour les PDF (PNG RVB sur fond blanc, en base64) : les PDF se fabriquent dans le navigateur, sans réseau.\n"
        "   Fichier généré à partir de img/logo-fabricam.png par outils/logo-pdf.py : ne pas modifier à la main. */\n"
        'window.LogoPdf = "' + base64.b64encode(tampon.getvalue()).decode() + '";\n'
    )
print("js/logo-pdf.js écrit :", fond.size, len(tampon.getvalue()), "octets")
