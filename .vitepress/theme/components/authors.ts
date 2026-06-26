import type { CardGridItem } from './cards'

// Literature author cards for the SSR CardGrid on /literatura/. Descriptions are
// reused verbatim from each author hub's frontmatter; Raul Pompeia has no portrait
// asset and renders as a text-only card.
export const literatureAuthorCards: CardGridItem[] = [
  {
    title: 'Machado de Assis',
    href: '/literatura/machado-de-assis/',
    imageUrl: '/images/authors/machado-de-assis.webp',
    imageAlt: 'Machado de Assis',
    imageVariant: 'portrait',
    description:
      'Bibliografia e obras de Machado de Assis: Brás Cubas, Quincas Borba, Dom Casmurro, Esaú e Jacó, O Alienista e A Cartomante.'
  },
  {
    title: 'Graciliano Ramos',
    href: '/literatura/graciliano-ramos/',
    imageUrl: '/images/authors/graciliano-ramos.webp',
    imageAlt: 'Graciliano Ramos',
    imageVariant: 'portrait',
    description:
      'Bibliografia e textos integrais de Graciliano Ramos: São Bernardo, Angústia e Vidas Secas.'
  },
  {
    title: 'Raul Pompeia',
    href: '/literatura/raul-pompeia/',
    description:
      'Raul Pompeia (1863–1895), autor de O Ateneu, marco do realismo-naturalismo na literatura brasileira.'
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
