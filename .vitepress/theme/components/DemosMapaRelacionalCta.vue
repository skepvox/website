<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <div class="demos-map-relational-cta">
    <a class="demos-map-relational-cta__link" :href="withBase('/demos/mapa')">Mapa Relacional</a>
  </div>
</template>

<style scoped>
.demos-map-relational-cta {
  margin: 16px 0 28px;
}

.demos-map-relational-cta__link {
  font-size: 16px;
  display: inline-block;
  padding: 8px 18px;
  font-weight: 500;
  border-radius: 8px;
  text-decoration: none;
  color: var(--vt-c-text-code);
  background: linear-gradient(var(--vt-c-bg-mute), var(--vt-c-bg-mute)) padding-box,
    linear-gradient(45deg, #42d392, #647eff) border-box;
  border: 2px solid transparent;
  transition: background-color 0.5s, color 0.5s;
}

.demos-map-relational-cta__link:hover {
  background: linear-gradient(var(--vt-c-gray-light-4), var(--vt-c-gray-light-4)) padding-box,
    linear-gradient(45deg, #42d392, #647eff) border-box;
}

.dark .demos-map-relational-cta__link:hover {
  background: linear-gradient(var(--vt-c-gray-dark-3), var(--vt-c-gray-dark-3)) padding-box,
    linear-gradient(45deg, #42d392, #647eff) border-box;
}
</style>

