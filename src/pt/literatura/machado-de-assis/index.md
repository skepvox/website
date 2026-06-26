---
title: "Literatura — Machado de Assis"
description: "Machado de Assis (1839–1908), escritor brasileiro, mestre do realismo."
outline: 2
footer: false
buffer: true
search: false
head:
  - - meta
    - name: robots
      content: noindex
  - - meta
    - name: description
      content: "Machado de Assis (1839–1908), escritor brasileiro, mestre do realismo."
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import { literaturaWorkCards } from '@theme/components/literatura-cards'

// Work cards sourced from pipeline-export metadata (route + title), never from a works.json.
const works = literaturaWorkCards('machado-de-assis')
</script>

# Machado de Assis

<img
  src="/images/authors/machado-de-assis.webp"
  alt="Retrato de Machado de Assis"
  class="author-portrait"
/>

1839–1908 †

## Obras

<CardGrid :items="works" />
