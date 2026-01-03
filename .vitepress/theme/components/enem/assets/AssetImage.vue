<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import type { EnemQuestionImageAsset } from '../../../enem/types'

const props = defineProps<{
  asset: EnemQuestionImageAsset
  year: number
  questionNumber: number
}>()

const imageUrl = computed(() => {
  const file = props.asset.file
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
})

const imageAlt = computed(() => {
  if (props.asset.alt && props.asset.alt.trim()) {
    return props.asset.alt.trim()
  }
  return `Imagem da quest\u00e3o ${props.questionNumber}`
})

const caption = computed(() => {
  if (Object.prototype.hasOwnProperty.call(props.asset, 'caption')) {
    return (props.asset.caption || '').trim()
  }
  if (props.asset.alt && props.asset.alt.trim()) {
    return props.asset.alt.trim()
  }
  return ''
})
</script>

<template>
  <figure class="enem-question-card__asset enem-question-card__asset--image">
    <img
      class="enem-question-card__asset-media"
      :src="imageUrl"
      :alt="imageAlt"
      loading="lazy"
    />
    <figcaption v-if="caption" class="enem-question-card__asset-caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>
