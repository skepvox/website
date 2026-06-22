# skepvox Sidebar / Local-Navigation Route & State Model

_Model + plan only. No code, config, frontmatter, builder, or `node_modules` changes in this slice. Date: 2026-06-22._

This document is the source of truth for how skepvox's **local navigation** (the left rail / "Navegar" drawer, and the on-page indexes that replace it) should behave per route, and the staged, fork-free path to owning it. It builds on `docs/navigation-owned-shell-assessment.md` (the nav/shell assessment) and assumes the now-complete SkLink interaction-state foundation (`docs/navigation-owned-shell-assessment.md` → the four-state standard; SkLink is used by CardGrid, Home, PodcastShowHeader, ReadingNav).

It does **not** touch the top bar (`VPNav`), which has no clean slot and is deferred to an eventual owned-shell decision.

**Terminology.** A _reading leaf_ is the canonical page a reader actually reads — generically a chapter, section, or segment (_trecho_), depending on the corpus. In the literature corpus a leaf is a chapter; in Louis Lavelle the canonical leaf is often a section or segment/_trecho_ rather than a full chapter. This document uses **reading leaf** / **leaf** as the generic term, and the manifests count _leaves_, not "chapters". "Chapter" appears only where a statement is specific to the literature corpus (e.g. the in-body Sumário).

---

## 0. Thesis — the calm local-nav model

skepvox is a reading/listening product, not a documentation site. A persistent docs-style **file-tree sidebar is the wrong model** for it. Orientation should come from four owned or owned-shaped surfaces, not a left rail:

