<script setup lang="ts">
import { computed, ref } from 'vue'
import meta from '../data/pipeline-export-segments.json'
import windowData from '../data/pipeline-preview-window.json'

// REVIEW-ONLY full-work reader prototype (Slice 2G). Proves the mature reader shape for a WHOLE work
// without loading all prose.
//
// PERFORMANCE BOUNDARY (load-bearing):
//   - The full-work "Trechos" overview is built from pipeline-export-segments.json = METADATA ONLY
//     (99 pt rows, authored Part -> Chapter -> Segment via groupPath). These records carry NO body.
//   - Prose is loaded ONLY for the small window (pipeline-preview-window.json, ~5 segments). Selecting
//     or viewing an UNLOADED segment imports/loads nothing — there is no body to fetch and none is
//     faked; the reading pane shows a "não carregado" notice instead.
// Hosted ONLY on the buffer (noindex/unlisted/out-of-search) page
// src/reading-review/introduction-a-l-ontologie-reader.md. Movement is client-side ref state (no
// navigation, no localStorage). routePath is QA-only, never an href; the component renders no anchors.

interface Level {
  kind: string
  label: string
  title: string | null
}
interface MetaSeg {
  canonicalId: string
  workId: string
  language: string
  segmentPrefix: string
  order: number
  displayTitle: string
  groupPath: Level[]
  routePath: string
  urlStability: string
  maturity: string
}
interface WindowSeg {
  segmentPrefix: string
  bodyHtml: string
}

// This reading-review reader previews the Lavelle pilot export specifically; with the multi-work
// artifact (B2) it selects that work's segments by workId so another book's pt segments never bleed in.
const WORK_ID = 'louis-lavelle/introduction-a-l-ontologie'
const LANG = 'pt'
const ptSegs = (meta.segments as MetaSeg[])
  .filter((s) => s.workId === WORK_ID && s.language === LANG)
  .sort((a, b) => a.order - b.order)

// The ONLY prose-bearing data: the small window (current + nearby), keyed by segmentPrefix.
const loaded = new Map((windowData.segments as WindowSeg[]).map((s) => [s.segmentPrefix, s]))
const loadedOrder = (windowData.segments as WindowSeg[]).map((s) => s.segmentPrefix)

// Full-work structure from metadata only: ordered groups Part -> Chapter -> Segment, with front
// matter / conclusion (empty groupPath) as quiet loose groups in reading order.
const structure = computed(() => {
  const groups: any[] = []
  let g: any = null
  let chap: any = null
  for (const s of ptSegs) {
    if (!s.groupPath.length) {
      if (!g || g.type !== 'loose') {
        g = { type: 'loose', key: `loose-${s.segmentPrefix}`, segments: [] }
        groups.push(g)
        chap = null
      }
      g.segments.push(s)
      continue
    }
    const part = s.groupPath[0]
    const chapter = s.groupPath[1]
    if (!g || g.type !== 'part' || g.key !== part.key) {
      g = { type: 'part', key: part.key, label: part.label, title: part.title, chapters: [] }
      groups.push(g)
      chap = null
    }
    if (!chap || chap.key !== chapter.key) {
      chap = { key: chapter.key, title: chapter.title || chapter.label, segments: [] }
      g.chapters.push(chap)
    }
    chap.segments.push(s)
  }
  return groups
})

const selectedPrefix = ref<string>((windowData as any).current || loadedOrder[0])
const selected = computed(
  () => ptSegs.find((s) => s.segmentPrefix === selectedPrefix.value) ?? null
)
const selectedBody = computed(() => loaded.get(selectedPrefix.value)?.bodyHtml ?? null)
const isLoaded = (prefix: string) => loaded.has(prefix)
const partOf = (s: MetaSeg | null) => s?.groupPath.find((l) => l.kind === 'part') ?? null
const chapterTitleOf = (s: MetaSeg | null) => {
  const c = s?.groupPath.find((l) => l.kind === 'chapter')
  return c ? c.title || c.label : ''
}

// prev/next move WITHIN the loaded prose window only (disabled when the selection is outside it).
const windowPos = computed(() => loadedOrder.indexOf(selectedPrefix.value))
const canPrev = computed(() => windowPos.value > 0)
const canNext = computed(() => windowPos.value >= 0 && windowPos.value < loadedOrder.length - 1)
const step = (delta: number) => {
  const i = windowPos.value
  if (i < 0) return
  const j = i + delta
  if (j >= 0 && j < loadedOrder.length) selectedPrefix.value = loadedOrder[j]
}
</script>

