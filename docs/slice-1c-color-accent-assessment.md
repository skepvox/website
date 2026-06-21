# Slice 1C — skepvox Color / Accent System Assessment

_Assessment + implementation proposal only. No code changed. Date: 2026-06-21._

Slice 1A added semantic tokens + the a11y floor; Slice 1B migrated mechanical type/spacing/radius/motion values onto tokens. The next open foundation is **color**. This document audits the whole color system, diagnoses the problem, and proposes an owned skepvox color/accent direction that moves the product from "a docs theme with prettier CSS" toward something calm, literary, iOS-adjacent, and quietly premium. It is grounded in a full read of `vars.css`, every component's CSS, the `pages.css` prose styles, and `@vue/theme`'s base palette.

---

## Current-State Audit

### The base palette is Vue's, and the brand is Vue's green

`@vue/theme/src/core/styles/variables.css` defines `--vt-c-green: #42b883` and `--vt-c-brand: var(--vt-c-green)` — and **`--vt-c-brand` is not overridden in `.dark`**, so the brand is the same bright `#42b883` in light and dark. Every component references `var(--vt-c-brand, #3c8772)`; the `#3c8772` fallback is **dead code** (the variable is always defined), so the rendered accent across the entire site is `#42b883` — verified by the Slice 1A focus-ring measurement (`rgb(66,184,131)`). The only place `#3c8772` is real is the `theme-color` meta tag in `config.ts`, which is therefore a *different, darker green* than anything on screen.

The text/surface tokens are also Vue's: `--vt-c-text-1/2/3`, `--vt-c-bg`, `--vt-c-bg-soft`, `--vt-c-divider`. The reading ink `rgb(33,53,71)` used throughout `--sk-reading-*` is exactly `--vt-c-text-light-1` (`#213547`). So skepvox's "ink" is Vue's docs ink, and skepvox's "accent" is Vue's docs green.

### Where green appears — 14 distinct jobs for one color

| # | Job | Where (file:line) | Value |
|---|---|---|---|
| 1 | Brand wordmark ("skepvox") | `Home.vue:55` `.accent` | full `#42b883` |
| 2 | Card hover border (home pillars) | `Home.vue:78` | full |
| 3 | Card hover border (CardGrid) | `CardGrid.vue:89` | full |
| 4 | Card eyebrow numbers (001/002) | `CardGrid.vue:133` | full |
| 5 | Eyebrow `·` separators | `PodcastShowHeader.vue:87`, `PodcastEpisodeHeader.vue:76` | full |
| 6 | Listen-link hover (text + underline) | `PodcastShowHeader.vue:142–143` | full |
| 7 | Episode masthead rule (2px bar) | `PodcastEpisodeHeader.vue:96` | full |
| 8 | Prev/next direction labels | `ReadingNav.vue:138` `.reading-nav__dir` | full |
| 9 | Focus ring (all surfaces) | `vars.css:52` `--sk-focus-ring` | full |
| 10 | Chapter `h2` section rule | `pages.css:52` ← `--sk-reading-accent` | **soft** `rgba(66,184,131,.18)` |
| 11 | Active podcast cue highlight | `PodcastPlayer` ← `--sk-cue-active` | **soft** `rgba(66,184,131,.26/.32)` |
| 12 | Nav active state (underline+text) | `@vue/theme VPNavBarMenuLink.active` | full (inherited) |
| 13 | Prose links (`.vt-doc a`) | `@vue/theme` default | full (inherited) |
| 14 | Local-search highlight; code-tab bar | `local-search.css:16–17`, `vars.css:2` | full (inherited) |

So green is doing **brand, links, navigation-active, focus, hover, every eyebrow separator, card numbers, direction labels, the section rule, and the audio cue** — i.e. nearly every "something matters here" signal on the site is the same hue. When one accent means everything, nothing reads as the signal — and the specific hue it is (a bright SaaS/developer green) actively says "Vue docs."

### The `--sk-*` color tokens today

