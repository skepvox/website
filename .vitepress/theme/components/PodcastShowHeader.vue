<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import SkLink from './SkLink.vue'

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
        <SkLink
          class="show-head__listen-link"
          :class="{ 'is-secondary': link.secondary }"
          :href="link.href"
          target="_blank"
          rel="noopener"
          >{{ link.label }}</SkLink
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
  color: var(--sk-text-faint);
}

.show-head__title {
  margin: 0 0 0.65rem;
  padding: 0;
  border: 0;
  font-family: var(--sk-reading-title-font);
  font-size: var(--sk-masthead);
  line-height: 1.12;
  font-weight: 600;
  letter-spacing: -0.015em;
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

@media (hover: hover) and (pointer: fine) {
  .show-head__listen-link:hover {
    color: var(--sk-accent);
    border-bottom-color: var(--sk-accent);
  }
}

.show-head__listen-link.is-secondary {
  font-size: 0.85rem;
  color: var(--sk-reading-muted);
}
</style>
