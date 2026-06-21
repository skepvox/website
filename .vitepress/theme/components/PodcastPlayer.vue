<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

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

// Display-only nudge: ASR word timestamps tend to lag the true spoken onset, so
// the highlight is chosen slightly ahead of audio.currentTime. This affects ONLY
// which cue is highlighted — click-to-seek still uses the true cue.start. Kept
// small so it never lights up the next phrase before it is spoken.
const VISUAL_SYNC_OFFSET_SECONDS = 0.15
const MEDIA_SESSION_ARTWORK = {
  src: '/skepvox-media-session.png',
  sizes: '512x512',
  type: 'image/png'
}

// Learning controls: exposed playback rates and the (guarded) persistence key.
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5]
const RATE_STORAGE_KEY = 'vox:playback-rate'

// Flat, time-ordered cue list + id->index map, built once (props are static).
// Pure data work — safe to run during SSR.
const flatCues: Cue[] = props.sections.flatMap((section) =>
  section.paragraphs.flatMap((paragraph) => paragraph.cues)
)
const indexById = new Map<string, number>(flatCues.map((cue, i) => [cue.id, i]))

// cue id -> section id, so the playing cue lights up the matching section chip.
// Pure data work, built once — safe during SSR.
const cueToSection = new Map<string, string>()
for (const section of props.sections) {
  for (const paragraph of section.paragraphs) {
    for (const cue of paragraph.cues) cueToSection.set(cue.id, section.id)
  }
}

const playerRef = ref<HTMLElement | null>(null)
const barRef = ref<HTMLElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const transcriptRef = ref<HTMLElement | null>(null)
const rateRef = ref<HTMLElement | null>(null)
const activeId = ref<string | null>(null)
// Roving tabindex: exactly one cue is in the tab order; arrows move between them.
const focusId = ref<string | null>(flatCues.length ? flatCues[0].id : null)

// Coarse "where am I" for the section chips; null during SSR (no active cue yet).
const activeSectionId = computed(() =>
  activeId.value ? (cueToSection.get(activeId.value) ?? null) : null
)
// Custom playback rate driving the native engine; hydrated from localStorage on mount.
const playbackRate = ref(1)
// Mobile-only rate menu (desktop shows the segmented buttons inline via CSS).
const rateMenuOpen = ref(false)

// Desktop uses CSS position:sticky. On mobile the @vue/theme content wrapper has
// overflow:auto, which disables sticky, so the bar is pinned with position:fixed
// only while the transcript is in view (JS-driven). barHeight feeds the spacer
// (no content jump) and the auto-scroll clearance.
const pinned = ref(false)
const barHeight = ref(64)

// Client-only state (never read during SSR render).
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
  // so the transcript does not re-center on every cue change. The band starts
  // below the nav + audio bar so the active cue is never read under the bar.
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

// Pin the bar (position:fixed) while the transcript is in view; otherwise leave
// it in flow so it never floats over the intro or the learning-guide sections.
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
  following = true // re-engage follow-along whenever playback (re)starts
  syncActive()
}

function seekTo(cue: Cue): void {
  const audio = audioRef.value
  if (!audio) return
  audio.currentTime = cue.start // seek uses the true cue start, not the offset
  activeId.value = cue.id
  following = true
  const played = audio.play()
  if (played && typeof played.catch === 'function') played.catch(() => {})
  scrollActiveIntoView(cue.id)
}

// Coarse section navigation: scroll the transcript to a section heading WITHOUT
// touching audio (fine seeking stays click-to-cue). Clears the nav + audio bar so
// the heading is never hidden behind the fixed mobile bar.
// Buttons (not anchors), so there is no native hash navigation to race the custom
// offset scroll. Keyboard Enter/Space activate the button natively.
function scrollToSection(domId: string): void {
  const el = typeof document !== 'undefined' ? document.getElementById(domId) : null
  if (!el) return
  following = false
  // Clear the fixed nav + the sticky/fixed audio bar. Measure the bar's real height
  // now — the cached barHeight can lag the native control rendering / metadata load.
  const barH = barRef.value ? barRef.value.getBoundingClientRect().height : barHeight.value
  const clearance = navHeight + barH + 14
  const top = window.scrollY + el.getBoundingClientRect().top - clearance
  window.scrollTo({ top: Math.max(top, 0), behavior: prefersReduced ? 'auto' : 'smooth' })
}

