# Content Pipelines

This repo contains the VitePress site in `src/`. Two local pipeline projects live at the repo root and are git-ignored so we can iterate on data without committing it.

## Book extraction pipeline (`pipeline-book-extraction/`)

Purpose: convert long-form sources (EPUB/PDF) into a single, cleaned Markdown file per book.

Flow:
- Inputs: `pipeline-book-extraction/raw/` (source files).
- Intermediate: `pipeline-book-extraction/extracted/` (per-chapter Markdown).
- Output: `pipeline-book-extraction/processed/{author-slug}/{book-slug}.md` (single file per book).

Transfer into the site:
- Copy the processed book file into `src/literatura/{author-slug}/{book-slug}.md` for literature.
- Copy the processed book file into `src/filosofia/{author-slug}/{book-slug}.md` for philosophy.

Examples (current):
- `pipeline-book-extraction/processed/plato/the-republic.md` -> `src/filosofia/plato/the-republic.md`
- `pipeline-book-extraction/processed/machado-de-assis/bras-cubas.md` -> `src/literatura/machado-de-assis/bras-cubas.md`

## ENEM extraction pipeline (`pipeline-enem-extraction/`)

Purpose: extract ENEM PDF exams into structured JSON plus assets for rendering questions.

Flow:
- Inputs: `pipeline-enem-extraction/raw/{year}/` (PDFs).
- Intermediate: `pipeline-enem-extraction/extracted/{year}/` (text/images/tables).
- Output (current): `pipeline-enem-extraction/processed/{year}/by_question/*.json`, `answers.json`, `images/`, and `charts/`.

Transfer into the site:
- Publish into `src/public/enem/{year}/`, preserving the folder layout.
- Use per-question overrides in `src/enem/overrides/{year}/qNNN.json` to apply manual fixes.
- The question JSON references assets by filename; resolve images relative to `/enem/{year}/images/`.

Site integration (planned, not implemented yet):
- `src/enem/{year}/` pages will render a dedicated question component that fetches data from `/enem/{year}/by_question/q001.json` and uses the referenced assets.

Notes:
- `by_area/` and `questions.json` exports are not generated yet by the pipeline; the current reliable artifacts are `by_question/`, `answers.json`, and `images/`.
- Run `node scripts/publish-enem.js --year 2025` or `pnpm publish:enem -- --year 2025` to merge overrides and copy data into `src/public/enem/2025/`.
