# Multilingual Book URL Architecture — Assessment

**Subject:** the public URL shape for foreign-language books that ship as multiple editions (a
source/original edition and, usually, a Portuguese edition) in `skepvox-website`, before we scale
beyond *Introduction à l'ontologie*.

**Method:** doc-only. No routes, generators, components, redirects, or tests were changed. Claims
about the current system are grounded in the live repo (`path:line`). The design reasoning was
pressure-tested with a four-lens panel (SEO/IA, app-architecture, scale, reader mental model); where
the lenses disagreed, the disagreement is reported, not smoothed over.

---

## 0. Frame and constraints

- **Identity is internal, route is presentation.** `canonicalId` is identity; `segmentPrefix` is the
  cross-edition pairing + global order key; the public route is presentation only and is *never* a
  join key. This is the book-pipeline's own stated policy
  (`.vitepress/theme/data/pipeline-export/work-index.json` `routePolicy`).
- **The UI is globally pt-BR.** `config.ts:265` sets `lang: 'pt-BR'`; all chrome/i18n labels are
  Portuguese. The audience is pt-BR readers reading foreign-language originals plus their Portuguese
  translations. **The site is not UI-localized per language** — a fact that decides Family A below.
- **Legacy URL preservation is not a requirement this phase.** Old URLs may 404; redirects are not a
  constraint and the recommendation does **not** design around them. §7 only states what would be
  deleted/regenerated.
- **The work identity is keyed on the source title.** `workId =
  louis-lavelle/introduction-a-l-ontologie` — the source-language book slug. The pt edition is an
  *edition of that work*, not a separate work. Any URL shape that makes the pt title look like a
  distinct work is wrong by this rule.
- **Scale target:** many authors, many source languages (French, Russian, Latin, German, Greek, …),
  usually source + pt, sometimes read-only reference editions. The model must avoid per-language
  special cases.

### What exists today (current state, cited)

- **The live shape is essentially Family D, emitted natively by the pipeline.** Each work has an
  `editions[]` array; each edition carries its own `routePrefix`/`routeSlug`
  (`work-index.json`): fr (source) → `louis-lavelle/introduction-a-l-ontologie`; pt (canonical,
  `default:true`) → `louis-lavelle/introducao-a-ontologia`. The leaf formula is
  `routePath = routePrefix + '/' + {segmentPrefix}-{publicSlug}` (verified across all segments). For
  shared prefix `00-01-001-002`: pt `…/introducao-a-ontologia/00-01-001-002-paragrafo-1`
  (`publicSlug:"paragrafo-1"`, `urlStability:"stable"`); fr
  `…/introduction-a-l-ontologie/00-01-001-002-paragraphe-1` (`publicSlug:null` → provisional
  `displaySlug`, `urlStability:"draft"` — **the fr edition is not yet published as a stable route**).
- **`segmentPrefix` is identical across editions; `publicSlug` is the per-edition, own-language frozen
  leaf.** This is the whole basis of edition pairing and "switch to the original" — and it is a
  *data* relationship, independent of URL shape.
- **Author/section hubs are hand-authored, not data-driven.** `src/louis-lavelle/index.md` imports a
  hand-curated `works.json` and renders two static `<CardGrid>` blocks (`translationsPt`,
  `frenchOriginals`); the card model (`theme/components/cards.ts`) has **no `language`/`editionRole`
  field**, so a real "all / originals / Portuguese / specific-language" filter **cannot exist today**
  without making the hub read `editions[]`. `literatura/<author>/<work>/<chapter>` is a separate,
  fully hand-authored corpus with none of the pipeline machinery.
