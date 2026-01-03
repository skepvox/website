---
sitemap: false
---

# ENEM Overrides

Per-question JSON overrides that are merged into the raw pipeline output
before publishing data to `src/public/enem/`.

Layout:
- `src/enem/overrides/{year}/q001.json`
- `src/enem/overrides/{year}/q095.json`

Merge rules:
- Objects are deep-merged.
- Arrays replace the base array (provide the full corrected array).
- `null` overwrites the base value.

Use `node scripts/publish-enem.js --year 2025` or
`pnpm publish:enem -- --year 2025` to apply overrides and write merged
JSON into `src/public/enem/2025/questions/`.

Optional flags:
- `--dry-run`
- `--skip-images`
- `--skip-charts`
- `--skip-answers`
- `--skip-by-area`
- `--skip-questions`
