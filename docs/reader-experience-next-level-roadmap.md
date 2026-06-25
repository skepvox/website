# Reader Experience — Next-Level Design & Implementation Roadmap

**Subject:** taking the pt reading experience for `/louis-lavelle/introducao-a-ontologia/` from
"foundation works" to a sophisticated, modern, **calm, bookish** reader — before any second edition
or book inherits the template.

**Method:** doc-only. No code changed. Grounded in the live components/tokens (`path:line`), a
four-paradigm design panel (printed-book, iOS-list, e-reader, modern-editorial), and cited
state-of-the-art research on reading typography and reader chrome. Where the panel diverged, the
divergence is reported and adjudicated, not averaged.

**Strategic frame (carried from the prior assessments):** we are migrating *away* from rented
`@vue/theme`/docs behaviour toward an **owned reader shell** — owned components, owned interaction
language, owned visual language. Rented pieces remain as infrastructure during the migration but are
**not** the reader app's design source of truth. This frame decides the icon recommendation (§5/§6).

**Phase commitment:** this is the active roadmap for the next reader-experience phase. We follow it
end-to-end, from Slice A through the readiness gate, before adding the fr edition or using this
template for another book. Implementation may refine the details when the evidence justifies it, but
the foundation goals stay fixed: calm typography, harmonious hub and leaf composition, owned reader
chrome, preserved performance boundaries, accessibility, and visual verification on the proof work.

---

## 1. Current Experience Audit

Inspected: the hub and first (`…/00-00-000-001-advertencia`), middle (`…/00-02-001-051-paragrafo-50`),
and last (`…/99-99-999-099-paragrafo-98`) leaves, mobile (Pixel 5) + desktop (1280), light + dark.

### Honest hierarchy read (with the numbers that cause each problem)

