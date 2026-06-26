# Locale-rooted website IA — whole-site assessment

> **Status:** assessment / planning only. **Doc-only.** No route move, redirect, generator change,
> component change, or content deletion in this slice. Branch `develop`, commit-only.
>
> **Supersedes the scope of** `docs/filosofia-ia-pilot-migration-assessment.md`: that doc remains the
> detailed execution plan for the **filosofia pilot** (Phase A below); **this** doc is the whole-site
> umbrella it slots into. Where they overlap, this doc is authoritative on the site-wide shape and the
> two are consistent.

This revision incorporates four product-direction changes since the pilot doc: (1) **locale roots are
now the website standard**, not just language-aware book editions; (2) **no redirects** for the IA
migration (clean 404 break), including the old `/louis-lavelle/` and `/literatura/` redirects and the
Cloudflare `_redirects` step; (3) **`/pt/literatura/` is a pipeline rebuild, not a mechanical move** of
the old hand-authored pages; (4) **podcast is reassessed separately**, because the current show and
episode pages are already monolingual target-language surfaces, not mixed-language book pages.

---

## 1. Revised recommendation

**Adopt locale roots as the website-wide IA standard, and populate the locale-rooted tree only with
pipeline-export content built to the new reader-shell standard. Migrate content-first and
incrementally; accept a temporary split-brain; take the clean 404 break with no redirects.**

Concretely:

1. **Target shape:** `/{locale}/{section}/{author}/{work}/{leaf}` — e.g.
   `/pt/filosofia/louis-lavelle/introducao-a-ontologia/<segment>`,
   `/pt/literatura/machado-de-assis/bras-cubas/<segment>`.
   Future locales `/fr/`, `/en/`, `/es/`, `/ru/` mirror it with localized section names
   (`philosophie`, `philosophy`, …).
2. **One unifying rule:** _the locale-rooted tree is built only from pipeline-export books + the owned
   reader shell._ Legacy hand-authored content (the old `/literatura/` pages, the legacy Lavelle
   corpus) is **not** moved into `/pt/`; it stays at its old locale-less path until either rebuilt
   through the book-pipeline or removed. This keeps `/pt/` clean and prevents legacy-website
   assumptions from contaminating the new IA.
3. **Website owns the namespace; book-pipeline owns identity.** A single website-side `ROUTE_BASE` map
   (keyed by `workId`) prepends `{locale}/{section}` during ingestion; book-pipeline emits only a
   book-relative path. This is the _only_ place the IA namespace lives, so each section/locale is a
   config value, not an engineering task. (Mechanics in `filosofia-ia-pilot-migration-assessment.md`
   §6; reused verbatim for every section.)
4. **Pilot order, content-first:** Phase A = the **filosofia** pilot (one book, proves the scheme),
   closing with the A6 homepage/global-pillar frame. Phase B starts with the **first literatura book**
   — _Memórias Póstumas de Brás Cubas_ — rebuilt from the book-pipeline, not moved from legacy pages.
   Then comes a consolidation / simplification / test-protocol pass before multiplying the model. The
   owned social/footer/icon layer follows that consolidation. Podcast IA stays later and should not
   assume `/pt/podcast/` as the canonical answer.
   Phase C = the full multilingual programme (`/fr…/ru` roots, locale negotiation, switcher, hreflang,
   localized chrome). See §10.
5. **Clean break for web routes.** Old book/literature URLs 404; the existing redirects are disabled,
   not re-pointed. Podcast feed moves are a separate operational decision, only needed if a later
   podcast IA slice changes canonical feed URLs — see §7 and Appendix A.
6. **Path-prefix now, VitePress `locales` later.** The site has no native VitePress multi-locale
   routing today (only the pt-BR theme i18n string table). Use plain `src/{locale}/…` directories now;
   that layout is exactly what VitePress directory-based i18n expects, so adopting `locales` in Phase C
   is additive, not a restructure.

**Why this and not a bare `/filosofia/` (or a mechanical whole-site move):** locale roots give
materially stronger per-language SEO and a non-mixed reader experience (§8), at the _same_ build cost
as a non-locale prefix (it is one token in `ROUTE_BASE`). A bare `/filosofia/` (or moving legacy
literatura as-is) would be thrown away the moment the site goes multilingual, and would drag
legacy-website assumptions into the clean tree.

---

## 2. Migration principles (the invariants every slice obeys)

- **Two orthogonal axes, never collapsed.** _Site-UI locale_ (the `/pt/`, `/fr/` root) governs chrome:
  UI language, section names, nav, labels, metadata, search/discovery, footer, sitemap, hreflang.
  _Book-edition language_ is data-level and stays in the export: `workId`, `canonicalId`,
  `segmentPrefix`, `language`, `editionRole`, `publicSlug`, `routePath`. A page's UI locale and its
  content edition are chosen independently (locale once at the root; edition per work via the labelled
  switcher).
- **Identity is language-neutral and route-neutral.** Joins are by `(canonicalId, segmentPrefix,
language)`; `routePath` is presentation only and may be re-projected freely.
- **The new IA is pipeline-only.** `/pt/...` is populated exclusively by the pipeline-export model
  (`PipelineWorkContents` / `PipelineSegmentNav` / `PipelineReaderHeader`, segments from
  `pipeline-export-segments.json`). No legacy `CardGrid`-over-`works.json` work pages, no per-book
  hand-authored chapter builders.
- **Content-first, incremental, split-brain-tolerant.** Sections move one at a time; `/pt/<section>`
  coexists with legacy locale-less siblings until each legacy section is removed. The home stays at `/`.
- **Clean break.** No redirect preservation; old URLs 404 (feeds excepted operationally, §7).
- **Metadata-driven over path-keyed.** Replace path-string rules (sitemap pruning, LLM blocks) with
  stability/marker-aware gates so new locales/sections are self-service.

---

## 3. Rejected alternatives

- **Bare `/filosofia/` (no locale root).** Rejected: becomes migration debt under the now-confirmed
  multilingual direction; weaker per-language SEO; same cost as the locale-rooted target. (Full
  argument in the pilot doc §2.3.)
- **Mechanically moving old `/literatura/` into `/pt/literatura/`.** Rejected: drags hand-authored,
  identity-less, legacy-website pages into the clean pipeline-only tree. Literature is **rebuilt**
  book-by-book through the pipeline instead (§6.2).
- **Preserving old feed URLs as an immovable constraint.** Rejected (per steering): feeds are migrated
  with an explicit platform-update + verification step (§7); preservation would freeze the IA around a
  syndication detail.
- **Redirect-preservation migration (re-pointing `_redirects`).** Rejected: clean 404 break is the
  chosen posture; redirects to moved targets would either dangle or require ongoing maintenance.
- **Adopting VitePress native `locales` now.** Rejected for the pilot: a site-wide restructure ahead of
  need; the path-prefix approach is forward-compatible and additive.
