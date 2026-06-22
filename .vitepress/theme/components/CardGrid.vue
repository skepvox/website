<script setup lang="ts">
// Generic SSR card grid: a responsive list of linked cards, each with an optional
// square image, an optional brand-colored eyebrow before the title, a clamped
// description and an optional meta line. Presentation only — no data work and no
// browser APIs, so it renders fully server-side. Shared across every hub (podcast
// shows/episodes, literature authors/works, Lavelle works); callers adapt their
// own data into CardGridItem (e.g. episodesToCards) rather than CardGrid knowing
// about any one section.
import type { CardGridItem } from './cards'

defineProps<{ items: CardGridItem[] }>()
</script>

<template>
  <ul class="card-grid">
    <li v-for="item in items" :key="item.href" class="card-grid__item">
      <a :href="item.href" class="card-grid__link">
        <img
          v-if="item.imageUrl"
          class="card-grid__art"
          :src="item.imageUrl"
          :alt="item.imageAlt || ''"
          :data-image-variant="item.imageVariant"
          width="72"
          height="72"
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
      </a>
    </li>
  </ul>
</template>

<style scoped>
.card-grid {
  list-style: none;
  margin: var(--sk-space-5) 0 0;
  padding: 0;
  display: grid;
  gap: var(--sk-space-4);
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .card-grid {
    grid-template-columns: 1fr 1fr;
  }
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
  gap: 14px;
  height: 100%;
  padding: 14px;
  border: 1px solid var(--vt-c-divider, #e2e2e3);
  border-radius: var(--sk-card-radius);
  background: var(--sk-surface-raised);
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--sk-motion-base),
    background-color var(--sk-motion-base);
}

.card-grid__link:hover,
.card-grid__link:active {
  /* Override @vue/theme's prose-link hover color inside .vt-doc. On touch
     browsers that inherited hover state can consume the first tap before
     navigation, so cards must stay visually stable unless a real pointer hover
     exists. */
  color: inherit;
}

/* Keep hover styling off touch-only browsers. iOS Safari can otherwise consume
   the first card tap to apply :hover, requiring a second tap to navigate. */
@media (hover: hover) and (pointer: fine) {
  .card-grid__link:hover {
    border-color: var(--sk-accent);
    background: var(--sk-surface);
  }
}

.card-grid__link:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
}

.card-grid__art {
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
}

.card-grid__art[data-image-variant='portrait'] {
  filter: none;
}

.dark .card-grid__art[data-image-variant='portrait'] {
  filter: grayscale(1);
}

.card-grid__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
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
  font-size: var(--sk-text-base);
  font-weight: 600;
  line-height: 1.3;
}

.card-grid__desc {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vt-c-text-2, #3c3c43);
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.card-grid__meta {
  font-size: var(--sk-text-2xs);
  color: var(--vt-c-text-3, #67676c);
  font-variant-numeric: tabular-nums;
}
</style>
