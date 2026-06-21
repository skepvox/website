# skepvox Product Theme Roadmap Assessment

_Assessment only. No code changed beyond this file. Date: 2026-06-21._

This document maps where skepvox sits today on `VitePress + @vue/theme@2.3.0` (patched), where the docs theme has become a ceiling, and a staged path to owning the layout/design layer without a rushed rewrite — preserving build, SEO, local search, LLM output, generated content, and the existing test suite.

It is grounded in a full read of the repo (homepage, config, theme entry, patch, CSS tokens, every page-type, the Python generators, and the eight Playwright specs). File paths are cited inline.

---

## Executive Thesis

**What skepvox is becoming.** A reading product with three corpora — a philosophical library (Louis Lavelle, French originals + pt-BR translations), a generated classic-literature library (Brazilian authors, author/work/chapter surfaces), and language-learning podcasts (show/episode landings + synced-transcript players). The unifying job of every page is _calm, continuous, literary reading_ — text-first, restrained, beautiful. Not a documentation site.

**What it must own that `@vue/theme` cannot give.** A docs theme is built around a symmetric "sidebar → doc body → prev/next pager → outline" model where navigation is the file tree. skepvox needs the opposite: a **reading shell** (one measured column, a real book-like chapter header, manifest-driven "next chapter," no on-page outline), a **podcast learning shell** (synced transcript as the hero), and **hub/landing shells** (author/work/show grids) — each a distinct page _type_, not a styled doc. The docs theme gives none of these as first-class concepts; skepvox is already hand-building them at the edges.

**The moat is not the theme — it is the content model.** The defensible assets are the generated corpus and the manifests/generators that produce it: `scripts/build-reading-nav.py` → `reading-nav.json`, `scripts/build-episode-cues.py` → `*.cues.json`, `scripts/sync-podcast-lesson-pages.py` → episode `.md` + `episodes.json`/`shows.json`, plus the SEO/canonical/sitemap/LLM machinery in `.vitepress/config.ts`. These are framework-agnostic and would survive any theme migration. The theme is replaceable; the corpus and manifests are the product.

**The single most important factual correction to the brief.** `patches/@vue__theme@2.3.0.patch` does **not** forward content slots. It touches exactly two files — `VPNavBarSearch.vue` (enables VitePress _local_ search in an Algolia-only theme) and `support/utils.ts` (makes link normalization respect `cleanUrls`). The `content-top` / `content-bottom` slots used in `.vitepress/theme/index.ts` are **native** to `@vue/theme`: `node_modules/@vue/theme/src/vitepress/components/VPApp.vue` declares ~10 slots (`banner`, `navbar-title`, `sidebar-top/bottom`, `content-top/bottom`, `aside-top/mid/bottom`, `footer-before/after`). **skepvox already has ten upstream injection points with no patch dependency, and is only using three.** This materially lowers the cost of the recommended path: owned page-type shells inject through native seams rather than a fork.

**"iOS-level sophistication" here** means: one calm reading column with a real text face; a single ink expressed as alpha steps; motion that only ever confirms state (active cue, hover, scroll-into-view) and never decorates; touch targets and safe-area awareness; the synced transcript as the _one_ ambitious element and everything else quiet. It does **not** mean copying Apple chrome, adding app-style controls, hero sections, or badges.

**Recommended path: Option B** — build a skepvox-owned layout layer _inside_ VitePress. The repo is already a partial Option B that works (the home page is `page: true` + an owned `Home.vue`; `ReadingNav`, `PodcastPlayer`, the mastheads, and `CardGrid` are owned components). The near-term gap is not architecture — the seam is proven — it is the **design system**: there is no owned token foundation, no reading text face, and the most important pages (chapter leaves) have the weakest header.

---

## Current Surface Map

Surfaces are kept separate. Maturity is 1 (raw docs Markdown) → 5 (owned product surface). "Owner" is the surface that actually renders it.

### Reading surfaces (the product core)

| Surface | Role | Maturity | Owner | Key friction | skepvox should own |
|---|---|---|---|---|---|
| **Literature chapter leaf** (`…/vidas-secas/00-00-001-mudanca.md`) | Full-text reading; 35rem measure, no chrome | **5** read / **2** shell | generated `.md` + `ReadingNav.vue` + `pages.css` `.VPContentDoc:not(.has-aside)` + `vars.css` `--sk-reading-*` | Reading mode gated entirely on the `:not(.has-aside)` class; header is a generated back-link + a `##` chapter heading (`## Capítulo 1 — Mudança`), not an owned masthead | A real `ReadingHeader`; a reading-leaf layout instead of CSS-by-frontmatter |
| **Lavelle chapter/segment leaf** (`de-l-etre/00-00-001-…md`, `a-consciencia-de-si/…`) | Same, fr + pt-BR | **5** read / **2** shell | same as above; `ReadingNav` keyed by `page.relativePath` | generated back-link + a `##` chapter heading (`## Chapitre 1. De la primauté de l'être`); `chapter-title` vs `segment-title` key asymmetry; silent nav failure if manifest stale | Per-language reading rhythm; manifest validity check |
| **Reading navigation** (`ReadingNav.vue` + `reading-nav.json`) | Quiet `book · author` context (top) + prev/next (bottom) | **5** | `ReadingNav.vue` in `content-top`/`content-bottom`; `build-reading-nav.py` | Hardcoded `pt-BR`/`fr` labels; no i18n key; no frontmatter `prev/next` override | Already owned; parameterize labels/globs |
| **Work hub** (`vidas-secas.md`, `de-l-etre.md`, `a-consciencia-de-si.md`) | Book landing + chapter TOC | **3** | Markdown + `outline: 2` (forces aside) + hand-written `hasPart[]` JSON-LD | `outline: 2` shows a docs outline on a literary work; 313-line hand-maintained `hasPart[]` Chapter JSON-LD | A work-hub shell; auto-generate JSON-LD from `reading-nav.json` |
| **Author hub** (`graciliano-ramos/index.md`) | Bio + portrait + works grid | **4** | Markdown + `works.json` + `CardGrid` + `.author-portrait` CSS | Sidebar pager noise; `works.json` hand-curated; portrait sized in Markdown | Auto-generate `works.json`; an author-schema component |
| **Literatura hub** (`literatura/index.md`) | Author grid | **3** | Markdown + `CardGrid` + hardcoded `authors.ts` | Author cards hardcoded in `authors.ts`, not data-driven | Data-driven author registry |
| **Lavelle hub** (`louis-lavelle/index.md`) | Corpus index + bio + JSON-LD | **4** | Markdown + `CardGrid` + Person/ItemList JSON-LD | `outline: 2` aside is noise; `footer: false` to kill pager | Hub shell variant |

