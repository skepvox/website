<script setup lang="ts">
// SSR-rendered episode catalog grid for the per-show podcast index pages.
// Fed by the generated src/podcast/<show>/episodes.json manifest (buffer/draft
// episodes are already excluded upstream). Presentation only — no data work.
interface Episode {
  number: number
  title: string
  href: string
  durationSeconds: number | null
  description: string
  artworkUrl: string
}

defineProps<{ episodes: Episode[] }>()

function episodeLabel(n: number): string {
  return String(n).padStart(3, '0')
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return ''
  return `${Math.round(seconds / 60)} min`
}
</script>

<template>
  <ul class="episode-grid">
    <li v-for="ep in episodes" :key="ep.number" class="episode-card">
      <a :href="ep.href" class="episode-card__link">
        <img
          class="episode-card__art"
          :src="ep.artworkUrl"
          alt=""
          width="72"
          height="72"
          loading="lazy"
          decoding="async"
        />
        <span class="episode-card__body">
          <span class="episode-card__heading">
            <span class="episode-card__number">{{ episodeLabel(ep.number) }}</span>
            <span class="episode-card__title">{{ ep.title }}</span>
          </span>
          <span v-if="ep.description" class="episode-card__desc">{{ ep.description }}</span>
          <span v-if="formatDuration(ep.durationSeconds)" class="episode-card__meta">{{
            formatDuration(ep.durationSeconds)
          }}</span>
        </span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.episode-grid {
  list-style: none;
  margin: 1.5rem 0 0;
  padding: 0;
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .episode-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.episode-card {
  margin: 0;
  padding: 0;
  list-style: none;
}

.episode-card::before {
  content: none !important;
  display: none !important;
}

.episode-card__link {
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

.episode-card__link:hover {
  border-color: var(--vt-c-brand, #3c8772);
  background: var(--vt-c-bg, #fff);
}

.episode-card__art {
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
}

.episode-card__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.episode-card__heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.episode-card__number {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--vt-c-brand, #3c8772);
}

.episode-card__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.episode-card__desc {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vt-c-text-2, #3c3c43);
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.episode-card__meta {
  font-size: 12px;
  color: var(--vt-c-text-3, #67676c);
  font-variant-numeric: tabular-nums;
}
</style>
