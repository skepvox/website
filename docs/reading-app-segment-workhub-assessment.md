# Reading-App Segment Model & Owned Work-Hub Redesign — Assessment

> **Start with [`reading-app-website.md`](reading-app-website.md) for the current state.** This is **not
> superseded** — it remains the deep design reference for the segment/reading **data model**, granularity
> invariants, and the two-state reading model (the substrate behind open decisions **D** mature
> WorkContents/zoom-out and **E** personal review companion).

**Status:** Assessment / design only. **No implementation in this document.** No component, frontmatter,
builder, `page:true`, or `node_modules` change is proposed here — only the data model, the product
shape, and a staged plan to get there.

**Scope note.** This assessment reads three repos under `~/projects/` read-only: `skepvox-website`
(the public site), `skepvox-book-pipeline` (the EPUB → Markdown → segmented translation pipeline), and
`kairos` (the personal Obsidian vault that hosts the current real reading/review surface). It proposes
changes **only** to the website's future model. The pipeline and the vault are the source of truth and
the personal workspace respectively; this document does not propose editing either.

**Companion docs.** This builds on `docs/navigation-owned-shell-assessment.md` (owned shell),
`docs/sidebar-local-nav-model.md` (local-nav model, Slices 1–2B shipped), and
`docs/product-theme-roadmap-assessment.md`. It does **not** modify the intentionally-uncommitted
future-experiment note in the roadmap doc.

---

## 0. Executive summary

The website today is a *polished literary website* whose reading pages are a **chapter-grained rollup**
of a much richer segment model that already exists, fully-formed, in the book-pipeline. To become a real
*reading app* — where the reader moves trecho-to-trecho and can zoom out to a calm semantic overview —
the website needs to (1) adopt the pipeline's **segment** as its first-class unit, keyed by a durable
**`canonical-id`**, (2) replace the work-hub's "table of contents + the entire book concatenated below"
with an **owned contents/index/map surface**, and (3) treat the public site as a *third sync target* of
the pipeline rather than a separately hand-authored corpus.

Three findings frame everything below:

1. **Three orthogonal maturity axes.** A book's *pipeline depth*, its *Kairos reading depth*, and its
   *website publication state* are nearly independent. The three most pipeline-mature granular books —
   **Os Irmãos Karamázov** (105 segments × 4 editions, Russian original aligned 1:1), **O Eu e o
   inconsciente / Jung** (222 segments × de/pt/pt-vozes, fully reviewed), **Confissões** (453
   paragraph-level segments) — are **absent from the public site entirely**. Conversely, 17 of the 18
   multi-leaf works the site *does* publish are the older chapter-grained generation.

2. **One working template already exists.** Exactly one website work,
   `/louis-lavelle/a-consciencia-de-si` (118 leaves), is already published at canonical-pt **segment
   grain** with `BB-PP-CCC-SSS` slugs that match the pipeline's pt segment filenames. It is the proof
   that the website can host pipeline segments — the migration template, not a hypothetical.

3. **The model already exists; the website just doesn't consume it.** The pipeline carries a complete,
   stable segment schema (`canonical-id`, `segment-prefix`, `segment-index`, `segment-kind`,
   `language`, review/reading state) across ~6,900 segments and ~23 books. The website's reading pages
   are hand-authored Markdown with display-only frontmatter (`title`/`description`/`footer`) and a
   separate `BB-PP-CCC` (no `SSS`) scheme. The redesign is mostly a *consumption and convergence*
   problem, not a *modeling-from-scratch* problem.

**Recommended first slice (detailed in §10): build the richer segment manifest first**, not the Brás
Cubas UI. Specifically: a generated, app-ready `segment-manifest` export (a bridge layer between the
pipeline and the website) that carries `canonical-id` + ordering + granularity + per-book maturity, with
**no visible UI change**. Memórias póstumas is the *UI* stress test that comes *after* the manifest, not
the first thing built. Do not implement until this assessment is reviewed.

---

## 1. Current-state map

### 1.1 The three surfaces, and which are real reading surfaces

| Surface | Role today | Reading or reference? |
|---|---|---|
| **Corpus hubs** (`/literatura/`, `/louis-lavelle/`, `/podcast/`) | Owned `CardGrid` indexes | Reference/index |
| **Author hubs** (`/literatura/<author>/`) | Owned `CardGrid` of works | Reference/index |
| **Work hubs, multi-leaf** (e.g. `bras-cubas.md`) | **TOC + the entire book concatenated below it** | *Mixed — and this is the debt (§1.3)* |
| **Work hubs, single-file** (`a-cartomante`, `o-ateneu`) | One page = the whole short work | Reading surface (degenerate, 1 leaf) |
| **Reading leaves** (`…/<work>/BB-PP-CCC-…`) | One chapter/segment per page; `ReadingNav` prev/next | **The real reading surface** |
| **Podcast episodes** | Player + transcript + guide; `PodcastEpisodeNav` (Slice 2B) | Reading/listening surface |

The **reading leaf** is the only true reading surface for books today, and it is chapter-grained for
all but one work. Everything above it is an index. The work hub is *trying to be two things at once* (an
index **and** a full reading copy), which is the core product debt.

### 1.2 Website publication inventory (verified from `reading-nav.json` + leaf slugs)

- **18 multi-leaf works / 834 reading leaves** in `reading-nav.json`.
- **Slug generations:** **716 leaves** use the older `BB-PP-CCC` chapter prefix; **118 leaves** (only
  `a-consciencia-de-si`) use the newer `BB-PP-CCC-SSS` segment prefix.
- **2 single-file works** (`a-cartomante`, `o-ateneu`) have no leaves.
- **Granularity published:** Brazilian literature as **pt chapter leaves** (Brás Cubas 163, Dom Casmurro
  148, Esaú e Jacó 122, Quincas Borba 61, São Bernardo 36, Vidas Secas 13, Angústia 11, O Alienista 4);
  most Lavelle works as **French chapter leaves** (the originals); `a-consciencia-de-si` as **pt segment
  leaves** (the one exception).
- **Absent from the site:** the three most pipeline-mature granular books — **Karamázov, Jung,
  Confissões** — appear nowhere in the public nav.

### 1.3 Where full concatenated text appears, and why it is now product debt

Every multi-leaf work hub renders, on one page: a Book JSON-LD block, a grouped "Sumário"
(table-of-contents) **and then the entire book inlined below the TOC**. Concretely, `bras-cubas.md` is
**4,898 lines** — the 163-chapter TOC followed by all 163 chapters' prose; the Lavelle
`introduction-a-l-ontologie.md` hub is ~217 KB of the whole French book on one page.

This was a reasonable shortcut for a *website* (one URL holds the book; SEO and Ctrl-F work). It is wrong
for a *reading app*:

- It is not a reading surface anyone would choose — it is an un-paginated wall with a TOC stapled on top.
- It duplicates the per-leaf pages (the same prose exists at the hub *and* at each leaf), doubling weight
  and creating duplicate-content ambiguity.
- It scales badly exactly where it matters: a 163-tiny-chapter novel produces a hub that is
  simultaneously an overwhelming list **and** a giant document. Brás Cubas is the canonical
  "easy-to-make-ugly" case.
- It cannot host the things a reading app needs (progress, zoom-out map, parallel original↔translation,
  per-segment state) because it is a static concatenation, not a model.

The redesign's central move (§4) is to **split the hub's two jobs**: keep an owned, calm *contents/map*
surface; remove the visible full-book concatenation; and replace its SEO/search value deliberately (§5).