- **Locale-rooting the whole site in one big-bang slice.** Rejected: high blast radius across ~25
  tests, 3 sections, feeds, and config; content-first phasing de-risks it and proves the scheme on the
  smallest surface first.
- **Moving the home to `/pt/` now.** Rejected during split-brain: re-homes twice; `/` → locale
  negotiation belongs to Phase C.

---

## 4. Target IA — whole site

```
/                                  home (stays; future / → locale negotiation in Phase C)
/pt/                               pt UI root (the current primary audience)
  /pt/filosofia/                       section hub → author → work → leaves   (Phase A pilot)
    /pt/filosofia/louis-lavelle/introducao-a-ontologia/<segment>
  /pt/literatura/                      pipeline-REBUILT literature only       (Phase B)
    /pt/literatura/machado-de-assis/bras-cubas/<segment>
  /pt/podcast/                         optional Portuguese podcast directory  (later, not canonical by default)
/fr/  /en/  /es/  /ru/             future locale roots                        (Phase C)
  /fr/philosophie/…                 localized section names; same shape for books
  /fr/podcast/… /es/podcast/… /en/podcast/…  possible future target-language podcast roots

— legacy, locale-less, kept until rebuilt-or-removed (NOT moved into /pt/) —
/louis-lavelle/    legacy Lavelle corpus + old fr edition + author hub        (remove in Phase A IA-5)
/literatura/       old hand-authored literature pages                         (remove as rebuilt)
/podcast/          current monolingual podcast surfaces                        (keep until a dedicated podcast IA)
```

**Locale-specific vs shared:**

| Locale-specific (per `/{locale}/`)                                  | Shared / data-driven (locale-neutral)                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Section names (`filosofia`/`philosophie`/…), nav, UI labels, footer | `pipeline-export-segments.json` identity (`workId`, `canonicalId`, `segmentPrefix`, `language`, `editionRole`, `publicSlug`) |
| Page metadata (title/desc/og/canonical/hreflang), `<html lang>`     | The reader-shell components + `reader-shell.ts` helpers (pure `routePath` transforms)                                        |
| Search index scope, sitemap segmentation (Phase C)                  | The `ROUTE_BASE` projection mechanism (one map; per-locale entries)                                                          |
| Author-hub **copy** (bio/headings)                                  | Author + work **slugs** (proper nouns / own-language edition slugs, Family E)                                                |
| The locale switcher + `/` negotiation (Phase C)                     | Vendored prose, `.cues.json`, episode/show identity                                                                          |

---

## 5. The two-axis model in routes (canonical statement)

```
/{uiLocale}/{localizedSection}/{authorSlug}/{editionSlug-or-show}/{leaf}
   pt          filosofia          louis-lavelle  introducao-a-ontologia   00-01-002-008-paragrafo-7
   pt          literatura         machado-de-assis bras-cubas             00-04-001
   (podcast)   podcast            francais        001-le-badge            current non-locale route; target-language show
```

- `uiLocale` — lowercase ISO 639-1 (`pt`, `fr`, `en`, `es`, `ru`); **coarse UI language** (recommend
  `pt`, not `pt-BR`, for the root). Open: Cyrillic vs ASCII section slug for `/ru/` (recommend ASCII).
- `localizedSection` — section name in the UI locale. Book sections localize
  (`filosofia`/`philosophie`/`philosophy`/`filosofía`). Podcast keeps the international `podcast`
  token if/when it moves, but the canonical podcast route shape is not decided here.
- `authorSlug` — language-neutral proper noun, stable across locales.
- `editionSlug` (books) — the edition's **own-language** slug (Family E), stable across UI locales; for
  podcast the analogue is the **show** (target-language grouping), and the episode is the leaf.
- **What stays data-level (never in the localized path):** `workId`, `canonicalId`, `segmentPrefix`,
  `language`, `editionRole`, `publicSlug`, `routePath`. The localized path is a _projection_ of the
  book-relative `routePath` via `ROUTE_BASE`.

---

## 6. Per-area plan

### 6.1 Filosofia — the Phase A pilot (reference)

Execute as in `filosofia-ia-pilot-migration-assessment.md`: introduce the `ROUTE_BASE` projection
(IA-1, no visible move), flip the base to `pt/filosofia/louis-lavelle/introducao-a-ontologia` (and the
leaf policy to prefix-only) and regenerate the 99-leaf tree under
`src/pt/filosofia/louis-lavelle/introducao-a-ontologia/` (IA-2), create the section + author hubs and
wire nav/sidebar/sitemap/LLM (IA-3), disable the obsolete fr→pt redirects (IA-4), remove the legacy
Lavelle corpus once green (IA-5). The reader shell needs **no** code change (it is `routePath`-driven);
only stale comments + an optional self-healing `workId` for the multi-book future. This pilot **locks
the scheme** every other section reuses.

### 6.2 Literatura — rebuild via pipeline, do not move

**Current state (verified):** `src/literatura/` is **hand-authored, with no pipeline identity** — no
`canonicalId`/`segmentPrefix`/`workId`, no `generated:` markers. Two page models: single-text works
(`a-cartomante.md`, `o-ateneu.md`) and chapter-split works (`dom-casmurro.md` + a `dom-casmurro/`
chapter subdir) whose leaves are produced by per-book builders (`build-machado-de-assis-*.py`,
`build-graciliano-*.py`) syncing from `local-books/<author>/<work>/pt/`. Author hubs are hand-authored
`CardGrid` over `works.json` (from `build-literatura-manifests.py`).

**Plan:**

- **Old `/literatura/` pages → leave legacy, remove later.** They are _not_ moved into `/pt/`. They
  stay live at `/literatura/` during the programme and are removed (clean 404) in a cleanup slice once
  their pipeline-rebuilt equivalents are live. The legacy builders
  (`build-literatura-manifests.py`, `build-machado-*`, `build-graciliano-*`) are excluded from the new
  IA and removed in that cleanup.
- **First literatura pilot → Machado de Assis, _Memórias Póstumas de Brás Cubas_.** This deliberately
  chooses a large, structurally stressful work already familiar from the website prototype rather than
  the smallest possible short story. The goal is to prove that the pipeline-export + owned reader shell
  can carry a real flagship literature book before we multiply. It must still be a **pipeline rebuild**,
  not a mechanical migration of the current `src/literatura/` pages.
- **What book-pipeline must produce for _Brás Cubas_:** a real export with language-neutral identity —
  `canonicalId` `machado-de-assis/bras-cubas`, per-segment `segmentPrefix`, edition-keyed `workId`,
  authored `groupPath` where real structure exists, `publicSlug` + book-relative `routePath`
  (`machado-de-assis/bras-cubas/<leaf>`, the website re-projects to
  `pt/literatura/machado-de-assis/bras-cubas/…`), and vendored body-only prose split at stable segment
  boundaries. Confirm and clean the source in the book-pipeline first; the website ingests it exactly
  like filosofia.