- **SEO mechanics any shape must satisfy:** `cleanUrls:true`; the sitemap drops deep chapter routes
  via `isChapterRoute` (`config.ts:170-175`: `literatura` length ≥ 4, `louis-lavelle` length ≥ 3 are
  pruned) while keeping hubs; `<html lang>` is set **from `frontmatter.language`, not from the URL**
  (`config.ts:440-465`); canonical/`og:url` are hand-set in hub frontmatter (the pt hub sets none and
  correctly inherits pt-BR). `docs/public-url-convention.md` is referenced by the pipeline but lives
  in the pipeline repo, not here.

Two consequences fall straight out of these facts and recur below:

1. **Language already lives in data and in `<html lang>`, never in the path.** Putting language into
   the path duplicates a signal we already carry correctly elsewhere — and risks contradicting it.
2. **Path depth interacts with the sitemap rule.** Adding a language *level* under `louis-lavelle`
   pushes edition hubs from depth 2 to depth 3, where `isChapterRoute` would prune them from the
   sitemap. A shape with no extra level needs no `isChapterRoute` change; a container shape does.

---

## 1. The five families, scored

| Family | Mental model | Author-hub filtering | Work identity / pairing | SEO / sitemap | Future app | Scale (special cases) |
|---|---|---|---|---|---|---|
| **A** `/fr/…` `/pt/…` (locale-first) | **Bad** — `/fr/` reads as *French UI*; the UI is pt-BR | ok (path facet) but on a lying token | ok slug-share, wrong axis | **Weak** — locale-signal contradiction | weak | weak (source==pt, refs have no slot) |
| **B** `/author/fr/work/…` | mixed — "author partitioned by language" | **Strong** (path facet) | weak — work split across lang subtrees | ok | ok− (edition above work) | weak (source==pt collapses a level; refs need a 2nd pt key) |
| **C** `/author/work/fr/…` (container+edition) | **Strong** (author/work/edition/segment) | ok (must read into data) | **Strong** (visible cluster) | ok, **but prunes edition hubs**; reintroduces `/pt/` locale smell | **Strong** (switch = swap last token) | ok→weak (container forces a source-vs-pt URL choice per work) |
| **D** per-edition title (current) | **Strong** & bookish; no false locale | needs data-driven hub (no path facet) | **weak in the URL**, clean in data | **Strong** (unique, self-describing, `<html lang>` already right) | weak *from the route alone* | **Strong** (zero URL special cases) |
| **E** = **D + hub/metadata spine** (recommended) | **Strong** | **Strong** (data filters) | **Strong** (hub + `<head>` cluster; identity in data) | **Strong** | **Strong** (switch via `segmentPrefix`) | **Strong** |

### A — Locale / language-first `/fr/…`, `/pt/…`

**Mental model:** the path's first token is the universal convention for *site UI locale*. Here it
would mean *edition language* on a site whose chrome is always pt-BR — a lie the URL tells to every
reader and crawler. The canonical pt edition is demoted to `/pt/`, reading as "the localized fork."

**Author hub:** language becomes the top-level facet, but it *fragments each author* across
`/fr/louis-lavelle/` and `/pt/louis-lavelle/` — the author is no longer one place. Paired editions
live in different top-level trees.

**Identity/pairing:** sharing the work slug under both prefixes *could* help pairing legibility, but
at the cost of the locale lie. **SEO:** worst of the five — `<html lang>` per edition plus a `/fr/`
path implies a French-locale site section that does not exist, polluting per-locale reporting.
**Reject A.** (Per the brief: do not adopt `/fr/` as a locale unless we explicitly localize the UI —
we do not.)

### B — Author → edition language `/louis-lavelle/fr/introduction-a-l-ontologie/…`

**Mental model:** "this author, in French." Cleaner than A because language scopes the author, not the
site — but it still reads as *the author is partitioned by language*, which is nonsense for a
translated corpus (the author wrote in one language; we publish editions).

