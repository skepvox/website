# Owned Reader Shell — Phase Assessment

**Subject:** the next phase for `skepvox-website` — an owned, state-of-the-art reading-app shell
for books, on the current Vue + VitePress (`@vue/theme`) stack.

**Method:** doc-only. No code was changed to produce this. Every load-bearing claim is grounded in
the live repo (config, generator, components, tokens, tests) and the prior assessment series in
`docs/`. Citations are `path` or `path:line`.

**Anchor work:** `louis-lavelle/introducao-a-ontologia` — the just-published pt canonical edition,
a 99-segment route family with a generated work hub.

---

## 0. Operating constraints for this phase

Two constraints frame every recommendation below. They are stated up front because they change what
"good" looks like.

1. **Legacy URL preservation is NOT a requirement this phase.** The site is young and low-traffic;
   it is acceptable for old book URLs to 404 temporarily while the reading model stabilizes. We
   prefer a clean canonical route structure over redirect compatibility, and we do **not** add or
   expand redirect-map work unless explicitly asked. This supersedes the redirect-centric framing in
   `docs/introduction-a-ontologia-live-migration-plan.md §6` and `docs/reading-app-website.md §11
   Open decision A`. The 12 existing `301`s in `src/public/_redirects` may stay, but are not grown.

2. **Identity vs presentation is the spine of the model.** `canonicalId` /`segmentPrefix` is identity
   and the cross-edition join key; `routePath` is presentation (public URL + output filename) and is
   *never* a join key. This is already encoded in the pipeline export
   (`.vitepress/theme/data/pipeline-export/work-index.json` `routePolicy`) and enforced by
   `tests/pipeline-segment-routes.spec.ts`. We assess the reader shell as if building the book app
   from scratch on this identity model.

A consequence of (1): the "retire vs redirect the fr full-text hub" question is downgraded from an
open decision to a simple cleanup we can do whenever convenient (see §9).

---

## 1. Current State

### 1.1 What is live

- **pt hub:** `src/louis-lavelle/introducao-a-ontologia/index.md` — a *generated* Markdown page
  (`generated: pipeline-work-hub`), frontmatter `sidebar: false`, `aside: false`, `outline: false`.
  Its body is a hand-grouped **bullet list**: an `# H1`, then `## Part` / `### Chapter` headings with
  `- [Parágrafo N](/…/routePath)` links for all 99 pt segments. It carries **no prose** — links only
  (verified: `tests/pipeline-work-hub.spec.ts` asserts no segment prose phrase appears on the hub).
- **99 leaf readers:** e.g. `…/00-01-001-002-paragrafo-1.md` — each a generated page
  (`generated: pipeline-segment-routes`) with frontmatter `sidebar/aside/footer/outline: false` plus
  pipeline identity markers (`pipelineCanonicalId`, `pipelineLanguage`, `pipelineSegment`), then a
  `## <chapter>` + `### <displayTitle>` + its own prose. Prose is genuinely **route-level**: each
  segment is its own static page carrying its own body (`scripts/build-pipeline-segment-routes.py`,
  `page_text()` / `_read_prose()`).
- **Owned leaf chrome already exists:** `PipelineSegmentNav.vue` renders prev/next ("Trecho anterior"
  / "Próximo trecho") + an up-link on each leaf. It reads `../data/pipeline-export-segments.json`,
  self-gates on `frontmatter.generated === 'pipeline-segment-routes'`, computes neighbours by `order`
  within the same `language`, and **never crosses editions**. It is injected via the theme's
  `content-top` / `content-bottom` slots (`.vitepress/theme/index.ts:27-37`).

### 1.2 The leak, proven

The hub still renders the **rented `@vue/theme` `VPContentDocFooter` pager** — and it points into a
*different book*.

- `@vue/theme@2.3.0` renders the pager unless the page opts out:
  `<VPContentDocFooter v-if="frontmatter.footer !== false" />`
  (`node_modules/@vue/theme/src/vitepress/components/VPContentDoc.vue:61`; the `footer: false`
  toggle is documented at `…/vitepress/config.ts:54-55`).
