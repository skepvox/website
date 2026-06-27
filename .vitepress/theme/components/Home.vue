<script setup lang="ts">
import SkLink from './SkLink.vue'
import { PILLARS } from './pillars'
import { literaturaFeaturedWork } from './literatura-cards'
import { filosofiaFeaturedWork } from './filosofia-cards'
import type { FeaturedWork } from './cards'

// Each reading pillar surfaces its current published pipeline work as ONE quiet line (title + count),
// read through the allow-listed card helpers — Home.vue never imports the pipeline-export JSON itself.
// Keyed by pillar; a pillar with no featured work (Vox Français) shows no preview yet (its episode
// preview is a later slice, H4).
const featured: Record<string, FeaturedWork | null> = {
  literatura: literaturaFeaturedWork(),
  filosofia: filosofiaFeaturedWork()
}
</script>

<template>
  <div class="home-index">
    <header class="home-masthead">
      <h1 class="home-masthead__mark">skepvox</h1>
      <p class="home-masthead__subline">Leituras e estudos pessoais, reunidos em três seções.</p>
    </header>

    <nav class="home-pillars" aria-label="Seções">
      <!-- The three visible pillars are the single IA in pillars.ts, shared with the global nav so the
           two cannot drift. A calm hairline table-of-contents: one SkLink row per pillar — label +
           arrow, blurb, and (for the reading pillars) one quiet live line naming the current published
           work. The live line is plain text, never an extra link; Vox Français has none yet (H4). -->
      <SkLink v-for="pillar in PILLARS" :key="pillar.key" class="pillar" :href="pillar.href">
        <h2 class="pillar__label">{{ pillar.label }}</h2>
        <span class="pillar__go" aria-hidden="true">→</span>
        <p class="pillar__blurb">{{ pillar.blurb }}</p>
        <p v-if="featured[pillar.key]" class="pillar__live">
          <span class="pillar__live-title">{{ featured[pillar.key]?.title }}</span>
          <span class="pillar__live-sep" aria-hidden="true"> · </span>
          <span class="pillar__live-meta">{{ featured[pillar.key]?.meta }}</span>
        </p>
      </SkLink>
    </nav>
  </div>
</template>

<style scoped>
/* A6 — the homepage is a calm editorial index into the three site pillars (Literatura / Filosofia /
   Vox Français), not a marketing hero. A quiet left-aligned masthead (wordmark -> subline) sits over
   a hairline table-of-contents; tokens only, no cards, no shadows. The single ink-blue accent is
   confined to the wordmark + pointer interaction. */
.home-index {
  max-width: var(--sk-measure-lede);
  margin: 0 auto;
  padding: clamp(2.5rem, 8vh, 5rem) var(--sk-space-5) var(--sk-space-7);
}

.home-masthead {
  margin-bottom: var(--sk-space-7);
}

.home-masthead__mark {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: var(--sk-masthead); /* clamp(1.85rem, 4vw, 2.25rem) — never the old 76px */
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.12;
  color: var(--sk-accent); /* the single static use of the structural accent */
}

.home-masthead__subline {
  max-width: var(--sk-measure-lede);
  margin: var(--sk-space-3) 0 0;
  font-size: var(--sk-text-md);
  line-height: 1.6;
  color: var(--sk-text-body);
}

/* Pillars — a hairline-framed table of contents, identical structure on desktop + mobile. */
.home-pillars {
  border-top: 1px solid var(--vt-c-divider);
}

.pillar {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: var(--sk-space-4);
  row-gap: var(--sk-space-2);
  align-items: start;
  padding: var(--sk-space-5) 0;
  border-bottom: 1px solid var(--vt-c-divider);
  text-decoration: none;
  color: inherit;
  /* SkLink rounds its focus ring to the row's corner radius. */
  --sk-link-focus-radius: var(--sk-radius-sm);
}

.pillar__label {
  grid-column: 1;
  grid-row: 1;
  margin: 0;
  padding: 0;
  border: 0; /* beat the theme h2 rule (border-top / margin) */
  font-size: var(--sk-text-xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vt-c-text-1);
  transition: color var(--sk-motion-base) var(--sk-ease);
}

.pillar__go {
  grid-column: 2;
  grid-row: 1;
  font-size: var(--sk-text-lg);
  line-height: 1.3; /* sits on the title's optical row */
  color: var(--sk-text-faint);
  transition:
    color var(--sk-motion-base) var(--sk-ease),
    transform var(--sk-motion-base) var(--sk-ease);
}

.pillar__blurb {
  grid-column: 1 / -1;
  grid-row: 2;
  margin: 0;
  font-size: var(--sk-text-sm);
  line-height: 1.5;
  color: var(--sk-text-muted);
}

/* Live proof-of-life: one quiet line naming the section's current published work (title + count),
   sitting below the blurb as the third grid row. Subordinate to the label and blurb (smaller, muted),
   never an accent or a link. Informational text stays on the AA-capable muted ink; only the decorative
   middot is faint. */
.pillar__live {
  grid-column: 1 / -1;
  grid-row: 3;
  margin: 0;
  font-size: var(--sk-text-xs);
  line-height: 1.5;
  color: var(--sk-text-muted);
}

.pillar__live-sep {
  color: var(--sk-text-faint);
}

.pillar__live-meta {
  font-variant-numeric: tabular-nums;
}

/* Hover is pointer-gated per the SkLink touch contract (never sticks on iOS). */
@media (hover: hover) and (pointer: fine) {
  .pillar:hover .pillar__label {
    color: var(--sk-accent);
  }
  .pillar:hover .pillar__go {
    color: var(--sk-accent);
    transform: translateX(3px);
  }
}

/* Keyboard focus + neutral pressed/touch states are owned by SkLink.vue. */

/* Reduced-motion: zero the arrow nudge. Nested inside the pointer query so no :hover rule is
   ever ungated (the nav interaction-state standard — hover only under hover+fine). */
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
  .pillar:hover .pillar__go {
    transform: none;
  }
}

/* Mobile — one breakpoint; the 1fr/auto grid is intrinsically responsive, so only padding relaxes. */
@media (max-width: 576px) {
  .home-index {
    padding: var(--sk-space-6) var(--sk-space-4) var(--sk-space-6);
  }
  .home-masthead {
    margin-bottom: var(--sk-space-6);
  }
  .pillar {
    padding: var(--sk-space-4) 0;
  }
}
</style>
