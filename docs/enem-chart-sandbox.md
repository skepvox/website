# ENEM Chart Sandbox (WIP)

This document defines how we iterate on D3 charts in a dedicated sandbox page
before a chart is considered ready for production use.

## Sandbox location

- Pages live under `src/enem-sandbox/` so they render with full left/right nav.
- Each area mirrors the real exam routes:
  - `src/enem-sandbox/2025/linguagens.md`
  - `src/enem-sandbox/2025/humanas.md`
  - `src/enem-sandbox/2025/ciencias-da-natureza.md`
  - `src/enem-sandbox/2025/matematica.md`

## Sandbox goals

- Test chart rendering at multiple container widths.
- Validate hover/touch behavior, legend toggles, filters, and animations.
- Tune typography, spacing, axes, and labels for readability.
- Confirm accessibility and reduced-motion behavior.

## Sandbox workflow

1. Pick a target question with chart assets.
2. Load its `qNNN.json` data and chart meta file.
3. Render the chart in the sandbox at:
   - Narrow width (mobile)
   - Medium width (tablet)
   - Wide width (desktop)
4. Toggle `meta.debug` for layout overlays (red = SVG bounds, blue = plot area).
5. Iterate until visuals and interactions are stable, then disable debug.
6. Mark the chart "ready" in documentation.

## Sandbox content

- The sandbox pages now list the full set of questions per area (1–180).
- Use a specific question id (ex: `2025_q152`) when iterating on a chart.
- Early passes may only include raw assets; improved charts/images will be added
  later and should override raw assets when available.

## Ready checklist

- Data loads with no console errors.
- Axes, labels, and legends are readable at all sizes.
- Legend toggles and filters behave correctly.
- Play/pause controls behave as expected and respect reduced motion.
- Touch interactions work on mobile.
- Chart scales gracefully with container width.
- Cleanup removes all event listeners on unmount.
