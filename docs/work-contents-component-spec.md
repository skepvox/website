# WorkContents Component — Design & Implementation Spec (Slice b)

**Status:** Design/implementation spec. **Document only — do not implement the component yet.** No
generated Markdown, builder, frontmatter, podcast, `node_modules`, or other-repo changes. This is the
build sheet for the owned work-hub contents component that will replace the bullet "Sumário" / visible
concatenated-book experience.

**Foundations (shipped):** `.vitepress/theme/data/segment-manifest.json` (reading-app Slice a),
`docs/reading-app-segment-workhub-assessment.md`, `docs/sidebar-local-nav-model.md`, and the existing
owned patterns: `ReadingNav` (slot mount + `reading-nav.json`), `PodcastEpisodeNav` (`relativePath`
guard + `sidebar-nav.json` consumption), `SkLink` (four-state primitive), `CardGrid` (pointer-gated
hover).

---

## 1. Product goal

**The work hub is not the book. It is the reader's map into the book.** WorkContents replaces the
current hub experience (a flat bullet TOC stapled on top of the whole concatenated work) with a calm,
navigable map of **meaningful reading stops — segments/trechos inside the authored structure**. The bar
is a *better-than-Kindle-page-overview* experience: not arbitrary pages, but semantic stops the reader
can scan, orient within, and enter.

It is the same map the assessment's hub (§5) and zoom-out (§7) share; this slice builds the hub entry
point.

## 2. Core model

**Segments are the content unit. Structure is the orientation unit.** The component reads the segment
manifest and renders the authored hierarchy, collapsing absent levels:

```
Work
  Internal Book / Volume / Tome   optional   (groupPath kind: book)
    Part                          optional   (groupPath kind: part)
      Chapter                     optional   (groupPath kind: chapter)
        Section / Proposition     optional   (groupPath kind: section)
          Segment / Trecho        leaf       (the manifest segment — the only content unit)
```

Each segment carries its authored levels in `groupPath` (ordered, `{kind, index, key, inferred}`); the
segment itself is the leaf. The component never invents structure — it draws what `groupPath` provides.

### 2.1 Two rendering modes (the load-bearing distinction)

The manifest yields **two modes**, chosen per work by whether segments carry a non-empty `groupPath`:

- **Grouped mode** — segments have `groupPath` (segment-level works like *a-consciência de si*; `BB≠0`
  works like *de-l-acte*). Render collapsible group headers (book → part → chapter → section) with the
  segments nested as leaves. **This is where collapse + a11y live.**
- **Flat mode** — segments have `groupPath: []` (most legacy chapter-level works, incl. *Brás Cubas*).
  There is **no authored super-structure** in committed website data, so render a single calm ordered
  column of segment/chapter rows in a condensed structure, **without pretending to have authored
  hierarchy.** The component may *chunk* it for scannability (front matter, then chapter ranges) using
  the manifest's `order`/`chapterIndex`/`bucket` — but any such chunk is **presentation grouping**, and
  must be labeled/treated as such: neutral dividers or quiet range labels, **never** authored-style
  book/part/chapter headers that imply structure the work does not have. Synthetic presentation grouping
  is a render-time convenience; it is never written back, keyed as identity, or dressed as `groupPath`.

The v0 manifest determines a work's mode purely by whether its segments carry a non-empty `groupPath`.
**v1 WorkContents must implement both modes:**

1. **Grouped mode** — works *with* `groupPath`: render the authored hierarchy (collapsible groups).
2. **Flat mode** — legacy works with *empty* `groupPath`: render ordered rows in a calm condensed list;
   if chunked, label it presentation grouping, not authored structure.

## 3. v1 behavior

**Collapse is v1, not deferred** (grouped mode):

- Small works (few groups / few segments) may render **expanded by default**.
- Large works default **collapsed by group**.
- Group headers are **real `<button>`s** with `aria-expanded` + `aria-controls` pointing at the group's
  stable `groupPath` `key`.
- The current/continue group **auto-opens once progress exists** — but progress does **not** exist in
  v1, so this branch stays dormant.
- Without progress: open the **first meaningful group** (or, for small works, all) — a calm default,
  never "everything open" for a large work.
- Optional `localStorage` may remember expanded groups as **local convenience only, never identity** —
  and only if it doesn't complicate the component (§8). Omit it if it adds meaningful complexity.

