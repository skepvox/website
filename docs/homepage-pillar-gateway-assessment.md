# Homepage Pillar Gateway — assessment

**Status:** assessment / doc-only · planning for the next homepage phase (slice series **H1–H6**)
**Date:** 2026-06-27 · branch `develop`
**Scope:** evolve the current A6 calm editorial homepage into a *data-connected pillar gateway* that surfaces live content from existing data, narrows the visible third pillar to **Vox Français**, and stays calm/editorial/bookish. No implementation in this doc. No route moves, no redirects, no podcast IA migration, no new dependencies.

> This doc **evolves** the homepage decided in slice **A6** ([`locale-rooted-website-ia-assessment.md`](locale-rooted-website-ia-assessment.md):564–576); it must not regress it. The current live three-pillar state is described in [`reading-app-website.md`](reading-app-website.md):26–35. Two older docs describe a *pre-A6* "hero + 3 `.vt-box` cards" homepage ([`product-theme-roadmap-assessment.md`](product-theme-roadmap-assessment.md):60, [`navigation-owned-shell-assessment.md`](navigation-owned-shell-assessment.md):199) — those are **stale**; do not follow them.

---

## 0. Current-state facts verified

Every claim below was read first-hand in the repo (and independently re-verified by an adversarial pass). File:line references are exact unless prefixed "≈".

### The homepage is already a calm editorial index (not a hero, not cards)

- The homepage route is `src/index.md` (`page: true`, frontmatter holds all SEO/OG/JSON-LD), which mounts the owned `@theme/components/Home.vue` via `<Home />` (`src/index.md`:146–150).
- `Home.vue` is **fully static**: it imports only `SkLink` (`Home.vue`:2) and hand-codes a masthead (eyebrow `Engenharia de Letras` → `<h1>skepvox</h1>` → subline) over a hairline table-of-contents of **three `SkLink` pillar rows**, each with a hand-authored blurb and a decorative `→` (`Home.vue`:6–37). There is **no `.vt-box` card and no 76px hero** anywhere — `grep vt-box` over `Home.vue` returns zero.
- The three pillars today: **Literatura → `/pt/literatura/`**, **Filosofia → `/pt/filosofia/`**, **Podcasts → `/podcast/`** (`Home.vue`:14,22,30).
- Container is `max-width: var(--sk-measure-lede)` (42rem), centered, `padding: clamp(2.5rem,8vh,5rem) …` (`Home.vue`:46–50). Each pillar is a CSS grid `1fr / auto` (label + arrow on row 1, blurb spanning row 2), `border-bottom: 1px solid var(--vt-c-divider)`; hover is **pointer-gated** and reduced-motion-gated (`Home.vue`:84–155).

### A complete owned token system already exists

- `vars.css` defines the full `--sk-*` vocabulary: spacing `--sk-space-1..7` (:62–68), a 9-rung type scale `--sk-text-2xs..3xl` + `--sk-masthead: clamp(1.85rem,4vw,2.25rem)` (:50–59), one ink-blue accent `--sk-accent: #2f4a6b` (:126–129), warm owned surfaces `--sk-surface #fcfcfa` / `--sk-surface-raised #f4f3ef` (:114–117), hairlines `--sk-rule rgba(33,53,71,.1)` / `--sk-border → --vt-c-divider` (:110,118,122), radii (:82–91), motion `--sk-motion-base 200ms` + one `--sk-ease` (:71–73), measures `--sk-measure-lede 42rem` (:95), and a 4-step text ramp `--sk-text/-body/-muted/-faint` (:101–109).
- A **reader-shell serif vocabulary** also exists and is theme-wide (not reader-private): `--sk-reading-title 1.875rem` (Literata serif), `--sk-reading-kicker 0.8125rem` + `--sk-reading-kicker-tracking 0.07em`, `--sk-reading-row 0.9375rem`, `--sk-reading-hairline = --sk-rule` (`vars.css`:25–35).
- Dark/light is a **class-based `.dark` flip**: only literal owned tokens are re-declared under `.dark`; every `--vt-c-*` route and alias follows automatically (`vars.css`:161–199).
- **Footer/body seam is real and mode-dependent.** Body = `--vt-c-bg` (`--sk-surface`). The rented `@vue/theme` `.VPFooter` fills with `--vt-c-bg-soft` (`--sk-surface-raised #f4f3ef`) + a matching top border in **light** (`VPFooter.vue`:25–29), but flips to `--vt-c-bg` (flush with body) in **dark** (`VPFooter.vue`:32–35). So the footer is a darker band only in light, and the relationship **inverts** between modes. `VPFooter` is rented (node_modules) and renders **only on the homepage** (`page:true`) — it is invisible on every reader/podcast route ([`navigation-owned-shell-assessment.md`](navigation-owned-shell-assessment.md):175).

### Live data sources (already build-time, already proven)

- **Literatura + Filosofia** read one shared metadata file, `.vitepress/theme/data/pipeline-export-segments.json` (`$schema "skepvox-pipeline-export-segments-v1"`, metadata only, no prose). `meta.works` is an array of **exactly two** works:
  - Machado, *Memórias póstumas de Brás Cubas* — pt edition `routePrefix: "pt/literatura/machado-de-assis/bras-cubas"`, `segmentCount: 163`, `publishable: true`, `maturity: "reading-reviewed"`, `routeStability: "stable"`.
  - Lavelle, *Introdução à ontologia* — pt edition `routePrefix: "pt/filosofia/louis-lavelle/introducao-a-ontologia"`, `segmentCount: 99`, **`publishable: false`, `maturity: "draft"`**, `routeStability: "stable"`. (It also carries a second, legacy-shaped `fr` "source" edition `louis-lavelle/introduction-a-l-ontologie` — this is why the pt-rooted guard exists.)
