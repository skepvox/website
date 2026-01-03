<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import { autoType, csvParse } from 'd3'
import type { EnemQuestionChartAsset } from '../../../enem/types'
import type { ChartData, ChartInstance, ChartMeta } from '../../../charts/types'
import { getChartRenderer } from '../../../charts/registry'
import { readChartTheme } from '../../../charts/base'

const props = defineProps<{
  asset: EnemQuestionChartAsset
  year: number
  questionNumber: number
  variant?: 'asset' | 'option'
}>()

const { isDark } = useData()

const containerRef = ref<HTMLDivElement | null>(null)
const chartInstance = ref<ChartInstance | null>(null)
const resizeObserver = ref<ResizeObserver | null>(null)
const themeObserver = ref<MutationObserver | null>(null)

const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const chartData = ref<ChartData[] | null>(null)
const chartMeta = ref<ChartMeta | null>(null)
const chartHeight = ref<number | null>(null)

const wrapperClass = computed(() =>
  props.variant === 'option'
    ? 'enem-question-card__option-chart'
    : 'enem-question-card__asset enem-question-card__asset--chart'
)

const chartClass = computed(() =>
  props.variant === 'option'
    ? 'enem-question-card__chart enem-question-card__chart--option'
    : 'enem-question-card__chart'
)

const chartStyle = computed(() => {
  if (props.variant === 'option') {
    return null
  }
  const style: Record<string, string> = {}
  const maxWidth = chartMeta.value?.width
  if (maxWidth) {
    style.maxWidth = `${maxWidth}px`
    style.margin = '0 auto'
  }
  const height = chartHeight.value ?? chartMeta.value?.height
  if (height) {
    style.height = `${height}px`
    style.minHeight = `${height}px`
  }
  return Object.keys(style).length ? style : null
})

const resolveChartHeight = (meta: ChartMeta, width: number) => {
  const fallbackHeight = meta.height ?? 320
  if (!meta.aspectRatio) {
    return fallbackHeight
  }
  const aspectHeight = Math.round(width * meta.aspectRatio)
  if (meta.height) {
    return Math.min(meta.height, aspectHeight)
  }
  return aspectHeight
}

const resolveChartWidth = (meta: ChartMeta, measuredWidth: number) => {
  if (!meta.width) {
    return measuredWidth
  }
  return Math.min(measuredWidth, meta.width)
}

const scheduleThemeRender = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderChart()
    })
  })
}

const resolveAssetPath = (file: string) => {
  if (!file) {
    return ''
  }
  if (file.startsWith('http://') || file.startsWith('https://')) {
    return file
  }
  if (file.startsWith('/')) {
    return withBase(file)
  }
  return withBase(`/enem/${props.year}/${file}`)
}

const loadChart = async () => {
  if (!props.asset.data_file) {
    errorMessage.value = 'Missing chart data file.'
    return
  }
  isLoading.value = true
  errorMessage.value = null
  try {
    const dataUrl = resolveAssetPath(props.asset.data_file)
    const dataResponse = await fetch(dataUrl)
    if (!dataResponse.ok) {
      throw new Error(`Chart data not found at ${dataUrl}`)
    }
    const dataText = await dataResponse.text()
    if (props.asset.data_file.endsWith('.json')) {
      const parsed = JSON.parse(dataText)
      chartData.value = (Array.isArray(parsed) ? parsed : [parsed]) as ChartData[]
    } else {
      chartData.value = csvParse(dataText, autoType) as ChartData[]
    }

    if (!props.asset.meta_file) {
      throw new Error('Missing chart meta file.')
    }
    const metaUrl = resolveAssetPath(props.asset.meta_file)
    const metaResponse = await fetch(metaUrl)
    if (!metaResponse.ok) {
      throw new Error(`Chart meta not found at ${metaUrl}`)
    }
    chartMeta.value = (await metaResponse.json()) as ChartMeta
    renderChart()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
    chartData.value = null
    chartMeta.value = null
  } finally {
    isLoading.value = false
  }
}

const renderChart = () => {
  const el = containerRef.value
  const meta = chartMeta.value
  const data = chartData.value
  if (!el || !meta || !data) {
    return
  }
  const renderer = getChartRenderer(meta.type)
  if (!renderer) {
    errorMessage.value = `Unsupported chart type: ${meta.type}`
    return
  }
  const measuredWidth = el.clientWidth || el.parentElement?.clientWidth || 0
  const baseWidth = measuredWidth > 0 ? measuredWidth : 640
  const width = resolveChartWidth(meta, baseWidth)
  const height = resolveChartHeight(meta, width)
  chartHeight.value = height
  const theme = readChartTheme(document.documentElement)
  if (!chartInstance.value) {
    chartInstance.value = renderer({
      el,
      data,
      meta,
      theme,
      width,
      height
    })
  } else {
    chartInstance.value.update({
      el,
      data,
      meta,
      theme,
      width,
      height
    })
  }
}

onMounted(() => {
  void loadChart()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver.value = new ResizeObserver(() => {
      renderChart()
    })
  }
  if (typeof MutationObserver !== 'undefined') {
    themeObserver.value = new MutationObserver(() => {
      scheduleThemeRender()
    })
    themeObserver.value.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    })
  }
})

onBeforeUnmount(() => {
  chartInstance.value?.destroy()
  resizeObserver.value?.disconnect()
  themeObserver.value?.disconnect()
})

watch(containerRef, (el, prev) => {
  if (resizeObserver.value) {
    if (prev) {
      resizeObserver.value.unobserve(prev)
    }
    if (el) {
      resizeObserver.value.observe(el)
    }
  }
  if (el) {
    renderChart()
  }
})

watch(isDark, async () => {
  await nextTick()
  scheduleThemeRender()
})

watch(
  () => props.asset,
  () => {
    void loadChart()
  }
)
</script>

<template>
  <div :class="wrapperClass">
    <div v-if="isLoading" class="enem-question-card__chart-state">
      Carregando grafico...
    </div>
    <div v-else-if="errorMessage" class="enem-question-card__chart-state">
      {{ errorMessage }}
    </div>
    <div
      v-else
      ref="containerRef"
      :class="chartClass"
      :style="chartStyle"
      role="img"
      :aria-label="chartMeta?.title || `Gr\u00e1fico da quest\u00e3o ${questionNumber}`"
    />
  </div>
</template>
