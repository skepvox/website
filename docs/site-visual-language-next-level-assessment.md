# Site Visual Language — Next-Level Assessment

**Status:** assessment only. No UI implemented in this pass. No route, pipeline, podcast-content, or dependency change proposed.
**Scope:** the whole site as one visual system — homepage gateway, Literatura, Filosofia, Vox Français — not the homepage alone.
**Method:** code inspection of the owned theme (`vars.css`, `pages.css`, `Home.vue`, `PipelineWorkContents.vue`, `PipelineReaderHeader.vue`, `PipelineSegmentNav.vue`, `CardGrid.vue`, `ReaderIcon.vue` + `reader-icons.ts`, `pillars.ts`, the podcast components, the hub markdown), the Playwright guardrails, **and live visual inspection** — the dev server was built and the four target surfaces were screenshotted in WebKit (mobile Safari engine, 390×844) and Chromium (desktop, 1280×900), light and dark. Those concrete observations are §2. No new copy is proposed anywhere.

This phase is about **visual language, component behaviour, CSS, rhythm, colour, symbols, interaction, and owned identity** — never about adding words to make a page feel less empty.

---

## 0. The thesis (read this first)

The site already made the *right austere choices*: warm paper surfaces, an ink-blue reading accent, Literata for prose **and for hub/work titles** (the serif titles already look genuinely bookish), owned tokens, no gamification, no marketing hero. The problem is not that it is too plain. **The problem is that austerity was applied as uniformity instead of as composition.**

A bookish-austere design that is *alive* — a Penguin Classics title page, an NYRB spine, a Tufte page, a letterpress colophon — is calm **and** alive because it uses *position, scale contrast, and one recurring mark* to make rhythm. skepvox has the restraint but not the composition: it expresses structure with essentially **one device, repeated everywhere — the full-width horizontal hairline** (and, on the podcast page, the one other default: the bordered card). Either way, every page reads as a ruled table or a box grid — the two looks the brief explicitly rejects.

So the answer is not more colour, more cards, more motion, or more arrows. The answer is to **change the structural grammar** from the repeating horizontal rule to a **vertical spine** — the book-spine as the organizing metaphor of a personal library — plus deliberate spatial grouping, a single owned non-arrow mark, and a perceptible warmth. Keep the austerity; add the composition.

