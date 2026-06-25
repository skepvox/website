# Reader-shell component boundaries — assessment

Recorded during the pt reading-experience **hardening** slice (audit + fix of the hub → segment →
next → up → hub flow for `louis-lavelle/introducao-a-ontologia`). Question: are the owned
reader-shell component boundaries good enough, or is a new component justified now?

Bar for adding a component: it must **fix an observed reading-flow problem, remove real duplication,
or create a clearer boundary needed for this slice** — never an abstraction for its own sake. A split
that is a good idea but not necessary now is documented and deferred, not built.

## Current boundaries — sufficient now

- **`PipelineWorkContents.vue`** — the hub surface: work title + collapsible Part → Chapter → Segment
  map (from `groupPath`) + collapse-state persistence + return-highlight. One cohesive surface, one
  data source (`pipeline-export-segments.json`), gated by `PipelineWorkContentsMount` on
  `generated: pipeline-work-hub`.
- **`PipelineSegmentNav.vue`** — the leaf chrome: top context eyebrow + bottom prev/next + up link.
  One component, two placements via a `placement` prop; self-gated on
  `generated: pipeline-segment-routes`; joins the same metadata by `(canonicalId, language)`.
- **`SkLink.vue`** — the shared link primitive (focus ring, `aria-current`, neutral touch). Already
  the shared boundary both components consume; no duplication of link behaviour.

**Verdict: sufficient.** The two fixes this slice — de-duplicating the chapter heading (eyebrow → work
· part only, since the chapter is already the page `<h2>`) and the return-to-hub highlight
(`#trecho-<segmentPrefix>` opens + marks the chapter) — fit inside the existing two components and
created no duplication. No new component is justified now.

State boundary: `PipelineWorkContents` stores only boolean collapse state in `localStorage`,
namespaced by work/language. It does not store last-read position, progress, user identity, or any
personal reading signal. The return highlight is URL-only (`#trecho-<segmentPrefix>`).

## Considered and rejected (now)

- **`PipelineReaderShell` / `PipelineReaderHeader`** — a shell/header wrapper would pay off only if the
  hub and the leaf shared layout or state that is currently duplicated. They do not: both compose the
  `@vue/theme` Layout slots (`content-top`/`content-bottom`), not a custom shell, and share state only
  through frontmatter markers + the metadata file. Introducing a wrapper now is speculative. **Reject.**
- **`PipelineSegmentContext` / `PipelineUpLink`** — splitting the eyebrow or the up-link out of
  `PipelineSegmentNav` is naming-driven. The `placement` prop already separates the top (context) from
  the bottom (nav), and neither piece is reused elsewhere. **Reject.**

## Deferred (good idea, not necessary now) — with triggers

- **Shared `ContentsTree` core** (a presentational tree shared by `PipelineWorkContents` and the legacy
  `WorkContents`). *Trigger:* a **second pipeline work** exists **and** the tree shape has stabilized.
  Doing it now would re-couple the deliberately separate pipeline-export and legacy `segment-manifest`
  data worlds and break `segment-manifest.spec.ts`'s exact-consumer invariant. **Defer.**
- **`PipelineEditionSwitch`** (an edition switcher on the leaf/hub) — only meaningful once a second
  edition (the fr source) is published. Out of scope this slice (no fr edition yet). The leaf chrome
  already never crosses editions, so adding the switch later is additive. **Defer.**

Anything built later must clear the same bar: fix a real flow problem or remove real duplication.
