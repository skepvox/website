<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Cue {
  id: string
  start: number
  end: number
  text: string
}
interface Paragraph {
  id: string
  speaker: string | null
  cues: Cue[]
}
interface Section {
  id: string
  label: string
  isDialogue: boolean
  paragraphs: Paragraph[]
}
interface Episode {
  id: string
  title: string
  audioUrl: string
  lang: string
  durationSeconds?: number
}

const props = defineProps<{
  episode: Episode
  sections: Section[]
}>()

// Flat, time-ordered cue list + id->index map, built once (props are static).
// Pure data work — safe to run during SSR.
const flatCues: Cue[] = props.sections.flatMap((section) =>
  section.paragraphs.flatMap((paragraph) => paragraph.cues)
)
const indexById = new Map<string, number>(flatCues.map((cue, i) => [cue.id, i]))

const audioRef = ref<HTMLAudioElement | null>(null)
const transcriptRef = ref<HTMLElement | null>(null)
const activeId = ref<string | null>(null)
// Roving tabindex: exactly one cue is in the tab order; arrows move between them.
const focusId = ref<string | null>(flatCues.length ? flatCues[0].id : null)

// Client-only state (never read during SSR render).
let following = true
let prefersReduced = false
let hint = 0
let mediaQuery: MediaQueryList | null = null

function cssEscape(value: string): string {
  return typeof window !== 'undefined' && window.CSS && window.CSS.escape
    ? window.CSS.escape(value)
    : value
}

function cueElement(id: string): HTMLElement | null {
  const root = transcriptRef.value
  return root ? root.querySelector<HTMLElement>(`[data-cue="${cssEscape(id)}"]`) : null
}

// Incremental scan from the last known position — O(1) amortized as time
// advances, so it stays cheap across hundreds of cues and frequent timeupdate.
function activeIndex(time: number): number {
  if (!flatCues.length || time < flatCues[0].start) return -1
  let i = hint
  if (i >= flatCues.length) i = flatCues.length - 1
  if (i < 0) i = 0
  while (i > 0 && flatCues[i].start > time) i--
  while (i < flatCues.length - 1 && flatCues[i + 1].start <= time) i++
  hint = i
  return i
}

function scrollActiveIntoView(id: string): void {
  const el = cueElement(id)
  if (!el) return
  // Only scroll when the active cue drifts out of a comfortable reading band,
  // so the transcript does not re-center on every cue change.
  const rect = el.getBoundingClientRect()
  const viewport = window.innerHeight || document.documentElement.clientHeight
  if (rect.top >= viewport * 0.2 && rect.bottom <= viewport * 0.75) return
  el.scrollIntoView({ block: 'center', behavior: prefersReduced ? 'auto' : 'smooth' })
}

function syncActive(): void {
  const audio = audioRef.value
  if (!audio) return
  const index = activeIndex(audio.currentTime)
  const id = index >= 0 ? flatCues[index].id : null
  if (id === activeId.value) return
  activeId.value = id
  if (id && following && !audio.paused) scrollActiveIntoView(id)
}

function onPlay(): void {
  following = true // re-engage follow-along whenever playback (re)starts
  syncActive()
}

function seekTo(cue: Cue): void {
  const audio = audioRef.value
  if (!audio) return
  audio.currentTime = cue.start
  activeId.value = cue.id
  following = true
  const played = audio.play()
  if (played && typeof played.catch === 'function') played.catch(() => {})
  scrollActiveIntoView(cue.id)
}

function focusCue(index: number): void {
  const clamped = Math.min(Math.max(index, 0), flatCues.length - 1)
  const id = flatCues[clamped].id
  focusId.value = id
  cueElement(id)?.focus()
}

function onCueKey(event: KeyboardEvent, cue: Cue): void {
  const index = indexById.get(cue.id) ?? 0
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      seekTo(cue)
      break
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      following = false
      focusCue(index + 1)
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      following = false
      focusCue(index - 1)
      break
    case 'Home':
      event.preventDefault()
      following = false
      focusCue(0)
      break
    case 'End':
      event.preventDefault()
      following = false
      focusCue(flatCues.length - 1)
      break
  }
}

// A deliberate scroll gesture from the reader suspends auto-scroll until they
// re-engage by pressing play or activating a cue. Programmatic scrollIntoView
// emits no wheel/touch events, so there are no false positives.
function onReaderScroll(): void {
  following = false
}

