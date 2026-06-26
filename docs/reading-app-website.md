# Reading App (website side) — pipeline-export ingestion, routes, discovery (canonical)

> **Canonical entry point** for the website's reading-app / pipeline-export work: ingestion, the live pt
> route family, route migration, discovery hygiene, live-route behavior, and remaining work. The
> pipeline/export source-of-truth is **`skepvox-book-pipeline/docs/website-export-contract.md`**. The
> deeper design model and the route-migration plan-of-record are referenced in §12; this doc is the place
> to start.

---

## 1. Current live state

- **pt _Introdução à ontologia_ is live** at `/pt/filosofia/louis-lavelle/introducao-a-ontologia/`
  (locale-rooted as of slice A2; the old `/louis-lavelle/introducao-a-ontologia/` 404s) — a work **hub**
  plus **99 segment pages** (leaves are the bare `<segmentPrefix>`), each with **real prose**. This is the
  single canonical reading surface.
- The **12 old fr chapter URLs 404** — slice **A4** removed the redirect map and `src/public/_redirects`
  (clean break, no redirects); they are **not** redirected to pt.
- The **fr edition** (12 chapter pages + the full-text hub) and the **whole legacy `/louis-lavelle/`
  corpus** were **removed in slice A5** (Phase A complete). The only Lavelle surface now is the
  locale-rooted `/pt/filosofia/louis-lavelle/` hub + the live pt edition; old `/louis-lavelle/` URLs 404.
- The **homepage + global nav are a three-pillar index** (slice A6, closing Phase A): **Literatura
  (`/literatura/`) / Filosofia (`/pt/filosofia/`) / Podcasts (`/podcast/`)**. `Home.vue` is a calm
  editorial masthead + hairline table-of-contents (no marketing hero, no cards), consistent with the
  reader shell. Literatura + Podcasts keep their current surfaces; no books/podcasts were migrated.
- **`reading-review/**`** holds internal demo/prototype surfaces (map, single-leaf, windowed reader,
full-work reader) — all `buffer:true`+`search:false`+`noindex`, out of sitemap/search/LLM.

---

## 1a. Reader-template readiness gate — CERTIFIED (Slices A–E)

**Slices A–E (`docs/reader-experience-next-level-roadmap.md`) are the settled reader-template
foundation.** The pt _Introdução à ontologia_ flow (hub + leaves + nav + icons) is the proof template
the fr edition and every next book will inherit. **Getting this template right once — here — is a key
foundation we follow through _before_ multiplying books/editions**; fixing chrome across two editions
and many books later is far more expensive. The Slice-E readiness gate (an audit/test/doc pass — a
4-lens adversarial certification, live contrast/perf measurement, and a four-matrix visual sign-off)
**found no blockers**.

**Certified ready to multiply:**

- **Owned reader shell, zero docs artifacts.** Hub + leaves carry no rented pager / sidebar / aside /
  edit-link / duplicated title / unrelated next-book pager (built-HTML asserted). The hub is one
  composed bookish surface with exactly one component-owned `<h1>`; leaves are real `<h2>`/`<h3>`
  (SEO preserved) with the prose visually dominant and no typographic event trecho→trecho.
- **Owned interaction + symbol language.** `ReaderIcon` is the only glyph source (4-name closed set,
  no dependency); `SkLink` is the only link primitive; chapter disclosure is a real `<button>` with
  `aria-expanded`/`aria-controls`; current-location is the inset accent bar + `aria-current`; focus
  rings live on controls; motion is reduced-motion-gated; localStorage stores only the boolean collapse
  preference. (Slices C1–C4 lock this; Slice E re-certifies.)
