# Filosofia IA — pilot migration assessment (locale-rooted target)

> **Status:** assessment / planning only. **No code, config, content, route, data, redirect, or
> book-pipeline change is part of this slice.** Doc-only. Branch `develop`, commit-only.
>
> **Scope of the move it plans:** reframe the site IA so the philosophy corpus stops living at a
> top-level `/louis-lavelle/`, using **Introdução à ontologia (pt)** — the live pipeline-export book —
> as the single pilot. Legacy Lavelle books are *not* migrated; they are removed later. Old URLs are
> allowed to **404** (clean break, no new redirects).

---

## 0. Executive recommendation (read this first)

After inventorying the current IA and weighing the future-multilingual direction, the recommendation
**changed mid-assessment** in response to explicit steering, and the change is the most important
output of this doc:

1. **Do not build a bare `/filosofia/` layer.** If the real future is a fully multilingual,
   locale-rooted site (`/pt/filosofia/…`, `/fr/philosophie/…`), then a clean `/filosofia/` shipped now
   is a **way-station that becomes migration debt** — it would force a *second* clean-break
   (`/louis-lavelle/` → `/filosofia/` → `/pt/filosofia/`), i.e. two 404 events instead of one.

2. **Move the pilot directly to the locale-rooted namespace:**
   `**/pt/filosofia/louis-lavelle/introducao-a-ontologia/**` and its 99 pt segment leaves.
   This is the book's **final** URL under the multilingual target — no further IA migration for this
   book. Crucially, it costs **the same** as `/filosofia/` would: the namespace is a website-side
   *string prefix* applied during ingestion (see §6), so `pt/filosofia/…` vs `filosofia/…` is a
   one-token difference in a config map, not extra engineering.

3. **Reserve the architecture, defer the machinery.** Moving the book to `/pt/` reserves the
   locale-root *namespace* and proves the `{locale}/{section}` projection on the safest surface (the
   fully data-driven pipeline-export book). It does **not** require building the full multilingual UI
   now — no locale switcher, no `fr/en/es/ru` roots, no hreflang fleet, no localized nav for every
   section, no VitePress `locales` adoption. Those are a separate, later, site-wide programme.

4. **Accept a temporary split-brain.** During the pilot, `/pt/filosofia/<book>` coexists with the
   still-locale-less `/literatura/`, `/podcast/`, and legacy `/louis-lavelle/`. That is the cost of an
   incremental, content-first locale-rooting, and it is absorbed by the already-established
   clean-break / 404-tolerant posture. `/literatura/` → `/pt/literatura/` and `/podcast/` →
   `/pt/podcast/` follow in their own later slices; the home `/` and locale negotiation come later
   still.

5. **Honest alternative (B′ — defer):** if the locale-root *scheme* (locale code granularity, section
   names, the edition-slug model) is not yet ready to lock, the lowest-risk option is to **leave the
   book at `/louis-lavelle/introducao-a-ontologia/` and do nothing now**, then do the IA reframe once,
   coherently, as the first slice of the real multilingual migration. This avoids *all* throwaway work
   at the cost of making no IA progress today. The scheme decisions below are, however, standard and
   lockable now, so the primary recommendation is the direct move.

6. **SEO reinforces this.** Locale roots give stronger, cleaner per-language signals (`<html lang>`,
   localized URL tokens + metadata, `hreflang` alternates, per-language sitemaps/search) — and they
   are strongest exactly where a pt-named `/filosofia/` fails: French and future en/es/ru surfaces.
   For the single-locale pilot the SEO delta is neutral (no duplicate-content exposure yet); the gain
   accrues as locales are added, which is another reason to reserve `/pt/` rather than re-migrate
   later. Full analysis in §2.7.

**One-line answer to the steering questions:** skip `/filosofia/`; go straight to `/pt/filosofia/…`
now (it is the same work and the final URL); keep UI-locale (chrome) and book-edition (content)
strictly orthogonal; never let a Brazilian reader land in non-pt chrome — and take the stronger
per-language SEO that locale roots give (§2.7).

---

## 1. Current-state inventory

### 1.1 Route families under `/louis-lavelle/` and siblings

Verified against `src/`, `.vitepress/config.ts`, `scripts/`, and
`.vitepress/theme/data/pipeline-export-segments.json` (198 records = 99 pt + 99 fr).

| Route family | Source kind | Classification | Notes |
|---|---|---|---|
| `/louis-lavelle/introducao-a-ontologia/` (hub `index.md` + **99 pt leaves**) | **pipeline-export generated** | **keep & move now** | The pilot. Hub carries `generated: pipeline-work-hub`; leaves carry `generated: pipeline-segment-routes`. Identity in `pipelineCanonicalId` / `segmentPrefix`; `routePath` is presentation only. |
| `/louis-lavelle/` (`index.md` + `works.json`) | hand-authored | **delete / replace** | Legacy author hub for all 9 books, `CardGrid` from `works.json`, canonical `https://skepvox.com/louis-lavelle/`. The top-level corpus we are dissolving. |
| `/louis-lavelle/introduction-a-l-ontologie` (`.md` full-text) + `/louis-lavelle/introduction-a-l-ontologie/` (12 old fr chapter pages) | legacy (single-file + old-pipeline) | **remove later** | Old fr edition. Currently the **redirect sources** (see §1.3). Out of search/LLM by path rule. |
| `/louis-lavelle/{a-consciencia-de-si, de-l-acte, de-l-ame-humaine, de-l-etre, du-temps-et-de-l-eternite, l-erreur-de-narcisse, la-conscience-de-soi, la-presence-totale, quatre-saints}` (`.md` + chapter subdirs, ~9 books, hundreds of files) | legacy hand-authored / old-pipeline | **remove later** | The legacy corpus. **Not migrated.** Built by per-book `scripts/build-lavelle-*.py`. |
| `/literatura/` → `/literatura/<author>/` → `/literatura/<author>/<work>` | hand-authored + `build-literatura-manifests.py` | keep (sibling; later locale-root) | **The mirror template** for section→author→work (see §3). |
| `/podcast/` → `/podcast/<show>/` → episodes | hand-authored | keep (sibling; later locale-root) | Multi-show, `.cues.json` WebVTT. |
| `/reading-review/*` (5 buffer pages) | hand-authored | **preserve hidden/internal** | `buffer: true`, noindex, `search: false`. Internal QA harnesses (`PipelineExportReview`, `PipelineSegmentPreview`, `PipelineWindowPreview`, `PipelineReaderPreview`, `ReaderIcon` harness). Keep in place; unaffected by the move. |

