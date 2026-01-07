export interface Author {
    url: string
    img: string
    name: string
  }

export const literatureAuthors: Author[] = [
    {
      url: '/literatura/machado-de-assis/',
      img: '/images/authors/machado-de-assis.png',
      name: 'Machado de Assis'
    },
    {
      url: '/literatura/graciliano-ramos/',
      img: '/images/authors/graciliano-ramos.png',
      name: 'Graciliano Ramos'
    }
  ]

  export const philosophyAuthors: Author[] = [
    {
      url: '/louis-lavelle/',
      img: '/images/authors/louis-lavelle.png',
      name: 'Louis Lavelle'
    },
    // {
    //   url: '/filosofia/louis-lavelle/',
    //   img: '/images/authors/louis-lavelle.png',
    //   name: 'Louis Lavelle'
    // },
    // {
    //   url: '/filosofia/',
    //   img: '/images/authors/marcus-aurelius.png',
    //   name: 'Marcus Aurelius'
    // }
  ]