<template>
  <article
    class="pe-reader"
    data-source="pipeline-export"
    :data-work-count="ptSegs.length"
    :data-loaded-count="loadedOrder.length"
  >
    <p class="pe-reader__boundary">
      Protótipo de leitor (interno). Visão geral da obra = metadados ({{ ptSegs.length }} trechos);
      prosa carregada apenas na janela ({{ loadedOrder.length }} trechos).
    </p>

    <div class="pe-reader__grid">
      <!-- Full-work zoom-out: metadata only -->
      <nav class="pe-reader__trechos" aria-label="Trechos" data-testid="pe-reader-trechos">
        <p class="pe-reader__trechos-label">Trechos</p>
        <template v-for="grp in structure" :key="grp.key">
          <template v-if="grp.type === 'part'">
            <p class="pe-reader__part">
              <span class="pe-reader__eyebrow-word">Parte</span> {{ grp.label
              }}<template v-if="grp.title"> — {{ grp.title }}</template>
            </p>
            <div v-for="c in grp.chapters" :key="c.key" class="pe-reader__chapter">
              <p class="pe-reader__chapter-title">
                <span class="pe-reader__eyebrow-word">Capítulo</span> {{ c.title }}
              </p>
              <button
                v-for="s in c.segments"
                :key="s.canonicalId"
                type="button"
                class="pe-reader__row"
                :class="{
                  'is-current': s.segmentPrefix === selectedPrefix,
                  'is-loaded': isLoaded(s.segmentPrefix)
                }"
                :data-prefix="s.segmentPrefix"
                :data-loaded="isLoaded(s.segmentPrefix)"
                :aria-current="s.segmentPrefix === selectedPrefix ? 'true' : undefined"
                @click="selectedPrefix = s.segmentPrefix"
              >
                <span class="pe-reader__row-title">{{ s.displayTitle }}</span>
                <span v-if="!isLoaded(s.segmentPrefix)" class="pe-reader__tag">não carregado</span>
              </button>
            </div>
          </template>
          <div v-else class="pe-reader__chapter">
            <p class="pe-reader__chapter-title">
              <span class="pe-reader__eyebrow-word">Matéria liminar / conclusão</span>
            </p>
            <button
              v-for="s in grp.segments"
              :key="s.canonicalId"
              type="button"
              class="pe-reader__row"
              :class="{
                'is-current': s.segmentPrefix === selectedPrefix,
                'is-loaded': isLoaded(s.segmentPrefix)
              }"
              :data-prefix="s.segmentPrefix"
              :data-loaded="isLoaded(s.segmentPrefix)"
              :aria-current="s.segmentPrefix === selectedPrefix ? 'true' : undefined"
              @click="selectedPrefix = s.segmentPrefix"
            >
              <span class="pe-reader__row-title">{{ s.displayTitle }}</span>
              <span v-if="!isLoaded(s.segmentPrefix)" class="pe-reader__tag">não carregado</span>
            </button>
          </div>
        </template>
      </nav>

      <!-- Reading pane: loaded window prose, or a not-loaded notice -->
      <section
        class="pe-reader__pane"
        :data-selected="selectedPrefix"
        :data-loaded="!!selectedBody"
        data-testid="pe-reader-pane"
      >
        <template v-if="selected">
          <p class="pe-reader__eyebrow">
            <span>{{ (meta as any).work?.title || 'Introdução à ontologia' }}</span>
            <span class="pe-reader__sep">·</span><span class="pe-reader__lang">{{ LANG }}</span>
            <template v-if="partOf(selected)"
              ><span class="pe-reader__sep">·</span
              ><span>{{ partOf(selected)!.label }}</span></template
            >
            <template v-if="chapterTitleOf(selected)"
              ><span class="pe-reader__sep">·</span
              ><span>{{ chapterTitleOf(selected) }}</span></template
            >
          </p>
          <h2 class="pe-reader__title">{{ selected.displayTitle }}</h2>
          <!-- eslint-disable-next-line vue/no-v-html -- build-time sanitized prose (escape + *italics* only) -->
          <div v-if="selectedBody" class="pe-reader__prose" v-html="selectedBody" />
          <p v-else class="pe-reader__notice" data-testid="pe-reader-notice">
            Trecho fora da janela de pré-visualização — <strong>não carregado</strong> (apenas
            metadados). Selecione um trecho carregado para ler.
          </p>
        </template>

        <div class="pe-reader__nav" data-testid="pe-reader-nav">
          <button type="button" class="pe-reader__btn" :disabled="!canPrev" @click="step(-1)">
            ‹ Trecho anterior
          </button>
          <button type="button" class="pe-reader__btn" :disabled="!canNext" @click="step(1)">
            Próximo trecho ›
          </button>
        </div>

        <details class="pe-reader__qa" data-testid="pe-reader-qa">
          <summary>QA (internal)</summary>
          <dl>
            <div>
              <dt>selected canonicalId</dt>
              <dd>{{ selected?.canonicalId }}</dd>
            </div>
            <div>
              <dt>routePath (data only — not a link)</dt>
              <dd>
                <code>{{ selected?.routePath }}</code>
              </dd>
            </div>
            <div>
              <dt>loaded window</dt>
              <dd>{{ loadedOrder.length }} / {{ ptSegs.length }} (metadata-only overview)</dd>
            </div>
          </dl>
        </details>
      </section>
    </div>
  </article>
