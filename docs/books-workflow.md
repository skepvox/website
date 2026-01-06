# Books Workflow (Source -> Site)

This doc captures the book ingestion rules that matter for this repo: naming, structure, and SEO.
The current baseline is `De l'âme humaine` and its workflow should be reused for new books.

## Source staging (local)

- Use `local-books/` (gitignored) to stage chapter-split sources before moving into `src/`.
- Each book lives in its own folder with language subfolders (`pt/`, `fr/`, `en/`, etc.).
- Source files should already be cleaned and normalized before promotion.
- Treat `local-books/` as the source of truth for chapter body text.

## Chapter file naming

- Use `BB-PP-CCC-chapter-slug.md` (kebab-case).
- `BB` = internal book number (use `00` if none).
- `PP` = internal part/section number (use `00` if none).
- `CCC` = chapter number within that book/part.
- Intros and conclusions:
  - `00-00-000-introduction-*.md`
  - `99-99-999-conclusion-*.md`

## Internal structure rules

- Use H2 for internal book divisions (e.g., Livre/Book).
- Use H2 for internal parts/sections when present.
- Use H3 for chapter titles inside those groups.
- Drop duplicated headings that only repeat the chapter title.
- Keep heading formatting clean: space after `#`, single blank line around headings, no extra blank lines.
- Leaf pages include a back-link at the top: `[Retour au livre](/louis-lavelle/<book-slug>)`.

## Site layout

- Hub page: `src/louis-lavelle/<book-slug>.md` (compiled full text).
- Chapter leaves: `src/louis-lavelle/<book-slug>/BB-PP-CCC-*.md`.
- Navigation lists only the book hub, not the leaves.

## Book hub content

- H1 is the book title only.
- Table of contents is a nested list (no extra headers):
  - Group the introduction under `Avant-propos`.
  - Group the conclusion under `Conclusion`.
  - Internal books/parts are list items, with chapters nested under them.
- Hub outline should show only H2: `outline: 2`.
- Hub text is compiled from leaves; do not edit the hub manually.

## SEO for leaf pages

- Use a clean layout with no sidebars or outline:
  - `sidebar: false`, `aside: false`, `footer: false`, `outline: false`.
- Canonical URLs are clean (no `.html`).
- JSON-LD uses `Chapter` and the chain:
  - Section -> internal Book (Livre) -> main Book.
- Store numbering and titles in `additionalProperty`:
  - `book-number`, `part-number`, `chapter-number`
  - `book-title`, `part-title`, `chapter-title`
- Use the author profile image when a per-book cover is missing:
  - `/images/louis-lavelle/louis-lavelle-profile-picture.png`
- Leaf titles should include the main book to avoid collisions:
  - `De l'âme humaine — Chapitre XIX. L'immortalité de l'âme`

## Content inclusion (public domain rule)

- Include only the author text (preface, main text, appendices that are part of the original work).
- Exclude editor/publisher content, modern introductions, bibliographies, and editorial notes.

## Book compilation scripts

Keep scripts book-specific when structure differs.

Example: `scripts/build-lavelle-de-l-ame-humaine.py`

- Syncs leaf bodies from `local-books/louis-lavelle/de-l-ame-humaine/fr` into
  `src/louis-lavelle/de-l-ame-humaine/` while preserving SEO frontmatter.
- Restores the leaf back-link and strips it from the hub.
- Removes repeated internal book/part headings in the hub output.
- Builds the hub with a nested Table of Contents.

After updating any chapter text in `local-books/`, run:

```
python3 scripts/build-lavelle-de-l-ame-humaine.py
```

## Navigation and references

- Add the book hub to `.vitepress/config.ts` under `/louis-lavelle/`.
- Link to the book from `src/louis-lavelle/index.md` when referenced in the bio.

## New book checklist

1. Place the cleaned source files in `local-books/<author>/<book-slug>/<lang>/`.
2. Create leaf files in `src/<author>/<book-slug>/` with full SEO frontmatter.
3. Add `[Retour au livre](/<author>/<book-slug>)` to each leaf body.
4. Run the book-specific build script to sync bodies and generate the hub:
   - `python3 scripts/build-<author>-<book-slug>.py`
5. Verify the hub:
   - H1 is the book title only.
   - TOC is nested and grouped (Avant-propos/Conclusion, internal books/parts).
   - `outline: 2` in frontmatter.
6. Add the book hub to `.vitepress/config.ts` and remove any retired book links.
7. Link the book in `src/<author>/index.md` wherever it is referenced.