function onReducedMotionChange(event: MediaQueryListEvent): void {
  prefersReduced = event.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReduced = mediaQuery.matches
  mediaQuery.addEventListener?.('change', onReducedMotionChange)
  window.addEventListener('wheel', onReaderScroll, { passive: true })
  window.addEventListener('touchmove', onReaderScroll, { passive: true })
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.('change', onReducedMotionChange)
  window.removeEventListener('wheel', onReaderScroll)
  window.removeEventListener('touchmove', onReaderScroll)
})
</script>

<template>
  <section class="vox-player" :lang="episode.lang">
    <div class="vox-player__bar">
      <audio
        ref="audioRef"
        class="vox-player__audio"
        :src="episode.audioUrl"
        controls
        preload="metadata"
        @timeupdate="syncActive"
        @seeked="syncActive"
        @play="onPlay"
      >
        <a :href="episode.audioUrl">{{ episode.audioUrl }}</a>
      </audio>
    </div>

    <div ref="transcriptRef" class="vox-transcript">
      <section
        v-for="section in sections"
        :key="section.id"
        class="vox-section"
        :class="{ 'vox-section--dialogue': section.isDialogue }"
      >
        <h3 class="vox-section__label">{{ section.label }}</h3>
        <p
          v-for="paragraph in section.paragraphs"
          :key="paragraph.id"
          class="vox-para"
          :class="{ 'vox-para--dialogue': section.isDialogue }"
        >
          <span v-if="paragraph.speaker" class="vox-speaker"
            >{{ paragraph.speaker }}:</span
          ><template v-for="cue in paragraph.cues" :key="cue.id"
            ><span
              class="vox-cue"
              :class="{ 'is-active': cue.id === activeId }"
              :data-cue="cue.id"
              role="button"
              :tabindex="cue.id === focusId ? 0 : -1"
              :aria-current="cue.id === activeId ? 'true' : undefined"
              @click="seekTo(cue)"
              @keydown="onCueKey($event, cue)"
              @focus="focusId = cue.id"
              >{{ cue.text }}</span
            >{{ ' ' }}</template
          >
        </p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.vox-player {
  margin: 1.5rem 0 2rem;
}

/* Sticky transport so controls stay reachable while reading the transcript. */
.vox-player__bar {
  position: sticky;
  top: var(--vt-nav-height, 56px);
  z-index: 5;
  padding: 10px 0;
  background: var(--vt-c-bg);
  border-bottom: 1px solid var(--sk-reading-rule);
}

.vox-player__audio {
  width: 100%;
  display: block;
}

.vox-transcript {
  margin-top: 1.25rem;
  color: var(--sk-reading-body);
}

.vox-section + .vox-section {
  margin-top: 1.75rem;
}

.vox-section__label {
  margin: 0 0 0.6rem;
  padding-top: 1rem;
  border-top: 1px solid var(--sk-reading-rule);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--sk-reading-muted);
}

.vox-section:first-child .vox-section__label {
  padding-top: 0;
  border-top: 0;
}

.vox-para {
  margin: 0 0 0.85rem;
  font-size: 17px;
  line-height: 1.78;
}

.vox-para--dialogue {
  margin-bottom: 0.55rem;
}

.vox-speaker {
  font-weight: 650;
  color: var(--sk-reading-heading);
  margin-right: 0.4em;
}

.vox-cue {
  cursor: pointer;
  /* Keep the transcript copyable as text despite role="button". */
  user-select: text;
  -webkit-user-select: text;
  border-radius: 4px;
  padding: 0.06em 0.12em;
  margin: 0 -0.02em;
  transition: background-color 0.18s ease, color 0.18s ease;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.vox-cue:hover {
  background-color: var(--sk-cue-hover);
}

.vox-cue.is-active {
  background-color: var(--sk-cue-active);
  color: var(--sk-reading-heading);
}

.vox-cue:focus-visible {
  outline: 2px solid var(--vt-c-brand, #3c8772);
  outline-offset: 1px;
}

@media (min-width: 768px) {
  .vox-para {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .vox-para {
    font-size: 16px;
    line-height: 1.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vox-cue {
    transition: none;
  }
}
</style>
