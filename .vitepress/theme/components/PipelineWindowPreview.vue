<script setup lang="ts">
import { computed, ref } from 'vue'
import preview from '../data/pipeline-preview-window.json'

// REVIEW-ONLY multi-segment reading flow (Slice 2F). Renders a small contiguous WINDOW of pipeline
// segments (joined by segmentPrefix/language, never routePath) one at a time, with prev/next controls
// and a "Trechos" zoom-out overview — the real reading pattern (segment-to-segment movement + a
// first zoom-out surface) without committing to a public URL shape. Hosted ONLY on the buffer
// (noindex/unlisted/out-of-search) page src/reading-review/introduction-a-l-ontologie-window.md.
// Movement is client-side ref state (no navigation, no localStorage). routePath is QA-only, never an
// href; the component renders no anchors. bodyHtml is build-time-sanitized (escape + *italics*).

interface Level {
  kind: string
  label: string
  title: string | null
}
interface Seg {
  canonicalId: string
  language: string
  segmentPrefix: string
  order: number
  displayTitle: string
  groupPath: Level[]
  routePath: string
  urlStability: string
  maturity: string
  bodyHtml: string
}

const work = (preview as any).work
const segments = (preview as any).segments as Seg[]
const startIndex = Math.max(
  0,
  segments.findIndex((s) => s.segmentPrefix === (preview as any).current)
)
const currentIndex = ref(startIndex)
const current = computed(() => segments[currentIndex.value])

const partOf = (s: Seg) => s.groupPath.find((l) => l.kind === 'part') ?? null
const chapterTitleOf = (s: Seg) => {
  const c = s.groupPath.find((l) => l.kind === 'chapter')
  return c ? c.title || c.label : ''
}

const go = (i: number) => {
  currentIndex.value = Math.min(segments.length - 1, Math.max(0, i))
}
</script>

<template>
  <article
    class="pe-flow"
    data-source="pipeline-export"
    :data-segment="current.segmentPrefix"
    :data-lang="current.language"
  >
    <!-- Zoom-out overview -->
    <nav class="pe-flow__trechos" aria-label="Trechos" data-testid="pe-trechos">
      <p class="pe-flow__trechos-label">Trechos</p>
      <ol>
        <li v-for="(s, i) in segments" :key="s.canonicalId">
          <button
            type="button"
            class="pe-flow__trecho"
            :class="{ 'is-current': i === currentIndex }"
            :aria-current="i === currentIndex ? 'true' : undefined"
            @click="go(i)"
          >
            <span class="pe-flow__trecho-title">{{ s.displayTitle }}</span>
            <span class="pe-flow__trecho-ctx">{{ chapterTitleOf(s) }}</span>
          </button>
        </li>
      </ol>
    </nav>

    <!-- Current segment -->
    <p class="pe-flow__eyebrow">
      <span>{{ work.title }}</span>
      <span class="pe-flow__sep">·</span>
      <span class="pe-flow__lang">{{ current.language }}</span>
      <template v-if="partOf(current)">
        <span class="pe-flow__sep">·</span>
        <span
          >{{ partOf(current)!.label
          }}<template v-if="partOf(current)!.title"> — {{ partOf(current)!.title }}</template></span
        >
      </template>
      <template v-if="chapterTitleOf(current)">
        <span class="pe-flow__sep">·</span>
        <span>{{ chapterTitleOf(current) }}</span>
      </template>
    </p>
    <h2 class="pe-flow__title">{{ current.displayTitle }}</h2>
    <!-- eslint-disable-next-line vue/no-v-html -- build-time sanitized prose (escape + *italics* only) -->
    <div class="pe-flow__prose" v-html="current.bodyHtml" />

    <!-- Segment-to-segment movement (client-side; no navigation) -->
    <div class="pe-flow__nav" data-testid="pe-flow-nav">
      <button
        type="button"
        class="pe-flow__btn"
        :disabled="currentIndex === 0"
        @click="go(currentIndex - 1)"
      >
        ‹ Trecho anterior
      </button>
      <span class="pe-flow__pos">{{ currentIndex + 1 }} / {{ segments.length }}</span>
      <button
        type="button"
        class="pe-flow__btn"
        :disabled="currentIndex === segments.length - 1"
        @click="go(currentIndex + 1)"
      >
        Próximo trecho ›
      </button>
    </div>

    <details class="pe-flow__qa" data-testid="pe-flow-qa">
      <summary>QA (internal)</summary>
      <dl>
        <div>
          <dt>canonicalId</dt>
          <dd>{{ current.canonicalId }}</dd>
        </div>
        <div>
          <dt>join key</dt>
          <dd>{{ current.segmentPrefix }} / {{ current.language }}</dd>
        </div>
        <div>
          <dt>routePath (data only — not a link)</dt>
          <dd>
            <code>{{ current.routePath }}</code>
          </dd>
        </div>
        <div>
          <dt>urlStability / maturity</dt>
          <dd>{{ current.urlStability }} / {{ current.maturity }}</dd>
        </div>
        <div>
          <dt>source</dt>
          <dd>{{ (preview as any).source }}</dd>
        </div>
      </dl>
    </details>
  </article>
