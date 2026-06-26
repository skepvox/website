---
title: Literatura
description: 'Literatura em português, reunida em um formato simples de leitura por capítulos.'
footer: false
buffer: true
search: false
head:
  - - meta
    - name: robots
      content: noindex
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import { literaturaAuthorCardsPt } from '@theme/components/authors'
</script>

# Literatura

Literatura em português, reunida em um formato simples de leitura por capítulos.

## Autores

<CardGrid :items="literaturaAuthorCardsPt" />
