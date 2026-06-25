<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import PipelineWorkContents from './PipelineWorkContents.vue'

// Mounts the owned pipeline work-hub contents map, gated on the generated work-hub marker so it
// renders only on /louis-lavelle/introducao-a-ontologia/ (and any future pipeline work hub). Mirrors
// how PipelineSegmentNav self-gates on the leaf marker ('pipeline-segment-routes').
const { frontmatter } = useData()
const isWorkHub = computed(() => frontmatter.value.generated === 'pipeline-work-hub')
</script>

<template>
  <PipelineWorkContents v-if="isWorkHub" />
</template>
