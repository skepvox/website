<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Cue {
  id: string
  start: number
  end: number
  text: string
  sep: string
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
  showTitle: string
  audioUrl: string
  artworkUrl?: string
  lang: string
  durationSeconds?: number
}

const props = defineProps<{
  episode: Episode
  sections: Section[]
}>()

const VISUAL_SYNC_OFFSET_SECONDS = 0.15
const MEDIA_SESSION_ARTWORK = {
  src: '/skepvox-media-session.png',
  sizes: '512x512',
  type: 'image/png'
}
const TRANSCRIPT_ANCHORS: Record<string, string> = {
  fr: 'transcription-complete',
  es: 'transcripcion-completa',
  en: 'complete-transcript'
}
const transcriptAnchor = TRANSCRIPT_ANCHORS[props.episode.lang] ?? 'transcript'

const flatCues: Cue[] = props.sections.flatMap((section) =>
  section.paragraphs.flatMap((paragraph) => paragraph.cues)
)
const indexById = new Map<string, number>(flatCues.map((cue, i) => [cue.id, i]))

const playerRef = ref<HTMLElement | null>(null)
const barRef = ref<HTMLElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const transcriptRef = ref<HTMLElement | null>(null)
const activeId = ref<string | null>(null)
const focusId = ref<string | null>(flatCues.length ? flatCues[0].id : null)

const pinned = ref(false)
const barHeight = ref(64)

let following = true
let prefersReduced = false
let hint = 0
let navHeight = 55
let pinScheduled = false
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
  const rect = el.getBoundingClientRect()
  const viewport = window.innerHeight || document.documentElement.clientHeight
  const obstruction = navHeight + barHeight.value
  const topGuard = Math.max(viewport * 0.18, obstruction + 16)
  const bottomGuard = viewport * 0.8
  if (rect.top >= topGuard && rect.bottom <= bottomGuard) return
  el.scrollIntoView({
    block: 'center',
    behavior: prefersReduced ? 'auto' : 'smooth'
  })
}

function isNarrow(): boolean {
  return window.matchMedia('(max-width: 768px)').matches
}

function updatePin(): void {
  pinScheduled = false
  const player = playerRef.value
  const transcript = transcriptRef.value
  if (!player || !transcript || !isNarrow()) {
    pinned.value = false
    return
  }
  const playerTop = player.getBoundingClientRect().top
  const transcriptBottom = transcript.getBoundingClientRect().bottom
  pinned.value = playerTop <= navHeight && transcriptBottom > navHeight + barHeight.value + 8
}

function schedulePin(): void {
  if (pinScheduled) return
  pinScheduled = true
  requestAnimationFrame(updatePin)
}

function measureBar(): void {
  if (barRef.value) barHeight.value = barRef.value.offsetHeight || barHeight.value
}

function syncActive(): void {
  const audio = audioRef.value
  if (!audio) return
  const index = activeIndex(audio.currentTime + VISUAL_SYNC_OFFSET_SECONDS)
  const id = index >= 0 ? flatCues[index].id : null
  if (id === activeId.value) return
  activeId.value = id
  if (id && following && !audio.paused) scrollActiveIntoView(id)
}

function onPlay(): void {
  following = true
  syncActive()
}

