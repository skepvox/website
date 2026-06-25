# Website Export Ingestion Assessment — `louis-lavelle/introduction-a-l-ontologie`

> **Superseded: start with [`reading-app-website.md`](reading-app-website.md)** — the canonical reading-app
> doc. This is the Slice 2A ingestion analysis; its recommended Slice B (vendor + reshaper) is now built
> and the ingestion model is realized. Kept in place (still referenced by tests/scripts) as history.

> **Status: ASSESSMENT ONLY.** This is a read-only, doc-first analysis committed in `skepvox-website`. It changes **no routes, no pages, and no manifests**, and it imports no files. It recommends the smallest safe first ingestion slice; it does not perform it. Every claim is grounded in real files across both repos, cited as `path:line`. The pipeline export (`/Users/skepvox/projects/skepvox-book-pipeline/export/`) is the source of truth; the website (`/Users/skepvox/projects/skepvox-website/`) is the consumer. The 12 live French chapter URLs for this work are SEO-sensitive and must not be touched by any work described here.
>
> **One premise in the originating brief is wrong and is corrected throughout:** the brief states "no segment-manifest / WorkContents / ReadingNav test was found." Those tests exist. `tests/segment-manifest.spec.ts`, `tests/work-contents.spec.ts`, `tests/reading-nav.spec.ts`, `tests/louis-lavelle.spec.ts`, and `tests/sitemap.spec.ts` are all present (`pnpm test` → `playwright test`, `package.json:15`). They are the binding safety net for any ingestion slice and are treated as the baseline here.

---

## 1. Current website source model (Q1)

### 1.1 Website-committed vs generated-from-pages

The website's source of truth for this work is **the committed Markdown leaf pages under `src/`** — not any manifest, and not the pipeline.

| Layer | Status | Source of truth? | Where |
|---|---|---|---|
| 12 fr chapter leaves + 1 hub | Committed `.md` | **Yes** | `src/louis-lavelle/introduction-a-l-ontologie/*.md` + `src/louis-lavelle/introduction-a-l-ontologie.md` |
| `reading-nav.json` (54k) | Generated at build | No | `.vitepress/theme/data/reading-nav.json` ← `scripts/build-reading-nav.py` |
| `segment-manifest.json` (658k) | Generated at build | No | `.vitepress/theme/data/segment-manifest.json` ← `scripts/build-segment-manifest.py` |
| `sidebar-nav.json`, `works.json` | Generated at build | No | ← `scripts/build-sidebar-nav.py`, `scripts/build-lavelle-manifests.py` |

The committed leaves carry hand/script-built frontmatter (title, description, `book`/`author`/`language`, numbering, part/chapter titles, full `head:` SEO/JSON-LD). The per-work builder `scripts/build-lavelle-introduction-a-l-ontologie.py` reads bodies from a **gitignored/absent** `local-books/.../fr/` dir and no-ops when absent (`build-lavelle-introduction-a-l-ontologie.py:317`), so from a clean checkout the committed leaves are effectively the only recoverable source. The generators are wired into `pnpm build` (`package.json:8`: `build-reading-nav.py && build-sidebar-nav.py && build-segment-manifest.py && vitepress build && render-podcast-player-llms.py`), so they are regenerated on every build, always derived from the committed pages.

`build-segment-manifest.py` explicitly does **not** read the pipeline; its docstring (`build-segment-manifest.py:15-29`) declares itself a deliberate **bridge** designed to be replaced later by a pipeline-sourced record. It tags every record `"source": "website-committed"` (`build-segment-manifest.py:143,199,268`).

### 1.2 Current route identity

Route identity comes from **the filename prefix + path**, not frontmatter, not a `canonical-id` field, not a manifest.

