<script setup lang="ts">
import { computed, reactive } from 'vue'
import manifest from '../data/segment-manifest.json'
import SkLink from './SkLink.vue'

// The book map — a calm, printed-edition table of contents over the segment manifest. It is
// deliberately CONTEXT-FREE and reusable: the work hub mounts it (via WorkContentsMount), and a
// future reading-leaf zoom-out overlay/sheet will render the same component with a `currentId`
// to center + open around the segment being read. It renders the authored hierarchy from each
// segment's `groupPath` (never from route slugs) and localizes labels from works[].language.
//
// Two rendering modes, chosen per work by whether its segments carry an authored groupPath:
//   - GROUPED (e.g. de-l-acte): collapsible authored groups (Livre 1 …) with real disclosure buttons.
//   - FLAT (e.g. Brás Cubas, empty groupPath): an ordered list with quiet PRESENTATION range
//     dividers (Matéria inicial, Capítulos 001–010 …) that are scan aids only — never authored,
//     never collapsible — so no fake book/part/chapter hierarchy is invented.
const props = withDefaults(
  defineProps<{
    workId: string
    currentId?: string // canonicalId to center/highlight (leaf overlay); absent on the hub
    variant?: 'hub' | 'overlay' // presentation context; 'overlay' reserved for the future leaf sheet
  }>(),
  { variant: 'hub' }
)

// Localized labels, keyed off the work's base language (works[].language), not its route family.
const LEVEL_WORDS: Record<string, Record<string, string>> = {
  fr: { book: 'Livre', part: 'Partie', chapter: 'Chapitre', section: 'Section' },
  pt: { book: 'Livro', part: 'Parte', chapter: 'Capítulo', section: 'Seção' },
  en: { book: 'Book', part: 'Part', chapter: 'Chapter', section: 'Section' }
}
const NAV_LABEL: Record<string, string> = { fr: 'Sommaire', pt: 'Sumário', en: 'Contents' }
const RANGE_WORD: Record<string, string> = { fr: 'Chapitres', pt: 'Capítulos', en: 'Chapters' }
const FRONT_LABEL: Record<string, string> = {
  fr: 'Matière liminaire',
  pt: 'Matéria inicial',
  en: 'Front matter'
}

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
  chapterIndex?: number
  groupPath: Level[]
}

const work = computed(
  () => (manifest.works as any[]).find((w) => w.workId === props.workId) ?? null
)
const lang = computed(() => (work.value?.language as string) || 'pt')
const words = computed(() => LEVEL_WORDS[lang.value] ?? LEVEL_WORDS.pt)
const navLabel = computed(() => NAV_LABEL[lang.value] ?? NAV_LABEL.en)

const segs = computed(() =>
  (manifest.segments as Segment[])
    .filter((s) => s.workId === props.workId)
    .sort((a, b) => a.order - b.order)
)

// FLAT when no segment carries an authored level above it (legacy chapter-level works).
const isFlat = computed(
  () => segs.value.length > 0 && segs.value.every((s) => !(s.groupPath && s.groupPath.length))
)

// Grouped mode: authored hierarchy by top groupPath level (book for de-l-acte), in reading order.
const groups = computed(() => {
  if (!work.value || isFlat.value) return []
  const out: any[] = []
  const byKey = new Map<string, any>()
  for (const s of segs.value) {
    const top = s.groupPath[0]
    const key = top.key
    let g = byKey.get(key)
    if (!g) {
      g = {
        key,
        domId: 'wc-' + key.replace(/[^a-z0-9]+/gi, '-'),
        label: `${words.value[top.kind] ?? ''} ${top.index}`.trim(),
        segments: []
      }
      byKey.set(key, g)
      out.push(g)
    }
    g.segments.push(s)
  }
  return out
})

