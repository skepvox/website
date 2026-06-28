<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import meta from '../data/pipeline-export-segments.json'
import SkLink from './SkLink.vue'
import ReaderIcon from './ReaderIcon.vue'
import {
  navLabel as navLabelFor,
  openingLabel as openingLabelFor,
  editionLine as editionLineFor
} from './reader-shell'

// Work-hub map for pipeline-export records. Identity comes from canonicalId/segmentPrefix;
// routePath is only the href. Supports authored Part→Chapter works and flat works with optional
// editorial reading divisions.
const props = withDefaults(defineProps<{ workId?: string; language?: string }>(), {
  workId: 'louis-lavelle/introduction-a-l-ontologie',
  language: 'pt'
})

interface ReadingDivision {
  label: string
  startPrefix: string
  endPrefix: string
}
interface ReadingDivisions {
  authored: boolean
  divisions: ReadingDivision[]
}
interface Work {
  workId: string
  title: string
  author: string
  readingDivisions?: ReadingDivisions | null
}
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

const work = computed(() => (meta.works as Work[]).find((w) => w.workId === props.workId))
const workTitle = computed(() => work.value?.title ?? props.workId)
const author = computed(() => work.value?.author ?? '')

const navLabel = computed(() => navLabelFor(props.language))
const openingLabel = computed(() => openingLabelFor(props.language))
const editionLine = computed(() => editionLineFor(author.value, props.language))

const CHAPTERS_LABEL: Record<string, string> = {
  pt: 'Capítulos',
  fr: 'Chapitres',
  en: 'Chapters'
}
const chaptersLabel = computed(() => CHAPTERS_LABEL[props.language] ?? 'Capítulos')

const readingDivisions = computed<ReadingDivisions | null>(
  () => work.value?.readingDivisions ?? null
)

const segs = computed(() =>
  (meta.segments as Seg[])
    .filter((s) => s.workId === props.workId && s.language === props.language)
    .slice()
    .sort((a, b) => a.order - b.order)
)

const bodyOrdinalByPrefix = computed(() => {
  const map = new Map<string, number>()
  let n = 0
  for (const rec of segs.value) {
    const hasAuthoredChapter = rec.groupPath?.some((l) => l.kind === 'chapter')
    const isConclusionSentinel = rec.segmentPrefix.startsWith('99-99-999')
    if (!hasAuthoredChapter && !isConclusionSentinel) continue
    n += 1
    map.set(rec.segmentPrefix, n)
  }
  return map
})
const leafNumber = (s: Seg) => bodyOrdinalByPrefix.value.get(s.segmentPrefix)

interface Chapter {
  key: string
  domId: string
  title: string
  segments: Seg[]
}
interface FlatEntry {
  canonicalId: string
  routePath: string
  segmentPrefix: string
  number: number
  title: string
}
type LooseBlock = { type: 'loose'; key: string; segments: Seg[] }
type PartBlock = {
  type: 'part'
  key: string
  label: string
  title: string | null
  chapters: Chapter[]
}
type FlatBlock = { type: 'flat'; key: string; entries: FlatEntry[] }
type ChaptersDividerBlock = { type: 'chapters-divider'; key: string; heading: string }
type DivisionBlock = {
  type: 'division'
  key: string
  domId: string
  heading: string
  editorial: boolean
  entries: FlatEntry[]
}
type Block = LooseBlock | PartBlock | FlatBlock | ChaptersDividerBlock | DivisionBlock

// Editorial divisions are validated in the pipeline; fallback keeps the hub usable if data drifts.
function splitByDivisions(entries: FlatEntry[], rd: ReadingDivisions): DivisionBlock[] | null {
  const pos = new Map(entries.map((e, i) => [e.segmentPrefix, i]))
  const covered = Array.from({ length: entries.length }, () => false)
  const out: DivisionBlock[] = []
  for (let n = 0; n < rd.divisions.length; n++) {
    const d = rd.divisions[n]
    const a = pos.get(d.startPrefix)
    const b = pos.get(d.endPrefix)
    if (a === undefined || b === undefined || a > b) return null
    for (let i = a; i <= b; i++) {
      if (covered[i]) return null
      covered[i] = true
    }
    out.push({
      type: 'division',
      key: `div-${n}`,
      domId: `pwc-div-${n}`,
      heading: d.label,
      editorial: rd.authored === false,
      entries: entries.slice(a, b + 1)
    })
  }
  if (covered.some((c) => !c)) return null
  return out
}