- **No contamination of `/pt/literatura/`:** the work tree uses **only** the reader shell + pipeline
  segments; no legacy `CardGrid`-over-`works.json` work pages, no per-book hand-authored chapter
  builder runs under `/pt/`. A test asserts no `works.json` and no legacy-builder output exists
  anywhere under `src/pt/literatura/`.
- **Hubs are hand-authored, cards are pipeline-sourced.** `/pt/literatura/index.md` and
  `/pt/literatura/<author>/index.md` are hand-authored copies of the literatura section/author-hub
  _structure_ (frontmatter + `CardGrid`, `footer: false`, locale-rooted canonical), but their cards do
  **not** read `works.json`. The card list is built from the pipeline export: the _route/title_ fields
  come from `pipeline-export-segments.json` (`work.authorSlug`, `work.bookSlug`, the work `title`, the
  pt edition `routePrefix` → the work-hub href), aggregated by `authorSlug`. Segment records carry no
  bios/descriptions, so any prose blurb comes from a small **hand-curated author-metadata file**
  (e.g. a `literaturePtAuthorCards` constant in `authors.ts`, mirroring `philosophyAuthorCards`), not
  from the legacy `works.json`. Adding a second rebuilt book is a new export + a new card entry; no
  hub surgery. (If a richer per-work blurb is wanted, the book-pipeline can carry a `work.blurb`
  field — a future nicety, not required for the pilot.)
- **Legacy `/literatura/index.md` and the legacy builders stay during the split-brain.** The old
  section/author hubs remain live at `/literatura/…`; the legacy nav entry stays alongside a new
  `Literatura → /pt/literatura/` entry (§6.4). The legacy builders (`build-literatura-manifests.py`,
  `build-machado-*`, `build-graciliano-*`) keep running for the legacy pages and are **deleted** (not
  merely disabled) in slice **B4**, when the legacy `/literatura/` section is removed after each
  author's corpus is rebuilt. A test asserts `/pt/literatura/` lists only pipeline-backed books.

### 6.3 Podcast — keep current monolingual surfaces; reassess canonical roots later

**Current state (verified):** hub `/podcast/` (pt chrome) → shows `/podcast/{francais|espanol|english}/`
→ episodes `/podcast/{show}/<NN-slug>`; each show has `index.md`, `episodes.json`, per-episode `.md` +
`.cues.json`, and a static **`src/public/podcast/{show}/feed.xml`**. Episode pages + manifests are
generated by `sync-podcast-lesson-pages.py` from external repos (`skepvox-podcast-{francais,espanol,
english}`); `scaffold-podcast-distribution-episode.py` + `podcast-show-config.json` own the
distribution metadata (incl. `show_page_url` + `rss_feed_url`). Components (`PodcastPlayer`,
`PodcastShowHeader`, `PodcastEpisodeHeader`, `PodcastEpisodeNav`) are data-driven, not path-keyed.

**Updated decision after product review: do not force podcasts under `/pt/podcast/` now.** The book
problem and the podcast problem are different:

- Books mix UI language, edition language, author/work identity, and reader navigation. Locale roots
  solve a real reader-confusion problem there.
- Podcast shows are already target-language surfaces: Vox Français is French-facing content, Vox
  Español Spanish-facing content, Vox English English-facing content. Forcing all of them into
  `/pt/podcast/` would make the URL say "Portuguese UI" while the page content, `og:locale`, audio,
  transcript, and SEO audience are target-language.

**Decisions for now:**

- **Keep current canonical podcast URLs** (`/podcast/{francais|espanol|english}/…`) through Phase B.
  A6 may still surface "Podcast" as one of the homepage/global pillars, but it should point to the
  current podcast hub unless a dedicated podcast IA slice decides otherwise.
- **Do not add `/pt/podcast/` by default.** It may become a Portuguese directory/landing page later
  (for Brazilian learners discovering all shows), but it should not automatically become the canonical
  episode/show namespace.
- **Future full-locale candidates:** if podcast SEO and reader clarity demand locale roots later, the
  stronger canonical pattern is likely **target-language roots**:
  `/fr/podcast/...`, `/es/podcast/...`, `/en/podcast/...` for the show/episode surfaces, because those
  match content language. A `/pt/podcast/` page can coexist as a Portuguese guide/index, linking into
  the target-language shows rather than owning their episode URLs.
- **Components stay data-driven.** `PodcastPlayer`, `PodcastShowHeader`, `PodcastEpisodeHeader`, and
  `PodcastEpisodeNav` remain the right seams. Any route move later should be expressed through
  `podcast-show-config.json` / sync output, not component path parsing.
- **Feeds move only if canonical podcast URLs move.** Per steering, feed URLs can be changed in the
  platforms, so feed URL stability is not a hard blocker. But it is still operationally special: no
  feed path should silently change without the platform-update + verification checklist (Appendix A).
- **SEO now:** keep `og:locale` and content language aligned with each show/episode's target language.
  Do not add hreflang until there are true alternate localized versions or directories to link.
- **Timing:** podcast becomes a later **podcast IA reassessment**, after Brás Cubas and the
  consolidation/test-protocol pass. It is not part of the immediate book-locale rollout.

### 6.4 Home + global nav

- **Home stays at `/`** through the split-brain (it is discovery, not content; re-homing twice is
  wasteful). `/` → locale negotiation is Phase C.
- **Split-brain nav:** add locale-rooted entries (`Filosofia → /pt/filosofia/`, later
  `Literatura → /pt/literatura/`; `Podcast` keeps the current `/podcast/` entry until its own IA
  reassessment) **alongside** the legacy entries as
  **separate `config.ts` nav items with independent `activeMatch`** — no conditional URL logic, no
  merging. Independent `activeMatch` patterns (`^/pt/filosofia/` vs the legacy `^/louis-lavelle/`) do
  not conflict; each highlights only on its own routes. Remove each legacy nav entry only when its
  legacy section is removed. (Same for the sidebar: a new `'/pt/filosofia/'` key beside the legacy
  keys; no de-duplication during the split-brain.)
- **No `/pt/` home or `/pt/`-rooted breadcrumb in Phase A/B.** There is no `/pt/` landing page yet; a
  reader on `/pt/filosofia/…` reaches other sections via the global nav (which carries both legacy and
  `/pt/` entries) and the reader-shell's own Sumário/up links (which stay inside the work). The `/pt/`
  hub + `/` → locale negotiation are Phase C; do not add a `/pt/` breadcrumb root before then.
- **404** stays locale-less and shared (offers all major roots); do not fork a `/pt/404/`.
- **Home component + pillars** unchanged in Phase A/B; a locale-prompt hook is Phase C.
- **`authors.ts`:** add `philosophyAuthorCards` (Phase A) and a pipeline-only literatura author-card
  list (Phase B); keep the legacy `literatureAuthorCards` for the legacy `/literatura/` until it is
  removed.