`vars.css` defines a **single-ink alpha system** (good) plus a small green family:
- Ink (light): `--sk-reading-heading: var(--vt-c-text-1)`, `--sk-reading-body: rgba(33,53,71,.86)`, `--sk-reading-muted: rgba(33,53,71,.62)`, `--sk-reading-rule: rgba(33,53,71,.10)`.
- Green: `--sk-reading-accent: rgba(66,184,131,.18)` (the h2 rule), `--sk-cue-active: rgba(66,184,131,.26)`, `--sk-cue-hover: rgba(33,53,71,.06)`.
- Dark: every token has a `.dark` override; the ink flips to `rgba(255,255,255,*)` (pure white-alpha); the green **stays the same hue**, only nudged in opacity.

`--vt-c-*` surface/border tokens are consumed ~30× across components (`text-1` ×8, `text-2` ×5, `divider` ×6, `bg`/`bg-soft` ×8, `yellow-1` ×1 for BufferNotice). These are the docs palette and the dependency we eventually want to own.

### Per-surface read (light + dark)

- **Homepage** (`Home.vue`): the "skepvox" wordmark is bright green; pillar cards hover to a green border on a `--vt-c-bg-soft` fill. Reads brand-green-forward, the most "generic green SaaS" surface.
- **Podcast hub / show / episode**: card eyebrow numbers green, eyebrow `·` separators green, episode masthead rule green, listen-links hover green, the active cue soft-green. The episode page is where green is most justified (the **cue** is genuinely a live state) and most overloaded (separators/rule/eyebrow all green too).
- **Literature & Lavelle hubs / work hubs**: CardGrid eyebrows + hover borders green; otherwise ink. Calm already, undercut by the green eyebrow/hover.
- **Chapter / segment leaves** (the product core): mostly pure ink — *except* the green `h2` section rule (soft) and the green prev/next direction labels. These are the two spots where the reading surface still shows the docs-green.
- **Dark mode everywhere**: a near-mechanical inversion — `@vue/theme`'s cold near-black bg, pure-white-alpha ink (the assessment flagged this as harsh for night reading), and the **identical bright `#42b883`** green, which on a cold dark bg reads more neon/acid than in light. Dark feels "inverted," not "deep and literary."

---

## Design Diagnosis

Grounded in the subject: skepvox's world is **ink on paper** — the printed philosophical work, the literary page, the quiet study, the bound book. Its accent should belong to that world. Instead it is a developer-tooling green inherited wholesale from a Vue documentation theme, applied to everything. Three specific failures:

1. **Wrong hue.** `#42b883` is a bright, slightly acidic green that signals "framework docs / dev tool / SaaS," the exact opposite of "literary, premium, calm." No amount of restraint elsewhere overcomes an accent that says "Vue."
2. **No single job.** The same green carries brand, links, nav-active, focus, hover, separators, numbers, the section rule, and the audio cue. The eye can't tell the *meaningful* signals (active chapter, now-playing cue) from the *decorative* ones (a `·`, an eyebrow number).
3. **Dark mode is inverted, not designed.** Cold near-black + pure-white ink + identical neon green = a terminal, not a book by lamplight.

The fix is not "more color." It is: **own the accent (retire Vue green from the brand role), give the accent exactly one meaning, demote the decorative green to neutral ink, and reserve any remaining green for the one place a green literally means something — the live audio cue.** Then design dark as warm/deep rather than inverted.

The one aesthetic risk worth taking here (and it is defensible): **color is rare and earns its place.** On a reading product, the calmest, most premium move is for the reading surfaces to be essentially monochrome ink, with a single restrained accent for orientation and a single functional green for "now playing." Color appears where something is *true* (this is the current chapter; this is the line being spoken), never as decoration.

---

## Recommended Color Philosophy

