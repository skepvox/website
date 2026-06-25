<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import meta from '../data/pipeline-export-segments.json'
import SkLink from './SkLink.vue'

// Owned contents map for the pipeline-export pt work hub (Introdução à ontologia). It reads the
// vendored pipeline-export metadata (../data/pipeline-export-segments.json) — the SAME source the
// leaf chrome (PipelineSegmentNav) uses — and renders the authored Part → Chapter → Segment
// hierarchy from each segment's groupPath (never from route slugs). It is the pipeline-family
// analogue of the legacy book map, kept deliberately separate: it consumes ONLY pipeline-export
// metadata and is mounted only on the generated work hub.
//
// Chapters are real disclosure buttons, default-collapsed for mobile density; the front matter and
// the two parts stay visible so the skeleton is always understandable. routePath is presentation
// only (the href); identity (canonicalId / segmentPrefix) is never shown nor used as a link.
const props = withDefaults(defineProps<{ workId?: string; language?: string; title?: string }>(), {
  workId: 'louis-lavelle/introduction-a-l-ontologie',
  language: 'pt',
  title: 'Introdução à ontologia'
})

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

const NAV_LABEL: Record<string, string> = { fr: 'Sommaire', pt: 'Sumário', en: 'Contents' }
const navLabel = computed(() => NAV_LABEL[props.language] ?? NAV_LABEL.pt)

const segs = computed(() =>
  (meta.segments as Seg[])
    .filter((s) => s.workId === props.workId && s.language === props.language)
    .slice()
    .sort((a, b) => a.order - b.order)
)

// Bucketing mirrors the hub generator (scripts/build-pipeline-segment-routes.py build_hub): a loose
// front-matter list, then Part → Chapter, with the trailing conclusion sentinels (empty groupPath,
// 99-99-999 prefix) folded into the final chapter so they read continuously.
interface Chapter {
  key: string
  domId: string
  title: string
  segments: Seg[]
}
type LooseBlock = { type: 'loose'; key: string; segments: Seg[] }
type PartBlock = { type: 'part'; key: string; heading: string; chapters: Chapter[] }

const blocks = computed<(LooseBlock | PartBlock)[]>(() => {
  const out: (LooseBlock | PartBlock)[] = []
  let group: LooseBlock | PartBlock | null = null
  let chapter: Chapter | null = null
  for (const rec of segs.value) {
    const gp = rec.groupPath
    if (!gp || gp.length === 0) {
      if (chapter && rec.segmentPrefix.startsWith('99-99-999')) {
        chapter.segments.push(rec)
        continue
      }
      if (!group || group.type !== 'loose') {
        group = { type: 'loose', key: `loose-${out.length}`, segments: [] }
        out.push(group)
        chapter = null
      }
      group.segments.push(rec)
      continue
    }
    const part = gp[0]
    const chap = gp[1]
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
  }
  return out
})

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
const chapterKeyOf = computed(() => {
  const map = new Map<string, string | null>()
  for (const b of blocks.value) {
    if (b.type === 'loose') for (const s of b.segments) map.set(s.segmentPrefix, null)
    else for (const ch of b.chapters) for (const s of ch.segments) map.set(s.segmentPrefix, ch.key)
  }
  return map
})
const currentPrefix = ref<string | null>(null)
const isCurrent = (s: Seg) => s.segmentPrefix === currentPrefix.value

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
  if (!chapterKeyOf.value.has(prefix)) return
  currentPrefix.value = prefix
  const chapterKey = chapterKeyOf.value.get(prefix)
  if (chapterKey) expanded[chapterKey] = true
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
    <h1 id="pwc-title" class="pwc__title">{{ title }}</h1>
    <nav class="pwc" :aria-label="navLabel">
      <template v-for="block in blocks" :key="block.key">
        <!-- Front matter / loose initial segments (e.g. Advertência): flush links, no chapter. -->
        <div v-if="block.type === 'loose'" class="pwc__loose">
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
              <span
                class="pwc__chevron"
                :class="{ 'is-open': isOpen(ch.key) }"
                aria-hidden="true"
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
                class="pwc__link"
                :class="{ 'is-current': isCurrent(s) }"
                :href="`/${s.routePath}`"
                :current="isCurrent(s)"
                >{{ s.displayTitle }}</SkLink
              >
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

.pwc__title {
  margin: 0 0 1.85rem;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.12;
  color: var(--sk-text);
}

.pwc {
  margin: 0;
}

.pwc__part + .pwc__part {
  margin-top: 1.5rem;
}

/* Front matter sits flush at the top, before the first part. */
.pwc__loose {
  display: flex;
  flex-direction: column;
  padding: 0 0 0.5rem;
}

/* The part label is a quiet, non-interactive orientation line (never a disclosure, never a doc
   heading — so it does not disturb the page heading order). */
.pwc__part-heading {
  margin: 1.4rem 0 0.1rem;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.4;
  color: var(--sk-reading-heading);
}

/* The chapter heading is a real disclosure button (quiet literary eyebrow). */
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
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
  -webkit-tap-highlight-color: transparent;
  transition: color 0.18s ease;
}

.pwc__chapter-title {
  flex: 1 1 auto;
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

.pwc__chevron {
  flex: none;
  width: 0;
  height: 0;
  border-left: 5px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  opacity: 0.45;
  transition: transform 0.2s ease;
}
.pwc__chevron.is-open {
  transform: rotate(90deg);
}

.pwc__leaves {
  display: flex;
  flex-direction: column;
  padding: 0.1rem 0 0.85rem;
}

/* Each leaf is a SkLink row: the display label leads; no bullets, no slugs, no UI-imposed numbering. */
.pwc__link {
  display: block;
  min-height: 44px;
  padding: 0.5rem 0 0.5rem 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--sk-reading-muted);
  text-decoration: none;
  transition: color 0.18s ease;
}
/* Front-matter links sit flush (no chapter indent). */
.pwc__link--loose {
  padding-left: 0;
}

/* The trecho the reader returned from (via a leaf "up" link): a quiet current marker, dormant on a
   normal hub visit. The accent rule sits inside the leaf indent so it does not touch the page edge. */
.pwc__link.is-current {
  color: var(--sk-reading-heading);
  box-shadow: inset 2px 0 0 0 var(--sk-accent);
}
.pwc__link--loose.is-current {
  box-shadow: none;
  font-weight: 600;
}

/* Four-state floor: visible hover lift only on real pointer devices (no stuck iOS tap state).
   Keyboard focus + neutral pressed/touch on the links are owned by the SkLink primitive. */
@media (hover: hover) and (pointer: fine) {
  .pwc__chapter-heading:hover {
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