// Compact breadcrumb labels by section POSITION (the fixed 5-part Vox structure),
// so the two dialogue steps deliberately share a label. Localised, with a fallback
// to the full source label for any unexpected language or section count. The full
// source label stays in title/aria-label so the two dialogue steps remain
// distinguishable to screen readers and tooltips.
// Compact, predictable labels shared across languages (the abbreviations read the
// same in fr/es/en). The two dialogue steps deliberately share a label; the full
// source label stays in each step's title/aria-label.
const STEP_LABELS = ['Intro', 'Dial.', 'Exp.', 'Dial.', 'Concl.']
function stepLabel(index: number): string {
  return STEP_LABELS[index] ?? props.sections[index]?.label ?? ''
}

// Stable, position-based DOM id that cannot collide with the page's own H1 anchor.
function sectionDomId(index: number): string {
  return 'vox-section-' + String(index + 1).padStart(2, '0')
}

function applyPlaybackRate(): void {
  if (audioRef.value) audioRef.value.playbackRate = playbackRate.value
}

function loadStoredRate(): number {
  try {
    const stored = parseFloat(window.localStorage.getItem(RATE_STORAGE_KEY) || '')
    return PLAYBACK_RATES.includes(stored) ? stored : 1
  } catch {
    return 1
  }
}

function setPlaybackRate(rate: number): void {
  playbackRate.value = rate
  applyPlaybackRate()
  try {
    window.localStorage.setItem(RATE_STORAGE_KEY, String(rate))
  } catch {
    /* storage unavailable (e.g. private mode) — keep the in-memory rate */
  }
}

function chooseRate(rate: number): void {
  setPlaybackRate(rate)
  rateMenuOpen.value = false
}

// Close the mobile rate menu on outside tap / Escape. No-op on desktop, where the
// segmented buttons are shown inline regardless of this flag.
function onRateOutside(event: Event): void {
  if (!rateMenuOpen.value) return
  const target = event.target as Node | null
  if (rateRef.value && target && !rateRef.value.contains(target)) rateMenuOpen.value = false
}

function onRateKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') rateMenuOpen.value = false
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

// Populate the OS media surface (lock screen / Dynamic Island) with the
// episode/show titles and the compact skepvox app mark. The show covers remain
// the page/feed/share artwork, but they are too detailed for tiny system UI.
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
    /* metadata unsupported — ignore */
  }
  const bind = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
    try {
      ms.setActionHandler(action, handler)
    } catch {
      /* action unsupported on this platform */
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
  document.addEventListener('click', onRateOutside)
  document.addEventListener('keydown', onRateKey)
  setupMediaSession()

  navHeight =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vt-nav-height')) || 55
  measureBar()
  playbackRate.value = loadStoredRate()
  applyPlaybackRate()
  audioRef.value?.addEventListener('loadedmetadata', measureBar)
  // playbackRate resets when the media element (re)loads, so re-apply it.
  audioRef.value?.addEventListener('loadedmetadata', applyPlaybackRate)
  window.addEventListener('scroll', schedulePin, { passive: true })
  window.addEventListener('resize', schedulePin)
  updatePin()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.('change', onReducedMotionChange)
  window.removeEventListener('wheel', onReaderScroll)
  window.removeEventListener('touchmove', onReaderScroll)
  document.removeEventListener('click', onRateOutside)
  document.removeEventListener('keydown', onRateKey)
  audioRef.value?.removeEventListener('loadedmetadata', measureBar)
  audioRef.value?.removeEventListener('loadedmetadata', applyPlaybackRate)
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
      <!-- Playback rate: part of the player area — a small row under the native audio. -->
      <div ref="rateRef" class="vox-rate" :class="{ 'is-open': rateMenuOpen }">
        <button
          type="button"
          class="vox-rate__toggle"
          aria-haspopup="true"
          :aria-expanded="rateMenuOpen ? 'true' : 'false'"
          aria-label="Velocidade de reprodução"
          @click="rateMenuOpen = !rateMenuOpen"
        >
          {{ playbackRate.toFixed(2) }}× <span class="vox-rate__caret" aria-hidden="true">▾</span>
        </button>
        <div class="vox-rate__menu" role="group" aria-label="Velocidade de reprodução">
          <button
            v-for="rate in PLAYBACK_RATES"
            :key="rate"
            type="button"
            class="vox-rate__btn"
            :class="{ 'is-active': rate === playbackRate }"
            :aria-pressed="rate === playbackRate ? 'true' : 'false'"
            @click="chooseRate(rate)"
          >
            {{ rate.toFixed(2) }}×
          </button>
        </div>
      </div>
    </div>
    <div class="vox-player__spacer" aria-hidden="true"></div>

    <!-- Transcript navigation: scroll-only section breadcrumb, its own row. -->
    <nav class="vox-steps" aria-label="Seções do episódio">
      <template v-for="(section, i) in sections" :key="section.id">
        <span v-if="i > 0" class="vox-step__sep" aria-hidden="true">›</span>
        <button
          type="button"
          class="vox-step"
          :class="{ 'is-current': section.id === activeSectionId }"
          :aria-controls="sectionDomId(i)"
          :title="section.label"
          :aria-label="section.label"
          :aria-current="section.id === activeSectionId ? 'true' : undefined"
          @click="scrollToSection(sectionDomId(i))"
        >
          {{ stepLabel(i) }}
        </button>
      </template>
    </nav>

    <div ref="transcriptRef" class="vox-transcript">
      <section
        v-for="(section, i) in sections"
        :id="sectionDomId(i)"
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
  margin: 1.5rem 0 2rem;
}