**Not in v1:** no progress colors, no AI/chat, no auth, no server state, no reading-progress writes.

## 4. Visual direction

**A beautiful printed-edition table of contents, adapted for touch — not a docs file tree.** One
signature feeling: the quiet, indexed calm of a fine book's front matter.

**Do:**
- one **reading-column** width (align to the hub's text measure, like `ReadingNav`'s discipline);
- **quiet hairlines** between groups/sections (1px `--sk-reading-rule`);
- **muted group labels** (uppercase-ish eyebrow or quiet heading, `--sk-text-muted`);
- **generous vertical rhythm**; segments breathe, not a dense list;
- a **subtle current/open marker** (a thin rule, a dot, or weight shift — never a badge);
- **touch rows ≥ 44px** where interactive;
- **elegant collapse chevrons/icons** (a quiet rotating chevron), not buttony controls;
- segment **numbers as small orientation marks** (a faint leading ordinal), never the visual lead.

**Do not:**
- no bullets (`<ul>`/disc markers) for segments;
- no card grid for segments (CardGrid is for works/authors, not trechos);
- no giant open tree by default;
- no slugs as visible/primary text;
- no segment number as the headline.

The visible lead for each segment is its **`displayTitle`**; the ordinal is secondary and faint.

## 5. Data requirements — is v0 manifest enough for v1?

**Verdict: yes for v1, with one small recommended addition and two documented limitations.** The v0
`segment-manifest.json` already carries the structure WorkContents needs, with no slug parsing:

| Need | v0 field | Status |
|---|---|---|
| Hierarchy | `groupPath[]` `{kind, index, key, inferred}` | ✓ present |
| Stable group identity (collapse / `aria-controls` / `localStorage` key) | `groupPath[].key` | ✓ present, shared within a group |
| Segment display text | `displayTitle` | ✓ present (never the slug) |
| Reading order | `order` (+ `prefix`, `book/part/chapter/segmentIndex`) | ✓ present, matches `reading-nav` |
| Front/end matter | `bucket: front-matter \| conclusion` | ✓ present (reserved prefixes only — see limitation 2) |
| Single-file works | `prefixCompatibility: single-file`, `groupPath: []`, `segmentKind: single-file` | ✓ present |
| Empty-groupPath legacy works | `groupPath: []` + ordering fields | ✓ present → flat mode |
| Identity (current marker, later) | `canonicalId` | ✓ present (never the route slug) |
| Route to the leaf | `href` (via `SkLink`) | ✓ present |

**Recommended small addition before *grouped mode on non-pt works*:**
- **`language` on `works[]`** (e.g. `pt` | `fr`). Group **headers** are rendered from `kind` + `index`
  (no authored titles exist in committed website data), e.g. "Capítulo {index}". Localizing the kind
  word (Chapter/Chapitre/Capítulo, Book/Livre/Livro) needs the work's language. **Not needed for the
  recommended first target** (*a-consciência de si* is pt → pt headers by default); add it before doing
  grouped mode on French Lavelle works (e.g. *de-l-acte*). Cheap to derive (read `language` from a leaf
  frontmatter, or default by corpus: `literatura` → pt, `louis-lavelle` → fr except the pt
  translations).

**Documented limitations (do not block v1; resolved later by pipeline ingestion):**
1. **No authored group titles.** `groupPath` levels carry `kind`+`index`, not the authored chapter/part
   title. v1 headers are "Capítulo {index}" placeholders; real titles arrive when the pipeline
   `sync-map` + segment frontmatter are ingested. This is acceptable and honest.
2. **Front-matter detection is reliable only for the reserved prefix.** `bucket` is set only for exact
   `00-00-000` / `99-99-999`. Legacy works put front matter at `00-01/02/03` (e.g. Brás Cubas
   Dedicatória/Prólogo/Ao leitor), so they are **not** flagged. Flat mode should render those leaves in
   order at the top; do not hard-depend on `bucket` to separate front matter for legacy works.

**Conclusion:** build v1 against v0 as-is for the pt first target. Add `language` (and, later, authored
titles via pipeline) before broad grouped-mode rollout.

## 6. First implementation target

