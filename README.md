# Skepvox

Personal site and digital library focused on literatura, filosofia, and classical studies.

## Requirements

- Node.js 18+
- pnpm (corepack recommended)

## Development

```bash
corepack enable
pnpm i
pnpm dev
```

## Build and preview

```bash
pnpm build
pnpm preview
```

## Project layout

- Content: `src/`
- Site config and theme: `.vitepress/`

## Content pipelines

See `docs/pipelines.md` for how local extraction projects feed content into `src/`.
Book ingestion, naming, and SEO rules live in `docs/books-workflow.md`.

## ENEM data

Publish ENEM data from the pipeline into `src/public/enem/{year}/`:

```bash
pnpm publish:enem -- --year 2025
```

Per-question overrides live in `src/enem/overrides/{year}/qNNN.json`.

## SEO (local)

- `docs/seo-strategy.md`
- `docs/vercel-seo-testing.md`