_Chapter leaves carry a **split score**: the reading typography and manifest navigation are mature (**5**), but the page shell and chapter header are not owned (**2**). The visible heading is a generated back-link plus a `##` chapter heading (e.g. `## Capítulo 1 — Mudança`, `## Chapitre 1. De la primauté de l'être`) — an h2 with the green accent rule — not a literary masthead, and reading mode rests entirely on the fragile, untested `.VPContentDoc:not(.has-aside)` class._

### Podcast surfaces

| Surface | Role | Maturity | Owner | Key friction | skepvox should own |
|---|---|---|---|---|---|
| **Podcast hub** (`podcast/index.md`) | Three-show grid | **3** | Markdown + `CardGrid` + `shows.json` | `shows.json` manual; cards in `--vt-c` color world | Show-card presentation layer |
| **Show pages** (`podcast/{francais,espanol,english}/index.md`) | Series masthead + episode grid | **3→4** | `PodcastShowHeader.vue` + `CardGrid` + `episodes.json`; `footer: false` | `footer: false` is the only lever vs the sidebar pager; no cover/brand inlay | Full show-page layout |
| **Episode pages** (`podcast/francais/001-le-badge.md`) | Header + player + learning guide | **3** | generated `.md` + `PodcastEpisodeHeader` + `PodcastPlayer`; `outline: 2`, `footer: false` | `outline: 2` sets `has-aside` → disables reading typography for the guide prose; header/player injected via `<script setup>`, not a layout | A dedicated episode layout that separates player from guide prose |
| **Episode header** (`PodcastEpisodeHeader.vue`) | Eyebrow · title · lede masthead | **4** | owned component | CSS specificity battle vs `.vp-doc h1`; no cover (by design) | The masthead grammar as a reusable standard |
| **Player + transcript** (`PodcastPlayer.vue`) | Synced click-to-cue transcript, mediaSession | **5** | owned component (~479 lines) + `.cues.json` | Mobile sticky broken by `@vue/theme` `overflow:auto` → JS `position:fixed` pin; depends on `--vt-nav-height` | The signature surface; eventually a layout that restores native sticky |
| **Buffer notice** (`BufferNotice.vue`) | Pre-publication banner | **3→4** | owned component in `content-top` | path-sniffing language detection; hardcoded copy | Editorial preview-state system |

### Shell / global surfaces

| Surface | Role | Maturity | Owner | Key friction | skepvox should own |
|---|---|---|---|---|---|
| **Homepage** (`src/index.md` `page: true` + `Home.vue`) | Hero + 3 section cards | **3** | **owned** `Home.vue` | On old `--vt-c-*` tokens + 76px/900 hero; a _third_ card pattern (`.vt-box`); predates the literary direction | Already owned; needs to adopt the design system |
| **Navbar + brand** | Global header, search, toggle, social | **3** | `@vue/theme` `VPNavBar` + owned `NavBarTitleBrand` (`navbar-title` slot) | Layout/order 100% theme CSS | Keep renting for now |
| **Sidebar / mobile drawer** | Section tree | **3** | `@vue/theme` `VPSidebar` ← static `config.ts` `sidebar` | Hand-maintained; also drives the broken pager | Manifest-driven sidebar eventually |
| **Search** | Local full-text modal | **3** | VitePress `VPLocalSearchBox` via the **patch** | Brittle `--vp-*`→`--vt-*` CSS bridge (`local-search.css`); patch is a version-lock smell | Wrap/own token mapping |
| **Doc footer / pager** | prev/next | **2** | `@vue/theme` `VPContentDocFooter` | Derives prev/next from **sidebar**, ignores frontmatter; `footer:false` is all-or-nothing | Replace with owned manifest pager (mostly done via `ReadingNav`) |
| **Aside / outline** | On-page TOC | **2** | `@vue/theme` `VPDocAside` ← `outline` frontmatter | Binary; podcast pages abuse `outline:2` to opt _out_ of reading typography | Keep; replace when reading shell lands |
| **Appearance toggle** | Dark/light | **1** | `@vue/theme` | **Hidden < 1280px — mobile users cannot toggle at all** | Surface a mobile-reachable toggle |
| **Site footer** | Copyright | **1** | `@vue/theme` `VPFooter` | Renders **only** on the home page (`page: true`); invisible on every doc/reading page | Decide if a global footer is wanted |

### SEO / LLM / search / manifest / test surfaces (the moat — framework-agnostic)

- **Canonical/JSON-LD normalization** — `config.ts` `normalizeSiteUrl`/`normalizeJsonLdUrls`/`normalizeHeadUrls` in `transformPageData` (forces `www.skepvox.com`, https, extensionless).
- **Sitemap de-emphasis** — `sitemap.transformItems` + `isChapterRoute` drop chapter leaves from `sitemap.xml` while keeping them indexable and searchable; buffer routes (`bufferRoutes`, frontmatter `buffer: true`) excluded.
- **Per-language `<html lang>` + `og:locale`** — `config.ts` `transformHtml` string-swaps by path/frontmatter.
- **LLM output** — `vitepress-plugin-llms` + `scripts/render-podcast-player-llms.py` expands `<PodcastPlayer>` tags to plain Markdown in `llms-full.txt`.
- **Manifests** — `reading-nav.json` (work-route keyed `[slug, displayTitle]`), `episodes.json`/`shows.json` (buffer-excluded), `*.cues.json` (deterministic, gap-punctuation repaired).
- **Tests** — eight Playwright specs (`sitemap`, `reading-nav`, `podcast-player`, `podcast-show-page`, `literature`, `louis-lavelle`, `homepage`, `consolidation`), ~79 `test()` blocks, run after `pnpm build`. These lock every invariant above and are the merge gate.

---

## Product And Design Diagnosis

**Verdict: mid-maturity, on the right path, ~30–40% tokenized.** Several surfaces are already near product-grade — the `PodcastPlayer` synced transcript, the three-part masthead grammar (`eyebrow → masthead title → rule → lede`), the single-ink reading palette, manifest-driven `ReadingNav`, and `mediaSession` wiring. This is genuinely _not_ "a docs site with prettier CSS" in intent. But it is **not yet a design system**: reading rhythm, cue colors, and dark/light are real tokens; **type scale, font, spacing, motion, focus, radius, and the card primitive are hardcoded and inconsistent across surfaces.**

The specific gaps that keep it reading as "docs," in leverage order:

1. **The reading body inherits `@vue/theme`'s UI sans.** A literature product whose body copy is set in the same font as its nav chrome reads as documentation. Giving the leaf `.vt-doc` scope a real text face (`--sk-reading-font`) is the single highest-leverage move toward "literary."
2. **No owned token foundation.** `--sk-reading-*` are a thin alpha layer over `@vue/theme`'s `--vt-c-*`: the reading ink `rgba(33,53,71,*)` _is_ `@vue/theme`'s `#213547`, and the brand green `#42b883` _is_ Vue's green (`--vt-c-green`). There is no `--sk` type scale, spacing scale, motion, focus, radius, or semantic (ink/surface/accent/active) layer.
3. **The chapter leaf — the product — has the weakest header.** Its heading is a generated back-link (`[Voltar ao livro]` / `[Retour au livre]`) followed by a `##` chapter heading (e.g. `## Capítulo 1 — Mudança`, `## Chapitre 1. De la primauté de l'être`) — an h2 styled ~22→24px with the green `::before` accent rule — plus `ReadingNav`'s 0.76rem `book · author` line above. That is a generated heading, not an owned literary masthead, while podcast episodes get a full `PodcastEpisodeHeader`. This is inverted.
4. **Three competing card patterns** — `CardGrid.vue` (12px radius, `--vt-c` colors), `Home.vue` `.vt-box` (8px, hardcoded), and implicit hub markdown lists. The home grid and hub grids are visibly different objects.
5. **Green overload.** `#42b883` is simultaneously the h2 accent rule, the active cue, every focus ring, the eyebrow `·` separator, and the `ReadingNav` direction labels. When the one accent is everywhere, nothing reads as the signal. Green should earn _one_ job (active/orientation state) and be demoted elsewhere.
6. **Three reading widths.** Chapters at 35rem, standfirsts at 42rem, ledes at 44rem, and the podcast transcript free-width — the "one calm column" feeling is undercut. The synced transcript _is_ reading and should obey the prose measure.
7. **A11y holes in shipped components.** `focus-visible` rings exist in only three places (`Home .vt-box`, `CardGrid` link, `.vox-cue`); the `PodcastShowHeader` listen-links and `ReadingNav` prev/next links have hover but **no focus ring**. Reduced-motion is enforced only inside `PodcastPlayer`, not globally. `--sk-reading-muted` (0.62 alpha) at 0.72–0.78rem needs a contrast check.
8. **No visual-QA harness, and the load-bearing layout class is untested.** All reading typography hinges on `.VPContentDoc:not(.has-aside)`; one stray `outline`/`aside` frontmatter change silently demotes a chapter out of the reading world with no test catching it.

**What is already right and must be protected:** the single-ink calm palette; text-first restraint (no episode cover art v1, text "listen" links not badges, native `<audio>` with no custom speed control); honest structure (episode number derived from id, real lesson counts, manifest order _is_ chapter order); localized microcopy (`Épisode/Episodio/Episode`, three-language `BufferNotice`); the synced transcript as the one ambitious element.

---

## Theme Dependency Audit

Classification per concern: **keep** (rent as-is) · **wrap** (override locally) · **replace** (owned component inside VitePress) · **defer** (until a fuller theme) · **danger** (do not patch).

| Concern | Owner today | Class | Notes |
|---|---|---|---|
| Layout shell (`VPApp`/`VPContent`) | `@vue/theme` | **defer** | Rent until owned page-types dominate; `overflow:auto` on the content wrapper breaks CSS `sticky` (forces the `PodcastPlayer` JS pin). |
| Nav bar | `@vue/theme` + owned `NavBarTitleBrand` | **keep** | `navbar-title` slot is enough for now. |
| Sidebar / mobile drawer | `@vue/theme` ← `config.ts` | **keep** (data) / **defer** (visual) | Data is skepvox-owned (static); also the source of the broken pager. |
| Content width / reading measure | `pages.css` `--sk-reading-measure` | **wrap** | Owned permanently; never adopt theme typography as base. The outer 688px wrapper is hardcoded in the theme — keep the inner 35rem under it. |
| Doc footer / pager | `@vue/theme` `VPContentDocFooter` | **replace** | Already replaced on leaves by `ReadingNav` + `footer:false`. The defining product friction. |
| Aside / outline | `@vue/theme` `VPDocAside` | **keep** | Low priority; podcast `outline:2` opt-out is a stable (if ugly) trick. |
| Search | patched `VPNavBarSearch` + `VPLocalSearchBox` | **wrap** | Works; the `--vp-*`→`--vt-*` CSS bridge in `local-search.css` is fragile on VitePress bumps. |
| Footer | `@vue/theme` `VPFooter` | **defer** | Only renders on the home page; decide if a global footer is wanted. |
| Dark-mode toggle | `@vue/theme` | **keep** | Tokens are dark-aware; but the toggle is hidden < 1280px (mobile gap). |
| Typography defaults | overridden in `pages.css` | **wrap** | Dual `.vt-doc`/`.vp-doc` selectors are mandatory and fragile. |
| Content slots | native `@vue/theme` (VPApp) | **keep** | ~10 native slots; using 3. **Not a patch.** The primary owned-layout seam. |
| Cards / player / mastheads | owned components | **replace (done)** | Zero theme coupling beyond CSS-var reuse. Carry forward as-is. |

**Patch as a maintenance smell.** The patch is small (≈119 lines, two files) and defensible, but it _is_ a smell: skepvox already had to patch `node_modules` twice to get basic product behavior a docs theme didn't anticipate — local search (`VPNavBarSearch.vue`) and clean URLs (`support/utils.ts`). Both are version-locked to `vitepress@^1.6.4` / `@vue/theme@2.3.0` (`pnpm.patchedDependencies`); a major bump forces re-derivation. **Dangerous to patch further:** the layout shell, `VPContentDocFooter`, and aside internals — their class names (`.vt-doc`, `has-aside`) are load-bearing for all of `pages.css` and can change on a minor bump. Prefer native slots + scoped CSS over deeper patches.

**Carry forward in any migration:** card architecture, the player interaction model, the reading measure/typography tokens, frontmatter-driven nav, and the manifest/generator pipeline. **Do not carry forward:** the patch, the dual `.vt-doc`/`.vp-doc` selectors, the `@vue/theme` appearance toggle, and the `footer:false`-as-pager-lever hack.

---

## Recommended Architecture Path

**Choose Option B now** — a skepvox-owned layout layer inside VitePress — and treat A as the baseline it builds on, C as the eventual destination, and D as out of scope until there is concrete native pressure.