**Generated vs authored, precisely:** the pilot's hub + 99 leaves are written by
`scripts/build-pipeline-segment-routes.py` (it also writes the hub via its `WORK_HUB_*` constants) from
the vendored export; the legacy books are written by per-book `build-lavelle-*.py`; the
section/author/work hubs (literatura, podcast, the legacy lavelle hub) are hand-authored with
generated `works.json` manifests.

### 1.2 Everything that assumes `/louis-lavelle/` is a top-level corpus

| Location | Assumption | Touched by the move? |
|---|---|---|
| `.vitepress/theme/data/pipeline-export-segments.json` — `work.editions[].routePrefix` (`pt = louis-lavelle/introducao-a-ontologia`, `fr = louis-lavelle/introduction-a-l-ontologie`) **and** every segment `routePath` | the public namespace is baked into the data | **Yes** — re-projected to `pt/filosofia/…` for the pt edition (data only; identity unchanged). |
| `scripts/build-pipeline-segment-routes.py:39` `OUT_DIR = src/louis-lavelle/introducao-a-ontologia` (hard-coded); `:141` takes only the leaf from `routePath` | the generated-page directory is a fixed website constant | **Yes** — derive `OUT_DIR` from the (re-projected) `routePath` prefix (§6). |
| `scripts/build-pipeline-export.py:21` `BUNDLE = …/works/louis-lavelle/introduction-a-l-ontologie.json`; `:~63/83` copies `routePath`/`workId` verbatim | reshaper passes the namespace through unmodified | **Yes** — add the website section/locale re-projection here (§6). |
| `scripts/build-pipeline-redirect-map.py` `OLD_ROUTE_BASE = /louis-lavelle/introduction-a-l-ontologie`, `STATUS = "enabled"` | old fr URLs redirect into the `/louis-lavelle/` pt namespace | **Yes** — obsolete under clean break; disable (§5). |
| `.vitepress/config.ts` nav `Lavelle → /louis-lavelle/`; `sidebar['/louis-lavelle/']`; `isChapterRoute()` (drops `louis-lavelle` depth ≥ 3 from sitemap); `llmstxt ignoreFiles` (blocks old fr paths) | corpus + sitemap + LLM keyed on the path string | **Yes** — add the locale-rooted nav/sidebar + a new depth/stability rule (§8, §9). |
| `.vitepress/theme/components/PipelineWorkContents.vue:25` `workId` default `louis-lavelle/introduction-a-l-ontologie` | hub filters segments by a hard-coded **identity** (not a route) | **No route impact** — `workId` is identity, unchanged by the move. Parameterising it is a multi-book concern (§7). |
| `reader-shell.ts` `workHubHref` / `trechoHref` / `segmentHref`; `PipelineSegmentNav`, `PipelineReaderHeader` | derive every href from `routePath` | **No** — fully namespace-agnostic; re-projecting `routePath` propagates automatically. Only example **comments** go stale. |
| `scripts/build-{reading-nav,segment-manifest,sidebar-nav}.py` | legacy reading system keyed on `/louis-lavelle/` | **Mostly no** for the pilot — these *skip* the pipeline-export family (`generated:` markers; not in `works.json`); `build-sidebar-nav.py` does read `work.editions[].routePrefix`, which auto-updates from the data. |
| `tests/` (~25 spec files, ~180 `/louis-lavelle/` literals) | route literals in assertions | **Yes** — update literals (§10). |
| `docs/*` (migration plan, URL architecture, ingestion, reading-app, seo) | document the `/louis-lavelle/` stance | **Yes, later** — reconcile (Appendix B). |

### 1.3 Redirect state (verified directly — a lens conflict resolved)

`src/public/_redirects` **exists and is live**: 12 `301`s from old fr chapter URLs
(`/louis-lavelle/introduction-a-l-ontologie/<chapter>`) → the first pt segment of that chapter
(`/louis-lavelle/introducao-a-ontologia/<segment>`). `pipeline-redirect-map-introduction-a-l-ontologie.json`
has `status: "enabled"`; `build-pipeline-redirect-map.py:29` `STATUS = "enabled"`. (A stale docstring in
`build-pipeline-segment-routes.py` still says "not enabled" — ignore it; the artifacts are enabled.)
**Implication:** these redirects target `/louis-lavelle/introducao-a-ontologia/…`, which the move turns
into 404s — so under clean break they must be **disabled** (§5), not merely left alone.

---

## 2. Future multilingual-site architecture review (the decisive section)

This section answers the steering directly and **precedes** the IA recommendation because it changes it.

### 2.1 Two orthogonal language axes — never conflate them

- **Book-edition language** — the language of the *content* (a French original vs its Portuguese
  translation vs a future Russian original). Already modelled in data: editions of one work joined by
  `canonicalId` / `segmentPrefix`, each edition routed by its **own-language slug**
  (`introducao-a-ontologia` pt, `introduction-a-l-ontologie` fr). This is the locked **Family E**
  decision (`docs/multilingual-book-url-architecture-assessment.md` §6: per-edition own-language
  routes, *no* language-path token). It is **not** the thing this review is about.
