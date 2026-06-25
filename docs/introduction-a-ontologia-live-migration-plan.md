# Introdução à ontologia — live migration plan

> **Superseded for current state: start with [`reading-app-website.md`](reading-app-website.md).** This
> plan has been executed (pt is live; fr chapter URLs 301 to pt). It remains the **route-migration plan of
> record** — see **§6** for the old→new route table. Kept in place (referenced by tests/scripts).

> **Type:** Decision document (document-only slice — no code, route, artifact, redirect, sitemap, search, or LLM changes are made by this file).
> **Scope:** `skepvox-website`. Moving from the buffer-only pipeline reader **prototypes** (`src/reading-review/*`) to a **live** *Introdução à ontologia* reading experience served from the real `louis-lavelle/introducao-a-ontologia` / `louis-lavelle/introduction-a-l-ontologie` route families.
> **Horizontal context:** The pipeline ships **identity** (`canonicalId`, `segmentPrefix`) and **presentation** (`routePath`, `displaySlug`, `publicSlug`) as deliberately separate layers. A route is *never* identity. URL permanence comes from a separate publishing layer (`publicSlug`), **never** from freezing an editorial `displayTitle`. The website joins by `(canonicalId, language)`, owns its own redirect map, and may index/canonicalize/sitemap **only** `urlStability == "stable"` routes — of which there are **zero today**. Authoritative conventions live in the **sibling** pipeline repo at `skepvox-book-pipeline/docs/{website-export-contract.md, public-url-convention.md, segment-prefix-stability-policy.md}` (verified present there); the local assessment is `docs/website-export-ingestion-assessment.md` (Slice A/B/C/D framing, recommended Slice B implemented). Those convention docs are **not** mirrored under `skepvox-website/docs`; the local assessment and the vendored `work-index.json` `routePolicy` cite them as bare filenames that resolve against the origin pipeline repo — so mirroring them locally is optional, not a broken reference to repair.

---

## 1. Current state

**Live today (indexable HTML, no public segment route family).** Twelve fr **chapter-level** pages plus one hub:

- Hub: `src/louis-lavelle/introduction-a-l-ontologie.md` — frontmatter `language: fr`, a self-canonical, **indexable**. Route `/louis-lavelle/introduction-a-l-ontologie`.
- 12 chapter pages under `src/louis-lavelle/introduction-a-l-ontologie/`:
  `00-00-000-avertissement`, `00-01-001-distinction`, `00-01-002-etre`, `00-01-003-existence`, `00-01-004-realite`, `00-01-005-connexion`, `00-02-001-distinction`, `00-02-002-bien`, `00-02-003-valeur`, `00-02-004-ideal`, `00-02-005-connexion`, `99-99-999-conclusion`.
  These carry only `sidebar:false / aside:false / footer:false` — **no buffer/noindex** frontmatter, so they **remain indexable**. `config.ts` `isChapterRoute` drops `louis-lavelle` routes with 3+ segments from the **sitemap** (config.ts:170-175, :259-262) but does **not** noindex them or remove them from local search.

**Export ingested (Slice 2B, vendored, metadata-only — no prose body).**

- `.vitepress/theme/data/pipeline-export-segments.json` — **198** records (**99 fr + 99 pt**), `source: "pipeline-export"`, `work.segmentCount = 99`. Verified keys are exactly `canonicalId, displayTitle, groupPath, language, maturity, order, publicSlug, publishable, routePath, segmentPrefix, source, urlStability, workId` — **no `bodyHtml`**. Reshaper `scripts/build-pipeline-export.py` enforces an allowlist `_SEGMENT_FIELDS` (build-pipeline-export.py:26-38, :63) so a full record can never leak.
- Vendored bundle dir `.vitepress/theme/data/pipeline-export/` holds exactly two files: `work-index.json` + `works/louis-lavelle/introduction-a-l-ontologie.json` (the 236k bundle the reshaper reads, `BUNDLE = VENDOR/'works'/'louis-lavelle'/...`). The bundle is present **once**; there is no duplicate.
- Verified work fields: `maturity: draft`, `publishable: false`, `routeStability: draft`; pt edition `default: true`, `editionRole: canonical`, `routeSlug: introducao-a-ontologia`; fr edition `default: false`, `editionRole: source`, `routeSlug: introduction-a-l-ontologie`. **Every** segment is `urlStability: draft`, `publicSlug: null`. Confirmed sample: fr `00-01-002-008` → `displayTitle "Paragraphe 7"`, routePath `louis-lavelle/introduction-a-l-ontologie/00-01-002-008-paragraphe-7`; pt → `"Parágrafo 7"`, `louis-lavelle/introducao-a-ontologia/00-01-002-008-paragrafo-7`.