// Flat mode: PRESENTATION range dividers (scan aids, not authored groups, not collapsible).
// Front matter = leaves whose chapterIndex recurs on a later leaf (Brás Cubas reuses chapter
// index 1 for Dedicatória/Prólogo/Ao leitor and chapter 1); works with unique indices (Vidas
// Secas) yield no front-matter section. Chapters are bucketed into decades by chapterIndex.
const pad3 = (n: number) => String(n).padStart(3, '0')
const flatSections = computed(() => {
  if (!isFlat.value) return []
  const list = segs.value
  const lastPos = new Map<number, number>()
  for (const s of list) {
    const ci = s.chapterIndex ?? -1
    lastPos.set(ci, Math.max(lastPos.get(ci) ?? -1, s.order))
  }
  const isFront = (s: Segment) =>
    s.chapterIndex != null && s.order < (lastPos.get(s.chapterIndex) ?? -1)

  const sections: any[] = []
  const front = list.filter(isFront)
  if (front.length) {
    sections.push({ key: 'front', label: FRONT_LABEL[lang.value] ?? FRONT_LABEL.en, leaves: front })
  }
  const byDecade = new Map<number, Segment[]>()
  for (const s of list.filter((x) => !isFront(x))) {
    const n = s.chapterIndex ?? s.order + 1
    const k = Math.floor((n - 1) / 10)
    if (!byDecade.has(k)) byDecade.set(k, [])
    byDecade.get(k)!.push(s)
  }
  const word = RANGE_WORD[lang.value] ?? RANGE_WORD.en
  for (const k of [...byDecade.keys()].sort((a, b) => a - b)) {
    const arr = byDecade.get(k)!
    const nums = arr.map((s) => s.chapterIndex ?? 0)
    sections.push({
      key: `r${k}`,
      label: `${word} ${pad3(Math.min(...nums))}–${pad3(Math.max(...nums))}`,
      leaves: arr
    })
  }
  return sections
})

// Display-label cleanup — RENDER LAYER ONLY. Never mutates the manifest, href, or canonicalId; the
// route stays exactly as published. Legacy `displayTitle` can carry title-quality debt: e.g. Brás
// Cubas ch. 053's title is the chapter's opening sentence (167 chars) rather than its true heading
// ("· · · · ·"). When a numbered title's body is absurdly long for a dense contents view, fall back
// to the compact ordinal ("053") instead of leaking the sentence. Clean titles arrive via the
// pipeline later; this is presentation cleanup, not source-of-truth cleanup.
const MAX_TITLE_BODY = 64
function displayLabel(s: Segment): string {
  const m = /^(\d{1,4})\s*[—–-]\s*(.+)$/.exec(s.displayTitle)
  if (m && m[2].length > MAX_TITLE_BODY) return m[1]
  return s.displayTitle
}

// Group holding the current segment — for centering/auto-open from a leaf. Dormant on the hub.
const currentGroupKey = computed(() => {
  if (!props.currentId) return null
  const seg = segs.value.find((s) => s.canonicalId === props.currentId)
  if (!seg) return null
  const top = seg.groupPath[0]
  return top ? top.key : null
})

// Collapse state (grouped mode). v1 default: when a leaf passes currentId, open only its group;
// otherwise small works (<= 3 groups) open fully — de-l-acte's 3 books read like a printed TOC.
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
    <!-- FLAT: ordered list with presentation range dividers (scan aids; never collapsible groups) -->
    <template v-if="isFlat">
      <div v-for="sec in flatSections" :key="sec.key" class="work-contents__section">
        <p class="work-contents__divider">{{ sec.label }}</p>
        <div class="work-contents__leaves">
          <SkLink
            v-for="s in sec.leaves"
            :key="s.canonicalId"
            class="work-contents__link"
            :class="{ 'is-current': isCurrent(s.canonicalId) }"
            :href="s.href"
            :current="isCurrent(s.canonicalId)"
            >{{ displayLabel(s) }}</SkLink
          >
        </div>
      </div>
    </template>

    <!-- GROUPED: collapsible authored hierarchy -->
    <template v-else>
      <div v-for="g in groups" :key="g.key" class="work-contents__group">
        <button
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
            >{{ displayLabel(s) }}</SkLink
          >
        </div>
      </div>
    </template>
  </nav>
</template>

<style scoped>
/* A printed table of contents adapted for touch: one quiet column, hairline-separated groups,
   restrained type, generous rhythm. Not a docs tree, not an accordion-library default. */
.work-contents {
  max-width: 42rem;
  margin: 0 0 2.5rem;
}

.work-contents__group + .work-contents__group,
.work-contents__section + .work-contents__section {
  margin-top: 0.35rem;
}

/* Grouped mode: the group heading is a real disclosure button (quiet literary eyebrow, Livre 1 …). */
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

/* Flat mode: a quiet, NON-interactive range divider — a scan aid, deliberately distinct from the
   grouped disclosure button (no chevron, lighter, not clickable) so it never reads as an authored
   collapsible group. */
.work-contents__divider {
  margin: 0;
  padding: 0.6rem 0 0.25rem;
  border-top: 1px solid var(--sk-reading-rule);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
  opacity: 0.85;
}

.work-contents__leaves {
  display: flex;
  flex-direction: column;
  padding: 0.1rem 0 0.85rem;
}

/* Each leaf is a SkLink row: the display label leads; no bullets, no slugs, no UI-imposed numbering
   (authored "Chapitre I." / "001 —" prefixes already carry their own quiet orientation). */
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