- **Site-UI language** — the language of the *chrome*: nav, section names, author hubs, labels,
  metadata, search, footer, discovery surfaces. Today the site is **single-UI-locale (pt)**. The
  multilingual future is making the chrome itself localizable (pt/fr/en/es/ru).

The steering's core requirement — *a Brazilian reader must never be dropped into a mixed-language
environment* — is a **site-UI-language** requirement. Book editions alone cannot satisfy it: a pt
reader opening the French original must still see **pt chrome** with a clear "original em francês"
label, not French nav.

### 2.2 The two URL models

| Model | Shape | Section name | UI locale |
|---|---|---|---|
| **Section-first** (the bare-`/filosofia/` proposal) | `/filosofia/louis-lavelle/<editionSlug>/…` | one language (pt), baked in | implicit/single |
| **Locale-rooted** (the steering target) | `/{locale}/{section}/louis-lavelle/<editionSlug>/…` | localized per locale | explicit in the path |

Locale-rooted examples (the target end-state):

```
/pt/filosofia/louis-lavelle/introducao-a-ontologia/<segment>      ← pt UI, pt edition
/pt/filosofia/louis-lavelle/introduction-a-l-ontologie/<segment>  ← pt UI, fr edition (chrome stays pt)
/fr/philosophie/louis-lavelle/introduction-a-l-ontologie/<segment>← fr UI, fr edition
/en/philosophy/louis-lavelle/…    /es/filosofia/louis-lavelle/…   /ru/<section>/louis-lavelle/…
```

### 2.3 Does shipping `/filosofia/` now create *avoidable* debt? — Yes.

- **No architectural debt either way.** The reader shell, the data model, and the website's
  prefix-projection (§6) are `routePath`-driven; a locale root is simply *another path token* in the
  same projection. So neither `/filosofia/` nor `/pt/filosofia/` requires shell/component rework.
- **But `/filosofia/` creates avoidable *URL-migration* debt.** If the end-state is `/pt/filosofia/`,
  then a bare `/filosofia/` shipped now must later be re-migrated (`/filosofia/` → `/pt/filosofia/`),
  a *second* clean-break 404 event for the same book — pure throwaway.
- **`/pt/filosofia/` is the same cost as `/filosofia/`.** Because the namespace is a website-side
  string prefix (§6), the only difference between the two targets is `pt/filosofia` vs `filosofia` in
  one config value. Going directly to the final URL therefore **eliminates the second migration at
  zero extra cost**. This is the crux of the recommendation.

### 2.4 Answers to the steering's five questions

1. **Skip or treat `/filosofia/` as temporary?** **Skip it entirely.** Do not build a clean
   `/filosofia/` layer; it is debt. The locale-rooted `/pt/filosofia/` is the real target.
2. **Move Introdução à ontologia directly into `/pt/filosofia/…` now?** **Yes** (primary
   recommendation) — it is the same work and the *final* URL. *Or* defer the move entirely (§0 B′) if
   you would rather lock the full locale scheme before committing any `/pt/` URL. Do **not** take the
   middle path of shipping `/filosofia/` first.
3. **How do book editions relate across locales without confusing the reader?**
   - The **UI-locale root fixes the chrome** — under `/pt/…` the reader *always* sees pt nav/labels,
     even when reading the French original. Chrome never mixes languages.
   - The **edition is a within-work choice**, surfaced by a labelled edition switcher (the deferred
     `PipelineEditionSwitch`), not by the chrome language. "Tradução em português" / "Original em
     francês" makes the content language explicit while the chrome stays the locale's.
   - The **edition slug is stable across UI locales** (Family E own-language slug). The *same* fr
     edition is `/pt/…/introduction-a-l-ontologie/` under pt UI and
     `/fr/…/introduction-a-l-ontologie/` under fr UI — identical content, localized chrome, linked by
     `hreflang`, each canonical to itself. A reader picks a UI locale **once** (the root) and an
     edition **per work** (the switcher); the two never collide.
4. **What stays language-neutral in data** (never localized, never in the localized path):
   `workId`, `canonicalId`, `segmentPrefix`, **`editionRole`** (the role of an edition within the
   work — e.g. `source-original` vs `canonical-translation`), `order`, and the `groupPath`
   structure (kinds/indices). These are identity + structure and are shared across every locale and
   every edition.
5. **What becomes localized** (in routes and/or UI): the **UI-locale root** (`/pt/`, `/fr/`…), the
   **section name** (filosofia / philosophie / philosophy / filosofía / …), **nav + section + UI
   labels**, **author-hub copy** (the author *slug* `louis-lavelle` stays neutral; bios/headings
   localize), **per-edition work slugs** (already own-language via Family E), **search index** (per
   locale), **footer**, and **metadata** (title/description/`og:`/`canonical`/`hreflang`). The
   author and edition *slugs* are not localized by UI locale; everything presentational is.

### 2.5 The route contract (target)

```
/{uiLocale}/{localizedSection}/{authorSlug}/{editionSlug}/{leaf}
   pt          filosofia          louis-lavelle  introducao-a-ontologia  00-01-002-008-paragrafo-7
```

- `uiLocale` — lowercase ISO 639-1 (`pt`, `fr`, `en`, `es`, `ru`). **Coarse UI language**, not the
  content variant. *Open decision:* `pt` vs `pt-BR` — recommend coarse **`pt`** (the UI language;
  content is pt-BR but the locale root governs chrome, not orthography). Record it in the scheme doc.
- `localizedSection` — the section name in `uiLocale`. *Open decision:* Russian section in Cyrillic
  IRI vs ASCII transliteration (`философия` vs `filosofiya`) — recommend ASCII-transliterated section
  slugs for URL hygiene; decide when `/ru/` is built.
- `authorSlug` — language-neutral proper noun.
- `editionSlug` — the edition's own-language slug (Family E), stable across UI locales.

