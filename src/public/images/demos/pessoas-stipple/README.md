# Retratos em pontilhismo (SVG) — Pessoas (`/demos`)

Este diretório guarda os **SVGs pré‑gerados** usados como retrato nas notas de pessoas.

Arquivos:

- `/<slug>--light.svg` (para tema claro)
- `/<slug>--dark.svg` (para tema escuro)

Geração (a partir de `src/public/images/demos/pessoas/*.png`):

- `pnpm demos:portraits`

Opções úteis:

- `pnpm demos:portraits -- --force` (regerar tudo)
- `pnpm demos:portraits -- --sample 360 --pixels-per-point 14 --radius 0.65` (mais densidade)