- The pager derives prev/next by flattening the **sidebar** for the current path and finding the
  active page (`…/components/VPContentDocFooter.vue:17-27`). The hub route
  `/louis-lavelle/introducao-a-ontologia/` is **not** in the `/louis-lavelle/` sidebar
  (`.vitepress/config.ts:97-123`), so `findIndex` returns `-1`, `next = candidates[index + 1] =
  candidates[0]` — the **first** Lavelle sidebar entry.
- **Built proof:** `.vitepress/dist/louis-lavelle/introducao-a-ontologia/index.html` contains
  `class="next-link" href="/louis-lavelle/de-l-etre"`. The ontology hub advertises **"Próximo → De
  l'être"**, an unrelated work in *La Dialectique de l'éternel présent*.

The leaf pages do **not** leak — `build-pipeline-segment-routes.py:77` already emits `footer: false`
in `page_text()`. The defect is isolated to `build_hub()` (`:121-130`), whose frontmatter omits
`footer: false`.

### 1.3 This is a regression against an existing, tested invariant

The site already retired this pager everywhere else. `docs/sidebar-local-nav-model.md` (Slice 1)
established `footer: false` on *every non-leaf route*, and `tests/doc-pager-retired.spec.ts:22-39`
enumerates representative routes (podcast hub + episodes, literatura section/author/work hubs,
Lavelle hub + work hubs) asserting `VPContentDocFooter` renders on **none** of them — it had
mis-paginated cross-show (Vox Français 003 → Vox Español 001) and cross-author. The freshly generated
pipeline pt hub was simply **never added** to that route set, so it regressed. The fix is to bring the
new hub into an invariant the rest of the site already holds — not to invent policy.

### 1.4 Harmless infrastructure vs reader-experience risk

Distinguishing the two matters, because "VitePress is leaking" is only half true.

| Rented behavior | Verdict | Why |
|---|---|---|
| `@vue/theme` `Layout` + `content-top`/`content-bottom` slots | **Keep — it's the asset** | This is exactly how we inject owned chrome (`theme/index.ts`). Not a leak; the mounting surface. |
| Top navbar, local search, `cleanUrls`, sitemap pruning, consent banner, analytics, markdown→HTML, SSG/hydration | **Harmless infra** | Site-wide plumbing, invisible to the reading surface, no per-work risk. |
| **`VPContentDocFooter` pager** on the hub | **Reader risk — fix now** | Cross-work mis-pagination; the one active leak (§1.2). |
| **Hub contents = a raw markdown `<ul>` bullet list** | **Reader risk — the prototype target** | The "final UI" of the entry point is `vt-doc` bullets, not an owned, collapsible map. Functional, but it is rented document styling standing in for a reader surface. |
| Sidebar / `aside` / outline on hub or leaves | **Already suppressed** | `sidebar/aside/outline: false` in generated frontmatter. No accidental tree today; keep asserting it. |

Net: one active leak (the pager) and one structural gap (markdown list as the hub UI). Everything
else VitePress provides is either harmless or load-bearing.

---

## 2. Stack Verdict

**Keep Vue + `@vue/theme`. No rewrite. There is no technical blocker.**

The prior roadmap already chose this deliberately: **Option B — a skepvox-owned layout layer inside
VitePress — as the default architecture for several quarters**, with Option C (fully owned shell) as
the eventual destination and Option D (native) out of scope absent native pressure
(`docs/product-theme-roadmap-assessment.md:124-138`). Nothing in the reader-shell target changes that
calculus.

**What Vue is genuinely good for here.** The reader shell is mostly *local interactive state over
static structure*: collapse/expand a contents tree, mark the current segment, persist UI preferences,
later overlay a zoom-out map and an edition switch. That is squarely Vue's strength — reactive
component state with SSR + hydration that VitePress gives us for free. The owned components that
already exist (`WorkContents.vue`, `PipelineSegmentNav.vue`, `SkLink.vue`) prove the pattern works:
real components, server-rendered into the static HTML, hydrated for interaction.

