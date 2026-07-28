// Real customers, quoted with their permission. Shared between the homepage
// TestimonialsSection and the (auth) layout's sidebar card so both pull from a single
// source instead of hardcoding the same quote independently in two places.
export const TESTIMONIALS = [
  { quote: "J'ai montré le rendu à mes clients avant même de calculer le devis. Ils ont dit oui sur le champ. C'est devenu mon outil de vente numéro un.", name: 'Thomas B.', role: 'Paysagiste', location: 'Lyon, 69', stars: 5 },
  { quote: "En 2 minutes, j'avais 6 versions différentes du futur jardin. Le client a choisi le style méditerranéen. Le chantier commence la semaine prochaine.", name: 'Sophie L.', role: 'Architecte paysagiste', location: 'Aix-en-Provence, 13', stars: 5 },
  { quote: "Mes clients n'arrivent plus à se projeter sur les plans papier. Avec Verdia, ils voient exactement ce que ça va donner. Le taux de signature a explosé.", name: 'Marc D.', role: 'Aménageur extérieur', location: 'Bordeaux, 33', stars: 5 },
] as const
