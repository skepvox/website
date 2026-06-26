<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import meta from '../data/pipeline-export-segments.json'
import SkLink from './SkLink.vue'
import {
  navLabel as navLabelFor,
  openingLabel as openingLabelFor,
  locLabel as locLabelFor,
  workHubHref,
  trechoHref
} from './reader-shell'

// Owned reader LOCATION PATH for the live pipeline pt segment leaves (Slice F1). Replaces the flat
// two-line chapter+segment header with a calm, navigable breadcrumb-as-reader-location-line:
//   <nav aria-label> › <ol role="list"> › Sumário (SkLink → hub) · Part (text) · Chapter (real <h2>,
//   SkLink → hub#trecho-<current>) · current Segment (real <h3>, aria-current="location", not a link).
// SEO/outline preserved: exactly one real <h2> when a chapter exists + one real <h3>, h2 before h3.
// Joined by (canonicalId, language) into the SAME pipeline-export metadata the bottom nav uses — no
// prose, no data/generator change. Static (no sticky, no scroll listener). Front matter (empty
// groupPath) renders Sumário · Abertura · <segment> with no chapter h2. The .pseg-head marker class is
// kept so pages.css can scope the prose bump + the back-link exclusion to pipeline leaves.
// See docs/reader-breadcrumb-navigation-assessment.md. Slice F2: the per-language labels and the hub /
// #trecho href construction come from the shared ./reader-shell module — no pt hub hard-code, no local
// label maps; fr/en inherit from the data via pipelineLanguage.

interface Level {
  kind: string
  index: number
  key: string
  label: string
  title: string | null
}
interface Seg {
  canonicalId: string
  language: string
  order: number
  displayTitle: string
  routePath: string
  segmentPrefix: string
  groupPath: Level[]
}

const { frontmatter } = useData()
const isPipelineLeaf = computed(() => frontmatter.value.generated === 'pipeline-segment-routes')
const canonicalId = computed(() => frontmatter.value.pipelineCanonicalId as string)
const lang = computed(() => (frontmatter.value.pipelineLanguage as string) || 'pt')

// Join by (canonicalId, language) — identity, never routePath (presentation). Same source the bottom
// PipelineSegmentNav uses; metadata only, no prose.
const current = computed<Seg | null>(() =>
  isPipelineLeaf.value
    ? ((meta.segments as Seg[]).find(
        (s) => s.canonicalId === canonicalId.value && s.language === lang.value
      ) ?? null)
    : null
)

const navLabel = computed(() => navLabelFor(lang.value))
const openingLabel = computed(() => openingLabelFor(lang.value))
const locLabel = computed(() => locLabelFor(lang.value))

const groupPath = computed<Level[]>(() => current.value?.groupPath ?? [])
const part = computed(() => groupPath.value.find((l) => l.kind === 'part') ?? null)
const chapterLevel = computed(() => groupPath.value.find((l) => l.kind === 'chapter') ?? null)
// Conclusion/back-matter sentinels (99-99-999-*, empty groupPath) are NOT the opening — do not label
// them "Abertura". F1 renders them as Sumário · <segment>; the look-back fold to the last real chapter
// (matching the hub) is deferred to Slice F4. Only true front matter gets the Abertura rung.
const isConclusion = computed(
  () => !!current.value && current.value.segmentPrefix.startsWith('99-99-999')
)
const isFrontMatter = computed(
  () => !!current.value && groupPath.value.length === 0 && !isConclusion.value
)

// Chapter rung text: prefer the JSON groupPath chapter (one source of truth), fall back to the
// frontmatter mirror. Current segment text: the leaf's own displayTitle, fall back to frontmatter.
const chapterTitle = computed(
  () =>
    chapterLevel.value?.title ||
    chapterLevel.value?.label ||
    (frontmatter.value.pipelineChapter as string) ||
    ''
)
const segmentTitle = computed(
  () => current.value?.displayTitle || (frontmatter.value.pipelineSegmentTitle as string) || ''
)
// Sumário → the work hub (contents top), derived from the segment's routePath (no pt hard-code).
const hubHref = computed(() => (current.value ? workHubHref(current.value.routePath) : '/'))
// Chapter → hub#trecho-<current>: opens + highlights the containing chapter (the exact href the bottom
// up-link builds) — a deliberately distinct destination from the Sumário (whole contents) crumb.
const chapterHref = computed(() =>
  current.value ? trechoHref(current.value.routePath, current.value.segmentPrefix) : hubHref.value
)
</script>

