<script setup lang="ts">
import { computed, reactive } from 'vue'
import manifest from '../data/segment-manifest.json'
import SkLink from './SkLink.vue'

// The book map — a calm, printed-edition table of contents over the segment manifest. It is
// deliberately CONTEXT-FREE and reusable: the work hub mounts it (via WorkContentsMount), and a
// future reading-leaf zoom-out overlay/sheet will render the same component with a `currentId`
// to center + open around the segment being read. It renders the authored hierarchy from each
// segment's `groupPath` (never from route slugs) and localizes group labels from works[].language.
const props = withDefaults(
  defineProps<{
    workId: string
    currentId?: string // canonicalId to center/highlight (leaf overlay); absent on the hub
    variant?: 'hub' | 'overlay' // presentation context; 'overlay' reserved for the future leaf sheet
  }>(),
  { variant: 'hub' }
)

// Localized level words + nav-landmark label, keyed off the work's base language (not its route).
const LEVEL_WORDS: Record<string, Record<string, string>> = {
  fr: { book: 'Livre', part: 'Partie', chapter: 'Chapitre', section: 'Section' },
  pt: { book: 'Livro', part: 'Parte', chapter: 'Capítulo', section: 'Seção' },
  en: { book: 'Book', part: 'Part', chapter: 'Chapter', section: 'Section' }
}
const NAV_LABEL: Record<string, string> = { fr: 'Sommaire', pt: 'Sumário', en: 'Contents' }

interface Level {
  kind: string
  index: number
  key: string
}
interface Segment {
  canonicalId: string
  workId: string
  href: string
  slug: string
  displayTitle: string
  order: number
  groupPath: Level[]
}

const work = computed(
  () => (manifest.works as any[]).find((w) => w.workId === props.workId) ?? null
)
const lang = computed(() => (work.value?.language as string) || 'pt')
const words = computed(() => LEVEL_WORDS[lang.value] ?? LEVEL_WORDS.pt)
const navLabel = computed(() => NAV_LABEL[lang.value] ?? NAV_LABEL.en)

// Group the work's segments by their top authored level (book for de-l-acte), in reading order.
// A group with no authored level above it (flat legacy works) has hasHeader=false and its leaves
// render directly — no fabricated header. This same shape serves the hub and the future overlay.
const groups = computed(() => {
  if (!work.value) return []
  const segs = (manifest.segments as Segment[])
    .filter((s) => s.workId === props.workId)
    .sort((a, b) => a.order - b.order)
  const out: any[] = []
  const byKey = new Map<string, any>()
  for (const s of segs) {
    const top = s.groupPath[0]
    const key = top ? top.key : `${props.workId}::root`
    let g = byKey.get(key)
    if (!g) {
      g = {
        key,
        domId: 'wc-' + key.replace(/[^a-z0-9]+/gi, '-'),
        hasHeader: !!top,
        label: top ? `${words.value[top.kind] ?? ''} ${top.index}`.trim() : '',
        segments: []
      }
      byKey.set(key, g)
      out.push(g)
    }
    g.segments.push(s)
  }
  return out
})

// The group holding the current segment — for centering/auto-open from a leaf. Dormant on the hub.
const currentGroupKey = computed(() => {
  if (!props.currentId) return null
  const seg = (manifest.segments as Segment[]).find(
    (s) => s.canonicalId === props.currentId && s.workId === props.workId
  )
  if (!seg) return null
  const top = seg.groupPath[0]
  return top ? top.key : `${props.workId}::root`
})

// Collapse state. v1 default: when reading a leaf (currentId set), open only the current group;
// otherwise small works (<= 3 groups) open fully — de-l-acte's 3 books read like a printed TOC,
// the whole map calm and visible — while larger works will default collapsed. Explicit toggles win.
const expanded = reactive<Record<string, boolean>>({})
function defaultOpen(key: string): boolean {
  if (currentGroupKey.value) return key === currentGroupKey.value
  return groups.value.length <= 3
}
const isOpen = (key: string) => expanded[key] ?? defaultOpen(key)
const toggle = (key: string) => {
  expanded[key] = !isOpen(key)
}
const isCurrent = (id: string) => !!props.currentId && id === props.currentId
</script>

<template>
  <nav
    v-if="work"
    class="work-contents"
    :class="`work-contents--${variant}`"
    :aria-label="navLabel"
  >
    <div v-for="g in groups" :key="g.key" class="work-contents__group">
      <button
        v-if="g.hasHeader"
        class="work-contents__heading"
        type="button"
        :aria-expanded="isOpen(g.key)"
        :aria-controls="g.domId"
        @click="toggle(g.key)"
      >
        <span class="work-contents__label">{{ g.label }}</span>
        <span
          class="work-contents__chevron"
          :class="{ 'is-open': isOpen(g.key) }"
          aria-hidden="true"
        />
      </button>
      <div :id="g.domId" v-show="isOpen(g.key)" class="work-contents__leaves">
        <SkLink
          v-for="s in g.segments"
          :key="s.canonicalId"
          class="work-contents__link"
          :class="{ 'is-current': isCurrent(s.canonicalId) }"
          :href="s.href"
          :current="isCurrent(s.canonicalId)"
          >{{ s.displayTitle }}</SkLink
        >
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* A printed table of contents adapted for touch: one quiet column, hairline-separated groups,
   restrained type, generous rhythm. Not a docs tree, not an accordion-library default. */
.work-contents {
  max-width: 42rem;
  margin: 0 0 2.5rem;
}

.work-contents__group + .work-contents__group {
  margin-top: 0.35rem;
}

/* Group heading is a real disclosure button, styled as a quiet literary eyebrow (Livre 1 …). */
.work-contents__heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 44px;
  padding: 0.55rem 0;
  border: 0;
  border-top: 1px solid var(--sk-reading-rule);
  background: none;
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.18s ease;
}

.work-contents__label {
  flex: 1 1 auto;
}

/* Quiet rotating chevron — points right when collapsed, down when open. */
.work-contents__chevron {
  flex: none;
  width: 0;
  height: 0;
  border-left: 5px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  opacity: 0.45;
  transition: transform 0.2s ease;
}
.work-contents__chevron.is-open {
  transform: rotate(90deg);
}

.work-contents__leaves {
  display: flex;
  flex-direction: column;
  padding: 0.1rem 0 0.85rem;
}

/* Each leaf is a SkLink row: the displayTitle leads; no bullets, no slugs, no numbering imposed
   by the UI (these French titles already carry "Chapitre I." as their own quiet orientation). */
.work-contents__link {
  display: block;
  min-height: 44px;
  padding: 0.5rem 0 0.5rem 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--sk-reading-muted);
  text-decoration: none;
  transition: color 0.18s ease;
}

/* Subtle current marker — dormant on the hub, used when a leaf overlay passes currentId. */
.work-contents__link.is-current {
  color: var(--sk-reading-heading);
  box-shadow: inset 2px 0 0 0 var(--sk-accent);
}

/* Four-state floor: visible hover lift only on real pointer devices (no stuck iOS tap state).
   Keyboard focus + neutral pressed/touch on the links are owned by the SkLink primitive. */
@media (hover: hover) and (pointer: fine) {
  .work-contents__heading:hover {
    color: var(--sk-reading-heading);
  }
  .work-contents__link:hover {
    color: var(--sk-reading-heading);
  }
}

/* The disclosure button is a real button (not a SkLink), so it owns its focus ring — using the
   shared focus language so the whole shell speaks one focus dialect. */
.work-contents__heading:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
  border-radius: var(--sk-radius-sm);
}
</style>