**Buffer surfaces built (Slices 2C–2G), all under `src/reading-review/`** (so the `reading-nav` / `sidebar` / `segment-manifest` sweep builders never touch them — verified globs `literatura/*/*/*.md`, `louis-lavelle/*/*.md`, scope `['literatura','louis-lavelle']`). Each carries `buffer: true`, `search: false`, and per-page `robots: noindex`:

| Buffer route | Page file | Component | Proves |
|---|---|---|---|
| `/reading-review/introduction-a-l-ontologie` | `src/reading-review/introduction-a-l-ontologie.md` | `PipelineExportReview.vue` | Full **Part → Chapter MAP**, both editions (pt default), compare/QA block |
| `/reading-review/introduction-a-l-ontologie-segment` | `…-segment.md` | `PipelineSegmentPreview.vue` | Single **LEAF** prose (one pt leaf `00-01-002-008`) |
| `/reading-review/introduction-a-l-ontologie-window` | `…-window.md` | `PipelineWindowPreview.vue` | **Windowed READING** (5-segment pt window `00-01-001-006`..`00-01-002-010`, prev/next + Trechos) |
| `/reading-review/introduction-a-l-ontologie-reader` | `…-reader.md` | `PipelineReaderPreview.vue` | Full-work **metadata-only ZOOM-OUT** (all 99 pt as metadata) + windowed prose only |

**No redirect channel exists today.** `src/public/` has `_headers` but **no `_redirects`**; a repo-wide search (excluding `node_modules`) returns zero `_redirects` files. The site deploys to Cloudflare Pages, where `_redirects` is the conventional vehicle.

---

## 2. What has been proven

- **Metadata-only full-work overview is viable.** `PipelineReaderPreview.vue` renders all **99 pt** segments from `pipeline-export-segments.json` (metadata only, `data-work-count = ptSegs.length = 99`) while loading prose for only the ~5-segment window (`data-loaded-count = 5`). Unloaded segments show a `não carregado` tag and load nothing. This is the **zoom-out without the prose payload** pattern.
- **Windowed prose works** without navigation or persistence: `PipelineWindowPreview.vue` moves a client-side `ref` over 5 prose-bearing pt segments (no routing, no `localStorage`).
- **Authored Part → Chapter grouping, never inferred from slugs.** All grouping reads `groupPath` from metadata (Part 1 = *Les catégories premières de l'ontologie*, Part 2 = *Les catégories premières de l'axiologie*), honoring the contract rule *"Never infer structure from filenames or slugs."*
- **`routePath` is never a link.** In all four components (2C–2G) `routePath` appears **only** inside a QA `<details>` rendered as `<code>` (e.g. `PipelineExportReview.vue:153-156`, label *"QA data, not links"*) — never an `href`. Both build scripts document the join is by `(canonicalId, language)` / `(segmentPrefix, language)`, **never** `routePath`.
- **Zero public URL / indexing migration so far.** No `publicSlug` minted, no `published-routes.yaml`, no segment route family published; the 12 live fr chapter pages and the hub are untouched.
- **The performance boundary holds:** overview = metadata for all 99; prose = window/leaf only. No component imports 99 prose bodies. This is the boundary §7 makes binding.

