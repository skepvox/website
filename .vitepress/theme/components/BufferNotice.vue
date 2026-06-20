<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

// Rendered into the theme's content-top slot on every page, but only shows on
// pre-publication buffer pages (frontmatter buffer: true, e.g. francais-003).
// Keeps QC/direct-link pages honestly labelled without touching the generator.
const { frontmatter, page } = useData()

const isBuffer = computed(() => frontmatter.value.buffer === true)

const lang = computed(() => {
  const path = page.value.relativePath || ''
  if (path.includes('podcast/espanol')) return 'es'
  if (path.includes('podcast/english')) return 'en'
  return 'fr'
})

const COPY = {
  fr: {
    label: 'Pré-publication · page non listée',
    body: 'Cette page est disponible par lien direct pour révision. L’épisode n’est pas encore publié dans les flux podcast.'
  },
  es: {
    label: 'Prepublicación · página no listada',
    body: 'Esta página está disponible por enlace directo para revisión. El episodio aún no está publicado en los feeds de podcast.'
  },
  en: {
    label: 'Pre-publication · unlisted page',
    body: 'This page is available by direct link for review. The episode is not yet published to the podcast feeds.'
  }
} as const

const copy = computed(() => COPY[lang.value])
</script>

<template>
  <aside v-if="isBuffer" class="buffer-notice" role="note">
    <span class="buffer-notice__label">{{ copy.label }}</span>
    <span class="buffer-notice__body">{{ copy.body }}</span>
  </aside>
</template>

<style scoped>
.buffer-notice {
  margin: 0 0 1.5rem;
  padding: 12px 14px;
  border: 1px solid var(--vt-c-divider, #e2e2e3);
  border-left: 3px solid var(--vt-c-yellow-1, #e0a82e);
  border-radius: 8px;
  background: var(--vt-c-bg-soft, #f6f6f7);
  font-size: 13px;
  line-height: 1.5;
}

.buffer-notice__label {
  display: block;
  font-weight: 600;
  color: var(--vt-c-text-1, #213547);
}

.buffer-notice__body {
  display: block;
  margin-top: 2px;
  color: var(--vt-c-text-2, #67676c);
}
</style>
