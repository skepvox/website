<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import manifest from '../data/segment-manifest.json'
import WorkContents from './WorkContents.vue'

// Hub adapter for the book map. Slice b v1 mounts WorkContents on ONE work hub only (de-l-acte);
// the allowlist is the only thing that changes as more work hubs adopt it. The map itself
// (WorkContents) stays context-free so a future reading-leaf overlay can reuse it directly.
const ALLOWED = new Set(['louis-lavelle/de-l-acte.md'])

const { page } = useData()
const work = computed(() => {
  const rel = page.value.relativePath || ''
  if (!ALLOWED.has(rel)) return null
  return (manifest.works as any[]).find((w) => w.relativePath === rel) ?? null
})
</script>

<template>
  <WorkContents v-if="work" :work-id="work.workId" variant="hub" />
</template>
