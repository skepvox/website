<script setup lang="ts">
import SkLink from './SkLink.vue'
import { PILLARS } from './pillars'
import { literaturaFeaturedWork } from './literatura-cards'
import { filosofiaFeaturedWork } from './filosofia-cards'
import { voxFrancaisFeaturedEpisode } from './podcast-featured'
import type { FeaturedWork } from './cards'

const featured: Record<string, FeaturedWork | null> = {
  literatura: literaturaFeaturedWork(),
  filosofia: filosofiaFeaturedWork(),
  'vox-francais': voxFrancaisFeaturedEpisode()
}
</script>

<template>
  <div class="home-index">
    <header class="home-masthead">
      <span class="home-masthead__colophon" aria-hidden="true"></span>
      <h1 class="home-masthead__mark">skepvox</h1>
      <p class="home-masthead__subline">Leituras e estudos pessoais, reunidos em três seções.</p>
    </header>

    <nav class="home-pillars" aria-label="Seções">
      <SkLink v-for="pillar in PILLARS" :key="pillar.key" class="pillar" :href="pillar.href">
        <h2 class="pillar__label">{{ pillar.label }}</h2>
        <p class="pillar__blurb">{{ pillar.blurb }}</p>
        <p v-if="featured[pillar.key]" class="pillar__live">
          <span class="pillar__live-meta">{{ featured[pillar.key]?.meta }}</span>
          <span class="pillar__live-sep" aria-hidden="true"> · </span>
          <span class="pillar__live-title">{{ featured[pillar.key]?.title }}</span>
        </p>
      </SkLink>
    </nav>
  </div>
</template>

<style scoped>
.home-index {
  max-width: var(--sk-measure-lede);
  margin: 0 auto;
  padding: clamp(2.5rem, 7vh, 4.5rem) var(--sk-space-5) var(--sk-space-7);
}

.home-masthead {
  margin: 0 0 var(--sk-space-7);
}

.home-masthead__colophon {
  display: block;
  width: 46px;
  height: 46px;
  margin-bottom: var(--sk-space-4);
  background-color: var(--sk-brand-mark);
  -webkit-mask: url(/logo.svg) center / contain no-repeat;
  mask: url(/logo.svg) center / contain no-repeat;
}

.home-masthead__mark {
  margin: 0;
  padding: 0;
  border: 0;
  font-family: var(--sk-reading-title-font);
  font-size: var(--sk-masthead);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.1;
  color: var(--sk-text);
}

.home-masthead__subline {
  max-width: var(--sk-measure-lede);
  margin: var(--sk-space-3) 0 0;
  font-size: var(--sk-text-md);
  line-height: 1.6;
  color: var(--sk-text-body);
}

.home-pillars {
  border-inline-start: 1px solid var(--sk-spine);
  padding-inline-start: var(--sk-space-5);
}

.pillar {
  display: block;
  position: relative;
  padding: var(--sk-space-5) 0;
  text-decoration: none;
  color: inherit;
  --sk-link-focus-radius: var(--sk-radius-sm);
}

.pillar::before {
  content: '';
  position: absolute;
  left: calc(-1 * var(--sk-space-5) - 1px);
  top: var(--sk-space-5);
  width: 2px;
  height: 1.45rem;
  background: var(--sk-spine-tick);
  transform: scaleY(0);
  transform-origin: top;
  opacity: 0;
  transition:
    transform var(--sk-motion-base) var(--sk-ease),
    opacity var(--sk-motion-base) var(--sk-ease);
}

.pillar__label {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: var(--sk-text-xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vt-c-text-1);
  transition: color var(--sk-motion-base) var(--sk-ease);
}

.pillar__blurb {
  margin: var(--sk-space-2) 0 0;
  font-size: var(--sk-text-sm);
  line-height: 1.5;
  color: var(--sk-text-muted);
}

.pillar__live {
  margin: var(--sk-space-2) 0 0;
  font-size: var(--sk-reading-kicker);
  line-height: 1.5;
  color: var(--sk-text-muted);
}

.pillar__live-sep {
  color: var(--sk-text-faint);
}

.pillar__live-meta {
  font-variant-numeric: tabular-nums;
}

@media (hover: hover) and (pointer: fine) {
  .pillar:hover::before {
    transform: scaleY(1);
    opacity: 1;
  }
  .pillar:hover .pillar__label {
    color: var(--sk-accent);
  }
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
  .pillar::before {
    transition: none;
  }
}

@media (max-width: 576px) {
  .home-index {
    padding: var(--sk-space-6) var(--sk-space-4);
  }
  .pillar {
    padding: var(--sk-space-4) 0;
  }
}
</style>
