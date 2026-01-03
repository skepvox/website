# ENEM D3 Charts (WIP)

This document defines the architecture, file structure, and interaction
requirements for all D3-based charts used in ENEM questions.

## Scope

- D3 charts render inside the QuestionCard via `AssetChart`.
- Charts are interactive and can include legend toggles, filters, and
  animation controls.
- Each chart implementation lives in its own file for clarity and reuse.

## File structure

- Charts live in `.vitepress/theme/charts/`.
- TypeScript is the default for all chart modules.
- Shared utilities live in:
  - `.vitepress/theme/charts/base.ts` (render helpers, scales, sizing)
  - `.vitepress/theme/charts/types.ts` (shared types and metadata interfaces)
  - `.vitepress/theme/charts/registry.ts` (map of chart type -> module)
- Chart implementations live in dedicated files:
  - One file per chart type or per question when needed for custom behavior.
  - Example: `.vitepress/theme/charts/bar.ts`
  - Example: `.vitepress/theme/charts/bar-line.ts`
  - Example: `.vitepress/theme/charts/q047.ts`

## Chart module contract (draft)

Each chart file exports a render function with a stable signature.

```ts
export type ChartRenderer = (input: {
  el: HTMLElement
  data: Array<Record<string, unknown>>
  meta: ChartMeta
  theme: ChartTheme
  width: number
  height: number
  onEvent?: (event: ChartEvent) => void
}) => ChartInstance
```

- `ChartInstance` exposes `update`, `destroy`, and optional `resize`.
- The `registry.ts` maps `meta.type` to a renderer.

## Metadata and interactivity

Charts read behavior from metadata (loaded from `meta_file`), including:

- `title` and `description` for labeling and aria.
- `categoryField` for the x-axis categories.
- `series` definitions (keys, labels, colors).
- `legend` config (click/touch toggles).
- `filters` config (category and range filters).
- `animation` config (steps, duration, autoplay, loop).

We will formalize a metadata schema once the first interactive chart is
implemented. The first chart uses a `bar-line` type with mixed bar + line series.

## Theming

- Use CSS variables for colors, text, and focus rings.
- Keep chart UI consistent with the VitePress theme (`--vt-c-*`).
- Define chart-specific tokens when needed (example: `--enem-chart-accent`).
- Charts must be theme-aware and readable in both light and dark modes.

## Responsive layout

- Charts re-render on resize and theme toggle; sizing comes from the chart container width.
- Charts can opt into width-driven height with `meta.aspectRatio` (height = width * ratio),
  capped by `meta.height` when provided.
- Legend items wrap to multiple rows on narrow widths; the chart top margin grows to
  keep the legend from overlapping the plot area.
- Legend label widths are estimated from character length in `.vitepress/theme/charts/bar-line.ts`.
  Adjust the legend constants there if spacing feels off.

## Layout debugging (good practice)

- Add a `debug` flag in chart metadata (or data) to render layout overlays:
  - Red rectangle = full SVG bounds.
  - Blue rectangle = inner plot area (after margins).
- Renderers should read `meta.debug` (and optionally `data.debug`) so the flag
  can be toggled without touching chart logic.
- Use the overlays to tune margins, title offsets, and label positions across breakpoints.
- Prefer pixel-based offsets for alignment tweaks (avoid `em` for layout nudges).
- Remove debug overlays once spacing is approved.

Example meta snippet:

```json
{
  "id": "q162_chart_001",
  "type": "q162-bar",
  "height": 240,
  "debug": true
}
```

Quick layout checklist:

- Red box matches the SVG edge; blue box matches the intended plot bounds.
- Title and legends stay inside the red box at mobile/tablet/desktop widths.
- Axis labels and annotations stay inside the blue box with no clipping.
- Remove `debug` before finalizing the chart.

## Accessibility

- All charts require an `aria-label` and an optional `aria-description`.
- Legend and controls must be keyboard accessible.
- Tooltips must not trap focus and must be dismissible.

## Performance

- Respect `prefers-reduced-motion`.
- Avoid heavy reflows; debounce resize events.
- Destroy D3 listeners on unmount.

## Matematica 2025 improved assets backlog (Q136-180)

Ranked easiest to hardest. Each item needs a data JSON and a renderer TS.

1. Q174 `q174_img_001` — 4-node circular flow with arrows (done).
2. Q156 `q156_chart_001` — timeline/step line (done).
3. Q145 `q145_img_001` — single line chart with labels (done).
4. Q175 `q175_img_001` — two small line charts (done).
5. Q153 `q153_chart_001` + `q153_chart_002` — pie + bar (done).
6. Q162 `q162_chart_001` + `q162_chart_002` — bar + pie (done).
7. Q180 `q180_img_001`–`q180_img_005` — five option line charts (done).
8. Q151 `q151_img_001` — Cartesian plane + square + points (done).
9. Q165 `q165_img_001` — grid map + compass/labels (done).
10. Q147 `q147_img_001` — circular track + protected region (done).
11. Q167 `q167_img_001` — tunnel cross-sections (semicylinders) (done).
12. Q171 `q171_img_001` — medal cross-section (circle + square + thickness) (done).
13. Q177 `q177_img_001` + `q177_img_002` — two tank perspective diagrams.
14. Q158 `q158_img_001` — sun diagram with measures (done).
15. Q136 `q136_img_001` + `q136_img_002` — polyhedron + net (done).
16. Q140 `q140_img_001` + `q140_img_002`–`q140_img_006` — cube + 5 orthographic views.
17. Q154 `q154_img_001` — 5-panel scale/vector mini-figures.
18. Q163 `q163_img_001` — compass + routed paths.
19. Q164 `q164_img_001` — tangent graph with asymptotes.
20. Q141 `q141_img_001` — infographic with pictograms.
21. Q143 `q143_img_001` — nutrition labels (dense table extraction).