**Explicit-locale model:** every locale is prefixed, including pt (the steering's `/pt/…` examples).
There is no privileged default-at-`/`; the future build-out adds `/` → preferred-locale negotiation.
This is compatible with VitePress's directory-based i18n (`src/pt/…` can later become a VitePress
`locales` entry), so the pilot's path-prefix approach does **not** foreclose adopting VitePress i18n
later — see §6.4.

### 2.6 What the pilot does and does **not** commit

| Committed now (cheap, stable, conventional) | Deferred to the multilingual programme |
|---|---|
| The `/{locale}/{section}/{author}/{editionSlug}/{leaf}` shape | `fr/en/es/ru` roots + their content |
| `pt` + `filosofia` for the pilot book | Locale switcher UI, `/` → locale negotiation |
| Website `{locale}/{section}` prefix projection (§6) | hreflang fleet across locales/editions |
| Language-neutral data invariants (§2.4) | VitePress `locales` adoption, localized search/footer |
| The localized-section name map (documented) | `PipelineEditionSwitch` go-live (needs ≥2 live editions) |

### 2.7 SEO: locale-rooted vs language-mixed routing — which wins long-term

The locale-root choice is not only reader clarity; it changes the **language signals** search engines
receive. Comparison on the levers that drive multilingual SEO:

| SEO lever | Language-mixed `/filosofia/…` | Locale-rooted `/{locale}/{section}/…` |
|---|---|---|
| `<html lang>` per subtree | per-page only — the section token is pt while a fr-edition page is fr content, so no consistent subtree signal | consistent + reliable per root (`/pt/` ⇒ pt chrome; content lang from the edition) |
| URL-token language signal | section token (`filosofia`) is always pt — contradicts fr/en/es/ru pages | `philosophie`/`philosophy`/… align the URL token with the page's language |
| `hreflang` alternates | no UI-locale alternates exist (single UI); only edition-translation pairing | clean — both UI-locale variants **and** edition-translation pairs are expressible |
| Localized metadata (title/desc/og) | pt only | per-locale, matching the audience |
| Sitemaps | one mixed bucket | per-language (`sitemap-pt.xml`, `sitemap-fr.xml`) |
| Search index | one mixed index | scoped per locale, no cross-language noise |
| Audience/geo association | none at subtree level | engines associate `/pt/` ↔ pt audiences, `/fr/` ↔ fr |

**Per audience, long-term:**

- **Portuguese readers** — `/pt/` is a coherent pt subtree: strong, uncontaminated pt signal,
  pt-targeted sitemap/index, pt metadata. Mixed `/filosofia/` is *adequate today* (all pt) but
  **degrades** the moment it must also host fr-edition content under a pt-named section — the pt
  signal is muddied by other-language pages in the same tree.
- **French readers** — decisive. `/fr/philosophie/…` gives a French URL token, French chrome, French
  metadata, `lang="fr"`, and a French sitemap — everything needed to rank for French queries. Mixed
  `/filosofia/` **cannot** produce a coherent French surface at all (pt section name + pt chrome);
  for French (and en/es/ru) the mixed model is a non-starter for SEO.
- **Future en/es/ru** — same: locale roots are the only model giving each language a self-consistent,
  well-signaled surface, with `hreflang` tying equivalent pages so engines serve the right language to
  the right searcher.

**Honest costs / required discipline:**

- Locale roots multiply URLs (edition × UI-locale matrix). The *same* content under multiple UI-locale
  roots is **duplicate content** and must be governed by correct `canonical` (each variant canonical to
  itself) + reciprocal `hreflang` (incl. `x-default`). Done wrong this *hurts* SEO — so locale roots
  win **only with** hreflang/canonical hygiene, which the multilingual programme must own.
- The **pilot** (pt UI × pt edition only) has no matrix yet → **no duplicate-content exposure**; it is
  a single clean pt surface. The upside accrues as locales are added — which is exactly why reserving
  `/pt/` now (vs `/filosofia/`) avoids re-pointing every canonical/hreflang/sitemap entry in a later
  migration.
- The clean-break loss of old `/louis-lavelle/…` equity (§5) is **orthogonal** — it happens under
  either target.

**Verdict:** for anything beyond a permanently-pt-only site, **locale-rooted routing is the materially
stronger long-term SEO architecture**, strongest precisely where the mixed model fails (non-pt
surfaces). Combined with the zero-extra-cost argument (§2.3), SEO moves the locale-rooted target from
"nice future-proofing" to **recommended** — conditional on maintaining hreflang/canonical hygiene as
locales are added.

---

## 3. Target IA model

### 3.1 Hierarchy (pilot, locale-rooted)

```
/pt/                                                         (future locale home — NOT built in the pilot)
/pt/filosofia/                                               section hub  (mirror of /literatura/)
/pt/filosofia/louis-lavelle/                                 author hub   (pilot: one book listed)
/pt/filosofia/louis-lavelle/introducao-a-ontologia/          work hub     (PipelineWorkContents)
/pt/filosofia/louis-lavelle/introducao-a-ontologia/<segment> 99 pt leaves (PipelineSegmentNav + Header)
```

### 3.2 Mirror of `/literatura/`

`/filosofia/` reuses the literatura composition exactly, one locale level deeper:

| Surface | Literatura (today) | Filosofia (pilot, locale-rooted) |
|---|---|---|
| Section hub | `src/literatura/index.md` → `CardGrid` of `literatureAuthorCards` | `src/pt/filosofia/index.md` → `CardGrid` of new `philosophyAuthorCards` (one card: Louis Lavelle) |
| Author hub | `src/literatura/<author>/index.md` + `works.json` | `src/pt/filosofia/louis-lavelle/index.md` listing **only** the pilot book |
| Work hub | single-file work page | `…/introducao-a-ontologia/index.md` mounting `PipelineWorkContents` (`generated: pipeline-work-hub`) |
| Reading leaves | n/a (literatura works are single-page) | 99 pipeline-export segment pages |

