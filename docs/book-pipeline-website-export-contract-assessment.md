# Book-Pipeline → Kairos → Website/App Export Contract — Assessment

**Status:** Assessment / spec only. **No implementation.** No change to code, manifests, builders,
website content, `skepvox-book-pipeline`, or `kairos`. This defines the mature export contract that will
later feed WorkContents, ReadingNav, the leaf zoom-out, search, the AI companion, and native apps. It is
grounded in a read-only inspection of all three repos (the active flows: *Introdução à ontologia*, *O Eu
e o inconsciente* / Jung, *Irmãos Karamázov*, plus *Confissões* and *de l'acte*).

**Companion docs:** `docs/reading-app-segment-workhub-assessment.md` (segment model + work-hub),
`docs/work-contents-component-spec.md` (WorkContents). This document supersedes their *export* sketches
with a concrete contract. It does not modify the intentionally-uncommitted roadmap note.

---

## 0. Executive summary

The website has reached a clean stopping point: WorkContents proves grouped mode (de-l-acte) and flat
mode (Brás Cubas), and the current `segment-manifest.json` is an honest **bridge built from committed
website data only**. We should **not** broaden WorkContents until the real source-of-truth contract is
defined, because the website is currently *inferring* authored structure that the pipeline should
*declare*.

Six findings frame the contract:

1. **No pipeline→website export exists.** The pipeline's only outbound projection is
   `sync-map.yaml → Kairos` (file copy via `sync_segment_range.py`). There is no JSON manifest, bundle,
   or website export. The website is fed entirely from hand-authored `src/**` + the bridge manifest.
2. **The website is already manifest-shaped.** `ReadingNav` consumes `reading-nav.json`; `WorkContents`
   consumes `segment-manifest.json` and renders hierarchy "from each segment's groupPath, never from
   route slugs." The migration is to **replace the bridge's source** with a pipeline-produced bundle —
   not to re-architect consumption.
3. **The fixed `BB-PP-CCC-SSS` prefix cannot represent authored structure.** Across the four reference
   books the four prefix slots mean *different* levels (BB = single-book / Liber / Part depending on the
   work; PP = Part / Livro / unused; CCC = Chapter or always-001 with the chapter level collapsed). And
   the pipeline carries **exactly one** authored-level title — `chapter-title`. Part/Volume/Livro/Section
   /Article titles live only in body headings or are lost. **de-l-acte is six levels deep**
   (Work→Livre→Partie→Chapitre→Section A/B→ART. N→paragraph) and its Partie is erased (`part-index: 0`).
   → The contract must carry an **ordered, variable-depth `groupPath[]` with real per-level titles**, and
   treat `canonicalId`/prefix as an **opaque** identity/order key the website must never parse.
4. **Editions are modeled as folders, not works — and the website has already mis-split one.** The
   pipeline keys both editions of *La conscience de soi* under `book-slug la-conscience-de-soi`, but the
   website has them as **two unrelated works**: `louis-lavelle/la-conscience-de-soi` (fr, 13 chapter
   leaves) and `louis-lavelle/a-consciencia-de-si` (pt, 118 segment leaves, a *localized* slug). The
   contract must define a cross-edition join key and a per-edition public-route-slug map.
5. **Review/maturity is fully specified but empty.** `review-stage` is empty across **all 6,908**
   segment files; `final` is set nowhere; `read-at` is empty in the repo and populated only in Kairos.
   A naive "publish only `reading-reviewed|final`" gate would publish nothing. Maturity must be a
   **derived, additive** signal with a backfill/interim policy — and **personal** signals (`read-at`,
   `==highlights==`, `%% review %%`, `needs-review`/`tags`/`note`, Kairos 432/433/434) must be **stripped**.
6. **Frontmatter is inconsistent and route-derived on the website; clean but under-titled in the
   pipeline.** Website leaves carry three different structural schemes plus a large, fully-derivable
   `head:` SEO block baked per leaf. The pipeline `segmented` frontmatter is the near-canonical model and
   needs only per-level titles + an explicit edition/maturity surface.

**Boundaries:** **book-pipeline** owns segmentation, canonical IDs, `groupPath`, pairing, reference
editions, maturity, and the export. **Kairos** owns personal reading/review (notes, highlights,
`read-at`) and never feeds the public site. **website** owns public rendering, navigation, search,
URL/SEO policy, and reading UI — it consumes the export and produces no segmentation.

**Recommended first controlled import:** *Introdução à ontologia* (segmented fr+pt, real Part→Chapter→
paragraph). **Do not implement yet** — §10 lists the boundary.

### Answers to the 14 questions (index)

| # | Question | Section |
|---|---|---|
| 1 | raw→extracted→processed→segmented workflow | §1 |
| 2 | where granularity is decided | §1.2 |
| 3 | metadata in segmented files today | §3.1 |
| 4 | metadata missing for the website/app | §3.2, §4 |
| 5 | how `canonicalId` is defined | §5 |
| 6 | `groupPath` for variable structures | §6 |
| 7 | original ↔ canonical-pt pairing | §7 |
| 8 | reference editions without becoming canonical | §7 |
| 9 | review / maturity states | §8 |
| 10 | what's Kairos vs exported from pipeline | §2, §8 |
| 11 | what the website consumes (MD/JSON/bundles) | §4 |
| 12 | migration from the bridge manifest | §9 |
| 13 | first controlled import | §10 |
| 14 | top UI stress tests | §11 |

---

## 1. Current workflow map

### 1.1 raw → extracted → processed → segmented (Q1)

1. **`raw/`** — source EPUB/PDF per edition (e.g. Karamázov has `…-ru-azbuka-atticus-2019.epub` +
   `…-34-2012.epub` + `…-penguin-companhia-2025.epub`).
2. **`extracted/`** — preservation-first Markdown via `extract_epub_preserve` (`skepvox-extracted-schema`),
   never edited as canonical.
3. **`processed/{author}/{book}/{lang}/BB-PP-CCC-{slug}.md`** — *optional* chapter-level cleanup layer
   (`file-kind: chapter`), used only when normalization is needed before segmentation.
4. **`segmented/{author}/{book}/{lang}/BB-PP-CCC-SSS-{slug}.md`** — the **active** layer
   (`file-kind: segment`): translation, review, audio, reading. `SSS` is a **book-global** counter that
   does not reset per chapter; `00-00-000` = front matter, `99-99-999` = conclusion. Per-book scripts
   `src/segment_{book}.py`.
5. **Projection:** `sync-map.yaml → Kairos` is the *only* existing outbound projection. **No website
   export exists.**

### 1.2 Where granularity is decided (Q2)

Granularity is decided **at the segmentation step** and recorded in **`segment-kind`** (per file), not in
the prefix. Live values across `segmented/` (verified): `paragraph-marker` 2370, `paragraph-range` 2149,
`chapter` 1231, `h3` 785, `h4` 175, `h2` 160, `semantic-section` 36. The same work is uniform in kind
(Brás Cubas/Karamázov = `chapter`; Confissões = `paragraph-marker`; Lavelle items = `h3`). **The contract
must carry `segment-kind` authoritatively** — prefix shape cannot distinguish a chapter-as-segment leaf
from a true sub-chapter segment.

### 1.3 The current website (bridge)

`reading-nav.json` (prev/next) and `segment-manifest.json` (`skepvox-segment-manifest-v0`, work + segment
records) are **generated from committed website data only** (`build-reading-nav.py`,
`build-segment-manifest.py`) and explicitly do **not** read the pipeline. The manifest marks everything
`semanticMaturity: unknown`, `inferred: true`, `urlStability: preserve` precisely because no real export
feeds it. It is the honest placeholder this contract replaces.

---

## 2. Source-of-truth boundaries (Q10)

| Concern | Owner | Notes |
|---|---|---|
| Segmentation, `canonicalId`, prefixes, `segment-kind` | **book-pipeline** | Decided at segmentation; never re-derived downstream. |
| Authored structure (`groupPath`, per-level titles), pairing, reference editions | **book-pipeline** | Must be *declared* in the export, not inferred by the website. |
| Translation + editorial review → `review-stage` | **book-pipeline** | The "final version" decision; recorded in `docs/translation-style/*`. |
| The **export bundle** | **book-pipeline** | New artifact (§4); the contract's deliverable. |
| Personal reading: `read-at`, `==highlights==`, `%% review %%`, notes/quotes (432/433/434) | **Kairos** | **Never exported to the public site.** |
| Public rendering, navigation, search, **URL/SEO policy**, reading UI, apps | **website** | Consumes the export; owns route slugs; produces no segmentation. |

**Hard rule:** the export is generated from the **repo `pt/` side** (where `read-at` is empty), never
from the Kairos corpus (where `read-at` is populated), so personal reading-state cannot leak.

---

## 3. Frontmatter today + audit (Q3, Q4)

### 3.1 What exists today (per layer)

**Pipeline `segmented/` (26 keys, `SegmentFrontmatter.render()`):** `title, book, author, language,
chapter-title, segment-title, skepvox-schema, file-kind, author-slug, book-slug, chapter-prefix,
chapter-slug, segment-prefix, segment-slug, book-index, part-index, chapter-index, segment-index,
segment-kind, canonical-id, review-stage, needs-review, review-tags, review-note, updated-at, read-at`.
`canonical-id` is **computed** = `{author-slug}/{book-slug}/{segment-prefix}`. Clean and uniform — but
the **only authored-level title is `chapter-title`** (and it even bakes in the level word, e.g.
`Livro — I`). `processed/` is the same minus the segment-* and review fields.

**Website leaves — three inconsistent, route-derived schemes (verified):**

| Work | Structural fields | Title fields |
|---|---|---|
| `vidas-secas` | `chapter-id` | `chapter-title` |
| `bras-cubas` | `chapter-id`, `part-number` | `chapter-title` (= the 167-char sentence for ch.053) |
| `de-l-acte`, `a-consciencia-de-si` | `book-number`, `part-number`, `chapter-number` [, `segment-number`] | `book-title`, `part-title`, `chapter-title` [, `segment-title`] |

Plus on *every* leaf: layout flags (`sidebar:false, aside:false, footer:false, outline`) and a large
`head:` block — canonical link + OG/Twitter + **two JSON-LD scripts** (Chapter/Book + BreadcrumbList) —
all **fully derivable** and re-baked per leaf.

### 3.2 Audit — what's wrong (Q4)

- **Route-derived duplication.** Every website structural field (`chapter-id`, `book/part/chapter/
  segment-number`) mirrors the `BB-PP-CCC[-SSS]` already in the filename. Redundant and **inconsistent
  across works** (three schemes for the same concept).
- **The Part level is crammed into a string.** de-l-acte's `book-title` is
  `"Livre I. L'acte pur — Première partie : La méthode"` (Livre + Partie fused) with `part-title: ""`.
  This is *why* parts were lost. Authored level titles must be first-class and one-per-level.
- **`head:` is generated data stored by hand.** Canonical = route; OG/Twitter = title+description+image;
  JSON-LD = structure. None of it belongs in source frontmatter; it should be **generated at build from
  the manifest**, eliminating ~100 lines of derivable YAML per leaf.
- **Redundancy in pipeline frontmatter.** `title` duplicates `segment-title`; `book`/`author` repeat on
  every segment (work-level data); `chapter-title` doubles as a level-name carrier (`Liber — I`).
- **Title-quality debt in the source.** Brás Cubas ch.053's `chapter-title`/slug/route **is** the
  opening sentence; `segment-title` is often generic (`Paragraphe N`). The website already carries a
  truncation hack (`MAX_TITLE_BODY = 64`). The pipeline must own authored titles and emit explicit
  `null` when none exists — not a low-quality string the website launders.

### 3.3 Harmonization proposal

**(a) Minimal canonical frontmatter for segmented SOURCE files** (YAML, kebab-case — keep the pipeline's
convention). Keep editorial/source-of-truth fields; drop redundancy; **add per-level titles**:

```yaml
# IDENTITY (computed/stable)
canonical-id: louis-lavelle/introduction-a-l-ontologie/00-01-001-008
author-slug: louis-lavelle
book-slug: introduction-a-l-ontologie     # SOURCE-language slug, shared across editions
segment-prefix: 00-01-001-008             # opaque ordered key (book-global SSS)
# ORDERING (opaque integers; NOT a level map)
book-index: 0
part-index: 1
chapter-index: 1
segment-index: 8
# GRANULARITY
segment-kind: paragraph-marker
bucket: body                              # NEW explicit: front-matter | conclusion | body
# AUTHORED STRUCTURE (NEW: one entry per level, with real titles)
levels:
  - { kind: part,    ordinal: 1, label: "Première partie", title: "La méthode" }
  - { kind: chapter, ordinal: 1, label: "Distinction",     title: "Distinction" }
# DISPLAY (authored; null when no real title exists — never a fallback sentence)
segment-title: "Paragraphe 8"
# EDITION
language: fr
edition-role: source                      # source | canonical | reference
# EDITORIAL REVIEW (exportable maturity only)
review-stage: ""                          # empty|translated|first-reviewed|read|reading-reviewed|final
updated-at: 2026-05-24T18:12
# PERSONAL (Kairos-owned; NOT part of source-of-truth, NOT exported)
# read-at, needs-review, review-tags, review-note  -> live in Kairos, stripped from export
```

Drop from source: `title` (use `segment-title`), and lift `book`/`author` to the **work record** (not
per-segment). `chapter-prefix`/`chapter-slug`/`segment-slug` may stay for filename derivation but are not
identity.

**(b) Derived website/app MANIFEST fields** (JSON, **camelCase** — matches `segment-manifest.json`),
generated by the pipeline export, never hand-authored: see §4. The split is deliberate — **kebab-case in
YAML source, camelCase in JSON export.**

**(c) Naming conventions** (Q recommendation):

| Concept | Source (YAML) | Export (JSON) |
|---|---|---|
| Identity | `canonical-id` | `canonicalId` |
| Authored hierarchy | `levels` | `groupPath` |
| Edition role | `edition-role` | `editionRole` |
| Original language | (work) `source-language` | `sourceLanguage` |
| Translation language | (work) `target-language` | `targetLanguage` |
| Maturity | `review-stage` (+ derived) | `reviewStatus` / `maturity` / `publishable` |
| Reference edition | `pt-*` folder | `referenceEditions[]` |
| Reader-facing title | `segment-title` | `displayTitle` |
| Public URL slug | (website) | `routeSlug` |

**(d) Migration of the named website fields:** `book`,`author` → work record; `language` →
`sourceLanguage`/`targetLanguage` + per-segment `language` + `editionRole`; `chapter-id` *and*
`book/part/chapter/segment-number` → collapse to `canonicalId` + `segmentPrefix` + integer indices (one
scheme); `chapter-title`/`segment-title` → `groupPath[].title` + `displayTitle` (with title-debt
cleanup); `part-number` → `part-index` + a real `groupPath` part level with `title`; `segment-number` →
`segment-index`; the `head:` block → generated from the manifest at build.

**(e) Granularity coverage (required):** the model supports all three shapes via `segment-kind` +
`levels[]` depth — **chapter = segment** (Brás Cubas/Karamázov: `segment-kind: chapter`, the chapter is
the leaf), **one chapter → many segments** (Lavelle items: chapter level in `groupPath`, items as leaves),
and **one numbered paragraph = one segment** (Confissões: `paragraph-marker`, Liber in `groupPath`).

---

## 4. Proposed export contract / schema (Q11)

**What the website consumes:** **generated JSON bundles** from the pipeline — not raw Markdown, not a
hand-built manifest. The website already drinks JSON (`reading-nav.json`, `segment-manifest.json`); the
contract simply re-sources it. Prose is delivered **separately**, joined by `canonicalId`, so the
lightweight index can power nav/search/TOC without shipping full corpus prose.

**Artifacts:**

- **`work-index.json`** (global): one entry per published work — `workId`, display, editions, maturity
  rollup, route. Powers corpus/author hubs + global search scoping.
- **`works/{authorSlug}/{bookSlug}.json`** (per-work **index bundle**, no prose): work record + ordered
  segment records. Powers WorkContents, ReadingNav, leaf zoom-out.
- **Prose channel** (per segment, joined by `canonicalId`): rendered body, with personal markers stripped
  and `==highlights==` removed. Either the website keeps generating leaf pages from the bundle, or the
  pipeline emits prose files. Decide in the first slice.

**Work record:**
```jsonc
{
  "workId": "louis-lavelle/introduction-a-l-ontologie",   // {authorSlug}/{bookSlug}
  "authorSlug": "louis-lavelle", "bookSlug": "introduction-a-l-ontologie",
  "author": "Louis Lavelle", "title": "Introdução à ontologia",
  "sourceLanguage": "fr", "targetLanguage": "pt",
  "editions": [
    { "language": "fr", "editionRole": "source",    "routeSlug": "introduction-a-l-ontologie", "default": false },
    { "language": "pt", "editionRole": "canonical", "routeSlug": "introducao-a-ontologia",      "default": true }
  ],
  "referenceEditions": [],                 // pt-* witnesses; [] here, e.g. ["pt-petra"] for Confissões
  "segmentCount": 99,
  "maturity": "draft", "publishable": false,            // rolled up (worst-of) + reviewedPercent
  "collapsedLevels": [],                   // e.g. ["caput"] for Confissões
  "$schema": "skepvox-export-v1", "generatedBy": "book-pipeline", "source": "pipeline-segmented"
}
```

**Segment record (no prose):**
```jsonc
{
  "canonicalId": "louis-lavelle/introduction-a-l-ontologie/00-01-001-008",
  "workId": "louis-lavelle/introduction-a-l-ontologie",
  "language": "fr", "editionRole": "source",
  "order": 8, "segmentPrefix": "00-01-001-008",
  "bookIndex": 0, "partIndex": 1, "chapterIndex": 1, "segmentIndex": 8,
  "bucket": "body",                        // front-matter | conclusion | body — explicit, not prefix-parsed
  "segmentKind": "paragraph-marker",
  "groupPath": [
    { "kind": "part",    "ordinal": 1, "label": "Première partie", "title": "La méthode", "key": "…/00-01" },
    { "kind": "chapter", "ordinal": 1, "label": "Distinction",     "title": "Distinction", "key": "…/00-01-001" }
  ],
  "displayTitle": "Paragraphe 8",          // authored; null when none exists (website falls back to ordinal)
  "maturity": "draft", "publishable": false, "updatedAt": "2026-05-24T18:12"
  // NO read-at, needs-review, review-tags, review-note, highlights — stripped
}
```

`routeSlug` (public URL) is **website-owned** and not in the segment record — the export supplies
`canonicalId` only (§5). The pairing of editions is by (`bookSlug`, `segmentPrefix`) across `language`.

---

## 5. `canonicalId` & route/URL policy (Q5)

- **`canonicalId` = `{authorSlug}/{bookSlug}/{segmentPrefix}`**, computed by the pipeline, **opaque**:
  the website must **never parse it** for level meaning (the prefix slots are ambiguous across works).
  It is the durable join key between index records, prose, editions, and (later) reading state.
- **`bookSlug` is the source-language slug**, shared across all editions (the cross-edition key). The
  pt edition does **not** get its own `bookSlug`.
- **Public URLs are website-owned and stable.** Current routes remain; identity comes from `canonicalId`,
  never the slug. The website maintains a **per-edition `routeSlug` map** — e.g. the pt edition of
  `la-conscience-de-soi` keeps its localized public route `a-consciencia-de-si` while joining the
  canonical `louis-lavelle/la-conscience-de-soi/…` ids.
- **Re-segmentation is the sharp risk.** `segmentPrefix` is book-global; adding a collapsed level
  (Confissões caput) or first-segmenting de-l-acte shifts downstream `canonicalId`s and would break
  bookmarks/URLs. The contract requires either an **id-stability guarantee** (prefixes are append-only /
  never renumbered) or a **versioned id-remap + redirect channel**. `routeSlug` stays put regardless.

---

## 6. `groupPath` schema with examples (Q6)

**Replace the fixed 4-field prefix-as-structure with an ordered, variable-depth `groupPath[]`** declared
by the pipeline. Each level: `{ kind, ordinal, label, title, key }`.

- `kind` — controlled vocabulary covering all observed authored levels:
  `volume` (Livre/Tome) · `part` (Partie/Parte) · `book` (Livro/Liber) · `chapter` · `section` (lettered
  A/B or semantic) · `article` (ART. N / proposition) · `item` (numbered/Roman aphorism) · `preface` ·
  `conclusion`.
- `ordinal` — sort integer (decoupled from the printed label).
- `label` — the author's **verbatim enumerator** (`"Chapitre I"`, `"a)"`, `"ART. 1"`, `"Livro VI"`).
- `title` — the **authored title of that level** (`"La méthode"`, `"Um monge russo"`); may be `null`.
- `key` — stable group key (`{workId}/{prefix-to-this-level}`) for collapse state / `aria-controls`.

Absent levels are **omitted** (not null-filled). `book-index/part-index/chapter-index/segment-index`
remain the **sort** decomposition; `groupPath` is the **orientation** structure the UI draws.

**Examples (verified structures):**

| Work | `groupPath` shape | Notes |
|---|---|---|
| **Brás Cubas** | `[]` (flat) | chapter = segment; `segmentKind: chapter`; presentation ranges only. |
| **Confissões** | `[{book "Livro I"}]` | Liber level; caput **collapsed** (`collapsedLevels:["caput"]`); 453 `paragraph-marker` leaves. |
| **Introdução à ontologia** | `[{part "La méthode"},{chapter "Distinction"}]` | Part title currently lost in pipeline — must be added. |
| **La conscience de soi** | `[{chapter "Chapitre I…"},{item "1"}]` | numbered/Roman item level; enumerator today buried in `segment-title`. |
| **Karamázov** | `[{part "Segunda Parte"},{book "Livro VI: Um monge russo"},{chapter "II…"},{section "a)"}]` | Part/Livro titles today only in body H2/H3. |
| **de l'acte** | `[{volume "L'acte pur"},{part "La méthode"},{chapter "L'expérience…"},{section "A …"},{article "ART. 1"}]` | **6 levels**; Partie erased (`PP=0`); Section/ART body-only; **not yet segmented**. |

**Rule the contract imposes:** authored titles are pipeline-owned. The website must **stop scraping**
`##`/`###`/`####` headings and **stop inferring** levels from prefixes. Record per-work
`collapsedLevels` so a synthesized label (`"Liber — I"`) is never mistaken for an authored chapter title
and a future re-segmentation is anticipated.

---

## 7. Original / reference / canonical edition model (Q7, Q8)

- **One work, many editions, keyed by structure.** All editions of a work share `bookSlug` and the
  `segmentPrefix` grid; they differ by `language`. The cross-edition join is
  (`bookSlug`, `segmentPrefix`) × `language` → `editionRole`.
- **`editionRole`:**
  - `source` — the original-language edition (fr/de/ru/la); **authority** for meaning.
  - `canonical` — the editable pt translation; the default public reading edition.
  - `reference` — read-only `pt-*` witnesses (`pt-petra`, `pt-34`, `pt-penguin-companhia`); **never
    canonical, never the default reader.** Verified **absent from every `sync-map`** (excluded from
    Kairos); the export likewise lists them under `referenceEditions[]` **for a compare UI only**, never
    in the default reading projection.
- **Pairing is first-class.** Original↔canonical-pt is the same `canonicalId` (minus `language`), so the
  app's parallel/compare view is a direct read of two editions of one id. Jung (`de` + `pt` + `pt-vozes`)
  and Karamázov (`ru` + `pt` + `pt-34` + `pt-penguin`) are the multi-edition cases.
- **The "final version" decision** is: original = authority; the reader flags issues; a bilingual review
  pass re-reads statement-by-statement against the original + reference witnesses and applies a surgical
  fix to `pt/` only; the choice is recorded in `docs/translation-style/{author}/{book}-reference-editions.md`
  (a *Decision* column). There is **no live "ChatGPT-discussion" artifact** to export — the review pass
  *is* the decision. The export carries the *outcome* (`review-stage`), never the deliberation.

---

## 8. Review-state / maturity model (Q9)

- **Editorial ladder (exportable):** `review-stage` ∈ `empty → translated → first-reviewed → read →
  reading-reviewed → final`. Only `reading-reviewed` is ever set by the workflow today; `final` is
  defined but never set.
- **Personal (NEVER exported):** `read-at`, `==highlights==`, `%% review %%`/`[!review]`,
  `needs-review`/`review-tags`/`review-note`, and Kairos `432-QUOTES`/`433-READING-NOTES`/`434-SOURCES`.
  The `updated-at > read-at` "due for re-read" signal is **personal** (needs Kairos `read-at`) and must
  not be exported; `updated-at` alone is safe as a neutral "last revised."
- **Derived public signal:** the pipeline computes, per segment, `maturity` ∈ `draft | reading-reviewed
  | final` and `publishable = (review-stage ∈ {reading-reviewed, final}) AND (canonical pt exists)`;
  rolled up per work (worst-of + `reviewedPercent`). The website **consumes** this and never recomputes
  maturity from slugs/prefixes/text presence.
- **Empty-corpus reality (load-bearing):** `review-stage` is empty across **all 6,908** files; `final`
  nowhere. A strict gate publishes nothing. The contract therefore specifies an **interim policy**:
  publish on **translation existence** (`editionRole: canonical` present) and surface `maturity` as
  **additive metadata**, not a hard gate — until a backfill/promotion pass populates `review-stage`.
  Generate from the **repo `pt/` side** so `read-at` cannot leak.

---

## 9. Migration path for existing website works (Q12)

The website↔pipeline relationship is currently **divergent**, not merely incomplete:

- **Edition mis-split (live):** `la-conscience-de-soi` (fr, 13 chapter leaves) and `a-consciencia-de-si`
  (pt, 118 segment leaves) are **two website works** that are one pipeline book. Reconciliation must
  merge them into one work with two editions, mapping the localized route `a-consciencia-de-si` to the
  canonical `bookSlug`.
- **Coverage mismatch:** the pipeline has ~23 segmented books (Confissões, Karamázov, Crime e Castigo,
  Don Quijote, Le Petit Prince, Jung, …) **none on the website**; the website has Lavelle works
  (de-l-acte, de-l-etre, la-presence-totale, …) **not segmented in the pipeline** (only 5 Lavelle books
  are). The contract must declare **pipeline as the source of truth for covered works**, while letting
  the website keep hand-authored works the pipeline doesn't yet cover (clearly flagged `source:
  website-committed`) until they are segmented.

**Phased migration:**

1. **Phase 0 (now):** keep the bridge `segment-manifest.json`. No change.
2. **Phase 1 (pipeline-side, prerequisite):** add per-level `levels[]` + authored titles + `bucket` +
   derived `maturity` to the pipeline for **one** work; build the `book-pipeline` export bundle
   (`work-index.json` + per-work bundle). No website change.
3. **Phase 2 (website-side, one work):** the website consumes the pipeline bundle for that **one** work
   behind WorkContents, replacing the bridge *for that work only* (a `source: pipeline-export` record
   alongside `website-committed` ones). Preserve public URLs via the `routeSlug` map; reconcile editions
   if applicable.
4. **Phase 3 (broaden + reconcile):** migrate further works; merge mis-split editions; define the
   coverage/sourcing reconciliation; add the id-remap/redirect channel before any `canonicalId` reshape.

Throughout: `canonicalId` is the join key; **public `routeSlug`s never change** without a 301 + redirect
+ manifest regen (the §2.6 discipline from the prior assessment).

---

## 10. First controlled implementation slice (Q13) + do-not-implement boundary

**First controlled import: *Introdução à ontologia* (`louis-lavelle/introduction-a-l-ontologie`).**
Why: it is fully segmented in the pipeline (fr 99 ↔ pt 99, 1:1), it exercises the **real Part→Chapter→
paragraph** structure (validating `groupPath` + per-level titles + `bucket` front-matter/conclusion +
paragraph-level granularity + original↔pt pairing), and the work already exists on the website as fr
chapter leaves (the route exists), so the import *adds* the real structure and the pt edition rather than
reconciling a live divergence. *La conscience de soi* is the natural **second** (it forces the
edition-merge / route-slug-map work); Confissões (fine) and Karamázov (deep + multi-edition) follow as
stress validation.

**Prerequisite (pipeline-side):** per-level titles do not exist yet (only `chapter-title`); the Part
title for this work is unrepresented. The first slice's pipeline step must add `levels[]` + the Part
title + `maturity` for this one work and emit the bundle.

**The smallest safe slice (when authorized):**
1. *(pipeline)* emit `works/louis-lavelle/introduction-a-l-ontologie.json` per §4, with real `groupPath`
   titles, `bucket`, editions (fr source + pt canonical), and derived `maturity`/`publishable`.
2. *(website)* a generator consumes that bundle into a `source: pipeline-export` record; WorkContents +
   ReadingNav read it for this one work; the `head:`/SEO stays as-is for now; public URLs preserved.
3. *(tests)* the bundle validates against the schema; `groupPath` has real titles (`inferred: false`);
   editions join by `canonicalId`; no personal fields present; the website renders Part→Chapter→paragraph
   without prefix parsing.

**Do NOT implement yet (boundary):** no export builder, no pipeline frontmatter migration, no `levels[]`
backfill, no website ingestion generator, no edition merge, no `head:`-block removal, no WorkContents
broadening, no route changes, no edits to `skepvox-book-pipeline` or `kairos`. This document is for
review; implementation begins only on explicit go-ahead, starting at Phase 1 for the one work above.

---

## 11. Top UI stress tests the contract must support (Q14)

| Stress | Work | What it proves |
|---|---|---|
| **Scale + title debt** | Brás Cubas (163 flat chapters; ch.053 sentence-as-title) | flat mode at scale; `displayTitle: null` → ordinal fallback; route preserved. |
| **Fine paragraph segments** | Confissões (453 `paragraph-marker`; caput collapsed) | very-fine leaves; `collapsedLevels`; Liber-only `groupPath`; thin-content/SEO. |
| **Deep structure + heavy segments** | Karamázov (Part→Livro→Chapter→section; up to ~9k-word segments) | multi-level `groupPath`; `semantic-section`; large single segments; 4 editions. |
| **Article / proposition structure** | de l'acte + Introdução à ontologia (Livre→Partie→Chapitre→Section→ART) | 6-level `groupPath`; `kind: article`; the Partie-loss the prefix caused. |
| **Original/reference/canonical compare** | Jung (`de` + `pt` + `pt-vozes`) | `editionRole`; cross-edition pairing by `canonicalId`; reference witnesses out of the default reader. |

---

## 12. Risks & open questions

- **Re-segmentation instability** — `segmentPrefix` is book-global; re-segmenting shifts `canonicalId`s
  and breaks URLs/bookmarks. *Open:* append-only id guarantee vs versioned remap + redirects.
- **Live edition mis-split** — `la-conscience-de-soi` / `a-consciencia-de-si` must merge to one work,
  two editions, without breaking either public URL. *Open:* the route-slug map + edition-merge mechanics.
- **Coverage/sourcing** — pipeline-only books vs website-only Lavelle works. *Open:* does the export
  drive which works exist, and how do hand-authored works coexist during migration?
- **Empty maturity corpus** — 0 populated `review-stage` across 6,908 files. *Open:* backfill/promotion
  plan vs interim "publish on translation existence" policy; never mislabel the corpus as defective.
- **Authored-title backfill** — per-level titles (Part/Volume/Livro/Section/Article) and clean chapter
  titles (Brás Cubas 053) don't exist in the pipeline yet. *Open:* a named pipeline deliverable; emit
  explicit `null`, never a scraped/low-quality string.
- **Body-only structure** — de-l-acte's Section (A/B) and `**ART. N**` propositions and Karamázov's
  Part/Livro titles live only in body markup. *Open:* capture them as `levels[]` (and ART as structured
  inline anchors for deep-linking) at segmentation, so the website never scrapes headings.
- **Export artifact boundary** — one global manifest vs per-work bundles; index vs prose channel. *Open:*
  confirm the two-artifact split (index JSON + prose joined by `canonicalId`) and the body-delivery
  mechanism.
- **Deep-nesting render** — WorkContents currently groups only the **top** `groupPath` level; ≥3-level
  works (Karamázov, de-l-acte) need nested rendering. *Open:* a future WorkContents slice.
- **Personal-data leakage** — highest-risk vector is generating the export from the Kairos corpus
  (where `read-at` is populated). *Mitigation (contract rule):* generate from the repo `pt/` side only.
