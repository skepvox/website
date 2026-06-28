# Site Visual Language — Next-Level Assessment

**Status:** live roadmap. V1 and V2 have been implemented; this document now records the current stop point and the next visual slices.
**Scope:** the whole site as one visual system — homepage gateway, Literatura, Filosofia, Vox Français — not the homepage alone.
**Method:** code inspection of the owned theme (`vars.css`, `pages.css`, `Home.vue`, `PipelineWorkContents.vue`, `PipelineReaderHeader.vue`, `PipelineSegmentNav.vue`, `CardGrid.vue`, `ReaderIcon.vue` + `reader-icons.ts`, `pillars.ts`, the podcast components, the hub markdown), the Playwright guardrails, **and live visual inspection** — the dev server was built and the four target surfaces were screenshotted in WebKit (mobile Safari engine, 390×844) and Chromium (desktop, 1280×900), light and dark. Those concrete observations are §2. No new copy is proposed anywhere.

This phase is about **visual language, component behaviour, CSS, rhythm, colour, symbols, interaction, and owned identity** — never about adding words to make a page feel less empty.

## Current stop point

As of the V2 implementation, the site has:

- a spine grammar on the homepage and reader maps;
- no homepage arrow glyph;
- a toned serif homepage imprint;
- an owned `BrandMark` layer with final pillar marks for Literatura, Filosofia, and Vox Français;
- de-boxed catalogue rows for author/work/podcast lists;
- quieter Lavelle part labels;
- homepage/nav pillars still centralized in `pillars.ts`;
- no route, data, podcast-content, or book-pipeline change from the visual work.

The next session should start at **V3 — reading surfaces + heading-bar cleanup**. Do not restart from the old homepage H-roadmap, and do not reintroduce the removed body rider colophon.

---

## 0. The thesis (read this first)

The site already made the _right austere choices_: warm paper surfaces, an ink-blue reading accent, Literata for prose **and for hub/work titles** (the serif titles already look genuinely bookish), owned tokens, no gamification, no marketing hero. The problem is not that it is too plain. **The problem is that austerity was applied as uniformity instead of as composition.**

A bookish-austere design that is _alive_ — a Penguin Classics title page, an NYRB spine, a Tufte page, a letterpress colophon — is calm **and** alive because it uses _position, scale contrast, and one recurring mark_ to make rhythm. skepvox has the restraint but not the composition: it expresses structure with essentially **one device, repeated everywhere — the full-width horizontal hairline** (and, on the podcast page, the one other default: the bordered card). Either way, every page reads as a ruled table or a box grid — the two looks the brief explicitly rejects.

So the answer is not more colour, more cards, more motion, or more arrows. The answer is to **change the structural grammar** from the repeating horizontal rule to a **vertical spine** — the book-spine as the organizing metaphor of a personal library — plus deliberate spatial grouping, a single owned non-arrow mark, and a perceptible warmth. Keep the austerity; add the composition.

