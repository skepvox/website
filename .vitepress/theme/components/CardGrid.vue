<script setup lang="ts">
// Generic SSR card grid: a responsive list of linked cards with an optional
// square image, title, description and meta line. Presentation only, no data
// work and no browser APIs, so it renders fully server-side. Shared across hubs
// (e.g. the /podcast/ show grid); mirrors EpisodeGrid's card anatomy for visual
// harmony.
interface CardItem {
  title: string
  href: string
  description?: string
  imageUrl?: string
  imageAlt?: string
  meta?: string
}

defineProps<{ items: CardItem[] }>()
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
          width="72"
          height="72"
          loading="lazy"
          decoding="async"
        />
        <span class="card-grid__body">
          <span class="card-grid__title">{{ item.title }}</span>
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
  margin: 1.5rem 0 0;
  padding: 0;
  display: grid;
  gap: 16px;
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
  border-radius: 12px;
  background: var(--vt-c-bg-soft, #f6f6f7);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.card-grid__link:hover {
  border-color: var(--vt-c-brand, #3c8772);
  background: var(--vt-c-bg, #fff);
}

.card-grid__art {
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
}

.card-grid__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.card-grid__title {
  font-size: 16px;
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
  font-size: 12px;
  color: var(--vt-c-text-3, #67676c);
  font-variant-numeric: tabular-nums;
}
</style>
