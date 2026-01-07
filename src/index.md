---
page: true
title: Skepvox — Engenharia de Letras
description: "Skepvox reúne as obras de Louis Lavelle, literatura clássica e materiais do ENEM — leitura, filosofia e estudo em um único lugar."
head:
  - - link
    - rel: canonical
      href: "https://skepvox.com/"
  - - meta
    - name: description
      content: "Skepvox reúne as obras de Louis Lavelle, literatura clássica e materiais do ENEM — leitura, filosofia e estudo em um único lugar."
  - - meta
    - name: keywords
      content: "Skepvox, Louis Lavelle, literatura, filosofia, ENEM, questões ENEM, biblioteca digital, obras clássicas, educação"
  - - meta
    - name: robots
      content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  - - meta
    - property: og:title
      content: "Skepvox — Engenharia de Letras"
  - - meta
    - property: og:description
      content: "Skepvox reúne as obras de Louis Lavelle, literatura clássica e materiais do ENEM — leitura, filosofia e estudo em um único lugar."
  - - meta
    - property: og:url
      content: "https://skepvox.com/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: Skepvox
  - - meta
    - property: og:locale
      content: pt_BR
  - - meta
    - property: og:image
      content: "https://skepvox.com/og-skepvox.png"
  - - meta
    - property: og:image:alt
      content: "Skepvox — Engenharia de Letras"
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Skepvox — Engenharia de Letras"
  - - meta
    - name: twitter:description
      content: "Skepvox reúne as obras de Louis Lavelle, literatura clássica e materiais do ENEM — leitura, filosofia e estudo em um único lugar."
  - - meta
    - name: twitter:image
      content: "https://skepvox.com/og-skepvox.png"
  - - meta
    - name: twitter:image:alt
      content: "Skepvox — Engenharia de Letras"
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": "https://skepvox.com/#organization",
            "name": "Skepvox",
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
            "name": "Skepvox",
            "alternateName": "Engenharia de Letras",
            "description": "Skepvox reúne as obras de Louis Lavelle, literatura clássica e materiais do ENEM — leitura, filosofia e estudo em um único lugar.",
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
                "url": "https://skepvox.com/louis-lavelle/"
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
                "name": "ENEM",
                "url": "https://skepvox.com/enem/"
              }
            ]
          },
          {
            "@type": "CollectionPage",
            "@id": "https://skepvox.com/#webpage",
            "url": "https://skepvox.com/",
            "name": "Skepvox — Engenharia de Letras",
            "description": "Skepvox reúne as obras de Louis Lavelle, literatura clássica e materiais do ENEM — leitura, filosofia e estudo em um único lugar.",
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
                "url": "https://skepvox.com/louis-lavelle/"
              },
              {
                "@type": "Thing",
                "name": "Literatura",
                "url": "https://skepvox.com/literatura/"
              },
              {
                "@type": "Thing",
                "name": "ENEM",
                "url": "https://skepvox.com/enem/"
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