The instinct is Brás Cubas (on-site, huge-list stress). But Brás Cubas is **flat mode** (`groupPath: []`,
163 chapters) — it does **not** exercise the collapsible-group + `aria-expanded` machinery that is the
actual novel risk of this slice. Shipping flat-mode-at-scale first would mean either a 163-row flat list
or premature presentation-bucketing decisions, while leaving the hard part (collapse a11y) untested.

**Do not assume Brás Cubas is the best first target just because it is the best stress test.** Its v0
`groupPath` is empty, so it is a *visual scale* test (flat mode) and does **not** exercise the
authored-hierarchy collapse mechanics. Split the targets explicitly:

- **First mechanics target — `a-consciência de si`** (`/louis-lavelle/a-consciencia-de-si`). A work with
  **non-empty `groupPath`**: validates nested hierarchy, collapse buttons, stable group `key`s,
  `aria-expanded`/`aria-controls`, default-collapsed/expanded logic, keyboard nav, and `SkLink` leaves.
  It is the existing on-site **segment-level template**, pt (no `language` field needed), 118 segments
  across ~13 chapter groups — representative and manageable. *(An even smaller grouped smoke test is
  `de-l-acte`: 3 book groups / 27 chapters — but it is fr, so it needs the `language` addition first;
  prefer a-consciência.)*
- **First visual stress target — `bras-cubas`** (`/literatura/machado-de-assis/bras-cubas`). A legacy
  work with **empty `groupPath`**: validates **flat mode** — the calm handling of 163 tiny chapter-leaves
  as a condensed ordered list, front-matter ordering, and any presentation chunking (labeled as such).

