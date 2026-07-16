# Blog Verdia — Stratégie SEO

## Le constat qui conditionne tout le reste

Avant d'écrire une ligne, deux vérifications ont été faites sur le marché français.

**1. « IA jardin à partir d'une photo » est un créneau mort pour toi.**

Il est déjà occupé par des outils gratuits grand public : Fotor, ReImagine Home AI, iScape, Garden AI, Draw Me A Garden, IACrea, Ideal House, InterieurAI, Homiwork — sans compter ChatGPT, qui fait le job en une requête et dont les tutos jardin tournent en boucle sur les réseaux.

Te positionner là, c'est :
- te battre contre du **gratuit** avec une autorité de domaine dix fois supérieure ;
- attirer des **particuliers**, pas des paysagistes ;
- te faire comparer sur le prix, sur le seul axe où tu perds.

**2. « Logiciel paysagiste 3D » est un bain de sang.**

Vertuoza, Organilog, LeBonLogiciel, JardiSoft, Vertige Design se disputent ces requêtes avec des équipes contenu et des années d'antériorité. Un domaine neuf n'y existe pas avant 12 à 18 mois.

### La conclusion stratégique

**Ton moat n'est pas « générer un rendu de jardin par IA ». Fotor le fait gratuitement.**

Ton moat, c'est ce que les retours de Kevyn ont mis au jour : un rendu généré bêtement pense au jour J, pas à l'entretien futur ni à l'histoire de la cliente avec son jardin. C'est la seule chose que ni Fotor, ni ChatGPT, ni un ERP généraliste ne peuvent écrire de façon crédible — parce qu'ils n'ont pas de paysagiste relecteur.

**Le blog ne vend donc pas de l'IA. Il vend de la compétence métier, et l'IA n'est que l'outil.**

---

## Positionnement éditorial

| | |
|---|---|
| **Audience** | Paysagiste indépendant ou petite structure (1 à 10 personnes), entretien et création, qui fait ses devis lui-même |
| **Ce qu'il cherche** | Signer plus de devis, perdre moins de temps, ne pas se faire piéger sur un chantier |
| **Ce qu'il ne cherche pas** | Un outil IA. Il n'a jamais tapé « rendu IA jardin » de sa vie |
| **Ton** | Confrère, pas éditeur SaaS. Concret, chiffré, jamais donneur de leçons |
| **Preuve** | Les retours terrain de Kevyn. C'est le seul contenu que la concurrence ne peut pas copier |
| **Règle absolue** | Aucun article ne se termine par « et Verdia fait ça ». Le CTA est discret, en fin d'article, et l'article se tient sans lui |

---

## Architecture en clusters

```
PILIER 1 — Convaincre et signer          (intention commerciale, cœur de cible)
├── 01. Générateurs de jardin IA gratuits : le test terrain
├── 02. Devis d'aménagement : pourquoi vos clients ne signent pas
├── 04. Photo, plan 2D ou 3D : quel rendu pour quel chantier
└── 05. AI Act : ce que vous devez dire à vos clients depuis le 2 août 2026

PILIER 2 — Crédibilité horticole          (E-E-A-T, différenciation)
├── 03. Le piège du rendu trop beau : anticiper la croissance
└── 07. Chiffrer un contrat d'entretien sans se faire piéger

TRAFIC — Acquisition large               (aimant à liens, haut de funnel)
└── 06. Trouver des clients quand on est paysagiste
```

**Maillage interne obligatoire :** 01 ↔ 03 ↔ 04 forment le triangle de différenciation. Chaque article de ce triangle lie vers les deux autres. 02 est la page argent : tous les articles y renvoient au moins une fois. 06 est l'aimant : il reçoit les liens externes et les redistribue vers 02.

---

## Les 7 articles

| # | Slug | Requête cible | Intention | Concurrence | Priorité |
|---|---|---|---|---|---|
| 01 | `generateurs-jardin-ia-gratuits-limites` | ia aménagement jardin gratuit, chatgpt jardin, générateur jardin ia | Défensive + différenciation | Forte mais grand public | **1** |
| 02 | `devis-amenagement-paysager-pourquoi-clients-ne-signent-pas` | devis paysagiste pas signé, taux transformation devis | Commerciale | Moyenne | **1** |
| 03 | `anticiper-croissance-vegetaux-amenagement` | distance plantation arbuste, erreur conception massif | Info + E-E-A-T | Faible | **2** |
| 04 | `rendu-jardin-photo-plan-2d-ou-3d` | logiciel paysagiste, rendu jardin client | Comparaison | Forte | **3** |
| 05 | `ai-act-paysagistes-mention-ia-obligatoire` | ai act artisan, mention ia obligatoire | Info urgente | **Quasi nulle** | **1** |
| 06 | `trouver-clients-paysagiste` | trouver clients paysagiste, prospection paysagiste | Haut de funnel | Forte | **3** |
| 07 | `chiffrer-contrat-entretien-espaces-verts` | prix contrat entretien espaces verts, tarif entretien annuel | Commerciale | Moyenne | **2** |

### Pourquoi l'article 01 est le plus important

C'est un article **défensif**. Aujourd'hui, ton prospect tape « IA jardin gratuit », tombe sur Fotor, essaie, obtient un rendu joli, le montre à sa cliente, et se plante — parce que le rendu a supprimé le pot de géraniums que sa cliente avait depuis quinze ans. Il en conclut que « l'IA c'est du gadget » et tu l'as perdu définitivement.

Cet article intercepte cette recherche et reformule le problème : **ce n'est pas l'IA qui est en cause, c'est l'IA sans règles métier.** Il te positionne comme celui qui a compris pourquoi ça rate. Et il est honnête, donc il tiendra dans le temps.