| | **A — Stay on @vue/theme** | **B — Owned layer inside VitePress** | **C — Full custom VitePress theme** | **D — Leave VitePress** |
|---|---|---|---|---|
| **Benefits** | Zero migration; inherits navbar/search/i18n/dark free; tiny patch surface; all 8 specs pass | Repo is already a partial B and works; native slots + in-markdown components are the owned layer with no patch; turns the pager/leaf frictions into owned surfaces; incremental & reversible; keeps search/sitemap/LLM/cleanUrls | Total ownership; design pager/page-types from scratch; drop the patch entirely | Unlimited UI ceiling; app shell, transitions, offline; closest to a shared native stack |
| **Risks** | Hard product ceiling (pager broken-by-design); identity stays docs-shaped; couples to theme internals | Still renting outer chrome (navbar/sidebar); discipline risk (must keep prose in the Markdown body for search/LLM); more specs to maintain | Must re-implement navbar/sidebar/search/i18n/dark/mobile; huge regression surface; stall risk mid-rewrite | Throws away SEO/sitemap/LLM/search pipeline; content is non-regenerable Markdown; highest rushed-rewrite risk |
| **Migration cost** | None (here) | **Low, amortized** — reuse `reading-nav.json`; first slice is hours | High — weeks/months | Highest — multi-month |
| **SEO/build/LLM** | Lowest risk | Low _if_ prose stays in `.vt-doc` body | Elevated — must re-validate search/LLM DOM | Severe — rebuild every guarantee from zero |
| **Generated content** | None | Designed-for (layout in components + frontmatter flags) | Risky — new wrapper classes may break `pages.css` + per-chapter flags across non-regenerable files | Largest — `src/*.md` becomes a migration corpus to re-render |
| **Native parity** | Negative/neutral (logic trapped in theme) | **Best practical path** — page-type components + manifests _are_ the spec a SwiftUI/Compose view re-implements | Good, but only after the full rebuild | Highest ceiling, but only as the final step after B/C define the vocabulary |
| **When to choose** | Only as the baseline under B | **Now, default for several quarters** | Once owned page-types outnumber inherited chrome | Only with native pressure _and_ a stable component vocabulary |

**Why B, concretely.** The two cited frictions are real and confirmed but neither requires leaving VitePress: (1) `VPContentDocFooter` derives prev/next from `getSidebar`/`getFlatSideBarLinks` and ignores frontmatter, gated by `frontmatter.footer !== false` — all-or-nothing; (2) the reading-leaf split is just `:class="{ 'has-aside': frontmatter.aside !== false }"` plus scoped CSS. Both are _already_ owned through frontmatter + `pages.css` — the exact Option-B seam, already load-bearing. The home page proves the lightest form of B (a `page: true` markdown file mounting an owned `Home.vue`). The first move below is additive, reversible, and reuses infrastructure that already exists.

**Preservation contract (non-negotiable for every increment).** Keep `pnpm build` and `pnpm verify` as the unbroken gate. Never edit the patched `VPNavBarSearch.vue`/`support/utils.ts`. Route all head/canonical/og through frontmatter so `transformPageData` + sitemap logic keep running. **Keep prose in the server-rendered Markdown body (`.vt-doc`)** so local search and the LLM render still see it — owned components are chrome _around_ the body, never the body. Any new interactive shell needs a server-rendered text fallback for `render-podcast-player-llms.py`. **Never bake layout into committed Markdown** — `local-books/` is gitignored and absent, so any new frontmatter flag must be added to the builder templates _and_ hand-applied to existing files. Treat the eight specs as the merge gate and add a spec per new owned surface.

---

## Phased Roadmap

Each phase is gated by `pnpm verify` and small enough to ship in reviewable slices.

### Phase 0 — Audit & standards (this document)
- **Goal:** shared diagnosis + a durable standards doc.
- **Deliverables:** this file; the standards doc proposed below; a captured visual-QA baseline (chapter leaf, work hub, author hub, podcast episode, show, home — mobile/desktop, light/dark).
- **Files:** `docs/`.
- **Risks:** none (no code).
- **Acceptance:** team agrees on Option B and the token plan.
- **Not yet:** no component changes.

### Phase 1 — skepvox design tokens & visual standards
- **Goal:** an owned, semantic, portable token foundation; the reading text face; close the a11y holes.
- **Deliverables:** `--sk-ink` alpha system; `--sk-text-*` modular type scale; `--sk-space-*` + `--sk-gutter` (safe-area aware); `--sk-motion-*` + easing + a **global** reduced-motion guard; `--sk-focus-ring`/`--sk-focus-offset` applied to _every_ interactive element; `--sk-radius-*`; `--sk-card-*`; `--sk-reading-font` (self-hosted text face) scoped to the leaf `.vt-doc`; green demoted to one job; a measure tier (`--sk-measure-prose` / `--sk-measure-lede`). Refactor the four mastheads + `CardGrid` + `PodcastPlayer` onto the tokens.
- **Files:** `.vitepress/theme/styles/vars.css`, `pages.css`, `utilities.css`, the owned components, `src/public/fonts/`.
- **Risks:** font self-hosting (FOUT/CLS, license); green demotion is a visible change; mixed-unit refactor.
- **Tests/QA:** screenshot diffs on the canonical routes; assert `font-family` on `.vt-doc` leaf vs chrome; contrast check on muted text.
- **Acceptance:** every interactive element has a visible focus ring; reduced-motion globally respected; chapter body set in the text face; one card token set; no green outside its one job; `pnpm verify` green.
- **Not yet:** no layout/DOM changes; no new page-type components.

### Phase 2 — owned page shells / page types inside VitePress
- **Goal:** name the product's page types as components, using native slots + `page`-layout mounts.
- **Deliverables:** `ReadingHeader.vue` (chapter masthead: work·author eyebrow, title, manifest chapter position, hairline rule) replacing the generated back-link + `##` heading; a work-hub shell (styled chapter TOC, no docs `outline`); a show-page/episode-page layout that separates the player from the guide prose so reading typography applies only to the guide.
- **Files:** new components under `.vitepress/theme/components/`; `theme/index.ts` (slot wiring); builder templates (to emit any new frontmatter signal) + hand-apply to existing leaves.
- **Risks:** the `outline:2`-as-reading-opt-out trick must be replaced cleanly; JSON-LD must keep emitting; per-chapter flag changes touch non-regenerable files.
- **Tests/QA:** a spec per shell (assert eyebrow/title/position text, absence of any sidebar-derived pager on `:not(.has-aside)` leaves); screenshots.
- **Acceptance:** chapter leaves have the strongest header; work hubs render a styled TOC not a browser outline; `pnpm verify` green; SEO/LLM unchanged.
- **Not yet:** do not touch navbar/sidebar/footer chrome.

