<script setup lang="ts">
import { computed } from 'vue'
import data from '../data/pipeline-export-segments.json'

// REVIEW-ONLY consumer (Slice 2C). Renders the vendored book-pipeline export
// (.vitepress/theme/data/pipeline-export-segments.json, source:"pipeline-export") through the UI
// to prove the website can consume it. It renders the AUTHORED groupPath (Part -> Chapter, with the
// pipeline's real label/title and inferred:false) — never inferring structure from slugs — and shows
// both editions (fr source + pt canonical). Leaves are plain text: this surface generates NO public
// page, so segments are not links; routePath is shown as inert data only. Hosted only on the buffer
// (noindex/unlisted/out-of-search) page src/reading-review/introduction-a-l-ontologie.md.

interface Level {
  kind: string
  index: number
  label: string
  title: string | null
  key: string
  inferred: boolean
}
interface Seg {
  canonicalId: string
  language: string
  order: number
  segmentPrefix: string
  displayTitle: string
  routePath: string
  urlStability: string
  groupPath: Level[]
}

const EDITIONS = [
  { code: 'fr', name: 'Français — source edition' },
  { code: 'pt', name: 'Português — canonical edition' }
]

function buildEdition(lang: string) {
  const segs = (data.segments as Seg[])
    .filter((s) => s.language === lang)
    .sort((a, b) => a.order - b.order)
  const parts: any[] = []
  const partByKey = new Map<string, any>()
  const loose: Seg[] = [] // front-matter / conclusion buckets (empty groupPath)
  for (const s of segs) {
    if (!s.groupPath.length) {
      loose.push(s)
      continue
    }
    const p = s.groupPath[0]
    const c = s.groupPath[1]
    let pg = partByKey.get(p.key)
    if (!pg) {
      pg = { key: p.key, label: p.label, title: p.title, chapters: [], chapByKey: new Map() }
      partByKey.set(p.key, pg)
      parts.push(pg)
    }
    let cg = pg.chapByKey.get(c.key)
    if (!cg) {
      cg = { key: c.key, label: c.label, title: c.title, leaves: [] as Seg[] }
      pg.chapByKey.set(c.key, cg)
      pg.chapters.push(cg)
    }
    cg.leaves.push(s)
  }
  return { lang, parts, loose, count: segs.length }
}

const editions = computed(() => EDITIONS.map((e) => ({ ...e, ...buildEdition(e.code) })))
const total = computed(() => (data.segments as Seg[]).length)
</script>

<template>
  <section class="pe-review" data-source="pipeline-export" :data-total="total">
    <p class="pe-review__meta">
      Source: <code>{{ (data as any).source }}</code> · {{ total }} edition records (review only —
      no public route is generated).
    </p>

    <section v-for="ed in editions" :key="ed.code" class="pe-review__edition">
      <h2 class="pe-review__edition-title">{{ ed.name }} ({{ ed.count }})</h2>

      <div v-if="ed.loose.length" class="pe-review__loose">
        <h3 class="pe-review__part">Hors-partie / front matter &amp; conclusion</h3>
        <p v-for="s in ed.loose" :key="s.canonicalId" class="pe-review__leaf">
          {{ s.displayTitle }} <code class="pe-review__route">{{ s.routePath }}</code>
        </p>
      </div>

      <div v-for="p in ed.parts" :key="p.key" class="pe-review__partgroup">
        <h3 class="pe-review__part">
          {{ p.label }}<template v-if="p.title"> — {{ p.title }}</template>
        </h3>
        <div v-for="c in p.chapters" :key="c.key" class="pe-review__chapter">
          <h4 class="pe-review__chapter-title">{{ c.title || c.label }}</h4>
          <p v-for="s in c.leaves" :key="s.canonicalId" class="pe-review__leaf">
            {{ s.displayTitle }} <code class="pe-review__route">{{ s.routePath }}</code>
          </p>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.pe-review {
  max-width: 46rem;
  margin: 0 0 2.5rem;
}
.pe-review__meta {
  font-size: 0.85rem;
  color: var(--sk-text-muted);
}
.pe-review__edition-title {
  margin-top: 2rem;
  font-size: 1.1rem;
  border-top: 1px solid var(--sk-reading-rule);
  padding-top: 0.6rem;
}
.pe-review__part {
  margin-top: 1.2rem;
  font-size: 0.95rem;
}
.pe-review__chapter-title {
  margin: 0.6rem 0 0.1rem;
  font-size: 0.85rem;
  color: var(--sk-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.pe-review__leaf {
  margin: 0.15rem 0;
  padding-left: 1.25rem;
  font-size: 0.95rem;
  color: var(--sk-reading-muted);
}
.pe-review__route {
  font-size: 0.72rem;
  opacity: 0.55;
}
</style>
