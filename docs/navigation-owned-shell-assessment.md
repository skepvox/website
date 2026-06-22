# skepvox Navigation & Owned-Shell Assessment

_Assessment only. No code changed beyond this file. Date: 2026-06-22._

This document is a focused, actionable assessment of **one layer**: the navigation / shell / chrome that wraps every skepvox page — the top navbar, the mobile nav, the sidebar / "Navegar" drawer, the right "Índice" outline, the doc footer / pager, and the navigation model that ties the three corpora together.

It deliberately does **not** restate the broader strategy. It builds directly on `docs/product-theme-roadmap-assessment.md` (2026-06-21), whose conclusions it adopts as settled, and narrows them to the shell so the next move is a concrete implementation slice, not another survey. It is grounded in a fresh read of the repo and of the `@vue/theme@2.3.0` source under `node_modules/@vue/theme/src/vitepress/`, with file:line citations inline.

---

## How this builds on the roadmap

**What the roadmap already established (and this assessment treats as settled):**

- **Option B is the path** — an owned layout layer _inside_ VitePress, via native slots + `page: true` mounts + scoped CSS. Not a fork (C), not leaving VitePress (D). The repo is already a partial B that works.
- **The patch is two files and does _not_ forward slots.** `patches/@vue__theme@2.3.0.patch` (~119 lines) touches only `VPNavBarSearch.vue` (local search) and `support/utils.ts` (cleanUrls). The slots are native to `VPApp.vue`. Deepening the patch is out of bounds.
- **The moat is the content model, not the theme** — `reading-nav.json`, `episodes.json`/`shows.json`, `*.cues.json`, and the SEO/canonical/sitemap/LLM machinery in `config.ts` are framework-agnostic and survive any theme change.
- **The pager is broken-by-design** and **the appearance toggle was hidden below 1280px** — both flagged, with "manifest-driven sidebar / mobile-reachable toggle" sketched for Phase 5.
- **Keep prose in the server-rendered `.vt-doc` body**; never bake layout into committed Markdown (`local-books/` is gitignored and absent); keep `pnpm verify` (now **12** Playwright specs, up from the roadmap's 8 — the new `a11y-floor`, `color-tokens`, `mobile-theme-toggle`, and `reading-font` specs already lock parts of the later work) as the merge gate.

**What this assessment adds, specific to the shell:**

1. A **per-surface, per-breakpoint, per-route map** of the chrome — including the exact `@vue/theme` mechanisms (with line numbers) the roadmap referenced only by name.
2. A precise **slot ownership boundary**: which of the 11 `VPApp` slots are reachable on which content branch, and the single architectural fact that constrains everything — **there is no `frontmatter.layout` switch in `@vue/theme`, only `frontmatter.page`**.
3. A set of findings that are **new because of the work shipped _after_ the roadmap** (color system, Literata, theme-transition fix, mobile toggle, brand-mark recolor, simplified voice, card/back tap fix). These don't just decorate the picture — they **invert the central problem** (below).
4. An explicit split: **where `@vue/theme` still helps vs where it now actively constrains** the product experience.
5. A **navigation design standard** (including the four interaction-state layers) and a **concrete next implementation prompt**.

### The central new thesis: the floor inverted the problem

The roadmap's framing was "a docs theme with prettier CSS → grow an owned identity." That framing is now out of date in one decisive way.

Because the later work routed `@vue/theme`'s surface, divider, text, and brand tokens onto the owned system (`vars.css:98-122`), enrolled `.VPNav`/`.VPNavBar`/`.VPContent` in the 0.32s theme crossfade (`utilities.css:47-66`), gave the brand mark an ink-blue mask, and put a tokenised focus ring on every _owned_ interactive element (Slice 1A) — **the owned floor now sits above the rented chrome.** The rented chrome already wears the warm-paper palette and the ink-blue active states for free. So the salient defects are no longer "it looks like docs" in aggregate; they are **specific places where the rented chrome failed to follow the owned system**: unrouted legacy-green tokens, two different focus-ring languages on one page, a sub-44px toggle, dead hover states, a wrong-by-design pager.

This reframes the Phase-5 chrome work from _"replace the shell"_ to _"finish routing the rented shell onto the owned system, and own only the few page-types where the theme genuinely fights the product."_ That is cheaper, lower-risk, and more defensible — and it is what the recommendation below sequences.

---

## Executive summary

The navigation model is **strong at its two ends and hollow in the middle.** The global section nav (Home + the three corpora) is exactly right and needs no work. At the leaf end, the owned, manifest-driven `ReadingNav` prev/next is product-grade. Between them sits everything that still reads as a documentation site: a sidebar-derived pager that emits **demonstrably wrong** next/prev on live pages, a hand-maintained sidebar that means something different on every route, an "Índice" outline that is really a layout lever in disguise, and a handful of chrome details that betray the calm-literary, iOS-restraint bar the owned surfaces now meet.

- **`@vue/theme` still helps** for the outer chrome: the navbar composition, the appearance toggle's battle-tested persistence, the local-search trigger, the native content slots that carry `ReadingNav` with no patch, and the build-time SEO hooks. Renting these is correct.
- **`@vue/theme` now actively constrains** in four concrete places: (1) the **sidebar-derived pager** sends a Vox Français reader to a Spanish episode and pages across authors on work hubs; (2) the **mobile scroll/overflow context** forces ~75 lines of JS to pin the podcast player; (3) the **`outline:2` + `footer:false` levers** are coarse page-type selectors abused to escape reading typography; (4) **legacy Vue green** has re-entered through unrouted chrome tokens, exactly where first impressions form.
- **Recommendation:** a sequenced hybrid. Do the **A-class "finish renting well" wrap slices now** (scoped CSS, token routing, config, frontmatter, specs — no DOM ownership, no patch); grow into **B-class owned page-types** (episode layout, then reading-leaf and hub shells) deliberately and later; **never C this cycle.**
- **Smallest safe first slice (the next implementation prompt is written out at the end):** a `.vitepress`-only "navigation affordance-states + chrome hardening + invariant guardrails" slice that codifies the four interaction-state rule, unifies focus rings, routes the leaked green family, closes the toggle dead-band, and ships the cheap invariant specs that de-risk every later move. It touches no content files, no builders, and no `node_modules`, so it is fully reversible behind the merge gate.

---

## What changed since the roadmap — and why it matters for the shell

Each item is shipped work the roadmap predates. The point is not that it happened; it is the **shell consequence** each created.

| Shipped later | Shell consequence (new finding) |
|---|---|
| **Owned color system** (warm surfaces, ink-blue `--sk-accent`, `--vt-c-brand` routed) | The rented navbar/sidebar/search-modal now match the owned palette for free — which **isolates** the remaining mismatches. Green did **not** leave the chrome: `vars.css` routes `--vt-c-brand` but **not** `--vt-c-green` / `--vt-c-brand-light` / `--vt-c-brand-dark` / `--vt-c-brand-highlight`, so the skip link (`VPSkipLink.vue`), the outline active-marker (`VPContentDocOutline.vue:46`, via the unrouted `var(--vt-c-green)`), the search ⌘K-key hover (`VPNavBarSearch.vue`), and the surviving doc-pager hover still paint legacy Vue green. After the deliberate brand-mark recolor, **the only green a user now meets lives in rented chrome.** |
| **Literata** scoped to `.VPContentDoc:not(.has-aside) .vt-doc` | The `has-aside` gate now controls **both** the 35rem measure **and** the reading typeface. So `outline:2` (used to opt pages _out_ of reading mode) no longer just changes density — it **strips the book face** from episode guide prose and hub blurbs. The untested coupling the roadmap flagged is now load-bearing for typography, not just width. |
| **Theme-transition fix** (one 0.32s crossfade) | `utilities.css:47-66` **enumerates** `.VPNav`/`.VPNavBar`/`.VPContent` by name and **excludes** `.VPSidebar`. "Keep renting the shell" is no longer cost-free — the crossfade composition is now **contractually entangled** with those exact theme class names; any new/renamed shell element must be added to the list or it snaps during a theme change. |
| **Mobile theme toggle** | The phone gap is closed (`pages.css:8-28` force-shows the switch ≤767.98px), but the fix created a **new 768–1279px dead-band**: the theme shows the navbar toggle only ≥1280px, the bridge fires only ≤767.98px, the hamburger overlay is gone ≥768px, and the drawer has no toggle. **No reachable theme toggle exists at all on tablet/small-laptop widths** — untested, because `mobile-theme-toggle.spec.ts:7` skips non-mobile projects. |
| **Brand-mark recolor** | The nav mark is clean, which **sharpens the asset debt**: `src/public/logo.svg` still contains `fill="#42b883"`, so favicon, `og-skepvox.png`, the absent apple-touch-icon, and `skepvox-media-session.png` still ship off-token art exactly where first impressions form. Static `theme-color` is light-only (`config.ts:272`), so dark-OS devices flash a light bar before `ThemeChromeSync` runs. |
| **Simplified literary voice** + **owned masthead grammar** | Against the new polish (PodcastEpisodeHeader/ShowHeader, ink-blue lockup), the **reading leaf's orientation poverty stands out**: its only header is a baked-in Markdown `[Voltar ao livro]` back-link + a generated `##` heading, and its `BreadcrumbList` JSON-LD has no visible counterpart. The cleaner reading mode got, the more the leaf became a **navigational island**. |
| **Card/back-navigation tap fix** | `CardGrid.vue:96-101` gates hover behind `@media (hover:hover) and (pointer:fine)` and neutralizes `:active`, fixing the iOS first-tap-after-back bug — but **scoped to cards only.** The same unguarded `:hover` survives on `PodcastShowHeader` listen-links (`:142`) and `ReadingNav` prev/next (`:151`). This is treated as a first-class issue below, not a footnote. |
| **a11y floor (Slice 1A/1B)** | Tokenised `--sk-focus-ring` on every owned element made the rented chrome's reliance on the browser's native `button:focus` ring (`base.css`) **newly conspicuous**: the page now ships **two focus languages.** Invisible before 1A; the salient shell inconsistency after it. |

---

## Current-state map of the navigation / shell layer

Maturity 1 (raw docs behavior) → 5 (owned product surface). "Owner" is what actually renders/controls it. "Seam" is the Option-B lever available without forking.

| Surface | Owner today | Maturity | Key file(s) | Seam available |
|---|---|---|---|---|
| **Global section nav** (Home · Lavelle · Literatura · Podcasts) | `@vue/theme` `VPNavBarMenu` ← `config.ts` nav | **5** | `config.ts:15-35`; `VPNavBarMenuLink.vue:33-50` | config data |
| **Navbar shell** (order, search, toggle, social, hamburger) | `@vue/theme` `VPNavBar` | **3** | `VPNavBar.vue:15-84` | `navbar-title` slot only + scoped CSS |
| **Brand mark / wordmark** | **owned** `NavBarTitleBrand` (`navbar-title` slot) | **4** | `NavBarTitleBrand.vue`; `vars.css:113,150` | done |
| **Search** | **patch** `VPNavBarSearch` → core `VPLocalSearchBox` | **3** | patch; `local-search.css` (modal bridge) | scoped CSS (button) / data |
| **Appearance toggle** | `@vue/theme` `VPNavBarAppearance` + owned mobile bridge | **2→3** | `VPNavBarAppearance.vue:14-23`; `pages.css:8-28` | scoped CSS (visibility) |
| **Mobile nav overlay** ("Navegar") | `@vue/theme` `VPNavScreen` ← flat `config.ts` nav | **4** | `VPNavScreen.vue:24-79` | config data |
| **Mobile local-nav bar** (Menu + Índice) | `@vue/theme` `VPLocalNav` (sidebar-gated) | **2** | `VPLocalNav.vue:16-49` | frontmatter / scoped CSS |
| **Sidebar / "Navegar" drawer** | `@vue/theme` `VPSidebar` ← hand `config.ts` sidebar | **3** (data) / **2** (route fit) | `config.ts:37-124`; `VPSidebar*.vue` | config data / `sidebar-top·bottom` slots |
| **Right outline / "Índice"** | `@vue/theme` `VPContentDocOutline` ← `outline` frontmatter | **2** | `VPContentDoc.vue:30-44`; `VPContentDocOutline.vue:46` | frontmatter / scoped CSS |
| **Doc footer / pager** | `@vue/theme` `VPContentDocFooter` ← sidebar order | **1** (wrong on live pages) | `VPContentDocFooter.vue:17-37` | `footer:false` (all-or-nothing) |
| **Reading pager** | **owned** `ReadingNav` (`content-top`/`-bottom` slots) | **5** | `ReadingNav.vue:27-86` | done — the model to extend |
| **Site footer** (copyright) | `@vue/theme` `VPFooter` (home `page:true` only) | **1** (renders on ~no reader route) | `VPFooter.vue`; `config.ts:406-412` | `footer-before·after` slot (page:true only) |
| **iOS bar / safe-area sync** | **owned** `ThemeChromeSync` (sibling of Layout) | **4** | `ThemeChromeSync.vue:21-72` | sibling mount (no slot, no patch) |

### The slot ownership boundary (finer than "3 of ~10 used")

`VPApp.vue:44-88` hard-mounts `VPNav`, `VPLocalNav`, `VPSidebar`, and `VPContent` in a fixed flex column. The navbar bar and the sidebar tree are **mounted, not slotted** — they cannot be owned without forking `VPApp`/`VPNavBar`/`VPSidebar` (Option C). The 11 slots split **by content branch**, which is the operative fact for any owned page-type:

| Slot | Branch | Used? | Useful for shell |
|---|---|---|---|
| `banner` | shell-level | no | site-wide preview banner (move `BufferNotice` here) |
| `navbar-title` | shell-level | **yes** → `NavBarTitleBrand` | the only navbar seam |
| `sidebar-top` / `sidebar-bottom` | inside `VPSidebar` (drawer) | no | owned corpus switcher above/below the rented tree |
| `content-top` / `content-bottom` | **`VPContentDoc` only** | **yes** → `BufferNotice`, `ReadingNav` | **does NOT reach `page:true` pages** |
| `aside-top` / `-mid` / `-bottom` | `VPContentDoc`, `has-aside` only | no | owned rail beside hubs/episodes |
| `footer-before` / `footer-after` | **`VPContentPage` (`page:true`) only** | no | owned global footer line — but only on `page:true` |

The decisive constraints: **there is no `frontmatter.layout` switch** in `@vue/theme` (grep confirms only `frontmatter.page`), so `page:true` is the single owned-shell door short of a fork; and `page:true` (`VPContentPage`) exposes **only** `footer-before/after` — **converting a reading or episode page to `page:true` silently drops `ReadingNav` and `BufferNotice`** unless they are re-mounted in the owned body. There is a third, cleaner injection mechanism the roadmap's slot inventory omits: `ThemeChromeSync` rides as a **sibling of `VPTheme.Layout`** (`theme/index.ts:23`) — neither slot nor patch — and survives any layout-branch change.

### The breakpoint regime map (corrected)

The mobile-toggle and responsive behavior have three regimes, and the boundaries do not line up — this is where the toggle dead-band and the "tablet shows no outline" gap live:

| Width | Navbar menu | Appearance toggle | Hamburger overlay | `VPLocalNav` (Menu + Índice) | Desktop outline aside |
|---|---|---|---|---|---|
| **≤767.98px (phone)** | hidden | **top bar** (owned bridge) | yes | yes (`<960px`) | no |
| **768–959px** | shown | **none reachable** | **gone (≥768px)** | yes → opens file-tree drawer | no |
| **960–1279px** | shown | **none reachable** | gone | **gone (≥960px)** | no (only ≥1280px) |
| **≥1280px (desktop)** | shown | top bar (theme) | gone | gone | yes |

Two consequences the roadmap's "<1280px" wording obscured: (1) **768–1279px has no reachable theme toggle at all** — a total gap, not "menu-only"; (2) **960–1279px shows no outline in either form**, so a single episode shows an "Índice" on a phone, nothing on a tablet, and a green-marked rail on desktop across one continuous resize.

---

## Where `@vue/theme` still helps vs where it now actively constrains

**Still helping — keep renting, do not re-implement:**

- **Global section nav** — four calm items, correct per-corpus `activeMatch`, ink-blue active underline. Exactly the small global nav the product wants, for free (`config.ts:15-35`).
- **Mobile overlay menu** — because `config.nav` is flat, `VPNavScreen` renders four calm corpus entrances (Home + the three corpora), never a docs accordion (`VPNavScreenMenu`'s group path is never exercised). The strongest part of the mobile shell.
- **Appearance toggle persistence** — `localStorage['vitepress-theme-appearance']` + the no-flash inline init are VitePress-core and battle-tested. Only reachability was wrong. Re-deriving them would be pure regression surface.
- **Native content slots + `ReadingNav`** — the proven Option-B seam; the rented pager is suppressed by `footer:false` and replaced by owned chapter nav with no patch.
- **Build hooks** — `transformHtml` (per-route `<html lang>`/`og:locale`), `transformPageData` (canonical/JSON-LD/head normalization), and `sitemap.transformItems` run at the config layer, decoupled from the layout tree. `page:true` does **not** bypass them (the homepage is `page:true` and still flows full canonical+head through `normalizeHeadUrls`). This is why owning the visual shell is low-risk for SEO.
- **`i18n` aria strings + focus order** — the pt-BR aria labels route into theme components for free; navbar→content→footer DOM order is sane.

**Now actively constraining — these are product defects, not aesthetics:**

1. **The sidebar-derived pager is wrong on live pages.** `VPContentDocFooter.vue:17-37` flattens the entire matched sidebar key with `getFlatSideBarLinks` and ignores frontmatter. Every episode carries `outline:2` and **no `footer:false`**, so on **Vox Français 003** the visible "Próximo" is **Vox Español 001** — a cross-show, cross-language jump in a product premised on one language per show. Literature work hubs page **cross-author** (`a-cartomante` → `são-bernardo`). This is a correctness bug on the most product-defining pages.
2. **The mobile scroll/overflow context disables CSS `position: sticky`,** forcing `PodcastPlayer.vue:73-149` to run ~75 lines of rAF scroll/resize + `position:fixed` + a spacer + `env(safe-area-inset-top)` math just to pin the player bar. The clearest case of the rented shell imposing real code the product would not otherwise need.
3. **`outline:2` and `footer:false` are coarse page-type levers being abused as layout selectors.** `outline:2` simultaneously keeps `has-aside` (escaping the 35rem measure _and_ Literata), enables the green outline marker, and enables the `<960px` "Índice" dropdown. `footer:false` is the only control over the pager. The concerns are fused; a hub cannot get the wide column it wants without the TOC it does not.
4. **Legacy Vue green re-entered through unrouted chrome tokens** (skip link, outline marker, search keys, doc-pager hover) — the exact "green reads as framework" failure the brand work rejected.

A fifth, structural: **renting is no longer free.** The crossfade selector list and the mobile-toggle CSS hard-code theme-internal class names; a `@vue/theme` minor bump can rename `.has-aside`, `.VPNavBarAppearance`, or `.VPNav` with neither the patch nor any spec catching it (the toggle band is untested; `reading-font.spec` only checks the rule string).

---

## UX critique by surface

### Interaction states — the tap-after-back bug as the canonical defect class

The card tap-after-back fix is not a one-off; it is the **canonical example of interaction-state confusion** that a rented docs shell allows and an owned shell must structurally prevent. The class of defect has three faces:

- **Desktop hover behavior leaking into touch.** iOS Safari applies `:hover` on first tap and consumes that tap; the user taps twice. `CardGrid.vue:96-101` fixed it for cards by gating hover behind `@media (hover:hover) and (pointer:fine)` and neutralizing `:active` — but `PodcastShowHeader` listen-links (`:142-145`) and `ReadingNav` prev/next (`:151-153`) still carry **unguarded** `:hover`, and so does every borrowed `@vue/theme` link.
- **Selected / active visual states confused with navigation.** A pressed state and a "you are here" state are different facts; when an affordance lets them blur (a hover that looks like active, an active that looks like pressed), the reader cannot tell what tapping will do.
- **Browser back/forward + bfcache + touch state creating product-level friction.** Returning to a page via back can restore stale hover/active state; without deliberate state separation this reads as the UI "sticking."

The lesson is a **standard, not a patch** (codified below): every navigation/card/list affordance must keep four interaction-state layers distinct, each with its own mechanism. The current suite guards this only on cards (`consolidation.spec.ts:40-56`, `podcast-show-page.spec.ts:86-100`); it must become a contract for every owned affordance.

### Top navbar

The bar is calm but still composed like documentation. **Search sits first and grows to fill** (`VPNavBar.vue:24`, `VPNavBarSearch.vue:116-120`), carrying a **⌘K keycap** (`:99-104`) — an IDE idiom on a reading product where the corpus nav should lead and search should be a quiet icon. The patched component is out of bounds, but the keycap and the flex-grow are theme CSS and can be quieted with owned overrides; **reordering is not cheaply available** (there is no navbar slot, only `navbar-title`), so it should not be attempted this cycle. Two correctness/polish defects: the **social `facebook` icon points at `instagram.com`** (`config.ts:403`), and **static `theme-color` is light-only**, so dark-OS devices flash a light bar before `ThemeChromeSync` runs. Social links also render only ≥1280px, which is defensible restraint for a personal product but means the icon bug is visible exactly where social shows.

### Mobile nav

The overlay menu is the **best part of the mobile shell** and should be protected as a constraint. The weakness is one layer down: `VPLocalNav` renders only when `hasSidebar` is true, and reading leaves set `sidebar:false`, so a reader inside a chapter is never shown a docs toolbar — correct. But **work hubs and episodes keep the sidebar**, so on exactly the pages a mobile reader uses to pick a chapter, the sticky "Navegar" bar opens the `config.ts` **file-tree drawer** (a flat list that duplicates the on-page `CardGrid`), and this drawer is reachable from 768–959px, not just on phones. The `outline:2` trick also switches on the mobile **"Índice"** dropdown over guide-prose headings. Two docs affordances stacked on a page whose hero is the audio player.

### Sidebar / "Navegar" drawer

The most route-incoherent surface in the chrome. One hand-maintained structure (`config.ts:37-124` — 33 links across 36 `text` entries, incl. 3 link-less Lavelle group headers; 9 groups; 3 prefixes) means something different on every route:

- **Podcast routes:** correct — sibling shows + sibling episodes. The one place the static sidebar helps. (But it is a **literal hand-duplicate** of `shows.json`/`episodes.json`.)
- **Literature/Lavelle work hubs:** wrong granularity — it shows sibling **works**, which the on-page `CardGrid` already shows (the reader sees the work list twice), and its items stop at work level, so it can **never** be the chapter contents pane a book actually wants.
- **Reading leaves:** correctly absent (`sidebar:false`). Keep.

Confirmed drift: `a-cartomante` and `o-ateneu` sit in the sidebar as works with no `reading-nav.json` backing, while all 834 manifest chapters are invisible to the sidebar — two sources maintained independently with nothing reconciling them. (Concrete reconciliation invariant for Slice 4: `reading-nav.json` keys 18 works / 834 chapters; the config sidebar lists 33 work links, of which exactly 2 — `a-cartomante`, `o-ateneu` — have no manifest entry. The generator and its spec should assert this.) Note: the active state is now ink-blue (it inherited the `--vt-c-brand` routing), so the sidebar's remaining problem is **data and route fit, not color** — which narrows the Phase-5 sidebar work to a generator, not CSS. (Also: the desktop link `:hover` is silently dead — it references `--vt-c-brand-text-1`, which is defined nowhere.)

### Right outline / "Índice"

The layer where the product most obviously still wears a docs theme. Mechanically, `outline:2` is **not a request for a table of contents** — it is the lever 33 pages pull to keep `has-aside` and thereby opt out of the 35rem reading layout. The TOC is collateral, and now harmful collateral: because Literata is gated on the same `:not(.has-aside)` selector, `outline:2` **strips the book face** from episode guide prose and hub blurbs. Per page-type: on **episodes** it lists `Notes / Vocabulaire / Expressions / Note culturelle` — docs noise over the player; on **show indexes** it is a one-item rail over a card grid; on **single-file works** a chapter TOC is genuinely navigational but **duplicates the authored in-body "Sumário."** The active-anchor marker still sources from the unrouted `var(--vt-c-green)` (`VPContentDocOutline.vue:46`), which resolves to `#42b883` — the single most visible survivor of the retired green. (The hex literal lives only in `@vue/theme`'s base `--vt-c-green` token and in `logo.svg`, never in the component, so the cure is routing the token in `vars.css`, not a hex edit in `node_modules`.)

### Doc footer / pager + site footer

`VPContentDocFooter` is the clearest place `@vue/theme` crossed from helping to harming (see "actively constraining" above). On leaves it is fully retired by `footer:false` + `ReadingNav`; on episodes and hubs it is live and wrong. The two pagers now broadcast **opposite intentions**: `ReadingNav` says prev/next is quiet muted metadata (`ReadingNav.vue:138`, focus-ringed at `:155`), while the surviving `VPContentDocFooter` paints accent-colored titles with a hard divider and **no focus ring**. The **site footer** is a quieter, genuine gap: `VPFooter` renders only in the home/landing layout, and home is `page:true`, so the copyright — and any public-domain attribution — lands on **no route a reader actually sees**. Restraint is right; **zero attribution on public-domain corpora is an oversight, not minimalism.**

### Navigation model (information architecture)

Strong ends, hollow middle. The gaps, all of whose data **already exists** in the manifests:

- **No visible breadcrumb** despite a per-leaf `BreadcrumbList` JSON-LD — Google sees the author→work→chapter trail; the reader sees only the baked `[Voltar]` back-link.
- **No "next episode."** Episodes are a genuine series (a learner works through them in order) yet get **less** progression UI than book chapters — chapters have `ReadingNav`; episodes have nothing.
- **No author↔work lateral nav.** Reaching another work by the same author requires a trip back to the corpus hub.
- **Search carries no reading context.** A hit for a common word gives no signal whether it is in Lavelle (philosophy), Machado (fiction), or a podcast transcript. The one surface that should orient across corpora orients least.
- **The reading leaf is a near-total nav dead-end** — only the baked back-link (up one level) and `ReadingNav` (within the work). The cleaner reading mode became, the more isolated the leaf got.

---

## Architecture critique

The shell decomposes into three ownership tiers, and the boundary between them is the whole game.

- **Mounted, not slotted (Option-C territory):** the navbar bar composition and the sidebar tree rendering. Reachable only by forking `VPApp`/`VPNavBar`/`VPSidebar`. **Out of bounds this cycle.** They are also genuinely still calm and helping, so the cost/benefit does not favor a fork.
- **Slot-reachable (Option-B territory):** the `navbar-title` cell, the `sidebar-top/bottom` drawer edges, `content-top/bottom` (doc branch), `aside-*` (has-aside branch), `footer-before/after` (page:true branch), and `banner` (shell-level, unused). Plus the **sibling-mount** mechanism (`ThemeChromeSync`) for side-effect-only behavior.
- **The single layout door:** `frontmatter.page`. There is no `frontmatter.layout`. So an owned page-type (episode, reading leaf, hub) must either funnel through `page:true` or remain a styled doc. And `page:true` drops `content-top/bottom` — the sharpest trap for any owned-shell migration.

The newer entanglement matters here: the crossfade list and mobile-toggle CSS now **depend on theme-internal class names**, so "rent the shell" is a standing coupling, not a free lunch. The mitigation is not to own the shell prematurely — it is to **pin those couplings with cheap invariant specs** and re-verify on every `@vue/theme` upgrade.

A note on the homepage: `Home.vue` is the one fully-owned shell (`page:true`), and it already consumes the owned system in most respects — `--sk-surface-raised`, `--sk-motion-base`, the `--sk-accent` hover, the `@media (hover: hover) and (pointer: fine)` guard, and a `--sk-focus-ring` `:focus-visible` (`Home.vue:58-80`) — so it already meets the four-state floor that `PodcastShowHeader` and `ReadingNav` (Slice 1's targets) do not. What it has *not* converged on is the **card primitive**: it keeps the legacy `.vt-box` class, an 8px radius (vs `--sk-card-radius`), and `--vt-c-divider`, a third card pattern distinct from `CardGrid`. So the interaction floor has converged on the first page a visitor sees; the card token set has not.

---

## Recommended target navigation model

Keep it calm and literary. Surface only what aids orientation; let the rest stay structural.

1. **Global section nav — keep as is.** Home + three corpora, ink-blue active state. No mega-menu, no change.
2. **Per-collection local nav — manifest-driven, eventually.** Generate the sidebar from `shows.json`/`episodes.json` + `works.json`/`reading-nav.json` so it stops being a hand-maintained second copy that drifts. Open question (below): whether the book-hub rail becomes a chapter contents pane or whether hubs simply set `sidebar:false` and let the owned `CardGrid` + `ReadingNav` be the canonical index. **Lean: `sidebar:false` on hubs** — a long chapter tree in the rail risks re-docsifying the book.
3. **Reading progression — extend `ReadingNav`.** It is the model: manifest-driven, work-bounded, localized, never crossing a book boundary.
4. **Podcast series nav — add an owned `EpisodeNav`.** Mirror `ReadingNav` over the existing per-show `episodes.json`; within-show prev/next that never crosses the show boundary; same muted styling, focus ring, reduced-motion.
5. **Up-affordance — one quiet line, not a breadcrumb component.** Promote `ReadingNav`'s top `book · author` context (or replace the baked `[Voltar]` link) into at most a single muted "up to {work} · {author}" line, SSR-rendered. **Do not** ship a chevron `Corpus / Author / Work` trail just because the JSON-LD exists — a three-segment trail on a 35rem column reads as documentation.
6. **Search as navigation — a quiet provenance line, not faceting.** Emit a muted per-page corpus/book/author label into the SSR `.vt-doc` body so results read "Óbito do Autor — Brás Cubas, Machado." Cap it there. **No** faceted/filtered search panel (the brief forbids SaaS).

Restraint guardrails (binding): no breadcrumb chevron trail; no SaaS search faceting; no multi-column or link-farm footer; the up-line and provenance label are chrome the index crawls, never body copy in the reading column.

---

## Navigation design standard (new — to fold into `docs/skepvox-design-standards.md`)

These rules govern every navigation/card/list affordance, owned or restyled-rented.

**1. Four interaction-state layers, kept distinct.** Every nav/card/list affordance must express these as **four separate mechanisms** — never let one stand in for another:

| State | Mechanism | Rule |
|---|---|---|
| **Hover** (desktop, pointer) | `@media (hover: hover) and (pointer: fine) { … :hover … }` | Hover styling **only** inside this query, so it never applies on touch. |
| **Pressed** (touch / active) | `:active`, defined deliberately (often neutral or a quiet press) | Must **not** inherit hover; touch surfaces stay visually stable until navigation. |
| **Keyboard focus** | `:focus-visible { outline: var(--sk-focus-ring); outline-offset: var(--sk-focus-offset) }` | One focus language everywhere — owned **and** rented chrome. No native UA ring. |
| **Current / active route** | explicit `aria-current` / active class | Visually distinct from hover **and** pressed, so "you are here" is never confused with "you are tapping." |

This rule exists because of the tap-after-back defect class: hover leaking into touch, active/selected blurring with navigation, and bfcache restoring stale state. It is enforced in the test plan, not left to review.

**2. One focus language.** `--sk-focus-ring` / `--sk-focus-offset` on every interactive element. The rented chrome must be brought up to it via scoped `:focus-visible` overrides, not left on `base.css`'s native ring.

**3. Manifests are the single source of truth for nav data.** No hand-maintained parallel tree (the `config.ts` sidebar must become generated). Two sources drift; one does not.

**4. Nav is chrome around the body.** Prose stays in the server-rendered `.vt-doc` so search + LLM render see it. Nav components never render the body.

**5. One motion grammar.** Chrome transitions use `--sk-ease` / `--sk-motion` and the global reduced-motion floor, matching owned surfaces; no bespoke `0.25s`/`0.5s` per-component timings.

**6. Touch targets ≥44px** for every nav control, including the appearance toggle (visible pill may stay 40×22, but the hit area must reach 44px).

**7. Restraint list (rejected patterns):** no breadcrumb chevron trail; no SaaS search faceting; no ⌘K keycap on a reading bar; no multi-column footer; no chapter file-tree in the rail.

---

## Three implementation options (for the shell layer)

| | **A — Finish renting `@vue/theme` well** | **B — Progressive owned shell inside VitePress** | **C — Full custom theme / shell** |
|---|---|---|---|
| **What** | Scoped CSS + token routing + config + frontmatter + specs. Route the leaked green family; unify focus rings; close the toggle band; `footer:false` hygiene; generate `sidebar.json`; recolor/suppress the outline. No DOM ownership. | Own page-types via native slots + `page:true`: `EpisodeNav`, the quiet up-line, then an episode layout (native sticky), then reading-leaf + hub shells; owned chrome via `banner`/`sidebar-top`; eventually owned navbar **presentation** (renting persistence + search trigger). | Fork `VPApp`/`VPNavBar`/`VPSidebar` or build a custom VitePress theme; own navbar order, sidebar tree, and the whole shell. |
| **Wins** | Hours, not weeks; zero new regression surface; fixes the live correctness bug and every color/a11y betrayal; de-risks the rest via invariant specs. | Retires the JS sticky pin, the `outline:2`/`footer:false` levers, and the file-tree drawer where they hurt; the page-types become the spec a future native app re-skins. | Total control of navbar order and sidebar rendering. |
| **Risks** | Doesn't fix the navbar order or the JS pin (neither is cheaply fixable anyway). | `page:true` drops `content-top/bottom` (must re-mount `ReadingNav`/`BufferNotice`); episode-layout migration risks the player sticky/safe-area behavior; builder-template + hand-application for any new frontmatter. | Loses the native slot inventory and patch alignment; re-implements navbar/search/i18n/toggle/persistence; large regression surface; stall risk. **Out of bounds this cycle.** |
| **Verdict** | **Do now.** | **Grow into, deliberately.** | **Not now.** |

---

## Recommendation

**A sequenced hybrid: A now, B deliberately, never C this cycle.**

The floor inversion makes A unusually high-leverage: most of what reads as "docs" is now a short list of unrouted tokens, two focus languages, a wrong pager, and a coarse layout lever — all fixable with scoped CSS, token routing, config, frontmatter, and specs, with **no DOM ownership and no patch.** B is the right destination for the few page-types where the theme genuinely fights the product (the episode layout, to retire the JS pin; the reading leaf and hubs, to dissolve `outline:2`/`footer:false`), but those are L-effort, drop `content-top/bottom`, and risk the player behavior — so they are **deliberately-spiked later moves, not first slices.** C buys only the navbar order and sidebar tree, both of which are still helping, at a cost the product does not need to pay.

**Sequenced backlog:**

- **Slice 1 — Navigation affordance-states + chrome hardening + invariant guardrails** _(the next implementation prompt, below)_. `.vitepress`-only; smallest-safe; carries the four-state standard and de-risks everything after.
- **Slice 2 — `footer:false` hygiene + "no `VPContentDocFooter`" spec.** Kills the wrong cross-show/cross-author pager. Frontmatter + builder-template change + spec. (Touches generated content, so it follows Slice 1.)
- **Slice 3 — Owned `EpisodeNav` + the quiet up-line.** Mirrors `ReadingNav` over existing manifests; gives episodes series progression and leaves a one-line up-affordance.
- **Slice 4 — Generated `sidebar.json` + search provenance line.** Retires the hand-maintained sidebar and gives search reading context.
- **Later (B page-types) — owned episode layout (retire the JS pin), then reading-leaf/hub `page:true` shells, then owned navbar presentation.**

---

## Smallest safe first slice — the next implementation prompt

Slice 1 is chosen as the smallest-safe first move because it touches **only `.vitepress/` (CSS, config, tokens, specs)** — no content files, no builder templates, no `node_modules`, no `page:true` migration — so it is fully reversible behind the merge gate, and it establishes the four interaction-state standard the rest of the work depends on. Hand this prompt to an implementer verbatim:

> **Task: Slice 1 — Navigation affordance-states + chrome hardening + invariant guardrails.**
>
> Establish the four interaction-state standard and bring the rented `@vue/theme` chrome up to the owned floor, using only scoped CSS, `vars.css` token routing, `config.ts` strings, and new Playwright specs. **Do not** edit `node_modules`, **do not** touch the patched `VPNavBarSearch.vue`/`support/utils.ts`, **do not** convert any page to `page:true`, **do not** change any builder or committed Markdown. Keep all 12 existing specs green (`pnpm verify`).
>
> **Do:**
> 1. **Four-state rule for owned affordances.** Reshape the `:hover` rules in `PodcastShowHeader.vue` (`.show-head__listen-link`, ~`:142`) and `ReadingNav.vue` (`.reading-nav__link`, ~`:151`) to mirror `CardGrid.vue:85-101` exactly — **two rules**: (a) a neutral `:hover, :active { … resting appearance … }` reset *outside* any media query (so touch never sticks a hover), and (b) the visible hover styling *inside* `@media (hover: hover) and (pointer: fine)`. This is the precise shape `consolidation.spec.ts:45-54` asserts. The non-hover rendered appearance must not change.
> 2. **Route the full leaked green/brand token family** in `vars.css` (`:root` and `.dark`): `--vt-c-green`, `--vt-c-green-light`, `--vt-c-brand-light`, `--vt-c-brand-dark`, `--vt-c-brand-highlight` → `--sk-accent` / `--sk-accent-hover`. This recolors the skip link (`VPSkipLink`), the outline active-marker (`VPContentDocOutline.vue:46`, currently `var(--vt-c-green)` → `#42b883`; the hex lives only in the base token + `logo.svg`, never in the component), the search ⌘K-key hover, and the surviving doc-pager hover. Verify no owned surface depends on literal green (the live cue uses `--sk-cue-active`/`--sk-cue-hover` — gold — so it is safe).
> 3. **Unify focus rings.** Add one scoped block applying `outline: var(--sk-focus-ring); outline-offset: var(--sk-focus-offset)` to `.VPNavBar :is(a, button):focus-visible, .VPSidebar a:focus-visible, .VPLocalNav button:focus-visible, .VPSkipLink:focus-visible, .VPContentDocOutline a:focus-visible`, generalizing the existing ≤767.98px `.vt-switch` bridge to all chrome at all breakpoints.
> 4. **Close the 768–1279px appearance-toggle dead-band.** Raise the `pages.css` force-show media query from `max-width: 767.98px` to `max-width: 1279.98px` (keep the `VPNavScreenAppearance` hide scoped to `<768px`). The theme's `min-width: 1280px` rule covers desktop above; the sub-pixel gap between `1279.98px` and `1280px` is negligible (or set the ceiling to `1279.99px`). Screenshot-review at 768 / 1024 / 1279 for collision with the nav menu (shown from 768px).
> 5. **Repair the dead sidebar hover** (`--vt-c-brand-text-1` is undefined): scoped `.VPSidebar .link:hover .link-text { color: var(--sk-accent) }`.
> 6. **Fix two small defects:** correct the social `facebook`→`instagram.com` mismatch in `config.ts:403` (use the instagram icon or a custom SVG), and rename `i18n.appearance` from `'Modo de leitura'` to `'Tema'` (leave `ariaDarkMode` unchanged) — note this is a **latent/correctness-only** fix with no expected screenshot diff: the visible toggle is labelled by `ariaDarkMode`, and `i18n.appearance` renders only in the mobile nav-screen card, which is hidden in the regimes where that overlay appears. Add a dark-aware static `theme-color` meta (`media="(prefers-color-scheme: dark)" content="#181510"`) alongside the existing light one so dark-OS first paint matches.
> 7. **Enlarge the appearance toggle hit area to ≥44px** without resizing the visible 40×22 pill (padding or an `::before` hit-expander), across breakpoints. The expander must grow within the toggle's own box (vertically, not leftward toward `.menu`, which is present from 768px) so it cannot overlap the nav menu in the 768–1279px band — screenshot-check at 768 / 1024 / 1279 alongside step 4.
>
> **Invariant guardrails (ship in the same slice — these de-risk every later move):**
> - A spec asserting every reading leaf (frontmatter `book` + `chapter-id`) renders inside `.VPContentDoc:not(.has-aside)` and every podcast episode renders `.has-aside` (the gate now controls both the 35rem measure and Literata).
> - A spec asserting internal links in the built `dist` HTML are extensionless (cleanUrls) — no owned/built link may bypass the `support/utils.ts` patch.
> - A spec asserting no rendered green survives in the chrome — both the bright family `#42b883` / `rgb(66,184,131)` (skip link, outline marker) **and** the green-dark family `#33a06f` / `rgb(51,160,111)` (the doc-pager `:hover`, via `--vt-c-brand-highlight`) — checked in **both** light and dark (the highlight token's source swaps by mode), mirroring `a11y-floor.spec.ts`.
> - A spec asserting the chrome `:focus-visible` rule resolves for the selectors in step 3, and that the four-state hover rules in step 1 sit inside a `(hover: hover)` media query.
> - A **tablet (1024px) Playwright project** extending `mobile-theme-toggle.spec.ts`: the toggle is reachable and flips `.dark` + `theme-color`, with no horizontal overflow.
>
> **Acceptance:** one focus language across the whole page; no legacy green anywhere; the appearance toggle reachable and ≥44px at all widths with the dark-aware first paint; owned touch affordances stable on first tap; the canonical screenshots unchanged except the intended recolor / focus ring / restored hover; `pnpm verify` green.

---

## Files likely touched

**Slice 1 (this prompt):** `.vitepress/theme/styles/vars.css` (green-family routing), `.vitepress/theme/styles/pages.css` (toggle band, focus-ring block, sidebar hover, toggle hit area), `.vitepress/theme/components/PodcastShowHeader.vue` + `ReadingNav.vue` (hover guards), `.vitepress/config.ts` (social fix, `i18n.appearance`, dark `theme-color`), and new specs under `tests/` + a tablet project in `playwright.config.ts`.

**Slice 2:** episode `.md` + work/author-hub `.md` frontmatter (`footer:false`), `scripts/sync-podcast-lesson-pages.py` + literatura/lavelle builder templates, a `no-VPContentDocFooter` spec.

**Slice 3:** new `.vitepress/theme/components/EpisodeNav.vue`, `theme/index.ts` (content-bottom wiring), `ReadingNav.vue` (top up-line) or its builder; specs.

**Slice 4:** a `sidebar.json` generator + `config.ts` import; search-provenance emission in the builder templates; spec migration for `literature.spec.ts`/`louis-lavelle.spec.ts` (they string-match `config.ts` today).

**Later (B):** new owned layout components, `PodcastPlayer.vue` (retire the JS pin), `vars.css` (`--sk-gutter`/safe-area token), the crossfade selector list.

---

## Test plan

The 12 specs in `tests/` are the merge gate. New coverage, per slice:

- **Four interaction states (Slice 1):** assert hover rules for owned affordances sit inside `(hover: hover)`; assert `:focus-visible` resolves to `--sk-focus-ring` for the chrome selectors; assert active-route uses an explicit class/`aria-current` distinct from hover/pressed. Extend the existing tap-after-back coverage (`consolidation.spec.ts`, `podcast-show-page.spec.ts`) to the listen-link and `ReadingNav`.
- **No green leak (Slice 1):** built-CSS / computed-style assertion that neither the bright green `#42b883` / `rgb(66,184,131)` (skip link, outline marker) nor the green-dark `#33a06f` / `rgb(51,160,111)` (doc-pager hover, via `--vt-c-brand-highlight`) survives — in both light and dark.
- **Toggle reachability (Slice 1):** a tablet (1024px) project asserting the toggle flips `.dark` + `theme-color` with no horizontal overflow; keep the phone assertions.
- **`has-aside` invariant (Slice 1):** reading leaves are `:not(.has-aside)`, episodes are `.has-aside` — guards both the measure and Literata.
- **cleanUrls (Slice 1):** internal `dist` HTML links are extensionless.
- **No rented pager (Slice 2):** no `.VPContentDocFooter` in the rendered DOM on `/podcast/`, `/literatura/`, `/louis-lavelle/` routes.
- **`EpisodeNav` (Slice 3):** within-show prev/next never crosses the show boundary; no-ops on book leaves; `ReadingNav` no-ops on episodes.
- **Canonical host (ongoing):** assert the rendered canonical/og host is `www.skepvox.com` and extensionless. The committed source canonicals are inconsistent in **three** patterns — leaf chapters use bare `skepvox.com` **with** `.html`; literature work hubs use bare `skepvox.com` extensionless; podcast episodes use `www.skepvox.com` extensionless — and `normalizeSiteUrl`/`normalizeSitePathname` unify all three to `www` + extensionless at build. The spec confirms that masking holds so a future owned-built link can't silently regress it.

---

## Visual verification plan

Capture the canonical route set — **chapter leaf (pt-BR + fr), work hub, author hub, podcast episode, show page, home** — at **mobile / tablet (1024) / desktop**, **light + dark**. The tablet width is added specifically because the toggle and outline gaps live at 768–1279px.

For Slice 1, the only intended diffs are: the active outline marker and skip link turning ink-blue; a unified focus ring on keyboard focus across chrome; the restored sidebar hover; the toggle present at tablet widths. Eyeball, in particular:

- The **skip link** on first Tab (was green → ink-blue, owned ring).
- The **outline active-marker** scrolling a work hub (was `#42b883`).
- **Keyboard focus** on the search button, hamburger, appearance switch, sidebar links — one ring language now.
- The **appearance toggle** at 768 / 1024 / 1279 — present, not colliding with the nav menu, ≥44px hit area.
- **First tap** on a listen-link and a `ReadingNav` link on a real iOS device after a back-navigation — no double-tap.
- **Dark-OS first paint** — browser bar starts dark, no light flash.

---

## Risks and rollback strategy

- **`page:true` drops `content-top/bottom`** — any later reading/episode migration to `page:true` silently loses `ReadingNav`/`BufferNotice`. Mitigation: a source-scan spec forbidding `page:true` on files with `book`/`chapter-id` or a `PodcastPlayer` import; re-mount nav in the owned body when the page-type shells land.
- **`.has-aside` is untested and now gates typography too** — a stray `aside`/`outline` flip or a `@vue/theme` class rename silently demotes a chapter. Mitigation: the Slice-1 invariant spec.
- **Class-name entanglement** — the crossfade list and toggle CSS hard-code theme-internal classes. Mitigation: keep them in one commented file pinned to the locked versions; re-verify on every `@vue/theme` bump; the tablet spec now covers the previously-untested band.
- **cleanUrls / canonical** — owned-built links can bypass the `utils.ts` patch and emit `.html`; committed source canonicals are inconsistent across three patterns (bare `skepvox.com` + `.html` on leaves, bare `skepvox.com` extensionless on work hubs, `www` extensionless on episodes) and are correct only because `normalizeSiteUrl`/`normalizeSitePathname` rewrite them all to `www` + extensionless at build. Mitigation: the cleanUrls + canonical-host specs; longer-term, normalize the committed source.
- **Player sticky/safe-area (Slice "Later")** — owning the episode layout could fix _or_ break the mobile pin depending on the new scroll/contain context. `podcast-player.spec` pins both the desktop sticky band and the mobile fixed assertion; a migration must update both deliberately, and introduce a `--sk-gutter`/safe-area token rather than hand-math.
- **Spec coupling** — `literature.spec.ts`/`louis-lavelle.spec.ts` string-match `config.ts`; a generated sidebar (Slice 4) must emit byte-compatible structure or migrate those specs.

**Rollback posture:** every shell move is additive and reversible. Slice 1 reverts by removing the added CSS/config/spec lines (no content or `node_modules` touched). Slices that touch generated content always pair a builder-template change with the frontmatter edit, so a regeneration cannot silently revert the fix. No wholesale navbar/sidebar swap at any point — replace piece by piece behind the merge gate.

---

## Open decisions for you

These are genuine forks that need a call before the slices they gate. (Items 1–4 are new to this assessment; 5–8 refine or carry forward roadmap open decisions.)

1. **768–1279px toggle.** Adopt the recommended fix (raise the bridge to ≤1279.98px so the top-bar toggle covers all sub-desktop widths)? Confirmed: there is currently **no reachable toggle at all** in that band. _Gates Slice 1._
2. **Book-hub rail.** When the sidebar becomes manifest-driven, should a work hub's rail be a **chapter contents pane** (deeper data, risks a docs file-tree feel) or should hubs simply set **`sidebar:false`** and let the owned `CardGrid` + `ReadingNav` be the canonical index? _Lean: `sidebar:false`._ _Gates Slice 4._
3. **Up-affordance shape.** A single muted "up to {work} · {author}" line (recommended) vs the current bare `[Voltar]` back-link vs a full breadcrumb trail (not recommended). _Gates Slice 3._
4. **Search provenance.** Emit a quiet per-page corpus/book/author label into the indexed body (recommended) — and confirm it stays a provenance line, never faceted search UI. _Gates Slice 4._
5. **Pager strategy site-wide.** Retire `VPContentDocFooter` everywhere (recommended once `footer:false` is universal, guarded by the absence spec) vs keep it available for hypothetical future doc pages? _Gates Slice 2._
6. **Global footer / attribution.** Add one muted copyright + public-domain line via the `footer-before/after` slot (which requires the page to be `page:true`, so it rides the later hub/leaf shells) vs keep reading pages chrome-free and accept zero attribution? _Affects Slices "Later."_
7. **Own the episode layout to retire the JS pin?** Worth the L-effort + player-regression risk for native sticky and removed `env()` math, or keep the working JS pin until a broader episode-shell need appears?
8. **Logo asset follow-up.** Regenerate favicon / `og-skepvox.png` / `skepvox-media-session.png` / add apple-touch-icon from a token-correct mark (the nav is clean; these raster/OG assets still carry the legacy green). Static-asset + head work only; can ride Slice 1 or stand alone. (Carried over from the roadmap's closing handoff.)