`/filosofia/` deliberately **starts narrow**: one author, one pilot book. New philosophy
authors/books inherit the same model with no shell change.

### 3.3 Portuguese labels (pilot UI)

`Filosofia` (nav + section hub h1), `Autores` (section hub group heading, as literatura), `Louis
Lavelle` (author hub), `Sumário` (reader, existing). For the work-edition grouping on the author hub,
prefer a philosophy-appropriate split when a second edition is live: **"Edição canônica" / "Original"**
(role-based, language-neutral framing) rather than literatura's translated/original split — but for the
pilot (single pt edition shown) a flat list suffices. Localized section names for the future:
`filosofia` (pt) · `philosophie` (fr) · `philosophy` (en) · `filosofía` (es) · `filosofiya`/`философия`
(ru, see §2.5).

---

## 4. Pilot-book strategy

Introdução à ontologia (pt) is the first canonical philosophy/pipeline-export book and the validation
vehicle. The pilot must prove, **at the locale-rooted path**:

- `/pt/filosofia/` section hub renders + links to the Louis Lavelle author hub;
- `/pt/filosofia/louis-lavelle/` author hub renders + lists Introdução à ontologia (and **nothing
  legacy**);
- `/pt/filosofia/louis-lavelle/introducao-a-ontologia/` work hub renders the owned
  `PipelineWorkContents` map;
- all **99 pt leaves** build at the new path with **real prose** (the generator hard-fails on a thin
  stable page);
- reader shell — `PipelineReaderHeader` (Sumário/chapter links), `PipelineSegmentNav` (prev/next/up),
  breadcrumb, `#trecho-` fragments — resolves **entirely inside** `/pt/filosofia/louis-lavelle/`;
- sitemap / search / `llms.txt` reference the new paths; the pt edition stays indexable; old fr stays
  excluded;
- **no old-Lavelle leakage**: no canonical surface links into `/louis-lavelle/…`.

**Success condition:** once the pilot is green, (a) remove the legacy Lavelle books from the site, and
(b) bring future philosophy books in **only** through the pipeline-export model at
`/pt/filosofia/<author>/<editionSlug>/`.

---

## 5. Clean break / no-redirect policy

- **Old URLs 404, by intent.** No new redirects are created.
- **Disable, don't keep, the existing redirect artifacts.** The 12 live `301`s (§1.3) point old fr
  chapter URLs at `/louis-lavelle/introducao-a-ontologia/…`, which the move makes 404. Leaving them
  would create *redirects to dead targets*. Therefore, in the move:
  - set `build-pipeline-redirect-map.py` `STATUS = "disabled"` (the generator then removes/empties
    the block in `src/public/_redirects`, per its `status == "enabled"` guard), **and/or** delete
    `pipeline-redirect-map-introduction-a-l-ontologie.json` + the now-moot
    `tests/pipeline-redirect-map.spec.ts`;
  - leave any *non-pipeline* lines in `src/public/_redirects` (if present) untouched.
- **Identity is unaffected.** `canonicalId` / `segmentPrefix` are stable; only `routePath` (presentation)
  changes. Nothing that joins data breaks.
- **SEO cost, stated honestly:** the live pt reading pages (currently indexable at `/louis-lavelle/…`)
  lose their URL equity and must be re-crawled at `/pt/filosofia/…`; inbound links and any ranking on
  the old paths are dropped (no 301 to carry them). This is accepted in exchange for a clean,
  future-proof architecture and **one** migration instead of two. The hubs (`/pt/filosofia/`,
  `/pt/filosofia/louis-lavelle/`, the work hub) remain the indexable discovery surface; leaves stay
  crawlable-but-pruned from the sitemap (§9). Mitigation if ever wanted: a *single* future
  `/louis-lavelle/* → /pt/filosofia/…` redirect could be added deliberately, but that is explicitly
  out of scope here.

---

## 6. Pipeline-export implications — where the namespace lives, and who should own it

### 6.1 Finding (verified)

The public namespace is **split across two layers today**:

1. **book-pipeline** mints the full `routePath` (and per-edition `work.editions[].routePrefix`),
   e.g. `louis-lavelle/introducao-a-ontologia/<leaf>`, and the website **passes it through verbatim**
   (`build-pipeline-export.py`);
2. **the website** independently **hard-codes** the generated-page directory
   (`build-pipeline-segment-routes.py:39 OUT_DIR`) to *match* that prefix, using only the leaf from
   `routePath`.

So the **section** (`filosofia`) and **locale** (`pt`) are *not in the data* — they are an IA/website
concern. `work.authorSlug` / `work.bookSlug` already exist as structured fields; the section/locale
prefix is the missing, website-owned piece.

### 6.2 Options for changing the namespace

- **A — website re-projection (recommended).** During website ingestion, re-project each pt
  segment's `routePath` (and the pt `routePrefix`) by prepending the IA prefix, and **derive
  `OUT_DIR` from the re-projected `routePath`** instead of hard-coding it. book-pipeline is untouched.
- B — change book-pipeline `routePrefix`/`routeSlug` generation. Rejected for the pilot: pushes a
  *website IA* decision (which section/locale a book lives under) into the *content* pipeline, and the
  steering says avoid book-pipeline changes unless website-only creates bad debt (it does not).
- C — a runtime `routeBase` override in components. Rejected: the components already consume
  `routePath`; re-projecting the *data* is strictly simpler and needs no component change.
- D — none better.

### 6.3 Recommended source-of-truth boundary

> **book-pipeline owns book *identity* + a *book-relative* path** (`author/editionSlug/leaf`).
> **The website owns the IA *namespace*** — the `{locale}/{section}` prefix.

Concretely (the pilot wiring):

- Add one website-side map, keyed by **identity** (`workId`), e.g.
  `ROUTE_BASE = { "louis-lavelle/introduction-a-l-ontologie": "pt/filosofia" }` (a single shared
  constant used by the generators). For `/filosofia/` it would be `"filosofia"`; for the recommended
  target it is `"pt/filosofia"` — **the only difference**, proving §2.3.
