<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()
const demos = computed(() => (page.value.frontmatter?.demos ?? {}) as any)
const entityId = computed(() => demos.value?.id ?? null)
const subgraphUrl = computed(() =>
  entityId.value ? `/demos-data/subgraphs/${entityId.value}.json` : null
)
</script>

<template>
  <DemosMapa
    v-if="subgraphUrl"
    :subgraph-url="subgraphUrl"
    :focus-entity-id="entityId"
  />
</template>