### Phase 3 — reading experience foundation
- **Goal:** make "reading" a first-class mode, not a CSS side effect.
- **Deliverables:** a reading-leaf layout that owns the sidebar/aside/footer/outline decision (instead of four frontmatter flags + a fragile `:not(.has-aside)` selector); auto-generated work-hub `hasPart[]` JSON-LD from `reading-nav.json`; a build-time assertion of the layout-class invariant; optional per-work/per-language reading rhythm.
- **Files:** layout component, `build-reading-nav.py` (emit JSON-LD), a build check, `pages.css`.
- **Risks:** layout migration must preserve the 35rem measure + `ReadingNav` injection exactly.
- **Tests/QA:** invariant assertion in CI; reading-measure spec; screenshots.
- **Acceptance:** removing a chapter's `aside:false` can no longer silently break reading mode; JSON-LD no longer hand-maintained.
- **Not yet:** no framework change.

### Phase 4 — podcast learning experience foundation
- **Goal:** own the episode page so the player keeps native sticky and the transcript obeys the prose measure.
- **Deliverables:** a podcast-episode layout (player + transcript above, guide prose below) that escapes the `overflow:auto` sticky bug (retiring the JS pin); transcript under `--sk-measure-prose`; co-generate `.cues.json` with the episode `.md` in one build step; a `BufferNotice` that reads a structured `frontmatter.language`/state, not path-sniffing.
- **Files:** episode layout, `PodcastPlayer.vue`, `sync-podcast-lesson-pages.py`, `build-episode-cues.py`, `BufferNotice.vue`.
- **Risks:** mediaSession/safe-area behavior must be preserved; cue JSON must stay byte-identical (idempotency spec).
- **Tests/QA:** `podcast-player.spec.ts` extensions; mobile sticky screenshot; LLM-render parity.
- **Acceptance:** no JS pin needed; transcript reads as one column with chapters; `pnpm verify` green.
- **Not yet:** no custom transport controls; native `<audio>` stays.

### Phase 5 — navigation / search / sidebar ownership
- **Goal:** begin replacing inherited chrome once page-types dominate.
- **Deliverables:** a manifest-driven sidebar (generated, not hand-maintained in `config.ts`); a mobile-reachable appearance toggle; owned search result presentation (book/author context on chapter hits); retire the `--vp-*`→`--vt-*` CSS bridge.
- **Files:** sidebar generator + component, navbar overrides, search wiring/CSS.
- **Risks:** this is where B starts trending toward C; search DOM changes risk the index/LLM render.
- **Tests/QA:** full SEO/search/LLM re-validation; `sitemap.spec.ts`.
- **Acceptance:** sidebar generated from manifests; mobile dark-mode toggle works; search shows reading context.
- **Not yet:** do not fork the whole theme yet — replace piece by piece.

### Phase 6 — native-app readiness / shared product model
- **Goal:** formalize the web foundations that a future iOS/Android app re-implements.
- **Deliverables:** a semantic token layer (ink/surface/accent/active) exportable to a native theme file; a documented content/route/manifest contract (reading-nav, cues, episodes/shows); a reading-position + audio-position model; an offline/cache plan for generated content.
- **Files:** token export, a `MANIFESTS.md` contract doc, design-system package boundary.
- **Risks:** premature abstraction — only do this once vocabulary is stable.
- **Acceptance:** tokens + manifests + component semantics are documented well enough that a SwiftUI reading view is a re-skin, not a redesign.
- **Not yet:** do not build the native app; do not adopt Option D.

---

## First Implementation Slices

