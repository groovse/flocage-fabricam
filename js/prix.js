/*
 * TARIFS ET RÈGLES — c'est le seul fichier à modifier quand un prix change.
 * Mis à jour le 18/10/2026 d'après sprint-transfert.com (délai Standard 48/72h).
 *
 * - Les prix des planches Sprint sont affichés HT sur leur site (sprintPrixHT: true).
 *   Le site les convertit en TTC avec la TVA ci-dessous. Si tu vois au panier que ce sont
 *   déjà des TTC, passe sprintPrixHT à false.
 * - Prix d'achat des vêtements : dans data.js (champ prixAchat, TTC, retrait en magasin).
 */
window.PRIX = {
  maj: "2026-10-18",

  tva: 0.20,
  sprintPrixHT: true,

  // Livraison Sprint : Colissimo 4,90 € ; offerte dès 100 € de commande.
  livraison: { seuilGratuit: 100, colissimo: 4.90 },

  // Règle de prix de vente (appliquée au prix unitaire de la commande)
  regles: {
    pas: 2.5,       // on arrondit au supérieur de 2,50 € en 2,50 €
    margeMin: 2,    // la marge totale de la commande doit dépasser 2 €
    ajout: 1        // sinon on ajoute 1 € par pièce, et on revérifie
    // Chaque produit a son propre prix unitaire : coût moyen de ses pièces (produit, part des planches
    // et de la livraison), arrondi au supérieur de 2,50 €.
  },

  // Pack (plusieurs produits vendus ensemble) : remise en € retirée du prix par pack complet,
  // après l'arrondi. La marge de la commande reste vérifiée.
  packs: { remise: 2.5 },

  // Placement des motifs sur les planches.
  // ecart = marge de coupe entre deux motifs, en cm. À 0, quatre A6 tiennent exactement sur une A4
  // (leurs A6 font 10 x 14 cm) : les cases se touchent, chaque visuel garde sa marge à l'intérieur.
  // Monte à 0.3 si tu préfères plus de marge pour couper (la facture de planches augmente un peu).
  placement: { ecart: 0, rotation: true },

  // Plateau de ta presse : limite A4, aucun motif ne doit dépasser
  plateau: { w: 21, h: 28 },

  // Dimensions des tailles de motif (identiques aux formats de planche Sprint)
  formatsMotif: {
    A6: { w: 10, h: 14, nom: "A6" },
    A5: { w: 14, h: 21, nom: "A5" },
    A4: { w: 21, h: 28, nom: "A4" }
  },

  // Planches vendues par Sprint Transfert (prix HT, délai standard)
  planches: {
    dtf: {
      nom: "DTF",
      formats: [
        { id: "A6", nom: "A6 (10 × 14 cm)", w: 10, h: 14, prix: 2.40 },
        { id: "A5", nom: "A5 (14 × 21 cm)", w: 14, h: 21, prix: 3.60 },
        { id: "A4", nom: "A4 (21 × 28 cm)", w: 21, h: 28, prix: 5.04 },
        { id: "A3", nom: "A3 (28 × 42 cm)", w: 28, h: 42, prix: 8.16 },
        { id: "A2", nom: "A2 (42 × 57 cm)", w: 42, h: 57, prix: 15.30 },
        { id: "1m", nom: "1 mètre (57 × 100 cm)", w: 57, h: 100, prix: 28.80 },
        { id: "2m", nom: "2 mètres (57 × 200 cm)", w: 57, h: 200, prix: 49.92 },
        { id: "4m", nom: "4 mètres (57 × 400 cm)", w: 57, h: 400, prix: 91.20 }
      ]
    },
    sublimation: {
      nom: "Sublimation",
      formats: [
        { id: "P7", nom: "Petit format (7 × 7 cm)", w: 7, h: 7, prix: 2.50 },
        { id: "A4", nom: "A4 (21 × 28 cm)", w: 21, h: 28, prix: 5.25 },
        { id: "A3", nom: "A3 (28 × 42 cm)", w: 28, h: 42, prix: 7.50 },
        { id: "A2", nom: "A2 (42 × 57 cm)", w: 42, h: 57, prix: 13.90 },
        { id: "1m", nom: "1 mètre (57 × 100 cm)", w: 57, h: 100, prix: 26.90 }
      ]
    }
  },

  // Remises de Sprint selon le nombre de planches identiques commandées.
  // Format : { min: nombre de planches, pct: remise entre 0 et 1 }.
  // À compléter avec le tableau « Quantité & prix » de leurs pages produit.
  remises: {
    dtf: [],
    sublimation: []
  },

  // Réglages de presse conseillés (affichés dans l'espace atelier)
  presse: {
    dtf_polyester: "DTF sur polyester : environ 135 °C pendant 10 s, pression moyenne, pelage à froid. Teinture sensible (marine, noir, rouge) : fais d'abord un essai sur une chute ou un polo d'essai.",
    dtf_autre: "DTF sur coton ou mélange : 150 °C pendant 15 s avec une feuille de protection, pelage à chaud ou à froid (protocole Sprint).",
    sublimation: "Sublimation : polyester blanc ou très clair uniquement, visuel sans blanc. Sprint annonce 180 °C sur sa page ; valide durée et pression par un essai."
  }
};
