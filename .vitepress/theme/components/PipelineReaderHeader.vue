<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import meta from '../data/pipeline-export-segments.json'
import SkLink from './SkLink.vue'
import {
  navLabel as navLabelFor,
  openingLabel as openingLabelFor,
  locLabel as locLabelFor,
  workHubHref,
  trechoHref
} from './reader-shell'

interface Level {
  kind: string
  index: number
  key: string
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
const lang = computed(() => (frontmatter.value.pipelineLanguage as string) || 'pt')
const workId = computed(() => canonicalId.value?.split('/').slice(0, -1).join('/'))

const edition = computed<Seg[]>(() =>
  isPipelineLeaf.value
    ? (meta.segments as Seg[])
        .filter((s) => s.workId === workId.value && s.language === lang.value)
        .sort((a, b) => a.order - b.order)
    : []
)
const current = computed<Seg | null>(
  () => edition.value.find((s) => s.canonicalId === canonicalId.value) ?? null
)

const navLabel = computed(() => navLabelFor(lang.value))
const openingLabel = computed(() => openingLabelFor(lang.value))
const locLabel = computed(() => locLabelFor(lang.value))

const isConclusion = computed(
  () => !!current.value && current.value.segmentPrefix.startsWith('99-99-999')
)
const groupPath = computed<Level[]>(() => {
  const own = current.value?.groupPath ?? []
  if (own.length > 0 || !isConclusion.value) return own
  const idx = edition.value.findIndex((s) => s.canonicalId === current.value!.canonicalId)
  for (let i = idx - 1; i >= 0; i--) {
    if (edition.value[i].groupPath.length > 0) return edition.value[i].groupPath
  }
  return own
})
const part = computed(() => groupPath.value.find((l) => l.kind === 'part') ?? null)
const chapterLevel = computed(() => groupPath.value.find((l) => l.kind === 'chapter') ?? null)
const isFrontMatter = computed(
  () => !!current.value && (current.value.groupPath?.length ?? 0) === 0 && !isConclusion.value
)

const chapterTitle = computed(
  () =>
    chapterLevel.value?.title ||
    chapterLevel.value?.label ||
    (frontmatter.value.pipelineChapter as string) ||
    ''
)
const segmentTitle = computed(
  () => current.value?.displayTitle || (frontmatter.value.pipelineSegmentTitle as string) || ''
)
const isChapterLevel = computed(
  () => !!chapterLevel.value && !!current.value && chapterTitle.value === segmentTitle.value
)
const hubHref = computed(() => (current.value ? workHubHref(current.value.routePath) : '/'))
const chapterHref = computed(() =>
  current.value ? trechoHref(current.value.routePath, current.value.segmentPrefix) : hubHref.value
)
</script>

<template>
  <nav
    v-if="isPipelineLeaf && current && segmentTitle"
    class="pseg-loc pseg-head"
    data-testid="pseg-head"
    :data-pipeline-nav="lang"
    :aria-label="locLabel"
  >
    <ol role="list" class="pseg-loc__list">
      <li class="pseg-loc__rung">
        <SkLink class="pseg-loc__link" :href="hubHref">{{ navLabel }}</SkLink>
      </li>

      <li v-if="part" class="pseg-loc__rung pseg-loc__rung--part">
        <span class="pseg-loc__sep" aria-hidden="true">·</span>
        <span class="pseg-loc__part" :title="part.label">{{ part.label }}</span>
      </li>

      <li v-else-if="isFrontMatter" class="pseg-loc__rung">
        <span class="pseg-loc__sep" aria-hidden="true">·</span>{{ openingLabel }}
      </li>

      <li v-if="isChapterLevel" class="pseg-loc__current">
        <h2 class="pseg-head__title" aria-current="location">{{ segmentTitle }}</h2>
      </li>
      <template v-else>
        <li v-if="chapterLevel" class="pseg-loc__rung pseg-loc__rung--chapter">
          <span class="pseg-loc__sep" aria-hidden="true">·</span>
          <h2 class="pseg-head__chapter">
            <SkLink class="pseg-loc__link" :href="chapterHref">{{ chapterTitle }}</SkLink>
          </h2>
        </li>

        <li class="pseg-loc__current">
          <h3 class="pseg-head__title" aria-current="location">{{ segmentTitle }}</h3>
        </li>
      </template>
    </ol>
  </nav>
</template>

<style scoped>
.pseg-loc {
  max-width: var(--sk-reading-measure, 35rem);
  margin: 0 auto 1.25rem;
}
.pseg-loc__list {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pseg-loc__rung {
  font-size: var(--sk-reading-kicker);
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  color: var(--sk-text-muted);
}

.pseg-loc__rung--chapter .pseg-head__chapter {
  display: inline;
  margin: 0;
  padding: 0;
  border: 0;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
}

.pseg-loc__rung--part {
  min-width: 2.5em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pseg-loc__sep {
  margin: 0 0.35em;
  color: var(--sk-text-faint);
}

.pseg-loc__current {
  flex-basis: 100%;
  margin-top: 0.85rem;
  padding-inline-start: 0.7rem;
  box-shadow: inset 2px 0 0 var(--sk-reading-current);
}
.pseg-loc__current .pseg-head__title {
  margin: 0;
  padding: 0;

  font-family: var(--vt-font-family-base);
  font-size: var(--sk-reading-segtitle);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: var(--sk-reading-kicker-tracking);
  text-transform: uppercase;
  color: var(--sk-text);
}

.pseg-loc__link {
  display: inline-block;

  padding-block: 0.85rem;
  margin-block: -0.85rem;
  color: inherit;
  text-decoration: none;
}
@media (hover: hover) and (pointer: fine) {
  .pseg-loc__link:hover {
    color: var(--sk-reading-heading);
  }
}
</style>