**Author hub:** **B's one real strength** — `/louis-lavelle/fr/` is a literal, crawlable "all French
editions by this author" facet. **Identity/pairing:** the work container is *virtual* — the two
editions of one work sit in different language buckets (`/fr/intro…` vs `/pt/introducao…`) joined only
by convention; there is no single work node. **Scale:** the language level needs special cases — when
source == pt there is no `/fr/` sibling, and a second pt edition (`pt-petra`) has no clean slot at a
level that is supposed to be "language." Net: B trades work-cohesion for a filter facet we can get
from data anyway.

### C — Work container → edition `/louis-lavelle/introduction-a-l-ontologie/fr/…`

**Mental model:** the most *semantically honest tree* — author / work / edition / segment. The edition
token sits exactly where edition belongs, **under** the work, so `fr`/`pt` cannot be misread as site
locale (position disambiguates). This is C's genuine strength and the reason the app-architecture lens
favours it.

**Identity/pairing:** **strongest of all** — both editions visibly share one container; "one work,
many editions" is legible in the address bar; edition switching is a single last-token swap.

**The cost (decisive):**
1. **The container needs one slug, but a work has two titles.** Key it on the *source* slug (to honour
   identity) and the pt reader — the primary audience — reads their canonical edition under a foreign
   container: `/louis-lavelle/introduction-a-l-ontologie/pt/…`. Key it on the *pt* slug and you make
   the translation masquerade as the work's identity and orphan the source — breaking the north star.
   There is no free choice. For non-Latin sources the source-slug container is *opaque*:
   `/dostoievski/bratya-karamazovy/pt/…`, `/carl-jung/das-ich-und-das-unbewusste/pt/…` — a pt reader's
   URL is dominated by a transliterated-Russian or German string they cannot read.
2. **It smuggles identity into the route.** Picking the container slug is a per-work source-vs-pt *URL
   decision, forever* — exactly the coupling the policy forbids ("route is presentation, not
   identity").
3. **It breaks the sitemap depth rule.** Edition hubs land at `louis-lavelle` depth 3, where
   `isChapterRoute` prunes them — so the actual reading-entry pages drop out of the sitemap unless the
   rule is rewritten. The `/fr/`,`/pt/` terminal tokens also re-import a faint locale smell.

C is the best whiteboard model and the worst fit for a pt-first product whose identity is source-keyed
and whose UI never localizes.

### D — Per-edition title, no language level (current/live)

**Mental model:** the strongest *reader* experience. The pt reader gets
`/louis-lavelle/introducao-a-ontologia/…` — a fully Portuguese URL, no foreign container, no `/pt/`
demotion, no machinery. Because there is **no language token at all, the locale-vs-edition collision
is structurally impossible**, and `<html lang>` is already correct per edition from frontmatter.

**SEO:** strongest — every URL is unique, human-readable in its own language, and the sitemap rule
already keeps edition hubs (depth 2) and prunes leaves (depth 3) with no change.

**Scale:** strongest — the route encodes no identity, language, or join, so **no URL special case can
arise**: source == pt is one edition with two roles; 3+ editions and reference editions are just more
rows in `editions[]`. It is the shape the pipeline already emits.

**The one real weakness:** in the URL alone, `introducao-a-ontologia` and `introduction-a-l-ontologie`
look like *two separate works*. The "one work, many editions" relationship is invisible in the path —
it lives in `canonicalId`/`segmentPrefix` and would need to be *shown* somewhere. And edition
switching / AI bundles have no URL-level "work" handle. This is exactly what C solves and D does not —
**at the route layer.**

### E — Recommended hybrid: D's routes + an explicit hub & metadata spine

E keeps **D's per-edition leaf routes verbatim** (already live, already clean, pipeline-native, no
locale lie, zero special cases) and **adds the work↔edition relationship as structured nodes and
`<head>` metadata**, repairing D's only weakness *where it belongs* — at the hub and in the head, not
in the path:

1. **Shared identity in data:** `segmentPrefix` (pairing/order) + `canonicalId`/`workId` (identity)
   already bind the editions. Nothing to add.