- **A11y / contrast (measured).** Icons ~4.6:1 light / ~6.3:1 dark; the three small-caps apparatus
  lines (edition kicker, Abertura, part divider) all clear the 3:1 UI bar in both modes, and the
  authored part divider stays ~2–2.7× brighter than the muted labels (the Slice-D "undifferentiated
  grey" concern is **measured-resolved**, no token change needed). ≥44px tap targets hold.
- **Composition.** Bookish serif title + serif TOC entries with sans apparatus (Slice D); the
  front-matter bucket now renders under a subordinate **"Abertura"** render-layer group (derived from
  the loose/empty-`groupPath` segments — no invented Part, no data change).
- **Performance boundary.** `pipeline-export-segments.json` is metadata-only (no prose field); the hub
  loads metadata only; each leaf is its own static page loading only its own prose — no all-N bundle.
  (Tested.)
- **Discovery.** The hub is indexable + in the sitemap; deep pt segments are crawlable but
  sitemap-pruned; `reading-review/**` + the icon harness stay noindex/out-of-sitemap/out-of-LLM; no
  fr/old-chapter/reading-review links leak onto the hub or leaves.

**Deferred — the bounded first task of the fr edition (not a blocker, scoped out of Slice E):**

- **Leaf-nav + hub-mount parameterisation.** `PipelineWorkContents` is fully parameterised
  (`workId`/`language`/`title`/`author` props + per-language `NAV_LABEL`/`EDITION_WORD`/`OPENING_LABEL`
  maps) and `PipelineReaderHeader` is frontmatter-driven, but **`PipelineSegmentNav` still hard-codes
  the pt hub URL (`const HUB`) and the pt word "Sumário"**, and **`PipelineWorkContentsMount` mounts
  with no props** (so a fr hub would render pt defaults). The fr work's first step: derive `HUB` from
  the current segment's `routePath` (verified to yield the correct pt **and** fr hub), key the nav
  contents/direction words off the leaf's `pipelineLanguage` via a `NAV_LABEL`-style map, and have the
  mount pass frontmatter-derived props. A localized, low-risk change — _no other reader chrome needs to
  change to add fr._
- **Expanded segment-row pitch.** The expanded TOC rows sit at the **44px tap-target floor**
  (contiguous, so pitch = tap target); the rows are centered within that floor, but the pitch cannot
  drop below 44px without breaching the ≥44px guardrail. A genuinely tighter, denser printed-contents
  pitch (e.g. ~38–40px, common for dense reading-app TOCs) is available **if** the ≥44px target is
  relaxed — a deliberate product trade-off, left open.
- **Out of scope by policy / parked:** the edition switcher (`PipelineEditionSwitch`, meaningful only
  with two editions), a shared `ContentsTree` (second pipeline work), a View-Transitions cross-fade,
  and any progress/personal state (see §10).

## 2. Ingestion model (how the website consumes the export)

- **Vendored export.** A committed copy of the pipeline export lives at
  `.vitepress/theme/data/pipeline-export/`; `scripts/build-pipeline-export.py` reshapes it into
  `.vitepress/theme/data/pipeline-export-segments.json`. **No cross-repo build read for production** —
  re-vendoring is a deliberate manual step.
- **Join by `(canonicalId, language)`, never `routePath`.** `routePath` is presentation (the public URL,
  used as href + as the generated filename); `canonicalId` is identity.
- **Prose is vendored body-only + sanitized per segment** and generated **into each page as static
  Markdown** (`scripts/build-pipeline-segment-routes.py`); a stable public page with **no prose is a hard
  generator failure** (no thin / "not vendored" placeholder on a public page).
- The website **never segments** and **never infers structure from filenames/slugs** — it reads
  `groupPath` (authored Part → Chapter) and the lifecycle flags from the export.

## 3. Route family + work hub

- 99 pt segment pages are generated at `src/pt/filosofia/louis-lavelle/introducao-a-ontologia/<segmentPrefix>.md`
  (slice A2: locale-rooted prefix + prefix-only leaf).
- The work **hub** (`index.md`) is generated from pipeline-export **metadata only** (authored
  Part → Chapter → Segment links into the 99 routes) — **no full-book concatenation**.
- The pipeline family is kept **out of the legacy hand-authored reading system**: pages carry a
  `generated: pipeline-segment-routes` / `pipeline-work-hub` marker and `build-reading-nav.py` skips them,
  so `reading-nav.json` / `segment-manifest.json` / `WorkContents` are untouched.

## 4. Stability-aware visibility gate

`scripts/pipeline_gate.py` (`route_visibility`) decides each segment's public visibility from its
metadata: **eligible (indexable) iff `urlStability == "stable"`** (the pipeline's explicit publish
signal); everything else is hidden (`buffer` + `noindex`, out of sitemap/search/LLM). It drives the
generated-page frontmatter. **`urlStability` gates indexing/canonical/sitemap/search/LLM** — nothing
draft is public.

> **B3 — the gate no longer requires a `publicSlug`.** The pipeline sets `stable` under TWO publication
> models (book-pipeline export contract §5): a **slug-tail** work (Lavelle) freezes a `publicSlug`; a
> **prefix-only** work needs none — its bare `segmentPrefix` is the permanent public leaf. Requiring a
> `publicSlug` too would wrongly hide prefix-only public books, so the gate keys on `urlStability` alone.
> Still safe: Lavelle fr (draft source), reading-review buffers, and any unpublished work are never
> `stable`. **Brás Cubas is the first prefix-only public book** — `/pt/literatura/machado-de-assis/bras-cubas/`
> + its 163 `…/<segmentPrefix>` leaves are live/indexable (hubs in the sitemap; leaves crawlable but
> marker-pruned; in search + LLM), with **no `publicSlug`, no slug tail, and no redirects**.

## 5. Owned reading navigation

`PipelineSegmentNav.vue` renders prev/next (Trecho anterior / Próximo trecho) + an up link on the live pt
leaves, injected via the theme content slots (page bodies untouched), self-gated by the generated marker,
joining by `(canonicalId, language)`, **pt-only** (never crosses edition/language), using `SkLink` (focus
owned by the primitive; hover pointer-gated). The `reading-review/` prototypes
(`PipelineWindowPreview` / `PipelineReaderPreview`) are the windowed + zoom-out demos.

## 6. Route migration & redirects (redirects removed in A4 — clean break)

> **Superseded (slice A4 / IA-4):** the redirect machinery below was a temporary go-live cutover and is
> **gone** — `build-pipeline-redirect-map.py`, the redirect-map JSON, and `src/public/_redirects` were
> deleted, and old fr chapter URLs now 404 (no redirects). The historical description is kept for context.

`scripts/build-pipeline-redirect-map.py` emits the redirect-map artifact
(`.vitepress/theme/data/pipeline-redirect-map-introduction-a-l-ontologie.json`, `status: "enabled"`) and
`src/public/_redirects` (12 × `301`): each old fr chapter URL → the **first pt segment** of that chapter
(shared `BB-PP-CCC`, lowest `SSS`). Targets are built pt pages with real prose, never an unbuilt fr
segment route. The artifact encodes the source/target decision (`sourceLanguage: fr` →
`targetLanguage: pt`, `targetEdition: canonical`). The old→new route table of record is in
[`introduction-a-ontologia-live-migration-plan.md`](introduction-a-ontologia-live-migration-plan.md) §6.

## 7. Discovery hygiene (one canonical reading surface)

- pt hub + segments **indexable**; the hub is **in the sitemap**; deep pt segment routes are
  sitemap-pruned (`isChapterRoute`) but crawlable via the hub + nav.
- The fr edition (chapters + full-text hub) is **out of local search** (`search: false`) and **out of LLM
  output** (`config.ts` `llmstxt` `ignoreFiles`); chapters are out of the sitemap.
- `reading-review/**` stays excluded from sitemap/search/LLM.

## 8. Invariants (durable decisions; full set in the pipeline contract)

- **`canonicalId` is identity; `routePath` is presentation** (used only as URL/href/filename).
- **`segmentPrefix` is stable and never casually renumbered.**
- **`displayTitle`/`displaySlug` stay mutable; `publicSlug` freezes only at publication** (pipeline-minted).
- **`urlStability` gates indexing / canonical / sitemap / search / LLM.**
- Prose is **emit-all, body-only, sanitized, keyed by `segmentPrefix`** (the website re-vendors it).
- `structure.yaml` owns authored hierarchy above the segment; `published-routes.yaml` owns frozen public
  slugs — both pipeline-side.
- **Kairos is personal review state, never a public export source.**
- The **website consumes a clean export and never produces segmentation.**
- **pt _Introdução à ontologia_ is the first live migrated edition**; the old fr chapter URLs 404 (clean
  break — no redirects; slice A4).

## 9. Remaining website work

- Resolve open decision **A** (retire vs redirect the fr full-text hub — see §11).
- When the pipeline broadens to a second work (open **B**), re-vendor + generate its family the same way
  (gate, hub, nav — no redirects, clean break), and vendor its prose per published segment.
- A stability-aware sitemap policy generalization (today deep pt routes are pruned by `isChapterRoute`;
  a future `urlStability`-keyed rule would generalize across works).

## 10. Deferred ideas (parked)

- **AI reading companion.**
- **Segment-level reading-progress colour map.**
- **Mature WorkContents / zoom-out reader UI** (see the segment/work-hub assessment in §12).
- **Personal translation-review companion** (Kairos-side; never a public export input).

## 11. Open decisions

- **A. Retire or redirect the French full-text hub** (`/louis-lavelle/introduction-a-l-ontologie`) — left
  served today (out of search/LLM, still a 200 page in the sitemap as an fr-language page); redirecting it
  to pt would kill the fr edition, an editorial call not yet made.
- **B. How to broaden to the next book.**
- **C. Route-migration strategy for older website works.**
- **D. Mature WorkContents / zoom-out reader design.**
- **E. Personal review companion skill/agent design.**

## 12. Reference docs (depth / history)

- [`website-export-ingestion-assessment.md`](website-export-ingestion-assessment.md) — Slice 2A ingestion
  analysis (superseded by this doc + the realized ingestion).
- [`introduction-a-ontologia-live-migration-plan.md`](introduction-a-ontologia-live-migration-plan.md) —
  the route-migration plan of record (incl. the §6 old→new route table); executed.
- [`reading-app-segment-workhub-assessment.md`](reading-app-segment-workhub-assessment.md) — the deep
  segment/reading **data model**, granularity invariants, and two-state reading model (the design
  substrate behind open decisions **D**/**E**).
- [`work-contents-component-spec.md`](work-contents-component-spec.md) — spec for the **live** WorkContents
  component (de-l-acte / Brás Cubas), the hand-authored reading-nav path (distinct from the pipeline family).
- `archive/` — historical: `book-pipeline-website-export-contract-assessment.md`,
  `reading-app-next-session-handoff.md`.
- Pipeline / export contract: **`skepvox-book-pipeline/docs/website-export-contract.md`**.