Sequence the **mechanics target first** (the novel collapse + a11y risk, on real authored groups, on a
manageable published work), then the **visual stress target** (a *distinct rendering mode*, not "the same
UI, bigger"). The smallest safe first slice (§11) ships one work — the mechanics target.

## 7. Interaction & accessibility

- **Segment links:** `SkLink` (real `<a>`, four-state: pointer-gated hover, `--sk-focus-ring` focus,
  neutral pressed/touch, `aria-current` when current). Visible text = `displayTitle`.
- **Collapsible group headers:** real `<button>` (not a div), with `aria-expanded` reflecting state and
  `aria-controls` referencing the group region's id (derive a stable id from `groupPath[].key`). The
  region is `role="group"` / a labelled container.
- **Hover** stays pointer-gated (`@media (hover: hover) and (pointer: fine)`), per the navigation
  interaction-state standard — no touch hover leakage on the chevron or rows.
- **Focus** via `--sk-focus-ring` on both the `SkLink` segments and the group buttons.
- **Current segment** (later, once progress exists): `aria-current="true"`/`"page"` + the subtle visual
  marker. Dormant in v1.
- **Keyboard:** buttons toggle on Enter/Space; Tab order follows reading order; expanding a group
  exposes its segments in the tab sequence; nothing is a keyboard trap.

## 8. State model

Keep three states **separate**; only the first is in scope for v1:

- **Structural state** — which groups are expanded/collapsed. *v1 may persist this in `localStorage`* as
  local convenience (keyed by `groupPath` `key`), **only if it does not complicate the component**;
  otherwise keep it in-memory and recompute the default each load. Never treat it as identity.
- **Reading state** — continue/current/read segments. **Deferred.** Not implemented in v1; the
  "auto-open current group" + current marker stay dormant until a real progress model exists.
- **Future synced user state** — server/auth-backed. Out of scope entirely.

Default expansion (no progress): small works expanded; large works collapsed with the first meaningful
group open. Deterministic, no stored state required.

## 9. SEO / search / content coexistence

**Do not remove the concatenated full-book text in this slice** — that removal is gated on the SEO/search
replacement (assessment §6, Slice c). v1 must **coexist** with the current hub:

- **Mount WorkContents at the top of the work hub via a theme slot** (`content-top`), the established
  `ReadingNav`/`PodcastEpisodeNav` pattern — *no edit to the generated hub Markdown or builders.* The
  component guards on `page.relativePath` matching a multi-leaf work's `relativePath` in the manifest
  (and, for the first slice, an **allowlist of one work**, so nothing else changes).
- The existing in-body bullet "Sumário" + concatenated prose remain in the DOM below it (SEO, search,
  Ctrl-F intact).
- To avoid a visible double-TOC for the first target, **visually suppress that work's in-body Sumário
  block via a scoped theme CSS rule** (`.vitepress/theme/styles`, allowed) **if** the Sumário markup is
  cleanly targetable — the content stays in the DOM (still indexed), only the redundant *visible* bullet
  list is hidden. If it is not cleanly targetable, accept the transitional redundancy for one work and
  resolve it in Slice c. **Never delete the concatenated prose in this slice.**
- **Slice c (later):** the builder stops emitting the bullet Sumário + concatenation once the search
  artifact + JSON-LD chain + canonical/thin-content strategy ship (assessment §6). WorkContents then
  becomes the sole hub navigation.

## 10. Stress tests (UI validation cases)

**Live-testable now (on-site):**
- **Brás Cubas** (`/literatura/machado-de-assis/bras-cubas`) — *flat mode*, 163 tiny chapters: calm at
  scale, front-matter ordering, optional chunking, no ugly 163-row wall.
- **a-consciência de si** (`/louis-lavelle/a-consciencia-de-si`) — *grouped mode*, segment-level, ~13
  chapter groups / 118 segments: collapse mechanics + a11y + the segment template.
- **de-l-acte** (`/louis-lavelle/de-l-acte`) — *grouped mode*, 3 book groups / 27 chapters: book-level
  grouping (needs the `language` addition for fr headers).

**Design must-handle (not live until pipeline ingestion — validate the design, not a live page):**
- **Confissões** — ~453 paragraph-level segments: the fine-granularity extreme; the grouped layout +
  collapse must stay calm at maximum leaf density.
- **Karamázov** — internal books → parts → chapters + heavy chapter-sized / `semantic-section`
  segments: deep `groupPath`, mixed granularity, very large single segments.

Each live case gets screenshot QA (mobile + desktop, light + dark).

## 11. Implementation plan after this doc (smallest safe slice)

**Build:**
- One owned `.vitepress/theme/components/WorkContents.vue`, consuming `segment-manifest.json`, mounted
  via the `content-top` slot guarded to **one** work (`a-consciência de si`) by `relativePath`.
- Grouped + flat rendering modes; collapsible group `<button>`s (`aria-expanded`/`aria-controls`);
  `SkLink` segment links; pointer-gated hover; `--sk-focus-ring` focus.
- Coexist with the current hub (do **not** remove concatenation); optionally scope-hide that work's
  in-body Sumário via theme CSS.

**Do NOT build (this slice):**
- no broad rollout (one work only);
- no concatenation/Sumário removal from the builder;
- no progress colors, current-segment state, AI/chat, auth, or server state;
- no manifest schema change beyond the optional `language` add (only if fr grouped mode is in this
  slice — it should not be; first target is pt);
- no generated-Markdown, builder, frontmatter, podcast, or other-repo edits.

**Tests:**
- **Hierarchy rendering:** grouped work renders group headers + nested segments in `order`; flat work
  renders one ordered column; order matches `reading-nav`.
- **Collapse a11y:** group headers are `<button>` with `aria-expanded` + `aria-controls`; toggling flips
  `aria-expanded` and shows/hides the controlled region; large-work default collapsed, small expanded.
- **SkLink links:** segment links are real `<a>` via `SkLink` with the expected `href`; visible text is
  the `displayTitle`.
- **No slug leakage:** the slug never appears as visible/primary text; the ordinal is secondary.
- **No docs-tree feel (as far as testable):** no `<ul>`/disc bullets for segments; segments are not a
  CardGrid; not fully expanded by default for a large work.
- **Interaction-state standard:** add WorkContents to `nav-interaction-states.spec` (pointer-gated
  hover, delegates focus to `SkLink`, no own `:focus-visible`).
- **Guarded mount:** present only on the target work hub; absent on leaves, author/corpus hubs, the
  podcast surfaces, single-file works, home, and other work hubs.
- **Manifest consumer:** update `segment-manifest.spec`'s "NOT wired" test to allowlist
  `WorkContents.vue` as the manifest's first consumer (mirroring how `sidebar-nav.spec` evolved for
  `PodcastEpisodeNav`).

**QA:** screenshot the target work (a-consciência de si) mobile + desktop, light + dark; confirm calm,
printed-TOC feel, working collapse, ≥44px touch rows, and no docs-tree aesthetics. Then repeat for Brás
Cubas as the flat-mode/scale follow-up.

**`pnpm verify` must pass.** Commit on `develop`; do not push.
