# skepvox-website · docs index

Where to start, by topic.

## Reading app / pipeline-export (start here)

- **[reading-app-website.md](reading-app-website.md)** — **canonical** website-side entry point:
  pipeline-export ingestion, the live pt route family + hub, the stability-aware visibility gate, owned
  segment navigation, route migration + redirects, discovery hygiene, invariants, remaining work,
  deferred ideas, and open decisions. Pipeline/export source-of-truth lives in
  `skepvox-book-pipeline/docs/website-export-contract.md`.

### Reference / depth (kept in place; referenced by code/tests)

- [introduction-a-ontologia-live-migration-plan.md](introduction-a-ontologia-live-migration-plan.md) —
  the **route-migration plan of record** (executed); §6 has the old→new route table.
- [reading-app-segment-workhub-assessment.md](reading-app-segment-workhub-assessment.md) — the deep
  **segment/reading data model** + granularity invariants + two-state reading model (design substrate).
- [website-export-ingestion-assessment.md](website-export-ingestion-assessment.md) — Slice 2A ingestion
  analysis (superseded; realized).
- [work-contents-component-spec.md](work-contents-component-spec.md) — spec for the **live** WorkContents
  component (de-l-acte / Brás Cubas; the hand-authored reading-nav path, distinct from the pipeline family).

### Archive (historical)

- [archive/book-pipeline-website-export-contract-assessment.md](archive/book-pipeline-website-export-contract-assessment.md)
- [archive/reading-app-next-session-handoff.md](archive/reading-app-next-session-handoff.md)

## Homepage / site IA

- **[homepage-pillar-gateway-assessment.md](homepage-pillar-gateway-assessment.md)** — evolving the A6
  calm editorial homepage into a **data-connected pillar gateway**: surfaces live pillar content from
  `pipeline-export-segments.json` + the podcast manifests, narrows the visible third pillar to **Vox
  Français** (Español/English stay public but unpromoted), and stays calm/editorial/bookish (no hero, no
  dashboard, no generic cards). Defines slices **H1–H6**, the route-centralization `pillars.ts` module,
  the test deltas, and the first implementation prompt. Frame: the A6 entry in
  [locale-rooted-website-ia-assessment.md](locale-rooted-website-ia-assessment.md); shell posture:
  [navigation-owned-shell-assessment.md](navigation-owned-shell-assessment.md) +
  [sidebar-local-nav-model.md](sidebar-local-nav-model.md).

## Other docs (unrelated to the reading-app/pipeline-export work)

Pre-existing site docs, left untouched by this consolidation: `books-workflow.md`,
`local-podcast-business-model-next-steps.md`, `navigation-owned-shell-assessment.md`,
`product-theme-roadmap-assessment.md`, `seo-strategy.md`, `sidebar-local-nav-model.md`,
`slice-1c-color-accent-assessment.md`.

## Deferred strategy notes

- [social-presence-footer-strategy.md](social-presence-footer-strategy.md) — social/distribution
  presence and the future owned-footer link set (YouTube, Instagram, WhatsApp, podcast links,
  newsletter/RSS), deferred until after the Brás Cubas pilot, the consolidation/test-protocol pass, and
  the Brand Asset System pass that unifies favicon/search preview/Apple touch/manifest/OG/logo assets.
