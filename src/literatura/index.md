---
title: Literatura
description: 'Obras clássicas em domínio público, reunidas em um formato simples de leitura.'
---

<script setup>
import CardGrid from '@theme/components/CardGrid.vue'
import { literatureAuthorCards } from '@theme/components/authors'
</script>

# Literatura

Obras clássicas em domínio público, reunidas em um formato simples de leitura.

## Autores

<CardGrid :items="literatureAuthorCards" />
