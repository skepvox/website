# Reading App (website side) — pipeline-export ingestion, routes, discovery (canonical)

> **Canonical entry point** for the website's reading-app / pipeline-export work: ingestion, the live pt
> route family, route migration, discovery hygiene, live-route behavior, and remaining work. The
> pipeline/export source-of-truth is **`skepvox-book-pipeline/docs/website-export-contract.md`**. The
> deeper design model and the route-migration plan-of-record are referenced in §12; this doc is the place
> to start.

---

## 1. Current live state

- **pt _Introdução à ontologia_ is live** at `/louis-lavelle/introducao-a-ontologia/` — a work **hub**
  plus **99 segment pages**, each with **real prose**. This is the single canonical reading surface.
- The **12 old fr chapter URLs 301-redirect** to the first pt segment of their chapter
  (`src/public/_redirects`, generated).
- The **fr edition** (12 chapter pages + the single-page full-text hub `/louis-lavelle/introduction-a-l-ontologie`)
  is kept **built only as redirect sources / an fr-language page**, but is **out of local search and LLM
  output** (so pt is canonical there).
- **`reading-review/**`** holds internal demo/prototype surfaces (map, single-leaf, windowed reader,
  full-work reader) — all `buffer:true` + `search:false` + `noindex`, out of sitemap/search/LLM.

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

- 99 pt segment pages are generated at `src/louis-lavelle/introducao-a-ontologia/<routePath-leaf>.md`.
- The work **hub** (`index.md`) is generated from pipeline-export **metadata only** (authored
  Part → Chapter → Segment links into the 99 routes) — **no full-book concatenation**.
- The pipeline family is kept **out of the legacy hand-authored reading system**: pages carry a
  `generated: pipeline-segment-routes` / `pipeline-work-hub` marker and `build-reading-nav.py` skips them,
  so `reading-nav.json` / `segment-manifest.json` / `WorkContents` are untouched.

## 4. Stability-aware visibility gate

`scripts/pipeline_gate.py` (`route_visibility`) decides each segment's public visibility from its
metadata: **eligible (indexable) iff `urlStability == "stable"` AND `publicSlug` present**; everything
else is hidden (`buffer` + `noindex`, out of sitemap/search/LLM). It drives the generated-page
frontmatter. **`urlStability` gates indexing/canonical/sitemap/search/LLM** — nothing draft is public.

## 5. Owned reading navigation

`PipelineSegmentNav.vue` renders prev/next (Trecho anterior / Próximo trecho) + an up link on the live pt
leaves, injected via the theme content slots (page bodies untouched), self-gated by the generated marker,
joining by `(canonicalId, language)`, **pt-only** (never crosses edition/language), using `SkLink` (focus
owned by the primitive; hover pointer-gated). The `reading-review/` prototypes
(`PipelineWindowPreview` / `PipelineReaderPreview`) are the windowed + zoom-out demos.

## 6. Route migration & redirects (done)

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
- **pt _Introdução à ontologia_ is the first live migrated edition**; old fr chapter URLs redirect to pt
  segment routes.

## 9. Remaining website work

- Resolve open decision **A** (retire vs redirect the fr full-text hub — see §11).
- When the pipeline broadens to a second work (open **B**), re-vendor + generate its family the same way
  (gate, hub, nav, redirects), and vendor its prose per published segment.
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
