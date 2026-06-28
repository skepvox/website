<script setup lang="ts">
import type { CardGridItem } from './cards'
import SkLink from './SkLink.vue'

defineProps<{ items: CardGridItem[] }>()
</script>

<template>
  <ul class="card-grid">
    <li v-for="item in items" :key="item.href" class="card-grid__item">
      <SkLink :href="item.href" class="card-grid__link">
        <img
          v-if="item.imageUrl"
          class="card-grid__art"
          :src="item.imageUrl"
          :alt="item.imageAlt || ''"
          :data-image-variant="item.imageVariant"
          width="88"
          height="88"
          loading="lazy"
          decoding="async"
        />
        <span class="card-grid__body">
          <span v-if="item.eyebrow" class="card-grid__heading">
            <span class="card-grid__eyebrow">{{ item.eyebrow }}</span>
            <span class="card-grid__title">{{ item.title }}</span>
          </span>
          <span v-else class="card-grid__title">{{ item.title }}</span>
          <span v-if="item.description" class="card-grid__desc">{{ item.description }}</span>
          <span v-if="item.meta" class="card-grid__meta">{{ item.meta }}</span>
        </span>
      </SkLink>
    </li>
  </ul>
</template>

<style scoped>
.card-grid {
  list-style: none;
  margin: var(--sk-space-6) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sk-space-6);
}

.card-grid__item {
  margin: 0;
  padding: 0;
  list-style: none;
}

.card-grid__item::before {
  content: none !important;
  display: none !important;
}

.card-grid__link {
  display: flex;
  gap: var(--sk-space-4);
  align-items: center;
  text-decoration: none;
  color: inherit;
  --sk-link-focus-radius: var(--sk-radius-sm);
}

.card-grid__link:hover,
.card-grid__link:active {
  color: inherit;
}

.card-grid__art {
  flex: 0 0 auto;
  width: 88px;
  height: 88px;
  border-radius: var(--sk-radius-sm);
  object-fit: cover;
  border: 1px solid var(--sk-border);
}

.dark .card-grid__art[data-image-variant='portrait'] {
  filter: grayscale(1);
}

.card-grid__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.card-grid__heading {
  display: flex;
  align-items: baseline;
  gap: var(--sk-space-2);
}

.card-grid__eyebrow {
  flex: 0 0 auto;
  font-size: var(--sk-text-xs);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  color: var(--sk-text-muted);
}

.card-grid__title {
  font-family: var(--sk-reading-title-font);
  font-size: var(--sk-text-lg);
  font-weight: 600;
  line-height: 1.3;
  color: var(--vt-c-text-1);
  transition: color var(--sk-motion-base) var(--sk-ease);
}

.card-grid__desc {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--sk-text-sm);
  line-height: 1.5;
  color: var(--sk-text-muted);
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.card-grid__meta {
  font-size: var(--sk-text-xs);
  color: var(--sk-text-muted);
  font-variant-numeric: tabular-nums;
}

@media (hover: hover) and (pointer: fine) {
  .card-grid__link:hover .card-grid__title {
    color: var(--sk-accent);
  }
}
</style>