2. **A data-driven author hub** that reads `editions[]` and offers real filter facets — `all /
   originais / em português / por idioma` — from `language` + `editionRole`. (Today's hand-authored
   `CardGrid` cannot do this; promoting it is the substantive new work.)
3. **One work-card per `workId`** on the author hub, listing/pairing its editions (default = the pt
   canonical) — so a human *sees* "one work, two editions" on the page they actually browse, instead
   of squinting at slugs.
4. **An edition switcher + `<head>` reciprocity on the edition hubs/leaves:** each edition page links
   its siblings (computed from `editions[]` of the same `workId`) and emits `rel=canonical` (self) +
   `rel=alternate hreflang` for each edition — the standard, path-agnostic way to cluster editions
   for search. hreflang does **not** need shared path ancestry; it is a `<head>` relationship across
   arbitrarily-named URLs.

E concedes C's single real advantage (the URL does not self-document pairing) and recovers it at the
hub + head layer, while keeping every reader's URL clean and paying no language-token tax.

---

## 2. Segment route shapes across the four stress works

`segmentPrefix` is **shared** across a work's editions (the pairing/order key the reader never sees);
`publicSlug` is the **per-edition frozen leaf, in that edition's own language**. (`displaySlug` is the
pipeline's *provisional* pre-publication slug, used only until `publicSlug` is frozen; the fr edition
is still in that provisional state today.)

**Recommended shape (E = D): `/{authorSlug}/{edition.routeSlug}/{segmentPrefix}-{publicSlug}`**

| Work (source → pt) | Source edition leaf | pt edition leaf |
|---|---|---|
| Lavelle — *Introduction à l'ontologie* (fr→pt), prefix `00-01-001-002` | `/louis-lavelle/introduction-a-l-ontologie/00-01-001-002-paragraphe-1` | `/louis-lavelle/introducao-a-ontologia/00-01-001-002-paragrafo-1` |
| Dostoiévski — *Os Irmãos Karamázov* (ru→pt), prefix `02-01-001-001` | `/fiodor-dostoievski/bratya-karamazovy/02-01-001-001-glava-1` | `/fiodor-dostoievski/os-irmaos-karamazov/02-01-001-001-capitulo-1` |
| Agostinho — *Confissões* (la→pt, paragraph-level), prefix `08-001-001-007` | `/agostinho/confessiones/08-001-001-007-paragraphus-7` | `/agostinho/confissoes/08-001-001-007-paragrafo-7` |
| Jung — *O Eu e o inconsciente* (de→pt), prefix `00-02-005-003` | `/carl-jung/das-ich-und-das-unbewusste/00-02-005-003-abschnitt-3` | `/carl-jung/o-eu-e-o-inconsciente/00-02-005-003-secao-3` |

Notes that the shape makes obvious:
- **The pt reader's URL is always fully Portuguese** (`os-irmaos-karamazov`, `confissoes`,
  `o-eu-e-o-inconsciente`) — never a transliterated-Russian or German container. This is the decisive
  win over any container family for a pt-first audience.
- **`segmentPrefix` is byte-identical between the two rows of each pair** — so "switch to the
  original" is a data lookup (same `workId`, same `segmentPrefix`, sibling edition's `publicSlug`),
  not a URL operation. The route never needs a language token to support switching.
- **Non-Latin / classical sources need a romanized source `routeSlug`** (`bratya-karamazovy`,
  `confessiones`, `das-ich-und-das-unbewusste`). This is a *source-edition* slug, in the source's own
  conventional Latin transliteration; it never contaminates the pt reader's path. (The exact
  transliteration and `authorSlug` spelling — e.g. `fiodor-dostoievski` vs `fyodor-dostoevsky` — are a
  pipeline naming decision, not a URL-architecture one.)

