---
page: true
title: skepvox — Leituras e Estudos Pessoais
description: "Leituras e estudos pessoais, reunidos em três seções."
head:
  - - link
    - rel: canonical
      href: "https://skepvox.com/"
  - - meta
    - name: description
      content: "Leituras e estudos pessoais, reunidos em três seções."
  - - meta
    - name: keywords
      content: "skepvox, literatura, filosofia, podcasts, obras clássicas, biblioteca digital"
  - - meta
    - name: robots
      content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  - - meta
    - property: og:title
      content: "skepvox — Leituras e Estudos Pessoais"
  - - meta
    - property: og:description
      content: "Leituras e estudos pessoais, reunidos em três seções."
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
      content: "skepvox — Leituras e Estudos Pessoais"
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "skepvox — Leituras e Estudos Pessoais"
  - - meta
    - name: twitter:description
      content: "Leituras e estudos pessoais, reunidos em três seções."
  - - meta
    - name: twitter:image
      content: "https://skepvox.com/og-skepvox.png"
  - - meta
    - name: twitter:image:alt
      content: "skepvox — Leituras e Estudos Pessoais"
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
            "alternateName": "Leituras e Estudos Pessoais",
            "description": "Leituras e estudos pessoais, reunidos em três seções.",
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
                "name": "Literatura",
                "url": "https://skepvox.com/pt/literatura/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Filosofia",
                "url": "https://skepvox.com/pt/filosofia/"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Vox Français",
                "url": "https://skepvox.com/podcast/francais/"
              }
            ]
          },
          {
            "@type": "CollectionPage",
            "@id": "https://skepvox.com/#webpage",
            "url": "https://skepvox.com/",
            "name": "skepvox — Leituras e Estudos Pessoais",
            "description": "Leituras e estudos pessoais, reunidos em três seções.",
            "isPartOf": {
              "@id": "https://skepvox.com/#website"
            },
            "primaryImageOfPage": {
              "@type": "ImageObject",
              "url": "https://skepvox.com/og-skepvox.png"
            },
            "about": [
              {
                "@type": "Thing",
                "name": "Literatura",
                "url": "https://skepvox.com/pt/literatura/"
              },
              {
                "@type": "Thing",
                "name": "Filosofia",
                "url": "https://skepvox.com/pt/filosofia/"
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
