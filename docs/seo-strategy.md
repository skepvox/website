# SEO Strategy (skepvox)

This document captures the SEO strategy across major content types in this repo
(books and essays/blog posts). The core model is consistent: hubs are for
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

## Essays / blog posts (when present)

### Leaf page

- Canonical per post.
- `Article` JSON-LD (headline, author, datePublished, image if available).
- Keep title/description aligned with the first paragraph.

## Core principle

Humans browse hubs. Search engines and AI land on leaves.

Leaves must be focused, fast, canonical, and text-first.
