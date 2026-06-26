<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import PipelineWorkContents from './PipelineWorkContents.vue'

// Mounts the owned pipeline work-hub contents map, gated on the generated work-hub marker so it renders
// only on a pipeline work hub (e.g. /pt/filosofia/louis-lavelle/introducao-a-ontologia/ or
// /pt/literatura/machado-de-assis/bras-cubas/). Mirrors how PipelineSegmentNav self-gates on the leaf
// marker. The hub frontmatter declares WHICH work (pipelineWorkId/pipelineLanguage); the contents
// component looks up that work's title/author + segments from the same pipeline-export metadata, so this
// mount stays work-agnostic (multi-work, B2).
const { frontmatter } = useData()
const isWorkHub = computed(() => frontmatter.value.generated === 'pipeline-work-hub')
const workId = computed(() => frontmatter.value.pipelineWorkId as string | undefined)
const language = computed(() => frontmatter.value.pipelineLanguage as string | undefined)
</script>

<template>
  <PipelineWorkContents
    v-if="isWorkHub && workId && language"
    :work-id="workId"
    :language="language"
  />
</template>
