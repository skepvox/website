<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import manifest from '../data/segment-manifest.json'
import WorkContents from './WorkContents.vue'

// Hub adapter for the book map. WorkContents adopts work hubs one at a time via this allowlist;
// the map itself stays context-free so a future reading-leaf overlay can reuse it directly.
//   - machado-de-assis/bras-cubas — flat mode (163 leaves, empty groupPath) visual stress target
// (The grouped-mode subject was louis-lavelle/de-l-acte, removed with the legacy corpus in slice A5;
// no current literatura work is authored-grouped, so the grouped path awaits a future grouped book.)
const ALLOWED = new Set(['literatura/machado-de-assis/bras-cubas.md'])

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
