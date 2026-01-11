# ENEM Question Card (WIP)

This doc is the source of truth for requirements and behavior of the ENEM
question card and its nested components.

## Goal and scope

- Define the data contract for rendering a single ENEM question.
- Document rendering rules, states, and asset handling.
- Outline the component tree for nested subcomponents.
- Track key layout and styling decisions for the card.

## Implementation decisions (current)

- Chart modules live in `.vitepress/theme/charts/` and use TypeScript.
- Chart sandbox pages live under `src/enem-sandbox/`.
- Chart requirements and workflow live in `docs/enem-charts.md`.
- Chart sandbox workflow lives in `docs/enem-chart-sandbox.md`.
- `QuestionCard` is presentational (it only renders a question object).
- `QuestionCard` supports a `showArea` flag to hide the area label when the page
  already implies the subject (ex: sandbox pages).
- `QuestionCardLoader` (or a data composable) handles loading and state.
- Data loading is injectable via a `loadQuestion` function for future sources
  (Supabase, API, local JSON, or mocks).
- The loader fetches on client mount to avoid SSG fetch mismatches.
- `showPlaceholders` can be enabled in sandbox pages to render placeholder
  tiles for missing asset types.

## Data sources

- Question JSON: `src/public/enem/{year}/by_question/qNNN.json`
- Publish script: `scripts/publish-enem.js`
- Schema reference: `pipeline-enem-extraction/schemas/question.schema.json`
- Answer key (if needed): `src/public/enem/{year}/answers.json`
- Assets:
  - Images: `src/public/enem/{year}/images/...`
  - Charts: `src/public/enem/{year}/charts/...`

## Data contract (expected fields)

- `id`: string like `2025_q001`.
- `year`: number, 4-digit.
- `day`: 1 or 2.
- `number`: 1-180.
- `area`: `{ code, name }`.
- `subject`: optional `{ code, name }`.
- `competency`: optional string.
- `skill`: optional string.
- `context`: optional object with:
  - `type`: one of `text`, `list`, `poem`, `lyrics`, `dialogue`, `news`, `academic`.
  - `content`: string.
  - `source`: optional metadata (author/title/publisher/location/year/url/access_date/note).
  - `language`: `pt`, `en`, or `es`.
- `statement`: required string.
- `prompt`: optional object with:
  - `text`: string (the examiner’s ask).
  - `scope`: usually `statement`.
  - `anchor`: usually `before:options`.
- `options`: array of 1-5 `{ letter: A-E, text, latex? }`.
- `correct_answer`: `A`-`E` or `null` when annulled.
- `assets`:
  - `images`: list with `{ id, file, alt, width, height, position }`.
  - `charts`: list with `{ id, type, data_file, meta_file, position }`.
  - `tables`: list with `{ id, headers, rows, position }`.
  - `formulas`: list with `{ id, latex, position }`.
- `metadata`:
  - `page_in_pdf`, `caderno`, `caderno_position`.
  - `booklet_color` (green, blue, yellow, or other official colors).
  - `equivalents`: map of booklet color -> `{ question_id, number }` for
    cross-color question mapping.
  - `foreign_language_option` (`english` or `spanish`).
  - `has_*` flags, `annulled`, `reviewed`, `review_notes`.

## Rendering rules

- Show question number and area name/code in the header.
- Show subject/competency/skill when present.
- Render `context` (if present) before the statement.
  - Preserve line breaks for `poem` and `lyrics`.
  - `list` context can include paragraphs and bullet lists; paragraphs are
    indented and list items keep their own bullet spacing.
  - Render `source` as a small attribution line.
- Render statement after context.
  - Split statement into paragraphs on blank lines.
- If `prompt.text` exists and differs from `statement`, render it in its own
  prompt block (no indentation).
- If `prompt.text` equals `statement`, render only the prompt block to avoid
  duplication.
- Render options in order, with option letter visible.
- If `correct_answer` is `null` or `metadata.annulled` is true, show an
  "Annulled" badge and do not highlight any option.
- If answers are shown, do so only in review mode (define when).
- Assets respect their `position` (`context`, `statement`, `options`).
  - If position is missing, default to `context`.

## Responsive layout requirements

