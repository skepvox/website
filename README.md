# Skepvox

Personal site and digital library focused on Louis Lavelle, literatura, and classical studies.

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

Book ingestion, naming, and SEO rules live in `docs/books-workflow.md`.

## SEO (local)

- `docs/seo-strategy.md`