/* Desktop: CSS sticky keeps the transport reachable while reading. */
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

/* Reserves the bar's height when it is lifted out of flow on mobile. */
.vox-player__spacer {
  height: 0;
}

/* Mobile: sticky is disabled by the theme's overflow:auto content wrapper, so
   the bar is pinned with position:fixed only while the transcript is in view.
   Scoped entirely to the player; no global layout rules are touched. */
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
    padding: 8px 24px;
    padding-left: calc(24px + env(safe-area-inset-left, 0px));
    padding-right: calc(24px + env(safe-area-inset-right, 0px));
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  }
  .vox-player.is-pinned .vox-player__spacer {
    height: var(--vox-bar-h, 64px);
  }
}

/* Transcript navigation: a compact, scroll-only breadcrumb on its own row just
   above the transcript — not part of the player/transport. */
.vox-steps {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 0;
  margin: 0.6rem 0 0;
  font-size: 13px;
  line-height: 1.6;
}

.vox-step__sep {
  margin: 0 6px;
  color: var(--sk-reading-rule);
  user-select: none;
}

.vox-step {
  appearance: none;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 4px;
  color: var(--sk-reading-muted);
  text-decoration: none;
  white-space: nowrap;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;
}

.vox-step:hover {
  color: var(--sk-reading-heading);
  background: var(--sk-cue-hover);
}

/* Restrained "you are here": heading colour + a thin brand underline. No
   font-weight change, so switching the active step never reflows the breadcrumb. */
.vox-step.is-current {
  color: var(--sk-reading-heading);
  text-decoration: underline;
  text-decoration-color: var(--vt-c-brand, #3c8772);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.vox-step:focus-visible {
  outline: 2px solid var(--vt-c-brand, #3c8772);
  outline-offset: 1px;
}

/* Rate control: a small secondary row inside the player bar, under the audio.
   Not card-like — just the inline buttons/toggle. */
.vox-rate {
  position: relative;
  display: inline-flex;
  margin-top: 6px;
}

/* Desktop: segmented buttons inline; the mobile toggle is hidden. */
.vox-rate__toggle {
  display: none;
}

.vox-rate__menu {
  display: inline-flex;
  gap: 4px;
}

.vox-rate__btn,
.vox-rate__toggle {
  padding: 3px 9px;
  border: 1px solid var(--vt-c-divider, #e2e2e3);
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--sk-reading-muted);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.vox-rate__btn:hover,
.vox-rate__toggle:hover {
  border-color: var(--vt-c-brand, #3c8772);
}

.vox-rate__btn.is-active {
  border-color: var(--vt-c-brand, #3c8772);
  background: var(--vt-c-brand, #3c8772);
  color: #fff;
}

.vox-rate__btn:focus-visible,
.vox-rate__toggle:focus-visible {
  outline: 2px solid var(--vt-c-brand, #3c8772);
  outline-offset: 1px;
}

.vox-rate__caret {
  margin-left: 2px;
  font-size: 9px;
}

/* Mobile: collapse the segmented group into a compact current-rate button that
   opens a small popover menu. Kept out of the fixed audio bar, anchored to the
   non-sticky controls row so it never floats over the native transport. */
@media (max-width: 768px) {
  .vox-rate__toggle {
    display: inline-flex;
    align-items: center;
  }
  .vox-rate__menu {
    display: none;
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 6;
    flex-direction: column;
    gap: 4px;
    padding: 6px;
    background: var(--vt-c-bg);
    border: 1px solid var(--vt-c-divider, #e2e2e3);
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
  }
  .vox-rate.is-open .vox-rate__menu {
    display: flex;
  }
  .vox-rate__btn {
    text-align: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vox-step,
  .vox-rate__btn,
  .vox-rate__toggle {
    transition: none;
  }
}

.vox-transcript {
  margin-top: 0.75rem;
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
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
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