---

## 2. Segment / trecho data model

### 2.1 The canonical unit

The canonical reading unit is the **segment** (*trecho*) — **not** a fixed "chapter." This is already
the pipeline's design: across ~6,900 files the segment is the unit of translation, review, audio, and
reading. The website must adopt the same unit. A "reading leaf" on the site is the presentation of one
segment.

A segment is identified by a **language/edition-independent** key and ordered by a **global** index, so
that the same logical trecho can exist in the original, the canonical pt, and any reference editions —
each with its own prose and its own slug — while remaining *one* addressable thing.

### 2.2 Required fields (the union across all flows, from the pipeline schema)

These come directly from the pipeline's `frontmatter-policy.md` (segment schema) plus the cross-cutting
fields the inspection confirmed are load-bearing. The website/app model must carry the **identity** and
**ordering** fields as first-class; the **state** fields should be carried but may be consumed via the
bridge layer (§4) rather than parsed raw.

**Identity (immutable, the join keys):**

| Field | Example | Purpose |
|---|---|---|
| `canonical-id` | `fyodor-dostoevsky/os-irmaos-karamazov/02-06-002-042` | **The primary key.** `{author-slug}/{book-slug}/{segment-prefix}`. Language/edition-independent; identical across original, canonical pt, and reference editions. The join key for original↔pt pairing and the natural app DB key. |
| `segment-prefix` | `02-06-002-042` | The `BB-PP-CCC-SSS` composite. Immutable, sortable; the URL tail and nav sort key. |
| `segment-index` | `42` | Integer `SSS`. **Global, never resets per chapter.** The ordering authority — never derive order from `(chapter, local index)` or from the slug. |
| `author-slug`, `book-slug` | `carl-jung`, `die-beziehungen-zwischen-dem-ich-und-dem-unbewussten` | Stable path identity. **`book-slug` may be the source-language title** (Jung's German title slug is shared by *all* editions incl. pt), decoupled from every display title. |
| `chapter-prefix` | `02-06-002` | `BB-PP-CCC`. The optional grouping key above the segment; finer trechos attach to one chapter by sharing it. **The only level at which today's chapter-grained website can join the pipeline.** |

**Ordering / grouping (numeric decompositions):** `book-index`, `part-index`, `chapter-index`,
`segment-index` — for sorting and for Book/Part/Chapter structured data. The website/app model should
also carry an explicit ordered **`groupPath`** (§2.4) so the UI renders the authored structure above the
segment from the model, never inferred from the route slug or hard-coded `BB-PP-CCC` parsing.

**Granularity / type:**

| Field | Values | Purpose |
|---|---|---|
| `segment-kind` | `chapter \| h2 \| h3 \| h4 \| paragraph-marker \| paragraph-range \| semantic-section` | First-class granularity flag so one book mixes coarse and fine units. **Note:** `semantic-section` is live (Karamázov, 36 segments) but missing from `frontmatter-policy.md` — the website enum must be the **union** of doc + live values. |
| `file-kind` | `chapter \| segment` | Discriminator. The website model derives only from `file-kind: segment`; `chapter` files are the optional pre-segment grouping layer. |

**Language / edition:**

| Field | Example | Purpose |
|---|---|---|
| `language` | `pt \| fr \| la \| ru \| de \| el \| en` | The edition track of *this* file. A **dimension over** `canonical-id`, not a separate document. |
| *(derived)* `edition-role` | `source \| canonical \| reference` | Source = original language; canonical = the editable pt; reference = read-only `pt-*` witness. Derivable from `sync-map` `active-language` + `updated-at` being populated only on the canonical edition. Reference editions must never be presented as editable. |
| `book` | pt: `As relações entre o Eu e o Inconsciente`; pt-vozes: `O Eu e o Inconsciente` | **Per-edition localized display title**, distinct from `book-slug`. The app shows this while keying off the slug. |

**Per-edition display (non-identifying):** `title`, `segment-title`, `chapter-title`, `segment-slug`,
`chapter-slug` — localized, prose-derived, and they **diverge across editions for one `canonical-id`**
(Jung pt vs pt-vozes differ). These must be display/URL tails, **never** join keys.

**State (two separate state machines — see §3, §4):**

| Field | Purpose |
|---|---|
| `review-stage` | Lane: `empty \| translated \| first-reviewed \| read \| needs-review \| reading-reviewed \| final`. |
| `needs-review` (bool), `review-tags` (list), `review-note` (text) | Translation-review flags. Explicit; never inferred from highlights. |
| `updated-at` | The **edit clock** — last intentional canonical text edit. Populated only on the canonical edition. |
| `read-at` | The **reading clock** — set when the reader reads a segment. **Lives only in the Kairos mirror, not the repo.** |

**The load-bearing behavior:** `updated-at > read-at` ⇒ the segment is **due for re-reading**. This is
the single most important reading-app signal and is entirely absent from the public site today.

**Body-annotation vocabulary (not frontmatter):** `==quote highlights==` are **reader quotes to
preserve** (115 in the corpus) and are explicitly **not** review flags; `%% review: … %%` and
`> [!review]` are inline review callouts. The model must keep highlights and review flags visually and
semantically distinct.

### 2.3 Chapter vs section vs segment vs leaf

- **Segment / trecho** — the canonical reading unit (one `canonical-id`). May be a chapter, a section, a
  numbered paragraph, or a semantic sub-section. **The first-class entity.**
- **Chapter** — an *optional grouping level* (`chapter-prefix` / `chapter-index`) above the segment. For
  some works the chapter *is* the segment (`segment-kind: chapter`); for others a chapter contains many
  segments.
- **Section** — an intermediate grouping (Lavelle `h3`/`h4`, Karamázov `semantic-section`); modeled as
  segments with their parent `chapter-prefix`.
- **Leaf** — the website's *presentation* of a segment (one URL, one reading page). "Reading leaf" ≈
  rendered segment; the terms are interchangeable for UI purposes.

### 2.4 Authored structure vs content leaf — the orientation hierarchy

**The reading-app model must distinguish the content leaf from the authored structure above it.** Prose
lives only in the segment leaf, but the work-hub and zoom-out UI must preserve and render the *full
authored structure* above each segment — and must **not** assume a flat chapter list.

The required hierarchy, with every intermediate level optional:

```
Work
  Internal Book / Volume / Tome      optional
    Part                             optional
      Chapter                        optional
        Section / Proposition        optional
          Segment / Trecho           REQUIRED — the leaf, the only level with content
```

**The rule: segments are the content unit; structure is the orientation unit.** The segment is the only
thing that carries prose and the only required level; everything above it exists to orient the reader,
not to hold text.

**The UI must collapse absent levels gracefully** — render only the levels a work actually has:

- Simple works render `Work → Chapter → Segment` (or even `Work → Segment`).
- Works divided into internal books / volumes / parts **must show those groupings** (do not flatten them
  into a single chapter list).
- A chapter may itself **be** the segment/leaf when the chapter is the natural reading unit
  (Brazilian literature: `segment-kind: chapter`).
- A chapter may instead **be a group** containing many segments.
- Lavelle-like works may use **sections / propositions** as meaningful grouping *or* as leaf labels
  (`segment-kind: h3`/`h4`).
- Confissões uses **numbered paragraphs** as segment leaves (`paragraph-marker`).
- Karamázov uses **internal books → parts → chapters** plus heavy chapter-sized or `semantic-section`
  segments — the case that breaks any flat-list assumption.

**Manifest implication.** The future `segment-manifest` (§4, Slice a in §8) must carry an ordered
**`groupPath`** (or equivalent) per segment — the authored levels *above* it, in order, each with a
`kind`, an `index`, and a display `title`. For example:

```jsonc
"groupPath": [
  { "kind": "internal-book", "index": 2, "title": "Pró e contra" },
  { "kind": "part",          "index": 1, "title": "..." },
  { "kind": "chapter",       "index": 6, "title": "O grande inquisidor" },
  { "kind": "section",       "index": 2, "title": "..." }
]
```

`kind` ∈ `internal-book | volume | tome | part | chapter | section | proposition` (extend as needed),
and absent levels are simply omitted from the array. **The UI renders the hierarchy from this `groupPath`
model — never inferred from route slugs and never from hard-coded `BB-PP-CCC` positional assumptions.**
The numeric `book-index`/`part-index`/`chapter-index` remain the *sort* decomposition; `groupPath` is the
*orientation* structure the hub and zoom-out (§5, §7) actually draw.

### 2.5 The granularity spectrum (a first-class requirement, not an edge case)

The model must support **stable, ordered segments at any granularity**, with optional grouping above
them (`book → part → chapter → section → segment`). The `BB-PP-CCC-SSS` scheme already encodes exactly
this, and the corpus already spans the full spectrum:

| Granularity | Exemplar | `segment-kind` | Shape |
|---|---|---|---|
| **Very fine** | Confissões (453 segments) | `paragraph-marker` | One canonically-numbered paragraph = one segment. |
| **Fine/middle** | Lavelle (la-conscience 118, l-erreur 130, introduction 99) | `h3` / `h4` | Section/proposition-sized. |
| **Coarse** | Karamázov (105 segments, up to ~9,000 words) | `chapter` (+ `semantic-section`) | Whole authorial chapters; the long Zossima chapters split into lettered sub-sections. |
| **Coarse, small** | Vidas Secas (13), O Alienista (4/52) | `chapter` | Chapter leaves, sometimes tiny. |
| **Packed** | (Kairos) História de Portugal (826) | `paragraph-range` | Dense paragraph runs. |

**Two invariants the website must honor:**

1. **`SSS` is global and never resets per chapter.** Verified in Karamázov (`segment-index` 42–50 span
   two chapters) and Confissões (Livro I ends …031, Livro II starts …032). Sort/paginate on
   `segment-index`/`segment-prefix` only — never on `(chapter, local-index)`.
2. **Coarse can become fine later without renumbering.** Karamázov already proves this in-corpus: a
   chapter (`02-06-002`) split into lettered trechos keeps its `chapter-prefix` while each sub-section
   gets its own `segment-prefix`. The model must allow appending finer segments; prefixes are immutable,
   `SSS` is append-friendly.

**Reserved buckets:** `00-00-000…` = front matter (11 website books use it); `99-99-999…` = conclusion
(2 website books — `de-l-ame-humaine`, `introduction-a-l-ontologie` — rely on it). But Karamázov does
**not** use `99-99-999` (its epilogue is a real `book-index: 05`). So the model must treat both buckets
as **optional but sortable** — never hard-require, never hard-exclude.

### 2.6 How it works per flow

- **Brazilian literature (pt):** chapter *is* the segment (`segment-kind: chapter`). Already published as
  pt chapter leaves; semantically mature at this grain. Needs `canonical-id` + `SSS` added (identity),
  not re-segmentation.
- **Lavelle FR originals:** published as French chapter leaves; the canonical **pt translation exists in
  the pipeline at finer (`h3`) grain but is not published**. Future: publish pt segments paired to fr by
  `canonical-id` (parallel original↔translation reading).
- **Lavelle pt (`a-consciencia-de-si`):** already published at segment grain — the template.
- **Jung (de → pt, + pt-vozes reference):** the multi-edition case; `book-slug` is the German title;
  one `canonical-id` fans out to de source + pt canonical + pt-vozes reference, each with its own slug.
- **Future translated books (Karamázov, Confissões, …):** already segment-grade and aligned in the
  pipeline; the website must consume them by `canonical-id` and respect the `sync-map` active edition.

### 2.7 Slug / ID Migration Debt

The current website leaf slugs are an **older generation**, predating the mature `BB-PP-CCC-SSS`
convention. The risk this subsection exists to prevent: **"the prefix looks okay" silently becoming
"identity is solved."** It is not. Classify every route along **three independent axes** — never collapse
them:

| Axis | Question | Cheap to read? |
|---|---|---|
| **1. Prefix/order compatibility** | Is the filename `BB-PP-CCC` (older) or `BB-PP-CCC-SSS`? | Yes — and easy to over-trust. |
| **2. Semantic maturity** | Does the leaf actually represent the *right* segment/trecho per the canonical pipeline model? | No — requires comparing to the pipeline per book. |
| **3. Public URL stability** | Should this URL stay fixed for SEO/inbound-link reasons regardless of 1 and 2? | Independent product/SEO decision. |

These are genuinely orthogonal:

- `a-consciencia-de-si` (118 leaves) is **prefix-compatible** (axis 1 ✓) but its **semantic maturity**
  (axis 2) must be *verified* against the current pipeline segmentation — not assumed from the prefix.
- The 716 chapter-level literature/Lavelle-FR leaves are **older on axis 1** yet may be **mature on
  axis 2** where chapter genuinely *is* the segment (Brazilian lit), and are **worth preserving on
  axis 3** (SEO, links). For these the right move is to **mint a durable internal id and map the existing
  URL to it**, not rewrite the URL.

**Recommendation (bias: stable ids first, slugs later):**

1. **Add a durable `canonical-id` (and `segment-prefix`) to every leaf as internal identity** — in
   frontmatter and/or the bridge manifest. App identity, `reading-nav`/`sidebar-nav` keys, reading
   state, highlights, and quotes all key off this, **never** the route slug or its prefix.
2. **Keep public URLs stable.** Do not change a slug without a strong product reason. Pretty slugs are
   presentation/legacy, not identity.
3. **If a slug ever must change:** 301-redirect old→new, update `<link rel="canonical">`, regenerate
   `reading-nav.json` + `sidebar-nav.json`, sweep internal links, and update the sitemap — as one
   atomic, tested migration. Never silently.
4. **Treat `BB-PP-CCC` (chapter) and `BB-PP-CCC-SSS` (segment) as two altitudes of the same identity.**
   The bridge manifest should be able to join the chapter-grained legacy at `chapter-prefix` *and* the
   segment-grained future at `segment-prefix` over the same `canonical-id`.

The net: **the durable segment id is the identity; the route slug and its prefix are presentation.** The
next implementation must not treat current URLs (or a tidy-looking prefix) as canonical app identity.

---

## 3. Pipeline alignment with the real reading/translation workflow

### 3.1 The workflow, as it actually runs (from `reading-review-workflow.md` + the three flows)

1. **Extract** raw EPUB/PDF → `extracted/` (preservation-first; source HTML + assets + metadata kept).
2. **Process (optional)** → `processed/{author}/{book}/{lang}/BB-PP-CCC-{slug}.md` (`file-kind: chapter`)
   only when chapter-level cleanup is needed.
3. **Segment** → `segmented/{author}/{book}/{orig-lang}/BB-PP-CCC-SSS-{slug}.md`; choose `segment-kind`
   (paragraph-marker / chapter / h3…). `SSS` is global.
4. **Translate** (skill: `book-pipeline-translate-pt`): read the original segment, write the matching
   `pt/` file paired by `segment-prefix`; preserve all ids; translate only display fields; statement-
   ledger cross-language QA, then a native-pt-BR naturalness pass.
5. **Review in repo** — original vs pt statement-by-statement, *or*, when `pt-*` references exist, the
   reference-editions skill: **read widely across original + canonical pt + every `pt-*`, edit only the
   canonical pt**, surgically (fidelity bugs + accessibility), never editing references.
6. **Stamp** `updated-at` on changed pt files.
7. **Sync to Kairos** (`src.sync_segment_range`): the `sync-map` projects the **active-language** edition
   flat into the reading hub (`reading-dir: .`), same `BB-PP-CCC-SSS` filenames.
8. **Read in Kairos** — the reader reads the **original**, discusses translation choices with ChatGPT,
   compares against `pt-*` reference editions, marks `==highlights==` to keep, and flags issues
   (`needs-review`/`review-tags`/`review-note`/inline `%% review %%`). `read-at` is set per segment read.
9. **Import annotations back** to the repo (never overwriting newer repo text).
10. **Reading-review pass** in `segmented/.../pt/`: resolve only flagged passages segment-by-segment
    (consulting ChatGPT / reference reasoning), preserve highlights, clear flags, set
    `review-stage: reading-reviewed`.
11. **Re-stamp + sync back** `--updated-only` (preserves Kairos `read-at`); if `updated-at > read-at`,
    the segment is visibly due for re-reading.
12. **Log** durable decisions to `docs/translation-style/{author}/{book}.md` (+ author-level + a
    `…-reference-editions.md` dossier).

The back-and-forth the assessment was asked to understand is steps 8–11: **original ↔ reference editions
↔ ChatGPT discussion ↔ canonical pt, segment by segment**, with the canonical pt as the *only* editable
edition and references as read-only witnesses.

### 3.2 What the flows show (no parity — report per book)

| Flow | Pipeline depth | Editions | Granularity | Review state | Kairos reading | On website? |
|---|---|---|---|---|---|---|
| **Karamázov** | Most structurally complete | ru (source) + pt + pt-34 + pt-penguin (105 each) | Coarse `chapter` + 36 `semantic-section` | Scaffolded, **0% reviewed** | 0 read | **No** |
| **Jung** | Most editorially advanced | de + pt + pt-vozes (222 each) | Fine `paragraph-marker` | **222 reviewed / 163 edited** | 19/222 read | **No** |
| **Confissões** | Mature, fine | la + pt (+ pt-petra ref) | Very fine `paragraph-marker` (453) | dormant | 0 read | **No** |
| **Lavelle intro** | Mature, 1:1 | fr + pt (99 each), **no reference** | `h3` middle | dormant | 0 read | **fr chapters only** |
| **a-consciencia-de-si** | — | pt published | segment grain | — | — | **Yes (segment grain)** |
| **Brazilian lit** | chapter-grade pt | pt | `chapter` | dormant | varies | **Yes (chapter grain)** |

The point: **pipeline maturity and website presence are nearly inversely correlated** for the granular
flows. The redesign cannot infer website readiness from pipeline counts; it must converge the website
axis onto the canonical-pt segment grain **book by book**.

### 3.3 Fields needed to preserve the workflow in the app

Carry: `canonical-id`, `segment-prefix`, `segment-index`, the ordered `groupPath` (the authored
structure above the segment — §2.4), `language`/`edition-role`, per-edition `book`
display title, `segment-kind`, the `chapter-*` grouping, the review fields (`review-stage`,
`needs-review`, `review-tags`, `review-note`), `updated-at` (edit clock) and `read-at` (reading clock),
plus **reference-witness links** (resolve siblings by `canonical-id`) and a **per-book review-log /
terminology-decision artifact** (Jung keeps these in `docs/translation-style/*`, *not* in segments — so
the app must model them separately from per-segment markers). Optionally, the per-segment 4-way
word-ratio QA (`segmentation-qa.tsv`) as a translation-progress signal.

### 3.4 What must be adapted before importing future books

- **Consume `sync-map.yaml`** (`schema: skepvox-book-sync-v2`) to decide the canonical edition and which
  editions are reader-facing — never glob folders (that would leak `pt-*` references).
- **Exclude `pt-*` reference editions** from the public reader by default (witnesses, not shelf).
- **Decide the ingestion architecture (§4):** the website should become a third sync target consuming
  segment frontmatter + `sync-map`, not continue hand-authoring `src/literatura/*`.
- **Reconcile the website's own docs:** `docs/books-workflow.md` and `docs/seo-strategy.md` still model
  `BB-PP-CCC-chapter-slug` with no segment/`canonical-id` concept — they must be updated before deriving
  a segment model, or the site will carry two contradictory schemas.

---

## 4. Workflow Health: Pipeline, Kairos, and Website Alignment

The current pipeline/Kairos workflow is **the working practice, not a finished standard.** It is strong,
but it should be improved in specific ways *before* it becomes the permanent app substrate.

### 4.1 What works well today (keep)

- **Segmented original-language files** as preservation-grade source, separate from the editable pt.
- **Canonical pt** as the single editable edition; one clear edit target per book.
- **Sibling reference editions (`pt-*`)** as read-only witnesses — present where they matter (Confissões
  `pt-petra`, Jung `pt-vozes`, Karamázov `pt-34` + `pt-penguin`), excluded from reading by default.
- **`sync-map.yaml` + stable pairing logic** — `canonical-id`/`segment-prefix` pairing survives slug and
  prose drift; cross-edition join is rock-solid (Karamázov aligns 4 editions 1:1).
- **Review markers + segment-by-segment workflow** — a fully-specified loop (flags, tags, notes,
  highlights, stages, `read-at`/`updated-at`).
- **Kairos as the place reading/review actually happens** — a calm, single-edition, prefix-sorted file
  list; the reader genuinely reads trecho-by-trecho there.

### 4.2 What may need improvement (before it becomes the app standard)

- **Frontmatter consistency vs. richness.** The schema is rich but applied unevenly: review state is
  scaffolded everywhere yet near-dormant (≈2 live `needs-review` corpus-wide); `read-at` lives **only**
  in the Kairos mirror; `semantic-section` is live but undocumented. Sparse-but-present fields are fine
  for the pipeline but ambiguous for an app that must *render* state.
- **Segment-id stability for an app.** `segment-prefix`/`canonical-id` are stable *by convention*, but
  there is no enforced durable id independent of the prefix. If a book is ever re-segmented (coarse →
  fine), `canonical-id` values for *new* trechos appear; the app needs an id that is durable across
  re-segmentation (see §4.4 follow-up on UUIDs).
- **Where review state belongs.** Today it is split: per-segment frontmatter (flags), inline body
  (`%% review %%`, `==highlights==`), **and** prose dossiers (`docs/translation-style/*`). For Jung the
  *real* review knowledge is in the dossiers, not the segments. An app needs a clear answer: structured
  per-segment state **and** a separate per-book review-log artifact — not the website parsing prose
  dossiers.
- **Kairos ↔ canonical text coupling.** Reading state (`read-at`) lives in the vault mirror; edit state
  (`updated-at`) lives in the repo; they reconcile only via sync. That is fine for one reader, but loose
  for an app that wants reading progress as first-class data.
- **Reference-edition discoverability.** Reference editions are powerful but buried in `pt-*` folders +
  dossiers; there is no structured "this segment has N reference witnesses" signal an app could surface.
- **Filename-inferred pairing.** Pairing *works* by `segment-prefix`, but it is currently *read from
  filenames/frontmatter* rather than asserted in a manifest. An explicit pairing manifest would make
  original↔pt (and reference) relationships first-class and queryable.
- **Website import source.** The website currently hand-authors `src/literatura/*` and runs a separate
  `local-books → src` build — divergent from the `sync-map` projection. Two schemes will drift.

### 4.3 Recommended direction — build the bridge, don't couple

```
  book-pipeline                 bridge (NEW)                 consumers
  ─────────────                 ────────────                 ─────────
  segmented/{lang}/   ──┐                                ┌─▶ Kairos Reading (active edition, as today)
  canonical pt          ├─▶  segment-manifest export ───┤
  pt-* references       │    (app-ready, stable ids,    ├─▶ skepvox-website (NEW third sync target)
  sync-map.yaml       ──┘     pairing, maturity, state)  └─▶ future app
```

- **Keep `skepvox-book-pipeline` as the textual source of truth.** All extraction/translation/review
  stays there.
- **Keep Kairos as the personal reading/review workspace.** It remains where `read-at`/flags originate.
- **Introduce a stable segment manifest / export layer between them and the website/app.** A generated,
  app-ready artifact (think: the segment analogue of `reading-nav.json`/`sidebar-nav.json`) that carries
  `canonical-id`, ordering, granularity, per-edition pairing, per-book maturity, and a *projection* of
  review/reading state — **not** the raw, messy review internals.
- **The website must not parse messy review-state details directly.** It consumes the manifest's clean
  projection (e.g. `reviewed: true`, `due-for-reread: false`), not inline `%% review %%` or prose
  dossiers.

### 4.4 Concrete follow-up questions (to answer before broad rollout)

1. **Should review-state become structured metadata?** (vs. inline markers + prose dossiers.)
   *Lean: yes — a structured per-segment projection + a per-book review-log artifact; keep inline
   `%% review %%`/`==highlights==` for authoring, but project them into the manifest.*
2. **Should every segment get a durable UUID-like id in addition to filename order?**
   *Lean: yes — a stable `uid` decoupled from `segment-prefix`, so re-segmentation and slug changes never
   orphan reading state, highlights, or inbound links. `canonical-id` stays the human-readable join;
   `uid` is the durable anchor.*
3. **Should canonical pt and original segments share a cross-language segment id?**
   *They already do — `canonical-id`/`segment-prefix` is shared across editions. Confirm this is the
   contract the manifest exposes, and that per-edition slugs are never used as join keys.*
4. **Should Kairos notes link by segment id?**
   *Lean: yes — quotes/notes in `400-KNOWLEDGE/430-READING` should reference `canonical-id` (or `uid`),
   so promoted knowledge survives slug/prose edits and can surface in the app.*
5. **When is the right moment to refactor the pipeline before importing more books?**
   *Lean: refactor the **id + manifest contract** (uid, review projection, pairing manifest) once, now,
   while the corpus is ~23 books and only one is on the website — before importing more, and before the
   website starts consuming segments. Cheaper now than after divergence.*

The throughline: **this is how things work today; this is what the product needs; this is the bridge we
should build.**

---

## 5. Work-hub target product shape

### 5.1 Replace "TOC + concatenation" with an owned contents/index/map surface

The redesigned multi-leaf work hub is **an index/map, not a copy of the book.** It does three things and
no more:

1. Orient: title, author, a one-line sense of the work, its shape (N segments, M chapters/parts), and
   the reader's position (progress, "continue reading," "due for re-reading").
2. Navigate: a calm contents surface that scales from 4 to 800 segments without becoming a file tree.
3. Get out of the way: enter the reading flow in one click; the prose lives at the leaves, not the hub.

The visible full-book concatenation is **removed** (its SEO/search role is replaced deliberately — §6).

### 5.2 Stress-test against Memórias póstumas (163 tiny chapters)

Brás Cubas is the make-or-break case: 163 chapters, many a paragraph long. A flat list of 163 links is
the "huge TOC, easy to make ugly" failure. The hub must:

- **Group by the work's own structure** (part → chapter), not by arbitrary buckets. Brás Cubas has a
  natural front matter (Dedicatória, Prólogo, Ao leitor) + chapters; the current hub already groups
  "Capítulos 001–010" etc., which is a crude version of the right instinct.
- **Default to collapsed/condensed**, with the reader's *current position expanded*. Don't render 163
  open rows.
- **Lead with continuation, not the list.** "Continue: Cap. 47" and "Start from the beginning" above the
  full contents.
- **Stay one calm column.** No card grid of 163 cards, no dense newspaper columns. Quiet rows, generous
  rhythm, hairline grouping.

### 5.3 What "beautiful and calm" means for a huge segment list

- **Mobile:** a single scannable column; sticky lightweight section headers; current segment marked
  quietly (a thin rule or a dot, never a badge); collapsed sections by default; a fast "jump to current."
  No horizontal scrolling, no multi-column TOC.
- **Desktop:** the same single reading column, optionally with a slim contents rail that is **the map**
  (current + nearby segments emphasized, the rest condensed), never a docs-style exhaustive file tree.
- **Restraint:** no progress bars competing with text, no gamified counters, no chapter thumbnails. One
  signature element — the *quiet position marker* — carries the "this is a reading app" feeling;
  everything else stays disciplined.

### 5.4 v1 recommendation

For v1 of the owned hub:

- **Render the authored hierarchy from each segment's `groupPath`** (§2.4) — internal book/volume →
  part → chapter → section, collapsing absent levels — rather than a flat chapter list or any
  `BB-PP-CCC` slug parsing. Front-matter (`00-00-000`) and conclusion (`99-99-999`) appear as named
  non-numbered sections; `book-index`/`part-index`/`chapter-index` drive the sort.
- **Collapse by default; expand the current group.** Show full contents on demand.
- **Lead with "continue reading."**
- **No in-work search in v1** (search is global and handled by the existing local search; revisit a
  scoped within-work filter in a later slice once segment counts justify it).
- **Show coarse position only** (current segment + % read) — defer the color/progress *map* (§7) until
  durable ids + local progress exist.

This gives a hub that is calm at 4 segments (O Alienista) and at 800 (Angústia) with the same structure.

### 5.5 Top 3 UI stress tests

Validate any future owned work-hub / segment-overview UI against **three works chosen for different
*kinds* of pressure**, not just size — before any rollout:

1. **Memórias póstumas de Brás Cubas — the *huge-list / many-tiny-units* test.** 163 chapter-as-segment
   leaves, many a paragraph long. Stresses: contents-surface scale, grouping/collapse, current-position
   marking, and mobile layout where a naïve TOC becomes a wall. The "easy to make ugly/overwhelming"
   case, and already on the site (immediate, no ingestion needed).

2. **Confissões — the *very-fine micro-segment at scale* test.** 453 `paragraph-marker` segments (one
   numbered paragraph each). Stresses the *opposite* extreme from Brás Cubas: hundreds of tiny stable
   units, the zoom-out map at maximum leaf density, fine-granularity identity, and the SEO/thin-content
   question (453 ultra-short leaves). If the overview is calm here, it is calm anywhere on the fine end.

3. **Os Irmãos Karamázov — the *large-work / original↔pt pairing / heavy-segment* test.** 105 segments,
   **mixed granularity** (coarse `chapter` + 36 finer `semantic-section`), segments up to ~9,000 words,
   and a **Russian original already aligned 1:1 with canonical pt** plus two `pt-*` references. Stresses
   the model's hardest combined case: rendering a very large single segment calmly, the
   non-resetting-`SSS`-across-split-chapters invariant, multi-edition pairing (the edition dimension over
   `canonical-id`), and keeping references *out* of the default reader. This is the multi-language
   pairing validation case.

*Held deliberately as secondary (each would add one more axis):* **Jung / O Eu e o inconsciente** is the
cleanest *reference-edition compare + review-state + active-reading* exemplar (de/pt/pt-vozes, fully
reviewed, 19/222 read) — use it specifically when validating a **compare/review/read-state** UI.
**Lavelle `a-consciencia-de-si`** is the existing *on-site migration template* — use it to validate that
a segment-grained pipeline book renders correctly within the current site before migrating others.

---

## 6. SEO / search / LLM replacement

### 6.1 What the concatenated hub provides today

- A single indexable URL holding the **entire work** (keyword coverage, Ctrl-F, "one page" shareability).
- Book/Chapter `hasPart` JSON-LD (`seo-strategy.md`).
- A natural target for LLM/`llms.txt`-style consumption (whole work in one fetch).

Removing the visible concatenation must not silently drop these.

### 6.2 What should replace it (deliberate, not legacy-by-default)

- **Search:** keep per-leaf pages fully indexable by the existing local search; add a **generated,
  non-visible corpus/search artifact** per work (or per corpus) so full-text retrieval does not depend on
  a visible concatenation. Do **not** keep a bad reading UX alive just to feed the index.
- **SEO structured data:** extend the JSON-LD from `Book → hasPart: Chapter` to a **`Book → Chapter →
  (Section/segment)`** chain so segment leaves carry structured data; the hub keeps the Book-level
  `hasPart` overview (pointing at leaves) without inlining prose.
- **Canonical/duplication:** with the concatenation gone, the duplicate-content ambiguity (hub prose vs
  leaf prose) disappears — a net SEO *improvement*. Each leaf is the canonical home of its text.
- **LLM output:** if a whole-work artifact is desired for LLM consumption, generate a **dedicated
  `llms`/export file** (already a pattern via `render-podcast-player-llms.py`) rather than a visible page.
- **Thin-content guard for fine works:** Confissões (453) and Jung (222) produce many ultra-short leaves.
  Mitigations: a **chapter-rollup canonical** (the chapter page is canonical; paragraph leaves
  `rel=canonical` to it or are `noindex` while remaining navigable), or only publishing leaves above a
  length threshold while keeping fine segments as in-page anchors. Decide per `segment-kind`.

### 6.3 i18n / parallel-edition SEO (new, currently unmodeled)

Original↔pt parallel pages need `rel=alternate hreflang` keyed on `canonical-id`. This is absent from
`seo-strategy.md` and must be added before publishing paired editions (Lavelle fr+pt, Jung de+pt).

---

## 7. Reading-leaf zoom-out model

### 7.1 The affordance

From a reading leaf, a **"zoom out"** lifts the reader from the single trecho into a **calm overview of
meaningful stop points** for the work — semantic trechos, not arbitrary pages (the explicit contrast
with Kindle's page overview). It is **not** a docs sidebar or file tree.

It should:

- **Orient** — show where the current segment sits in the work's authored structure, drawn from its
  `groupPath` (internal book → part → chapter → section, §2.4), by name — not a flat list.
- **Show the current segment prominently**, with a few **nearby segments** above/below for context.
- **Condense the distance** — the rest of the work is present but quiet (collapsed groups, counts), so
  the overview is scannable, not exhaustive.
- **Allow return without losing position** — closing the overview returns to the exact reading spot;
  selecting another segment navigates; there is always a one-touch "back to where I was."

### 7.2 Relationship to the hub

The zoom-out overview and the work hub (§5) are the **same map at two entry points**: the hub is the map
reached from outside the reading flow; zoom-out is the map reached from inside a leaf. They should share
one component/model so they stay consistent.

### 7.3 Explicitly deferred

The **color/progress map** (a visual field of read / due-for-re-reading / unread segments) is deferred
until there are **durable segment ids and a real user/local progress model**. Without stable ids and
stored progress it would be decorative and fragile. It is a later slice, and it must stay **calm and
literary — not gamified, not noisy** (no heatmaps screaming for completion).

---

## 8. Implementation roadmap

Each slice is independently shippable, tested, and screenshot-reviewed where it touches UI. Slices a–b
are foundation (no visible change); c onward are visible and must be QA'd per the navigation
interaction-state standard.

### Slice a — Richer segment manifest (no UI)

- **What:** a generated, app-ready `segment-manifest` (the bridge layer, §4.3) carrying `canonical-id`,
  `segment-prefix`/`segment-index`, the ordered `groupPath` (authored structure above the segment, §2.4),
  `segment-kind`, `chapter-*` grouping, per-edition pairing + role, a clean projection of review/reading
  state, and per-book maturity (pipeline/Kairos/website axes). Built from committed website data first
  (the existing leaves + `reading-nav.json`), with a defined path to ingest pipeline `sync-map` + segment
  frontmatter.
- **Files:** `scripts/build-segment-manifest.py`, `.vitepress/theme/data/segment-manifest.json`,
  `package.json` (wire into build like `reading-nav`), tests.
- **Risk:** low (data-only, idempotent, nothing consumes it yet — mirrors Slice 2A).
- **Tests:** deterministic/idempotent build; `canonical-id` present + unique; ordering by
  `segment-index`; granularity union enum; every segment carries a `groupPath` whose order matches the
  `book-index`/`part-index`/`chapter-index` sort, with absent levels omitted (not null-filled) and no
  hierarchy inferred from slugs; not wired to UI.
- **QA:** none visible.

**Realized v0 schema (Slice a, implemented in `scripts/build-segment-manifest.py` →
`.vitepress/theme/data/segment-manifest.json`).** Generated from committed website data only
(`reading-nav.json`, `sidebar-nav.json`, leaf paths); scope `literatura` + `louis-lavelle` (podcast
excluded); no prose. Top level: `{ $schema: "skepvox-segment-manifest-v0", generatedBy, source:
"website-committed", scope, note, works[], segments[] }`.

- **`works[]`** — one per book/work: `workId` (`{author}/{work}`), `corpus`, `author`, `work`,
  `displayTitle`, `href`, `relativePath`, `kind` (`multi-leaf | single-file`), `leafCount`,
  `prefixCompatibility` (`chapter-level | segment-level | single-file`), `semanticMaturity`
  (`"unknown"`), `urlStability` (`"preserve"`).
- **`segments[]`** — one per reading leaf (834 multi-leaf + 2 single-file = 836):
  - *Identity:* `canonicalId` = `{author}/{work}/{prefix}` (provisional, deterministic; **never** a
    route href or slug; single-file works use `{author}/{work}`).
  - *Ordering:* `order` (within-work, matches `reading-nav` order), `prefix`, `bookIndex`, `partIndex`,
    `chapterIndex`, and `segmentIndex` only when present (segment-level); omitted, never null-filled,
    when not derivable.
  - *Granularity:* `segmentKind` = `chapter` (legacy `BB-PP-CCC`) / `segment` (`BB-PP-CCC-SSS`, kept
    generic — not `paragraph-marker`, which awaits pipeline metadata) / `single-file`; optional `bucket`
    = `front-matter | conclusion` for the reserved `00-00-000` / `99-99-999` prefixes.
  - *Hierarchy:* `groupPath[]` of `{ kind, index, key, inferred: true }`, absent levels omitted —
    `book` when `bookIndex ∉ {0,99}`; `part` only for segment-level (the legacy synthetic `PP` is
    **not** projected for chapter-level leaves); `chapter` only for segment-level (where the segment is
    below the chapter). `key` is a **stable group key** (`{workId}/{index-path}`, e.g.
    `louis-lavelle/a-consciencia-de-si/00-00-001`) shared by every segment in that group. Chapter-level
    leaves therefore carry `groupPath: []` unless they have an internal book; reserved buckets carry
    `[]`.
  - *Route/display (presentation, not identity):* `href`, `relativePath`, `slug`, `displayTitle`.
  - *Maturity:* `source: "website-committed"`, `prefixCompatibility`, `semanticMaturity: "unknown"`,
    `urlStability: "preserve"`.

This is the conservative bridge; a future revision ingests the pipeline `sync-map.yaml` + segment
frontmatter to replace `groupPath` placeholders with authored titles, refine `segmentKind`, add the
edition dimension + review/reading state, and (per §4.4) a durable `uid`.

**v1 WorkContents readiness (no UI/collapse logic in Slice a).** The manifest already carries
everything a collapsible WorkContents needs from day one, without any slug parsing: a stable
`canonicalId` per segment; an ordered `groupPath` with a stable per-group `key` (for group headers,
`aria-controls`, and collapse/`localStorage` keys); `kind` + `index` per level for header labels
(authored titles arrive with the pipeline); and the ordering fields (`order`, `prefix`, `bookIndex`/
`partIndex`/`chapterIndex`/`segmentIndex`) to reconstruct or bucket the hierarchy deterministically.
Flat legacy works with no derivable authored structure (e.g. Brás Cubas, `groupPath: []`) expose those
ordering fields so WorkContents can bucket them at render time — a Slice b presentation decision, not
fabricated structure here.

### Slice b — Owned work-contents component for ONE stress-test work

- **What:** the owned contents/map surface (§5), wired for **one** work behind the existing hub, reading
  the manifest. Recommend **Brás Cubas** (the huge-list case) as the first target.
- **Files:** `.vitepress/theme/components/WorkContents.vue` (+ a slot/wiring approach consistent with
  `ReadingNav`/`PodcastEpisodeNav`), tests.
- **Risk:** medium (first visible hub change; one work only).
- **Collapse is v1, not deferred.** Group headers are real `<button>`s with `aria-expanded` +
  `aria-controls` over each group's stable `groupPath` `key`; large works default **collapsed**, small
  works may default **expanded**; the current/continue group opens automatically once a progress signal
  exists; optional `localStorage` may remember expanded groups as **local convenience only — never
  durable identity** (identity stays `canonicalId`). What is *deferred* from Slice a is only that this
  logic lives in the component, not the manifest.
- **Tests:** renders grouped/collapsed contents; group headers expose `aria-expanded`/`aria-controls`;
  current-position marking; SkLink four-state; no concatenation removed yet.
- **QA:** Brás Cubas mobile + desktop, light + dark; verify calm at 163 chapters.

### Slice c — Remove visible full-book concatenation for selected hubs (+ SEO/search replacement)

- **What:** retire the inlined full book on selected work hubs; ship the search-corpus artifact +
  extended JSON-LD + canonical/thin-content strategy (§6) simultaneously, so indexing is replaced not
  dropped.
- **Files:** the per-work hub source + builder responsible for concatenation, a search-corpus generator,
  JSON-LD changes, `docs/seo-strategy.md` + `docs/books-workflow.md` reconciliation, tests.
- **Risk:** **high** (SEO-sensitive; visible). Stage per work; verify before broad rollout.
- **Tests:** leaves still indexed; search corpus present; JSON-LD chain valid; no duplicate-content; hub
  no longer inlines prose.
- **QA:** the Top-3 stress works; a delayed live SEO/search check after deploy (per repo deploy policy).

### Slice d — Reading-leaf zoom-out affordance

- **What:** the in-leaf zoom-out overview (§7), sharing the Slice-b component/model.
- **Files:** zoom-out component + leaf slot wiring, tests.
- **Risk:** medium.
- **Tests:** opens/closes without losing position; shows current + nearby; not a file tree; SkLink states.
- **QA:** fine (Confissões), coarse (Karamázov), tiny (Vidas Secas).

### Slice e — Broader rollout across works (+ paired editions)

- **What:** extend the hub + zoom-out across all works; begin publishing **canonical-pt segment** editions
  (Lavelle pt paired to fr; then a pipeline-native book — Jung or Karamázov — as the multi-edition
  validation), driven by `sync-map`.
- **Files:** ingestion from pipeline `sync-map`/segment frontmatter, per-edition routing, hreflang, tests.
- **Risk:** high (ingestion architecture + i18n SEO).
- **Tests:** pairing by `canonical-id`; references excluded from public reader; hreflang; maturity matrix.
- **QA:** per-book; the maturity matrix dashboard.

---

## 9. Risks and open decisions

### 9.1 Risks

- **`local-books/` absent / builder regeneration blocked.** The website cannot regenerate book leaves
  locally (gitignored source). Foundation slices must work from **committed** website data + the pipeline
  manifest, not from re-running book builders (the same constraint that shaped `reading-nav`/`footer:false`
  slices).
- **Dual source of truth.** The website hand-authors `src/literatura/*` (display-only frontmatter) while
  the pipeline owns the real model. Without converging on a single ingestion path (the bridge manifest),
  the two schemes drift permanently — the nav already shows the symptom (17 legacy + 1 pipeline-aligned
  book). **The model must actually be *fed*, not just defined.**
- **Canonical / frontmatter / SEO breakage.** Changing slugs, removing concatenation, or moving to
  segment grain can break canonical URLs, sitemap, search, `reading-nav`/`sidebar-nav`, and internal
  links. Every such move must be atomic + tested (§2.7, §6).
- **Performance at hundreds/thousands of segments.** Angústia (806), Confissões (453), Jung (222). The
  hub/overview must paginate/condense by `segment-index` and never render thousands of open rows; the
  manifest must stay lean (ids + ordering + state, **no prose**).
- **Docs-file-tree aesthetics.** The single biggest failure mode: an exhaustive collapsible tree. The
  overview is a *map*, not a tree (§5, §7).
- **Public-domain-only bias.** A model that works only for finished public-domain literature but breaks
  the active translation workflow (original↔pt pairing, reference editions, review/reading state) would
  be a regression. The model must be **translation-first**, carrying edition role, pairing, and state —
  not just a chapter list.
- **Review/reading state are two state machines.** `updated-at` (edit) vs `read-at` (reading, Kairos-only)
  drive *due-for-re-reading*; `==highlights==` (reader quotes) must never be conflated with
  `needs-review` flags; durable review knowledge sometimes lives in dossiers, not segments.

### 9.2 Open decisions

- **Bridge id contract:** add a durable `uid` per segment (in addition to `canonical-id`)? (§4.4 Q2 —
  lean yes.)
- **Where review state lives for the app:** structured per-segment projection + per-book review-log
  artifact, with the website consuming only the projection. (§4.4 Q1 — lean yes.)
- **Thin-content strategy for fine works:** chapter-rollup canonical vs `noindex` fine leaves vs length
  threshold (§6.2) — decide per `segment-kind`.
- **`segment-kind` enum source of truth:** the website must use the **union** of `frontmatter-policy.md`
  + live values (`semantic-section`); should the policy doc be updated upstream? (Pipeline decision —
  flag, don't fix here.)
- **Karamázov — original↔pt consumption & validation (reframed).** The Russian original is **already
  ingested at segment grade** (105 ru ↔ 105 pt by `canonical-id`, with 4-way alignment QA). This is **not
  a future-ingestion question.** The real open decisions are:
  - *When/how should the website/app consume the already-aligned original↔pt data?* (Recommend: after
    the bridge manifest exists and supports the edition dimension — Slice e.)
  - *When should Kairos reading/review start using the ru↔pt aligned structure?* (Reading-review has not
    begun for Karamázov; a workspace decision, not a website one.)
  - *Do we need additional app-ready export fields before exposing it?* (Likely: `edition-role`,
    reference-witness links, and the pairing projection — define in Slice a.)
  - *Should Karamázov be the validation case for multi-language segment pairing in the manifest?*
    **Recommend: yes** — it is the richest already-aligned multi-edition case (Russian source + canonical
    pt + two pt references + mixed granularity), making it the ideal stress test for the manifest's
    pairing contract.
- **Confissões as the fine-granularity validation case** for the overview/zoom-out at maximum leaf
  density (decide alongside Karamázov whether to validate fine + coarse together).

---

## 10. Recommendation

### 10.1 Smallest safe next slice

**Build the richer segment manifest first (Slice a) — not the Memórias UI.** A generated, app-ready
`segment-manifest` (the bridge layer) that carries `canonical-id`, ordering, granularity, per-edition
pairing, and per-book maturity, built from committed website data with a defined path to the pipeline
`sync-map` — **with no visible UI change.** This is the data-foundation analogue of Slice 2A
(`sidebar-nav.json`): low-risk, idempotent, testable, and it is the thing every later slice depends on.

### 10.2 Manifest first, or Brás Cubas first?

**Manifest first.** Three reasons:

1. **Identity before UI.** Building the Brás Cubas hub before a durable segment id would hard-wire the UI
   to today's older `BB-PP-CCC` slugs — the exact "treat current URLs as canonical identity" trap §2.7
   warns against. The manifest establishes `canonical-id` as identity *before* anything renders against it.
2. **The model already exists; the gap is consumption.** The expensive thinking (the segment schema) is
   done in the pipeline. The high-leverage move is to *bridge* it, not to draw a hub against a model the
   site can't yet address.
3. **It de-risks every later slice.** The hub (b), the concatenation removal (c), the zoom-out (d), and
   paired editions (e) all read the manifest. Get it right once.

Brás Cubas is the **first UI target (Slice b)** and the primary stress test — but it comes *after* the
manifest, validated alongside Confissões (fine) and Karamázov (coarse/paired).

### 10.3 Do-not-implement boundary

**This is an assessment. Do not implement any of it yet.** No `segment-manifest`, no `WorkContents`
component, no concatenation removal, no frontmatter edits, no builder changes, no `page:true`, no
`node_modules` patches, and no edits to `skepvox-book-pipeline` or the `kairos` vault. The next step is
review of this document; implementation begins only with an explicit go-ahead, starting at Slice a.

---

## 11. Future Feature — AI Reading Companion (deferred)

> **Deferred — beyond current scope.** This is a *mature-version* product note, not near-term work. It
> belongs only **after** the reading-app foundations (segment manifest, authored work map, local/user
> reading state) **and** an auth/user + backend phase exist. **No AI/chat UI now, no backend now, no
> auth now.** It is recorded here because it is the natural culmination of the identity and pairing
> foundations this assessment defines, and because designing those foundations well now keeps this door
> open later.

### 11.1 Perspective — a quiet scholar beside the text

In the mature version of skepvox, once the segment manifest, authored work map, reading state, auth, and
backend are in place, the app may offer a **quiet AI reading companion scoped to the current
segment/trecho**. It is explicitly **not** a generic chatbot bolted onto the page. The product idea is
that, while reading a segment, the reader can ask about *this passage*:

- the original-language passage;
- the canonical Portuguese version;
- the translation choices made (and **why** a given rendering was chosen);
- difficult vocabulary or syntax;
- references and context;
- the nearby segments;
- how this segment fits the work's larger authored structure.

The tone is **"a quiet scholar beside the text"** — calm, literary, contextual. Not a generic chatbot,
not gamified, not noisy. It should feel like an extension of the reading surface, never a separate app
mode shouting for attention.

### 11.2 Architecture direction — skepvox provides the AI (preferred)

| Model | Verdict | Why |
|---|---|---|
| **1. Bring-your-own API key** | Not preferred | Technically feasible, but awkward and insecure for mainstream readers (client-side key handling) and far from a polished experience. |
| **2. skepvox-provided AI via its own backend/API account** | **Preferred (mature path)** | Best UX (no setup); lets the app control the **context bundle, prompts, cost limits, privacy, caching, moderation, and model choice**. The reader just reads and asks. |
| **3. Deep-link out to ChatGPT/Claude** | Interim bridge only | Useful as an early, zero-backend stopgap (hand the reader a prepared prompt/link), but not a true integrated reading experience. |

**Option 2 is the target.** Under it, model choice is a backend concern — defaulting to a current,
top-tier model — and never requires storing API keys client-side. Option 3 is acceptable only as a
transitional bridge before the backend exists.

### 11.3 Why this depends on the foundations we are building now

The companion is only feasible — and only *calm* — because the segment model gives it a precise,
bounded context to reason over. It ties directly to:

- **stable `canonicalId`** — the key the backend resolves to assemble context;
- **the `segment-manifest`** — the index of what exists and how it is ordered;
- **original ↔ canonical-pt pairing** (by `canonicalId`) — so it can discuss source vs translation;
- **`editionRole` + reference editions kept separate** — references inform answers but are never
  presented as the canonical text, mirroring the reading surface's witness-not-shelf rule;
- **`groupPath` / authored structure** — so it can answer "how does this fit the work?";
- **reading state** — so it knows where the reader is (and, later, what they have read/noted);
- **the later auth/user model** — to scope per-user state, history, and cost;
- **backend retrieval of the segment bundle** — the assembly step below.

### 11.4 Target context bundle

Given the current `canonicalId`, the backend retrieves a bounded **segment bundle** to ground the
companion (retrieval-augmented, not free-floating):

- the current **canonical pt** segment;
- the paired **original-language** segment;
- **permitted reference editions or excerpts** (gated, attributed, never presented as canonical);
- the **`groupPath` / location** in the work;
- **surrounding segments** when useful (prev/next context);
- **translation-style notes / glossary / review decisions** where available (the pipeline's
  `docs/translation-style/*` + review metadata, projected through the bridge layer — never raw);
- **user reading state / notes** (later, once the user model exists).

The companion answers from this bundle, with the original/canonical/reference distinction preserved, so
its replies stay faithful to the same edition discipline the reader sees on the page.

### 11.5 Constraints (explicit)

- **Not near-term.** No AI/chat UI, no backend, no auth in current scope.
- **No client-side API keys** for the preferred path (Option 2); keys live only server-side.
- It is sequenced **after** the reading-app foundations and the auth/user phase — well beyond Slice e.
- **Tone is load-bearing:** quiet scholar beside the text — calm, literary, contextual; never a generic
  chatbot, never gamified, never noisy.
