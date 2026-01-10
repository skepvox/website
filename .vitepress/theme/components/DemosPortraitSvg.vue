<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'

const props = withDefaults(
  defineProps<{
    maxWidth?: number
    alt?: string
  }>(),
  {
    maxWidth: 300
  }
)

const { page, isDark } = useData()

const frontmatter = computed(() => (page.value.frontmatter ?? {}) as any)
const demos = computed(() => (frontmatter.value?.demos ?? {}) as any)

const themeVariant = ref<'light' | 'dark'>('light')
const themeObserver = ref<MutationObserver | null>(null)

const updateThemeVariant = () => {
  if (typeof document === 'undefined') return
  themeVariant.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

const scheduleThemeUpdate = () => {
  if (typeof window === 'undefined') return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateThemeVariant()
    })
  })
}

const portraitFilename = computed(() => {
  const portrait = demos.value?.portrait
  if (typeof portrait !== 'string') return null
  const trimmed = portrait.trim()
  if (!trimmed) return null
  return trimmed
})

const portraitBase = computed(() => {
  const filename = portraitFilename.value
  if (!filename) return null
  return filename.replace(/\.[^/.]+$/, '')
})

const svgSrc = computed(() => {
  const base = portraitBase.value
  if (!base) return null
  const variant = themeVariant.value
  return withBase(`/images/demos/pessoas-stipple/${base}--${variant}.svg`)
})

const fallbackPngSrc = computed(() => {
  const filename = portraitFilename.value
  if (!filename) return null
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename
  if (filename.startsWith('/')) return withBase(filename)
  return withBase(`/images/demos/pessoas/${filename}`)
})

const altText = computed(() => {
  if (typeof props.alt === 'string' && props.alt.trim()) return props.alt.trim()
  const title = frontmatter.value?.title
  if (typeof title === 'string' && title.trim()) return title.trim()
  return 'Retrato'
})

const hasError = ref(false)

watch(svgSrc, () => {
  hasError.value = false
})

onMounted(() => {
  updateThemeVariant()
  if (typeof MutationObserver !== 'undefined') {
    themeObserver.value = new MutationObserver(() => {
      scheduleThemeUpdate()
    })
    themeObserver.value.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    })
  }
})

onBeforeUnmount(() => {
  themeObserver.value?.disconnect()
  themeObserver.value = null
})

watch(isDark, () => {
  scheduleThemeUpdate()
})
</script>

<template>
  <div v-if="svgSrc && !hasError" class="demos-portrait-svg" :style="{ maxWidth: `${maxWidth}px` }">
    <img
      :key="svgSrc"
      :src="svgSrc"
      :alt="altText"
      class="demos-portrait-svg__img"
      decoding="async"
      @error="hasError = true"
    />
  </div>

  <div v-else-if="fallbackPngSrc" class="demos-portrait-svg" :style="{ maxWidth: `${maxWidth}px` }">
    <img
      :key="fallbackPngSrc"
      :src="fallbackPngSrc"
      :alt="altText"
      class="demos-portrait-svg__img"
      decoding="async"
      @error="hasError = true"
    />
  </div>
</template>

<style scoped>
.demos-portrait-svg {
  width: 100%;
  margin: 12px auto 24px;
}

.demos-portrait-svg__img {
  width: 100%;
  height: auto;
  display: block;
}
</style>