**How the rejected families would render the same leaf** (Karamázov pt, prefix `02-01-001-001`):
- A: `/pt/fiodor-dostoievski/os-irmaos-karamazov/02-01-001-001-capitulo-1` (false locale prefix)
- B: `/fiodor-dostoievski/pt/os-irmaos-karamazov/02-01-001-001-capitulo-1` (author split by language)
- C: `/fiodor-dostoievski/bratya-karamazovy/pt/02-01-001-001-capitulo-1` (pt edition under a
  transliterated-Russian container; edition hub pruned from sitemap at depth 3)
- D/E: `/fiodor-dostoievski/os-irmaos-karamazov/02-01-001-001-capitulo-1`

---

## 3. Search, sitemap, SEO (cross-cutting)

- **Cleanest to index:** D/E. Every URL is unique and self-describing; `<html lang>` is already set
  per edition from `frontmatter.language`; no path token contradicts the locale signal.
- **Duplicate/confusion risk:** lowest in D/E (slugs literally differ; no work-under-foreign-title
  pages). A is worst (locale contradiction); C carries a mild "pt page under a fr/ru/de container"
  smell.
- **Canonical / hreflang relationship (conceptual, not necessarily built now):** model each work as a
  cluster of editions bound by `workId`. Every edition page emits `rel=canonical` to *itself* (only
  `urlStability:'stable'` routes are canonical/indexed) and `rel=alternate hreflang="<lang>"` to each
  sibling edition (`fr`/`pt`/`ru`/…), plus `hreflang="x-default"` pointing at the default (pt
  canonical) edition. Reference editions (`pt-petra`) are excluded from reciprocity (read-only, not a
  canonical alternate). **This clustering is a `<head>` relationship and needs no shared path
  ancestry** — which is precisely why D/E loses nothing by not encoding language in the path.
- **Sitemap depth:** D/E keeps edition hubs at `louis-lavelle` depth 2 (kept) and leaves at depth 3
  (pruned) under the *existing* `isChapterRoute` rule — no change. C/B push edition hubs to depth 3
  and would silently prune the reading-entry pages from the sitemap unless the rule is rewritten.
- Redirects are out of scope this phase (§0); none of the above depends on them.

---

## 4. Future app behavior

- **iOS-like reader shell, edition switching, progress, AI bundles** all key on **identity, not
  presentation**: the right localStorage / context-bundle key is `canonicalId` + `segmentPrefix`
  (e.g. `louis-lavelle/introduction-a-l-ontologie#00-01-001-002`), which is **edition-independent** —
  progress and "where am I" survive an edition swap for free, in *any* URL shape, because the pairing
  is `segmentPrefix`. The owned reader components already namespace local state on `workId`
  (see the existing `skepvox:pwc:{workId}:{language}` collapse-state key) rather than on the route.
- The app-architecture lens's case for a `/{lang}/` token (so switching is "swap the last segment") is
  real but **redundant**: switching already resolves through `segmentPrefix` in data, and a route
  token would put a *presentation* string on the critical path of an *identity* operation — the
  failure mode the policy warns against (a future dev keying progress on `/fr/` vs `/pt/`).
- **"This work in all editions" for an AI companion** is a query over `editions[]` of one `workId`
  (data), not a URL glob — and it should be, because the bundle must be keyed on `canonicalId` to be
  stable across editorial re-titling.
- **Least likely to be regretted:** D/E. It puts nothing language- or identity-shaped in the URL, so
  no future app feature inherits a path decision it has to fight. The app gets its addressable "work"
  and "edition" as **data** (`workId`, `editions[]`), which is where they are already canonical.

---

## 5. Migration impact (no redirect design; what is deleted/regenerated)

Because the recommendation **keeps the current per-edition shape**, the migration is small:

- **pt canonical family — unchanged.** `/louis-lavelle/introducao-a-ontologia/…` (hub + 99 stable
  segment routes) stays byte-for-byte. No regeneration, no churn for the live, indexed edition.
