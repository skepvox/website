# Reader Icon & Symbol System — Assessment

**Subject:** the OWNED icon/symbol language for the skepvox reader shell (VitePress + `@vue/theme`;
owned `--sk-*` tokens), scoping **Slice C** of `docs/reader-experience-next-level-roadmap.md` before
implementation. Slices A (calm typography + reading tokens) and B (owned leaf `PipelineReaderHeader`,
hoisted real `<h2>`/`<h3>`) are shipped.

**Method:** doc-only. No code, tokens, components, routes, generated pages, data, book-pipeline, fr
edition, or reader prose were touched. Grounded in the live components/tokens (`file:line`) and cited
2024-2026 design research (optical sizing, stroke weight, disclosure motion, dark-mode hairline
contrast, coherent symbol systems) plus a technical decision pass (lucide vs vendored SVG) and a
durability/governance pass.

**Strategic frame (carried + sharpened):** migrate _step by step away_ from rented `@vue/theme`/docs
UI. The reader shell must **own** its icon language — not merely swap `‹ › ↑` for arbitrary icons, but
build a calm, literary, modern, iOS-restrained, **bookish** symbol vocabulary that is durable and
reusable across future books, editions, reader chrome, work hubs, zoom-out maps, and later
language/edition switching. The durable boundary is one owned **`ReaderIcon`** wrapper.

> **Note — this refines the parent roadmap.** `reader-experience-next-level-roadmap.md` §5 tentatively
> leaned "Recommended: adopt `lucide-vue-next`." This assessment **reverses that to vendor-first behind
> `ReaderIcon`** on new evidence (the `lucide-vue-next → @lucide/vue` v1.0 rename, a ~3-unique-glyph
> v1, and zero shipped-byte benefit at this size). The roadmap allows refining details "when the
> evidence justifies it"; it does here. The `ReaderIcon` seam makes the choice reversible, so this is a
> low-stakes call (§4, §10).

> **Implementation status — Slice C shipped (C1–C4 complete).**
>
> - **C1 — foundation:** the owned `ReaderIcon` seam, the `--sk-icon-*` tokens, and the closed
>   `ReaderIconName` union (`chevron-left | chevron-right | chevron-up | disclosure`), vendored from
>   lucide ISC geometry behind one boundary. No runtime dependency.
> - **C2 — nav glyphs:** `PipelineSegmentNav` prev / next / up-to-Sumário swapped to `ReaderIcon`.
> - **C3 — disclosure glyph:** `PipelineWorkContents` chapter disclosure swapped to `ReaderIcon`
>   (right-chevron rotating to down on open); the hand-rolled CSS border-triangle + its opacity-dim
>   removed.
> - **C4 — hardening + governance lock:** the rendered icons were _measured_, not eyeballed — the owned
>   1.5px non-scaling hairline at the muted ink (`currentColor`) gives **~4.6:1 in light and ~6.3:1 on
>   warm-dark**, both well above the 3:1 UI/non-text bar, so **`--sk-icon-stroke-dark` stays DORMANT**
>   (colour-first sufficed; a heavier dark stroke would solve a non-existent problem, per §2.4). A11y
>   (decorative `aria-hidden`/`focusable=false`, no stray `<title>`, labelled mode intact), motion
>   (wrapper-transform rotation, reduced-motion gated, wrapper owns no animation), contrast, and the
>   closed four-name API are now locked by tests.
>
> **Future trigger (only):** add a glyph when a real shipped UI surface needs one (each through the
> §4/§6 add-a-glyph process), or promote the implementation vendored → `@lucide/vue` only if the
> unique-glyph count crosses the ~8 threshold (§4, §10). Until then the four-name set is closed.

---

## 1. Current-state audit

The reader/hub flow contains **exactly two glyph sources today, both hand-rolled placeholders**, plus
the rented set we are steering away from.