Each is small enough to review and push safely. (Note: the architecture agent's suggested first move — a manifest-driven prev/next pager — is **already shipped** as `ReadingNav` in the `content-bottom` slot, which is itself proof the Option-B seam works. So the first _new_ slice pivots to the design-system gap, which is the actual bottleneck.)

### Slice 1A — additive semantic tokens + a11y floor _(recommended first)_
- **User value:** every interactive element gets a visible keyboard focus ring (today the listen-links and prev/next links have none); reduced-motion is globally respected.
- **Why early:** the smallest safe first step — purely additive (define tokens; add the focus + reduced-motion floor) with **no** component migration and **no** color change, so it is near-pixel-stable and unblocks everything after it.
- **Scope:** add the semantic token layer to `vars.css` (`--sk-text-*` scale, `--sk-space-*`, `--sk-motion-*` + easing, `--sk-focus-ring`/`--sk-focus-offset`, `--sk-radius-*`, `--sk-card-*`, `--sk-measure-prose`/`--sk-measure-lede`) **without** rewriting existing component CSS, plus the global focus + reduced-motion rules in `utilities.css`. No `--sk-ink`/accent decisions yet (those wait on the brand-color call → Slice 1C).
- **Files:** `.vitepress/theme/styles/vars.css`, `.vitepress/theme/styles/utilities.css`; the two components missing focus rings (`PodcastShowHeader.vue`, `ReadingNav.vue`) get the focus token applied to their links.
- **Dependency policy:** no new dependency; tokens + CSS only.
- **Acceptance criteria — "done" means:**
  - **focus-visible required on** every interactive element in the owned components: `PodcastShowHeader` `.show-head__listen-link` (incl. the `.is-secondary`/RSS variant) and `ReadingNav` `.reading-nav__link` (prev/next) — the two currently missing it — plus a verify pass that the already-covered `CardGrid` link, `Home.vue` `.vt-box`, and `PodcastPlayer` `.vox-cue` still render a ring. All use the shared `--sk-focus-ring`/`--sk-focus-offset` tokens; no per-file `2px solid var(--vt-c-brand)` redeclarations remain.
  - **reduced-motion enforced globally** via a single rule in `utilities.css`: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important } }`. The `PodcastPlayer` JS `prefersReduced` branch for `scrollIntoView` stays (JS-driven, outside CSS).
  - **screenshots that must remain stable** (no diff in the default, non-focused state): chapter leaf (pt-BR + fr), work hub, author hub, podcast episode, show page, home — each at mobile + desktop, light + dark. The only intended visual change is a focus ring appearing on keyboard focus.
  - **tests added:** a spec asserting a focus-visible rule resolves for `.show-head__listen-link` and `.reading-nav__link` (rendered CSS contains the focus token, or a Playwright tab-and-assert-outline test), and that the global reduced-motion media rule is present; the existing 8 specs stay green; `pnpm verify` green.
  - **allowed temporary `--vt-*`:** all current `--vt-c-*`/`--vp-*` usages in `CardGrid.vue`, `Home.vue`, `PodcastPlayer.vue`, the mastheads, and `local-search.css` **may remain** — 1A does not migrate components. The `--sk-reading-*` tokens that derive from `--vt-c-*` (e.g. `--sk-reading-heading: var(--vt-c-text-1)`) also remain as-is. Only the _new_ `--sk-*` tokens and the focus/reduced-motion floor are added.
- **Rollback risk:** very low (additive; revert removes the new tokens + floor).
- **Advances roadmap:** yes — the semantic token layer is the thing that ports to native (Phase 6).

### Slice 1B — migrate owned components onto the tokens
- **User value:** real visual consistency (shared type scale, spacing, motion, radius) across the mastheads, cards, and player; sizes become deliberately related, not accidentally close.
- **Why after 1A:** the tokens must exist first; this is the mechanical refactor and it _can_ shift pixels, so it is reviewed on its own screenshots rather than bundled into the a11y floor.
- **Files:** `PodcastEpisodeHeader.vue`, `PodcastShowHeader.vue`, `ReadingNav.vue`, `CardGrid.vue`, `PodcastPlayer.vue` — replace hardcoded px/rem sizes and ad-hoc transition durations with `--sk-text-*`/`--sk-space-*`/`--sk-motion-*`/`--sk-radius-*`.
- **Dependency policy:** no new dependency.
- **Test plan:** existing specs green; targeted screenshot diffs on every refactored surface (small, intended type/spacing shifts allowed and reviewed).
- **Rollback risk:** low–medium (visible refactor; revert per component).
- **Advances roadmap:** yes — establishes the component design system.

### Slice 1C — color/accent demotion _(after the brand-color decision)_
- **User value:** the accent reads as a real signal again (active/orientation state) instead of being everywhere.
- **Why last in the group:** it depends on Open Decision #1 (own a `--sk-accent` vs keep Vue green) and #3 (green's one job); doing it before the brand call would mean redoing it.
- **Files:** `vars.css` (define `--sk-ink` alpha system + `--sk-accent`), components + `pages.css` (demote green from eyebrow separators, focus rings, and prev/next labels; keep it on the h2 `::before` rule and the active cue).
- **Dependency policy:** no new dependency.
- **Test plan:** screenshot the canonical routes (this slice is intentionally a visible change); specs green.
- **Rollback risk:** medium (deliberate color change across surfaces).
- **Advances roadmap:** yes — finalizes the color system and the single-ink identity.

### Slice 2 — reading text face (the docs→literature win)
- **User value:** chapter and segment pages read as literature, not documentation — the single biggest perceived-quality jump.
- **Why early:** highest-leverage visible change; scoped to the leaf `.vt-doc` only, so fully reversible and contained.
- **Files:** `src/public/fonts/` (self-hosted woff2), `vars.css` (`--sk-reading-font`), `pages.css` (apply within `.VPContentDoc:not(.has-aside) .vt-doc`).
- **Dependency policy:** no npm dependency; a self-hosted, licensed font asset only.
- **Test plan:** assert computed `font-family` on a leaf `.vt-doc` differs from chrome; verify chrome/nav stays UI-sans.
- **Screenshot plan:** chapter leaf (pt-BR + fr) and the podcast transcript, mobile/desktop, light/dark; check FOUT/CLS.
- **Rollback risk:** low (one scoped rule; revert removes it).
- **Advances roadmap:** yes — establishes reading typography as an owned identity (Phase 1/3).
- **Open decision:** which face (see Open Decisions).

### Slice 3 — `ReadingHeader` for chapter leaves
- **User value:** opening a chapter feels like opening a book — work·author eyebrow, a real title, "Chapter N of M" from the manifest, a hairline rule — instead of a generated back-link + a `##` heading.
- **Why early:** the product's most important pages currently have the weakest header; this directly fixes the inversion and reuses the proven masthead grammar.
- **Files:** new `ReadingHeader.vue`; `theme/index.ts` or `content-top` wiring (fold in / upgrade the existing `ReadingNav` top context); reads `frontmatter.book/author/chapter-title` + manifest position from `reading-nav.json`.
- **Dependency policy:** no new dependency; reuses the existing manifest.
- **Test plan:** new spec asserting eyebrow = work·author, title present, position string from manifest, and that it renders only on `:not(.has-aside)` leaves; existing specs green.
- **Screenshot plan:** first/middle/last chapter (literature + Lavelle), mobile/desktop, light/dark.
- **Rollback risk:** low–medium (additive component; revert to the current top context).
- **Advances roadmap:** yes — first Phase-2 page-type component.

### Slice 4 — one card primitive
- **User value:** the home grid and every hub grid become visibly the same object; cards join the reading ink world instead of the theme's color world.
- **Why early:** removes a three-pattern inconsistency cheaply; depends on Slice 1A's `--sk-card-*` tokens (migrated in 1B).
- **Files:** `CardGrid.vue`, `Home.vue` (refactor `.vt-box` onto the primitive), `vars.css`.
- **Dependency policy:** no new dependency.
- **Test plan:** `homepage.spec.ts` + `literature.spec.ts` + `podcast-show-page.spec.ts` stay green; assert shared card class/tokens.
- **Screenshot plan:** home, literatura hub, podcast hub, a show page, mobile/desktop, light/dark.
- **Rollback risk:** low.
- **Advances roadmap:** yes — consolidates the card standard for the design system.

### Slice 5 _(optional)_ — visual-QA harness + layout-class invariant
- **User value:** indirectly protects every reading page from silent regressions.
- **Why early-ish:** the load-bearing `:not(.has-aside)` coupling is currently untested; this makes the whole roadmap safe to move fast on.
- **Files:** a build-time assertion (chapter leaves must be `:not(.has-aside)`, podcast episodes must be `has-aside`); a small screenshot route set wired into the test flow.
- **Dependency policy:** use the existing Playwright install; no new dependency.
- **Test plan:** the assertion fails the build if a leaf gains an aside/outline; snapshot the four masthead idioms.
- **Rollback risk:** none (test-only).
- **Advances roadmap:** yes — the QA floor for Phases 2–5.

---

## Design Standards Proposal

**Where it lives:** `docs/skepvox-design-standards.md` in the website repo (next to this assessment), with the token source of truth in `.vitepress/theme/styles/vars.css`. Keep it in-repo so it is versioned with the code it governs and is reachable from prompts/reviews.

