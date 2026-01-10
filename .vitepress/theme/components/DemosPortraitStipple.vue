<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'

type StippleTick = {
  type: 'tick'
  points: Float32Array
  iteration: number
  done: boolean
}

type StippleError = {
  type: 'error'
  message: string
}

type StippleMessage = StippleTick | StippleError

const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    maxWidth?: number
    iterations?: number
    msPerFrame?: number
    pixelsPerPoint?: number
    pointRadius?: number
  }>(),
  {
    maxWidth: 260,
    iterations: 80,
    msPerFrame: 50,
    pixelsPerPoint: 16,
    pointRadius: 0.75
  }
)

const { page, isDark } = useData()

const frontmatter = computed(() => (page.value.frontmatter ?? {}) as any)
const demos = computed(() => (frontmatter.value?.demos ?? {}) as any)

const portraitSrc = computed(() => {
  if (props.src) {
    if (props.src.startsWith('http://') || props.src.startsWith('https://')) return props.src
    if (props.src.startsWith('/')) return withBase(props.src)
    return withBase(props.src)
  }

  const portrait = demos.value?.portrait
  if (typeof portrait !== 'string' || !portrait.trim()) return null
  const trimmed = portrait.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) return withBase(trimmed)
  return withBase(`/images/demos/pessoas/${trimmed}`)
})

const altText = computed(() => {
  if (typeof props.alt === 'string' && props.alt.trim()) return props.alt.trim()
  const title = frontmatter.value?.title
  if (typeof title === 'string' && title.trim()) return title.trim()
  return 'Retrato (stippling)'
})

const wrapperEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const dotColor = ref('#111827')

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const isVisible = ref(true)

let resizeObserver: ResizeObserver | null = null
let worker: Worker | null = null
let runToken = 0

type RenderState = {
  cssWidth: number
  cssHeight: number
  sampleWidth: number
  sampleHeight: number
  scale: number
  radius: number
}

let renderState: RenderState | null = null
let playbackRaf: number | null = null
let themeRaf: number | null = null
let frames: Float32Array[] = []
let playbackIndex = 0
let workerDone = false
let lastFrameTime = 0

function stopRun() {
  runToken += 1
  worker?.terminate()
  worker = null
  workerDone = false
  frames = []
  playbackIndex = 0
  lastFrameTime = 0
  if (themeRaf != null) {
    cancelAnimationFrame(themeRaf)
    themeRaf = null
  }
  if (playbackRaf != null) {
    cancelAnimationFrame(playbackRaf)
    playbackRaf = null
  }
}

function draw(points: Float32Array) {
  const canvas = canvasEl.value
  const state = renderState
  if (!canvas || !state) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0)
  ctx.clearRect(0, 0, state.cssWidth, state.cssHeight)

  ctx.beginPath()
  const r = state.radius
  const scale = state.scale
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i] * scale
    const y = points[i + 1] * scale
    ctx.moveTo(x + r, y)
    ctx.arc(x, y, r, 0, Math.PI * 2)
  }
  ctx.fillStyle = dotColor.value
  ctx.fill()
}

function terminateWorker() {
  worker?.terminate()
  worker = null
}