**What VitePress constrains (and how we already route around it).** VitePress owns *routing* (one
file = one route) and the *document chrome* (`VPContentDoc` wraps the body with the rented footer /
aside / sidebar). We do not fight this; we suppress per page via frontmatter (`footer/sidebar/aside/
outline: false`) and inject owned chrome via the `content-top`/`content-bottom` slots. The page body
is markdown-rendered — which is exactly why the hub's contents are currently a `<ul>` and why the
prototype's job is to *replace that body region's contents source* with an owned component, not to
replace VitePress.

**Where we must own components rather than rent document behavior.** Three surfaces are reader
experience, not documentation, and must be owned Vue: (a) the **hub contents map**, (b) the **leaf
reader chrome / prev-next-up** (already owned: `PipelineSegmentNav`), and (c) the future **zoom-out
map** and **edition switch**. Renting `VPContentDoc`'s pager/aside for these produced precisely the
§1.2 leak.

**The blocker test.** A rewrite is justified only by a concrete technical wall. The footer leak is a
one-line frontmatter omission; the markdown-list hub is replaceable by an SSR'd component reading the
same JSON the generator reads. Neither is a wall. **Verdict: customize, do not rewrite.**

---

## 3. Owned Reader Shell Target

The owned surfaces, what exists, and what the phase adds:

| Surface | State today | Target |
|---|---|---|
| **Book hub / contents map** | Markdown `<ul>` (rented doc styling) | **Owned component** rendering collapsible Part→Chapter→Segment from `groupPath`. *This is the proof slice.* |
| **Segment leaf reader chrome** | Owned: `PipelineSegmentNav` (prev/next/up) + route-level prose | Keep; this surface is done for pt. |
| **prev / next / up navigation** | Owned: `PipelineSegmentNav` (by `order`, same-language, never cross-edition) | Keep; reuse the join logic in the contents map. |
| **Zoom-out segment map** | Not built | Same map component as the hub, reused as an in-leaf overlay (a `variant`/`currentId` mode), per the "one map, two entry points" prior decision. Design for it now; build later. |
| **Language / edition switch** | Not built; data ready (export has 99 fr + 99 pt, paired by `segmentPrefix`) | Owned switch keyed by `segmentPrefix` identity. Deferred; keep the contents component `language`-parametrized so fr can adopt the same shell. |
| **Local reading state** | None | v1: collapsed-group state (localStorage, keyed by `groupPath` key — *never* identity). Current segment via `aria-current`. Progress / last-read **deferred** until a durable id + progress model exist; when built, key it on `canonicalId`/`segmentPrefix`, stored locally, no auth. |

**Anti-goals (explicit):** no docs footer pager; no accidental sidebar / `aside` / outline tree; no
markdown bullet-list as the final contents UI; no slug strings shown as visible text; no `<ul>/<ol>/
<li>` for the contents (real `<nav>` + buttons + `SkLink` anchors).

### 3.1 Naming and the data-world boundary — the central architecture decision

There is a real fork here, and the codebase has already taken a strong position the assessment must
respect: **three disjoint data worlds**, kept separate on purpose.

1. `reading-nav.json` → `ReadingNav.vue` (legacy hand-authored leaf prev/next).
2. `segment-manifest.json` → `WorkContents.vue` / `WorkContentsMount.vue` (legacy hand-authored hub
   map; allowlisted today to `louis-lavelle/de-l-acte.md` + `literatura/machado-de-assis/bras-cubas.md`).
3. `pipeline-export-segments.json` → `PipelineSegmentNav.vue` (the **only** component reading pipeline
   data).

The separation is enforced, not incidental: pipeline pages carry a `generated:` marker that
`build-reading-nav.py` skips, they appear in no `works.json`, and `tests/segment-manifest.spec.ts`
asserts `segment-manifest.json` is consumed by **exactly** `WorkContents.vue` + `WorkContentsMount.vue`
and nothing else. **Wiring the existing `WorkContents` to pipeline-export data, or adding a second
consumer of `segment-manifest.json`, would break that exact-consumer test and couple two data
worlds.**

Therefore:

- The user's proposed name **`PipelineWorkContents`** is the right call — and it should be a **new**
  component reading `pipeline-export-segments.json`, gated on the hub marker
  `frontmatter.generated === 'pipeline-work-hub'` (the pipeline analog of how `PipelineSegmentNav`
  gates on `'pipeline-segment-routes'`). This keeps the pipeline family self-contained and the
  legacy `segment-manifest` consumer test green. It also matches the established `Pipeline*` family
  (`PipelineSegmentNav`, `PipelineReaderPreview`, …).
- Do **not** name it `ReaderContents` and do **not** retrofit `WorkContents` for pipeline data in
  this slice. `WorkContents` stays the legacy/hand-authored map.
- **Convergence is a later refactor, not this slice.** The prior decision that "the hub map and the
  reading-leaf zoom-out are the same map and must share one component/model" still holds *as a goal*.
  The clean end-state is a shared presentational core (e.g. `ContentsTree`) fed a normalized
  `{ groups: [{ label, title, segments: [{ id, href, title, ordinal }] }] }` model, with thin
  per-source adapters (`WorkContents` from `segment-manifest`, `PipelineWorkContents` from
  `pipeline-export-segments`). Extracting that core *now* would re-couple the data worlds and bloat
  the proof slice. Build `PipelineWorkContents` first; extract the shared core once a second pipeline
  work exists and the shape has settled.

