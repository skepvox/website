import meta from '../data/pipeline-export-segments.json'
import type { CardGridItem, FeaturedWork } from './cards'

// Literatura work cards, sourced from the pipeline-export metadata (slice B2). Mirrors filosofia-cards.ts:
// the card route (the pt edition's routePrefix) and title come straight from pipeline-export-segments.json
// — the SAME source the reader components read — so the pipeline-built book is never re-hard-coded here
// and src/literatura/**/works.json is NOT reintroduced for it. A re-projection of the route (route_base.py)
// flows through automatically. Work cards stay deliberately spare: title + original publication year.

const WORK_ORIGINAL_PUBLICATION_YEARS: Record<string, string> = {
  'bras-cubas': '1881'
}

// Cards for one author's published literatura works, in the order the export lists them.
export function literaturaWorkCards(authorSlug: string): CardGridItem[] {
  const cards: CardGridItem[] = []
  for (const work of meta.works) {
    if (work.routeStability !== 'stable') continue
    if (work.authorSlug !== authorSlug) continue
    const pt = work.editions.find((e) => e.language === 'pt')
    // only the published pt edition, and only when it is locale-rooted under this author's literatura hub
    if (!pt || pt.default !== true || !pt.routePrefix.startsWith(`pt/literatura/${authorSlug}/`))
      continue
    cards.push({
      title: work.title,
      href: `/${pt.routePrefix}/`,
      meta: WORK_ORIGINAL_PUBLICATION_YEARS[pt.routeSlug]
    })
  }
  return cards
}

// The current published Literatura pipeline work, for the quiet homepage pillar preview.
// Same pt-edition + pillar-rooted selection as the hub cards, but pillar-level (no authorSlug) and
// returning only the fields the homepage renders: original publication year + title. Returns null when
// no pt/literatura work is published. Home.vue calls this instead of importing
// pipeline-export-segments.json, so the homepage stays off the consumer allow-list.
export function literaturaFeaturedWork(): FeaturedWork | null {
  for (const work of meta.works) {
    if (work.routeStability !== 'stable') continue
    const pt = work.editions.find((e) => e.language === 'pt')
    if (!pt || pt.default !== true || !pt.routePrefix.startsWith('pt/literatura/')) continue
    const year = WORK_ORIGINAL_PUBLICATION_YEARS[pt.routeSlug]
    if (!year) continue
    return { title: work.title, meta: year }
  }
  return null
}
