import meta from '../data/pipeline-export-segments.json'
import type { CardGridItem, FeaturedWork } from './cards'

// Filosofia work cards, sourced from the pipeline-export metadata (slice A3 / IA-3). The card route
// (the pt edition's routePrefix) and title come straight from pipeline-export-segments.json — the
// SAME source the reader components read — so the migrated book is never re-hard-coded here and
// src/louis-lavelle/works.json is NOT reintroduced for it. A re-projection of the route (A2, or a
// future locale move) flows through automatically. Work cards stay deliberately spare: title + original
// publication year.
// The export is multi-work (B2): iterate `meta.works` and keep only this author's filosofia editions —
// the routePrefix filter excludes works rooted under other sections (e.g. literatura/bras-cubas).

const WORK_ORIGINAL_PUBLICATION_YEARS: Record<string, string> = {
  'introducao-a-ontologia': '1947'
}

// Cards for one author's published filosofia works, in the order the export lists them.
export function filosofiaWorkCards(authorSlug: string): CardGridItem[] {
  const cards: CardGridItem[] = []
  for (const work of meta.works) {
    if (work.routeStability !== 'stable') continue
    if (work.authorSlug !== authorSlug) continue
    const pt = work.editions.find((e) => e.language === 'pt')
    // only the published pt edition, and only when it is locale-rooted under this author's filosofia hub
    if (!pt || pt.default !== true || !pt.routePrefix.startsWith(`pt/filosofia/${authorSlug}/`))
      continue
    cards.push({
      title: work.title,
      href: `/${pt.routePrefix}/`,
      meta: WORK_ORIGINAL_PUBLICATION_YEARS[pt.routeSlug]
    })
  }
  return cards
}

// The current published Filosofia pipeline work, for the quiet homepage pillar preview.
// Title-only (no author): the homepage must never surface "Louis Lavelle" (the legacy-route substring
// guards), so the preview is original publication year + work title. Returns null when no
// pt/filosofia work is published. Home.vue calls this instead of importing pipeline-export-segments.json,
// so the homepage stays off the consumer allow-list.
export function filosofiaFeaturedWork(): FeaturedWork | null {
  for (const work of meta.works) {
    if (work.routeStability !== 'stable') continue
    const pt = work.editions.find((e) => e.language === 'pt')
    if (!pt || pt.default !== true || !pt.routePrefix.startsWith('pt/filosofia/')) continue
    const year = WORK_ORIGINAL_PUBLICATION_YEARS[pt.routeSlug]
    if (!year) continue
    return { title: work.title, meta: year }
  }
  return null
}