- **Old fr edition — deleted and regenerated.** The hand-authored fr full-text hub + 12 fr chapter
  pages under `/louis-lavelle/introduction-a-l-ontologie/` are **retired** and replaced, when the fr
  edition is promoted `draft → stable` (it currently has `publicSlug:null`), by a proper per-edition
  pipeline route family at `/louis-lavelle/introduction-a-l-ontologie/{segmentPrefix}-{publicSlug}`
  (99 fr segments, generated the same way the pt family is). Old fr URLs may 404 in the interim (§0).
- **Author hub — regenerated as data-driven.** `src/louis-lavelle/index.md` moves from hand-split
  `works.json` cards to a `CardGrid`/list fed by `work-index.json` `editions[]`, so the `all /
  originais / em português / por idioma` filters become possible. (This is an *enhancement* the shape
  enables, not a precondition of it.)
- **No `isChapterRoute`/sitemap change required** (D/E preserves depth). Had we chosen C, this rule
  would also need rewriting to stop pruning edition hubs.
- **Reference editions** (`pt-petra`, …): added later as additional `editions[]`/`referenceEditions[]`
  rows with their own own-language `routeSlug`; no structural change.

---

## 6. Recommendation

**Adopt Family E: keep D's per-edition self-describing routes (no language path token), and add the
work↔edition relationship as a data-driven author/work hub plus `<head>` canonical/hreflang
clustering.** Identity stays source-keyed in data; the route stays pure presentation.

**The strongest argument against it.** D/E refuses to encode the work in the path, so the address bar
does **not** self-document that `introducao-a-ontologia` and `introduction-a-l-ontologie` are one
work. A reader scanning raw URLs, and an app that wants to pivot editions "by route," get no
URL-level work handle — exactly what Family C delivers cleanly. If "one work, many editions" must be
legible *in the URL itself*, choose C.

**Why E still wins.** The one-work relationship is, by the system's own policy, a *data + hub +
metadata* concern, not a *path* concern — "route is presentation, `canonicalId` is identity." Family C
buys URL-level legibility by paying three structural costs that compound at scale: a per-work
source-vs-pt slug decision baked into the route forever (the precise "Portuguese title as a separate
work" coupling we are told to avoid); a foreign or transliterated container over every pt reader's
path (`bratya-karamazovy/pt`, `das-ich-und-das-unbewusste/pt`); and a sitemap-depth break that prunes
the reading-entry pages. D/E pays none of these and recovers C's only real benefit at the hub (a
work-card that shows both editions) and in `<head>` (hreflang reciprocity). The benefit C claims for
the app — edition switching, progress, bundles — is delivered by the shared `segmentPrefix` in data
regardless of URL shape. So E concedes nothing it actually needs and avoids every special case as the
corpus grows to many authors and source languages.

### Route-convention spec

```
Author hub    /{authorSlug}/
              Data-driven (reads work-index.json editions[]). One card per workId,
              showing the work's editions (default = pt canonical). Filter facets:
              all | originais (editionRole=source) | em português (language=pt) |
              por idioma (language=fr|de|ru|la|…). Language is NEVER in the path.

Work hub      (no standalone language-neutral container URL — deliberate)
              The "work" is a logical group keyed on workId, surfaced as the
              author-hub card. If a single group key is ever needed (search-index
              grouping, breadcrumb root, AI bundle id), it is the SOURCE slug, kept
              as a DATA key — not a routed page. This is what keeps the pt title
              from masquerading as the work and avoids the container's title tax.

Edition hub   /{authorSlug}/{edition.routeSlug}/
              The per-edition reading entry (the owned contents map). routeSlug is
              the edition's own-language frozen slug (= editions[].routeSlug). Hosts
              the edition switcher (siblings via same workId) and emits rel=canonical
              (self) + rel=alternate hreflang for each edition + x-default → pt.

Segment leaf  /{authorSlug}/{edition.routeSlug}/{segmentPrefix}-{publicSlug}
              segmentPrefix = shared cross-edition pairing/order key (never shown as
              identity, but stable in the path for ordering + debuggable pairing).
              publicSlug = per-edition frozen own-language leaf. Only
              urlStability:'stable' leaves are indexed/canonicalized.
```