| #   | Source                                                                      | Where (`file:line`)                                                                                                                                                                                                                                                                                                                                                                 | a11y role                                                                                                       | Read                                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Text glyphs `‹ › ↑`**                                                     | `PipelineSegmentNav.vue:80` (`‹ Trecho anterior`), `:92` (`Próximo trecho ›`), `:100` (`↑ Sumário — <work>`) — literal U+2039 / U+203A / U+2191 inside `.pseg-nav__dir` spans + the up-link text                                                                                                                                                                                    | **Part of the visible string**, not separately marked; the SkLink text is the accessible name                   | **Unfinished.** These are _font glyphs_: weight/size/baseline are dictated by the font, not us — they cannot be optically aligned, pixel-snapped, or stroke-tuned, and they read "typed," not "drawn."                                    |
| 2   | **CSS-triangle chevron `.pwc__chevron`**                                    | `PipelineWorkContents.vue:364-373` (border-triangle: `border-left:5px solid currentColor`; top/bottom `4px transparent`; **`opacity:0.45`**), `:374-376` (`transform:rotate(90deg)` on `.is-open`, `transition:transform 0.2s ease`), gated under reduced-motion `:434-440`; sits as an `aria-hidden` span inside the disclosure `<button class="pwc__chapter-heading">` `:217-231` | **Decorative** (`aria-hidden`); the disclosure name + state are on the button (`aria-expanded`/`aria-controls`) | **Unfinished.** A _filled triangle_ (play-button wedge), not a two-stroke chevron — its solid mass fights the hairline/stroke language of the shell, and `opacity:0.45` on a warm-dark hairline is exactly the dark-mode vanish bug (§2). |
| —   | **`@vue/theme` `VTIcon*`** (ChevronLeft/Right/Up/Down, Globe, Languages, …) | **Not in any reader component** (grep of the four reader files + `theme/index.ts` → zero `VTIcon`); used only by the rented navbar/search/appearance/social chrome                                                                                                                                                                                                                  | n/a (rented chrome)                                                                                             | **Acceptable as migration infra, not a source.** Steered out as the reader shell's long-term icon source.                                                                                                                                 |

**Glyph-free and should stay so:** `PipelineReaderHeader.vue` (leaf `<h2>` chapter + `<h3>` segment —
type, not icons; it even sets `.pseg-head__chapter::before{content:none}` at `:50-52`) and `SkLink.vue`
(a transparent single-`<a>` primitive that renders one root via `$attrs`, owns only `:focus-visible` +
`aria-current`, never hover). An icon nests **inside SkLink's default `<slot/>`**, exactly where the
`‹ › ↑` strings sit today.

**The gap:** there is **no owned icon abstraction and no `--sk-icon-*` stroke/size token** (none in
`vars.css`). The reader speaks **two incoherent dialects** — Unicode text glyphs in one nav surface, a
CSS border-triangle in the other — with no shared stroke, grid, or optical rule. That incoherence, not
any single glyph, is the real defect Slice C fixes.

What is already _right_ and must be preserved: the a11y house pattern is live — decorative glyphs are
`aria-hidden` (`PipelineWorkContents.vue:225,229`), the accessible name + state ride the control
(`aria-expanded`/`aria-controls` `:220-221`, `aria-current` via `SkLink :current`), the 44px floor is
on the controls (`min-height:44px` `:336,:388`), the focus ring is on the button/SkLink not the glyph
(`:427-431`, `SkLink.vue:40-47`), and reduced-motion gates the rotation (`:434-440` + global
`utilities.css:19-28`).

---

## 2. Product / design target

**The icon language: calm, literary, modern, iOS-restrained, bookish — never decorative.** Icons are
quiet _apparatus_ beside the reading voice, not ornament. "Sophisticated" here is concrete:

