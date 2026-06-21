---
title: 'Vox Español'
description: 'Vox Español, una serie skepvox de Thiago Oliveira, con diálogos, explicaciones, guías de lección y transcripciones.'
outline: 2
footer: false
head:
  - - link
    - rel: alternate
      type: application/rss+xml
      title: 'Vox Español'
      href: 'https://www.skepvox.com/podcast/espanol/feed.xml'
  - - link
    - rel: canonical
      href: 'https://www.skepvox.com/podcast/espanol/'
  - - meta
    - name: description
      content: 'Vox Español, una serie skepvox de Thiago Oliveira, con diálogos, explicaciones, guías de lección y transcripciones.'
  - - meta
    - name: keywords
      content: 'Vox Español, Podcast de español como lengua extranjera, skepvox, español como lengua extranjera, ELE, aprender español, podcast español, diálogo español'
  - - meta
    - property: og:title
      content: 'Vox Español'
  - - meta
    - property: og:description
      content: 'Diálogos, explicaciones y guías de lección para aprender español con Vox Español.'
  - - meta
    - property: og:url
      content: 'https://www.skepvox.com/podcast/espanol/'
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: 'skepvox'
  - - meta
    - property: og:locale
      content: es_ES
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
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: 'Vox Español'
  - - meta
    - name: twitter:description
      content: 'Diálogos, explicaciones y guías de lección para aprender español con Vox Español.'
  - - meta
    - name: twitter:image
      content: 'https://media.skepvox.com/podcast/espanol/artwork/show-cover-v3.jpg'
  - - meta
    - name: twitter:image:alt
      content: 'Portada de Vox Español'
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": "https://www.skepvox.com/podcast/espanol/#webpage",
        "url": "https://www.skepvox.com/podcast/espanol/",
        "name": "Vox Español",
        "description": "Vox Español, una serie skepvox de Thiago Oliveira, con diálogos, explicaciones, guías de lección y transcripciones.",
        "image": {
          "@type": "ImageObject",
          "url": "https://media.skepvox.com/podcast/espanol/artwork/show-cover-v3.jpg",
          "width": 3000,
          "height": 3000
        },
        "isPartOf": {
          "@id": "https://www.skepvox.com/#website"
        },
        "publisher": {
          "@id": "https://www.skepvox.com/#organization"
        },
        "inLanguage": "es-ES"
      }
---

<script setup>
import PodcastShowHeader from '@theme/components/PodcastShowHeader.vue'
import CardGrid from '@theme/components/CardGrid.vue'
import { episodesToCards } from '@theme/components/episodes'
import episodes from './episodes.json'
</script>

<PodcastShowHeader
  lang="es"
  eyebrow="Podcast de español como lengua extranjera"
  standfirst="Una serie skepvox de Thiago Oliveira: una escena breve, un diálogo a dos velocidades, una explicación guiada y la transcripción completa."
  :count="episodes.length"
  apple="https://podcasts.apple.com/us/podcast/vox-español/id1894875937"
  spotify="https://open.spotify.com/show/7zcDdSa9cfxrAVmRhRVyIv"
  rss="https://www.skepvox.com/podcast/espanol/feed.xml"
/>

## Lecciones

<CardGrid :items="episodesToCards(episodes)" />