| Surface element | Current value | Honest read |
|---|---|---|
| **Hub work title** `.pwc__title` | **2.5rem / 40px**, 700, `--sk-text`, margin-bottom 1.85rem | Too large *and* detached. It is **bigger than the prose `h1` (36px)** it isn't, and floats ~1.85rem above a 15px part label — a ~2.6× cliff that reads as two unrelated zones. |
| **Hub part label** `.pwc__part-heading` | 0.95rem / ~15px, 600, sentence-case | "Doesn't belong": a one-off 15px sentence weight that matches neither the 12px uppercase chapter button below it nor the title above. Different type language from its own children. |
| **Hub chapter disclosure** `.pwc__chapter-heading` | 0.74rem / ~12px **UPPERCASE**, 0.09em, muted | Reads as a *caption*, not a heading. |
| **Hub segment row** `.pwc__link` | **1rem / 16px**, muted | **The core bug — hierarchy inversion:** 16px rows are visually *heavier* than their 12px-uppercase chapter and their 15px part. The child out-shouts the parent, so the map reads as a flat list of links, not a nested contents. |
| **Leaf context eyebrow** `.pseg-context` | 0.76rem, muted, `Introdução à ontologia · Primeira parte` | The "`·`" middle-dot is punctuation debris; the work title is redundant on every page (it's in the up-link). |
| **Leaf chapter heading** = markdown `## …` → `vt-doc h2` | **22/24px**, line-height 1.28, **`::before` accent bar (2rem×2px)**, **margin-top 3rem** | **The "huge typographic event."** A chapter-opener ceremony fires *identically* (`## Distinção`) at the top of every single-paragraph leaf — Parágrafo 1, 2, 3… each re-detonate a 24px heading + accent bar over one paragraph. `pages.css:129-148,216-218`. |
| **Leaf segment title** = markdown `### …` → `vt-doc h3` | 18/19px | Second announcement, stacked under the first. |
| **Prose body** | Literata, 35rem measure, 1.75 line-height, ~16px | **Already excellent and owned-feeling.** The calm centre. |
| **Bottom nav** `.pseg-nav` | `‹ Trecho anterior` / `Próximo trecho ›` (0.72rem UPPERCASE dir) + `↑ Índice — Introdução à ontologia` | Functional and clean, but text-glyph arrows (`‹ › ↑`) and an over-long up-link read as hand-rolled, not crafted. Also inconsistent: hub says **"Sumário"**, leaf says **"Índice."** |
| **Return highlight** | `aria-current` + inset 2px accent bar, auto-opens chapter | **Right idiom** — quiet, URL-driven, no stored progress. Keep. |
| **Light/dark** | Warm `#fcfcfa` / "lamplight" `#181510`, ivory ink | Mature and owned. Dark compresses contrast (ivory `.62` muted) — a constraint the new smaller type must respect (§9). |

### Where it still reads as VitePress/docs vs already-owned

- **Already owned (keep):** the prose typography (Literata, measure, rhythm), the warm light/dark
  surface system, the hub disclosure map, the return-highlight, the slot-injected chrome.
- **Still docs/rented styling:** the **leaf `## h2` with its `::before` accent bar** is `@vue/theme`
  doc-heading styling (`pages.css` `.vt-doc h2`) standing in for reader chrome — the single most
  "docs-event" element. The **text-glyph arrows** and the **CSS-triangle chevron**
  (`.pwc__chevron`, a hand-rolled border-triangle) read as placeholder, not a designed icon
  language. The **type scale itself** (linear `--sk-text-*`, used opportunistically) has no
  reader-specific vocabulary, so the hierarchy was assembled ad hoc — which is why it inverts.

**One-line diagnosis:** the prose is owned and calm; the *chrome around it* is a mix of rented
doc-heading styling and ad-hoc sizes with no reading-specific scale, producing (a) a leaf that
re-announces itself every trecho and (b) a hub whose nesting is visually inverted.

---

## 2. Typography System

**Principle (from the research).** For prose split into many tiny segments, the *frequency* of
heading events is high, so the *per-event contrast must be low* — "use font weight, color, or spacing
to create distinction instead… a scale with lower contrast feels calm and understated"
([Cieden](https://cieden.com/book/sub-atomic/typography/establishing-typographic-hierarchy);
Harvard DS ships a restrained 16×1.125 reading scale). Eyebrows must be "visibly smaller and less
prominent than headings" and **not appear above every heading so prominently they become noise**
([REI Cedar](https://cedar.rei.com/guidelines/typography/eyebrow);
[QCFixer](https://www.qcfixer.com/2025/12/27/what-is-an-eyebrow-in-web-design/)). All-caps is fine
"for headings shorter than one line… labels," never for prose, and **must be letterspaced 5-12%**
([Butterick](https://practicaltypography.com/all-caps.html),
[letterspacing](https://practicaltypography.com/letterspacing.html)). Measure 50-75ch, ~66 ideal;
serif body line-height ~1.5-1.75 ([Baymard](https://baymard.com/blog/line-length-readability)).

**Scale geometry decision.** Do **not** introduce a parallel modular numeric scale (it would add
contrast and a maintenance fork). Instead, define a small set of **semantic reading-shell tokens**
that *alias the existing `--sk-text-*` rungs*, plus one off-rung display size. The chrome then lives
in a deliberately tight 12-16px band; the **prose is the largest reading element**; the only large
thing in the whole app is one hub title. This gives the reader shell its own vocabulary without a
second scale (answers §7's "avoid a one-off CSS mess").

### Proposed reading type scale (concrete)

| Level | Size rem (px) | Weight | Colour token | Treatment |
|---|---|---|---|---|
| **Hub work title** | `--sk-reading-title` **1.875rem (30px)** | 600 | `--sk-text` | line-height 1.16, ls −0.02em; **matches the prose `h1`** so hub↔leaf share one masthead; tight margin, bound to the map by a hairline. *Optional* serif (§5). Down from 40/700. |
| **Hub edition/context line** *(new, keep one)* | `--sk-text-xs` **0.8125rem (13px)** | 600 | `--sk-text-muted` | small-caps (uppercase + ls 0.06em): `LOUIS LAVELLE — EDIÇÃO EM PORTUGUÊS`. Gives the title a home; sits between title and hairline. |
| **Hub part label** | `--sk-reading-kicker` **0.8125rem (13px)** | 650 | `--sk-text` (full ink) | small-caps, ls 0.08em; a **section divider** with a trailing hairline. Full-ink + tracking makes it *own* its chapters despite the small size. |
| **Hub chapter disclosure** | `--sk-text-sm` **0.9375rem (15px)** | 550 | `--sk-text` / `--sk-text-body` | **sentence case** (drop the 12px UPPERCASE). The readable tap-target title. Top hairline, ≥44px, chevron icon, tabular count. |
| **Hub segment row** | `--sk-text-sm` **0.9375rem (15px)** | 400 | `--sk-text-muted` | indented 1.25rem, ≥44px. Lighter + muted + indented → reads *under* the chapter. **Fixes the inversion** (Part 13 ink-caps > Chapter 15 sentence-ink > Segment 15 muted-indented). |
| **Leaf chapter kicker** *(owned, real `<h2>`)* | `--sk-reading-kicker` **0.8125rem (13px)** | 600 | `--sk-text-muted` | small-caps, ls 0.07em, **no accent bar**. The chapter becomes a quiet eyebrow the eye habituates to, not a banner. |
| **Leaf segment title** *(owned, real `<h3>`)* | `--sk-text-base` **1rem (16px)** | 600 | `--sk-text` | sentence case; the one line that changes trecho→trecho. Sits *below* the prose size, so prose wins. |
| **Prose body** | **1.0625rem (17px)** `--sk-text-md` | 400 | `--sk-text-body` | Literata; measure 35rem; line-height 1.75; para-space 1.4em. A gentle bump (16→17) makes the serif voice the largest comfortable element so chrome sits under it. (16px is the conservative fallback.) |
| **Prev/next/up nav** | dir `--sk-text-2xs` 12px / title `--sk-text-sm` 15px / up `--sk-text-xs` 13px | dir 600, title 400 | dir muted, title body, up muted | dir small-caps (drop UPPERCASE-shout); chevron icons; up = icon + "Sumário". |

**The whole ramp:** 12 → 13 → 15 → 16 chrome, **17px prose on top**, one 30px hub title. Largest
chrome jump 13→15 (1.15×); the 40px title and 24px leaf-event are gone, and the leaf reads
**part-eyebrow(13) → segment-title(16) → prose(17)** — a gentle ascent *into* the prose, never a
spike.

**New semantic tokens (in `vars.css`, aliasing existing values — dark mode flows automatically):**
```
--sk-reading-title:        1.875rem;            /* hub/leaf masthead (off-rung display) */
--sk-reading-title-font:   var(--vt-font-family-base); /* sans default; flip to --sk-reading-font for the serif experiment */
--sk-reading-kicker:       0.8125rem;           /* part label + leaf chapter kicker (one family) */
--sk-reading-kicker-tracking: 0.07em;
--sk-reading-row:          0.9375rem;           /* chapter disclosure + segment rows + nav titles */
--sk-reading-segtitle:     1rem;                /* leaf segment title */
--sk-reading-prose:        1.0625rem;           /* body (today implicit 1rem) */
--sk-reading-current:      var(--sk-accent);    /* the one structural accent (current-marker bar) */
--sk-reading-hairline:     var(--sk-rule);      /* semantic name for the hairline language */
```
No new **colour** tokens — the existing four-step ink ramp (`--sk-text/-body/-muted/-faint`) carries
every level; the accent stays a *structural* mark (current bar, link underline), never a heading
colour.

**Literata stays prose-only** (it ships only 400/700/400-italic — no small-caps glyphs, so "small
caps" = uppercase + tracking on the sans, the existing house idiom). See §5 for the one optional
serif touch.

---

## 3. Hub Composition

**What `PipelineWorkContents` should own:** the H1/title, an edition/context line, the whole map, the
current-segment highlight — **yes to all** (it already owns the title, map, and highlight; add the
edition line). The future **edition switcher is deferred** to after the fr edition (§6) but the hub
should leave a natural slot for it (a quiet control by the title), not build it now.

**Direction — pick one:** a **printed table of contents executed with the calm and touch-rhythm of a
modern list surface.** Not an iOS copy (we stay bookish/warm, not SF-grey), not Kindle-sparse (we
keep editorial warmth), not docs-tree (no boxes/borders per group). The hub *is* a contents page; we
render it with hairlines, a shared left indent, quiet disclosures, and one structural accent.

**More harmonious layout:**
1. **Title integrated:** 30px/600, a 13px small-caps edition line directly beneath, then a
   **full-width hairline**, then the map. The title becomes the *head of the contents*, not a floating
   banner. (Bind, don't separate.)
2. **Part labels belong:** 13px small-caps **full-ink** kicker with a trailing hairline divider — the
   same kicker family as everything else in the map, so it reads as the section's banner rather than
   a one-off line.
3. **Calmer, clearer disclosures + corrected hierarchy** (the central fix): chapter → **15px
   sentence-case ink** (a readable title, not a 12px uppercase caption); segment rows → **15px muted,
   weight 400, indented**; part → **13px ink small-caps** divider. Descent is now monotonic by
   case/weight/colour/indent, with size near-flat. Replace the CSS-triangle with an **owned chevron
   icon** (§5).
4. **Segment rows that don't look like generic links:** indent + quiet muted ink + ≥44px row rhythm +
   hairlines make them read as TOC entries, not `<a>` tags. No underlines.
5. **Current highlight quiet but visible:** keep `aria-current` + the inset 2px accent bar + full ink;
   add `scroll-margin-top` so the return-scroll lands the row a third down (not dead-centre). The
   *only* accent that touches text on the hub. No progress %, no checkmarks, no "last read" (personal
   data, out of scope).

---

## 4. Segment Leaf Composition

**Current leaf top:** eyebrow (12px) + `## h2` (24px + accent bar + 3rem margin) + `### h3` (19px) +
prose — ~75px of chrome and a chapter-scale event over one paragraph, fired identically every trecho.

**Decision — adopt an owned compact reader-header; demote both headings to calm sizes; keep real
`<h2>`/`<h3>`.** This is the panel's consensus and the heart of the fix.

- **Chapter heading → a 13px small-caps kicker (real `<h2>`), no accent bar.** The eye registers
  "Distinção" once and habituates; identical kickers across consecutive trechos read as *the same
  room*, not three new doors.
- **Segment title → 16px (real `<h3>`)**, the one line that changes trecho→trecho, sitting *below*
  the 17px prose so the prose still owns the page.
- **Compact reader header, not raw markdown headings.** Today the `## chapter`/`### segment` are
  inlined verbatim from the vendored prose by the **website generator**
  (`scripts/build-pipeline-segment-routes.py`; the book pipeline is off-limits, the website generator
  is fair game). Move them into an owned header:
  - **Decision: yes, eventually strip/transform the prose headings and let owned chrome render
    them** — but keep them **real, crawlable `<h2>`/`<h3>` in document order**. Mechanism: the
    generator detects the leading `## …`/`### …`, lifts them out of the inlined prose body, and emits
    a small owned reader-header that renders the same text as genuine `<h2>`/`<h3>` (styled at the
    13px/16px reading sizes, no `::before` bar, no 3rem margin). **Same text, same tags, same order —
    relocated into chrome and re-styled.** Document outline + SEO are preserved byte-for-meaning; the
    prose body simply no longer restarts with a display heading. Exactly one real `h2` + one real `h3`
    per page (no duplication).
  - **Staging (important):** do the **CSS-only de-escalation first** (drop the `h2::before` bar,
    shrink to the reading sizes, collapse `--sk-reading-heading-space` from 3rem→~1.25rem, scoped to
    `.VPContentDoc:not(.has-aside)`) — this kills the "event" with **no generator change and the
    markdown headings intact** (Slice A). Then do the **owned-header generator hoist** (Slice B) for
    full control and to retire the rented `vt-doc h2` styling on reading leaves. The CSS step is the
    safe immediate win; the generator step is the stronger owned answer.
- **Drop the redundant work-title from the leaf eyebrow.** The work lives in the up-link and the
  page `<title>`; the leaf needs only chapter + segment. This removes the "`·`" separator problem at
  the source (§5).
- **Prose rhythm unchanged** (Literata, 35rem, 1.75, 1.4em); only tighten the header→first-paragraph
  gap to ~1.25rem so the trecho reads continuous.

---

## 5. Navigation Language

**Kill the "`·`"/slash entirely.** Carry hierarchy with **type, space, and a drawn hairline**, never
punctuation ([Eleken 2026](https://www.eleken.co/blog-posts/breadcrumbs-ux);
[Setproduct](https://www.setproduct.com/blog/breadcrumbs-ui-design)). Concretely:
- **Work/part context:** gone from the leaf eyebrow as a joined string. The leaf header's **chapter
  kicker** is the orientation; the **up-link** names the work. No separator needed.
- **Prev/next:** keep the two-line cells; replace the `‹ ›` text glyphs with **owned chevron icons**;
  demote the UPPERCASE dir labels to **small-caps sentence** ("Trecho anterior" / "Próximo trecho").
  The chevron carries direction (the Kindle/Apple Books idiom — quiet chrome, glimpse of continuity).
- **Up / back to contents:** replace `↑ Índice — Introdução à ontologia` with an **owned contents/up
  icon + "Sumário"** (Apple Books uses a list glyph, not the word "Contents"
  [iMore](https://www.imore.com/how-view-and-navigate-through-books-table-contents-ibooks-iphone-and-ipad)).
  **Unify the term: "Sumário" everywhere** (hub `navLabel` already says Sumário; the leaf says
  "Índice" — pick one). Keep the `#trecho-<prefix>` hash so the hub re-opens + marks the trecho.
- **Current location:** the chapter kicker (top) + the highlighted row on return (via the up-link).
  No breadcrumb chain.

### Icons — owned, per the strategic frame

The research confirmed both options are SSR-safe; **the steering decides the choice**: do **not**
make the reader shell depend on `@vue/theme`'s `VTIcon*` as a long-term foundation (it is rented docs
chrome — fine as migration infrastructure, not the design source of truth). Own the icon language:

- **Recommended: adopt `lucide-vue-next` as the deliberate, owned-by-choice icon dependency.** It is
  SSR-safe with **named imports** (each icon is a pure inline-SVG Vue 3 component, no DOM access on
  import — exactly VitePress's SSR-safe pattern), tree-shaken per icon (~a few KB for 5-6 glyphs),
  and exposes `stroke-width`/`size` so we can tune one **hairline 1.5px** reader stroke
  ([Lucide Vue](https://lucide.dev/guide/packages/lucide-vue-next);
  [VitePress SSR](https://vitepress.dev/guide/ssr-compat)). The roadmap *does* justify a broader
  reusable vocabulary (chevron-left/right, chevron-up/up for "up to contents", `list`/`text` for the
  contents glyph, `languages`/`globe` for the future edition switch, `circle` for current) — a
  cohesive 5-8 glyph family is the condition under which a deliberate dependency is warranted. Import
  named icons only (never the dynamic generic loader). This becomes an **owned `ReaderIcon` boundary**
  (§6): a thin wrapper so the reader shell imports one owned module, not lucide directly everywhere.
- **Zero-dep alternative (if dependency budget is hard-locked):** vendor a tiny **owned inline-SVG
  set** (4-5 chevron/arrow/dot paths sourced from lucide's open SVGs but committed as our own
  components). This keeps full ownership with no dependency, at the cost of hand-maintaining the set
  as it grows.
- **Do NOT** build the reader shell on `VTIcon*`. (It may stay in the rented navbar/search during
  migration.)

**Icon a11y:** icons beside text are decorative → `aria-hidden="true"` on the SVG (lucide does this
by default), the accessible name on the button/link, never `aria-hidden` on the interactive parent
([a11y-collective](https://www.a11y-collective.com/blog/aria-hidden-meaning/)); current-location is
never colour-only (we already pair the bar with `aria-current`); gate the chevron rotation behind
`prefers-reduced-motion` (§9).

---

## 6. Component Architecture

**Are the current three enough?** For Slice A (CSS/tokens) and the nav-language refinement — **yes**:
`PipelineWorkContents`, `PipelineSegmentNav`, `SkLink` absorb the type/colour/spacing changes with no
new boundary. The boundaries doc's verdict holds through Slice A.

**Where a new component becomes justified (strict test: clearer reader-shell boundary or real
complexity removed, not naming):**

- **`PipelineReaderHeader` — JUSTIFIED at Slice B.** When the leaf top grows from a one-line eyebrow
  into a structured header that **owns the heading hoist and renders real `<h2>`/`<h3>`**, it stops
  being "nav." Today `PipelineSegmentNav` bundles a top context-eyebrow into a fundamentally
  prev/next/up component via the `placement` prop — a mild mismatch. Slice B resolves it: extract
  `PipelineReaderHeader` (top: chapter kicker + segment title, as real headings) and let
  `PipelineSegmentNav` be purely the bottom nav. This removes the `placement: 'top'` branch and gives
  the leaf a clean header/body/nav boundary.
- **`ReaderIcon` (owned icon wrapper) — JUSTIFIED at Slice C.** One owned module the reader shell
  imports, wrapping lucide-named-imports (or the vendored SVG set) with our size/stroke defaults +
  a11y defaults. It is the owned icon boundary the strategic frame requires.
- **`PipelineReaderContext` / `PipelineReaderNav` / `PipelineReaderChrome` — REJECT (now).**
  `ReaderContext` is subsumed by `PipelineReaderHeader`; `ReaderNav` is just `PipelineSegmentNav`
  renamed; `ReaderChrome` (a wrapper) adds a layer the `@vue/theme` slots already provide. None
  removes real complexity.
- **`PipelineContentsTree` / shared `ContentsTree` — STILL TOO EARLY.** Reaffirm the boundaries-doc
  deferral: extract a shared tree only when a **second pipeline work** exists and the shape has
  settled; doing it now re-couples the deliberately separate pipeline-export and legacy
  `segment-manifest` data worlds and breaks `segment-manifest.spec.ts`'s exact-consumer invariant.
- **`PipelineEditionSwitch` — DEFER to the fr edition.** Meaningful only with two editions.

**Target component map (next 2-4 slices):**

| Slice | Components |
|---|---|
| A (CSS/tokens) | *(none new)* — `vars.css`, `pages.css`, `PipelineWorkContents`, `PipelineSegmentNav` |
| B (leaf header) | **+ `PipelineReaderHeader`**; generator hoist; `PipelineSegmentNav` sheds top-context |
| C (nav/icons) | **+ `ReaderIcon`** (owned, lucide-backed); refine `PipelineSegmentNav`, `PipelineWorkContents` chevron |
| D (hub polish) | refine `PipelineWorkContents` (no new component) |
| later | `PipelineContentsTree` (2nd work), `PipelineEditionSwitch` (fr edition) |

---

## 7. Visual Tokens and CSS Architecture

**Audit:** the `--sk-*` system is strong and owned — type scale, spacing (1-7), motion
(`--sk-motion-*` + `--sk-ease`), focus ring (`--sk-focus-ring` 2px accent), reading rhythm
(`--sk-reading-measure` 35rem, line-height 1.75), and a full light/dark colour ramp routed through
the theme. The gap is the **absence of reading-shell-specific semantic tokens**, which forced ad-hoc
per-component sizes (and the inversion).

**Proposed additions (the §2 token block):** the `--sk-reading-title / -kicker / -row / -segtitle /
-prose / -current / -hairline / -title-font` set — **all aliasing existing scale/colour values**, so
they add a vocabulary, not a second scale, and flip in dark mode for free.

**Where styles live (avoid a one-off mess):**
- **`vars.css`** — the new semantic reading tokens (the single home for the numbers).
- **Component-scoped `<style scoped>`** — `PipelineWorkContents` (hub levels), `PipelineReaderHeader`
  (leaf header levels), `PipelineSegmentNav` (nav) consume the tokens; no hard-coded sizes.
- **`pages.css`, scoped to `.VPContentDoc:not(.has-aside)`** — the leaf prose-heading override (drop
  `h2::before`, shrink h2/h3, reduce `--sk-reading-heading-space`). Scoping keeps any genuine
  long-form page's headings intact.
- **The current-marker** (`--sk-reading-current` + inset bar) tokenised once so hub + leaf share it.

---

## 8. Performance and Scale

**Confirmed boundary (keep + keep testing):** the hub loads **metadata only, no prose**; each leaf
loads **only its own prose** (route-level static page); **no all-99 prose bundle** exists. The
metadata JSON is prose-free by construction. None of the proposed work changes this — the owned
reader-header reads the same metadata; lucide named imports add a few KB.

**Future stress cases:**
- **Confissões (~453 paragraph segments):** the hub renders all-N metadata rows (SSR'd, in DOM via
  `v-show`). 453 anchors in the DOM is fine; the only concern is a single *expanded* 453-row chapter
  on a low-end phone. **Default-collapsed chapters already mitigate** (only part/chapter headers
  render visibly until expanded). Revisit windowing **only** if a real device shows jank on a fully
  expanded fine-grained work.
- **Karamázov (heavy segments, ~9k words):** a *leaf* concern (prose weight), not a hub concern;
  route-level prose already isolates it. No change.
- **Brás Cubas (163 flat chapters):** a long flat list; the calm row rhythm + collapse model handle
  it; that work is the legacy `WorkContents` path today.
- **Multi-volume/part works:** the tree already renders N `groupPath` levels; the kicker language
  scales (volume/part/chapter as nested kickers).

**Verdict:** no premature optimization. The only watch item is an *expanded* hundreds-of-rows tree on
weak hardware → consider windowing/chunked metadata then, not now. (The View-Transitions continuity
idea in §11 is a UX, not a perf, concern.)

---

## 9. Accessibility and Interaction

Confirm/keep, and the new constraints the smaller type introduces:
- **Disclosure buttons:** real `<button>` + `aria-expanded` + `aria-controls` → keep; the calmer
  chapter row stays a button.
- **`aria-current="page"`** on the current segment → keep (hub return-highlight); the owned
  reader-header's real `<h2>`/`<h3>` give SR users chapter/segment context.
- **focus-visible** via `SkLink` (`--sk-focus-ring`) → keep; new icon-led links must not add per-link
  focus rules (delegate to SkLink).
- **Keyboard flow / `Enter`/`Space`** → keep; ensure the reader-header headings don't disturb tab
  order (headings aren't focusable; fine).
- **Touch targets ≥44px — load-bearing:** shrinking *type* must not shrink the *tap target*. Rows and
  the chapter disclosure keep `min-height: 44px` even at 15px text (padding carries the difference).
- **Reduced motion:** gate the chevron rotation, hover moves, and any future cross-fade behind
  `prefers-reduced-motion: reduce` (the `--sk-motion-*` tokens should resolve to none under it).
- **Contrast (new risk):** the smaller, quieter type must still pass WCAG AA. `--sk-text-muted` is
  ~4.7:1 on light, but **dark-mode muted ivory (`.62`) at 13px is the danger zone** — keep
  meaning-bearing labels (part, chapter) at `--sk-text`/`-body`, reserve `--sk-text-faint` for
  truly decorative marks (counts, dividers, aria-hidden). Verify on a real mobile panel in dark.
- **Icons:** decorative `aria-hidden` + labelled control; current-location never colour-only (paired
  with `aria-current`).

---

## 10. Roadmap

Staged, not one redesign. Each slice ships and is verified before the next.

### Slice A — Typographic & token de-escalation *(highest impact, lowest risk)*
- **Goal:** kill the two "huge events" and the inversion with **CSS/tokens only**. Add the semantic
  reading tokens; hub title 40→30px + edition line + binding hairline; fix hub hierarchy (chapter
  sentence-case 15px ink, rows 15px muted indented, part 13px ink small-caps divider); leaf: drop
  `h2::before` bar, shrink h2→13px-kicker / h3→16px, collapse 3rem→1.25rem (scoped); drop the leaf
  eyebrow's work-title + "`·`"; unify "Sumário". **No generator change; markdown headings intact.**
- **Files:** `vars.css`, `pages.css`, `PipelineWorkContents.vue`, `PipelineSegmentNav.vue`.
- **Risk:** low (CSS + token aliases; no structural/DOM change).
- **Tests:** existing structural specs stay green (99 links, 2 parts/10 chapters, collapse/aria,
  return-highlight, no footer/sidebar/outline, hub metadata-only, leaf own-prose-only). Add: hub has
  no element larger than the title; leaf has no `h2::before`/accent-bar; "Sumário" not "Índice".
- **Visual:** screenshots hub + first/middle/last, mobile/desktop, light/dark — confirm calm ladder,
  fixed inversion, no leaf event; verify contrast on mobile dark.
- **Do not touch:** the generator, the prose, routes, SEO heading structure, the data.

### Slice B — Owned leaf reader-header + generator heading-hoist
- **Goal:** retire the rented `vt-doc` doc-heading styling on reading leaves. Extract
  `PipelineReaderHeader`; generator lifts the leading `## …`/`### …` into the owned header as **real
  `<h2>`/`<h3>`** (same text/tags/order), removing the duplicate from the prose flow.
- **Files:** **+`PipelineReaderHeader.vue`**, `PipelineSegmentNav.vue` (sheds top-context),
  `scripts/build-pipeline-segment-routes.py`, `pages.css`.
- **Risk:** medium (generator change; SEO). Generator must stay idempotent and regenerate all 99
  leaves deterministically.
- **Tests:** each leaf has **exactly one real `<h2>` (chapter) + one `<h3>` (segment)**, correct
  text/order, no duplicate, no accent bar; SEO outline preserved; leaf still own-prose-only;
  generator idempotent ("No segment-routes changes." on re-run).
- **Visual:** leaf header reads as a quiet caption; trecho→trecho only the segment title + prose
  change.
- **Do not touch:** the book pipeline; the hub; routes/redirects.

### Slice C — Owned navigation language + icons
- **Goal:** owned icon vocabulary + calm nav. Add `ReaderIcon` (lucide-vue-next named imports, or the
  vendored SVG set); replace `‹ › ↑` + the CSS-triangle chevron with owned chevrons; small-caps dir
  labels; icon + "Sumário" up-link; keep the `#trecho` round-trip.
- **Files:** **+`ReaderIcon.vue`** (+ `package.json` if lucide), `PipelineSegmentNav.vue`,
  `PipelineWorkContents.vue`.
- **Risk:** low-medium (dependency choice; SSR-safe named imports only).
- **Tests:** icons render in SSR HTML (present in built output), `aria-hidden` on SVG + label on the
  control, reduced-motion honored, nav hrefs still resolve (hash-stripped) with no fr/old/review leak,
  ≥44px targets.
- **Visual:** crafted, consistent stroke; no hand-rolled glyphs.
- **Do not touch:** `@vue/theme` as the icon source of truth; routes.

### Slice D — Hub map sophistication & current-state polish
- **Goal:** finish the hub as a printed-TOC-meets-quiet-list: part dividers, disclosure polish,
  current-row `scroll-margin-top`, tabular figure counts, the *optional* serif-title experiment
  (gated by `--sk-reading-title-font`).
- **Files:** `PipelineWorkContents.vue`, `vars.css`.
- **Risk:** low.
- **Tests:** collapse/aria intact, 99 links, current highlight opens+marks+scrolls, contrast holds.
- **Visual:** hub reads harmonious in all four matrices; the serif title kept only if it reads
  bookish, reverted otherwise.
- **Do not touch:** data, routes, the performance boundary.

### Slice E — Readiness gate before the fr edition
- **Goal:** not a feature — a **gate**. Run the readiness checklist (below); a final
  visual/a11y/perf/contrast pass on the settled template; confirm it is good enough to *multiply*
  across editions and books.
- **Files:** docs/tests only.
- **Risk:** none (review).
- **Do not touch:** scope — resist adding fr/edition-switch/progress here.

---

## 11. Recommendation

**Design direction (clear):** **a calm printed table of contents and a calm printed page, rendered
with modern restraint** — one quiet semantic reading-type vocabulary, the **prose as the loudest
element**, chrome as quiet apparatus (hairlines, small-caps kickers, owned icons, one structural
accent), and **zero docs artifacts**. Bookish and warm, not appy-grey, not Kindle-sparse. Every slice
also advances the strategic migration: it replaces rented doc-heading styling and hand-rolled glyphs
with **owned reader chrome and an owned icon language**.

**Is the stack still sufficient?** **Yes — no rewrite.** Everything here is typography, composition,
two new owned components (`PipelineReaderHeader`, `ReaderIcon`), and one deliberate dependency choice,
all within VitePress + `@vue/theme` slot injection + the owned `--sk-*` system. VitePress already
provides client-side SPA navigation + link prefetch, so trecho→trecho is **not a full page reload
today** — the remaining "event" is purely typographic, which this roadmap fixes.

**Must improve before the fr edition** (the template the fr edition will inherit): **Slice A**
(typographic calm + fixed inversion), **Slice B** (owned leaf header / kill the event), **Slice C**
(owned nav/icon language), and the **Slice D** hub harmony. Getting the reading template right **once**
on the proof work is far cheaper than fixing it across two editions and many books.

**Can wait until after the fr edition:** the **edition switcher** (`PipelineEditionSwitch` — only
meaningful with two editions), a **shared `ContentsTree`** (second pipeline work), a **View
Transitions cross-fade** between trechos (optional continuity polish), and any progress/personal
state (out of scope by policy).

**Strongest argument against this recommendation** (the panel's sharpest dissents, stated fairly):
1. **Flattening risks an undifferentiated grey wall.** Compressing the chrome into a 12-16px band and
   demoting the chapter to a kicker removes the strong landmarks (40px title, 24px h2, accent bar)
   that let a reader who lands mid-book *instantly* see "new chapter here." On cheap mobile panels, in
   bright sun, in the dark lamplight theme, or for low-vision readers, three near-grey weights can read
   as a wall — *harder* to scan than today's ugly-but-high-contrast hierarchy.
2. **The "event each trecho" is partly architectural, not typographic.** Each trecho is its own
   route/page; no type scale fully removes the page-swap feeling — the higher-leverage continuity move
   is prefetch + a soft cross-fade, so chrome polish may be prettifying the wrong layer.

**Why it still wins:** (1) We keep *enough* contrast deliberately — the **prose at 17px Literata is
the clear largest reading element**, the **Part kicker is full-ink with a hairline divider**, the
chapter (sentence-case ink) clearly out-ranks the muted indented rows, and the **A11y gate (§9)
verifies AA contrast on real mobile + dark** before shipping. If testing shows a wall, the documented
fallback is to widen the display ratio slightly and/or keep one decisive break (e.g. a faint hairline
above the chapter's *first* trecho only) — calmness without illegibility. (2) The architectural point
is acknowledged and *sequenced*, not ignored: VitePress already gives SPA nav + prefetch, so we are
not shipping full reloads; the View-Transitions cross-fade is a real, cheap, modern add scheduled as a
post-fr deferred item. The typographic event is the genuinely fixable, highest-ROI problem **now**, and
it is the one the user is feeling.

---

## Next implementation prompt (Slice A only)

> Implement **Slice A — typographic & token de-escalation** for the pt reader, in `skepvox-website`
> on `develop`, no branch, no push. **CSS/tokens only — do not touch the generator, the prose, routes,
> redirects, or SEO heading structure.**
> 1. **Tokens (`vars.css`):** add the semantic reading set — `--sk-reading-title: 1.875rem`,
>    `--sk-reading-title-font: var(--vt-font-family-base)`, `--sk-reading-kicker: 0.8125rem` +
>    `--sk-reading-kicker-tracking: 0.07em`, `--sk-reading-row: 0.9375rem`, `--sk-reading-segtitle:
>    1rem`, `--sk-reading-prose: 1.0625rem`, `--sk-reading-current: var(--sk-accent)`,
>    `--sk-reading-hairline: var(--sk-rule)` — all aliasing existing values.
> 2. **Hub (`PipelineWorkContents.vue`):** title → `--sk-reading-title` (30px) /600, tight margin; add
>    a 13px small-caps edition line + a full-width hairline binding title→map; part label → 13px
>    full-ink small-caps divider; chapter disclosure → 15px **sentence-case** ink (drop UPPERCASE +
>    0.09em); segment rows → 15px muted/400/indented; current row → ink + inset bar + `scroll-margin-top`.
> 3. **Leaf prose headings (`pages.css`, scoped to `.VPContentDoc:not(.has-aside)`):** remove the
>    `h2::before` accent bar; chapter `h2` → 13px small-caps kicker; segment `h3` → 16px; collapse
>    `--sk-reading-heading-space` 3rem→1.25rem; bump prose to `--sk-reading-prose` (17px).
> 4. **Leaf nav (`PipelineSegmentNav.vue`):** drop the work-title + "`·`" from the eyebrow (leave the
>    part only, or nothing if redundant); rename the up-link label "Índice" → "**Sumário**". (Keep the
>    `‹ › ↑` text glyphs for now — icons are Slice C.)
> 5. **Tests + verify:** keep all existing pipeline specs green; add assertions (no leaf `h2::before`;
>    hub title is the largest element; "Sumário" everywhere); screenshot hub + first/middle/last,
>    mobile/desktop, light/dark; check muted-label contrast on mobile dark. Run `pnpm verify`. Commit
>    on `develop`, do not push.

## Do not do yet

- Do **not** touch the generator, prose, routes, or SEO headings in Slice A (that is Slice B).
- Do **not** add the fr edition, an edition switcher, or new books.
- Do **not** extract a shared `ContentsTree` (wait for a 2nd pipeline work).
- Do **not** add `lucide-vue-next` until Slice C (and never build the shell on `@vue/theme` icons).
- Do **not** introduce a parallel modular numeric type scale (use the semantic aliases).
- Do **not** add progress %, "last read", checkmarks, or any personal/stored reading state.
- Do **not** build a View-Transitions cross-fade now (post-fr, optional).
- Do **not** over-redesign: no per-group boxes/borders (keep hairlines), no colour washes, no
  decorative iconography.

## Readiness checklist — is the pt reader good enough to scale to fr + other books?

- [ ] **No typographic event:** moving trecho→trecho, only the segment title + prose change; no
      element re-detonates a large heading; no `h2::before` bar on reading leaves.
- [ ] **Harmonious hub:** Part → Chapter → Segment descends monotonically in visual weight (inversion
      gone); the title is integrated, not detached; the part labels belong to the map.
- [ ] **Owned chrome:** leaf chapter/segment are owned, real `<h2>`/`<h3>` (SEO preserved); no rented
      `vt-doc` doc-heading styling visible on reading leaves; icons are owned (lucide/ReaderIcon), not
      `@vue/theme`.
- [ ] **Clean nav language:** no "`·`"/slash; chevron icons; unified "Sumário"; current-location clear;
      `#trecho` round-trip works.
- [ ] **A11y/contrast gate passes** on a real mobile panel in **both** light and dark: AA contrast on
      all meaning-bearing labels, ≥44px targets, `aria-expanded`/`aria-current`/focus-visible/reduced-
      motion all correct, icons decorative-or-labelled.
- [ ] **Performance boundary intact:** hub metadata-only, leaf own-prose-only, no all-N bundle — tested.
- [ ] **Template-readiness:** the type scale, tokens, and components are parameterised by
      work/language (not hard-coded to ontologia), so the fr edition and the next book inherit the
      chrome with only data changes.
- [ ] **Visual sign-off:** hub + first/middle/last leaves screenshot calm, bookish, and coherent in
      all four mobile/desktop × light/dark matrices.

Only when these hold is the reading *template* proven enough to multiply across the fr edition and
the next books.