const blocks = computed<Block[]>(() => {
  const out: Block[] = []
  let group: Block | null = null
  let chapter: Chapter | null = null
  for (const rec of segs.value) {
    const gp = rec.groupPath
    const part = gp?.find((l) => l.kind === 'part')
    const chap = gp?.find((l) => l.kind === 'chapter')
    if (chapter && (!gp || gp.length === 0) && rec.segmentPrefix.startsWith('99-99-999')) {
      chapter.segments.push(rec)
      continue
    }
    if (part && chap) {
      if (!group || group.type !== 'part' || group.key !== part.key) {
        group = {
          type: 'part',
          key: part.key,
          label: part.label,
          title: part.title,
          chapters: []
        }
        out.push(group)
        chapter = null
      }
      if (!chapter || chapter.key !== chap.key) {
        chapter = {
          key: chap.key,
          domId: 'pwc-' + chap.key.replace(/[^a-z0-9]+/gi, '-'),
          title: chap.title || chap.label,
          segments: []
        }
        group.chapters.push(chapter)
      }
      chapter.segments.push(rec)
      continue
    }
    if (chap) {
      if (!group || group.type !== 'flat') {
        group = { type: 'flat', key: `flat-${out.length}`, entries: [] }
        out.push(group)
        chapter = null
      }
      group.entries.push({
        canonicalId: rec.canonicalId,
        routePath: rec.routePath,
        segmentPrefix: rec.segmentPrefix,
        number: chap.index,
        title: rec.displayTitle
      })
      continue
    }
    if (!group || group.type !== 'loose') {
      group = { type: 'loose', key: `loose-${out.length}`, segments: [] }
      out.push(group)
      chapter = null
    }
    group.segments.push(rec)
  }
  const rd = readingDivisions.value
  if (rd && rd.divisions.length) {
    return out.flatMap((block): Block[] => {
      if (block.type === 'loose') return [block]
      if (block.type === 'flat') {
        const divisions = splitByDivisions(block.entries, rd)
        if (!divisions) return [block]
        return [
          { type: 'chapters-divider', key: 'chapters-divider', heading: chaptersLabel.value },
          ...divisions
        ]
      }
      return [block]
    })
  }
  return out
})

// Persist only disclosure booleans, never progress or identity.
const storageKey = computed(() => `skepvox:pwc:${props.workId}:${props.language}`)
const expanded = reactive<Record<string, boolean>>({})
const isOpen = (key: string) => expanded[key] ?? false
function toggle(key: string) {
  expanded[key] = !isOpen(key)
  persist()
}
function persist() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey.value, JSON.stringify(expanded))
  } catch {
    return
  }
}

// The leaf "up" link returns to #trecho-<segmentPrefix>; the hub opens and highlights that section.
const sectionKeyOf = computed(() => {
  const map = new Map<string, string | null>()
  for (const b of blocks.value) {
    if (b.type === 'loose') for (const s of b.segments) map.set(s.segmentPrefix, null)
    else if (b.type === 'flat') for (const e of b.entries) map.set(e.segmentPrefix, null)
    else if (b.type === 'division') for (const e of b.entries) map.set(e.segmentPrefix, b.key)
    else if (b.type === 'part')
      for (const ch of b.chapters) for (const s of ch.segments) map.set(s.segmentPrefix, ch.key)
  }
  return map
})
const currentPrefix = ref<string | null>(null)
const isCurrent = (s: { segmentPrefix: string }) => s.segmentPrefix === currentPrefix.value

function restoreCollapse() {
  try {
    const raw = window.localStorage.getItem(storageKey.value)
    if (!raw) return
    const saved = JSON.parse(raw) as Record<string, unknown>
    for (const [k, v] of Object.entries(saved)) {
      if (typeof v === 'boolean') expanded[k] = v
    }
  } catch {
    return
  }
}
function applyReturnHash() {
  const m = /^#trecho-(.+)$/.exec(window.location.hash)
  if (!m) return
  const prefix = m[1]
  if (!sectionKeyOf.value.has(prefix)) return
  currentPrefix.value = prefix
  const sectionKey = sectionKeyOf.value.get(prefix)
  if (sectionKey) expanded[sectionKey] = true
  nextTick(() => {
    const el = document.querySelector('.pwc__link.is-current')
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  })
}
onMounted(() => {
  restoreCollapse()
  applyReturnHash()
})
</script>

