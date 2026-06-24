<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import meta from '../data/pipeline-export-segments.json'
import windowData from '../data/pipeline-preview-window.json'

// REVIEW-ONLY per-segment route renderer (Slice 2J). Mounted on each generated page of the hidden
// 99-segment route family (src/reading-review/introducao-a-ontologia/*.md, buffer/noindex/search:false).
// It joins by (canonicalId, language) read from the page frontmatter — NEVER by routePath (routePath is
// presentation only, shown as QA data, never an href; the component renders no anchors). Prose is shown
// only where a body is already vendored (the small preview window); the rest render metadata + a
// "not vendored" notice (no whole-tree import). bodyHtml is build-time sanitized (escape + *italics*).

const { frontmatter } = useData()
const canonicalId = computed(() => frontmatter.value.pipelineCanonicalId as string)
const lang = computed(() => (frontmatter.value.pipelineLanguage as string) || 'pt')

// (canonicalId, language) join — the identity key, not routePath.
const record = computed(
  () =>
    (meta.segments as any[]).find(
      (s) => s.canonicalId === canonicalId.value && s.language === lang.value
    ) ?? null
)
const body = computed(() => {
  const w = (windowData.segments as any[]).find(
    (s) => s.canonicalId === canonicalId.value && s.language === lang.value
  )
  return w?.bodyHtml ?? null
})
const part = computed(() => record.value?.groupPath.find((l: any) => l.kind === 'part') ?? null)
const chapterTitle = computed(() => {
  const c = record.value?.groupPath.find((l: any) => l.kind === 'chapter')
  return c ? c.title || c.label : ''
})
const workTitle = (meta as any).work?.title || 'Introdução à ontologia'
</script>

<template>
  <article
    v-if="record"
    class="pe-route"
    data-source="pipeline-export"
    :data-segment="record.segmentPrefix"
    :data-lang="record.language"
    :data-loaded="!!body"
  >
    <p class="pe-route__eyebrow">
      <span>{{ workTitle }}</span>
      <span class="pe-route__sep">·</span><span class="pe-route__lang">{{ record.language }}</span>
      <template v-if="part"
        ><span class="pe-route__sep">·</span><span>{{ part.label }}</span></template
      >
      <template v-if="chapterTitle"
        ><span class="pe-route__sep">·</span><span>{{ chapterTitle }}</span></template
      >
    </p>
    <h2 class="pe-route__title">{{ record.displayTitle }}</h2>

    <!-- eslint-disable-next-line vue/no-v-html -- build-time sanitized prose (escape + *italics* only) -->
    <div v-if="body" class="pe-route__prose" v-html="body" />
    <p v-else class="pe-route__notice" data-testid="pe-route-notice">
      Prosa não vendorizada para esta pré-visualização (apenas a janela). Metadados apenas — rota
      oculta (<strong>noindex</strong>, fora do sitemap / busca / LLM).
    </p>

    <details class="pe-route__qa" data-testid="pe-route-qa">
      <summary>QA (internal)</summary>
      <dl>
        <div>
          <dt>canonicalId (join key)</dt>
          <dd>{{ record.canonicalId }}</dd>
        </div>
        <div>
          <dt>segmentPrefix / language</dt>
          <dd>{{ record.segmentPrefix }} / {{ record.language }}</dd>
        </div>
        <div>
          <dt>routePath (presentation only — not a link)</dt>
          <dd>
            <code>{{ record.routePath }}</code>
          </dd>
        </div>
        <div>
          <dt>urlStability / maturity</dt>
          <dd>{{ record.urlStability }} / {{ record.maturity }}</dd>
        </div>
      </dl>
    </details>
  </article>
</template>

<style scoped>
.pe-route {
  max-width: 38rem;
  margin: 0 0 3rem;
}
.pe-route__eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.74rem;
  color: var(--sk-text-muted);
}
.pe-route__sep {
  margin: 0 0.4rem;
  opacity: 0.5;
}
.pe-route__lang {
  text-transform: uppercase;
}
.pe-route__title {
  margin: 0 0 1.4rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--sk-reading-heading);
}
.pe-route__prose :deep(p) {
  margin: 0 0 1.25rem;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--sk-reading-text, var(--sk-reading-muted));
}
.pe-route__prose :deep(em) {
  font-style: italic;
}
.pe-route__notice {
  padding: 1rem;
  border: 1px dashed var(--sk-reading-rule);
  border-radius: var(--sk-radius-sm);
  font-size: 0.95rem;
  color: var(--sk-text-muted);
}
.pe-route__qa {
  margin-top: 2rem;
  font-size: 0.72rem;
  color: var(--sk-text-muted);
}
.pe-route__qa summary {
  cursor: pointer;
}
.pe-route__qa dt {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.75;
}
.pe-route__qa dd {
  margin: 0 0 0.4rem;
}
.pe-route__qa code {
  opacity: 0.7;
}
</style>
