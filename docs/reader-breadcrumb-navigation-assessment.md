# Reader Breadcrumb / Location-Path — Assessment & Implementation Roadmap

**Subject:** evolving the live pt reading-leaf header (`PipelineReaderHeader.vue`) from a calm two-line
text context (chapter kicker + segment title) into a **refined, bookish-modern, iOS-quality reader
location path** — conceptually `Sumário › Primeira parte › Distinção › Parágrafo 1`, but **not** a
literal `>`-separated docs breadcrumb.

**Method:** doc-only. No code changed. Grounded in the live components/data/tokens and in cited web
research (WAI-ARIA APG, Apple HIG, NN/g + mobile-breadcrumb UX, and reader/editorial apps), plus a
3-lens design pass (pattern/interaction, typography/a11y/i18n, architecture/data/perf). **Do not
implement in this task.**

---

## 1. Executive recommendation

Build a **hybrid reader-location header**: *semantically* a WAI-ARIA breadcrumb (`<nav aria-label>` →
`<ol role="list">` → one `<li>` per level), *visually* a calm bookish location line that reuses the
existing reading kicker vocabulary — **never** a slash/`>`-separated web breadcrumb and **never** a
new typographic event.

The seven decisions that define it:

1. **Pattern — hybrid, not a docs breadcrumb.** The reading hierarchy is a genuine, *short, bounded*
   parent chain (every leaf is depth-0 front matter or depth-2 Part→Chapter — never depth-1 or
   depth-3+), so a breadcrumb earns its keep semantically; but it must *read* as a quiet reader
   location line, not docs metadata. (§4, §5)