<template>
  <section v-if="blocks.length" class="pwc-shell" aria-labelledby="pwc-title">
    <header class="pwc__head">
      <h1 id="pwc-title" class="pwc__title">{{ workTitle }}</h1>
      <p class="pwc__edition">{{ editionLine }}</p>
    </header>
    <nav class="pwc" :aria-label="navLabel">
      <template v-for="block in blocks" :key="block.key">
        <section v-if="block.type === 'loose'" class="pwc__opening">
          <p class="pwc__opening-heading">{{ openingLabel }}</p>
          <div class="pwc__loose">
            <SkLink
              v-for="s in block.segments"
              :key="s.canonicalId"
              class="pwc__link pwc__link--loose"
              :class="{ 'is-current': isCurrent(s) }"
              :href="`/${s.routePath}`"
              :current="isCurrent(s)"
              >{{ s.displayTitle }}</SkLink
            >
          </div>
        </section>

        <section v-else-if="block.type === 'flat'" class="pwc__part pwc__part--editorial">
          <p class="pwc__opening-heading">{{ chaptersLabel }}</p>
          <div class="pwc__chapter-rows">
            <SkLink
              v-for="e in block.entries"
              :key="e.canonicalId"
              class="pwc__chapter-row"
              :class="{ 'is-current': isCurrent(e) }"
              :href="`/${e.routePath}`"
              :current="isCurrent(e)"
            >
              <span class="pwc__chapter-num" aria-hidden="true">{{ e.number }}</span>
              <span class="pwc__chapter-title">{{ e.title }}</span>
            </SkLink>
          </div>
        </section>

        <p v-else-if="block.type === 'chapters-divider'" class="pwc__chapters-heading">
          {{ block.heading }}
        </p>

        <div v-else-if="block.type === 'division'" class="pwc__chapter pwc__section">
          <button
            class="pwc__chapter-heading"
            type="button"
            :aria-expanded="isOpen(block.key)"
            :aria-controls="block.domId"
            @click="toggle(block.key)"
          >
            <span class="pwc__chapter-title">{{ block.heading }}</span>
            <span class="pwc__count" aria-hidden="true">{{ block.entries.length }}</span>
            <ReaderIcon
              name="disclosure"
              class="pwc__chevron"
              :class="{ 'is-open': isOpen(block.key) }"
            />
          </button>
          <div
            :id="block.domId"
            v-show="isOpen(block.key)"
            role="group"
            :aria-label="block.heading"
            class="pwc__leaves"
          >
            <SkLink
              v-for="e in block.entries"
              :key="e.canonicalId"
              class="pwc__link pwc__link--numbered"
              :class="{ 'is-current': isCurrent(e) }"
              :href="`/${e.routePath}`"
              :current="isCurrent(e)"
            >
              <span class="pwc__leaf-num" aria-hidden="true">{{ e.number }}</span>
              <span class="pwc__leaf-title">{{ e.title }}</span>
            </SkLink>
          </div>
        </div>

        <section v-else class="pwc__part">
          <p class="pwc__part-heading">
            <span class="pwc__part-label">{{ block.label }}</span>
            <span v-if="block.title" class="pwc__part-title">{{ block.title }}</span>
          </p>
          <div v-for="ch in block.chapters" :key="ch.key" class="pwc__chapter">
            <button
              class="pwc__chapter-heading"
              type="button"
              :aria-expanded="isOpen(ch.key)"
              :aria-controls="ch.domId"
              @click="toggle(ch.key)"
            >
              <span class="pwc__chapter-title">{{ ch.title }}</span>
              <span class="pwc__count" aria-hidden="true">{{ ch.segments.length }}</span>
              <ReaderIcon
                name="disclosure"
                class="pwc__chevron"
                :class="{ 'is-open': isOpen(ch.key) }"
              />
            </button>
            <div
              :id="ch.domId"
              v-show="isOpen(ch.key)"
              role="group"
              :aria-label="ch.title"
              class="pwc__leaves"
            >
              <SkLink
                v-for="s in ch.segments"
                :key="s.canonicalId"
                class="pwc__link pwc__link--numbered"
                :class="{ 'is-current': isCurrent(s) }"
                :href="`/${s.routePath}`"
                :current="isCurrent(s)"
              >
                <span class="pwc__leaf-num" aria-hidden="true">{{ leafNumber(s) }}</span>
                <span class="pwc__leaf-title">{{ s.displayTitle }}</span>
              </SkLink>
            </div>
          </div>
        </section>
      </template>
    </nav>
  </section>
</template>

<style scoped>
.pwc-shell {
  max-width: 42rem;
  margin: 0 0 2.5rem;
}

.pwc__head {
  margin: 0 0 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--sk-reading-hairline);
}

.pwc__title {
  margin: 0;
  font-family: var(--sk-reading-title-font);
  font-size: var(--sk-reading-title);
  font-weight: 600;
  letter-spacing: -0.005em;
  line-height: 1.12;
  color: var(--sk-text);
}

.pwc__edition {
  margin: 0.65rem 0 0;
  font-size: var(--sk-reading-kicker);
  font-weight: 600;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  color: var(--sk-text-muted);
}