- `literatura-cards.ts` / `filosofia-cards.ts` already project the pt edition into a card: `href: \`/${pt.routePrefix}/\``, `meta: \`${pt.segmentCount} trechos\``, plus a hand-curated `WORK_BLURBS` keyed by `routeSlug` (`literatura-cards.ts`:16–31, `filosofia-cards.ts`:18–33). They select the pt edition (`editions.find(e => e.language === 'pt')`) and guard with `routePrefix.startsWith('pt/<section>/<authorSlug>/')`. They do **not** gate on `publishable`/`maturity`, so Lavelle's draft-flagged book renders today (and is genuinely public/indexed — `routeStability: stable`, in the sitemap).
- **Podcasts**: `src/podcast/shows.json` is a 3-element, already-`CardGridItem`-shaped array (title/href/description/imageUrl/imageAlt/episodeCount/meta); Vox Français = `/podcast/francais/`, `episodeCount 3`, `meta "3 épisodes"`. Each `src/podcast/<show>/episodes.json` is a flat **ascending-by-number** array of `{number,title,href,durationSeconds,description,artworkUrl}` with **no date field** — so "latest" = max `number` = last element (the latest *released* episode; buffers are excluded by the generator `scripts/sync-podcast-lesson-pages.py`). Vox Français latest = #3 *Le covoiturage poli*, `href "/podcast/francais/003-le-covoiturage-poli"` (no trailing slash), ≈22 min. `shows.json`/`episodes.json` are **generated**, not hand-maintained.
- `CardGrid.vue` + `cards.ts` express only image / eyebrow / title / 3-line-clamped description / meta inside a `SkLink` — no prose, date, or progress slot.

### Nav, routes, and the legacy guarantee

- Global nav is a plain array in `config.ts`:15–39 — `Home (/)`, `Literatura (/pt/literatura/, activeMatch ^/pt/literatura/)`, `Filosofia (/pt/filosofia/, ^/pt/filosofia/)`, `Podcasts (/podcast/, ^/podcast/)`.
- The homepage **re-hard-codes** the same three roots independently in `Home.vue` — nav and homepage are two hand-synced declarations. **There is no central section-route module.** `reader-shell.ts` is segment-`routePath`-only (`segmentHref`/`workHubHref`/`trechoHref`) and explicitly "never identity" — section roots are out of its scope (`reader-shell.ts`:1–12,64–73).
- **Legacy-route guarantee holds.** No navigable non-pt `/literatura/` or bare `/louis-lavelle/` href exists in `src` + `.vitepress` (excluding the pipeline-export `routePath` data, which is stored without a leading slash). The only hits are pt-rooted guards and comments. The legacy `/literatura/` surface was retired in slice **B5**, no redirect.
- The owned nav brand is `NavBarTitleBrand.vue` (masked `logo.svg` + `skepvox` wordmark on `--sk-brand-mark`), slotted into `VPTheme` `navbar-title` (`theme/index.ts`:23). The homepage masthead is the larger page-level echo of the same wordmark, but deliberately uses `--sk-accent` (not `--sk-brand-mark`).

### Existing homepage test guardrails (the regression surface)

- `tests/homepage.spec.ts` — 7 **real-DOM** tests against the built site (`vitepress preview`, port 4399). Locks: exactly 3 `.home-pillars a.pillar` with h2 text `[Literatura, Filosofia, Podcasts]`; each pillar→href; masthead `skepvox` font-size 24–40px + eyebrow `Engenharia de Letras` + no `.tagline`; **the masthead has no links and the sorted hrefs of *all* `.home-index` anchors equal exactly `['/podcast/','/pt/filosofia/','/pt/literatura/']`** (Test 5); meta description names the 3 pillars, no `Louis Lavelle`; single-column, no horizontal overflow, 3 distinct row tops.
- `tests/homepage-ia-pillars.spec.ts` — 6 **file-based** tests on `dist/index.html` + `config.ts` + `404.md`. Locks: nav order `['Home','Literatura','Filosofia','Podcasts']` + the 3 links; `404.md` offers the 3 pillars; **built `index.html` contains each pillar href, the 3 JSON-LD section URLs, and the substrings `'/louis-lavelle/'` and `'Louis Lavelle'` are absent** (`:52–53`); pillar hubs build; no `_redirects`.
- Already-green architectural guards the redesign is automatically covered by (do **not** re-add): `legacy-lavelle-removed.spec.ts` (dist `'/louis-lavelle/'` absent, `:68`), `redirects-clean-break.spec.ts`, `sitemap.spec.ts` (`/` kept, chapters pruned), `a11y-floor.spec.ts` (Home.vue named — anchors via SkLink), `nav-interaction-states.spec.ts` (Home.vue hover `translateX(3px)` pointer-gated), `color-tokens.spec.ts`, `mobile-theme-toggle.spec.ts` (homepage light↔dark, mobile-only).
- **Consumer allow-list**: `tests/pipeline-export.spec.ts`:146–152 asserts that the files importing `pipeline-export-segments.json` are **exactly** `PipelineReaderHeader.vue`, `PipelineSegmentNav.vue`, `PipelineWorkContents.vue`, `filosofia-cards.ts`, `literatura-cards.ts`. A new component importing that JSON directly **breaks this test**.

### Two hard constraints that shape the whole design

1. **The filosofia book cannot be deep-linked or author-named on the homepage as-is.** The live filosofia route `/pt/filosofia/louis-lavelle/introducao-a-ontologia/` contains the substring `/louis-lavelle/`, and the author is `Louis Lavelle` — both are forbidden in `dist/index.html` by three green substring guards (`homepage-ia-pillars.spec.ts`:52–53, `legacy-lavelle-removed.spec.ts`:68). **Literatura is unaffected** (route `…/machado-de-assis/…`, author `Machado de Assis`). This asymmetry is the single most important design constraint.
2. **The homepage is link-locked to exactly 3 links** (`homepage.spec.ts` Test 5, scoped to `.home-index a`). Any new clickable deep-link added anywhere under `.home-index` breaks it.

---

## 1. Current diagnosis

### Why it reads like a parked / stray domain

The A6 homepage is *correct but inert*. On mobile especially it presents as three near-identical generic rows — a wordmark, a one-line tagline, and three section labels with evergreen blurbs ("Clássicos em domínio público…", "Episódios para praticar idiomas…"). Nothing on the page is **true today**: it could have been written before a single book or episode existed. There is:

- **No proof of life.** The page names sections but never names what's *in* them — not *Brás Cubas*, not *Introdução à ontologia*, not a single episode. A visitor cannot tell the site is actively maintained or that anything is actually there.
- **No ownership signal.** The masthead identity (`Engenharia de Letras` / `skepvox`) is present but quiet to the point of anonymity; with no live content around it, it reads as a placeholder rather than an author's index.
- **Flat hierarchy.** Three rows of equal weight, equal emptiness. There is no sense that one pillar is more developed than another, or that the books are the heart of the product.
- **Disconnection from the product.** The reader hubs are rich (printed-TOC grammar, serif titles, hairline chapter rows); the podcast hub lists real episodes; the homepage borrows none of that texture, so it doesn't feel like the front door to the *same* product.

