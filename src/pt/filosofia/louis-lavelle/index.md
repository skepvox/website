---
title: "Filosofia — Louis Lavelle"
description: "Saint-Martin-de-Villeréal, França · 1883–1951 †"
outline: 2
footer: false
head:
  - - link
    - rel: canonical
      href: "https://skepvox.com/pt/filosofia/louis-lavelle/"
  - - meta
    - name: description
      content: "Saint-Martin-de-Villeréal, França · 1883–1951 †"
  - - meta
    - property: og:title
      content: "Filosofia — Louis Lavelle"
  - - meta
    - property: og:description
      content: "Saint-Martin-de-Villeréal, França · 1883–1951 †"
  - - meta
    - property: og:url
      content: "https://skepvox.com/pt/filosofia/louis-lavelle/"
  - - meta
    - property: og:type
      content: profile
  - - meta
    - property: og:locale
      content: pt_BR
  - - meta
    - property: og:image
      content: "https://skepvox.com/images/authors/louis-lavelle.webp"
  - - meta
    - property: og:image:alt
      content: "Louis Lavelle"
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": "https://skepvox.com/pt/filosofia/louis-lavelle/#person",
        "name": "Louis Lavelle",
        "description": "Saint-Martin-de-Villeréal, França · 1883–1951 †",
        "url": "https://skepvox.com/pt/filosofia/louis-lavelle/",
        "image": "https://skepvox.com/images/authors/louis-lavelle.webp",
        "birthDate": "1883-07-15",
        "deathDate": "1951-09-01",
        "birthPlace": {
          "@type": "Place",
          "name": "Saint-Martin-de-Villeréal, França"
        },
        "deathPlace": {
          "@type": "Place",
          "name": "Parranquet, França"
        },
        "nationality": "Francesa",
        "jobTitle": "Filósofo",
        "inLanguage": "pt-BR"
      }
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import { filosofiaWorkCards } from '@theme/components/filosofia-cards'

const works = filosofiaWorkCards('louis-lavelle')
</script>

# Louis Lavelle

<img
  src="/images/authors/louis-lavelle.webp"
  alt="Retrato de Louis Lavelle"
  class="author-portrait"
/>

<p class="author-meta">{{ $frontmatter.description }}</p>

<CardGrid :items="works" />
