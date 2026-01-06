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
- Prefer `\times` for multiplication.
- Use parentheses to isolate products and divisions when they appear in sums.
- For symbol definitions in sentences (e.g., V, A, F), use italic text instead
  of inline math to avoid line-height issues with single-letter formulas.
- For inline variable indices in sentences (e.g., t1, f2, S1), prefer
  `t<sub>1</sub>` instead of inline math to avoid line-height issues.
- For subscripts inside formulas, prefer short indices (e.g., $N_f$, $V_t$)
  and define them in text instead of multi-letter subscripts.
- Avoid `\text{...}` inside formulas; use variables and define them, and place
  units outside math when possible.

## Units and rounding

- Always state units (when applicable).
- If rounding is used, explain the rule (e.g., rounding to nearest integer).
- Keep numeric formatting consistent with the question (decimal comma in PT).

## Assets

- Tables and plots referenced in solutions must map to assets in `src/public/enem/`.
- Use assets only when they add clarity beyond text.

## QA checklist

- Answer letter matches `correct_answer`.
- All formulas are defined before use.
- Units and symbols are consistent throughout.
- "Texto completo" matches the final result and tone.