.pwc {
  margin: 0;
  border-inline-start: 1px solid var(--sk-spine);
  padding-inline-start: 1.25rem;
}

.pwc__part + .pwc__part {
  margin-top: 1.5rem;
}

.pwc__opening-heading {
  margin: 0 0 0.2rem;
  font-size: var(--sk-reading-kicker);
  font-weight: 600;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  line-height: 1.3;
  color: var(--sk-text);
}
.pwc__loose {
  display: flex;
  flex-direction: column;
  padding: 0 0 0.5rem;
}

.pwc__chapters-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.5rem 0 0.35rem;
  font-size: var(--sk-reading-kicker);
  font-weight: 650;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  line-height: 1.3;
  color: var(--sk-text);
}

.pwc__part-heading {
  margin: 2rem 0 0.5rem;
  line-height: 1.3;
  color: var(--sk-text);
}
.pwc__part-label {
  font-size: var(--sk-reading-kicker);
  font-weight: 650;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
}
.pwc__part-title {
  display: block;
  margin-top: 0.15rem;
  font-size: var(--sk-reading-row);
  font-weight: 400;
  color: var(--sk-text-muted);
}

.pwc__chapter-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 44px;
  padding: 0.7rem 0;
  border: 0;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: var(--sk-reading-row);
  font-weight: 600;
  letter-spacing: 0;
  color: var(--sk-text);
  -webkit-tap-highlight-color: transparent;
  transition: color 0.18s ease;
}

.pwc__chapter-title {
  flex: 0 1 auto;
  font-family: var(--sk-reading-font);
}

.pwc__count {
  flex: none;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  color: var(--sk-text-faint);
}

.pwc__chevron {
  flex: none;
  color: var(--sk-text-muted);
  transition: transform var(--sk-motion-fast) var(--sk-ease);
}
.pwc__chevron.is-open {
  transform: rotate(90deg);
}

.pwc__leaves {
  display: flex;
  flex-direction: column;
  padding: 0.1rem 0 0.85rem;
}

.pwc__link {
  display: block;
  min-height: 44px;
  padding: 0.5rem 0 0.5rem 1.25rem;
  font-family: var(--sk-reading-font);
  font-size: var(--sk-reading-row);
  font-weight: 400;
  line-height: 1.5;
  color: var(--sk-reading-muted);
  text-decoration: none;
  scroll-margin-top: 5rem;
  transition: color 0.18s ease;
}
.pwc__link--loose {
  padding-left: 0;
}

.pwc__part--editorial {
  margin-top: 1.5rem;
}

.pwc__link--numbered {
  gap: 0.75rem;
}
.pwc__leaf-num {
  flex: 0 0 auto;
  min-width: 1.75rem;
  font-size: 0.82em;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--sk-text-faint);
}
.pwc__leaf-title {
  flex: 1 1 auto;
}

.pwc__chapter-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  min-height: 44px;
  padding: 0.7rem 0;
  font-size: var(--sk-reading-row);
  font-weight: 600;
  line-height: 1.4;
  color: var(--sk-text);
  text-decoration: none;
  scroll-margin-top: 5rem;
  transition: color 0.18s ease;
}
.pwc__chapter-row .pwc__chapter-num {
  flex: 0 0 auto;
  min-width: 2rem;
  font-size: 0.82em;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--sk-reading-muted);
}
.pwc__chapter-row .pwc__chapter-title {
  flex: 1 1 auto;
  font-family: var(--sk-reading-font);
}
.pwc__chapter-row.is-current {
  color: var(--sk-text);
  box-shadow: inset 2px 0 0 0 var(--sk-reading-current);
}
@media (hover: hover) and (pointer: fine) {
  .pwc__chapter-row:hover {
    color: var(--sk-reading-heading);
  }
}

.pwc__leaves .pwc__link {
  display: flex;
  align-items: center;
}

.pwc__link.is-current {
  color: var(--sk-text);
  box-shadow: inset 2px 0 0 0 var(--sk-reading-current);
}
.pwc__link--loose.is-current {
  box-shadow: none;
  font-weight: 600;
}

@media (hover: hover) and (pointer: fine) {
  .pwc__chapter-heading:hover,
  .pwc__chapter-heading:hover .pwc__chevron {
    color: var(--sk-reading-heading);
  }
  .pwc__link:hover {
    color: var(--sk-reading-heading);
  }
}

.pwc__chapter-heading:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
  border-radius: var(--sk-radius-sm);
}

@media (prefers-reduced-motion: reduce) {
  .pwc__chevron,
  .pwc__chapter-heading,
  .pwc__link {
    transition: none;
  }
}
</style>
