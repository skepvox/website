<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_MARK_PATHS, FILLED_BRAND_MARKS, type BrandMarkName } from './brand-marks'

const props = defineProps<{ name: BrandMarkName; label?: string }>()
const decorative = computed(() => !props.label)
const filled = computed(() => FILLED_BRAND_MARKS.has(props.name))
</script>

<template>
  <svg
    class="brand-mark"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke="filled ? 'none' : 'currentColor'"
    stroke-linecap="round"
    stroke-linejoin="round"
    focusable="false"
    :aria-hidden="decorative ? 'true' : undefined"
    :role="decorative ? undefined : 'img'"
  >
    <title v-if="!decorative">{{ label }}</title>
    <path :d="BRAND_MARK_PATHS[name]" :vector-effect="filled ? undefined : 'non-scaling-stroke'" />
  </svg>
</template>

<style scoped>
.brand-mark {
  display: inline-block;
  flex: 0 0 auto;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  stroke-width: 1.5;
  shape-rendering: geometricPrecision;
}
</style>
