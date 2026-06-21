<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import navData from '../data/reading-nav.json'

// One component, two placements: 'top' renders a quiet context eyebrow plus
// prev/next; 'bottom' renders prev/next only ("continue reading"). It renders only
// on book chapter leaves, detected by MANIFEST MEMBERSHIP — not by chapter-id, which
// Lavelle FR leaves lack. It never parses canonical URLs or JSON-LD: the key is the
// source relativePath and the labels come from frontmatter scalars + the manifest.
const props = defineProps<{ placement: 'top' | 'bottom' }>()

const nav = navData as Record<string, [string, string][]>
const { frontmatter, page } = useData()

const LABELS: Record<string, { prev: string; next: string }> = {
  'pt-BR': { prev: 'Anterior', next: 'Próximo' },
  fr: { prev: 'Précédent', next: 'Suivant' }
}

interface Sibling {
  href: string
  title: string
}

// Derive work route + current slug from the source path (immune to .html / clean URL
// / trailing slash); the manifest row order is the canonical chapter sequence.
const siblings = computed<{ prev: Sibling | null; next: Sibling | null } | null>(() => {
  const rel = page.value.relativePath || ''
  const cut = rel.lastIndexOf('/')
  if (cut < 0) return null
  const workRoute = '/' + rel.slice(0, cut)
  const slug = rel.slice(cut + 1).replace(/\.md$/, '')
  const rows = nav[workRoute]
  if (!rows) return null
  const idx = rows.findIndex((row) => row[0] === slug)
  if (idx < 0) return null
  const at = (i: number): Sibling | null =>
    i >= 0 && i < rows.length ? { href: `${workRoute}/${rows[i][0]}`, title: rows[i][1] } : null
  return { prev: at(idx - 1), next: at(idx + 1) }
})

const labels = computed(() => LABELS[String(frontmatter.value.language)] ?? LABELS['pt-BR'])

const eyebrow = computed(() => {
  const { book, author } = frontmatter.value as { book?: string; author?: string }
  if (book && author) return `${book} · ${author}`
  return book ?? ''
})

const hasNav = computed(() => !!siblings.value && (!!siblings.value.prev || !!siblings.value.next))
// top: render on any leaf (the eyebrow is useful even when prev/next are absent);
// bottom: only when there is somewhere to go.
const show = computed(() => (props.placement === 'top' ? siblings.value !== null : hasNav.value))
</script>

<template>
  <nav
    v-if="show"
    class="reading-nav"
    :class="`reading-nav--${placement}`"
    aria-label="Navegação de capítulos"
  >
    <p v-if="placement === 'top' && eyebrow" class="reading-nav__eyebrow">{{ eyebrow }}</p>
    <div v-if="siblings && (siblings.prev || siblings.next)" class="reading-nav__row">
      <a
        v-if="siblings.prev"
        class="reading-nav__link reading-nav__link--prev"
        :href="siblings.prev.href"
        rel="prev"
      >
        <span class="reading-nav__dir">‹ {{ labels.prev }}</span>
        <span class="reading-nav__title">{{ siblings.prev.title }}</span>
      </a>
      <span v-else class="reading-nav__spacer" aria-hidden="true"></span>
      <a
        v-if="siblings.next"
        class="reading-nav__link reading-nav__link--next"
        :href="siblings.next.href"
        rel="next"
      >
        <span class="reading-nav__dir">{{ labels.next }} ›</span>
        <span class="reading-nav__title">{{ siblings.next.title }}</span>
      </a>
      <span v-else class="reading-nav__spacer" aria-hidden="true"></span>
    </div>
  </nav>
</template>

<style scoped>
/* Self-constrain to the Slice A reading measure: content-top/bottom slots sit in the
   688px .content column, outside the 35rem .vt-doc cap, so align flush with prose. */
.reading-nav {
  max-width: var(--sk-reading-measure, 35rem);
  margin-inline: auto;
}

.reading-nav--top {
  margin-bottom: 1.5rem;
}

.reading-nav--bottom {
  margin-top: 2.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--sk-reading-rule);
}

.reading-nav__eyebrow {
  margin: 0 0 0.9rem;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--sk-reading-muted);
}

.reading-nav__row {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
}

.reading-nav__link {
  display: flex;
  min-width: 0;
  max-width: 48%;
  flex-direction: column;
  gap: 0.15rem;
  text-decoration: none;
}

.reading-nav__link--next {
  margin-left: auto;
  text-align: right;
}

.reading-nav__spacer {
  flex: 0 1 48%;
}

.reading-nav__dir {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vt-c-brand, #42b883);
}

.reading-nav__title {
  overflow: hidden;
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--sk-reading-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.18s ease;
}

.reading-nav__link:hover .reading-nav__title {
  color: var(--sk-reading-heading);
}
</style>
