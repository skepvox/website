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

// Owned contents map for ANY pipeline-export work hub (the work is chosen by the mount's
// pipelineWorkId/pipelineLanguage). It reads the vendored pipeline-export metadata
// (../data/pipeline-export-segments.json) — the SAME source the leaf chrome (PipelineSegmentNav) uses —
// filtered to (workId, language), and renders the structure from each segment's groupPath (never from
// route slugs). Every work reads in ONE disclosure grammar — a map of COLLAPSIBLE sections, each a row
// with a count of the final reading units inside it, expanding to reveal those leaves:
//   • a PARTED, paragraph-level work (Lavelle's Introdução à ontologia): authored Part divider →
//     Chapter (collapsible, count = paragraph segments) → segment leaves; front matter is a light
//     visible "Abertura" list above the parts.
//   • a FLAT, chapter-level work WITH editorial reading-divisions (Brás Cubas; work record carries
//     `readingDivisions`, authored:false): a collapsible "Abertura" section + one render-layer
//     "Capítulos" divider + each named editorial Division as a collapsible section (count =
//     chapter-segments) revealing its chapter-segment leaves. The divisions are EDITORIAL (one quiet
//     map note), never authored Parts.
//   • a flat work with no divisions: a safe-fallback single "Capítulos" list.
// It is mounted only on a generated work hub.
//
// In the parted case, chapters are real disclosure buttons, default-collapsed for mobile density; the
// front matter ("Abertura") and the authored part dividers stay visible so the skeleton is always
// understandable. routePath is presentation only (the href); identity (canonicalId / segmentPrefix) is
// never shown nor used as a link.
const props = withDefaults(defineProps<{ workId?: string; language?: string }>(), {
  workId: 'louis-lavelle/introduction-a-l-ontologie',
  language: 'pt'
})

// Editorial reading divisions (render/navigation aid) — an OPTIONAL work-record field carried straight
// from the pipeline export. `authored: false` is the load-bearing flag: these are an editorial grouping
// of a flat work's chapters (e.g. Brás Cubas's movements), explicitly NOT authored Parts, and are never
// derived from / folded into groupPath. Absent for works that do not declare them (e.g. Lavelle).
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

// Title + author come from the work record in the SAME pipeline-export metadata (looked up by workId),
// so the hub never hard-codes a per-work title and any work the Mount points at renders correctly.
const work = computed(() => (meta.works as Work[]).find((w) => w.workId === props.workId))
const workTitle = computed(() => work.value?.title ?? props.workId)
const author = computed(() => work.value?.author ?? '')

// Per-language labels come from the shared ./reader-shell module (Slice F2) so the hub, the leaf
// location path, and the bottom nav share one vocabulary. The front-matter "Abertura" group label and
// the author line under the title are the same records.
const navLabel = computed(() => navLabelFor(props.language))
const openingLabel = computed(() => openingLabelFor(props.language))
const editionLine = computed(() => editionLineFor(author.value, props.language))

// The "Capítulos" label is the SAFE FALLBACK for a flat work that declares NO reading-divisions: its
// chapters render as one quiet group rather than a stray wall. A flat work WITH reading-divisions (Brás
// Cubas) never uses this — its chapters are grouped under the collapsible editorial division sections.
const CHAPTERS_LABEL: Record<string, string> = {
  pt: 'Capítulos',
  fr: 'Chapitres',
  en: 'Chapters'
}
const chaptersLabel = computed(() => CHAPTERS_LABEL[props.language] ?? 'Capítulos')

// Optional editorial reading divisions for THIS work (from the export work record; null otherwise).
const readingDivisions = computed<ReadingDivisions | null>(
  () => work.value?.readingDivisions ?? null
)

// ONE quiet caption per map (orientation, not a per-divider disclaimer): the divisions are an editorial
// reading aid, NOT the author's structure. Author-agnostic so the component stays multi-work. Shown only
// when a work renders EDITORIAL (authored:false) divisions.
const MAP_NOTE: Record<string, string> = {
  pt: 'Divisões de leitura — agrupamento editorial, não do autor.',
  fr: 'Divisions de lecture — un regroupement éditorial, non de l’auteur.',
  en: 'Reading divisions — an editorial grouping, not the author’s.'
}
const mapNote = computed(() => MAP_NOTE[props.language] ?? MAP_NOTE.pt)

const segs = computed(() =>
  (meta.segments as Seg[])
    .filter((s) => s.workId === props.workId && s.language === props.language)
    .slice()
    .sort((a, b) => a.order - b.order)
)