- `cleanUrls: true` (`.vitepress/config.ts:246`) + `srcDir: 'src'` (`config.ts:268`) → a leaf's live URL is its `src`-relative path minus `.md`, extensionless. (The leaf frontmatter `canonical` still hard-codes `.html`, e.g. `src/.../00-00-000-avertissement.md:20`, but `normalizeSitePathname` strips it at build (`config.ts:147`, the `.html`-strip return at `config.ts:150`; reached via `normalizeSiteUrl` `config.ts:177`), so the public canonical is extensionless.)
- `build-reading-nav.py` orders leaves by `leaf.name` and uses `leaf.stem` as the route slug (`build-reading-nav.py:65,67`).
- `build-segment-manifest.py` re-parses the slug with `SEG_RE`/`CHP_RE` (`BB-PP-CCC[-SSS]`) and synthesizes a **provisional** `canonicalId = {author}/{work}/{prefix}` (`build-segment-manifest.py:48-50,173`); its comment states `canonicalId` is provisional and is "never the route href and never the route slug" (`build-segment-manifest.py:18-28`).
- `ReadingNav.vue` derives the work route + current slug from `page.relativePath` at runtime (`ReadingNav.vue:28-41`) and matches a row by `row[0] === slug` (`ReadingNav.vue:36`); it explicitly does **not** parse canonical URLs or JSON-LD because "Lavelle FR leaves lack chapter-id" (`ReadingNav.vue:7-10`).

So the live fr URL is `/louis-lavelle/introduction-a-l-ontologie/{filename-stem}`.

### 1.3 How `WorkContents` / `ReadingNav` consume the manifests

| Consumer | Reads | Fields consumed | Notes |
|---|---|---|---|
| `WorkContents.vue` | `segment-manifest.json` (`WorkContents.vue:3`) | `workId` (filter), `order` (sort), `groupPath[].{key,kind,index}` (grouped/flat + labels), `href`, `canonicalId` (Vue `:key` + current marker), `displayTitle`, `chapterIndex`/`bucket` (flat decade buckets) | Renders from `groupPath`, "never from route slugs" (`WorkContents.vue:10`). Grouped vs flat decided by presence of non-empty `groupPath` (`WorkContents.vue:69-72`). |
| `WorkContentsMount.vue` | (mount gate only) | hard allowlist | Exactly two hubs: `louis-lavelle/de-l-acte.md` + `literatura/machado-de-assis/bras-cubas.md` (`WorkContentsMount.vue:11`). **`introduction-a-l-ontologie` is NOT mounted** — its `WorkContents` map is dormant. |
| `ReadingNav.vue` | `reading-nav.json` only (`ReadingNav.vue:4`) | `row[0]` (slug), `row[1]` (title) for prev/next | Does not touch `segment-manifest`, `canonicalId`, `groupPath`, or `order` beyond array index. |

### 1.4 Differences vs the pipeline contract (the load-bearing gap)

The website's `segment-manifest.json` and the pipeline bundle look superficially similar (both have `canonicalId`, `groupPath`, `order`, `urlStability`, `source`) but **do not join and disagree on granularity**.

| Dimension | Website (current) | Pipeline export | Consequence |
|---|---|---|---|
| **Granularity / join key** | 12 fr **chapter** leaves; prefix `BB-PP-CCC`; canonicalId e.g. `…/00-01-001` | 99 **paragraph** segments × 2 editions; prefix `BB-PP-CCC-SSS`; canonicalId e.g. `…/00-01-001-002` | The contract join key `(canonicalId, language)` (`website-export-contract.md:64,116`) matches **no** website canonicalId. Different identity spaces. |
| **`canonicalId` provenance** | Provisional, re-parsed from filename (`build-segment-manifest.py:18-28,173`) | Authoritative, from segment frontmatter (`website-export-contract.md:18,64`) | Contract forbids inferring structure from filenames/slugs (`website-export-contract.md:24,124`) — exactly what the bridge does, by design, as a stopgap. |
| **`groupPath` shape** | `{kind,index,key,inferred:true}`, no titles (`build-segment-manifest.py:98-125`) | `{kind,ordinal,label,title,key}` with authored labels (e.g. `Première partie` / `Les catégories premières de l'ontologie`) | Field rename `index`→`ordinal` + real labels; consumer would need an adapter to absorb both. |
| **`routePath` / namespace** | filename-based `…/00-01-001-distinction`, fr only | `…/introduction-a-l-ontologie/00-00-000-001-…` (fr) + `…/introducao-a-ontologia/…` (pt) (`work-index.json:17,24`) | Adopting routePath changes every fr URL and adds a whole pt edition. |
| **`urlStability`** | `"preserve"` everywhere (live, indexed) | `"draft"` everywhere; `publicSlug:null`, `publishable:false`, `maturity:draft` (`work-index.json:30-33`; `website-export-contract.md:132-134`) | Contract publishes only `urlStability=="stable"` — zero today (`website-export-contract.md:120`). Export is explicitly NOT publishable; live fr routes ARE. |
| **`source`** | `"website-committed"` | `"pipeline-segmented"` | Website docs anticipate a future `source:"pipeline-export"` record (`docs/archive/book-pipeline-website-export-contract-assessment.md:429,458`). |
| **Code consumption** | Self-contained | — | Grep for `pipeline-export\|pipeline-segmented\|introducao-a-ontologia` hits docs only, never live code. **No website code consumes the pipeline today.** |