---

## 3. Remaining blockers before live migration

### (a) Redirect channel for the old 12 fr chapter URLs

There is **no redirect channel today** — `src/public/` has `_headers` but **no `_redirects`**. Redirect migration is **website-owned** and is **not** emitted by the pipeline (`legacyPaths` is deferred; the pipeline does not know historical website URLs). The principle is firm: **no silent broken URLs, no deletions without a redirect.** The live surface is **12 fr chapter-level leaves**; each must 301 to the **first segment** of that chapter (lowest `SSS` sharing the `BB-PP-CCC` chapter prefix — see §6). The hub `/introduction-a-l-ontologie` is unchanged; the pt edition is **greenfield** (no old routes, no redirects).

> **Recommendation:** Introduce a Cloudflare Pages `_redirects` file as the vehicle, but **build the map as a committed website artifact first and do not enable it** (§4 step i, §8 test plan). The website reconciles its own current leaves against export `routePath`s to generate the old→new 301 map. **Decision owner:** website maintainer (skepvox).

### (b) `publicSlug` / `urlStability` decision for publishable routes

Per contract, **`publicSlug` is the permanent public leaf slug, frozen at first publication**, keyed per `(segmentPrefix, language)`, minted from `published-routes.yaml`. **All 198 records are `publicSlug: null`, `urlStability: draft` today**, and **no `published-routes.yaml` ships** — there is currently **no mechanism** to mint or freeze a slug. `urlStability == "stable"` is the **only** value the website may index/canonicalize/sitemap, and it is true **iff** `publicSlug` is present. The pipeline is the **only** minter; the export builder must **never** write `publicSlug`, and the website must **never** push publication state back into the export (that would break determinism / git-reproducibility). Publishing state belongs in `published-routes.yaml`, deliberately kept out of editorial frontmatter.

> **Recommendation:** Do **not** hand-mint or hand-freeze any URL website-side — that would be outside the contract and untracked for redirects, and the orphan guard that protects frozen URLs is **dormant** (no manifest), so an out-of-band freeze could later point at a vanished segment with no fail-fast. The website ships everything **noindex** until the pipeline mints `publicSlug`s and emits a `published-routes.yaml`; then, and only then, `urlStability=="stable"` routes become indexable. **Decision owner:** pipeline maintainer mints; website consumes.

### (c) First public edition: pt only / fr only / both

The old live URLs are **fr** (12 chapter pages). The contract's **canonical, default reading edition is pt** (`editionRole: canonical`, `default: true`, `routeSlug: introducao-a-ontologia`); fr is the **source** edition (`editionRole: source`, `default: false`).

> **Recommendation: publish the pt edition first as the canonical reader, while keeping fr live and redirected.** Reasoning: (1) the product's default reading edition is pt — that is the experience to make first-class; (2) the existing inbound links / SEO equity are **fr chapter-level**, so the fr family must continue to resolve via 301s regardless (§6) — fr cannot simply disappear; (3) doing **both at once** doubles the publication-freeze surface and the redirect surface before either is proven. Sequence: stand up the pt family (greenfield, no redirects needed), 301 the old fr chapter URLs to the **fr** segment routes (preserving language continuity for existing links), and promote fr to a fully published edition in a later slice. **Decision owner:** website maintainer, with pipeline confirming canonical/source roles (already encoded in the bundle).

### (d) Are pt "Parágrafo N" titles acceptable for publication?

**Both editions currently carry generic per-paragraph titles** (`"Paragraphe 7"` / `"Parágrafo 7"`, verified). The recommended (future) mint gate is **stricter than `publishable`**: `maturity == "final"` **plus** a clean `displaySlug`, specifically to avoid freezing a known-wrong label — the cited hazard is an off-by-one conclusion label (`"Parágrafo 95"` on prefix `99-99-999-096`). Translation existence does **not** auto-freeze a URL.

