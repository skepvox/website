# SEO Strategy (Skepvox)

This document captures the SEO strategy across major content types in this repo
(books, ENEM, and essays/blog posts). The core model is consistent: hubs are for
navigation, leaves are for ranking.

## Core principles

- **Canonical leaves:** Every unique piece of content has one canonical URL.
- **Hubs for discovery:** Hubs are indexable but not the primary ranking target.
- **Clean URLs:** Use human-readable slugs without `.html`.
- **Static rendering:** Core content is fully rendered at build time.
- **Text-first:** Pages read cleanly when printed or copied.
- **Sitemaps:** Include canonical pages; exclude aliases and data endpoints.

## Books (literature/philosophy)

### Hub page (book)

- URL: `/louis-lavelle/<book-slug>`
- Purpose: navigation, context, and discovery.
- Should include a top-of-page Table of Contents (links to all chapter leaves).
- Table of Contents uses nested lists (no extra headers):
  - Group introduction under `Avant-propos`.
  - Group conclusion under `Conclusion`.
  - Internal books/parts list items with chapter links indented under them.
- Use `outline: 2` so only H2 items show in the outline.
- Structured data:
  - `Book` with `hasPart` (chapters).
  - `ItemList` with `position` and chapter URLs.
  - `BreadcrumbList` (Author → Book).

### Leaf page (chapter)

- URL: `/louis-lavelle/<book-slug>/BB-PP-CCC-chapter-slug`
- Layout: clean leaf (no sidebars, no outline, no right aside).
- Add a top link back to the hub.
- Structured data:
  - `Chapter` with `isPartOf` chain: Section → internal Book (Livre) → main Book.
  - `additionalProperty` for numbering/title metadata:
    - `book-number`, `part-number`, `chapter-number`
    - `book-title`, `part-title`, `chapter-title`
- Use the author profile image when a book cover is missing.
- Leaf titles include the main book to avoid collisions across works.

## ENEM (exams)

### Canonical content model

- One canonical page per unique question.
- Canonical is independent of caderno color or booklet numbering.
- Canonical must be indexable and contain the full question content.

Canonical URL pattern:

- `/enem/2025/matematica/questao/2025-136`

### Alias strategy (color and caderno number)

- 301 redirects in `vercel.json`.
- Aliases are not separate pages and are not in the sitemap.
- Canonical pages include the mapping text for the four day-2 colors.

### Page types

- **Exam overview page (hub):** `/enem/2025/matematica`
- **Single-question page (leaf):** `/enem/2025/matematica/questao/2025-136`

### Hub title convention

- Use an em dash between “Tecnologias” and “Caderno Verde”, e.g. `ENEM 2025 — Matemática e suas Tecnologias — Caderno Verde`.

### Leaf page layout

- No sidebars, no outline, no right aside.
- Top link back to the hub.
- Includes the “Mapeamento de cadernos” section.

### Rendering strategy (SEO-critical)

- Question pages are fully rendered at build time.
- `scripts/generate-enem-question-pages.js` generates the Markdown leaves.
- Sections: `## Contexto`, `## Enunciado`, `## Alternativas`, `## Solucao`.

### Metadata (implemented)

- `title`, `description`, canonical link, OG/Twitter, JSON-LD.
- `rel="alternate"` to the JSON data endpoint.

### Structured data (JSON-LD)

- `EducationalQuestion` + `BreadcrumbList`.
- `additionalProperty` carries the booklet mapping.

### Sitemap strategy

- All canonical question pages are in the sitemap.
- Alias URLs are excluded (301 redirects).
- JSON endpoints are excluded.

## Essays / blog posts (when present)

### Leaf page

- Canonical per post.
- `Article` JSON-LD (headline, author, datePublished, image if available).
- Keep title/description aligned with the first paragraph.

## Core principle

Humans browse hubs. Search engines and AI land on leaves.

Leaves must be focused, fast, canonical, and text-first.