This is the one place the assessment diverges from the literal prompt wording ("PipelineWorkContents
/ ReaderContents"): the recommendation is a new `PipelineWorkContents` over pipeline data, not a
rename of `WorkContents` and not a new `segment-manifest` consumer.

---

## 4. Performance Model

The target architecture is already proven and should be held as an invariant.

**Metadata for the whole work: load freely.** `pipeline-export-segments.json` is **metadata only —
no prose** (the file's own `note` says so; `build-pipeline-export.py` allowlists `_SEGMENT_FIELDS` so
a body cannot leak). It holds 198 records (99 fr + 99 pt) in ~197 KB; the pt slice an
component needs is ~half that, and the per-segment record is small (`canonicalId`, `displayTitle`,
`groupPath`, `language`, `order`, `routePath`, `segmentPrefix`, `publicSlug`, `urlStability`, …).
Rendering 99 metadata rows — or a few hundred — into a (default-collapsed) tree is trivial. The
"whole-work overview from metadata" pattern is already demonstrated by `PipelineReaderPreview.vue`
(`data-work-count 99`, `data-loaded-count 5`).

**Prose: route-level or windowed — never all-in-one.** Each leaf is its own static page carrying its
own body (§1.1). A single component importing many prose bodies is **forbidden**. This is the hard
line that keeps the reader fast no matter how large the work.

**Stress cases (documented design targets, mostly not yet live):**

| Work | Scale | Shape | Implication |
|---|---|---|---|
| Memórias Póstumas de Brás Cubas | 163 chapter-segments, `groupPath: []` | Flat mode | Long flat list; presentation range dividers ("Capítulos 001–010"), no fabricated authored headers. Also the title-quality-debt case (ch. 053's `displayTitle` is a sentence — fall back to a compact ordinal, never rename the route). |
| Confissões | ~453 paragraph-marker segments | Maximal leaf density | The zoom-out map at extreme density; the thin-content/SEO question. The case that most argues for default-collapse + (later) virtual scrolling. |
| Os Irmãos Karamázov | 105 segments, mixed granularity (incl. `semantic-section`), up to ~9,000 words/segment | Deep + heavy | Multi-language pairing (Russian ↔ pt + `pt-*` refs) validation; heavy individual leaves vindicate route-level prose. |
| Future multi-volume | `groupPath` kinds: `internal-book \| volume \| tome \| part \| chapter \| section \| proposition` | Deep hierarchy | The tree must render N levels from `groupPath` and never flatten authored structure. `segmentPrefix` `BB-PP-CCC-SSS` encodes it; `SSS` is global and never resets per chapter. |

**Virtual scrolling / lazy prose — needed now? No. Later? Maybe.**
- *Lazy prose* is already the model (route-level). Nothing to add.
- *Virtual scrolling* is **not** needed for the ontology (99 metadata links) and not for the proof
  slice. It becomes worth considering only when a *single expanded* list pushes many hundreds of
  visible anchors on a low-end phone (Confissões 453). **Default-collapsing large works** so only
  Part/Chapter headers render until expanded defers that need for a long time — though it only
  defers, not eliminates: a user who expands every chapter of a 453-segment work still materializes
  the full list. Recommendation: build the
  tree default-collapsed for large works now; revisit virtualization only if a real device shows jank
  on an expanded fine-grained work.

**Performance guard (make it a test):** the hub HTML must contain segment **metadata/links only, no
prose bodies**. `pipeline-work-hub.spec.ts` already asserts no segment prose phrase appears on the
hub; keep and extend that for the owned component.

---

## 5. UI / Interaction Standard

"iOS-like" here means a *standard*, not an Apple imitation. It is achievable today because the owned
`--sk-*` token system already carries most of it (`.vitepress/theme/styles/vars.css`).

**Quiet hierarchy.** Warm surfaces, not pure white/black: light `--sk-surface #fcfcfa` on ink
`--sk-text #213547`; dark `--sk-surface #181510` ("reading by lamplight, not a terminal") on warm
ivory. The `displayTitle` leads; the ordinal is faint (`--sk-text-faint`). No badge walls, no
decorative chrome. Reuse `--sk-text` / `-body` / `-muted` / `-faint` for the contents tiers.

**Fluid local state.** Collapse/expand animates with `--sk-motion-base` (200ms) + `--sk-ease`
(`cubic-bezier(0.4,0,0.2,1)`); ARIA state flips instantly; localStorage persistence is silent. State
should feel immediate and never block on layout.

**Clear navigation.** prev/next/up always legible on leaves (`PipelineSegmentNav`); an "up to
contents" path from every leaf; the contents map as the spine of the work. One obvious way back.

**No docs artifacts.** `footer: false`; no sidebar/`aside`/outline; contents are a real `<nav>` of
buttons + `SkLink` anchors, **never** a `vt-doc` `<ul>`.

**Touch-safe targets.** Today only the navbar appearance switch guarantees a 44px hit area
(`pages.css`); general buttons/links have **no** enforced minimum. The new contents component must set
a ≥44px touch target on collapse buttons and segment rows (min-height / padded hit area), mobile-first.
This is a real, citable gap to close, not a nicety.

**Restrained motion.** Chevron rotation + region reveal via the `--sk-motion-*` tokens only — color/
opacity/transform, never layout jump. `prefers-reduced-motion: reduce` is honored globally
(`utilities.css`), and the component's own transitions must fall under that floor too.

**Polished light/dark.** Reuse the `.dark` token stack (warm, lifted accent `--sk-accent #8fb3df` in
dark); Literata stays scoped to prose only (`pages.css`), chrome stays sans. The contents map is
chrome → sans.

**Accessibility requirements (hard contract — mirror the existing `WorkContents` contract, do not
reinvent):**
- Collapsible groups are **real `<button type="button">`** with `aria-expanded` and `aria-controls`
  pointing at the group region (id derived from the `groupPath` key; region `role="group"`).
- Current segment carries `aria-current="page"` — pass `SkLink`'s `current` prop.
- Focus-visible is delegated to **`SkLink`** (`--sk-focus-ring: 2px solid var(--sk-accent)`,
  `--sk-focus-offset`); the disclosure button owns its own `:focus-visible`; segment links get **no**
  per-link focus rule (avoids double rings).
- Hover is **pointer-gated**: `@media (hover: hover) and (pointer: fine)` only.
- Keyboard: Enter/Space toggles a group; no focus traps; tab order follows reading order.
- Reduced motion respected.

---

## 6. Immediate Fixes vs Prototype

Two cleanly separable tracks. Do not let the prototype block the hygiene fix.

### 6.1 Tiny hygiene (independent, ~minutes)

- Add `footer: false` to `build_hub()`'s frontmatter in `scripts/build-pipeline-segment-routes.py`
  (`:121-130`) and regenerate `src/louis-lavelle/introducao-a-ontologia/index.md`. This removes the
  `VPContentDocFooter` → `de-l-etre` pager and matches the leaf generator, which already sets it.
- Add the pipeline hub route to `tests/doc-pager-retired.spec.ts`'s `ROUTES` (or assert it in
  `pipeline-work-hub.spec.ts`) so the regression cannot recur.

This is correct *with or without* the prototype, and brings the hub into the already-tested
site-wide invariant (§1.3).

### 6.2 Proof slice (the real validation)

Replace the markdown bullet list with an owned `PipelineWorkContents` component for this one work,
reading `pipeline-export-segments.json`, rendering collapsible Part→Chapter→Segment from `groupPath` —
routes unchanged, public behavior safe. Full spec in §7.

Note a subtlety that makes this *cleaner* here than for the legacy `WorkContents` slice: the legacy
hub concatenates full prose and so its replacement was gated on a separate SEO/search slice. **The
pipeline hub has no concatenated prose** — it is links only. Because VitePress server-renders Vue
components, an SSR'd `PipelineWorkContents` emits the same anchors into the static HTML, so swapping
the markdown `<ul>` for the component is **SEO-neutral** (same crawlable links, no prose removed). The
hub body can drop the generated link list entirely and let the SSR'd component be the contents — no
markdown-list dependency remains.

---

## 7. Recommended Proof Slice

**Goal:** prove the stack can produce a sophisticated, beautiful, iOS-like, performant reader hub —
on one work, with zero route churn — before importing more books.

**Scope (hard boundaries):**
- One work only: `louis-lavelle/introducao-a-ontologia`.
- No new books. No route migration. No `skepvox-book-pipeline` changes (the export is already
  vendored with `groupPath`; no re-vendoring needed). **No redirect work** (per §0).

**Deliverable: `PipelineWorkContents.vue` + `PipelineWorkContentsMount.vue`.**
- **Data:** `import meta from '../data/pipeline-export-segments.json'`; filter `language === 'pt'` for
  this work; sort by `order`. (Same source `PipelineSegmentNav` already uses.)
- **Mount/gate:** a Mount component that renders only when
  `frontmatter.generated === 'pipeline-work-hub'`, injected into the theme `content-top` slot
  alongside the existing mounts (`theme/index.ts`). No in-body sentinel needed (mirror
  `PipelineSegmentNav` self-gating).
- **Structure:** build the tree from `groupPath` — Part (`kind: part`) → Chapter (`kind: chapter`) →
  Segment. Front-matter/conclusion sentinels (no `groupPath`) render as a loose list, consistent with
  how `build_hub()` already buckets them.
- **Collapse:** real `<button>` group headers (`aria-expanded` + `aria-controls`); **default-collapsed
  chapters** for a 99-segment work so the map fits a phone; localStorage persists collapsed state,
  keyed by `groupPath` key (never identity). Guard localStorage for SSR (`import.meta.env.SSR` /
  `onMounted`).
- **Links:** segment rows are `SkLink` anchors to `/<routePath>`; `displayTitle` leads, ordinal faint;
  no slug text; no `<ul>/<li>`.
- **a11y + UI:** the §5 contract verbatim (mirror `WorkContents`), plus the ≥44px touch target.
- **Generator change (small, in-scope):** `build_hub()` emits frontmatter (`+ footer: false`) + the
  `# H1` (and optionally a one-line lede) and **stops emitting the link list** — the SSR'd component
  is the contents. This satisfies "no raw markdown bullet-list dependency for the main contents."
- **Tests/screenshots:** §8.

**What this proves:** owned collapsible map from real pipeline metadata; the identity/presentation
discipline end-to-end (`groupPath`/`segmentPrefix` drive structure, `routePath` only the href); the
performance guard (metadata-only hub, prose on leaves); the a11y + token system under a real work; and
that the `Pipeline*` family can own the hub surface the same way it already owns the leaf surface — all
without touching routes, the legacy reading system, or the book pipeline.

---

## 8. Test Plan

Grounded in the **actual** harness: Playwright against the built site (`vitepress preview`, port 4399),
projects `desktop` (1280×900), `mobile` (Pixel 5), `tablet` (1024×800, `tablet-shell.spec.ts` only);
27 specs assert against built `dist` HTML, 15 drive a live page. **There is no visual-regression /
`toHaveScreenshot` baseline in the suite today** — assertions are DOM + interaction. The plan reflects
that.

| # | Check | How (pattern in repo) |
|---|---|---|
| 1 | **VitePress footer absent on pipeline hub** | Built hub HTML `not.toContain('VPContentDocFooter')`; add the route to `doc-pager-retired.spec.ts` `ROUTES`. |
| 2 | **No raw markdown bullet-list dependency for contents** | Assert contents come from the owned component (its root `<nav aria-label>` / class present) and that there is **no** `vt-doc` `<ul><li><a>` contents list. |
| 3 | **Owned component renders all 99 pt segments** | Count `SkLink` anchors to `/louis-lavelle/introducao-a-ontologia/` in built HTML === 99 (Advertência + 98 parágrafos). |
| 4 | **Collapse/expand works with accessible buttons** | Live test: real `<button>` with `aria-controls`; click toggles `aria-expanded` + region visibility; assert Part/Chapter counts (2 parts, 10 chapters). |
| 5 | **Links resolve to built pt pages** | For each contents href, assert the corresponding `dist` file exists (mirror `pipeline-segment-routes.spec.ts`). |
| 6 | **No fr / old-chapter links leak** | Assert no href under `/louis-lavelle/introduction-a-l-ontologie/` and no fr `routePath`; component filters `language === 'pt'`. |
| 7 | **No reading-review surfaces become public** | Assert the hub links to nothing under `/reading-review/`. |
| 8 | **Performance guard: hub metadata only, no prose** | Built hub HTML must not contain a distinctive segment prose phrase (extend the existing `pipeline-work-hub.spec.ts` assertion); the component import is metadata-only. |
| 9 | **Mobile / desktop · light / dark** | Run DOM + interaction assertions under the `desktop` and `mobile` projects; toggle dark via the established mechanism (`.dark` class / `emulateMedia({ colorScheme })` / theme localStorage, as `mobile-theme-toggle.spec.ts` / `color-tokens.spec.ts` do). **Pixel screenshots are optional manual review**, not a suite dependency — adding `toHaveScreenshot` baselines would be a *new* capability; call it out explicitly if wanted rather than assuming it exists. |

---

## 9. Risks and Open Decisions

- **Retire/redirect the old fr full-text hub `/louis-lavelle/introduction-a-l-ontologie`.**
  *Downgraded by §0.* Legacy URL preservation is not required, so this is now a simple cleanup, not a
  redirect problem: the fr full-text hub + 12 fr chapter pages can be retired/removed whenever
  convenient; old URLs 404'ing temporarily is acceptable. Do **not** expand redirect-map work. (If the
  fr *edition* is kept as a reading edition, that's the next bullet — distinct from preserving the old
  *full-text* hub URL.)
