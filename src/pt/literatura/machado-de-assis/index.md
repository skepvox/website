---
title: "Literatura — Machado de Assis"
description: "Rio de Janeiro, Brasil · 1839–1908 †"
outline: 2
footer: false
head:
  - - link
    - rel: canonical
      href: "https://skepvox.com/pt/literatura/machado-de-assis/"
  - - meta
    - name: description
      content: "Rio de Janeiro, Brasil · 1839–1908 †"
  - - meta
    - property: og:title
      content: "Literatura — Machado de Assis"
  - - meta
    - property: og:description
      content: "Rio de Janeiro, Brasil · 1839–1908 †"
  - - meta
    - property: og:url
      content: "https://skepvox.com/pt/literatura/machado-de-assis/"
  - - meta
    - property: og:type
      content: profile
  - - meta
    - property: og:locale
      content: pt_BR
  - - meta
    - property: og:image
      content: "https://skepvox.com/images/authors/machado-de-assis.webp"
  - - meta
    - property: og:image:alt
      content: "Machado de Assis"
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": "https://skepvox.com/pt/literatura/machado-de-assis/#person",
        "name": "Machado de Assis",
        "description": "Rio de Janeiro, Brasil · 1839–1908 †",
        "url": "https://skepvox.com/pt/literatura/machado-de-assis/",
        "image": "https://skepvox.com/images/authors/machado-de-assis.webp",
        "birthDate": "1839-06-21",
        "deathDate": "1908-09-29",
        "birthPlace": {
          "@type": "Place",
          "name": "Rio de Janeiro, Brasil"
        },
        "deathPlace": {
          "@type": "Place",
          "name": "Rio de Janeiro, Brasil"
        },
        "nationality": "Brasileira",
        "jobTitle": "Escritor",
        "inLanguage": "pt-BR"
      }
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import { literaturaWorkCards } from '@theme/components/literatura-cards'

const works = literaturaWorkCards('machado-de-assis')
</script>

# Machado de Assis

<img
  src="/images/authors/machado-de-assis.webp"
  alt="Retrato de Machado de Assis"
  class="author-portrait"
/>

<p class="author-meta">{{ $frontmatter.description }}</p>

<CardGrid :items="works" />