Critically, this is **not** a reason to freeze the title for URL permanence. The hard editorial rule: **the reader-facing `displayTitle` (and its derived `displaySlug`) stays improvable forever — a living edition — and URL permanence must come from the separate `publicSlug` layer, never from freezing the editorial label.** Generic "Parágrafo N" titles are therefore acceptable to **render** today (they are draft, mutable) and acceptable to ship under noindex, but they should **not** be the basis on which any URL is made permanent.

> **Recommendation:** Keep generic titles as provisional `displayTitle`s; improve them freely; gate `publicSlug` minting on `maturity == "final"` + clean `displaySlug` so a permanent URL is only ever minted from a label the editors are willing to stand behind — but the URL's permanence still lives in `publicSlug`, not in the title. **Decision owner:** editorial (label quality) + pipeline (mint gate).

### (e) SEO / search / LLM behavior for draft vs stable segments

Gating today is **path-based, not state-based**, which is fine for the current buffer surfaces but **unsafe for a real segment family**:

- **Sitemap:** `isChapterRoute` auto-drops `louis-lavelle` 3+ segment routes (config.ts:259-262) — so a real pt/fr segment family would be sitemap-excluded for free, **but**…
- **Indexing:** those pages would still be **indexable** (no `robots noindex`) unless each carries explicit `noindex`. `_headers` `X-Robots-Tag: noindex` covers only raw `/*.md`, **not** the HTML route.
- **Local search:** `provider: 'local'`; there is **no namespace-level exclusion** — without per-page `search: false`, 99 pt + 99 fr would bloat the index and dilute hub relevance.
- **LLM output:** `vitepress-plugin-llms` `ignoreFiles` excludes only `index.md` and `reading-review/**` (config.ts:501) — a real family outside `reading-review/` would be picked up with **no maturity awareness**, feeding draft prose into `llms.txt` / `llms-full.txt`.
- **Manifest mislabel risk:** `build-segment-manifest.py` reads language from each work's hub frontmatter (`work_language()` / `FM_LANGUAGE_RE`, build-segment-manifest.py:76-84) and only **falls back** to `fr` for the `louis-lavelle` corpus when a hub lacks an explicit `language:` field. A pt family is labeled correctly **if** its hub carries `language: pt` — but a pt edition sharing the fr work's hub (or any page without explicit `language:`) would inherit `fr`.