### 6.5 Search / sitemap / LLM / hreflang / canonical

- **Sitemap pruning:** generalize `isChapterRoute()` from path-depth strings (`literatura` ≥4,
  `louis-lavelle` ≥3 — the asymmetry reflects structure: literatura is section→author→work→chapter,
  legacy louis-lavelle is work→chapter) to a **metadata-aware gate** — drop routes whose
  `urlStability != "stable"` or that carry the `pipeline-segment-routes` marker. This auto-handles
  `/pt/<section>/…` (depth 5) and every future locale/section with no new path rule. **Caveat:** the
  gate needs the segment metadata (`pipeline-export-segments.json` or a derived index) available at
  VitePress **config-build time** (where `sitemap.transformItems` runs). The build order already runs
  `build-pipeline-export.py` before `vitepress build`, so the data exists; if that ever changes, the
  fallback is a path-depth rule for `/pt/<section>/…` (depth ≥5) added alongside the legacy rules in
  A3, with the metadata generalization deferred.
- **Mixed-stability works are allowed under `/pt/`.** A work may have some pt segments stable and some
  draft (the gate is per-segment: `pipeline_gate.py` flags each). Both are generated, but only stable
  segments enter sitemap/search/LLM; draft segments carry `noindex`/`search:false`. The work stays
  discoverable via its hub when the hub is live.
- **LLM (`llms.txt`):** keep blocking the obsolete old fr edition paths; **do not** block
  `/pt/<section>/**` (the canonical pt editions must be indexed). Generalize the block list to the same
  stability gate when metadata is available to the plugin.
- **Search:** VitePress local search indexes by route; regenerated pages index at the new path
  automatically. **Per-locale search scoping is Phase C** (a standard theme feature once ≥2 locales
  exist).
- **Sitemap segmentation:** keep a **single** sitemap for now (with hreflang once siblings exist);
  per-locale `sitemap-pt.xml`/`sitemap-fr.xml` is a Phase-C option, not needed for a single live locale.
- **Canonical/hreflang:** every new page carries a **self-referential locale-rooted canonical** —
  each hub canonical to itself (`/pt/filosofia/` → `…/pt/filosofia/`; the author hub →
  `…/pt/filosofia/louis-lavelle/`; each leaf → its own URL). For **hand-authored** hubs the canonical
  is a frontmatter `head: [['link', {rel: 'canonical', href: '…'}]]` entry; for **generated** leaves
  the canonical must be **emitted by `build-pipeline-segment-routes.py`** into each page's frontmatter
  `head` (the reader-shell components do not inject `<head>` and stay locale-unaware until Phase C). A
  test asserts every `/pt/…` page has a canonical equal to its own route. **Omit hreflang** while there
  is one UI locale; add reciprocal hreflang (incl. `x-default`) in Phase C, across UI-locale variants
  and edition translations. Discipline is mandatory then (each variant canonical-to-itself) or it
  _hurts_ SEO — see §8.

### 6.6 Generated exports / artifacts

- **`ROUTE_BASE` map (the one new abstraction):** website-owned, keyed by **`workId`** (book-only —
  podcast shows are not books and use their own `show_page_url` in `podcast-show-config.json`, §6.3),
  consumed by `build-pipeline-export.py` (re-projects each pt segment's `routePath` + the pt
  `routePrefix`) and `build-pipeline-segment-routes.py` (derives `OUT_DIR` from the re-projected
  `routePath` instead of a hard-code). Book-pipeline unchanged. One constant per book governs its
  `{locale}/{section}` home. **Keying model:** for Phases A/B exactly **one** edition is _published_ per
  work (the pt translation), so a single `ROUTE_BASE[workId]` is sufficient. **As implemented (A1, see
  §10):** the base is the full **work** prefix — `"pt/filosofia/louis-lavelle/introducao-a-ontologia"`,
  ending in the published edition's own-language work slug — and the per-segment **leaf** is a separate,
  website-owned `LEAF_POLICY` knob (book-pipeline still mints a corpus-relative `routePath` whose leaf is
  the single segment). Shrinking the base to `"{uiLocale}/{localizedSection}/{authorSlug}"` with a
  book-pipeline-relative editionSlug is the §6.4 Phase-C refinement. The
  axis that varies a base is the **UI locale**, not the edition language (the edition language only sets
  the own-language _slug_, Family E). So in **Phase C** the projection generalizes per **UI locale**:
  the _same_ work/edition is re-projected under each UI-locale root it is presented in —
  `pt/filosofia/louis-lavelle` and `fr/philosophie/louis-lavelle` — each keeping the edition's
  own-language slug (so e.g. the fr original lives at `/pt/filosofia/louis-lavelle/introduction-a-l-ontologie/`
  under pt UI _and_ `/fr/philosophie/louis-lavelle/introduction-a-l-ontologie/` under fr UI). The base is
  therefore best read as `(uiLocale, work) → "{uiLocale}/{localizedSection}/{authorSlug}"`; the pilot's
  single-locale `ROUTE_BASE[workId]` is the degenerate case. Do **not** key the base by edition language.
- **`pipeline-export-segments.json`** stays **locale-neutral data** (both pt + fr records, paired by
  `canonicalId`); only `routePath`/`routePrefix` are re-projected. Identity fields untouched.
- **`sidebar-nav.json`, `segment-manifest.json`, `reading-nav.json`** stay **site-wide singletons**
  (they describe identity/structure, not locale). `build-sidebar-nav.py` reads the re-projected
  `routePrefix` automatically — no code change. The legacy reading-nav/segment-manifest builders skip
  the pipeline family (markers), so the book moves don't touch them.
- **Podcast manifests** (`shows.json`, `episodes.json`) + `podcast-show-config.json` stay on their
  current routes until the later podcast IA reassessment decides whether any canonical podcast URL or
  feed URL changes.
- **Redirect artifacts** are **disabled/removed** (§7): flip `build-pipeline-redirect-map.py`
  `STATUS` (an existing constant, currently `"enabled"`) to `"disabled"` — its guard then skips
  writing the 12 redirect **entries** to `src/public/_redirects` (and the generator deletes the file
  when there are none) — and delete `pipeline-redirect-map-introduction-a-l-ontologie.json` + its spec.

### 6.7 Tests

~24 specs carry route literals; the move is mostly a constant swap (logic is route-agnostic). Groups:

- **Route-assertion** (`louis-lavelle.spec`, `pipeline-segment-routes.spec`, `sitemap.spec`,
  `homepage.spec`, `pipeline-work-contents.spec`, `pipeline-segment-nav.spec`, `reader-header.spec`,
  the preview specs) → update literals to the new paths (parameterize via a `PT_ROUTE_BASE` constant so
  a single edit re-points all).