1. **One ink, expressed as alpha.** Keep the single-ink system (it is already skepvox's calmest asset) and formalize it as `--sk-ink` with alpha steps. Forbid new greys.
2. **Own the accent; retire Vue green as brand.** Introduce a distinct `--sk-accent` that belongs to the ink-and-paper world. Lead recommendation: an **ink-deepened blue** drawn from the same family as the reading ink — so the palette stays essentially one hue and reads as "the ink, turned up," which is the most cohesive and the most iOS-adjacent (Apple's restraint is a single deep system color, not a rainbow).
3. **The accent has one job: orientation + identity.** Current/active state, the brand mark, focus, and the *restrained* link affordance. Nothing decorative.
4. **Green's one job: the live audio cue.** Decouple it from brand into `--sk-cue`. Green = "this line is being spoken right now." It earns its place because it marks something genuinely live, and it appears only on podcast episode pages. (If you prefer zero green, the accent can absorb the cue too — see Open Decisions.)
5. **Demote decorative green to neutral ink.** Eyebrow `·` separators, eyebrow text, card eyebrow numbers, prev/next direction labels, and card hover borders move to muted-ink / faint-ink / a hairline. They are metadata and punctuation; they do not need an accent.
6. **Design dark as warm and deep.** Own the surface tokens: a deep, slightly warm near-black (ink/leather), a warm off-white ink (not pure white), and a slightly lifted accent so it sits calmly rather than glowing. Dark should feel like reading by lamplight.
7. **Spend boldness once.** The accent is the only chromatic identity on reading surfaces; the cue is the only chromatic event on podcast surfaces. Everything else is ink. Resist re-greening.

### Answers to the ten questions (summary)

1. **Keep/modify/introduce?** Introduce a distinct **`--sk-accent`**. Do not keep Vue green as the brand.
2. **Green's single job?** The **live podcast cue** ("now playing"), via a dedicated `--sk-cue` token — not brand, not links, not focus.
3. **Which green uses demote to neutral?** Eyebrow separators, eyebrow text, card eyebrow numbers, prev/next direction labels, card hover borders, code-tab bar → muted/faint ink or hairline.
4. **Links — prose vs cards vs nav vs cues?** Prose: ink text + a quiet underline (accent underline on hover), never bright green. Cards: the whole card is the link; affordance is a quiet border/bg shift (de-greened), no inline link color. Nav: active = `--sk-accent` underline. Cues: a seek control whose *active* state is the green cue highlight; hover stays neutral ink.
5. **Chapter `h2` rule?** Keep the bar, recolor it to **soft accent** (`--sk-accent-soft`) — a quiet ink-blue section marker, not green. (Neutral hairline is the more austere alternative.)
6. **Active cue — keep green + separate token?** Yes and yes. Keep green for the cue *because it is the one live signal*, and give it its own `--sk-cue` token fully decoupled from `--sk-accent`.
7. **Light/dark difference?** Dark is not an inversion: own a warm deep near-black surface, a warm off-white ink, and a luminance-lifted accent; keep the cue green but slightly softened. (Details in the token model.)
8. **Tokens after 1C?** See **Proposed Token Model**.
9. **Smallest safe slice?** A **pure indirection** slice: introduce the semantic color tokens as aliases of today's values and re-point every green reference to them, with **zero visual change**. (See **Recommended Implementation Slice**.)
10. **Regressions/risks?** Contrast of the new accent (focus ring ≥3:1, links ≥4.5:1), the already-borderline `--sk-reading-muted` at small sizes, cue-text-on-tint contrast, dark-surface override blast radius, and the `@vue/theme`-inherited green (nav-active, prose links, search) which lives outside our CSS. (See **Accessibility** + **Risks**.)

---

## Proposed Token Model

Semantic, owned, portable (maps cleanly to a future iOS/Android theme). Values below use the modern `rgb(triple / alpha)` form so the ink and accent each have one source channel.

```css
:root {
  /* —— Ink: one hue, alpha steps —— */
  --sk-ink: 33 53 71;                          /* #213547, the reading ink */
  --sk-text:        rgb(var(--sk-ink) / 0.90); /* headings / strong */
  --sk-text-body:   rgb(var(--sk-ink) / 0.82); /* body copy */
  --sk-text-muted:  rgb(var(--sk-ink) / 0.66); /* meta, eyebrows, labels (was .62) */
  --sk-text-faint:  rgb(var(--sk-ink) / 0.42); /* separators, faint punctuation */
  --sk-rule:        rgb(var(--sk-ink) / 0.10); /* hairlines, borders */

  /* —— Surfaces (owned; warm, not pure #fff/#1a1a1a) —— */
  --sk-surface:        #fbfaf8;                /* page — a warm near-white (paper) */
  --sk-surface-raised: #f4f2ee;                /* cards / soft fills */

  /* —— Accent: owned, ONE job (orientation / brand / focus) —— */
  --sk-accent:       #2f4a6b;                  /* ink-blue, Direction A (see Open Decisions) */
  --sk-accent-hover: #233a57;
  --sk-accent-soft:  rgb(47 74 107 / 0.16);    /* h2 rule, subtle active fills */
  --sk-accent-contrast: #ffffff;               /* text on a filled accent, if ever used */

  /* —— Cue: green, the live-audio "now playing" signal, decoupled from brand —— */
  --sk-cue:        66 184 131;                 /* #42b883, used ONLY for the cue */
  --sk-cue-active: rgb(var(--sk-cue) / 0.26);
  --sk-cue-hover:  rgb(var(--sk-ink) / 0.06);

  /* —— Links —— */
  --sk-link:       var(--sk-text-body);        /* prose links read as ink… */
  --sk-link-line:  rgb(47 74 107 / 0.45);      /* …with a quiet accent underline */
  --sk-link-hover: var(--sk-accent);

  /* —— Focus (a11y) —— */
  --sk-focus-ring:   2px solid var(--sk-accent);
  --sk-focus-offset: 3px;
}

.dark {
  --sk-ink: 235 232 225;                        /* warm off-white, not pure white */
  --sk-text:        rgb(var(--sk-ink) / 0.92);
  --sk-text-body:   rgb(var(--sk-ink) / 0.82);
  --sk-text-muted:  rgb(var(--sk-ink) / 0.66);
  --sk-text-faint:  rgb(var(--sk-ink) / 0.46);
  --sk-rule:        rgb(var(--sk-ink) / 0.12);

  --sk-surface:        #14120f;                 /* deep, slightly warm near-black */
  --sk-surface-raised: #1d1a15;

  --sk-accent:       #8fb3df;                   /* luminance-lifted ink-blue for dark */
  --sk-accent-hover: #a6c4e8;
  --sk-accent-soft:  rgb(143 179 223 / 0.20);

  --sk-cue:        66 184 131;
  --sk-cue-active: rgb(var(--sk-cue) / 0.30);
  --sk-cue-hover:  rgb(var(--sk-ink) / 0.08);

  --sk-link-line:  rgb(143 179 223 / 0.45);
}
```

**Compatibility note:** keep the existing `--sk-reading-heading/body/muted/rule` names as **aliases** of the new ink tokens during migration (`--sk-reading-muted: var(--sk-text-muted)` etc.) so no component breaks. `--sk-reading-accent` becomes `var(--sk-accent-soft)`. This lets the recolor land token-by-token without touching every component at once.

---

## Exact Component / Surface Changes

After the indirection slice (below), the visible recolor reassigns each green use:

| Surface (file:line) | Today | After 1C |
|---|---|---|
| Brand wordmark `Home.vue:55` | green | `--sk-accent` |
| Pillar card hover `Home.vue:78` | green border | `--sk-rule`→accent-soft border, or accent at low weight |
| CardGrid hover `CardGrid.vue:89` | green border | accent-soft border (quiet) |
| CardGrid eyebrow # `CardGrid.vue:133` | green | `--sk-text-muted` (metadata, not accent) |
| Eyebrow `·` separators `ShowHeader:87` / `EpisodeHeader:76` | green | `--sk-text-faint` |
| Listen-link hover `ShowHeader:142–143` | green text+line | `--sk-link-hover` (accent) |
| Episode masthead rule `EpisodeHeader:96` | green bar | `--sk-accent` (orientation) **or** `--sk-accent-soft` |
| Prev/next dir labels `ReadingNav:138` | green | `--sk-text-muted`; the link gains accent on hover/focus |
| `h2` section rule `pages.css:52` | soft green | `--sk-accent-soft` |
| Active cue `--sk-cue-active` | soft green | **keep** (now `--sk-cue`, decoupled) |
| Focus ring `vars.css:52` | green | `--sk-accent` (contrast-checked) |
| Prose links (`@vue/theme .vt-doc a`) | green | override in `pages.css`: `--sk-link` ink + `--sk-link-line` underline, `--sk-link-hover` on hover |
| Nav active (`@vue/theme`) | green | override `.VPNavBarMenuLink.active { color/border: var(--sk-accent) }` |
| Search highlight `local-search.css:16–17` | green | `--sk-accent` |
| Code-tab bar `vars.css:2` | green | `--sk-accent` (minor) |

Surface/dark changes (the larger, separable step): point the page background and card fills at `--sk-surface` / `--sk-surface-raised`, and the dark `.dark` body background at the warm near-black — this is the part with real blast radius (it changes every page's background) and should be its own slice with full screenshot review.

Legacy `style-guide.css` and `options-boxes.css` still reference `--vt-c-green` directly; confirm whether those surfaces are live before touching (likely vestigial).

---

## Accessibility / Contrast Checks

- **Accent on surface (text/lines).** `#2f4a6b` on `#fbfaf8` ≈ **8.5:1** (passes AAA for text, ample for focus/links). Dark `#8fb3df` on `#14120f` ≈ **8:1**. Both safe for links, nav-active, and the focus ring.
- **Focus ring.** Must stay ≥3:1 against both the element and the page. Accent at 8:1 on surface passes comfortably; re-run the Slice 1A keyboard-focus check after recolor.
- **Muted text — a real fix needed.** Today `--sk-reading-muted` (ink @ .62) ≈ `#7a8691` on white ≈ **~3.7:1** — it **fails 4.5:1** for the small (12–13px) uppercase eyebrows/labels it is actually used on. Bumping to **.66** (≈ `#6f7c88`, ~4.4:1) or .70 (~4.7:1) brings the small-text uses to/above AA. This slice should raise the muted step (proposed .66) and verify.
- **`--sk-text-faint` (.42)** is for *non-text* separators (`·`) and decorative marks only — never body or label text — so it is exempt from text contrast, but keep it off anything a screen reader treats as meaningful.
- **Cue text on tint.** The cue highlights a background tint; the cue *text* stays ink. `--sk-cue-active` at .26 over white is a pale green; ink text on it remains ~9:1. In dark, ink-as-warm-white on the .30 tint over near-black must be re-checked (expect fine, but verify).
- **Dark warm off-white.** `#ebe8e1` @ .82 on `#14120f` ≈ **>11:1** for body — comfortable and less harsh than pure-white-alpha.
- **Do not regress the focus floor.** `--sk-focus-ring`/`--sk-focus-offset` stay; only the color channel changes (green→accent). The a11y-floor spec must stay green.

---

## Screenshot Verification Plan

Capture the canonical set at **mobile + desktop, light + dark**, before/after each visible slice:
- homepage (wordmark + pillar hover)
- podcast hub, a show page (eyebrows, listen row), an episode page (masthead rule, **active cue mid-play**, section labels)
- literature hub, an author hub, a work hub
- a literature chapter leaf and a Lavelle leaf (the `h2` rule, prev/next labels, prose-link sample)

Assertions / measurements:
- The **indirection slice** must produce **zero pixel diff** (prove it: same screenshots).
- After recolor: confirm green is gone from reading surfaces (h2 rule + dir labels now accent/ink), present only as the **active cue** on a playing episode.
- Re-measure the focus ring color (was `rgb(66,184,131)` → expect the accent) and confirm `:focus-visible` still triggers (extend the existing keyboard-focus check).
- Spot-check computed contrast for: a muted eyebrow, a prose link, the nav-active item, an active cue's text — light and dark.
- Watch the **dark surface slice** specifically for the consent banner, search modal, code blocks, and BufferNotice (yellow) sitting on the new warm bg.

---

## Risks and Open Decisions

**Risks**
- **Inherited green outside our CSS.** Nav-active, prose links, and search highlight come from `@vue/theme` and require overrides (in `pages.css` / `local-search.css` / a nav override), not just token edits. Missing one leaves a green island.
- **Dark surface blast radius.** Overriding the page background touches *every* page and interacts with `@vue/theme` components (modal, sidebar, code blocks) and the inline consent banner (which hardcodes `--vt-c-bg-soft`). Keep this as its own slice with wide screenshots.
- **Modern color syntax.** `rgb(var(--sk-ink) / .9)` needs the space-separated channel form; ensure the build/browsers target supports it (they do for the stated targets) or fall back to explicit rgba in the token definitions.
- **Token aliasing drift.** During migration both old (`--sk-reading-*`) and new (`--sk-text-*`) names exist; keep aliases until every consumer is migrated, then remove in a cleanup.
- **Theme-color meta mismatch.** Update `config.ts` `theme-color` (`#3c8772`) to the new accent so the mobile chrome matches.

**Open decisions**
1. **Accent hue (the brand call).** Direction **A — ink-blue `#2f4a6b`** (recommended: cohesive with the ink, iOS-adjacent, calmest) vs Direction **B — muted oxblood/bordeaux `#7c3a40`** (warmer, "bound-book" editorial identity, a clearer break from green, but bolder and must be used sparingly). A neutral third option exists: **no chromatic accent at all** ("color is reserved for sound") — reading surfaces pure ink, green only for the cue — the most austere/literary, but it removes brand color from the wordmark/nav.
2. **Keep green for the cue, or go fully owned?** Recommended: keep green as the **live-cue** signal (functional, conventional). Alternative: replace the cue with `--sk-accent` and remove green entirely — maximally owned, but loses the "green = playing" intuition.
3. **Dark surfaces now or later?** Recommended: ship the accent recolor first (smaller, safer), then the warm-dark surface rework as a separate slice.
4. **Muted contrast bump.** Confirm raising `--sk-reading-muted` from .62 → ~.66 (small but it changes every muted label slightly). Recommended yes (AA fix).

---

## Recommended Implementation Slice

**Slice 1C-i — color token indirection (smallest safe; zero visual change).**
- Add the semantic color tokens (`--sk-ink`, `--sk-text*`, `--sk-surface*`, `--sk-accent*`, `--sk-cue`, `--sk-link*`) to `vars.css` as **aliases of today's values** — `--sk-accent: var(--vt-c-brand)`, `--sk-cue: 66 184 131`, `--sk-text-muted: rgba(33,53,71,.62)`, etc. — and keep `--sk-reading-*` as aliases pointing at them.
- Re-point every component green reference (`var(--vt-c-brand, …)`) and the focus ring to `var(--sk-accent)` / `var(--sk-cue-*)`, **without changing any rendered value**.
- **Acceptance:** identical screenshots (prove with the canonical set), `pnpm verify` green, focus-ring still `rgb(66,184,131)`. This is the exact 1A/1B pattern — additive, reversible, establishes the seam.

**Then, in order (each its own reviewable, visible slice):**
- **1C-ii — accent recolor + green demotion.** Flip `--sk-accent` to the chosen hue (Open Decision #1), demote decorative greens to ink per the table, override the three `@vue/theme` green islands (prose links, nav-active, search), recolor the h2 rule to `--sk-accent-soft`, bump muted to .66, update the `theme-color` meta. Green now appears only as the cue. Full before/after screenshots + contrast checks.
- **1C-iii — warm/deep dark + owned surfaces.** Own `--sk-surface*`, override the dark page background to the warm near-black and ink to warm off-white, lift the dark accent. Wide screenshot review (modal, sidebar, code, banner, BufferNotice).

Start with **1C-i**. It is the smallest safe step, it cannot regress the default UI, and it converts "green is hardcoded everywhere" into "one accent token" — after which the recolor is a one-line value change behind a reviewable diff.