- **Should the source-language fr edition get the same reader shell?** The data already supports it
  (99 fr segments with `groupPath`, paired to pt by `segmentPrefix`), and prior decisions treat
  Lavelle's French originals as first-class reading targets. Recommendation: keep `PipelineWorkContents`
  **`language`-parametrized from day one** so an fr hub is a near-free follow-up; build it after the pt
  proof slice, not during it.
- **Edition switch.** Deferred, but design the contents component and leaf chrome to key on
  `segmentPrefix` so an fr⇄pt switch is a later addition, not a refactor.
- **Virtual scrolling.** Not now (§4). Default-collapse large works; revisit only if a real device
  shows jank on an expanded fine-grained work (Confissões 453).
- **How much progress state locally before auth exists?** v1: collapsed-group UI state only
  (localStorage, non-identity). Last-read / progress deferred until a durable per-segment id + progress
  model exist; when built, key on `canonicalId`/`segmentPrefix`, store locally, no auth, no server.
- **Convergence debt: three data worlds, two contents components.** `reading-nav.json` /
  `segment-manifest.json` / `pipeline-export-segments.json`, and `WorkContents` vs the new
  `PipelineWorkContents`. Accept the duplication for the proof slice (separation is enforced by tests);
  schedule a later refactor to a shared presentational `ContentsTree` core once a second pipeline work
  exists. Do **not** attempt the merge in this slice — it would re-couple the worlds and break
  `segment-manifest.spec.ts`'s exact-consumer test.