// Presentation-only ordinal rail for the final reading units in a work. Front matter stays unnumbered;
// authored body segments (Lavelle paragraphs, Brás Cubas chapters) get a calm left tab so future
// editorial titles can still retain a stable reader-facing order without exposing route identity.
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

// Bucketing mirrors the export structure: a loose front-matter list, then either Part → Chapter →
// Segment (a parted, paragraph-level work like Lavelle, with trailing 99-99-999 conclusion sentinels
// folded into the final chapter) OR a flat chapter list (a part-less, chapter-level work like Brás
// Cubas, where each segment IS a chapter — rendered as direct links, no disclosure). The branch is
// chosen per segment from its groupPath kinds, not from the work id.
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
type PartBlock = { type: 'part'; key: string; heading: string; chapters: Chapter[] }
type FlatBlock = { type: 'flat'; key: string; entries: FlatEntry[] }
type ChaptersDividerBlock = { type: 'chapters-divider'; key: string; heading: string }
// Front matter as a COLLAPSIBLE "Abertura" section (used for a flat work with editorial divisions, e.g.
// Brás Cubas) — the same disclosure grammar as a chapter/division row, so the whole hub is one uniform
// stack of collapsible sections. (A parted work like Lavelle keeps the lighter visible LooseBlock above
// its authored Part dividers instead, so Lavelle is unchanged.)
type AberturaBlock = {
  type: 'abertura'
  key: string
  domId: string
  heading: string
  segments: Seg[]
}
// A flat work's chapter list, regrouped under one EDITORIAL reading division rendered as a COLLAPSIBLE
// disclosure section (title + count of chapter-segments + chevron), exactly like a Lavelle chapter row —
// expanding reveals the chapter-segment leaves. `editorial` (authored:false) drives the one quiet map
// note. NOT an authored Part; never derived from groupPath.
type DivisionBlock = {
  type: 'division'
  key: string
  domId: string
  heading: string
  editorial: boolean
  entries: FlatEntry[]
}
type Block =
  | LooseBlock
  | PartBlock
  | FlatBlock
  | ChaptersDividerBlock
  | AberturaBlock
  | DivisionBlock

