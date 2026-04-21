# skepvox

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

Podcast lesson pages under `src/podcast/<show>/` are synced from the sibling
podcast repos:

```bash
python3 scripts/sync-podcast-lesson-pages.py
```

The sync keeps the website pages transcript-first for navigation while leaving
the TTS-sensitive source episode structure unchanged in the podcast repos.

Shared podcast show metadata for transcript headings and anchors lives in
`scripts/podcast-show-config.json`. The website sync and the release scanner
read the same file.

To scaffold a new draft distribution episode file in a sibling podcast repo:

```bash
python3 scripts/scaffold-podcast-distribution-episode.py --show english --episode-number 4 --episode-title "Working title" --slug "working-title"
```

## SEO (local)

- `docs/seo-strategy.md`
