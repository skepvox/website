# Reading-App — Next-Session Handoff

> **Superseded: start with [`../reading-app-website.md`](../reading-app-website.md).** Archived
> point-in-time handoff (bridge-manifest checkpoint); the work it pointed forward to is now done (pt is
> live). Its parked ideas are preserved in the canonical doc's "Deferred ideas" section.

**Purpose:** restart cleanly tomorrow without re-deriving the thread. Closing handoff only — **no
implementation beyond docs.** We are ending the day at a stable website checkpoint.

**Read first (context, in order):**
`docs/reading-app-segment-workhub-assessment.md` → `docs/work-contents-component-spec.md` →
`docs/archive/book-pipeline-website-export-contract-assessment.md` (the most recent; the destination).

---

## 1. Current stable state

- The website is synced/pushed through the **book-pipeline → Kairos → website export-contract
  assessment** (`docs/archive/book-pipeline-website-export-contract-assessment.md`). That document is the
  destination this work is heading toward.
- **WorkContents has proved two UI modes — as *website-data prototypes only*, not real app data:**
  - **grouped mode:** `de-l-acte` (book-level authored groups, collapsible).
  - **flat mode:** `Brás Cubas` (163 leaves, presentation range dividers, ch.053 title-debt fallback).
- **`segment-manifest.json` is a conservative BRIDGE** generated from committed website data only
  (`build-segment-manifest.py`); `canonicalId` is provisional, `groupPath` is inferred from numeric
  prefixes, `semanticMaturity` is `unknown`, `urlStability` is `preserve`. It does **not** read the
  pipeline.
- Also stable: `PodcastEpisodeNav` (within-show pager), `SkLink` + the four-state navigation standard,
  the `footer:false` pager hygiene, and the green→`--sk-accent` routing.
- **Do not treat current website slugs / frontmatter as final app identity.** They are an older
  generation (mixed `chapter-id` vs `book/part/chapter/segment-number` schemes; route-derived; a large
  per-leaf `head:` SEO block; title-quality debt like Brás Cubas ch.053).
- **Durable direction:** the **pipeline** owns segmentation, `canonicalId`, `groupPath`, edition
  pairing, and maturity; **Kairos** owns personal reading/review; the **website** consumes a clean
  pipeline export and produces no segmentation.

## 2. What NOT to do next

- Do **not** broaden WorkContents to more books from website-inferred structure.
- Do **not** remove the concatenated full-book hub prose yet (that is gated on the Slice c SEO/search
  replacement).
- Do **not** change public slugs/routes.
- Do **not** generate segments inside the website repo.
- Do **not** make Kairos the public source.
- Do **not** implement the AI companion, the reading-progress colour map, auth, or native-app work yet.
- Do **not** patch or fork `@vue/theme` for this next step.

## 3. Proper next-session objective

Move to the **source-of-truth workflow: book-pipeline + Kairos + website export integration** — starting
**from the pipeline side**. The website should stop inferring structure from old committed Markdown; the
pipeline should produce the mature export the website/app consumes.

**Recommended first concrete target: *Introdução à ontologia*** (`louis-lavelle/introduction-a-l-ontologie`).

**Why:** it is already segmented in the pipeline (fr 99 ↔ pt 99, 1:1), has original↔pt pairing, and
exercises real authored structure (Part → Chapter → paragraph) far better than the old website data.
**But the next step is still preparatory:** define and export the pipeline contract for *one* work
**before** changing any website consumption. (Per the export-contract assessment §10, per-level authored
titles do not exist in the pipeline yet — only `chapter-title` — so the Part title for this work is a
named prerequisite to produce.)

## 4. Next-session prompt (use this verbatim)

> **Pipeline-side export assessment/plan for one work — read-only or tightly scoped, no implementation
> unless explicitly asked.**
>
> We are starting the book-pipeline + Kairos + website integration, pipeline-side first. Do **not**
> change the website yet, and do **not** implement pipeline changes unless I explicitly ask — this is an
> assessment/plan.
>
> Target work: **Introdução à ontologia** (`skepvox-book-pipeline` `louis-lavelle/introduction-a-l-ontologie`).
> Build on `docs/archive/book-pipeline-website-export-contract-assessment.md`.
>
> Do (read-only inspection + written plan):
> 1. Inspect the `skepvox-book-pipeline` flow for this work (raw → extracted → processed → segmented,
>    fr + pt) and its Kairos projection (`sync-map.yaml`), read-only.
> 2. Propose the **minimal pipeline export artifact for this one work** (per-work JSON bundle: work
>    record + ordered segment records, no prose; plus how prose is delivered separately, joined by
>    `canonicalId`).
> 3. Propose the **frontmatter harmonization** needed to produce it: `levels[]` / `groupPath` with
>    **per-level authored titles** (incl. the currently-missing Part title), `editionRole`,
>    `canonicalId`, `bucket`, and the `maturity`/`review` fields — and confirm **personal-field
>    stripping** (`read-at`, `==highlights==`, `%% review %%`, `needs-review`/`tags`/`note`, Kairos
>    432/433/434) by generating from the repo `pt/` side, never the Kairos corpus.
> 4. Define exactly **what the website would consume later** (which artifact, which fields, how
>    `WorkContents`/`ReadingNav` would read it, and the per-edition `routeSlug` mapping that keeps public
>    URLs stable).
> 5. Identify the **exact files/scripts to change in `skepvox-book-pipeline`** (e.g. `src/frontmatter.py`,
>    `src/segment_*.py`, `docs/frontmatter-policy.md`, a new export builder) — but **do not implement**
>    unless I explicitly ask.
>
> Do not: change the website, change public routes, generate segments in the website repo, make Kairos
> the public source, or touch `@vue/theme`. Deliver a written plan (a doc in `skepvox-book-pipeline` or a
> scoped assessment), commit on `develop`, do not push.

## 5. Parked future ideas (out of scope)

- **Segment-level reading-progress colour map** — captured as a deferred future experiment in
  `docs/product-theme-roadmap-assessment.md` ("Future Experiment — Segment-Level Reading-Progress Map").
  Calm, literary, ambient; **not gamified**. Revisit only after a stable segment manifest, a
  per-reader/per-segment progress model, and an owned reading shell exist. **Out of scope now.**
- **AI Reading Companion** — captured as deferred in
  `docs/reading-app-segment-workhub-assessment.md` §11. A quiet, segment-scoped "scholar beside the
  text" (skepvox-provided backend, Option 2). Belongs **after** stable segment identity, backend/auth,
  and source-paired editions. **Out of scope now.**

## 6. Validation / state

- **Files changed this close:** `docs/reading-app-next-session-handoff.md` (new, this handoff);
  `docs/product-theme-roadmap-assessment.md` (the previously-parked future segment-progress note, now
  committed).
- **Roadmap future-progress note included?** **Yes** — its only uncommitted change was the parked
  "Future Experiment — Segment-Level Reading-Progress Map" section (intentionally captured, harmless
  future context), so it is folded into this closing commit.
- **No code / build / content changes.** Docs only. `pnpm verify` is unaffected.
- **No push.** Committed on `develop`; Codex will review, approve, and push.
