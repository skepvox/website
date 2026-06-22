---
title: 'Vox Français'
description: 'Vox Français, un podcast que j’ai créé pour garder le contact avec le français, avec de courtes scènes, des dialogues, des explications et des transcriptions.'
outline: 2
footer: false
head:
  - - link
    - rel: alternate
      type: application/rss+xml
      title: 'Vox Français'
      href: 'https://www.skepvox.com/podcast/francais/feed.xml'
  - - link
    - rel: canonical
      href: 'https://www.skepvox.com/podcast/francais/'
  - - meta
    - name: description
      content: 'Vox Français, un podcast que j’ai créé pour garder le contact avec le français, avec de courtes scènes, des dialogues, des explications et des transcriptions.'
  - - meta
    - name: keywords
      content: 'Vox Français, Podcast de français langue étrangère, skepvox, français langue étrangère, FLE, apprendre le français, podcast français, dialogue français, transcription français'
  - - meta
    - property: og:title
      content: 'Vox Français'
  - - meta
    - property: og:description
      content: 'Un podcast que j’ai créé pour garder le contact avec le français, avec des scènes courtes, des dialogues et des transcriptions.'
  - - meta
    - property: og:url
      content: 'https://www.skepvox.com/podcast/francais/'
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: 'skepvox'
  - - meta
    - property: og:locale
      content: fr_FR
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
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: 'Vox Français'
  - - meta
    - name: twitter:description
      content: 'Un podcast que j’ai créé pour garder le contact avec le français, avec des scènes courtes, des dialogues et des transcriptions.'
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
        "@id": "https://www.skepvox.com/podcast/francais/#webpage",
        "url": "https://www.skepvox.com/podcast/francais/",
        "name": "Vox Français",
        "description": "Vox Français, un podcast que j’ai créé pour garder le contact avec le français, avec de courtes scènes, des dialogues, des explications et des transcriptions.",
        "image": {
          "@type": "ImageObject",
          "url": "https://media.skepvox.com/podcast/francais/artwork/show-cover-v3.jpg",
          "width": 3000,
          "height": 3000
        },
        "isPartOf": {
          "@id": "https://www.skepvox.com/#website"
        },
        "publisher": {
          "@id": "https://www.skepvox.com/#organization"
        },
        "inLanguage": "fr-FR"
      }
---

<script setup>
import PodcastShowHeader from '@theme/components/PodcastShowHeader.vue'
import CardGrid from '@theme/components/CardGrid.vue'
import { episodesToCards } from '@theme/components/episodes'
import episodes from './episodes.json'
</script>

<PodcastShowHeader
  lang="fr"
  eyebrow="Podcast"
  standfirst="J’ai créé Vox Français pour garder le contact avec le français. Le format est simple et m’aide à revenir régulièrement à la langue : une scène courte, un dialogue à deux vitesses, une explication et la transcription."
  :count="episodes.length"
  apple="https://podcasts.apple.com/us/podcast/vox-français/id1894698848"
  spotify="https://open.spotify.com/show/1tmAKW7h6tOwuTouAhtYzk"
/>

## Leçons

<CardGrid :items="episodesToCards(episodes)" />