**Body source is gone:** `local-books/.../introduction-a-l-ontologie/fr` is absent, so the per-work builder no-ops (`build-lavelle-introduction-a-l-ontologie.py:317`). The pipeline `export/prose/.../{fr,pt}/{segmentPrefix}.md` (99 + 99, verified present) is now the only fresh body source — but paragraph-segmented, not chapter-aggregated.

---

## 2. Target ingestion model (Q2)

### 2.1 Vendor location — committed copy, read by a website-local generator

Vendor a **committed copy** of the two export JSONs into the website, read at build by a new website-local generator. Do **not** read across repos at build, and do **not** feed raw export JSON into `WorkContents`.

| Option | Verdict | Why |
|---|---|---|
| Cross-repo read at build | **Reject** | The build runs only in `skepvox-website` (`package.json:8`); reaching into `…/skepvox-book-pipeline` makes the Cloudflare Pages build non-hermetic and unbuildable in CI. |
| Raw export JSON consumed directly by `WorkContents.vue` | **Reject** | `WorkContents.vue` imports exactly one manifest (`WorkContents.vue:3`), and `segment-manifest.spec.ts:195-214` LOCKS that the only consumers are `WorkContents.vue` + `WorkContentsMount.vue`. The export's 21-key record (`partIndex`/`order`/`routePath`/`displayTitle`) lacks the website record's `href`/`relativePath`/`slug`/`prefixCompatibility`; two shapes into one component break the schema tests. |
| **Vendor + website-local reshaper** | **Recommend** | Mirrors the already-built bridge pattern; produces a website-shaped artifact tagged `source:"pipeline-export"`. |

**Recommended layout:** vendor `export/work-index.json` + `export/works/louis-lavelle/introduction-a-l-ontologie.json` into `.vitepress/theme/data/pipeline-export/` (committed), and add `scripts/build-pipeline-export.py` to the `build` chain (`package.json:8`).

### 2.2 Consume-committed vs derive website-local — derive a website-local artifact

The website should consume a **website-local derived artifact**, not the committed export verbatim. The reshaper reshapes the export's 21-key segment records into the existing website segment-record shape, tagged `source:"pipeline-export"`, emitted as a **sibling JSON** in slice B (merge into `segment-manifest.json` by `workId` deferred to a later slice). This is exactly what the prior assessments scope (`docs/archive/book-pipeline-website-export-contract-assessment.md:455-462`; `docs/work-contents-component-spec.md:135-138`).

