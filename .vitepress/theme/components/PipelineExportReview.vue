<script setup lang="ts">
import { computed, ref } from 'vue'
import data from '../data/pipeline-export-segments.json'

// REVIEW-ONLY consumer (Slice 2C/2D) of the vendored book-pipeline export
// (.vitepress/theme/data/pipeline-export-segments.json, source:"pipeline-export"). It validates the
// future reading app's data — the AUTHORED groupPath (Part -> Chapter, real label/title,
// inferred:false; never inferred from slugs) — for one edition at a time, with a compact language
// switcher and an internal compare/QA block. It is hosted ONLY on the buffer (noindex/unlisted/
// out-of-search) page src/reading-review/introduction-a-l-ontologie.md. It generates NO public page:
// leaves are inert text and routePath is shown only as QA data (never an href).

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
  maturity: string
  publishable: boolean
  groupPath: Level[]
}

const work = (data as any).work
const allSegs = data.segments as Seg[]

// Default to the canonical reading edition (pt: editionRole "canonical", default:true in the export).
const EDITIONS = [
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' }
] as const
const active = ref<'pt' | 'fr'>('pt')

function buildEdition(lang: string) {
  const segs = allSegs.filter((s) => s.language === lang).sort((a, b) => a.order - b.order)
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
  return { parts, loose, segs, count: segs.length }
}

const edition = computed(() => buildEdition(active.value))

// Compare / QA: canonicalId pairing + draft state across editions.
const frIds = [
  ...new Set(allSegs.filter((s) => s.language === 'fr').map((s) => s.canonicalId))
].sort()
const ptIds = [
  ...new Set(allSegs.filter((s) => s.language === 'pt').map((s) => s.canonicalId))
].sort()
const canonicalCount = frIds.length
const frCount = allSegs.filter((s) => s.language === 'fr').length
const ptCount = allSegs.filter((s) => s.language === 'pt').length
const idsMatch = frIds.length === ptIds.length && frIds.every((id, i) => id === ptIds[i])
</script>

<template>
  <section class="pe-review" data-source="pipeline-export" :data-active="active">
    <!-- Internal compare / QA block (not product copy) -->
    <dl class="pe-qa" data-testid="pe-compare">
      <div>
        <dt>Canonical segments</dt>
        <dd data-qa="canonical">{{ canonicalCount }}</dd>
      </div>
      <div>
        <dt>fr records</dt>
        <dd data-qa="fr">{{ frCount }}</dd>
      </div>
      <div>
        <dt>pt records</dt>
        <dd data-qa="pt">{{ ptCount }}</dd>
      </div>
      <div>
        <dt>fr ≡ pt canonicalId set</dt>
        <dd data-qa="ids-match">{{ idsMatch ? `matched (${canonicalCount})` : 'MISMATCH' }}</dd>
      </div>
      <div>
        <dt>routeStability</dt>
        <dd data-qa="route-stability">{{ work.routeStability }}</dd>
      </div>
      <div>
        <dt>maturity</dt>
        <dd data-qa="maturity">{{ work.maturity }}</dd>
      </div>
    </dl>

    <!-- Language switcher: real buttons, aria-pressed; one edition rendered at a time -->
    <div class="pe-switch" role="group" aria-label="Edition language" data-testid="pe-lang-switch">
      <button
        v-for="e in EDITIONS"
        :key="e.code"
        type="button"
        class="pe-switch__btn"
        :class="{ 'is-active': active === e.code }"
        :aria-pressed="active === e.code"
        @click="active = e.code"
      >
        {{ e.label }}
      </button>
    </div>

    <!-- Active edition: authored Part -> Chapter -> leaves (inert text, never links) -->
    <div class="pe-edition" :data-edition="active">
      <div v-if="edition.loose.length" class="pe-edition__loose">
        <h3 class="pe-part">Front matter &amp; conclusion (no part)</h3>
        <p v-for="s in edition.loose" :key="s.canonicalId" class="pe-leaf">{{ s.displayTitle }}</p>
      </div>

      <div v-for="p in edition.parts" :key="p.key" class="pe-partgroup">
        <h3 class="pe-part">
          {{ p.label }}<template v-if="p.title"> — {{ p.title }}</template>
        </h3>
        <div v-for="c in p.chapters" :key="c.key" class="pe-chapter">
          <h4 class="pe-chapter__title">{{ c.title || c.label }}</h4>
          <p v-for="s in c.leaves" :key="s.canonicalId" class="pe-leaf">{{ s.displayTitle }}</p>
        </div>
      </div>
    </div>

    <!-- routePath kept for QA only, collapsed; inert text, never an href -->
    <details class="pe-routes" data-testid="pe-routepaths">
      <summary>routePaths ({{ active }}) — QA data, not links</summary>
      <ul>
        <li v-for="s in edition.segs" :key="s.canonicalId">
          <code>{{ s.routePath }}</code>
        </li>
      </ul>
    </details>
  </section>
</template>

<style scoped>
.pe-review {
  max-width: 46rem;
  margin: 0 0 2.5rem;
}

/* Compare / QA block — a quiet definition grid, clearly internal. */
.pe-qa {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.35rem 1rem;
  margin: 0 0 1.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--sk-reading-rule);
  border-radius: var(--sk-radius-sm);
  font-size: 0.82rem;
}
.pe-qa dt {
  color: var(--sk-text-muted);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.pe-qa dd {
  margin: 0;
  font-weight: 600;
}

/* Language switcher — paired buttons sharing the shell's focus dialect. */
.pe-switch {
  display: inline-flex;
  gap: 0.25rem;
  margin: 0 0 1.5rem;
  padding: 0.2rem;
  border: 1px solid var(--sk-reading-rule);
  border-radius: var(--sk-radius-sm);
}
.pe-switch__btn {
  min-height: 40px;
  padding: 0.35rem 0.9rem;
  border: 0;
  border-radius: var(--sk-radius-sm);
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--sk-text-muted);
  -webkit-tap-highlight-color: transparent;
  transition:
    color 0.18s ease,
    background 0.18s ease;
}
.pe-switch__btn.is-active {
  background: var(--sk-reading-rule);
  color: var(--sk-reading-heading);
  font-weight: 600;
}
.pe-switch__btn:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
}
@media (hover: hover) and (pointer: fine) {
  .pe-switch__btn:hover {
    color: var(--sk-reading-heading);
  }
}

.pe-part {
  margin-top: 1.2rem;
  font-size: 0.98rem;
}
.pe-chapter__title {
  margin: 0.7rem 0 0.1rem;
  font-size: 0.82rem;
  color: var(--sk-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.pe-leaf {
  margin: 0.12rem 0;
  padding-left: 1.25rem;
  font-size: 0.95rem;
  color: var(--sk-reading-muted);
}

.pe-routes {
  margin-top: 2rem;
  font-size: 0.72rem;
  color: var(--sk-text-muted);
}
.pe-routes summary {
  cursor: pointer;
}
.pe-routes code {
  opacity: 0.7;
}
</style>
