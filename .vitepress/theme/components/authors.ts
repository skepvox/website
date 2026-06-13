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
    },
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
