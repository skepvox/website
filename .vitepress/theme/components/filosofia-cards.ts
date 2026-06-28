import meta from '../data/pipeline-export-segments.json'
import type { CardGridItem, FeaturedWork } from './cards'

const WORK_ORIGINAL_PUBLICATION_YEARS: Record<string, string> = {
  'introducao-a-ontologia': '1947'
}

export function filosofiaWorkCards(authorSlug: string): CardGridItem[] {
  const cards: CardGridItem[] = []
  for (const work of meta.works) {
    if (work.routeStability !== 'stable') continue
    if (work.authorSlug !== authorSlug) continue
    const pt = work.editions.find((e) => e.language === 'pt')
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
