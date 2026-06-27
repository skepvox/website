---
title: Filosofia
description: "Filosofia"
footer: false
head:
  - - link
    - rel: canonical
      href: "https://skepvox.com/pt/filosofia/"
  - - meta
    - property: og:title
      content: "Filosofia"
  - - meta
    - property: og:description
      content: "Filosofia"
  - - meta
    - property: og:url
      content: "https://skepvox.com/pt/filosofia/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:locale
      content: pt_BR
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import { philosophyAuthorCards } from '@theme/components/authors'
</script>

# Filosofia

<CardGrid :items="philosophyAuthorCards" />