- **When to leave VitePress theme customization for a fully owned shell (Option C)?** Not this phase.
  Graduate to C only on concrete pressure: (a) we end up CSS-hiding more of `VPContentDoc` than we use;
  (b) we need cross-route reader transitions / shared-element animation / a persistent app shell that
  VitePress's per-page model resists; (c) edition switch + progress + overlay map need state that
  survives navigation in a way slot-injection can't carry. Until one of those bites, Option B
  (slot-injected owned components + `--sk-*` tokens) is sufficient — and the proof slice does **not**
  require Option C.

---

## Verdict, Next Prompt, and Do-Not-Do-Yet

### Verdict on the stack

**Keep Vue + VitePress + `@vue/theme` (Option B). Do not rewrite.** The stack already supports an
owned, beautiful, iOS-like, performant reader: owned components server-rendered into static pages, a
mature `--sk-*` token system with warm light/dark and a scoped serif reading face, and an established
slot-injection pattern that already owns the leaf chrome. The two visible problems are small and
local — a one-line `footer: false` omission, and a hub whose contents are still rented markdown
styling. Both are fixable without leaving the stack. The reader app's quality ceiling is limited by
*how much we choose to own*, not by Vue or VitePress.

### Recommended next implementation prompt

> Implement the owned pipeline work-hub proof slice for `louis-lavelle/introducao-a-ontologia` only —
> no new books, no route migration, no book-pipeline changes, no redirect work.
> 1. **Hygiene:** add `footer: false` to `build_hub()` in `scripts/build-pipeline-segment-routes.py`,
>    regenerate the hub, and add the pipeline hub route to `tests/doc-pager-retired.spec.ts`.
> 2. **Component:** add `PipelineWorkContents.vue` + `PipelineWorkContentsMount.vue` reading
>    `pipeline-export-segments.json` (filter `language === 'pt'`), gated on
>    `frontmatter.generated === 'pipeline-work-hub'`, injected via the `content-top` slot. Render
>    collapsible Part→Chapter→Segment from `groupPath`: real `<button>` disclosures
>    (`aria-expanded` + `aria-controls`), `SkLink` segment rows with `aria-current`, default-collapsed
>    chapters, localStorage collapsed-state keyed by `groupPath` key (SSR-guarded), ≥44px touch
>    targets, pointer-gated hover, reduced-motion-safe, sans chrome over the `.dark` token stack.
> 3. **Generator:** `build_hub()` emits frontmatter + `# H1` only and stops emitting the link list;
>    the SSR'd component is the contents (SEO-neutral — same anchors, no prose).
> 4. **Tests:** the §8 plan (footer absent, no `<ul>` contents dependency, 99 anchors, accessible
>    collapse, links resolve, no fr/reading-review leak, metadata-only guard, mobile/desktop ·
>    light/dark via DOM+interaction; screenshots optional/manual).
> Do not touch the legacy reading system (`segment-manifest.json` / `WorkContents` / `reading-nav.json`)
> or add a second `segment-manifest.json` consumer.

### Do not do (yet)

- Do **not** rewrite off VitePress / pursue a fully owned shell (Option C).
- Do **not** retrofit `WorkContents` for pipeline data, rename it `ReaderContents`, or add a second
  `segment-manifest.json` consumer (breaks `segment-manifest.spec.ts`).
- Do **not** extract the shared `ContentsTree` core during the proof slice — defer until a second
  pipeline work exists.
- Do **not** add or expand redirect-map work; do **not** gate anything on legacy URL preservation.
- Do **not** build the zoom-out leaf overlay, the fr/edition switch, or reading-progress/last-read
  state in this slice — design for them, ship them later.
- Do **not** add virtual scrolling or `toHaveScreenshot` visual-regression baselines now.
- Do **not** import more books or migrate routes until the proof slice is green.
