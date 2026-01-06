# AGENTS

## Purpose
- Quick orientation for Codex agents working in this repo.

## Stack
- Node.js 18+
- pnpm (via corepack)
- VitePress site

## Key Paths
- Site content: `src/`
- Theme/components: `.vitepress/theme/`
- ENEM question data: `src/public/enem/{year}/`
- ENEM overrides: `src/enem/overrides/{year}/`
- Question pages: `src/enem/2025/matematica/questao/`
- Pipelines (ignored): `pipeline-enem-extraction/`

## Commands
- Install: `corepack enable` then `pnpm i`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Preview: `pnpm preview`
- Publish ENEM data: `pnpm publish:enem -- --year 2025`

## ENEM Docs
- `docs/enem-question-card.md`
- `docs/enem-charts.md`
- `docs/enem-chart-sandbox.md`
- `docs/pipelines.md`
- `docs/seo-strategy.md`
- `docs/vercel-seo-testing.md`

## Conventions
- Charts live in `.vitepress/theme/charts/` and use D3.
- Sandbox pages live in `src/enem-sandbox/`.
- Prefer improved assets when available; fall back to raw assets.
- Canonical question pages are generated via `scripts/generate-enem-question-pages.js`.

## Testing
- No formal test suite; validate changes with the dev server.

## Deployment
- Hosted on Vercel; use `docs/vercel-seo-testing.md` for post-deploy checks.
