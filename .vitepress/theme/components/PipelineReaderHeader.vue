<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

// Owned compact reader-header for the live pipeline pt segment leaves. It renders the leaf's chapter
// and segment title as REAL headings — h2 = chapter, h3 = segment title — that the website generator
// (build-pipeline-segment-routes.py) lifts out of the prose body into frontmatter
// (pipelineChapter / pipelineSegmentTitle). So each page keeps exactly one real <h2> + <h3> in
// document order (SEO / outline preserved), but rendered as calm owned chrome — no vt-doc 24px
// chapter-opener with an accent bar. Injected via the theme content-top slot and self-gated on the
// generated marker (pipeline-segment-routes), like PipelineSegmentNav. The prose stays dominant.
const { frontmatter } = useData()
const isPipelineLeaf = computed(() => frontmatter.value.generated === 'pipeline-segment-routes')
const chapter = computed(() => (frontmatter.value.pipelineChapter as string) || '')
const segmentTitle = computed(() => (frontmatter.value.pipelineSegmentTitle as string) || '')
</script>

<template>
  <div
    v-if="isPipelineLeaf && chapter"
    class="pseg-head"
    data-testid="pseg-head"
    data-pipeline-nav="pt"
  >
    <h2 class="pseg-head__chapter">{{ chapter }}</h2>
    <h3 v-if="segmentTitle" class="pseg-head__title">{{ segmentTitle }}</h3>
  </div>
</template>

<style scoped>
/* Aligned to the reading column; a quiet chapter kicker over a calm segment title, with the prose
   (17px Literata) left as the dominant element. Matches the Slice A reading vocabulary. */
.pseg-head {
  max-width: var(--sk-reading-measure, 35rem);
  margin: 0 auto 1.25rem;
}

/* h2 = chapter, demoted to a small-caps kicker (no accent bar, no 3rem event). */
.pseg-head__chapter {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: var(--sk-reading-kicker);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  color: var(--sk-text-muted);
}
.pseg-head__chapter::before {
  content: none; /* explicitly no chapter-opener accent bar */
}

/* h3 = segment title, the one line that changes trecho→trecho; sits just below the kicker. */
.pseg-head__title {
  margin: 0.15rem 0 0;
  padding: 0;
  font-size: var(--sk-reading-segtitle);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--sk-text);
}
</style>
