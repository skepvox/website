---
page: true
title: skepvox — Engenharia de Letras
description: "Textos de Louis Lavelle, literatura e podcasts que organizo para minha própria leitura e estudo."
head:
  - - link
    - rel: canonical
      href: "https://skepvox.com/"
  - - meta
    - name: description
      content: "Textos de Louis Lavelle, literatura e podcasts que organizo para minha própria leitura e estudo."
  - - meta
    - name: keywords
      content: "skepvox, Louis Lavelle, literatura, filosofia, biblioteca digital, obras clássicas"
  - - meta
    - name: robots
      content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  - - meta
    - property: og:title
      content: "skepvox — Engenharia de Letras"
  - - meta
    - property: og:description
      content: "Textos de Louis Lavelle, literatura e podcasts que organizo para minha própria leitura e estudo."
  - - meta
    - property: og:url
      content: "https://skepvox.com/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: skepvox
  - - meta
    - property: og:locale
      content: pt_BR
  - - meta
    - property: og:image
      content: "https://skepvox.com/og-skepvox.png"
  - - meta
    - property: og:image:alt
      content: "skepvox — Engenharia de Letras"
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "skepvox — Engenharia de Letras"
  - - meta
    - name: twitter:description
      content: "Textos de Louis Lavelle, literatura e podcasts que organizo para minha própria leitura e estudo."
  - - meta
    - name: twitter:image
      content: "https://skepvox.com/og-skepvox.png"
  - - meta
    - name: twitter:image:alt
      content: "skepvox — Engenharia de Letras"
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": "https://skepvox.com/#organization",
            "name": "skepvox",
            "url": "https://skepvox.com/",
            "sameAs": [
              "https://github.com/skepvox/",
              "https://x.com/skepvox",
              "https://instagram.com/skepvox"
            ]
          },
          {
            "@type": "WebSite",
            "@id": "https://skepvox.com/#website",
            "url": "https://skepvox.com/",
            "name": "skepvox",
            "alternateName": "Engenharia de Letras",
            "description": "Textos de Louis Lavelle, literatura e podcasts que organizo para minha própria leitura e estudo.",
            "publisher": {
              "@id": "https://skepvox.com/#organization"
            },
            "inLanguage": "pt-BR"
          },
          {
            "@type": "ItemList",
            "@id": "https://skepvox.com/#focos",
            "itemListOrder": "http://schema.org/ItemListOrderAscending",
            "numberOfItems": 3,
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Louis Lavelle",
                "url": "https://skepvox.com/pt/filosofia/louis-lavelle/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Literatura",
                "url": "https://skepvox.com/literatura/"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Podcasts",
                "url": "https://skepvox.com/podcast/"
              }
            ]
          },
          {
            "@type": "CollectionPage",
            "@id": "https://skepvox.com/#webpage",
            "url": "https://skepvox.com/",
            "name": "skepvox — Engenharia de Letras",
            "description": "Textos, obras e podcasts que organizo para minha própria leitura e estudo.",
            "isPartOf": {
              "@id": "https://skepvox.com/#website"
            },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "url": "https://skepvox.com/og-skepvox.png"
            },
            "about": [
              {
                "@type": "Person",
                "name": "Louis Lavelle",
                "url": "https://skepvox.com/pt/filosofia/louis-lavelle/"
              },
              {
                "@type": "Thing",
                "name": "Literatura",
                "url": "https://skepvox.com/literatura/"
              }
            ],
            "mainEntity": {
              "@id": "https://skepvox.com/#focos"
            },
            "inLanguage": "pt-BR"
          }
        ]
      }
---

<script setup>
import Home from '@theme/components/Home.vue'
</script>

<Home />
