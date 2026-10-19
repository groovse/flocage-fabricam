/*
 * TARIFS ET RÈGLES — c'est le seul fichier à modifier quand un prix change.
 * Mis à jour le 18/10/2026 d'après dtfprint.fr (DTF Print, Port-de-Bouc, 13). Avant : Sprint Transfert (voir CHANGELOG, version 3.0.0).
 *
 * - Les prix des planches DTF Print sont affichés TTC sur leur site (prixPlanchesHT: false).
 *   Si tu passes à un fournisseur qui affiche des prix HT, mets prixPlanchesHT à true : le site ajoute la TVA ci-dessous.
 * - Prix d'achat des vêtements : dans data.js (champ prixAchat, TTC, retrait en magasin). Une couleur au prix différent
 *   porte son propre prixAchat (voir data.js).
 */
window.PRIX = {
  maj: "2026-10-18",

  // Fournisseur des planches de transfert (affiché dans l'espace atelier)
  fournisseur: {
    nom: "DTF Print",
    ville: "Port-de-Bouc (13)",
    url: "https://www.dtfprint.fr/",
    tarifs: "https://www.dtfprint.fr/prix-impression-dtf/",
    delai: "Fabrication en 1 jour ouvré (commande avant 12 h), livraison en 2 jours ouvrés. Retrait gratuit à l'atelier de Port-de-Bouc.",
    fichier: "PNG ou PDF sans fond, aux dimensions exactes de la planche choisie, 300 dpi, à l'endroit (pas de miroir), sans ombre ni lueur."
  },

  tva: 0.20,
  prixPlanchesHT: false,

  // Livraison : offerte dès 100 € TTC de transferts. En dessous, DTF Print affiche le prix au panier :
  // 4,90 € est une ESTIMATION (colis postal). Corrige-le ici quand tu connais le montant réel.
  livraison: { seuilGratuit: 100, colissimo: 4.90 },

  // Articles vendus par un vendeur partenaire de la place de marché Decathlon (pas de retrait en magasin) :
  // le vendeur livre à Fabr'Icam et fait payer des frais de port, une seule fois par vendeur et par commande.
  // Decathlon n'affiche ces frais qu'au moment de la commande : 4,99 € est une ESTIMATION (livraison à Toulouse, 31300).
  // Quand tu connais le montant réel (panier Decathlon), corrige-le ici : « defaut » sert aux vendeurs non listés.
  // lien : la page du vendeur sur Decathlon (bouton « Voir chez le vendeur » du catalogue et de l'atelier). Sans lien, le bouton
  // ouvre la page de l'article chez ce vendeur.
  livraisonVendeur: {
    defaut: 4.99,
    vendeurs: {
      "sport-et-go-eu": { nom: "Sport & Go EU", frais: 4.99, delai: "2 à 6 jours", lien: "https://www.decathlon.fr/mp/seller/sport-et-go-eu/bd0b305e-763b-4fc8-ad3c-2d5d4859a3fb" },
      "pertemba-fr": { nom: "Pertemba FR", frais: 4.99, delai: "", lien: "" },
      "atelier-katanga": { nom: "Atelier Katanga", frais: 4.99, delai: "", lien: "" }
    }
  },

  // Règle de prix de vente : chaque produit a son propre prix unitaire, égal au coût moyen de ses pièces
  // (vêtement + part des planches + part de la livraison) augmenté de la marge moyenne, arrondi au supérieur de `pas`.
  //
  // Une pièce vendue seule : 1 € de marge par motif à presser, 2 € au maximum par pièce.
  //   parMotif    : 1.00 = chaque élément posé sur la pièce compte (un visuel, un prénom, un numéro : trois motifs = 3 €, plafonnés à 2 €).
  //                 Une pièce sans aucun motif ne porte aucune marge.
  //   maxParPiece : 2.00 = la marge d'une pièce ne dépasse jamais 2 €. Mets null pour supprimer le plafond.
  //
  // Une pièce vendue dans un pack : 1 € de marge par pièce, quel que soit son nombre de motifs.
  //   parPiecePack : 1.00 = un pack de trois pièces (sans compter les chaussettes) porte donc 3 € de marge.
  //   Les chaussettes ne portent aucune marge dans un pack : leur fiche produit (data.js) déclare `margePack: 0`.
  //   Un produit peut déclarer sa propre marge de pack avec `margePack` ; sans cette ligne, c'est parPiecePack.
  //
  // Vêtements apportés par le client (« Ton vêtement ») : au-delà de `seuil` pièces apportées dans la commande (tous articles apportés
  // confondus, les vêtements Decathlon ne comptent pas), la marge de TOUTES les pièces apportées est multipliée par `facteur`.
  //   seuil : 5 = la règle joue à partir de 6 pièces apportées ; à 5 pièces ou moins, rien ne change.
  //   facteur : 0.5 = la marge est divisée par 2 : 0,50 € par motif et 1 € au plus par pièce (parMotif et maxParPiece × facteur).
  //   Mets facteur à 1 pour supprimer la règle. Elle ne touche ni les articles Decathlon ni les packs.
  //
  //   pas : 0.01 = on arrondit au centime supérieur (mets 0.5 pour arrondir de 50 centimes en 50 centimes)
  regles: {
    parMotif: 1.00,
    maxParPiece: 2.00,
    parPiecePack: 1.00,
    apporte: { seuil: 5, facteur: 0.5 },
    pas: 0.01
  },

  // Placement des motifs sur les planches.
  // ecart = marge de coupe entre deux motifs, en cm. À 0, quatre A6 tiennent exactement sur une A4
  // (leurs A6 font 10 x 14 cm) : les cases se touchent, chaque visuel garde sa marge à l'intérieur.
  // Monte à 0.3 si tu préfères plus de marge pour couper (la facture de planches augmente un peu).
  // ecartBloc = écart, en cm, entre le visuel, le prénom et le numéro d'un bloc collé (un seul transfert, pressé d'un coup).
  placement: { ecart: 0, ecartBloc: 0.5, rotation: true },

  // Plateau de ta presse : limite A4, aucun motif ne doit dépasser
  plateau: { w: 21, h: 28 },

  // Dimensions des tailles de motif (Mini et A7 : accessoires, casquettes, bonnets, gourdes...)
  formatsMotif: {
    Mini: { w: 5, h: 5, nom: "Mini" },
    A7: { w: 7, h: 10, nom: "A7" },
    A6: { w: 10, h: 14, nom: "A6" },
    A5: { w: 14, h: 21, nom: "A5" },
    A4: { w: 21, h: 28, nom: "A4" }
  },

  // Planches vendues par DTF Print (prix TTC, une planche, sans remise de quantité)
  planches: {
    dtf: {
      nom: "DTF",
      formats: [
        { id: "A4", nom: "A4 (21 × 28 cm)", w: 21, h: 28, prix: 5.50 },
        { id: "A3", nom: "A3 (28 × 42 cm)", w: 28, h: 42, prix: 8.00 },
        { id: "A2", nom: "A2 (42 × 56 cm)", w: 42, h: 56, prix: 14.00 },
        { id: "1m", nom: "1 mètre (56 × 100 cm)", w: 56, h: 100, prix: 18.00 }
      ]
    },
    sublimation: {
      nom: "Sublimation",
      formats: [
        { id: "A4", nom: "A4 (20 × 28 cm)", w: 20, h: 28, prix: 3.90 },
        { id: "A3", nom: "A3 (28 × 41 cm)", w: 28, h: 41, prix: 7.50 },
        { id: "A2", nom: "A2 (42 × 56 cm)", w: 42, h: 56, prix: 13.00 }
      ]
    }
  },

  // Remises par quantité (nombre de planches commandées) : { min: nombre de planches, pct: remise entre 0 et 1 }.
  // DTF Print baisse ses prix à partir de 10 planches (A4 : 4,00 € au lieu de 5,50 €, A3 : 6,00 € au lieu de 8,00 €,
  // A2 : 10,00 € au lieu de 14,00 €, mètre : 16,80 € au lieu de 18,00 €). Une commande de flocage en compte rarement
  // autant : on ne les applique pas, ce qui garde un prix prudent.
  remises: {
    dtf: [],
    sublimation: []
  },

  // Réglages de presse conseillés (affichés dans l'espace atelier)
  presse: {
    dtf_polyester: "DTF sur polyester ou nylon : 135 °C pendant 10 s, pression moyenne (DTF Print). Sportswear fin (lycra, softshell) : descends à 120-125 °C. Teinture sensible (marine, noir, rouge) : fais d'abord un essai sur une chute ou un polo d'essai.",
    dtf_autre: "DTF sur coton : 150 °C pendant 10 à 15 s ; mélange coton et polyester : 145 °C pendant 12 s. Mets une feuille de protection sur le transfert.",
    sublimation: "Sublimation : polyester blanc ou très clair uniquement (DTF Print admet dès 65 % de polyester, ce site exige 90 % pour un rendu net), visuel sans blanc. 190-200 °C pendant 40 à 60 s, pression moyenne à forte, face imprimée contre le vêtement. Envoie le fichier à l'endroit."
  }
};