- The card adapts to available width; it must look balanced at narrow, medium,
  and wide container sizes.
- Narrow layout (mobile): single column; assets stack between context/statement
  and options, with consistent spacing.
- Medium layout: allow assets to sit beside text when it improves readability.
- Wide layout: allow a two-column layout when assets are large or numerous, but
  keep options easy to scan.
- Layout should be driven by container width, not only viewport width.
- Prefer CSS container queries to adapt layout within different page widths.

## Styling decisions (base)

- Styles live in `.vitepress/theme/styles/enem-question-card.css`.
- Class naming uses a BEM-like `enem-question-card__*` scheme.
- Card background uses `--vt-c-bg` with a subtle border; secondary blocks use
  `--vt-c-bg-soft`.
- State shells (loading/error/empty) reuse the card frame for consistency.
- Option lists explicitly override `.vt-doc` list markers to avoid stray bullets.
- Statement uses the same boxed treatment as context for visual consistency.
- Option letters are separate circular buttons to the left of the option box.
- Option boxes are clickable and independent from the letter button.
- Insets and option sizing are controlled via CSS variables
  (`--enem-card-inset`, `--enem-option-button-size`, `--enem-option-gap`).
- Base typography uses the Calibri stack at 15px with `line-height: 1.4` and
  `word-spacing: -0.03em` (no full justification currently).
- Context paragraphs split on blank lines and each paragraph gets a first-line
  indent. Statement paragraphs are indented, prompt text is not.
- Assets render inside `.enem-question-card__asset` containers with a shared
  soft background and border for visual continuity. Formula assets keep the
  outer box while math segments get their own inline highlight (no border).
- Multiple image assets in the same position render as a responsive image grid
  to reduce oversized single-column stacks.
- Image assets include a subtle media frame and optional caption.
- Tables render with simplified borders and a slightly smaller font size.
- Formula assets render with KaTeX when possible, with a monospace fallback if
  rendering fails. Use `segments` to mix text and math.
- Markdown math in context/statement is rendered by MathJax (via
  `.vitepress/mathjaxMdPlugin.ts`).
- KaTeX output is left-aligned and uses the base site font with italic styles
  disabled to blend with surrounding text.
- Assets should avoid hardcoded background colors; prefer transparency so they
  look correct in both light and dark modes.

## Asset rendering rules

- Assets are grouped by position: `context`, `statement`, `options`.
- If `position` is missing, assets default to `context`.
- Order is grouped by type (images, tables, formulas). If ordering matters
  later, add an `order` field to assets.
- In sandbox mode, missing asset types render placeholder tiles in the
  statement assets block so layout gaps are visible during development.
- Image URLs resolve as:
  - Absolute `http(s)` URLs as-is.
  - Absolute paths (`/enem/...`) via `withBase`.
  - Relative paths as `/enem/{year}/{file}` via `withBase`.
- Formula asset strings should be raw LaTeX without delimiters.
  Delimiters like `$$...$$` or `$...$` should be avoided in `assets.formulas`.
- Mixed content example:
- `segments`: `[ { type: 'text', value: 'Texto ' }, { type: 'katex', value: 'E=mc^2' }, { type: 'text', value: ', etc.' } ]`
- Text segments should include the spaces or punctuation they need around the
  math blocks.
- Inline math in context/statement should use `$...$` (MathJax).
- Block math in context/statement should use `$$...$$` (MathJax), rendered as a
  centered block (no card container).
- Avoid `\(...\)` and `\[...\]` in Markdown content; they are not parsed by the
  current MathJax markdown plugin.
- Use formula assets for math that must live in the assets flow.

## Asset versions (raw vs improved)

- Every asset should support two versions:
  - `raw` (original from PDF extraction).
  - `improved` (recreated or cleaned for best display).
- The renderer should prefer `improved` when available.
- If `improved` is missing, fall back to `raw`.
- Early passes will often include only `raw`; improved assets are added later.

## Recent implementation notes (2025-12-24)

- Inline math in context/statement uses `$...$`; block math uses `$$...$$`.
- Avoid `\(...\)` and `\[...\]` in Markdown content; they are not parsed by the
  MathJax markdown plugin.