- In `build-pipeline-export.py`: when projecting into `pipeline-export-segments.json`, rewrite the pt
  edition's `routePath` + `routePrefix` to `"<ROUTE_BASE>/<book-relative path>"`. (Leave fr records
  as-is; the fr edition generates no pages in the pilot.)
- In `build-pipeline-segment-routes.py`: replace the hard-coded `OUT_DIR` with
  `OUT_DIR = ROOT / "src" / Path(*routePath.split("/")[:-1])` — i.e. **derive the directory from the
  re-projected `routePath`**. The script becomes namespace-self-describing; future books and locales
  need no script edit.

This is **website-only**, requires **no book-pipeline change**, keeps the data the single source of
truth for the public path, and generalizes for free: future `fr/philosophie/…`, `en/philosophy/…` are
just other `ROUTE_BASE` values.

### 6.4 Future-proofing note

When the full multilingual programme begins, two refinements land cleanly on top of this boundary:
(a) book-pipeline can be asked to emit a *purely* book-relative `routeSlug` (dropping any top-level
corpus assumption) so the website map is the *only* place the IA namespace lives; (b) the
`src/{locale}/…` layout the projection produces is exactly what VitePress directory-based i18n
(`locales`) expects, so adopting VitePress i18n later is additive, not a restructure.

---

## 7. Component implications

**The reader shell is already route-base-agnostic — no component code change is needed to move the
book.** Confirmed across the shell:

- `reader-shell.ts` — `segmentHref` (`'/' + routePath`), `workHubHref` (drop the leaf), `trechoHref`
  (`workHubHref + #trecho-<prefix>`) are pure `routePath` transforms. Re-projecting `routePath` to
  `pt/filosofia/…` makes them emit `/pt/filosofia/…` automatically. Only the example **comments**
  (lines ~67–68) go stale → update them.
- `PipelineSegmentNav.vue`, `PipelineReaderHeader.vue` — gate on frontmatter markers (not paths),
  filter by `(canonicalId, language)`, build every href via the shell helpers. No change.
- `PipelineWorkContentsMount.vue` — mounts on the `generated: pipeline-work-hub` marker, not a path;
  travels with the moved hub. (Its doc-comment that names `/louis-lavelle/…` is inaccurate already —
  fix the comment.)
- `PipelineWorkContents.vue` — builds links from `s.routePath` (agnostic). It **filters by a
  hard-coded `workId` default** (`louis-lavelle/introduction-a-l-ontologie`). That is **identity, not
  a route**, and is unchanged by the move, so the pilot is unaffected. **Recommended (small, optional)
  hardening for the multi-book future:** make `workId` self-healing —
  `props.workId ?? meta.work?.workId` — so a second book/edition can mount without editing the
  component. This is the same parameterisation already noted as deferred in the reader-shell docs;
  not a blocker for the pilot.

**Conclusion:** the shell does **not** need a route-base abstraction — it is already data-driven. The
single route-base abstraction that *is* worth adding lives in the **generators** (§6.3), not the
components.

---

## 8. Generator / file-move plan (pilot)

**Create (hand-authored):**

- `src/pt/filosofia/index.md` — section hub (mirror `src/literatura/index.md`; `CardGrid` of
  `philosophyAuthorCards`).
- `src/pt/filosofia/louis-lavelle/index.md` — author hub listing only the pilot book; locale-rooted
  canonical (`https://skepvox.com/pt/filosofia/louis-lavelle/`).
- `.vitepress/theme/components/authors.ts` — add `philosophyAuthorCards` (one card → `/pt/filosofia/louis-lavelle/`).

**Regenerate (data + generated pages, via the §6.3 re-projection):**

- `.vitepress/theme/data/pipeline-export-segments.json` — pt `routePath` ×99 + pt `routePrefix`
  re-projected to `pt/filosofia/louis-lavelle/introducao-a-ontologia/…`; identity fields untouched.
- `src/pt/filosofia/louis-lavelle/introducao-a-ontologia/` — the hub `index.md` + 99 pt leaves,
  generated at the new `OUT_DIR` (derived from `routePath`), markers preserved.

**Delete:**

- `src/louis-lavelle/introducao-a-ontologia/` (old generated pt hub + 99 leaves) — superseded by the
  re-generated tree.
- Redirect artifacts (§5): disable `STATUS` and/or delete the redirect-map JSON + its spec.

**Update in place:**

- `.vitepress/config.ts` — nav (add `Filosofia → /pt/filosofia/`), sidebar (`'/pt/filosofia/…'`),
  `isChapterRoute` + sitemap rule, `llmstxt` (see §9). Reader-shell example comments.

**Defer (NOT in the pilot):**

- Deleting the **legacy** Lavelle books / `build-lavelle-*.py` / legacy author hub — a later cleanup
  slice, only after the pilot is verified.
- Any change to `build-reading-nav.py` / `build-segment-manifest.py` — the pipeline family is skipped
  by them; only needed if a *legacy-style* work is ever placed under `/filosofia/` (it is not).
- Locale-rooting `/literatura/`, `/podcast/`, the home `/`, and the multilingual UI — separate
  programme.

**Decision recorded:** create directly under `src/pt/filosofia/…` (not `src/filosofia/…`); delete the
old `src/louis-lavelle/introducao-a-ontologia/` generated pages; keep legacy Lavelle until the pilot
passes; then remove `/louis-lavelle/` in a cleanup slice.

---

## 9. Sitemap / search / LLM / indexing

**Target behaviour:** `/pt/filosofia/` and `/pt/filosofia/louis-lavelle/` indexable; the work hub +
its pt leaves are the canonical indexable reading surface; old `/louis-lavelle/…` 404s after cleanup;
`reading-review` stays hidden.

**Changes:**