// Regroup a flat work's chapter rows under its editorial reading divisions. Buckets the EXISTING flat
// entries (already sorted by reading order) by each division's [startPrefix, endPrefix] range — never
// from groupPath, never minting structure. Returns null (safe fallback to the single "Capítulos" group)
// unless the divisions cleanly tile every entry exactly once — the pipeline already guarantees this, so
// this guard only ever fires on malformed data, and degrades to the calm list rather than dropping rows.
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
      if (covered[i]) return null // overlap → degrade to the calm single list
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
  if (covered.some((c) => !c)) return null // a gap (uncovered chapter) → fallback
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
    // Conclusion sentinels (empty groupPath, 99-99-999 prefix) fold into the current parted chapter.
    if (chapter && (!gp || gp.length === 0) && rec.segmentPrefix.startsWith('99-99-999')) {
      chapter.segments.push(rec)
      continue
    }
    if (part && chap) {
      // Parted, paragraph-level: Part → Chapter (disclosure) → Segment.
      if (!group || group.type !== 'part' || group.key !== part.key) {
        group = {
          type: 'part',
          key: part.key,
          heading: part.label + (part.title ? ` — ${part.title}` : ''),
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
      // Part-less, chapter-level: each segment is a whole chapter → a direct link in a flat list.
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
    // Loose front matter (empty groupPath) → the "Abertura" opening list.
    if (!group || group.type !== 'loose') {
      group = { type: 'loose', key: `loose-${out.length}`, segments: [] }
      out.push(group)
      chapter = null
    }
    group.segments.push(rec)
  }
  // A flat work that declares editorial reading divisions becomes one uniform stack of COLLAPSIBLE
  // sections (same disclosure grammar as Lavelle's chapters): the front matter turns into a collapsible
  // "Abertura" section, the body gets one render-layer "Capítulos" divider, and the single flat chapter
  // list is regrouped under the named divisions (each a collapsible section revealing its
  // chapter-segments). NOT authored Parts. Falls back to the flat list on any division-data drift
  // (splitByDivisions returns null).
  const rd = readingDivisions.value
  if (rd && rd.divisions.length) {
    return out.flatMap((block): Block[] => {
      if (block.type === 'loose')
        return [
          {
            type: 'abertura',
            key: 'abertura',
            domId: 'pwc-abertura',
            heading: openingLabel.value,
            segments: block.segments
          }
        ]
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

// True only when the map actually rendered EDITORIAL (authored:false) dividers — gates the one quiet
// map note. Reads the realized blocks, so the fallback flat list never shows the note.
const hasEditorialDivisions = computed(() =>
  blocks.value.some((b) => b.type === 'division' && b.editorial)
)

// Collapse state. Chapters default COLLAPSED; the default is rendered identically on the server and
// on first client paint (expanded starts empty), so hydration matches. Persisted open/closed state
// is namespaced by work/language and stores only boolean flags keyed by the chapter's stable
// groupPath key. It is applied AFTER mount, so it never causes a hydration mismatch and never stores
// reading progress, last-read position, or user identity.
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
    // localStorage unavailable (private mode / disabled) — collapse still works in-session.
  }
}

// Return-to-hub highlight. When the reader follows a leaf's "up" link
// (…/introducao-a-ontologia/#trecho-<segmentPrefix>), open + mark that chapter so they find their
// place again. URL-driven UI state only — no stored reading progress. currentPrefix starts null (so
// SSR and first client paint match) and is set after mount, exactly like the collapse state.
// Map each leaf's segmentPrefix to the key of the COLLAPSIBLE section that contains it (or null when it
// lives in an always-visible group). Returning from a leaf opens that section. Covers every section
// kind: a collapsible Abertura, an editorial division, and a Lavelle Part>Chapter; the visible loose
// front matter and the flat fallback need no opening (null).
const sectionKeyOf = computed(() => {
  const map = new Map<string, string | null>()
  for (const b of blocks.value) {
    if (b.type === 'loose') for (const s of b.segments) map.set(s.segmentPrefix, null)
    else if (b.type === 'abertura') for (const s of b.segments) map.set(s.segmentPrefix, b.key)
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
    // ignore malformed / unavailable storage
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
    <!-- One quiet caption for the whole map (not a per-divider badge): the named dividers below are an
         editorial reading aid, not the author's structure. Shown only for editorial (authored:false)
         divisions. -->
    <p v-if="hasEditorialDivisions" class="pwc__map-note">{{ mapNote }}</p>
    <nav class="pwc" :aria-label="navLabel">
      <template v-for="block in blocks" :key="block.key">
        <!-- Front-matter bucket (loose, empty-groupPath segments before the authored parts, e.g.
             Advertência): a lightweight render-layer "Abertura" group so the front matter reads as a
             deliberate opening rather than a stray link. Integrated with the map (small-caps family)
             but visually SUBORDINATE to the authored Part dividers (muted, no hairline). Derived from
             the loose bucket only — no invented groupPath/Part, no data change. -->
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

        <!-- Part-less, chapter-level work (e.g. Brás Cubas): one quiet render-layer "Capítulos" group
             (the editorial Abertura register — NOT an authored Part divider) whose chapters render in
             the SAME row grammar as an authored chapter heading, but as direct links (each segment IS a
             whole chapter — no disclosure). A quiet chapter-number tab keeps punctuation-only / numeral
             titles (ch 53 "......."; ch 83 "13") legible. Same calm book-map dialect as Lavelle. -->
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

        <!-- Front matter as a COLLAPSIBLE "Abertura" section (a flat work with editorial divisions, e.g.
             Brás Cubas): the same disclosure grammar as a chapter/division row, so the whole hub is one
             uniform stack of collapsible sections. Count = the front-matter pieces inside. -->
        <div v-else-if="block.type === 'abertura'" class="pwc__chapter pwc__section">
          <button
            class="pwc__chapter-heading"
            type="button"
            :aria-expanded="isOpen(block.key)"
            :aria-controls="block.domId"
            @click="toggle(block.key)"
          >
            <span class="pwc__chapter-title">{{ block.heading }}</span>
            <span class="pwc__count" aria-hidden="true">{{ block.segments.length }}</span>
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
              v-for="s in block.segments"
              :key="s.canonicalId"
              class="pwc__link"
              :class="{ 'is-current': isCurrent(s) }"
              :href="`/${s.routePath}`"
              :current="isCurrent(s)"
              >{{ s.displayTitle }}</SkLink
            >
          </div>
        </div>

        <!-- Flat work WITH editorial divisions (e.g. Brás Cubas): the work has no authored Parts, so
             add one render-layer "Capítulos" divider before the named editorial divisions. This makes
             the body read as Abertura → Capítulos → divisions, matching Lavelle's visible hierarchy
             without inventing a groupPath Part. -->
        <p v-else-if="block.type === 'chapters-divider'" class="pwc__chapters-heading">
          {{ block.heading }}
        </p>

        <!-- Flat work WITH editorial reading divisions (e.g. Brás Cubas): each named division is a
             COLLAPSIBLE disclosure section — title + count of chapter-segments + chevron, the SAME
             grammar as a Lavelle chapter row — and expanding reveals the chapter-segment leaves. The
             divisions are EDITORIAL (the one quiet map note above), never authored Parts, and carry no
             Part divider because the work has no authored Parts. A quiet chapter-number tab keeps
             punctuation-only / numeral authored titles (ch 53 "......."; ch 83 "13") legible. -->
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

        <!-- Part → Chapter → Segment. The part label stays visible; the chapter is a disclosure button. -->
        <section v-else class="pwc__part">
          <p class="pwc__part-heading">{{ block.heading }}</p>
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
/* A printed table of contents adapted for touch: one quiet column, hairline-separated chapters,
   restrained type, generous rhythm. Not a docs tree, not an accordion-library default. Mirrors the
   owned book-map language so the whole reading shell speaks one dialect. */
.pwc-shell {
  max-width: 42rem;
  margin: 0 0 2.5rem;
}

/* The title + author line are one masthead, bound to the map by a hairline so the title introduces
   the contents instead of floating detached above them. */
.pwc__head {
  margin: 0 0 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--sk-reading-hairline);
}

/* The work title is the entry point: a serif (Literata) display line, continuous with the reading
   prose. Serif reads better with near-normal tracking than the tight negative tracking a sans display
   wants. */
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
}

.pwc__part + .pwc__part {
  margin-top: 1.5rem;
}

/* The front-matter "Abertura" group. Its heading is small-caps like a Part divider so it belongs to
   the map, but MUTED ink + hairline-less, so it stays clearly subordinate to the authored Part
   dividers (which are full-ink with a trailing hairline). A render-layer grouping of the loose
   front-matter bucket — no invented Part. */
.pwc__opening-heading {
  margin: 0 0 0.2rem;
  font-size: var(--sk-reading-kicker);
  font-weight: 600;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  line-height: 1.3;
  /* Same meaning-bearing ink as the authored Part dividers (no muted-orphan look). It stays
     structurally SUBORDINATE to the parts via the absent trailing hairline + lighter weight (600 vs
     650) — not by dimming the ink. Render-layer grouping only; no invented Part. */
  color: var(--sk-text);
}
/* Front-matter links sit flush under the Abertura label, before the first part. */
.pwc__loose {
  display: flex;
  flex-direction: column;
  padding: 0 0 0.5rem;
}

/* The part label is a section DIVIDER that belongs to the map: a full-ink small-caps kicker.
   Non-interactive, never a doc heading. The following chapter row owns the next separator line, so
   the part label does not draw its own trailing hairline. */
.pwc__part-heading,
.pwc__chapters-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 2rem 0 0.35rem;
  font-size: var(--sk-reading-kicker);
  font-weight: 650;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  line-height: 1.3;
  color: var(--sk-text);
}
.pwc__chapters-heading {
  margin-top: 1.5rem;
}

/* The chapter heading is a real disclosure button: a readable sentence-case title (not a shouty
   uppercase caption), so it out-ranks the quieter segment rows beneath it. */
.pwc__chapter-heading {
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
  text-align: left;
  font-size: var(--sk-reading-row);
  font-weight: 600;
  letter-spacing: 0;
  color: var(--sk-text);
  -webkit-tap-highlight-color: transparent;
  transition: color 0.18s ease;
}

.pwc__chapter-title {
  flex: 1 1 auto;
  font-family: var(--sk-reading-font);
}

/* Quiet per-chapter segment count — orientation while collapsed; decorative, hidden from SR. */
.pwc__count {
  flex: none;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  color: var(--sk-text-faint);
}

/* The disclosure glyph is the owned right-chevron (ReaderIcon), rotating 90° to point down when the
   chapter opens. Coloured by a meaning-bearing muted ink via currentColor — NEVER opacity-dimmed (the
   old border-triangle's opacity:0.45 was the dark-mode vanish bug, assessment §2.4). Rotation uses the
   owned motion tokens; reduced-motion is gated below. */
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

/* Each leaf is a SkLink row: quieter than its chapter (muted, lighter, indented), so the nesting
   reads correctly Part > Chapter > Segment. No bullets, no slugs. Body leaves may carry a
   presentation-only ordinal rail; front matter stays unnumbered. */
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
/* Front-matter links sit flush (no chapter indent). */
.pwc__link--loose {
  padding-left: 0;
}

/* The editorial "Capítulos" group sits a touch below an authored Part so the two read as one family
   with a clear hierarchy (authored Part divider > editorial chapter group). */
.pwc__part--editorial {
  margin-top: 1.5rem;
}

/* A flat work's hub (Brás Cubas) is one uniform stack of collapsible sections — the collapsible Abertura
   and each editorial division — each reusing the chapter disclosure-button chrome (.pwc__chapter-heading).
   The sections stack tightly via that button's top hairline, exactly like Lavelle's chapter rows; the
   work has no authored Part divider, and the editorial nature is carried by the one quiet map note above,
   never a per-row badge. */

/* A numbered leaf row: a flat work's chapter-segment revealed inside an open editorial division. The same
   quiet, indented leaf as a Lavelle paragraph row, plus a tabular chapter-number tab so titles align and
   punctuation-only / numeral authored titles (ch 53 "......."; ch 83 "13") stay legible. */
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

/* One quiet caption for the whole editorial map (orientation, not a disclaimer): muted, small, never
   repeated per divider. Sits between the masthead and the first divider. */
.pwc__map-note {
  margin: -0.75rem 0 1.5rem;
  font-size: var(--sk-reading-kicker);
  font-weight: 500;
  letter-spacing: var(--sk-reading-kicker-tracking);
  line-height: 1.4;
  color: var(--sk-text-muted);
}

/* Part-less chapter rows (Brás Cubas) share the disclosure-button metrics + typography of an AUTHORED
   chapter heading — same hairline rule, row height, size and weight — so the whole book map reads in one
   grammar. They are direct links (each chapter IS a whole leaf, nothing to disclose), so no chevron/count.
   The chapter number is a quiet, tabular fixed-width tab so titles align and punctuation-only / numeral
   authored titles (ch 53 "......."; ch 83 "13") stay legible. */
.pwc__chapter-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  min-height: 44px;
  padding: 0.55rem 0;
  border-top: 1px solid var(--sk-reading-rule);
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
/* The returned-from chapter (via a leaf "up" link): the same quiet current accent as an authored row. */
.pwc__chapter-row.is-current {
  color: var(--sk-text);
  box-shadow: inset 2px 0 0 0 var(--sk-reading-current);
}
@media (hover: hover) and (pointer: fine) {
  .pwc__chapter-row:hover {
    color: var(--sk-reading-heading);
  }
}

/* Slice E: the expanded segment rows sit at the 44px tap-target floor (min-height 44px, contiguous),
   so the inter-row PITCH cannot drop below 44px without breaking the ≥44px guardrail. What we can do
   within the floor: vertically CENTER the row text so each row reads as a centered entry rather than
   top-loaded with the empty space dumped below it — a calmer, more intentional rhythm. The 44px tap
   floor, the 1.25rem indentation, and the is-current accent rule are all preserved. */
.pwc__leaves .pwc__link {
  display: flex;
  align-items: center;
}

/* The trecho the reader returned from (via a leaf "up" link): a quiet current marker, dormant on a
   normal hub visit. The accent rule sits inside the leaf indent so it does not touch the page edge. */
.pwc__link.is-current {
  color: var(--sk-text);
  box-shadow: inset 2px 0 0 0 var(--sk-reading-current);
}
.pwc__link--loose.is-current {
  box-shadow: none;
  font-weight: 600;
}

/* Four-state floor: visible hover lift only on real pointer devices (no stuck iOS tap state).
   Keyboard focus + neutral pressed/touch on the links are owned by the SkLink primitive. */
@media (hover: hover) and (pointer: fine) {
  .pwc__chapter-heading:hover,
  .pwc__chapter-heading:hover .pwc__chevron {
    color: var(--sk-reading-heading);
  }
  .pwc__link:hover {
    color: var(--sk-reading-heading);
  }
}

/* The disclosure button is a real button (not a SkLink), so it owns its focus ring — using the
   shared focus language so the whole shell speaks one focus dialect. */
.pwc__chapter-heading:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
  border-radius: var(--sk-radius-sm);
}

/* Honour reduced motion explicitly (in addition to the global floor in utilities.css). */
@media (prefers-reduced-motion: reduce) {
  .pwc__chevron,
  .pwc__chapter-heading,
  .pwc__link {
    transition: none;
  }
}
</style>
