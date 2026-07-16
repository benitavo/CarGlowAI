# Instructions d'intégration — Section blog Verdia

> Fichier destiné à Claude Code. Contexte : intégrer les 7 articles du dossier `articles/` dans le site Verdia existant, avec le rendu et le SEO technique décrits ci-dessous. La stratégie éditoriale complète est dans `README-strategie-seo.md`.

## Contenu fourni

```
blog/
├── README-strategie-seo.md      stratégie, clusters, calendrier — à lire d'abord
├── INSTRUCTIONS-integration.md  ce fichier
└── articles/
    ├── generateurs-jardin-ia-gratuits-limites.md
    ├── devis-amenagement-paysager-pourquoi-clients-ne-signent-pas.md
    ├── anticiper-croissance-vegetaux-amenagement.md
    ├── rendu-jardin-photo-plan-2d-ou-3d.md
    ├── ai-act-paysagistes-mention-ia-obligatoire.md
    ├── trouver-clients-paysagiste.md
    └── chiffrer-contrat-entretien-espaces-verts.md
```

Chaque article a un frontmatter YAML complet (title, description, slug, date, updated, author, authorRole, category, tags, targetKeyword, secondaryKeywords, readingTime, featured, image, imageAlt). Le schéma exact est dans le README.

## Tâches

### 1. Adapter à la stack existante

Détecter la stack du projet (Next.js App Router attendu, mais vérifier) et intégrer en conséquence :
- articles dans `/content/blog/` (ou le dossier de contenu existant du projet)
- route index `/blog`
- route article `/blog/[slug]`
- rendu **statique** (SSG). Pas de rendu client pour le contenu.

### 2. Rendu des articles

- Parser markdown + frontmatter (gray-matter + le pipeline MD existant du projet, ou MDX si le projet l'utilise déjà — ne pas introduire une nouvelle lib si une équivalente existe).
- Le parser doit être **strict sur le frontmatter** : champ manquant = échec de build. C'est voulu.
- Un seul `<h1>` par page (le `title`). Les `##` du markdown deviennent des `<h2>`, etc. Pas de saut de niveau.
- Les blockquotes commençant par `**Retour de terrain**` doivent être rendus comme un composant `Callout` visuellement distinct (encadré, icône) — c'est le format signature du blog. Détection : blockquote dont la première ligne en gras est « Retour de terrain ».
- Liens internes relatifs (`/blog/...`) : vérifier qu'ils résolvent tous vers un slug existant. Casser le build sinon.
- Temps de lecture affiché depuis le frontmatter `readingTime`.
- Signature auteur en fin d'article : `author` + `authorRole`.
- La dernière ligne en italique de chaque article est le CTA produit : la rendre comme un composant `CTA` discret (fond légèrement teinté), **jamais** comme un simple paragraphe italique perdu. Une seule occurrence par article.

### 3. Page index /blog

- Article(s) `featured: true` mis en avant en haut.
- Liste antéchronologique, groupable par `category`.
- Carte article : image, titre, description, catégorie, temps de lecture.
- Pagination si > 12 articles (pas le cas aujourd'hui — prévoir sans sur-construire).

### 4. SEO technique

Sur chaque page article :
- `<title>` = `{title} | Verdia`
- `<meta name="description">` = frontmatter `description`
- canonical absolu
- Open Graph + Twitter Card (image = frontmatter `image`)
- JSON-LD `BlogPosting` : headline, description, datePublished (`date`), dateModified (`updated`), author (Person), image, mainEntityOfPage
- JSON-LD `FAQPage` **en plus** sur les articles contenant une section `## Questions fréquentes` (actuellement : 01, 03, 05, 07). Parser les couples question (`**gras**`) / réponse de cette section.

Global :
- `sitemap.xml` dynamique incluant `/blog` et chaque article, avec `lastmod` = `updated`
- flux RSS `/blog/rss.xml` (title, description, link, pubDate)
- breadcrumb (Accueil → Blog → Article) avec JSON-LD `BreadcrumbList`

### 5. Images

Les images référencées dans le frontmatter (`/blog/images/*.webp`) **n'existent pas encore**. En attendant :
- créer un composant placeholder propre (fond dégradé + titre) utilisé quand le fichier n'existe pas, pour ne pas casser le build ni le layout ;
- lister les 7 images manquantes dans un TODO en fin d'intégration, avec leurs dimensions attendues (1200×630 pour servir aussi d'image OG).
- Quand les vraies images arriveront : `next/image`, lazy loading sauf la première, `alt` = frontmatter `imageAlt`.

### 6. Dates de publication — important

Les frontmatters portent tous `date: 2026-07-16`. **Ne pas publier les 7 le même jour.** Suivre le calendrier du README (05 et 01 en semaine 1, puis un toutes les deux semaines). Deux options d'implémentation, au choix selon la stack :
- filtrer à la build les articles dont `date` est dans le futur, et échelonner les dates dans les frontmatters selon le calendrier ;
- ou un champ `draft: true` retiré à la main à chaque publication.
La première option est préférable (pas d'intervention manuelle oubliable).

### 7. Ce qu'il ne faut PAS faire

- Pas de framework CSS ou de lib markdown supplémentaire si le projet en a déjà.
- Pas de commentaires, pas de likes, pas de newsletter popup — rien qui demande du JS client sur les pages articles.
- Ne pas réécrire ni « améliorer » le contenu des articles : le ton est volontairement terrain, les chiffres absents sont volontairement absents (cohérence juridique avec les CGUV — voir README section « Ce que le blog ne doit jamais faire »).
- Ne pas modifier les slugs.

## Definition of done

- [ ] `/blog` et les 7 `/blog/[slug]` rendent en statique
- [ ] Build casse si un frontmatter est incomplet ou un lien interne est mort
- [ ] JSON-LD BlogPosting sur les 7, FAQPage sur 01/03/05/07, validés au Rich Results Test
- [ ] Sitemap et RSS générés
- [ ] Callouts « Retour de terrain » et CTA finaux rendus comme composants
- [ ] Publication échelonnée en place
- [ ] TODO des 7 images listé