- **Data-foundation** (`pipeline-export.spec`, `sidebar-nav.spec`, `segment-manifest.spec`) → update
  route constants only; identity joins (`canonicalId`/`segmentPrefix`) unchanged.
- **Reader-shell** (`reader-shell.spec`) → update example `PT_ROUTE`/`FR_ROUTE` constants; helpers
  unchanged.
- **Redirect** (`pipeline-redirect-map.spec`) → **delete** (clean break).
- **Podcast** (`podcast-show-page.spec`, `podcast-player.spec`, `podcast-episode-nav.spec`) → leave
  current `dist/podcast/…` paths unchanged in the book-locale phases; update only in a later dedicated
  podcast IA slice if canonical podcast routes change.
- **New — architecture guard:** assert the `ROUTE_BASE` projection (current base reproduces today's
  paths; a `pt/filosofia/...` base would derive `src/pt/filosofia/...` + `/pt/filosofia/...`), locking
  the projection for every section.
- **New — locale-IA invariants:** every `/pt/…` page carries a self-referential locale-rooted
  canonical matching its route (§6.5); no `works.json` or legacy-builder output exists under
  `src/pt/literatura/` and `/pt/literatura/` lists only pipeline-backed books (§6.2).

### 6.8 Docs superseded / reconciled

- **Superseded (freeze, mark at top):** `introduction-a-ontologia-live-migration-plan.md` (its old→new
  `/louis-lavelle/` route table predates locale roots), `website-export-ingestion-assessment.md`
  (already self-marked superseded; ingestion model still valid).
- **Extend:** `multilingual-book-url-architecture-assessment.md` — add the **site-UI-locale axis**
  (orthogonal to the Family E book-edition decision; Family E + locale roots = the full model);
  `reading-app-website.md` — note current `/louis-lavelle/…` paths move to `/pt/…` (model unchanged,
  namespace re-projected); `seo-strategy.md` — update `/louis-lavelle/` literals to `/pt/…` and cite
  the locale-root SEO rationale.
- **Keep:** `reader-shell-component-boundaries.md`, `reading-app-segment-workhub-assessment.md`,
  `sidebar-local-nav-model.md` (data/component foundations; add a pointer to the `ROUTE_BASE` boundary).
- **Source of truth:** this doc (whole-site) + `filosofia-ia-pilot-migration-assessment.md` (pilot
  execution).

---

## 7. Clean break / no redirects — and the three-tier debt distinction

- **Web URL 404 debt — acceptable for books/literature.** Old `/louis-lavelle/…` and old
  `/literatura/…` web URLs are allowed to 404. No new redirects; the existing 12 fr→pt `301`s are
  **disabled** (flip `build-pipeline-redirect-map.py STATUS` from `"enabled"` to `"disabled"` → its 12
  entries are no longer written to `src/public/_redirects`), the redirect-map JSON + its spec deleted.
- **Podcast web URLs are not included in this clean-break by default.** Current `/podcast/…` routes
  stay canonical until a dedicated podcast IA slice chooses a new route shape. If that later slice
  moves podcast web URLs, clean 404 debt can still be accepted intentionally, but it is not part of
  the book-locale rollout.
- **RSS/feed URL migration — acceptable only if explicitly chosen.** Feeds may move _only_ if the
  podcast IA slice changes the canonical feed URL, and only when distribution platforms are updated
  and each feed is verified afterward (Appendix A). The feed URL is a syndication contract with
  Apple/Spotify/etc., not a normal web route — migrating it is an operational action, not a redirect.
- **What must not happen:** a feed URL silently changing (or the old feed disappearing) **without** the
  platform-update step — do not rely on feed redirects as the migration mechanism. The authoritative
  move is the platform-side feed URL update plus verification. Any future feed-migration slice is
  therefore gated on the platform checklist + verification.

**SEO cost, stated honestly:** the live pt reading pages lose their old-URL equity (re-crawled at
`/pt/…`; no `301` to carry rank); legacy literatura/Lavelle URLs 404 on removal. Podcast keeps its
current monolingual SEO surface until reassessed. Accepted for a clean, future-proof,
multilingual-ready book foundation. Hubs remain the discovery surface; leaves stay
crawlable-but-pruned (§6.5).

---

## 8. SEO + reader clarity (first-class)

The detailed comparison (locale-rooted vs language-mixed) is in `filosofia-ia-pilot-migration-assessment.md`
§2.7; the whole-site conclusions:

- **Reader clarity:** the UI-locale root fixes the chrome — a Brazilian reader is never dropped into a
  mixed-language surface; a French reader (Phase C) gets French nav/section names/metadata/search. The
  content edition (e.g. the French original under a pt UI) is surfaced by a _labelled_ edition switcher,
  never by switching the chrome.
- **Language signals:** locale roots give consistent `<html lang>` per subtree, language-aligned URL
  tokens (`/fr/philosophie/`), localized metadata, per-language sitemaps/search (Phase C), and clean
  `hreflang` — strongest exactly where a pt-named `/filosofia/` fails (non-pt surfaces).
- **Podcast:** keep `og:locale` = target language on shows/episodes (a French-learning show _is_ French
  content). Current `/podcast/…` routes are acceptable while podcast pages are monolingual. A future
  `/pt/podcast/` should be treated as a Portuguese directory/landing page unless a later podcast IA
  deliberately chooses otherwise; canonical show/episode roots may instead be target-language
  (`/fr/podcast/`, `/es/podcast/`, `/en/podcast/`) if SEO and reader clarity justify the move.
- **Cost/discipline:** locale roots multiply URLs in Phase C (edition × locale); that duplicate content
  must be governed by correct `canonical` + reciprocal `hreflang` or it hurts SEO. The single-locale
  Phases A/B have **no** such exposure (one clean pt surface) — the upside accrues as locales are added,
  which is exactly why reserving `/pt/` now (vs `/filosofia/`) avoids re-pointing every
  canonical/hreflang/sitemap entry later.
- **Clean 404 break vs redirects:** acceptable and preferred here — the architecture win outweighs the
  transient equity loss, and redirect upkeep across a growing locale × section matrix would be a
  liability.

---

## 9. "Do not do" list

- Do **not** build a bare `/filosofia/` (or any non-locale section prefix).
- Do **not** mechanically move old `/literatura/` (or legacy Lavelle) pages into `/pt/`; rebuild via
  pipeline or leave legacy.
- Do **not** create or re-point redirects; do **not** keep the fr→pt `_redirects` block; do **not** add
  a Cloudflare redirect step.
- Do **not** silently change/remove a podcast feed URL without the platform-update + verification step.
- Do **not** assume `/pt/podcast/` is the canonical podcast answer. Keep current podcast routes until
  a dedicated podcast IA slice weighs Portuguese-directory vs target-language-root options.
