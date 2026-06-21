<script setup lang="ts">
import { computed } from 'vue'

// Compact "lesson thesis" episode header: a quiet eyebrow, the episode title as
// the only H1, and the learning point promoted to the lede (passed as slot text,
// so it never needs attribute escaping). No cover art (v1), no transport — the
// native player and click-to-cue transcript follow below.
interface HeaderEpisode {
  id: string
  title: string
  showTitle: string
  lang: string
  durationSeconds: number
}

const props = defineProps<{
  episode: HeaderEpisode
}>()

// Localized "episode" noun for the eyebrow; English is the fallback.
const EPISODE_LABEL: Record<string, string> = {
  fr: 'Épisode',
  es: 'Episodio',
  en: 'Episode'
}

const episodeLabel = computed(() => EPISODE_LABEL[props.episode.lang] ?? 'Episode')

// Catalogue number from the episode id, e.g. "francais-003" -> "003".
const episodeNumber = computed(() => (props.episode.id.split('-').pop() ?? '').padStart(3, '0'))

// Whole-minute runtime as a quiet orientation tag, e.g. "22 min".
const durationLabel = computed(() => {
  const seconds = props.episode.durationSeconds
  if (!seconds || seconds <= 0) return ''
  return `${Math.round(seconds / 60)} min`
})
</script>

<template>
  <header class="vox-ep">
    <p class="vox-ep__eyebrow">
      <span>{{ episode.showTitle }}</span>
      <span class="vox-ep__sep" aria-hidden="true">·</span>
      <span>{{ episodeLabel }}&nbsp;{{ episodeNumber }}</span>
      <template v-if="durationLabel">
        <span class="vox-ep__sep" aria-hidden="true">·</span>
        <span>{{ durationLabel }}</span>
      </template>
    </p>
    <h1 class="vox-ep__title">{{ episode.title }}</h1>
    <div class="vox-ep__rule" aria-hidden="true"></div>
    <div class="vox-ep__lede"><slot /></div>
  </header>
</template>

<style scoped>
.vox-ep {
  margin: 0 0 1.25rem;
}

.vox-ep__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--sk-space-2);
  margin: 0 0 0.45rem;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--sk-reading-muted, var(--vt-c-text-2));
}

.vox-ep__sep {
  color: var(--sk-text-faint);
}

/* Class + scoped attribute beats the theme's `.vp-doc h1`, so the episode title
   reads as a restrained masthead rather than a giant document heading. */
.vox-ep__title {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: clamp(1.55rem, 6vw, 2rem);
  line-height: 1.16;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--sk-reading-heading, var(--vt-c-text-1));
}

.vox-ep__rule {
  width: 2.25rem;
  height: 2px;
  margin: 0.7rem 0 0.6rem;
  background: var(--sk-accent);
  border-radius: 2px;
}

.vox-ep__lede {
  max-width: 44rem;
  font-size: 1.02rem;
  line-height: 1.6;
  color: var(--sk-reading-body, var(--vt-c-text-1));
}

/* If the slot text is processed as a Markdown paragraph, drop its stray margin. */
.vox-ep__lede :slotted(p) {
  margin: 0;
}

@media (min-width: 768px) {
  .vox-ep {
    margin-bottom: var(--sk-space-5);
  }

  .vox-ep__title {
    font-size: clamp(1.9rem, 3vw, 2.3rem);
  }
}
</style>