- **`isChapterRoute()` / sitemap pruning** — currently path-keyed (`literatura` depth ≥ 4,
  `louis-lavelle` depth ≥ 3). The locale-rooted leaves are deeper:
  `/pt/filosofia/louis-lavelle/<work>/<leaf>` = depth 5. Add a matching rule **or, preferably,
  generalize to a stability/metadata-aware gate** (drop routes whose `urlStability != "stable"` or
  that carry the segment-leaf marker), which the existing docs already recommend over fragile path
  lists and which makes every future locale/section free. Net: leaves crawlable-but-pruned, hubs kept.
- **`llmstxt` `ignoreFiles`** — keep blocking the old fr edition paths; do **not** add
  `pt/filosofia/**` (the pt edition is the canonical edition and should appear in `llms.txt`). The
  existing blocks are specific to `louis-lavelle/introduction-a-l-ontologie`, so the new path is
  included automatically. Same generalization-to-stability applies.
- **Search** — VitePress local search indexes built pages; the moved pages index at the new path
  automatically. (Future: per-locale search scoping is part of the multilingual programme.)
- **Sitemap** — generated from the built site; updates automatically once routes move + the prune rule
  is corrected.
- **Metadata** — the two new hubs need locale-rooted `canonical` (+ later `hreflang` when sibling
  locales exist; none in the pilot, so omit `hreflang` now).

**Tests:** sitemap inclusion/exclusion at the new depth; `llms.txt` includes the pt edition + excludes
old fr; search resolves a new-path leaf.

---

## 10. Test strategy

~25 spec files carry `/louis-lavelle/` literals; the move is mostly a **find-and-update of route
constants** (logic is route-agnostic). Group and update:

- **Route-assertion specs** (`louis-lavelle.spec`, `pipeline-segment-routes.spec`, `sitemap.spec`,
  `homepage.spec`) — update every literal to `/pt/filosofia/…`.
- **Data-foundation specs** (`pipeline-export.spec`, `sidebar-nav.spec`, `segment-manifest.spec`) —
  update constants/assertions; `pipeline-export.spec`'s exact-consumer + pairing checks stay valid.
- **Integration specs** (`pipeline-work-contents.spec` `HUB`, `reader-shell.spec` `PT_ROUTE`/`FR_ROUTE`,
  `reader-header.spec` `HUB`, `pipeline-segment-nav.spec`) — update the route constants only.
- **Redirect spec** (`pipeline-redirect-map.spec`) — **delete** (clean break removes the redirects).
- **Preview specs** (`pipeline-*-preview.spec`) — update route examples.

**Minimal strong pilot test set (new/updated assertions):**

1. `/pt/filosofia/` builds and links to the Louis Lavelle author hub.
2. `/pt/filosofia/louis-lavelle/` builds and lists Introdução à ontologia (and lists **no** legacy
   Lavelle book).
3. `/pt/filosofia/louis-lavelle/introducao-a-ontologia/` builds with the owned `PipelineWorkContents`
   hub.
4. All **99 pt leaves** build at the new path with real prose (no thin/buffer page).
5. Reader nav (header + bottom nav + `#trecho-`) stays **inside** `/pt/filosofia/louis-lavelle/`.
6. **No** canonical surface links to `/louis-lavelle/…`; legacy books are not linked from the new IA.
7. Sitemap/search/`llms.txt` use the new paths; old fr stays excluded; pt edition included.
8. **No** redirects are generated (clean break): `src/public/_redirects` carries no fr→pt block; the
   redirect-map artifacts are gone/disabled.
9. `reading-review` buffer pages remain noindex/hidden.
10. **Architecture guard:** a unit assertion that the `routePath` re-projection + `OUT_DIR` derivation
    place a segment at `src/pt/filosofia/…` and that `workHubHref` yields `/pt/filosofia/…/` — this
    locks the `{locale}/{section}` projection (and documents that swapping `ROUTE_BASE` to e.g.
    `fr/philosophie` would relocate cleanly).

---

## 11. Implementation slices (locale-rooted)

Ordered for safety; each is independently reviewable, commit-only on `develop`.

