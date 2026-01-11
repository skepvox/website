# ENEM Solutions — Assumptions and Conventions

This document defines the writing rules, assumptions, and structure for ENEM
question solutions in this repository.

## Scope

- Applies to ENEM 2025 Mathematics (questions 136–180) and Ciências da Natureza
  (questions 91–135).
- Solutions are written to be beginner-friendly and self-contained.
- We assume the reader does not know the formulas used in the solution.

## Solution structure

Each solution has three levels, in this order:

1) **Solução completa**  
Full narrative text used as the TTS source (audio generation).

2) **Solução resumida**  
Short reasoning overview, with formulas on their own lines when needed.

3) **Solução passo a passo**  
Step-by-step explanation, using H4 headings for each step.

The “Solução completa” is plain text only (no LaTeX/Markdown math).

## Solution JSON format

Solutions live in `src/public/enem/{year}/solutions/{year}-{NNN}.json` and use
this structure:

- `question_id`: string like `2025_q091`.
- `final_answer`: object with:
  - `letter`: `A`–`E`, or `null` when annulled.
  - `value`: display text (e.g. `0,06 mg` or `Questão anulada`).
- `short_md`: Markdown for the “Solução resumida”.
- `steps`: list of `{ title, body_md }` for “Solução passo a passo”.
- `tts_text`: plain text used as the “Solução completa” and TTS source.

The generator maps these fields into the Markdown leaves via
`scripts/generate-enem-question-pages.js`.
Question pages under `src/enem/{year}/{area}/questao/` are generated from the
JSON and should be regenerated after edits to keep content in sync.

Annulled questions:
- Set `final_answer.letter` to `null`.
- Set `final_answer.value` to `Questão anulada`.
- Mention the annulment in `short_md`, one step, and the `tts_text`.

## Formula-first rule

When a formula is used, the first step must:

- Present the formula.
- Define each symbol (variables and constants).
- State any required conditions (e.g., convexity for Euler's formula).

Example:

- "Pela relação de Euler: $V - A + F = 2$"
- "*V* = número de vértices, *A* = número de arestas, *F* = número de faces."

## Notation

- Use Portuguese symbols and labels:
  - *V* = vértices
  - *A* = arestas
  - *F* = faces
- Use inline math `$...$` only for inline expressions.
- For standalone formulas, prefer `$$...$$` (left-aligned via CSS) so
  subscripts/superscripts don't collide with surrounding lines.
- For multi-line equations, wrap only the equations in `$$\n\\begin{aligned}...\n\\end{aligned}\n$$`.
  Keep prose outside the aligned block, and align `=` with `&=` when possible.
- When aligning equations, prefer consecutive `=` lines over `\\Rightarrow`
  so the equals signs align.
- Use inline math for number+unit pairs (e.g., `$7,5\\,\\text{L}$`, `$80\\%$`,
  `$2\\,\\text{h}$`). Keep the unit inside math.
- Use inline math for all numeric quantities in prose (including counts like
  `$8$ garrafas`), except for years/labels (e.g., 2025 or 11-12) which remain
  plain text.
- Prefer `\times` for multiplication.
- Use parentheses to isolate products and divisions when they appear in sums.
- For symbol definitions after "onde:", use `$V$ = ...` on separate lines.
  Each variable must be on its own line (no comma-separated lists).
  In running sentences, prefer italic text for single-letter symbols to avoid
  line-height issues.
- For inline variable indices in sentences (e.g., t1, f2, S1), prefer
  `t<sub>1</sub>` instead of inline math to avoid line-height issues.
- For subscripts inside formulas, prefer short indices (e.g., $N_f$, $V_t$)
  and define them in text instead of multi-letter subscripts.
- Use `\text{...}` when a formula line needs prose inside an aligned block;
  keep it short and place units outside math when possible.

## Units and rounding

- Always state units (when applicable).
- If rounding is used, explain the rule (e.g., rounding to nearest integer).
- Keep numeric formatting consistent with the question (decimal comma in PT).

## Assets

- Tables and plots referenced in solutions must map to assets in `src/public/enem/`.
- Use assets only when they add clarity beyond text.

## QA checklist

- Answer letter matches `correct_answer`.
- For annulled questions, `final_answer.letter` is `null` and the solution
  explicitly notes the annulment.
- All formulas are defined before use.
- Units and symbols are consistent throughout.
- "Texto completo" matches the final result and tone.
- Numbers in prose follow the numeric rule (inline math, except years/labels).

## Manual review workflow (standard)

When standardizing a new year, use a manual, question-by-question pass rather
than bulk regex changes. This avoids edge cases and keeps math readable.

1) Start from the JSON source:
   `src/public/enem/{year}/solutions/{year}-{NNN}.json`
2) For each question, review only:
   - `short_md` (Solução resumida)
   - `steps[].body_md` (Solução passo a passo)
   - Keep `tts_text` plain text.
3) Apply the formatting rules above with context:
   - Convert line equations to display blocks.
   - Use `aligned` blocks only around equations (keep prose outside).
   - Align `=` with `&=`; avoid `\\Rightarrow` when aligning.
   - Keep units inside math and use `\\,` for spacing.
   - Wrap numeric quantities in prose with `$...$` (except years/labels).
4) Regenerate question pages:
   `node scripts/generate-enem-question-pages.js --year {year} --area {area} --label \"...\" --short \"...\"`
5) Visually spot-check a handful of pages (including one with aligned equations,
   one with mixed prose + inline math, and one with units).

## MathJax rendering (site settings)

- MathJax uses CHTML with the default NewCM font. The font URLs are rewritten
  to CDN paths in `.vitepress/mathjaxMdPlugin.ts` to prevent clipping.
- `mtextInheritFont` is set to `false` so `\text{}` uses MathJax font metrics.
- Inline math baseline is aligned in `.vitepress/theme/styles/pages.css` via
  `mjx-container[jax="CHTML"] { vertical-align: 0; }`.
- Display math size is bumped to match inline text with
  `mjx-container[jax="CHTML"][display="true"] { font-size: 1.1em; }`.
