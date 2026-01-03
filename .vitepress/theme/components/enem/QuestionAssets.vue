<script setup lang="ts">
import { computed } from 'vue'
import type {
  EnemQuestionAssets,
  EnemQuestionChartAsset,
  EnemQuestionFormulaAsset,
  EnemQuestionImageAsset,
  EnemQuestionTableAsset
} from '../../enem/types'
import AssetImage from './assets/AssetImage.vue'
import AssetTable from './assets/AssetTable.vue'
import AssetFormula from './assets/AssetFormula.vue'
import AssetChart from './assets/AssetChart.vue'

type AssetPosition = 'context' | 'statement' | 'options'

const props = defineProps<{
  assets?: EnemQuestionAssets | null
  position: AssetPosition
  year: number
  questionNumber: number
  showPlaceholders?: boolean
}>()

const normalizePosition = (value?: string): AssetPosition => {
  if (value === 'statement' || value === 'options') {
    return value
  }
  return 'context'
}

const filterByPosition = <T extends { position?: string }>(items?: T[]) => {
  return (items || []).filter(
    (item) => normalizePosition(item.position) === props.position
  )
}

const images = computed<EnemQuestionImageAsset[]>(() =>
  filterByPosition(props.assets?.images)
)
const tables = computed<EnemQuestionTableAsset[]>(() =>
  filterByPosition(props.assets?.tables)
)
const formulas = computed<EnemQuestionFormulaAsset[]>(() =>
  filterByPosition(props.assets?.formulas)
)
const charts = computed<EnemQuestionChartAsset[]>(() =>
  filterByPosition(props.assets?.charts)
)

const showPlaceholders = computed(() => Boolean(props.showPlaceholders))
const canShowPlaceholders = computed(
  () => showPlaceholders.value && props.position === 'statement'
)

const hasAssets = computed(
  () =>
    images.value.length > 0 ||
    tables.value.length > 0 ||
    formulas.value.length > 0 ||
    charts.value.length > 0
)

const hasContent = computed(() => hasAssets.value || canShowPlaceholders.value)

const missingImages = computed(
  () => canShowPlaceholders.value && !(props.assets?.images?.length ?? 0)
)
const missingTables = computed(
  () => canShowPlaceholders.value && !(props.assets?.tables?.length ?? 0)
)
const missingFormulas = computed(
  () => canShowPlaceholders.value && !(props.assets?.formulas?.length ?? 0)
)
const missingCharts = computed(
  () => canShowPlaceholders.value && !(props.assets?.charts?.length ?? 0)
)

const hasImageGroup = computed(() => images.value.length > 1)
</script>

<template>
  <div v-if="hasContent" class="enem-question-card__assets">
    <div
      v-if="hasImageGroup"
      class="enem-question-card__asset-group enem-question-card__asset-group--images"
    >
      <AssetImage
        v-for="image in images"
        :key="image.id"
        :asset="image"
        :year="year"
        :question-number="questionNumber"
      />
    </div>
    <AssetImage
      v-else-if="images.length === 1"
      :asset="images[0]"
      :year="year"
      :question-number="questionNumber"
    />
    <AssetTable v-for="table in tables" :key="table.id" :asset="table" />
    <AssetFormula
      v-for="formula in formulas"
      :key="formula.id"
      :asset="formula"
    />
    <AssetChart
      v-for="chart in charts"
      :key="chart.id"
      :asset="chart"
      :year="year"
      :question-number="questionNumber"
    />
    <div
      v-if="missingImages"
      class="enem-question-card__asset enem-question-card__asset--placeholder"
    >
      Placeholder: Imagem
    </div>
    <div
      v-if="missingTables"
      class="enem-question-card__asset enem-question-card__asset--placeholder"
    >
      Placeholder: Tabela
    </div>
    <div
      v-if="missingFormulas"
      class="enem-question-card__asset enem-question-card__asset--placeholder"
    >
      Placeholder: Formula
    </div>
    <div
      v-if="missingCharts"
      class="enem-question-card__asset enem-question-card__asset--placeholder"
    >
      Placeholder: Grafico
    </div>
  </div>
</template>