- Prompt/statement now render as separate blocks when `prompt.text` is present
  and different from `statement`.
- Statement text is indented; prompt text is not.
- Context spacing inside the box is controlled by the container gap (currently
  set to `0` in `.enem-question-card__context`).
- Q152 uses an improved D3 chart asset (`q152_chart_001`); the raw chart image
  is stored but not referenced in JSON.
- Manual fixes are applied in `pipeline-enem-extraction/adjusted/2025/` and
  mirrored into `src/public/enem/2025/` for the site.
- Raw assets live under `.../images/raw/{area}/` with question-scoped names
  like `q152_img_001.jpeg`; improved charts live under `.../charts/` with
  matching `*_meta.json` + `*.csv`.

## Nested components (proposed)

- `QuestionCard`: container, orchestrates layout and state.
- `QuestionHeader`: number/area/subject/badges.
- `QuestionContext`: context body and source attribution.
- `QuestionStatement`: prompt text.
- `QuestionOptions`: list wrapper.
- `QuestionOption`: single option row.
- `QuestionAssets`: routes assets by type and position.
- `AssetImage`: renders static images.
- `AssetChart`: renders D3 charts and fallbacks.
- `AssetTable`: renders table assets.
- `AssetFormula`: renders LaTeX.
- `QuestionFooter`: answer reveal, metadata, actions.

## D3 chart and image component requirements

- `AssetChart` loads `data_file` (CSV) and `meta_file` (JSON) from
  `/enem/{year}/charts/...`.
- Supported chart types: `bar`, `line`, `pie`, `area`, `scatter`, `histogram`.
- Use metadata for labels/axes/colors when present; fallback to defaults.
- Provide an `aria-label` from `meta.title` or a derived description.
- Reuse the same D3 base component for all chart-like assets.
- Support interactivity when declared by metadata (legend toggles, filters,
  and animation controls).
- Optional fallback: show the original chart image if data is missing.
- See `docs/enem-charts.md` for detailed chart architecture.

## Interactive chart behaviors

- Legend items toggle series visibility (touch and click).
- Filters can toggle categories or ranges when metadata provides filter rules.
- Hover or tap shows a tooltip; taps can pin/unpin the tooltip on mobile.
- Play/pause controls step-based animations (when declared by metadata).
- Reset returns to the default state (all series visible, no filters).
- Interactions stay scoped to the chart and do not affect question answers.

## Chart component structure (proposed)

- `AssetChart`: data loading, error handling, layout wiring.
- `ChartFrame`: title, caption, and control layout.
- `ChartCanvas`: D3 render target (SVG or canvas).
- `ChartLegend`: interactive legend with toggle states.
- `ChartControls`: play/pause/reset and filter controls.
- `ChartTooltip`: hover/touch tooltip.
- `ChartFallback`: optional static image fallback.

## Chart state model (draft)

- `visibleSeries`: set of series ids.
- `activeFilters`: key/value map of filter states.
- `isAnimating`: boolean.
- `animationStep`: number or percent.
- `hoveredDatum`: optional data point for tooltip.
- `focusedDatum`: optional data point for keyboard navigation.
- `reducedMotion`: derived from `prefers-reduced-motion`.

## Performance and motion

- Respect `prefers-reduced-motion`; do not autoplay animations.
- Pause animations when the chart is off-screen.
- Cache parsed CSV/meta data per question to avoid re-parsing.
- Debounce resize reflows to avoid layout thrash.

## Loading and error states

- `QuestionCard` handles loading, empty, and not-found states.
- Asset components handle missing files gracefully and render placeholders.

## Accessibility

- Images require `alt` text; if missing, use a safe placeholder string.
- Tables use proper table semantics; add captions when available.
- Options support keyboard navigation and focus states.
- Avoid auto-announcing correct answers unless explicitly requested.
- Chart controls must be keyboard accessible with clear focus states.

## Open questions / TODO

- Do we join `answers.json`, or rely on `correct_answer` inside each question?
- Should users toggle english/spanish for questions 1-5?
- Should statement/options be rendered as Markdown or plain text?
- How should charts be themed to match the site styles?
- What is the UX for review mode vs practice mode?
- Should we define a chart metadata schema for interactivity and animations?
