# Content Pipelines

This repo contains the VitePress site in `src/`. The ENEM pipeline lives at the repo root and is git-ignored so we can iterate on data without committing it.

## ENEM extraction pipeline (`pipeline-enem-extraction/`)

Purpose: extract ENEM PDF exams into structured JSON plus assets for rendering questions.

Flow:
- Inputs: `pipeline-enem-extraction/raw/{year}/` (PDFs).
- Intermediate: `pipeline-enem-extraction/extracted/{year}/` (text/images/tables).
- Output (current): `pipeline-enem-extraction/processed/{year}/by_question/*.json`, `answers.json`, `images/`, and `charts/`.

Transfer into the site:
- Publish into `src/public/enem/{year}/`, using the standardized layout:
  - `questions/{year}-{NNN}.json`
  - `images/{year}-{NNN}-img-001.ext`
  - `charts/{year}-{NNN}-chart-001.json` and `...-meta.json`
  - `tables/{year}-{NNN}-table-001.json`
  - `mappings/booklet-*.json`
- Use per-question overrides in `src/enem/overrides/{year}/qNNN.json` to apply manual fixes.
- The question JSON references assets by filename; resolve assets relative to `/enem/{year}/`.

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
- Natureza: Q91-135 (Day 2)
- Matematica: Q136-180 (Day 2)

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