### What is missing (the gap to close)

Live-content proof, a legible hierarchy (books first), product identity that the live content reinforces, and a visual through-line to the reading/podcast surfaces.

### What is already good and must be preserved

- **Restraint and calm.** No marketing excess, no hero, no orbs/gradients, no split-hero. Keep it.
- **Mobile-first simplicity.** Single column, no overflow, generous tap targets, the whole row is the hit area.
- **The owned interaction floor.** `SkLink` focus ring, pointer-gated hover, reduced-motion handling, single structural accent confined to the wordmark + hover. These are already test-locked (`a11y-floor`, `nav-interaction-states`) and must stay.
- **The masthead grammar** (eyebrow → wordmark → subline) shared with `PodcastShowHeader`. Keep it; do not let live content push it toward a hero.

The fix is **not** more chrome or more links. It is **typographic and informational density** — surfacing the real, current content as quiet text — inside the index the redesign already has.

---

## 2. Product direction

The homepage is a **calm entry point into three living pillars** — and, per the current product focus, the visible third pillar is **Vox Français**, not the generic podcast directory.

It is explicitly:

- **not a marketing hero** — no oversized headline, no CTA, no value-prop copy;
- **not a blog index** — no feed of posts, no dates-first list;
- **not a dashboard** — no metrics, no cards-grid, no "stats";
- **not a catalog** — it points *into* pillars; it does not reproduce their tables of contents.

It **is** a calm editorial index whose three rows each name the live work behind them. It should feel:

- **modern & composed** — confident type, generous whitespace, a single accent, one column;
- **bookish & authored** — echoes the reader hubs' hairline/kicker rhythm; the live lines read like an index a person curates, not a generated grid;
- **active** — every line is *true now* (real titles, real counts, the latest episode), so the page visibly updates as the product grows;
- **restrained** — informational, never promotional; live content arrives as text, not as a wall of cards or links.

**Pillars, in nav order:**

| # | Pillar | Links to | Live line surfaces (text) |
|---|--------|----------|---------------------------|
| 1 | **Literatura** | `/pt/literatura/` | *Memórias póstumas de Brás Cubas* · 163 trechos |
| 2 | **Filosofia** | `/pt/filosofia/` | *Introdução à ontologia* · 99 trechos |
| 3 | **Vox Français** | `/podcast/francais/` | latest episode title (*Le covoiturage poli*) and/or "3 episódios" |

The fill that makes the page feel alive is the **right-hand column of titles**, not new links or imagery.

---

## 3. Data-connected pillar gateway

### 3.1 What each pillar shows, from which existing source

**Literatura** — from `pipeline-export-segments.json` via the existing `literatura-cards.ts` projection: the published pt work *Memórias póstumas de Brás Cubas* + `163 trechos`. Collision-free (route and author contain no forbidden substring), so it *may* be a link or text.

**Filosofia** — from the same export via `filosofia-cards.ts`: *Introdução à ontologia* + `99 trechos`. **Title as text only** — do **not** render the author `Louis Lavelle` and do **not** deep-link `/pt/filosofia/louis-lavelle/…` (both trip the substring guards in §0). The pillar row's *link* stays the section hub `/pt/filosofia/`.

**Vox Français** — from `src/podcast/shows.json` (the Vox Français entry) and/or `src/podcast/francais/episodes.json`: surface either the **show count** ("3 episódios") or the **latest released episode title** (*Le covoiturage poli*, max-`number` = last element). The pillar row's link is `/podcast/francais/`. No date field exists, so the live line must not claim "novo"/"recente" — present the title plainly (it is honestly the latest *released* episode).

### 3.2 Data-driven vs hand-authored

| Element | Source | Kind |
|---|---|---|
| Pillar labels, hrefs, order, activeMatch | new `pillars.ts` constants (§4) | hand-authored (the IA) |
| Pillar blurb (evergreen one-liner, optional) | `pillars.ts` | hand-authored |
| Literatura/Filosofia live title + `N trechos` | `pipeline-export-segments.json` via the card modules | **data-driven** |
| Vox Français live line (count or latest title) | `shows.json` / `francais/episodes.json` | **data-driven** |
| Author names, bios, portraits | `authors.ts` | hand-authored — **keep off the homepage** (author framing is gone by design; and `Louis Lavelle` is forbidden) |

The principle: **the IA (labels/routes) is hand-authored and centralized; the content proof (titles/counts/latest) is data-driven and never re-hard-coded.**

### 3.3 Honoring the consumer allow-list (critical)

`pipeline-export-segments.json` may be imported by **only 5 files** (`pipeline-export.spec.ts`:146–152). Therefore **`Home.vue` must not import the export directly.** Instead, add a thin pillar-level export to the already-allowlisted card modules and have `Home.vue` import the *function*:

- `literatura-cards.ts` → add `literaturaFeaturedWork(): { title; href; meta } | null` (first `pt/literatura/`-rooted work).
- `filosofia-cards.ts` → add `filosofiaFeaturedWork(): { title; meta } | null` (first `pt/filosofia/`-rooted work; intentionally **no href/author** exposed for homepage use).

This keeps the JSON import inside the 5 allowlisted files (allow-list unchanged) and reuses the proven `routePrefix.startsWith` pt-guard, so a route reprojection or the stale `fr` source edition can never leak onto the homepage.

For Vox Français, the export does not apply (`shows.json`/`episodes.json` are not allow-listed — that list is pipeline-export-only). Use a small owned helper (`voxFrancaisLatest()`, §4) that reads the francais manifest; `Home.vue` imports the function, not raw JSON, for symmetry and testability.

### 3.4 Selection rule and gating

- There is **no "featured/latest" field** in the export — `works` is a plain array (one work per pillar today). "The current book" = the single pt-rooted match. If a pillar ever gains a second book, do **not** rely on array order; add an explicit pin (a `routeSlug` allow-list) — flagged here so it isn't discovered in production.
- **Do not gate on `publishable`/`maturity`.** Lavelle's book is `publishable:false`/`maturity:"draft"` yet is `routeStability:"stable"`, public, and indexed; gating on `publishable===true` would wrongly hide a live surface. If any gate is ever wanted, use `routeStability === 'stable'` — and match the hubs, which gate on nothing.

### 3.5 Explicitly avoid

`works.json`, `build-literatura-manifests.py`, `WorkContents`/`ReadingNav`, `reading-nav.json`/`segment-manifest.json`, and any non-pt `/literatura/` builder were retired in A5/B5. The homepage reads **only** the surviving `pipeline-export-segments.json` (metadata-only) and the podcast manifests. Never reintroduce the legacy machinery.

