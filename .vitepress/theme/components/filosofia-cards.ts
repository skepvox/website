import meta from '../data/pipeline-export-segments.json'
import type { CardGridItem } from './cards'

// Filosofia work cards, sourced from the pipeline-export metadata (slice A3 / IA-3). The card route
// (the pt edition's routePrefix) and title come straight from pipeline-export-segments.json — the
// SAME source the reader components read — so the migrated book is never re-hard-coded here and
// src/louis-lavelle/works.json is NOT reintroduced for it. A re-projection of the route (A2, or a
// future locale move) flows through automatically. The export carries no reader-facing blurb, so a
// small hand-curated blurb keyed by the pt routeSlug supplies the card description (generic fallback).
// The export is multi-work (B2): iterate `meta.works` and keep only this author's filosofia editions —
// the routePrefix filter excludes works rooted under other sections (e.g. literatura/bras-cubas).

const WORK_BLURBS: Record<string, string> = {
  'introducao-a-ontologia': 'Edição em português, organizada por trechos para leitura.'
}

// Cards for one author's published filosofia works, in the order the export lists them.
export function filosofiaWorkCards(authorSlug: string): CardGridItem[] {
  const cards: CardGridItem[] = []
  for (const work of meta.works) {
    if (work.authorSlug !== authorSlug) continue
    const pt = work.editions.find((e) => e.language === 'pt')
    // only the published pt edition, and only when it is locale-rooted under this author's filosofia hub
    if (!pt || !pt.routePrefix.startsWith(`pt/filosofia/${authorSlug}/`)) continue
    cards.push({
      title: work.title,
      href: `/${pt.routePrefix}/`,
      description: WORK_BLURBS[pt.routeSlug] ?? 'Edição em português, lida por trechos.',
      meta: `${pt.segmentCount} trechos`
    })
  }
  return cards
}
