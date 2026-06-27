import type { CardGridItem } from './cards'

// Literatura author cards for the SSR CardGrid on the locale-rooted /pt/literatura/ hub (slice B2/B5).
// Mirrors philosophyAuthorCards; the href is the locale-rooted author hub. Each author's WORKS are
// sourced from pipeline-export metadata on the author hub (literatura-cards.ts), never here. The legacy
// hand-authored /literatura/ author cards were retired with that surface (B5); other Machado/Graciliano/
// Pompeia books return only when rebuilt through book-pipeline.
export const literaturaAuthorCardsPt: CardGridItem[] = [
  {
    title: 'Machado de Assis',
    href: '/pt/literatura/machado-de-assis/',
    imageUrl: '/images/authors/machado-de-assis.webp',
    imageAlt: 'Machado de Assis',
    imageVariant: 'portrait',
    description:
      'Escritor brasileiro (1839–1908), mestre do realismo. Memórias póstumas de Brás Cubas em português, lida por capítulos.'
  }
]

// Philosophy author cards for the SSR CardGrid on /pt/filosofia/ (slice A3). Hand-curated bio +
// portrait; the href is the locale-rooted author hub. Mirrors literatureAuthorCards. Each author's
// WORKS are sourced from pipeline-export metadata on the author hub (filosofia-cards.ts), never here.
export const philosophyAuthorCards: CardGridItem[] = [
  {
    title: 'Louis Lavelle',
    href: '/pt/filosofia/louis-lavelle/',
    imageUrl: '/images/authors/louis-lavelle.webp',
    imageAlt: 'Louis Lavelle',
    imageVariant: 'portrait',
    description:
      'Filósofo francês (1883–1951), nome central da filosofia do espírito. Introdução à ontologia em português, lida por trechos.'
  }
]
