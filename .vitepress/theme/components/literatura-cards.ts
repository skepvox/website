import meta from '../data/pipeline-export-segments.json'
import type { CardGridItem } from './cards'

// Literatura work cards, sourced from the pipeline-export metadata (slice B2). Mirrors filosofia-cards.ts:
// the card route (the pt edition's routePrefix) and title come straight from pipeline-export-segments.json
// — the SAME source the reader components read — so the pipeline-built book is never re-hard-coded here
// and src/literatura/**/works.json is NOT reintroduced for it. A re-projection of the route (route_base.py)
// flows through automatically. The export carries no reader-facing blurb, so a small hand-curated blurb
// keyed by the pt routeSlug supplies the card description (generic fallback).

const WORK_BLURBS: Record<string, string> = {
  'bras-cubas': 'Romance em português, lido por capítulos.'
}

// Cards for one author's published literatura works, in the order the export lists them.
export function literaturaWorkCards(authorSlug: string): CardGridItem[] {
  const cards: CardGridItem[] = []
  for (const work of meta.works) {
    if (work.authorSlug !== authorSlug) continue
    const pt = work.editions.find((e) => e.language === 'pt')
    // only the published pt edition, and only when it is locale-rooted under this author's literatura hub
    if (!pt || !pt.routePrefix.startsWith(`pt/literatura/${authorSlug}/`)) continue
    cards.push({
      title: work.title,
      href: `/${pt.routePrefix}/`,
      description: WORK_BLURBS[pt.routeSlug] ?? 'Edição em português, lida por capítulos.',
      meta: `${pt.segmentCount} trechos`
    })
  }
  return cards
}