</template>

<style scoped>
.pe-flow {
  max-width: 38rem;
  margin: 0 0 3rem;
}

/* Zoom-out overview — a quiet trechos list; current trecho marked. */
.pe-flow__trechos {
  margin: 0 0 1.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--sk-reading-rule);
  border-radius: var(--sk-radius-sm);
}
.pe-flow__trechos-label {
  margin: 0 0 0.4rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sk-text-muted);
}
.pe-flow__trechos ol {
  margin: 0;
  padding: 0;
  list-style: none;
}
.pe-flow__trecho {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  min-height: 44px;
  padding: 0.35rem 0.5rem;
  border: 0;
  border-radius: var(--sk-radius-sm);
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  color: var(--sk-reading-muted);
  -webkit-tap-highlight-color: transparent;
}
.pe-flow__trecho.is-current {
  background: var(--sk-reading-rule);
  color: var(--sk-reading-heading);
  font-weight: 600;
}
.pe-flow__trecho-ctx {
  flex: none;
  font-size: 0.72rem;
  color: var(--sk-text-muted);
}
.pe-flow__trecho:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
}

.pe-flow__eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.74rem;
  color: var(--sk-text-muted);
}
.pe-flow__sep {
  margin: 0 0.4rem;
  opacity: 0.5;
}
.pe-flow__lang {
  text-transform: uppercase;
}
.pe-flow__title {
  margin: 0 0 1.4rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--sk-reading-heading);
}

/* Reading prose — v-html children styled via :deep (v-html content is unscoped). */
.pe-flow__prose :deep(p) {
  margin: 0 0 1.25rem;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--sk-reading-text, var(--sk-reading-muted));
}
.pe-flow__prose :deep(em) {
  font-style: italic;
}

.pe-flow__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--sk-reading-rule);
}
.pe-flow__btn {
  min-height: 44px;
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--sk-reading-rule);
  border-radius: var(--sk-radius-sm);
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--sk-reading-muted);
  -webkit-tap-highlight-color: transparent;
  transition: color 0.18s ease;
}
.pe-flow__btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.pe-flow__btn:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
}
@media (hover: hover) and (pointer: fine) {
  .pe-flow__btn:not(:disabled):hover {
    color: var(--sk-reading-heading);
  }
}
.pe-flow__pos {
  font-size: 0.78rem;
  color: var(--sk-text-muted);
}

.pe-flow__qa {
  margin-top: 2rem;
  font-size: 0.72rem;
  color: var(--sk-text-muted);
}
.pe-flow__qa summary {
  cursor: pointer;
}
.pe-flow__qa dt {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.75;
}
.pe-flow__qa dd {
  margin: 0 0 0.4rem;
}
.pe-flow__qa code {
  opacity: 0.7;
}
</style>