1. **Global section nav** (Home · Lavelle · Literatura · Podcasts) — already right, rented, kept.
2. **On-page indexes** — the owned `CardGrid` (authors, works, shows, episodes) and the in-body reading-leaf indexes (Sumário / Table des matières). These are the designed, calm index for each hub.
3. **Owned within-collection progression** — `ReadingNav` (reading-leaf prev/next, shipped) and a future `EpisodeNav` (episode prev/next), both manifest-driven and never crossing a collection boundary.
4. **A quiet up-affordance** — one muted line per leaf (work · author), not a tree (future; see the nav assessment's "up-line" recommendation).

**Target end-state: the rented `VPSidebar` file-tree renders on no production route.** It is already absent on reading leaves (`sidebar: false`) and Home (`page: true`); the model extends that to hubs, show pages, and episode pages, so the rail's job is carried by the grids + progression + global nav. This is the single most "docs-shaped" rented surface, and retiring it from view is the highest-value local-nav move reachable **without forking `@vue/theme`**.

The owned-data layer behind this is a generated **`sidebar-nav.json`** (Section 4) that composes the existing manifests, replacing the hand-maintained `config.ts` sidebar and its drift.

---

## 1. Route types — current vs. target

"Local nav" = the left rail (desktop `VPSidebar`) and its mobile `VPLocalNav` "Navegar" drawer. "Index" = the on-page list of children (CardGrid or in-body reading-leaf index).

| Route type | Current rented behavior | Local nav (target) | What the index is (target) | Hidden / removed |
|---|---|---|---|---|
| **Home** (`/`, `page:true`) | No rail (page:true → `VPContentPage`); owned `Home.vue` pillars | **None** (unchanged) | The 3 owned SkLink pillars | — |
| **Literatura hub** (`/literatura/`) | Rented rail = `/literatura/` tree (authors → works); on-page author `CardGrid` | **None** → `sidebar:false` | Author `CardGrid` (`authors.ts`) | The author/work tree (duplicates the grid) |
| **Literatura author hub** (`/literatura/<author>/`) | Rented rail = the whole `/literatura/` tree (all authors' works); on-page works `CardGrid` + bio/portrait | **None** → `sidebar:false` | Works `CardGrid` (per-author `works.json`) | The sibling-works tree (duplicates the grid) |
| **Literatura work hub** (`/literatura/<author>/<work>`) | Rented rail = sibling works; in-body "Sumário"; **cross-author** docs pager (no `footer:false`) | **None** → `sidebar:false` | In-body reading-leaf index (Sumário) | Sibling-works rail; the cross-author pager (`footer:false`) |
| **Literatura reading leaf** (`…/<work>/<leaf>`; a chapter) | `sidebar:false` already; `ReadingNav` prev/next; baked `[Voltar ao livro]` | **None** (keep absent) | `ReadingNav` (bottom) + future quiet up-line | — (already clean) |
| **Lavelle hub** (`/louis-lavelle/`) | Rented rail = `/louis-lavelle/` work-group tree; on-page works `CardGrid` + bio/JSON-LD | **None** → `sidebar:false` | Works `CardGrid` | The work-group tree (duplicates the grid) |
| **Lavelle work hub** (`/louis-lavelle/<work>`) | Rented rail = sibling works; in-body "Table des matières"; cross-work pager | **None** → `sidebar:false` | In-body reading-leaf index | Sibling rail; cross-work pager (`footer:false`) |
| **Lavelle reading leaf** (`…/<work>/<leaf>`; a section or segment·_trecho_, sometimes a chapter) | `sidebar:false`; `ReadingNav` (fr/pt labels); back-link | **None** (keep absent) | `ReadingNav` + future up-line | — (already clean) |
| **Podcast hub** (`/podcast/`) | Rented rail = 3-show tree + episodes; on-page show `CardGrid`; **no `footer:false`** | **None** → `sidebar:false` | Show `CardGrid` (`shows.json`) | 3-show tree; the docs pager |
| **Podcast show page** (`/podcast/<show>/`) | Rented rail = 3 shows + all episodes (the one genuinely-useful rail today); `PodcastShowHeader` + episode `CardGrid`; cross-show pager; `footer:false` already set | **None** → `sidebar:false` | Episode `CardGrid` (`episodes.json`) | The 3-show tree; cross-show jump moves to global nav / future owned switcher |
| **Podcast episode page** (`/podcast/<show>/<NNN>`) | Rented rail = 3 shows + episodes; `outline:2` "Índice" over guide; **cross-show** pager (fr/003 → es/001) | **None** → `sidebar:false` | Owned **`EpisodeNav`** (within-show prev/next) | 3-show tree; cross-show pager (`footer:false`); the docs "Índice" outline |

**Reading the table:** every non-Home, non-leaf route currently renders the rented rail and (often) a wrong, sidebar-derived pager; the target sets `sidebar:false` everywhere and lets the **already-present owned index** (grid or in-body reading-leaf index) carry orientation, with owned progression nav (`ReadingNav`/`EpisodeNav`) for sequence. The rail disappears site-wide.

---

## 2. Hub rail decision (resolved)

**Decision: hubs use `sidebar:false`; the owned `CardGrid` (and in-body reading-leaf index on work hubs) is the index. Do _not_ add a manifest-driven contents rail to hubs.**

Reasoning:

- **It would duplicate the main content.** The author/works/show grids and the in-body Sumário already _are_ the index. A left rail listing the same items is a second, less-styled copy — the opposite of calm (the nav assessment found the sidebar shows sibling works that the page's own grid already shows).
- **A reading-leaf contents rail is worse, not better.** Feeding a work hub a per-work leaf rail would put up to ~160 rows (Brás Cubas, in the literature corpus) of file-tree in the gutter and duplicate the authored Sumário — re-docsifying the book. The in-body reading-leaf index reads better and is already there.
- **The grid is the product surface.** It carries cover art, eyebrows, descriptions, meta, and SkLink behavior; the rented `VPSidebarLink` is 13px file-tree density.

This matches the stated bias: _local nav should not duplicate the main content unless it clearly improves reading flow_ — and on hubs it does not.

**One caveat (podcast):** the rented podcast rail is the single place the file-tree is genuinely useful today (sibling shows + episodes). Removing it must be **paired** with two owned affordances so nothing is lost: (a) `EpisodeNav` for within-show prev/next (series progression), and (b) cross-show movement via the `/podcast/` hub (one click from global nav) and, optionally later, an owned `sidebar-top` show switcher (Section 8, slice 4). Do not set `sidebar:false` on show/episode pages _before_ `EpisodeNav` exists, or episodes lose their "next lesson."

The narrow exception where a rail _could_ earn its place — a single long single-file work (e.g. `o-ateneu`) with a sticky in-page outline — is **out of scope**: it's one work, the in-body TOC already serves it, and it doesn't justify a site-wide rail model.

---

## 3. Reading leaves

Reading leaves (`literatura/<author>/<work>/<leaf>` — a chapter; `louis-lavelle/<work>/<leaf>` — a section or segment/_trecho_, sometimes a chapter) are the product core and must stay immersive.

- **Rented sidebar stays absent.** Leaves already set `sidebar: false`. Keep it. This is correct and must be protected: no rail, no `VPLocalNav` "Navegar" bar (it only renders when `hasSidebar`), no outline.
- **`ReadingNav` already owns prev/next.** Manifest-driven (from `reading-nav.json`), work-bounded, localized (pt-BR/fr), in the `content-bottom` slot, SkLink-wrapped. No change to its role.
- **The only owned addition is a quiet up-line (future, not this model's implementation).** Promote `ReadingNav`'s top `book · author` context (or replace the baked `[Voltar ao livro]` / `[Retour au livre]` Markdown back-link) into at most a single muted "↑ {work} · {author}" line, SSR-rendered, SkLink-based. **Not a breadcrumb chevron trail, not a tree.** This is the leaf's "up" affordance; see the nav assessment's up-line recommendation.
- **Mobile "Navegar" on leaves: nothing.** Because leaves are `sidebar:false`, `VPLocalNav` does not render — correct. The reader gets the reading leaf, `ReadingNav`, and (future) the up-line; no drawer, no "Índice". Keep it that way.

---

## 4. Data sources & the `sidebar-nav.json` contract

### Today's sources

| Source | Shape | Covers | Owned? |
|---|---|---|---|
| `reading-nav.json` | `{ "/<work-route>": [[slug, displayTitle], …] }` — **18 multi-leaf works / 834 reading leaves** | reading-leaf order + titles within each multi-leaf work (leaves are chapters in literature, sections/segments·_trechos_ in Lavelle) | owned (generated by `build-reading-nav.py`) |
| `episodes.json` (per show) | `[{ number, title, href, durationSeconds, description, artworkUrl }]` | episodes within a show, in order | owned (generated) |
| `shows.json` | `[{ title, href, description, imageUrl, episodeCount, meta }]` | the 3 shows | owned (generated) |
| `works.json` (per author) | `[{ title, href, description, meta }]` — incl. **single-file works** (e.g. *A Cartomante*, "texto único", which have **no** `reading-nav.json` key) | works under an author | owned (hand/generated) |
| `authors.ts` | author cards | authors under Literatura | owned (hardcoded) |
| `config.ts` `sidebar` | hand-written: **3 prefixes** (`/podcast/`, `/literatura/`, `/louis-lavelle/`), **9 groups, 33 links** | the rented `VPSidebar` tree | **hand-maintained — the drift source** |

The relationships the local-nav needs **already exist** across the owned manifests. The deficit is that they're (a) scattered and (b) duplicated by hand in `config.ts`, which drifts (e.g. `a-cartomante` / `o-ateneu` appear in the config sidebar with no `reading-nav.json` backing).

### The future contract: `sidebar-nav.json`

A single **generated** manifest that composes the existing sources into one local-nav tree, consumed by owned components (and, transitionally, capable of feeding `config.sidebar`). Generated by a build step (alongside `build-reading-nav.py`), never hand-edited. Illustrative shape:

```jsonc
{
  "literatura": {
    "label": "Literatura", "route": "/literatura/",
    "authors": [
      { "label": "Machado de Assis", "route": "/literatura/machado-de-assis/",
        "works": [
          { "label": "Memórias Póstumas de Brás Cubas", "route": "/literatura/machado-de-assis/bras-cubas",
            "kind": "multi", "leaves": 160 },   // leaves = chapters / sections / segments (trechos)
          { "label": "A Cartomante", "route": "/literatura/machado-de-assis/a-cartomante",
            "kind": "single", "leaves": 0 }
        ] }
    ]
  },
  "louis-lavelle": { "label": "Louis Lavelle", "route": "/louis-lavelle/", "works": [ /* groups → works */ ] },
  "podcast": {
    "label": "Podcasts", "route": "/podcast/",
    "shows": [
      { "label": "Vox Français", "route": "/podcast/francais/",
        "episodes": [ { "number": 1, "title": "Le badge", "href": "/podcast/francais/001-le-badge" } ] }
    ]
  }
}
```

**How it removes drift:** it is derived from filesystem + the existing manifests (`reading-nav.json` for reading-leaf counts/`kind`, `works.json`/`authors.ts` for labels/`kind`, `shows.json`/`episodes.json` for the podcast tree). A `single`-vs-`multi` `kind` is computed from whether a `reading-nav.json` key exists, so entries like `a-cartomante` can no longer be miscategorized or orphaned. One generated source replaces the hand `config.sidebar`; nothing is maintained twice.

**Primary consumers** are owned components (`EpisodeNav`, the quiet up-line, an optional owned switcher) — not necessarily the rented `VPSidebar`, which the model retires from view. If the rented sidebar is kept during migration, the generator can additionally emit a `config.sidebar`-compatible projection (Section 8, slice 2).

---

## 5. Reachable seams without forking

**What we can own now (no `node_modules` patch):**

- **`config.sidebar` data** — replace the hand object with a generated import (transitional).
- **The generated `sidebar-nav.json`** — the owned local-nav data contract above.
- **`frontmatter sidebar:false`** (and `footer:false`) per route — the lever that removes the rented rail/pager. Already the mechanism reading leaves use.
- **`sidebar-top` / `sidebar-bottom` native slots** — owned chrome above/below the rented tree (e.g. an optional corpus/show switcher) without forking `VPSidebar`.
- **Scoped CSS** — for any transitional restyle of the rented rail (low value, since the end-state removes it).
- **Owned components in available slots** — `EpisodeNav` via `content-bottom` (mirroring `ReadingNav`); the up-line via `content-top`; all SkLink-based.

**What stays rented for now:**

- **`VPSidebar` tree rendering** (`VPSidebarGroup`/`VPSidebarLink`) — we feed/suppress it via data + `sidebar:false`, but do not fork its rendering.
- **`VPLocalNav` "Navegar" drawer** — the mobile trigger; it simply stops appearing where `sidebar:false`.
- **`getSidebar` prefix-matching** (`support/sidebar.ts`, first-prefix-match, order-sensitive) — unchanged; we only change the data it reads.
- **`VPNav` top bar** — no clean slot (only `navbar-title`); deferred to a future owned-shell decision.

---

## 6. Interaction-state standard for owned local-nav links

Any owned local-nav component (`EpisodeNav`, up-line, switcher, future owned sidebar) **must** follow the navigation four-state standard (`docs/navigation-owned-shell-assessment.md`), via the SkLink primitive:

- **Links use `SkLink`** — a real transparent `<a>`, SSR-safe, owning focus + neutral touch.
- **Hover** only under `@media (hover: hover) and (pointer: fine)` — never sticks on touch.
- **Pressed / touch** neutral — first tap navigates; no sticky state (SkLink suppresses the tap-highlight).
- **Keyboard focus** via `:focus-visible` / `--sk-focus-ring` (SkLink owns it; card-sized links set `--sk-link-focus-radius`).
- **Current route** via `aria-current="page"` (SkLink's `current` prop) or an explicit active class, **visually distinct from hover and pressed** (e.g. current = ink-blue accent + weight; hover = a quieter lift) — never let "you are here" read as "you are tapping/hovering".
- **Touch targets ≥ 44px** where practical (drawer rows, switcher).
- **Reduced-motion safe** — rely on the global `prefers-reduced-motion` floor; any disclosure/transition respects it.

---

## 7. Mobile behavior

- **Mobile "Navegar" drawer (`VPLocalNav`, < 768px):** today it opens the rented `config.sidebar` tree on hubs/shows/episodes — a file-tree that duplicates the on-page grid. Under the model, those routes are `sidebar:false`, so **`VPLocalNav` stops rendering** there (it only shows when `hasSidebar`). Net: no "Navegar" drawer anywhere except (transitionally) wherever a rail still exists. The reader navigates via the global nav (hamburger → 4 corpus links, already calm), the on-page grid, and owned progression. This is the intended quiet end-state.
- **Tablet range (768–959px):** the `VPLocalNav` "Navegar" bar currently persists up to 959px on `hasSidebar` routes (it disappears ≥ 960px); the rented drawer opens the file-tree there. `sidebar:false` removes this band's drawer too. (Independent of the appearance-toggle bridge, which already covers 768–1279px.)
- **Reading leaves:** no drawer, no "Índice" (already `sidebar:false`/`outline:false`). Unchanged. The future up-line is a single static line, not a drawer.
- **Hubs:** the grid is the index on mobile as on desktop; no drawer. A hub's children are one scroll away in the grid — calmer than a drawer of the same links.
- **Podcast pages:** show page → episode grid is the index; episode page → `EpisodeNav` prev/next + the player. No 3-show drawer; cross-show is the `/podcast/` hub (one tap via global nav) or the optional owned switcher.

---

## 8. Staged implementation plan

Each is a **future** slice (this document is plan-only). Ordered by risk; every slice is gated by `pnpm verify`.

**Slice 1 — `footer:false` pager hygiene + no-pager invariant.** _(smallest safe first)_
Kill the wrong **sidebar-derived** docs pager (`VPContentDocFooter`) on episodes, podcast hub, and literature/Lavelle work + author hubs — today it pages cross-show (Vox Français 003 → Vox Español 001) and cross-author. Set `footer:false` in those frontmatters **and** emit it from the builders (`sync-podcast-lesson-pages.py`, literature/Lavelle builders), then a spec asserting no `VPContentDocFooter` on `/podcast/`, `/literatura/`, `/louis-lavelle/`.
- **Files:** episode + hub `.md` frontmatter; builder templates; a new spec.
- **Tests:** `no-VPContentDocFooter` DOM assertion on those routes; existing 12+ specs green.
- **Risk:** `local-books/` is gitignored → hand-apply + builder change (else regeneration reverts it); does not change layout (lowest risk).

**Slice 2 — Generated `sidebar-nav.json` manifest.**
Add a build step composing `reading-nav.json` / `works.json` / `authors.ts` / `shows.json` / `episodes.json` into `sidebar-nav.json`. Replace the hand `config.sidebar` with a generated, **byte-compatible** projection (or migrate the string-matching specs to read the manifest). No visual change yet.
- **Files:** a generator script; `config.ts` import; spec migration.
- **Tests:** generator idempotency; `sidebar-nav.json` reconciliation invariant (18 multi-leaf works / 834 reading leaves; the 2 single-file works flagged `kind:"single"` with no `reading-nav.json` key); `literature.spec`/`louis-lavelle.spec` still green or migrated.
- **Risk:** the specs string-match `config.ts`; `getSidebar` first-prefix-match ordering is load-bearing (a deeper `/literatura/<author>/<work>/` key must precede the broad `/literatura/`).

**Slice 3 — Hub `sidebar:false` + `EpisodeNav`.** _(the model's core)_
Set `sidebar:false` on Literatura/Lavelle hubs + work hubs and podcast hub/show/episode pages (the grid / in-body list is the index). Ship owned `EpisodeNav` (mirrors `ReadingNav`, reads `episodes.json`, within-show prev/next, SkLink, `content-bottom`) **before/with** removing the podcast rail, so episode progression isn't lost.
- **Files:** frontmatter + builders; new `EpisodeNav.vue`; `theme/index.ts` slot wiring; specs (incl. `EpisodeNav` within-show bound, no cross-show).
- **Tests:** `sidebar:false` rendered (no rail), `EpisodeNav` prev/next never crosses a show, hub grids intact, reading-mode coupling unaffected.
- **Risk:** **visual layout shift** on desktop hubs (content recentres without the rail) — screenshot-review; losing cross-show jump (mitigated by hub + optional switcher); the `:not(.has-aside)` reading coupling (don't disturb leaf gating).

**Slice 4 — Optional owned `sidebar-top` corpus/show switcher.**
If a persistent lateral affordance is wanted, an owned slim switcher in the `sidebar-top` slot (reads `sidebar-nav.json`), SkLink-based, calm — **not** a file-tree. Only if Slice 3 shows a real need.
- **Files:** owned component; `theme/index.ts` slot wiring.
- **Risk:** re-introducing a rail; keep it minimal or skip.

**Slice 5 — (later) owned local-nav component.**
A fully owned rendering of local nav (if ever needed beyond grids + progression), via slots / a page-type — approaches the fork boundary; defer until grids + progression prove insufficient.

**Slice 6 — (eventual) owned top bar.**
The `VPNav` replacement — a deliberate Option-C decision; out of this model's scope. SkLink + a future `SocialLinks` + an owned toggle become its atoms then.

---

## 9. Risks

- **Specs string-match `config.ts`.** `literature.spec.ts` / `louis-lavelle.spec.ts` assert exact substrings of the sidebar object; a generated sidebar must emit byte-compatible structure or those specs must migrate to assert `sidebar-nav.json`.
- **`getSidebar` prefix order is load-bearing.** First-prefix-match in object-key order (`support/sidebar.ts`); any deeper per-work key must precede its broad corpus key, or the broad key wins. Untested today.
- **`local-books/` is gitignored and absent.** Any frontmatter change (`footer:false`, `sidebar:false`) must go into the **builder templates** _and_ be hand-applied to the committed `.md` files — a rebuild will not regenerate them; skipping the template change silently reverts on the next regeneration.
- **Do not duplicate grid content in a sidebar.** The whole point of the model is that the on-page index _is_ the index; a rail repeating it is the failure mode to avoid.
- **Do not re-docsify.** No file-tree rail, no leaf-tree gutter, no breadcrumb chevron trail, no "Índice" outline over learning pages. Local nav is grids + owned progression + a quiet up-line.
- **Layout shift when the rail leaves.** Removing the desktop rail recentres hub content; it's a deliberate, reviewable change, not a regression — screenshot the canonical routes.
- **Sequence the podcast rail removal after `EpisodeNav`** so episodes never lose "next lesson."

---

## Next implementation prompt (the slice after this document)

> **Slice: `footer:false` pager hygiene — retire the wrong sidebar-derived pager.**
>
> Kill the misleading `VPContentDocFooter` (sidebar-derived prev/next) on every non-leaf route where it currently mis-paginates. It pages **cross-show** on episodes (Vox Français 003 → Vox Español 001) and **cross-author** on literature work hubs, because those pages keep the rented pager (no `footer:false`) and `getFlatSideBarLinks` flattens the whole matched sidebar key. Scope: frontmatter + builder templates + one spec. No `sidebar:false` yet (that's the later, layout-changing slice); no `node_modules` patch; no `page:true`.
>
> **Do:**
> 1. Add `footer: false` to the frontmatter of: all podcast **episode** pages, `podcast/index.md`, the Literatura **section/author/work** hubs, and the Lavelle **hub/work** hubs. (Reading leaves and show index pages already set it.)
> 2. Emit `footer: false` from the generators so regeneration keeps it: `scripts/sync-podcast-lesson-pages.py` (episodes) and the literature/Lavelle hub builder templates. Hand-apply to the existing committed `.md` files too (`local-books/` is gitignored, so a rebuild won't regenerate them).
> 3. Do **not** change `sidebar`, `outline`, layout, or any component — only the `footer` frontmatter + builder templates.
>
> **Tests:** add a spec asserting **no `VPContentDocFooter`** in the rendered DOM on any `/podcast/`, `/literatura/`, or `/louis-lavelle/` route (extend `podcast-show-page.spec`/`literature.spec` patterns). Keep all existing specs green.
>
> **Verify:** `pnpm verify`; confirm the cross-show/cross-author "Próximo/Anterior" is gone on an episode and a work hub; screenshot a podcast episode + a work hub (mobile/desktop, light/dark) to confirm only the pager is removed (no other change). Confirm no content/manifest/feed/player/route drift beyond the intended `footer` flags. Commit as one small slice; do not push.
>
> _After this: Slice 2 (generated `sidebar-nav.json`), then Slice 3 (`sidebar:false` hubs + `EpisodeNav`) per the staged plan above._