function ensurePlayback(token: number) {
  if (playbackRaf != null) return

  const msPerFrame = Math.max(0, props.msPerFrame)
  if (!frames.length) return

  if (playbackIndex === 0) {
    draw(frames[0])
    playbackIndex = 1
    lastFrameTime = performance.now()
  }

  const step = (now: number) => {
    if (token !== runToken) return

    if (msPerFrame === 0) {
      draw(frames[frames.length - 1])
      playbackIndex = frames.length
    } else if (playbackIndex < frames.length && now - lastFrameTime >= msPerFrame) {
      draw(frames[playbackIndex])
      playbackIndex += 1
      lastFrameTime = now
    }

    const hasMoreFrames = playbackIndex < frames.length
    if (hasMoreFrames || !workerDone) {
      playbackRaf = requestAnimationFrame(step)
      return
    }

    // Free memory, keeping the last frame only.
    if (frames.length) frames = [frames[frames.length - 1]]
    playbackRaf = null
  }

  playbackRaf = requestAnimationFrame(step)
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${url}`))
    img.src = url
  })
}

function readDotColor(source?: Element | null) {
  if (typeof window === 'undefined') return '#111827'
  const target = source ?? document.body ?? document.documentElement
  const styles = getComputedStyle(target)
  const resolved = styles.color?.trim()
  if (resolved) return resolved
  return isDark.value ? 'rgba(255, 255, 255, 0.87)' : '#213547'
}

function refreshDotColor() {
  dotColor.value = readDotColor(wrapperEl.value)
}

function buildWeights(img: HTMLImageElement, width: number, height: number) {
  const scratch = document.createElement('canvas')
  scratch.width = width
  scratch.height = height
  const ctx = scratch.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas não suportado.')

  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, width, height)
  const rgba = ctx.getImageData(0, 0, width, height).data
  const weights = new Uint8Array(width * height)

  for (let i = 0, px = 0; i < rgba.length; i += 4, px += 1) {
    const r = rgba[i]
    const g = rgba[i + 1]
    const b = rgba[i + 2]
    const a = rgba[i + 3]
    if (a === 0) {
      weights[px] = 0
      continue
    }
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const alpha = a / 255
    const weight = Math.max(0, Math.min(255, Math.round((255 - luma) * alpha)))
    weights[px] = weight
  }

  return weights
}

async function start() {
  const src = portraitSrc.value
  const wrapper = wrapperEl.value
  const canvas = canvasEl.value

  if (!src || !wrapper || !canvas || typeof window === 'undefined') return

  stopRun()
  refreshDotColor()
  isVisible.value = true
  isLoading.value = true
  errorMessage.value = null

  const token = runToken

  try {
    const img = await loadImage(src)
    if (token !== runToken) return

    const measuredWidth = wrapper.clientWidth || props.maxWidth
    const cssWidth = Math.max(180, Math.min(props.maxWidth, Math.round(measuredWidth)))
    const cssHeight = Math.max(180, Math.round(cssWidth * (img.naturalHeight / img.naturalWidth)))

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(cssWidth * dpr)
    canvas.height = Math.round(cssHeight * dpr)
    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`

    const maxSampleWidth = 260
    const sampleWidth = Math.max(140, Math.min(maxSampleWidth, cssWidth))
    const sampleHeight = Math.max(140, Math.round(sampleWidth * (img.naturalHeight / img.naturalWidth)))
    const scale = cssWidth / sampleWidth
    const radius = props.pointRadius * scale

    renderState = { cssWidth, cssHeight, sampleWidth, sampleHeight, scale, radius }

    const weights = buildWeights(img, sampleWidth, sampleHeight)

    const pixels = sampleWidth * sampleHeight
    const n = Math.max(200, Math.round(pixels / props.pixelsPerPoint))

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const postEvery = reduceMotion ? props.iterations : 1

    worker = new Worker(new URL('../workers/demosPortraitStipple.worker.ts', import.meta.url), {
      type: 'module'
    })

    worker.addEventListener('message', (event: MessageEvent<StippleMessage>) => {
      if (token !== runToken) return
      const message = event.data

      if (message?.type === 'error') {
        errorMessage.value = message.message || 'Erro ao renderizar retrato.'
        isLoading.value = false
        isVisible.value = false
        stopRun()
        return
      }

      if (message?.type !== 'tick') return

      if (!frames.length) isLoading.value = false
      frames.push(message.points)
      ensurePlayback(token)

      if (message.done) {
        workerDone = true
        terminateWorker()
      }
    })

    worker.postMessage(
      {
        data: weights,
        width: sampleWidth,
        height: sampleHeight,
        n,
        iterations: props.iterations,
        postEvery
      },
      [weights.buffer]
    )
  } catch (err) {
    if (token !== runToken) return
    errorMessage.value = err instanceof Error ? err.message : String(err)
    isLoading.value = false
    isVisible.value = false
    stopRun()
  }
}

onMounted(() => {
  if (!wrapperEl.value) return
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      void start()
    })
    resizeObserver.observe(wrapperEl.value)
  }
  void start()
})

onBeforeUnmount(() => {
  stopRun()
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch(portraitSrc, () => {
  void start()
})

watch(isDark, () => {
  if (typeof window === 'undefined') return
  if (themeRaf != null) cancelAnimationFrame(themeRaf)
  themeRaf = requestAnimationFrame(() => {
    themeRaf = null
    refreshDotColor()
    if (!frames.length) return
    const idx = Math.max(0, Math.min(frames.length - 1, playbackIndex - 1))
    draw(frames[idx])
  })
})
</script>

<template>
  <div v-if="portraitSrc && isVisible" ref="wrapperEl" class="demos-portrait-stipple" :style="{ maxWidth: `${maxWidth}px` }">
    <canvas ref="canvasEl" class="demos-portrait-stipple__canvas" role="img" :aria-label="altText"></canvas>

    <div v-if="isLoading" class="demos-portrait-stipple__status">Carregando…</div>
    <div v-else-if="errorMessage" class="demos-portrait-stipple__status demos-portrait-stipple__status--error">
      {{ errorMessage }}
    </div>

    <noscript>
      <img
        :src="portraitSrc"
        :alt="altText"
        style="width: 100%; height: auto; display: block;"
      />
    </noscript>
  </div>
</template>

<style scoped>
.demos-portrait-stipple {
  width: 100%;
  margin: 12px auto 24px;
  position: relative;
}

.demos-portrait-stipple__canvas {
  width: 100%;
  height: auto;
  display: block;
}

.demos-portrait-stipple__status {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: rgba(255, 255, 255, 0.74);
}

.dark .demos-portrait-stipple__status {
  background: rgba(0, 0, 0, 0.55);
}

.demos-portrait-stipple__status--error {
  color: #991b1b;
}
</style>
