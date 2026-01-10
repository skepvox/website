# Content Pipelines

This repo contains the VitePress site in `src/`. The ENEM pipeline lives at the repo root and is git-ignored so we can iterate on data without committing it.

## Demos pipelines (`/demos`)

### Demos graph export

The `/demos/mapa` page consumes prebuilt graph data generated from the Markdown notes in `src/demos/`.

- Generate: `pnpm demos:data` (or `node scripts/demos-notes-data.js export`)
- Output: `src/public/demos-data/graph.json` and `src/public/demos-data/notes.jsonl`

### Demos portraits (stipple SVGs)

Person notes can render pre-generated stipple SVG portraits (with PNG fallback).

- Input PNGs: `src/public/images/demos/pessoas/<slug>.png`
- Generate SVGs: `pnpm demos:portraits`
- Output SVGs: `src/public/images/demos/pessoas-stipple/<slug>--light.svg` and `...--dark.svg`
- Re-generate everything: `pnpm demos:portraits -- --force`

## ENEM extraction pipeline (`pipeline-enem-extraction/`)

Purpose: extract ENEM PDF exams into structured JSON plus assets for rendering questions.

Flow:
- Inputs: `pipeline-enem-extraction/raw/{year}/` (PDFs).
- Intermediate: `pipeline-enem-extraction/extracted/{year}/` (text/images/tables).
- Output (current): `pipeline-enem-extraction/processed/{year}/by_question/*.json`, `answers.json`, `images/`, and `charts/`.
- Manual adjustment stage (recommended): apply fixes in `pipeline-enem-extraction/adjusted/{year}/` (e.g. `by_question/`, `images/`, `tables/`) using `processed/` as the baseline.

Transfer into the site:
- Publish into `src/public/enem/{year}/`, using the standardized layout:
  - `questions/{year}-{NNN}.json`
  - `images/{year}-{NNN}-img-001.ext`
  - `charts/{year}-{NNN}-chart-001.json` and `...-meta.json`
  - `tables/{year}-{NNN}-table-001.json`
  - `mappings/booklet-*.json`
- Use per-question overrides in `src/enem/overrides/{year}/qNNN.json` to apply manual fixes.
- The question JSON references assets by filename; resolve assets relative to `/enem/{year}/`.
- Note: `scripts/publish-enem.js` reads from `pipeline-enem-extraction/processed/`. If you made manual fixes in `adjusted/`, mirror those files into `src/public/enem/{year}/` directly or copy/overlay `adjusted/` onto `processed/` before publishing.

Suggested manual-fix workflow:
1) Extract PDFs into `pipeline-enem-extraction/processed/{year}/`.
2) Copy the question(s) and assets you need to adjust into `pipeline-enem-extraction/adjusted/{year}/`.
3) Apply fixes in `adjusted/` (text, assets, tables, charts).
4) Either overlay `adjusted/` onto `processed/` and run `pnpm publish:enem -- --year {year}`, or copy `adjusted/` into `src/public/enem/{year}/` manually.

## ENEM site publishing workflow

Use this when moving adjusted data into the website and generating pages.

1) Mirror adjusted assets into `src/public/enem/{year}/` (questions, images,
   tables, charts).
2) Ensure `area.code` matches the site slug (e.g. `ciencias-da-natureza`,
   `matematica`) and update asset paths accordingly.
3) Create/update the hub page at `src/enem/{year}/{area}.md` with the
   question preview cards.
4) Add solution JSON files at `src/public/enem/{year}/solutions/{year}-{NNN}.json`
   (see `docs/enem-solutions.md`).
5) Generate or refresh leaves:
   - `node scripts/generate-enem-question-pages.js --year {year} --area {area} --label "{Área completa}" --short "{Área curta}"`
6) Update the ENEM sidebar group in `.vitepress/config.ts` if new areas were added.
7) Update `.vitepress/theme/enem/types.ts` and `src/enem/index.md` when adding
   a new area slug.
8) Add alias redirects in `vercel.json` (see `docs/seo-strategy.md`).

Notes:
- The pipeline output is git-ignored; publish with `node scripts/publish-enem.js --year 2025` or `pnpm publish:enem -- --year 2025`.

### Booklet mapping

ENEM exams are distributed in multiple colored booklets (cadernos) with identical questions in different orders. We extract from the verde (green) booklet as the canonical reference, then map question positions across all booklet colors.

Booklet structure:
- Day 1: CD1 (azul), CD2 (amarelo), CD3 (branco), CD4 (verde)
- Day 2: CD5 (amarelo), CD6 (cinza), CD7 (azul), CD8 (verde)

Question ranges per discipline:
- Linguagens: Q1-45 (Day 1)
- Humanas: Q46-90 (Day 1)
- Ciências da Natureza: Q91-135 (Day 2)
- Matematica: Q136-180 (Day 2)

Area slug conventions (site):
- `ciencias-da-natureza` (use this slug, not `natureza`)
- `matematica`

Path examples:
- Hub: `src/enem/2025/ciencias-da-natureza.md`
- Leaves: `src/enem/2025/ciencias-da-natureza/questao/2025-091.md`
- Images: `src/public/enem/2025/images/raw/ciencias-da-natureza/2025-091-img-001.png`

Inputs:
- `raw/{year}/` - Verde booklet PDFs (PV = prova, GB = gabarito)
- `raw/{year}/booklets-for-mapping/` - Other colored booklet PDFs

Outputs in `processed/{year}/`:
- `booklet-question-mapping.json` - Maps canonical question ID to position in each booklet
- `booklet-answer-mapping.json` - Maps canonical question ID to correct answer in each booklet
- `booklet-colors.json` - Maps CDX codes to color names

Example mapping (Q136 in Matematica):
```json
// booklet-question-mapping.json
"2025-136": {
  "CD8": "2025-136",  // Verde position 136
  "CD5": "2025-151",  // Amarelo position 151
  "CD6": "2025-147",  // Cinza position 147
  "CD7": "2025-149"   // Azul position 149
}

// booklet-answer-mapping.json
"2025-136": {
  "CD8": "B",
  "CD5": "B",
  "CD6": "B",
  "CD7": "B"
}
```

Run the mapping script:
```bash
cd pipeline-enem-extraction
source .venv/bin/activate
python scripts/build_booklet_mapping.py
```

The script uses PyMuPDF for PDF extraction and matches questions across booklets by text content fingerprinting.
