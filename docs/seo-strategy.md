# SEO Strategy for ENEM Question Pages (Skepvox)

This document captures the SEO strategy and current implementation for ENEM
question pages. It reflects the live structure in `src/` and the question
assets in `src/public/enem/{year}`.

## 1) Canonical content model

- One canonical page per unique question.
- Canonical is independent of caderno color or booklet numbering.
- Canonical must be indexable and contain the full question content
  (context, statement, options, assets, and future solution).

Canonical URL pattern (Portuguese slugs):

- `/enem/2025/matematica/questao/2025-136`

Canonical IDs are year-number slugs: `YYYY-NNN`.

## 2) Alias strategy (color and caderno number)

Users search by booklet color or caderno number. We support those searches
using 301 redirects to the canonical page.

Examples:

- `/enem/2025/matematica/caderno-azul/questao-149`
- `/enem/2025/matematica/caderno-7/questao-149`

Implementation:

- 301 redirects live in `vercel.json`.
- Aliases are not separate pages and are not in the sitemap.
- Canonical pages include the mapping text for the four day-2 colors.

## 3) Page types

### Exam overview page (hub)

- `/enem/2025/matematica`
- Purpose: browsing and navigation.
- Renders all questions (hub), indexable but not the main SEO target.

### Single-question page (leaf)

- `/enem/2025/matematica/questao/2025-136`
- Purpose: ranking, AI ingestion, sharing, deep linking.
- Focused, lightweight, text-first.

## 4) Leaf page layout

- No sidebars, no outline, no right aside.
- Top link back to the hub.
- Includes a “Mapeamento de cadernos” section with:
  - Day and application (e.g., “Dia 2 · Aplicacao regular”).
  - Color and caderno number mapping for the question.

## 5) Rendering strategy (SEO-critical)

Question pages are fully rendered at build time.

Implementation:

- `scripts/generate-enem-question-pages.js` generates one Markdown file per question
  in `src/enem/2025/matematica/questao/`.
- Pages are static and do not rely on client-only rendering for core content.
- Sections: `## Contexto`, `## Enunciado`, `## Alternativas`, `## Solucao`.

## 6) Metadata (implemented)

Each leaf page includes:

- `title` and `description` in frontmatter.
- `<link rel="canonical">` pointing to the canonical URL.
- `<link rel="alternate" type="application/json">` pointing to the JSON data.
- Open Graph and Twitter meta tags.
- JSON-LD (see below).

## 7) Structured data (JSON-LD)

Each leaf page embeds JSON-LD using Schema.org:

- `EducationalQuestion` with:
  - `name`, `identifier`, `url`, `inLanguage`.
  - `text` from the question statement.
  - `contentUrl` pointing to the JSON endpoint.
  - `additionalProperty` for the caderno mapping.
- `BreadcrumbList` for ENEM > Year > Question.

## 8) Assets and accessibility

Preferred formats:

- SVG for charts and diagrams.
- Markdown tables for tabular data.
- PNG only when raster is unavoidable (photos/scans).

Accessibility:

- Every image must include `alt` text (no captions unless needed).
- Charts are rendered with `<AssetChart>` and text alternatives in options.

## 9) Canonical JSON source

The canonical JSON source for each question lives at:

- `/enem/2025/questions/2025-136.json`

These JSON files include:

- Context, statement, options, assets, and metadata.
- Mappings and chart/table metadata.

The question page links the JSON via `rel="alternate"`.

## 10) Sitemap strategy

- All canonical question pages are in the sitemap.
- Alias URLs are not listed (301 redirects).
- JSON endpoints are not in the sitemap.

You can verify in `.vitepress/dist/sitemap.xml` after a build.

## 11) Booklet mapping data

Stored in:

- `src/public/enem/2025/mappings/booklet-question-mapping.json`
- `src/public/enem/2025/mappings/booklet-answer-mapping.json`
- `src/public/enem/2025/mappings/booklet-colors.json`

Day 2 colors:

- verde (CD8)
- amarelo (CD5)
- azul (CD7)
- cinza (CD6)

These files power the mapping section and the 301 redirects.

## 12) Core principle

Humans browse hubs. Search engines and AI land on leaves.

Question pages are the leaves. Keep them:

- Focused
- Fast
- Canonical
- Text-first

If a single-question page reads cleanly when printed, SEO is usually correct.