<template>
  <nav
    v-if="isPipelineLeaf && current && segmentTitle"
    class="pseg-loc pseg-head"
    data-testid="pseg-head"
    :data-pipeline-nav="lang"
    :aria-label="locLabel"
  >
    <ol role="list" class="pseg-loc__list">
      <!-- Sumário (root) — link to the hub contents top -->
      <li class="pseg-loc__rung">
        <SkLink class="pseg-loc__link" :href="hubHref">{{ navLabel }}</SkLink>
      </li>
      <!-- Part (mid-book) — plain text, label only (the long part title stays on the hub) -->
      <li v-if="part" class="pseg-loc__rung pseg-loc__rung--part">
        <span class="pseg-loc__sep" aria-hidden="true">·</span>
        <span class="pseg-loc__part">{{ part.label }}</span>
      </li>
      <!-- Abertura (front matter, empty groupPath) — plain text -->
      <li v-else-if="isFrontMatter" class="pseg-loc__rung">
        <span class="pseg-loc__sep" aria-hidden="true">·</span>{{ openingLabel }}
      </li>
      <!-- Chapter — the real <h2>, link to hub#trecho-<current> -->
      <li v-if="chapterLevel" class="pseg-loc__rung pseg-loc__rung--chapter">
        <span class="pseg-loc__sep" aria-hidden="true">·</span>
        <h2 class="pseg-head__chapter">
          <SkLink class="pseg-loc__link" :href="chapterHref">{{ chapterTitle }}</SkLink>
        </h2>
      </li>
      <!-- Current segment — the real <h3>, current location, NOT a link -->
      <li class="pseg-loc__current">
        <h3 class="pseg-head__title" aria-current="location">{{ segmentTitle }}</h3>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/* The reader location path (Slice F1): a calm, navigable breadcrumb rendered in the reading shell's
   own kicker vocabulary — ancestors recessive (uppercase muted kicker), the current segment the one
   prominent mixed-case line below. Static, aligned to the reading column. The .pseg-head marker class
   is kept (pages.css scopes the prose bump + the back-link exclusion to :has(.pseg-head)). */
.pseg-loc {
  max-width: var(--sk-reading-measure, 35rem);
  margin: 0 auto 1.25rem;
}
.pseg-loc__list {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Ancestor rungs — Sumário, Part, Abertura, Chapter: the quiet uppercase kicker family already used by
   the leaf chapter kicker + the hub part labels. Same recessive size; only the current segment carries
   weight. */
.pseg-loc__rung {
  font-size: var(--sk-reading-kicker);
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  color: var(--sk-text-muted);
}
/* The chapter rung is a REAL <h2> (kept for SEO/outline) styled inline as a kicker rung. */
.pseg-loc__rung--chapter .pseg-head__chapter {
  display: inline;
  margin: 0;
  padding: 0;
  border: 0;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
}
.pseg-loc__rung--chapter .pseg-head__chapter::before {
  content: none; /* no chapter-opener accent bar */
}
/* The Part rung is plain inline text so it baseline-aligns with the other rungs (an inline-block +
   overflow:hidden would make its baseline the bottom edge and ride the label up). Long-part-label
   truncation is deferred to Slice F4, which must reinstate it baseline-safely. */
.pseg-loc__rung--part {
  min-width: 0;
}

/* Decorative middot separator — an aria-hidden span kept out of the a11y tree, faint ink. */
.pseg-loc__sep {
  margin: 0 0.35em;
  color: var(--sk-text-faint);
}

/* The current segment — the one prominent mixed-case line, on its own row (full ink, segtitle). */
.pseg-loc__current {
  flex-basis: 100%;
  margin-top: 0.7rem; /* clears the ancestor links' touch-slop so it never overlaps the segment text */
}
.pseg-loc__current .pseg-head__title {
  margin: 0;
  padding: 0;
  /* The current segment belongs to the same UPPER-CASE SANS reader-location language as the breadcrumb
     ancestors (not the serif prose / hub title) — same case + tracking, so the whole path reads as one
     vocabulary. It stays the clear CURRENT location, primary over the muted ancestors via size + weight
     + full ink (not via case): 1rem/600 full-ink vs the ancestors' 0.8125rem/500 muted. Below the 17px
     prose, so it never reads as a huge document title. Sans is explicit so it can't inherit a serif. */
  font-family: var(--vt-font-family-base);
  font-size: var(--sk-reading-segtitle);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  color: var(--sk-text);
}

/* Crumb links — SkLink owns the focus ring; a generous touch box via padding + a cancelling negative
   margin (no line inflation); quiet pointer-gated hover. */
.pseg-loc__link {
  display: inline-block;
  padding-block: 0.7rem;
  margin-block: -0.7rem;
  color: inherit;
  text-decoration: none;
}
@media (hover: hover) and (pointer: fine) {
  .pseg-loc__link:hover {
    color: var(--sk-reading-heading);
  }
}
</style>