**Sections:**
1. **Product principles** — reading-first; calm over dense; restraint as a feature; the synced transcript is the one bold element; text before imagery before controls.
2. **Tokens** — ink (alpha system), type scale, spacing, motion + easing, focus, radius, card, measure tiers; light/dark; the rule that new surfaces consume tokens, never raw `--vt-c-*`/`--vp-*`.
3. **Typography** — the reading face vs UI sans split; the masthead grammar (`eyebrow → title → rule → lede`); eyebrows must encode something true.
4. **Color** — one ink; green's single job (active/orientation); image desaturation rule (decorative portraits grayscale in dark; functional artwork does not).
5. **Components** — card primitive; masthead/`ReadingHeader`; link/control idioms (in-content underline-on-hover; quiet bottom-border action link; native `<audio>` only); cue semantics (visual offset vs seek time).
6. **Motion** — confirm-state only; tokenized durations; global reduced-motion.
7. **Accessibility floor** — focus-visible everywhere; keyboard model for custom controls; contrast minimums at the small sizes actually shipped.
8. **Responsive & native** — safe-area gutters; mobile reachability (e.g., the appearance toggle); the semantic token → native-role mapping.
9. **Rejected patterns** (a living list, with the _why_): no custom podcast speed dropdown (native audio has speed); no compact transcript breadcrumb (visually weak, not worth the space); no badge walls; no generic SaaS/marketing hero; no decoration-first (gradient blobs, oversized heroes, visual noise); no "docs site with prettier CSS."
10. **Visual-QA** — the canonical route set and the layout-class invariant.

**How it guides prompts/reviews:** every UI slice prompt cites the relevant standards section and the rejected-patterns list; every review checks the token/focus/motion/measure rules and the canonical screenshots. **Keep it practical:** each rule states the token or file that enforces it and shows a one-line code example; the rejected-patterns list is appended to whenever a pattern is tried and dropped (with the reason), so the document encodes real history, not aspiration.

---

## Reading Text Face — Candidate Faces

For Slice 2, the reading body face must be **self-hosted** (no Google Fonts CDN call — privacy + performance), **OFL/freely licensed**, carry full **Portuguese and French** diacritics (`ã õ ç á à â é è ê í ó ô ú ü ` and small-caps where used), offer at least regular + medium + bold with **true italics**, and render cleanly at body sizes on **low-DPI mobile**. Do not choose by vibe.

| Face | License | Weights / italic | pt + fr accents | Mobile rendering | Fit for skepvox |
|---|---|---|---|---|---|
| **Literata** | OFL | Variable 200–900 + italics | Full Latin incl. all pt/fr diacritics | Purpose-built for screen e-reading (commissioned for Google Play Books); sturdy hinting, holds up at small sizes | **Strong.** A literary book face by definition — warm, calm, made for long-form reading. Subset the variable font to keep payload down. |
| **Spectral** | OFL | 7 static weights (200–800) + italics | Full Latin incl. pt/fr | Designed by Production Type for on-screen long text; lower contrast → crisp at small sizes/mobile | **Strong.** Editorial and restrained; static weights subset easily to 2–3 woff2 files. |
| **Source Serif 4** | OFL | Variable + many static + italics | Full Latin incl. pt/fr | Adobe transitional serif tuned for UI/screen; very reliable rendering | **Good, safe.** Neutral-literary; less characterful than Literata/Spectral but the lowest-risk option, and pairs cleanly with a sans for chrome. |
| **EB Garamond** | OFL | 400/500 + italics (limited heavier weights) | Full Latin incl. pt/fr | High stroke contrast + delicate serifs render **thin/light** on low-DPI screens and at small sizes | **Characterful but caveated.** Most classical/philosophical feel (suits Lavelle), but needs a larger body size + good hinting or it feels frail on phones; thin bold range. |

**Lean: Literata or Spectral** — both are explicitly screen-reading faces with the diacritic coverage and weight range skepvox needs, and both carry the calm-literary tone the brief wants without EB Garamond's mobile-thinness risk or Source Serif's relative neutrality. Implementation: self-host as **subset woff2** (Latin + the pt/fr accent block), **preload** the regular weight, `font-display: swap` with a **metrics-matched fallback** to limit CLS, and scope `--sk-reading-font` to `.VPContentDoc:not(.has-aside) .vt-doc` only so chrome stays UI-sans. Final pick is **Open Decision #2**.

---

## Native App Readiness

Do not build native now. Build the web foundations a future iOS/Android app re-uses:

- **Shared content model** — already strong: committed generated Markdown + manifests. Keep content framework-agnostic; never bake layout into Markdown.
- **Route/content manifests** — `reading-nav.json` (chapter order + titles), `episodes.json`/`shows.json`, `*.cues.json` are exactly the data a native reading/podcast view consumes. Document them as a stable contract (`MANIFESTS.md`) in Phase 6.
- **Audio/transcript model** — `PodcastPlayer`'s cue schema + `mediaSession` wiring + the visual-offset/seek-time distinction is a portable spec; keep cue generation deterministic.
- **Reading navigation model** — `page.relativePath` → work-route → manifest siblings is already declarative; a native client can replicate it from the same JSON.
- **Design tokens** — the **blocker** is that most design currently lives in `@vue/theme`'s `--vt-c-*` plus a few `--sk-*`. A semantic layer (`ink/surface/accent/active`) maps 1:1 to iOS dynamic colors / Android Material roles; the single-ink alpha system ports beautifully, scattered px sizes do not. This is the main native-readiness work and it is the same work as Phase 1.
- **Component semantics** — name page types as components (Phase 2) so the native app inherits the vocabulary (reading shell, work hub, episode, show), not a pile of CSS.
- **Offline/cache** — generated content is static and cacheable; a native app can bundle/sync manifests + Markdown. Plan in Phase 6, not before.
- **Typography/readability** — the reading face + measure + rhythm tokens become the native reading view's typography spec directly.

---

## Risks And Anti-Patterns

**Architecture/process risks:**
- **Discipline drift in Option B** — if owned components start rendering _prose_ into client-only DOM, local search and the LLM render lose it. Rule: components are chrome around the `.vt-doc` Markdown body, never the body.
- **Non-regenerable corpus** — `local-books/` is gitignored and absent; builders `sys.exit` without sources. Any new frontmatter flag must go into builder templates _and_ be hand-applied to existing files. Never assume a rebuild.
- **Load-bearing fragile coupling** — all reading typography hinges on `:not(.has-aside)` and dual `.vt-doc`/`.vp-doc` selectors; a `@vue/theme` minor bump renaming a class silently breaks reading mode. Add the build-time invariant (Slice 5) and re-verify on every upgrade.
- **Patch version-lock** — search + cleanUrls depend on the patch matching `vitepress@^1.6.4`/`@vue/theme@2.3.0`; a major upgrade forces re-derivation. Don't deepen the patch.
- **Two-source-of-truth for buffer visibility** — page registry vs upstream distribution status can desync into orphans/missing manifest entries. Don't add a third source.
- **Test coupling** — specs read committed manifests directly; manifest schema changes require test updates. Treat schema as a contract.