### Naming rules — source title vs Portuguese title

1. **Identity always uses the source-language slug.** `workId`, `canonicalId`, and any work group key
   are the source title slug (`introduction-a-l-ontologie`, `bratya-karamazovy`, `confessiones`,
   `das-ich-und-das-unbewusste`). The pt title is never the work's identity.
2. **Each edition's `routeSlug` uses that edition's own language.** Source edition → source-language
   slug; pt edition → Portuguese slug; a Cyrillic/Greek source → its conventional Latin
   transliteration. **Never force one language's title onto another edition's route**, and **never put
   a `/fr/`,`/pt/`,`/de/` token in the path** — edition language is carried by the slug's own language
   and by `<html lang>` (`frontmatter.language`).
3. **`source == pt`** (a Portuguese-original work): one edition carries both `source` and `canonical`
   roles, one route, no empty language slot — no special case.
4. **Reference editions** (`referenceEditions[]`, e.g. `pt-petra`): own-language `routeSlug` with a
   same-language disambiguating suffix (`…-petra`) only if published as readable; `editionRole:
   reference`; excluded from hreflang reciprocity.
5. **Default landing:** the pt canonical edition is `default:true`; the author-hub work-card and any
   future bare-work affordance point at it.

---

## 7. Next implementation prompt (do not implement here)

> **Slice: data-driven author hub with edition/language filters (Family E, no route changes).**
> Work on `develop`, no branch. Keep the current per-edition route shape (Family D leaves); do **not**
> add a language path token, do **not** move the live pt routes, do **not** add redirects.
>
> 1. **Author-hub data source.** Make `src/louis-lavelle/index.md` render its work cards from
>    `work-index.json` `editions[]` (via an owned component), not the hand-split `works.json`. One
>    card per `workId`; show the default (pt canonical) title with a quiet "original em <língua>"
>    affordance linking the source edition hub. Keep the existing CardGrid look.
> 2. **Filter facets.** Add accessible filter controls — `Tudo / Originais / Em português / Por
>    idioma` — computed from `editions[].language` + `editionRole`. Filtering is client-side over the
>    data; URLs do not change. Real buttons, `aria-pressed`, keyboard-operable, pointer-gated hover,
>    reduced-motion-safe, on the existing `--sk-*` tokens.
> 3. **`<head>` clustering (conceptual → concrete).** On the pt edition hub and, if cheap, leaves,
>    emit `rel=alternate hreflang` for each edition of the same `workId` plus `hreflang="x-default"` →
>    pt; keep `rel=canonical` self only for `urlStability:'stable'` routes. No change to
>    `isChapterRoute`.
> 4. **Edition switcher.** On `PipelineWorkContents` (and the leaf chrome), add a switcher listing
>    sibling editions of the same `workId`, resolving the matching leaf by shared `segmentPrefix`;
>    persist nothing identity-bearing — local state stays keyed on `workId`/`segmentPrefix`.
> 5. **Tests:** author hub renders one card per `workId`; filters select the right editions; no
>    language token appears in any generated route; hreflang alternates are reciprocal and point only
>    at built `stable` pages; the live pt routes are unchanged; legacy `segment-manifest`/`WorkContents`
>    consumers untouched. Then `pnpm verify`.
> Do **not** promote the fr edition to stable in this slice, do **not** build the Karamázov/Confissões/
> Jung works, and do **not** introduce a routed work-container.

---

### One-line verdict

Keep the route dumb and the data smart: **per-edition, own-language URLs (Family D), with the
one-work-many-editions relationship carried by `workId`/`segmentPrefix`, a data-driven filterable
author hub, and `<head>` hreflang — never by a language segment in the path.**
