<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import navData from '../data/reading-nav.json'
import SkLink from './SkLink.vue'

// Two placements: 'top' renders quiet bibliographic context only (book · author) — it
// is NOT navigation; 'bottom' renders the prev/next "continue reading" nav, the only
// chapter navigation. Renders only on book chapter leaves, by MANIFEST MEMBERSHIP (not
// chapter-id, which Lavelle FR leaves lack). Never parses canonical URLs or JSON-LD.
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

const isLeaf = computed(() => siblings.value !== null)
// Top: quiet context on any leaf that carries a book label (no nav, so no lopsided
// first/last state). Bottom: prev/next only when there is somewhere to go.
const showContext = computed(() => isLeaf.value && !!eyebrow.value)
const hasNav = computed(() => !!siblings.value && (!!siblings.value.prev || !!siblings.value.next))
</script>

<template>
  <p v-if="placement === 'top' && showContext" class="reading-context">{{ eyebrow }}</p>
  <nav
    v-if="placement === 'bottom' && hasNav"
    class="reading-nav reading-nav--bottom"
    aria-label="Navegação de capítulos"
  >
    <div class="reading-nav__row">
      <SkLink
        v-if="siblings && siblings.prev"
        class="reading-nav__link reading-nav__link--prev"
        :href="siblings.prev.href"
        rel="prev"
      >
        <span class="reading-nav__dir">‹ {{ labels.prev }}</span>
        <span class="reading-nav__title">{{ siblings.prev.title }}</span>
      </SkLink>
      <span v-else class="reading-nav__spacer" aria-hidden="true"></span>
      <SkLink
        v-if="siblings && siblings.next"
        class="reading-nav__link reading-nav__link--next"
        :href="siblings.next.href"
        rel="next"
      >
        <span class="reading-nav__dir">{{ labels.next }} ›</span>
        <span class="reading-nav__title">{{ siblings.next.title }}</span>
      </SkLink>
      <span v-else class="reading-nav__spacer" aria-hidden="true"></span>
    </div>
  </nav>
</template>

<style scoped>
/* Quiet bibliographic orientation above the chapter — not navigation, not a toolbar:
   small, muted, lower-case, aligned to the reading column. */
.reading-context {
  max-width: var(--sk-reading-measure, 35rem);
  margin: 0 auto var(--sk-space-4);
  font-size: 0.76rem;
  letter-spacing: 0.01em;
  color: var(--sk-reading-muted);
}

/* The only chapter navigation: a prev/next "continue reading" footer after the prose,
   aligned flush with the reading column. */
.reading-nav--bottom {
  max-width: var(--sk-reading-measure, 35rem);
  margin: 2.75rem auto 0;
  padding-top: 1.25rem;
  border-top: 1px solid var(--sk-reading-rule);
}

.reading-nav__row {
  display: flex;
  justify-content: space-between;
  gap: var(--sk-space-5);
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
  color: var(--sk-text-muted);
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

/* Four-state floor (navigation interaction-state standard): the visible hover lift
   applies only on real pointer devices, so an iOS tap never sticks the hover state (the
   tap-after-back class of bug). On touch no hover rule matches, so the title keeps its
   resting colour and :active adds nothing — the first tap navigates. Keyboard focus and
   the current-route state live in their own rules; the four never visually conflict. */
@media (hover: hover) and (pointer: fine) {
  .reading-nav__link:hover .reading-nav__title {
    color: var(--sk-reading-heading);
  }
}
/* Keyboard focus + neutral pressed/touch are owned by the SkLink primitive (see
   components/SkLink.vue), so no per-component :focus-visible rule lives here. */
</style>