> **Signature element — the reading spine.**
> The reader is always positioned *along a spine*: a single vertical hairline (a bound volume's edge) that carries the pillar marks, the current-location tick, and the catalogue rail, and on desktop becomes the marginal structure column. It replaces the stack of horizontal rules on every surface — homepage, hub, reader map, leaf, podcast — so the whole site reads in one owned dialect instead of as ruled tables and box grids.

### Compact design plan (the token sketch this assessment builds toward)

- **Colour (keep, don't widen):** ink `#213547` / warm-ivory dark; accent ink-blue `--sk-accent #2f4a6b` → `#8fb3df` dark (unchanged, test-locked); paper a *perceptible* warm reading tone (new, quiet); cue gold `181 148 84` (unchanged); pillar tint used **only at tick scale**, never as fill — sepia (Literatura) / ink-blue (Filosofia) / slate-French-blue (Vox Français).
- **Type (make it do more than one job):** Literata as the *imprint + bookish* voice (homepage wordmark, hub/work titles, prose, chapter titles); UI-sans as the *running-head/utility* voice (nav, counts, prev/next labels). Retire the habit of setting **every** structural label in uppercase muted small-caps — reserve small-caps for the single "section divider" role; let hierarchy come from scale + weight + the spine.
- **Structure (the de-tabling):** vertical spine + spatial grouping replaces full-width horizontal rules; indentation off the spine encodes Part › Chapter › Segment; the current tick is the one "you are here" mark everywhere.
- **Signature:** the reading spine + the **skepvox rider as a content-level colophon** on the homepage (the mark already exists in `logo.svg`, used today only at 36px in the navbar).
- **The one aesthetic risk:** turning the site's universal divider 90° — from horizontal rule (the broadsheet/docs default) to a vertical spine (owned, bookish) — and committing to it on every surface.

---

## 1. Current visual diagnosis (blunt)

### 1a. IA and data are correct. The visual system is the failure.

The information architecture and data wiring are genuinely good and must be preserved: three pillars in `pillars.ts` shared by nav + homepage so they can't drift; the reader map, breadcrumb, and bottom nav all join the *same* `pipeline-export-segments.json` by identity (`canonicalId`, never routePath); leaves load only their own prose; everything server-renders; the a11y floor (44px targets, focus ring, reduced-motion, decorative-vs-labelled icons) is real and enforced. **None of that is the problem and none of it should be touched for visual reasons.** The deadness is entirely in the *presentation layer*.

### 1b. Why it feels like a table

One device carries all structure: the **full-width horizontal hairline.** In the current code:

- **Homepage** (`Home.vue`): masthead `border-bottom`, then each pillar row `border-bottom: 1px solid var(--vt-c-divider)`. The page is literally `rule / row / rule / row / rule / row / rule`.
- **Reader map** (`PipelineWorkContents.vue`): every `.pwc__chapter-heading` and `.pwc__chapter-row` draws `border-top: 1px solid var(--sk-reading-rule)`. Brás Cubas's editorial divisions and Lavelle's chapters become a long stack of identical full-width hairline rows — the most table-like screens on the site.
- **Hub/work mastheads** and **leaf header / bottom nav**: hairline-bound, `border-top`/`border-bottom` throughout.
- **Every doc heading** (`pages.css` `.vt-doc h2::before`): a 2px soft-accent bar above each `h2` — one more repeating ruled "event" (note: it surfaces only on `.vt-doc` markdown `h2`s — the `.pillar`/`.pwc` surfaces are simply not `.vt-doc` `h2` descendants, so the selector never matches there; see §9 for honest scoping).

When one rule does grouping, separating, *and* binding on every page, every page looks the same and looks like a spreadsheet.

### 1c. Why it feels rented

- **The podcast page is the VitePress feature-box.** `CardGrid.vue` is a 2-column grid of bordered, raised, rounded rectangles (`border`, `background: var(--sk-surface-raised)`, `border-radius: 12px`, 72px thumbnail, 3-line clamp). It is the generic doc/marketing card, and it is the *universal* list primitive (author hubs, work lists, **and** podcast episode lists). The podcast show page is where it is most visible and most templated.
- **The chrome is honest-but-grey monotone.** The reading shell is carefully built but *all muted ink on near-white with hairlines and one accent bar*. Several meaning-bearing greys (the "year · title" meta, front-matter links) sit close to the AA floor, and the per-row counts use the faint `aria-hidden` ink — legitimate for assistive tech, but the palette reads tired.

### 1d. Why it feels static / dead

- **The accent is owned but inert.** `#2f4a6b` appears only on the wordmark (static), hover colour, focus ring, the current tick, and a prose-link underline. Literatura, Filosofia, and a French-learning podcast are visually **indistinguishable**.
- **Symbols = arrows, full stop.** `ReaderIcon` is four chevrons; the homepage uses a literal `→` (`.pillar__go`). The brand rider exists but is confined to a 36px navbar mask.
- **Type speaks in one structural note.** Uppercase muted small-caps for *everything* structural — and on the Lavelle hub the long part labels wrap to two shouty lines.
- **Desktop is stretched mobile.** `.home-index` / `.pwc-shell` are ~42rem columns centered in a void; the count+chevron strand at the far-right edge, far from the title.
- **The warmth is sub-perceptual in light.** `#fcfcfa` vs `#ffffff` is invisible; the cool ink `#213547` fights the "warm" story. (In dark, the warm-ivory serif does carry some warmth — see §2.)

**Net:** one structural idea (horizontal rule), one box default (the card), one inert colour gesture, one symbol (arrow), one structural type voice — repeated across every page. The monotony *is* the deadness. It is a composition problem, not a content problem.

---

## 2. Visual QA — current state, inspected

Built and served locally; the four surfaces captured in WebKit @ 390×844 (mobile Safari) and Chromium @ 1280×900 (desktop), light and dark, appearance toggled via `vitepress-theme-appearance`. *(The dev cookie-consent banner overlays the lower third of each capture — ignore it; it is the consent dialog, not a layout issue.)*

**Homepage — mobile, light.** Sans-600 ink-blue wordmark "skepvox"; subline; a full-width hairline; three pillar rows, each `Title + → (top-right) / blurb / "year · title"`, every row closed by a full-width hairline; a footer hairline. Reads as `rule / row / rule / row / rule / row / rule` — a literal stack of horizontal rules. The `→` floats top-right of each title as decoration.

**Homepage — mobile, dark.** Identical geometry; the wordmark becomes the lifted blue `#8fb3df` and is the **single saturated element on the screen**; the surface reads near-neutral black (the "warm deep" is not perceptible); everything else is muted grey. Calm but inert.

**Homepage — desktop, light.** The ~42rem column is centered with vast empty margins left and right — a narrow column of full-width rules floating in a void (the "stretched mobile" problem, confirmed). The `→` is stranded at the far-right edge of each row, far from its title; the title-left / arrow-far-right gap reads explicitly as a table row and looks disconnected.

**Brás Cubas hub — mobile, light.** Serif (Literata) work title — **genuinely handsome and bookish**; "MACHADO DE ASSIS" small-caps edition line; masthead hairline. "ABERTURA" small-caps + three serif front-matter links, space-separated with *no* rules (this part already breathes — proof the spacing approach works). Then "CAPÍTULOS" and the editorial divisions ("O Defunto Autor", "Meninice e Mocidade", "Ambições", …), each a **collapsible** row: serif title left, count + disclosure chevron `>` right, a full-width `border-top` hairline between every one. A long stack of identical hairline rows — the most table-like screen on the site.

**Brás Cubas hub — mobile, dark.** The warm-ivory serif on near-black is the **one place dark mode reads "lamplight"** — the title looks good. But the hairline-row stack is unchanged. So dark carries warmth via *ink*, not surface; the paper-tone work matters most in *light*.

**Brás Cubas hub — desktop, light.** Same rows at full column width; count+chevron stranded far right with a long empty gap to the title — a spreadsheet row at desktop scale.

**Lavelle hub — mobile, light.** Serif title; "LOUIS LAVELLE"; **part dividers in uppercase small-caps that wrap to two shouty lines** ("PRIMEIRA PARTE — AS CATEGORIAS PRIMEIRAS DA ONTOLOGIA"); then collapsible chapter rows (count + chevron + hairline). Same table; the wrapping uppercase labels reinforce "retire the small-caps monotony."

**Vox Français show — mobile, light/dark.** A rented "Navegar | Índice ›" local-nav band at the very top (an extra horizontal rule + chrome). "PODCAST · 3 LEÇONS" eyebrow; sans "Vox Français" title; a real multi-sentence French standfirst; "ÉCOUTER Apple Podcasts · Spotify"; a short accent tick; "Leçons"; then the **episode boxes** — `CardGrid` bordered/rounded/raised cards with the colourful "Vox Français" cover art, number+title, 2-line description, "22 min". These boxes are the single most templated surface on the site and the only place cards appear; in dark they feel slightly floaty on the field.

**Cross-surface takeaway.** The site runs **both** anti-patterns the brief named — ruled tables (home, hubs) and cards (podcast) — in different places. The serif title voice is already strong and should be amplified, not changed. The deadness is the structural grey, the universal hairline, the boxes, and the arrows.

---

## 3. Visual principles for the next system (7)

1. **Humble but alive.** Life from rhythm, scale contrast, a recurring mark, and perceptible warmth — never loudness or hero copy. If a change shouts, it's wrong.
2. **Bookish but modern.** Metaphors: bound-volume, title page, colophon, marginalia, catalogue — not skeuomorphic leather, not a docs sidebar.
3. **Personal but not amateur.** Asymmetry, generous margins, one confident owned mark read as a designed personal library; centered grey rows between hairlines read as a default.
4. **Component-owned, not theme-rented.** Every recurring surface in skepvox tokens and skepvox marks; the structural device is *owned* (the spine), not inherited (`--vt-c-divider` rows). Rented `@vue/theme` chrome stays infrastructure, never a design source.
5. **Structure is spatial, not ruled.** Group by proximity and indentation off the spine; divide by space and the one vertical line; reserve a horizontal rule for a genuine *binding* (a masthead to its contents), never as the default separator.
6. **One temperature, three rooms.** The three pillars share one system; each has a quiet identity (a mark and, at most, a tick-scale tint). Same building, three rooms; never three colour themes.
7. **Light is paper, dark is lamplight.** The two modes differ *materially* (daylit page vs warm reading lamp), not by inversion — same geometry, type, marks; warmer/dimmer ink and a faint glow in dark.

*(Plus the standing floor, unchanged: AA contrast on meaning-bearing text, ≥44px targets, visible focus, reduced-motion honoured, no scroll-jacking.)*

---

## 4. Component inventory — what each family should become

| Family | Today | Should become |
|---|---|---|
| **Homepage gateway** (`Home.vue`) | Sans wordmark + subline over 3 hairline rows, each with a `→` | A **title page**: Literata imprint + the **rider colophon**, three pillars as catalogue entries hung off one spine; `→` removed; affordance = mark + whole-row link + hover spine-tick |
| **Pillar rows / entries** | Identical grey rows, full-width `border-bottom`, trailing `→` | Catalogue entries on the spine, each carrying its **pillar mark**; separated by space, not rules; tabular "year · title" line on the rail |
| **Author "cards"** (`CardGrid`) | Bordered raised box, 72px square thumbnail | Catalogue rows: portrait as a small **bookplate**, name + dates as a quiet entry on the spine; box dropped (border → transparent at rest, accent on hover — keeps the test) |
| **Book "cards"** (`CardGrid`) | Bordered box, title + year meta | Catalogue rows with a **trecho-count tick** on the rail; no box |
| **Reader map** (`PipelineWorkContents`) | Stack of `border-top` rows + disclosures | The spine: **one** vertical rail; Part › Chapter › Segment by indentation; counts kept; disclosure chevrons kept; hairlines removed; current tick promoted to the system "you are here" |
| **Reader leaf header** (`PipelineReaderHeader`) | Grey uppercase breadcrumb, hairline-bound | Location *on the spine*; warm paper reading column; keep the test-locked h2=13px / h3=uppercase-sans contract |
| **Bottom nav** (`PipelineSegmentNav`) | `border-top` row, prev/next chevrons, up-link | Aligned to the spine, quieter; prev/next + up chevrons **kept** (directional) |
| **Podcast show/episode** (`PodcastShowHeader/EpisodeHeader/Player`) | Show masthead OK; episodes via `CardGrid` boxes; native `<audio controls>` | Catalogue entries (cover as bookplate); **owned/quieted transport** with a `play` glyph; the **gold cue** celebrated as the one alive accent |
| **Footer / social** | Deferred (rented footer routed to page base) | Later: owned `SocialIcon` set once brand assets land; spine-consistent, not a filled footer block |

---

## 5. Symbol / icon direction

### 5a. Two layers, deliberately separate

The brief asks whether `ReaderIcon` should expand or whether a second layer is needed. **A second layer.**

- **Layer 1 — `ReaderIcon` (navigation & state): keep closed, keep minimal.** Its job is *pointing and disclosure*: `chevron-left/right/up`, `disclosure` — vendored lucide geometry, 24-grid, 1.5px non-scaling stroke, decorative-by-default. Leave the union at four. **Do not pour brand marks into it** — that would wrongly trip the documented "~8 unique glyphs → promote to `@lucide/vue`" gate with symbols lucide does not contain (there is no skepvox rider in lucide), and conflate "an arrow that points" with "a mark that identifies."
- **Layer 2 — `BrandMark` (identity): new, owned, hand-drawn.** A sibling component (`BrandMark.vue` + `brand-marks.ts`) reading an owned registry of *original* SVG marks on the same 24-grid so the families feel related but distinct in role (these may be filled, not only stroked) and governance (drawn in-repo, ISC-free because original; never lucide). Same a11y contract as `ReaderIcon`: `aria-hidden` by default, `role="img"` + `<title>` only when labelled, colour via `currentColor`, no own focus ring. **No runtime dependency** — both layers are vendored SVG; pulling an icon set for three marks is strictly worse than owning them.

### 5b. The owned marks

- **`rider`** — the colophon. The existing `logo.svg` rider/jagunço geometry promoted to a content-scale **pressmark** on the homepage title page. (Today the mark is used at 36px in the navbar lockup and as the favicon — never at content scale.) This is the single most identity-defining move and it costs nothing new — the mark already exists. **This is the only mark V1 ships;** because the rider is a detailed illustration, the homepage colophon reuses the `logo.svg` mask (as `NavBarTitleBrand` does) rather than re-vendoring its path data, while `BrandMark` ships seeded with the rider to establish the owned-symbol seam — its first on-surface inline-SVG render is the pillar marks in V2 (§9).
- **Three pillar marks** — a unified family of *spine glyphs* (a short vertical stroke with a per-pillar detail: a serif foot for Literatura; a crossed/Greek-key tick for Filosofia — Lavelle's Greek register; a breve/accent-aigu stroke for Vox Français — the diacritic of the language). **Designed to final quality and visually assessed in V2 — never shipped as placeholders** (see §12).
- **`play`** — the one audio transport glyph (a filled triangle). The *only* arrow-adjacent shape that should be **added**, because it is a transport control, not navigation. Ships in V4.

### 5c. Where arrows stay, go, or are absent

- **Keep:** `chevron-left` / `chevron-right` (prev/next), `chevron-up` (up-link), `disclosure` (collapsible chapters/divisions — including Brás Cubas's editorial divisions). Correct and tested.
- **Replace / remove:** the homepage `→` (`.pillar__go`) — the row *is* the link; the pillar mark + a hover spine-tick is the affordance.
- **No icon at all (better than an icon):** breadcrumb separators (the reader-header test already *forbids* `> / › » → |` here), chapter/division direct links beyond the disclosure, catalogue rows, section dividers, the "go to section" gesture generally.

### 5d. Anti-clutter rule

At most **one** mark per entry. The spine + the mark is the affordance; never stack mark + arrow + border on the same row.

---

## 6. Colour and surface direction

Keep the palette **quiet**. The accent token (`--sk-accent #2f4a6b` → `#8fb3df`) is locked by `color-tokens.spec.ts` and stays. Life comes from *where* colour and surface are used.

- **Make the paper perceptible — especially in light.** `--sk-surface #fcfcfa` is invisibly different from white. Introduce a reading-column **paper tone** — a faint, *actually visible* warm tint distinct from the page base — so a leaf reads as paper on a desk. Flat tint only; **no gradient blobs, orbs, or decorative glows.**
- **Let the paper carry the warmth.** Rather than recolour the load-bearing cool ink, warm the paper (plus the already-warm `--sk-border rgba(45,40,30,.11)`), so warmth becomes visible without disturbing the tested ink/accent.
- **Dark = lamplight, not a darker table.** Dark already gets some warmth from the ivory serif; add a faint warm paper *lift* (not a panel) so the reading column glows slightly under the "lamp."
- **Depth — exactly one level, for the page.** The reading column on the paper tone with the spine as its inboard edge (at most a single 1px top edge). Reserve soft shadow for the *one* honest place — an author **portrait** (already shadowed). No scattered card shadows.
- **Pillar tint — tick scale only (V5).** Each pillar an ink temperature used **only** on its mark and current/hover tick — sepia / ink-blue / slate-French-blue. Additive tokens (`--sk-pillar-*`); **never** a coloured card, background, or full row.
- **Avoid the homepage-as-card-grid trap.** The gateway stays a calm index; catalogue-on-spine is a *list*, not a grid of boxes.

---

## 7. Motion and behaviour

All additive, subtle, inside the global reduced-motion floor (`utilities.css` neutralises transitions/animations/smooth-scroll under `prefers-reduced-motion: reduce`).

- **Hover / focus / tap.** Replace the homepage arrow-nudge (`translateX(3px)` on `.pillar__go`) with a **spine-tick reveal**: the left tick fades/grows in on pointer-hover. Pointer-gated (`@media (hover: hover) and (pointer: fine)`), reduced-motion-gated. The tick is a *hover* affordance only — keyboard focus surfaces `SkLink`'s focus ring (Home.vue must not declare its own `:focus-visible`, per `nav-interaction-states.spec.ts`), and tap stays neutral (SkLink owns the no-sticky-hover contract). The *signature* becomes the interaction; an arrow retires. (Replacing the `translateX(3px)` hover signature means the one `Home.vue` hover assertion in `nav-interaction-states.spec.ts` is updated to the spine-tick — see §9 V1 / §11.)
- **Disclosure.** Keep the `disclosure` chevron's 90° rotation on open (token-timed, reduced-motion gated). The one correct micro-animation.
- **Active / current.** Promote `box-shadow: inset 2px 0 0 var(--sk-reading-current)` to the **system-wide** "you are here" mark (homepage hover, map current row, leaf location). One language for presence.
- **Podcast playback.** Keep the gold cue wash transition (the one alive surface). V4's owned transport may add a quiet play↔pause state change on the `play` glyph; reduced-motion gated.
- **Page transitions.** The deferred View-Transitions crossfade stays deferred (SPA prefetch already softens swaps).
- **Hard limits:** no scroll-jacking, no parallax, no entrance animations on load, nothing moving without a user action except the existing theme crossfade.

---

## 8. Page-by-page recommendations (no new copy anywhere)

### 8a. Homepage gateway — an owned gateway, not a hero

Keep the locked contract (exactly 3 pillar links, masthead `mark` + `subline`, no eyebrow/tagline, no `/podcast/` link, single-column stack). Make it *owned*:

```
   ◴  rider colophon (decorative span, CSS mask of logo.svg)
   skepvox                          ← Literata imprint (within the --sk-masthead clamp)
   Leituras e estudos pessoais, reunidos em três seções.   ← existing subline, unchanged

   │ ⌐  Literatura
   │      Clássicos que mantenho por perto…
   │      1881 · Memórias póstumas de Brás Cubas        ← tabular rail
   │
   │ ⌗  Filosofia
   │      Textos de filosofia, alguns ainda pouco…
   │      1947 · Introdução à ontologia
   │
   │ ´  Vox Français
   │      Podcast criado para meu próprio estudo…
   │      001 · Le badge
   └ one spine, three entries, space between — no full-width rules, no →
   (pillar marks ⌐ ⌗ ´ shown are the V2 target; V1 ships the rider colophon + spine only)
```

- **Tone the wordmark to ink** (drop the bright `--sk-accent` it uses today): in dark especially, the `#8fb3df` wordmark is currently the single loud element on the page, so this is the **committed** fix — the homepage test does not pin the colour. Setting `.home-masthead__mark` in **Literata** (within the tested 24–40px `--sk-masthead` clamp) is the **accepted aesthetic risk**: it reframes the wordmark as a title-page imprint rather than an app logo. It deliberately splits two lockups — the navbar "skepvox" stays the sans *running head*, the masthead becomes the serif *imprint* (a real book distinction). Validate it on the screenshots and **revert to the toned sans if it reads amateur**; the colour toning stands regardless.
- Add the **rider colophon** as a decorative `aria-hidden` span (CSS mask of `logo.svg`, like `NavBarTitleBrand`), *not* an anchor — `homepage.spec.ts` forbids `.home-masthead a` and any eyebrow, so this stays compliant.
- Replace the masthead `border-bottom` + the three `border-bottom`s with **one vertical spine** behind the pillar list and **space** between entries; the `→` is gone; hover reveals the spine tick (keyboard focus shows `SkLink`'s ring).
- Desktop: the spine sits in a slight **asymmetric left margin** (the pillar marks join it in V2) so the gateway reads as a *title page*, not a centered column in a void — this closes the desktop-void gap in V1, on the gateway. (The hub desktop margin column lands with the reader-map work.)

### 8b. Literatura / 8c. Filosofia — section / author / work

One grammar, two rooms. Section hubs keep their H1; author/work lists become catalogue entries on the spine (portrait as a bookplate, the one allowed shadow). The **work hubs** (`PipelineWorkContents`) are the biggest de-tabling win — see 8f. Filosofia must look like a different *room*, not a different website; differentiate only by the Filosofia mark and (V5) a tick-scale ink-blue. The Lavelle part dividers stop wrapping as shouty two-line uppercase blocks — they become quieter section markers on the spine.

### 8d. Vox Français — show / episode

Keep the `show-head` masthead (already restrained). Replace the `CardGrid` episode boxes with catalogue entries: cover as a small **bookplate** on the spine, title + duration as the quiet entry (the `.card-grid__item` count contract is preserved through the restyle). **Important:** the episode cover art is the one saturated, tactile, *alive* element anywhere on the site — the bookplate must **frame** it (a calm border/inset), never desaturate or shrink it to grey; on this pillar the colour is welcome, not a flaw to flatten. The rented "Navegar | Índice ›" local-nav band at the top of podcast pages is the most templated chrome here: either give it an owned, spine-consistent treatment or explicitly hide it on these surfaces — do not leave it as a named eyesore. On the episode page the `vox-ep__rule` accent tick is already a non-full-width mark — keep it. The big change is the **transport**: the native `<audio controls>` is the one truly rented element — give it an owned minimal transport (a `play` glyph + a slim scrubber) and **celebrate the gold cue** as this pillar's signature (the one place the site already feels alive). Keep cue keyboard nav / roving-tabindex untouched.

### 8e. Reader leaves

Do **not** touch the prose body (Literata, 35rem, 1.75). Add the **paper tone** + the **spine** so the leaf reads as a page. The location breadcrumb gets the spine + current tick; respect the test-locked specifics (chapter rung `h2` 13px small-caps; current segment `h3` uppercase **UI-sans** — its job is *location*, not *title*, so do not serif it). Life here comes from spine + paper + spacing, not from recolouring the locked breadcrumb. Bottom nav aligns to the spine; chevrons stay.

### 8f. The reader map (the centerpiece de-tabling)

```
  BEFORE (every row a full-width hairline)        AFTER (one spine, indentation, space)

  ──────────────────────────────────             Memórias póstumas de Brás Cubas
  CAPÍTULOS                                       MACHADO DE ASSIS
  ──────────────────────────────────
  O Defunto Autor              8  ›              │ ABERTURA
  ──────────────────────────────────             │   Dedicatória   Prólogo   Ao leitor
  Meninice e Mocidade         17  ›              │
  ──────────────────────────────────             │ CAPÍTULOS
  Ambições                    21  ›              │ O Defunto Autor            8  ›
  ──────────────────────────────────             │ Meninice e Mocidade      17  ›
  …a stack of identical ruled rows…              │ Ambições                 21  ›
                                                  └ one vertical rail; counts + disclosure kept;
                                                    open reveals indented segment leaves
```

- Remove the per-row `border-top` hairlines; introduce **one** `border-inline-start` spine on the map container.
- Encode Part › Chapter/Division › Segment by **indentation off the spine** + scale/weight, not rules.
- Keep the counts and the disclosure chevrons (Brás Cubas's named divisions and Lavelle's chapters are genuinely collapsible — the chevron is a correct state indicator).
- Keep the current tick — it already sits inboard, which *is* the spine language.
- **Pull the count + disclosure chevron inboard.** Removing the connective hairline would otherwise strand the count/chevron at the far page edge (worst on desktop, where the title-left / count-far-right gap already reads as a spreadsheet cell). Cap the interactive row to the reading measure and place the count adjacent to the title, so de-tabling tightens the row rather than orphaning the meta.
- Desktop: Part/section labels + marks move into a left **margin column** so the contents read like a manuscript's marginalia, not a stretched list.

---

## 9. Implementation roadmap (bigger, fewer slices — visible progress early)

**Principle:** each slice delivers visible, reviewable progress on real surfaces. **No invisible token-only phase, and no splitting one coherent change across three tiny steps.** The earlier "foundation-only, almost nothing visible" V1 is replaced.

### V1 — The spine, proven on the gateway *and* the worst table *(visible — this is the proof slice)*

Bounded: **one CSS primitive applied to two surfaces**, plus the rider seam. No data/route/dependency change; no pillar marks yet.

- **Tokens** (`vars.css`, additive, light+dark): `--sk-paper`, `--sk-paper-edge`, `--sk-spine` (defaults `var(--sk-rule)`), `--sk-spine-tick` (defaults `var(--sk-accent)`).
- **`BrandMark` seam:** `BrandMark.vue` + `brand-marks.ts` shipping **only the real `rider` mark**, same a11y contract as `ReaderIcon`. No placeholder pillar marks. The homepage colophon **reuses the `logo.svg` mask** (the rider is a detailed illustration, better reused than re-vendored as path data, and consistent with `NavBarTitleBrand`), so `BrandMark` is seeded with the rider mainly to lock the brief-required `ReaderIcon`/`BrandMark` separation seam; its first on-surface inline-SVG render is the pillar marks in V2. (The new layer exists for the guardrail and the V2 marks, not as silent scaffolding.)
- **Homepage gateway** (`Home.vue`): three pillars hung off **one vertical spine** with space between (not a stack of full-width rules); **remove the `→`** (`.pillar__go`); **tone the wordmark to ink** (it is the lone loud element in dark today) and set it in Literata as the imprint + add the **rider colophon** (decorative `aria-hidden` span); on desktop give the gateway a slight **asymmetric left margin** so it stops reading as a centered column in a void; hover reveals the spine tick (keyboard focus = `SkLink`'s ring). Stays inside `homepage.spec.ts`.
- **Brás Cubas work hub** (`PipelineWorkContents`): apply the **same spine** — replace per-row `border-top` hairlines with one `border-inline-start` rail + indentation; keep disclosure chevrons, counts, current tick, 44px floor, ARIA untouched; **pull the counts inboard** so removing the rule tightens the row instead of stranding the meta. Proves the grammar scales from 3 entries to a long division/chapter list.
- **Validation (required):** re-run the screenshot harness on homepage + Brás Cubas, mobile + desktop, light + dark, before/after.
- **One test update (not snapshot sprawl):** removing the homepage arrow-nudge changes `Home.vue`'s hover signature, so the single `{ file: 'components/Home.vue', hover: 'transform: translateX(3px)' }` row in `nav-interaction-states.spec.ts` is updated to the spine-tick reveal (still pointer-gated). That keeps a semantic test in sync with an intended behaviour change; `homepage.spec.ts` is untouched and stays green.
- **Honest expectation:** V1's levers — spine, paper, arrow removal, wordmark toning, serif imprint — are deliberately quiet; on their own they may not fully dispel the "feels dead" read, which is driven as much by uniform grey and the absence of imagery. The demonstrated colour/life levers are the retained podcast cover art (§8d) and the V5 tick-scale pillar tonality, kept restrained on purpose. V1 buys *ownership and calm*, not vibrancy; vibrancy is metered in later.
- **Why two surfaces:** proving the spine on the 3-row homepage alone would be the timid "changes almost nothing" slice this revision rejects; the gateway + the longest, most representative table together are the real proof and share one CSS primitive. (Brás Cubas is the *longest* ruled list; the *single ugliest* element in §2 is actually Lavelle's two-line uppercase part labels — a cheap, high-value quieting slated for V2.)

### V2 — Catalogue not cards; the rest of the hubs; the pillar marks *(visible)*

- **`CardGrid` → spine catalogue entries:** drop the box (resting border transparent/none, raised fill removed) — fixes the **podcast episode boxes AND** the author/section hub lists in one change. **Keep** the tested hover line (`border-color: var(--sk-accent)` inside the pointer media query) so `nav-interaction-states.spec.ts` stays green; portrait/cover becomes a bookplate.
- Apply the spine to the **Lavelle work hub + Literatura/Filosofia section & author hubs** (same V1 primitive); quiet the wrapping uppercase part labels.
- **Pillar marks:** design and ship the three spine-glyph marks to **final quality**, visually assessed both modes — no placeholders.
- **Validation:** screenshot section/author hubs + the podcast show page, both modes.

### V3 — Reading surfaces + the heading-bar cleanup *(visible)*

- Reader leaf: **paper tone** on the reading column + the spine as its inboard edge; align the breadcrumb and bottom nav to the spine (respect the locked breadcrumb h2/h3 specs).
- **`.vt-doc h2::before` — handled honestly here, not in V1.** Removing the 2px accent bar over every doc `h2` is a **visible cleanup on `.vt-doc` prose/markdown surfaces** — and it does *not* appear on the V1 homepage/hub surfaces, because those elements are simply **not `.vt-doc` `h2` descendants**: the homepage renders in a `page: true` layout with no `.vt-doc` ancestor, and the Brás Cubas hub renders `.pwc` in the `content-top` slot outside its (empty, `h2`-less) `.vt-doc` body — so the selector never matches there (no override or reset involved). Bundling the removal into V1 would therefore have been dishonest "nothing changes" framing; it belongs on the slice that actually touches `.vt-doc` headings (e.g. the podcast show page's `## Leçons`). **Screenshot-validate** any markdown page carrying an `h2`.
- **Validation:** a representative Brás Cubas + Lavelle leaf, both modes; plus any `.vt-doc` h2 page.

### V4 — Podcast playback *(visible)*

- Episode pages: an owned/quieted transport replacing native `<audio controls>`, with the `play` glyph (the one legitimate new arrow-adjacent symbol); celebrate the gold cue. Preserve cue roving-tabindex / keyboard / reduced-motion.
- **Validation:** an episode page, both modes, + a keyboard pass on the cues.

### V5 — Pillar tonality + symbol polish + material light/dark pass *(visible, quiet)*

- Tick-scale pillar tints (`--sk-pillar-*`) on marks + current/hover ticks only (never fills); finalize the mark family; make dark read as lamplight (warm paper lift) vs light-as-paper.
- **Validation:** all three pillars side by side, both modes.

### V6 — Visual QA sweep + minimal guardrails

- Reuse this screenshot harness for the full light/dark × mobile/desktop sweep (the dark small-muted-text danger zone the prior docs flag, verified on the WebKit mobile panel).
- Lock the few semantic guardrails (§11); no snapshot sprawl.

*Six substantive slices, each visibly meaningful. No tiny invisible phases. If V1's hub restyle proves higher-risk than the CSS-scoped change expected, it may split (homepage first, hub immediately after) — but the default is to ship both together, because that is the meaningful early progress the brief demands.*

---

## 10. Supersession note (relationship to the older homepage H-roadmap)

The prior homepage data/IA pass deliberately codified the homepage as a **hairline table-of-contents of three pillar rows each with a decorative `→`**, chose to **extend the hairline-TOC grammar rather than the spine**, kept the `→` as `aria-hidden`, and explicitly argued **against** serifing the masthead ("keeps the gateway from impersonating a book page").

**This assessment supersedes those specific *visual* decisions where they conflict:**

- the decorative homepage `→` is **removed** (not kept);
- the hairline table-of-contents is **no longer the homepage's main grammar** — the vertical spine + spatial grouping replaces it;
- the masthead **does** become a serif imprint (with the rider colophon). The H-roadmap's stated risk — "impersonating a book page" — is mitigated because this is a *title page of a library* (imprint + pressmark + catalogue entries), visually distinct from a work hub, not a reading page.

**Everything non-visual from H1–H6 remains valid and is built upon:** the `pillars.ts` single-source IA, the Vox Français narrowing (with Español/English public-but-unpromoted), live-content-as-text (titles + `meta`, no extra links), the hub-only link model, the masthead/subline structure and the `homepage.spec.ts` link-count contract, the `pipeline-export` allow-list, and the H6 test simplification. This roadmap changes the *look*, not the IA, data boundary, or test posture that H1–H6 established.

---

## 11. Test philosophy

The existing suite is the right model — **semantic, token-, ARIA-, and source-based; zero pixel snapshots** — and is robust to exactly this kind of presentation change. Keep it that way. Do **not** add visual-regression screenshots (the screenshot harness in §2 is a *review/QA* tool, not a committed test).

Add only these lean, intention-encoding guardrails:

1. **No homepage arrow.** The homepage renders no `→`/arrow glyph and no `.pillar__go` element. Locks "the arrows phase is over" for the gateway.
2. **Second-layer separation.** `ReaderIcon`'s union stays exactly the four chevron/disclosure names; `BrandMark` is a separate component; `rider`/pillar/`play` names live only in `brand-marks.ts`, never `reader-icons.ts`.
3. **Three pillar links, intact.** Already covered by `homepage.spec.ts` — keep it green; do not duplicate.
4. **Reduced-motion + focus intact.** Reuse the existing `a11y-floor` harness: the new spine-tick hover sits inside `@media (hover: hover) and (pointer: fine)` with a reduced-motion guard, and `SkLink` still owns the focus ring (no per-component `:focus-visible` regressions).

~4 assertions, all semantic, no pixels, no new matrix. **One existing assertion is *modified*, not added:** `nav-interaction-states.spec.ts`'s `Home.vue` hover row (`transform: translateX(3px)`) becomes the spine-tick reveal, because the homepage hover behaviour intentionally changes — keeping a semantic test honest, not snapshot sprawl. Everything else is already covered by the suite, which catches a class/token/ARIA regression loudly without locking a single pixel.

---

## 12. Do-not-do list

- **Do not** keep the full-width horizontal hairline as the universal divider; replace it with the spine + spatial grouping (reserve a horizontal rule only for a true masthead→contents binding).
- **Do not** add descriptive copy, subtitles, blurbs, labels, slogans, helper text, or marketing prose. Pages get more alive through structure, marks, spacing, colour, behaviour.
- **Do not** turn the homepage into a hero or a card grid; keep the calm 3-pillar index and its locked contract.
- **Do not** keep boxed `CardGrid` feature-cards (the podcast surface or the hubs); convert to catalogue entries on the spine.
- **Do not** keep `→`/chevrons as the answer to "this is clickable." Keep chevrons only for prev/next, up, and disclosure; remove the homepage `→`; default new affordances to *no icon*.
- **Do not** expand `ReaderIcon` for brand marks; use the separate `BrandMark` layer.
- **Do not** ship weak/placeholder pillar marks. V1 ships only the real `rider`; the three pillar marks land **final-quality and visually assessed in V2**, or not at all.
- **Do not** make the palette loud: no per-pillar coloured cards/backgrounds, no decorative gradient blobs/orbs/glows; pillar colour lives only at tick/mark scale.
- **Do not** desaturate or shrink the podcast cover art to match the austere system — it is the site's one welcome spot of colour and tactility; frame it, don't flatten it.
- **Do not** leave the rented "Navegar | Índice" band un-actioned on podcast surfaces — own it or hide it.
- **Do not** change the test-locked tokens, classes, or contracts: `--sk-accent #2f4a6b`, the cue gold, the masthead clamp, the breadcrumb `h2`=13px / `h3`=uppercase-**sans**, the closed `ReaderIcon` union, the SkLink focus/hover split, ≥44px targets.
- **Do not** serif the current-segment location line (`h3`) — the test pins it to UI-sans; it is *location*, not a title.
- **Do not** touch the reading prose body, the IA (`pillars.ts`), routes, the pipeline, or podcast content.
- **Do not** add a runtime icon dependency for three marks; owned SVG wins.
- **Do not** scatter shadows; one soft elevation, for portraits only.
- **Do not** add motion that runs without a user action (beyond the existing theme crossfade); no scroll-jacking; honour reduced motion globally.
- **Do not** ship an invisible token-only slice or split one coherent change into tiny phases; each slice must change a real surface.
- **Do not** add visual-snapshot tests.

---

## 13. First implementation prompt (V1 — the visible spine proof)

> **Work in `/Users/skepvox/projects/skepvox-website` on `develop`. Implement V1: establish the "reading spine" grammar and prove it on the homepage gateway *and* the Brás Cubas work hub. This is a visible foundation slice, not an invisible token slice. Do not push. Keep the full Playwright suite green. No added copy, no route/data/podcast/pipeline/dependency changes, no visual-snapshot tests.**
>
> **1. Additive tokens (`/.vitepress/theme/styles/vars.css`).** In `:root` and `.dark`, without changing any existing value, add: `--sk-paper` (a *perceptibly* warm reading-surface tone one quiet step off `--sk-surface` — visible in light; a faint warm lift in dark), `--sk-paper-edge` (a 1px top-edge from `--sk-border`), `--sk-spine: var(--sk-rule);`, `--sk-spine-tick: var(--sk-accent);`. Comment them as the spine/paper foundation.
>
> **2. `BrandMark` seam (`/.vitepress/theme/components/`).** Create `brand-marks.ts` (owned registry, same shape as `reader-icons.ts`) and `BrandMark.vue` (sibling to `ReaderIcon.vue`: `aria-hidden` by default, `role="img"` + `<title>` only when `label` is passed, colour via `currentColor`, no own focus ring, no animation). Ship **only** the real `rider` mark. The homepage colophon (step 3) **reuses the existing `/logo.svg` mask** (the rider is a detailed illustration, better reused than re-vendored as path data, consistent with `NavBarTitleBrand`), so `BrandMark` is seeded with the rider to establish the owned-symbol separation seam — its first on-surface inline-SVG render is the pillar marks in V2, not this slice. **Do not** add any name to `reader-icons.ts`; keep the `ReaderIcon` union at four. **Do not** add placeholder pillar marks. Register `BrandMark` globally in `index.ts` exactly as `ReaderIcon` is.
>
> **3. Homepage gateway (`Home.vue`).** Apply the spine grammar: render the three pillars hung off **one vertical spine** (`border-inline-start: 1px solid var(--sk-spine)` on the list, indentation, space between entries) instead of the per-row `border-bottom` rules; **remove the `→`** (`.pillar__go` and its markup); **tone `.home-masthead__mark` to ink** (drop the bright `--sk-accent` — it is the lone loud element in dark) and set it in Literata (`--sk-reading-title-font`) within the existing `--sk-masthead` clamp as the imprint; add the **rider colophon** as a decorative `aria-hidden` span (CSS mask of `/logo.svg`, like `NavBarTitleBrand`) — **not** an anchor; replace the masthead `border-bottom` with the spine relationship; on desktop give the gateway a slight **asymmetric left margin** (spine in the margin) so it is not a centered column in a void. **Hover** reveals the spine tick (pointer-gated `@media (hover: hover) and (pointer: fine)`, reduced-motion-gated) instead of the arrow nudge; **do not add a `:focus-visible` rule to `Home.vue`** — keyboard focus uses `SkLink`'s ring (per `nav-interaction-states.spec.ts`). Keep exactly three `SkLink` pillars, the `mark` + `subline`, no eyebrow, no masthead anchor — `homepage.spec.ts` must stay green.
>
> **4. Brás Cubas work hub (`PipelineWorkContents.vue`, `<style scoped>` only).** Replace the per-row `border-top` hairlines (`.pwc__chapter-heading`, `.pwc__chapter-row`) with **one** `border-inline-start` spine on the map container + indentation off it; keep the disclosure chevrons, the counts, the current tick (`inset 2px 0 0 var(--sk-spine-tick)`), the ≥44px row floor, and all ARIA/structure unchanged. **Pull the count + chevron inboard** (cap the row to the reading measure / set the count adjacent to the title) so removing the connective hairline tightens the row instead of stranding the meta at the far edge — the desktop stranding is the worst case. Front-matter ("Abertura") and Part/division labels read as spatial groups on the spine, not ruled rows.
>
> **5. Guardrails + one test update (existing semantic style — no pixel snapshots).** New assertions: (a) the homepage renders no `→`/arrow glyph and no `.pillar__go`; (b) `ReaderIcon`'s union is still the four names and `rider` lives only in `brand-marks.ts`; (c) `--sk-spine`/`--sk-spine-tick`/`--sk-paper`/`--sk-paper-edge` are defined in built CSS and `--sk-accent` is still `#2f4a6b`; (d) the homepage still has exactly three pillar links (kept green via the existing `homepage.spec.ts`) and the spine-tick hover is pointer- + reduced-motion-gated with `SkLink` still owning the focus ring. **Modify** (do not add) the one `Home.vue` hover row in `nav-interaction-states.spec.ts` from `transform: translateX(3px)` to the spine-tick reveal.
>
> **6. Validate visually before declaring done.** Re-run the screenshot harness (WebKit 390×844 mobile, Chromium 1280×900 desktop, light + dark) on `/` and `/pt/literatura/machado-de-assis/bras-cubas/`; confirm the homepage no longer reads as a stack of horizontal rules, the arrow is gone, the **toned (ink) wordmark** no longer dominates the dark frame, the rider colophon + serif imprint land (**revert the serif to the toned sans if it reads amateur**), the **desktop gateway is no longer a centered column in a void**, and the Brás Cubas hub now reads as one spine with indented divisions and **counts pulled inboard** rather than a ruled table — in all four light/dark × mobile/desktop frames.
>
> **Acceptance:** the homepage and the Brás Cubas hub visibly adopt the spine grammar (no homepage arrow, toned wordmark, serif imprint + rider colophon, no full-width-rule stacks, counts inboard); tokens + `BrandMark`/`rider` seam exist; the suite is green with the single `nav-interaction-states.spec.ts` hover row updated. This is the meaningful early proof the new visual language is built on.

---

## 14. Review notes & residual risks

This revision was **visually inspected** (§2, real screenshots) and **adversarially reviewed** — a multi-lens critic pass over the doc, the repo, the locked tests, and the H-roadmap, with each finding independently verified. Confirmed corrections (a false `h2::before` mechanism, a wrong Vox live-line, a phantom edition-line, a mis-cited H-roadmap section, the `translateX` test contract, the unrendered `BrandMark` seam) are folded in above. The deliberately **accepted** risks, recorded so they are chosen rather than missed:

- **The serif imprint is a genuine aesthetic gamble.** It splits the wordmark into two lockups (sans running-head in the navbar, serif imprint on the title page). The committed, low-risk part is **toning the wordmark to ink**; the serif is to be validated on the screenshots and reverted to the toned sans if it reads amateur.
- **V1's levers are quiet.** Spine + paper + arrow removal + toning may not, alone, fully dispel "feels dead" — colour/imagery is the demonstrated lever and is metered in deliberately (cover art kept; pillar tonality in V5). V1 delivers *ownership and calm*, not vibrancy.
- **De-tabling must not strand or grey what works.** Removing the hub hairlines requires pulling counts inboard (or it worsens desktop stranding); de-boxing the podcast must **frame, not flatten**, the cover art.
- **Two named rented elements remain scoped, not yet owned:** the podcast "Navegar | Índice" band (§8d) and the production cookie-consent banner — both deserve owned treatment in a later footer/chrome slice.

No blocker survived review; the single test-contract change (the `Home.vue` hover assertion) is documented in §9 V1 / §11 / §13.
