<script setup lang="ts">
import type { EnemQuestionTableAsset } from '../../../enem/types'

const props = defineProps<{
  asset: EnemQuestionTableAsset
}>()
</script>

<template>
  <div class="enem-question-card__asset enem-question-card__asset--table">
    <table class="enem-question-card__table">
      <thead>
        <tr>
          <th v-for="header in props.asset.headers" :key="header" scope="col">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in props.asset.rows" :key="rowIndex">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex">
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