- **Stroke weight — 1.5px, not 2.** The accepted rule is stroke ≈ 1/12 of icon size, so lucide's
  default `2px` is correct only at 24px; at our 13-16px chrome it reads app-toolbar-heavy
  ([Bigeye](https://www.bigeyeagency.com/insights/design-icon-systems-brand-consistency)). SF Symbols
  deliberately _thins_ strokes at small optical sizes ("small icons would appear too dense and dark…
  the stroke needs to be thinned"); the cross-system consensus is **1px/1.5px for minimal-reduced
  sets, 2px for bold** ([SF Symbols](https://symbolefy.com/sf-symbols/);
  [Material Symbols](https://developers.google.com/fonts/docs/material_symbols)). **1.5px** is the owned
  hairline that reads literary at small sizes; 1px vanishes on warm-dark.
- **Optical alignment / size — cap-height, not the em box.** A chevron beside small-caps text must
  align to the text's **cap height**, vertically centered on the cap band and pixel-snapped — not rest
  on the baseline or fill the full line box (a raw `1em` icon sits visibly taller than small caps). The
  modern primitive is the `cap` unit / a small negative `vertical-align` (~`-0.125em`)
  ([CSS-Tricks](https://css-tricks.com/tips-aligning-icons-text/)); SF Symbols formalises "optical
  center at the cap-height midpoint." Render on lucide's **24×24 grid, round caps/joins**, with
  `shape-rendering:geometricPrecision` (never `crispEdges`, which would break round caps).
- **Hit target — on the control, never the icon.** A 13px glyph inside a ≥44px tappable row is correct;
  the touch floor stays on the `<button>`/`SkLink` (already the case). Shrinking the _glyph_ must never
  shrink the _tap area_.
- **Label pairing — every icon pairs with a word or carries a binary state.** Decorative-by-default
  (`aria-hidden`), the accessible name on the control. No icon where type + space already carry the
  meaning.
- **Animation restraint — one moving icon.** Only the disclosure chevron animates (rotate, §4);
  prev/next/up chevrons are static. Motion confirms state, never decorates, and is reduced-motion
  gated.
- **Dark-mode contrast — colour first, weight second.** On warm "lamplight" (`#181510`, ivory ink at
  `.62`), stroke at a _meaning-bearing_ ink (`--sk-text-muted`), **never** the faint ink or an opacity
  dim (the `.pwc__chevron` `opacity:0.45` is the vanish bug). A dormant `--sk-icon-stroke-dark:1.75`
  escape hatch is wired but activated only if a real-panel AA check fails (Material's grade-axis move).
- **Density — a small closed vocabulary.** Scarcity is the aesthetic. The reader needs ~3-4 glyphs, not
  a library.

**Five symbol categories (only the first two are in scope now):**

| Category                      | Role                                                | v1?                                                                                                                              |
| ----------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Navigation**                | prev / next / up-to-contents (directional chevrons) | **v1**                                                                                                                           |
| **Disclosure**                | chapter open/closed (one chevron, rotated)          | **v1**                                                                                                                           |
| **Status / current-position** | "you are here"                                      | **No icon — by design.** The inset accent bar + `aria-current` already carry it (roadmap §9). A circle/dot glyph is _not_ added. |
| **Edition / language**        | source↔pt switch                                    | **Deferred** to the fr edition (`languages`/`globe`).                                                                            |
| **Future**                    | zoom-out map, progress, AI companion, annotation    | **Deferred / forbidden** (progress is policy-forbidden; the rest have no surface yet).                                           |

---

## 3. Options assessment

| Option                                                                     | SSR safety                                               | Bundle / tree-shaking                                                                                               | Design coherence                                                                                        | a11y                                                        | Maintainability                                   | Dependency risk                                                                                                                                                                                                                                                            | Future-feature support                                                   |
| -------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **`@lucide/vue`** (was `lucide-vue-next`) as a dep                         | **Safe** (named inline-SVG components, no DOM on import) | Per-icon tree-shaken; ~few hundred B/glyph; **but** a wildcard/dynamic loader silently ships the **7+ MB** full set | High (one grid/stroke family at scale)                                                                  | `aria-hidden` by default; "label the control, not the icon" | Low _behind a wrapper_                            | **Real:** a new third-party dep with its own cadence; npm now marks `lucide-vue-next` deprecated in favour of `@lucide/vue` (the v1-era package split/rename happened in March 2026) — adopting today means adopting the renamed package + ~1,600-icon attractive nuisance | Excellent at scale (15+ glyphs)                                          |
| **Vendored owned SVG set** (lucide-sourced ISC paths, behind `ReaderIcon`) | **Safe by construction** (static Vue markup)             | Trivial; only the ~3 glyphs we draw; tree-shakes as plain imports                                                   | **Highest** — we own stroke/grid/optical from glyph one (author 1.5px as ours, not override lucide's 2) | Same `aria-hidden`/control-name pattern, owned              | Hand-author ~2-3 paths (a non-issue at this size) | **None** — immune to upstream rename/version churn                                                                                                                                                                                                                         | Good now; promote to `@lucide/vue` behind the same seam when glyphs grow |
| **Inline local SVGs per component** (no wrapper)                           | Safe                                                     | Trivial                                                                                                             | **Low** — drift: each component re-declares size/stroke/a11y; no single source of truth                 | Inconsistent (each must re-do `aria-hidden`/align)          | Poor — the sprawl that kills symbol coherence     | None                                                                                                                                                                                                                                                                       | Poor — no seam to evolve                                                 |
| **Continue text glyphs / CSS triangles**                                   | Safe                                                     | Zero                                                                                                                | **Lowest** — font-dictated, un-tunable, un-snappable; the current "unfinished" read                     | OK                                                          | OK                                                | None                                                                                                                                                                                                                                                                       | None — a dead end                                                        |
| **`@vue/theme` `VTIcon*` reuse**                                           | Safe                                                     | Tree-shaken                                                                                                         | Medium _but rented_ — lucide-adjacent but it is the **docs** house set, no stroke/optical control       | OK                                                          | OK                                                | **Strategic:** entrenches the rented UI we are migrating away from                                                                                                                                                                                                         | Limited; not ours to evolve                                              |

**Reading of the table:** the live `dist`-size delta between a vendored set and `@lucide/vue` for ~3
glyphs is **negligible and roughly equal** (~1-2 KB gzipped of path data either way) — the decision is
**not about shipped bytes**. It is about _ownership, coherence, and dependency surface_. The two
options that serve the steering are the **wrapper-backed** ones; of those, **vendored** is strictly
more owned and dependency-free, and `@lucide/vue` becomes worth it only when the _vocabulary_ (not the
byte count) grows. The three options without a wrapper (`per-component SVG`, `text glyphs`, `VTIcon*`)
all fail the "coherent owned language" bar.

---

## 4. Recommendation

**Adopt a tiny VENDORED owned inline-SVG set (lucide-sourced, ISC-licensed paths, retuned to our 1.5px
stroke) as the v1 implementation, behind one owned `ReaderIcon` boundary. Do NOT add a runtime icon
dependency in Slice C.**

Why vendor-first wins for a ~3-unique-glyph v1:

1. **The dependency is not yet earned.** v1 is 4 names over ~3 unique paths (prev/next/up chevrons; the
   disclosure is a right-chevron rotated). A `package.json` + lockfile entry + supply-chain surface +
   1,600-icon nuisance for two `<path d>` strings is dependency _cost_ ahead of dependency _value_.
2. **It is the most owned, most coherent option** — we author 1.5px on lucide's 24-grid as _our_ token
   from glyph one, rather than inheriting lucide's `stroke:2` default and overriding it. ISC lets us
   start from lucide's proven geometry and own the result with no attribution obligation in the UI.
3. **It is immune to the churn that just happened** (`lucide-vue-next → @lucide/vue`, v1-era package split in March 2026) —
   an owned set has no upstream identity to track.
4. **It is the cheaper-to-be-wrong direction.** Vendored→lucide later is a one-file swap _inside_
   `ReaderIcon` (path-lookup → named imports), with **zero consumer or screenshot-baseline change**
   because the seam fixes size/stroke/a11y/colour. Walking _back_ from a dependency is the more awkward
   direction. So we take the irreversible-ish act (the dep) **only when the glyph count earns it**.

**Promotion gate (when `@lucide/vue` becomes the implementation):** when v2 needs **≥ ~8 unique
glyphs** (the edition switch + a zoom-out map + their affordances), per-icon authoring cost crosses
lucide's maintained-set benefit — promote the _implementation_ behind the unchanged `ReaderIcon` API,
named imports only, never the dynamic loader.

**Dependency / governance policy (binds both vendored-now and lucide-later):**

- The reader shell imports **`ReaderIcon` only** — never lucide, never a raw `.svg`, never `VTIcon*`,
  anywhere. One swap point, forever.
- `name` is a **closed TypeScript union**, never a free string (`vue-tsc` rejects unknowns) — adding a
  glyph is a reviewed, greppable, type-checked diff in one owned module.
- **No icon sprawl:** a glyph enters the registry only when a real control/surface exists in the same
  slice; named by _meaning_ not appearance; re-reviewed against the whole set (the C1 render-harness
  sheet). The deferred/forbidden list lives in the contract (§6).
- **No decorative inflation:** every glyph pairs with a label or carries a binary state.

**Why now, not after the fr edition:** the icon language is **foundation** — it is reused on every
leaf and hub, and _every future book and edition inherits it_. The current `‹ › ↑` + filled triangle
read as placeholder; the whole reader-experience phase exists to make the proof work polished _before_
multiplying it. Establishing the owned `ReaderIcon` + the bookish stroke/grid now means the fr edition
and the next book inherit a coherent symbol language instead of a retrofit. Deferring means doing it
twice (ad hoc, then properly) and shipping the fr edition on top of unfinished chrome.

---

## 5. `ReaderIcon` API

The seam. The shell imports this and nothing else; size/stroke/a11y/alignment defaults live in exactly
one place; the vendored↔lucide implementation is swappable behind it.

```ts
// ReaderIcon.vue — the only icon module the reader shell imports.
defineProps<{
  name: ReaderIconName // closed union (§6). NOT a free string → vue-tsc enforces the registry.
  label?: string // optional accessible name → role="img" + <title>; drops aria-hidden.
  // Omitted (default) ⇒ aria-hidden="true" (decorative). v1: always omitted.
  size?: 'chrome' | 'touch' // SEMANTIC size token, not a pixel number. Default 'chrome'.
  // Deliberately NO stroke prop, NO color prop, NO rotate/direction prop, NO svg-class prop.
}>()
```

**Five deliberate _non_-additions, each load-bearing for durability:**

- **`name` is a closed union, not `string`** — the single strongest anti-sprawl lever; the registry
  _is_ the type.
- **No `stroke` prop** — stroke is one fixed token (`--sk-icon-stroke:1.5`), tuned once in the wrapper,
  so the language can't drift glyph-by-glyph.
- **No `color` prop** — fill/stroke is `currentColor`, inherited from the control's ink, so it flips
  light↔dark for free and the calm palette is enforced by _offering no knob_.
- **No `rotate`/`direction` prop** — the disclosure open/closed is one glyph + a CSS `transform` owned
  by the _consumer's_ `.is-open` class, so the existing reduced-motion gate stays where it already
  works. A rotate prop would pull motion into the icon and fork the gate.
- **Size is a 2-value semantic token, not a pixel prop** — pixels at the call site = drift.

**Size model.** `size:'chrome'` (default) renders the glyph at the adjacent label's font-size (the
icon box tracks `--sk-icon-size`, defaulting to `1em`), so a chevron beside the 13px small-caps dir
label is ~13px and lands squarely in the 12-15px chrome band with zero per-call math. `size:'touch'`
(token `--sk-icon-touch: var(--sk-reading-row)` ≈ 15px) is declared for a future _icon-only_ control
and **unused in v1** (so the band is closed, not so it's used). **The 44px target is the control's hit
area, never the icon's box** — `ReaderIcon` sets no touch target. _(C4 check: if `1em` reads slightly
tall beside small caps, switch the default box to the `cap` unit or a fixed ~0.9em — a tuning lever,
not a v1 blocker.)_

**Stroke width.** `--sk-icon-stroke:1.5` (unitless), fixed token, authored on a 24×24 viewBox with
`stroke-linecap/linejoin:round` — calm and ink-drawn, not hairline-fragile. Dark escape hatch
`--sk-icon-stroke-dark:1.75` wired but **dormant** (activated only if the C4 real-panel AA check fails;
default both modes 1.5px and fix contrast by _colour_ first).

**aria-hidden default + title/label policy.** Default decorative: no `label` ⇒ `aria-hidden="true"` +
`focusable="false"` on the `<svg>` — the v1 path for **every** glyph (each sits beside text inside a
control that already carries the name; an icon in the a11y tree beside text = double announcement).
`label` is the escape hatch (→ `role="img"` + `<title>`); **no v1 use needs it**, the prop exists so
the boundary is complete.

**Class / styling hooks.** Fill/stroke = `currentColor` (inherits the control's resolved ink — muted
dir labels, the ivory ramp in dark, the accent on the current row — hover recolours the _text_ and the
icon follows for free). The only knobs are the three `--sk-icon-*` tokens; `ReaderIcon`'s internal
class names are **private** (consumers style the icon-text _gap/alignment_ on their own element, never
the SVG internals). The optical vertical-align nudge (`~-0.125em`) and `shape-rendering:geometricPrecision`
live inside `ReaderIcon`, so consumers get cap-aligned, snapped glyphs without re-deriving offsets.

**Reduced-motion.** `ReaderIcon` animates **nothing**. The one v1 motion (disclosure rotation) stays a
consumer-owned `transform` under the consumer's existing `@media (prefers-reduced-motion: reduce)`
gate. `ReaderIcon`'s contract is "I am a static glyph."

**How it nests:**

- **Inside `SkLink`** (prev/next/up — decorative, icon-beside-text): the icon is a child _inside the
  slot_, so SkLink's single-`<a>`-root transparency invariant is **untouched** (one `<a>` wrapping the
  spans). `<SkLink …><span class="pseg-nav__dir"><ReaderIcon name="chevron-left"/>Trecho anterior</span>…</SkLink>`.
  The name comes from SkLink's text; the icon is `aria-hidden`. The `--next` cell orders text-then-icon
  in markup (a consumer concern, no prop).
- **Inside a real `<button>`** (disclosure): `<button … :aria-expanded><span class="pwc__chapter-title">…</span><ReaderIcon
name="disclosure" class="pwc__chevron" :class="{'is-open': isOpen}"/></button>`. The `.is-open` keeps
  the **existing** `rotate(90deg)` + `--sk-motion-fast`/`--sk-ease` transition + reduced-motion gate;
  the button keeps its own focus ring. The only change is the host is a `<ReaderIcon>` not a
  border-triangle span — a pure glyph upgrade with identical interaction semantics.

---

## 6. Initial icon set

**v1 — a closed set of 4 names over ~3 unique paths.** Every one retires an existing glyph source;
nothing more.

| `name`          | Glyph                                   | Where                                                  | Paired with           |
| --------------- | --------------------------------------- | ------------------------------------------------------ | --------------------- |
| `chevron-left`  | left chevron                            | `PipelineSegmentNav` prev cell (icon **before** label) | "Trecho anterior"     |
| `chevron-right` | right chevron                           | `PipelineSegmentNav` next cell (icon **after** label)  | "Próximo trecho"      |
| `chevron-up`    | up chevron                              | `PipelineSegmentNav` up-link (icon **before** label)   | "Sumário"             |
| `disclosure`    | right chevron, rotates 90°→down on open | `PipelineWorkContents` chapter button                  | `aria-expanded` state |

- **Chevron, not arrow, for all four** — Apple's idiom: chevron = quiet drill/continuity; a full arrow
  is reserved for hierarchical _return_. Arrows would read heavy and break the calm.
- **`disclosure` is its own name even though it's a right-chevron** — named by _meaning_ (a state
  toggle) not appearance, so it can diverge visually later without renaming. Its right→down rotation is
  the dominant macOS/iOS/accordion convention and matches the current `.pwc__chevron` behaviour
  exactly, so C3 is a visual swap with identical semantics.
- **The up-link uses `chevron-up`, not a list glyph** — our up-link means "leave this leaf and return
  to the map" (directional) and keeps the word "Sumário," which is clearer than Apple Books' bare
  bulleted-list TOC button.

**Explicitly DEFERRED / forbidden (these define the _boundary_ of the language, not gaps in it):**

- **`contents` / `list`** (a true TOC-list glyph) — _not_ in v1; the word "Sumário" + `chevron-up`
  carries the up-link. Reserved for a future dedicated "open contents panel" control if one ever exists.
- **`languages` / `globe`** (edition/language switch) — deferred to the fr edition with
  `PipelineEditionSwitch`; adding it now is a glyph with no control behind it.
- **zoom-out / map** — no such surface yet.
- **progress / circle / checkmark** — **forbidden by policy** (no progress %, last-read, checkmarks, or
  stored reading state). A hard exclusion, not a deferral, until policy changes. Current-position stays
  the inset accent bar + `aria-current` — no glyph.
- **AI companion, annotation / highlight / note** — no glyph, no surface.

Recording the deferred set _in the contract_ is itself governance: a future contributor reads "these
names are reserved/gated — do not improvise them."

---

## 7. Implementation slices

The umbrella Slice C decomposes into four independently shippable, revertible sub-slices.

### C1 — `ReaderIcon` foundation (boundary + tokens; **no consumer swaps**)

- **Goal:** land `ReaderIcon.vue` (vendored impl), the `--sk-icon-*` tokens, and the closed
  `ReaderIconName` union — **with no call sites yet**. The seam exists and is tested before anything
  depends on it.
- **Files:** `+ ReaderIcon.vue` (+ a sibling `reader-icons.ts` path-data map it owns); `vars.css`
  (`--sk-icon-size`, `--sk-icon-touch`, `--sk-icon-stroke`, dormant `--sk-icon-stroke-dark`). **No
  `package.json` change** (vendored).
- **Risks:** very low (additive, unconsumed). Only watch: SSR — confirm the inline-SVG renders in built
  HTML with no client-only API.
- **Tests:** `ReaderIcon name="chevron-left"` renders an `<svg aria-hidden="true" focusable="false">`
  with `stroke-width` from the token, `currentColor`, 24 viewBox, **present in the built output (SSR)**;
  `vue-tsc --noEmit` rejects an unknown `name`; no focusable element emitted; `format:check` + `oxlint`
  green.
- **Screenshots:** an isolated render-harness page showing all v1 glyphs at chrome size, light + dark,
  to lock the 1.5px stroke identity before adoption.
- **Do-not-touch:** any consumer component; `package.json`; `VTIcon*`; routes; the prose; data.

### C2 — nav glyphs into `PipelineSegmentNav`

- **Goal:** replace `‹ › ↑` with `ReaderIcon` (`chevron-left`/`-right`/`-up`); refine icon-text spacing;
  keep the Slice-A small-caps dir labels + unified "Sumário."
- **Files:** `PipelineSegmentNav.vue` (markup: `ReaderIcon` inside the existing `.pseg-nav__dir` spans
  - up-link; CSS: `.pseg-nav__icon` gap/alignment; drop the literal-glyph characters). **No `SkLink`
    change.**
- **Risks:** low. Watch right-cell ordering (chevron-after-text on `--next`); baseline alignment vs the
  small-caps labels.
- **Tests:** all existing pseg-nav specs green (prev/next/up presence; hrefs resolve hash-stripped;
  **no fr/old-chapter/reading-review leak**; ≥44px). Add: an `aria-hidden <svg>` in prev/next/up;
  SkLink still renders a single `<a>` root (transparency invariant); accessible name still from text
  only.
- **Screenshots:** leaf bottom nav — first/middle/last trecho, mobile/desktop, light/dark.
- **Do-not-touch:** the prose; routes/redirects; the `#trecho` hash round-trip; `SkLink`.

### C3 — disclosure chevron into `PipelineWorkContents`

- **Goal:** replace the `.pwc__chevron` CSS border-triangle with `ReaderIcon name="disclosure"`,
  preserving the exact rotate-on-`.is-open` + reduced-motion behaviour; move the literal `ease` to
  `--sk-ease` and `0.2s` to `--sk-motion-fast`; drop `opacity:0.45` (stroke at `currentColor`/muted).
- **Files:** `PipelineWorkContents.vue` (swap the `<span class="pwc__chevron">` for a `<ReaderIcon
class="pwc__chevron" :class="{'is-open'}">`; keep the transform/transition/reduced-motion CSS; drop
  the border-triangle + opacity declarations).
- **Risks:** low-medium — the chevron lives in a real button with its own focus ring + a working motion
  gate; the swap must disturb neither. Verify the rotated glyph optically centers in the 44px row.
- **Tests:** collapse/aria specs green (`aria-expanded` toggles, `aria-controls`, 2 parts/10 chapters,
  99 links, return-highlight opens+marks+scrolls). Add: disclosure is an `aria-hidden <svg>`; rotation
  computed `transition:none` under reduced-motion; button focus ring unchanged.
- **Screenshots:** hub collapsed + expanded, mobile/desktop, light/dark — disclosure reads as one
  family with the nav chevrons.
- **Do-not-touch:** the collapse state machine / localStorage; the return-hash logic; the
  data/bucketing; the button's focus ring.

### C4 — a11y + visual hardening (the gate for the icon language)

- **Goal:** prove the whole set coheres and passes the a11y/contrast gate before it becomes the
  template the fr edition inherits.
- **Files:** tests + (only if the visual pass demands) micro-tweaks to `--sk-icon-stroke`/alignment in
  `vars.css` / the two consumers. **No new behaviour.**
- **Risks:** none (review/tuning). The one real decision: confirm 1.5px holds AA-adjacent legibility on
  **dark lamplight at ~13px** (the danger zone) on a real mobile panel — if not, activate
  `--sk-icon-stroke-dark:1.75`.
- **Tests:** consolidated a11y assertions across both consumers (every icon decorative-or-labelled;
  focus never on the SVG; reduced-motion honored; ≥44px targets); SSR presence of all glyphs; `vue-tsc`
  clean; full `pnpm verify`.
- **Screenshots:** the full matrix (hub + first/middle/last leaf, mobile/desktop, light/dark) as one
  sign-off sheet proving the symbol language is one dialect.
- **Do-not-touch:** the `ReaderIcon` API surface (frozen after C1); the deferred glyph set; routes.

### Later (post-fr, gated, **NOT Slice C**)

- **Promote the implementation vendored → `@lucide/vue`** _iff_ unique glyphs cross ~8 (edition switch
  lands) — a one-file change inside `ReaderIcon`, **zero consumer changes**; named imports only, never
  the dynamic loader.
- **`languages`/`globe`** with `PipelineEditionSwitch` (fr edition); **zoom-out/map**,
  **annotation**, **AI-companion** glyphs only when their surfaces exist; **progress** stays forbidden
  until policy changes.

---

## 8. Accessibility and interaction standard

The house pattern, made explicit for icons (Slice C changes none of it):

- **Icons are `aria-hidden` when paired with text** (every v1 use); lucide/ours default to this.
- **The interactive name is on the control** (SkLink text / the button's text + `aria-expanded`),
  never on the SVG. An icon-only control would use `ReaderIcon`'s `label` (→ `role="img"` + `<title>`)
  — no v1 use needs it.
- **Hit targets stay ≥44px** on the control; the glyph adds visual, not tap area.
- **The focus ring is on `SkLink`/the button, never the SVG** — structurally guaranteed because
  `ReaderIcon` emits no focusable element and no outline.
- **Current state is never icon-only** — the inset accent bar + `aria-current` carry it; no status
  glyph.
- **Motion/rotation respects `prefers-reduced-motion`** — the disclosure snaps (no rotation) under
  reduce; prev/next/up never animate.

---

## 9. Performance and dependency budget

- **Bundle impact:** for ~3 glyphs, **negligible** — a few hundred bytes of path data each, ~1-2 KB
  gzipped total, whether vendored or via `@lucide/vue` named imports. Vendored adds **zero** dependency
  weight to `node_modules`/lockfile; lucide would add the package + ~1,600 unused icons on disk and the
  _risk_ of a future wildcard/dynamic import silently shipping the **7+ MB** full set.
- **How to test the delta (no analyzer needed — the stack already supports it):** run `vitepress build`
  on baseline vs the icon branch and diff the produced `.vitepress/dist/assets/*.js` byte sizes
  (`ls -l` / `gzip -c file | wc -c`). Add a one-line size check to C1's verify if desired; no
  `rollup-plugin-visualizer` is warranted.
- **Anti-sprawl guardrails:** (1) closed `ReaderIconName` union — `vue-tsc` breaks on an unknown name;
  (2) one stroke / one size-band / `currentColor`, all tokenized in the wrapper, so a new glyph can't
  introduce a rogue weight/size/colour; (3) the add-a-glyph process (real surface first; lucide-grid
  source; named by meaning; re-reviewed against the whole set); (4) the deferred/forbidden list in the
  contract; (5) **one import point** — the shell imports `ReaderIcon` only, never lucide/raw SVG/`VTIcon*`.
- **Foundation-first compatibility:** vendor-first keeps `package.json` minimal (the project's stated
  posture), ships no measurable weight, and is immune to upstream churn — fully consistent with the
  no-heavy-dependency philosophy. The dependency is taken _only_ when the vocabulary genuinely earns
  it, behind a seam that makes the upgrade free.

---

## 10. Final recommendation and next implementation prompt

**Build the reader shell's owned symbol language as a tiny VENDORED inline-SVG set (lucide-sourced ISC
geometry, retuned to a 1.5px stroke on lucide's 24-grid) behind one frozen `ReaderIcon` boundary.** It
is the most owned, most coherent, dependency-free, churn-immune option; the seam makes a later
`@lucide/vue` promotion a single reviewed diff with zero consumer change. Do it now (not after fr) so
every future book/edition inherits a finished, calm, bookish chrome instead of a retrofit.

**Strongest argument against (and why it still wins).** _Vendoring is a false economy: the roadmap's
own future (edition switch, zoom-out map, AI, annotation) keeps adding glyphs, so the lucide threshold
is inevitable — vendor-first pays to hand-tune paths now, pays again to migrate later, risks hand-paths
drifting off lucide's grid so the swap isn't pixel-identical, and forgoes lucide's maintained,
optically-corrected set._ **Why it still wins:** the "double work" is ~2 paths authored on lucide's
_own_ 24-grid from lucide's _own_ ISC SVGs, so the later swap stays geometrically faithful and the
migration is one file inside `ReaderIcon` with no consumer/screenshot change; reversibility is the
strategy, and vendor-first defers the irreversible-ish act (the dep + its cadence + a 1,500-icon
nuisance) until the glyph count _actually_ earns it — the gate has **not** fired (v1 ≈ 2 unique
glyphs), and honoring the gate rather than front-running it is the disciplined, fully-reversible call.

### Next implementation prompt — **Slice C1 only**

> Implement **Slice C1 — the `ReaderIcon` foundation** for the reader shell, in `skepvox-website` on
> `develop`, no branch, no push. **Boundary + tokens only — no consumer swaps, no `package.json`
> change, no dependency.**
>
> 1. **Tokens (`vars.css`, alongside the `--sk-reading-*` block):** add `--sk-icon-size: 1em`,
>    `--sk-icon-touch: var(--sk-reading-row)`, `--sk-icon-stroke: 1.5`, and a **dormant**
>    `--sk-icon-stroke-dark: 1.75` (wired, not yet applied).
> 2. **`ReaderIcon.vue` (new) + `reader-icons.ts` (new, owned path-data map):** a vendored inline-SVG
>    wrapper with the **frozen API** — `name: ReaderIconName` (closed union:
>    `'chevron-left' | 'chevron-right' | 'chevron-up' | 'disclosure'`), optional `label`, `size:
'chrome' | 'touch'` (default `'chrome'`). NO `stroke`/`color`/`rotate`/svg-class props. It renders
>    one `<svg>` on a 24×24 viewBox, `stroke-width: var(--sk-icon-stroke)`, `stroke-linecap/linejoin:
round`, `fill:none`, `currentColor`, box = `var(--sk-icon-size)`, `display:inline-block`,
>    `vertical-align:-0.125em`, `shape-rendering:geometricPrecision`, and **`aria-hidden="true"` +
>    `focusable="false"` by default** (when `label` is set instead: `role="img"` + a `<title>`, drop
>    `aria-hidden`). Glyph paths are vendored from lucide's ISC `chevron-left/right/up` SVGs; `disclosure`
>    is the right chevron at rest. The component animates nothing and carries no focus ring.
> 3. **No call sites yet.** Do not edit `PipelineSegmentNav`, `PipelineWorkContents`, `SkLink`, the
>    generator, routes, or data.
> 4. **Tests + verify:** a spec that `ReaderIcon` renders an `<svg aria-hidden="true" focusable="false">`
>    with the token stroke-width + `currentColor` + 24 viewBox, **present in the built (SSR) output**,
>    emits no focusable element, and that `vue-tsc --noEmit` rejects an unknown `name`. Add a small
>    render-harness (a buffer/noindex page or a test fixture) screenshotting all four glyphs at chrome
>    size in light + dark to lock the 1.5px identity. Run `pnpm verify`. Commit on `develop`, do not
>    push.

### Do not do yet

- Do **not** swap any consumer glyph in C1 (that is C2/C3).
- Do **not** add `lucide`/`@lucide/vue` or any icon dependency (vendored v1; promote only post-gate).
- Do **not** build the shell on `@vue/theme` `VTIcon*`.
- Do **not** add a `contents`/`list`, `languages`/`globe`, zoom-out, progress, AI, or annotation glyph
  — the v1 union is closed at 4 names.
- Do **not** add a `stroke`, `color`, or `rotate` prop to `ReaderIcon` (tokens + consumer transform).
- Do **not** put the accessible name or the focus ring on the SVG; do **not** opacity-dim the dark
  hairline; do **not** add prev/next motion.
- Do **not** pre-build the edition switcher or touch routes / generated pages / data / the fr edition.
