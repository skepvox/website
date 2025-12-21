<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  literatureAuthors,
  philosophyAuthors,
  type Author
} from './authors'

const props = defineProps<{
  kind: 'literature' | 'philosophy' | 'all'
}>()

// const items = computed<Author[]>(() =>
//   props.kind === 'literature' ? literatureAuthors : philosophyAuthors
// )

const items = computed<Author[]>(() => {
  if (props.kind === 'literature') return literatureAuthors
  if (props.kind === 'philosophy') return philosophyAuthors
  return [...literatureAuthors, ...philosophyAuthors]
})

const container = ref<HTMLElement | null>(null)
const visible = ref(false)

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!container.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        visible.value = true
        observer?.disconnect()
        observer = null
      }
    },
    { rootMargin: '0px 0px 300px 0px' }
  )

  observer.observe(container.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <div ref="container" class="author-container landing">
    <template v-if="visible">
      <a
        v-for="{ url, img, name } in items"
        :key="url"
        class="author-item"
        :href="url"
        :title="name"
      >
        <img :src="img" :alt="name" loading="lazy" />
      </a>
    </template>
  </div>
</template>

<style scoped>
.author-container {
  --max-width: 180px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--max-width), 1fr));
  column-gap: 4px;
  row-gap: 4px;
}

.author-item {
  margin: 2px 0;
  background-color: var(--vt-c-white-soft);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  height: var(--max-width);
  overflow: hidden;
  padding: 12px;          /* inner margin */
  box-sizing: border-box;
}

.author-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;    /* optional: soften image corners */
}

/* dark mode */
.dark .landing .author-item {
  background-color: var(--vt-c-bg-soft);
  transition: background-color 0.2s ease;
}
.dark .landing .author-item img {
  filter: grayscale(1);
  transition: filter 0.2s ease;
}
.dark .landing .author-item:hover {
  background-color: var(--vt-c-bg-mute);
}
.dark .landing .author-item:hover img {
  filter: grayscale(0.7);
}

/* tweak size on narrow screens */
@media (max-width: 720px) {
  .author-container {
    --max-width: 150px;
  }
}
@media (max-width: 480px) {
  .author-container {
    --max-width: 130px;
  }
}
</style>