### Pourquoi l'article 05 est le pari

L'article 50 de l'AI Act est applicable **depuis le 2 août 2026**. Aucun blog paysagiste français ne couvre le sujet. La requête « ai act artisan » / « mention ia obligatoire » est en train de se créer, et l'offre de contenu est nulle. C'est la seule occasion du lot de prendre une position n° 1 en quelques semaines plutôt qu'en un an.

Bonus : il rend concret le fait que tu gères la conformité pour tes clients — argument commercial direct, et cohérence totale avec l'article 11 de tes CGUV.

---

## Spécification technique pour l'intégration

### Structure de fichiers

```
/content/blog/*.md          les 7 articles
/app/blog/page.tsx          index
/app/blog/[slug]/page.tsx   article
/app/sitemap.ts             sitemap dynamique
```

### Schéma de frontmatter

Tous les articles utilisent ce schéma. Le parser doit être strict : un champ manquant = build qui casse, c'est voulu.

```yaml
---
title: string            # < 60 car., contient la requête cible
description: string      # 140-155 car., meta description
slug: string             # kebab-case, sans date, jamais modifié après publication
date: YYYY-MM-DD
updated: YYYY-MM-DD
author: string
authorRole: string
category: string         # Convaincre et signer | Métier | Gérer son activité
tags: string[]
targetKeyword: string
secondaryKeywords: string[]
readingTime: number      # minutes
featured: boolean
image: string
imageAlt: string
---
```

### URL

`https://{domaine}/blog/{slug}` — pas de date, pas de catégorie dans l'URL. Les slugs ne changent jamais après publication (sinon, redirection 301 obligatoire).

### Balises à générer

- `<title>` = `{title} | Verdia`
- `<meta name="description">` = `description`
- `<link rel="canonical">` = URL absolue
- Open Graph + Twitter Card
- JSON-LD `BlogPosting` sur chaque article : `headline`, `description`, `datePublished`, `dateModified`, `author`, `image`, `mainEntityOfPage`
- JSON-LD `FAQPage` sur les articles 01, 05 et 07, qui contiennent une section FAQ

### Points à ne pas rater

- **Rendu statique** (SSG). Pas de client-side rendering pour le contenu.
- **`updated` réellement mis à jour** quand tu modifies un article — c'est un signal de fraîcheur, et mentir dessus se voit.
- **Hiérarchie Hn stricte** : un seul `<h1>`, jamais de saut de niveau.
- **Images `next/image`** avec `alt` descriptif, format WebP, `loading="lazy"` sauf la première.
- **Sitemap** régénéré au build, soumis à la Search Console.
- **Pas de `noindex`** sur les pages de tag ; en revanche, `noindex` sur la pagination au-delà de la page 2 tant que le volume est faible.

### Composants à prévoir

| Composant | Usage |
|---|---|
| `<Callout type="terrain">` | Encadré « Retour de terrain » — c'est le format signature du blog |
| `<Callout type="warning">` | Piège à éviter |
| `<ComparisonTable>` | Tableaux des articles 04 et 07 |
| `<FAQ>` | Section FAQ, génère aussi le JSON-LD |
| `<CTA variant="soft">` | Fin d'article. **Une seule occurrence par article, jamais en milieu de texte** |

---

## Calendrier de publication

Ne publie pas les 7 d'un coup : Google lit mal un site qui sort 7 articles le même jour puis plus rien.

| Semaine | Publication | Raison |
|---|---|---|
| 1 | **05 — AI Act** | Le sujet est chaud maintenant, la fenêtre se referme |
| 1 | **01 — Générateurs IA gratuits** | Article de socle, tout pointe vers lui |
| 3 | **02 — Devis pas signés** | Page argent |
| 5 | **03 — Croissance des végétaux** | Autorité métier |
| 7 | **07 — Contrat d'entretien** | Cible le segment de Kevyn |
| 9 | **04 — Photo vs 3D** | Long terme |
| 11 | **06 — Trouver des clients** | Aimant à liens |

Ensuite : **un article toutes les deux semaines minimum**, sinon le blog meurt et le budget de crawl avec.

---

## Ce que le blog ne doit jamais faire

- **Promettre un résultat commercial.** Tes CGUV (article 6.1) disent explicitement que Verdia ne garantit aucun taux de transformation. Un article qui promet « +40 % de devis signés » te met en contradiction avec ton propre contrat. Les chiffres du blog doivent venir de sources citées ou de tes propres mesures, jamais d'une estimation inventée.
- **Présenter un rendu comme une photo.** Même règle que l'article 9 des CGUV. Tout visuel de rendu publié sur le blog porte la mention d'origine IA.
- **Dénigrer nommément un concurrent.** L'article 01 critique une catégorie d'usage, pas une marque. Le dénigrement est un acte de concurrence déloyale (art. 1240 C. civ.), et c'est en plus mauvais pour la crédibilité.
- **Publier des photos de chantiers clients sans autorisation écrite.** Y compris celles de Kevyn.

---

## Mesure

À 3 mois, regarde :
- **Positions** sur `ai act paysagiste` et `ia aménagement jardin gratuit` — les deux paris.
- **Taux de clic** en Search Console : une bonne position avec un mauvais CTR = un `title` à réécrire, pas un contenu à refaire.
- **Pages/session depuis 06** : si l'aimant à trafic ne redistribue pas vers 02, le maillage est cassé.

Ne regarde pas le trafic global avant 4 mois. Il ne veut rien dire avant.