**Design anti-patterns to avoid (and the ones already rejected):**
- The rejected list is binding: no custom speed dropdown, no transcript breadcrumb, no badge walls, no SaaS/marketing hero, no decoration-first, no "docs with prettier CSS."
- Green overload — keep green to one job.
- Multiple card patterns / multiple reading widths — converge to one primitive and one measure tier.
- Hardcoded, unit-mixed type sizes — use the scale.
- Per-component reduced-motion / missing focus rings — make both global.
- Adding app-like controls that don't solve a real reading/learning problem or don't fit mobile elegantly.

---

## Open Decisions

These are genuine forks that need a human call before the slices they gate:

1. **Brand color identity.** skepvox's accent is currently Vue's green (`#42b883`/`--vt-c-green`), inherited from `@vue/theme`. Adopt a distinct skepvox brand color as `--sk-accent` now (cleaner identity, ports to native), or keep the green for continuity? Gates Slice 1C (color/accent).
2. **Reading text face.** Which self-hosted serif for the leaf `.vt-doc` — see _Reading Text Face — Candidate Faces_ (lean: Literata or Spectral). Confirm the face + subset + metrics-matched fallback. Gates Slice 2.
3. **Green's "one job."** Confirm demoting green to active/orientation state only (h2 accent rule + active cue), removing it from eyebrow separators, focus rings, and prev/next labels. Gates Slice 1C.
4. **Doc footer / pager strategy site-wide.** Retire `VPContentDocFooter` everywhere in favor of owned manifest pagers (and drop sidebar-derived paging entirely), or keep the docs pager available for any future doc-style pages? Affects Phases 2/5.
5. **Source-of-truth for the corpus.** Accept the immutable committed-Markdown model (and the hand-apply constraint for new frontmatter flags), or bring `local-books/` and the transcript exports into version control so content is regenerable? Affects every builder change.
6. **Global site footer.** Today the copyright footer renders only on the home page. Add a quiet global footer on all pages, or keep reading pages chrome-free? Affects Phase 5.
7. **Mobile appearance toggle.** The dark/light toggle is hidden below 1280px — mobile users cannot switch. Surface a mobile-reachable toggle (it's a real gap for night reading), or rely on the OS preference? Affects Phase 5.
8. **Dark-mode reading ink.** Pure-white-at-0.8 can be harsh for long night reading; adopt a slightly warm off-white reading ink in the leaf scope? Affects Slice 1C/2.

---

## Closing Handoff — 2026-06-21

This section is the working tasknote for the current roadmap execution. It records what is already shipped, what is intentionally unpushed, and where to resume.

### Shipped / merged today

- Warm owned surface system and ink-blue accent are live: light uses a warm paper surface, dark uses a warm near-black/ivory reading system, and inherited `@vue/theme` brand color routes through `--sk-accent`.
- The active podcast cue was reassessed after the warm surfaces: muted gold remains the better live-state color than blue or neutral ink. It reads as "now playing," not text selection.
- Literata is self-hosted and applied only to book chapter prose. Chrome, headings, podcast transcript, and navigation stay UI-sans. The OFL license ships with the font files.
- Mobile theme toggle is exposed in the navbar near search, and the theme chrome sync is route-aware.
- The theme transition regression was fixed after the snap-shell experiment was rejected: visible page/chrome surfaces fade together again; only the iOS Safari browser bars still snap because they are outside the DOM.
- The mobile card tap/back-navigation bug was fixed for card surfaces.
- The navbar mark no longer carries the legacy Vue green: the visible nav mark now uses `logo.svg` as a mask filled by `--sk-brand-mark` (`#2f4a6b` light, warm ivory dark).

### Explicitly rejected / do not retry as-is

- Custom podcast playback-rate controls and transcript breadcrumb controls: rejected. Native audio already exposes speed, and the breadcrumb took space without enough sophistication.
- Shell snap transition for iOS Safari chrome: rejected. It removed the stale edge but looked cheap because the page composition split during the theme change.
- Badge-wall podcast show pages: rejected. Listen links should stay calm and text-based unless a future platform module is designed as a full system.
- Bare green logo carryover: rejected as brand direction. Green reads as Vue/framework, not skepvox; any remaining green logo assets are now follow-up asset debt, not the direction.
- "Just the horse" logo direction: rejected. If the jagunço/rider is removed, the mark loses the soul of the identity.

### Logo state after the final push

- `6872ad2 Retire legacy green from the navbar mark via a brand-mark token` is pushed.
- Scope was deliberately narrow: `.vitepress/theme/components/NavBarTitleBrand.vue` and `.vitepress/theme/styles/vars.css`.
- Behavior: the navbar mark uses `logo.svg` as a CSS mask and fills it with `--sk-brand-mark` (`#2f4a6b` light, warm ivory dark). The SVG file itself is unchanged.
- Intentionally untouched and still open: favicon, Apple touch icon, mask/pinned-tab icon if present, OG/social preview, media-session artwork, and any other direct logo asset usage.
- This is not a redraw. The jagunço/rider remains the identity. No monogram, no "just horse," no gold identity color.

### First task next session — start here

1. Real-device QA the pushed navbar mark in light/dark and mobile/desktop:
   - confirm the ink-blue/ivory mark feels right beside the wordmark;
   - confirm the mark does not feel too heavy or too faint at nav size;
   - confirm the theme toggle / nav-open state did not introduce a color or repaint regression.
2. Then run the **focused logo asset follow-up** before the broader shell work:
   - inventory every remaining asset surface: favicon, Apple touch icon, mask/pinned-tab icon, OG/social image, media-session artwork, and direct `/logo.svg` usages;
   - decide which surfaces should use the bare ink/ivory silhouette and which should use the ink-blue disc lockup;
   - keep the existing jagunço+rider, with no redraw in this slice;
   - do not use gold for identity assets; gold remains reserved for the live podcast cue;
   - preserve SEO/social metadata and avoid disturbing navbar behavior.
3. Only after that focused brand-asset pass, start the deeper **navigation and shell ownership assessment**.

### Roadmap continuity

The next broad strategic move should not be another generic product report. After the logo asset follow-up, the useful assessment is specifically **navigation and shell ownership**: how to move from rented `@vue/theme` chrome toward a skepvox-owned web-app shell while preserving search, SEO, generated content, reading surfaces, podcast transcript behavior, and the calm iOS-level visual standard.
