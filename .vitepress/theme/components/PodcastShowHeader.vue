<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

// "Series index" masthead for a podcast show page: a quiet eyebrow framing the show
// as a series with a real lesson count, the show title (from frontmatter), one
// editorial standfirst, and a restrained text "listen" line — Apple Podcasts /
// Spotify / RSS, rendered only when a URL is provided (no badge artwork, so the
// platforms harmonise; no Amazon). The lesson cards below stay the page's hero.
const props = defineProps<{
  lang: string
  eyebrow: string
  standfirst: string
  count: number
  apple?: string
  spotify?: string
  rss?: string
}>()

const { frontmatter } = useData()

const STRINGS: Record<string, { lesson: string; lessons: string; listen: string }> = {
  fr: { lesson: 'leçon', lessons: 'leçons', listen: 'Écouter' },
  es: { lesson: 'lección', lessons: 'lecciones', listen: 'Escuchar' },
  en: { lesson: 'lesson', lessons: 'lessons', listen: 'Listen' }
}

const t = computed(() => STRINGS[props.lang] ?? STRINGS.en)
const lessonNoun = computed(() => (props.count === 1 ? t.value.lesson : t.value.lessons))

interface ListenLink {
  label: string
  href: string
  secondary?: boolean
}

// Only the platforms that actually have a source URL; RSS is the secondary one.
const links = computed<ListenLink[]>(() => {
  const out: ListenLink[] = []
  if (props.apple) out.push({ label: 'Apple Podcasts', href: props.apple })
  if (props.spotify) out.push({ label: 'Spotify', href: props.spotify })
  if (props.rss) out.push({ label: 'RSS', href: props.rss, secondary: true })
  return out
})
</script>

<template>
  <header class="show-head">
    <p class="show-head__eyebrow">
      {{ eyebrow }} <span class="show-head__sep" aria-hidden="true">·</span> {{ count }}
      {{ lessonNoun }}
    </p>
    <h1 class="show-head__title">{{ frontmatter.title }}</h1>
    <p class="show-head__standfirst">{{ standfirst }}</p>
    <p v-if="links.length" class="show-head__listen">
      <span class="show-head__listen-label">{{ t.listen }}</span>
      <template v-for="(link, i) in links" :key="link.href">
        <span v-if="i > 0" class="show-head__listen-sep" aria-hidden="true">·</span>
        <a
          class="show-head__listen-link"
          :class="{ 'is-secondary': link.secondary }"
          :href="link.href"
          target="_blank"
          rel="noopener"
          >{{ link.label }}</a
        >
      </template>
    </p>
  </header>
</template>

<style scoped>
.show-head {
  margin: 0 0 var(--sk-space-6);
}

.show-head__eyebrow {
  margin: 0 0 0.55rem;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--sk-reading-muted);
}

.show-head__sep {
  color: var(--vt-c-brand, #3c8772);
}

/* Beats the theme's `.vt-doc h1`: restrained masthead title, not a marketing hero. */
.show-head__title {
  margin: 0 0 0.65rem;
  padding: 0;
  border: 0;
  font-size: var(--sk-masthead);
  line-height: 1.12;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--sk-reading-heading);
}

.show-head__standfirst {
  max-width: var(--sk-measure-lede);
  margin: 0 0 1.1rem;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--sk-reading-body);
}

.show-head__listen {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.55rem;
  margin: 0;
  font-size: 0.95rem;
}

.show-head__listen-label {
  margin-right: 0.15rem;
  font-size: 0.74rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--sk-reading-muted);
}

.show-head__listen-sep {
  color: var(--sk-reading-rule);
}

.show-head__listen-link {
  border-bottom: 1px solid transparent;
  color: var(--sk-reading-body);
  text-decoration: none;
  transition:
    color 0.18s ease,
    border-color 0.18s ease;
}

.show-head__listen-link:hover {
  color: var(--vt-c-brand, #3c8772);
  border-bottom-color: var(--vt-c-brand, #3c8772);
}

.show-head__listen-link.is-secondary {
  font-size: 0.85rem;
  color: var(--sk-reading-muted);
}

.show-head__listen-link:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
  border-radius: var(--sk-radius-sm);
}
</style>