</template>

<style scoped>
.pe-reader {
  margin: 0 0 3rem;
}
.pe-reader__boundary {
  margin: 0 0 1rem;
  font-size: 0.74rem;
  color: var(--sk-text-muted);
}
.pe-reader__grid {
  display: grid;
  grid-template-columns: minmax(0, 16rem) minmax(0, 1fr);
  gap: 2rem;
}
@media (max-width: 720px) {
  .pe-reader__grid {
    grid-template-columns: 1fr;
  }
}

/* Overview — metadata-only, scrollable */
.pe-reader__trechos {
  max-height: 70vh;
  overflow: auto;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--sk-reading-rule);
  border-radius: var(--sk-radius-sm);
}
.pe-reader__trechos-label {
  margin: 0 0 0.4rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sk-text-muted);
}
.pe-reader__part {
  margin: 0.9rem 0 0.2rem;
  font-size: 0.85rem;
  font-weight: 600;
}
.pe-reader__chapter-title {
  margin: 0.5rem 0 0.1rem;
  font-size: 0.74rem;
  color: var(--sk-text-muted);
}
.pe-reader__eyebrow-word {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.64rem;
  opacity: 0.7;
}
.pe-reader__row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  min-height: 44px;
  padding: 0.25rem 0.4rem;
  border: 0;
  border-radius: var(--sk-radius-sm);
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.84rem;
  color: var(--sk-reading-muted);
  -webkit-tap-highlight-color: transparent;
}
.pe-reader__row.is-loaded .pe-reader__row-title {
  color: var(--sk-reading-heading);
}
.pe-reader__row.is-current {
  background: var(--sk-reading-rule);
  font-weight: 600;
}
.pe-reader__tag {
  flex: none;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.55;
}
.pe-reader__row:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
}

/* Reading pane */
.pe-reader__pane {
  max-width: 38rem;
}
.pe-reader__eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.74rem;
  color: var(--sk-text-muted);
}
.pe-reader__sep {
  margin: 0 0.4rem;
  opacity: 0.5;
}
.pe-reader__lang {
  text-transform: uppercase;
}
.pe-reader__title {
  margin: 0 0 1.4rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--sk-reading-heading);
}
.pe-reader__prose :deep(p) {
  margin: 0 0 1.25rem;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--sk-reading-text, var(--sk-reading-muted));
}
.pe-reader__prose :deep(em) {
  font-style: italic;
}
.pe-reader__notice {
  padding: 1rem;
  border: 1px dashed var(--sk-reading-rule);
  border-radius: var(--sk-radius-sm);
  font-size: 0.95rem;
  color: var(--sk-text-muted);
}
.pe-reader__nav {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--sk-reading-rule);
}
.pe-reader__btn {
  min-height: 44px;
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--sk-reading-rule);
  border-radius: var(--sk-radius-sm);
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--sk-reading-muted);
  -webkit-tap-highlight-color: transparent;
}
.pe-reader__btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.pe-reader__btn:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
}
.pe-reader__qa {
  margin-top: 2rem;
  font-size: 0.72rem;
  color: var(--sk-text-muted);
}
.pe-reader__qa summary {
  cursor: pointer;
}
.pe-reader__qa dt {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.75;
}
.pe-reader__qa dd {
  margin: 0 0 0.4rem;
}
.pe-reader__qa code {
  opacity: 0.7;
}
</style>