2. **Two zones, not one cramped trail.** Line 1 = the ancestor path `Sumário · Primeira parte ·
   Distinção` as a quiet uppercase **kicker** line; line 2 = the **current segment** `Parágrafo 1` as
   the one prominent, mixed-case anchor (today's `h3`). Hierarchy recedes; "where am I in this
   chapter" lands. (§5)
3. **Separator — a decorative middot (`·`) or pure spacing; NOT the ReaderIcon chevron, NOT `>`/`/`.**
   A chevron-right would overload the shell's governed directional glyph (prev/next/disclosure) and
   read as a web breadcrumb — the exact thing the brief rejects. A middot is the editorial/bookish
   mark and needs no icon-registry edit. (§5.3)
4. **Clickable — only what has an honest destination.** `Sumário` → the hub (contents top);
   `Chapter` → `hub#trecho-<current>` (opens + highlights my chapter); `Part` and the **current
   segment** → plain text (the hub has no Part anchor; a self-link is noise). (§5.2)
5. **Static, not sticky.** Render in normal flow at the top of the column and let it scroll away.
   Defer any sticky/reveal behaviour to a separate, later assessment. (§8)
6. **No data change.** Built entirely from the existing `(canonicalId, language)` join into
   `pipeline-export-segments.json` (`groupPath`) + the leaf frontmatter + the hub URL. (§7)
7. **Evolve `PipelineReaderHeader.vue` in place** — no new component, no generic abstraction — and
   keep the real `<h2>`/`<h3>` so SEO/outline is untouched. (§7)

**First slice: F1** — the static location path replacing the two-line header (markup + type + crumb
links), no sticky. It is the whole visible value and everything else builds on it. (§10)

**Blockers before implementation: none.** The data, tokens, and seams already exist; the one honest
gap (hub Part headings have no anchor) is *designed around* (Part = text), not a blocker.

---

## 2. Current-state diagnosis

**`/.vitepress/theme/components/PipelineReaderHeader.vue`** (the leaf header today) renders two real
headings from frontmatter, self-gated on `generated === 'pipeline-segment-routes'`, injected via the
`@vue/theme` `content-top` slot, aligned to `--sk-reading-measure`:

- `<h2 class="pseg-head__chapter">` = `pipelineChapter` (e.g. `Distinção`) — small-caps **kicker**,
  muted (`--sk-reading-kicker` 0.8125rem, `--sk-reading-kicker-tracking` 0.07em, `text-transform:
  uppercase`, `--sk-text-muted`), `::before { content: none }` (explicitly no accent bar).
- `<h3 class="pseg-head__title">` = `pipelineSegmentTitle` (e.g. `Parágrafo 1`) — `--sk-reading-segtitle`
  (1rem), full `--sk-text`, the one line that changes trecho→trecho.

**Diagnosis.** Calm and SEO-correct (real `h2`/`h3`, prose stays dominant), but **flat and
non-navigational**: it shows *Chapter + Segment* only — no `Sumário`, no `Part`, no links. The reader
cannot see or jump to where they are in the work from the leaf; orientation lives only at the bottom
(`PipelineSegmentNav` prev/next/up) and on the hub. The header is a *label*, not a *location*.

**Surrounding seams (all reused, none duplicated):**
- `PipelineSegmentNav.vue` — owns the **bottom** prev/next + `Sumário` up-link (`chevron-up` →
  `hub#trecho-<current>`). The new header must own **orientation**, not duplicate this **action**.
- `PipelineWorkContents.vue` — the hub map; `applyReturnHash()` opens + highlights (`aria-current` +
  inset accent bar) + scrolls the chapter containing a `#trecho-<segmentPrefix>`. **Part headings have
  no `id`/anchor** (`<p class="pwc__part-heading">`); only the chapter `<button>` disclosure and
  per-segment `#trecho` exist. This single fact decides clickability (§5.2).
- `ReaderIcon.vue` — the owned icon seam: closed 4-name union `chevron-left | chevron-right |
  chevron-up | disclosure`, vendored SVG, `aria-hidden` by default. Governed (scarcity is the
  aesthetic; glyphs are named by meaning).
- `SkLink.vue` — the owned link primitive (transparent single `<a>`, owns `:focus-visible` +
  `aria-current`, passes `$attrs`). Every reader link uses it.

---

## 3. Web research findings

Summarised; full guidance at the links. What transfers to a *bookish reading-location* header is
called out explicitly.

### 3.1 WAI-ARIA / accessibility — breadcrumb pattern
- The breadcrumb is a low-complexity pattern: a `<nav>` landmark **labelled** via `aria-label`
  (conventionally `"Breadcrumb"`; *not* containing the word "navigation"), an **`<ol>`** with one
  `<li>` per crumb, ordinary links, and **`aria-current`** on the current item.
- **Separators must be decorative** — generated by CSS / kept out of the accessibility tree so they
  are not announced. CSS `content` text *can* be exposed to some screen readers / braille, so the
  safe forms are pure-CSS shapes, an `aria-hidden` element, or an `::after` (announced after, not
  before) — never relied upon for meaning.
- **List-semantics gotcha:** stripping list markers (needed for an inline layout) makes
  Safari/VoiceOver drop the list role — add an explicit **`role="list"`** to the `<ol>`.
- **`aria-current`:** `"page"` is conventional; **`"location"`** is more accurate when the crumb marks
  an *in-page position within a hierarchy* rather than a separate document.
- *Applies:* the reading chain (`Sumário → Part → Chapter → current`) is a real parent hierarchy → the
  pattern fits. *Does not:* it says nothing about overflow/truncation (a UX concern), and if a future
  chapter-switcher is a dropdown that is a different (menu/listbox) pattern.
- Sources: [W3C APG — Breadcrumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/),
  [APG — Breadcrumb example](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/),
  [Scott O'Hara — Accessible breadcrumb](https://scottaohara.github.io/a11y_breadcrumbs/),
  [MDN — `aria-current`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current).

### 3.2 Apple HIG + modern mobile navigation
- iOS conveys hierarchy with a **back chevron + the parent's label** (wayfinding: "where you came
  from") and the **current location as the nav-bar title** — an *implicit two-level* parent←current
  pairing, not a horizontal breadcrumb widget. Large title on the **root only**; inline titles once
  you drill in. Keep bars uncrowded ("no more than title + back + one control"; ~15-char titles).
- The **macOS path control** is the desktop-only breadcrumb (pointer + wide windows); there is **no
  iPhone multi-segment breadcrumb** pattern — depth is the navigation stack, surfaced one level.
  Tappable targets **≥ 44pt**.
- *Applies:* calm, current-prominent + parent-as-quiet-context, chevron = drill/continuity, 44pt
  targets, **do not** stack `Book > Part > Chapter > Section` horizontally on a phone. *Does not:* the
  Mac path control / full trail does not port to mobile.
- Sources: [HIG — Navigation bars](https://developer.apple.com/design/human-interface-guidelines/navigation-bars),
  [HIG — Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search),
  [HIG — Path controls](https://developer.apple.com/design/human-interface-guidelines/path-controls),
  [WWDC22 — Explore navigation design for iOS](https://developer.apple.com/videos/play/wwdc2022/10001/),
  [Apple — UI design tips (44pt)](https://developer.apple.com/design/tips/).

### 3.3 UX — breadcrumbs + mobile wrapping / truncation
- Breadcrumbs fit genuinely hierarchical content and deep-linkers; **end the trail on the current
  location as plain (non-link) emphasised text** and link the ancestors.
- **Mobile:** do **not** wrap to multiple lines, do **not** shrink to micro-text, do **not**
  horizontal-scroll-only (hides crumbs from AT). Prefer **collapsing the middle** (keep root +
  immediate parent, hide interior behind "…") or **truncating the long label**. A back-to-parent
  affordance maps cleanly onto a reader. Breadcrumbs are **not** a back/history trail.
- Sources: [NN/g — Breadcrumbs: 11 guidelines](https://www.nngroup.com/articles/breadcrumbs/),
  [NN/g — Breadcrumb navigation increasingly useful](https://www.nngroup.com/articles/breadcrumb-navigation-useful/),
  [LogRocket — Designing mobile breadcrumbs](https://blog.logrocket.com/ux-design/designing-mobile-breadcrumbs/),
  [Smashing — Designing effective breadcrumbs](https://www.smashingmagazine.com/2022/04/breadcrumbs-ux-design/),
  [The Good — Mobile breadcrumbs](https://thegood.com/insights/mobile-breadcrumbs/).

### 3.4 Reader / editorial apps — reading location & TOC access
- Cross-app consensus: keep the header **quiet and reading-first** — one low-contrast location element,
  not a cluster. Apple Books makes it **chapter-scoped** ("pages left in *this chapter*"); pair the
  location with a **single TOC/contents control** that opens a *separate* contents view (Apple/Kindle)
  or a collapsible outline (Readwise). Chrome that **reveals on interaction and auto-dismisses** is the
  norm.
- *Does not transfer:* native multi-zone tap targets (center = page-turn) and synthetic "Location ####"
  numbers (e-ink/EPUB artifacts) — a scrolling web reader should use chapter-relative context, not
  location numbers, and must not hijack center-tap.
- Sources: [TidBITS — Apple Books in iOS 16](https://tidbits.com/2022/10/03/apples-books-ios-16/),
  [Kindle navigation guide](https://brainvoyage.blog/kindle-paperwhite-navigation-guide),
  [MakeUseOf — Kindle reading progress](https://www.makeuseof.com/show-reading-progress-kindle/),
  [Readwise Reader](https://readwise.io/read).

**What the research collectively tells us:** a *literal* four-rung horizontal docs breadcrumb is the
wrong instinct on a phone (cramped, noisy, iOS-anti-pattern). The right artefact is a **quiet,
reading-first location line** — semantically a breadcrumb (for AT + deep-linkers), visually a calm
bookish path with the current segment as the anchor and the ancestors as recessive, navigable context.

---

## 4. Pattern decision — breadcrumb vs reader-location bar vs hybrid

**Decision: HYBRID — a semantic breadcrumb rendered as a bookish reader-location line.**

| Option | Verdict |
|---|---|
| **Semantic docs breadcrumb** (equal-weight links, `/` or `>`) | **No.** Reads as docs metadata; violates "not slash metadata, not a cramped web breadcrumb"; equal-weight links bury the current segment. |
| **Compact location bar** (one cyclable readout, no hierarchy) | **No alone.** Loses the navigable Part/Chapter hierarchy and the deep-linker orientation that the bounded depth-2 chain makes cheap. |
| **Hybrid reader header** (breadcrumb *semantics* + reading-line *visual*) | **Yes.** Keeps AT/deep-link value (`nav`/`ol`/`aria-current`) while looking like the reading shell's own kicker vocabulary; current-prominent, hierarchy-secondary. |

**Why the hybrid is safe here specifically:** the data bounds the trail. Across all 198 segments,
`groupPath` depth is **exactly 0 or 2** — never 1, never 3+. So the worst case is a fixed four rungs
(`Sumário · Part · Chapter · Segment`), and front matter collapses to two/three. The long-trail
overflow problems the mobile research warns about *cannot occur* with the current data; the renderer
is still built depth-agnostic (§9) so a future tome/section just adds rungs.

---

## 5. Proposed visual / interaction model

### 5.1 Layout — two zones (Q4)
Evolve today's two lines into the path:

```
SUMÁRIO · PRIMEIRA PARTE · DISTINÇÃO        ← line 1: ancestor path (quiet uppercase kicker)
Parágrafo 1                                  ← line 2: current segment (prominent, mixed case)
```

- **Line 1 = the ancestor path.** `Sumário` (link) · `Primeira parte` (text) · `Distinção` (the real
  `<h2>`, link). Uppercase **kicker** family (`--sk-reading-kicker` 0.8125rem, weight ~500,
  `--sk-reading-kicker-tracking`, `--sk-text-muted`) — i.e. *the existing chapter kicker, made
  navigable*. No new vocabulary, no event.
- **Line 2 = the current segment.** `Parágrafo 1` — the real `<h3>`, `--sk-reading-segtitle` (1rem),
  weight 600, **mixed case**, full `--sk-text`, `aria-current`. The single full-ink, mixed-case,
  slightly-larger element → the eye settles here ("where am I in this chapter").
- **Long titles (Q4/Q13):** in the path, show the **Part `label` only** ("Primeira parte"), never the
  long Part `title` subtitle ("As categorias primeiras da ontologia") — it stays on the hub. The Part
  rung is the single shrinkable flex item (`min-width:0; overflow:hidden; text-overflow:ellipsis;
  white-space:nowrap`); `Sumário`/`Chapter` never truncate; the current segment **never** truncates
  (it may wrap to a second line). No horizontal scroll, no collapse-menu — the depth-2 data never
  needs them.
- Same layout desktop + mobile (it is already short); desktop just has more air. Whole block stays at
  `--sk-reading-measure` (35rem), matching today's header.

### 5.2 Clickability (Q2) — link only what is honestly addressable

| Rung | Link? | Target | Why |
|---|---|---|---|
| **Sumário** (root) | **Link** | `HUB` (contents top) | "See the whole contents." A distinct, useful destination from the Chapter rung. |
| **Part** (Primeira parte) | **No — plain text** | — | The hub has **no Part anchor**; a fabricated/aliased target would be dishonest. Orientation only. |
| **Chapter** (Distinção) | **Link** | `HUB#trecho-<current segmentPrefix>` | The hub *does* address this: `applyReturnHash()` opens + highlights + scrolls the containing chapter. "Open my chapter in the contents." |
| **Segment** (Parágrafo 1) | **No — plain text** | — | The current location (`aria-current`). A self-link is noise; the bottom nav already owns the return action. |

So exactly **two** interactive rungs (`Sumário` → contents top, `Chapter` → my place), with two
*distinct* destinations — no redundant self-link, no duplicate "go up" (that stays the bottom nav's
`chevron-up`). Front-matter leaves collapse to `Sumário · Abertura · <current>` (§9).

### 5.3 Separator / icon language (Q3) — the adjudicated call

**Decision: a decorative middot (`·`), or pure spacing — and explicitly NOT the ReaderIcon chevron.**

| Candidate | Verdict |
|---|---|
| Text `>` / `/` | **No.** Reads as a file path / docs breadcrumb — the brief's explicit anti-goal. |
| **ReaderIcon `chevron-right`** | **No.** It would **overload a governed directional glyph** (chevron means prev/next sequence and disclosure in this shell — "named by meaning, scarcity is the aesthetic"), and a chevron-separated path reads as a classic web breadcrumb. *(One design lens proposed it as "owned + aria-hidden"; rejected here on governance + the web-breadcrumb read.)* |
| A new "path-separator" glyph in ReaderIcon | **No.** An unjustified edit to the closed union for a non-meaning-bearing mark. |
| CSS `::after { content: '·' }` | **Avoid.** Generated text content can be exposed to some screen readers / braille (§3.1). |
| **Decorative middot in an `aria-hidden` `<span>`** | **Yes (if a mark is wanted).** Editorial/bookish (mastheads, bylines), guaranteed out of the a11y tree, no icon-registry edit, no overload. |
| **Pure spacing** (no glyph) | **Yes (the calmest).** The uppercase-kicker vs mixed-case-segment type step already carries the structure; a wider `column-gap` separates the rungs. |

Recommendation: ship the **middot** (best scan-ability for a 3-rung line while staying bookish), with
**pure spacing** as the even-quieter alternative to A/B during F1. Either way: **no chevron between
rungs, no `>`/`/`, no ReaderIcon registry change.** (The chevrons remain exclusively the bottom nav's
prev/next/up language.)

### 5.4 Casing (Q14)
Store **sentence case in the data** (`Sumário`, `Primeira parte`, `Distinção`) — the strings the hub
and screen readers use — and produce the uppercase *look* purely with `text-transform: uppercase` on
the ancestor rungs. **Never** store uppercased strings (breaks accents / SR / copy-paste) and **do
not** use `font-variant: small-caps` (renders unevenly on accented PT/FR at this size; the shell's
kicker already uses `text-transform` + tracking — match it). The current segment keeps its
`displayTitle` verbatim, **mixed case** ("Parágrafo 1") — that case difference is what makes it read
as the live endpoint.

---

## 6. Accessibility model (Q7)

- **Landmark + label:** `<nav class="pseg-loc" aria-label="…">`, the label language-keyed
  (`LOC_LABEL` = `{ pt:'Localização', fr:'Emplacement', en:'Location' }`) — *not* "Breadcrumb", *not*
  containing "navigation". Distinct from the bottom nav's `aria-label="Navegação de trechos"`, so two
  labelled navs coexist cleanly (exactly why the label requirement exists).
- **List:** `<ol role="list">` with one `<li>` per level. `role="list"` is **mandatory** because the
  inline layout strips markers (the Safari/VoiceOver list-drop gotcha).
- **Links:** ancestor crumbs that are addressable use **`SkLink`** (owns `:focus-visible` ring +
  neutral touch). Only `Sumário` and `Chapter` are links (§5.2).
- **Current item:** the final `<li>` is plain text with **`aria-current="location"`** (an in-work
  position, not a separate page — more accurate than `"page"` here; `"page"` is a defensible fallback).
- **Separators:** decorative, out of the a11y tree (the `aria-hidden` middot span / pure spacing).
  Screen readers announce only `"Localização, list, Sumário link, Primeira parte, Distinção link,
  Parágrafo 1 current location"` — no glyph noise.
- **Focus order:** DOM order = reading order; ≤ 2 tab stops (Sumário, Chapter), both before the prose;
  the current segment is non-focusable text (nothing to activate).
- **Tap targets (≥ 44px):** the crumb *text* is ~13px, so the visible glyph is not the hit area. Give
  each crumb `<a>` vertical hit-slop with `padding-block` + a cancelling negative `margin-block` (keeps
  the row visually tight while the touch box reaches ~44px); set `row-gap` ≥ that so wrapped crumbs
  don't overlap hit-boxes. Do **not** use `min-height: 44px` (it would inflate the line).
- **Reduced motion:** the static path has no motion. (If a future chapter-switcher disclosure is added,
  gate its rotation under `prefers-reduced-motion` with `--sk-motion-fast`/`--sk-ease`.)
- **Wrapping coherence:** real `<li>` boxes + `flex-wrap` — visual wrapping never changes the
  accessibility tree. Do **not** use `display: contents` on `<li>` (can drop the list-item role).

---

## 7. Data & component architecture

### 7.1 Data model (Q8) — no change required
Built entirely from current data, **zero generator/frontmatter change**:
- The leaf self-identifies via `frontmatter.pipelineCanonicalId` + `pipelineLanguage` (+ the
  `generated` gate). Join into `pipeline-export-segments.json` by **`(canonicalId, language)`** — the
  exact join `PipelineSegmentNav` already does — to get the current `Seg`.
- `Seg.groupPath` gives the ancestors directly: `groupPath[0]` (`kind:'part'`, `label:'Primeira
  parte'`) → Part rung; `groupPath[1]` (`kind:'chapter'`, `title:'Distinção'`) → Chapter rung. The
  leaf's own `displayTitle` ("Parágrafo 1") → current rung. The `Sumário` root = the `HUB` URL +
  `NAV_LABEL[language]`.
- **The one honest gap:** hub Part headings carry no `id`/anchor (only chapter disclosures + per-segment
  `#trecho`). That is *why* the Part rung is plain text (§5.2) — designed around, not blocking.
- `pipelineChapter`/`pipelineSegmentTitle` (frontmatter) are redundant mirrors of `groupPath[1].title`
  / `displayTitle`; prefer the JSON so the header and bottom nav read from **one source of truth**, but
  the frontmatter mirror is a fine SSR-cheap fast path for the chapter/segment crumbs.

### 7.2 Component architecture (Q9) — evolve in place, no new abstraction
- **Evolve `PipelineReaderHeader.vue` in one file.** Do **not** create `PipelineReaderBreadcrumb`, a
  generic `ReaderLocationPath`, or `BreadcrumbItem`/`ReaderPathLink` helpers — there is exactly **one**
  call site (the pipeline leaf header); splitting it is speculative abstraction against the codebase's
  own one-component-per-surface pattern.
- Keep the self-gate (`generated === 'pipeline-segment-routes'`), the `content-top` injection, and the
  `--sk-reading-measure` alignment. Add the JSON import + `(canonicalId, language)` join.
- **SEO is preserved by construction:** the Chapter rung's text is the real `<h2 class="pseg-head__chapter">`
  and the current segment is the real `<h3 class="pseg-head__title">`, both inside the `<nav>`/`<ol>`.
  Styling a heading as a crumb is purely visual; it stays a semantic heading in document order.
- **DRY the labels:** lift `NAV_LABEL` + `OPENING_LABEL` (today duplicated in `PipelineWorkContents`)
  into a tiny shared module (e.g. `.vitepress/theme/data/reading-labels.ts`) and add `LOC_LABEL`, so
  hub, bottom nav, and the new path read from one record and cannot drift (this also de-risks the
  deferred fr nav parameterisation — see the Slice-E readiness note in `reading-app-website.md` §1a).

### 7.3 Relationship to existing nav (Q10)
- **Top path = ORIENTATION ("where am I"); bottom `PipelineSegmentNav` = ACTION (prev/next/up).** They
  must read as different gestures. The top `Sumário` is a quiet inline **crumb** (no `chevron-up`, not a
  "go up" button); the bottom keeps the explicit `chevron-up` `Sumário` return action. Two `Sumário`
  affordances are fine *because* they read differently and even point to different places (top → contents
  top; bottom → my chapter via `#trecho`).
- **Reuse `#trecho` verbatim:** the Chapter crumb's `hub#trecho-<current>` is the exact href
  `PipelineSegmentNav.upHref` builds, so it triggers `applyReturnHash()` open+highlight+scroll for free.
- **`ReaderIcon`:** untouched — the path uses **no** icon (separator is a middot/spacing). The chevrons
  stay the bottom nav's language.
- **`SkLink`:** the path's two links use it (focus ring + `aria-current`).
- **Future edition switcher / fr / multi-book:** the path is data-driven and depth-agnostic, so fr and
  the next book inherit it with only data + the shared label record (one `LOC_LABEL` fr key already
  needed). The path is *orientation*; a future `PipelineEditionSwitch` is *cross-edition action* — a
  separate control, not a crumb, so they don't conflict.

### 7.4 Performance (Q11)
- **Zero new data cost.** The component imports the same `pipeline-export-segments.json` already bundled
  for the bottom nav/hub — no new fetch, no prose, tree-shaken into the existing chunk.
- **SSR-clean.** All derivation is pure `computed()` over frontmatter + that JSON — identical on server
  and client, no hydration mismatch, no `onMounted`.
- **No scroll machinery.** No `IntersectionObserver`, no scroll listener, no sticky position tracking
  (this is the decisive argument for the static call, §8). If a persistent "where am I" is ever wanted,
  the cheaper research-backed move is a thin bottom-of-viewport progress readout — *not* a sticky
  breadcrumb — and is deferred.

---

## 8. Sticky vs static (Q5)

**Decision: STATIC now.** Render in normal document flow at the top of the reading column (where
`PipelineReaderHeader` already injects) and let it scroll away with the prose.

- **Visual calm / reading-first:** the cross-app consensus is "default to bare text, summon chrome" —
  a permanently pinned location bar is the opposite and competes with the column.
- **Performance:** sticky/reveal needs a scroll listener or `IntersectionObserver` + re-render on
  scroll — hydration-heavy machinery for marginal value, against the metadata-only perf boundary.
- **iOS browser chrome / mobile viewport:** a fixed top bar fights Safari's collapsing URL bar and the
  dynamic viewport; static side-steps it entirely.
- **a11y:** a static block keeps a simple, predictable focus/reading order.

Defer any sticky behaviour to a **separate, later** assessment (Slice F5). If ever pursued, it should
be a **reveal-on-scroll-up mini-bar** (Apple/Kindle "summon, auto-dismiss"), never a permanently fixed
bar.

---

## 9. Edge cases & localization (Q13, Q14)

Drive everything from the `(canonicalId, language)` join + `groupPath`; handle each *shape from the
data*, depth-agnostically (map one ancestor crumb per `groupPath` level, then the current
`displayTitle`):

- **Front matter / Advertência** (`groupPath: []`, 10 segments, e.g. `00-00-000-001`): render
  `Sumário · [OPENING_LABEL] · <displayTitle>` — reuse the hub's existing `OPENING_LABEL`
  (`Abertura`/`Ouverture`/`Opening`) as the synthetic middle rung so front matter reads as a real place
  ("Abertura"), not a broken two-item stub and not an invented Part. The Opening rung is non-link (or
  links to `HUB` top, since the Abertura bucket precedes Part 1).
- **Conclusion / back matter** (`99-99-999-*`, `groupPath: []`, 8 sentinels): the hub *folds* these
  into the final chapter. Match that mental model — **inherit `groupPath` from the nearest prior
  non-empty segment** in the sorted edition array (the same fold the hub does) → `Sumário · <last part>
  · <last chapter> · <displayTitle>`. Acceptable fallback: `Sumário · <displayTitle>`.
- **Deeper than depth-2 / internal volumes-tomes-sections** (not in current data; future): the
  depth-agnostic renderer emits one rung per level automatically. **Mobile rule for >3 ancestors:**
  collapse the **middle** (keep root + immediate parent; replace interior with a plain `…` rung whose
  `<li>` has an accessible label and whose glyph is `aria-hidden`). Never wrap to 3+ lines, never
  horizontal-scroll.
- **Chapter == segment** (a chapter whose only segment is itself): if `displayTitle` equals the chapter
  `label`, **drop the redundant chapter rung** → `Sumário · Part · <current>` (no echo).
- **Very long titles:** ancestors end-truncate (ellipsis + `title=` for the full text); the **current
  segment never truncates** (wraps if needed). Current `displayTitles` are short ("Parágrafo 1") — this
  is future-proofing.
- **Part `label` vs `title`:** chapter `label === title` in all records (use `label`); the **Part**
  carries a distinct long `title` subtitle → show the Part **`label` only** in the path (the subtitle
  stays on the hub).

**Localization (Q14):** extend the *existing* per-language record pattern, do not invent a parallel
one. `NAV_LABEL` (`Sumário`/`Sommaire`/`Contents`) → the root crumb (identical word to the hub + the
bottom up-link, so all three return affordances speak one word). `OPENING_LABEL` → the front-matter
rung. New `LOC_LABEL` (`Localização`/`Emplacement`/`Location`) → the `nav` `aria-label`. Resolve all
three by `frontmatter.pipelineLanguage` with `?? pt` fallback. **fr "just works" from the data** (parts
already `Première/Deuxième partie`, front matter `Avertissement`, segments `Paragraphe N`); only the
`LOC_LABEL` fr key + reading `pipelineLanguage` instead of a pt hard-code are needed — handled by the
shared label module (§7.2).

---

## 10. Implementation roadmap — slices

Small, safe, independently shippable. **F1 first** — it is the entire visible value, self-contained
(one component, existing data/tokens), and everything else refines it.

- **F1 — Static reader-location path (replaces the two-line header). FIRST.**
  Restructure `PipelineReaderHeader.vue` into `<nav aria-label={LOC_LABEL}>` → `<ol role="list">` →
  `Sumário`(SkLink → `HUB`) · `Part`(text) · `Chapter`(real `<h2>`, SkLink → `hub#trecho-<current>`)
  on line 1 (uppercase kicker) + `Segment`(real `<h3>`, `aria-current="location"`) on line 2
  (prominent). Add the `(canonicalId, language)` join for `groupPath`. Separator = decorative middot
  (or pure spacing). Tokens only; static; no sticky. Front-matter (`Abertura`) handled. *Verify:* one
  `<h2>` + one `<h3>` preserved; SSR-clean; calm in all four matrices.
- **F2 — Shared labels + hub-return wiring + fr-readiness.**
  Lift `NAV_LABEL`/`OPENING_LABEL` into a shared module + add `LOC_LABEL`; point the path (and ideally
  the bottom nav) at it; confirm `Sumário`→`HUB` and `Chapter`→`hub#trecho-<current>` trigger the hub's
  open+highlight+scroll. Read `pipelineLanguage` (no pt hard-code). *Verify:* the existing
  `#trecho` round-trip specs stay green; fr renders from data in a fixture.
- **F3 — Separator/icon refinement (likely a no-op).**
  Per §5.3 the middot/spacing needs no `ReaderIcon`. This slice is a *documented decision point*: A/B
  middot vs pure spacing on the real panel; only if a glyph is judged essential, go through a **governed
  `ReaderIcon` addition** — but the recommendation is **do not**.
- **F4 — Mobile wrapping / long-title + edge-case hardening.**
  Ancestor ellipsis + `title=`; the Part-only-label rule; the front/back-matter `Abertura`/look-back
  fold; chapter==segment dedup; the depth-agnostic + collapse-the-middle path for any future depth>2.
  *Verify:* long-title fixture, front/back-matter fixtures, ≥44px hit-slop, wrapping SR coherence.
- **F5 — OPTIONAL sticky / scroll-aware header (deferred; only if a later assessment proves it).**
  If ever: a reveal-on-scroll-up mini-bar (summon + auto-dismiss), reduced-motion gated, measured for
  jank — **not** a permanently fixed bar. Default recommendation: **do not build.**

---

## 11. Test plan

- **SEO/outline:** exactly one real `<h2>` (chapter) + one real `<h3>` (segment) in document order on a
  leaf; both inside the `<nav>` but still headings.
- **Semantics/a11y:** `<nav>` has a non-empty `aria-label` (language-keyed), distinct from the bottom
  nav's; `<ol role="list">` present; one `<li>` per level; the current segment has
  `aria-current="location"` and is **not** a link; ancestor links are `SkLink` `<a>`s; separators are
  not in the accessibility tree (no announced glyph); ≥44px hit-slop on the crumb links.
- **Clickability/hrefs:** `Sumário` → `HUB` (no hash); `Chapter` → `HUB#trecho-<current segmentPrefix>`
  (resolves to a built pt route, hash-correct); `Part` + current segment render as **text** (no `<a>`);
  no fr/old/reading-review href leak.
- **Hub round-trip:** clicking the `Chapter` crumb lands on the hub with the containing chapter
  open + `aria-current` highlighted + scrolled (reuse/extend the existing `applyReturnHash` specs).
- **Edge cases:** front matter (`Advertência`) → `Sumário · Abertura · Advertência`; conclusion
  (`99-99-999-*`) → folded path or 2-rung fallback; long-title fixture truncates ancestors (never the
  current segment); chapter==segment dedup.
- **Typography/contrast:** ancestor rungs at `--sk-reading-kicker` muted (≥4.5:1 light / ≥3:1 dark
  measured); current segment at `--sk-reading-segtitle` full ink; nothing in the row reaches
  `--sk-reading-prose`/`--sk-reading-title` (no typographic event).
- **Performance:** no prose in the leaf payload beyond its own; no new fetch; SSR HTML contains the path
  (no hydration-only render); no scroll/IntersectionObserver listener.
- **Visual (Q12):** screenshot matrix — mobile-dark, mobile-light, desktop × first/middle/last segment,
  long part+chapter names, front-matter (`Advertência`), conclusion — each calm, bookish, coherent; the
  current segment is the visual settle point; ancestors recede; dark stays warm/legible.

---

## 12. Do-not-do-yet list

- **Do not** make the path sticky/fixed/scroll-aware (F5 is deferred and default-no).
- **Do not** use the `ReaderIcon` chevron (or any icon) as a separator, and **do not** add a separator
  glyph to the closed `ReaderIcon` union.
- **Do not** use a text `>` / `/` separator, or `font-variant: small-caps`, or stored uppercased
  strings.
- **Do not** create `PipelineReaderBreadcrumb` / `ReaderLocationPath` / `BreadcrumbItem` /
  `ReaderPathLink` — evolve `PipelineReaderHeader` in place.
- **Do not** change the generator, frontmatter schema, `pipeline-export-segments.json`, routes,
  `publicSlug`/`urlStability`, redirects, or the book-pipeline.
- **Do not** link the **Part** rung (no hub anchor) or the **current segment** (self-link noise).
- **Do not** add scroll tracking, `IntersectionObserver`, a TOC dropdown/menu, reading-progress %, or a
  chapter-switcher in this work (separate, later, opt-in).
- **Do not** parameterise the bottom nav's pt hard-codes here — that is the deferred fr task
  (`reading-app-website.md` §1a); F2 may *prepare* it via the shared label module but must not ship fr.

---

## 13. Final recommendation & the next implementation prompt

**Recommendation:** ship the **static, hybrid reader-location path** — semantic breadcrumb markup,
bookish-quiet visual (uppercase kicker ancestors + prominent mixed-case current segment), middot/spacing
separator (no chevron), `Sumário`→hub + `Chapter`→`#trecho` links, evolved in `PipelineReaderHeader.vue`
with no data change — starting with **Slice F1**. It is calm, navigable, touch-friendly, dark-mode
native, and reuses every owned foundation (`SkLink`, the reading tokens, the `groupPath` data, the
`#trecho` return). **No blockers.**

### Next implementation prompt — **Slice F1 only**

> Implement **Slice F1 — the static reader-location path** in `skepvox-website` on `develop`, no branch,
> no push. Evolve `PipelineReaderHeader.vue` only (+ its tests). Follow
> `docs/reader-breadcrumb-navigation-assessment.md`. No sticky, no `ReaderIcon` separator, no data /
> generator / routes / fr / package change.
> 1. Restructure the header into `<nav class="pseg-loc" aria-label="Localização">` → `<ol role="list">`
>    with: `<li>` `Sumário` = `SkLink` → `HUB`; `<li>` Part = plain text (`groupPath[0].label`, e.g.
>    "Primeira parte"); `<li>` Chapter = the **real** `<h2 class="pseg-head__chapter">` wrapped in a
>    `SkLink` → `HUB#trecho-<current segmentPrefix>` (`groupPath[1].title` / `pipelineChapter`); `<li>`
>    current = the **real** `<h3 class="pseg-head__title">` with `aria-current="location"`, plain text
>    (`displayTitle` / `pipelineSegmentTitle`). Keep one `<h2>` + one `<h3>` in document order.
> 2. Add the `(canonicalId, language)` join into `pipeline-export-segments.json` (mirror
>    `PipelineSegmentNav`) to read `groupPath` + `displayTitle` + `segmentPrefix`; keep the
>    `generated === 'pipeline-segment-routes'` self-gate + the `content-top` injection +
>    `--sk-reading-measure` alignment.
> 3. Type: ancestor rungs = `--sk-reading-kicker` / `--sk-reading-kicker-tracking` / `text-transform:
>    uppercase` / weight ~500 / `--sk-text-muted`; current segment = `--sk-reading-segtitle` / weight
>    600 / mixed case / `--sk-text`. Layout: line 1 = ancestors (flex, `column-gap`, middot via an
>    `aria-hidden` `<span>` between rungs — or pure spacing), line 2 = current segment. Part is the only
>    shrinkable rung (`min-width:0; ellipsis`); the current segment never truncates. `≥44px` hit-slop on
>    the links via `padding-block` + cancelling negative `margin-block`. Static — no sticky, no scroll
>    listener.
> 4. Front matter (`groupPath: []`): render `Sumário · Abertura · <displayTitle>` using `OPENING_LABEL`;
>    Abertura non-link (or → `HUB`). (Conclusion/back-matter fold can be F4.)
> 5. Tests: one `<h2>`+`<h3>` preserved; `<nav aria-label>` + `<ol role="list">` + one `<li>`/level;
>    `aria-current="location"` on the (non-link) current segment; `Sumário`→`HUB`,
>    `Chapter`→`HUB#trecho-<prefix>`, Part+current = text; no glyph in the a11y tree; no prose/scroll
>    listener; front-matter path. Run `pnpm verify`. Screenshot mobile-dark/light + desktop ×
>    first/middle/last + Advertência. Commit on `develop`, do not push.

**Do-not-do-yet (F1):** no sticky (F5), no icon separator / registry edit (F3 is default-no), no
conclusion look-back fold or long-title collapse yet (F4), no fr ship / bottom-nav parameterisation
(F2 prepares the shared labels only), no TOC dropdown / progress / chapter-switcher.