---

## 4. Component architecture

### 4.1 New: `pillars.ts` (pure-data IA module) — the route-centralization fix

There is no shared section-route module today; the three roots are duplicated across `config.ts` nav, `Home.vue`, `authors.ts`, and `shows.json`. Create **one pure-constants module** (recommended `.vitepress/theme/components/pillars.ts`, sibling to `cards.ts`/`authors.ts`/`episodes.ts`):

```ts
export interface Pillar { key: string; label: string; href: string; activeMatch: string; blurb: string }
export const PILLARS: Pillar[] = [
  { key: 'literatura', label: 'Literatura',  href: '/pt/literatura/', activeMatch: '^/pt/literatura/', blurb: '…' },
  { key: 'filosofia',  label: 'Filosofia',   href: '/pt/filosofia/',  activeMatch: '^/pt/filosofia/',  blurb: '…' },
  { key: 'voxfrancais', label: 'Vox Français', href: '/podcast/francais/', activeMatch: '^/podcast/francais/', blurb: '…' },
]
```

- **Import-light** (no `.vue`, no JSON, no pipeline-export). `config.ts` already imports a local TS module (`headerMdPlugin`), so it can import this too — building the `nav` Literatura/Filosofia/Vox-Français entries from `PILLARS` so **nav and homepage share one source of truth** and can't drift. (`Home` stays a separate hand-authored nav entry: `link '/'`, no `activeMatch`.)
- `Home.vue` iterates `PILLARS` instead of three hard-coded `SkLink` blocks; the blurbs move into `PILLARS`.
- **This is where the Vox Français narrowing lands** — change pillar 3 here once, and both nav and homepage follow.
- Keep route *construction* out of `Home.vue`: pillar roots come from `PILLARS`; live work routes (Literatura) come from the card module's `href` (built from data); nothing is hand-assembled in the component.
- `activeMatch` for Vox Français: recommended `^/podcast/francais/` (the pillar highlights only on Vox Français pages — honest, since Español/English are unpromoted). Alternative `^/podcast/` if you prefer the whole podcast surface to read as "the podcast pillar." Pick one; do not leave both.

### 4.2 Reuse / wrap / leave-alone

