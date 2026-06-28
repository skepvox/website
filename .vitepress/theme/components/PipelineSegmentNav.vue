<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import meta from '../data/pipeline-export-segments.json'
import SkLink from './SkLink.vue'
import ReaderIcon from './ReaderIcon.vue'
import {
  navLabel as navLabelFor,
  segNavLabel as segNavLabelFor,
  prevLabel as prevLabelFor,
  nextLabel as nextLabelFor,
  segmentHref,
  trechoHref
} from './reader-shell'

const props = defineProps<{ placement: 'top' | 'bottom' }>()

interface Level {
  kind: string
  label: string
  title: string | null
}
interface Seg {
  canonicalId: string
  workId: string
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
const workId = computed(() => canonicalId.value?.split('/').slice(0, -1).join('/'))

const navAriaLabel = computed(() => segNavLabelFor(lang.value))
const prevText = computed(() => prevLabelFor(lang.value))
const nextText = computed(() => nextLabelFor(lang.value))
const upText = computed(() => navLabelFor(lang.value))

const edition = computed<Seg[]>(() =>
  isPipelineLeaf.value
    ? (meta.segments as Seg[])
        .filter((s) => s.workId === workId.value && s.language === lang.value)
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

const href = (s: Seg) => segmentHref(s.routePath)
const upHref = computed(() =>
  current.value ? trechoHref(current.value.routePath, current.value.segmentPrefix) : '/'
)
</script>

<template>
  <nav
    v-if="placement === 'bottom' && current"
    class="pseg-nav"
    data-testid="pseg-nav"
    :data-pipeline-nav="lang"
    :aria-label="navAriaLabel"
  >
    <div class="pseg-nav__row">
      <SkLink
        v-if="prev"
        class="pseg-nav__link pseg-nav__link--prev"
        :href="href(prev)"
        rel="prev"
        data-testid="pseg-prev"
      >
        <span class="pseg-nav__dir"><ReaderIcon name="chevron-left" />{{ prevText }}</span>
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
        <span class="pseg-nav__dir">{{ nextText }}<ReaderIcon name="chevron-right" /></span>
        <span class="pseg-nav__title">{{ next.displayTitle }}</span>
      </SkLink>
      <span v-else class="pseg-nav__spacer" aria-hidden="true"></span>
    </div>

    <p class="pseg-nav__up">
      <SkLink class="pseg-nav__up-link" :href="upHref" data-testid="pseg-up">
        <ReaderIcon name="chevron-up" />{{ upText }}
      </SkLink>
    </p>
  </nav>
</template>

<style scoped>
.pseg-nav {
  max-width: var(--sk-reading-measure, 35rem);
  margin: 3.25rem auto 0;
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
  font-size: 0.72rem;
}

.pseg-nav__up-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  --sk-icon-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
  text-decoration: none;
  transition: color 0.18s ease;
}

@media (hover: hover) and (pointer: fine) {
  .pseg-nav__link:hover .pseg-nav__title,
  .pseg-nav__up-link:hover {
    color: var(--sk-reading-heading);
  }
}
</style>
