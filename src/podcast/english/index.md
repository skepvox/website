---
title: 'Vox English'
description: 'Vox English, a skepvox series by Thiago Oliveira, with practical dialogues, explanations, learning guides and transcripts.'
outline: 2
head:
  - - link
    - rel: alternate
      type: application/rss+xml
      title: 'Vox English'
      href: 'https://www.skepvox.com/podcast/english/feed.xml'
  - - link
    - rel: canonical
      href: 'https://www.skepvox.com/podcast/english/'
  - - meta
    - name: description
      content: 'Vox English, a skepvox series by Thiago Oliveira, with practical dialogues, explanations, learning guides and transcripts.'
  - - meta
    - name: keywords
      content: 'Vox English, skepvox, English learning, practical English, English conversation, podcast English, transcript English'
  - - meta
    - property: og:title
      content: 'Vox English'
  - - meta
    - property: og:description
      content: 'Practical dialogues, explanations and learning guides for English learners with Vox English.'
  - - meta
    - property: og:url
      content: 'https://www.skepvox.com/podcast/english/'
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: 'skepvox'
  - - meta
    - property: og:locale
      content: en_US
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
    - name: twitter:title
      content: 'Vox English'
  - - meta
    - name: twitter:description
      content: 'Practical dialogues, explanations and learning guides for English learners with Vox English.'
  - - meta
    - name: twitter:image
      content: 'https://media.skepvox.com/podcast/english/artwork/show-cover-v3.jpg'
  - - meta
    - name: twitter:image:alt
      content: 'Vox English cover art'
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": "https://www.skepvox.com/podcast/english/#webpage",
        "url": "https://www.skepvox.com/podcast/english/",
        "name": "Vox English",
        "description": "Vox English, a skepvox series by Thiago Oliveira, with practical dialogues, explanations, learning guides and transcripts.",
        "image": {
          "@type": "ImageObject",
          "url": "https://media.skepvox.com/podcast/english/artwork/show-cover-v3.jpg",
          "width": 3000,
          "height": 3000
        },
        "isPartOf": {
          "@id": "https://www.skepvox.com/#website"
        },
        "publisher": {
          "@id": "https://www.skepvox.com/#organization"
        },
        "inLanguage": "en-US"
      }
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import { episodesToCards } from '@theme/components/episodes'
import episodes from './episodes.json'
</script>

# Vox English

Vox English is a skepvox series by Thiago Oliveira for practical English learning. Each lesson uses a small everyday scene, a two-speed dialogue, a guided explanation and a learning guide.

The pages in this section collect transcripts, vocabulary and notes for listening again with the text open.

**RSS feed:** <https://www.skepvox.com/podcast/english/feed.xml>

**Apple Podcasts:** <https://podcasts.apple.com/us/podcast/vox-english/id1894879280>

**Amazon Music:** <https://music.amazon.com/podcasts/b1200000-5b01-44b8-a2a1-d47955fd7687/vox-english>

## Lessons

<CardGrid :items="episodesToCards(episodes)" />
