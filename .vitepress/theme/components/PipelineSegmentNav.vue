<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import meta from '../data/pipeline-export-segments.json'
import SkLink from './SkLink.vue'
import ReaderIcon from './ReaderIcon.vue'

// Owned prev/next/up navigation for the LIVE public pipeline pt segment leaves
// (src/louis-lavelle/introducao-a-ontologia/<leaf>.md). Injected via the theme content slots, so the
// page bodies are untouched. It renders ONLY on pages carrying the generated marker
// `pipeline-segment-routes` (not by route parsing) and joins pipeline-export-segments.json by
// (canonicalId, language) — never by routePath (routePath is presentation, used only as the href).
// It never crosses edition/language: prev/next are the order-adjacent records of the SAME language.
const props = defineProps<{ placement: 'top' | 'bottom' }>()

const HUB = '/louis-lavelle/introducao-a-ontologia/'

interface Level {
  kind: string
  label: string
  title: string | null
}
interface Seg {
  canonicalId: string
  language: string
  order: number
  displayTitle: string
  routePath: string
  segmentPrefix: string
  groupPath: Level[]
}

const { frontmatter } = useData()
const isPipelineLeaf = computed(() => frontmatter.value.generated === 'pipeline-segment-routes')
const canonicalId = computed(() => frontmatter.value.pipelineCanonicalId as string)
const lang = computed(() => frontmatter.value.pipelineLanguage as string)

// Same-language edition, ordered by `order` — the canonical reading sequence. Filtering by language
// guarantees prev/next never cross editions (no fr routes, no old chapter routes).
const edition = computed<Seg[]>(() =>
  isPipelineLeaf.value
    ? (meta.segments as Seg[])
        .filter((s) => s.language === lang.value)
        .sort((a, b) => a.order - b.order)
    : []
)
const index = computed(() =>
  edition.value.findIndex((s) => s.canonicalId === canonicalId.value && s.language === lang.value)
)
const current = computed<Seg | null>(() => (index.value >= 0 ? edition.value[index.value] : null))
const prev = computed<Seg | null>(() => (index.value > 0 ? edition.value[index.value - 1] : null))
const next = computed<Seg | null>(() =>
  index.value >= 0 && index.value < edition.value.length - 1 ? edition.value[index.value + 1] : null
)

const href = (s: Seg) => `/${s.routePath}` // routePath = presentation (the public URL), not identity
// The "up" link carries the current trecho so the hub can open + highlight that chapter on return
// (#trecho-<segmentPrefix>). URL-only, no stored reading progress.
const upHref = computed(() =>
  current.value ? `${HUB}#trecho-${current.value.segmentPrefix}` : HUB
)
</script>

<template>
  <nav
    v-if="placement === 'bottom' && current"
    class="pseg-nav"
    data-testid="pseg-nav"
    data-pipeline-nav="pt"
    aria-label="Navegação de trechos"
  >
    <div class="pseg-nav__row">
      <SkLink
        v-if="prev"
        class="pseg-nav__link pseg-nav__link--prev"
        :href="href(prev)"
        rel="prev"
        data-testid="pseg-prev"
      >
        <span class="pseg-nav__dir"><ReaderIcon name="chevron-left" />Trecho anterior</span>
        <span class="pseg-nav__title">{{ prev.displayTitle }}</span>
      </SkLink>
      <span v-else class="pseg-nav__spacer" aria-hidden="true"></span>

      <SkLink
        v-if="next"
        class="pseg-nav__link pseg-nav__link--next"
        :href="href(next)"
        rel="next"
        data-testid="pseg-next"
      >
        <span class="pseg-nav__dir">Próximo trecho<ReaderIcon name="chevron-right" /></span>
        <span class="pseg-nav__title">{{ next.displayTitle }}</span>
      </SkLink>
      <span v-else class="pseg-nav__spacer" aria-hidden="true"></span>
    </div>

    <p class="pseg-nav__up">
      <SkLink class="pseg-nav__up-link" :href="upHref" data-testid="pseg-up">
        <ReaderIcon name="chevron-up" />Sumário
      </SkLink>
    </p>
  </nav>
</template>

<style scoped>
/* prev/next "continuar a leitura" footer + an up link to the work index, aligned to the column. */
.pseg-nav {
  max-width: var(--sk-reading-measure, 35rem);
  margin: 2.75rem auto 0;
  padding-top: 1.25rem;
  border-top: 1px solid var(--sk-reading-rule);
}
.pseg-nav__row {
  display: flex;
  justify-content: space-between;
  gap: var(--sk-space-5);
}
.pseg-nav__link {
  display: flex;
  min-width: 0;
  max-width: 48%;
  flex-direction: column;
  gap: 0.15rem;
  text-decoration: none;
}
.pseg-nav__link--next {
  margin-left: auto;
  text-align: right;
}
.pseg-nav__spacer {
  flex: 0 1 48%;
}
/* The direction label + its owned chevron, aligned as one quiet row. The chevron rides ~1 step
   above the tiny dir label so it reads as a clear directional mark; the gap/alignment live on this
   wrapper (never on the icon). The icon inherits the dir's muted ink via currentColor. */
.pseg-nav__dir {
  display: flex;
  align-items: center;
  gap: 0.3em;
  --sk-icon-size: 0.95rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
}
.pseg-nav__link--next .pseg-nav__dir {
  justify-content: flex-end;
}
.pseg-nav__title {
  overflow: hidden;
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--sk-reading-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.18s ease;
}
.pseg-nav__up {
  margin: 1.1rem 0 0;
  font-size: 0.78rem;
}
.pseg-nav__up-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  --sk-icon-size: 0.95rem;
  color: var(--sk-text-muted);
  text-decoration: none;
  transition: color 0.18s ease;
}

/* Four-state floor: the visible hover lift applies only on real pointer devices, so an iOS tap never
   sticks the hover state. Keyboard focus + neutral pressed/touch are owned by SkLink. */
@media (hover: hover) and (pointer: fine) {
  .pseg-nav__link:hover .pseg-nav__title,
  .pseg-nav__up-link:hover {
    color: var(--sk-reading-heading);
  }
}
</style>