> **Signature element — the reading spine.**
> The reader is always positioned _along a spine_: a single vertical hairline (a bound volume's edge) that carries the pillar marks, the current-location tick, and the catalogue rail, and on desktop becomes the marginal structure column. It replaces the stack of horizontal rules on every surface — homepage, hub, reader map, leaf, podcast — so the whole site reads in one owned dialect instead of as ruled tables and box grids.

### Compact design plan (the token sketch this assessment builds toward)

- **Colour (keep, don't widen):** ink `#213547` / warm-ivory dark; accent ink-blue `--sk-accent #2f4a6b` → `#8fb3df` dark (unchanged, test-locked); paper a _perceptible_ warm reading tone (new, quiet); cue gold `181 148 84` (unchanged); pillar tint used **only at tick scale**, never as fill — sepia (Literatura) / ink-blue (Filosofia) / slate-French-blue (Vox Français).
- **Type (make it do more than one job):** Literata as the _imprint + bookish_ voice (homepage wordmark, hub/work titles, prose, chapter titles); UI-sans as the _running-head/utility_ voice (nav, counts, prev/next labels). Retire the habit of setting **every** structural label in uppercase muted small-caps — reserve small-caps for the single "section divider" role; let hierarchy come from scale + weight + the spine.
- **Structure (the de-tabling):** vertical spine + spatial grouping replaces full-width horizontal rules; indentation off the spine encodes Part › Chapter › Segment; the current tick is the one "you are here" mark everywhere.
- **Signature:** the reading spine + a small owned mark language. The rider remains the navbar/favicon identity mark; the homepage body uses the serif `skepvox` imprint and the three pillar marks rather than repeating the rider.
- **The one aesthetic risk:** turning the site's universal divider 90° — from horizontal rule (the broadsheet/docs default) to a vertical spine (owned, bookish) — and committing to it on every surface.

---

## 1. Current visual diagnosis (blunt)

### 1a. IA and data are correct. The visual system is the failure.

The information architecture and data wiring are genuinely good and must be preserved: three pillars in `pillars.ts` shared by nav + homepage so they can't drift; the reader map, breadcrumb, and bottom nav all join the _same_ `pipeline-export-segments.json` by identity (`canonicalId`, never routePath); leaves load only their own prose; everything server-renders; the a11y floor (44px targets, focus ring, reduced-motion, decorative-vs-labelled icons) is real and enforced. **None of that is the problem and none of it should be touched for visual reasons.** The deadness is entirely in the _presentation layer_.

### 1b. Why it feels like a table

One device carries all structure: the **full-width horizontal hairline.** In the current code:

- **Homepage** (`Home.vue`): masthead `border-bottom`, then each pillar row `border-bottom: 1px solid var(--vt-c-divider)`. The page is literally `rule / row / rule / row / rule / row / rule`.
- **Reader map** (`PipelineWorkContents.vue`): every `.pwc__chapter-heading` and `.pwc__chapter-row` draws `border-top: 1px solid var(--sk-reading-rule)`. Brás Cubas's editorial divisions and Lavelle's chapters become a long stack of identical full-width hairline rows — the most table-like screens on the site.
- **Hub/work mastheads** and **leaf header / bottom nav**: hairline-bound, `border-top`/`border-bottom` throughout.
- **Every doc heading** (`pages.css` `.vt-doc h2::before`): a 2px soft-accent bar above each `h2` — one more repeating ruled "event" (note: it surfaces only on `.vt-doc` markdown `h2`s — the `.pillar`/`.pwc` surfaces are simply not `.vt-doc` `h2` descendants, so the selector never matches there; see §9 for honest scoping).

When one rule does grouping, separating, _and_ binding on every page, every page looks the same and looks like a spreadsheet.

### 1c. Why it feels rented

- **The podcast page is the VitePress feature-box.** `CardGrid.vue` is a 2-column grid of bordered, raised, rounded rectangles (`border`, `background: var(--sk-surface-raised)`, `border-radius: 12px`, 72px thumbnail, 3-line clamp). It is the generic doc/marketing card, and it is the _universal_ list primitive (author hubs, work lists, **and** podcast episode lists). The podcast show page is where it is most visible and most templated.
- **The chrome is honest-but-grey monotone.** The reading shell is carefully built but _all muted ink on near-white with hairlines and one accent bar_. Several meaning-bearing greys (the "year · title" meta, front-matter links) sit close to the AA floor, and the per-row counts use the faint `aria-hidden` ink — legitimate for assistive tech, but the palette reads tired.

### 1d. Why it feels static / dead

- **The accent is owned but inert.** `#2f4a6b` appears only on the wordmark (static), hover colour, focus ring, the current tick, and a prose-link underline. Literatura, Filosofia, and a French-learning podcast are visually **indistinguishable**.
- **Symbols = arrows, full stop.** `ReaderIcon` is four chevrons; the homepage uses a literal `→` (`.pillar__go`). The brand rider exists but is confined to a 36px navbar mask.
- **Type speaks in one structural note.** Uppercase muted small-caps for _everything_ structural — and on the Lavelle hub the long part labels wrap to two shouty lines.
- **Desktop is stretched mobile.** `.home-index` / `.pwc-shell` are ~42rem columns centered in a void; the count+chevron strand at the far-right edge, far from the title.
- **The warmth is sub-perceptual in light.** `#fcfcfa` vs `#ffffff` is invisible; the cool ink `#213547` fights the "warm" story. (In dark, the warm-ivory serif does carry some warmth — see §2.)

**Net:** one structural idea (horizontal rule), one box default (the card), one inert colour gesture, one symbol (arrow), one structural type voice — repeated across every page. The monotony _is_ the deadness. It is a composition problem, not a content problem.

---

## 2. Visual QA — current state, inspected

Built and served locally; the four surfaces captured in WebKit @ 390×844 (mobile Safari) and Chromium @ 1280×900 (desktop), light and dark, appearance toggled via `vitepress-theme-appearance`. _(The dev cookie-consent banner overlays the lower third of each capture — ignore it; it is the consent dialog, not a layout issue.)_

**Homepage — mobile, light.** Sans-600 ink-blue wordmark "skepvox"; subline; a full-width hairline; three pillar rows, each `Title + → (top-right) / blurb / "year · title"`, every row closed by a full-width hairline; a footer hairline. Reads as `rule / row / rule / row / rule / row / rule` — a literal stack of horizontal rules. The `→` floats top-right of each title as decoration.

**Homepage — mobile, dark.** Identical geometry; the wordmark becomes the lifted blue `#8fb3df` and is the **single saturated element on the screen**; the surface reads near-neutral black (the "warm deep" is not perceptible); everything else is muted grey. Calm but inert.

**Homepage — desktop, light.** The ~42rem column is centered with vast empty margins left and right — a narrow column of full-width rules floating in a void (the "stretched mobile" problem, confirmed). The `→` is stranded at the far-right edge of each row, far from its title; the title-left / arrow-far-right gap reads explicitly as a table row and looks disconnected.

**Brás Cubas hub — mobile, light.** Serif (Literata) work title — **genuinely handsome and bookish**; "MACHADO DE ASSIS" small-caps edition line; masthead hairline. "ABERTURA" small-caps + three serif front-matter links, space-separated with _no_ rules (this part already breathes — proof the spacing approach works). Then "CAPÍTULOS" and the editorial divisions ("O Defunto Autor", "Meninice e Mocidade", "Ambições", …), each a **collapsible** row: serif title left, count + disclosure chevron `>` right, a full-width `border-top` hairline between every one. A long stack of identical hairline rows — the most table-like screen on the site.

**Brás Cubas hub — mobile, dark.** The warm-ivory serif on near-black is the **one place dark mode reads "lamplight"** — the title looks good. But the hairline-row stack is unchanged. So dark carries warmth via _ink_, not surface; the paper-tone work matters most in _light_.

**Brás Cubas hub — desktop, light.** Same rows at full column width; count+chevron stranded far right with a long empty gap to the title — a spreadsheet row at desktop scale.

**Lavelle hub — mobile, light.** Serif title; "LOUIS LAVELLE"; **part dividers in uppercase small-caps that wrap to two shouty lines** ("PRIMEIRA PARTE — AS CATEGORIAS PRIMEIRAS DA ONTOLOGIA"); then collapsible chapter rows (count + chevron + hairline). Same table; the wrapping uppercase labels reinforce "retire the small-caps monotony."

**Vox Français show — mobile, light/dark.** A rented "Navegar | Índice ›" local-nav band at the very top (an extra horizontal rule + chrome). "PODCAST · 3 LEÇONS" eyebrow; sans "Vox Français" title; a real multi-sentence French standfirst; "ÉCOUTER Apple Podcasts · Spotify"; a short accent tick; "Leçons"; then the **episode boxes** — `CardGrid` bordered/rounded/raised cards with the colourful "Vox Français" cover art, number+title, 2-line description, "22 min". These boxes are the single most templated surface on the site and the only place cards appear; in dark they feel slightly floaty on the field.

**Cross-surface takeaway.** The site runs **both** anti-patterns the brief named — ruled tables (home, hubs) and cards (podcast) — in different places. The serif title voice is already strong and should be amplified, not changed. The deadness is the structural grey, the universal hairline, the boxes, and the arrows.

---

## 3. Visual principles for the next system (7)

1. **Humble but alive.** Life from rhythm, scale contrast, a recurring mark, and perceptible warmth — never loudness or hero copy. If a change shouts, it's wrong.
2. **Bookish but modern.** Metaphors: bound-volume, title page, colophon, marginalia, catalogue — not skeuomorphic leather, not a docs sidebar.
3. **Personal but not amateur.** Asymmetry, generous margins, one confident owned mark read as a designed personal library; centered grey rows between hairlines read as a default.
4. **Component-owned, not theme-rented.** Every recurring surface in skepvox tokens and skepvox marks; the structural device is _owned_ (the spine), not inherited (`--vt-c-divider` rows). Rented `@vue/theme` chrome stays infrastructure, never a design source.
5. **Structure is spatial, not ruled.** Group by proximity and indentation off the spine; divide by space and the one vertical line; reserve a horizontal rule for a genuine _binding_ (a masthead to its contents), never as the default separator.
6. **One temperature, three rooms.** The three pillars share one system; each has a quiet identity (a mark and, at most, a tick-scale tint). Same building, three rooms; never three colour themes.
7. **Light is paper, dark is lamplight.** The two modes differ _materially_ (daylit page vs warm reading lamp), not by inversion — same geometry, type, marks; warmer/dimmer ink and a faint glow in dark.

_(Plus the standing floor, unchanged: AA contrast on meaning-bearing text, ≥44px targets, visible focus, reduced-motion honoured, no scroll-jacking.)_

---

## 4. Component inventory — what each family should become

| Family                                                              | Today                                                                      | Should become                                                                                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Homepage gateway** (`Home.vue`)                                   | Sans wordmark + subline over 3 hairline rows, each with a `→`              | A **title page**: Literata imprint, three pillar marks, and catalogue entries hung off one spine; `→` removed; affordance = mark + whole-row link + hover spine-tick                    |
| **Pillar rows / entries**                                           | Identical grey rows, full-width `border-bottom`, trailing `→`              | Catalogue entries on the spine, each carrying its **pillar mark**; separated by space, not rules; tabular "year · title" line on the rail                                               |
| **Author "cards"** (`CardGrid`)                                     | Bordered raised box, 72px square thumbnail                                 | Catalogue rows: portrait as a small **bookplate**, name + dates as a quiet entry on the spine; box dropped (border → transparent at rest, accent on hover — keeps the test)             |
| **Book "cards"** (`CardGrid`)                                       | Bordered box, title + year meta                                            | Catalogue rows with a **trecho-count tick** on the rail; no box                                                                                                                         |
| **Reader map** (`PipelineWorkContents`)                             | Stack of `border-top` rows + disclosures                                   | The spine: **one** vertical rail; Part › Chapter › Segment by indentation; counts kept; disclosure chevrons kept; hairlines removed; current tick promoted to the system "you are here" |
| **Reader leaf header** (`PipelineReaderHeader`)                     | Grey uppercase breadcrumb, hairline-bound                                  | Location _on the spine_; warm paper reading column; keep the test-locked h2=13px / h3=uppercase-sans contract                                                                           |
| **Bottom nav** (`PipelineSegmentNav`)                               | `border-top` row, prev/next chevrons, up-link                              | Aligned to the spine, quieter; prev/next + up chevrons **kept** (directional)                                                                                                           |
| **Podcast show/episode** (`PodcastShowHeader/EpisodeHeader/Player`) | Show masthead OK; episodes via `CardGrid` boxes; native `<audio controls>` | Catalogue entries (cover as bookplate); **owned/quieted transport** with a `play` glyph; the **gold cue** celebrated as the one alive accent                                            |
| **Footer / social**                                                 | Deferred (rented footer routed to page base)                               | Later: owned `SocialIcon` set once brand assets land; spine-consistent, not a filled footer block                                                                                       |

---

## 5. Symbol / icon direction

### 5a. Two layers, deliberately separate

The brief asks whether `ReaderIcon` should expand or whether a second layer is needed. **A second layer.**

- **Layer 1 — `ReaderIcon` (navigation & state): keep closed, keep minimal.** Its job is _pointing and disclosure_: `chevron-left/right/up`, `disclosure` — vendored lucide geometry, 24-grid, 1.5px non-scaling stroke, decorative-by-default. Leave the union at four. **Do not pour brand marks into it** — that would wrongly trip the documented "~8 unique glyphs → promote to `@lucide/vue`" gate with symbols lucide does not contain (there is no skepvox rider in lucide), and conflate "an arrow that points" with "a mark that identifies."
- **Layer 2 — `BrandMark` (identity): new, owned, hand-drawn.** A sibling component (`BrandMark.vue` + `brand-marks.ts`) reading an owned registry of _original_ SVG marks on the same 24-grid so the families feel related but distinct in role (these may be filled, not only stroked) and governance (drawn in-repo, ISC-free because original; never lucide). Same a11y contract as `ReaderIcon`: `aria-hidden` by default, `role="img"` + `<title>` only when labelled, colour via `currentColor`, no own focus ring. **No runtime dependency** — both layers are vendored SVG; pulling an icon set for three marks is strictly worse than owning them.

### 5b. The owned marks

- **`rider`** — the site identity mark. It remains in the navbar/favicon/search-preview family and should not be repeated in the homepage body. The homepage body already has the serif `skepvox` imprint; repeating the rider there was visually redundant.
- **Three pillar marks** — shipped in V2 as the first on-surface `BrandMark` family: a serif-foot vertical mark for Literatura, a turnstile/logic mark for Filosofia, and an acute-accent mark for Vox Français. These are not placeholders and should be treated as the current owned vocabulary.
- **`play`** — the one audio transport glyph (a filled triangle). The _only_ arrow-adjacent shape that should be **added**, because it is a transport control, not navigation. Ships in V4.

### 5c. Where arrows stay, go, or are absent

- **Keep:** `chevron-left` / `chevron-right` (prev/next), `chevron-up` (up-link), `disclosure` (collapsible chapters/divisions — including Brás Cubas's editorial divisions). Correct and tested.
- **Replace / remove:** the homepage `→` (`.pillar__go`) — the row _is_ the link; the pillar mark + a hover spine-tick is the affordance.
- **No icon at all (better than an icon):** breadcrumb separators (the reader-header test already _forbids_ `> / › » → |` here), chapter/division direct links beyond the disclosure, catalogue rows, section dividers, the "go to section" gesture generally.

### 5d. Anti-clutter rule

At most **one** mark per entry. The spine + the mark is the affordance; never stack mark + arrow + border on the same row.

---

## 6. Colour and surface direction

Keep the palette **quiet**. The accent token (`--sk-accent #2f4a6b` → `#8fb3df`) is locked by `color-tokens.spec.ts` and stays. Life comes from _where_ colour and surface are used.

- **Make the paper perceptible — especially in light.** `--sk-surface #fcfcfa` is invisibly different from white. Introduce a reading-column **paper tone** — a faint, _actually visible_ warm tint distinct from the page base — so a leaf reads as paper on a desk. Flat tint only; **no gradient blobs, orbs, or decorative glows.**
- **Let the paper carry the warmth.** Rather than recolour the load-bearing cool ink, warm the paper (plus the already-warm `--sk-border rgba(45,40,30,.11)`), so warmth becomes visible without disturbing the tested ink/accent.
- **Dark = lamplight, not a darker table.** Dark already gets some warmth from the ivory serif; add a faint warm paper _lift_ (not a panel) so the reading column glows slightly under the "lamp."
- **Depth — exactly one level, for the page.** The reading column on the paper tone with the spine as its inboard edge (at most a single 1px top edge). Reserve soft shadow for the _one_ honest place — an author **portrait** (already shadowed). No scattered card shadows.
- **Pillar tint — tick scale only (V5).** Each pillar an ink temperature used **only** on its mark and current/hover tick — sepia / ink-blue / slate-French-blue. Additive tokens (`--sk-pillar-*`); **never** a coloured card, background, or full row.
- **Avoid the homepage-as-card-grid trap.** The gateway stays a calm index; catalogue-on-spine is a _list_, not a grid of boxes.

---

## 7. Motion and behaviour

All additive, subtle, inside the global reduced-motion floor (`utilities.css` neutralises transitions/animations/smooth-scroll under `prefers-reduced-motion: reduce`).

- **Hover / focus / tap.** Replace the homepage arrow-nudge (`translateX(3px)` on `.pillar__go`) with the spine language, but **do not rely on hover for clickability**. On mobile there is no hover; each pillar must read as a tappable catalogue entry at rest through its mark/tick, indentation, target shape, and text grouping. Pointer-hover may add a spine-tick reveal; keyboard focus surfaces `SkLink`'s ring (Home.vue must not declare its own `:focus-visible`, per `nav-interaction-states.spec.ts`); tap stays neutral (SkLink owns the no-sticky-hover contract). The arrow retires because the entry itself becomes the affordance. (Replacing the `translateX(3px)` hover signature means the one `Home.vue` hover assertion in `nav-interaction-states.spec.ts` is updated to the spine-tick — see §9 V1 / §11.)
- **Disclosure.** Keep the `disclosure` chevron's 90° rotation on open (token-timed, reduced-motion gated). The one correct micro-animation.
- **Active / current.** Promote `box-shadow: inset 2px 0 0 var(--sk-reading-current)` to the **system-wide** "you are here" mark (homepage hover, map current row, leaf location). One language for presence.
- **Podcast playback.** Keep the gold cue wash transition (the one alive surface). V4's owned transport may add a quiet play↔pause state change on the `play` glyph; reduced-motion gated.
- **Ambient tonal life (V5/V6 candidate).** Explore CSS-only, almost imperceptible tonal movement only on marks, ticks, or the imprint — never on prose, rows, or page backgrounds. It must feel like ink catching light, not an animated interface. Every effect is off under `prefers-reduced-motion`.
- **Page transitions.** The deferred View-Transitions crossfade stays deferred (SPA prefetch already softens swaps).
- **Hard limits:** no scroll-jacking, no parallax, no entrance animations on load, no animated gradients/orbs/blobs, no animated reading text, and nothing moving without a user action except the existing theme crossfade or a deliberately accepted ambient mark/tick effect.

---

## 8. Page-by-page recommendations (no new copy anywhere)

### 8a. Homepage gateway — an owned gateway, not a hero

Keep the locked contract (exactly 3 pillar links, masthead `mark` + `subline`, no eyebrow/tagline, no `/podcast/` link, single-column stack). Make it _owned_:

```
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
   (pillar marks ⌐ ⌗ ´ are shipped; refine them only if visual QA proves a real issue)
```

- **Tone the wordmark to ink** (drop the bright `--sk-accent` it uses today): in dark especially, the `#8fb3df` wordmark is currently the single loud element on the page, so this is the **committed** fix — the homepage test does not pin the colour. Setting `.home-masthead__mark` in **Literata** (within the tested 24–40px `--sk-masthead` clamp) is the **accepted aesthetic risk**: it reframes the wordmark as a title-page imprint rather than an app logo. It deliberately splits two lockups — the navbar "skepvox" stays the sans _running head_, the masthead becomes the serif _imprint_ (a real book distinction). Validate it on the screenshots and **revert to the toned sans if it reads amateur**; the colour toning stands regardless.
- Do **not** add the rider colophon back to the homepage body. The navbar already carries the rider; the homepage body now carries the imprint plus pillar marks.
- Replace the masthead `border-bottom` + the three `border-bottom`s with **one vertical spine** behind the pillar list and **space** between entries; the `→` is gone. The entry must still look tappable at rest on mobile; hover is only an enhancement for pointer devices.
- Desktop: the spine sits in a slight **asymmetric left margin** (the pillar marks join it in V2) so the gateway reads as a _title page_, not a centered column in a void — this closes the desktop-void gap in V1, on the gateway. (The hub desktop margin column lands with the reader-map work.)

### 8b. Literatura / 8c. Filosofia — section / author / work

One grammar, two rooms. Section hubs keep their H1; author/work lists become catalogue entries on the spine (portrait as a bookplate, the one allowed shadow). The **work hubs** (`PipelineWorkContents`) are the biggest de-tabling win — see 8f. Filosofia must look like a different _room_, not a different website; differentiate only by the Filosofia mark and (V5) a tick-scale ink-blue. The Lavelle part dividers stop wrapping as shouty two-line uppercase blocks — they become quieter section markers on the spine.

### 8d. Vox Français — show / episode

Keep the `show-head` masthead (already restrained). Replace the `CardGrid` episode boxes with catalogue entries: cover as a small **bookplate** on the spine, title + duration as the quiet entry (the `.card-grid__item` count contract is preserved through the restyle). **Important:** the episode cover art is the one saturated, tactile, _alive_ element anywhere on the site — the bookplate must **frame** it (a calm border/inset), never desaturate or shrink it to grey; on this pillar the colour is welcome, not a flaw to flatten. The rented "Navegar | Índice ›" local-nav band at the top of podcast pages is the most templated chrome here: either give it an owned, spine-consistent treatment or explicitly hide it on these surfaces — do not leave it as a named eyesore. On the episode page the `vox-ep__rule` accent tick is already a non-full-width mark — keep it. The big change is the **transport**: the native `<audio controls>` is the one truly rented element — give it an owned minimal transport (a `play` glyph + a slim scrubber) and **celebrate the gold cue** as this pillar's signature (the one place the site already feels alive). Keep cue keyboard nav / roving-tabindex untouched.

### 8e. Reader leaves

Do **not** touch the prose body (Literata, 35rem, 1.75). Add the **paper tone** + the **spine** so the leaf reads as a page. The location breadcrumb gets the spine + current tick; respect the test-locked specifics (chapter rung `h2` 13px small-caps; current segment `h3` uppercase **UI-sans** — its job is _location_, not _title_, so do not serif it). Life here comes from spine + paper + spacing, not from recolouring the locked breadcrumb. Bottom nav aligns to the spine; chevrons stay.

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
- Keep the current tick — it already sits inboard, which _is_ the spine language.
- **Pull the count + disclosure chevron inboard.** Removing the connective hairline would otherwise strand the count/chevron at the far page edge (worst on desktop, where the title-left / count-far-right gap already reads as a spreadsheet cell). Cap the interactive row to the reading measure and place the count adjacent to the title, so de-tabling tightens the row rather than orphaning the meta.
- Desktop: Part/section labels + marks move into a left **margin column** so the contents read like a manuscript's marginalia, not a stretched list.

---

## 9. Implementation roadmap (bigger, fewer slices — visible progress early)

**Principle:** each slice delivers visible, reviewable progress on real surfaces. **No invisible token-only phase, and no splitting one coherent change across three tiny steps.** The earlier "foundation-only, almost nothing visible" V1 is replaced.

**Post-V1 correction:** the spine alone is not enough. If the homepage pillars look like static text blocks on a phone, the slice has not solved the product problem. V2 must make the three pillar entries visibly tappable at rest on mobile without restoring arrows, adding cards, or adding copy. This is a required outcome, not a later nicety.

### V1 — Spine proof _(shipped)_

Shipped on the homepage and reader maps:

- additive spine tokens (`--sk-spine`, `--sk-spine-tick`);
- homepage vertical spine, no `→`, toned serif imprint, no body rider colophon;
- Brás Cubas and Lavelle map rows de-tabled into the spine grammar, with counts pulled inboard;
- the hover guard updated from the old arrow nudge to the spine/tick behaviour.

What did **not** ship and should not be treated as missing V1 work: `--sk-paper` / `--sk-paper-edge` and a homepage body rider. Paper remains V3/V5 territory; the rider remains navbar/favicon identity.

### V2 — Catalogue grammar + owned pillar marks _(shipped)_

Shipped across the gateway and hubs:

- `BrandMark.vue` + `brand-marks.ts` with the three final pillar marks;
- homepage pillar marks at rest, replacing the abstract tick as the mobile-visible affordance;
- de-boxed `CardGrid` catalogue rows for author/work/podcast lists;
- author/work hubs made quieter and more consistent;
- Lavelle part labels split into a small kicker plus calmer title;
- no route/data/podcast/book-pipeline change.

Carry this forward as the baseline. Do not re-add boxed cards, homepage arrows, the body rider colophon, or full-width row rules as the default way to create life.

### V3 — Reading surfaces + the heading-bar cleanup _(visible)_

- Reader leaf: **paper tone** on the reading column + the spine as its inboard edge; align the breadcrumb and bottom nav to the spine (respect the locked breadcrumb h2/h3 specs).
- **`.vt-doc h2::before` — handled honestly here, not in V1.** Removing the 2px accent bar over every doc `h2` is a **visible cleanup on `.vt-doc` prose/markdown surfaces** — and it does _not_ appear on the V1 homepage/hub surfaces, because those elements are simply **not `.vt-doc` `h2` descendants**: the homepage renders in a `page: true` layout with no `.vt-doc` ancestor, and the Brás Cubas hub renders `.pwc` in the `content-top` slot outside its (empty, `h2`-less) `.vt-doc` body — so the selector never matches there (no override or reset involved). Bundling the removal into V1 would therefore have been dishonest "nothing changes" framing; it belongs on the slice that actually touches `.vt-doc` headings (e.g. the podcast show page's `## Leçons`). **Screenshot-validate** any markdown page carrying an `h2`.
- **Validation:** a representative Brás Cubas + Lavelle leaf, both modes; plus any `.vt-doc` h2 page.

### V4 — Podcast playback _(visible)_

- Episode pages: an owned/quieted transport replacing native `<audio controls>`, with the `play` glyph (the one legitimate new arrow-adjacent symbol); celebrate the gold cue. Preserve cue roving-tabindex / keyboard / reduced-motion.
- **Validation:** an episode page, both modes, + a keyboard pass on the cues.

### V5 — Pillar tonality + symbol polish + material light/dark pass _(visible, quiet)_

- Tick-scale pillar tints (`--sk-pillar-*`) on marks + current/hover ticks only (never fills); finalize the mark family; make dark read as lamplight (warm paper lift) vs light-as-paper.
- Assess restrained CSS-only tonal movement: a slow, reduced-motion-safe shift on a pillar mark, spine tick, or the `skepvox` imprint. Reject it if it reads as a startup gradient, decoration, or distraction. Do not animate rows, backgrounds, prose, or body copy.
- **Validation:** all three pillars side by side, both modes.

### V6 — Visual QA sweep + minimal guardrails

- Reuse this screenshot harness for the full light/dark × mobile/desktop sweep (the dark small-muted-text danger zone the prior docs flag, verified on the WebKit mobile panel).
- Lock the few semantic guardrails (§11); no snapshot sprawl.

_Six substantive slices, each visibly meaningful. No tiny invisible phases. If V1's hub restyle proves higher-risk than the CSS-scoped change expected, it may split (homepage first, hub immediately after) — but the default is to ship both together, because that is the meaningful early progress the brief demands._

---

## 10. Supersession note (relationship to the older homepage H-roadmap)

The prior homepage data/IA pass deliberately codified the homepage as a **hairline table-of-contents of three pillar rows each with a decorative `→`**, chose to **extend the hairline-TOC grammar rather than the spine**, kept the `→` as `aria-hidden`, and explicitly argued **against** serifing the masthead ("keeps the gateway from impersonating a book page").

**This assessment supersedes those specific _visual_ decisions where they conflict:**

- the decorative homepage `→` is **removed** (not kept);
- the hairline table-of-contents is **no longer the homepage's main grammar** — the vertical spine + spatial grouping replaces it;
- the masthead **does** become a serif imprint. The H-roadmap's stated risk — "impersonating a book page" — is mitigated because this is a _title page of a library_ (imprint + catalogue entries), visually distinct from a work hub, not a reading page.

**Everything non-visual from H1–H6 remains valid and is built upon:** the `pillars.ts` single-source IA, the Vox Français narrowing (with Español/English public-but-unpromoted), live-content-as-text (titles + `meta`, no extra links), the hub-only link model, the masthead/subline structure and the `homepage.spec.ts` link-count contract, the `pipeline-export` allow-list, and the H6 test simplification. This roadmap changes the _look_, not the IA, data boundary, or test posture that H1–H6 established.

---

## 11. Test philosophy

The existing suite is the right model — **semantic, token-, ARIA-, and source-based; zero pixel snapshots** — and is robust to exactly this kind of presentation change. Keep it that way. Do **not** add visual-regression screenshots (the screenshot harness in §2 is a _review/QA_ tool, not a committed test).

Add only these lean, intention-encoding guardrails:

1. **No homepage arrow.** The homepage renders no `→`/arrow glyph and no `.pillar__go` element. Locks "the arrows phase is over" for the gateway.
2. **Second-layer separation.** `ReaderIcon`'s union stays exactly the four chevron/disclosure names; `BrandMark` is a separate component; `rider`/pillar/`play` names live only in `brand-marks.ts`, never `reader-icons.ts`.
3. **Three pillar links, intact.** Already covered by `homepage.spec.ts` — keep it green; do not duplicate.
4. **Reduced-motion + focus intact.** Reuse the existing `a11y-floor` harness: the new spine-tick hover sits inside `@media (hover: hover) and (pointer: fine)` with a reduced-motion guard, and `SkLink` still owns the focus ring (no per-component `:focus-visible` regressions).

~4 assertions, all semantic, no pixels, no new matrix. **One existing assertion is _modified_, not added:** `nav-interaction-states.spec.ts`'s `Home.vue` hover row (`transform: translateX(3px)`) becomes the spine-tick reveal, because the homepage hover behaviour intentionally changes — keeping a semantic test honest, not snapshot sprawl. Everything else is already covered by the suite, which catches a class/token/ARIA regression loudly without locking a single pixel.

---

## 12. Do-not-do list

- **Do not** keep the full-width horizontal hairline as the universal divider; replace it with the spine + spatial grouping (reserve a horizontal rule only for a true masthead→contents binding).
- **Do not** add descriptive copy, subtitles, blurbs, labels, slogans, helper text, or marketing prose. Pages get more alive through structure, marks, spacing, colour, behaviour.
- **Do not** turn the homepage into a hero or a card grid; keep the calm 3-pillar index and its locked contract.
- **Do not** keep boxed `CardGrid` feature-cards (the podcast surface or the hubs); convert to catalogue entries on the spine.
- **Do not** keep `→`/chevrons as the answer to "this is clickable." Keep chevrons only for prev/next, up, and disclosure; remove the homepage `→`; default new affordances to _no icon_.
- **Do not** ship a homepage that depends on hover to communicate clickability; mobile rest-state affordance is mandatory.
- **Do not** expand `ReaderIcon` for brand marks; use the separate `BrandMark` layer.
- **Do not** ship weak/placeholder pillar marks. The three pillar marks are now shipped and should remain final-quality, not sketch symbols.
- **Do not** make the palette loud: no per-pillar coloured cards/backgrounds, no decorative gradient blobs/orbs/glows; pillar colour lives only at tick/mark scale.
- **Do not** animate text blocks, prose, rows, backgrounds, gradients, blobs, or glows. Any motion/tonal life must be mark-scale, slow, optional, and disabled under `prefers-reduced-motion`.
- **Do not** desaturate or shrink the podcast cover art to match the austere system — it is the site's one welcome spot of colour and tactility; frame it, don't flatten it.
- **Do not** leave the rented "Navegar | Índice" band un-actioned on podcast surfaces — own it or hide it.
- **Do not** change the test-locked tokens, classes, or contracts: `--sk-accent #2f4a6b`, the cue gold, the masthead clamp, the breadcrumb `h2`=13px / `h3`=uppercase-**sans**, the closed `ReaderIcon` union, the SkLink focus/hover split, ≥44px targets.
- **Do not** serif the current-segment location line (`h3`) — the test pins it to UI-sans; it is _location_, not a title.
- **Do not** touch the reading prose body, the IA (`pillars.ts`), routes, the pipeline, or podcast content.
- **Do not** add a runtime icon dependency for three marks; owned SVG wins.
- **Do not** scatter shadows; one soft elevation, for portraits only.
- **Do not** add motion that runs without a user action (beyond the existing theme crossfade); no scroll-jacking; honour reduced motion globally.
- **Do not** ship an invisible token-only slice or split one coherent change into tiny phases; each slice must change a real surface.
- **Do not** add visual-snapshot tests.

---

## 13. Next implementation prompt (V3 — reading surfaces + heading-bar cleanup)

> **Work in `/Users/skepvox/projects/skepvox-website` on `develop`. Implement V3 from `docs/site-visual-language-next-level-assessment.md`: bring the spine/paper language into the reader leaves and clean the remaining rented heading-bar treatment on `.vt-doc` pages. Do not push. Do not add copy. Do not change routes, data, book-pipeline files, podcast content, or dependencies. Avoid comments unless they clarify a non-obvious constraint; remove stale comments in touched code.**
>
> **Current baseline:** V1 and V2 are already shipped. The homepage has no arrow and uses pillar `BrandMark`s. `CardGrid` is de-boxed. `PipelineWorkContents` uses the spine grammar. Do **not** reintroduce the body rider colophon, boxed cards, homepage arrows, full-width row rules, or the old hairline table grammar.
>
> **1. Reader leaves.** Add a perceptible but quiet paper treatment to pipeline reader leaves and align the existing `PipelineReaderHeader` / `PipelineSegmentNav` chrome to the spine language. Preserve the locked prose body: Literata, measure, line-height, own-prose-only loading, and all route/data identity rules. Preserve the reader-location contract: chapter `h2` remains the quiet location rung and current segment `h3` remains uppercase UI-sans.
>
> **2. Heading-bar cleanup.** Audit `.vt-doc h2::before` on real markdown pages that still show the 2px accent bar. Remove or narrow that treatment only where it creates the rented/docs look. Validate at least one podcast page and one non-reader markdown page before deciding the final scope. Do not touch the homepage or reader-map structure to solve this; they are not `.vt-doc h2` surfaces.
>
> **3. Visual QA.** Build and inspect mobile + desktop, light + dark: one Brás Cubas leaf, one Lavelle leaf, the Vox Français show page, and a representative section/author page. Confirm paper warmth is visible but not panel/card-like; focus rings and 44px targets remain intact; dark mode stays lamplight, not grey-on-black.
>
> **4. Tests.** Keep test changes narrow and semantic. Prefer updating existing assertions over adding a new matrix. Run focused reader/podcast/section specs first, then `pnpm verify`. Report exact files changed, visual decisions, tests, and confirmation that routes/data/podcast/book-pipeline files did not change.

---

## 14. Review notes & residual risks

This revision was **visually inspected** (§2, real screenshots) and **adversarially reviewed** — a multi-lens critic pass over the doc, the repo, the locked tests, and the H-roadmap, with each finding independently verified. Confirmed corrections (a false `h2::before` mechanism, a wrong Vox live-line, a phantom edition-line, a mis-cited H-roadmap section, the `translateX` test contract, the unrendered `BrandMark` seam) are folded in above. The deliberately **accepted** risks, recorded so they are chosen rather than missed:

- **The serif imprint is a genuine aesthetic gamble.** It splits the wordmark into two lockups (sans running-head in the navbar, serif imprint on the title page). The committed, low-risk part is **toning the wordmark to ink**; the serif is to be validated on the screenshots and reverted to the toned sans if it reads amateur.
- **The first visual levers are quiet.** Spine + arrow removal + toning may not, alone, fully dispel "feels dead" — colour/imagery is the demonstrated lever and is metered in deliberately (cover art kept; pillar tonality in V5). V1/V2 deliver _ownership and calm_; V3+ must continue adding material presence without adding text or marketing chrome.
- **De-tabling must not strand or grey what works.** Removing the hub hairlines requires pulling counts inboard (or it worsens desktop stranding); de-boxing the podcast must **frame, not flatten**, the cover art.
- **Two named rented elements remain scoped, not yet owned:** the podcast "Navegar | Índice" band (§8d) and the production cookie-consent banner — both deserve owned treatment in a later footer/chrome slice.

No blocker survived review; the single test-contract change (the `Home.vue` hover assertion) is documented in §9 V1 / §11 / §13.
