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
  workId: string
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
// workId = canonicalId minus the segmentPrefix leaf — the per-work filter, so the location path is built
// from ONE work's sequence (multi-work artifact, B2) and never folds across books that share a language.
const workId = computed(() => canonicalId.value?.split('/').slice(0, -1).join('/'))

// Join by (canonicalId, language) — identity, never routePath (presentation). Same source the bottom
// PipelineSegmentNav uses; metadata only, no prose.
// Same-language edition, ordered by `order` — the canonical sequence, used to look back from a
// conclusion sentinel to its authored chapter (the fold). Same source/sort as PipelineSegmentNav.
const edition = computed<Seg[]>(() =>
  isPipelineLeaf.value
    ? (meta.segments as Seg[])
        .filter((s) => s.workId === workId.value && s.language === lang.value)
        .sort((a, b) => a.order - b.order)
    : []
)
const current = computed<Seg | null>(
  () => edition.value.find((s) => s.canonicalId === canonicalId.value) ?? null
)

const navLabel = computed(() => navLabelFor(lang.value))
const openingLabel = computed(() => openingLabelFor(lang.value))
const locLabel = computed(() => locLabelFor(lang.value))

const isConclusion = computed(
  () => !!current.value && current.value.segmentPrefix.startsWith('99-99-999')
)
// Conclusion/back-matter sentinels (99-99-999-*, empty groupPath) are NOT the opening. The hub FOLDS
// them into the last authored chapter so they read continuously; the path matches by inheriting the
// nearest prior authored part/chapter (Slice F4 look-back fold — a render-layer fold of EXISTING data,
// never invented structure), so a conclusion reads "Sumário · <last part> · <last chapter> · <segment>"
// instead of an orphaned "Sumário · <segment>". True front matter (00-00-000) keeps its Abertura rung.
const groupPath = computed<Level[]>(() => {
  const own = current.value?.groupPath ?? []
  if (own.length > 0 || !isConclusion.value) return own
  const idx = edition.value.findIndex((s) => s.canonicalId === current.value!.canonicalId)
  for (let i = idx - 1; i >= 0; i--) {
    if (edition.value[i].groupPath.length > 0) return edition.value[i].groupPath
  }
  return own
})
const part = computed(() => groupPath.value.find((l) => l.kind === 'part') ?? null)
const chapterLevel = computed(() => groupPath.value.find((l) => l.kind === 'chapter') ?? null)
const isFrontMatter = computed(
  () => !!current.value && (current.value.groupPath?.length ?? 0) === 0 && !isConclusion.value
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
// Chapter-level work (e.g. Brás Cubas): the segment IS the whole chapter, so the chapter rung and the
// segment line would be the SAME title. Collapse to ONE prominent current heading (the chapter as the
// location) instead of rendering it twice. Detected from the data (chapter title == segment title), not
// the work id; a paragraph-level work (Lavelle: chapter "Ser" ≠ segment "Parágrafo 7") is unaffected.
const isChapterLevel = computed(
  () => !!chapterLevel.value && !!current.value && chapterTitle.value === segmentTitle.value
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
        <span class="pseg-loc__part" :title="part.label">{{ part.label }}</span>
      </li>
      <!-- Abertura (front matter, empty groupPath) — plain text -->
      <li v-else-if="isFrontMatter" class="pseg-loc__rung">
        <span class="pseg-loc__sep" aria-hidden="true">·</span>{{ openingLabel }}
      </li>
      <!-- Chapter-level work (Brás Cubas): the chapter IS the current location — one prominent real
           <h2> (not a link), on its own row; no separate segment <h3> (it would duplicate the title). -->
      <li v-if="isChapterLevel" class="pseg-loc__current">
        <h2 class="pseg-head__title" aria-current="location">{{ segmentTitle }}</h2>
      </li>
      <template v-else>
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
      </template>
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
/* Long-title hardening (Slice F4). The realistic case (pt + the coming fr edition: short part labels
   "Primeira parte"/"Première partie", short chapter words) keeps the ancestors on one line with the
   current segment below — two calm lines, no truncation (measured). For unexpectedly long titles the
   ancestor rungs WRAP to additional lines gracefully: the wrap is baseline-safe per line, never
   overlaps, and never overflows the column horizontally (the breadcrumb stays inside the reading
   measure). As a safety net the Part — the lowest-value rung — end-truncates with an ellipsis when it
   is the sole over-long item on a line; the truncation lives on the flex-item <li> (not an inline-block)
   so it is baseline-safe (the inline-block-overflow baseline bug applies only to inline-level boxes).
   The current segment, on its own row, never truncates. */
.pseg-loc__rung--part {
  min-width: 2.5em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Decorative middot separator — an aria-hidden span kept out of the a11y tree, faint ink. */
.pseg-loc__sep {
  margin: 0 0.35em;
  color: var(--sk-text-faint);
}

/* The current segment — the one prominent mixed-case line, on its own row (full ink, segtitle). */
.pseg-loc__current {
  flex-basis: 100%;
  margin-top: 0.85rem; /* matches the ancestor links' touch-slop so it never overlaps the segment text */
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
  /* padding + a cancelling negative margin give a ~44px touch box (Apple HIG / WCAG 2.5.5 minimum)
     without inflating the line — the negative margin removes the padding's layout push, so the rung
     baseline is unaffected. 0.85rem each side + ~17px content ≈ 44px. */
  padding-block: 0.85rem;
  margin-block: -0.85rem;
  color: inherit;
  text-decoration: none;
}
@media (hover: hover) and (pointer: fine) {
  .pseg-loc__link:hover {
    color: var(--sk-reading-heading);
  }
}
</style>
