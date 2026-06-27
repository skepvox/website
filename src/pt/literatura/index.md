---
title: Literatura
description: "Literatura"
footer: false
head:
  - - link
    - rel: canonical
      href: "https://skepvox.com/pt/literatura/"
  - - meta
    - property: og:title
      content: "Literatura"
  - - meta
    - property: og:description
      content: "Literatura"
  - - meta
    - property: og:url
      content: "https://skepvox.com/pt/literatura/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:locale
      content: pt_BR
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import { literaturaAuthorCardsPt } from '@theme/components/authors'
</script>

# Literatura

<CardGrid :items="literaturaAuthorCardsPt" />