Because the export already supplies authored `groupPath` titles, the reshaper **copies them through** (flipping today's `inferred:true` to `inferred:false`) instead of inferring from prefixes — the bridge's `group_path` synthesis (`build-segment-manifest.py:98-125`) is unnecessary for this one work.

### 2.3 Resulting artifact shape

A website-local sibling JSON, one record per (segment, language) — 198 records — carrying the website segment-record field names with `source:"pipeline-export"`:

```
{
  "source": "pipeline-export",
  "workId": "louis-lavelle/introduction-a-l-ontologie",
  "canonicalId": "louis-lavelle/introduction-a-l-ontologie/00-01-001-002",
  "language": "fr",
  "order": 2,
  "displayTitle": "Paragraphe 1",
  "groupPath": [
    { "kind": "part", "ordinal": 1, "label": "Première partie",
      "title": "Les catégories premières de l'ontologie",
      "key": "…", "inferred": false }   // inferred:false is ADDED by the reshaper to match the
                                         // website schema; the raw export groupPath has no `inferred` field
  ],
  "routePath": "louis-lavelle/introduction-a-l-ontologie/00-01-001-002-paragraphe-1",
  "urlStability": "draft", "publishable": false, "maturity": "draft",
  "publicSlug": null
  // NO body, NO href yet (routePath is data-only in slice B)
}
```

### 2.4 Metadata + prose join by `(canonicalId, language)`

Both `canonicalId` and `language` are present on every bundle segment, so the join is direct; the prose filename is derived from `segmentPrefix`, not by parsing `canonicalId`:

```
prose path = export/prose/louis-lavelle/introduction-a-l-ontologie/{language}/{segmentPrefix}.md
```

Verified: bundle segment `00-00-000-001` (fr + pt) ↔ `fr/00-00-000-001.md` + `pt/00-00-000-001.md`; 99 fr + 99 pt prose leaves present. Note the export prose filename is the full `BB-PP-CCC-SSS` prefix (`00-00-000-001.md`), distinct from the website's chapter-level leaf names (`00-00-000-avertissement.md`). In slice B the reshaper carries metadata only and leaves prose unconsumed; the join is exercised by tests (§6), not rendered.

### 2.5 `routePath` use

`routePath` (e.g. `louis-lavelle/introduction-a-l-ontologie/00-00-000-001-avertissement` fr; `louis-lavelle/introducao-a-ontologia/00-00-000-001-advertencia` pt) is the export's **proposed** public URL and is disjoint from the live routes. In slice B it is carried **as data only** — never set as an `href`. Adopting `routePath` as an `href` is route migration (§3, slice D); it becomes load-bearing only then.

---

## 3. Route migration for this work (Q3)

### 3.1 Current 13 routes (the only thing that can break)

1 hub (in sitemap, indexed): `/louis-lavelle/introduction-a-l-ontologie`.

12 fr chapter leaves — indexable + locally searchable but **dropped from the sitemap** by `isChapterRoute` (`config.ts:170-175`; locked by `tests/sitemap.spec.ts:44`):

`00-00-000-avertissement`, `00-01-001-distinction`, `00-01-002-etre`, `00-01-003-existence`, `00-01-004-realite`, `00-01-005-connexion`, `00-02-001-distinction`, `00-02-002-bien`, `00-02-003-valeur`, `00-02-004-ideal`, `00-02-005-connexion`, `99-99-999-conclusion`.

These slugs are 3-group + curated French word; titles are real editorial labels (Avertissement, Distinction, Être, …, Conclusion).

### 3.2 New 99 segment routePaths (fr + pt), with old→new pairs

The first 3 groups of every pipeline `segmentPrefix` are exactly the 12 live chapter prefixes, so each old chapter maps deterministically to the **first** pipeline segment sharing those 3 groups:

| Old fr chapter URL | New fr routePath (first segment of chapter) | order |
|---|---|---|
| `…/00-00-000-avertissement` | `…/introduction-a-l-ontologie/00-00-000-001-avertissement` | 1 |
| `…/00-01-001-distinction` | `…/introduction-a-l-ontologie/00-01-001-002-paragraphe-1` | 2 |
| `…/00-01-002-etre` | `…/introduction-a-l-ontologie/00-01-002-008-paragraphe-7` | 8 |
| `…/00-01-003-existence` | `…/introduction-a-l-ontologie/00-01-003-021-paragraphe-20` | 21 |
| `…/00-01-004-realite` | `…/introduction-a-l-ontologie/00-01-004-034-paragraphe-33` | 34 |
| `…/00-01-005-connexion` | `…/introduction-a-l-ontologie/00-01-005-045-paragraphe-44` | 45 |
| `…/00-02-001-distinction` | `…/introduction-a-l-ontologie/00-02-001-051-paragraphe-50` | 51 |
| `…/00-02-002-bien` | `…/introduction-a-l-ontologie/00-02-002-058-paragraphe-57` | 58 |
| `…/00-02-003-valeur` | `…/introduction-a-l-ontologie/00-02-003-071-paragraphe-70` | 71 |
| `…/00-02-004-ideal` | `…/introduction-a-l-ontologie/00-02-004-082-paragraphe-81` | 82 |
| `…/00-02-005-connexion` | `…/introduction-a-l-ontologie/00-02-005-092-paragraphe-91` | 92 |
| `…/99-99-999-conclusion` | `…/introduction-a-l-ontologie/99-99-999-096-paragraphe-95` | 96 |

pt edition (greenfield, **no old route**, zero redirects): same 99 segments under `louis-lavelle/introducao-a-ontologia/…` (`work-index.json:24`), e.g. `…/00-00-000-001-advertencia`, `…/00-01-001-002-paragrafo-1`, … `…/99-99-999-096-paragrafo-95`. The website has no `introducao-a-ontologia/` dir today.

Two structural shifts: (1) granularity chapter→paragraph (prefix gains 4th group `SSS`); (2) titles regress to generic `Paragraphe N` / `Parágrafo N` for body segments (only front-matter/conclusion buckets keep real labels).

### 3.3 The 301 recommendation

Each old chapter URL should **301 to the first pipeline segment of that chapter** (target = option a), via a **machine-generated** old→new map (mechanism = option c): join old-leaf 3-group prefix → min-`order` pipeline `routePath` for the matching 3-group prefix.

- Not the hub (option b): that drops the reader at a TOC and loses their place for 11/12 chapters.
- The 12↔12 prefix join is clean and deterministic, so the map is auto-generatable and regenerable — removing transcription risk. The contract assigns redirect ownership to the website: "Route from `routePath`; maintain its own redirect map (old→new) — the pipeline does not know historical website URLs" (`website-export-contract.md:118,141-142`).
- **Mechanism gap:** there is no redirect infrastructure today. No `_redirects` exists (only `src/public/_headers`, `robots.txt`). Cloudflare Pages reads a top-level `_redirects`; one placed in `src/public/` would ship to `dist/`. Redirects must be built from scratch — itself a first for this repo, and a reason migration is not the first slice.
- Redirects/canonicals must target the **extensionless** form (cleanUrls), not the `.html` hard-coded in leaf frontmatter (`src/.../00-00-000-avertissement.md:20`, stripped by `config.ts:150`).

### 3.4 How `ReadingNav` / `WorkContents` / search / LLM stay intact (and why D is deferred)

| Consumer | Effect of premature migration |
|---|---|
| `ReadingNav` | Order comes from `reading-nav.json` row order matched to **committed leaf** filenames (`ReadingNav.vue:28-41`); the export ships body-only prose, no leaves. Migration requires regenerating 99×2 committed leaves first, or ReadingNav does nothing for the new routes. |
| `WorkContents` | The export `groupPath` is `[]` for body segments → FLAT mode (`WorkContents.vue:70-72`) renders 99 `Paragraphe N` rows + decade dividers, **downgrading** today's 12 named chapters. The current bridge manifest already encodes the better chapter-level state. |
| Search | The 12 chapter routes are indexable + locally searched (`sitemap.spec.ts:51-70`). The contract requires new draft segments to be `noindex`/out-of-sitemap until `urlStability=="stable"` — zero today (`website-export-contract.md:120-121`). Migration removes 12 indexed pages and adds nothing indexable: a net SEO loss. |
| LLM (`llms.txt`) | A site-wide `llms.txt`/`llms-full.txt` **is** generated at build by `vitepress-plugin-llms` (`config.ts:498`, `ignoreFiles:['index.md']` `config.ts:499`) and already includes book Markdown via `{toc}` (`render-podcast-player-llms.py` is only a post-build podcast-tag expander). It is kept out of indexing by `src/public/_headers` (explicit `/llms.txt`, `/llms-full.txt`, and `/*.md`). Non-blocker: slice B generates no pages so it adds nothing; a future migration's new committed leaves would flow in and inherit the same noindex. |
| Tests | `sitemap.spec.ts:44`, `reading-nav.spec.ts:72-81` (every href resolves to a built page), plus literature/consolidation/doc-pager specs must be updated in lockstep. |

**pt is greenfield with a precedent:** `src/louis-lavelle/a-consciencia-de-si/` already hosts 118 paragraph-level 4-group leaves with **real** descriptive titles (locked by `reading-nav.spec.ts:64-70`), proving the website can host this shape well. The only gap is this export's generic `Parágrafo N` labels — so pt can be greenfield-created cleanly, but only after real titles ship (from the pipeline or minted by the website).

**Net:** route migration (D) is the correct **eventual** shape but the **wrong first slice**. Document the migration policy now and implement it **last**, after the export supplies real `groupPath` + per-paragraph titles and after a vendor+tests slice (B) lands the data safely.

---

## 4. Page-generation model (Q4)

**Recommendation: do NOT generate VitePress `.md` from `export/prose` in the first slice.** Consume metadata in `WorkContents` (build-time JSON → component); leave prose unconsumed for now.

| Approach | Static-VitePress safety | Verdict |
|---|---|---|
| Generate `.md` per prose leaf | Creates 99 fr segment routes that replace/shadow the 12 live chapter routes = route migration (slice D) | Defer |
| Runtime component (no `.md`) | Mounts `WorkContents` via the proven theme content-top slot allowlist (`WorkContentsMount.vue:11`); changes zero Markdown, zero routes; mirrors the `ReadingNav`/`PodcastEpisodeNav` pattern | **Safest for static deploy** |

Full generation **is** feasible later — the website already hosts a tested 118-leaf segment-level Lavelle work (`src/louis-lavelle/a-consciencia-de-si/`, classified `segment-level` and locked by `segment-manifest.spec.ts:148-157`). It is just not the first slice.

**Heading-duplication avoidance.** The prose `##` (chapter) / `###` (segment) headings are the leaf's own authored headings (matching the existing `a-consciencia-de-si` leaves and the export prose shape, e.g. `export/prose/.../fr/00-01-001-002.md:1-3`); when materialized as a page they are **not** duplication. Duplication arises only if `WorkContents`/`groupPath` ALSO renders the chapter/part label as on-page context on the **same** page where the prose `##`/`###` appear. In slice B `WorkContents` is hub-only and prose is unrendered, so there is no duplication. If prose pages are ever generated (slice D): keep the prose `##`/`###` as the leaf's authored headings, render `groupPath` labels only as nav/breadcrumb chrome, and **never strip** the pipeline prose — the contract forbids heading-strip (`website-export-contract.md:90-92,122-123`).

---

## 5. Indexing & visibility (Q5)

All 198 records are `urlStability:draft`, `publishable:false`, `maturity:draft`, `publicSlug:null` (`work-index.json:30-33`; bundle every segment). The contract publishes/indexes/canonicalizes/sitemaps only `urlStability=="stable"` — zero today (`website-export-contract.md:120-122`).

**Rule: while everything is draft, if any page is generated it MUST be noindex + sitemap-excluded + search-excluded + LLM-excluded (review-only).** Use the **buffer tier**, not the chapter sitemap-de-emphasis tier:

| Tier | Mechanism | Behavior | Right for draft pages? |
|---|---|---|---|
| Chapter de-emphasis (live-public) | `isChapterRoute` + `transformItems` (`config.ts:170-175,248-263`) | Drops from sitemap but **stays indexable + searchable** (locked `sitemap.spec.ts:40-70`) | **No** — reserved for genuinely public routes |
| Buffer hard-hide (draft review) | `buffer:true` → `bufferRoutes` (`config.ts:421-427`, "unlisted, noindexed, out of search" `config.ts:154-156`); `X-Robots-Tag: noindex` enforced by `src/public/_headers`; `search:false` frontmatter; `vitepress-plugin-llms` `ignoreFiles` (`config.ts:498-499`) | Out of sitemap + noindex + out of local search + out of `llms.txt` | **Yes** |

Note `buffer:true` alone only removes from the sitemap; **noindex is enforced by `_headers`** (currently only `/*.md` and `/llms*.txt`). Any generated review-page prefix must be added to `_headers` with `X-Robots-Tag: noindex` BEFORE relying on `buffer:true`.

**Review-only vs public:** while `urlStability=draft`, nothing about this work may be indexed, canonicalized, sitemapped, searched, or fed to LLM artifacts. Public eligibility flips **per-segment** only when the pipeline mints `publicSlug` and `urlStability` becomes `stable` (`website-export-contract.md:99-104`) — a deferred publish act. **Slice B generates no pages, so it has no visibility surface to manage** — another reason to prefer it.

---

## 6. Test plan (Q6)

Tests are Playwright `.spec.ts` files in `tests/` (`pnpm test` → `playwright test`, `package.json:15`; `verify` chains `format:check && lint && podcast:build && test`, `package.json:20`). New tests **extend** the existing baseline (`segment-manifest.spec.ts`, `work-contents.spec.ts`, `reading-nav.spec.ts`, `louis-lavelle.spec.ts`, `sitemap.spec.ts`) — they do not form a parallel suite. The reusable patterns: generator idempotence (`segment-manifest.spec.ts:29-34`), two-way coverage (`:36-49`), uniqueness (`:60-71`), no-prose-leak (`:176-184`), no-slug-leakage in rendered output (`work-contents.spec.ts:62-76`).

The 8 invariants, where each runs, and whether it can land in slice B:

| # | Invariant | Where it runs | Slice B? |
|---|---|---|---|
| 1 | No generated route without metadata: every emitted website route for this work has a backing export record `(canonicalId, language)` | New `pipeline-export.spec.ts` (mirror `segment-manifest.spec.ts:51-58`) | Yes (vacuous in B: no routes emitted) |
| 2 | No metadata segment without a prose leaf: each of 198 records has `export/prose/{author}/{book}/{language}/{segmentPrefix}.md` | `pipeline-export.spec.ts` (NEW join test) over vendored copy | **Yes (new)** |
| 3 | No prose leaf without metadata: 198 prose files ↔ 198 records, no orphan | `pipeline-export.spec.ts` (two-way, like `:36-49`) | **Yes (new)** |
| 4 | `routePath` uniqueness: `new Set(routePaths).size === routePaths.length` (verified 198/198, 99/99 per language) | Extend uniqueness test (`segment-manifest.spec.ts:60-71`) | Yes |
| 5 | Old-route redirects exist **if** old pages removed | `pipeline-export.spec.ts` / `sitemap.spec.ts` — **conditional**: no `_redirects` infra exists, so in B assert the **inverse** (12 old pages still resolve, like `reading-nav.spec.ts:72-81`) | Yes (inverse form only) |
| 6 | No body/private-marker leak into committed website artifacts | Extend `segment-manifest.spec.ts:176-184`; add scans for `read-at`, `==…==`, `%% review %%`, `[!review]`, `[!dt]` over vendored JSON | **Yes (new scans)** |
| 7 | `ReadingNav` order from pipeline `order`/`segmentIndex`, not filename sort | New behavior test — **defer**: today `build-reading-nav.py:65` sorts by name and `ReadingNav.vue:28-41` derives from `relativePath`; this locks the target state and can only land with the rewiring B defers | No (later) |
| 8 | `WorkContents` reads `groupPath` (authored `label`/`title`, `inferred:false`), not slug inference | New behavior test — **defer**: today `build-segment-manifest.py:98-125` synthesizes `groupPath` with `inferred:true`; locks target state, lands with rewiring | No (later) |

Invariants 1–6 land in slice B (1 vacuous, 5 as its inverse); invariants 7–8 are **behavior-change assertions** that would fail against current code and must land **with** the consumer rewiring B defers. Sequence: vendor + join + leak tests now (B); order/groupPath-source tests when consumers are rewired.

Also assert, mirroring existing locks: `source:"pipeline-export"`, `inferred:false` group titles, and that no live route changed (the vendored artifact is a sibling, not merged into `segment-manifest.json`, so `segment-manifest.spec.ts:195-214`'s consumer lock stays green).

---

## 7. Smallest safe first slice (Q7)

### 7.1 Options compared

| Option | Risks live public URLs? | Moves integration forward? | Smallest-safe? |
|---|---|---|---|
| **A — doc-only** | No | Barely — leaves the slug-parsing bridge (`build-segment-manifest.py`) as the de-facto consumer; no artifact, no join, no harness | Too small to be the slice |
| **B — vendor export + reshaper generator + tests; no route/page generation** | **No** (no page/route/manifest/sitemap change) | **Yes** — imports the source-of-truth into the repo, stands up the `(canonicalId, language)` + prose join, writes the harness C/D depend on | **Yes — recommended** |
| **C — hidden/noindex review pages for the one work** | Low-but-nonzero — ~198 new built routes in a fresh namespace; requires NEW noindex behavior (today chapters are deliberately indexable, `sitemap.spec.ts:51`); contradicts the contract's index-nothing rule (`website-export-contract.md:100,121`) | Yes, but more than needed first | No — larger SEO/route surface than B |
| **D — full route migration** | **High** — replaces 12 live chapter URLs with 99 paragraph URLs in a disjoint namespace; requires a `_redirects` channel that does not exist; introduces the pt route family | Yes, but it is the END state, not a slice | No — the deferred Phase-3 work |

### 7.2 Recommendation: B

B is the only option that is simultaneously **zero-risk to live URLs** and a **real integration step**. It (a) physically imports the source-of-truth into the repo (replacing the absent `local-books/` as a recoverable source); (b) stands up the `(canonicalId, language)` join + prose pairing the contract demands; (c) copies through the export's authored `groupPath` titles (`inferred:false`) and the pt edition into a website-local `source:"pipeline-export"` artifact; and (d) writes the test harness any later C/D step depends on. It changes no route, page, live URL, sitemap, or SEO surface, and it is exactly what both prior assessments scope as the next step (`docs/archive/book-pipeline-website-export-contract-assessment.md:455-462`; `docs/work-contents-component-spec.md:135-138`). A under-uses ready infrastructure; C/D touch live URLs/visibility while everything is `draft`.

Concretely, B = vendor the 2 JSONs into `.vitepress/theme/data/pipeline-export/`; add `scripts/build-pipeline-export.py` (reshape to the website segment-record shape, `source:"pipeline-export"`, prose left unconsumed, `routePath` data-only); add it to the `build` chain (`package.json:8`); add `tests/pipeline-export.spec.ts` mirroring `segment-manifest.spec.ts`.

### 7.3 What B explicitly defers

1. `routePath` adoption as an `href` — the 99 paragraph routePaths are a **disjoint** namespace from the 12 live chapter URLs; adoption is a full re-chunking + 301 program (slice D).
2. The pt public route family (`introducao-a-ontologia`) — no pt route exists today; consuming pt **metadata** in B is harmless, generating pt **pages** is slice D.
3. The `_redirects` channel — none exists; building it is part of D.
4. `WorkContents`/`ReadingNav` rewiring onto the vendored data (and mounting `introduction-a-l-ontologie` in `WorkContentsMount.vue:11`) — a later sub-step; B stops at producing the artifact + tests, avoiding any visible UI change.
5. `publicSlug` minting / publish — zero today; all 198 records are draft/non-publishable.
6. Test invariants 7–8 (order/groupPath sourced from pipeline) — they lock the rewired target state and would fail against current code; they land with the rewiring.

### 7.4 The next prompt (after this assessment)

> Implement **Slice B** for `louis-lavelle/introduction-a-l-ontologie` in `skepvox-website`, doc-grounded by `docs/website-export-ingestion-assessment.md`. (1) Vendor `export/work-index.json` + `export/works/louis-lavelle/introduction-a-l-ontologie.json` from `skepvox-book-pipeline` into `.vitepress/theme/data/pipeline-export/` (committed), and document the re-vendor step (copy + rerun the generator). (2) Add `scripts/build-pipeline-export.py` that reshapes the 198 export segment records into the existing website segment-record shape with `source:"pipeline-export"`, copying authored `groupPath` (`inferred:false`), carrying `routePath` as data only (never an href), and consuming **no** prose body; wire it into the `build` chain in `package.json`. (3) Emit a **separate sibling JSON** — do NOT merge into `segment-manifest.json`, do NOT change `WorkContentsMount.vue`'s allowlist, do NOT generate any `.md`, do NOT add a route, redirect, or sitemap/search/LLM entry. (4) Add `tests/pipeline-export.spec.ts` asserting: generator idempotence; `(canonicalId, language)` join completeness (99×2 records ↔ 99 fr + 99 pt prose leaves, both directions, no orphans); `routePath` uniqueness (198/198); `source:"pipeline-export"`; `inferred:false` group titles present (`Première partie` / `Les catégories premières de l'ontologie`); no body/prose and no private markers (`read-at`, `==…==`, `%% review %%`, `[!review]`, `[!dt]`); and that the 12 live fr chapter pages still resolve and `segment-manifest.json`'s consumer set is unchanged. Run `pnpm verify` and report results. Defer route migration, pt pages, redirects, consumer rewiring, and publish.