> **Recommendation:** The first real route family must ship **`buffer: true` + `search: false` + per-page `noindex`** (so it inherits today's working buffer gates) and stay there until `urlStability == "stable"` exists. Then add a **stability-aware** gate in `config.ts` (index/canonical/sitemap/search/llms keyed on `urlStability`, not on path/namespace) and make `build-segment-manifest.py` language assignment authoritative per work/edition (so the `fr` fallback can never mislabel) before any pt family enters the `louis-lavelle/` namespace. **Decision owner:** website maintainer.

### (f) Sourcing prose without cross-repo build fragility

Today `scripts/build-pipeline-preview.py` reads the **sibling** repo `../skepvox-book-pipeline/export/prose/{authorSlug}/{bookSlug}/{language}/{segmentPrefix}.md` at **build time**, joining by `(segmentPrefix, language)` (never `routePath`), sanitizing (strip `^\s*#{1,6}\s` headings, `html.escape`, `*italics*` → `<em>`, **reject** personal markers `read-at`, `==`, `%% review`, `[!review]`, `[!dt]`). On a clean checkout / CI runner **without** the sibling repo, it **no-ops and silently keeps the committed preview artifacts** — a stale `pipeline-preview-window.json` could ship with no warning. `pnpm verify → podcast:build → build` runs this script, so verify outcomes depend on whether the sibling is present and current. (`build-pipeline-export.py` is **not** a no-op: it hard-fails `FileNotFoundError` if the vendored bundle is missing, and `_adapt_group_path` raises `KeyError` if the export schema drifts.)

> **Recommendation:** For the live migration, **vendor sanitized prose per published segment as a committed website artifact — never the whole tree, never a build-time cross-repo read for production output.** Reuse the existing sanitizer and the `(segmentPrefix, language)` join, but emit one committed body-only leaf per segment that is actually being published, checked into the website repo. The cross-repo read becomes a **manual re-vendor step** (like the metadata bundle), not a silent build-time dependency, so a clean checkout is deterministic and a missing sibling fails loudly rather than freezing stale prose. **Decision owner:** website maintainer.

---

## 4. Recommended next implementation sequence

Exactly four steps, each gated:

**(i) Build a redirect-map artifact — but do NOT enable it.**
Generate a committed `docs/`/`data` artifact mapping each of the 12 old fr chapter routes → its chapter's first segment route (§6). It is **not** wired into `_redirects`.
- *Acceptance gate:* deterministic, idempotent artifact covering all 12 old routes; front-matter (1:1) and conclusion (096→old; 097-099 new, no old source) notes present; `_redirects` still absent; live routes, sitemap, search, llms **unchanged**; `pnpm verify` green.

**(ii) Add a pipeline-export ingestion mode that can generate real static segment pages behind `buffer: true`.**
A generator that emits the actual segment route family (the 99 segment pages) from the vendored metadata + vendored sanitized prose (§3f), each page `buffer: true` + `search: false` + `noindex`.
- *Acceptance gate:* generated pages are buffer/noindex/search-excluded; absent from sitemap (via buffer + `isChapterRoute`), local search, and llms; prose is body-only with headings suppressed at render; no `routePath` rendered as `href`; `pnpm verify` green; live hub and 12 fr chapter pages unchanged.

**(iii) Test the new 99-segment route family noindexed.**
Verify the real family renders, navigates (route-level prose, §7), and is fully excluded from all public surfaces while `urlStability == draft`.
- *Acceptance gate:* zero segment route appears in `sitemap.xml`, local search, or `llms.txt`/`llms-full.txt`; every segment page carries `noindex`; metadata-only overview loads all 99 without loading 99 bodies; manifest language labeling correct (pt not fr).

**(iv) Only then replace the live hub and add 301s.**
Promote the hub to point at the real family, enable the `_redirects` from step (i), and (once the pipeline has minted `publicSlug`s / `published-routes.yaml`) flip the relevant routes to `urlStability == stable` and let them be indexed/canonicalized/sitemapped.
- *Acceptance gate:* all 12 old fr chapter URLs 301 to their chapter's first segment route; no `404` for any historically reachable URL; only `urlStability=="stable"` routes are indexed/canonical/sitemapped; nothing draft is indexed; `pnpm verify` green; single delayed live check after the Cloudflare propagation window (no immediate post-push polling).

---

## 5. THE EXPLICIT DECISION

**Stop creating one-off buffer review pages.** The 2C–2G prototypes (`src/reading-review/*`) have already proven everything they can prove — MAP, single LEAF, windowed READING, full-work metadata-only ZOOM-OUT, `routePath`-never-a-link, and the metadata-overview / windowed-prose performance boundary. Another bespoke review page would add nothing.

**The next slice must generate the REAL route family — the 99 segment routes — as `noindex` / `buffer: true`, not more bespoke review pages.**

Why generating the real routes **early but hidden** de-risks the eventual flip:
- It exercises the **actual** route shape, the **actual** `(canonicalId, language)` join, the **actual** `groupPath` breadcrumbs, and the **actual** per-segment prose vendoring — under production rendering, not a sandbox component — while every public surface stays closed (`buffer` + `noindex` + `search:false`, sitemap-excluded via `isChapterRoute`).
- The eventual **flip becomes a gate change, not a build-out**: turning a known-good, already-rendered family from `draft` to `stable` (once `publicSlug`s are minted) plus enabling the prebuilt `_redirects`. No new page generation happens during the risky public-exposure moment.
- It surfaces the §3e gating gaps (indexable-by-default HTML routes, no namespace search exclusion, llms path-only gating, manifest `fr`-fallback labeling) **while they are harmless**, forcing the stability-aware fixes before any URL is public.
- It keeps **identity vs presentation** clean: the real routes are derived from `routePath` for navigation only; identity stays `canonicalId`; no URL is frozen and no `displayTitle` is frozen for permanence.

---

## 6. Route migration table

301 target = **the chapter's first segment route** (lowest `SSS` sharing the chapter's `BB-PP-CCC` prefix). All target `routePath`s are under `louis-lavelle/introduction-a-l-ontologie/` (the **fr** source family, preserving language continuity for existing inbound links). Per-paragraph deep links would 404 from old URLs — **acceptable**, because old URLs were **chapter-level**, not paragraph-level.