function seekTo(cue: Cue): void {
  const audio = audioRef.value
  if (!audio) return
  following = true
  audio.currentTime = cue.start
  syncActive()
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

function onReaderScroll(): void {
  following = false
}

function onReducedMotionChange(event: MediaQueryListEvent): void {
  prefersReduced = event.matches
}

function setupMediaSession(): void {
  const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined
  if (!ms || typeof MediaMetadata === 'undefined') return
  try {
    ms.metadata = new MediaMetadata({
      title: props.episode.title,
      artist: props.episode.showTitle,
      album: props.episode.showTitle,
      artwork: [MEDIA_SESSION_ARTWORK]
    })
  } catch {
    void 0
  }
  const bind = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
    try {
      ms.setActionHandler(action, handler)
    } catch {
      void 0
    }
  }
  bind('play', () => audioRef.value?.play())
  bind('pause', () => audioRef.value?.pause())
  bind('seekto', (details) => {
    if (audioRef.value && details.seekTime != null) audioRef.value.currentTime = details.seekTime
  })
}

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReduced = mediaQuery.matches
  mediaQuery.addEventListener?.('change', onReducedMotionChange)
  window.addEventListener('wheel', onReaderScroll, { passive: true })
  window.addEventListener('touchmove', onReaderScroll, { passive: true })
  setupMediaSession()

  navHeight =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vt-nav-height')) || 55
  measureBar()
  audioRef.value?.addEventListener('loadedmetadata', measureBar)
  window.addEventListener('scroll', schedulePin, { passive: true })
  window.addEventListener('resize', schedulePin)
  updatePin()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.('change', onReducedMotionChange)
  window.removeEventListener('wheel', onReaderScroll)
  window.removeEventListener('touchmove', onReaderScroll)
  audioRef.value?.removeEventListener('loadedmetadata', measureBar)
  window.removeEventListener('scroll', schedulePin)
  window.removeEventListener('resize', schedulePin)
})
</script>

<template>
  <section
    ref="playerRef"
    class="vox-player"
    :class="{ 'is-pinned': pinned }"
    :style="{ '--vox-bar-h': barHeight + 'px' }"
    :lang="episode.lang"
  >
    <div ref="barRef" class="vox-player__bar">
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
    <div class="vox-player__spacer" aria-hidden="true"></div>

    <div :id="transcriptAnchor" ref="transcriptRef" class="vox-transcript">
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
          <span v-if="paragraph.speaker" class="vox-speaker">{{ paragraph.speaker }}:</span
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
            >{{ cue.sep }}</template
          >
        </p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.vox-player {
  margin: var(--sk-space-5) 0 var(--sk-space-6);
}

.vox-player__bar {
  position: sticky;
  position: -webkit-sticky;
  top: var(--vt-nav-height, 55px);
  z-index: 5;
  padding: 10px 0;
  background: var(--vt-c-bg);
  border-bottom: 1px solid var(--sk-reading-rule);
}

.vox-player__audio {
  width: 100%;
  display: block;
}

.vox-player__spacer {
  height: 0;
}

@media (max-width: 768px) {
  .vox-player__bar {
    position: static;
  }
  .vox-player.is-pinned .vox-player__bar {
    position: fixed;
    top: calc(var(--vt-nav-height, 55px) + env(safe-area-inset-top, 0px));
    left: 0;
    right: 0;
    z-index: 10;
    padding: var(--sk-space-2) var(--sk-space-5);
    padding-left: calc(var(--sk-space-5) + env(safe-area-inset-left, 0px));
    padding-right: calc(var(--sk-space-5) + env(safe-area-inset-right, 0px));
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  }
  .vox-player.is-pinned .vox-player__spacer {
    height: var(--vox-bar-h, 64px);
  }
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
  font-size: var(--sk-text-sm);
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
  font-size: var(--sk-text-md);
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
  user-select: text;
  -webkit-user-select: text;
  -webkit-tap-highlight-color: transparent;
  border-radius: 4px;
  padding: 0.06em 0.12em;
  margin: 0 -0.02em;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

@media (hover: hover) and (pointer: fine) {
  .vox-cue:hover {
    background-color: var(--sk-cue-hover);
  }
}

.vox-cue.is-active {
  background-color: var(--sk-cue-active);
  color: var(--sk-reading-heading);
}

.vox-cue:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: 1px;
}

@media (min-width: 768px) {
  .vox-para {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .vox-para {
    font-size: var(--sk-text-base);
    line-height: 1.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vox-cue {
    transition: none;
  }
}
</style>
