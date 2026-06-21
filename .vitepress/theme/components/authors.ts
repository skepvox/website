export interface Author {
  url: string
  img: string
  name: string
}

export const literatureAuthors: Author[] = [
  {
    url: '/literatura/machado-de-assis/',
    img: '/images/authors/machado-de-assis.webp',
    name: 'Machado de Assis'
  },
  {
    url: '/literatura/graciliano-ramos/',
    img: '/images/authors/graciliano-ramos.webp',
    name: 'Graciliano Ramos'
  }
]

export const philosophyAuthors: Author[] = [
  {
    url: '/louis-lavelle/',
    img: '/images/authors/louis-lavelle.webp',
    name: 'Louis Lavelle'
  }
  // {
  //   url: '/filosofia/louis-lavelle/',
  //   img: '/images/authors/louis-lavelle.webp',
  //   name: 'Louis Lavelle'
  // },
  // {
  //   url: '/filosofia/',
  //   img: '/images/authors/marcus-aurelius.png',
  //   name: 'Marcus Aurelius'
  // }
]

export interface CardGridItem {
  title: string
  href: string
  description?: string
  imageUrl?: string
  imageAlt?: string
  meta?: string
}

// Richer literature author cards for the SSR CardGrid on /literatura/. Descriptions
// are reused verbatim from each author hub's frontmatter; Raul Pompeia has no
// portrait asset and renders as a text-only card.
export const literatureAuthorCards: CardGridItem[] = [
  {
    title: 'Machado de Assis',
    href: '/literatura/machado-de-assis/',
    imageUrl: '/images/authors/machado-de-assis.webp',
    imageAlt: 'Machado de Assis',
    description:
      'Bibliografia e obras de Machado de Assis: Brás Cubas, Quincas Borba, Dom Casmurro, Esaú e Jacó, O Alienista e A Cartomante.'
  },
  {
    title: 'Graciliano Ramos',
    href: '/literatura/graciliano-ramos/',
    imageUrl: '/images/authors/graciliano-ramos.webp',
    imageAlt: 'Graciliano Ramos',
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