- Do **not** localize the `podcast` URL token if podcast moves; do **not** localize author/edition
  **slugs** (only labels/copy localize).
- Do **not** adopt VitePress `locales` config, build a locale switcher, move the home to `/pt/`, fork a
  `/pt/404/`, or add hreflang in Phases A/B.
- Do **not** treat `routePath` as identity or change `canonicalId`/`segmentPrefix` during any move.
- Do **not** big-bang the whole site; phase it content-first.
- Do **not** (this slice) implement any route move, redirect change, generator change, component change,
  or content deletion — this is doc-only.

---

## 10. Implementation slices, in order

**Phase A — Filosofia pilot (proves + locks the scheme).** As in the pilot doc:

- **A1 / IA-1** — Introduce the website `ROUTE_BASE` projection (map + `OUT_DIR`-from-`routePath`
  derivation + `routePath`/`routePrefix` re-projection), **set to reproduce current paths** (zero
  visible change) + the architecture-guard test. _This is the shared foundation for every later section._
  **Status: implemented** on `develop` — `scripts/route_base.py` owns two website knobs: `ROUTE_BASE`
  (keyed by `workId`, the full `{locale}/{section}/{author}/{editionSlug}` work prefix) and `LEAF_POLICY`
  (how the per-segment leaf is formed). `build-pipeline-export.py` re-projects the published (pt)
  edition's `routePath`/`routePrefix` and `build-pipeline-segment-routes.py` derives its output dir from
  the projected `routePath`; `tests/pipeline-route-base.spec.ts` is the guard. Output is byte-identical
  today (current base + the default `vendored-slug` leaf), so **A2 flips both knobs**: `ROUTE_BASE[…]` →
  `pt/filosofia/louis-lavelle/introducao-a-ontologia` **and** `LEAF_POLICY` → `prefix-only` (leaf = the
  bare `segmentPrefix`), giving `/pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008`.
  Prefix-only leaves keep URLs stable while `displayTitle`/`publicSlug` stay free to change (readers
  never type leaf slugs; `segmentPrefix` is unique per edition); the guard already proves this two-knob
  projection.
- **A2 / IA-2** — Flip **both knobs**: `ROUTE_BASE` → `pt/filosofia/louis-lavelle/introducao-a-ontologia`
  **and** `LEAF_POLICY` → `prefix-only`; regenerate the hub + 99 leaves under `src/pt/filosofia/…`
  (leaves become `<segmentPrefix>.md`); delete the old `src/louis-lavelle/introducao-a-ontologia/` tree;
  update test constants.
  **Status: implemented** on `develop`. The pilot reader now lives at
  `/pt/filosofia/louis-lavelle/introducao-a-ontologia/<segmentPrefix>`; the old
  `/louis-lavelle/introducao-a-ontologia/…` URLs 404 (clean break — redirect disable/removal is A4, so the
  generated `_redirects` still exists with its targets re-pointed to the new live routes). Only the moved
  pipeline work changed: identity (`canonicalId`/`segmentPrefix`/`workId`/`language`/`editionRole`), the fr
  source edition, literatura, and podcast are untouched, and no fr pages are generated. **Build-integrity
  consequence:** the relocated book left the legacy `louis-lavelle` discovery surfaces — its stale entry was
  pruned from `src/louis-lavelle/works.json`, so the `/louis-lavelle/` hub CardGrid + `build-sidebar-nav.py`
  output no longer 404 into the moved tree. (The legacy hub's hand-authored JSON-LD in `index.md` still lists
  the moved book at its old 404 URL; that non-visible structured data is cleaned with the rest of the legacy
  hub in A5 — it is not visible content, not build/test-checked, and the page is an A5-removal target.) A
  **minimal** locale-rooted `isChapterRoute` rule keeps the new leaves crawlable-but-pruned (hub kept); the
  metadata-aware generalization is A3. **Not done here (A3):** the `/pt/filosofia/` section + author hubs and
  the locale-rooted nav/sidebar entry.
- **A3 / IA-3** — Create `/pt/filosofia/` + `/pt/filosofia/louis-lavelle/` hubs + `philosophyAuthorCards`;
  nav/sidebar; generalize `isChapterRoute` (metadata-aware); LLM unchanged; hub/section tests.
  **Status: implemented** on `develop`. Hand-authored SSR CardGrid hubs at `/pt/filosofia/` (section,
  `philosophyAuthorCards` in `authors.ts`) and `/pt/filosofia/louis-lavelle/` (author); the Introdução
  work card is sourced from pipeline-export metadata via `filosofia-cards.ts` (route + title from the
  export — `works.json` is **not** reintroduced for the migrated book). Both hubs carry a self-referential
  locale-rooted canonical and are in the sitemap; the work hub + 99 prefix-only segment leaves are
  unchanged. `isChapterRoute` was **generalized to marker-aware**: a `transformPageData` hook collects
  any `generated: pipeline-segment-routes` page into `pipelineSegmentRoutes` (mirroring `bufferRoutes`),
  and the sitemap drops those — replacing the temporary `pt/filosofia` depth rule and covering any future
  locale/section with no path rule (the legacy `literatura`/`louis-lavelle` chapter depth rules stay until
  B4/A5). A global nav `Filosofia → /pt/filosofia/` entry was added (independent `activeMatch`; legacy
  Lavelle nav stays until A5). **Deliberately NO rented config sidebar** for `/pt/filosofia/`: the nav +
  CardGrid hierarchy give complete discovery without hard-coding the migrated book's pipeline route into a
  sidebar (a scoped key can be added if the section grows).
- **A4 / IA-4** — Disable the fr→pt redirects (`STATUS="disabled"`), delete the redirect-map JSON +
  spec.
  **Status: implemented** on `develop`. Took the cleaner option (the obsolete map was purely
  historical): **deleted** `scripts/build-pipeline-redirect-map.py`, its
  `.vitepress/theme/data/pipeline-redirect-map-introduction-a-l-ontologie.json`, `src/public/_redirects`
  (it held only the 12 fr→pt lines — `src/public/_headers` is unrelated and untouched), and the dedicated
  `tests/pipeline-redirect-map.spec.ts`; removed the generator from the `pnpm build` chain + the
  `pipeline:redirect-map` npm script. The build no longer emits `_redirects` (determinism asserted). Old
  `/louis-lavelle/introduction-a-l-ontologie/<chapter>` URLs now **404** (accepted clean-break debt); the
  12 legacy fr chapter pages + fr hub still build (removed in A5) but are no longer redirect sources.
  Redirect assertions in `pipeline-publication-gate`/`pipeline-segment-routes`/`pipeline-discovery-hygiene`
  were flipped to clean-break; `tests/redirects-clean-break.spec.ts` is the focused new-policy proof.
