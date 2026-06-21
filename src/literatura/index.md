---
title: Literatura
description: 'Biblioteca digital de obras clássicas, especialmente brasileiras.'
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import { literatureAuthorCards } from '@theme/components/authors'
</script>

# Literatura

Biblioteca digital de obras clássicas, especialmente brasileiras.

## Autores

<CardGrid :items="literatureAuthorCards" />
