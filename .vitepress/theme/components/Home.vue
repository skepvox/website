<script setup lang="ts">
import SkLink from './SkLink.vue'
import BrandMark from './BrandMark.vue'
import { PILLARS } from './pillars'
import { literaturaFeaturedWork } from './literatura-cards'
import { filosofiaFeaturedWork } from './filosofia-cards'
import { voxFrancaisFeaturedEpisode } from './podcast-featured'
import type { FeaturedWork } from './cards'
import type { BrandMarkName } from './brand-marks'

const featured: Record<string, FeaturedWork | null> = {
  literatura: literaturaFeaturedWork(),
  filosofia: filosofiaFeaturedWork(),
  'vox-francais': voxFrancaisFeaturedEpisode()
}
</script>

<template>
  <div class="home-index">
    <header class="home-masthead">
      <h1 class="home-masthead__mark">skepvox</h1>
      <p class="home-masthead__subline">Leituras e estudos pessoais, reunidos em três seções.</p>
    </header>

    <nav class="home-pillars" aria-label="Seções">
      <SkLink
        v-for="pillar in PILLARS"
        :key="pillar.key"
        :class="['pillar', `pillar--${pillar.key}`]"
        :href="pillar.href"
      >
        <span class="pillar__node">
          <BrandMark class="pillar__mark" :name="pillar.key as BrandMarkName" />
        </span>
        <div class="pillar__body">
          <h2 class="pillar__label">{{ pillar.label }}</h2>
          <p class="pillar__blurb">{{ pillar.blurb }}</p>
          <p v-if="featured[pillar.key]" class="pillar__live">
            <span class="pillar__live-meta">{{ featured[pillar.key]?.meta }}</span>
            <span class="pillar__live-sep" aria-hidden="true"> · </span>
            <span class="pillar__live-title">{{ featured[pillar.key]?.title }}</span>
          </p>
        </div>
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
  padding-inline-start: var(--sk-space-3);
}

.pillar {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: var(--sk-space-4);
  align-items: start;
  padding: var(--sk-space-5) var(--sk-space-3);
  border-radius: var(--sk-radius-md);
  text-decoration: none;
  color: inherit;
  transition: background-color var(--sk-motion-base) var(--sk-ease);
  --sk-link-focus-radius: var(--sk-radius-md);
  --pillar-tint: var(--sk-text-muted);
}

.pillar--literatura {
  --pillar-tint: var(--sk-pillar-literatura);
}
.pillar--filosofia {
  --pillar-tint: var(--sk-pillar-filosofia);
}
.pillar--vox-francais {
  --pillar-tint: var(--sk-pillar-vox-francais);
}

.pillar::before {
  content: '';
  position: absolute;
  inset-inline-start: calc(-1 * var(--sk-space-3) - 1px);
  top: var(--sk-space-5);
  width: 2px;
  height: 1.7rem;
  border-radius: 2px;
  background: var(--pillar-tint);
}

.pillar__node {
  grid-column: 1;
  display: inline-flex;
  margin-top: 0.15rem;
}

.pillar__mark {
  font-size: 1.55rem;
  color: var(--pillar-tint);
  transition: color var(--sk-motion-base) var(--sk-ease);
}

.pillar__body {
  grid-column: 2;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--sk-space-2);
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
  margin: 0;
  font-size: var(--sk-text-sm);
  line-height: 1.5;
  color: var(--sk-text-muted);
}

.pillar__live {
  margin: 0;
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

.pillar:active {
  background: var(--sk-cue-hover);
}

@media (hover: hover) and (pointer: fine) {
  .pillar:hover {
    background: var(--sk-cue-hover);
  }
  .pillar:hover .pillar__mark,
  .pillar:hover .pillar__label {
    color: var(--sk-accent);
  }
}

@media (max-width: 576px) {
  .home-index {
    padding: var(--sk-space-6) var(--sk-space-4);
  }
  .pillar {
    padding: var(--sk-space-4) var(--sk-space-3);
  }
  .pillar::before {
    top: var(--sk-space-4);
  }
}
</style>