- **A5 / IA-5** — Remove the legacy Lavelle corpus + builders + legacy author hub once green.
  **Status: implemented** on `develop` — **Phase A is complete.** Deleted the whole `src/louis-lavelle/`
  tree (legacy author hub + `works.json`, the 9 originals + `a-consciencia-de-si`, and the old fr
  `introduction-a-l-ontologie` hub + 12 chapter pages), all 11 `scripts/build-lavelle-*.py` builders,
  `tests/louis-lavelle.spec.ts`, and the orphaned `src/public/images/louis-lavelle/` assets (the new
  hub's `/images/authors/louis-lavelle.webp` is kept). Removed the `Lavelle` nav item, the
  `'/louis-lavelle/'` sidebar group, the dead `louis-lavelle` `isChapterRoute` rule, and the obsolete
  `louis-lavelle/introduction-a-l-ontologie` llms ignore entries; dropped the `louis-lavelle` corpus from
  the shared `build-reading-nav.py` / `build-sidebar-nav.py` / `build-segment-manifest.py` generators and
  regenerated their manifests. Retargeted the homepage pillar + JSON-LD + the 404 page from
  `/louis-lavelle/` to `/pt/filosofia/louis-lavelle/`. **Final Phase A state:** the only public Lavelle
  surface is `/pt/filosofia/louis-lavelle/` + the live pt _Introdução à ontologia_ reader at
  `/pt/filosofia/louis-lavelle/introducao-a-ontologia/` (99 prefix-only leaves); old `/louis-lavelle/`
  URLs 404 (clean break, no redirects). `tests/legacy-lavelle-removed.spec.ts` is the removal guard.
  Coverage retired with the corpus (no replacement subject exists): WorkContents grouped-mode, the
  segment-manifest segment-level/inferred-book classification, and the French reading-nav labels — all
  exercised only by the removed lavelle works; they return with a future authored-grouped/French work.
- **A6 — Homepage + global three-pillar frame (closes Phase A).** Reframe the public site around three
  pillars — **Literatura / Filosofia / Podcast** — as the first-level mental model, WITHOUT migrating
  books or podcasts. **Status: implemented** on `develop`. `Home.vue` was refactored in place from a 76px
  marketing hero + three `.vt-box` cards into a calm editorial index: a quiet left-aligned masthead
  (eyebrow `Engenharia de Letras` → token-scaled `skepvox` wordmark → subline, reusing the
  `PodcastShowHeader` rhythm) over a hairline table-of-contents of three `SkLink` rows — tokens only, no
  cards/shadows, mobile-first. Pillars: **Literatura → `/literatura/`** (current legacy surface, unmoved),
  **Filosofia → `/pt/filosofia/`** (the locale-rooted section), **Podcasts → `/podcast/`** (current,
  unmoved). The global nav was reordered to the same Literatura/Filosofia/Podcasts model; the homepage
  JSON-LD (`ItemList`/`about`), the site-level description, and the 404 page were reframed to the three
  sections and no longer foreground the author. No `/louis-lavelle/` links, no `/pt/literatura/` content,
  no redirects, no podcast/RSS/media changes; route `/` preserved. Guards: `tests/homepage.spec.ts`
  (rewritten) + `tests/homepage-ia-pillars.spec.ts` (new). **Phase A is now complete.**

  _Agreed sequence after A6 (Phase B):_ (1) a **`/pt/literatura/` pilot** with _Memórias Póstumas de Brás
  Cubas_ rebuilt from book-pipeline — a pipeline rebuild, **not** a mechanical move of the legacy
  `/literatura/` pages; (2) **consolidation / simplification / test-protocol** before multiplying more
  books; (3) the **podcast IA reassessment stays later** (podcast routes/feeds untouched until then).

**Phase B — Extend the proven scheme (reuses A1's projection, no new scheme risk).**

- **A6 — Homepage / global pillars (first, before the next content migration):** align the homepage and
  global nav around `Literatura`, `Filosofia`, and `Podcast`; `Filosofia` points to `/pt/filosofia/`,
  while Literatura keeps its current surface until the Brás Cubas pipeline pilot and Podcast keeps its
  current surface until its own IA reassessment. No route move.
- **B1 — First `/pt/literatura/` book: _Memórias Póstumas de Brás Cubas_ via pipeline rebuild:** vendor
  its book-pipeline export; ingest + generate at `/pt/literatura/machado-de-assis/bras-cubas/…` via the
  owned reader shell; create `/pt/literatura/` + `/pt/literatura/machado-de-assis/` hubs
  (pipeline-only author cards); nav/sidebar/tests. Old `/literatura/` stays legacy.
- **B2 — Consolidation / simplification / test protocol:** before adding another book, audit the
  accumulated helpers, docs, generated artifacts, and growing Playwright surface; consolidate where
  possible; define which invariants must be broad regression tests vs focused per-slice tests. This is
  the guardrail pass before multiplying books.
- **B3 — Owned social/footer/icon layer:** implement the deferred social-presence strategy after the
  consolidation pass: owned social-link data, an owned `SocialIcon` seam for missing platform glyphs
  (Instagram, YouTube, Spotify, Apple Podcasts, RSS, etc.), a `SocialLinks` component, and then a quiet
  owned footer. This replaces the constrained `@vue/theme` `socialLinks` path instead of adding wrong
  glyph workarounds.
- **B4 — Remaining literatura books** (_Vidas Secas_, then the novels) + remove legacy `/literatura/`
  once each author's corpus is rebuilt.
- **B5 — Podcast IA reassessment (later):** keep current `/podcast/…` routes unless the reassessment
  deliberately chooses a new canonical podcast shape. Compare three options: (1) keep `/podcast/…` as
  a language-neutral podcast namespace; (2) add `/pt/podcast/` as a Portuguese directory/landing page
  only; (3) move canonical show/episode surfaces to target-language roots such as `/fr/podcast/`,
  `/es/podcast/`, `/en/podcast/`. Only if a feed URL changes, run the **platform-update checklist**
  (Appendix A) and verify every feed.

**Phase C — Full multilingual programme (separate, large).** `/fr/`, `/en/`, `/es/`, `/ru/` roots +
localized section names/nav/footer/search/metadata; `/` → locale negotiation + locale switcher;
hreflang fleet (UI-locale variants + edition translations) with canonical discipline; per-locale
sitemap/search/LLM segmentation; VitePress `locales` adoption; `PipelineEditionSwitch` go-live (needs
≥2 live editions of a work).

---

## 11. Exact first implementation prompt (slice A1 — the shared foundation)

> Implement slice **A1 / IA-1** of the locale-rooted website IA in `skepvox-website` on `develop`, no
> branch, commit-only (do not push). **No user-visible route change** and **no book-pipeline change.**
>
> Goal: introduce the website-owned `{locale}/{section}` route-base projection used by the pipeline
> generators — proven on the filosofia pilot book but reused by every later section — while still
> emitting today's `louis-lavelle/introducao-a-ontologia` paths, so the locale-rooted move later is a
> one-constant change.
>
> Do:
>
> 1. Add a shared, identity-keyed `ROUTE_BASE` map (keyed by `workId`), used by the generators, e.g.
>    `ROUTE_BASE = { "louis-lavelle/introduction-a-l-ontologie": "louis-lavelle/introducao-a-ontologia" }`.
>    **Set it to reproduce the current paths exactly.**
> 2. In `scripts/build-pipeline-export.py`, project each pt segment's `routePath` and the pt
>    `work.editions[].routePrefix` from `ROUTE_BASE` + the book-relative leaf, instead of passing the
>    vendored value through verbatim. Output `pipeline-export-segments.json` must be **byte-identical**
>    for the pt edition (fr unchanged).
> 3. In `scripts/build-pipeline-segment-routes.py`, replace the hard-coded `OUT_DIR` with a directory
>    **derived from the (projected) `routePath` prefix** (`src/<routePath-without-leaf>/`). The 99 pt
>    pages must regenerate to the **same** `src/louis-lavelle/introducao-a-ontologia/` location,
>    byte-identical.
> 4. Add an architecture-guard test asserting: (a) for the current `ROUTE_BASE`, a sample segment's
>    derived directory is `src/louis-lavelle/introducao-a-ontologia` and `workHubHref(routePath)` is
>    `/louis-lavelle/introducao-a-ontologia/`; and (b) a hypothetical `ROUTE_BASE` of
>    `pt/filosofia/louis-lavelle/introducao-a-ontologia` would yield `src/pt/filosofia/louis-lavelle/…`
>    and `/pt/filosofia/louis-lavelle/…/` — locking the `{locale}/{section}` projection for every
>    section without moving anything.
> 5. Update generator/reader-shell comments to state the source-of-truth boundary (book-pipeline owns
>    book-relative identity/path; the website owns the `{locale}/{section}` prefix via `ROUTE_BASE`).
>    Reference `docs/locale-rooted-website-ia-assessment.md` + `docs/filosofia-ia-pilot-migration-assessment.md`.
>
> Do **not**: change any emitted route or filename; create/modify hubs, nav, sidebar, redirects, podcast
> or literatura paths, or the fr edition; touch `build-pipeline-redirect-map`, legacy Lavelle/literatura,
> or book-pipeline. Run `pnpm verify`; confirm the regenerated `pipeline-export-segments.json` and
> `src/louis-lavelle/introducao-a-ontologia/` tree are unchanged (a no-op diff except the generator
> internals + the new test). Commit on `develop`.

---

## Appendix A — Conditional podcast feed platform-update checklist (later podcast IA, per show)

This checklist is **conditional**. It applies only if a future podcast IA slice deliberately changes a
canonical feed URL. The current recommendation is to keep `/podcast/…` routes and feeds unchanged
until that reassessment.

For **each** of `francais`, `espanol`, `english`:

1. Update `scripts/podcast-show-config.json` → `show_page_url` and `rss_feed_url` to the chosen new
   canonical form (for example a target-language root such as
   `https://www.skepvox.com/fr/podcast/francais/feed.xml`, if that is the selected strategy).
2. Re-run `sync-podcast-lesson-pages.py` + the build so episode/show pages, `episodes.json`,
   `shows.json`, canonicals, and the static `feed.xml` regenerate at the chosen new route. **Feed-XML
   detail:** the sync should regenerate each RSS item's `<link>` (and the channel `<link>`) from the new
   `show_page_url` — e.g. `…/podcast/francais/001-le-badge` → the chosen new page route. The
   `<enclosure>` audio URLs are on the **media CDN** (`media.skepvox.com/…`), **not** the website
   route, so they stay unchanged. (Note: `sync-podcast-lesson-pages.py` does not currently rewrite
   `feed.xml`; the feeds are static today, so this step either teaches the sync to rewrite the item
   `<link>`s or the three `feed.xml` files are updated in the same pass — confirm which in the podcast
   IA implementation slice.)
3. **(Optional, recommended) overlap window:** keep the old `src/public/podcast/{show}/feed.xml`
   serving the _same_ content for the cut-over period (a courtesy, **not** a redirect) so no subscriber
   sees an empty feed mid-switch; remove it after step 5 confirms.
4. **Update the feed URL in each distribution platform** the show is published on (Apple Podcasts
   Connect, Spotify for Podcasters, and any aggregator) to the new `feed.xml` URL.
5. **Verify:** the new `feed.xml` returns 200 + parses as valid RSS; every item `<link>` resolves
   (200) and every `<enclosure>` (CDN) resolves (200); each platform shows the feed pulling from the
   new URL and lists the existing episodes (no duplication, no gap). Record the verification per show
   before removing the old feed.
6. **Monitor + rollback window:** platform sync typically reflects within **12–48 h**. Keep the
   overlap-window old `feed.xml` (step 3) live until each platform confirms the new URL. If a platform
   has not synced after **48 h** (or step 5 fails on it), **roll back** that show's website feed to the
   old `/podcast/{show}/feed.xml` (restore the old file, revert `rss_feed_url`), re-run step 4 on the
   lagging platform, then retry. Only remove the old feed once all targeted platforms confirm.

**Gate:** any podcast feed-migration slice is not "done" until all changed feeds pass step 5 **and**
step 6's monitoring window closes clean. A silent feed move (no platform update) is explicitly
disallowed (§7). If the future podcast IA keeps the current feed URLs, this checklist is not invoked.

## Appendix B — Risks

| Risk                                                                       | Likelihood       | Mitigation                                                                                                                |
| -------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Split-brain IA (`/pt/<section>` beside legacy locale-less siblings)        | High (by design) | Content-first phasing; clean-break posture; converge nav as sections land.                                                |
| Podcast feed orphaned by a missed platform update                          | Med if route moved | Avoid moving feeds by default; if moved, Appendix A gate + per-show verification; optional overlap window.                 |
| Legacy-website assumptions leak into `/pt/literatura/`                     | Med              | Pipeline-only rule; author-hub cards from pipeline metadata not `works.json`; tests assert no legacy output under `/pt/`. |
| Scheme churn (`pt` vs `pt-BR`, section/Cyrillic slugs) re-migrates `/pt/…` | Low              | Lock the scheme in A1's doc (coarse `pt`, ASCII section slugs).                                                           |
| SEO equity loss on 404'd old URLs                                          | High             | Accepted per clean break; hubs remain discoverable; optional single deliberate redirect later if ever wanted.             |
| Phase-C hreflang/canonical done wrong → duplicate-content penalty          | Med (future)     | Discipline owned by the multilingual programme; no exposure in Phases A/B.                                                |
| `build-pipeline-export.py` is single-book hard-coded (`BUNDLE`)            | Low now          | Parameterize over a works list when the 2nd book/edition vendors (Phase B/C).                                             |