| Asset | Verdict | Why |
|---|---|---|
| `SkLink.vue` | **reuse** | Every pillar row stays a `SkLink` — inherits the four-state focus/touch floor for free (already test-locked). Set `--sk-link-focus-radius: var(--sk-radius-sm)`. |
| `literatura-cards.ts` / `filosofia-cards.ts` | **wrap** | Add the thin `…FeaturedWork()` exports (§3.3); keep the JSON import inside these allow-listed files. |
| `pipeline-export-segments.json` | **leave-alone (don't import from Home)** | Consume via the card modules only — allow-list constraint. |
| `CardGrid.vue` / `cards.ts` | **leave-alone** | The bordered/rounded/raised-surface card register is exactly the "generic cards" the gateway must avoid. Keep it for the hubs; never import it onto the homepage. (The `CardGridItem` *shape* is a fine mental model for what a row can express.) |
| `authors.ts` | **leave-alone** | Author bios/portraits belong on the hubs; author framing is intentionally off the homepage (and `Louis Lavelle` is forbidden there). |
| `shows.json` / `francais/episodes.json` | **wrap** | Behind a tiny owned `voxFrancaisLatest()` helper so `Home.vue` imports a function, not raw cross-tree JSON. (`Home.vue` lives in `.vitepress/theme/`; the manifests live in `src/podcast/` — relative path `../../../src/podcast/…`, or read the co-located `.vitepress/theme/data/sidebar-nav.json` which already carries francais `episodes[]` `{number,title,href}`.) |
| `ReaderIcon.vue` / `reader-icons.ts` | **leave-alone** | The registry is a **closed 4-chevron set** with no arrow glyph; the homepage's `→` is a plain Unicode glyph (`aria-hidden`). Keep it. Adding a drawn arrow would require the formal add-a-glyph process — **out of scope; no new icon dependency.** |
| `reader-shell.ts` | **leave-alone** | Segment-`routePath` presentation only; do not extend it with section roots. `pillars.ts` is the correct home. |

### 4.3 New (small, owned)

- `pillars.ts` (above).
- `…FeaturedWork()` exports in the two card modules.
- `voxFrancaisLatest()` helper (new tiny module or folded into a podcast data helper).
- `Home.vue` gains a per-pillar **live sub-line** slot (one text line), iterating `PILLARS` and optionally rendering the matching live line.

No new runtime dependency, no new component framework, no CardGrid on the homepage.

---

## 5. Visual design direction

The recommendation is to **extend the existing hairline table-of-contents grammar** (`.pillar` rows), not adopt cards. The page stays one column at `--sk-measure-lede` (42rem), masthead on top, three hairline-separated pillar rows below.

### 5.1 The live line, inside the existing row

Each pillar row already is a `1fr / auto` grid (label + `→`). Add **one quiet sub-line** in the label column, below the `<h2>`:

- Literatura: `Memórias póstumas de Brás Cubas · 163 trechos`
- Filosofia: `Introdução à ontologia · 99 trechos`
- Vox Français: `Le covoiturage poli` (latest) or `3 episódios`

Render it at the reading-row/kicker scale in a muted ink, with the `·` separator in `--sk-text-faint` (`aria-hidden`). It is **text proof-of-life**, not a second link. This is the entire "fill" — it turns three empty rows into three rows that each name what's behind them, without adding chrome.

### 5.2 Echo the reader-hub grammar (connect), don't copy it (don't impersonate)

The reader **work hub** (`PipelineWorkContents.vue`) is the bookish reference: a serif title bound to its list by a single hairline, then small-caps "kicker" labels and hairline rows. **Echo** its *type rhythm*, **not** its *structure*:

**Echo:**
- **Masthead bound by a hairline** — give the masthead a trailing `border-bottom: 1px solid var(--sk-reading-hairline)` so the wordmark introduces the pillar list the way `.pwc__head` introduces its contents.
- **Kicker eyebrow** — set the masthead eyebrow (and the live sub-lines if desired) to `--sk-reading-kicker` (0.8125rem) + `--sk-reading-kicker-tracking` (0.07em) + uppercase + `--sk-reading-muted`, the exact family the hubs use for `Abertura`/`Capítulos`/edition labels.
- **Reading-row rhythm** — pillar labels and sub-lines at the reading row size; hairlines at `--sk-reading-hairline`.
- **The `→` affordance** — keep the right-column `→` with ink-only, pointer-gated hover + 3px nudge (already matches the reader's hover contract).

**Do NOT copy:** the full segment/chapter lists, disclosure buttons, indented leaf rows, per-chapter counts, the breadcrumb reader chrome (`PipelineReaderHeader`), or any collapse/localStorage/ReaderIcon machinery — those are leaf-altitude wayfinding.

**Keep registers distinct where they intentionally differ:** the reader title is **serif Literata**; the homepage mark stays the **sans wordmark in `--sk-accent`**. Echo the hairline/kicker/row grammar, but do **not** switch the masthead to the serif — that distinction is what keeps the gateway from impersonating a book page.

### 5.3 Tokens, accent, dividers

- Build entirely on `--sk-*`; no new global tokens are needed.
- Confine the ink-blue accent exactly as today: the wordmark (`--sk-accent`) + pointer-gated label/arrow hover. Live sub-lines rest at `--sk-text-muted` and may lift to `--sk-accent` only on hover.
- **Standardize hairlines on `--sk-reading-hairline`** (not `--vt-c-divider`). These render *different* colors today: `--vt-c-divider` = `--sk-border` = warm `rgba(45,40,30,.11)`; `--sk-reading-hairline` = `--sk-rule` = cool ink `rgba(33,53,71,.1)`. Re-pointing the homepage to the reading hairline is a **real** visual change toward the reader and keeps the two surfaces in lock-step under future re-theming.
- Avoid `CardGrid`'s `--vt-c-text-3` (a rented faint grey outside the owned ramp); use `--sk-text-faint`/`--sk-text-muted`.
- Reserve the gold cue tokens (`--sk-cue*`) for genuine "now playing" state; do **not** use them on a static index.

### 5.4 Dark / light

- Everything above flips automatically via the `.dark` token system; no per-mode CSS needed beyond using owned tokens.
- **Footer/body harmony (the noticed seam).** In light, `.VPFooter` is a darker `--sk-surface-raised` band under a `--sk-surface` page; in dark it's flush. Recommendation: treat this as a **small, separable chrome fix** — an owned override (e.g. an unscoped `.VPFooter { background/border → var(--vt-c-bg) }` rule in the theme CSS layer, since `VPFooter` is rented and can't be edited in place) so the footer matches the body base in both modes. Scope it to the polish slice (H5); do not let the gateway introduce any *new* full-bleed band that compounds the seam. Note `VPFooter` runs its own 0.5s transition (`VPFooter.vue`:29).

### 5.5 Mobile

- Keep the single 1fr/auto grid (intrinsically responsive); only relax padding at the existing `max-width: 576px` breakpoint. The live sub-line wraps under the label naturally.
- Preserve: no horizontal overflow, three distinct row tops (test-locked), whole-row tap target.

---

## 6. Navigation & IA coherence

### 6.1 The visible IA narrows to Vox Français (this phase)

Per the steering update, the three **visible** primary pillars — in homepage **and** global nav, same order — become:

1. **Literatura** → `/pt/literatura/`
2. **Filosofia** → `/pt/filosofia/`
3. **Vox Français** → `/podcast/francais/`

This replaces the generic **Podcasts → `/podcast/`** third pillar in both surfaces. The homepage row order/labels must match the nav exactly (single source = `pillars.ts`, §4.1).

### 6.2 Español / English stay public — just unpromoted

This is **visible-IA narrowing, not unpublishing.** Vox Español and Vox English keep their show pages, episode pages, RSS/feed artifacts, sitemap entries, search/LLM visibility, and generated data. They remain reachable by:

- **direct URL** (`/podcast/espanol/`, `/podcast/english/`, and their episodes);
- the **sitemap** (unchanged);
- the **podcast config sidebar** — `config.ts` keys the sidebar to `/podcast/*`, so on *any* podcast page (including a Vox Français episode) the sidebar still lists all three shows. Secondary discovery within the podcast surface is intact;
- the broader **`/podcast/` hub**, which stays built/indexed and still renders all three shows from `shows.json`.

They simply stop appearing in the homepage/global-nav primary path. No route moves, no locale prefixes, no RSS URL changes, no media/feed-generation changes.

### 6.3 Disposition of the `/podcast/` hub

**Recommendation for this phase: leave `/podcast/` built + indexed + in the sitemap, but unlinked from the homepage/nav.** Do **not** add a secondary/footer link to `/podcast/` (or to Español/English) now — that belongs to the deferred **owned-footer/social** phase ([`social-presence-footer-strategy.md`](social-presence-footer-strategy.md), gated behind the Brand Asset System), which should settle the secondary link set as one coherent surface rather than improvising a second nav now. The hub remains discoverable via direct URL, sitemap, and the in-podcast sidebar. Revisit "where does `/podcast/` get linked from" when the footer phase lands; note it as an explicit open item, not silent removal.

### 6.4 Hub-link vs direct-work-link (the link model)

**Recommendation: pillar rows link to the section hub only; live content is text, not links.** This is the calm, restraint-preserving, guardrail-safe model and it is the default for H2–H4:

- Keeps the homepage at **exactly 3 links** (Test 5 stays green, just with `/podcast/` → `/podcast/francais/`).
- Avoids the `/louis-lavelle/` substring entirely (filosofia title is text; no deep link).
- Still feels alive, because the live *titles/counts* are the fill.

Promoting live items to **nested links** (deep-linking Brás Cubas, the latest episode, etc.) is a deliberate **later, optional** enhancement, not this phase, because it requires:
- re-scoping `homepage.spec.ts` Test 5 from `.home-index a` to `.home-pillars a.pillar` (so the strict 3-href set covers only the pillar anchors); and
- for *filosofia specifically*, tightening the three `'/louis-lavelle/'` **substring** guards into legacy-pattern guards (they were written when the only possible occurrence was the retired legacy route; the canonical pt route legitimately contains that substring). Literatura deep-linking has no such obstacle.

Document this tradeoff; default to hub-only links now.

### 6.5 Ensuring no legacy link returns

`/pt/literatura/` and `/pt/filosofia/` remain the canonical section destinations; `/podcast/francais/` is the canonical Vox Français destination. The Literatura live route flows from `pt.routePrefix` (data), never a hand-assembled `/literatura/`. The legacy guards (`legacy-lavelle-removed`, `redirects-clean-break`) stay green.

---

## 7. SEO / discovery / accessibility

### 7.1 Structured data — keep it minimal

The homepage JSON-LD lives in `src/index.md` frontmatter as a 4-node `@graph`: `Organization`, `WebSite`, `ItemList #focos` (the 3 pillars), `CollectionPage #webpage` (`about[]` = Literatura + Filosofia; `mainEntity → #focos`). Authored non-www, normalized to `www.skepvox.com` at build (`config.ts` `normalizeHeadUrls`).

- **Do NOT enrich the graph with per-book `CreativeWork`/`Book` nodes** and do **not** fold the live books into `#focos`. Per [`seo-strategy.md`](seo-strategy.md) ("Humans browse hubs. Search engines and AI land on leaves."), book-level structured data belongs on each book **hub leaf**; duplicating it on the homepage creates competing canonical signals and pushes toward the catalog the redesign rejects. Surface live content as **crawlable HTML rows/links** (the pillar links already are), not as JSON-LD.
- **Required `#focos` edit for the Vox Français narrowing:** position 3 changes from `{name:"Podcasts", url:".../podcast/"}` to `{name:"Vox Français", url:".../podcast/francais/"}`. Keep `numberOfItems: 3`. This keeps the structured data consistent with the visible IA. (`about[]` already omits Podcasts; leave it as the two reading sections, or optionally add a Vox Français `Thing` for parity — a flagged choice, not a silent change.)
- Update the homepage meta/OG `description` text only if the pillar wording changes; head dedup means the page-level frontmatter value ships (config's short site description is superseded). Keep the explicit `robots: index, follow, max-snippet:-1, …` directive.
- Author any new JSON-LD URL absolute and on a `skepvox.com` host so `normalizeSiteUrl` rewrites it to www; relative/off-host strings ship un-normalized.

### 7.2 Don't make it noisy

The homepage stays excluded from `llms.txt` (`ignoreFiles: ['index.md', …]`); the books/episodes enter the LLM output via their own hubs. `/` stays in the sitemap; chapter leaves stay pruned by marker. No new routes are added (the redesign surfaces existing data), so no sitemap/llms rule changes are needed. Net: discovery surface is unchanged except the single `#focos` position-3 URL.

### 7.3 Accessibility expectations

Preserve the already-correct bones and extend them to every new live line:

- **Real headings:** one `<h1>` (wordmark) + one `<h2>` per pillar; `nav aria-label="Seções"`. The live sub-line is a `<p>`/`<span>`, **not** a heading — do not break the single-h1 / h2-per-pillar structure.
- **Clear link labels:** each pillar is a full `SkLink` whose accessible name is its visible `<h2>`. No icon-only navigation. The `→` stays `aria-hidden`.
- **Tap targets:** whole-row hit area, generous vertical padding (`--sk-space-5`, relaxed on mobile).
- **No layout shift:** live content must be **server-rendered** (build-time data import), never client-fetched. The `homepage.spec.ts` no-overflow + 3-distinct-row-tops invariants must keep passing.
- **Focus/hover/motion:** delegate focus to `SkLink`; gate hover under `@media (hover:hover) and (pointer:fine)`; reduced-motion floor already ships.

---

## 8. Performance boundary

- **Metadata only, never prose.** The homepage may read book **metadata summaries** (title, `segmentCount`, route) and podcast **manifest** fields (title, href, count). It must **never** import book prose or segment bodies.
- **No direct pipeline-export import from `Home.vue`.** Route through the card modules (§3.3) — this both satisfies the allow-list and means the homepage's transitive dependency is the same `pipeline-export-segments.json` the hubs already bundle (it includes a ~361-entry `segments` metadata array; it is bundled but not rendered — the hubs already accept this cost). The podcast helper reads only the small manifests. Acceptable data size: a few KB of fields actually rendered.
- **SSR / static.** All live lines render server-side at build (like `filosofia-cards.ts` today). No client fetch, no hydration-dependent content, no spinner.
- **No client-heavy interaction.** No carousels, no "load more", no audio player on the homepage. The page is static text + 3 links. Any interaction beyond pointer-gated hover must be justified against the calm-index mandate (default: none).

---

## 9. Implementation slices (H1–H6)

Small, reviewable, sequenced. Each lands independently and keeps the suite green.

- **H1 — Contract & inventory (doc/data).** Ratify this assessment as the design contract. Confirm: the `pillars.ts` shape; the link model (hub-only links + text live lines, §6.4); the Vox Français narrowing and the Español/English "public-but-unpromoted" stance; the `…FeaturedWork()` / `voxFrancaisLatest()` data contracts; the filosofia title-as-text constraint; the footer-seam fix deferred to H5. No code. (This doc + a short "decisions locked" note.)

- **H2 — `pillars.ts` + nav/homepage unification + Vox Français narrowing.** Create `pillars.ts` (the 3 pillars incl. **Vox Français → `/podcast/francais/`**, `activeMatch ^/podcast/francais/`). Refactor `config.ts` nav and `Home.vue` to iterate it (blurbs move into `pillars.ts`). Update `src/index.md` `#focos` position 3 → Vox Français, and `404.md` to mirror the new visible IA. Update `homepage-ia-pillars.spec.ts` (nav order → `['Home','Literatura','Filosofia','Vox Français']`, link `/podcast/francais/`, 404 links) and `homepage.spec.ts` (`PILLARS` label/href, Test 5 set → `['/podcast/francais/','/pt/filosofia/','/pt/literatura/']`). **No live content yet** — this slice is the IA narrowing + route centralization, fully test-aligned. Español/English untouched and still built/indexed.

- **H3 — Live previews for Literatura + Filosofia.** Add `literaturaFeaturedWork()` / `filosofiaFeaturedWork()` to the allow-listed card modules; render one text sub-line per reading pillar in `Home.vue` (title + `N trechos`). **Filosofia: title only, no author, no deep link.** Evolve `homepage-ia-pillars.spec.ts` Test 3 with **one** SSR-content substring (e.g. `dist/index.html` contains `Brás Cubas`) to prove live data shipped — no per-book matrix.

- **H4 — Vox Français live preview.** Add `voxFrancaisLatest()` reading the francais manifest; render the Vox Français sub-line (latest released episode title and/or "3 episódios"), text only, with no false "new" claim. Keep it within the same calm row grammar. (Reuse `episodesToCards` only if a richer line is ever wanted; default is a plain title.)

- **H5 — Visual polish: echo grammar, dark/light, footer harmony, mobile QA.** Re-point homepage hairlines/eyebrow to `--sk-reading-hairline` / `--sk-reading-kicker`; add the masthead trailing hairline; verify the live lines read calm in both modes; land the owned `.VPFooter` override so the footer matches the body base in light (and check it stays flush in dark); mobile QA (no overflow, wrapping, tap targets). One-time visual QA, not new permanent tests (beyond what H3/H6 add).

- **H6 — Test simplification + guardrail tidy.** Re-scope `homepage.spec.ts` Test 5 to `.home-pillars a.pillar` (so the strict 3-href pillar check is robust to future live links) and add the calm-vs-bloat guard (§10). Retire any now-redundant assertions; confirm no per-book/per-episode tests crept in. Confirm `pipeline-export.spec.ts` allow-list is still exactly the 5 files (i.e., `Home.vue` never imported the JSON).

(Names are adjustable; the sequence — *narrow & centralize → reading previews → podcast preview → polish → test tidy* — is the load-bearing part.)

---

## 10. Test strategy

**Goal: prove the gateway works without growing the suite.** Distinguish three tiers:

**A. Permanent architectural guardrails — already exist; do NOT re-add.** Legacy-route absence (`legacy-lavelle-removed`, `redirects-clean-break`), sitemap inclusion/pruning (`sitemap`), a11y floor + focus delegation (`a11y-floor`, with `Home.vue` named), pointer-gated hover (`nav-interaction-states`, with `Home.vue` named), token layer (`color-tokens`), homepage light↔dark (`mobile-theme-toggle`), and the **pipeline-export consumer allow-list** (`pipeline-export.spec.ts`) all cover redesign risks at the architecture level. Keeping `Home.vue`'s anchors in `SkLink` and routing data through the card modules keeps them green for free.

**B. Focused homepage smoke — EVOLVE the two existing specs (≈3–5 new assertions total, no new spec file):**
- `homepage-ia-pillars.spec.ts`: update nav order/links + 404 to the Vox Français IA (H2); add **one** SSR live-title substring (H3) proving data reached `dist/index.html`; keep the `'/louis-lavelle/'` + `'Louis Lavelle'` absence checks green (the design guarantees it).
- `homepage.spec.ts`: update `PILLARS` + the Test 5 href set to the Vox Français IA (H2); re-scope Test 5 to `.home-pillars a.pillar` (H6) so the strict 3-link check is robust; add **one** assertion that the live-content container/line is present and statically rendered (target a stable class the redesign owns, e.g. `.pillar__live`).
- Add **one** calm-vs-bloat guard: the homepage live rows stay bounded (e.g. ≤1 live line per pillar, no live row group exceeds the pillar count) — reuse the existing masthead-size bound + no-overflow + single-column checks unchanged.
- Add **one** local no-legacy line to the live-data test: zero `a[href^="/louis-lavelle/"]`, no `Louis Lavelle` / `works.json` strings in the rendered homepage (cheap insurance local to the redesign).

**C. One-off visual QA — not encoded as tests.** Footer/body harmony in both modes, the hairline/kicker echo, mobile wrapping. Do these by eye in H5; do not add screenshot/snapshot specs.

**Explicitly avoid:** per-book or per-episode homepage tests (the catalog is data-driven and grows — assert the *mechanism* with one representative substring, not the list); broad DOM/visual snapshots (break on every blurb/title/episode change); a second homepage dark-render spec (the mobile toggle suffices); a homepage footer spec unless the footer override in H5 demonstrably needs one (lowest priority).

**Minimal set proven:** links resolve (Test 2 + nav), data source present (one SSR substring), no legacy route (existing guards + one local line), SSR content present (substring + container assertion), a11y basics (existing `a11y-floor` + heading structure unchanged), no prose bloat (calm-vs-bloat cap). That's the whole delta — roughly 3–5 assertions, all in the two existing specs.

> Test-running note: both homepage specs require a prior `pnpm build`; `homepage.spec.ts` hits the live `vitepress preview` (port 4399, `reuseExistingServer` locally — restart it after a rebuild), `homepage-ia-pillars.spec.ts` reads `dist/` statically. New SSR-content assertions belong in the **file-based** spec.

---

## 11. Do-not-do list

- **No route migration.** `/pt/literatura/`, `/pt/filosofia/`, `/podcast/*` stay where they are. No locale prefixes on podcasts.
- **No redirects.** The clean break is preserved (`_redirects` must not appear).
- **No podcast IA/locale move.** Vox Français narrowing is *visible-IA only*; the broader `/podcast/` hub and Español/English keep their surfaces, data, RSS URLs, sitemap, and search/LLM visibility. **Do not delete or unpublish Vox Español or Vox English.**
- **No old literatura machinery.** No `works.json`, no `build-literatura-manifests.py`, no `WorkContents`/`ReadingNav`, no `reading-nav.json`/`segment-manifest.json`. Read only `pipeline-export-segments.json` (metadata-only).
- **No direct pipeline-export import from `Home.vue`.** Route through the allow-listed card modules.
- **No full shell rewrite.** Evolve `Home.vue` + add `pillars.ts` + thin helpers. Do not rebuild the rented `@vue/theme` shell.
- **No new icon dependency.** Keep the plain Unicode `→`; the `ReaderIcon` registry is closed.
- **No all-prose import / no client fetch.** Metadata summaries only, server-rendered.
- **No marketing landing page.** No hero, no CTA, no orbs/gradients/blobs, no split-hero, no generic card grid, no dashboard metrics.
- **No author framing on the homepage.** No `Louis Lavelle`, no author bios/portraits; book titles only.
- **No brand-asset work.** Favicon/OG/logo/manifest/Apple-touch is the separate **Brand Asset System** phase (planned B3); `logo.svg` is still off-token (`#42b883`). Reference it; do not implement it here.
- **No owned-footer / social-link build.** Deferred behind the Brand Asset System (the "second visual language" risk). The only footer touch allowed here is the small token-harmony override in H5.

---

## 12. First implementation prompt (recommended next slice — H2)

> **Task: H2 — centralize the homepage/nav pillars into `pillars.ts` and narrow the visible third pillar to Vox Français.**
>
> Repo: `skepvox-website`, branch `develop`. Read `docs/homepage-pillar-gateway-assessment.md` first. This slice is IA narrowing + route centralization only — **no live content yet**.
>
> 1. Create `.vitepress/theme/components/pillars.ts`: a pure-data module (no `.vue`/JSON/pipeline-export imports) exporting `interface Pillar { key; label; href; activeMatch; blurb }` and `PILLARS: Pillar[]` in order — **Literatura** `/pt/literatura/` (`^/pt/literatura/`), **Filosofia** `/pt/filosofia/` (`^/pt/filosofia/`), **Vox Français** `/podcast/francais/` (`^/podcast/francais/`). Move the three current `Home.vue` blurbs into the `blurb` fields (give Vox Français a calm one-liner, e.g. "Francês em cenas curtas, com áudio, transcrição e notas.").
> 2. Refactor `Home.vue` to render its pillar rows by iterating `PILLARS` (keep the exact masthead, the `.pillar` grid, the `→` span, `SkLink`, and the pointer-gated hover). Markup/DOM for the three rows must stay structurally identical except label/href/blurb.
> 3. Refactor `config.ts` `nav` so the Literatura/Filosofia/Vox-Français entries derive `text`/`link`/`activeMatch` from `PILLARS` (keep `Home` `{ text:'Home', link:'/' }` separate). Result: nav text order becomes `['Home','Literatura','Filosofia','Vox Français']`.
> 4. Update `src/index.md` JSON-LD `#focos` ItemList position 3 → `{ name:"Vox Français", url:"https://skepvox.com/podcast/francais/" }` (keep `numberOfItems: 3`; non-www source is normalized to www at build). If the meta/OG `description` names "podcasts" generically, leave it unless it now reads wrong — minimal change.
> 5. Update `src/404.md` to mirror the visible IA: `[Vox Français](/podcast/francais/)` in place of `[Podcasts](/podcast/)` (keep Literatura/Filosofia).
> 6. Update the two homepage specs to the new IA and keep them green: in `tests/homepage-ia-pillars.spec.ts` change the nav-order expectation to `['Home','Literatura','Filosofia','Vox Français']`, the expected link to `'/podcast/francais/'`, and the 404 assertion to the Vox Français link; in `tests/homepage.spec.ts` update the `PILLARS` constant (label `Vox Français`, href `/podcast/francais/`) and Test 5's sorted set to `['/podcast/francais/','/pt/filosofia/','/pt/literatura/']`. Do **not** change the `'/louis-lavelle/'` / `'Louis Lavelle'` absence checks.
> 7. **Do not touch** Vox Español / Vox English pages, episode data, RSS/feed artifacts, the `/podcast/` hub, the podcast config sidebar, media, or any generated data — they stay public, built, indexed, and sidebar-reachable; they are only removed from the homepage/nav primary path.
> 8. Verify: `pnpm build` then `pnpm test` (rebuild the preview server first). Confirm `homepage.spec.ts` + `homepage-ia-pillars.spec.ts` pass, the legacy-lavelle / redirects / sitemap / pipeline-export-allow-list specs stay green, and `pipeline-export.spec.ts`'s consumer list is unchanged (you must **not** import `pipeline-export-segments.json` anywhere new in this slice).
> 9. Commit on `develop` (do not push). Then H3 adds the Literatura/Filosofia live previews via `…FeaturedWork()` exports in the allow-listed card modules.

---

## Appendix — conventions & cross-links

**Slice-naming.** Capital-letter+integer series are namespaced per workstream: `A1–A6` = IA / locale-rooting; `B1–B6` = literatura pipeline rollout; `Slice 1/1A–1C/2–5` = design-system roadmap; `Slice A–E` (with `C1–C4`) = reader-template foundation; `Slice 2A–2G` = export ingestion. **`H1–H6` = Homepage gateway** — the letter `H` is unused as a slice prefix elsewhere, so it does not collide. When citing executed literatura work, use the *executed* numbering from [`reading-app-website.md`](reading-app-website.md) (B2/B3 = Brás Cubas live, B5 = consolidation that retired legacy `/literatura/`), not the planned Phase-B list.

**Load-bearing prior decisions this doc must not contradict:** calm editorial index (A6), not a hero/dashboard/cards; tokens-first, no cards/shadows; route `/` + `page:true` + owned `Home.vue`; `SkLink`-only links; closed `ReaderIcon` set; no `works.json` / no legacy `/literatura/`; brand assets and the owned footer are **separate later phases**.

**Primary sources (read first-hand for this assessment):**
- `.vitepress/theme/components/Home.vue`, `SkLink.vue`, `CardGrid.vue`, `cards.ts`, `literatura-cards.ts`, `filosofia-cards.ts`, `authors.ts`, `episodes.ts`, `pillars.ts` (to be created), `PipelineWorkContents.vue`, `PipelineReaderHeader.vue`, `ReaderIcon.vue`, `reader-icons.ts`, `reader-shell.ts`, `NavBarTitleBrand.vue`
- `.vitepress/theme/styles/vars.css`, `pages.css`, `utilities.css`; `node_modules/@vue/theme/.../VPFooter.vue`
- `.vitepress/theme/data/pipeline-export-segments.json`; `src/podcast/shows.json`, `src/podcast/francais/episodes.json`
- `.vitepress/config.ts`; `src/index.md`; `src/404.md`; `src/pt/literatura/index.md`, `src/pt/filosofia/index.md`, `src/podcast/index.md`, `src/podcast/francais/index.md`
- `tests/homepage.spec.ts`, `homepage-ia-pillars.spec.ts`, `pipeline-export.spec.ts`, `legacy-lavelle-removed.spec.ts`, `a11y-floor.spec.ts`, `nav-interaction-states.spec.ts`, `sitemap.spec.ts`, `color-tokens.spec.ts`, `mobile-theme-toggle.spec.ts`, `filosofia-hubs.spec.ts`

**Related docs:** [`locale-rooted-website-ia-assessment.md`](locale-rooted-website-ia-assessment.md) (A6 frame; B3 Brand Asset System) · [`reading-app-website.md`](reading-app-website.md) (current live IA) · [`navigation-owned-shell-assessment.md`](navigation-owned-shell-assessment.md) (owned-shell posture, restraint guardrails, footer-only-on-home) · [`sidebar-local-nav-model.md`](sidebar-local-nav-model.md) (Home no-rail posture) · [`reader-icon-symbol-system-assessment.md`](reader-icon-symbol-system-assessment.md) (closed icon set) · [`seo-strategy.md`](seo-strategy.md) (hub-vs-leaf doctrine — cite the doctrine, not its stale legacy route examples) · [`social-presence-footer-strategy.md`](social-presence-footer-strategy.md) (deferred footer/social).
