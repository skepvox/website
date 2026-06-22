---
title: 'Podcasts'
description: 'Podcasts que criei para meu próprio estudo: francês, espanhol e inglês em um formato que tem funcionado bem para mim.'
outline: 2
head:
  - - link
    - rel: canonical
      href: 'https://www.skepvox.com/podcast/'
  - - meta
    - name: description
      content: 'Podcasts que criei para meu próprio estudo: francês, espanhol e inglês em um formato que tem funcionado bem para mim.'
  - - meta
    - property: og:title
      content: 'Podcasts skepvox'
  - - meta
    - property: og:description
      content: 'Podcasts que criei para meu próprio estudo, em francês, espanhol e inglês.'
  - - meta
    - property: og:url
      content: 'https://www.skepvox.com/podcast/'
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: 'skepvox'
  - - meta
    - property: og:image
      content: 'https://media.skepvox.com/podcast/francais/artwork/show-cover-v3.jpg'
  - - meta
    - property: og:image:type
      content: image/jpeg
  - - meta
    - property: og:image:width
      content: '3000'
  - - meta
    - property: og:image:height
      content: '3000'
  - - meta
    - property: og:image:alt
      content: 'Couverture de Vox Français'
  - - meta
    - property: og:image
      content: 'https://media.skepvox.com/podcast/espanol/artwork/show-cover-v3.jpg'
  - - meta
    - property: og:image:type
      content: image/jpeg
  - - meta
    - property: og:image:width
      content: '3000'
  - - meta
    - property: og:image:height
      content: '3000'
  - - meta
    - property: og:image:alt
      content: 'Portada de Vox Español'
  - - meta
    - property: og:image
      content: 'https://media.skepvox.com/podcast/english/artwork/show-cover-v3.jpg'
  - - meta
    - property: og:image:type
      content: image/jpeg
  - - meta
    - property: og:image:width
      content: '3000'
  - - meta
    - property: og:image:height
      content: '3000'
  - - meta
    - property: og:image:alt
      content: 'Vox English cover art'
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:image
      content: 'https://media.skepvox.com/podcast/francais/artwork/show-cover-v3.jpg'
  - - meta
    - name: twitter:image:alt
      content: 'Couverture de Vox Français'
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": "https://www.skepvox.com/podcast/#webpage",
        "url": "https://www.skepvox.com/podcast/",
        "name": "Podcasts skepvox",
        "description": "Podcasts que criei para meu próprio estudo, em francês, espanhol e inglês.",
        "image": [
          "https://media.skepvox.com/podcast/francais/artwork/show-cover-v3.jpg",
          "https://media.skepvox.com/podcast/espanol/artwork/show-cover-v3.jpg",
          "https://media.skepvox.com/podcast/english/artwork/show-cover-v3.jpg"
        ],
        "isPartOf": {
          "@id": "https://www.skepvox.com/#website"
        },
        "publisher": {
          "@id": "https://www.skepvox.com/#organization"
        },
        "inLanguage": "pt-BR"
      }
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import shows from './shows.json'
</script>

# Podcasts

Criei estes podcasts para meu próprio estudo, como uma forma de manter contato com o francês, o espanhol e o inglês. Eles seguem um formato que tem funcionado bem para mim. Se também fizer sentido para você, fique à vontade para acompanhar.

## Séries

<CardGrid :items="shows" />