| Old fr chapter route | Chapter (part) | First segment route | 301 target | Notes |
|---|---|---|---|---|
| `…/00-00-000-avertissement` | Avertissement (front matter, no part) | `…/00-00-000-001-avertissement` | `…/00-00-000-001-avertissement` | **1:1** — single front-matter segment |
| `…/00-01-001-distinction` | Distinction (P1 — *Les catégories premières de l'ontologie*) | `…/00-01-001-002-paragraphe-1` | `…/00-01-001-002-paragraphe-1` | First segment of chapter |
| `…/00-01-002-etre` | Être (P1) | `…/00-01-002-008-paragraphe-7` | `…/00-01-002-008-paragraphe-7` | First segment of chapter |
| `…/00-01-003-existence` | Existence (P1) | `…/00-01-003-021-paragraphe-20` | `…/00-01-003-021-paragraphe-20` | First segment of chapter |
| `…/00-01-004-realite` | Réalité (P1) | `…/00-01-004-034-paragraphe-33` | `…/00-01-004-034-paragraphe-33` | First segment of chapter |
| `…/00-01-005-connexion` | Connexion (P1) | `…/00-01-005-045-paragraphe-44` | `…/00-01-005-045-paragraphe-44` | First segment of chapter |
| `…/00-02-001-distinction` | Distinction (P2 — *Les catégories premières de l'axiologie*) | `…/00-02-001-051-paragraphe-50` | `…/00-02-001-051-paragraphe-50` | First segment of chapter |
| `…/00-02-002-bien` | Bien (P2) | `…/00-02-002-058-paragraphe-57` | `…/00-02-002-058-paragraphe-57` | First segment of chapter |
| `…/00-02-003-valeur` | Valeur (P2) | `…/00-02-003-071-paragraphe-70` | `…/00-02-003-071-paragraphe-70` | First segment of chapter |
| `…/00-02-004-ideal` | Idéal (P2) | `…/00-02-004-082-paragraphe-81` | `…/00-02-004-082-paragraphe-81` | First segment of chapter |
| `…/00-02-005-connexion` | Connexion (P2) | `…/00-02-005-092-paragraphe-91` | `…/00-02-005-092-paragraphe-91` | First segment of chapter |
| `…/99-99-999-conclusion` | Conclusion (no part) | `…/99-99-999-096-paragraphe-95` | `…/99-99-999-096-paragraphe-95` | Conclusion spans `096-099`; old single page → **first** conclusion segment. `097-099` are **new** segment routes with **no old-URL source** (no redirect needed). Note the `paragraphe-95` label on prefix `…096` is the off-by-one hazard from §3d — a reason **not** to mint a `publicSlug` from this label yet. |

(`…` = `louis-lavelle/introduction-a-l-ontologie/`.)

---

## 7. Performance constraints

- The **full-work overview MAY use metadata for all 99 segments** (proven by `PipelineReaderPreview.vue`: `ptSegs.length = 99` metadata rows, `loadedOrder.length = 5` prose). Metadata-only at full-work scale is fine.
- **Prose MUST be route-level (one segment per static page) or windowed — NEVER all 99 bodies loaded into one global component.** "Committed prose exists" never means "load it all at once."
- The **2G reader is the safe pattern to evolve**: metadata for the zoom-out, prose only for the active window/leaf. A single component that imports all 99 prose bodies is **forbidden**.
- Prose is **body-only** (frontmatter dropped so `read-at` and other personal markers never leak), with authored headings **preserved** in the artifact; duplicated leading `##`/`###` heading suppression is a **website render step**, not a data change.

---

## 8. Test plan — first implementation slice (step i: the redirect-map artifact)

The first slice after this doc builds the **redirect-map artifact only** (not enabled). Tests:

1. **Deterministic artifact** — same inputs produce byte-identical output across runs.
2. **Coverage** — all **12** old fr chapter routes are present, exactly once each.
3. **Mapping correctness** — each old route maps to its chapter's **first** segment route (lowest `SSS` sharing `BB-PP-CCC`), matching §6 verbatim, derived from `pipeline-export-segments.json` (`routePath` for the fr edition), never hand-typed.
4. **Front-matter note** — `00-00-000-avertissement` is recorded as **1:1** (single front-matter segment).
5. **Conclusion note** — `99-99-999-conclusion` → `…096`; `097-099` recorded as **new, no old-URL source** (no redirect emitted for them).
6. **Not enabled** — `src/public/_redirects` still does **not** exist; the artifact lives only as a `docs`/`data` file.
7. **Idempotent generator** — re-running the generator and re-running it again leaves the working tree clean (no diff).
8. **`pnpm verify` green** — `podcast:build` → `build` (including `build-pipeline-export.py` and `build-pipeline-preview.py`) succeed.
9. **No live drift** — the 12 live fr chapter pages, the hub, `sitemap.xml`, local search index, and `llms.txt`/`llms-full.txt` are **unchanged** versus pre-slice.

---

## 9. The exact next prompt

```
Repo: skepvox-website, branch develop. Do NOT create a new branch. Document/data slice only —
generate the old→new 301 redirect-map artifact for the 12 live fr chapter URLs of
"Introdução à ontologia". DO NOT enable redirects.

Scope:
- Read .vitepress/theme/data/pipeline-export-segments.json (fr edition, source:"pipeline-export").
- For each of the 12 live fr chapter pages under src/louis-lavelle/introduction-a-l-ontologie/
  (00-00-000-avertissement, 00-01-001-distinction, 00-01-002-etre, 00-01-003-existence,
  00-01-004-realite, 00-01-005-connexion, 00-02-001-distinction, 00-02-002-bien,
  00-02-003-valeur, 00-02-004-ideal, 00-02-005-connexion, 99-99-999-conclusion),
  compute the chapter's FIRST segment routePath = lowest SSS sharing that chapter's BB-PP-CCC
  prefix (fr edition). Build an old→new 301 map (old chapter route -> first-segment routePath).
- Emit it as a committed artifact (docs/ or .vitepress/theme/data/), with explicit notes:
  front matter is 1:1; conclusion 096 is the 301 target and 097-099 are NEW segment routes with
  no old-URL source. Each 301 target is the chapter's FIRST segment route; chapter-level old URLs
  only — paragraph-level deep links are out of scope.
- Add a small, idempotent generator script (wire it into the build/verify chain only if it is a
  no-op on a clean tree; otherwise keep it standalone and documented).
- Add tests: deterministic output; all 12 old routes covered once; correct first-segment mapping
  per docs/introduction-a-ontologia-live-migration-plan.md §6; front-matter + conclusion notes
  present; src/public/_redirects still ABSENT (redirects NOT enabled); generator idempotent.

Constraints:
- DO NOT create src/public/_redirects. DO NOT touch live routes, the hub, sitemap, local search,
  or llms config. DO NOT mint publicSlug or write urlStability anywhere. routePath is presentation
  only — never an identity/join key, never an href. Join by (canonicalId, language) /
  (segmentPrefix, language), never by routePath.
- DO NOT freeze any displayTitle for URL permanence.

Run `pnpm verify` and confirm green. Commit; do NOT push.
```