- **IA-1 — Scheme + projection (no user-visible move yet).** Write the locale-root scheme decision
  (codes, section-name map, route contract §2.5) into the docs; add the website `ROUTE_BASE` map +
  the `OUT_DIR`-from-`routePath` derivation + the `routePath`/`routePrefix` re-projection in
  `build-pipeline-export.py` / `build-pipeline-segment-routes.py`, **still emitting the current
  `louis-lavelle/introducao-a-ontologia` base** (set `ROUTE_BASE` to reproduce today's paths). Add the
  §10.10 architecture-guard test. Outcome: zero route change, but the machinery proven and the swap
  reduced to one constant.
- **IA-2 — Flip the base to `pt/filosofia` + regenerate.** Set `ROUTE_BASE` →
  `pt/filosofia/louis-lavelle`; regenerate `pipeline-export-segments.json` (pt) + the hub/99 leaves
  under `src/pt/filosofia/louis-lavelle/introducao-a-ontologia/`; delete the old
  `src/louis-lavelle/introducao-a-ontologia/` tree. Update the integration/route test constants.
- **IA-3 — Hubs + nav + discovery.** Create `src/pt/filosofia/index.md` +
  `src/pt/filosofia/louis-lavelle/index.md` + `philosophyAuthorCards`; add config nav/sidebar; fix
  `isChapterRoute`/sitemap/`llms` (prefer the stability-aware generalization); update reader-shell
  comments + the hub/section tests (§10.1–10.7, 10.9).
- **IA-4 — Disable the obsolete redirects.** `STATUS = "disabled"` + remove the redirect-map JSON and
  `pipeline-redirect-map.spec.ts`; assert `_redirects` no longer carries the fr→pt block (§10.8).
  **Status: implemented** (slice A4, on `develop`) — went further than "disable": **deleted** the
  generator (`build-pipeline-redirect-map.py`), the redirect-map JSON, `src/public/_redirects`, the
  dedicated spec, and the `pnpm build` / `pipeline:redirect-map` wiring. Old fr chapter URLs 404 (clean
  break); the legacy fr pages still build until IA-5. New proof: `tests/redirects-clean-break.spec.ts`.
- **IA-5 — Remove legacy Lavelle (after pilot green).** Delete the legacy books, `build-lavelle-*.py`,
  the legacy `/louis-lavelle/` author hub + `works.json`, and the old fr edition pages; drop their
  nav/sidebar/test references. `/louis-lavelle/` ceases to exist (404).
- **Follow-on programme (not this pilot):** locale-root `/literatura/` → `/pt/literatura/` and
  `/podcast/` → `/pt/podcast/`; build the `/` → locale negotiation + the `fr/en/es/ru` roots, locale
  switcher, hreflang, localized nav/search/footer, VitePress `locales`, and `PipelineEditionSwitch`.

*(If the team prefers the conservative path §0 B′, run only IA-1 now — the scheme + proven projection —
and hold IA-2…IA-5 until the multilingual programme starts. That captures the architecture with zero
route churn.)*

---

## 12. Exact first implementation prompt (IA-1)

> Implement slice **IA-1** of the locale-rooted philosophy IA in `skepvox-website` on `develop`, no
> branch, commit-only (do not push). **No user-visible route changes in this slice** and **no
> book-pipeline change.**
>
> Goal: introduce the website-owned `{locale}/{section}` route-base projection for the pipeline-export
> pilot book (Introdução à ontologia, pt) and prove it, while still emitting today's
> `louis-lavelle/introducao-a-ontologia` paths — so the only thing standing between now and
> `/pt/filosofia/…` becomes a single constant.
>
> Do:
> 1. Add a shared, identity-keyed route-base map used by the pipeline generators, e.g.
>    `ROUTE_BASE = { "louis-lavelle/introduction-a-l-ontologie": "louis-lavelle/introducao-a-ontologia" }`
>    keyed by `workId` per edition (or a small helper returning the base for a `(workId, language)`).
>    **Set it to reproduce the current paths exactly.**
> 2. In `scripts/build-pipeline-export.py`, project each pt segment's `routePath` and the pt
>    `work.editions[].routePrefix` from `ROUTE_BASE` + the book-relative leaf, instead of passing the
>    vendored value through verbatim. Output must be **byte-identical** to today's
>    `pipeline-export-segments.json` for the pt edition (and unchanged for fr).
> 3. In `scripts/build-pipeline-segment-routes.py`, replace the hard-coded `OUT_DIR` with a directory
>    **derived from the (projected) `routePath` prefix** (`src/<routePath-without-leaf>/`). The 99 pt
>    pages must regenerate to the **same** `src/louis-lavelle/introducao-a-ontologia/` location,
>    byte-identical.
> 4. Add an architecture-guard test asserting: (a) for the current `ROUTE_BASE`, a sample segment's
>    derived directory is `src/louis-lavelle/introducao-a-ontologia` and `workHubHref(routePath)` is
>    `/louis-lavelle/introducao-a-ontologia/`; and (b) a hypothetical `ROUTE_BASE` of
>    `pt/filosofia/louis-lavelle/introducao-a-ontologia` would yield `src/pt/filosofia/louis-lavelle/…`
>    and `/pt/filosofia/louis-lavelle/…/` — locking the `{locale}/{section}` projection without moving
>    anything.
> 5. Update generator/reader-shell comments to state the source-of-truth boundary (book-pipeline owns
>    book-relative identity/path; the website owns the `{locale}/{section}` prefix). Reference this doc.
>
> Do **not**: change any emitted route or filename; create/modify hubs, nav, sidebar, redirects, or the
> fr edition; touch `build-pipeline-redirect-map`, legacy Lavelle, or book-pipeline. Run `pnpm verify`;
> confirm the regenerated `pipeline-export-segments.json` and `src/louis-lavelle/introducao-a-ontologia/`
> tree are unchanged (a no-op diff except the generator internals + the new test). Commit on `develop`.

---

## Appendix A — Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Temporary split-brain IA (`/pt/filosofia/<book>` beside locale-less siblings) | High (by design) | Acknowledged; clean-break posture; siblings locale-rooted in follow-on slices. |
| SEO equity lost on old `/louis-lavelle/…` reading URLs | High | Accepted per clean break; hubs remain the discovery surface; optional single future redirect if ever wanted. |
| Locale-scheme churn (`pt` vs `pt-BR`, section/Cyrillic slugs) re-migrates `/pt/…` later | Low–Med | Lock the scheme in IA-1's doc (recommend coarse `pt`, ASCII section slugs); conventional + stable. |
| Redirects left pointing at dead targets | Med if forgotten | IA-4 disables them explicitly; §10.8 test guards it. |
| `PipelineWorkContents` hard-coded `workId` blocks a 2nd book | Low (pilot = 1 book) | Optional self-healing `workId` (§7), deferred. |
| Adopting VitePress `locales` later conflicts with the path-prefix pilot | Low | `src/{locale}/…` layout is exactly what VitePress i18n expects (§6.4); additive. |

## Appendix B — Docs to reconcile later (not in the pilot)

`introduction-a-ontologia-live-migration-plan.md` (route-migration plan of record — predates the
locale-root reframe; supersede its `/louis-lavelle/` route table), `reading-app-website.md` (canonical
pipeline-export entry point — update live paths), `multilingual-book-url-architecture-assessment.md`
(extend the locked Family E book-edition decision with the **site-UI-locale** axis from §2),
`seo-strategy.md` (locale-rooted canonical/hreflang posture), `reader-shell-component-boundaries.md` +
`reading-app-segment-workhub-assessment.md` (edition-switcher + multi-edition UI when a 2nd edition
lands). This doc is the source for the locale-rooted IA decision until those are updated.
